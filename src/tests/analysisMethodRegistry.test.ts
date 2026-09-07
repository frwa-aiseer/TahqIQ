import { describe, expect, it } from "vitest";
import type { AnalysisPlan, DatasetRecord } from "../types";
import {
  analysisMethodRegistry,
  executePairedCrossoverAnalysis,
  executeRegisteredAnalysisMethod,
  resolveAnalysisMethod,
} from "../lib/statsEngine";

const plan: AnalysisPlan = {
  id: "plan-registry",
  title: "Approved paired comparison",
  researchQuestionId: "rq-registry",
  outcomeVariable: "before,after",
  predictorVariables: [],
  statisticalMethod: "Paired Student's t-test",
  assumptions: ["Normality of paired differences"],
  effectSizeMeasure: "Cohen's dz",
  significanceThreshold: 0.05,
  missingDataStrategy: "Complete cases",
  status: "Approved",
  state: "Approved",
  isPreregistered: false,
};

const dataset: DatasetRecord = {
  id: "dataset-registry",
  filename: "paired.csv",
  fileHash: "sha256-registry-fixture",
  uploadDate: "2026-09-07T00:00:00.000Z",
  recordCount: 3,
  variableCount: 3,
  variables: [
    { name: "id", type: "ID", missingCount: 0, uniqueValues: 3 },
    { name: "before", type: "Numeric", missingCount: 0, uniqueValues: 3 },
    { name: "after", type: "Numeric", missingCount: 0, uniqueValues: 3 },
  ],
  missingnessPercent: 0,
  isAnonymizedConfirmed: true,
  state: "Approved for Analysis",
  rawPreview: [
    { id: "P1", before: 10, after: 12 },
    { id: "P2", before: 12, after: 15 },
    { id: "P3", before: 14, after: 18 },
  ],
};

describe("AnalysisMethodRegistry", () => {
  it("registers the existing paired/crossover implementation as a complete method definition", () => {
    const method = analysisMethodRegistry.get("paired-crossover-comparison");
    expect(method?.family).toBe("paired-comparison");
    expect(method?.availability).toBe("Enabled");
    expect(method?.compatibleVariableTypes.outcome).toContain("Numeric");
    expect(method?.requiredInputs).toContain("approved analysis plan");
    expect(method?.assumptions).toContain("Observations are paired within participant");
    expect(method?.outputSchema.result).toBe("AnalysisOutput");
    expect(method?.diagnostics.map((item) => item.id)).toContain("crossover-carryover");
    expect(method?.reproducibility).toMatchObject({ deterministic: true, recordsDatasetHash: true, recordsPlanId: true });
  });

  it("preserves the validated paired execution through both legacy and registry entry points", () => {
    const options = { dataset, plan, outcomeVariable: "before,after" };
    const legacy = executePairedCrossoverAnalysis(options);
    const registered = executeRegisteredAnalysisMethod("paired-crossover-comparison", options);
    expect(legacy.executionStatus).toBe("Completed");
    expect(registered.executionStatus).toBe("Completed");
    expect(registered.numericResults.mean_diff).toBe(legacy.numericResults.mean_diff);
    expect(registered.datasetHash).toBe(dataset.fileHash);
  });

  it.each([
    "Chi-square test",
    "Qualitative thematic analysis",
    "Not configured",
  ])("does not assign paired or crossover assumptions to unrelated method '%s'", (methodName) => {
    expect(resolveAnalysisMethod(methodName)).toBeUndefined();
    expect(() => executeRegisteredAnalysisMethod(methodName, { dataset, plan })).toThrow("is not configured");
  });

  it("resolves a general independent comparison without crossover assumptions", () => {
    const method = resolveAnalysisMethod("Independent samples t-test");
    expect(method?.id).toBe("independent-t");
    expect(method?.assumptions.join(" ")).not.toMatch(/paired|crossover|carryover|period|sequence/i);
  });

  it("resolves linear regression without crossover assumptions", () => {
    const method = resolveAnalysisMethod("Linear regression");
    expect(method?.id).toBe("linear-regression");
    expect(method?.assumptions.join(" ")).not.toMatch(/paired|crossover|carryover|period|sequence/i);
  });
});
