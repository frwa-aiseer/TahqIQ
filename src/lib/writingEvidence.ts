import type { AnalysisOutput, AnalysisPlan, GeneratedFigure, GeneratedTable, ProjectState, SourceRecord } from "../types";
import { formatInTextCitation } from "./cslStyles";
import { hasAttributableManuscriptApproval } from "./analysisLifecycle";

export interface InsertableLiteratureEvidence {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceAuthors: string[];
  sourceYear: number;
  passageText: string;
  location?: string;
  category: string;
  verificationBadge: "Researcher Reviewed Evidence";
  provenance: {
    provider: string;
    retrievedAt: string;
    rawRecordUrl?: string;
  };
}

export type StatisticalInsertionMode = "full" | "summary_only" | "metrics_only";

function hasVerifiedSourceProvenance(source: SourceRecord): boolean {
  const sourceIsVerified =
    source.verificationState === "Verified" ||
    source.state === "Metadata Verified" ||
    source.state === "Full Text Reviewed";

  return Boolean(
    sourceIsVerified &&
      source.provenance?.provider?.trim() &&
      source.provenance?.retrievedAt?.trim()
  );
}

function sourceAllowedForProject(project: ProjectState, source: SourceRecord): boolean {
  if (!project.isDemoProject && (source.isDemo || source.isSynthetic)) return false;
  return hasVerifiedSourceProvenance(source);
}

/**
 * Returns only passage-level evidence that has researcher review and verified
 * source provenance. Abstracts and unreviewed extracted text are never promoted
 * into insertable evidence automatically.
 */
export function getInsertableLiteratureEvidence(project: ProjectState): InsertableLiteratureEvidence[] {
  const sources = project.sources || [];
  const result: InsertableLiteratureEvidence[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!sourceAllowedForProject(project, source)) continue;

    for (const passage of source.extractedPassages || []) {
      if (!passage.isVerifiedByHuman || !passage.text?.trim()) continue;
      const key = `${source.id}:${passage.id}:${passage.text.trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        id: passage.id,
        sourceId: source.id,
        sourceTitle: source.title || "Missing",
        sourceAuthors: source.authors || [],
        sourceYear: source.year || 0,
        passageText: passage.text.trim(),
        location: passage.section
          ? `${passage.section}${passage.pageNumber ? ` (p. ${passage.pageNumber})` : ""}`
          : passage.pageNumber
          ? `Page ${passage.pageNumber}`
          : undefined,
        category: passage.category || "Researcher Reviewed Evidence",
        verificationBadge: "Researcher Reviewed Evidence",
        provenance: {
          provider: source.provenance!.provider,
          retrievedAt: source.provenance!.retrievedAt,
          rawRecordUrl: source.provenance?.fieldProvenance?.title?.rawRecordUrl,
        },
      });
    }
  }

  for (const claim of project.claims || []) {
    const claimReviewed =
      claim.isResearcherApproved === true ||
      claim.state === "Researcher Reviewed" ||
      claim.state === "Verified";
    if (!claimReviewed) continue;

    for (const evidence of claim.linkedEvidence || []) {
      const source = sources.find((candidate) => candidate.id === evidence.sourceId);
      if (!source || !sourceAllowedForProject(project, source) || !evidence.passageQuote?.trim()) continue;
      const key = `${source.id}:${evidence.id}:${evidence.passageQuote.trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        id: evidence.id,
        sourceId: source.id,
        sourceTitle: evidence.sourceTitle || source.title || "Missing",
        sourceAuthors: source.authors || [],
        sourceYear: source.year || 0,
        passageText: evidence.passageQuote.trim(),
        location: evidence.sectionName || (evidence.pageNumber ? `Page ${evidence.pageNumber}` : undefined),
        category: `Researcher Reviewed Claim: ${claim.claimText.slice(0, 45)}${claim.claimText.length > 45 ? "…" : ""}`,
        verificationBadge: "Researcher Reviewed Evidence",
        provenance: {
          provider: source.provenance!.provider,
          retrievedAt: source.provenance!.retrievedAt,
          rawRecordUrl: source.provenance?.fieldProvenance?.title?.rawRecordUrl,
        },
      });
    }
  }

  return result;
}

