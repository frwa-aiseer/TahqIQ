import { describe, expect, it } from "vitest";
import { runEvidenceExtractionAgent, unavailableEvidenceField, validateEvidenceExtractionCandidate, type EvidenceExtractionCandidate } from "../lib/evidenceExtractionAgent";
import type { FullTextChunk } from "../types";

const chunk = (overrides: Partial<FullTextChunk> = {}): FullTextChunk => ({
  chunkId: "chunk-1", projectId: "project-1", sourceId: "source-1", documentHash: "a".repeat(64), documentVersion: "v2", chunkIndex: 0,
  text: "The study included 40 adult participants. The randomized method compared treatment and control. The observed result favored treatment. Follow-up duration was a stated limitation.",
  page: 4, section: "Results", surroundingContext: { sourceBlockId: "block-1", sourceLocation: "page:4;section:Results", characterStart: 0, characterEnd: 165 },
  provenance: { ingestionJobId: "job-1", parserId: "docling", parserVersion: "2.4", extractedBlockId: "block-1" },
  createdAt: "2026-09-06T00:00:00.000Z", isDemo: false, isSynthetic: false, ...overrides,
});

const candidate = (overrides: Partial<EvidenceExtractionCandidate> = {}): EvidenceExtractionCandidate => ({
  proposition: "The observed result favored treatment.",
  passages: [{ chunkId: "chunk-1", exactPassage: "The observed result favored treatment." }],
  context: unavailableEvidenceField(),
  population: { status: "Available", text: "40 adult participants", chunkIds: ["chunk-1"] },
  method: { status: "Available", text: "The randomized method compared treatment and control.", chunkIds: ["chunk-1"] },
  result: { status: "Available", text: "The observed result favored treatment.", chunkIds: ["chunk-1"] },
  limitations: { status: "Available", text: "Follow-up duration was a stated limitation.", chunkIds: ["chunk-1"] },
  relationship: "Supports", confidence: 0.84, ...overrides,
});

describe("EvidenceExtractionAgent", () => {
  it("creates traceable evidence proposals and records that start Needs Researcher Review", async () => {
    const output = await runEvidenceExtractionAgent(
      { projectId: "project-1", questionOrClaim: "Does treatment improve the observed result?", claimId: "claim-1", chunks: [chunk()] },
      { extractorId: "evidence-agent-v1", propose: async () => candidate(), now: () => "2026-09-06T01:00:00.000Z" }
    );
    expect(output).toMatchObject({ projectId: "project-1", sourceId: "source-1", documentHash: "a".repeat(64), documentVersion: "v2", relationship: "Supports", confidence: 0.84, reviewState: "Needs Researcher Review", extractedBy: "evidence-agent-v1" });
    expect(output.passages[0]).toMatchObject({ chunkId: "chunk-1", exactPassage: "The observed result favored treatment.", page: 4, section: "Results", sourceLocation: "page:4;section:Results" });
    expect(output.evidenceRecords[0]).toMatchObject({ sourceId: "source-1", documentHash: "a".repeat(64), documentVersion: "v2", paragraphOrChunkRef: "chunk-1", verification: "Needs Review", researcherReview: { status: "Pending" }, linkedClaimIds: ["claim-1"] });
  });

  it("rejects an invented proposition even when valid chunks are cited", () => {
    expect(() => validateEvidenceExtractionCandidate(candidate({ proposition: "Treatment reduced mortality by 50%." }), [chunk()])).toThrow("Proposition is not supported verbatim");
  });

  it("rejects invented population, context, method, result and limitation fields", () => {
    for (const field of ["context", "population", "method", "result", "limitations"] as const) {
      expect(() => validateEvidenceExtractionCandidate(candidate({ [field]: { status: "Available", text: "An unsupported fabricated detail.", chunkIds: ["chunk-1"] } }), [chunk()])).toThrow("not supported verbatim");
    }
  });

  it("rejects non-exact passages and chunk IDs outside the supplied set", () => {
    expect(() => validateEvidenceExtractionCandidate(candidate({ passages: [{ chunkId: "chunk-1", exactPassage: "A passage not present in the document." }] }), [chunk()])).toThrow("not an exact passage");
    expect(() => validateEvidenceExtractionCandidate(candidate({ passages: [{ chunkId: "unknown", exactPassage: "The observed result favored treatment." }] }), [chunk()])).toThrow("not an exact passage");
  });

  it("requires explicit missing states without invented text or evidence links", () => {
    expect(() => validateEvidenceExtractionCandidate(candidate({ context: { status: "Not Available", text: "Likely a clinical setting.", chunkIds: [] } }), [chunk()])).toThrow("missing state must remain explicit");
    expect(() => validateEvidenceExtractionCandidate(candidate({ context: { status: "Not Available", text: "Not available in supplied chunks.", chunkIds: ["chunk-1"] } }), [chunk()])).toThrow("must not cite chunks");
    expect(validateEvidenceExtractionCandidate(candidate(), [chunk()]).context).toEqual(unavailableEvidenceField());
  });

  it("rejects mixed provenance inputs before invoking the extraction tool", async () => {
    let called = false;
    await expect(runEvidenceExtractionAgent(
      { projectId: "project-1", questionOrClaim: "Question", chunks: [chunk(), chunk({ chunkId: "chunk-2", sourceId: "other-source" })] },
      { extractorId: "agent", propose: async () => { called = true; return candidate(); } }
    )).rejects.toThrow("share project, source, document hash, and document version");
    expect(called).toBe(false);
  });

  it("rejects malformed relationships, confidence and extra output fields", () => {
    expect(() => validateEvidenceExtractionCandidate({ ...candidate(), relationship: "Proves" }, [chunk()])).toThrow("relationship");
    expect(() => validateEvidenceExtractionCandidate({ ...candidate(), confidence: 1.2 }, [chunk()])).toThrow("confidence");
    expect(() => validateEvidenceExtractionCandidate({ ...candidate(), unsupportedFact: "invented" }, [chunk()])).toThrow("structured contract");
  });
});
