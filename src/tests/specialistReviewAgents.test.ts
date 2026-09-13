import { describe, expect, it } from "vitest";
import { runSpecialistReview, SPECIALIST_REVIEWERS } from "../lib/specialistReviewAgents";

describe("specialist review agents", () => {
  it("defines the six bounded reviewer roles", () => expect(SPECIALIST_REVIEWERS).toHaveLength(6));
  it("reports unavailable providers without simulated comments", () => {
    expect(runSpecialistReview("MethodologicalReviewAgent", false)).toEqual({ reviewer: "MethodologicalReviewAgent", status: "Reviewer Unavailable", issues: [] });
  });
  it("keeps available output as a proposal with structured issues", () => {
    const issue = { severity: "Major" as const, manuscriptLocation: "Methods", problem: "Missing", rationale: "Researcher verification required", evidenceOrResultIds: ["result-1"], suggestedCorrection: "Provide source", confidence: "Medium" as const };
    expect(runSpecialistReview("StatisticalReviewAgent", true, [issue])).toMatchObject({ status: "AI Suggested—Needs Researcher Review", issues: [issue] });
  });
});
