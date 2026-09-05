import type {
  EvidenceExtractionField,
  EvidenceExtractionProposal,
  EvidenceExtractionRelationship,
  EvidenceRecord,
  FullTextChunk,
} from "../types";
import { calculateSha256 } from "./datasetIngestion";

export interface EvidenceExtractionCandidateField {
  status: "Available" | "Not Available";
  text: string;
  chunkIds: string[];
}

export interface EvidenceExtractionCandidate {
  proposition: string;
  passages: Array<{ chunkId: string; exactPassage: string }>;
  context: EvidenceExtractionCandidateField;
  population: EvidenceExtractionCandidateField;
  method: EvidenceExtractionCandidateField;
  result: EvidenceExtractionCandidateField;
  limitations: EvidenceExtractionCandidateField;
  relationship: EvidenceExtractionRelationship;
  confidence: number;
}

export interface EvidenceExtractionAgentInput {
  projectId: string;
  questionOrClaim: string;
  chunks: FullTextChunk[];
  claimId?: string;
}

export interface EvidenceExtractionAgentOptions {
  extractorId: string;
  propose: (input: EvidenceExtractionAgentInput) => Promise<unknown>;
  now?: () => string;
}

const FIELD_NAMES = ["context", "population", "method", "result", "limitations"] as const;
const CANDIDATE_KEYS = ["proposition", "passages", ...FIELD_NAMES, "relationship", "confidence"];
const MISSING_TEXT = "Not available in supplied chunks.";

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}

function supportedVerbatim(text: string, chunkIds: string[], byId: Map<string, FullTextChunk>): boolean {
  const normalized = text.trim();
  return Boolean(normalized) && chunkIds.some((chunkId) => byId.get(chunkId)?.text.includes(normalized));
}

function validateField(name: string, value: unknown, byId: Map<string, FullTextChunk>): EvidenceExtractionCandidateField {
  if (!object(value) || !hasOnlyKeys(value, ["status", "text", "chunkIds"]) || !Array.isArray(value.chunkIds) || value.chunkIds.some((id) => typeof id !== "string" || !byId.has(id))) {
    throw new Error(`${name} must match the structured evidence-field contract and cite only supplied chunks.`);
  }
  if (value.status === "Not Available") {
    if (value.text !== MISSING_TEXT || value.chunkIds.length) throw new Error(`${name} missing state must remain explicit and must not cite chunks.`);
    return { status: "Not Available", text: MISSING_TEXT, chunkIds: [] };
  }
  if (value.status !== "Available" || typeof value.text !== "string" || !value.chunkIds.length || !supportedVerbatim(value.text, value.chunkIds as string[], byId)) {
    throw new Error(`${name} contains text not supported verbatim by its cited supplied chunks.`);
  }
  return { status: "Available", text: value.text.trim(), chunkIds: [...new Set(value.chunkIds as string[])] };
}

export function validateEvidenceExtractionCandidate(value: unknown, chunks: FullTextChunk[]): EvidenceExtractionCandidate {
  if (!object(value) || !hasOnlyKeys(value, CANDIDATE_KEYS)) throw new Error("Evidence extraction output must match the structured contract.");
  const byId = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
  if (!chunks.length || byId.size !== chunks.length) throw new Error("Supplied chunks must be non-empty and uniquely identified.");
  if (!Array.isArray(value.passages) || !value.passages.length || value.passages.length > 100) throw new Error("At least one bounded exact passage is required.");
  const passages = value.passages.map((passage, index) => {
    if (!object(passage) || !hasOnlyKeys(passage, ["chunkId", "exactPassage"]) || typeof passage.chunkId !== "string" || typeof passage.exactPassage !== "string") throw new Error(`Passage ${index + 1} is malformed.`);
    const chunk = byId.get(passage.chunkId);
    const exactPassage = passage.exactPassage.trim();
    if (!chunk || !exactPassage || !chunk.text.includes(exactPassage)) throw new Error(`Passage ${index + 1} is not an exact passage from its supplied chunk.`);
    return { chunkId: passage.chunkId, exactPassage };
  });
  const passageIds = [...new Set(passages.map((passage) => passage.chunkId))];
  if (typeof value.proposition !== "string" || !supportedVerbatim(value.proposition, passageIds, byId)) throw new Error("Proposition is not supported verbatim by the selected exact passages/chunks.");
  if (!['Supports', 'Contradicts', 'Neutral', 'Unclear'].includes(String(value.relationship))) throw new Error("Evidence relationship is invalid.");
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) throw new Error("Evidence confidence must be between 0 and 1.");
  const fields = Object.fromEntries(FIELD_NAMES.map((name) => [name, validateField(name, value[name], byId)])) as Record<(typeof FIELD_NAMES)[number], EvidenceExtractionField>;
  return { proposition: value.proposition.trim(), passages, ...fields, relationship: value.relationship as EvidenceExtractionRelationship, confidence: value.confidence };
}

