import { describe, expect, it } from "vitest";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
import { matchOutlets, type OutletMatchingInput } from "../lib/outletMatchingAgent";
import type { OutletIndexingRecord, OutletMetricRecord, TargetOutlet, VersionedRequirementRecord } from "../types";

const officialGuidelines = "https://journals.plos.org/plosmedicine/s/submission-guidelines";
const articleType: VersionedRequirementRecord = {
  id: "req-article-type", field: "articleType", value: ["Research Article"], state: "Verified",
  sourceProvider: "PLOS Medicine author guidelines", sourceUrl: officialGuidelines, retrievedAt: "2026-09-06T00:00:00.000Z",
  confidence: "High", humanConfirmed: true, confirmedByUid: "researcher-fixture", confirmedAt: "2026-09-06T01:00:00.000Z",
  version: 1, history: [],
};
const indexRecord: OutletIndexingRecord = {
  id: "index-doaj", indexName: "DOAJ", provider: "Directory of Open Access Journals",
  sourceUrl: "https://doaj.org/toc/1549-1676", retrievedAt: "2026-09-06T00:00:00.000Z",
  verificationState: "Verified", humanConfirmed: true, confirmedByUid: "researcher-fixture", confirmedAt: "2026-09-06T01:00:00.000Z",
};
const metricRecord: OutletMetricRecord = {
  id: "metric-fixture", provider: "Scopus", providerKind: "SCOPUS", metricName: "Source coverage record",
  year: 2025, subjectCategory: "Synthetic fixture category", sourceUrl: "https://www.scopus.com/sources",
  retrievedAt: "2026-09-06T00:00:00.000Z", verificationState: "Verified",
};
const trustedOutlet: TargetOutlet = {
  ...BASELINE_JOURNALS[6], requirementsList: [articleType], indexingRecords: [indexRecord], metrics: [metricRecord],
};
const input: OutletMatchingInput = {
  field: "Medicine", manuscriptType: "Research Article",
  abstract: "Synthetic fixture abstract about medicine.", keywords: ["medicine"],
  methodology: "Synthetic fixture methodology supplied by the test.",
  constraints: { outletType: "Journal", requiredIndexing: ["DOAJ"] }, limit: 5,
};

describe("TQ-VSC-039 OutletMatchingAgent", () => {
  it("returns only IDs from the supplied integrity-verified trusted catalogue", () => {
    const untrusted = { ...BASELINE_JOURNALS[0], id: "untrusted-fixture", verificationStatus: "Unverified" as const };
    const result = matchOutlets(input, [trustedOutlet, untrusted]);
    expect(result.trustedOutletIds).toEqual([trustedOutlet.id]);
    expect(result.excludedOutletIds).toContain("untrusted-fixture");
    expect(result.recommendations.map((item) => item.outletId)).toEqual([trustedOutlet.id]);
    expect(result.recommendations.every((item) => result.trustedOutletIds.includes(item.outletId))).toBe(true);
  });

  it("reports deterministic fit, mismatch, and exact identity provenance", () => {
    const recommendation = matchOutlets(input, [trustedOutlet]).recommendations[0];
    expect(recommendation.fitScore).toBe(100);
    expect(recommendation.fit.map((reason) => reason.dimension)).toEqual(expect.arrayContaining(["field", "keywords", "manuscriptType", "outletType", "indexing"]));
    expect(recommendation.provenance).toEqual({
      provider: trustedOutlet.provenanceProvider, sourceUrl: trustedOutlet.identitySourceUrl,
      retrievedAt: trustedOutlet.identityRetrievedAt, verificationStatus: "Verified",
    });
    const mismatch = matchOutlets({ ...input, constraints: { outletType: "Conference", requiredIndexing: ["DOAJ"] } }, [trustedOutlet]).recommendations[0];
    expect(mismatch.mismatch).toEqual(expect.arrayContaining([expect.objectContaining({ dimension: "outletType", outcome: "Mismatch" })]));
  });

  it("preserves verified metric provider, year, category, and source without upgrading unverified metrics", () => {
    const recommendation = matchOutlets(input, [trustedOutlet]).recommendations[0];
    expect(recommendation.metrics).toEqual([expect.objectContaining({
      id: "metric-fixture", provider: "Scopus", year: 2025, subjectCategory: "Synthetic fixture category",
      sourceUrl: "https://www.scopus.com/sources",
    })]);
    const withUnverifiedMetric = { ...trustedOutlet, metrics: [{ ...metricRecord, id: "unverified-metric", verificationState: "Unverified" as const }] };
    const unverifiedResult = matchOutlets(input, [withUnverifiedMetric]).recommendations[0];
    expect(unverifiedResult.metrics).toEqual([]);
    expect(unverifiedResult.missingOrUnverifiedFacts).toContain("Metrics with provider/year/category: Missing or Unverified");
  });

  it("reports missing article types, indexing, methodology scope, OA model, metrics, and requirements", () => {
    const sparse = { ...BASELINE_JOURNALS[0], requirementsList: [], indexingRecords: [], metrics: [] };
    const recommendation = matchOutlets({ ...input, constraints: { requiredIndexing: ["DOAJ"], requireOpenAccess: true } }, [sparse]).recommendations[0];
    expect(recommendation.missingOrUnverifiedFacts).toEqual(expect.arrayContaining([
      "Article types: Missing or Unverified", "Indexing: Missing or Unverified",
      "Methodology scope: Missing or Unverified", "Open-access model: Missing or Unverified",
      "Metrics with provider/year/category: Missing or Unverified", "reference style: Unavailable",
    ]));
  });

  it("returns an explicit empty state when no trusted outlet exists", () => {
    const untrusted = { ...trustedOutlet, verificationStatus: "Unverified" as const };
    expect(matchOutlets(input, [untrusted])).toMatchObject({
      status: "No Trusted Outlets Available", recommendations: [], trustedOutletIds: [], excludedOutletIds: [trustedOutlet.id],
    });
  });

  it("rejects incomplete input and duplicate catalogue IDs cannot create duplicate recommendations", () => {
    expect(() => matchOutlets({ ...input, methodology: "" }, [trustedOutlet])).toThrow("Field, manuscript type, abstract, and methodology are required");
    const result = matchOutlets(input, [trustedOutlet, trustedOutlet]);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].outletId).toBe(trustedOutlet.id);
  });
});
