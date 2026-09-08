import type { ConfirmedResearchIntakeClassification, DatasetRecord, ResearchQuestionItem } from "../types";
import type { ApprovedMethodologyDesign } from "./methodologyDesignAgent";
import type { AnalysisMethodRegistry } from "./analysisMethodRegistry";

export type AnalysisRole = "Primary" | "Secondary" | "Sensitivity";
export type PlanningAssumptionStatus = "Requires Researcher Verification" | "Supported by Dataset Metadata" | "Not Testable at Planning";

export interface AnalysisVariableMapping {
  role: string;
  variableName: string;
  status: "Mapped" | "Missing";
}

export interface ProposedPreprocessingStep {
  operation: string;
  rationale: string;
  affectedVariables: string[];
  status: "Proposed—Needs Researcher Approval";
}

export interface ProposedAnalysisRecommendation {
  id: string;
  role: AnalysisRole;
  methodId: string;
  title: string;
  rationale: string;
  researchQuestionId: string;
  hypothesisId?: string;
  variableMappings: AnalysisVariableMapping[];
  assumptions: Array<{ assumption: string; status: PlanningAssumptionStatus; rationale: string }>;
  missingVariables: string[];
  preprocessing: ProposedPreprocessingStep[];
}

export interface UnsupportedAnalysisNeed {
  need: string;
  reason: string;
  relatedMethodId?: string;
}

export interface AnalysisPlanningCandidate {
  primaryAnalyses: ProposedAnalysisRecommendation[];
  secondaryAnalyses: ProposedAnalysisRecommendation[];
  sensitivityAnalyses: ProposedAnalysisRecommendation[];
  unsupportedNeeds: UnsupportedAnalysisNeed[];
  globalMissingInformation: string[];
}

export interface AnalysisPlanningInput {
  explicitUserRequest: true;
  projectId: string;
  approvedMethodology: ApprovedMethodologyDesign;
  dataset: DatasetRecord;
  researchQuestions: ResearchQuestionItem[];
  confirmedClassification: ConfirmedResearchIntakeClassification;
  registry: AnalysisMethodRegistry;
}

export interface AnalysisPlanningProposal {
  id: string;
  projectId: string;
  status: "AI Suggested";
  reviewState: "Needs Researcher Review";
  generatedAt: string;
  generator: { provider: string; model: string; promptVersion: string };
  sourceMethodologyId: string;
  sourceDatasetId: string;
  sourceDatasetHash: string;
  sourceClassificationProposalId: string;
  candidate: AnalysisPlanningCandidate;
}

export interface ApprovedAnalysisPlanningProposal extends Omit<AnalysisPlanningProposal, "id" | "status" | "reviewState"> {
  id: string;
  status: "Researcher Approved";
  reviewState: "Researcher Approved";
  sourceProposalId: string;
  approvedByUid: string;
  approvedByEmail: string;
  approvedAt: string;
  rationale: string;
}

export interface AnalysisPlanningTool {
  propose(context: {
    projectId: string;
    methodology: ApprovedMethodologyDesign;
    datasetProfile: { id: string; filename: string; fileHash: string; recordCount: number; variableCount: number; missingnessPercent: number; state?: string };
    variableDictionary: DatasetRecord["variables"];
    researchQuestions: ResearchQuestionItem[];
    classification: ConfirmedResearchIntakeClassification;
    methodCapabilities: Array<{
      id: string;
      family: string;
      label: string;
      availability: "Enabled" | "Planned" | "Unavailable";
      availabilityReason?: string;
      compatibleVariableTypes: Readonly<Record<string, readonly string[]>>;
      requiredInputs: readonly string[];
      assumptions: readonly string[];
    }>;
  }): Promise<unknown>;
  attribution: { provider: string; model: string; promptVersion: string };
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, required: string[], optional: string[] = []) => {
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) && keys.every((key) => required.includes(key) || optional.includes(key));
};
const nonempty = (value: unknown): value is string => typeof value === "string" && Boolean(value.trim());
const candidateKeys = ["primaryAnalyses", "secondaryAnalyses", "sensitivityAnalyses", "unsupportedNeeds", "globalMissingInformation"];
const recommendationKeys = ["id", "role", "methodId", "title", "rationale", "researchQuestionId", "variableMappings", "assumptions", "missingVariables", "preprocessing"];