function validateInput(input: EvidenceExtractionAgentInput): void {
  if (!input.projectId.trim() || !input.questionOrClaim.trim()) throw new Error("Project scope and a question/claim are required.");
  if (!input.chunks.length || input.chunks.length > 500) throw new Error("One to 500 supplied full-text chunks are required.");
  const first = input.chunks[0];
  if (input.chunks.some((chunk) => chunk.projectId !== input.projectId || chunk.sourceId !== first.sourceId || chunk.documentHash !== first.documentHash || chunk.documentVersion !== first.documentVersion)) {
    throw new Error("All supplied chunks must share project, source, document hash, and document version.");
  }
}

export async function runEvidenceExtractionAgent(
  input: EvidenceExtractionAgentInput,
  options: EvidenceExtractionAgentOptions
): Promise<EvidenceExtractionProposal> {
  validateInput(input);
  if (!options.extractorId?.trim() || typeof options.propose !== "function") throw new Error("A configured evidence extractor is required.");
  const candidate = validateEvidenceExtractionCandidate(await options.propose(input), input.chunks);
  const first = input.chunks[0];
  const createdAt = (options.now || (() => new Date().toISOString()))();
  const passages = candidate.passages.map((passage) => {
    const chunk = input.chunks.find((item) => item.chunkId === passage.chunkId)!;
    return { chunkId: chunk.chunkId, exactPassage: passage.exactPassage, page: chunk.page, section: chunk.section, sourceLocation: chunk.surroundingContext.sourceLocation };
  });
  const evidenceRecords: EvidenceRecord[] = await Promise.all(passages.map(async (passage) => ({
    evidenceId: `evidence-${(await calculateSha256(`${first.sourceId}\n${first.documentHash}\n${passage.chunkId}\n${passage.exactPassage}`)).slice(0, 24)}`,
    sourceId: first.sourceId,
    documentVersion: first.documentVersion,
    documentHash: first.documentHash,
    exactPassage: passage.exactPassage,
    page: passage.page ? String(passage.page) : undefined,
    section: passage.section,
    paragraphOrChunkRef: passage.chunkId,
    extractionMethod: "AI Extracted",
    extractedBy: options.extractorId.trim(),
    confidence: candidate.confidence,
    verification: "Needs Review",
    researcherReview: { status: "Pending" },
    linkedClaimIds: input.claimId?.trim() ? [input.claimId.trim()] : [],
    createdAt,
    updatedAt: createdAt,
    isDemo: first.isDemo,
    isSynthetic: first.isSynthetic,
  })));
  return {
    proposalId: `evidence-proposal-${(await calculateSha256(`${input.projectId}\n${first.documentHash}\n${input.questionOrClaim}\n${passages.map((item) => item.chunkId).join("|")}`)).slice(0, 24)}`,
    projectId: input.projectId,
    sourceId: first.sourceId,
    documentHash: first.documentHash,
    documentVersion: first.documentVersion,
    questionOrClaim: input.questionOrClaim.trim(),
    proposition: candidate.proposition,
    passages,
    context: candidate.context,
    population: candidate.population,
    method: candidate.method,
    result: candidate.result,
    limitations: candidate.limitations,
    relationship: candidate.relationship,
    confidence: candidate.confidence,
    reviewState: "Needs Researcher Review",
    evidenceRecords,
    createdAt,
    extractedBy: options.extractorId.trim(),
    isDemo: first.isDemo,
    isSynthetic: first.isSynthetic,
  };
}

export const unavailableEvidenceField = (): EvidenceExtractionCandidateField => ({ status: "Not Available", text: MISSING_TEXT, chunkIds: [] });
