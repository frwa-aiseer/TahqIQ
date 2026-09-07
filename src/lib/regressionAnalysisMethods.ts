import type { AnalysisOutput, AnalysisPlan, DatasetRecord } from "../types";
import type { AnalysisMethodDefinition, AnalysisMethodRegistry } from "./analysisMethodRegistry";
import { normalCdf, studentTTwoTailedPValue } from "./statsEngine";

export interface RegressionAnalysisInput {
  dataset: DatasetRecord;
  plan: AnalysisPlan;
  outcomeVariable?: string;
  alpha?: number;
}

type Matrix = number[][];
type RegressionData = { y: number[]; x: Matrix; predictors: string[]; excluded: number };
const SOFTWARE = "TehqIQ Deterministic Regression Engine v1.0";
const round = (value: number, digits = 6) => Number(value.toFixed(digits));

function tCritical(df: number, alpha: number): number {
  let low = 0, high = 20;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    if (studentTTwoTailedPValue(middle, df) > alpha) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function normalCritical(alpha: number): number {
  let low = 0, high = 10;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    if (2 * (1 - normalCdf(middle)) > alpha) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function transpose(matrix: Matrix): Matrix {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function multiply(a: Matrix, b: Matrix): Matrix {
  return a.map((row) => b[0].map((_, column) => row.reduce((sum, value, index) => sum + value * b[index][column], 0)));
}

function invert(matrix: Matrix): Matrix | undefined {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    if (Math.abs(augmented[pivot][column]) < 1e-12) return undefined;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / divisor);
    for (let row = 0; row < n; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index]);
    }
  }
  return augmented.map((row) => row.slice(n));
}

