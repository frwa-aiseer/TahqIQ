import { describe, expect, it } from "vitest";
import { confirmResearchIntakeClassification, createResearchIntakeProposal } from "../lib/researchIntakeAgent";
import {
  approveQuestionHypothesisProposal,
  classificationAllowsHypotheses,
  runQuestionHypothesisAgent,
  validateQuestionHypothesisCandidate,
  type ApprovedResearchGap,
  type QuestionHypothesisCandidate,
  type QuestionHypothesisInput,
} from "../lib/questionHypothesisAgent";
import type { ConfirmedResearchIntakeClassification, ReviewedLiteratureSynthesis } from "../types";

const timestamp = "2026-09-07T05:00:00.000Z";
const synthesis: ReviewedLiteratureSynthesis = {
  synthesisId: "synthesis-1", projectId: "project-qh", researchQuestion: "Researcher-reviewed synthesis scope",
  themes: [], methodologicalDifferences: [], contextDifferences: [], limitations: [], unresolvedQuestions: [], candidateSynthesisStatements: [],
  sourceEvidenceIds: ["evidence-1"], reviewState: "Researcher Reviewed", createdAt: timestamp, synthesizedBy: "configured-agent",
  researcherReview: { reviewedByUid: "researcher-1", reviewedAt: timestamp, rationale: "Reviewed synthesis for question development." },
};
const gap: ApprovedResearchGap = {
  gapId: "gap-1", projectId: "project-qh", gapStatement: "Within the reviewed evidence, a scoped issue remains.", type: "Methodological",
  supportingEvidenceIds: ["evidence-1"], contradictingEvidenceIds: [], confidence: 0.7, caution: "Limited to reviewed evidence.",
  newResearchAddressesIt: "A candidate design may address the scoped issue.", status: "Researcher Approved",
  sourceSynthesisId: "synthesis-1", sourceContradictionGroupIds: [], createdAt: timestamp, generatedBy: "configured-agent",
  approvedByUid: "researcher-1", approvedAt: timestamp, approvalRationale: "Approved as a scoped candidate gap.",
};
const classification = (description: string, studyType: Parameters<typeof createResearchIntakeProposal>[0]["statedStudyType"]): ConfirmedResearchIntakeClassification => {
  const proposal = createResearchIntakeProposal({ projectId: "project-qh", researchDescription: description, statedStudyType: studyType }, () => timestamp);
  return confirmResearchIntakeClassification(proposal, {}, { uid: "researcher-1", email: "researcher@example.org" }, () => timestamp);
};
const candidate = (withHypothesis: boolean): QuestionHypothesisCandidate => ({
  researchQuestions: [{
    text: "What relationship should be examined within the approved scope?",
    rationale: { text: "The reviewed evidence supports examining the scoped relationship.", evidenceIds: ["evidence-1"] },
    variablesOrConcepts: ["Researcher-defined concept A", "Researcher-defined concept B"],
    unresolvedAssumptions: ["Researcher input required for operational definitions."],
    hypotheses: withHypothesis ? [{
      type: "Non-directional", statement: "A relationship may be present between the researcher-defined variables.",
      rationale: { text: "The reviewed evidence supports testing a bounded relationship.", evidenceIds: ["evidence-1"] },
    }] : [],
  }],
  objectives: [{
    text: "Evaluate the approved scoped relationship.",
    rationale: { text: "The approved gap and reviewed evidence support this objective.", evidenceIds: ["evidence-1"] },
    variablesOrConcepts: ["Researcher-defined concept A", "Researcher-defined concept B"],
    unresolvedAssumptions: ["Measurement selection remains unresolved."],
  }],
});
const input = (confirmedClassification: ConfirmedResearchIntakeClassification): QuestionHypothesisInput => ({
  projectId: "project-qh", projectConcept: "Researcher-supplied cross-disciplinary project concept.",
  confirmedClassification, reviewedSynthesis: synthesis, approvedGap: gap,
});
const tool = (value: unknown) => ({ propose: async () => value, attribution: { provider: "Configured provider", model: "configured-model", promptVersion: "question-hypothesis-v1" } });

