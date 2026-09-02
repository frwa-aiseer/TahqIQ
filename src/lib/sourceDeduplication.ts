import type { FieldProvenance, SourceFieldConflict, SourceProviderAlias, SourceRecord } from "../types";
import { normalizeDoi } from "./metadataProviders";
import { normalizeArxivId } from "./specialistDiscoveryProviders";

export interface SourceDuplicateGroup {
  canonicalSourceId: string;
  aliasSourceIds: string[];
  matchReasons: string[];
  conflicts: SourceFieldConflict[];
}

export interface SourceDeduplicationResult {
  sources: SourceRecord[];
  duplicateGroups: SourceDuplicateGroup[];
}

const MERGE_FIELDS: Array<keyof SourceRecord> = [
  "title", "authors", "year", "fullDate", "journalOrVenue", "publisher", "volume", "issue", "pages", "doi", "pmid", "pmcid", "arxivId", "url", "abstract", "documentType", "peerReviewStatus", "openAccessStatus",
];

const normalizeText = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const normalizePmid = (value?: string) => value?.trim().match(/^\d+$/)?.[0] || "";
const normalizePmcid = (value?: string) => value?.trim().toUpperCase().match(/^PMC\d+$/)?.[0] || "";
const normalizeOther = (scheme: string, value: string) => `${normalizeText(scheme)}:${normalizeText(value)}`;
const present = (value: unknown) => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== "" && value !== 0;
const comparable = (value: unknown) => Array.isArray(value) ? value.map((item) => normalizeText(String(item))).join("|") : typeof value === "string" ? normalizeText(value) : JSON.stringify(value);

function identifiers(source: SourceRecord): Map<string, string> {
  const result = new Map<string, string>();
  const doi = normalizeDoi(source.doi || "").toLowerCase(); if (doi) result.set("doi", doi);
  const pmid = normalizePmid(source.pmid); if (pmid) result.set("pmid", pmid);
  const pmcid = normalizePmcid(source.pmcid); if (pmcid) result.set("pmcid", pmcid);
  const arxiv = normalizeArxivId(source.arxivId || source.url || "").toLowerCase(); if (arxiv) result.set("arxiv", arxiv);
  for (const item of source.otherStableIds || []) if (item.scheme?.trim() && item.value?.trim()) result.set(`other:${normalizeText(item.scheme)}`, normalizeOther(item.scheme, item.value));
  for (const alias of source.providerAliases || []) for (const [scheme, value] of Object.entries(alias.identifiers || {})) if (value) result.set(`alias:${normalizeText(scheme)}`, normalizeText(value));
  return result;
}

function firstAuthor(source: SourceRecord) { return source.authors?.[0] ? normalizeText(source.authors[0]) : ""; }
function matchSources(left: SourceRecord, right: SourceRecord): string[] {
  const leftIds = identifiers(left), rightIds = identifiers(right), shared: string[] = [];
  for (const [scheme, value] of leftIds) if (rightIds.get(scheme) === value) shared.push(`${scheme}:${value}`);
  if (shared.length) return shared;
  for (const [scheme, value] of leftIds) if (rightIds.has(scheme) && rightIds.get(scheme) !== value) return [];
  const title = normalizeText(left.title || ""), otherTitle = normalizeText(right.title || "");
  if (!title || title !== otherTitle || !left.year || left.year !== right.year) return [];
  const author = firstAuthor(left), otherAuthor = firstAuthor(right);
  if (!author || author !== otherAuthor) return [];
  return [`bibliographic-exact:title+year+first-author`];
}

function sourceScore(source: SourceRecord): number {
  const canonical = source.canonicalSourceId ? 5000 : 0;
  const verification = source.verificationState === "Verified" ? 1000 : source.state === "Metadata Verified" ? 800 : 0;
  const metadata = MERGE_FIELDS.reduce((score, field) => score + (present(source[field]) ? 1 : 0), 0);
  return canonical + verification + metadata;
}
function preferredRecord(records: SourceRecord[]): SourceRecord {
  return [...records].sort((left, right) => sourceScore(right) - sourceScore(left) || left.id.localeCompare(right.id))[0];
}
function providerAlias(source: SourceRecord): SourceProviderAlias {
  const ids = Object.fromEntries(identifiers(source));
  return { sourceId: source.id, provider: source.metadataProvider || source.provenance?.provider || "Not available", providerId: source.provenance?.providerId, providerRecordId: source.providerRecordId, identifiers: ids, retrievedAt: source.provenance?.retrievedAt };
}