function matrixVector(matrix: Matrix, vector: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function hash(text: string): string {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return `fnv1a-${(value >>> 0).toString(16).padStart(8, "0")}`;
}

function fail(input: RegressionAnalysisInput, method: string, reason: string): AnalysisOutput {
  const timestamp = new Date().toISOString();
  return {
    id: `an-failed-${method}-${Date.now()}`, analysisPlanId: input.plan.id, planId: input.plan.id,
    datasetHash: input.dataset.fileHash, executionTimestamp: timestamp, softwareEnvironment: SOFTWARE,
    summaryText: `Execution Failed: ${reason}`, numericResults: { status: "Failed", reason },
    pValues: [], effectSizes: [], assumptionChecks: [], isReproduced: false,
    reproducibilityHash: "not-independently-reproduced", executionStatus: "Failed", state: "Failed",
    isResearcherSupplied: false, reproductionStatus: "Not Independently Reproduced",
    logs: [`[${timestamp}] ${reason}`], warnings: [reason],
  };
}

function validateAndExtract(input: RegressionAnalysisInput, binary: boolean): RegressionData | string {
  const { dataset, plan } = input;
  if (!dataset || !plan) return "Dataset and analysis plan are required.";
  if (dataset.state !== "Approved for Analysis" && dataset.state !== "Locked") return "Dataset requires approval for analysis.";
  if (plan.status !== "Approved" && plan.state !== "Approved" && plan.state !== "Completed") return "Analysis plan requires researcher approval.";
  const rows = dataset.rawPreview ?? [];
  if (!rows.length) return "Dataset contains no raw records.";
  const outcome = input.outcomeVariable ?? plan.outcomeVariable;
  const predictors = plan.predictorVariables.filter(Boolean);
  if (!outcome || !predictors.length) return "One numeric outcome and at least one numeric predictor are required.";
  const available = new Set(Object.keys(rows[0] ?? {}));
  const missing = [outcome, ...predictors].find((name) => !available.has(name));
  if (missing) return `Required variable '${missing}' is missing.`;
  const y: number[] = [], x: Matrix = [];
  let excluded = 0;
  for (const row of rows) {
    const outcomeValue = row[outcome] === "" || row[outcome] === null ? NaN : Number(row[outcome]);
    const predictorValues = predictors.map((name) => row[name] === "" || row[name] === null ? NaN : Number(row[name]));
    if (!Number.isFinite(outcomeValue) || predictorValues.some((value) => !Number.isFinite(value))) { excluded++; continue; }
    y.push(outcomeValue); x.push([1, ...predictorValues]);
  }
  if (binary && (new Set(y).size !== 2 || y.some((value) => value !== 0 && value !== 1))) return "Binary logistic regression requires the outcome to contain both numeric classes 0 and 1 only.";
  if (y.length <= predictors.length + 1) return `Complete observations must exceed the ${predictors.length + 1} fitted parameters.`;
  return { y, x, predictors, excluded };
}

function complete(input: RegressionAnalysisInput, method: string, label: string, numericResults: AnalysisOutput["numericResults"], pValues: AnalysisOutput["pValues"], effectSizes: AnalysisOutput["effectSizes"], code: string, counts: Record<string, number>, warnings: string[] = []): AnalysisOutput {
  const timestamp = new Date().toISOString();
  const reproducibilityHash = hash(JSON.stringify({ method, datasetHash: input.dataset.fileHash, planId: input.plan.id, numericResults, counts }));
  return {
    id: `an-${method}-${Date.now()}`, analysisPlanId: input.plan.id, planId: input.plan.id, datasetHash: input.dataset.fileHash,
    executionTimestamp: timestamp, softwareEnvironment: SOFTWARE, summaryText: `${label} fitted to ${counts.completeObservations} complete observations.`,
    numericResults: { ...numericResults, counts }, pValues, effectSizes,
    assumptionChecks: [
      { assumption: "Observations and model specification are appropriate", met: false, testUsed: "Researcher verification required", note: "Independence, sampling design, causal interpretation, and specification cannot be established from values alone." },
      { assumption: "Predictor matrix has full rank", met: true, testUsed: "Deterministic matrix inversion" },
    ],
    isReproduced: true, reproducibilityHash, executionStatus: "Completed", state: "Completed",
    isResearcherSupplied: false, reproductionStatus: "Independently Reproduced", code,
    packageVersions: { TehqIQ_Regression_Engine: "1.0.0" },
    parameters: { method, outcomeVariable: input.outcomeVariable ?? input.plan.outcomeVariable, predictorVariables: input.plan.predictorVariables.join(",") },
    logs: [`[${timestamp}] Fitted ${method} using dataset hash ${input.dataset.fileHash} and plan ${input.plan.id}.`], warnings,
  };
}

function executeLinearRegression(input: RegressionAnalysisInput): AnalysisOutput {
  const data = validateAndExtract(input, false);
  if (typeof data === "string") return fail(input, "linear-regression", data);
  const xt = transpose(data.x), xtxInverse = invert(multiply(xt, data.x));
  if (!xtxInverse) return fail(input, "linear-regression", "Predictor matrix is singular; coefficients are not identifiable.");
  const coefficients = matrixVector(xtxInverse, matrixVector(xt, data.y));
  const fitted = data.x.map((row) => row.reduce((sum, value, index) => sum + value * coefficients[index], 0));
  const residuals = data.y.map((value, index) => value - fitted[index]);
  const sse = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const yMean = data.y.reduce((sum, value) => sum + value, 0) / data.y.length;
  const sst = data.y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const df = data.y.length - coefficients.length;
  if (df <= 0 || sst === 0) return fail(input, "linear-regression", "Positive residual degrees of freedom and outcome variance are required.");
  const mse = sse / df;
  const standardErrors = xtxInverse.map((row, index) => Math.sqrt(Math.max(0, row[index] * mse)));
  const names = ["Intercept", ...data.predictors];
  const alpha = input.alpha ?? input.plan.significanceThreshold ?? 0.05;
  const critical = tCritical(df, alpha);
  const coefficientResults: Record<string, Record<string, number>> = {};
  const pValues: AnalysisOutput["pValues"] = [];
  names.forEach((name, index) => {
    const t = standardErrors[index] > 0 ? coefficients[index] / standardErrors[index] : 0;
    const p = standardErrors[index] > 0 ? studentTTwoTailedPValue(t, df) : 1;
    coefficientResults[name] = { estimate: round(coefficients[index]), standardError: round(standardErrors[index]), t: round(t), pValue: round(p), ciLower: round(coefficients[index] - critical * standardErrors[index]), ciUpper: round(coefficients[index] + critical * standardErrors[index]) };
    pValues.push({ test: `${name} coefficient`, pValue: p, significant: p < alpha, formatted: p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(4)}` });
  });
  const rSquared = 1 - sse / sst;
  const adjustedRSquared = 1 - (1 - rSquared) * (data.y.length - 1) / df;
  return complete(input, "linear-regression", "Ordinary least-squares linear regression", { coefficients: coefficientResults, rSquared: round(rSquared), adjustedRSquared: round(adjustedRSquared), residualStandardError: round(Math.sqrt(mse)), residualDf: df, sse: round(sse) }, pValues, [{ metric: "R squared", value: round(rSquared) }], `ols(outcome=${input.outcomeVariable ?? input.plan.outcomeVariable}, predictors=${data.predictors.join(",")})`, { completeObservations: data.y.length, excludedObservations: data.excluded });
}

function executeLogisticRegression(input: RegressionAnalysisInput): AnalysisOutput {
  const data = validateAndExtract(input, true);
  if (typeof data === "string") return fail(input, "binary-logistic-regression", data);
  const parameterCount = data.x[0].length;
  let coefficients = Array(parameterCount).fill(0);
  let converged = false;
  let covariance: Matrix | undefined;
  let iterations = 0;
  for (iterations = 1; iterations <= 100; iterations++) {
    const eta = matrixVector(data.x, coefficients);
    const probabilities = eta.map((value) => 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, value)))));
    const weights = probabilities.map((value) => Math.max(1e-9, value * (1 - value)));
    const xt = transpose(data.x);
    const information = multiply(xt, data.x.map((row, i) => row.map((value) => value * weights[i])));
    covariance = invert(information);
    if (!covariance) return fail(input, "binary-logistic-regression", "Weighted predictor matrix is singular; coefficients are not identifiable.");
    const score = matrixVector(xt, data.y.map((value, i) => value - probabilities[i]));
    const delta = matrixVector(covariance, score);
    coefficients = coefficients.map((value, index) => value + delta[index]);
    if (coefficients.some((value) => !Number.isFinite(value) || Math.abs(value) > 50)) return fail(input, "binary-logistic-regression", "Model exhibits complete or quasi-complete separation; stable coefficients are unavailable.");
    if (Math.max(...delta.map(Math.abs)) < 1e-8) { converged = true; break; }
  }
  if (!converged || !covariance) return fail(input, "binary-logistic-regression", "Maximum-likelihood fitting did not converge within 100 iterations.");
  const names = ["Intercept", ...data.predictors];
  const alpha = input.alpha ?? input.plan.significanceThreshold ?? 0.05;
  const critical = normalCritical(alpha);
  const coefficientResults: Record<string, Record<string, number>> = {};
  const pValues: AnalysisOutput["pValues"] = [];
  names.forEach((name, index) => {
    const standardError = Math.sqrt(Math.max(0, covariance![index][index]));
    const z = standardError > 0 ? coefficients[index] / standardError : 0;
    const p = standardError > 0 ? Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.abs(z))))) : 1;
    coefficientResults[name] = { estimate: round(coefficients[index]), standardError: round(standardError), z: round(z), pValue: round(p), oddsRatio: round(Math.exp(coefficients[index])), oddsRatioCiLower: round(Math.exp(coefficients[index] - critical * standardError)), oddsRatioCiUpper: round(Math.exp(coefficients[index] + critical * standardError)) };
    pValues.push({ test: `${name} coefficient`, pValue: p, significant: p < alpha, formatted: p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(4)}` });
  });
  const probabilities = matrixVector(data.x, coefficients).map((value) => 1 / (1 + Math.exp(-value)));
  const logLikelihood = data.y.reduce((sum, value, i) => sum + value * Math.log(Math.max(1e-15, probabilities[i])) + (1 - value) * Math.log(Math.max(1e-15, 1 - probabilities[i])), 0);
  return complete(input, "binary-logistic-regression", "Binary logistic regression", { coefficients: coefficientResults, logLikelihood: round(logLikelihood), deviance: round(-2 * logLikelihood), iterations, converged: "Yes" }, pValues, data.predictors.map((name, index) => ({ metric: `Odds ratio: ${name}`, value: round(Math.exp(coefficients[index + 1])) })), `logistic_regression(outcome=${input.outcomeVariable ?? input.plan.outcomeVariable}, predictors=${data.predictors.join(",")})`, { completeObservations: data.y.length, events: data.y.filter((value) => value === 1).length, nonEvents: data.y.filter((value) => value === 0).length, excludedObservations: data.excluded });
}

