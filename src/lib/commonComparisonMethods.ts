import type { AnalysisOutput, AnalysisPlan, DatasetRecord } from "../types";
import type { AnalysisMethodDefinition, AnalysisMethodRegistry } from "./analysisMethodRegistry";
import { studentTTwoTailedPValue } from "./statsEngine";

export interface CommonComparisonInput {
  dataset: DatasetRecord;
  plan: AnalysisPlan;
  outcomeVariable?: string;
  conditionVariable?: string;
  participantIdVariable?: string;
  alpha?: number;
}

type Row = Record<string, unknown>;
type Ranked = { value: number; group: number; rank: number };

const SOFTWARE = "TehqIQ Deterministic Comparison Engine v1.0";
const finite = (value: unknown): number | undefined => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const variance = (values: number[]) => values.length > 1
  ? values.reduce((sum, value) => sum + (value - mean(values)) ** 2, 0) / (values.length - 1)
  : 0;
const sd = (values: number[]) => Math.sqrt(variance(values));
const round = (value: number, digits = 6) => Number(value.toFixed(digits));
const clampP = (value: number) => Math.max(0, Math.min(1, value));
const erf = (x: number) => {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a);
  return sign * y;
};
const normalCdf = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)));

function logGamma(z: number): number {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019571e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  let x = 0.9999999999998099;
  z -= 1;
  coefficients.forEach((coefficient, index) => { x += coefficient / (z + index + 1); });
  const t = z + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaFraction(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 3e-12;
  const floor = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < floor) d = floor;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < floor) d = floor;
    c = 1 + aa / c; if (Math.abs(c) < floor) c = floor;
    d = 1 / d; h *= d * c;
    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < floor) d = floor;
    c = 1 + aa / c; if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    const delta = d * c; h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}

function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? front * betaFraction(x, a, b) / a
    : 1 - front * betaFraction(1 - x, b, a) / b;
}

const fUpperTail = (f: number, df1: number, df2: number) => clampP(1 - regularizedBeta((df1 * f) / (df1 * f + df2), df1 / 2, df2 / 2));

function regularizedGammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let sum = 1 / a;
    let term = sum;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n); sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
    }
    return clampP(1 - sum * Math.exp(-x + a * Math.log(x) - logGamma(a)));
  }
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c; h *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }
  return clampP(Math.exp(-x + a * Math.log(x) - logGamma(a)) * h);
}

function rank(values: { value: number; group: number }[]): Ranked[] {
  const sorted: Ranked[] = values.map((item) => ({ ...item, rank: 0 })).sort((a, b) => a.value - b.value);
  let i = 0;
  while (i < sorted.length) {
    let end = i + 1;
    while (end < sorted.length && sorted[end].value === sorted[i].value) end++;
    const averageRank = ((i + 1) + end) / 2;
    for (let j = i; j < end; j++) sorted[j].rank = averageRank;
    i = end;
  }
  return sorted;
}

function hash(text: string): string {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return `fnv1a-${(value >>> 0).toString(16).padStart(8, "0")}`;
}

function failed(input: CommonComparisonInput, methodId: string, reason: string): AnalysisOutput {
  const timestamp = new Date().toISOString();
  return {
    id: `an-failed-${methodId}-${Date.now()}`,
    analysisPlanId: input.plan.id,
    planId: input.plan.id,
    datasetHash: input.dataset.fileHash,
    executionTimestamp: timestamp,
    softwareEnvironment: SOFTWARE,
    summaryText: `Execution Failed: ${reason}`,
    numericResults: { status: "Failed", reason },
    pValues: [], effectSizes: [], assumptionChecks: [], isReproduced: false,
    reproducibilityHash: "not-independently-reproduced",
    executionStatus: "Failed", state: "Failed", isResearcherSupplied: false,
    reproductionStatus: "Not Independently Reproduced",
    logs: [`[${timestamp}] ${reason}`], warnings: [reason],
  };
}

function validate(input: CommonComparisonInput): string | undefined {
  if (!input.dataset || !input.plan) return "Dataset and analysis plan are required.";
  if (input.dataset.state !== "Approved for Analysis" && input.dataset.state !== "Locked") return "Dataset requires approval for analysis.";
  if (input.plan.status !== "Approved" && input.plan.state !== "Approved" && input.plan.state !== "Completed") return "Analysis plan requires researcher approval.";
  if (!input.dataset.rawPreview?.length) return "Dataset contains no raw records.";
}

