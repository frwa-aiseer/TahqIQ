import type { AnalysisOutput, AnalysisPlan, DatasetRecord } from "../types";
import type { AnalysisMethodDefinition, AnalysisMethodRegistry } from "./analysisMethodRegistry";
import { normalCdf, studentTTwoTailedPValue } from "./statsEngine";

export interface SpecializedAnalysisInput {
  dataset: DatasetRecord;
  plan: AnalysisPlan;
  outcomeVariable?: string;
  alpha?: number;
}

export interface SpecializedAnalysisFamily {
  id: "meta-analysis" | "ml-evaluation" | "engineering-computational" | "survey-psychometrics";
  label: string;
  scope: string;
}

export const SPECIALIZED_ANALYSIS_FAMILIES: readonly SpecializedAnalysisFamily[] = Object.freeze([
  { id: "meta-analysis", label: "Meta-analysis", scope: "Evidence synthesis from researcher-supplied study-level estimates and uncertainty." },
  { id: "ml-evaluation", label: "Machine-learning evaluation", scope: "Held-out evaluation only; training, tuning, and data splitting are outside the executor." },
  { id: "engineering-computational", label: "Engineering and computational analysis", scope: "Deterministic comparison of observed/reference and simulated/predicted numeric values." },
  { id: "survey-psychometrics", label: "Survey and psychometrics", scope: "Deterministic reliability analysis of researcher-designated numeric items." },
]);

const SOFTWARE = "TehqIQ Deterministic Specialized Analysis Engine v1.0";
const round = (value: number, digits = 6) => Number(value.toFixed(digits));
const finite = (value: unknown): number | undefined => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const variance = (values: number[]) => values.length > 1 ? values.reduce((sum, value) => sum + (value - mean(values)) ** 2, 0) / (values.length - 1) : 0;

