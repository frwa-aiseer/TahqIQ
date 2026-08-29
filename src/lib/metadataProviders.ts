import { FieldProvenance } from "../types";

export type MetadataProviderId = "crossref" | "openalex" | "datacite" | "europepmc" | "pubmed_ncbi" | "router";
export type MetadataProviderErrorKind = "invalid_request" | "not_found" | "rate_limited" | "provider_error" | "network_error" | "invalid_response";
export interface MetadataProviderIdentifiers { doi?: string; pmid?: string; pmcid?: string; openAlexId?: string; dataCiteId?: string; europePmcId?: string }
export interface MetadataProviderResult {
  success: boolean; providerId: MetadataProviderId; providerName: string; retrievedAt: string;
  providerRecordId?: string; identifiers?: MetadataProviderIdentifiers; error?: string; errorKind?: MetadataProviderErrorKind;
  statusCode?: number; retryAfterSeconds?: number; doi?: string; pmid?: string; pmcid?: string; title?: string;
  authors?: string[]; year?: number; journalOrVenue?: string; volume?: string; issue?: string; pages?: string;
  publisher?: string; abstract?: string; rawUrl?: string; disclaimer?: string; fieldProvenance?: Record<string, FieldProvenance>;
}
export interface CandidateSearchOptions { query?: string; author?: string; year?: number; limit?: number }
export interface PubMedLookupOptions { apiKey?: string; email?: string; tool?: string }
export interface DoiLookupOptions { pubMed?: PubMedLookupOptions }

const P = {
  crossref: { id: "crossref" as const, name: "Crossref Official Registry" },
  openalex: { id: "openalex" as const, name: "OpenAlex Open Catalog" },
  datacite: { id: "datacite" as const, name: "DataCite DOI Registry" },
  europepmc: { id: "europepmc" as const, name: "Europe PMC Open Archive" },
  pubmed: { id: "pubmed_ncbi" as const, name: "PubMed (NCBI E-Utilities)" },
};

export function normalizeDoi(raw: string): string {
  if (!raw) return "";
  const clean = raw.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").replace(/^doi\//i, "").trim();
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(clean) ? clean : "";
}
export class CrossrefDisclaimer {
  static readonly MESSAGE = "Bibliographic Metadata Verified (Crossref Registry Only). This confirms official bibliographic registry records only; it does NOT verify peer-review status, full-text contents, claim support, or retraction clearance.";
}
const text = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const strings = (values: unknown[]): string[] | undefined => {
  const result = values.map(text).filter((value): value is string => Boolean(value));
  return result.length ? result : undefined;
};
const year = (value: unknown): number | undefined => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(parsed) && parsed >= 1000 && parsed <= 9999 ? parsed : undefined;
};
function provenance(fields: Record<string, unknown>, provider: { id: MetadataProviderId; name: string }, retrievedAt: string, rawUrl?: string) {
  const result: Record<string, FieldProvenance> = {};
  for (const [field, value] of Object.entries(fields)) {
    if ((Array.isArray(value) && value.length) || (!Array.isArray(value) && value !== undefined && value !== null && value !== "")) {
      result[field] = { providerId: provider.id, provider: provider.name, timestamp: retrievedAt, rawRecordUrl: rawUrl };
    }
  }
  return result;
}
function failure(provider: { id: MetadataProviderId; name: string }, retrievedAt: string, errorKind: MetadataProviderErrorKind, error: string, rawUrl?: string, response?: Response): MetadataProviderResult {
  const retry = response?.status === 429 ? Number.parseInt(response.headers?.get?.("retry-after") || "", 10) : NaN;
  return { success: false, providerId: provider.id, providerName: provider.name, retrievedAt, errorKind, error, rawUrl,
    statusCode: response?.status, retryAfterSeconds: Number.isFinite(retry) && retry >= 0 ? retry : undefined };
}
function httpFailure(provider: { id: MetadataProviderId; name: string }, at: string, url: string, response: Response, identifier: string) {
  if (response.status === 404) return failure(provider, at, "not_found", `${identifier} was not found by ${provider.name}.`, url, response);
  if (response.status === 429) return failure(provider, at, "rate_limited", `${provider.name} rate limit was reached.`, url, response);
  return failure(provider, at, "provider_error", `${provider.name} returned HTTP ${response.status}.`, url, response);
}
const invalidDoi = (provider: { id: MetadataProviderId; name: string }) => failure(provider, new Date().toISOString(), "invalid_request", "Invalid or unrecognized DOI format.");