function complete(
  input: CommonComparisonInput,
  methodId: string,
  label: string,
  numericResults: AnalysisOutput["numericResults"],
  pValue: number,
  effectSizes: AnalysisOutput["effectSizes"],
  assumptions: AnalysisOutput["assumptionChecks"],
  counts: Record<string, number>,
  code: string,
  warnings: string[] = []
): AnalysisOutput {
  const timestamp = new Date().toISOString();
  const signature = JSON.stringify({ methodId, datasetHash: input.dataset.fileHash, planId: input.plan.id, numericResults, counts });
  return {
    id: `an-${methodId}-${Date.now()}`,
    analysisPlanId: input.plan.id, planId: input.plan.id, datasetHash: input.dataset.fileHash,
    executionTimestamp: timestamp, softwareEnvironment: SOFTWARE,
    summaryText: `${label} executed from ${Object.values(counts).reduce((sum, count) => sum + count, 0)} recorded analysis observations.`,
    numericResults: { ...numericResults, counts },
    pValues: [{ test: label, pValue, significant: pValue < (input.alpha ?? input.plan.significanceThreshold ?? 0.05), formatted: pValue < 0.001 ? "p < 0.001" : `p = ${pValue.toFixed(4)}` }],
    effectSizes, assumptionChecks: assumptions, isReproduced: true,
    reproducibilityHash: hash(signature), executionStatus: "Completed", state: "Completed",
    isResearcherSupplied: false, reproductionStatus: "Independently Reproduced", code,
    packageVersions: { TehqIQ_Comparison_Engine: "1.0.0" },
    parameters: { methodId, outcomeVariable: input.outcomeVariable ?? input.plan.outcomeVariable, conditionVariable: input.conditionVariable ?? input.plan.predictorVariables[0] },
    logs: [`[${timestamp}] Executed ${methodId} against dataset hash ${input.dataset.fileHash} and plan ${input.plan.id}.`], warnings,
  };
}

function wideColumns(input: CommonComparisonInput, minimum: number): string[] | string {
  const raw = input.outcomeVariable ?? input.plan.outcomeVariable;
  const columns = raw.split(",").map((item) => item.trim()).filter(Boolean);
  if (columns.length < minimum) return `At least ${minimum} comma-separated numeric outcome columns are required.`;
  const available = new Set(Object.keys(input.dataset.rawPreview?.[0] ?? {}));
  const missing = columns.find((column) => !available.has(column));
  return missing ? `Required variable '${missing}' is missing.` : columns;
}

function groups(input: CommonComparisonInput, minimumGroups: number): { labels: string[]; values: number[][]; missing: number } | string {
  const outcome = input.outcomeVariable ?? input.plan.outcomeVariable;
  const condition = input.conditionVariable ?? input.plan.predictorVariables[0];
  if (!outcome || !condition) return "Outcome and condition variables are required.";
  const available = new Set(Object.keys(input.dataset.rawPreview?.[0] ?? {}));
  if (!available.has(outcome)) return `Required variable '${outcome}' is missing.`;
  if (!available.has(condition)) return `Required variable '${condition}' is missing.`;
  const map = new Map<string, number[]>();
  let missing = 0;
  for (const row of input.dataset.rawPreview as Row[]) {
    const value = finite(row[outcome]);
    const group = row[condition];
    if (value === undefined || group === undefined || group === null || group === "") { missing++; continue; }
    const label = String(group);
    map.set(label, [...(map.get(label) ?? []), value]);
  }
  if (map.size < minimumGroups) return `At least ${minimumGroups} non-empty groups are required.`;
  return { labels: [...map.keys()].sort(), values: [...map.keys()].sort().map((label) => map.get(label)!), missing };
}

function paired(input: CommonComparisonInput): { a: number[]; b: number[]; columns: string[]; missing: number } | string {
  const columns = wideColumns(input, 2);
  if (typeof columns === "string") return columns;
  if (columns.length !== 2) return "Exactly two outcome columns are required for a paired comparison.";
  const a: number[] = [], b: number[] = [];
  let missing = 0;
  for (const row of input.dataset.rawPreview as Row[]) {
    const first = finite(row[columns[0]]), second = finite(row[columns[1]]);
    if (first === undefined || second === undefined) { missing++; continue; }
    a.push(first); b.push(second);
  }
  return { a, b, columns, missing };
}