describe("TQ-VSC-043 QuestionHypothesisAgent", () => {
  it.each([
    ["clinical", "A clinical cohort study.", "Cohort study", true],
    ["qualitative", "Qualitative interviews using thematic analysis.", "Original qualitative research", false],
    ["electrical engineering", "Electrical engineering signal processing experiment.", "Engineering experiment", true],
    ["machine learning", "Machine learning classifier evaluation.", "Machine-learning study", true],
    ["economics", "Economics panel regression study.", "Original quantitative research", true],
    ["systematic review", "Systematic review with database searches.", "Systematic review", false],
  ] as const)("supports %s classification without forcing hypotheses", async (_name, description, studyType, allowed) => {
    const confirmed = classification(description, studyType);
    expect(classificationAllowsHypotheses(confirmed)).toBe(allowed);
    const proposal = await runQuestionHypothesisAgent(input(confirmed), tool(candidate(allowed)), () => timestamp);
    expect(proposal).toMatchObject({ status: "AI Suggested", reviewState: "Needs Researcher Review", hypothesesAllowed: allowed });
    expect(proposal.candidate.researchQuestions[0].hypotheses).toHaveLength(allowed ? 1 : 0);
  });

  it("rejects hypotheses for qualitative and exploratory classifications", async () => {
    const qualitative = classification("Qualitative interviews and thematic analysis.", "Original qualitative research");
    await expect(runQuestionHypothesisAgent(input(qualitative), tool(candidate(true)))).rejects.toThrow("Hypotheses are not appropriate");
  });

  it("requires reviewed evidence IDs for every question, objective, and hypothesis rationale", () => {
    const value = candidate(true);
    value.objectives[0].rationale.evidenceIds = ["unknown-evidence"];
    expect(() => validateQuestionHypothesisCandidate(value, new Set(["evidence-1"]), true)).toThrow("reviewed evidence IDs");
    const empty = candidate(true);
    empty.researchQuestions[0].rationale.evidenceIds = [];
    expect(() => validateQuestionHypothesisCandidate(empty, new Set(["evidence-1"]), true)).toThrow("reviewed evidence IDs");
  });

  it("requires project-scoped confirmed classification, reviewed synthesis, and approved gap", async () => {
    const confirmed = classification("Economics panel regression.", "Original quantitative research");
    await expect(runQuestionHypothesisAgent({ ...input(confirmed), confirmedClassification: { ...confirmed, projectId: "other" } }, tool(candidate(true)))).rejects.toThrow("researcher-confirmed classification");
    await expect(runQuestionHypothesisAgent({ ...input(confirmed), approvedGap: { ...gap, status: "AI Suggested" } as unknown as ApprovedResearchGap }, tool(candidate(true)))).rejects.toThrow("approved gap");
  });

  it("rejects malformed and self-approved tool output", async () => {
    const confirmed = classification("Electrical engineering experiment.", "Engineering experiment");
    await expect(runQuestionHypothesisAgent(input(confirmed), tool({ ...candidate(true), status: "Researcher Approved" }))).rejects.toThrow("researchQuestions and objectives only");
    expect(() => validateQuestionHypothesisCandidate({ researchQuestions: [], objectives: [] }, new Set(["evidence-1"]), true)).toThrow("bounded non-empty");
  });

  it("requires a separate attributable human approval and preserves the proposal", async () => {
    const confirmed = classification("Machine learning classifier.", "Machine-learning study");
    const proposal = await runQuestionHypothesisAgent(input(confirmed), tool(candidate(true)), () => timestamp);
    expect(() => approveQuestionHypothesisProposal(proposal, { uid: "", email: "" }, "", () => timestamp)).toThrow("attributable researcher");
    const approved = approveQuestionHypothesisProposal(proposal, { uid: "researcher-2", email: "researcher2@example.org" }, "Reviewed questions, objectives, hypotheses, and assumptions.", () => "2026-09-07T06:00:00.000Z");
    expect(proposal).toMatchObject({ status: "AI Suggested", reviewState: "Needs Researcher Review" });
    expect(approved).toMatchObject({ status: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: "researcher-2", approvedAt: "2026-09-07T06:00:00.000Z" });
  });
});
