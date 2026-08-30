export interface ValidationSuccess<T> { valid: true; value: T; errors: [] }
export interface ValidationFailure { valid: false; errors: string[] }
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface AgentRequest {
  agentType: string;
  prompt: string;
  context: Record<string, unknown>;
}

export interface AgentModelOutput {
  summary: string;
  proposals: string[];
  missingInformationFlags: string[];
  evidenceIds: string[];
}

export interface DraftSectionRequest {
  sectionTitle: string;
  canvas: Record<string, unknown>;
  sources: Record<string, unknown>[];
  claims: Record<string, unknown>[];
  analysisOutputs: Record<string, unknown>[];
  targetWordCount: number;
  focusStyle: string;
}

export interface DraftSectionModelOutput {
  title: string;
  content: string;
  citationsUsed: string[];
  evidenceUsed: string[];
  numbersUsed: number[];
  missingInformationFlags: string[];
}

export interface PeerReviewRequest {
  reviewerRole: string;
  sections: Record<string, unknown>[];
  sources: Record<string, unknown>[];
  analysisOutputs: Record<string, unknown>[];
}

export interface PeerReviewCommentOutput {
  agentRole: string;
  severity: string;
  manuscriptSection: string;
  commentText: string;
  suggestedAction: string;
}

export interface PeerReviewModelOutput { comments: PeerReviewCommentOutput[] }

export const METHODOLOGY_KEYS = [
  "design", "populationOrDataSource", "sampling", "eligibility", "interventionExposureComparator",
  "variablesOrOutcomes", "instruments", "dataCollection", "analysisPlan", "ethics", "limitations",
] as const;
export type MethodologyProposalOutput = Record<(typeof METHODOLOGY_KEYS)[number], string>;

export interface MethodologyRequest {
  projectId: string;
  projectContext: Record<string, unknown>;
}

export interface DoiRequest { doi: string }
export interface SearchExecutionRequest {
  searchId?: string;
  projectId: string;
  context: string;
  concepts: Array<{ concept: string; synonyms: string[] }>;
  providers: Array<"Crossref" | "OpenAlex" | "PubMed" | "Europe PMC" | "arXiv" | "DOAJ">;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    publicationTypes?: string[];
    languages?: string[];
    peerReviewedOnly?: boolean;
    maxResultsPerProvider?: number;
  };
}
export interface AnalysisRequest {
  dataset: DatasetRecord;
  plan: AnalysisPlan;
  options: {
    outcomeVariable?: string;
    conditionVariable?: string;
    participantIdVariable?: string;
    periodVariable?: string;
    sequenceVariable?: string;
    alpha?: number;
    isResearcherSuppliedLog?: boolean;
  };
}

function success<T>(value: T): ValidationSuccess<T> { return { valid: true, value, errors: [] }; }
function failure(...errors: string[]): ValidationFailure { return { valid: false, errors }; }
function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function boundedString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.length <= max;
}
function objectArray(value: unknown, max: number): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.length <= max && value.every(object);
}
function stringArray(value: unknown, maxItems: number, maxLength = 500): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => boundedString(item, 1, maxLength));
}
function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

export function validateAgentRequest(value: unknown): ValidationResult<AgentRequest> {
  if (!object(value)) return failure("Request body must be an object.");
  if (!hasOnlyKeys(value, ["agentType", "prompt", "context"])) return failure("Request contains unsupported fields.");
  if (!boundedString(value.agentType, 1, 100)) return failure("agentType must be a bounded non-empty string.");
  if (!boundedString(value.prompt, 1, 20_000)) return failure("prompt must be a bounded non-empty string.");
  if (!object(value.context)) return failure("context must be an object.");
  return success({ agentType: value.agentType.trim(), prompt: value.prompt.trim(), context: value.context });
}

export function validateAgentModelOutput(value: unknown): ValidationResult<AgentModelOutput> {
  if (!object(value) || !hasOnlyKeys(value, ["summary", "proposals", "missingInformationFlags", "evidenceIds"])) {
    return failure("Agent output must match the structured contract.");
  }
  if (!boundedString(value.summary, 1, 20_000) || !stringArray(value.proposals, 50, 5_000) ||
      !stringArray(value.missingInformationFlags, 100, 1_000) || !stringArray(value.evidenceIds, 200, 200)) {
    return failure("Agent output fields are malformed or out of bounds.");
  }
  return success(value as unknown as AgentModelOutput);
}

