import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import {
  buildApprovedAnalysisInsertion,
  buildLiteratureEvidenceInsertion,
  getApprovedManuscriptAnalysisOutputs,
  getInsertableLiteratureEvidence,
} from "../lib/writingEvidence";
import type { AnalysisOutput, SourceRecord } from "../types";

function source(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: "source-1",
    title: "Researcher supplied record",
    authors: ["Researcher, A."],
    year: 2024,
    journalOrVenue: "Recorded venue",
    documentType: "Journal Article",
    peerReviewStatus: "Unknown",
    verificationState: "Verified",
    metadataProvider: "Crossref",
    provenance: {
      provider: "Crossref",
      retrievedAt: "2026-08-22T00:00:00.000Z",
    },
    relevanceScore: 1,
    tags: [],
    ...overrides,
  };
}

function analysisOutput(overrides: Partial<AnalysisOutput> = {}): AnalysisOutput {
  return {
    id: "analysis-1",
    analysisPlanId: "plan-1",
    executionTimestamp: "2026-08-22T00:00:00.000Z",
    softwareEnvironment: "Recorded environment",
    summaryText: "Recorded analysis summary.",
    numericResults: {},
    pValues: [],
    effectSizes: [],
    assumptionChecks: [],
    isReproduced: true,
    reproducibilityHash: "recorded-hash",
    ...overrides,
  };
}

describe("TQ-VSC-004 safe literature and statistical insertion", () => {
  it("returns no insertable science for an empty real project", () => {
    const project = createEmptyProject();

    expect(getInsertableLiteratureEvidence(project)).toEqual([]);
    expect(getApprovedManuscriptAnalysisOutputs(project)).toEqual([]);
    expect(JSON.stringify(project)).not.toMatch(/6\.84|0\.000003|1\.41/);
  });

  it("excludes abstracts, unreviewed passages, and passages without source provenance", () => {
    const project = createEmptyProject();
    project.sources = [
      source({
        id: "abstract-only",
        abstract: "An abstract is not automatically a researcher-reviewed evidence record.",
      }),
      source({
        id: "unreviewed-passage",
        extractedPassages: [{
          id: "passage-unreviewed",
          sourceId: "unreviewed-passage",
          text: "Unreviewed extracted text.",
          category: "Finding",
          confidence: 1,
          isVerifiedByHuman: false,
        }],
      }),
      source({
        id: "missing-provenance",
        provenance: undefined,
        extractedPassages: [{
          id: "passage-no-provenance",
          sourceId: "missing-provenance",
          text: "Human-reviewed text without source provenance.",
          category: "Finding",
          confidence: 1,
          isVerifiedByHuman: true,
        }],
      }),
    ];

    expect(getInsertableLiteratureEvidence(project)).toEqual([]);
  });

  it("allows only researcher-reviewed passage evidence with verified provenance", () => {
    const project = createEmptyProject();
    project.sources = [source({
      extractedPassages: [{
        id: "passage-1",
        sourceId: "source-1",
        text: "Exact researcher-reviewed passage.",
        section: "Results",
        pageNumber: 4,
        category: "Finding",
        confidence: 1,
        isVerifiedByHuman: true,
      }],
    })];

    const evidence = getInsertableLiteratureEvidence(project);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      passageText: "Exact researcher-reviewed passage.",
      verificationBadge: "Researcher Reviewed Evidence",
      provenance: { provider: "Crossref" },
    });

    const insertion = buildLiteratureEvidenceInsertion(evidence[0], project, "blockquote");
    expect(insertion).toContain("Exact researcher-reviewed passage.");
    expect(insertion).toContain("Provider: Crossref");
    expect(insertion).toContain("Source ID: source-1");
  });

  it("blocks a stale or forged literature item at insertion time", () => {
    const project = createEmptyProject();
    const forged = {
      id: "forged",
      sourceId: "missing",
      sourceTitle: "Unsupported",
      sourceAuthors: [],
      sourceYear: 0,
      passageText: "Unsupported claim.",
      category: "Finding",
      verificationBadge: "Researcher Reviewed Evidence" as const,
      provenance: { provider: "Unknown", retrievedAt: "Missing" },
    };

    expect(() => buildLiteratureEvidenceInsertion(forged, project, "inline")).toThrow(
      /insertion blocked/i
    );
  });

  it("excludes Completed, QC Passed, and legacy isApproved outputs", () => {
    const project = createEmptyProject();
    project.analysisOutputs = [
      analysisOutput({ id: "completed", state: "Completed" }),
      analysisOutput({ id: "qc", state: "QC Passed" }),
      analysisOutput({ id: "legacy", isApproved: true }),
    ];

    expect(getApprovedManuscriptAnalysisOutputs(project)).toEqual([]);
  });

  it("inserts only values recorded on an output Approved for Manuscript", () => {
    const project = createEmptyProject();
    const approved = analysisOutput({
      state: "Approved for Manuscript",
      summaryText: "Researcher-approved recorded summary.",
      numericResults: { estimate: 2.75 },
      pValues: [{ test: "Recorded test", pValue: 0.02, significant: true, formatted: "p = 0.02" }],
      effectSizes: [{ metric: "Recorded effect", value: 0.44 }],
    });
    project.analysisOutputs = [approved];

    expect(getApprovedManuscriptAnalysisOutputs(project)).toEqual([approved]);
    const insertion = buildApprovedAnalysisInsertion(approved, project, "full");
    expect(insertion).toContain("Approved for Manuscript Quantitative Results");
    expect(insertion).toContain("2.75");
    expect(insertion).toContain("p = 0.02");
    expect(insertion).toContain("0.44");
    expect(insertion).not.toMatch(/6\.84|0\.000003|1\.41/);
  });

  it("revalidates approval at insertion time", () => {
    const project = createEmptyProject();
    const output = analysisOutput({ state: "Completed", numericResults: { estimate: 99 } });
    project.analysisOutputs = [output];

    expect(() => buildApprovedAnalysisInsertion(output, project, "metrics_only")).toThrow(
      /not Approved for Manuscript/i
    );
  });

  it("excludes demo evidence and analysis from a real project", () => {
    const project = createEmptyProject();
    project.sources = [source({
      isDemo: true,
      isSynthetic: true,
      extractedPassages: [{
        id: "demo-passage",
        sourceId: "source-1",
        text: "Synthetic finding.",
        category: "Finding",
        confidence: 1,
        isVerifiedByHuman: true,
      }],
    })];
    project.analysisOutputs = [analysisOutput({
      state: "Approved for Manuscript",
      isDemo: true,
      isSynthetic: true,
    })];

    expect(getInsertableLiteratureEvidence(project)).toEqual([]);
    expect(getApprovedManuscriptAnalysisOutputs(project)).toEqual([]);
  });
});
