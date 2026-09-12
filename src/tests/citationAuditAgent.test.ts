import { describe, expect, it } from "vitest";
import { runCitationAudit } from "../lib/citationAuditAgent";
import type { EvidenceRecord, ManuscriptSection, SourceRecord } from "../types";

const source = (overrides: Partial<SourceRecord> = {}): SourceRecord => ({ id: "src-real", title: "Observed source", authors: ["Doe, Jane"], year: 2024, journalOrVenue: "Observed Journal", documentType: "Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified", relevanceScore: 8, tags: [], doi: "10.1234/real", ...overrides });
const section = (citationIds: string[]): ManuscriptSection => ({ id: "methods", title: "Methods", order: 1, currentWordCount: 10, content: "Observed text.", citationIds, status: "Drafting", version: 1, lastEditedBy: "researcher", lastEditedTimestamp: "2026-09-13T00:00:00Z" });
const evidence = (sourceId = "src-real"): EvidenceRecord => ({ evidenceId: "ev-1", sourceId, documentVersion: "v1", documentHash: "a".repeat(64), exactPassage: "Observed passage.", extractionMethod: "Researcher Selected", extractedBy: "researcher", confidence: 1, verification: "Researcher Verified", researcherReview: { status: "Verified", reviewedBy: "researcher", reviewedAt: "2026-09-13T00:00:00Z" }, linkedClaimIds: [], createdAt: "2026-09-13T00:00:00Z", updatedAt: "2026-09-13T00:00:00Z" });

describe("CitationAuditAgent", () => {
  it("passes a verified, evidence-supported citation with synchronized bibliography", async () => {
    const report = await runCitationAudit({ projectId: "project-1", sections: [section(["src-real"])], sources: [source()], evidenceRecords: [evidence()], bibliography: [{ entryId: "bib-1", sourceId: "src-real", text: "Doe (2024)" }] }, () => "2026-09-13T00:00:00Z");
    expect(report).toMatchObject({ status: "PASS", matchedSourceIds: ["src-real"], sourceCreationAttempted: false });
  });

  it("keeps a fake DOI unresolved and never creates a synthetic Source", async () => {
    const report = await runCitationAudit({ projectId: "project-1", sections: [section(["10.9999/fake-doi"])], sources: [source()], evidenceRecords: [], bibliography: [], resolveIdentifier: () => null });
    expect(report.status).toBe("BLOCKER");
    expect(report.unresolvedCitationRefs).toEqual(["10.9999/fake-doi"]);
    expect(report.sourceCreationAttempted).toBe(false);
    expect(report.issues[0].message).toContain("No replacement or synthetic Source was created");
  });

  it("flags retractions/corrections, missing evidence, duplicates, orphans, and missing bibliography entries", async () => {
    const report = await runCitationAudit({ projectId: "project-1", sections: [section(["src-real", "src-real"])], sources: [source({ retractionWarning: true, correctionNotice: "Publisher correction" })], evidenceRecords: [], bibliography: [{ entryId: "duplicate-a", sourceId: "src-real", text: "A" }, { entryId: "duplicate-b", sourceId: "src-real", text: "B" }, { entryId: "orphan", sourceId: "unknown", text: "Orphan" }] });
    expect(report.status).toBe("BLOCKER");
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["DUPLICATE_CITATION", "RETRACTED_SOURCE", "CORRECTED_SOURCE", "MISSING_EVIDENCE", "DUPLICATE_BIBLIOGRAPHY", "ORPHAN_BIBLIOGRAPHY"]));
  });

  it("does not treat an externally resolved identifier as an imported project Source", async () => {
    const report = await runCitationAudit({ projectId: "project-1", sections: [section(["doi:10.9999/not-imported"])], sources: [], evidenceRecords: [], bibliography: [], resolveIdentifier: () => source({ id: "external-only" }) });
    expect(report.issues.filter((issue) => issue.code === "UNRESOLVED_IDENTIFIER")).toHaveLength(2);
    expect(report.sourceCreationAttempted).toBe(false);
  });
});
