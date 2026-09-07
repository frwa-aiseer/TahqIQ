import type { ConfirmedResearchIntakeClassification, ReportingGuideline } from "../types";

export type MethodologyStatementClass = "Researcher Fact" | "Evidence-grounded Recommendation" | "AI Proposal" | "Missing Information";
export type MethodologyDesignSection =
  | "proposedDesign" | "populationOrDataSource" | "sampling" | "variablesOrOutcomes" | "instruments"
  | "procedure" | "biasAndConfounding" | "analysisNeeds" | "ethicsConsiderations" | "limitations" | "unresolvedQuestions";

export interface MethodologyDesignStatement {
  text: string;
  classification: MethodologyStatementClass;
  researcherFactId?: string;
  evidenceIds: string[];
}
export interface MethodologyDesignCandidate {
  proposedDesign: MethodologyDesignStatement[];
  populationOrDataSource: MethodologyDesignStatement[];
  sampling: MethodologyDesignStatement[];
  variablesOrOutcomes: MethodologyDesignStatement[];
  instruments: MethodologyDesignStatement[];
  procedure: MethodologyDesignStatement[];
  biasAndConfounding: MethodologyDesignStatement[];
  analysisNeeds: MethodologyDesignStatement[];
  ethicsConsiderations: MethodologyDesignStatement[];
  limitations: MethodologyDesignStatement[];
  unresolvedQuestions: MethodologyDesignStatement[];
}
export interface MethodologyDesignInput {
  explicitUserRequest: true;
  projectId: string;
  approvedResearchQuestion: { id: string; text: string; approvedByUid: string; approvedAt: string };
  approvedObjectives: Array<{ id: string; text: string; approvedByUid: string; approvedAt: string }>;
  confirmedClassification: ConfirmedResearchIntakeClassification;
  reviewedGapIds: string[];
  reviewedEvidenceIds: string[];
  researcherFacts: Array<{ id: string; text: string }>;
  constraints: string[];
  reportingGuidance: ReportingGuideline;
}
export interface MethodologyDesignProposal {
  id: string; projectId: string; status: "AI Suggested"; reviewState: "Needs Researcher Review";
  generatedAt: string; generator: { provider: string; model: string; promptVersion: string };
  sourceResearchQuestionId: string; sourceObjectiveIds: string[]; sourceGapIds: string[];
  reportingGuidelineId?: string; candidate: MethodologyDesignCandidate;
}
export interface ApprovedMethodologyDesign extends Omit<MethodologyDesignProposal, "status" | "reviewState"> {
  status: "Researcher Approved"; reviewState: "Researcher Approved"; sourceProposalId: string;
  approvedByUid: string; approvedByEmail: string; approvedAt: string; rationale: string;
}
export interface MethodologyDesignTool {
  propose(context: Omit<MethodologyDesignInput, "explicitUserRequest">): Promise<unknown>;
  attribution: { provider: string; model: string; promptVersion: string };
}