export function validateDraftSectionRequest(value: unknown): ValidationResult<DraftSectionRequest> {
  const keys = ["sectionTitle", "canvas", "sources", "claims", "analysisOutputs", "targetWordCount", "focusStyle"];
  if (!object(value) || !hasOnlyKeys(value, keys)) return failure("Draft request must match the supported contract.");
  if (!boundedString(value.sectionTitle, 1, 300)) return failure("sectionTitle is required and bounded.");
  if (!object(value.canvas) || !objectArray(value.sources, 2_000) || !objectArray(value.claims, 5_000) || !objectArray(value.analysisOutputs, 1_000)) {
    return failure("Draft evidence collections are malformed or out of bounds.");
  }
  const target = value.targetWordCount ?? 1200;
  const focus = value.focusStyle ?? "General Scholarly Investigation";
  if (!Number.isInteger(target) || (target as number) < 100 || (target as number) > 20_000) return failure("targetWordCount must be an integer from 100 to 20000.");
  if (!boundedString(focus, 1, 200)) return failure("focusStyle must be a bounded string.");
  return success({ sectionTitle: value.sectionTitle.trim(), canvas: value.canvas, sources: value.sources,
    claims: value.claims, analysisOutputs: value.analysisOutputs, targetWordCount: target as number, focusStyle: (focus as string).trim() });
}

export function validateDraftSectionModelOutput(value: unknown): ValidationResult<DraftSectionModelOutput> {
  const keys = ["title", "content", "citationsUsed", "evidenceUsed", "numbersUsed", "missingInformationFlags"];
  if (!object(value) || !hasOnlyKeys(value, keys)) return failure("Draft output must match the structured contract.");
  if (!boundedString(value.title, 1, 300) || !boundedString(value.content, 1, 200_000) ||
      !stringArray(value.citationsUsed, 2_000, 300) || !stringArray(value.evidenceUsed, 2_000, 300) ||
      !Array.isArray(value.numbersUsed) || value.numbersUsed.length > 5_000 || !value.numbersUsed.every((item) => typeof item === "number" && Number.isFinite(item)) ||
      !stringArray(value.missingInformationFlags, 1_000, 1_000)) return failure("Draft output fields are malformed or out of bounds.");
  return success(value as unknown as DraftSectionModelOutput);
}

const REVIEWER_ROLES = ["Methodology Reviewer", "Statistical Reviewer", "Subject-Matter Reviewer", "Journal Editor Reviewer", "Citation Reviewer", "Language Reviewer"];
export function validatePeerReviewRequest(value: unknown): ValidationResult<PeerReviewRequest> {
  if (!object(value) || !hasOnlyKeys(value, ["reviewerRole", "sections", "sources", "analysisOutputs"])) return failure("Peer-review request must match the supported contract.");
  if (typeof value.reviewerRole !== "string" || !REVIEWER_ROLES.includes(value.reviewerRole)) return failure("reviewerRole is unsupported.");
  if (!objectArray(value.sections, 1_000) || !objectArray(value.sources, 2_000) || !objectArray(value.analysisOutputs, 1_000)) return failure("Peer-review collections are malformed or out of bounds.");
  return success(value as unknown as PeerReviewRequest);
}

export function validatePeerReviewModelOutput(value: unknown): ValidationResult<PeerReviewModelOutput> {
  if (!object(value) || !hasOnlyKeys(value, ["comments"]) || !Array.isArray(value.comments) || value.comments.length < 1 || value.comments.length > 2) return failure("Peer-review output must contain one or two comments.");
  const keys = ["agentRole", "severity", "manuscriptSection", "commentText", "suggestedAction"];
  if (!value.comments.every((comment) => object(comment) && hasOnlyKeys(comment, keys) && keys.every((key) => boundedString(comment[key], 1, key === "commentText" ? 5_000 : 1_000)))) {
    return failure("Peer-review comment output is malformed.");
  }
  return success(value as unknown as PeerReviewModelOutput);
}

export function validateMethodologyRequest(value: unknown, expectedProjectId: string): ValidationResult<MethodologyRequest> {
  if (!object(value) || !hasOnlyKeys(value, ["projectId", "projectContext"])) return failure("Methodology request must match the supported contract.");
  if (value.projectId !== expectedProjectId) return failure("Body projectId must match authenticated project scope.");
  if (!object(value.projectContext) || Object.keys(value.projectContext).length > 50) return failure("projectContext must be a bounded object.");
  return success({ projectId: expectedProjectId, projectContext: value.projectContext });
}

export function validateMethodologyModelOutput(value: unknown): ValidationResult<MethodologyProposalOutput> {
  if (!object(value) || !hasOnlyKeys(value, METHODOLOGY_KEYS) || !METHODOLOGY_KEYS.every((key) => boundedString(value[key], 1, 10_000))) {
    return failure("Methodology output must contain every required bounded string field and no unsupported fields.");
  }
  return success(value as unknown as MethodologyProposalOutput);
}

