import { describe, expect, it } from "vitest";
import { runResearchGapAgent, validateResearchGapCandidates, type ResearchGapAgentInput, type ResearchGapCandidate } from "../lib/researchGapAgent";
import type { LiteratureSynthesisItem, ReviewedEvidenceContradictionGroup, ReviewedLiteratureSynthesis } from "../types";

const item = (itemId: string, text: string, evidenceIds = ["ev-1"]): LiteratureSynthesisItem => ({
  itemId, text, classification: "Evidence-Grounded", supportingEvidenceIds: evidenceIds, conflictingEvidenceIds: [],
});
const limitation = item("limitation-1", "The reviewed evidence reports limited follow-up.");
const context = item("context-1", "The reviewed evidence represents one recorded setting.", ["ev-2"]);
const synthesis: ReviewedLiteratureSynthesis = {
  synthesisId: "synthesis-1", projectId: "project-1", researchQuestion: "What remains uncertain?",
  themes: [item("theme-1", "A reviewed theme.")], methodologicalDifferences: [], contextDifferences: [context], limitations: [limitation],
  unresolvedQuestions: [], candidateSynthesisStatements: [], sourceEvidenceIds: ["ev-1", "ev-2"],
  reviewState: "Researcher Reviewed", researcherReview: { reviewedByUid: "researcher-1", reviewedAt: "2026-09-06T01:00:00.000Z", rationale: "Checked against verified evidence." },
  createdAt: "2026-09-06T00:00:00.000Z", synthesizedBy: "agent",
};
const contradiction: ReviewedEvidenceContradictionGroup = {
  groupId: "contradiction-1", projectId: "project-1", topic: "Differing patterns", supportingEvidenceIds: ["ev-1"], contradictoryEvidenceIds: ["ev-3"],
  contextualReasons: [{ text: "Contexts differ.", evidenceIds: ["ev-1", "ev-3"] }], methodologicalReasons: [], uncertainty: { text: "Explanation remains uncertain.", evidenceIds: ["ev-1", "ev-3"] },
  reviewState: "Researcher Reviewed", researcherReview: { reviewedByUid: "researcher-1", reviewedAt: "2026-09-06T02:00:00.000Z", rationale: "Comparison reviewed." },
  createdAt: "2026-09-06T00:00:00.000Z", detectedBy: "agent",
};
const input = (overrides: Partial<ResearchGapAgentInput> = {}): ResearchGapAgentInput => ({
  projectId: "project-1", reviewedSynthesis: synthesis, reviewedContradictions: [contradiction], limitations: [limitation], context: [context], ...overrides,
});
const candidate = (overrides: Partial<ResearchGapCandidate> = {}): ResearchGapCandidate => ({
  gapStatement: "Within the reviewed evidence, longer follow-up in additional recorded settings remains insufficiently addressed.",
  type: "Temporal", supportingEvidenceIds: ["ev-1", "ev-2"], contradictingEvidenceIds: ["ev-3"], confidence: 0.72,
  caution: "This observation is limited to the supplied reviewed evidence and does not establish universal novelty.",
  newResearchAddressesIt: "A preregistered study could evaluate longer follow-up across additional settings.", ...overrides,
});

describe("ResearchGapAgent", () => {
  it("creates evidence-linked AI Suggested gap proposals from reviewed inputs", async () => {
    const result = await runResearchGapAgent(input(), { generatorId: "research-gap-agent-v1", propose: async () => [candidate()], now: () => "2026-09-06T03:00:00.000Z" });
    expect(result[0]).toMatchObject({ gapId: expect.stringMatching(/^gap-proposal-/), projectId: "project-1", type: "Temporal", supportingEvidenceIds: ["ev-1", "ev-2"], contradictingEvidenceIds: ["ev-3"], confidence: 0.72, status: "AI Suggested", sourceSynthesisId: "synthesis-1", sourceContradictionGroupIds: ["contradiction-1"], generatedBy: "research-gap-agent-v1" });
  });

  it.each([
    "No study has ever evaluated this topic.", "This has never been studied.", "This is the first-ever investigation.",
    "The topic is completely unexplored.", "Nothing is known about this topic.", "No studies exist for this question.",
  ])("rejects unsupported universal gap claim: %s", (gapStatement) => {
    expect(() => validateResearchGapCandidates([candidate({ gapStatement })], new Set(["ev-1", "ev-2", "ev-3"]))).toThrow("unsupported universal gap claim");
  });

  it("requires the gap claim to be scoped to reviewed evidence", () => {
    expect(() => validateResearchGapCandidates([candidate({ gapStatement: "Longer follow-up remains insufficiently addressed." })], new Set(["ev-1", "ev-2", "ev-3"]))).toThrow("must scope the claim");
  });

  it("requires supporting evidence and rejects unknown or dual-labeled IDs", () => {
    const allowed = new Set(["ev-1", "ev-2", "ev-3"]);
    expect(() => validateResearchGapCandidates([candidate({ supportingEvidenceIds: [] })], allowed)).toThrow("cannot be empty");
    expect(() => validateResearchGapCandidates([candidate({ supportingEvidenceIds: ["unknown"] })], allowed)).toThrow("supplied reviewed evidence IDs");
    expect(() => validateResearchGapCandidates([candidate({ contradictingEvidenceIds: ["ev-1"] })], allowed)).toThrow("both supporting and contradicting");
  });

  it("rejects unreviewed or unattributed synthesis and contradictions before generation", async () => {
    let called = false;
    const propose = async () => { called = true; return [candidate()]; };
    await expect(runResearchGapAgent(input({ reviewedSynthesis: { ...synthesis, researcherReview: { ...synthesis.researcherReview, reviewedByUid: "" } } }), { generatorId: "agent", propose })).rejects.toThrow("attributable researcher review");
    await expect(runResearchGapAgent(input({ reviewedContradictions: [{ ...contradiction, researcherReview: { ...contradiction.researcherReview, rationale: "" } }] }), { generatorId: "agent", propose })).rejects.toThrow("attributable researcher review");
    expect(called).toBe(false);
  });

  it("rejects limitations or context not copied unchanged from reviewed synthesis", async () => {
    await expect(runResearchGapAgent(input({ limitations: [{ ...limitation, text: "Invented limitation." }] }), { generatorId: "agent", propose: async () => [candidate()] })).rejects.toThrow("unchanged items from the reviewed synthesis");
    await expect(runResearchGapAgent(input({ context: [item("unknown-context", "Unknown context.")] }), { generatorId: "agent", propose: async () => [candidate()] })).rejects.toThrow("unchanged items from the reviewed synthesis");
  });

  it("rejects malformed types, confidence, and extra output fields", () => {
    const allowed = new Set(["ev-1", "ev-2", "ev-3"]);
    expect(() => validateResearchGapCandidates([{ ...candidate(), type: "Universal" }], allowed)).toThrow("invalid type");
    expect(() => validateResearchGapCandidates([{ ...candidate(), confidence: 2 }], allowed)).toThrow("confidence");
    expect(() => validateResearchGapCandidates([{ ...candidate(), proof: "absolute" }], allowed)).toThrow("structured contract");
  });
});
