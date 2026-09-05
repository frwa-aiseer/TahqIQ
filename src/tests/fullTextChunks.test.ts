import { describe, expect, it } from "vitest";
import { createFullTextChunks, traceChunkToDocumentLocation } from "../lib/fullTextChunks";
import type { DocumentIngestionJob } from "../types";

const hash = "a".repeat(64);
const job = (overrides: Partial<DocumentIngestionJob> = {}): DocumentIngestionJob => ({
  jobId: "job-1", projectId: "project-1", artifactId: "artifact-1", filename: "paper.pdf", mimeType: "application/pdf",
  sizeBytes: 100, sha256: hash, formatCategory: "PDF", status: "Parsed",
  statusHistory: [], parserProvenance: { parserId: "docling", parserVersion: "2.4.0", executedAt: "2026-09-06T00:00:00.000Z", deterministic: false },
  extractedBlocks: [
    { blockId: "block-1", blockType: "Text", text: "Methods paragraph from the uploaded document.", sourceLocation: "page:2;section:Methods", parserId: "docling", pageNumber: 2, section: "Methods" },
    { blockId: "table-1", blockType: "Table", rows: [{ measure: "Observed", value: "Recorded" }], sourceLocation: "page:3;table:Table 1", parserId: "docling", pageNumber: 3, section: "Results", tableReference: "Table 1" },
  ], warnings: [], errors: [], createdAt: "2026-09-06T00:00:00.000Z", updatedAt: "2026-09-06T00:00:00.000Z",
  createdByUid: "researcher-1", isDemo: false, isSynthetic: false, ...overrides,
});

describe("provenance-preserving full-text chunks", () => {
  it("retains source, document, location, index and parser provenance for every chunk", async () => {
    const originalJob = job();
    const result = await createFullTextChunks({ job: originalJob, sourceId: "source-1", documentVersion: "accepted-v2" }, () => "2026-09-06T01:00:00.000Z");
    expect(result.chunks).toHaveLength(2);
    result.chunks.forEach((chunk, index) => {
      expect(chunk).toMatchObject({ projectId: "project-1", sourceId: "source-1", documentHash: hash, documentVersion: "accepted-v2", chunkIndex: index, provenance: { ingestionJobId: "job-1", parserId: "docling", parserVersion: "2.4.0" } });
      expect(chunk.surroundingContext.sourceLocation).not.toBe("Not available");
      expect(traceChunkToDocumentLocation(chunk, originalJob)).not.toBeNull();
    });
    expect(result.chunks[0]).toMatchObject({ page: 2, section: "Methods", surroundingContext: { sourceBlockId: "block-1", nextChunkId: result.chunks[1].chunkId } });
    expect(result.chunks[1].surroundingContext.previousChunkId).toBe(result.chunks[0].chunkId);
  });

  it("deterministically splits long blocks with linked surrounding context", async () => {
    const text = Array.from({ length: 90 }, (_, index) => `word${index}`).join(" ");
    const originalJob = job({ extractedBlocks: [{ blockId: "long", blockType: "Text", text, sourceLocation: "page:8;section:Discussion", parserId: "docling", pageNumber: 8, section: "Discussion" }] });
    const first = await createFullTextChunks({ job: originalJob, sourceId: "source-1", documentVersion: "v1", maxCharacters: 220, overlapCharacters: 20 }, () => "2026-09-06T01:00:00.000Z");
    const second = await createFullTextChunks({ job: originalJob, sourceId: "source-1", documentVersion: "v1", maxCharacters: 220, overlapCharacters: 20 }, () => "2026-09-06T02:00:00.000Z");
    expect(first.chunks.length).toBeGreaterThan(2);
    expect(first.chunks.map((chunk) => chunk.chunkId)).toEqual(second.chunks.map((chunk) => chunk.chunkId));
    expect(first.chunks.every((chunk) => traceChunkToDocumentLocation(chunk, originalJob)?.blockId === "long")).toBe(true);
  });

  it("preserves timestamp locations for transcript-derived blocks", async () => {
    const mediaJob = job({ filename: "interview.mp3", formatCategory: "Audio", status: "Requires Review", parserProvenance: { parserId: "whisper", parserVersion: "3.1", executedAt: "2026-09-06", deterministic: false }, extractedBlocks: [{ blockId: "segment-1", blockType: "Text", text: "Exact observed transcript segment.", sourceLocation: "time:4.5-8", parserId: "whisper", startSeconds: 4.5, endSeconds: 8 }] });
    const result = await createFullTextChunks({ job: mediaJob, sourceId: "source-media", documentVersion: "transcript-v1" });
    expect(result.chunks[0]).toMatchObject({ startSeconds: 4.5, endSeconds: 8, surroundingContext: { sourceLocation: "time:4.5-8" } });
    expect(traceChunkToDocumentLocation(result.chunks[0], mediaJob)).not.toBeNull();
  });

  it("skips blocks that cannot trace to text and an original location", async () => {
    const result = await createFullTextChunks({ job: job({ extractedBlocks: [
      { blockId: "image", blockType: "Image", sourceLocation: "page:1;image:Figure 1", parserId: "docling", pageNumber: 1 },
      { blockId: "unlocated", blockType: "Text", text: "Text without location", sourceLocation: "Not available", parserId: "docling" },
    ] }), sourceId: "source-1", documentVersion: "v1" });
    expect(result.chunks).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining("image has no text"), expect.stringContaining("unlocated has no original document location")]));
  });

  it("rejects non-traceable job state, hash, version and parser provenance", async () => {
    await expect(createFullTextChunks({ job: job({ status: "Failed" }), sourceId: "source-1", documentVersion: "v1" })).rejects.toThrow("parsed or review-required");
    await expect(createFullTextChunks({ job: job({ sha256: "not-a-hash" }), sourceId: "source-1", documentVersion: "v1" })).rejects.toThrow("SHA-256");
    await expect(createFullTextChunks({ job: job(), sourceId: "source-1", documentVersion: "" })).rejects.toThrow("document version");
    await expect(createFullTextChunks({ job: job({ parserProvenance: undefined }), sourceId: "source-1", documentVersion: "v1" })).rejects.toThrow("Parser provenance");
  });

  it("detects location or text tampering and contains no embedding-model dependency", async () => {
    const originalJob = job();
    const result = await createFullTextChunks({ job: originalJob, sourceId: "source-1", documentVersion: "v1" });
    expect(traceChunkToDocumentLocation({ ...result.chunks[0], text: "Changed text" }, originalJob)).toBeNull();
    expect(JSON.stringify(result.chunks)).not.toMatch(/embedding|vector|modelId/i);
  });
});
