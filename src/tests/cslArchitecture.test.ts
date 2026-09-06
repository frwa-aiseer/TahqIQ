import { describe, expect, it } from "vitest";
import { BASELINE_JOURNALS, mapJournalStyleToCslId } from "../data/baselineOutlets";
import {
  formatBibliographyEntry,
  processCitationStyle,
  registerCslStyleFile,
  resolveOutletCslStyle,
} from "../lib/cslStyles";
import type { SourceRecord, TargetOutlet, VersionedRequirementRecord } from "../types";

const sources: SourceRecord[] = [
  {
    id: "source-1", title: "Synthetic author-date fixture", authors: ["Rivera, Ana", "Chen, Bo"], year: 2024,
    journalOrVenue: "Synthetic Test Venue", volume: "12", issue: "2", pages: "10-20",
    documentType: "Journal Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified",
    relevanceScore: 8, tags: [], isDemo: true, isSynthetic: true,
  },
  {
    id: "source-2", title: "Synthetic numeric fixture", authors: ["Khan, Sara", "Ali, Noor", "Tan, Wei"], year: 2025,
    journalOrVenue: "Synthetic Test Venue", documentType: "Journal Article", peerReviewStatus: "Peer-reviewed",
    verificationState: "Verified", relevanceScore: 7, tags: [], isDemo: true, isSynthetic: true,
  },
];

const verifiedStyleRequirement = (value: string): VersionedRequirementRecord => ({
  id: "req-style", field: "referenceStyle", value, state: "Verified", sourceProvider: "Official author guidelines",
  sourceUrl: "https://journals.ieeeauthorcenter.ieee.org/your-role-in-article-production/ieee-editorial-style-manual/", retrievedAt: "2026-09-06T00:00:00.000Z",
  confidence: "High", humanConfirmed: true, confirmedByUid: "researcher-1", confirmedAt: "2026-09-06T01:00:00.000Z",
  version: 1, history: [],
});

describe("TQ-VSC-038 CSL-compatible architecture", () => {
  it("uses one processor for representative author-date in-text and bibliography output", () => {
    const result = processCitationStyle(sources, "apa");
    expect(result.status).toBe("Available—Compatible");
    expect(result.style?.exactJournalStyle).toBe(false);
    expect(result.inText).toBe("(Rivera & Chen, 2024; Khan et al., 2025)");
    expect(result.bibliography[0]).toContain("Rivera, Ana, Chen, Bo (2024)");
  });

  it("uses the same processor for representative numeric in-text and bibliography output", () => {
    const result = processCitationStyle([sources[1]], "ieee", sources);
    expect(result.inText).toBe("[2]");
    expect(result.bibliography[0]).toContain("[2]");
    expect(formatBibliographyEntry(sources[0], 0, "ieee")).toContain("[1]");
  });

  it("registers a CSL file by its CSL ID and reports compatible rather than exact rendering", () => {
    const style = registerCslStyleFile(`<?xml version="1.0"?><style xmlns="http://purl.org/net/xbiblio/csl" version="1.0"><info><title>Institution Style</title><id>https://styles.example.edu/institution</id><category citation-format="numeric"/></info><citation><layout prefix="[" suffix="]"/></citation><bibliography><layout/></bibliography></style>`);
    const result = processCitationStyle([sources[0]], style.id);
    expect(style).toMatchObject({ origin: "csl-file", citationFormat: "numeric", exactJournalStyle: false });
    expect(result).toMatchObject({ status: "Available—Compatible", inText: "[1]" });
  });

  it("fails closed for malformed and unavailable CSL files or IDs", () => {
    expect(() => registerCslStyleFile("<style><info><title>Not CSL</title></info></style>")).toThrow("Invalid CSL file");
    expect(processCitationStyle(sources, "unknown-journal-style")).toEqual({
      status: "Unavailable", inText: "", bibliography: [], message: "CSL style 'unknown-journal-style' is unavailable.",
    });
    expect(formatBibliographyEntry(sources[0], 0, "unknown-journal-style")).toBe("Citation style unavailable.");
  });

  it("maps an outlet only from a verified sourced reference-style requirement", () => {
    const outlet: TargetOutlet = { ...BASELINE_JOURNALS[0], citationStyle: "Pretend Exact Style", requirementsList: [verifiedStyleRequirement("IEEE")] };
    expect(resolveOutletCslStyle(outlet)).toMatchObject({ status: "Available—Compatible", requestedStyle: "IEEE", styleId: "ieee", sourceRecordId: "req-style" });
    expect(resolveOutletCslStyle({ ...outlet, requirementsList: [] })).toMatchObject({ status: "Unavailable", requestedStyle: null });
  });

  it("does not silently map missing or unknown legacy labels to APA", () => {
    expect(mapJournalStyleToCslId("Unverified")).toBe("unavailable");
    expect(mapJournalStyleToCslId("Exact Journal House Style 2026")).toBe("unavailable");
  });
});