function mergeGroup(records: SourceRecord[], reasons: string[]): { source: SourceRecord; group: SourceDuplicateGroup } {
  const preferred = preferredRecord(records), canonicalSourceId = preferred.canonicalSourceId || preferred.id;
  const merged: SourceRecord = { ...preferred, id: canonicalSourceId, canonicalSourceId };
  const preferredFieldSources: Record<string, string> = {};
  const conflicts: SourceFieldConflict[] = [];
  const mergedFieldProvenance: Record<string, FieldProvenance> = { ...(preferred.provenance?.fieldProvenance || {}) };
  for (const field of MERGE_FIELDS) {
    const candidates = records.filter((source) => present(source[field])).sort((left, right) => sourceScore(right) - sourceScore(left) || left.id.localeCompare(right.id));
    if (!candidates.length) continue;
    const chosen = candidates[0], chosenValue = chosen[field];
    (merged as any)[field] = chosenValue;
    preferredFieldSources[field] = chosen.id;
    const chosenProvenance = chosen.provenance?.fieldProvenance?.[field];
    if (chosenProvenance) mergedFieldProvenance[field] = chosenProvenance;
    const distinct = new Map<string, SourceRecord>();
    for (const candidate of candidates) distinct.set(comparable(candidate[field]), candidate);
    if (distinct.size > 1) {
      conflicts.push({ field, preferredSourceId: chosen.id, resolution: "Unresolved", values: [...distinct.values()].map((source) => ({ sourceId: source.id, provider: source.metadataProvider || source.provenance?.provider || "Not available", value: source[field], provenance: source.provenance?.fieldProvenance?.[field] })) });
    }
  }
  const aliases = records.flatMap((source) => source.providerAliases?.length ? source.providerAliases : [providerAlias(source)]);
  merged.providerAliases = [...new Map(aliases.map((alias) => [`${alias.sourceId}:${alias.providerId || alias.provider}`, alias])).values()].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  merged.preferredFieldSources = preferredFieldSources;
  merged.fieldConflicts = conflicts;
  merged.provenance = { ...(preferred.provenance || { provider: preferred.metadataProvider || "Not available", retrievedAt: "Not available" }), fieldProvenance: mergedFieldProvenance };
  merged.tags = [...new Set(records.flatMap((source) => source.tags || []))];
  return { source: merged, group: { canonicalSourceId, aliasSourceIds: records.map((source) => source.id).sort(), matchReasons: [...new Set(reasons)].sort(), conflicts } };
}

export function deduplicateSources(input: readonly SourceRecord[]): SourceDeduplicationResult {
  const sources = [...input], parents = sources.map((_, index) => index), reasons = new Map<string, string[]>();
  const find = (index: number): number => parents[index] === index ? index : (parents[index] = find(parents[index]));
  const union = (left: number, right: number, matches: string[]) => {
    const a = find(left), b = find(right); if (a !== b) parents[Math.max(a, b)] = Math.min(a, b);
    const key = [sources[left].id, sources[right].id].sort().join("|"); reasons.set(key, matches);
  };
  for (let left = 0; left < sources.length; left++) for (let right = left + 1; right < sources.length; right++) {
    const matches = matchSources(sources[left], sources[right]); if (matches.length) union(left, right, matches);
  }
  const groups = new Map<number, SourceRecord[]>();
  sources.forEach((source, index) => { const root = find(index); groups.set(root, [...(groups.get(root) || []), source]); });
  const output: SourceRecord[] = [], duplicateGroups: SourceDuplicateGroup[] = [];
  for (const records of groups.values()) {
    if (records.length === 1) { output.push(records[0]); continue; }
    const ids = new Set(records.map((record) => record.id));
    const groupReasons = [...reasons.entries()].filter(([pair]) => pair.split("|").every((id) => ids.has(id))).flatMap(([, match]) => match);
    const merged = mergeGroup(records, groupReasons); output.push(merged.source); duplicateGroups.push(merged.group);
  }
  output.sort((left, right) => left.id.localeCompare(right.id));
  duplicateGroups.sort((left, right) => left.canonicalSourceId.localeCompare(right.canonicalSourceId));
  return { sources: output, duplicateGroups };
}

export function upsertDeduplicatedSource(existing: readonly SourceRecord[], incoming: SourceRecord): SourceDeduplicationResult {
  return deduplicateSources([...existing.map((source) => ({ ...source, canonicalSourceId: source.canonicalSourceId || source.id })), incoming]);
}
