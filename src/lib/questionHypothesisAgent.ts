import type {
  ConfirmedResearchIntakeClassification,
  Hypothesis,
  ResearchGapProposal,
  ReviewedLiteratureSynthesis,
} from "../types";

export interface ApprovedResearchGap extends Omit<ResearchGapProposal, "status"> {
  status: "Researcher Approved";
  approvedByUid: string;
  approvedAt: string;
  approvalRationale: string;
}
export interface QuestionHypothesisRationale {
  text: string;
  evidenceIds: string[];
}
export interface CandidateHypothesis {
  type: Hypothesis["type"];
  statement: string;
  rationale: QuestionHypothesisRationale;
}
export interface CandidateResearchQuestion {
  text: string;
  rationale: QuestionHypothesisRationale;
  variablesOrConcepts: string[];
  unresolvedAssumptions: string[];
  hypotheses: CandidateHypothesis[];
}
export interface CandidateObjective {
  text: string;
  rationale: QuestionHypothesisRationale;
  variablesOrConcepts: string[];
  unresolvedAssumptions: string[];
}
export interface QuestionHypothesisCandidate {
  researchQuestions: CandidateResearchQuestion[];
  objectives: CandidateObjective[];
}
export interface QuestionHypothesisInput {
  projectId: string;
  projectConcept: string;
  confirmedClassification: ConfirmedResearchIntakeClassification;
  reviewedSynthesis: ReviewedLiteratureSynthesis;
  approvedGap: ApprovedResearchGap;
}
export interface QuestionHypothesisTool {
  propose(input: QuestionHypothesisInput & { hypothesesAllowed: boolean }): Promise<unknown>;
  attribution: { provider: string; model: string; promptVersion: string };
}
export interface QuestionHypothesisProposal {
  id: string;
  projectId: string;
  status: "AI Suggested";
  reviewState: "Needs Researcher Review";
  hypothesesAllowed: boolean;
  candidate: QuestionHypothesisCandidate;
  sourceSynthesisId: string;
  sourceGapId: string;
  generatedAt: string;
  generator: QuestionHypothesisTool["attribution"];
}
export interface ApprovedQuestionHypothesisPlan extends Omit<QuestionHypothesisProposal, "status" | "reviewState"> {
  status: "Researcher Approved";
  reviewState: "Researcher Approved";
  sourceProposalId: string;
  approvedByUid: string;
  approvedByEmail: string;
  approvedAt: string;
  rationale: string;
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every((key) => key in value);
const NON_HYPOTHESIS_STUDIES = /qualitative|exploratory|systematic review|scoping review|narrative review|case report|theoretical/i;

export function classificationAllowsHypotheses(classification: ConfirmedResearchIntakeClassification): boolean {
  return !NON_HYPOTHESIS_STUDIES.test(`${classification.candidateStudyType} ${classification.discipline} ${classification.subdiscipline}`);
}

function validateInput(input: QuestionHypothesisInput): Set<string> {
  if (!input.projectId?.trim() || !input.projectConcept?.trim()) throw new Error("Project scope and concept are required.");
  if (input.confirmedClassification.projectId !== input.projectId || input.confirmedClassification.status !== "Researcher Confirmed" || !input.confirmedClassification.confirmedByUid?.trim() || !input.confirmedClassification.confirmedAt?.trim()) throw new Error("A project-scoped researcher-confirmed classification is required.");
  if (input.reviewedSynthesis.projectId !== input.projectId || input.reviewedSynthesis.reviewState !== "Researcher Reviewed" || !input.reviewedSynthesis.researcherReview?.reviewedByUid?.trim() || !input.reviewedSynthesis.researcherReview.reviewedAt?.trim() || !input.reviewedSynthesis.researcherReview.rationale?.trim()) throw new Error("A project-scoped researcher-reviewed synthesis is required.");
  if (input.approvedGap.projectId !== input.projectId || input.approvedGap.status !== "Researcher Approved" || !input.approvedGap.approvedByUid?.trim() || !input.approvedGap.approvedAt?.trim() || !input.approvedGap.approvalRationale?.trim()) throw new Error("A project-scoped attributable approved gap is required.");
  const allowed = new Set(input.reviewedSynthesis.sourceEvidenceIds);
  [...input.approvedGap.supportingEvidenceIds, ...input.approvedGap.contradictingEvidenceIds].forEach((id) => allowed.add(id));
  if (!allowed.size) throw new Error("Reviewed synthesis and approved gap contain no evidence IDs.");
  return allowed;
}

function rationale(value: unknown, allowed: Set<string>, label: string): QuestionHypothesisRationale {
  if (!object(value) || !exactKeys(value, ["text", "evidenceIds"]) || typeof value.text !== "string" || !value.text.trim() || !Array.isArray(value.evidenceIds) || !value.evidenceIds.length || value.evidenceIds.some((id) => typeof id !== "string" || !allowed.has(id))) throw new Error(`${label} requires rationale linked only to reviewed evidence IDs.`);
  return { text: value.text.trim(), evidenceIds: [...new Set(value.evidenceIds as string[])] };
}
function stringList(value: unknown, label: string, required: boolean): string[] {
  if (!Array.isArray(value) || (required && !value.length) || value.some((item) => typeof item !== "string" || !item.trim())) throw new Error(`${label} must be ${required ? "a non-empty" : "an"} string array.`);
  return (value as string[]).map((item) => item.trim());
}

export function validateQuestionHypothesisCandidate(value: unknown, allowedEvidenceIds: Set<string>, hypothesesAllowed: boolean): QuestionHypothesisCandidate {
  if (!object(value) || !exactKeys(value, ["researchQuestions", "objectives"]) || !Array.isArray(value.researchQuestions) || !value.researchQuestions.length || value.researchQuestions.length > 20 || !Array.isArray(value.objectives) || !value.objectives.length || value.objectives.length > 30) throw new Error("Question/hypothesis output must contain bounded non-empty researchQuestions and objectives only.");
  const researchQuestions = value.researchQuestions.map((raw, index) => {
    if (!object(raw) || !exactKeys(raw, ["text", "rationale", "variablesOrConcepts", "unresolvedAssumptions", "hypotheses"]) || typeof raw.text !== "string" || !raw.text.trim() || !Array.isArray(raw.hypotheses)) throw new Error(`Research question ${index + 1} is malformed.`);
    if (!hypothesesAllowed && raw.hypotheses.length) throw new Error("Hypotheses are not appropriate for the confirmed qualitative or exploratory classification.");
    const hypotheses = raw.hypotheses.map((item, hypothesisIndex) => {
      if (!object(item) || !exactKeys(item, ["type", "statement", "rationale"]) || !["Null", "Alternative", "Primary", "Secondary", "Directional", "Non-directional"].includes(String(item.type)) || typeof item.statement !== "string" || !item.statement.trim()) throw new Error(`Hypothesis ${hypothesisIndex + 1} is malformed.`);
      return { type: item.type as Hypothesis["type"], statement: item.statement.trim(), rationale: rationale(item.rationale, allowedEvidenceIds, `Hypothesis ${hypothesisIndex + 1}`) };
    });
    return {
      text: raw.text.trim(), rationale: rationale(raw.rationale, allowedEvidenceIds, `Research question ${index + 1}`),
      variablesOrConcepts: stringList(raw.variablesOrConcepts, `Research question ${index + 1} variables/concepts`, true),
      unresolvedAssumptions: stringList(raw.unresolvedAssumptions, `Research question ${index + 1} unresolved assumptions`, false), hypotheses,
    };
  });
  const objectives = value.objectives.map((raw, index) => {
    if (!object(raw) || !exactKeys(raw, ["text", "rationale", "variablesOrConcepts", "unresolvedAssumptions"]) || typeof raw.text !== "string" || !raw.text.trim()) throw new Error(`Objective ${index + 1} is malformed.`);
    return {
      text: raw.text.trim(), rationale: rationale(raw.rationale, allowedEvidenceIds, `Objective ${index + 1}`),
      variablesOrConcepts: stringList(raw.variablesOrConcepts, `Objective ${index + 1} variables/concepts`, true),
      unresolvedAssumptions: stringList(raw.unresolvedAssumptions, `Objective ${index + 1} unresolved assumptions`, false),
    };
  });
  return { researchQuestions, objectives };
}

export async function runQuestionHypothesisAgent(input: QuestionHypothesisInput, tool: QuestionHypothesisTool, now = () => new Date().toISOString()): Promise<QuestionHypothesisProposal> {
  const allowed = validateInput(input);
  const hypothesesAllowed = classificationAllowsHypotheses(input.confirmedClassification);
  const candidate = validateQuestionHypothesisCandidate(await tool.propose({ ...input, hypothesesAllowed }), allowed, hypothesesAllowed);
  const generatedAt = now();
  return {
    id: `question-hypothesis-${input.projectId}-${generatedAt}`, projectId: input.projectId,
    status: "AI Suggested", reviewState: "Needs Researcher Review", hypothesesAllowed, candidate,
    sourceSynthesisId: input.reviewedSynthesis.synthesisId, sourceGapId: input.approvedGap.gapId,
    generatedAt, generator: { ...tool.attribution },
  };
}

export function approveQuestionHypothesisProposal(proposal: QuestionHypothesisProposal, actor: { uid: string; email: string }, rationaleText: string, now = () => new Date().toISOString()): ApprovedQuestionHypothesisPlan {
  if (proposal.status !== "AI Suggested" || proposal.reviewState !== "Needs Researcher Review" || !actor.uid?.trim() || !actor.email?.trim() || !rationaleText?.trim()) throw new Error("Approval requires a review-pending proposal, attributable researcher, and rationale.");
  return { ...proposal, id: `approved-${proposal.id}`, status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: actor.uid, approvedByEmail: actor.email, approvedAt: now(), rationale: rationaleText.trim() };
}
