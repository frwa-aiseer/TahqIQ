import type { EvidenceRecord, ManuscriptSection, SourceRecord } from "../types";

export type CitationAuditStatus = "PASS" | "WARNING" | "BLOCKER";
export type CitationAuditIssueCode = "UNRESOLVED_IDENTIFIER" | "SOURCE_NOT_VERIFIED" | "RETRACTED_SOURCE" | "CORRECTED_SOURCE" | "MISSING_EVIDENCE" | "DUPLICATE_BIBLIOGRAPHY" | "ORPHAN_BIBLIOGRAPHY" | "MISSING_BIBLIOGRAPHY" | "DUPLICATE_CITATION";

export interface CitationAuditBibliographyEntry { entryId: string; sourceId?: string; identifier?: string; text: string }
export interface CitationAuditIssue { code: CitationAuditIssueCode; status: Exclude<CitationAuditStatus, "PASS">; message: string; sourceId?: string; citationRef?: string; entryId?: string }
export interface CitationAuditInput {
  projectId: string;
  sections: readonly ManuscriptSection[];
  sources: readonly SourceRecord[];
  evidenceRecords: readonly EvidenceRecord[];
  bibliography: readonly CitationAuditBibliographyEntry[];
  resolveIdentifier?: (identifier: string) => Promise<SourceRecord | null> | SourceRecord | null;
}
export interface CitationAuditReport {
  projectId: string;
  status: CitationAuditStatus;
  auditedAt: string;
  inTextCitationCount: number;
  matchedSourceIds: string[];
  unresolvedCitationRefs: string[];
  issues: CitationAuditIssue[];
  sourceCreationAttempted: false;
}

const DOI = /^10\.\d{4,9}\/[\S]+$/i;
const normalizeIdentifier = (value: string) => value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:/i, "").replace(/[.,;]+$/, "").toLowerCase();
const sourceIdentifierMatches = (source: SourceRecord, identifier: string) => {
  const normalized = normalizeIdentifier(identifier);
  return [source.doi, source.pmid && `pmid:${source.pmid}`, source.pmcid && `pmcid:${source.pmcid}`, source.arxivId && `arxiv:${source.arxivId}`, ...(source.otherStableIds || []).map((item) => `${item.scheme}:${item.value}`)].filter(Boolean).some((candidate) => normalizeIdentifier(String(candidate)) === normalized);
};

