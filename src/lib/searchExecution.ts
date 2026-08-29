import type {
  FieldProvenance,
  SearchConcept,
  SearchExecution,
  SearchExecutionSource,
  SearchProvider,
  SearchProviderExecution,
  SearchStrategy,
} from "../types";
import type { MetadataProviderErrorKind, MetadataProviderResult } from "./metadataProviders";
import { normalizeDoi } from "./metadataProviders";

export interface SearchDesignInput {
  searchId?: string;
  projectId: string;
  context: string;
  concepts: SearchConcept[];
  providers: SearchProvider[];
  filters: SearchStrategy["filters"] & { maxResultsPerProvider?: number };
}

export interface ProviderSearchResponse {
  results: MetadataProviderResult[];
  error?: { kind: MetadataProviderErrorKind; message: string; statusCode?: number; retryAfterSeconds?: number };
}

export type SearchProviderAdapter = (syntax: string, filters: SearchDesignInput["filters"]) => Promise<ProviderSearchResponse>;
export type SearchProviderAdapters = Partial<Record<SearchProvider, SearchProviderAdapter>>;

const PROVIDERS: SearchProvider[] = ["Crossref", "OpenAlex", "PubMed", "Europe PMC", "arXiv", "DOAJ"];
const providerIds: Record<SearchProvider, string> = {
  Crossref: "crossref", OpenAlex: "openalex", PubMed: "pubmed_ncbi", "Europe PMC": "europepmc", arXiv: "arxiv", DOAJ: "doaj",
};
const providerNames: Record<SearchProvider, string> = {
  Crossref: "Crossref Official Registry", OpenAlex: "OpenAlex Open Catalog", PubMed: "PubMed (NCBI E-Utilities)", "Europe PMC": "Europe PMC Open Archive", arXiv: "arXiv Metadata API", DOAJ: "Directory of Open Access Journals",
};

const clean = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const list = (values: unknown[]): string[] | undefined => {
  const result = values.map(clean).filter((value): value is string => Boolean(value));
  return result.length ? result : undefined;
};
const year = (value: unknown): number | undefined => {
  const matched = String(value ?? "").match(/\b(\d{4})\b/)?.[1];
  return matched ? Number.parseInt(matched, 10) : undefined;
};
const limit = (filters: SearchDesignInput["filters"]) => Math.min(Math.max(filters.maxResultsPerProvider || 10, 1), 100);
const quoted = (value: string) => `"${value.replace(/["\\]/g, " ").replace(/\s+/g, " ").trim()}"`;

export function compileProviderSyntax(concepts: SearchConcept[], provider: SearchProvider, filters: SearchDesignInput["filters"] = {}): string {
  const groups = concepts
    .map(({ concept, synonyms }) => [concept, ...synonyms].map((term) => term.trim()).filter(Boolean))
    .filter((terms) => terms.length)
    .map((terms) => `(${terms.map(quoted).join(" OR ")})`);
  const base = groups.join(" AND ");
  if (!base) return "";
  if (provider === "PubMed") {
    const dates = filters.dateFrom || filters.dateTo
      ? ` AND (${filters.dateFrom || "1000/01/01"}[Date - Publication] : ${filters.dateTo || "3000/12/31"}[Date - Publication])`
      : "";
    const languages = filters.languages?.length ? ` AND (${filters.languages.map((language) => `${quoted(language)}[Language]`).join(" OR ")})` : "";
    return `${base}${dates}${languages}`;
  }
  if (provider === "Europe PMC") return groups.map((group) => `TITLE_ABS:${group}`).join(" AND ");
  if (provider === "arXiv") return groups.map((group) => `all:${group}`).join(" AND ");
  if (provider === "DOAJ") return `bibjson.title:${base}`;
  if (provider === "OpenAlex") return `search=${base}`;
  return `query.bibliographic=${base}`;
}

export function createSearchExecution(input: SearchDesignInput, now = new Date().toISOString()): SearchExecution {
  const context = input.context.trim();
  const concepts = input.concepts.map((item) => ({ concept: item.concept.trim(), synonyms: [...new Set(item.synonyms.map((term) => term.trim()).filter(Boolean))] })).filter((item) => item.concept);
  const providers = [...new Set(input.providers)].filter((provider): provider is SearchProvider => PROVIDERS.includes(provider));
  const searchId = input.searchId?.trim() || `search-${now.replace(/[^0-9]/g, "")}`;
  const providerSyntax = Object.fromEntries(providers.map((provider) => [provider, compileProviderSyntax(concepts, provider, input.filters)]));
  return { searchId, projectId: input.projectId, context, concepts, providerSyntax, providers, designedAt: now, filters: { ...input.filters, maxResultsPerProvider: limit(input.filters) }, status: providers.length ? "Selected" : "Design",
    returnedSourceIds: [], counts: { total: 0, byProvider: {} }, warnings: [], errors: [], providerExecutions: [], results: [] };
}