function validateInput(input: AnalysisPlanningInput): void {
  if (input.explicitUserRequest !== true) throw new Error("AnalysisPlanningAgent runs only after an explicit user request.");
  if (!nonempty(input.projectId)) throw new Error("Project ID is required.");
  const methodology = input.approvedMethodology;
  if (!methodology || methodology.projectId !== input.projectId || methodology.status !== "Researcher Approved" || methodology.reviewState !== "Researcher Approved" || !nonempty(methodology.approvedByUid) || !nonempty(methodology.approvedAt) || !nonempty(methodology.rationale)) throw new Error("A project-scoped attributable researcher-approved methodology is required.");
  if (!input.dataset?.id || !input.dataset.fileHash || !Array.isArray(input.dataset.variables)) throw new Error("A dataset profile and variable dictionary are required.");
  if (!input.researchQuestions.length || input.researchQuestions.some((question) => !question.isApproved || !nonempty(question.id) || !nonempty(question.question))) throw new Error("At least one approved research question is required and all supplied questions must be approved.");
  if (input.confirmedClassification?.projectId !== input.projectId || input.confirmedClassification.status !== "Researcher Confirmed") throw new Error("A project-scoped researcher-confirmed study classification is required.");
  if (!input.registry || typeof input.registry.list !== "function") throw new Error("AnalysisMethodRegistry is required.");
}

