import { describe, expect, it } from "vitest";
import { recordResearcherScreeningDecision, runLiteratureScreeningAgent } from "../lib/literatureScreeningAgent";
import type { LiteratureScreeningRecord, ScreeningCriterion, SourceRecord } from "../types";

const timestamp = "2026-09-03T12:00:00.000Z";
const source: SourceRecord = {
  id: "source-1", title: "Randomized exercise intervention", abstract: "Adults received an exercise intervention in a randomized trial.",
  authors: ["Researcher, A"], year: 2025, journalOrVenue: "Observed Journal", documentType: "Journal Article",
  peerReviewStatus: "Unknown", verificationState: "Unverified", relevanceScore: 5, tags: [], stateHistory: [],
};
const criterion = (overrides: Partial<ScreeningCriterion>): ScreeningCriterion => ({
  criterionId: "include-adults", projectId: "project-1", kind: "Include", description: "Adult population", keywords: ["adults"], keywordMatch: "Any",
  approval: { status: "Approved", approvedByUid: "reviewer-1", approvedByEmail: "reviewer@example.test", approvedAt: timestamp }, ...overrides,
});

describe("LiteratureScreeningAgent", () => {
  it("suggests include only when every approved inclusion criterion matches and no exclusion matches", () => {
    const result = runLiteratureScreeningAgent("project-1", source, [criterion({}), criterion({ criterionId: "exclude-animals", kind: "Exclude", keywords: ["animal"] })], () => timestamp);
    expect(result).toMatchObject({ outcome: "Suggested Include", criterionIds: ["include-adults", "exclude-animals"], confidence: 1, status: "AI Proposal — Researcher Review Required" });
    expect(result).not.toHaveProperty("researcherDecision");
  });

  it("suggests exclude when an approved exclusion criterion matches", () => {
    const result = runLiteratureScreeningAgent("project-1", source, [criterion({}), criterion({ criterionId: "exclude-randomized", kind: "Exclude", keywords: ["randomized"] })], () => timestamp);
    expect(result.outcome).toBe("Suggested Exclude");
    expect(result.assessments.find((item) => item.criterionId === "exclude-randomized")?.result).toBe("Matched");
  });

  it("returns uncertain rather than inventing a decision when criteria or deterministic terms are missing", () => {
    expect(runLiteratureScreeningAgent("project-1", source, [], () => timestamp)).toMatchObject({ outcome: "Uncertain", confidence: 0 });
    const result = runLiteratureScreeningAgent("project-1", source, [criterion({ keywords: [] })], () => timestamp);
    expect(result.outcome).toBe("Uncertain");
    expect(result.reasons.join(" ")).toContain("Researcher input required");
  });

  it("keeps title-only screening explicit when the abstract is unavailable", () => {
    const result = runLiteratureScreeningAgent("project-1", { ...source, abstract: undefined }, [criterion({ keywords: ["exercise"] })], () => timestamp);
    expect(result.reasons[0]).toContain("Abstract not available");
  });

  it("requires an attributable, reasoned researcher decision and audits overrides", () => {
    const suggestion = runLiteratureScreeningAgent("project-1", source, [criterion({})], () => timestamp);
    const record: LiteratureScreeningRecord = { sourceId: source.id, suggestion, decisionAudit: [] };
    expect(() => recordResearcherScreeningDecision(record, "Excluded", "", { uid: "reviewer-1", email: "reviewer@example.test" })).toThrow("rationale");
    const decided = recordResearcherScreeningDecision(record, "Excluded", "Population was outside the registered protocol.", { uid: "reviewer-1", email: "reviewer@example.test" }, () => timestamp);
    expect(decided.researcherDecision).toMatchObject({ decision: "Excluded", decidedByUid: "reviewer-1" });
    expect(decided.suggestion).toBe(suggestion);
    expect(decided.decisionAudit).toHaveLength(1);
    expect(decided.decisionAudit[0]).toMatchObject({ previousDecision: null, decision: "Excluded", suggestionOutcome: "Suggested Include", isOverride: true });
  });
});