function executeIndependentT(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "independent-t", invalid);
  const extracted = groups(input, 2); if (typeof extracted === "string") return failed(input, "independent-t", extracted);
  if (extracted.values.length !== 2 || extracted.values.some((values) => values.length < 2)) return failed(input, "independent-t", "Exactly two groups with at least two finite observations each are required.");
  const [a, b] = extracted.values, [n1, n2] = [a.length, b.length], [m1, m2] = [mean(a), mean(b)], [v1, v2] = [variance(a), variance(b)];
  const se2 = v1 / n1 + v2 / n2; if (se2 === 0) return failed(input, "independent-t", "The standard error is zero; the t statistic is undefined.");
  const t = (m1 - m2) / Math.sqrt(se2);
  const df = se2 ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const p = studentTTwoTailedPValue(t, df);
  const pooled = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const d = pooled ? (m1 - m2) / pooled : 0;
  const g = d * (1 - 3 / (4 * (n1 + n2) - 9));
  const margin = 1.96 * Math.sqrt(se2);
  return complete(input, "independent-t", "Welch independent-samples t-test", { group1: extracted.labels[0], group2: extracted.labels[1], mean1: round(m1), mean2: round(m2), meanDifference: round(m1 - m2), t: round(t), df: round(df), pValue: round(p), ciLower: round(m1 - m2 - margin), ciUpper: round(m1 - m2 + margin) }, p, [{ metric: "Hedges' g", value: round(g) }], [{ assumption: "Independent observations", met: false, testUsed: "Researcher verification required", note: "Not independently verifiable from the dataset values." }, { assumption: "Approximately normal outcome within groups", met: false, testUsed: "Not independently verified", note: "Researcher review required." }, { assumption: "Finite variance in each group", met: v1 > 0 && v2 > 0, testUsed: "Sample variance" }], { group1: n1, group2: n2, excluded: extracted.missing }, `welch_t_test(outcome=${input.outcomeVariable ?? input.plan.outcomeVariable}, group=${input.conditionVariable ?? input.plan.predictorVariables[0]})`);
}

function executeMannWhitney(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "mann-whitney", invalid);
  const extracted = groups(input, 2); if (typeof extracted === "string") return failed(input, "mann-whitney", extracted);
  if (extracted.values.length !== 2 || extracted.values.some((values) => values.length < 1)) return failed(input, "mann-whitney", "Exactly two non-empty groups are required.");
  const [a, b] = extracted.values, n1 = a.length, n2 = b.length;
  const ranked = rank([...a.map((value) => ({ value, group: 0 })), ...b.map((value) => ({ value, group: 1 }))]);
  const r1 = ranked.filter((item) => item.group === 0).reduce((sum, item) => sum + item.rank, 0);
  const u1 = r1 - n1 * (n1 + 1) / 2, u2 = n1 * n2 - u1, u = Math.min(u1, u2);
  const tieCounts = new Map<number, number>(); ranked.forEach((item) => tieCounts.set(item.value, (tieCounts.get(item.value) ?? 0) + 1));
  const n = n1 + n2, tieCorrection = [...tieCounts.values()].reduce((sum, count) => sum + count ** 3 - count, 0);
  const varianceU = n1 * n2 / 12 * ((n + 1) - tieCorrection / (n * (n - 1)));
  const z = varianceU > 0 ? (u - n1 * n2 / 2 + 0.5) / Math.sqrt(varianceU) : 0;
  const p = varianceU > 0 ? clampP(2 * (1 - normalCdf(Math.abs(z)))) : 1;
  const rankBiserial = 1 - 2 * u / (n1 * n2);
  return complete(input, "mann-whitney", "Mann–Whitney U test", { group1: extracted.labels[0], group2: extracted.labels[1], u: round(u), z: round(z), pValue: round(p), rankSum1: round(r1) }, p, [{ metric: "Rank-biserial correlation (absolute)", value: round(rankBiserial) }], [{ assumption: "Independent observations", met: false, testUsed: "Researcher verification required", note: "Not independently verifiable from the dataset values." }, { assumption: "Ordinal or continuous outcome", met: true, testUsed: "Finite numeric extraction" }], { group1: n1, group2: n2, excluded: extracted.missing }, `mann_whitney_u(outcome=${input.outcomeVariable ?? input.plan.outcomeVariable}, group=${input.conditionVariable ?? input.plan.predictorVariables[0]})`, ["Normal approximation with tie correction and continuity correction was used."]);
}