function criticalValue(alpha: number, df?: number): number {
  let low = 0, high = 20;
  for (let index = 0; index < 100; index++) {
    const middle = (low + high) / 2;
    const tail = df === undefined ? 2 * (1 - normalCdf(middle)) : studentTTwoTailedPValue(middle, df);
    if (tail > alpha) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function hash(text: string): string {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  return `fnv1a-${(value >>> 0).toString(16).padStart(8, "0")}`;
}

function failure(input: SpecializedAnalysisInput, method: string, reason: string): AnalysisOutput {
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

function baseValidation(input: SpecializedAnalysisInput): string | undefined {
  if (!input.dataset || !input.plan) return "Dataset and analysis plan are required.";
  if (input.dataset.state !== "Approved for Analysis" && input.dataset.state !== "Locked") return "Dataset requires approval for analysis.";
  if (input.plan.status !== "Approved" && input.plan.state !== "Approved" && input.plan.state !== "Completed") return "Analysis plan requires researcher approval.";
  if (!input.dataset.rawPreview?.length) return "Dataset contains no raw records.";
}

function complete(input: SpecializedAnalysisInput, method: string, label: string, results: AnalysisOutput["numericResults"], pValues: AnalysisOutput["pValues"], effects: AnalysisOutput["effectSizes"], counts: Record<string, number>, assumptions: AnalysisOutput["assumptionChecks"], code: string, warnings: string[] = []): AnalysisOutput {
  const timestamp = new Date().toISOString();
  return {
    id: `an-${method}-${Date.now()}`, analysisPlanId: input.plan.id, planId: input.plan.id,
    datasetHash: input.dataset.fileHash, executionTimestamp: timestamp, softwareEnvironment: SOFTWARE,
    summaryText: `${label} completed from researcher-approved dataset records.`, numericResults: { ...results, counts },
    pValues, effectSizes: effects, assumptionChecks: assumptions, isReproduced: true,
    reproducibilityHash: hash(JSON.stringify({ method, datasetHash: input.dataset.fileHash, planId: input.plan.id, results, counts })),
    executionStatus: "Completed", state: "Completed", isResearcherSupplied: false,
    reproductionStatus: "Independently Reproduced", code,
    packageVersions: { TehqIQ_Specialized_Engine: "1.0.0" },
    parameters: { method, outcomeVariable: input.outcomeVariable ?? input.plan.outcomeVariable, predictorVariables: input.plan.predictorVariables.join(",") },
    logs: [`[${timestamp}] Executed ${method} using dataset hash ${input.dataset.fileHash} and plan ${input.plan.id}.`], warnings,
  };
}

function requireColumns(input: SpecializedAnalysisInput, columns: string[]): string | undefined {
  const available = new Set(Object.keys(input.dataset.rawPreview?.[0] ?? {}));
  const missing = columns.find((column) => !column || !available.has(column));
  return missing ? `Required variable '${missing || "Researcher input required"}' is missing.` : undefined;
}

function executeFixedEffectMetaAnalysis(input: SpecializedAnalysisInput): AnalysisOutput {
  const invalid = baseValidation(input); if (invalid) return failure(input, "fixed-effect-meta-analysis", invalid);
  const effectColumn = input.outcomeVariable ?? input.plan.outcomeVariable;
  const standardErrorColumn = input.plan.predictorVariables[0];
  const missing = requireColumns(input, [effectColumn, standardErrorColumn]); if (missing) return failure(input, "fixed-effect-meta-analysis", missing);
  const studies: { effect: number; standardError: number }[] = [];
  let excluded = 0;
  for (const row of input.dataset.rawPreview ?? []) {
    const effect = finite(row[effectColumn]), standardError = finite(row[standardErrorColumn]);
    if (effect === undefined || standardError === undefined || standardError <= 0) { excluded++; continue; }
    studies.push({ effect, standardError });
  }
  if (studies.length < 2) return failure(input, "fixed-effect-meta-analysis", "At least two study estimates with positive standard errors are required.");
  const weights = studies.map((study) => 1 / study.standardError ** 2);
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const pooled = studies.reduce((sum, study, index) => sum + study.effect * weights[index], 0) / weightSum;
  const pooledSe = Math.sqrt(1 / weightSum), z = pooled / pooledSe;
  const p = Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))));
  const critical = criticalValue(input.alpha ?? input.plan.significanceThreshold ?? 0.05);
  const q = studies.reduce((sum, study, index) => sum + weights[index] * (study.effect - pooled) ** 2, 0);
  const qDf = studies.length - 1, iSquared = q > 0 ? Math.max(0, (q - qDf) / q) * 100 : 0;
  return complete(input, "fixed-effect-meta-analysis", "Fixed-effect inverse-variance meta-analysis", { pooledEstimate: round(pooled), standardError: round(pooledSe), z: round(z), pValue: round(p), ciLower: round(pooled - critical * pooledSe), ciUpper: round(pooled + critical * pooledSe), cochranQ: round(q), qDf, iSquaredPercent: round(iSquared) }, [{ test: "Pooled fixed-effect estimate", pValue: p, significant: p < (input.alpha ?? input.plan.significanceThreshold ?? 0.05), formatted: p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(4)}` }], [{ metric: "Pooled effect estimate", value: round(pooled), ciLower: round(pooled - critical * pooledSe), ciUpper: round(pooled + critical * pooledSe) }], { includedStudies: studies.length, excludedStudies: excluded }, [{ assumption: "Effect estimates share a common true effect and compatible scale", met: false, testUsed: "Researcher verification required", note: "Clinical/methodological compatibility and effect-scale direction are not inferable from numbers." }, { assumption: "Standard errors are positive", met: true, testUsed: "Deterministic input validation" }], `fixed_effect_inverse_variance(effect=${effectColumn}, se=${standardErrorColumn})`, ["I-squared is descriptive and imprecise with few studies; it is not proof of homogeneity."]);
}

function executeMlBinaryEvaluation(input: SpecializedAnalysisInput): AnalysisOutput {
  const invalid = baseValidation(input); if (invalid) return failure(input, "ml-binary-holdout-evaluation", invalid);
  const truthColumn = input.outcomeVariable ?? input.plan.outcomeVariable;
  const [probabilityColumn, splitColumn, idColumn] = input.plan.predictorVariables;
  const missing = requireColumns(input, [truthColumn, probabilityColumn, splitColumn, idColumn]); if (missing) return failure(input, "ml-binary-holdout-evaluation", missing);
  const trainIds = new Set<string>(), validationIds = new Set<string>();
  const test: { truth: number; probability: number }[] = [];
  let excludedTest = 0;
  for (const row of input.dataset.rawPreview ?? []) {
    const split = String(row[splitColumn] ?? "").trim().toLowerCase();
    const id = String(row[idColumn] ?? "").trim();
    if (!id) return failure(input, "ml-binary-holdout-evaluation", "Every split record requires a non-empty sample ID for leakage checks.");
    if (split === "train") trainIds.add(id);
    else if (split === "validation" || split === "validate" || split === "val") validationIds.add(id);
    else if (split === "test") {
      const truth = finite(row[truthColumn]), probability = finite(row[probabilityColumn]);
      if (truth === undefined || probability === undefined) { excludedTest++; continue; }
      if ((truth !== 0 && truth !== 1) || probability < 0 || probability > 1) return failure(input, "ml-binary-holdout-evaluation", "Test truth must be numeric 0/1 and predicted probabilities must be within [0,1].");
      if (trainIds.has(id) || validationIds.has(id)) return failure(input, "ml-binary-holdout-evaluation", `Sample ID '${id}' occurs across training/validation and test splits; leakage detected.`);
      test.push({ truth, probability });
    } else return failure(input, "ml-binary-holdout-evaluation", `Split '${split || "Missing"}' is invalid; use Train, Validation, or Test.`);
  }
  const allTestIds = new Set((input.dataset.rawPreview ?? []).filter((row) => String(row[splitColumn]).toLowerCase() === "test").map((row) => String(row[idColumn])));
  const leakedId = [...allTestIds].find((id) => trainIds.has(id) || validationIds.has(id));
  if (leakedId) return failure(input, "ml-binary-holdout-evaluation", `Sample ID '${leakedId}' occurs across training/validation and test splits; leakage detected.`);
  if (!trainIds.size || test.length < 2 || new Set(test.map((row) => row.truth)).size !== 2) return failure(input, "ml-binary-holdout-evaluation", "A non-empty Train split and at least two valid Test records containing both classes are required.");
  let tp = 0, tn = 0, fp = 0, fn = 0;
  test.forEach(({ truth, probability }) => { const predicted = probability >= 0.5 ? 1 : 0; if (truth === 1 && predicted === 1) tp++; else if (truth === 0 && predicted === 0) tn++; else if (truth === 0) fp++; else fn++; });
  const accuracy = (tp + tn) / test.length, precision = tp + fp ? tp / (tp + fp) : 0, recall = tp + fn ? tp / (tp + fn) : 0, specificity = tn + fp ? tn / (tn + fp) : 0;
  const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
  const brier = mean(test.map((row) => (row.probability - row.truth) ** 2));
  const logLoss = -mean(test.map((row) => row.truth * Math.log(Math.max(1e-15, row.probability)) + (1 - row.truth) * Math.log(Math.max(1e-15, 1 - row.probability))));
  const bins = Array.from({ length: 10 }, () => [] as { truth: number; probability: number }[]);
  test.forEach((row) => bins[Math.min(9, Math.floor(row.probability * 10))].push(row));
  const expectedCalibrationError = bins.reduce((sum, bin) => bin.length ? sum + bin.length / test.length * Math.abs(mean(bin.map((row) => row.probability)) - mean(bin.map((row) => row.truth))) : sum, 0);
  return complete(input, "ml-binary-holdout-evaluation", "Held-out binary classification evaluation", { threshold: 0.5, accuracy: round(accuracy), precision: round(precision), recallSensitivity: round(recall), specificity: round(specificity), f1: round(f1), brierScore: round(brier), logLoss: round(logLoss), expectedCalibrationError10Bin: round(expectedCalibrationError), truePositive: tp, trueNegative: tn, falsePositive: fp, falseNegative: fn }, [], [{ metric: "Accuracy", value: round(accuracy) }, { metric: "Brier score", value: round(brier) }], { trainRecords: trainIds.size, validationRecords: validationIds.size, testRecords: test.length, excludedTestRecords: excludedTest }, [{ assumption: "Test split was held out from training and tuning", met: false, testUsed: "ID overlap check only", note: "No cross-split ID overlap was detected, but procedural holdout must be confirmed by the researcher." }, { assumption: "Probability direction and positive class are correct", met: false, testUsed: "Researcher verification required", note: "The executor uses numeric class 1 and threshold 0.5 exactly as supplied." }], `evaluate_binary_holdout(truth=${truthColumn}, probability=${probabilityColumn}, split=${splitColumn}, id=${idColumn}, threshold=0.5)`, ["No model training, hyperparameter tuning, cross-validation, or threshold optimization was performed.", "Calibration error is descriptive and depends on ten fixed probability bins."]);
}

function executeEngineeringError(input: SpecializedAnalysisInput): AnalysisOutput {
  const invalid = baseValidation(input); if (invalid) return failure(input, "engineering-error-analysis", invalid);
  const referenceColumn = input.outcomeVariable ?? input.plan.outcomeVariable;
  const predictedColumn = input.plan.predictorVariables[0];
  const missing = requireColumns(input, [referenceColumn, predictedColumn]); if (missing) return failure(input, "engineering-error-analysis", missing);
  const errors: number[] = [], references: number[] = [];
  let excluded = 0;
  for (const row of input.dataset.rawPreview ?? []) {
    const reference = finite(row[referenceColumn]), predicted = finite(row[predictedColumn]);
    if (reference === undefined || predicted === undefined) { excluded++; continue; }
    references.push(reference); errors.push(predicted - reference);
  }
  if (errors.length < 2) return failure(input, "engineering-error-analysis", "At least two complete reference/prediction pairs are required.");
  const bias = mean(errors), mae = mean(errors.map(Math.abs)), rmse = Math.sqrt(mean(errors.map((value) => value ** 2)));
  const errorSd = Math.sqrt(variance(errors)), se = errorSd / Math.sqrt(errors.length), referenceRange = Math.max(...references) - Math.min(...references);
  const critical = criticalValue(input.alpha ?? input.plan.significanceThreshold ?? 0.05, errors.length - 1);
  return complete(input, "engineering-error-analysis", "Engineering prediction/error analysis", { biasMeanError: round(bias), meanAbsoluteError: round(mae), rootMeanSquaredError: round(rmse), errorStandardDeviation: round(errorSd), biasCiLower: round(bias - critical * se), biasCiUpper: round(bias + critical * se), normalizedRmseByReferenceRange: referenceRange > 0 ? round(rmse / referenceRange) : "Not available: reference range is zero" }, [], [{ metric: "Root mean squared error", value: round(rmse) }, { metric: "Mean absolute error", value: round(mae) }], { completePairs: errors.length, excludedPairs: excluded }, [{ assumption: "Reference values and prediction units are comparable", met: false, testUsed: "Researcher verification required" }, { assumption: "Pairing is correct", met: false, testUsed: "Complete-row structure only", note: "Row completeness does not establish scientific pairing." }], `prediction_error(reference=${referenceColumn}, predicted=${predictedColumn})`);
}

function executeCronbachAlpha(input: SpecializedAnalysisInput): AnalysisOutput {
  const invalid = baseValidation(input); if (invalid) return failure(input, "cronbach-alpha", invalid);
  const items = (input.outcomeVariable ?? input.plan.outcomeVariable).split(",").map((item) => item.trim()).filter(Boolean);
  if (items.length < 2) return failure(input, "cronbach-alpha", "At least two comma-separated numeric item columns are required.");
  const missing = requireColumns(input, items); if (missing) return failure(input, "cronbach-alpha", missing);
  const matrix: number[][] = []; let excluded = 0;
  for (const row of input.dataset.rawPreview ?? []) {
    const values = items.map((item) => finite(row[item]));
    if (values.some((value) => value === undefined)) { excluded++; continue; }
    matrix.push(values as number[]);
  }
  if (matrix.length < 2) return failure(input, "cronbach-alpha", "At least two complete respondent records are required.");
  const itemVariances = items.map((_, index) => variance(matrix.map((row) => row[index])));
  const totalScores = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const totalVariance = variance(totalScores);
  if (totalVariance <= 0) return failure(input, "cronbach-alpha", "Total-score variance must be positive.");
  const alpha = items.length / (items.length - 1) * (1 - itemVariances.reduce((sum, value) => sum + value, 0) / totalVariance);
  return complete(input, "cronbach-alpha", "Cronbach's alpha internal-consistency analysis", { cronbachAlpha: round(alpha), itemCount: items.length, itemVariances: Object.fromEntries(items.map((item, index) => [item, round(itemVariances[index])])), totalScoreVariance: round(totalVariance) }, [], [{ metric: "Cronbach's alpha", value: round(alpha) }], { completeRespondents: matrix.length, excludedRespondents: excluded, items: items.length }, [{ assumption: "Items form a substantively appropriate scale", met: false, testUsed: "Researcher verification required", note: "Alpha does not establish unidimensionality or validity." }, { assumption: "Items are numeric and complete for included respondents", met: true, testUsed: "Deterministic complete-case validation" }], `cronbach_alpha(items=${items.join(",")})`, ["Internal consistency is not evidence of unidimensionality, construct validity, or test-retest reliability."]);
}

const enabled = (id: string, family: SpecializedAnalysisFamily["id"], label: string, aliases: string[], requiredInputs: string[], execute: (input: SpecializedAnalysisInput) => AnalysisOutput): AnalysisMethodDefinition<SpecializedAnalysisInput> => ({
  id, family, label, aliases, availability: "Enabled", compatibleVariableTypes: { inputs: ["Numeric", "Categorical", "ID"] }, requiredInputs,
  assumptions: ["Researcher-confirmed scientific meaning and design"], outputSchema: { result: "AnalysisOutput", estimates: "method-specific deterministic estimates", provenance: "dataset hash, plan ID, method ID and reproducibility hash" },
  diagnostics: [{ id: "input-contract", label: "Input contract", description: "Approval, columns, finite values, counts, and method-specific constraints." }],
  reproducibility: { deterministic: true, recordsDatasetHash: true, recordsPlanId: true, emitsCode: true }, execute,
});

const disabled = (id: string, family: SpecializedAnalysisFamily["id"], label: string, aliases: string[], availability: "Planned" | "Unavailable", reason: string): AnalysisMethodDefinition<SpecializedAnalysisInput> => ({
  id, family, label, aliases, availability, availabilityReason: reason, compatibleVariableTypes: {}, requiredInputs: [], assumptions: [],
  outputSchema: { status: `${availability}: no executable output schema` }, diagnostics: [],
  reproducibility: { deterministic: false, recordsDatasetHash: false, recordsPlanId: false, emitsCode: false },
});

export function registerSpecializedAnalysisMethods(registry: AnalysisMethodRegistry): void {
  [
    enabled("fixed-effect-meta-analysis", "meta-analysis", "Fixed-effect inverse-variance meta-analysis", ["fixed effect meta analysis"], ["approved study-level dataset", "effect estimate", "positive standard error"], executeFixedEffectMetaAnalysis),
    enabled("ml-binary-holdout-evaluation", "ml-evaluation", "Held-out binary classification evaluation", ["binary ML evaluation", "machine learning test evaluation"], ["truth 0/1", "predicted probability", "Train/Validation/Test split", "sample ID"], executeMlBinaryEvaluation),
    enabled("engineering-error-analysis", "engineering-computational", "Engineering prediction/error analysis", ["simulation error analysis", "prediction error analysis"], ["reference values", "predicted or simulated values"], executeEngineeringError),
    enabled("cronbach-alpha", "survey-psychometrics", "Cronbach's alpha", ["internal consistency reliability"], ["two or more numeric scale items"], executeCronbachAlpha),
    disabled("random-effects-meta-analysis", "meta-analysis", "Random-effects meta-analysis", ["REML meta analysis"], "Planned", "Validated tau-squared estimation, small-sample uncertainty, and effect-scale contracts are not implemented."),
    disabled("meta-regression", "meta-analysis", "Meta-regression", [], "Planned", "Moderator encoding, study-level dependence, and robust uncertainty contracts are not implemented."),
    disabled("ml-cross-validation", "ml-evaluation", "Cross-validation evaluation", ["k fold cross validation"], "Unavailable", "Fold assignments and out-of-fold predictions cannot be generated or trusted by the current execution contract."),
    disabled("ml-model-training", "ml-evaluation", "Machine-learning model training", ["train machine learning model"], "Unavailable", "Training, tuning, preprocessing pipelines, seeds, and leakage-safe provenance are not implemented."),
    disabled("ml-roc-auc", "ml-evaluation", "Machine-learning ROC/AUC evaluation", [], "Planned", "Score direction, class polarity, uncertainty, and threshold contracts are not implemented."),
    disabled("design-of-experiments", "engineering-computational", "Design of experiments", ["DOE analysis"], "Planned", "Factor coding, randomization, blocking, alias structure, and response-model contracts are not implemented."),
    disabled("global-sensitivity-analysis", "engineering-computational", "Global sensitivity analysis", ["Sobol sensitivity"], "Planned", "Sampling design, parameter distributions, convergence, and estimator uncertainty are not implemented."),
    disabled("simulation-uncertainty-propagation", "engineering-computational", "Simulation uncertainty propagation", ["Monte Carlo uncertainty"], "Planned", "Input distributions, dependence, random seeds, convergence, and model provenance contracts are not implemented."),
    disabled("factor-analysis", "survey-psychometrics", "Exploratory factor analysis", ["EFA"], "Planned", "Correlation choice, factor retention, rotation, missingness, and adequacy diagnostics are not implemented."),
    disabled("item-response-theory", "survey-psychometrics", "Item response theory", ["IRT analysis"], "Unavailable", "Item model, identification, estimation, fit, and differential-item-functioning contracts are not implemented."),
  ].forEach((method) => registry.register(method));
}
