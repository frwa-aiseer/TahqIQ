import type {
  LiteratureSynthesisItem,
  ResearchGap,
  ResearchGapProposal,
  ReviewedEvidenceContradictionGroup,
  ReviewedLiteratureSynthesis,
} from "../types";
import { calculateSha256 } from "./datasetIngestion";

const GAP_TYPES: ResearchGap["type"][] = ["Population", "Geographic", "Methodological", "Theoretical", "Evidence inconsistency", "Temporal", "Data"];
const UNIVERSAL_GAP_PATTERNS = [
  /\bno\s+(?:study|studies|research|evidence|literature|publication|publications)\s+(?:has|have|had)?\s*ever\b/i,
  /\bnever\s+(?:been\s+)?studied\b/i,
  /\bfirst[- ]ever\b/i,
  /\bcompletely\s+unexplored\b/i,
  /\bnothing\s+is\s+known\b/i,
  /\bno\s+(?:study|studies|evidence)\s+exist/i,
];
const SCOPED_LANGUAGE = /\b(?:within|among|based on)\s+(?:the\s+)?(?:reviewed|supplied|included|searched)\s+(?:evidence|records|sources|literature)\b/i;

export interface ResearchGapCandidate {
  gapStatement: string;
  type: ResearchGap["type"];
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  confidence: number;
  caution: string;
  newResearchAddressesIt: string;
}

export interface ResearchGapAgentInput {
  projectId: string;
  reviewedSynthesis: ReviewedLiteratureSynthesis;
  reviewedContradictions: ReviewedEvidenceContradictionGroup[];
  limitations: LiteratureSynthesisItem[];
  context: LiteratureSynthesisItem[];
}

export interface ResearchGapAgentOptions {
  generatorId: string;
  propose: (input: ResearchGapAgentInput) => Promise<unknown>;
  now?: () => string;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}

function boundedSafeText(value: unknown, label: string, requireScope = false): string {
  if (typeof value !== "string" || !value.trim() || value.length > 10_000) throw new Error(`${label} requires bounded text.`);
  const text = value.trim();
  if (UNIVERSAL_GAP_PATTERNS.some((pattern) => pattern.test(text))) throw new Error(`${label} contains an unsupported universal gap claim.`);
  if (requireScope && !SCOPED_LANGUAGE.test(text)) throw new Error(`${label} must scope the claim to reviewed/supplied evidence.`);
  return text;
}

function validateReview(review: { reviewedByUid?: string; reviewedAt?: string; rationale?: string } | undefined, label: string): void {
  if (!review?.reviewedByUid?.trim() || !review.reviewedAt?.trim() || !review.rationale?.trim()) throw new Error(`${label} requires attributable researcher review.`);
}

function validateInput(input: ResearchGapAgentInput): Set<string> {
  if (!input.projectId.trim() || input.reviewedSynthesis.projectId !== input.projectId || input.reviewedSynthesis.reviewState !== "Researcher Reviewed") throw new Error("A project-scoped researcher-reviewed synthesis is required.");
  validateReview(input.reviewedSynthesis.researcherReview, "Synthesis");
  if (!Array.isArray(input.reviewedContradictions) || input.reviewedContradictions.length > 100) throw new Error("Reviewed contradictions must be a bounded array.");
  input.reviewedContradictions.forEach((group) => {
    if (group.projectId !== input.projectId || group.reviewState !== "Researcher Reviewed") throw new Error(`Contradiction ${group.groupId} is not project-scoped and researcher reviewed.`);
    validateReview(group.researcherReview, `Contradiction ${group.groupId}`);
  });
  const synthesisItems = [...input.reviewedSynthesis.limitations, ...input.reviewedSynthesis.contextDifferences];
  const byId = new Map(synthesisItems.map((item) => [item.itemId, item]));
  for (const [label, items] of [["limitations", input.limitations], ["context", input.context]] as const) {
    if (!Array.isArray(items) || items.length > 100 || items.some((item) => !byId.has(item.itemId) || JSON.stringify(byId.get(item.itemId)) !== JSON.stringify(item))) throw new Error(`${label} must contain only unchanged items from the reviewed synthesis.`);
  }
  const allowed = new Set(input.reviewedSynthesis.sourceEvidenceIds);
  input.reviewedContradictions.forEach((group) => [...group.supportingEvidenceIds, ...group.contradictoryEvidenceIds].forEach((id) => allowed.add(id)));
  if (!allowed.size) throw new Error("Reviewed inputs contain no evidence IDs.");
  return allowed;
}

