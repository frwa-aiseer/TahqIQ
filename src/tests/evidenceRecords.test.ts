import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { adaptLegacyEvidenceRecords, createEvidenceRecord, hasConcreteEvidenceLocation, reviewEvidenceRecord } from "../lib/evidenceRecords";
import type { SourceRecord } from "../types";

const source: SourceRecord = {
  id: "source-1", title: "Source", authors: [], year: 2025, journalOrVenue: "Journal",
  documentType: "Article", peerReviewStatus: "Unknown", verificationState: "Verified",
  relevanceScore: 8, tags: [], documentVersion: "accepted-v2", documentHash: "sha256-document",
};

describe("passage-level EvidenceRecord", () => {
  it("creates evidence separately from source metadata with a concrete document location", () => {
    const record = createEvidenceRecord({
      evidenceId: "ev-1", source, exactPassage: "Exact passage from the source.", page: "12",
      section: "Results", paragraphOrChunkRef: "paragraph-3", extractionMethod: "Researcher Selected",
      extractedBy: "researcher-1", confidence: 0.95, linkedClaimIds: ["claim-1"],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(record).toMatchObject({
      evidenceId: "ev-1", sourceId: "source-1", documentVersion: "accepted-v2",
      documentHash: "sha256-document", exactPassage: "Exact passage from the source.", page: "12",
      section: "Results", paragraphOrChunkRef: "paragraph-3", verification: "Needs Review",
      researcherReview: { status: "Pending" }, linkedClaimIds: ["claim-1"],
    });
    expect(source).not.toHaveProperty("evidenceId");
  });

  it("rejects missing exact passages, missing locations, and invalid confidence", () => {
    const base = { evidenceId: "ev", source, exactPassage: "Passage", page: "1", extractionMethod: "AI Extracted" as const, extractedBy: "agent", confidence: 0.5, linkedClaimIds: [] };
    expect(() => createEvidenceRecord({ ...base, exactPassage: "" })).toThrow(/exact passage/i);
    expect(() => createEvidenceRecord({ ...base, page: "" })).toThrow(/page, section, or paragraph/i);
    expect(() => createEvidenceRecord({ ...base, confidence: 1.1 })).toThrow(/between 0 and 1/i);
  });

  it("always starts AI-extracted evidence in Needs Review without self-approval", () => {
    const record = createEvidenceRecord({
      evidenceId: "ai-1", source, exactPassage: "Model-extracted passage", section: "Methods",
      extractionMethod: "AI Extracted", extractedBy: "model-run-1", confidence: 0.8, linkedClaimIds: [],
    });
    expect(record.verification).toBe("Needs Review");
    expect(record.researcherReview).toEqual({ status: "Pending" });
  });

  it("requires attributable researcher identity and notes for review", () => {
    const record = createEvidenceRecord({ evidenceId: "ev-2", source, exactPassage: "Passage", section: "Discussion", extractionMethod: "AI Extracted", extractedBy: "model", confidence: 0.7, linkedClaimIds: [] });
    expect(() => reviewEvidenceRecord(record, "Verified", "", "Checked")).toThrow(/identity/i);
    expect(() => reviewEvidenceRecord(record, "Verified", "researcher-1", "")).toThrow(/notes/i);
    expect(reviewEvidenceRecord(record, "Verified", "researcher-1", "Checked against PDF", "2026-01-02T00:00:00.000Z")).toMatchObject({
      verification: "Researcher Verified",
      researcherReview: { status: "Verified", reviewedBy: "researcher-1", notes: "Checked against PDF" },
    });
  });

  it("adapts only traceable legacy evidence and preserves explicit missing document metadata", () => {
    const project = createEmptyProject();
    project.sources = [{
      ...source, documentVersion: undefined, documentHash: undefined,
      extractedPassages: [
        { id: "traceable", sourceId: source.id, pageNumber: 4, text: "Located passage", category: "Finding", confidence: 0.9, isVerifiedByHuman: false },
        { id: "unlocated", sourceId: source.id, text: "No location", category: "Finding", confidence: 0.9, isVerifiedByHuman: false },
      ],
    }];
    const records = adaptLegacyEvidenceRecords(project);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ evidenceId: "traceable", page: "4", documentVersion: "Not available", documentHash: "Not available", verification: "Needs Review" });
  });

  it("recognizes page, section, or paragraph/chunk as concrete locations", () => {
    expect(hasConcreteEvidenceLocation({ page: "7" })).toBe(true);
    expect(hasConcreteEvidenceLocation({ section: "Methods" })).toBe(true);
    expect(hasConcreteEvidenceLocation({ paragraphOrChunkRef: "chunk-12" })).toBe(true);
    expect(hasConcreteEvidenceLocation({})).toBe(false);
  });
});
