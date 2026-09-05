import type { EvidenceRecord, LiteratureSynthesisItem, LiteratureSynthesisProposal, SynthesisItemClassification } from "../types";
import { calculateSha256 } from "./datasetIngestion";

const COLLECTIONS = ["themes", "methodologicalDifferences", "contextDifferences", "limitations", "unresolvedQuestions", "candidateSynthesisStatements"] as const;
const CLASSIFICATIONS: SynthesisItemClassification[] = ["Evidence-Grounded", "Interpretation", "Hypothesis"];

export interface LiteratureSynthesisCandidateItem {
  text: string;
  classification: SynthesisItemClassification;
  supportingEvidenceIds: string[];
  conflictingEvidenceIds: string[];
}

export type LiteratureSynthesisCandidate = Record<(typeof COLLECTIONS)[number], LiteratureSynthesisCandidateItem[]>;

export interface LiteratureSynthesisAgentInput {
  projectId: string;
  researchQuestion: string;
  evidenceRecords: EvidenceRecord[];
}

export interface LiteratureSynthesisAgentOptions {
  synthesizerId: string;
  propose: (input: LiteratureSynthesisAgentInput) => Promise<unknown>;
  now?: () => string;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}

function uniqueStrings(value: unknown, allowedEvidenceIds: Set<string>, label: string): string[] {
  if (!Array.isArray(value) || value.length > 500 || value.some((item) => typeof item !== "string" || !allowedEvidenceIds.has(item))) {
    throw new Error(`${label} must contain only supplied researcher-verified evidence IDs.`);
  }
  return [...new Set(value as string[])];
}

function validateItem(value: unknown, allowedEvidenceIds: Set<string>, collection: string, index: number): LiteratureSynthesisCandidateItem {
  if (!object(value) || !hasOnlyKeys(value, ["text", "classification", "supportingEvidenceIds", "conflictingEvidenceIds"])) throw new Error(`${collection} item ${index + 1} does not match the synthesis schema.`);
  if (typeof value.text !== "string" || !value.text.trim() || value.text.length > 10_000) throw new Error(`${collection} item ${index + 1} requires bounded text.`);
  if (typeof value.classification !== "string" || !CLASSIFICATIONS.includes(value.classification as SynthesisItemClassification)) throw new Error(`${collection} item ${index + 1} has an invalid classification.`);
  const supportingEvidenceIds = uniqueStrings(value.supportingEvidenceIds, allowedEvidenceIds, `${collection} item ${index + 1} supportingEvidenceIds`);
  const conflictingEvidenceIds = uniqueStrings(value.conflictingEvidenceIds, allowedEvidenceIds, `${collection} item ${index + 1} conflictingEvidenceIds`);
  if (new Set([...supportingEvidenceIds, ...conflictingEvidenceIds]).size !== supportingEvidenceIds.length + conflictingEvidenceIds.length) throw new Error(`${collection} item ${index + 1} cannot label one evidence record as both supporting and conflicting.`);
  if (value.classification === "Evidence-Grounded" && !supportingEvidenceIds.length && !conflictingEvidenceIds.length) throw new Error(`${collection} item ${index + 1} is factual but has no evidence IDs.`);
  return { text: value.text.trim(), classification: value.classification as SynthesisItemClassification, supportingEvidenceIds, conflictingEvidenceIds };
}

export function validateLiteratureSynthesisCandidate(value: unknown, evidenceRecords: EvidenceRecord[]): LiteratureSynthesisCandidate {
  if (!object(value) || !hasOnlyKeys(value, COLLECTIONS)) throw new Error("Literature synthesis output must match the structured contract.");
  const allowedEvidenceIds = new Set(evidenceRecords.map((record) => record.evidenceId));
  if (!allowedEvidenceIds.size || allowedEvidenceIds.size !== evidenceRecords.length) throw new Error("Supplied evidence records must be non-empty and uniquely identified.");
  return Object.fromEntries(COLLECTIONS.map((collection) => {
    const items = value[collection];
    if (!Array.isArray(items) || items.length > 100) throw new Error(`${collection} must be a bounded array.`);
    return [collection, items.map((item, index) => validateItem(item, allowedEvidenceIds, collection, index))];
  })) as LiteratureSynthesisCandidate;
}

function validateInput(input: LiteratureSynthesisAgentInput): void {
  if (!input.projectId.trim() || !input.researchQuestion.trim()) throw new Error("Project scope and a research question are required.");
  if (!input.evidenceRecords.length || input.evidenceRecords.length > 1_000) throw new Error("One to 1000 evidence records are required.");
  const invalid = input.evidenceRecords.filter((record) => record.verification !== "Researcher Verified" || record.researcherReview.status !== "Verified" || !record.researcherReview.reviewedBy?.trim() || !record.researcherReview.reviewedAt?.trim());
  if (invalid.length) throw new Error(`Only attributable researcher-verified EvidenceRecords may enter synthesis: ${invalid.map((record) => record.evidenceId).join(", ")}.`);
}

export async function runLiteratureSynthesisAgent(
  input: LiteratureSynthesisAgentInput,
  options: LiteratureSynthesisAgentOptions
): Promise<LiteratureSynthesisProposal> {
  validateInput(input);
  if (!options.synthesizerId?.trim() || typeof options.propose !== "function") throw new Error("A configured literature synthesizer is required.");
  const candidate = validateLiteratureSynthesisCandidate(await options.propose(input), input.evidenceRecords);
  const createdAt = (options.now || (() => new Date().toISOString()))();
  const withIds = async (collection: (typeof COLLECTIONS)[number]): Promise<LiteratureSynthesisItem[]> => Promise.all(candidate[collection].map(async (item, index) => ({
    itemId: `synthesis-item-${(await calculateSha256(`${input.projectId}\n${input.researchQuestion}\n${collection}\n${index}\n${item.text}\n${[...item.supportingEvidenceIds, ...item.conflictingEvidenceIds].join("|")}`)).slice(0, 24)}`,
    ...item,
  })));
  const collections = await Promise.all(COLLECTIONS.map(async (collection) => [collection, await withIds(collection)] as const));
  const output = Object.fromEntries(collections) as Record<(typeof COLLECTIONS)[number], LiteratureSynthesisItem[]>;
  return {
    synthesisId: `literature-synthesis-${(await calculateSha256(`${input.projectId}\n${input.researchQuestion}\n${input.evidenceRecords.map((record) => record.evidenceId).sort().join("|")}`)).slice(0, 24)}`,
    projectId: input.projectId,
    researchQuestion: input.researchQuestion.trim(),
    ...output,
    sourceEvidenceIds: [...new Set(input.evidenceRecords.map((record) => record.evidenceId))].sort(),
    reviewState: "Needs Researcher Review",
    createdAt,
    synthesizedBy: options.synthesizerId.trim(),
  };
}
