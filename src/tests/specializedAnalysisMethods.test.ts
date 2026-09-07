import { describe, expect, it } from "vitest";
import type { AnalysisPlan, DatasetRecord } from "../types";
import { analysisMethodRegistry, executeRegisteredAnalysisMethod } from "../lib/statsEngine";
import { SPECIALIZED_ANALYSIS_FAMILIES } from "../lib/specializedAnalysisMethods";

const makeDataset = (rows: Record<string, unknown>[]): DatasetRecord => ({
  id: "specialized-golden", filename: "specialized.csv", fileHash: "sha256-specialized-golden",
  uploadDate: "2026-09-08T00:00:00.000Z", recordCount: rows.length, variableCount: Object.keys(rows[0] ?? {}).length,
  variables: Object.keys(rows[0] ?? {}).map((name) => ({ name, type: name === "id" ? "ID" : name === "split" ? "Categorical" : "Numeric", missingCount: 0, uniqueValues: rows.length })),
  missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Approved for Analysis", rawPreview: rows,
});

const makePlan = (method: string, outcome: string, predictors: string[]): AnalysisPlan => ({
  id: `plan-${method}`, title: method, researchQuestionId: "rq-specialized", outcomeVariable: outcome,
  predictorVariables: predictors, statisticalMethod: method, assumptions: [], effectSizeMeasure: "Method-specific",
  significanceThreshold: 0.05, missingDataStrategy: "Complete cases", status: "Approved", state: "Approved", isPreregistered: false,
});

