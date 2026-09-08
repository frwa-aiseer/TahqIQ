import { describe, expect, it } from "vitest";
import type { ConfirmedResearchIntakeClassification, DatasetRecord, ResearchQuestionItem } from "../types";
import { analysisMethodRegistry } from "../lib/statsEngine";
import type { ApprovedMethodologyDesign } from "../lib/methodologyDesignAgent";
import {
  approveAnalysisPlanningProposal,
  runAnalysisPlanningAgent,
  validateAnalysisPlanningCandidate,
  type AnalysisPlanningCandidate,
  type AnalysisPlanningInput,
} from "../lib/analysisPlanningAgent";

const timestamp = "2026-09-08T04:00:00.000Z";
const methodology = {
  id: "approved-methodology-1", projectId: "project-plan", status: "Researcher Approved", reviewState: "Researcher Approved",
  approvedByUid: "researcher-1", approvedAt: timestamp, rationale: "Methodology reviewed and approved.",
} as unknown as ApprovedMethodologyDesign;
const dataset: DatasetRecord = {
  id: "dataset-plan", filename: "approved.csv", fileHash: "sha256-plan", uploadDate: timestamp,
  recordCount: 20, variableCount: 4, missingnessPercent: 5, isAnonymizedConfirmed: true, state: "Approved for Analysis",
  variables: [
    { name: "outcome", type: "Numeric", missingCount: 1, uniqueValues: 19 },
    { name: "exposure", type: "Numeric", missingCount: 0, uniqueValues: 20 },
    { name: "group", type: "Categorical", missingCount: 0, uniqueValues: 2 },
    { name: "participant_id", type: "ID", missingCount: 0, uniqueValues: 20 },
  ], rawPreview: [],
};
const questions: ResearchQuestionItem[] = [{
  id: "rq-1", question: "What is the association between exposure and outcome?", type: "Primary",
  finerScore: { feasible: 4, interesting: 4, novel: 3, ethical: 5, relevant: 4, totalScore: 20 }, isApproved: true, approvalDate: timestamp,
  hypotheses: [{ id: "hyp-1", type: "Alternative", statement: "Exposure is associated with outcome.", status: "Approved" }],
}];
const classification = {
  id: "confirmed-classification", projectId: "project-plan", status: "Researcher Confirmed", sourceProposalId: "intake-proposal",
  confirmedAt: timestamp, confirmedByUid: "researcher-1", confirmedByEmail: "researcher@example.org", correctedFields: [],
  discipline: "Economics", subdiscipline: "Applied Economics", candidateStudyType: "Original quantitative research",
  researchStage: "Data available", manuscriptType: "Original research manuscript",
  available: { evidence: "Not available", method: "Researcher-approved methodology", data: "Researcher-supplied dataset" },
  missingCriticalInformation: [], nextStage: "Analysis planning", confidence: "High", confidenceRationale: "Researcher confirmed.",
} as ConfirmedResearchIntakeClassification;
const input: AnalysisPlanningInput = { explicitUserRequest: true, projectId: "project-plan", approvedMethodology: methodology, dataset, researchQuestions: questions, confirmedClassification: classification, registry: analysisMethodRegistry };

const recommendation = (role: "Primary" | "Secondary" | "Sensitivity", methodId: string, id: string) => ({
  id, role, methodId, title: `${role} registered analysis`, rationale: "The registered method could address the approved research question using the mapped variables.",
  researchQuestionId: "rq-1", hypothesisId: "hyp-1",
  variableMappings: [{ role: "outcome", variableName: "outcome", status: "Mapped" as const }, { role: "predictor", variableName: "exposure", status: "Mapped" as const }],
  assumptions: [{ assumption: "Observations are independent.", status: "Requires Researcher Verification" as const, rationale: "Independence cannot be established from the variable dictionary." }],
  missingVariables: [],
  preprocessing: [{ operation: "Review the documented missing outcome record.", rationale: "The variable dictionary records one missing outcome.", affectedVariables: ["outcome"], status: "Proposed—Needs Researcher Approval" as const }],
});
const candidate = (): AnalysisPlanningCandidate => ({
  primaryAnalyses: [recommendation("Primary", "linear-regression", "analysis-primary")],
  secondaryAnalyses: [recommendation("Secondary", "independent-t", "analysis-secondary")],
  sensitivityAnalyses: [recommendation("Sensitivity", "mann-whitney", "analysis-sensitivity")],
  unsupportedNeeds: [{ need: "Time-to-event modeling", reason: "Censoring and event-time contracts are not configured.", relatedMethodId: "cox-proportional-hazards" }],
  globalMissingInformation: ["Researcher verification of independence is required."],
});
const tool = (output: unknown, capture?: (context: unknown) => void) => ({
  propose: async (context: unknown) => { capture?.(context); return output; },
  attribution: { provider: "Configured planning provider", model: "configured-model", promptVersion: "analysis-planning-v1" },
});