export async function fetchCrossrefMetadata(input: string): Promise<MetadataProviderResult> {
  const provider = P.crossref, doi = normalizeDoi(input); if (!doi) return invalidDoi(provider);
  const retrievedAt = new Date().toISOString(), rawUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  try {
    const response = await fetch(rawUrl, { headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" } });
    if (!response.ok) return httpFailure(provider, retrievedAt, rawUrl, response, `DOI '${doi}'`);
    const item = (await response.json())?.message;
    if (!item || typeof item !== "object") return failure(provider, retrievedAt, "invalid_response", "Crossref returned no bibliographic record.", rawUrl);
    const resolvedDoi = normalizeDoi(item.DOI || "") || doi;
    const fields = { doi: resolvedDoi, title: text(item.title?.[0]), authors: strings((item.author || []).map((a: any) => [text(a.family), text(a.given)].filter(Boolean).join(", "))),
      year: year(item.published?.["date-parts"]?.[0]?.[0] ?? item.created?.["date-parts"]?.[0]?.[0]), journalOrVenue: text(item["container-title"]?.[0]), publisher: text(item.publisher), volume: text(item.volume), issue: text(item.issue), pages: text(item.page) };
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId: resolvedDoi, identifiers: { doi: resolvedDoi }, retrievedAt, rawUrl, ...fields,
      disclaimer: CrossrefDisclaimer.MESSAGE, fieldProvenance: provenance(fields, provider, retrievedAt, rawUrl) };
  } catch (error: any) { return failure(provider, retrievedAt, "network_error", `Network failure connecting to Crossref: ${error?.message || error}`, rawUrl); }
}

export async function fetchOpenAlexMetadata(input: string): Promise<MetadataProviderResult> {
  const provider = P.openalex, doi = normalizeDoi(input); if (!doi) return invalidDoi(provider);
  const retrievedAt = new Date().toISOString(), rawUrl = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`;
  try {
    const response = await fetch(rawUrl); if (!response.ok) return httpFailure(provider, retrievedAt, rawUrl, response, `DOI '${doi}'`);
    const item = await response.json(); if (!item || typeof item !== "object") return failure(provider, retrievedAt, "invalid_response", "OpenAlex returned no bibliographic record.", rawUrl);
    const resolvedDoi = normalizeDoi(item.doi || "") || doi, providerRecordId = text(item.id);
    const fields = { doi: resolvedDoi, title: text(item.title), authors: strings((item.authorships || []).map((a: any) => a.author?.display_name)), year: year(item.publication_year),
      journalOrVenue: text(item.primary_location?.source?.display_name), publisher: text(item.primary_location?.source?.host_organization_name ?? item.primary_location?.source?.publisher) };
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId, identifiers: { doi: resolvedDoi, openAlexId: providerRecordId }, retrievedAt, rawUrl, ...fields,
      fieldProvenance: provenance(fields, provider, retrievedAt, rawUrl) };
  } catch (error: any) { return failure(provider, retrievedAt, "network_error", `Network failure connecting to OpenAlex: ${error?.message || error}`, rawUrl); }
}

export async function fetchDataCiteMetadata(input: string): Promise<MetadataProviderResult> {
  const provider = P.datacite, doi = normalizeDoi(input); if (!doi) return invalidDoi(provider);
  const retrievedAt = new Date().toISOString(), rawUrl = `https://api.datacite.org/dois/${encodeURIComponent(doi)}`;
  try {
    const response = await fetch(rawUrl); if (!response.ok) return httpFailure(provider, retrievedAt, rawUrl, response, `DOI '${doi}'`);
    const json = await response.json(), item = json?.data?.attributes;
    if (!item || typeof item !== "object") return failure(provider, retrievedAt, "invalid_response", "DataCite returned no bibliographic record.", rawUrl);
    const resolvedDoi = normalizeDoi(item.doi || json.data?.id || "") || doi, providerRecordId = text(json.data?.id) || resolvedDoi;
    const fields = { doi: resolvedDoi, title: text(item.titles?.[0]?.title), authors: strings((item.creators || []).map((a: any) => a.name || [text(a.familyName), text(a.givenName)].filter(Boolean).join(", "))),
      year: year(item.publicationYear), publisher: text(item.publisher) };
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId, identifiers: { doi: resolvedDoi, dataCiteId: providerRecordId }, retrievedAt, rawUrl, ...fields,
      fieldProvenance: provenance(fields, provider, retrievedAt, rawUrl) };
  } catch (error: any) { return failure(provider, retrievedAt, "network_error", `Network failure connecting to DataCite: ${error?.message || error}`, rawUrl); }
}

