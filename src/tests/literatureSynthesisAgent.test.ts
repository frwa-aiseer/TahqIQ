import { describe, expect, it } from "vitest";
import { runLiteratureSynthesisAgent, validateLiteratureSynthesisCandidate, type LiteratureSynthesisCandidate } from "../lib/literatureSynthesisAgent";
import type { EvidenceRecord } from "../types";

const evidence = (id: string, overrides: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  evidenceId: id, sourceId: `source-${id}`, documentVersion: "v1", documentHash: id.padEnd(64, "a").slice(0, 64),
  exactPassage: `Exact reviewed passage for ${id}.`, page: "2", section: "Results", paragraphOrChunkRef: `chunk-${id}`,
  extractionMethod: "AI Extracted", extractedBy: "extractor", confidence: 0.8, verification: "Researcher Verified",
  researcherReview: { status: "Verified", reviewedBy: "researcher-1", reviewedAt: "2026-09-06T00:00:00.000Z", notes: "Checked against source." },
  linkedClaimIds: [], createdAt: "2026-09-06T00:00:00.000Z", updatedAt: "2026-09-06T00:00:00.000Z", ...overrides,
});

const grounded = (text: string, supportingEvidenceIds = ["ev-1"], conflictingEvidenceIds: string[] = []) => ({
  text, classification: "Evidence-Grounded" as const, supportingEvidenceIds, conflictingEvidenceIds,
});
const candidate = (): LiteratureSynthesisCandidate => ({
  themes: [grounded("A recurring reviewed theme.")],
  methodologicalDifferences: [grounded("The reviewed methods differ.", ["ev-1"], ["ev-2"])],
  contextDifferences: [grounded("The reviewed contexts differ.", ["ev-2"])],
  limitations: [grounded("A limitation was reported.", ["ev-1"])],
  unresolvedQuestions: [{ text: "Whether this pattern generalizes remains unresolved.", classification: "Interpretation", supportingEvidenceIds: ["ev-1"], conflictingEvidenceIds: [] }],
  candidateSynthesisStatements: [{ text: "Future evidence may test broader applicability.", classification: "Hypothesis", supportingEvidenceIds: [], conflictingEvidenceIds: [] }],
});

describe("LiteratureSynthesisAgent", () => {
  const reviewed = [evidence("ev-1"), evidence("ev-2")];

  it("creates a review-required structured synthesis with evidence links", async () => {
    const output = await runLiteratureSynthesisAgent(
      { projectId: "project-1", researchQuestion: "What does the reviewed evidence indicate?", evidenceRecords: reviewed },
      { synthesizerId: "literature-synthesis-agent-v1", propose: async () => candidate(), now: () => "2026-09-06T01:00:00.000Z" }
    );
    expect(output).toMatchObject({ projectId: "project-1", reviewState: "Needs Researcher Review", synthesizedBy: "literature-synthesis-agent-v1", sourceEvidenceIds: ["ev-1", "ev-2"] });
    expect(output.themes[0]).toMatchObject({ classification: "Evidence-Grounded", supportingEvidenceIds: ["ev-1"], conflictingEvidenceIds: [], itemId: expect.stringMatching(/^synthesis-item-/) });
    expect(output.methodologicalDifferences[0]).toMatchObject({ supportingEvidenceIds: ["ev-1"], conflictingEvidenceIds: ["ev-2"] });
    expect(output.candidateSynthesisStatements[0]).toMatchObject({ classification: "Hypothesis", supportingEvidenceIds: [] });
  });

  it.each(["themes", "methodologicalDifferences", "contextDifferences", "limitations", "unresolvedQuestions", "candidateSynthesisStatements"] as const)(
    "requires evidence IDs for factual %s items",
    (collection) => {
      const value = candidate();
      value[collection] = [grounded("Unsupported factual statement.", [], [])];
      expect(() => validateLiteratureSynthesisCandidate(value, reviewed)).toThrow("factual but has no evidence IDs");
    }
  );

  it("allows unsupported content only when explicitly labeled Interpretation or Hypothesis", () => {
    const value = candidate();
    value.unresolvedQuestions = [{ text: "Interpretive question requiring future evaluation.", classification: "Interpretation", supportingEvidenceIds: [], conflictingEvidenceIds: [] }];
    value.candidateSynthesisStatements = [{ text: "A testable future proposition.", classification: "Hypothesis", supportingEvidenceIds: [], conflictingEvidenceIds: [] }];
    const validated = validateLiteratureSynthesisCandidate(value, reviewed);
    expect(validated.unresolvedQuestions[0].classification).toBe("Interpretation");
    expect(validated.candidateSynthesisStatements[0].classification).toBe("Hypothesis");
  });

  it("rejects unknown, unverified, or dual-labeled evidence IDs", () => {
    const unknown = candidate();
    unknown.themes[0].supportingEvidenceIds = ["not-supplied"];
    expect(() => validateLiteratureSynthesisCandidate(unknown, reviewed)).toThrow("only supplied researcher-verified evidence IDs");
    const dual = candidate();
    dual.themes[0].conflictingEvidenceIds = ["ev-1"];
    expect(() => validateLiteratureSynthesisCandidate(dual, reviewed)).toThrow("both supporting and conflicting");
  });

  it("rejects unreviewed evidence before invoking the synthesis tool", async () => {
    let called = false;
    await expect(runLiteratureSynthesisAgent(
      { projectId: "project-1", researchQuestion: "Question", evidenceRecords: [evidence("ev-pending", { verification: "Needs Review", researcherReview: { status: "Pending" } })] },
      { synthesizerId: "agent", propose: async () => { called = true; return candidate(); } }
    )).rejects.toThrow("Only attributable researcher-verified EvidenceRecords");
    expect(called).toBe(false);
  });

  it("rejects researcher-verified labels without attributable review metadata", async () => {
    await expect(runLiteratureSynthesisAgent(
      { projectId: "project-1", researchQuestion: "Question", evidenceRecords: [evidence("ev-forged", { researcherReview: { status: "Verified" } })] },
      { synthesizerId: "agent", propose: async () => candidate() }
    )).rejects.toThrow("ev-forged");
  });

  it("rejects schema extensions, invalid classifications, and duplicate evidence identities", () => {
    expect(() => validateLiteratureSynthesisCandidate({ ...candidate(), unsupportedClaims: [] }, reviewed)).toThrow("structured contract");
    const invalid = candidate() as unknown as Record<string, unknown>;
    (invalid.themes as Array<Record<string, unknown>>)[0].classification = "Fact";
    expect(() => validateLiteratureSynthesisCandidate(invalid, reviewed)).toThrow("invalid classification");
    expect(() => validateLiteratureSynthesisCandidate(candidate(), [reviewed[0], reviewed[0]])).toThrow("uniquely identified");
  });
});