function executePairedT(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "paired-t", invalid);
  const extracted = paired(input); if (typeof extracted === "string") return failed(input, "paired-t", extracted);
  if (extracted.a.length < 2) return failed(input, "paired-t", "At least two complete pairs are required.");
  const differences = extracted.b.map((value, index) => value - extracted.a[index]);
  const md = mean(differences), sdd = sd(differences); if (sdd === 0) return failed(input, "paired-t", "Paired differences have zero variance; the t statistic is undefined.");
  const se = sdd / Math.sqrt(differences.length), t = md / se, df = differences.length - 1, p = studentTTwoTailedPValue(t, df), margin = 1.96 * se, dz = md / sdd;
  return complete(input, "paired-t", "Paired-samples t-test", { condition1: extracted.columns[0], condition2: extracted.columns[1], mean1: round(mean(extracted.a)), mean2: round(mean(extracted.b)), meanDifference: round(md), t: round(t), df, pValue: round(p), ciLower: round(md - margin), ciUpper: round(md + margin) }, p, [{ metric: "Cohen's dz", value: round(dz) }], [{ assumption: "Observations are correctly paired", met: false, testUsed: "Researcher verification required", note: "Row completeness does not prove pairing identity." }, { assumption: "Approximately normal paired differences", met: false, testUsed: "Not independently verified", note: "Researcher review required." }, { assumption: "Paired differences have finite variance", met: true, testUsed: "Sample variance" }], { completePairs: differences.length, excludedPairs: extracted.missing }, `paired_t_test(${extracted.columns.join(", ")})`);
}

function signedRanks(differences: number[]) {
  const nonzero = differences.filter((value) => value !== 0);
  const ranked = rank(nonzero.map((value) => ({ value: Math.abs(value), group: value > 0 ? 1 : 0 })));
  const positive = ranked.filter((item) => item.group === 1).reduce((sum, item) => sum + item.rank, 0);
  const negative = ranked.filter((item) => item.group === 0).reduce((sum, item) => sum + item.rank, 0);
  const n = nonzero.length, w = Math.min(positive, negative);
  const tieCounts = new Map<number, number>(); ranked.forEach((item) => tieCounts.set(item.value, (tieCounts.get(item.value) ?? 0) + 1));
  const tieAdjustment = [...tieCounts.values()].reduce((sum, count) => sum + count * (count ** 2 - 1), 0) / 48;
  const varianceW = n * (n + 1) * (2 * n + 1) / 24 - tieAdjustment;
  const z = varianceW > 0 ? (w - n * (n + 1) / 4 + 0.5) / Math.sqrt(varianceW) : 0;
  return { n, w, positive, negative, z, p: varianceW > 0 ? clampP(2 * (1 - normalCdf(Math.abs(z)))) : 1 };
}

function executeWilcoxon(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "wilcoxon-signed-rank", invalid);
  const extracted = paired(input); if (typeof extracted === "string") return failed(input, "wilcoxon-signed-rank", extracted);
  const differences = extracted.b.map((value, index) => value - extracted.a[index]);
  const result = signedRanks(differences);
  if (result.n < 2) return failed(input, "wilcoxon-signed-rank", "At least two non-zero complete paired differences are required.");
  const rankBiserial = (result.positive - result.negative) / (result.positive + result.negative);
  return complete(input, "wilcoxon-signed-rank", "Wilcoxon signed-rank test", { condition1: extracted.columns[0], condition2: extracted.columns[1], w: round(result.w), positiveRankSum: round(result.positive), negativeRankSum: round(result.negative), z: round(result.z), pValue: round(result.p), zeroDifferences: differences.length - result.n }, result.p, [{ metric: "Matched-pairs rank-biserial correlation", value: round(rankBiserial) }], [{ assumption: "Paired observations and symmetric differences", met: false, testUsed: "Researcher verification required", note: "Pair identity and distribution symmetry are not independently verified." }], { completePairs: differences.length, nonzeroPairs: result.n, excludedPairs: extracted.missing }, `wilcoxon_signed_rank(${extracted.columns.join(", ")})`, ["Normal approximation with tie and continuity corrections was used."]);
}