export function validateDoiRequest(value: unknown): ValidationResult<DoiRequest> {
  if (!object(value) || !hasOnlyKeys(value, ["doi"]) || typeof value.doi !== "string") return failure("DOI request must contain only doi.");
  const doi = value.doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  if (doi.length > 300 || !/^10\.\d{4,9}\/\S+$/i.test(doi)) return failure("DOI syntax is invalid.");
  return success({ doi });
}

export function validateSearchExecutionRequest(value: unknown, expectedProjectId: string): ValidationResult<SearchExecutionRequest> {
  if (!object(value) || !hasOnlyKeys(value, ["searchId", "projectId", "context", "concepts", "providers", "filters"])) return failure("Search execution request contains unsupported fields.");
  if (value.projectId !== expectedProjectId) return failure("Body projectId must match authenticated project scope.");
  if (value.searchId !== undefined && !boundedString(value.searchId, 1, 200)) return failure("searchId must be a bounded string.");
  if (!boundedString(value.context, 1, 2_000)) return failure("Search context is required and bounded.");
  if (!Array.isArray(value.concepts) || value.concepts.length < 1 || value.concepts.length > 20 || !value.concepts.every((item) => object(item) && hasOnlyKeys(item, ["concept", "synonyms"]) && boundedString(item.concept, 1, 300) && stringArray(item.synonyms, 30, 300))) return failure("Search concepts and synonyms are malformed or out of bounds.");
  const providers = ["Crossref", "OpenAlex", "PubMed", "Europe PMC", "arXiv", "DOAJ"];
  if (!Array.isArray(value.providers) || value.providers.length < 1 || value.providers.length > providers.length || !value.providers.every((provider) => typeof provider === "string" && providers.includes(provider)) || new Set(value.providers).size !== value.providers.length) return failure("Search providers are missing, duplicated, or unsupported.");
  if (!object(value.filters) || !hasOnlyKeys(value.filters, ["dateFrom", "dateTo", "publicationTypes", "languages", "peerReviewedOnly", "maxResultsPerProvider"])) return failure("Search filters are malformed.");
  const filters = value.filters;
  if (["dateFrom", "dateTo"].some((key) => filters[key] !== undefined && (typeof filters[key] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(filters[key] as string))) ||
      (filters.publicationTypes !== undefined && !stringArray(filters.publicationTypes, 20, 100)) ||
      (filters.languages !== undefined && !stringArray(filters.languages, 20, 100)) ||
      (filters.peerReviewedOnly !== undefined && typeof filters.peerReviewedOnly !== "boolean") ||
      (filters.maxResultsPerProvider !== undefined && (!Number.isInteger(filters.maxResultsPerProvider) || (filters.maxResultsPerProvider as number) < 1 || (filters.maxResultsPerProvider as number) > 100))) return failure("Search filter values are malformed or out of bounds.");
  return success({ searchId: typeof value.searchId === "string" ? value.searchId.trim() : undefined, projectId: expectedProjectId, context: (value.context as string).trim(), concepts: value.concepts as SearchExecutionRequest["concepts"], providers: value.providers as SearchExecutionRequest["providers"], filters: filters as SearchExecutionRequest["filters"] });
}

export function validateLiteratureRetrievalRequest(value: unknown, expectedProjectId: string): ValidationResult<ApprovedSearchPlan> {
  if (!object(value) || !hasOnlyKeys(value, ["plan"]) || !object(value.plan)) return failure("Literature retrieval requires only an approved plan object.");
  const plan = value.plan;
  if (!hasOnlyKeys(plan, ["planId", "projectId", "context", "concepts", "providerSyntax", "providers", "filters", "approval"])) return failure("Approved search plan contains unsupported fields.");
  if (plan.projectId !== expectedProjectId || !boundedString(plan.planId, 1, 200) || !boundedString(plan.context, 1, 2_000)) return failure("Approved search plan identity or project scope is invalid.");
  if (!Array.isArray(plan.concepts) || plan.concepts.length < 1 || plan.concepts.length > 30 || !plan.concepts.every((item) => object(item) && hasOnlyKeys(item, ["concept", "synonyms"]) && boundedString(item.concept, 1, 300) && stringArray(item.synonyms, 50, 300))) return failure("Approved concepts are malformed.");
  const supportedProviders = ["Crossref", "OpenAlex", "PubMed", "Europe PMC", "arXiv", "DOAJ"];
  if (!Array.isArray(plan.providers) || plan.providers.length < 1 || plan.providers.length > supportedProviders.length || !plan.providers.every((provider) => typeof provider === "string" && supportedProviders.includes(provider)) || new Set(plan.providers).size !== plan.providers.length) return failure("Approved providers are missing, duplicated, or unsupported.");
  if (!object(plan.providerSyntax) || !hasOnlyKeys(plan.providerSyntax, supportedProviders) || !plan.providers.every((provider) => boundedString(plan.providerSyntax[provider], 1, 10_000))) return failure("Every approved provider requires bounded exact syntax.");
  if (!object(plan.filters) || !hasOnlyKeys(plan.filters, ["dateFrom", "dateTo", "publicationTypes", "languages", "peerReviewedOnly", "maxResultsPerProvider"])) return failure("Approved search filters are malformed.");
  if (plan.filters.maxResultsPerProvider !== undefined && (!Number.isInteger(plan.filters.maxResultsPerProvider) || (plan.filters.maxResultsPerProvider as number) < 1 || (plan.filters.maxResultsPerProvider as number) > 100)) return failure("Approved provider result limit must be between 1 and 100.");
  if (!object(plan.approval) || !hasOnlyKeys(plan.approval, ["researcherUid", "researcherEmail", "approvedAt", "rationale"]) || !boundedString(plan.approval.researcherUid, 1, 200) || !boundedString(plan.approval.researcherEmail, 3, 500) || !boundedString(plan.approval.approvedAt, 10, 100) || !boundedString(plan.approval.rationale, 5, 2_000)) return failure("Attributable researcher approval is required.");
  return success(plan as unknown as ApprovedSearchPlan);
}