function validateRecommendation(raw: unknown, expectedRole: AnalysisRole, input: AnalysisPlanningInput, seenIds: Set<string>): ProposedAnalysisRecommendation {
  if (!object(raw) || !exactKeys(raw, recommendationKeys, ["hypothesisId"])) throw new Error(`${expectedRole} analysis recommendation has an invalid structured schema.`);
  if (![raw.id, raw.methodId, raw.title, raw.rationale, raw.researchQuestionId].every(nonempty) || raw.role !== expectedRole) throw new Error(`${expectedRole} analysis recommendation has invalid identity, role, or rationale.`);
  if (seenIds.has(raw.id as string)) throw new Error(`Duplicate analysis recommendation ID '${raw.id}'.`);
  seenIds.add(raw.id as string);

  const method = input.registry.get(raw.methodId as string);
  if (!method) throw new Error(`Analysis recommendation uses unregistered method ID '${raw.methodId}'.`);
  if (method.availability !== "Enabled" || typeof method.execute !== "function") throw new Error(`Analysis recommendation method '${raw.methodId}' is ${method.availability.toLowerCase()} and cannot be proposed as executable.`);

  const question = input.researchQuestions.find((item) => item.id === raw.researchQuestionId);
  if (!question) throw new Error(`Analysis recommendation references unknown approved research question '${raw.researchQuestionId}'.`);
  if (raw.hypothesisId !== undefined && (!nonempty(raw.hypothesisId) || !question.hypotheses.some((hypothesis) => hypothesis.id === raw.hypothesisId && hypothesis.status === "Approved"))) throw new Error(`Analysis recommendation references an unknown or unapproved hypothesis '${raw.hypothesisId}'.`);

  if (!Array.isArray(raw.variableMappings) || !raw.variableMappings.length || !Array.isArray(raw.assumptions) || !raw.assumptions.length || !Array.isArray(raw.missingVariables) || !Array.isArray(raw.preprocessing)) throw new Error(`${expectedRole} analysis requires mappings, assumptions, missing-variable collection, and preprocessing collection.`);
  const availableVariables = new Set(input.dataset.variables.map((variable) => variable.name));
  const variableDictionary = new Map(input.dataset.variables.map((variable) => [variable.name, variable]));
  const mappings = raw.variableMappings.map((mapping): AnalysisVariableMapping => {
    if (!object(mapping) || !exactKeys(mapping, ["role", "variableName", "status"]) || !nonempty(mapping.role) || !nonempty(mapping.variableName) || !["Mapped", "Missing"].includes(mapping.status as string)) throw new Error("Analysis variable mapping is invalid.");
    const exists = availableVariables.has(mapping.variableName as string);
    if ((mapping.status === "Mapped") !== exists) throw new Error(`Variable mapping '${mapping.variableName}' does not match the dataset dictionary.`);
    if (exists) {
      const normalizedRole = String(mapping.role).toLowerCase().replace(/[^a-z]/g, "");
      const compatibility = Object.entries(method.compatibleVariableTypes).find(([role]) => {
        const normalizedCapabilityRole = role.toLowerCase().replace(/[^a-z]/g, "");
        return normalizedCapabilityRole === normalizedRole || normalizedCapabilityRole === `${normalizedRole}s` || `${normalizedCapabilityRole}s` === normalizedRole;
      });
      const declaredType = variableDictionary.get(mapping.variableName as string)!.type === "Datetime" ? "Date" : variableDictionary.get(mapping.variableName as string)!.type;
      if (compatibility && !compatibility[1].includes(declaredType as never)) throw new Error(`Variable '${mapping.variableName}' type '${declaredType}' is incompatible with method '${method.id}' role '${mapping.role}'.`);
    }
    return mapping as unknown as AnalysisVariableMapping;
  });
  const missingVariables = raw.missingVariables as unknown[];
  if (missingVariables.some((name) => !nonempty(name) || availableVariables.has(name as string))) throw new Error("Missing variables must be non-empty names absent from the dataset dictionary.");
  const missingMapped = mappings.filter((mapping) => mapping.status === "Missing").map((mapping) => mapping.variableName).sort();
  if (JSON.stringify([...missingVariables].sort()) !== JSON.stringify(missingMapped)) throw new Error("Missing-variable list must exactly match mappings marked Missing.");

  const assumptions = raw.assumptions.map((assumption) => {
    if (!object(assumption) || !exactKeys(assumption, ["assumption", "status", "rationale"]) || !nonempty(assumption.assumption) || !nonempty(assumption.rationale) || !["Requires Researcher Verification", "Supported by Dataset Metadata", "Not Testable at Planning"].includes(assumption.status as string)) throw new Error("Analysis assumption record is invalid.");
    return assumption;
  });
  const preprocessing = raw.preprocessing.map((step) => {
    if (!object(step) || !exactKeys(step, ["operation", "rationale", "affectedVariables", "status"]) || !nonempty(step.operation) || !nonempty(step.rationale) || step.status !== "Proposed—Needs Researcher Approval" || !Array.isArray(step.affectedVariables) || step.affectedVariables.some((name) => !nonempty(name) || !availableVariables.has(name as string))) throw new Error("Preprocessing must remain a proposal and reference known variables only.");
    return step;
  });
  return { ...(raw as unknown as ProposedAnalysisRecommendation), variableMappings: mappings, assumptions: assumptions as ProposedAnalysisRecommendation["assumptions"], preprocessing: preprocessing as unknown as ProposedPreprocessingStep[] };
}