const SECTIONS: MethodologyDesignSection[] = ["proposedDesign", "populationOrDataSource", "sampling", "variablesOrOutcomes", "instruments", "procedure", "biasAndConfounding", "analysisNeeds", "ethicsConsiderations", "limitations", "unresolvedQuestions"];
const CLASSES: MethodologyStatementClass[] = ["Researcher Fact", "Evidence-grounded Recommendation", "AI Proposal", "Missing Information"];
const PROPOSAL_LANGUAGE = /\b(propos(?:e|ed|al)|consider|could|should|may|might|candidate|researcher (?:must|should|to)|requires? researcher)\b/i;
const MISSING_LANGUAGE = /\b(missing|unverified|not available|researcher input required|not configured|unresolved)\b/i;
const INVENTED_SAMPLE = /\b(?:sample size|n)\s*(?:=|of|:)\s*\d+\b/i;
const INVENTED_ETHICS = /\b(?:ethics|ethical|IRB|REC)\s+(?:approval|reference|number|id)\s*(?:was|is|:|#)?\s*[A-Z0-9-]+\b/i;
const COMPLETED_PROCEDURE = /\b(?:participants? (?:were|have been) (?:recruited|enrolled|assigned)|data (?:were|have been) collected|procedure (?:was|has been) completed)\b/i;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const statementKeys = (value: Record<string, unknown>) => Object.keys(value).every((key) => ["text", "classification", "researcherFactId", "evidenceIds"].includes(key))
  && ["text", "classification", "evidenceIds"].every((key) => key in value);

function validateInput(input: MethodologyDesignInput): void {
  if (input.explicitUserRequest !== true) throw new Error("MethodologyDesignAgent runs only after an explicit user request for methodology help.");
  if (!input.projectId?.trim() || !input.approvedResearchQuestion?.id?.trim() || !input.approvedResearchQuestion.text?.trim() || !input.approvedResearchQuestion.approvedByUid?.trim() || !input.approvedResearchQuestion.approvedAt?.trim()) throw new Error("An attributable approved research question is required.");
  if (!input.approvedObjectives.length || input.approvedObjectives.some((item) => !item.id?.trim() || !item.text?.trim() || !item.approvedByUid?.trim() || !item.approvedAt?.trim())) throw new Error("At least one attributable approved objective is required.");
  if (input.confirmedClassification.projectId !== input.projectId || input.confirmedClassification.status !== "Researcher Confirmed") throw new Error("A project-scoped researcher-confirmed classification is required.");
  if (input.reportingGuidance.recommendationStatus !== "Researcher Confirmed") throw new Error("Researcher-confirmed reporting guidance is required.");
  if (![input.reviewedGapIds, input.reviewedEvidenceIds, input.researcherFacts, input.constraints].every(Array.isArray)) throw new Error("Gap, evidence, fact, and constraint collections are required.");
}

export function validateMethodologyDesignCandidate(candidate: unknown, input: MethodologyDesignInput): MethodologyDesignCandidate {
  if (!object(candidate) || !exactKeys(candidate, SECTIONS)) throw new Error("Methodology proposal must contain exactly every required section.");
  const factMap = new Map(input.researcherFacts.map((fact) => [fact.id, fact.text]));
  const evidenceIds = new Set(input.reviewedEvidenceIds);
  for (const section of SECTIONS) {
    const statements = candidate[section];
    if (!Array.isArray(statements) || statements.length === 0) throw new Error(`${section} requires at least one classified statement.`);
    for (const raw of statements) {
      if (!object(raw) || !statementKeys(raw) || typeof raw.text !== "string" || !raw.text.trim() || !CLASSES.includes(raw.classification as MethodologyStatementClass) || !Array.isArray(raw.evidenceIds) || raw.evidenceIds.some((id) => typeof id !== "string")) throw new Error(`${section} contains an invalid methodology statement.`);
      const classification = raw.classification as MethodologyStatementClass;
      const cited = raw.evidenceIds as string[];
      if (cited.some((id) => !evidenceIds.has(id))) throw new Error(`${section} cites evidence outside the reviewed input set.`);
      if (classification === "Researcher Fact" && (typeof raw.researcherFactId !== "string" || factMap.get(raw.researcherFactId) !== raw.text || cited.length)) throw new Error("Researcher Fact must copy one supplied fact exactly and cannot cite evidence.");
      if (classification === "Evidence-grounded Recommendation" && (!cited.length || raw.researcherFactId !== undefined)) throw new Error("Evidence-grounded Recommendation requires reviewed evidence IDs only.");
      if (classification === "AI Proposal" && (!PROPOSAL_LANGUAGE.test(raw.text) || cited.length || raw.researcherFactId !== undefined)) throw new Error("AI Proposal must use conditional proposal language and cannot masquerade as evidence or fact.");
      if (classification === "Missing Information" && (!MISSING_LANGUAGE.test(raw.text) || cited.length || raw.researcherFactId !== undefined)) throw new Error("Missing Information must remain explicit and unsourced.");
      if (classification !== "Researcher Fact" && (INVENTED_SAMPLE.test(raw.text) || INVENTED_ETHICS.test(raw.text) || COMPLETED_PROCEDURE.test(raw.text))) throw new Error("Proposal invents a sample size, ethics fact, participant fact, or completed procedure.");
    }
  }
  return candidate as unknown as MethodologyDesignCandidate;
}

export async function runMethodologyDesignAgent(input: MethodologyDesignInput, tool: MethodologyDesignTool, now = () => new Date().toISOString()): Promise<MethodologyDesignProposal> {
  validateInput(input);
  const candidate = validateMethodologyDesignCandidate(await tool.propose({
    projectId: input.projectId, approvedResearchQuestion: input.approvedResearchQuestion, approvedObjectives: input.approvedObjectives,
    confirmedClassification: input.confirmedClassification, reviewedGapIds: input.reviewedGapIds, reviewedEvidenceIds: input.reviewedEvidenceIds,
    researcherFacts: input.researcherFacts, constraints: input.constraints, reportingGuidance: input.reportingGuidance,
  }), input);
  const generatedAt = now();
  return {
    id: `methodology-design-${input.projectId}-${generatedAt}`, projectId: input.projectId,
    status: "AI Suggested", reviewState: "Needs Researcher Review", generatedAt, generator: { ...tool.attribution },
    sourceResearchQuestionId: input.approvedResearchQuestion.id, sourceObjectiveIds: input.approvedObjectives.map((item) => item.id),
    sourceGapIds: [...input.reviewedGapIds], reportingGuidelineId: input.reportingGuidance.registryId, candidate,
  };
}

export function approveMethodologyDesignProposal(proposal: MethodologyDesignProposal, actor: { uid: string; email: string }, rationale: string, now = () => new Date().toISOString()): ApprovedMethodologyDesign {
  if (proposal.status !== "AI Suggested" || proposal.reviewState !== "Needs Researcher Review" || !actor.uid?.trim() || !actor.email?.trim() || !rationale?.trim()) throw new Error("Methodology approval requires a review-pending proposal, attributable researcher, and rationale.");
  return { ...proposal, id: `approved-${proposal.id}`, status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: actor.uid, approvedByEmail: actor.email, approvedAt: now(), rationale };
}
