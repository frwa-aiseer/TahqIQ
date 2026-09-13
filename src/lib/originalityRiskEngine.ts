import type { ManuscriptSection, SourceRecord } from "../types";

export type OriginalityRiskStatus = "PASS" | "WARNING" | "BLOCKER";
export type OriginalityFindingType = "Exact Quotation" | "Close/Verbatim Overlap" | "Uncited Close Paraphrase" | "Duplicate Section" | "Version Self-Overlap" | "Missing Attribution";

export interface OriginalityFinding {
  type: OriginalityFindingType;
  status: "WARNING" | "BLOCKER";
  message: string;
  sectionIds: string[];
  sourceId?: string;
  matchedText?: string;
  similarity?: number;
}
export interface OriginalityRiskInput {
  projectId: string;
  sections: readonly ManuscriptSection[];
  sources: readonly SourceRecord[];
  previousVersions?: readonly ManuscriptSection[];
  licensedSimilarityAdapter?: LicensedSimilarityAdapter;
}
export interface LicensedSimilarityAdapter {
  providerId: string;
  configured: boolean;
  compare: (input: { projectId: string; sections: readonly ManuscriptSection[] }) => Promise<{ status: "Available" | "Unavailable"; provider: string; message: string }>;
}
export interface OriginalityRiskReport {
  projectId: string;
  status: OriginalityRiskStatus;
  analyzedAt: string;
  findings: OriginalityFinding[];
  licensedService: { status: "Not Configured" | "Available" | "Unavailable"; provider: string; message: string };
  disclaimer: string;
}

const words = (value: string): string[] => value.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}\s']/gu, " ").split(/\s+/).filter((word) => word.length > 1);
const ngrams = (tokens: readonly string[], size: number): Set<string> => new Set(Array.from({ length: Math.max(0, tokens.length - size + 1) }, (_, index) => tokens.slice(index, index + size).join(" ")));
const sourceText = (source: SourceRecord) => [source.title, source.abstract, source.fullTextContent, ...(source.extractedPassages || []).map((passage) => passage.text)].filter((value): value is string => Boolean(value?.trim())).join(" ");
const sectionTokens = (section: ManuscriptSection) => words(section.content || "");
const overlapScore = (left: readonly string[], right: readonly string[], size = 5) => {
  const a = ngrams(left, size), b = ngrams(right, size);
  if (!a.size || !b.size) return { score: 0, shared: [] as string[] };
  const shared = [...a].filter((item) => b.has(item));
  return { score: shared.length / Math.min(a.size, b.size), shared };
};
const findingMessage = (type: OriginalityFindingType, detail: string) => `Potential ${type.toLowerCase()} detected (${detail}). This is a source-linked risk signal for researcher review, not an accusation or determination.`;

export async function runOriginalityRiskAnalysis(input: OriginalityRiskInput, now = () => new Date().toISOString()): Promise<OriginalityRiskReport> {
  if (!input.projectId.trim()) throw new Error("Originality analysis requires a projectId.");
  const findings: OriginalityFinding[] = [];
  const realSources = input.sources.filter((source) => !source.isDemo && !source.isSynthetic);
  const sourceCorpus = realSources.map((source) => ({ source, tokens: words(sourceText(source)), normalized: words(sourceText(source)).join(" ") }));
  for (const section of input.sections) {
    const tokens = sectionTokens(section), text = section.content || "";
    const cited = new Set(section.citationIds || []);
    const quotes = [...text.matchAll(/[“\"]([^”\"]{20,})[”\"]/g)].map((match) => match[1]);
    for (const quote of quotes) {
      const normalizedQuote = words(quote).join(" ");
      const source = sourceCorpus.find((candidate) => normalizedQuote && candidate.normalized.includes(normalizedQuote));
      if (source) {
        findings.push({ type: "Exact Quotation", status: cited.has(source.source.id) ? "WARNING" : "BLOCKER", message: findingMessage("Exact Quotation", cited.has(source.source.id) ? `matches Source '${source.source.id}'` : `matches Source '${source.source.id}' but has no citation`), sectionIds: [section.id], sourceId: source.source.id, matchedText: quote });
      }
    }
    for (const candidate of sourceCorpus) {
      const overlap = overlapScore(tokens, candidate.tokens);
      if (overlap.score < 0.25 || overlap.shared.length === 0) continue;
      const attributed = cited.has(candidate.source.id);
      const type: OriginalityFindingType = attributed ? "Close/Verbatim Overlap" : "Uncited Close Paraphrase";
      findings.push({ type, status: attributed ? "WARNING" : "BLOCKER", message: findingMessage(type, `overlaps Source '${candidate.source.id}'`), sectionIds: [section.id], sourceId: candidate.source.id, matchedText: overlap.shared[0], similarity: Number(overlap.score.toFixed(4)) });
      if (!attributed) findings.push({ type: "Missing Attribution", status: "BLOCKER", message: findingMessage("Missing Attribution", `close source-linked language from Source '${candidate.source.id}' lacks an in-text citation`), sectionIds: [section.id], sourceId: candidate.source.id, similarity: Number(overlap.score.toFixed(4)) });
    }
  }
  for (let leftIndex = 0; leftIndex < input.sections.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < input.sections.length; rightIndex += 1) {
    const left = sectionTokens(input.sections[leftIndex]), right = sectionTokens(input.sections[rightIndex]), overlap = overlapScore(left, right, 3);
    if (overlap.score >= 0.8 && Math.min(left.length, right.length) >= 20) findings.push({ type: "Duplicate Section", status: "WARNING", message: findingMessage("Duplicate Section", `sections '${input.sections[leftIndex].id}' and '${input.sections[rightIndex].id}' are highly similar`), sectionIds: [input.sections[leftIndex].id, input.sections[rightIndex].id], similarity: Number(overlap.score.toFixed(4)) });
  }
  for (const previous of input.previousVersions || []) for (const current of input.sections) {
    const overlap = overlapScore(sectionTokens(current), sectionTokens(previous), 3);
    if (overlap.score >= 0.8 && Math.min(sectionTokens(current).length, sectionTokens(previous).length) >= 20) findings.push({ type: "Version Self-Overlap", status: "WARNING", message: findingMessage("Version Self-Overlap", `section '${current.id}' overlaps version '${previous.id}'`), sectionIds: [current.id, previous.id], similarity: Number(overlap.score.toFixed(4)) });
  }
  let licensedService: OriginalityRiskReport["licensedService"] = { status: "Not Configured", provider: "Not Configured", message: "No licensed similarity service is configured; local deterministic signals are shown instead." };
  if (input.licensedSimilarityAdapter) {
    if (!input.licensedSimilarityAdapter.configured) licensedService = { status: "Not Configured", provider: input.licensedSimilarityAdapter.providerId, message: "Licensed similarity service is Not Configured." };
    else { const result = await input.licensedSimilarityAdapter.compare({ projectId: input.projectId, sections: input.sections }); licensedService = { status: result.status, provider: result.provider, message: result.message }; }
  }
  return { projectId: input.projectId, status: findings.some((finding) => finding.status === "BLOCKER") ? "BLOCKER" : findings.length ? "WARNING" : "PASS", analyzedAt: now(), findings, licensedService, disclaimer: "Similarity signals are not a plagiarism finding, originality guarantee, or AI-detector result. Researchers must review source context, quotation, paraphrase, and attribution." };
}