export async function runCitationAudit(input: CitationAuditInput, now = () => new Date().toISOString()): Promise<CitationAuditReport> {
  if (!input.projectId.trim()) throw new Error("Citation audit requires a projectId.");
  const issues: CitationAuditIssue[] = [];
  const sourceById = new Map(input.sources.map((source) => [source.id, source]));
  const refs = input.sections.flatMap((section) => section.citationIds.map((citationRef) => ({ section, citationRef })));
  const matchedSourceIds = new Set<string>();
  const unresolvedCitationRefs = new Set<string>();
  const seenRefs = new Set<string>();

  for (const { section, citationRef } of refs) {
    if (seenRefs.has(citationRef)) issues.push({ code: "DUPLICATE_CITATION", status: "WARNING", citationRef, message: `Citation '${citationRef}' is repeated in manuscript citation metadata.` });
    seenRefs.add(citationRef);
    let source = sourceById.get(citationRef);
    if (!source && (DOI.test(normalizeIdentifier(citationRef)) || /^(pmid|pmcid|arxiv):/i.test(citationRef))) {
      source = input.sources.find((candidate) => sourceIdentifierMatches(candidate, citationRef));
      if (!source && input.resolveIdentifier) {
        const resolved = await input.resolveIdentifier(citationRef);
        if (resolved) issues.push({ code: "UNRESOLVED_IDENTIFIER", status: "BLOCKER", citationRef, message: `Identifier '${citationRef}' resolved externally but is not an imported project Source; researcher import is required.` });
      }
    }
    if (!source) {
      unresolvedCitationRefs.add(citationRef);
      issues.push({ code: "UNRESOLVED_IDENTIFIER", status: "BLOCKER", citationRef, message: `Citation '${citationRef}' does not map to a project Source. No replacement or synthetic Source was created.` });
      continue;
    }
    matchedSourceIds.add(source.id);
    if (source.verificationState === "Retracted" || source.state === "Retracted" || source.retractionWarning) issues.push({ code: "RETRACTED_SOURCE", status: "WARNING", sourceId: source.id, citationRef, message: `Source '${source.id}' carries a retraction warning/state and requires researcher review.` });
    if (source.verificationState === "Corrected" || source.state === "Corrected" || source.correctionNotice) issues.push({ code: "CORRECTED_SOURCE", status: "WARNING", sourceId: source.id, citationRef, message: `Source '${source.id}' carries a correction/update notice: ${source.correctionNotice || "Researcher review required."}` });
    if (source.verificationState !== "Verified" && source.verificationState !== "Corrected" && source.verificationState !== "Retracted") issues.push({ code: "SOURCE_NOT_VERIFIED", status: "BLOCKER", sourceId: source.id, citationRef, message: `Source '${source.id}' is ${source.verificationState}, not independently verified.` });
    const evidence = input.evidenceRecords.filter((record) => record.sourceId === source!.id && record.verification === "Researcher Verified" && record.researcherReview.status === "Verified" && !record.isDemo && !record.isSynthetic && record.exactPassage.trim());
    if (!evidence.length) issues.push({ code: "MISSING_EVIDENCE", status: "BLOCKER", sourceId: source.id, citationRef, message: `Citation '${citationRef}' in section '${section.id}' has no researcher-verified supporting EvidenceRecord.` });
  }

  const bibliographyBySource = new Map<string, CitationAuditBibliographyEntry[]>();
  for (const entry of input.bibliography) {
    const source = entry.sourceId ? sourceById.get(entry.sourceId) : entry.identifier ? input.sources.find((candidate) => sourceIdentifierMatches(candidate, entry.identifier!)) : undefined;
    const key = source?.id || entry.sourceId || normalizeIdentifier(entry.identifier || entry.entryId);
    const entries = bibliographyBySource.get(key) || [];
    entries.push(entry);
    bibliographyBySource.set(key, entries);
  }
  for (const [key, entries] of bibliographyBySource) if (entries.length > 1) entries.forEach((entry) => issues.push({ code: "DUPLICATE_BIBLIOGRAPHY", status: "BLOCKER", sourceId: sourceById.has(key) ? key : undefined, entryId: entry.entryId, message: `Bibliography contains duplicate entries for '${key}'.` }));
  for (const entry of input.bibliography) {
    const source = entry.sourceId ? sourceById.get(entry.sourceId) : entry.identifier ? input.sources.find((candidate) => sourceIdentifierMatches(candidate, entry.identifier!)) : undefined;
    if (!source || !matchedSourceIds.has(source.id)) issues.push({ code: "ORPHAN_BIBLIOGRAPHY", status: "WARNING", entryId: entry.entryId, sourceId: source?.id, message: `Bibliography entry '${entry.entryId}' is not matched to an in-text citation.` });
  }
  for (const sourceId of matchedSourceIds) if (!bibliographyBySource.has(sourceId)) issues.push({ code: "MISSING_BIBLIOGRAPHY", status: "BLOCKER", sourceId, message: `In-text Source '${sourceId}' has no synchronized bibliography entry.` });

  const status: CitationAuditStatus = issues.some((issue) => issue.status === "BLOCKER") ? "BLOCKER" : issues.length ? "WARNING" : "PASS";
  return { projectId: input.projectId, status, auditedAt: now(), inTextCitationCount: refs.length, matchedSourceIds: [...matchedSourceIds], unresolvedCitationRefs: [...unresolvedCitationRefs], issues, sourceCreationAttempted: false };
}
