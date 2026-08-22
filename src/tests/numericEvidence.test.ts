import { describe, expect, it } from "vitest";
import { createNumericEvidenceFromAnalysis } from "../lib/numericEvidence";
import type { AnalysisOutput } from "../types";

describe("TQ-VSC-005 numeric evidence creation", () => {
  const output = {
    id: "run-1",
    executionStatus: "Completed",
    executionTimestamp: "2026-08-22T00:00:00.000Z",
    datasetHash: "dataset-hash",
    summaryText: "Stored estimate was 4.250 and the reporting threshold was 0.001.",
    numericResults: { estimate: 4.25, nested: { count: 18 } },
    pValues: [{ test: "stored test label", pValue: 0.03, significant: true, formatted: "p = 0.03" }],
    effectSizes: [{ metric: "stored metric label", value: 0.7 }],
    assumptionChecks: [],
  } as unknown as AnalysisOutput;

  it("records values with analysis-run and dataset provenance", () => {
    const records = createNumericEvidenceFromAnalysis(output);
    expect(records.map((record) => record.value)).toEqual(expect.arrayContaining([4.25, 18, 0.03, 0.7, 0.001]));
    expect(records.every((record) =>
      record.sourceId === "run-1" && record.analysisRunId === "run-1" &&
      record.datasetHash === "dataset-hash" && record.verificationState === "Verified"
    )).toBe(true);
  });

  it("does not create verified evidence for failed or hashless runs", () => {
    expect(createNumericEvidenceFromAnalysis({ ...output, executionStatus: "Failed" })).toEqual([]);
    expect(createNumericEvidenceFromAnalysis({ ...output, datasetHash: undefined })).toEqual([]);
  });
});