describe("specialized analysis capability families", () => {
  it("exposes all four extensible families with implemented and disabled capabilities", () => {
    expect(SPECIALIZED_ANALYSIS_FAMILIES.map((family) => family.id)).toEqual([
      "meta-analysis", "ml-evaluation", "engineering-computational", "survey-psychometrics",
    ]);
    SPECIALIZED_ANALYSIS_FAMILIES.forEach((family) => {
      const methods = analysisMethodRegistry.list().filter((method) => method.family === family.id);
      expect(methods.some((method) => method.availability === "Enabled")).toBe(true);
      expect(methods.some((method) => method.availability !== "Enabled")).toBe(true);
    });
  });

  it("matches a fixed-effect inverse-variance meta-analysis golden fixture", () => {
    const rows = [{ effect: 0.2, se: 0.1 }, { effect: 0.5, se: 0.2 }, { effect: 0.1, se: 0.1 }];
    const plan = makePlan("fixed-effect-meta-analysis", "effect", ["se"]);
    const output = executeRegisteredAnalysisMethod(plan.statisticalMethod, { dataset: makeDataset(rows), plan });
    expect(output.numericResults.pooledEstimate).toBeCloseTo(0.188889, 5);
    expect(output.numericResults.standardError).toBeCloseTo(0.066667, 5);
    expect(output.numericResults.z).toBeCloseTo(2.833333, 5);
    expect(output.numericResults.cochranQ).toBeCloseTo(3.222222, 5);
    expect(output.numericResults.iSquaredPercent).toBeCloseTo(37.931034, 5);
    expect(output.numericResults.counts).toEqual({ includedStudies: 3, excludedStudies: 0 });
  });

  it("evaluates only an explicit held-out ML test split with metrics and calibration", () => {
    const rows = [
      { id: "T1", split: "Train", truth: 0, probability: 0.2 }, { id: "T2", split: "Train", truth: 1, probability: 0.7 },
      { id: "V1", split: "Validation", truth: 1, probability: 0.6 },
      { id: "S1", split: "Test", truth: 1, probability: 0.9 }, { id: "S2", split: "Test", truth: 1, probability: 0.8 },
      { id: "S3", split: "Test", truth: 0, probability: 0.4 }, { id: "S4", split: "Test", truth: 0, probability: 0.6 },
    ];
    const plan = makePlan("ml-binary-holdout-evaluation", "truth", ["probability", "split", "id"]);
    const output = executeRegisteredAnalysisMethod(plan.statisticalMethod, { dataset: makeDataset(rows), plan });
    expect(output.numericResults.accuracy).toBe(0.75);
    expect(output.numericResults.precision).toBeCloseTo(0.666667, 5);
    expect(output.numericResults.recallSensitivity).toBe(1);
    expect(output.numericResults.specificity).toBe(0.5);
    expect(output.numericResults.f1).toBe(0.8);
    expect(output.numericResults.brierScore).toBe(0.1425);
    expect(output.numericResults.expectedCalibrationError10Bin).toBe(0.325);
    expect(output.numericResults.counts).toEqual({ trainRecords: 2, validationRecords: 1, testRecords: 4, excludedTestRecords: 0 });
    expect(output.warnings.join(" ")).toMatch(/No model training.*cross-validation.*threshold optimization/);
    expect(output.assumptionChecks[0].met).toBe(false);
  });

  it("detects cross-split ID leakage and returns no metrics", () => {
    const rows = [
      { id: "A", split: "Train", truth: 0, probability: 0.1 }, { id: "A", split: "Test", truth: 1, probability: 0.9 },
      { id: "B", split: "Test", truth: 0, probability: 0.2 },
    ];
    const plan = makePlan("ml-binary-holdout-evaluation", "truth", ["probability", "split", "id"]);
    const output = executeRegisteredAnalysisMethod(plan.statisticalMethod, { dataset: makeDataset(rows), plan });
    expect(output.executionStatus).toBe("Failed");
    expect(output.numericResults.reason).toContain("leakage detected");
    expect(output.effectSizes).toEqual([]);
  });

  it("matches an engineering error-analysis golden fixture", () => {
    const rows = [{ reference: 1, predicted: 1.2 }, { reference: 2, predicted: 1.8 }, { reference: 3, predicted: 3.1 }];
    const plan = makePlan("engineering-error-analysis", "reference", ["predicted"]);
    const output = executeRegisteredAnalysisMethod(plan.statisticalMethod, { dataset: makeDataset(rows), plan });
    expect(output.numericResults.biasMeanError).toBeCloseTo(0.033333, 5);
    expect(output.numericResults.meanAbsoluteError).toBeCloseTo(0.166667, 5);
    expect(output.numericResults.rootMeanSquaredError).toBeCloseTo(0.173205, 5);
    expect(output.numericResults.normalizedRmseByReferenceRange).toBeCloseTo(0.086603, 5);
  });

  it("matches a Cronbach alpha golden fixture without claiming validity", () => {
    const rows = [[1, 2, 1], [2, 3, 2], [3, 4, 4], [4, 5, 5]].map(([i1, i2, i3]) => ({ i1, i2, i3 }));
    const plan = makePlan("cronbach-alpha", "i1,i2,i3", []);
    const output = executeRegisteredAnalysisMethod(plan.statisticalMethod, { dataset: makeDataset(rows), plan });
    expect(output.numericResults.cronbachAlpha).toBeCloseTo(0.982759, 5);
    expect(output.numericResults.totalScoreVariance).toBeCloseTo(19.333333, 5);
    expect(output.numericResults.counts).toEqual({ completeRespondents: 4, excludedRespondents: 0, items: 3 });
    expect(output.assumptionChecks[0]).toMatchObject({ met: false });
    expect(output.warnings[0]).toMatch(/not evidence of unidimensionality.*validity/i);
  });

  it("marks broader specialized methods Planned/Unavailable with no executor", () => {
    const ids = ["random-effects-meta-analysis", "meta-regression", "ml-cross-validation", "ml-model-training", "ml-roc-auc", "design-of-experiments", "global-sensitivity-analysis", "simulation-uncertainty-propagation", "factor-analysis", "item-response-theory"];
    ids.forEach((id) => {
      const method = analysisMethodRegistry.get(id);
      expect(["Planned", "Unavailable"]).toContain(method?.availability);
      expect(method?.availabilityReason).toBeTruthy();
      expect(method?.execute).toBeUndefined();
      expect(() => analysisMethodRegistry.execute(id, {})).toThrow();
    });
  });
});