describe("TQ-VSC-049 AnalysisPlanningAgent", () => {
  it("requires approved methodology, dataset dictionary, approved questions, classification, and explicit request", async () => {
    await expect(runAnalysisPlanningAgent({ ...input, explicitUserRequest: false } as unknown as AnalysisPlanningInput, tool(candidate()))).rejects.toThrow(/explicit user request/);
    await expect(runAnalysisPlanningAgent({ ...input, approvedMethodology: { ...methodology, status: "AI Suggested" } as unknown as ApprovedMethodologyDesign }, tool(candidate()))).rejects.toThrow(/researcher-approved methodology/);
    await expect(runAnalysisPlanningAgent({ ...input, researchQuestions: [{ ...questions[0], isApproved: false }] }, tool(candidate()))).rejects.toThrow(/approved research question/);
    await expect(runAnalysisPlanningAgent({ ...input, confirmedClassification: { ...classification, projectId: "another-project" } }, tool(candidate()))).rejects.toThrow(/project-scoped researcher-confirmed/);
  });

  it("returns registered primary, secondary, and sensitivity recommendations without computing", async () => {
    let received: any;
    const proposal = await runAnalysisPlanningAgent(input, tool(candidate(), (context) => { received = context; }), () => timestamp);
    expect(proposal).toMatchObject({ status: "AI Suggested", reviewState: "Needs Researcher Review", sourceMethodologyId: methodology.id, sourceDatasetId: dataset.id, sourceDatasetHash: dataset.fileHash, sourceClassificationProposalId: classification.sourceProposalId });
    expect(proposal.candidate.primaryAnalyses[0].methodId).toBe("linear-regression");
    expect(proposal.candidate.secondaryAnalyses[0].role).toBe("Secondary");
    expect(proposal.candidate.sensitivityAnalyses[0].role).toBe("Sensitivity");
    expect(proposal.candidate.unsupportedNeeds[0].relatedMethodId).toBe("cox-proportional-hazards");
    expect(received.datasetProfile).not.toHaveProperty("rawPreview");
    expect(received.methodCapabilities.find((method: any) => method.id === "linear-regression")).toMatchObject({ availability: "Enabled" });
    expect(JSON.stringify(received.methodCapabilities)).not.toContain("execute");
    expect(JSON.stringify(proposal)).not.toMatch(/pValue|effectSize|numericResults|executionStatus/);
  });

  it("rejects hallucinated, unregistered, and disabled method IDs", () => {
    const hallucinated = candidate(); hallucinated.primaryAnalyses[0].methodId = "quantum-causal-oracle";
    expect(() => validateAnalysisPlanningCandidate(hallucinated, input)).toThrow(/unregistered method ID/);
    const planned = candidate(); planned.primaryAnalyses[0].methodId = "cox-proportional-hazards";
    expect(() => validateAnalysisPlanningCandidate(planned, input)).toThrow(/planned and cannot be proposed as executable/);
    const unknownUnsupported = candidate(); unknownUnsupported.unsupportedNeeds[0].relatedMethodId = "invented-survival-method";
    expect(() => validateAnalysisPlanningCandidate(unknownUnsupported, input)).toThrow(/unregistered method ID/);
  });

  it("validates question/hypothesis IDs and variable mappings against approved inputs", () => {
    const unknownQuestion = candidate(); unknownQuestion.primaryAnalyses[0].researchQuestionId = "rq-hallucinated";
    expect(() => validateAnalysisPlanningCandidate(unknownQuestion, input)).toThrow(/unknown approved research question/);
    const unknownHypothesis = candidate(); unknownHypothesis.primaryAnalyses[0].hypothesisId = "hyp-hallucinated";
    expect(() => validateAnalysisPlanningCandidate(unknownHypothesis, input)).toThrow(/unknown or unapproved hypothesis/);
    const fakeMapping = candidate(); fakeMapping.primaryAnalyses[0].variableMappings[0] = { role: "outcome", variableName: "invented_variable", status: "Mapped" };
    expect(() => validateAnalysisPlanningCandidate(fakeMapping, input)).toThrow(/does not match the dataset dictionary/);
    const incompatible = candidate(); incompatible.primaryAnalyses[0].variableMappings[0] = { role: "outcome", variableName: "group", status: "Mapped" };
    expect(() => validateAnalysisPlanningCandidate(incompatible, input)).toThrow(/incompatible with method/);
    const explicitMissing = candidate();
    explicitMissing.primaryAnalyses[0].variableMappings.push({ role: "covariate", variableName: "missing_covariate", status: "Missing" });
    explicitMissing.primaryAnalyses[0].missingVariables = ["missing_covariate"];
    expect(validateAnalysisPlanningCandidate(explicitMissing, input).primaryAnalyses[0].missingVariables).toEqual(["missing_covariate"]);
  });

  it("requires preprocessing to remain proposed and rejects self-approved/extra output", () => {
    const performed = candidate() as any; performed.primaryAnalyses[0].preprocessing[0].status = "Completed";
    expect(() => validateAnalysisPlanningCandidate(performed, input)).toThrow(/remain a proposal/);
    const selfApproved = { ...candidate(), status: "Researcher Approved" };
    expect(() => validateAnalysisPlanningCandidate(selfApproved, input)).toThrow(/exactly the required collections|cannot self-approve/);
  });

  it("requires separate attributable researcher approval and preserves the proposal", async () => {
    const proposal = await runAnalysisPlanningAgent(input, tool(candidate()), () => timestamp);
    expect(() => approveAnalysisPlanningProposal(proposal, { uid: "", email: "" }, "")).toThrow(/attributable researcher/);
    const approved = approveAnalysisPlanningProposal(proposal, { uid: "researcher-2", email: "researcher2@example.org" }, "Mappings, assumptions, preprocessing, and unsupported needs reviewed.", () => "2026-09-08T05:00:00.000Z");
    expect(proposal).toMatchObject({ status: "AI Suggested", reviewState: "Needs Researcher Review" });
    expect(approved).toMatchObject({ status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: "researcher-2", approvedAt: "2026-09-08T05:00:00.000Z" });
  });
});
