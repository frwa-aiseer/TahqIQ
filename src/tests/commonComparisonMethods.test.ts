import { describe, expect, it } from "vitest";
import type { AnalysisPlan, DatasetRecord } from "../types";
import { analysisMethodRegistry, executeRegisteredAnalysisMethod, generateAnalysisFiguresAndTables } from "../lib/statsEngine";

const makeDataset = (rows: Record<string, unknown>[]): DatasetRecord => ({
  id: "golden-dataset", filename: "golden.csv", fileHash: "sha256-golden", uploadDate: "2026-09-07T00:00:00.000Z",
  recordCount: rows.length, variableCount: Object.keys(rows[0] ?? {}).length,
  variables: Object.keys(rows[0] ?? {}).map((name) => ({ name, type: name === "group" ? "Categorical" : name === "id" ? "ID" : "Numeric", missingCount: 0, uniqueValues: rows.length })),
  missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Approved for Analysis", rawPreview: rows,
});

const makePlan = (method: string, outcome: string, predictorVariables: string[] = []): AnalysisPlan => ({
  id: `plan-${method}`, title: method, researchQuestionId: "rq-golden", outcomeVariable: outcome, predictorVariables,
  statisticalMethod: method, assumptions: [], effectSizeMeasure: "Method appropriate", significanceThreshold: 0.05,
  missingDataStrategy: "Complete cases", status: "Approved", state: "Approved", isPreregistered: false,
});

const run = (method: string, rows: Record<string, unknown>[], outcome: string, condition?: string) =>
  executeRegisteredAnalysisMethod(method, {
    dataset: makeDataset(rows), plan: makePlan(method, outcome, condition ? [condition] : []),
    outcomeVariable: outcome, conditionVariable: condition,
  });

describe("deterministic common comparison methods — golden fixtures", () => {
  it("registers exactly the seven requested common comparison methods", () => {
    const ids = analysisMethodRegistry.list().map((method) => method.id);
    expect(ids).toEqual(expect.arrayContaining(["independent-t", "mann-whitney", "paired-t", "wilcoxon-signed-rank", "one-way-anova", "kruskal-wallis", "repeated-measures-anova"]));
  });

  it("matches the Welch independent t-test golden fixture", () => {
    const output = run("independent-t", [1, 2, 3, 4, 5].map((value) => ({ group: "A", score: value })).concat([2, 3, 4, 5, 6].map((value) => ({ group: "B", score: value }))), "score", "group");
    expect(output.executionStatus).toBe("Completed");
    expect(output.numericResults.t).toBeCloseTo(-1, 6);
    expect(output.numericResults.df).toBeCloseTo(8, 6);
    expect(output.numericResults.pValue).toBeCloseTo(0.346594, 5);
    expect(output.effectSizes[0].value).toBeCloseTo(-0.571, 3);
  });

  it("matches the Mann–Whitney golden fixture", () => {
    const output = run("mann-whitney", [1, 2, 3].map((score) => ({ group: "A", score })).concat([4, 5, 6].map((score) => ({ group: "B", score }))), "score", "group");
    expect(output.numericResults.u).toBe(0);
    expect(output.numericResults.z).toBeCloseTo(-1.745743, 5);
    expect(output.numericResults.pValue).toBeCloseTo(0.080856, 5);
    expect(output.effectSizes[0].value).toBe(1);
  });

  it("matches the paired t-test golden fixture without crossover diagnostics", () => {
    const output = run("Paired Student's t-test", [{ a: 1, b: 2 }, { a: 2, b: 4 }, { a: 3, b: 6 }, { a: 4, b: 8 }], "a,b");
    expect(output.numericResults.t).toBeCloseTo(3.872983, 5);
    expect(output.numericResults.df).toBe(3);
    expect(output.numericResults.pValue).toBeCloseTo(0.030466, 5);
    expect(output.assumptionChecks.map((item) => item.assumption).join(" ")).not.toMatch(/carryover|period|sequence/i);
  });

  it("matches the Wilcoxon signed-rank normal-approximation fixture", () => {
    const output = run("wilcoxon-signed-rank", [{ a: 1, b: 2 }, { a: 2, b: 4 }, { a: 3, b: 6 }, { a: 4, b: 8 }], "a,b");
    expect(output.numericResults.w).toBe(0);
    expect(output.numericResults.positiveRankSum).toBe(10);
    expect(output.numericResults.z).toBeCloseTo(-1.643168, 5);
    expect(output.effectSizes[0].value).toBe(1);
  });

  it("matches the one-way ANOVA golden fixture", () => {
    const rows = [["A", [1, 2, 3]], ["B", [4, 5, 6]], ["C", [7, 8, 9]]].flatMap(([group, values]) => (values as number[]).map((score) => ({ group, score })));
    const output = run("one-way-anova", rows, "score", "group");
    expect(output.numericResults.f).toBeCloseTo(27, 6);
    expect(output.numericResults.dfBetween).toBe(2);
    expect(output.numericResults.dfWithin).toBe(6);
    expect(output.numericResults.pValue).toBeCloseTo(0.001, 3);
    expect(output.effectSizes[0].value).toBe(0.9);
  });

  it("matches the Kruskal–Wallis golden fixture", () => {
    const rows = [["A", [1, 2, 3]], ["B", [4, 5, 6]], ["C", [7, 8, 9]]].flatMap(([group, values]) => (values as number[]).map((score) => ({ group, score })));
    const output = run("kruskal-wallis", rows, "score", "group");
    expect(output.numericResults.h).toBeCloseTo(7.2, 6);
    expect(output.numericResults.pValue).toBeCloseTo(0.027324, 5);
    expect(output.effectSizes[0].value).toBeCloseTo(0.866667, 5);
  });

  it("matches a one-way repeated-measures ANOVA independently calculated fixture", () => {
    const output = run("repeated-measures-anova", [{ t1: 1, t2: 2, t3: 4 }, { t1: 2, t2: 4, t3: 5 }, { t1: 3, t2: 5, t3: 8 }, { t1: 4, t2: 7, t3: 9 }], "t1,t2,t3");
    expect(output.executionStatus).toBe("Completed");
    expect(output.numericResults.f).toBeCloseTo(36, 6);
    expect(output.numericResults.dfCondition).toBe(2);
    expect(output.numericResults.dfError).toBe(6);
    expect(output.effectSizes[0].value).toBeCloseTo(0.923077, 5);
    expect(output.warnings[0]).toContain("Sphericity was not independently tested");
  });

  it("fails closed for invalid inputs and never returns fallback numbers", () => {
    const output = run("independent-t", [{ group: "A", score: 1 }, { group: "B", score: "Missing" }], "score", "group");
    expect(output.executionStatus).toBe("Failed");
    expect(output.pValues).toEqual([]);
    expect(output.effectSizes).toEqual([]);
    expect(output.numericResults.status).toBe("Failed");
  });

  it("does not fabricate paired charts or zero-valued tables for other method schemas", () => {
    const rows = [1, 2, 3].map((score) => ({ group: "A", score })).concat([4, 5, 6].map((score) => ({ group: "B", score })));
    const dataset = makeDataset(rows);
    const plan = makePlan("one-way-anova", "score", ["group"]);
    const output = executeRegisteredAnalysisMethod("one-way-anova", { dataset, plan, outcomeVariable: "score", conditionVariable: "group" });
    expect(generateAnalysisFiguresAndTables(output, dataset, plan)).toEqual({ figures: [], tables: [] });
  });
});
