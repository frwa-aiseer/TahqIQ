import { describe, expect, it } from "vitest";
import type { AnalysisPlan, DatasetRecord } from "../types";
import { analysisMethodRegistry, executeRegisteredAnalysisMethod } from "../lib/statsEngine";

const dataset = (rows: Record<string, unknown>[]): DatasetRecord => ({
  id: "regression-fixture", filename: "regression.csv", fileHash: "sha256-regression-golden",
  uploadDate: "2026-09-08T00:00:00.000Z", recordCount: rows.length,
  variableCount: Object.keys(rows[0] ?? {}).length,
  variables: Object.keys(rows[0] ?? {}).map((name) => ({ name, type: "Numeric", missingCount: 0, uniqueValues: rows.length })),
  missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Approved for Analysis", rawPreview: rows,
});

const plan = (method: string, outcome: string, predictors: string[]): AnalysisPlan => ({
  id: `plan-${method}`, title: method, researchQuestionId: "rq-regression", outcomeVariable: outcome,
  predictorVariables: predictors, statisticalMethod: method, assumptions: [], effectSizeMeasure: "Model-specific",
  significanceThreshold: 0.05, missingDataStrategy: "Complete cases", status: "Approved", state: "Approved", isPreregistered: false,
});

describe("regression, survival, and diagnostic analysis architecture", () => {
  it("matches an independently calculated OLS golden fixture", () => {
    const rows = [1, 3, 4, 7, 9].map((y, x) => ({ x, y }));
    const analysisPlan = plan("linear-regression", "y", ["x"]);
    const output = executeRegisteredAnalysisMethod("linear-regression", { dataset: dataset(rows), plan: analysisPlan });
    const coefficients = output.numericResults.coefficients as Record<string, Record<string, number>>;

    expect(output.executionStatus).toBe("Completed");
    expect(coefficients.Intercept.estimate).toBeCloseTo(0.8, 6);
    expect(coefficients.x.estimate).toBeCloseTo(2, 6);
    expect(coefficients.Intercept.standardError).toBeCloseTo(0.4, 6);
    expect(coefficients.x.standardError).toBeCloseTo(0.163299, 5);
    expect(output.numericResults.rSquared).toBeCloseTo(0.980392, 5);
    expect(output.numericResults.sse).toBeCloseTo(0.8, 6);
    expect(output.numericResults.counts).toEqual({ completeObservations: 5, excludedObservations: 0 });
    expect(output.reproducibilityHash).toMatch(/^fnv1a-/);
  });

  it("matches a binary logistic maximum-likelihood golden fixture", () => {
    const outcomes = [0, 0, 1, 0, 1, 1, 0, 1];
    const rows = outcomes.map((y, x) => ({ x, y }));
    const analysisPlan = plan("binary-logistic-regression", "y", ["x"]);
    const output = executeRegisteredAnalysisMethod("logistic regression", { dataset: dataset(rows), plan: analysisPlan });
    const coefficients = output.numericResults.coefficients as Record<string, Record<string, number>>;

    expect(output.executionStatus).toBe("Completed");
    expect(coefficients.Intercept.estimate).toBeCloseTo(-1.516205, 5);
    expect(coefficients.x.estimate).toBeCloseTo(0.433201, 5);
    expect(coefficients.x.oddsRatio).toBeCloseTo(1.542187, 5);
    expect(output.numericResults.logLikelihood).toBeCloseTo(-4.734619, 5);
    expect(output.numericResults.deviance).toBeCloseTo(9.469239, 5);
    expect(output.numericResults.converged).toBe("Yes");
    expect(output.numericResults.counts).toEqual({ completeObservations: 8, events: 4, nonEvents: 4, excludedObservations: 0 });
  });

  it("fails closed for singular linear models and separated logistic models", () => {
    const singularRows = [1, 2, 3, 4].map((y, x) => ({ x, duplicate: x * 2, y }));
    const singularPlan = plan("linear-regression", "y", ["x", "duplicate"]);
    const singular = executeRegisteredAnalysisMethod("linear-regression", { dataset: dataset(singularRows), plan: singularPlan });
    expect(singular.executionStatus).toBe("Failed");
    expect(singular.pValues).toEqual([]);
    expect(singular.numericResults.reason).toContain("singular");

    const separatedRows = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: x < 3 ? 0 : 1 }));
    const separatedPlan = plan("binary-logistic-regression", "y", ["x"]);
    const separated = executeRegisteredAnalysisMethod("binary-logistic-regression", { dataset: dataset(separatedRows), plan: separatedPlan });
    expect(separated.executionStatus).toBe("Failed");
    expect(separated.effectSizes).toEqual([]);
    expect(separated.summaryText).toMatch(/separation|converge/i);
  });

  it("requires a true numeric 0/1 binary outcome", () => {
    const rows = ["no", "yes", "no", "yes"].map((y, x) => ({ x, y }));
    const analysisPlan = plan("binary-logistic-regression", "y", ["x"]);
    const output = executeRegisteredAnalysisMethod("binary-logistic-regression", { dataset: dataset(rows), plan: analysisPlan });
    expect(output.executionStatus).toBe("Failed");
    expect(output.numericResults.reason).toContain("classes 0 and 1");
  });

  it("makes every enabled method executable and every planned/unavailable method visibly non-executable", () => {
    const methods = analysisMethodRegistry.list();
    const enabled = methods.filter((method) => method.availability === "Enabled");
    const disabled = methods.filter((method) => method.availability !== "Enabled");
    expect(enabled.length).toBeGreaterThan(0);
    expect(enabled.every((method) => typeof method.execute === "function" && method.reproducibility.deterministic)).toBe(true);
    expect(disabled.map((method) => method.id)).toEqual(expect.arrayContaining([
      "poisson-regression", "negative-binomial-regression", "kaplan-meier", "cox-proportional-hazards",
      "diagnostic-sensitivity-specificity", "diagnostic-roc-auc",
    ]));
    disabled.forEach((method) => {
      expect(method.execute).toBeUndefined();
      expect(method.availabilityReason).toBeTruthy();
      expect(method.reproducibility.deterministic).toBe(false);
      expect(() => analysisMethodRegistry.execute(method.id, {})).toThrow(method.availability.toLowerCase());
    });
  });
});
