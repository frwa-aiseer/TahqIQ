import { describe, expect, it } from "vitest";
import { runOriginalityRiskAnalysis } from "../lib/originalityRiskEngine";
import type { ManuscriptSection, SourceRecord } from "../types";

const source = (overrides: Partial<SourceRecord> = {}): SourceRecord => ({ id: "src-1", title: "Observed paper", authors: ["Doe, Jane"], year: 2024, journalOrVenue: "Journal", documentType: "Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified", relevanceScore: 8, tags: [], fullTextContent: "The observed intervention improved outcomes across the evaluated population and demonstrated a consistent response pattern in follow-up analysis.", ...overrides });
const section = (content: string, citationIds: string[] = []): ManuscriptSection => ({ id: "section-1", title: "Discussion", order: 1, currentWordCount: content.split(/\s+/).length, content, citationIds, status: "Drafting", version: 1, lastEditedBy: "researcher", lastEditedTimestamp: "2026-09-13T00:00:00Z" });

describe("responsible originality and similarity risk engine", () => {
  it("detects exact quotation and close overlap with source-linked review language", async () => {
    const report = await runOriginalityRiskAnalysis({ projectId: "project-1", sections: [section('The paper states "The observed intervention improved outcomes across the evaluated population and demonstrated a consistent response pattern in follow-up analysis."', ["src-1"])], sources: [source()] });
    expect(report.status).toBe("WARNING");
    expect(report.findings.map((finding) => finding.type)).toEqual(expect.arrayContaining(["Exact Quotation", "Close/Verbatim Overlap"]));
    expect(report.findings.every((finding) => finding.message.includes("researcher review"))).toBe(true);
  });

  it("flags uncited close paraphrase and missing attribution without accusing the researcher", async () => {
    const content = "The observed intervention improved outcomes across the evaluated population and demonstrated a consistent response pattern in follow-up analysis.";
    const report = await runOriginalityRiskAnalysis({ projectId: "project-1", sections: [section(content)], sources: [source()] });
    expect(report.status).toBe("BLOCKER");
    expect(report.findings.map((finding) => finding.type)).toEqual(expect.arrayContaining(["Uncited Close Paraphrase", "Missing Attribution"]));
    expect(report.disclaimer).not.toMatch(/plagiarism-free|evade|undetectable/i);
  });

  it("detects duplicate sections and optional version self-overlap", async () => {
    const content = "This section contains a repeated research statement with enough words to establish substantial duplicate section overlap for a careful review by the researcher.";
    const first = section(content, ["src-1"]), second = { ...section(content, ["src-1"]), id: "section-2", title: "Conclusion" };
    const report = await runOriginalityRiskAnalysis({ projectId: "project-1", sections: [first, second], sources: [source()], previousVersions: [{ ...first, id: "section-1-v0", version: 0 }] });
    expect(report.findings.map((finding) => finding.type)).toEqual(expect.arrayContaining(["Duplicate Section", "Version Self-Overlap"]));
  });

  it("isolates synthetic sources and exposes an honest licensed-service boundary", async () => {
    const compare = async () => ({ status: "Unavailable" as const, provider: "licensed-service", message: "Service unavailable; no licensed result." });
    const report = await runOriginalityRiskAnalysis({ projectId: "project-1", sections: [section("A short original statement.")], sources: [source({ isSynthetic: true })], licensedSimilarityAdapter: { providerId: "licensed-service", configured: true, compare } });
    expect(report.status).toBe("PASS");
    expect(report.licensedService).toMatchObject({ status: "Unavailable", provider: "licensed-service" });
  });
});