export function validateAnalysisRequest(value: unknown): ValidationResult<AnalysisRequest> {
  if (!object(value) || !hasOnlyKeys(value, ["dataset", "plan", "options"]) || !object(value.dataset) || !object(value.plan)) return failure("Analysis request requires dataset and plan objects only.");
  const dataset = value.dataset;
  const plan = value.plan;
  if (![dataset.id, dataset.filename, dataset.fileHash, dataset.uploadDate].every((item) => boundedString(item, 1, 500)) ||
      ![dataset.recordCount, dataset.variableCount, dataset.missingnessPercent].every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0) ||
      !Array.isArray(dataset.variables) || !Array.isArray(dataset.rawPreview) || typeof dataset.isAnonymizedConfirmed !== "boolean") {
    return failure("Dataset contract is incomplete or malformed.");
  }
  if (![plan.id, plan.title, plan.researchQuestionId, plan.outcomeVariable, plan.statisticalMethod, plan.effectSizeMeasure, plan.missingDataStrategy].every((item) => boundedString(item, 1, 500)) ||
      !stringArray(plan.predictorVariables, 1_000, 500) || !stringArray(plan.assumptions, 1_000, 1_000) ||
      typeof plan.significanceThreshold !== "number" || !Number.isFinite(plan.significanceThreshold) || plan.significanceThreshold <= 0 || plan.significanceThreshold >= 1 ||
      !["Draft", "Approved", "Executed"].includes(plan.status as string) || typeof plan.isPreregistered !== "boolean") {
    return failure("Analysis plan contract is incomplete or malformed.");
  }
  if (value.options !== undefined && !object(value.options)) return failure("Analysis options must be an object.");
  const options = (value.options || {}) as Record<string, unknown>;
  const allowedOptionKeys = ["outcomeVariable", "conditionVariable", "participantIdVariable", "periodVariable", "sequenceVariable", "alpha", "isResearcherSuppliedLog"];
  if (!hasOnlyKeys(options, allowedOptionKeys) ||
      ["outcomeVariable", "conditionVariable", "participantIdVariable", "periodVariable", "sequenceVariable"].some((key) => options[key] !== undefined && !boundedString(options[key], 1, 500)) ||
      (options.alpha !== undefined && (typeof options.alpha !== "number" || !Number.isFinite(options.alpha) || options.alpha <= 0 || options.alpha >= 1)) ||
      (options.isResearcherSuppliedLog !== undefined && typeof options.isResearcherSuppliedLog !== "boolean")) {
    return failure("Analysis options are malformed or unsupported.");
  }
  return success({ dataset: dataset as unknown as DatasetRecord, plan: plan as unknown as AnalysisPlan, options: options as AnalysisRequest["options"] });
}

export function parseAndValidateModelJson<T>(text: string | undefined, validator: (value: unknown) => ValidationResult<T>): ValidationResult<T> {
  if (!text) return failure("Model returned no structured JSON.");
  try { return validator(JSON.parse(text)); }
  catch { return failure("Model returned invalid JSON."); }
}

export function validateExternalAnalysisResponse(value: unknown): ValidationResult<Record<string, unknown>> {
  if (!object(value) || value.status !== "completed" || value.executionStatus !== "Completed" || !object(value.output) ||
      !Array.isArray(value.figures) || !Array.isArray(value.tables) || !boundedString(value.datasetHash, 1, 500) ||
      !boundedString(value.planId, 1, 200) || !boundedString(value.reproducibilityHash, 1, 500)) {
    return failure("External analysis response does not match the completed analysis contract.");
  }
  return success(value);
}
import type { AnalysisPlan, ApprovedSearchPlan, DatasetRecord } from "../types";
