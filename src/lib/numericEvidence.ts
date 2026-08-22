import type { AnalysisOutput, NumericEvidence } from "../types";

function collectNumbers(value: unknown, path: string, records: Array<{ path: string; value: number }>): void {
  if (typeof value === "number" && Number.isFinite(value)) {
    records.push({ path, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectNumbers(item, `${path}[${index}]`, records));
    return;
  }
  if (typeof value === "string") {
    for (const match of value.matchAll(/(?<![\w.])-?\d+(?:\.\d+)?(?!\w|\.\d)/g)) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed)) records.push({ path, value: parsed });
    }
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectNumbers(item, path ? `${path}.${key}` : key, records));
  }
}

/** Creates provenance records only from numeric fields stored by a completed analysis run. */
export function createNumericEvidenceFromAnalysis(output: AnalysisOutput): NumericEvidence[] {
  if (output.executionStatus !== "Completed" || !output.id?.trim() || !output.datasetHash?.trim()) return [];

  const collected: Array<{ path: string; value: number }> = [];
  collectNumbers(output.numericResults, "numericResults", collected);
  collectNumbers(output.summaryText, "summaryText", collected);
  collectNumbers(output.pValues, "pValues", collected);
  collectNumbers(output.effectSizes, "effectSizes", collected);
  collectNumbers(output.assumptionChecks, "assumptionChecks", collected);

  const unique = new Map<string, { path: string; value: number }>();
  collected.forEach((item) => unique.set(`${item.path}:${item.value}`, item));
  return Array.from(unique.values()).map(({ path, value }) => ({
    id: `numeric-${output.id}-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`,
    value,
    normalizedValue: value,
    sourceType: "ANALYSIS_OUTPUT",
    sourceId: output.id,
    datasetHash: output.datasetHash,
    analysisRunId: output.id,
    variableName: path,
    verificationState: "Verified",
    createdAt: output.executionTimestamp,
  }));
}
