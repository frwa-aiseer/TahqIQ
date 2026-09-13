import { describe, expect, it } from "vitest";
import { retrieveEvidence } from "../lib/evidenceRetrievalService";
describe("deterministic evidence retrieval", () => {
  it("returns ranked chunks with source and document provenance", () => {
    const chunk: any = { chunkId: "c1", projectId: "p1", sourceId: "s1", documentHash: "hash", documentVersion: "v1", chunkIndex: 0, text: "Randomized trial methods and consent", section: "Methods", page: 4, createdAt: "2026-01-01", surroundingContext: {}, provenance: {}, isDemo: false, isSynthetic: false };
    expect(retrieveEvidence("trial consent", [chunk], [], { projectId: "p1" })[0]).toMatchObject({ chunkId: "c1", sourceId: "s1", page: 4, documentVersion: "v1" });
  });
});
