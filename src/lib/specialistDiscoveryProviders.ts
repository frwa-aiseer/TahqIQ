import type { FieldProvenance } from "../types";
import { normalizeDoi, type MetadataProviderErrorKind, type MetadataProviderId, type MetadataProviderResult } from "./metadataProviders";

export interface OpenAccessLocation {
  status: "open" | "closed" | "unknown";
  accessUrl?: string;
  pdfUrl?: string;
  hostType?: string;
  license?: string;
  version?: string;
  evidence?: string;
}

export interface SpecialistProviderResult extends MetadataProviderResult {
  openAccess?: OpenAccessLocation;
  recordUrl?: string;
  categories?: string[];
}

export interface ProviderCapabilityDeclaration {
  id: MetadataProviderId;
  name: string;
  capabilities: Array<"metadata_lookup" | "metadata_search" | "oa_discovery">;
  identifiers: string[];
  requiredConfig: string[];
  optionalConfig: string[];
  rateHandling: { strategy: "retry_after" | "minimum_interval"; publishedLimit?: string; minimumIntervalMs?: number };
  fullTextPolicy: "provider_supplied_links_only";
}

export interface UnpaywallConfig { email?: string }
export interface SearchOptions { limit?: number; start?: number }

const PROVIDERS = {
  unpaywall: { id: "unpaywall" as const, name: "Unpaywall API" },
  arxiv: { id: "arxiv" as const, name: "arXiv Metadata API" },
  doaj: { id: "doaj" as const, name: "Directory of Open Access Journals" },
};

export const SPECIALIST_PROVIDER_REGISTRY: ProviderCapabilityDeclaration[] = [
  {
    ...PROVIDERS.unpaywall,
    capabilities: ["metadata_lookup", "oa_discovery"],
    identifiers: ["DOI"],
    requiredConfig: ["email"],
    optionalConfig: [],
    rateHandling: { strategy: "retry_after", publishedLimit: "100000 requests/day" },
    fullTextPolicy: "provider_supplied_links_only",
  },
  {
    ...PROVIDERS.arxiv,
    capabilities: ["metadata_lookup", "metadata_search"],
    identifiers: ["arXiv ID", "DOI when supplied by arXiv"],
    requiredConfig: [],
    optionalConfig: [],
    rateHandling: { strategy: "minimum_interval", minimumIntervalMs: 3000 },
    fullTextPolicy: "provider_supplied_links_only",
  },
  {
    ...PROVIDERS.doaj,
    capabilities: ["metadata_lookup", "metadata_search", "oa_discovery"],
    identifiers: ["DOI", "DOAJ record ID"],
    requiredConfig: [],
    optionalConfig: [],
    rateHandling: { strategy: "retry_after" },
    fullTextPolicy: "provider_supplied_links_only",
  },
];

