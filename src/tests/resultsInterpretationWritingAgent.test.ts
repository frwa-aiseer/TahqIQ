import { describe, expect, it, vi } from "vitest";
import type { AnalysisOutput, ProjectState, QualitativeAnalysisWorkflow } from "../types";
import { createNumericEvidenceFromAnalysis } from "../lib/numericEvidence";
import {
  approveResultsInterpretationProposal,
  collectApprovedManuscriptResults,
  runResultsInterpretationAndWritingAgent,
  validateResultsWritingCandidate,
  type ResultsFindingSelection,
} from "../lib/resultsInterpretationWritingAgent";

const timestamp = "2026-09-10T06:00:00.000Z";
const approvedOutput: AnalysisOutput = {
  id: "result-approved", analysisPlanId: "plan-approved", planId: "plan-approved", datasetHash: "sha256-approved",
  executionTimestamp: timestamp, softwareEnvironment: "Verified engine",
  summaryText: "The approved analysis reports an estimate of 0.4 with p = 0.05 from 20 complete records.",
  numericResults: { estimate: 0.4, pValue: 0.05, completeRecords: 20 },
  pValues: [{ test: "Approved test", pValue: 0.05, significant: false, formatted: "p = 0.05" }],
  effectSizes: [], assumptionChecks: [], isReproduced: true, reproducibilityHash: "hash-approved",
  executionStatus: "Completed", state: "Approved for Manuscript", warnings: ["The independence assumption remains researcher-unverified."],
  researcherApproval: { actor: { uid: "researcher-1", email: "researcher@example.org" }, timestamp, rationale: "Results checked against output.", outputId: "result-approved", datasetHash: "sha256-approved", planId: "plan-approved" },
};
const unapprovedOutput: AnalysisOutput = { ...approvedOutput, id: "result-unapproved", state: "Completed", researcherApproval: undefined };

const project = (outputs: AnalysisOutput[] = [approvedOutput]): ProjectState => ({
  id: "project-results", isDemoProject: false, analysisOutputs: outputs,
  numericEvidenceRecords: outputs.flatMap(createNumericEvidenceFromAnalysis), datasets: [], sources: [],
} as unknown as ProjectState);
const approvedSelection: ResultsFindingSelection = {
  resultId: approvedOutput.id, sourceType: "Approved Analysis Output",
  exactFindingText: approvedOutput.summaryText, warnings: [...approvedOutput.warnings!],
};
const tool = (candidate: unknown, select?: (context: any) => Promise<unknown>) => ({
  select: select ?? vi.fn(async () => candidate),
  attribution: { provider: "Configured results-writing provider", model: "configured-model", promptVersion: "results-writing-v1" },
});

const qualitativeWorkflow = (): QualitativeAnalysisWorkflow => ({
  id: "qual-workflow", projectId: "project-results", state: "Researcher Approved",
  approvedBy: { uid: "researcher-1", email: "researcher@example.org" }, approvedAt: timestamp, approvalRationale: "Qualitative findings reviewed.",
  corpus: [{
    id: "doc-1", title: "Transcript", artifactId: "artifact-1", artifactHash: "sha256-transcript", reviewState: "Researcher Reviewed",
    reviewedBy: { uid: "researcher-1", email: "researcher@example.org" }, reviewedAt: timestamp,
    passages: [{ id: "passage-1", documentId: "doc-1", text: "Participants described the process as transparent.", sourceLocation: "Transcript, line four" }],
  }],
  codebookVersions: [{
    id: "codebook-1", version: 1, state: "Researcher Approved", createdAt: timestamp,
    approvedBy: { uid: "researcher-1", email: "researcher@example.org" }, approvedAt: timestamp, approvalRationale: "Codebook reviewed.",
    codes: [{ id: "code-1", label: "Transparency", definition: "Descriptions of transparency.", origin: "Researcher", status: "Researcher Created", createdBy: { uid: "researcher-1", email: "researcher@example.org" } }],
  }],
  codedPassages: [{ id: "coded-1", passageId: "passage-1", codebookVersionId: "codebook-1", assignments: [{ codeId: "code-1", coder: { uid: "researcher-1", email: "researcher@example.org" }, origin: "Researcher" }], reviewState: "Researcher Reviewed", reviewedBy: { uid: "researcher-1", email: "researcher@example.org" }, reviewedAt: timestamp, reviewRationale: "Coding reviewed." }],
  themes: [{ id: "theme-1", name: "Transparency", analyticStatement: "Participants described the process as transparent.", supportingCodedPassageIds: ["coded-1"], supportingQuotations: [{ passageId: "passage-1", quotation: "described the process as transparent" }], origin: "Researcher", status: "Researcher Approved", reviewedBy: { uid: "researcher-1", email: "researcher@example.org" }, reviewedAt: timestamp, reviewRationale: "Theme reviewed." }],
  disagreements: [], reflexiveMemos: [],
});

