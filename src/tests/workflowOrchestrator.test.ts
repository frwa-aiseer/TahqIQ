import { describe, expect, it } from "vitest";
import { workflowOrchestrator, type ArtifactState, type WorkflowArtifact, type WorkflowKind, type WorkflowRunRequest } from "../server/workflowOrchestrator";

const artifact = (key: string, state: ArtifactState = "Researcher Approved", source: WorkflowArtifact["source"] = "TehqIQ Workflow"): WorkflowArtifact => ({ key, state, source });
const plan = (overrides: Partial<WorkflowRunRequest>): ReturnType<typeof workflowOrchestrator.plan> => workflowOrchestrator.plan({
  projectId: "project-1", workflowKind: "Empirical", stage: "Intake", agentId: "research-intake", role: "Owner",
  artifacts: [artifact("researchDescription", "Available", "Researcher Input")], ...overrides,
});

describe("deterministic WorkflowOrchestrator", () => {
  it("permits a complete empirical methodology route and never chains another agent", () => {
    const result = plan({ stage: "Methodology", agentId: "methodology-design", artifacts: [
      artifact("approvedResearchQuestion"), artifact("approvedObjectives"), artifact("confirmedClassification"),
      artifact("reviewedEvidence"), artifact("approvedGap"), artifact("researcherFacts", "Available", "Researcher Input"), artifact("confirmedReportingGuidance"),
    ] });
    expect(result.permitted).toBe(true);
    if (result.permitted) {
      expect(result.outputStorage).toBe("workflow/methodology/proposals");
      expect(result.outputStatus).toBe("AI Suggested");
      expect(result.approvalRequired).toBe(true);
      expect(result.automaticNextAgent).toBeNull();
    }
  });

  it("supports systematic-review entry with researcher-uploaded literature", () => {
    const result = plan({ workflowKind: "Systematic Review", stage: "Literature", agentId: "screening", artifacts: [
      artifact("retrievedSources", "Available", "Researcher Upload"), artifact("approvedScreeningCriteria"),
    ] });
    expect(result.permitted).toBe(true);
  });

  it("supports a qualitative results route with approved qualitative findings", () => {
    const result = plan({ workflowKind: "Qualitative", stage: "Results", agentId: "results-interpretation-writing", artifacts: [
      artifact("approvedQualitativeFindings"),
    ] });
    expect(result.permitted).toBe(true);
  });

  it.each<[WorkflowKind, WorkflowArtifact["source"]]>([
    ["Existing Dataset", "Researcher Upload"],
    ["Existing Methodology", "Researcher Input"],
  ])("supports flexible %s entry at analysis when governed prerequisites exist", (workflowKind, source) => {
    const result = plan({ workflowKind, stage: "Analysis", agentId: "analysis-planning", artifacts: [
      artifact("approvedMethodology", "Researcher Approved", source), artifact("datasetProfile", "Verified", "Researcher Upload"),
      artifact("variableDictionary", "Verified", "Researcher Upload"), artifact("approvedResearchQuestions"),
      artifact("confirmedClassification"), artifact("analysisMethodCapabilities", "Verified"),
    ] });
    expect(result.permitted).toBe(true);
  });

  it("reports missing and insufficiently reviewed prerequisites without dispatching", () => {
    const result = plan({ stage: "Analysis", agentId: "analysis-planning", artifacts: [artifact("approvedMethodology", "Available")] });
    expect(result).toMatchObject({ permitted: false, agentId: "analysis-planning" });
    if (result.permitted === false) {
      expect(result.missingPrerequisites).toContain("approvedMethodology: requires Researcher Approved or Approved for Manuscript");
      expect(result.missingPrerequisites.some((item) => item.startsWith("datasetProfile:"))).toBe(true);
    }
  });

  it("blocks wrong stages, workflow types, roles, extra inputs, and duplicate artifacts", () => {
    expect(plan({ stage: "Writing" }).permitted).toBe(false);
    expect(plan({ workflowKind: "Existing Dataset", stage: "Literature", agentId: "search-planning", artifacts: [] }).permitted).toBe(false);
    expect(plan({ role: "Viewer" }).permitted).toBe(false);
    expect(plan({ artifacts: [artifact("researchDescription", "Available"), artifact("rawDataset", "Available")] }).permitted).toBe(false);
    expect(plan({ artifacts: [artifact("researchDescription", "Available"), artifact("researchDescription", "Available")] }).permitted).toBe(false);
    expect(plan({ agentId: "arbitrary-agent" as WorkflowRunRequest["agentId"] }).permitted).toBe(false);
  });

  it("requires approved-for-manuscript quantitative outputs and keeps deterministic outputs review-gated", () => {
    expect(plan({ stage: "Results", agentId: "results-interpretation-writing", artifacts: [
      artifact("approvedAnalysisOutputs", "Researcher Approved"), artifact("numericEvidence", "Verified"),
    ] }).permitted).toBe(false);
    const exportPlan = plan({ stage: "Export", agentId: "export", artifacts: [
      artifact("approvedManuscript"), artifact("verifiedReferences", "Verified"), artifact("approvedFigures"),
      artifact("approvedTables"), artifact("exportConfiguration", "Available"),
    ] });
    expect(exportPlan.permitted).toBe(true);
    if (exportPlan.permitted) expect(exportPlan.outputStatus).toBe("Needs Researcher Review");
  });
});