export function validateResearchGapCandidates(value: unknown, allowedEvidenceIds: Set<string>): ResearchGapCandidate[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Research gap output must be a bounded array.");
  const keys = ["gapStatement", "type", "supportingEvidenceIds", "contradictingEvidenceIds", "confidence", "caution", "newResearchAddressesIt"];
  return value.map((raw, index) => {
    const label = `Gap candidate ${index + 1}`;
    if (!object(raw) || !hasOnlyKeys(raw, keys)) throw new Error(`${label} does not match the structured contract.`);
    if (typeof raw.type !== "string" || !GAP_TYPES.includes(raw.type as ResearchGap["type"])) throw new Error(`${label} has an invalid type.`);
    const ids = (field: "supportingEvidenceIds" | "contradictingEvidenceIds", required: boolean) => {
      const valueIds = raw[field];
      if (!Array.isArray(valueIds) || valueIds.length > 500 || (required && !valueIds.length) || valueIds.some((id) => typeof id !== "string" || !allowedEvidenceIds.has(id))) throw new Error(`${label} ${field} must contain supplied reviewed evidence IDs${required ? " and cannot be empty" : ""}.`);
      return [...new Set(valueIds as string[])];
    };
    const supportingEvidenceIds = ids("supportingEvidenceIds", true);
    const contradictingEvidenceIds = ids("contradictingEvidenceIds", false);
    if (supportingEvidenceIds.some((id) => contradictingEvidenceIds.includes(id))) throw new Error(`${label} cannot use one evidence ID as both supporting and contradicting.`);
    if (typeof raw.confidence !== "number" || !Number.isFinite(raw.confidence) || raw.confidence < 0 || raw.confidence > 1) throw new Error(`${label} confidence must be between 0 and 1.`);
    return {
      gapStatement: boundedSafeText(raw.gapStatement, `${label} statement`, true),
      type: raw.type as ResearchGap["type"],
      supportingEvidenceIds,
      contradictingEvidenceIds,
      confidence: raw.confidence,
      caution: boundedSafeText(raw.caution, `${label} caution`),
      newResearchAddressesIt: boundedSafeText(raw.newResearchAddressesIt, `${label} proposed research`),
    };
  });
}

export async function runResearchGapAgent(input: ResearchGapAgentInput, options: ResearchGapAgentOptions): Promise<ResearchGapProposal[]> {
  const allowed = validateInput(input);
  if (!options.generatorId?.trim() || typeof options.propose !== "function") throw new Error("A configured research-gap generator is required.");
  const candidates = validateResearchGapCandidates(await options.propose(input), allowed);
  const createdAt = (options.now || (() => new Date().toISOString()))();
  return Promise.all(candidates.map(async (candidate, index) => ({
    gapId: `gap-proposal-${(await calculateSha256(`${input.projectId}\n${input.reviewedSynthesis.synthesisId}\n${index}\n${candidate.gapStatement}\n${candidate.supportingEvidenceIds.join("|")}`)).slice(0, 24)}`,
    projectId: input.projectId,
    ...candidate,
    status: "AI Suggested" as const,
    sourceSynthesisId: input.reviewedSynthesis.synthesisId,
    sourceContradictionGroupIds: input.reviewedContradictions.map((group) => group.groupId),
    createdAt,
    generatedBy: options.generatorId.trim(),
  })));
}
