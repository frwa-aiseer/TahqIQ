import { describe, expect, it } from "vitest";
import { isAnalysisOutputApproved } from "../lib/aiValidationService";
import { transitionAnalysisOutput } from "../lib/analysisLifecycle";
import { isValidTransition } from "../lib/stateMachines";
import type { AnalysisOutput } from "../types";

const actor = { uid: "researcher-1", email: "researcher@example.org" };
const completed = (overrides: Partial<AnalysisOutput> = {}) => ({
  id: "out-1", analysisPlanId: "plan-1", planId: "plan-1", datasetHash: "dataset-hash",
  executionStatus: "Completed", state: "Completed", isResearcherSupplied: false,
  reproductionStatus: "Independently Reproduced", isReproduced: true, ...overrides,
} as AnalysisOutput);

describe("TQ-VSC-006 analysis lifecycle", () => {
  it("defines the required ordered lifecycle without shortcut transitions", () => {
    const states = ["Draft Plan", "Awaiting Approval", "Approved", "Queued", "Running", "Completed", "QC Passed", "Researcher Reviewed", "Approved for Manuscript", "Locked"];
    states.slice(0, -1).forEach((state, index) => expect(isValidTransition("Analysis", state, states[index + 1])).toBe(true));
    expect(isValidTransition("Analysis", "Completed", "Approved for Manuscript")).toBe(false);
    expect(isValidTransition("Analysis", "QC Passed", "Approved for Manuscript")).toBe(false);
  });

  it("never treats Completed, QC Passed, or a legacy boolean as manuscript approval", () => {
    expect(isAnalysisOutputApproved(completed())).toBe(false);
    expect(isAnalysisOutputApproved(completed({ state: "QC Passed" }))).toBe(false);
    expect(isAnalysisOutputApproved(completed({ state: "QC Passed", isApproved: true }))).toBe(false);
  });

  it("requires the ordered QC and human-review lifecycle", () => {
    const qc = transitionAnalysisOutput(completed(), "QC Passed", { uid: "tehqiq-qc", email: "system@tehqiq.local" }, "QC complete", "system");
    expect(isAnalysisOutputApproved(qc)).toBe(false);
    const reviewed = transitionAnalysisOutput(qc, "Researcher Reviewed", actor, "Reviewed diagnostics and output", "human");
    expect(isAnalysisOutputApproved(reviewed)).toBe(false);
    const approved = transitionAnalysisOutput(reviewed, "Approved for Manuscript", actor, "Approved for empirical manuscript use", "human");
    expect(isAnalysisOutputApproved(approved)).toBe(true);
    expect(approved.researcherApproval).toMatchObject({ actor, rationale: "Approved for empirical manuscript use", outputId: "out-1", datasetHash: "dataset-hash", planId: "plan-1" });
    expect(approved.researcherApproval?.timestamp).toBeTruthy();
    const locked = transitionAnalysisOutput(approved, "Locked", actor, "Locked approved output", "human");
    expect(isAnalysisOutputApproved(locked)).toBe(true);
  });

  it("prevents automated QC from granting researcher states", () => {
    expect(() => transitionAnalysisOutput(completed({ state: "QC Passed" }), "Researcher Reviewed", { uid: "qc", email: "system@tehqiq.local" }, "automatic", "system"))
      .toThrow(/authenticated researcher/i);
  });

  it("rejects approval state without a matching attributable record", () => {
    expect(isAnalysisOutputApproved(completed({ state: "Approved for Manuscript" }))).toBe(false);
    expect(isAnalysisOutputApproved(completed({ state: "Approved for Manuscript", researcherApproval: {
      actor, timestamp: new Date().toISOString(), rationale: "Reviewed", outputId: "different-output",
      datasetHash: "dataset-hash", planId: "plan-1",
    } }))).toBe(false);
  });

  it("preserves imported-output provenance through approval", () => {
    let output = completed({ isResearcherSupplied: true, isReproduced: false, reproductionStatus: "Not Independently Reproduced" });
    output = transitionAnalysisOutput(output, "QC Passed", { uid: "tehqiq-qc", email: "system@tehqiq.local" }, "QC complete", "system");
    output = transitionAnalysisOutput(output, "Researcher Reviewed", actor, "Reviewed supplied output", "human");
    output = transitionAnalysisOutput(output, "Approved for Manuscript", actor, "Approved with reproduction limitation retained", "human");
    expect(output).toMatchObject({ isResearcherSupplied: true, isReproduced: false, reproductionStatus: "Not Independently Reproduced" });
    expect(isAnalysisOutputApproved(output)).toBe(true);
  });
});