export async function fetchEuropePmcMetadata(input: string): Promise<MetadataProviderResult> {
  const provider = P.europepmc, doi = normalizeDoi(input); if (!doi) return invalidDoi(provider);
  const retrievedAt = new Date().toISOString(), rawUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(doi)}&format=json`;
  try {
    const response = await fetch(rawUrl); if (!response.ok) return httpFailure(provider, retrievedAt, rawUrl, response, `DOI '${doi}'`);
    const item = (await response.json())?.resultList?.result?.[0];
    if (!item) return failure(provider, retrievedAt, "not_found", `DOI '${doi}' was not found by ${provider.name}.`, rawUrl);
    const resolvedDoi = normalizeDoi(item.doi || "") || doi, pmid = text(item.pmid), pmcid = text(item.pmcid), providerRecordId = text(item.id) || pmid || pmcid || resolvedDoi;
    const fields = { doi: resolvedDoi, pmid, pmcid, title: text(item.title), authors: strings((text(item.authorString)?.split(",") || []).map((a) => a.trim())), year: year(item.pubYear),
      journalOrVenue: text(item.journalTitle), volume: text(item.journalVolume), issue: text(item.issue), pages: text(item.pageInfo), abstract: text(item.abstractText) };
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId, identifiers: { doi: resolvedDoi, pmid, pmcid, europePmcId: providerRecordId }, retrievedAt, rawUrl, ...fields,
      fieldProvenance: provenance(fields, provider, retrievedAt, rawUrl) };
  } catch (error: any) { return failure(provider, retrievedAt, "network_error", `Network failure connecting to Europe PMC: ${error?.message || error}`, rawUrl); }
}

function pubMedUrl(path: "esearch" | "esummary", params: Record<string, string>, options: PubMedLookupOptions) {
  const query = new URLSearchParams({ db: "pubmed", retmode: "json", tool: options.tool?.trim() || "tehqiq", ...params });
  if (options.email?.trim()) query.set("email", options.email.trim());
  if (options.apiKey?.trim()) query.set("api_key", options.apiKey.trim());
  return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${path}.fcgi?${query}`;
}
export async function fetchPubMedMetadata(identifier: string, options: PubMedLookupOptions = {}): Promise<MetadataProviderResult> {
  const provider = P.pubmed, retrievedAt = new Date().toISOString(), requestedPmid = /^\d+$/.test(identifier.trim()) ? identifier.trim() : undefined;
  const requestedDoi = requestedPmid ? undefined : normalizeDoi(identifier);
  if (!requestedPmid && !requestedDoi) return failure(provider, retrievedAt, "invalid_request", "PubMed lookup requires a PMID or valid DOI.");
  try {
    let pmid = requestedPmid;
    if (!pmid && requestedDoi) {
      const searchUrl = pubMedUrl("esearch", { term: `${requestedDoi}[doi]`, retmax: "1" }, options), search = await fetch(searchUrl);
      if (!search.ok) return httpFailure(provider, retrievedAt, searchUrl, search, `DOI '${requestedDoi}'`);
      pmid = text((await search.json())?.esearchresult?.idlist?.[0]);
      if (!pmid) return failure(provider, retrievedAt, "not_found", `DOI '${requestedDoi}' was not found by ${provider.name}.`, searchUrl);
    }
    const rawUrl = pubMedUrl("esummary", { id: pmid! }, options), response = await fetch(rawUrl);
    if (!response.ok) return httpFailure(provider, retrievedAt, rawUrl, response, `PMID '${pmid}'`);
    const item = (await response.json())?.result?.[pmid!];
    if (!item || item.error) return failure(provider, retrievedAt, "not_found", `PMID '${pmid}' was not found by ${provider.name}.`, rawUrl);
    const ids: any[] = Array.isArray(item.articleids) ? item.articleids : [], doi = normalizeDoi(ids.find((id) => id.idtype === "doi")?.value || "") || requestedDoi, pmcid = text(ids.find((id) => id.idtype === "pmc")?.value);
    const fields = { doi, pmid, pmcid, title: text(item.title), authors: strings((item.authors || []).map((a: any) => a.name)), year: year(text(item.pubdate)?.match(/\b\d{4}\b/)?.[0]),
      journalOrVenue: text(item.fulljournalname ?? item.source), volume: text(item.volume), issue: text(item.issue), pages: text(item.pages) };
    return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId: pmid, identifiers: { doi, pmid, pmcid }, retrievedAt, rawUrl, ...fields,
      fieldProvenance: provenance(fields, provider, retrievedAt, rawUrl) };
  } catch (error: any) { return failure(provider, retrievedAt, "network_error", `Network failure connecting to PubMed: ${error?.message || error}`); }
}

