import { describe, expect, it } from "vitest";
import {
  METHODOLOGY_KEYS,
  parseAndValidateModelJson,
  validateAgentRequest,
  validateAgentModelOutput,
  validateAnalysisRequest,
  validateDoiRequest,
  validateDraftSectionModelOutput,
  validateDraftSectionRequest,
  validateMethodologyModelOutput,
  validateMethodologyRequest,
  validatePeerReviewModelOutput,
  validatePeerReviewRequest,
} from "../server/apiSchemas";

describe("server API runtime schemas", () => {
  it("rejects malformed and unsupported fields across non-audit request contracts", () => {
    expect(validateAgentRequest({ agentType: "Agent", prompt: "", context: {}, role: "Owner" }).valid).toBe(false);
    expect(validateDraftSectionRequest({ sectionTitle: "Results", canvas: {}, sources: "all", claims: [], analysisOutputs: [] }).valid).toBe(false);
    expect(validatePeerReviewRequest({ reviewerRole: "Invented Reviewer", sections: [], sources: [], analysisOutputs: [] }).valid).toBe(false);
    expect(validateDoiRequest({ doi: "not-a-doi" }).valid).toBe(false);
  });

  it("rejects malformed privileged analysis requests", () => {
    expect(validateAnalysisRequest({ dataset: { id: "d" }, plan: { id: "p" }, role: "Owner" }).valid).toBe(false);
    expect(validateAnalysisRequest({
      dataset: { id: "d", filename: "data.csv", fileHash: "hash", uploadDate: "2026-01-01", recordCount: 1,
        variableCount: 1, variables: [], missingnessPercent: 0, isAnonymizedConfirmed: true, rawPreview: [{ y: 1 }] },
      plan: { id: "p", title: "Plan", researchQuestionId: "rq", outcomeVariable: "y", predictorVariables: ["x"],
        statisticalMethod: "Paired t-test", assumptions: ["Normality"], effectSizeMeasure: "Cohen d",
        significanceThreshold: 0.05, missingDataStrategy: "Complete cases", status: "Approved", isPreregistered: false },
      options: {},
    }).valid).toBe(true);
  });

  it("requires methodology body scope to match authenticated project scope", () => {
    expect(validateMethodologyRequest({ projectId: "other-project", projectContext: {} }, "project-1").valid).toBe(false);
    expect(validateMethodologyRequest({ projectId: "project-1", projectContext: {} }, "project-1").valid).toBe(true);
  });

  it("rejects invalid JSON instead of accepting a prompt-only structured claim", () => {
    expect(parseAndValidateModelJson("not-json", validateAgentModelOutput)).toEqual({ valid: false, errors: ["Model returned invalid JSON."] });
  });

  it("rejects structurally malformed agent JSON", () => {
    const malformed = JSON.stringify({ summary: "text", proposals: "not-an-array", missingInformationFlags: [], evidenceIds: [] });
    expect(parseAndValidateModelJson(malformed, validateAgentModelOutput).valid).toBe(false);
  });

  it("rejects draft JSON with missing evidence arrays or non-finite numbers", () => {
    expect(validateDraftSectionModelOutput({ title: "Draft", content: "Text" }).valid).toBe(false);
    expect(validateDraftSectionModelOutput({ title: "Draft", content: "Text", citationsUsed: [], evidenceUsed: [], numbersUsed: [Infinity], missingInformationFlags: [] }).valid).toBe(false);
  });

  it("rejects empty or malformed peer-review model comments", () => {
    expect(validatePeerReviewModelOutput({ comments: [] }).valid).toBe(false);
    expect(validatePeerReviewModelOutput({ comments: [{ agentRole: "Reviewer" }] }).valid).toBe(false);
  });

  it("requires every methodology field and does not fill missing model output", () => {
    expect(validateMethodologyModelOutput({ design: "Proposal" }).valid).toBe(false);
    const complete = Object.fromEntries(METHODOLOGY_KEYS.map((key) => [key, "Researcher input required"]));
    expect(validateMethodologyModelOutput(complete).valid).toBe(true);
  });
});
