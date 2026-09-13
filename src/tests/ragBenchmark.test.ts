import { describe, expect, it } from "vitest";
import { benchmarkEvidenceRetrieval } from "../lib/evidenceRetrievalService";
describe("RAG benchmark regression", () => {
  it("produces repeatable machine-readable recall, precision, provenance and wrong-source metrics", () => {
    const chunks: any[] = ["trial consent", "weather forecast"].map((text, i) => ({ chunkId: `c${i}`, projectId: "p", sourceId: `s${i}`, documentHash: `h${i}`, documentVersion: "v1", chunkIndex: i, text, surroundingContext: {}, provenance: {}, createdAt: "2026-01-01", isDemo: false, isSynthetic: false }));
    const result = benchmarkEvidenceRetrieval([{ id: "q1", query: "trial consent", relevantChunkIds: ["c0"] }], chunks, 1);
    expect(result).toMatchObject({ cases: 1, k: 1, recallAtK: 1, precisionAtK: 1, provenanceRetentionRate: 1, wrongSourceRate: 0 });
  });
});
