import { describe, expect, it } from "vitest";
import { createEmbeddingRecord, nextEmbeddingIndexVersion } from "../lib/embeddingProvider";
describe("embedding provider provenance", () => {
  it("retains model/index metadata across model swaps", () => {
    const first = createEmbeddingRecord([.1], { providerId: "specter2", kind: "Scientific", modelId: "specter2", modelVersion: "v1", config: {}, generatedAt: "2026-01-01", chunkHash: "c1", documentHash: "d1", indexVersion: 1 });
    expect(nextEmbeddingIndexVersion([first], "bge-m3", "bge-m3")).toBe(1);
    expect(first.metadata.documentHash).toBe("d1");
  });
});