const cleanText = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const cleanUrl = (value: unknown): string | undefined => {
  const candidate = cleanText(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch { return undefined; }
};
const cleanList = (values: unknown[]): string[] | undefined => {
  const list = values.map(cleanText).filter((value): value is string => Boolean(value));
  return list.length ? list : undefined;
};
const cleanYear = (value: unknown): number | undefined => {
  const match = cleanText(value)?.match(/\b(\d{4})\b/)?.[1];
  return match ? Number.parseInt(match, 10) : undefined;
};
function fieldProvenance(fields: Record<string, unknown>, provider: { id: MetadataProviderId; name: string }, retrievedAt: string, rawUrl: string) {
  const result: Record<string, FieldProvenance> = {};
  for (const [field, value] of Object.entries(fields)) {
    if ((Array.isArray(value) && value.length) || (!Array.isArray(value) && value !== undefined && value !== null && value !== "")) {
      result[field] = { providerId: provider.id, provider: provider.name, timestamp: retrievedAt, rawRecordUrl: rawUrl };
    }
  }
  return result;
}
function failure(provider: { id: MetadataProviderId; name: string }, at: string, kind: MetadataProviderErrorKind, message: string, rawUrl?: string, response?: Response): SpecialistProviderResult {
  const retry = response?.status === 429 ? Number.parseInt(response.headers?.get?.("retry-after") || "", 10) : NaN;
  return { success: false, providerId: provider.id, providerName: provider.name, retrievedAt: at, errorKind: kind, error: message, rawUrl,
    statusCode: response?.status, retryAfterSeconds: Number.isFinite(retry) && retry >= 0 ? retry : undefined };
}
function httpFailure(provider: { id: MetadataProviderId; name: string }, at: string, url: string, response: Response, identity: string) {
  if (response.status === 404) return failure(provider, at, "not_found", `${identity} was not found by ${provider.name}.`, url, response);
  if (response.status === 429) return failure(provider, at, "rate_limited", `${provider.name} rate limit was reached.`, url, response);
  return failure(provider, at, "provider_error", `${provider.name} returned HTTP ${response.status}.`, url, response);
}

export async function discoverUnpaywallAccess(doiInput: string, config: UnpaywallConfig = {}): Promise<SpecialistProviderResult> {
  const provider = PROVIDERS.unpaywall, retrievedAt = new Date().toISOString(), doi = normalizeDoi(doiInput);
  if (!doi) return failure(provider, retrievedAt, "invalid_request", "Unpaywall discovery requires a valid DOI.");
  if (!config.email?.trim()) return failure(provider, retrievedAt, "not_configured", "Unpaywall is not configured: a contact email is required by the provider API.");
  const rawUrl = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(config.email.trim())}`;
  try {
    const response = await fetch(rawUrl);
    if (!response.ok) return httpFailure(provider, retrievedAt, rawUrl, response, `DOI '${doi}'`);
    const item = await response.json();
    if (!item || typeof item !== "object") return failure(provider, retrievedAt, "invalid_response", "Unpaywall returned no OA record.", rawUrl);
    const resolvedDoi = normalizeDoi(item.doi || "") || doi;
    const location = item.is_oa === true && item.best_oa_location ? item.best_oa_location : undefined;
    const openAccess: OpenAccessLocation = item.is_oa === true
      ? { status: "open", accessUrl: cleanUrl(location?.url), pdfUrl: cleanUrl(location?.url_for_pdf), hostType: cleanText(location?.host_type), license: cleanText(location?.license), version: cleanText(location?.version), evidence: cleanText(location?.evidence) }
      : item.is_oa === false ? { status: "closed" } : { status: "unknown" };
    const fields = { doi: resolvedDoi, title: cleanText(item.title), authors: cleanList((item.z_authors || []).map((author: any) => author.family || author.given ? [author.family, author.given].filter(Boolean).join(", ") : author.name)),
      year: typeof item.year === "number" ? item.year : cleanYear(item.year), journalOrVenue: cleanText(item.journal_name), publisher: cleanText(item.publisher), openAccess };
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId: resolvedDoi, identifiers: { doi: resolvedDoi }, retrievedAt, rawUrl, ...fields,
      fieldProvenance: fieldProvenance(fields, provider, retrievedAt, rawUrl) };
  } catch (error: any) { return failure(provider, retrievedAt, "network_error", `Network failure connecting to Unpaywall: ${error?.message || error}`, rawUrl); }
}

export function normalizeArxivId(input: string): string {
  const clean = input.trim().replace(/^arxiv:\s*/i, "").replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//i, "").replace(/\.pdf$/i, "");
  return /^(?:[a-z-]+(?:\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?$/i.test(clean) ? clean : "";
}
const decodeXml = (value: string) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const tag = (xml: string, name: string) => cleanText(decodeXml(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "").replace(/\s+/g, " "));
const tags = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "gi"))].map((match) => decodeXml(match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())).filter(Boolean);
const attribute = (xml: string, element: string, attributeName: string, requiredFragment = "") => {
  const elements = [...xml.matchAll(new RegExp(`<${element}\\s+([^>]+)\\/?>`, "gi"))];
  const selected = elements.find((match) => !requiredFragment || match[1].includes(requiredFragment));
  return cleanUrl(selected?.[1].match(new RegExp(`${attributeName}=["']([^"']+)["']`, "i"))?.[1]);
};
function parseArxivFeed(xml: string, provider: typeof PROVIDERS.arxiv, retrievedAt: string, rawUrl: string): SpecialistProviderResult[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const entry = match[1], recordUrl = cleanUrl(tag(entry, "id")), arxivId = normalizeArxivId(recordUrl || ""), doi = normalizeDoi(tag(entry, "arxiv:doi") || "") || undefined;
    const fields = { doi, title: tag(entry, "title"), authors: tags(entry, "name"), year: cleanYear(tag(entry, "published")), journalOrVenue: tag(entry, "arxiv:journal_ref"), abstract: tag(entry, "summary") };
    const pdfUrl = attribute(entry, "link", "href", 'title="pdf"'), categories = [...entry.matchAll(/<category\s+[^>]*term=["']([^"']+)["']/gi)].map((item) => decodeXml(item[1]));
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId: arxivId || undefined, identifiers: { doi, arxivId: arxivId || undefined }, retrievedAt, rawUrl, recordUrl, categories: categories.length ? categories : undefined,
      ...fields, openAccess: { status: "open", accessUrl: recordUrl, pdfUrl }, fieldProvenance: fieldProvenance({ ...fields, arxivId, recordUrl, pdfUrl, categories }, provider, retrievedAt, rawUrl) };
  });
}
async function requestArxiv(params: URLSearchParams, identity: string): Promise<SpecialistProviderResult[]> {
  const provider = PROVIDERS.arxiv, retrievedAt = new Date().toISOString(), rawUrl = `https://export.arxiv.org/api/query?${params}`;
  try {
    const response = await fetch(rawUrl, { headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" } });
    if (!response.ok) return [httpFailure(provider, retrievedAt, rawUrl, response, identity)];
    const records = parseArxivFeed(await response.text(), provider, retrievedAt, rawUrl);
    return records.length ? records : [failure(provider, retrievedAt, "not_found", `${identity} was not found by ${provider.name}.`, rawUrl)];
  } catch (error: any) { return [failure(provider, retrievedAt, "network_error", `Network failure connecting to arXiv: ${error?.message || error}`, rawUrl)]; }
}
export async function fetchArxivMetadata(input: string): Promise<SpecialistProviderResult> {
  const id = normalizeArxivId(input);
  if (!id) return failure(PROVIDERS.arxiv, new Date().toISOString(), "invalid_request", "arXiv lookup requires a valid arXiv ID.");
  return (await requestArxiv(new URLSearchParams({ id_list: id, max_results: "1" }), `arXiv ID '${id}'`))[0];
}
export async function searchArxivMetadata(query: string, options: SearchOptions = {}): Promise<SpecialistProviderResult[]> {
  const clean = query.trim();
  if (!clean) return [failure(PROVIDERS.arxiv, new Date().toISOString(), "invalid_request", "arXiv search requires a query.")];
  const limit = Math.min(Math.max(options.limit || 10, 1), 100), start = Math.max(options.start || 0, 0);
  return requestArxiv(new URLSearchParams({ search_query: `all:${clean}`, start: String(start), max_results: String(limit) }), `arXiv query '${clean}'`);
}

function doajRecord(item: any, provider: typeof PROVIDERS.doaj, retrievedAt: string, rawUrl: string): SpecialistProviderResult {
  const bib = item?.bibjson || item?.attributes?.bibjson || {}, providerRecordId = cleanText(item?.id), ids: any[] = Array.isArray(bib.identifier) ? bib.identifier : [];
  const doi = normalizeDoi(ids.find((id) => String(id.type).toLowerCase() === "doi")?.id || "") || undefined;
  const links: any[] = Array.isArray(bib.link) ? bib.link : [], fullText = links.find((link) => String(link.type).toLowerCase() === "fulltext" && cleanUrl(link.url));
  const fields = { doi, title: cleanText(bib.title), authors: cleanList((bib.author || []).map((author: any) => author.name)), year: typeof bib.year === "number" ? bib.year : cleanYear(bib.year),
    journalOrVenue: cleanText(bib.journal?.title), volume: cleanText(bib.journal?.volume), issue: cleanText(bib.journal?.number), pages: cleanText(bib.start_page) && cleanText(bib.end_page) ? `${cleanText(bib.start_page)}-${cleanText(bib.end_page)}` : cleanText(bib.start_page), publisher: cleanText(bib.publisher) };
  const openAccess: OpenAccessLocation = { status: "open", accessUrl: cleanUrl(fullText?.url), license: cleanText(bib.license?.[0]?.type) };
  return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId, identifiers: { doi, doajId: providerRecordId }, retrievedAt, rawUrl, ...fields, openAccess,
    fieldProvenance: fieldProvenance({ ...fields, openAccess }, provider, retrievedAt, rawUrl) };
}
async function requestDoaj(url: string, identity: string): Promise<SpecialistProviderResult[]> {
  const provider = PROVIDERS.doaj, retrievedAt = new Date().toISOString();
  try {
    const response = await fetch(url); if (!response.ok) return [httpFailure(provider, retrievedAt, url, response, identity)];
    const json = await response.json(), records = Array.isArray(json?.results) ? json.results : json?.bibjson || json?.attributes?.bibjson ? [json] : [];
    return records.length ? records.map((record: any) => doajRecord(record, provider, retrievedAt, url)) : [failure(provider, retrievedAt, "not_found", `${identity} was not found by ${provider.name}.`, url)];
  } catch (error: any) { return [failure(provider, retrievedAt, "network_error", `Network failure connecting to DOAJ: ${error?.message || error}`, url)]; }
}
export async function fetchDoajMetadata(identifier: string): Promise<SpecialistProviderResult> {
  const doi = normalizeDoi(identifier), id = identifier.trim();
  if (!doi && !/^[A-Za-z0-9_-]{8,}$/.test(id)) return failure(PROVIDERS.doaj, new Date().toISOString(), "invalid_request", "DOAJ lookup requires a DOI or DOAJ record ID.");
  const url = doi ? `https://doaj.org/api/search/articles/doi:${encodeURIComponent(doi)}?pageSize=1` : `https://doaj.org/api/articles/${encodeURIComponent(id)}`;
  return (await requestDoaj(url, doi ? `DOI '${doi}'` : `DOAJ record '${id}'`))[0];
}
export async function searchDoajMetadata(query: string, options: SearchOptions = {}): Promise<SpecialistProviderResult[]> {
  const clean = query.trim();
  if (!clean) return [failure(PROVIDERS.doaj, new Date().toISOString(), "invalid_request", "DOAJ search requires a query.")];
  const limit = Math.min(Math.max(options.limit || 10, 1), 100), url = `https://doaj.org/api/search/articles/${encodeURIComponent(`bibjson.title:${clean}`)}?pageSize=${limit}`;
  return requestDoaj(url, `DOAJ query '${clean}'`);
}