export function getApprovedManuscriptAnalysisOutputs(project: ProjectState): AnalysisOutput[] {
  return (project.analysisOutputs || []).filter((output) => {
    if (!hasAttributableManuscriptApproval(output)) return false;
    if (!project.isDemoProject && (output.isDemo || output.isSynthetic)) return false;

    return Boolean(
      output.summaryText?.trim() ||
        (output.numericResults && Object.keys(output.numericResults).length > 0) ||
        output.pValues?.length ||
        output.effectSizes?.length ||
        output.assumptionChecks?.length
    );
  });
}

export function getApprovedManuscriptFigures(project: ProjectState): GeneratedFigure[] {
  const approvedRunIds = new Set(getApprovedManuscriptAnalysisOutputs(project).map((output) => output.id));
  return (project.figures || []).filter((figure) =>
    approvedRunIds.has(figure.analysisRunId) &&
    (project.isDemoProject || (!figure.isDemo && !figure.isSynthetic))
  );
}

export function getApprovedManuscriptTables(project: ProjectState): GeneratedTable[] {
  const approvedRunIds = new Set(getApprovedManuscriptAnalysisOutputs(project).map((output) => output.id));
  return (project.tables || []).filter((table) =>
    approvedRunIds.has(table.analysisRunId) &&
    (project.isDemoProject || (!table.isDemo && !table.isSynthetic))
  );
}

export function buildLiteratureEvidenceInsertion(
  item: InsertableLiteratureEvidence,
  project: ProjectState,
  formatMode: "blockquote" | "inline"
): string {
  const allowed = getInsertableLiteratureEvidence(project).find((candidate) => candidate.id === item.id && candidate.sourceId === item.sourceId);
  if (!allowed) {
    throw new Error("Literature insertion blocked: evidence is not researcher reviewed with verified provenance.");
  }

  const source = project.sources.find((candidate) => candidate.id === allowed.sourceId)!;
  const citation = formatInTextCitation([source], project.activeCslStyle, project.sources);
  const provenance = `Provider: ${allowed.provenance.provider}; Retrieved: ${allowed.provenance.retrievedAt}; Source ID: ${allowed.sourceId}`;

  return formatMode === "blockquote"
    ? `\n\n> "${allowed.passageText}"\n— ${citation} [${provenance}]\n`
    : `\n\n"${allowed.passageText}" (${citation}; ${provenance})\n`;
}

function formatRecordedValue(value: unknown): string {
  if (typeof value === "number") return String(Number(value.toFixed(4)));
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function buildApprovedAnalysisInsertion(
  output: AnalysisOutput,
  project: ProjectState,
  mode: StatisticalInsertionMode
): string {
  const approved = getApprovedManuscriptAnalysisOutputs(project).find((candidate) => candidate.id === output.id);
  if (!approved) {
    throw new Error("Statistical insertion blocked: output is not Approved for Manuscript.");
  }

  const matchingPlan: AnalysisPlan | undefined = project.analysisPlans?.find(
    (plan) => plan.id === approved.analysisPlanId
  );
  const planTitle = matchingPlan?.title?.trim() || "Analysis output";
  let insertion = `\n\n### Statistical Findings: ${planTitle} [Output ID: ${approved.id}]\n`;

  if (mode !== "metrics_only" && approved.summaryText?.trim()) {
    insertion += `${approved.summaryText.trim()}\n\n`;
  }

  if (mode !== "summary_only") {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(approved.numericResults || {})) {
      if (value === undefined || value === null || value === "") continue;
      lines.push(`- **${key.replace(/_/g, " ")}:** ${formatRecordedValue(value)}`);
    }
    for (const pValue of approved.pValues || []) {
      lines.push(`- **${pValue.test}:** ${pValue.formatted || `p = ${pValue.pValue}`}`);
    }
    for (const effectSize of approved.effectSizes || []) {
      const interval = effectSize.ciLower !== undefined && effectSize.ciUpper !== undefined
        ? ` [95% CI: ${effectSize.ciLower}, ${effectSize.ciUpper}]`
        : "";
      lines.push(`- **${effectSize.metric}:** ${effectSize.value}${interval}`);
    }
    for (const check of approved.assumptionChecks || []) {
      const test = check.testUsed ? ` (${check.testUsed}${check.pValue !== undefined ? `, p = ${check.pValue}` : ""})` : "";
      lines.push(`- **Assumption Check (${check.assumption}):** ${check.met ? "Met" : "Unmet"}${test}`);
    }
    if (lines.length > 0) insertion += `**Approved for Manuscript Quantitative Results:**\n${lines.join("\n")}\n`;
  }

  return insertion;
}
