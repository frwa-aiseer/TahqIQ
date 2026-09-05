import { describe, expect, it } from "vitest";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
import { buildOutletIntelligence, validateOutletIndexingRecord } from "../lib/outletIntelligenceService";
import type { OutletIndexingRecord, OutletMetricRecord, TargetOutlet, VersionedRequirementRecord } from "../types";

const sourceUrl = "https://journals.plos.org/plosone/s/submission-guidelines";
const requirement = (field: VersionedRequirementRecord["field"], value: VersionedRequirementRecord["value"], state: VersionedRequirementRecord["state"] = "Verified"): VersionedRequirementRecord => ({
  id: `req-${field}`, field, value, state, sourceProvider: "Official author guidelines", sourceUrl,
  retrievedAt: "2026-09-06T00:00:00.000Z", confidence: "High", humanConfirmed: state === "Verified",
  confirmedByUid: state === "Verified" ? "researcher-1" : undefined, confirmedAt: state === "Verified" ? "2026-09-06T01:00:00.000Z" : undefined,
  version: 1, history: [],
});
const indexing = (overrides: Partial<OutletIndexingRecord> = {}): OutletIndexingRecord => ({
  id: "idx-1", indexName: "Directory record", provider: "Official index provider",
  sourceUrl: "https://doaj.org/toc/1932-6203", retrievedAt: "2026-09-06T00:00:00.000Z",
  verificationState: "Verified", humanConfirmed: true, confirmedByUid: "researcher-1",
  confirmedAt: "2026-09-06T01:00:00.000Z", ...overrides,
});
const metric: OutletMetricRecord = {
  id: "metric-1", provider: "Scopus", providerKind: "SCOPUS", metricName: "CiteScore Percentile", year: 2025,
  subjectCategory: "General", percentile: 88, sourceUrl: "https://scopus.com/sources/record", retrievedAt: "2026-09-06T00:00:00.000Z", verificationState: "Verified",
};

describe("TQ-VSC-037 OutletIntelligenceService", () => {
  it("combines sourced identity, indexing, metrics, article types, formatting, policies, and conference data", () => {
    const outlet: TargetOutlet = {
      ...BASELINE_JOURNALS[6], metrics: [metric], indexingRecords: [indexing()], requirementsList: [
        requirement("articleType", ["Research Article"]), requirement("manuscriptWordLimit", 6000),
        requirement("titlePage", "Separate title page"), requirement("aiPolicy", "Declaration required"),
        requirement("conferenceDeadline", "2026-10-01"), requirement("conferenceTemplate", "Official template"),
      ],
    };
    const report = buildOutletIntelligence(outlet);
    expect(report.identityState).toBe("Verified");
    expect(report.identity?.sourceUrl).toBe(outlet.identitySourceUrl);
    expect(report.indexing).toEqual([outlet.indexingRecords![0]]);
    expect(report.metrics).toEqual([metric]);
    expect(report.articleTypes[0]).toMatchObject({ value: ["Research Article"], state: "Verified", sourceUrl });
    expect(report.formatting.find((fact) => fact.field === "manuscriptWordLimit")).toMatchObject({ value: 6000, sourceUrl });
    expect(report.guidelines.find((fact) => fact.field === "titlePage")?.value).toBe("Separate title page");
    expect(report.policies.find((fact) => fact.field === "aiPolicy")?.value).toBe("Declaration required");
    expect(report.conference.map((fact) => fact.field)).toContain("conferenceTemplate");
  });

  it("never promotes unsourced legacy outlet fields into facts", () => {
    const report = buildOutletIntelligence({ ...BASELINE_JOURNALS[0], indexing: ["Claimed Index"], wordLimit: 5000, aiPolicySummary: "Claimed policy", submissionDeadline: "Tomorrow", requirementsList: [] });
    expect(report.indexing).toEqual([]);
    expect(report.formatting.find((fact) => fact.field === "manuscriptWordLimit")).toEqual({ field: "manuscriptWordLimit", value: null, state: "Unavailable" });
    expect(report.policies.find((fact) => fact.field === "aiPolicy")?.state).toBe("Unavailable");
    expect(report.conference.find((fact) => fact.field === "conferenceDeadline")?.state).toBe("Unavailable");
  });

  it("keeps sourced AI extraction in Needs Review and strips unsourced extraction values", () => {
    const sourced = requirement("referenceStyle", "Vancouver", "AI Extracted—Needs Review");
    const unsourced = { ...requirement("articleType", "Original Article", "AI Extracted—Needs Review"), sourceUrl: undefined };
    const report = buildOutletIntelligence({ ...BASELINE_JOURNALS[0], requirementsList: [sourced, unsourced] });
    expect(report.formatting.find((fact) => fact.field === "referenceStyle")).toMatchObject({ value: "Vancouver", state: "AI Extracted—Needs Review", sourceUrl });
    expect(report.articleTypes[0]).toMatchObject({ value: null, state: "Unverified" });
  });

  it("requires source and human attribution for verified indexing", () => {
    expect(validateOutletIndexingRecord(indexing())).toEqual({ valid: true, issues: [] });
    const report = buildOutletIntelligence({ ...BASELINE_JOURNALS[0], indexingRecords: [indexing({ sourceUrl: "", humanConfirmed: false })] });
    expect(report.indexing).toEqual([]);
    expect(report.warnings.join(" ")).toContain("Indexing claim requires a real HTTPS source URL");
  });

  it("does not expose unverified identity, metrics, or indexing as verified intelligence", () => {
    const outlet: TargetOutlet = { ...BASELINE_JOURNALS[0], verificationStatus: "Unverified", metrics: [{ ...metric, verificationState: "Unverified" }], indexingRecords: [indexing({ verificationState: "Unverified", humanConfirmed: false, confirmedByUid: undefined, confirmedAt: undefined })] };
    const report = buildOutletIntelligence(outlet);
    expect(report.identity).toBeUndefined();
    expect(report.identityState).toBe("Unverified");
    expect(report.metrics).toEqual([]);
    expect(report.indexing).toEqual([]);
  });
});