const enabled = (id: string, label: string, aliases: string[], execute: (input: RegressionAnalysisInput) => AnalysisOutput): AnalysisMethodDefinition<RegressionAnalysisInput> => ({
  id, family: "regression", label, aliases, availability: "Enabled",
  compatibleVariableTypes: { outcome: ["Numeric"], predictors: ["Numeric"] },
  requiredInputs: ["approved dataset", "approved analysis plan", "outcome variable", "one or more numeric predictors"],
  assumptions: ["Independent observations", "Correct model specification", "Full-rank predictor matrix"],
  outputSchema: { result: "AnalysisOutput", coefficients: "estimate, standard error, test statistic, p-value and confidence interval", provenance: "dataset hash, plan ID, method ID and reproducibility hash" },
  diagnostics: [{ id: "matrix-rank", label: "Identifiability", description: "Fails if the fitted predictor matrix is singular." }, { id: "assumption-review", label: "Researcher assumption review", description: "Design and specification assumptions remain unverified." }],
  reproducibility: { deterministic: true, recordsDatasetHash: true, recordsPlanId: true, emitsCode: true }, execute,
});

const disabled = (id: string, family: string, label: string, aliases: string[], availability: "Planned" | "Unavailable", reason: string): AnalysisMethodDefinition<RegressionAnalysisInput> => ({
  id, family, label, aliases, availability, availabilityReason: reason,
  compatibleVariableTypes: {}, requiredInputs: [], assumptions: [],
  outputSchema: { status: `${availability}: no executable output schema` }, diagnostics: [],
  reproducibility: { deterministic: false, recordsDatasetHash: false, recordsPlanId: false, emitsCode: false },
});