function stableSourceId(provider: SearchProvider, item: MetadataProviderResult, index: number) {
  const identity = item.providerRecordId || item.doi || item.pmid || item.identifiers?.arxivId || `${item.title || "missing"}-${index}`;
  let hash = 2166136261;
  for (const char of `${provider}:${identity}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `search-src-${providerIds[provider]}-${(hash >>> 0).toString(16)}`;
}
function sourceFromResult(provider: SearchProvider, item: MetadataProviderResult, index: number): SearchExecutionSource {
  return { sourceId: stableSourceId(provider, item, index), provider, providerId: item.providerId, providerRecordId: item.providerRecordId, doi: item.doi, pmid: item.pmid, pmcid: item.pmcid,
    arxivId: item.identifiers?.arxivId, title: item.title, authors: item.authors, year: item.year, journalOrVenue: item.journalOrVenue, publisher: item.publisher, retrievedAt: item.retrievedAt, rawUrl: item.rawUrl, fieldProvenance: item.fieldProvenance };
}
function providerStatus(error?: ProviderSearchResponse["error"]): SearchProviderExecution["status"] {
  if (!error) return "Completed";
  if (error.kind === "not_found") return "Not Found";
  if (error.kind === "rate_limited") return "Rate Limited";
  if (error.kind === "not_configured") return "Not Configured";
  return "Error";
}

export async function executeSearchExecution(design: SearchExecution, adapters: SearchProviderAdapters = DEFAULT_SEARCH_ADAPTERS, now: () => string = () => new Date().toISOString()): Promise<SearchExecution> {
  if (!design.projectId || !design.context || !design.concepts.length || !design.providers.length) {
    return { ...design, status: "Failed", errors: [...design.errors, "Search requires projectId, context, at least one concept, and at least one provider."] };
  }
  const outcomes = await Promise.all(design.providers.map(async (provider) => {
    const startedAt = now(), syntax = design.providerSyntax[provider] || "", adapter = adapters[provider];
    if (!adapter) {
      const completedAt = now();
      return { providerExecution: { provider, syntax, startedAt, completedAt, status: "Not Configured", returnedSourceIds: [], count: 0, warnings: [], errors: [`${provider} search adapter is not configured.`] } as SearchProviderExecution, sources: [] as SearchExecutionSource[] };
    }
    try {
      const response = await adapter(syntax, design.filters), completedAt = now();
      const successful = response.results.filter((item) => item.success), sources = successful.map((item, index) => sourceFromResult(provider, item, index));
      const warning = response.error?.kind === "rate_limited" && response.error.retryAfterSeconds !== undefined ? [`Retry after ${response.error.retryAfterSeconds} seconds.`] : [];
      return { providerExecution: { provider, syntax, startedAt, completedAt, status: providerStatus(response.error), returnedSourceIds: sources.map((source) => source.sourceId), count: sources.length,
        warnings: warning, errors: response.error ? [response.error.message] : [] } as SearchProviderExecution, sources };
    } catch (error: any) {
      const completedAt = now();
      return { providerExecution: { provider, syntax, startedAt, completedAt, status: "Error", returnedSourceIds: [], count: 0, warnings: [], errors: [`${provider} execution failed: ${error?.message || error}`] } as SearchProviderExecution, sources: [] as SearchExecutionSource[] };
    }
  }));
  const providerExecutions = outcomes.map((outcome) => outcome.providerExecution), results = outcomes.flatMap((outcome) => outcome.sources);
  const byProvider = Object.fromEntries(providerExecutions.map((result) => [result.provider, result.count]));
  const errors = providerExecutions.flatMap((result) => result.errors), warnings = providerExecutions.flatMap((result) => result.warnings);
  return { ...design, status: "Review", executedAt: now(), providerExecutions, results, returnedSourceIds: results.map((source) => source.sourceId), counts: { total: results.length, byProvider }, warnings, errors };
}

function provenance(fields: Record<string, unknown>, providerId: string, providerName: string, retrievedAt: string, rawUrl: string) {
  const result: Record<string, FieldProvenance> = {};
  for (const [field, value] of Object.entries(fields)) if ((Array.isArray(value) && value.length) || (!Array.isArray(value) && value !== undefined && value !== null && value !== "")) result[field] = { providerId, provider: providerName, timestamp: retrievedAt, rawRecordUrl: rawUrl };
  return result;
}
function okResult(provider: SearchProvider, item: any, rawUrl: string, retrievedAt: string): MetadataProviderResult {
  const providerId = providerIds[provider] as MetadataProviderResult["providerId"];
  let record: Omit<MetadataProviderResult, "success" | "providerId" | "providerName" | "retrievedAt">;
  if (provider === "Crossref") {
    const doi = normalizeDoi(item.DOI || "") || undefined;
    record = { providerRecordId: doi, identifiers: { doi }, doi, title: clean(item.title?.[0]), authors: list((item.author || []).map((author: any) => [author.family, author.given].filter(Boolean).join(", "))), year: year(item.published?.["date-parts"]?.[0]?.[0]), journalOrVenue: clean(item["container-title"]?.[0]), publisher: clean(item.publisher) };
  } else if (provider === "OpenAlex") {
    const doi = normalizeDoi(item.doi || "") || undefined, id = clean(item.id);
    record = { providerRecordId: id, identifiers: { doi, openAlexId: id }, doi, title: clean(item.title), authors: list((item.authorships || []).map((entry: any) => entry.author?.display_name)), year: typeof item.publication_year === "number" ? item.publication_year : undefined, journalOrVenue: clean(item.primary_location?.source?.display_name) };
  } else if (provider === "PubMed") {
    const pmid = clean(item.uid), ids = Array.isArray(item.articleids) ? item.articleids : [], doi = normalizeDoi(ids.find((id: any) => id.idtype === "doi")?.value || "") || undefined, pmcid = clean(ids.find((id: any) => id.idtype === "pmc")?.value);
    record = { providerRecordId: pmid, identifiers: { doi, pmid, pmcid }, doi, pmid, pmcid, title: clean(item.title), authors: list((item.authors || []).map((author: any) => author.name)), year: year(item.pubdate), journalOrVenue: clean(item.fulljournalname || item.source) };
  } else if (provider === "Europe PMC") {
    const doi = normalizeDoi(item.doi || "") || undefined, pmid = clean(item.pmid), pmcid = clean(item.pmcid), id = clean(item.id) || pmid || pmcid;
    record = { providerRecordId: id, identifiers: { doi, pmid, pmcid, europePmcId: id }, doi, pmid, pmcid, title: clean(item.title), authors: list(String(item.authorString || "").split(",")), year: year(item.pubYear), journalOrVenue: clean(item.journalTitle) };
  } else if (provider === "DOAJ") {
    const bib = item.bibjson || {}, ids = Array.isArray(bib.identifier) ? bib.identifier : [], doi = normalizeDoi(ids.find((id: any) => String(id.type).toLowerCase() === "doi")?.id || "") || undefined, id = clean(item.id);
    record = { providerRecordId: id, identifiers: { doi, doajId: id }, doi, title: clean(bib.title), authors: list((bib.author || []).map((author: any) => author.name)), year: typeof bib.year === "number" ? bib.year : year(bib.year), journalOrVenue: clean(bib.journal?.title) };
  } else {
    record = item;
  }
  const fields = { doi: record.doi, pmid: record.pmid, pmcid: record.pmcid, title: record.title, authors: record.authors, year: record.year, journalOrVenue: record.journalOrVenue, publisher: record.publisher };
  return { success: true, providerId, providerName: providerNames[provider], retrievedAt, rawUrl, ...record, fieldProvenance: provenance(fields, providerId, providerNames[provider], retrievedAt, rawUrl) };
}
async function jsonSearch(provider: SearchProvider, url: string, extract: (json: any) => any[]): Promise<ProviderSearchResponse> {
  const at = new Date().toISOString();
  try {
    const response = await fetch(url, { headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" } });
    if (!response.ok) {
      const kind: MetadataProviderErrorKind = response.status === 404 ? "not_found" : response.status === 429 ? "rate_limited" : "provider_error";
      const retry = response.status === 429 ? Number.parseInt(response.headers.get("retry-after") || "", 10) : NaN;
      return { results: [], error: { kind, message: `${provider} returned HTTP ${response.status}.`, statusCode: response.status, retryAfterSeconds: Number.isFinite(retry) ? retry : undefined } };
    }
    const items = extract(await response.json());
    return items.length ? { results: items.map((item) => okResult(provider, item, url, at)) } : { results: [], error: { kind: "not_found", message: `${provider} returned no records.` } };
  } catch (error: any) { return { results: [], error: { kind: "network_error", message: `${provider} search failed: ${error?.message || error}` } }; }
}
function dateFilter(filters: SearchDesignInput["filters"], style: "crossref" | "openalex") {
  const values: string[] = [];
  if (filters.dateFrom) values.push(`${style === "crossref" ? "from-pub-date" : "from_publication_date"}:${filters.dateFrom}`);
  if (filters.dateTo) values.push(`${style === "crossref" ? "until-pub-date" : "to_publication_date"}:${filters.dateTo}`);
  return values.join(",");
}
const crossrefAdapter: SearchProviderAdapter = async (syntax, filters) => {
  const query = syntax.replace(/^query\.bibliographic=/, ""), params = new URLSearchParams({ "query.bibliographic": query, rows: String(limit(filters)) }), date = dateFilter(filters, "crossref"); if (date) params.set("filter", date);
  return jsonSearch("Crossref", `https://api.crossref.org/works?${params}`, (json) => json?.message?.items || []);
};
const openAlexAdapter: SearchProviderAdapter = async (syntax, filters) => {
  const params = new URLSearchParams({ search: syntax.replace(/^search=/, ""), "per-page": String(limit(filters)) }), date = dateFilter(filters, "openalex"); if (date) params.set("filter", date);
  return jsonSearch("OpenAlex", `https://api.openalex.org/works?${params}`, (json) => json?.results || []);
};
const pubmedAdapter: SearchProviderAdapter = async (syntax, filters) => {
  const searchParams = new URLSearchParams({ db: "pubmed", retmode: "json", term: syntax, retmax: String(limit(filters)), tool: "tehqiq" });
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`, searched = await jsonSearch("PubMed", searchUrl, (json) => (json?.esearchresult?.idlist || []).map((uid: string) => ({ uid })));
  if (searched.error || !searched.results.length) return searched;
  const ids = searched.results.map((item) => item.providerRecordId).filter(Boolean).join(","), summaryParams = new URLSearchParams({ db: "pubmed", retmode: "json", id: ids, tool: "tehqiq" });
  return jsonSearch("PubMed", `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams}`, (json) => (json?.result?.uids || []).map((uid: string) => json.result[uid]).filter(Boolean));
};
const europePmcAdapter: SearchProviderAdapter = async (syntax, filters) => {
  let query = syntax; if (filters.dateFrom || filters.dateTo) query += ` AND FIRST_PDATE:[${filters.dateFrom || "1000-01-01"} TO ${filters.dateTo || "3000-12-31"}]`;
  const params = new URLSearchParams({ query, format: "json", pageSize: String(limit(filters)) });
  return jsonSearch("Europe PMC", `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`, (json) => json?.resultList?.result || []);
};
const doajAdapter: SearchProviderAdapter = async (syntax, filters) => jsonSearch("DOAJ", `https://doaj.org/api/search/articles/${encodeURIComponent(syntax)}?pageSize=${limit(filters)}`, (json) => json?.results || []);

function decodeXml(value: string) { return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&"); }
function xmlTag(xml: string, tag: string) { return clean(decodeXml(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "").replace(/\s+/g, " ")); }
const arxivAdapter: SearchProviderAdapter = async (syntax, filters) => {
  const params = new URLSearchParams({ search_query: syntax, start: "0", max_results: String(limit(filters)) }), url = `https://export.arxiv.org/api/query?${params}`, at = new Date().toISOString();
  try {
    const response = await fetch(url, { headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" } });
    if (!response.ok) return { results: [], error: { kind: response.status === 429 ? "rate_limited" : "provider_error", message: `arXiv returned HTTP ${response.status}.`, statusCode: response.status } };
    const entries = [...(await response.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => {
      const entry = match[1], recordUrl = xmlTag(entry, "id"), arxivId = recordUrl?.replace(/^https?:\/\/arxiv\.org\/abs\//, ""), doi = normalizeDoi(xmlTag(entry, "arxiv:doi") || "") || undefined;
      return { success: true, providerId: "arxiv", providerName: providerNames.arXiv, providerRecordId: arxivId, identifiers: { doi, arxivId }, doi, title: xmlTag(entry, "title"), authors: [...entry.matchAll(/<name>([\s\S]*?)<\/name>/gi)].map((author) => decodeXml(author[1].trim())), year: year(xmlTag(entry, "published")), abstract: xmlTag(entry, "summary"), retrievedAt: at, rawUrl: url } as MetadataProviderResult;
    });
    return entries.length ? { results: entries } : { results: [], error: { kind: "not_found", message: "arXiv returned no records." } };
  } catch (error: any) { return { results: [], error: { kind: "network_error", message: `arXiv search failed: ${error?.message || error}` } }; }
};

export const DEFAULT_SEARCH_ADAPTERS: SearchProviderAdapters = { Crossref: crossrefAdapter, OpenAlex: openAlexAdapter, PubMed: pubmedAdapter, "Europe PMC": europePmcAdapter, arXiv: arxivAdapter, DOAJ: doajAdapter };