export function validateAnalysisPlanningCandidate(candidate: unknown, input: AnalysisPlanningInput): AnalysisPlanningCandidate {
  validateInput(input);
  if (!object(candidate) || !exactKeys(candidate, candidateKeys)) throw new Error("Analysis planning output must contain exactly the required collections and cannot self-approve.");
  if (!candidateKeys.every((key) => Array.isArray(candidate[key]))) throw new Error("Every analysis planning collection must be an array.");
  if (!(candidate.primaryAnalyses as unknown[]).length) throw new Error("At least one primary analysis recommendation is required.");
  const seenIds = new Set<string>();
  const primaryAnalyses = (candidate.primaryAnalyses as unknown[]).map((item) => validateRecommendation(item, "Primary", input, seenIds));
  const secondaryAnalyses = (candidate.secondaryAnalyses as unknown[]).map((item) => validateRecommendation(item, "Secondary", input, seenIds));
  const sensitivityAnalyses = (candidate.sensitivityAnalyses as unknown[]).map((item) => validateRecommendation(item, "Sensitivity", input, seenIds));
  const unsupportedNeeds = (candidate.unsupportedNeeds as unknown[]).map((need): UnsupportedAnalysisNeed => {
    if (!object(need) || !exactKeys(need, ["need", "reason"], ["relatedMethodId"]) || !nonempty(need.need) || !nonempty(need.reason)) throw new Error("Unsupported analysis need is invalid.");
    if (need.relatedMethodId !== undefined) {
      if (!nonempty(need.relatedMethodId)) throw new Error("Unsupported need method ID is invalid.");
      const method = input.registry.get(need.relatedMethodId);
      if (!method) throw new Error(`Unsupported need references unregistered method ID '${need.relatedMethodId}'.`);
      if (method.availability === "Enabled") throw new Error(`Enabled method '${need.relatedMethodId}' must not be represented as an unsupported need.`);
    }
    return need as unknown as UnsupportedAnalysisNeed;
  });
  const globalMissingInformation = candidate.globalMissingInformation as unknown[];
  if (globalMissingInformation.some((item) => !nonempty(item))) throw new Error("Global missing information must use explicit non-empty descriptions.");
  return { primaryAnalyses, secondaryAnalyses, sensitivityAnalyses, unsupportedNeeds, globalMissingInformation: globalMissingInformation as string[] };
}

export async function runAnalysisPlanningAgent(input: AnalysisPlanningInput, tool: AnalysisPlanningTool, now = () => new Date().toISOString()): Promise<AnalysisPlanningProposal> {
  validateInput(input);
  const methodCapabilities = input.registry.list().map((method) => ({
    id: method.id, family: method.family, label: method.label, availability: method.availability,
    availabilityReason: method.availabilityReason, compatibleVariableTypes: method.compatibleVariableTypes,
    requiredInputs: method.requiredInputs, assumptions: method.assumptions,
  }));
  const raw = await tool.propose({
    projectId: input.projectId, methodology: input.approvedMethodology,
    datasetProfile: { id: input.dataset.id, filename: input.dataset.filename, fileHash: input.dataset.fileHash, recordCount: input.dataset.recordCount, variableCount: input.dataset.variableCount, missingnessPercent: input.dataset.missingnessPercent, state: input.dataset.state },
    variableDictionary: input.dataset.variables, researchQuestions: input.researchQuestions,
    classification: input.confirmedClassification, methodCapabilities,
  });
  const candidate = validateAnalysisPlanningCandidate(raw, input);
  const generatedAt = now();
  return {
    id: `analysis-planning-${input.projectId}-${generatedAt}`, projectId: input.projectId,
    status: "AI Suggested", reviewState: "Needs Researcher Review", generatedAt,
    generator: { ...tool.attribution }, sourceMethodologyId: input.approvedMethodology.id,
    sourceDatasetId: input.dataset.id, sourceDatasetHash: input.dataset.fileHash,
    sourceClassificationProposalId: input.confirmedClassification.sourceProposalId, candidate,
  };
}

export function approveAnalysisPlanningProposal(proposal: AnalysisPlanningProposal, actor: { uid: string; email: string }, rationale: string, now = () => new Date().toISOString()): ApprovedAnalysisPlanningProposal {
  if (proposal.status !== "AI Suggested" || proposal.reviewState !== "Needs Researcher Review" || !nonempty(actor.uid) || !nonempty(actor.email) || !nonempty(rationale)) throw new Error("Analysis-plan approval requires a review-pending proposal, attributable researcher, and rationale.");
  return { ...proposal, id: `approved-${proposal.id}`, status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: actor.uid, approvedByEmail: actor.email, approvedAt: now(), rationale: rationale.trim() };
}
