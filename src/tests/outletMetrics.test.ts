import { describe, expect, it } from "vitest";
import { getOutletMetricRecords, getVerifiedOutletMetrics, normalizeOutletMetricRecords, validateOutletMetricRecord } from "../lib/outletMetrics";
import type { OutletMetricRecord, TargetOutlet } from "../types";

const metric = (overrides: Partial<OutletMetricRecord> = {}): OutletMetricRecord => ({
  id: "metric-1",
  provider: "Clarivate Journal Citation Reports",
  providerKind: "JCR",
  metricName: "Journal Citation Reports Quartile",
  year: 2025,
  subjectCategory: "Medicine, General & Internal",
  quartile: "Q1",
  sourceUrl: "https://clarivate.com/journal-citation-reports/record",
  sourceRecordId: "provider-record-1",
  retrievedAt: "2026-08-23T00:00:00.000Z",
  verificationState: "Verified",
  ...overrides,
});

const outlet = (metrics: unknown): TargetOutlet => ({ id: "outlet-1", title: "Outlet", type: "Journal", issnOrAcronym: "0000-0000", publisherOrSociety: "Publisher", subjectCategory: "General", officialUrl: "https://publisher.example/outlet", indexing: [], openAccessModel: "Unverified", citationStyle: "Unverified", lastVerifiedDate: "2026-08-23", aiPolicySummary: "Unverified", metrics } as TargetOutlet);

describe("TQ-VSC-009 provider/year/category outlet metrics", () => {
  it("supports multiple category-specific quartiles for one journal and preserves each year", () => {
    const records = [
      metric(),
      metric({ id: "metric-2", subjectCategory: "Health Care Sciences", quartile: "Q2", year: 2024 }),
    ];
    expect(getVerifiedOutletMetrics(outlet(records))).toEqual(records);
    expect(records.map((record) => [record.year, record.subjectCategory, record.quartile])).toEqual([
      [2025, "Medicine, General & Internal", "Q1"],
      [2024, "Health Care Sciences", "Q2"],
    ]);
  });

  it("rejects a timeless or category-free quartile", () => {
    expect(validateOutletMetricRecord(metric({ year: 0, subjectCategory: "" })).valid).toBe(false);
  });

  it("prevents third-party metrics masquerading as JCR or Scopus", () => {
    const thirdParty = metric({ provider: "Aggregator", providerKind: "THIRD_PARTY", metricName: "JCR Quartile", sourceUrl: "https://aggregator.example/metric" });
    expect(validateOutletMetricRecord(thirdParty).issues).toContain("Third-party metrics cannot be labeled as JCR, CiteScore, or Scopus metrics.");
    expect(getVerifiedOutletMetrics(outlet([thirdParty]))).toEqual([]);
  });

  it("requires official provider domains for JCR and Scopus records", () => {
    expect(validateOutletMetricRecord(metric({ sourceUrl: "https://aggregator.example/jcr" })).valid).toBe(false);
    expect(validateOutletMetricRecord(metric({ provider: "Scopus", providerKind: "SCOPUS", metricName: "CiteScore Percentile", percentile: 90, quartile: undefined, sourceUrl: "https://scopus.com/sources/record" })).valid).toBe(true);
  });

  it("treats legacy global metric objects and missing metrics as Not Verified", () => {
    expect(getOutletMetricRecords(outlet(undefined))).toEqual([]);
    expect(getOutletMetricRecords(outlet({ jcrQuartile: { quartile: "Q1", year: 2024 } }))).toEqual([]);
  });

  it("forces user-entered metric records to Unverified", () => {
    expect(normalizeOutletMetricRecords([metric()], true)[0].verificationState).toBe("Unverified");
  });
});