function executeAnova(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "one-way-anova", invalid);
  const extracted = groups(input, 2); if (typeof extracted === "string") return failed(input, "one-way-anova", extracted);
  if (extracted.values.some((values) => values.length < 2)) return failed(input, "one-way-anova", "Every group requires at least two finite observations.");
  const all = extracted.values.flat(), grand = mean(all);
  const ssBetween = extracted.values.reduce((sum, values) => sum + values.length * (mean(values) - grand) ** 2, 0);
  const ssWithin = extracted.values.reduce((sum, values) => sum + values.reduce((inner, value) => inner + (value - mean(values)) ** 2, 0), 0);
  const df1 = extracted.values.length - 1, df2 = all.length - extracted.values.length;
  if (ssWithin === 0 || df2 <= 0) return failed(input, "one-way-anova", "Within-group variance and residual degrees of freedom must be positive.");
  const f = (ssBetween / df1) / (ssWithin / df2), p = fUpperTail(f, df1, df2), eta = ssBetween / (ssBetween + ssWithin);
  return complete(input, "one-way-anova", "One-way ANOVA", { groupLabels: extracted.labels.join(" | "), groupMeans: Object.fromEntries(extracted.labels.map((label, index) => [label, round(mean(extracted.values[index]))])), grandMean: round(grand), ssBetween: round(ssBetween), ssWithin: round(ssWithin), f: round(f), dfBetween: df1, dfWithin: df2, pValue: round(p) }, p, [{ metric: "Eta squared", value: round(eta) }], [{ assumption: "Independent observations", met: false, testUsed: "Researcher verification required", note: "Not independently verifiable from values." }, { assumption: "Normal residuals and homogeneous variances", met: false, testUsed: "Not independently verified", note: "Researcher review required before inference." }, { assumption: "Positive within-group variance", met: true, testUsed: "Sample variance" }], Object.fromEntries([...extracted.labels.map((label, index) => [label, extracted.values[index].length]), ["excluded", extracted.missing]]), `one_way_anova(outcome=${input.outcomeVariable ?? input.plan.outcomeVariable}, group=${input.conditionVariable ?? input.plan.predictorVariables[0]})`);
}

function executeKruskalWallis(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "kruskal-wallis", invalid);
  const extracted = groups(input, 2); if (typeof extracted === "string") return failed(input, "kruskal-wallis", extracted);
  const ranked = rank(extracted.values.flatMap((values, group) => values.map((value) => ({ value, group }))));
  const n = ranked.length;
  let h = 12 / (n * (n + 1)) * extracted.values.reduce((sum, values, group) => {
    const rankSum = ranked.filter((item) => item.group === group).reduce((inner, item) => inner + item.rank, 0);
    return sum + rankSum ** 2 / values.length;
  }, 0) - 3 * (n + 1);
  const ties = new Map<number, number>(); ranked.forEach((item) => ties.set(item.value, (ties.get(item.value) ?? 0) + 1));
  const correction = 1 - [...ties.values()].reduce((sum, count) => sum + count ** 3 - count, 0) / (n ** 3 - n);
  if (correction <= 0) return failed(input, "kruskal-wallis", "All observations are tied; the statistic is undefined.");
  h /= correction;
  const df = extracted.values.length - 1, p = regularizedGammaQ(df / 2, h / 2), epsilon = Math.max(0, (h - extracted.values.length + 1) / (n - extracted.values.length));
  return complete(input, "kruskal-wallis", "Kruskal–Wallis test", { groupLabels: extracted.labels.join(" | "), h: round(h), df, pValue: round(p), tieCorrection: round(correction) }, p, [{ metric: "Epsilon squared", value: round(epsilon) }], [{ assumption: "Independent observations", met: false, testUsed: "Researcher verification required", note: "Not independently verifiable from values." }, { assumption: "Ordinal or continuous outcome", met: true, testUsed: "Finite numeric extraction" }], Object.fromEntries([...extracted.labels.map((label, index) => [label, extracted.values[index].length]), ["excluded", extracted.missing]]), `kruskal_wallis(outcome=${input.outcomeVariable ?? input.plan.outcomeVariable}, group=${input.conditionVariable ?? input.plan.predictorVariables[0]})`, ["Chi-square approximation with tie correction was used."]);
}

