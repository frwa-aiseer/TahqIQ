import type { ContradictionComparisonReason, EvidenceContradictionGroup, EvidenceRecord } from "../types";
import { calculateSha256 } from "./datasetIngestion";

export interface ContradictionGroupCandidate {
  topic: string;
  supportingEvidenceIds: string[];
  contradictoryEvidenceIds: string[];
  contextualReasons: ContradictionComparisonReason[];
  methodologicalReasons: ContradictionComparisonReason[];
  uncertainty: ContradictionComparisonReason;
}

export interface ContradictionDetectionInput {
  projectId: string;
  researchQuestion: string;
  evidenceRecords: EvidenceRecord[];
}

export interface ContradictionDetectionOptions {
  detectorId: string;
  propose: (input: ContradictionDetectionInput) => Promise<unknown>;
  now?: () => string;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}

function safeText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 10_000) throw new Error(`${label} requires bounded text.`);
  const text = value.trim();
  if (/\bwrong\b/i.test(text) || /\b(?:study|evidence|source|paper|article)\s+(?:is|was|are|were)\s+(?:false|incorrect|invalid)\b/i.test(text)) {
    throw new Error(`${label} must describe evidence differences without declaring a study wrong.`);
  }
  return text;
}

function evidenceIds(value: unknown, allowed: Set<string>, label: string): string[] {
  if (!Array.isArray(value) || !value.length || value.length > 500 || value.some((id) => typeof id !== "string" || !allowed.has(id))) throw new Error(`${label} requires supplied researcher-verified evidence IDs.`);
  return [...new Set(value as string[])];
}

function reason(value: unknown, allowed: Set<string>, label: string): ContradictionComparisonReason {
  if (!object(value) || !hasOnlyKeys(value, ["text", "evidenceIds"])) throw new Error(`${label} must match the comparison-reason schema.`);
  return { text: safeText(value.text, label), evidenceIds: evidenceIds(value.evidenceIds, allowed, `${label} evidenceIds`) };
}

function validateGroup(value: unknown, allowed: Set<string>, index: number): ContradictionGroupCandidate {
  const label = `Contradiction group ${index + 1}`;
  const keys = ["topic", "supportingEvidenceIds", "contradictoryEvidenceIds", "contextualReasons", "methodologicalReasons", "uncertainty"];
  if (!object(value) || !hasOnlyKeys(value, keys)) throw new Error(`${label} does not match the structured contract.`);
  const supportingEvidenceIds = evidenceIds(value.supportingEvidenceIds, allowed, `${label} supportingEvidenceIds`);
  const contradictoryEvidenceIds = evidenceIds(value.contradictoryEvidenceIds, allowed, `${label} contradictoryEvidenceIds`);
  if (supportingEvidenceIds.some((id) => contradictoryEvidenceIds.includes(id))) throw new Error(`${label} cannot label one record as both supporting and contradictory.`);
  const parseReasons = (raw: unknown, reasonLabel: string) => {
    if (!Array.isArray(raw) || raw.length > 100) throw new Error(`${reasonLabel} must be a bounded array.`);
    return raw.map((item, reasonIndex) => reason(item, allowed, `${reasonLabel} ${reasonIndex + 1}`));
  };
  return {
    topic: safeText(value.topic, `${label} topic`),
    supportingEvidenceIds,
    contradictoryEvidenceIds,
    contextualReasons: parseReasons(value.contextualReasons, `${label} contextual reason`),
    methodologicalReasons: parseReasons(value.methodologicalReasons, `${label} methodological reason`),
    uncertainty: reason(value.uncertainty, allowed, `${label} uncertainty`),
  };
}

export function validateContradictionCandidates(value: unknown, evidenceRecords: EvidenceRecord[]): ContradictionGroupCandidate[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Contradiction output must be a bounded array of groups.");
  const allowed = new Set(evidenceRecords.map((record) => record.evidenceId));
  if (!allowed.size || allowed.size !== evidenceRecords.length) throw new Error("Supplied evidence must be non-empty and uniquely identified.");
  return value.map((group, index) => validateGroup(group, allowed, index));
}

function validateInput(input: ContradictionDetectionInput): void {
  if (!input.projectId.trim() || !input.researchQuestion.trim()) throw new Error("Project scope and a research question are required.");
  if (input.evidenceRecords.length < 2 || input.evidenceRecords.length > 1_000) throw new Error("Two to 1000 evidence records are required for comparison.");
  const invalid = input.evidenceRecords.filter((record) => record.verification !== "Researcher Verified" || record.researcherReview.status !== "Verified" || !record.researcherReview.reviewedBy?.trim() || !record.researcherReview.reviewedAt?.trim());
  if (invalid.length) throw new Error(`Only attributable researcher-verified EvidenceRecords may be compared: ${invalid.map((record) => record.evidenceId).join(", ")}.`);
}

export async function runContradictionDetectionAgent(
  input: ContradictionDetectionInput,
  options: ContradictionDetectionOptions
): Promise<EvidenceContradictionGroup[]> {
  validateInput(input);
  if (!options.detectorId?.trim() || typeof options.propose !== "function") throw new Error("A configured contradiction detector is required.");
  const candidates = validateContradictionCandidates(await options.propose(input), input.evidenceRecords);
  const createdAt = (options.now || (() => new Date().toISOString()))();
  return Promise.all(candidates.map(async (candidate, index) => ({
    groupId: `contradiction-${(await calculateSha256(`${input.projectId}\n${input.researchQuestion}\n${index}\n${candidate.topic}\n${candidate.supportingEvidenceIds.join("|")}\n${candidate.contradictoryEvidenceIds.join("|")}`)).slice(0, 24)}`,
    projectId: input.projectId,
    ...candidate,
    reviewState: "Needs Researcher Review" as const,
    createdAt,
    detectedBy: options.detectorId.trim(),
  })));
}
