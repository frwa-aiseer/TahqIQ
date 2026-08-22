import { describe, it, expect } from "vitest";
import { executePairedCrossoverAnalysis, generateAnalysisFiguresAndTables } from "../lib/statsEngine";
import { DatasetRecord, AnalysisPlan } from "../types";

describe("TehqIQ Phase 5: Real Statistical Execution Engine & Verification Gateway", () => {
  // Mock Approved Plan
  const approvedPlan: AnalysisPlan = {
    id: "ap-test-1",
    title: "Crossover Trial Paired Comparison Plan",
    researchQuestionId: "rq-101",
    outcomeVariable: "score",
    predictorVariables: ["condition"],
    statisticalMethod: "Paired Student's t-test",
    assumptions: ["Normality of paired differences", "Absence of carryover interaction"],
    effectSizeMeasure: "Cohen's dz",
    significanceThreshold: 0.05,
    missingDataStrategy: "Complete Cases",
    status: "Approved",
    state: "Approved",
    isPreregistered: true,
  };

  // Mock Approved Dataset Helper
  const createApprovedDataset = (
    id: string,
    filename: string,
    hash: string,
    rawPreview: Record<string, any>[]
  ): DatasetRecord => ({
    id,
    filename,
    fileHash: hash,
    uploadDate: new Date().toISOString(),
    recordCount: rawPreview.length,
    variableCount: Object.keys(rawPreview[0] || {}).length,
    variables: [
      { name: "id", type: "ID", missingCount: 0, uniqueValues: rawPreview.length },
      { name: "pre_score", type: "Numeric", missingCount: 0, uniqueValues: rawPreview.length },
      { name: "post_score", type: "Numeric", missingCount: 0, uniqueValues: rawPreview.length },
    ],
    missingnessPercent: 0,
    isAnonymizedConfirmed: true,
    state: "Approved for Analysis",
    rawPreview,
  });

  it("1. Materially different datasets produce different outputs", () => {
    // Dataset A: Pre vs Post difference is +10 on average
    const dataA = [
      { id: "S1", pre_score: 10, post_score: 20 },
      { id: "S2", pre_score: 12, post_score: 22 },
      { id: "S3", pre_score: 14, post_score: 24 },
      { id: "S4", pre_score: 16, post_score: 26 },
      { id: "S5", pre_score: 18, post_score: 28 },
    ];
    const dsA = createApprovedDataset("ds-A", "trial_A.csv", "hash-AAAA-1111-2222", dataA);

    // Dataset B: Pre vs Post difference is +1 on average with different variance
    const dataB = [
      { id: "S1", pre_score: 50, post_score: 51 },
      { id: "S2", pre_score: 52, post_score: 53 },
      { id: "S3", pre_score: 54, post_score: 55 },
      { id: "S4", pre_score: 56, post_score: 57 },
      { id: "S5", pre_score: 58, post_score: 59 },
    ];
    const dsB = createApprovedDataset("ds-B", "trial_B.csv", "hash-BBBB-3333-4444", dataB);

    const outputA = executePairedCrossoverAnalysis({
      dataset: dsA,
      plan: approvedPlan,
      outcomeVariable: "pre_score,post_score",
    });

    const outputB = executePairedCrossoverAnalysis({
      dataset: dsB,
      plan: approvedPlan,
      outcomeVariable: "pre_score,post_score",
    });

    expect(outputA.executionStatus).toBe("Completed");
    expect(outputB.executionStatus).toBe("Completed");

    // Output values MUST be different
    expect(outputA.numericResults.mean_diff).toBe(10);
    expect(outputB.numericResults.mean_diff).toBe(1);
    expect(outputA.numericResults.conditionA_mean).toBe(14);
    expect(outputB.numericResults.conditionA_mean).toBe(54);
    expect(outputA.reproducibilityHash).not.toBe(outputB.reproducibilityHash);
  });

  it("2. Missing variables fail clearly", () => {
    const data = [
      { id: "S1", pre_score: 10, post_score: 20 },
      { id: "S2", pre_score: 12, post_score: 22 },
    ];
    const dataset = createApprovedDataset("ds-1", "test.csv", "hash-12345", data);

    // Request non-existent column
    const output = executePairedCrossoverAnalysis({
      dataset,
      plan: approvedPlan,
      outcomeVariable: "non_existent_biomarker_xyz",
    });

    expect(output.executionStatus).toBe("Failed");
    expect(output.summaryText).toContain("Missing required variable 'non_existent_biomarker_xyz'");
    expect(output.warnings[0]).toContain("non_existent_biomarker_xyz");
  });

  it("3. No-data execution is blocked", () => {
    const emptyDataset = createApprovedDataset("ds-empty", "empty.csv", "hash-empty-000", []);

    const output = executePairedCrossoverAnalysis({
      dataset: emptyDataset,
      plan: approvedPlan,
      outcomeVariable: "pre_score,post_score",
    });

    expect(output.executionStatus).toBe("Failed");
    expect(output.summaryText).toContain("contains no raw data records");
    expect(output.executionStatus).not.toBe("Completed");
  });

  it("4. Numerical results are linked to exact dataset hash and plan ID", () => {
    const data = [
      { id: "S1", pre_score: 80, post_score: 95 },
      { id: "S2", pre_score: 75, post_score: 88 },
      { id: "S3", pre_score: 90, post_score: 99 },
    ];
    const dataset = createApprovedDataset("ds-provenance", "clinical_trial.csv", "sha256-abcdef123456789", data);

    const output = executePairedCrossoverAnalysis({
      dataset,
      plan: approvedPlan,
      outcomeVariable: "pre_score,post_score",
    });

    expect(output.executionStatus).toBe("Completed");
    expect(output.datasetHash).toBe("sha256-abcdef123456789");
    expect(output.planId).toBe(approvedPlan.id);
    expect(output.reproducibilityHash).toBeDefined();
    expect(output.reproducibilityHash).not.toBe("unverified");
    expect(output.isResearcherSupplied).toBe(false);
    expect(output.reproductionStatus).toBe("Independently Reproduced");
  });

  it("5. Failed execution never creates Completed or Approved status", () => {
    const data = [{ id: "S1", pre_score: 10, post_score: 20 }];

    // Dataset is NOT approved for analysis
    const unapprovedDataset: DatasetRecord = {
      ...createApprovedDataset("ds-unapp", "draft.csv", "hash-draft-999", data),
      state: "Uploaded",
      isAnonymizedConfirmed: false,
    };

    // Plan is NOT approved
    const draftPlan: AnalysisPlan = {
      ...approvedPlan,
      status: "Draft",
      state: "DraftPlan" as any,
    };

    const output = executePairedCrossoverAnalysis({
      dataset: unapprovedDataset,
      plan: draftPlan,
      outcomeVariable: "pre_score,post_score",
    });

    expect(output.executionStatus).toBe("Failed");
    expect(output.summaryText).toContain("Execution Blocked: Formal approval required");
    expect(output.executionStatus).not.toBe("Completed");
    expect(output.reproductionStatus).toBe("Not Independently Reproduced");
  });

  it("6. Figures and tables use stored analysis outputs only", () => {
    const data = [
      { id: "S1", pre_score: 100, post_score: 110 },
      { id: "S2", pre_score: 105, post_score: 115 },
      { id: "S3", pre_score: 110, post_score: 120 },
    ];
    const dataset = createApprovedDataset("ds-viz", "trial_viz.csv", "hash-viz-777", data);

    const output = executePairedCrossoverAnalysis({
      dataset,
      plan: approvedPlan,
      outcomeVariable: "pre_score,post_score",
    });

    const { figures, tables } = generateAnalysisFiguresAndTables(output, dataset, approvedPlan);

    expect(figures.length).toBeGreaterThan(0);
    expect(tables.length).toBeGreaterThan(0);

    // Verify Figure 1 uses stored analysis output numbers
    const fig1 = figures[0];
    expect(fig1.analysisRunId).toBe(output.id);
    expect(fig1.dataPoints[0].mean).toBe(output.numericResults.conditionA_mean); // 105
    expect(fig1.dataPoints[1].mean).toBe(output.numericResults.conditionB_mean); // 115

    // Verify Table 1 uses stored analysis output numbers
    const tbl1 = tables[0];
    expect(tbl1.analysisRunId).toBe(output.id);
    expect(tbl1.rows[2][2]).toContain(String(output.numericResults.mean_diff)); // 10
    expect(tbl1.rows[2][3]).toContain(String(output.numericResults.t_stat));
  });

  it("7. Imported external software logs are labelled researcher-supplied and Not Independently Reproduced", () => {
    const data = [{ id: "S1", pre_score: 10, post_score: 20 }];
    const dataset = createApprovedDataset("ds-imported", "external.csv", "hash-ext-555", data);

    const output = executePairedCrossoverAnalysis({
      dataset,
      plan: approvedPlan,
      outcomeVariable: "pre_score,post_score",
      isResearcherSuppliedLog: true,
    });

    expect(output.executionStatus).toBe("Completed");
    expect(output.isResearcherSupplied).toBe(true);
    expect(output.reproductionStatus).toBe("Not Independently Reproduced");
    expect(output.summaryText).toContain("Not independently reproduced by TehqIQ");
  });
});