export function registerRegressionSurvivalDiagnosticMethods(registry: AnalysisMethodRegistry): void {
  [
    enabled("linear-regression", "Ordinary least-squares linear regression", ["OLS regression", "multiple linear regression"], executeLinearRegression),
    enabled("binary-logistic-regression", "Binary logistic regression", ["logistic regression", "binomial logistic regression"], executeLogisticRegression),
    disabled("poisson-regression", "count-regression", "Poisson regression", ["Poisson count model"], "Planned", "A validated count-outcome and overdispersion diagnostic contract is not implemented."),
    disabled("negative-binomial-regression", "count-regression", "Negative-binomial regression", ["negative binomial model"], "Planned", "A validated dispersion estimator and count-outcome contract are not implemented."),
    disabled("kaplan-meier", "survival", "Kaplan–Meier estimator", ["Kaplan Meier survival analysis"], "Planned", "Validated time-to-event, censoring, strata, and risk-table contracts are not implemented."),
    disabled("cox-proportional-hazards", "survival", "Cox proportional-hazards model", ["Cox regression"], "Planned", "Validated censoring, ties, and proportional-hazards diagnostics are not implemented."),
    disabled("diagnostic-sensitivity-specificity", "diagnostic", "Sensitivity and specificity", ["diagnostic accuracy"], "Unavailable", "Reference-standard polarity, index-test threshold, and indeterminate-result contracts are not configured."),
    disabled("diagnostic-roc-auc", "diagnostic", "ROC curve and AUC", ["ROC AUC", "receiver operating characteristic"], "Unavailable", "Reference-standard polarity, score direction, threshold, and uncertainty contracts are not configured."),
  ].forEach((definition) => registry.register(definition));
}
