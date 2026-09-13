import { describe, expect, it, vi } from "vitest";
import { fetchCrossrefIntegrityMetadata } from "../lib/metadataProviders";
import { verifySourceIntegrity } from "../lib/sourceIntegrityVerification";
import type { SourceRecord } from "../types";

const source = (overrides: Partial<SourceRecord> = {}): SourceRecord => ({ id: "src-1", title: "Observed", authors: ["Doe, Jane"], year: 2024, journalOrVenue: "Journal", documentType: "Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified", relevanceScore: 8, tags: [], doi: "10.1234/real", ...overrides });
const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) }) as unknown as Response;

describe("source integrity verification", () => {
  it("maps mocked Crossref retraction and correction relations with related IDs", async () => {
    const retracted = await fetchCrossrefIntegrityMetadata("10.1234/real", vi.fn<typeof fetch>().mockResolvedValue(response({ message: { "update-to": [{ type: "retraction", DOI: "10.5678/retraction" }] } })));
    expect(retracted).toMatchObject({ status: "Retracted", provider: "Crossref Official Registry", relatedIds: ["10.5678/retraction"] });
    const corrected = await fetchCrossrefIntegrityMetadata("10.1234/real", vi.fn<typeof fetch>().mockResolvedValue(response({ message: { "update-to": [{ type: "correction", DOI: "10.5678/correction" }] } })));
    expect(corrected).toMatchObject({ status: "Corrected", relatedIds: ["10.5678/correction"] });
  });

  it("stores retraction status without inventing replacement metadata", async () => {
    const result = await verifySourceIntegrity(source(), [{ id: "crossref", name: "Crossref Official Registry", configured: true, lookup: async () => ({ status: "Retracted", provider: "Crossref Official Registry", retrievedAt: "2026-09-13T00:00:00Z", relatedIds: ["10.5678/retraction"], message: "Observed retraction relation." }) }], () => "2026-09-13T00:00:00Z");
    expect(result.verification).toMatchObject({ status: "Retracted", provider: "Crossref Official Registry", relatedIds: ["10.5678/retraction"] });
    expect(result.source).toMatchObject({ retractionWarning: true, doi: "10.1234/real" });
    expect(result.source.title).toBe("Observed");
  });

  it("keeps no-result and unavailable outcomes explicitly unverified", async () => {
    const result = await verifySourceIntegrity(source(), [{ id: "provider", name: "Configured Registry", configured: true, lookup: async () => ({ status: "Unverified", provider: "Configured Registry", retrievedAt: "2026-09-13T00:00:00Z", relatedIds: [] }) }], () => "2026-09-13T00:00:00Z");
    expect(result.verification.status).toBe("Unverified");
    const unavailable = await verifySourceIntegrity(source(), [{ id: "provider", name: "Unavailable Registry", configured: true, lookup: async () => ({ status: "Unavailable", provider: "Unavailable Registry", retrievedAt: "2026-09-13T00:00:00Z", relatedIds: [] }) }], () => "2026-09-13T00:00:00Z");
    expect(unavailable.verification.status).toBe("Unavailable");
  });

  it("does not claim a source without an identifier is clear", async () => {
    const result = await verifySourceIntegrity(source({ doi: undefined }), [], () => "2026-09-13T00:00:00Z");
    expect(result.verification).toMatchObject({ status: "Unverified", provider: "Not available", relatedIds: [] });
  });
});