describe("TQ-VSC-050 ResultsInterpretationAndWritingAgent", () => {
  it("blocks no-data execution before invoking the tool", async () => {
    const select = vi.fn();
    await expect(runResultsInterpretationAndWritingAgent({ explicitUserRequest: true, project: project([]) }, tool({}, select))).rejects.toThrow(/No Approved for Manuscript.*blocked/);
    expect(select).not.toHaveBeenCalled();
  });

  it("ignores unapproved outputs and exposes only exact approved findings and warnings", async () => {
    let received: any;
    const select = vi.fn(async (context: any) => { received = context; return { findings: [approvedSelection], unresolvedInformation: [] }; });
    const proposal = await runResultsInterpretationAndWritingAgent({ explicitUserRequest: true, project: project([unapprovedOutput, approvedOutput]) }, tool({}, select), () => timestamp);
    expect(received.approvedResults).toHaveLength(1);
    expect(received.approvedResults[0]).toEqual(approvedSelection);
    expect(proposal.sourceResultIds).toEqual([approvedOutput.id]);
    expect(proposal.manuscriptDraft).toContain(approvedOutput.summaryText);
    expect(proposal.manuscriptDraft).toContain(approvedOutput.warnings![0]);
    expect(proposal.numericGrounding).toEqual({ valid: true, checkedLocations: ["results"] });
  });

  it("blocks the adversarial request to make p significant", async () => {
    const manipulated = { ...approvedSelection, exactFindingText: "The approved analysis was changed to p = 0.001 and was statistically significant." };
    await expect(runResultsInterpretationAndWritingAgent({ explicitUserRequest: true, project: project() }, tool({ findings: [manipulated], unresolvedInformation: [] }))).rejects.toThrow(/must exactly match/);
  });

  it("rejects altered warnings, hallucinated IDs, and self-approval", () => {
    const approved = collectApprovedManuscriptResults(project());
    expect(() => validateResultsWritingCandidate({ findings: [{ ...approvedSelection, warnings: [] }], unresolvedInformation: [] }, approved)).toThrow(/Warnings.*exactly match/);
    expect(() => validateResultsWritingCandidate({ findings: [{ ...approvedSelection, resultId: "invented-result" }], unresolvedInformation: [] }, approved)).toThrow(/not approved/);
    expect(() => validateResultsWritingCandidate({ findings: [approvedSelection], unresolvedInformation: [], status: "Researcher Approved" }, approved)).toThrow(/cannot self-approve/);
  });

  it("runs numeric grounding after exact finding selection", async () => {
    const withoutEvidence = project(); withoutEvidence.numericEvidenceRecords = [];
    await expect(runResultsInterpretationAndWritingAgent({ explicitUserRequest: true, project: withoutEvidence }, tool({ findings: [approvedSelection], unresolvedInformation: [] }))).rejects.toThrow(/Numeric grounding failed.*0.4/);
  });

  it("consumes attributable approved qualitative findings without quantitative output", async () => {
    const qualitativeProject = project([]); qualitativeProject.qualitativeAnalysis = qualitativeWorkflow();
    const approved = collectApprovedManuscriptResults(qualitativeProject);
    expect(approved).toEqual([{ resultId: "qual-workflow:theme-1", sourceType: "Approved Qualitative Finding", exactFindingText: "Participants described the process as transparent.", warnings: [] }]);
    const proposal = await runResultsInterpretationAndWritingAgent({ explicitUserRequest: true, project: qualitativeProject }, tool({ findings: approved, unresolvedInformation: ["Quantitative effects are not available."] }), () => timestamp);
    expect(proposal.manuscriptDraft).toContain("Participants described the process as transparent.");
    expect(JSON.stringify(proposal)).not.toMatch(/pValues|effectSizes|sampleSize|significant/);
  });

  it("requires separate attributable approval and preserves the AI proposal", async () => {
    const proposal = await runResultsInterpretationAndWritingAgent({ explicitUserRequest: true, project: project() }, tool({ findings: [approvedSelection], unresolvedInformation: [] }), () => timestamp);
    expect(() => approveResultsInterpretationProposal(proposal, { uid: "", email: "" }, "")).toThrow(/attributable researcher/);
    const approved = approveResultsInterpretationProposal(proposal, { uid: "researcher-2", email: "researcher2@example.org" }, "Exact findings and cautions reviewed.", () => "2026-09-10T07:00:00.000Z");
    expect(proposal).toMatchObject({ status: "AI Suggested", reviewState: "Needs Researcher Review" });
    expect(approved).toMatchObject({ status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: "researcher-2" });
  });
});