export const PROVIDER_REGISTRY = [
  { ...P.crossref, isAvailable: true, requiresApiKey: false, fetchByDoi: fetchCrossrefMetadata },
  { ...P.openalex, isAvailable: true, requiresApiKey: false, fetchByDoi: fetchOpenAlexMetadata },
  { ...P.datacite, isAvailable: true, requiresApiKey: false, fetchByDoi: fetchDataCiteMetadata },
  { ...P.europepmc, isAvailable: true, requiresApiKey: false, fetchByDoi: fetchEuropePmcMetadata },
  { ...P.pubmed, isAvailable: true, requiresApiKey: false, defaultRequestsPerSecond: 3, apiKeyRequestsPerSecond: 10, fetchByDoi: (doi: string) => fetchPubMedMetadata(doi) },
];

export async function lookupDoiMetadata(rawDoi: string, options: DoiLookupOptions = {}): Promise<MetadataProviderResult> {
  const doi = normalizeDoi(rawDoi), router = { id: "router" as const, name: "Authoritative Registry Router" };
  if (!doi) return failure(router, new Date().toISOString(), "invalid_request", `Invalid or unrecognized DOI format: '${rawDoi}'.`);
  const calls = [() => fetchCrossrefMetadata(doi), () => fetchOpenAlexMetadata(doi), () => fetchDataCiteMetadata(doi), () => fetchEuropePmcMetadata(doi), () => fetchPubMedMetadata(doi, options.pubMed)];
  const failures: MetadataProviderResult[] = [];
  for (const call of calls) { const result = await call(); if (result.success) return result; failures.push(result); }
  const allNotFound = failures.every((result) => result.errorKind === "not_found");
  return failure(router, new Date().toISOString(), allNotFound ? "not_found" : "provider_error", allNotFound ? `DOI '${doi}' was not found across authoritative registries.` : `DOI '${doi}' could not be resolved because no provider returned a record.`);
}

export async function searchMissingCitationCandidates(options: CandidateSearchOptions): Promise<MetadataProviderResult[]> {
  const query = options.query?.trim() || options.author?.trim() || ""; if (!query) return [];
  const provider = P.crossref, searchUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${options.limit || 5}`;
  try {
    const response = await fetch(searchUrl, { headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" } }); if (!response.ok) return [];
    return ((await response.json())?.message?.items || []).map((item: any) => {
      const retrievedAt = new Date().toISOString(), doi = normalizeDoi(item.DOI || "") || undefined, rawUrl = doi ? `https://api.crossref.org/works/${encodeURIComponent(doi)}` : searchUrl;
      const fields = { doi, title: text(item.title?.[0]), authors: strings((item.author || []).map((a: any) => [text(a.family), text(a.given)].filter(Boolean).join(", "))),
        year: year(item.published?.["date-parts"]?.[0]?.[0] ?? item.created?.["date-parts"]?.[0]?.[0]), journalOrVenue: text(item["container-title"]?.[0]), publisher: text(item.publisher) };
      return { success: true, providerId: provider.id, providerName: provider.name, providerRecordId: doi, identifiers: doi ? { doi } : undefined, retrievedAt, rawUrl, ...fields,
        fieldProvenance: provenance(fields, provider, retrievedAt, rawUrl) };
    });
  } catch { return []; }
}