function executeRepeatedMeasures(input: CommonComparisonInput): AnalysisOutput {
  const invalid = validate(input); if (invalid) return failed(input, "repeated-measures-anova", invalid);
  const columns = wideColumns(input, 2); if (typeof columns === "string") return failed(input, "repeated-measures-anova", columns);
  const matrix: number[][] = []; let excluded = 0;
  for (const row of input.dataset.rawPreview as Row[]) {
    const values = columns.map((column) => finite(row[column]));
    if (values.some((value) => value === undefined)) { excluded++; continue; }
    matrix.push(values as number[]);
  }
  const subjects = matrix.length, conditions = columns.length;
  if (subjects < 2) return failed(input, "repeated-measures-anova", "At least two complete subjects are required.");
  const all = matrix.flat(), grand = mean(all), conditionMeans = columns.map((_, index) => mean(matrix.map((row) => row[index]))), subjectMeans = matrix.map(mean);
  const ssTotal = all.reduce((sum, value) => sum + (value - grand) ** 2, 0);
  const ssConditions = subjects * conditionMeans.reduce((sum, value) => sum + (value - grand) ** 2, 0);
  const ssSubjects = conditions * subjectMeans.reduce((sum, value) => sum + (value - grand) ** 2, 0);
  const ssError = ssTotal - ssConditions - ssSubjects, df1 = conditions - 1, df2 = (subjects - 1) * (conditions - 1);
  if (ssError <= 0 || df2 <= 0) return failed(input, "repeated-measures-anova", "Residual variance and degrees of freedom must be positive.");
  const f = (ssConditions / df1) / (ssError / df2), p = fUpperTail(f, df1, df2), partialEta = ssConditions / (ssConditions + ssError);
  return complete(input, "repeated-measures-anova", "One-way repeated-measures ANOVA", { conditions: columns.join(" | "), conditionMeans: Object.fromEntries(columns.map((column, index) => [column, round(conditionMeans[index])])), grandMean: round(grand), ssConditions: round(ssConditions), ssSubjects: round(ssSubjects), ssError: round(ssError), f: round(f), dfCondition: df1, dfError: df2, pValue: round(p) }, p, [{ metric: "Partial eta squared", value: round(partialEta) }], [{ assumption: "Repeated observations belong to the same subject", met: false, testUsed: "Researcher verification required", note: "Complete rows do not independently verify subject identity." }, { assumption: "Sphericity", met: conditions === 2, testUsed: conditions === 2 ? "Not required for two conditions" : "Not independently tested", note: conditions > 2 ? "Sphericity is unverified; researcher review or a corrected analysis is required." : undefined }], { completeSubjects: subjects, conditions, excludedSubjects: excluded }, `repeated_measures_anova(${columns.join(", ")})`, conditions > 2 ? ["Sphericity was not independently tested; uncorrected degrees of freedom are reported."] : []);
}

const base = (id: string, family: string, label: string, aliases: string[], executor: (input: CommonComparisonInput) => AnalysisOutput, pairedMethod = false): AnalysisMethodDefinition<CommonComparisonInput> => ({
  id, family, label, aliases, availability: "Enabled",
  compatibleVariableTypes: pairedMethod ? { outcomes: ["Numeric"], participantId: ["ID", "Categorical"] } : { outcome: ["Numeric"], group: ["Categorical", "Ordinal"] },
  requiredInputs: pairedMethod ? ["approved dataset", "approved analysis plan", "two or more numeric repeated outcome columns"] : ["approved dataset", "approved analysis plan", "numeric outcome", "group variable"],
  assumptions: pairedMethod ? ["Repeated observations belong to the same subject"] : ["Observations are independent between groups"],
  outputSchema: { result: "AnalysisOutput", estimates: "method-specific deterministic statistics", provenance: "dataset hash, plan ID, method ID, engine version, and reproducibility hash" },
  diagnostics: [{ id: "input-validation", label: "Input validation", description: "Approval state, variables, finite values, groups, and minimum sample requirements." }],
  reproducibility: { deterministic: true, recordsDatasetHash: true, recordsPlanId: true, emitsCode: true },
  execute: executor,
});

export function registerCommonComparisonMethods(registry: AnalysisMethodRegistry): void {
  [
    base("independent-t", "independent-comparison", "Welch independent-samples t-test", ["Independent samples t-test", "independent t-test", "Welch t-test"], executeIndependentT),
    base("mann-whitney", "independent-comparison", "Mann–Whitney U test", ["Mann Whitney", "Wilcoxon rank-sum test"], executeMannWhitney),
    base("paired-t", "paired-comparison", "Paired-samples t-test", ["Paired Student's t-test", "paired t-test"], executePairedT, true),
    base("wilcoxon-signed-rank", "paired-comparison", "Wilcoxon signed-rank test", ["Wilcoxon paired test", "paired Wilcoxon"], executeWilcoxon, true),
    base("one-way-anova", "multi-group-comparison", "One-way ANOVA", ["one way ANOVA"], executeAnova),
    base("kruskal-wallis", "multi-group-comparison", "Kruskal–Wallis test", ["Kruskal Wallis"], executeKruskalWallis),
    base("repeated-measures-anova", "repeated-measures", "One-way repeated-measures ANOVA", ["repeated measures ANOVA", "one way repeated measures ANOVA"], executeRepeatedMeasures, true),
  ].forEach((definition) => registry.register(definition));
}
