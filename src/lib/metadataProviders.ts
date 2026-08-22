import { FieldProvenance, ProvenanceMetadata } from "../types";

export interface MetadataProviderResult {
  success: boolean;
  error?: string;
  doi?: string;
  title?: string;
  authors?: string[];
  year?: number;
  journalOrVenue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  abstract?: string;
  rawUrl?: string;
  providerName: string;
  disclaimer?: string;
  fieldProvenance?: Record<string, FieldProvenance>;
}

export interface CandidateSearchOptions {
  query?: string;
  author?: string;
  year?: number;
  limit?: number;
}

/**
 * Normalizes a DOI string to a canonical form (e.g., 10.1016/j.jbiomech.2023.102345).
 */
export function normalizeDoi(rawDoi: string): string {
  if (!rawDoi) return "";
  let clean = rawDoi.trim();
  clean = clean.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  clean = clean.replace(/^doi:\s*/i, "");
  clean = clean.replace(/^doi\//i, "");
  clean = clean.trim();

  // Validate DOI structure: must start with 10. and have prefix/suffix separated by /
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
  if (!doiRegex.test(clean)) {
    return "";
  }
  return clean;
}

/**
 * Mandatory disclaimer notice for Crossref bibliographic verification.
 */
export class CrossrefDisclaimer {
  static readonly MESSAGE =
    "Bibliographic Metadata Verified (Crossref Registry Only). This confirms official bibliographic registry records only; it does NOT verify peer-review status, full-text contents, claim support, or retraction clearance.";
}

/**
 * Helper to build field-level provenance records
 */
function createFieldProvenance(
  fields: Record<string, any>,
  providerName: string,
  rawUrl?: string
): Record<string, FieldProvenance> {
  const timestamp = new Date().toISOString();
  const prov: Record<string, FieldProvenance> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== "") {
      prov[key] = {
        provider: providerName,
        timestamp,
        rawRecordUrl: rawUrl,
      };
    }
  }
  return prov;
}

// 1. Crossref Provider
export async function fetchCrossrefMetadata(doi: string): Promise<MetadataProviderResult> {
  const cleanDoi = normalizeDoi(doi);
  if (!cleanDoi) {
    return {
      success: false,
      error: "Invalid or unrecognized DOI format.",
      providerName: "Crossref Official Registry",
    };
  }

  const rawUrl = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
  try {
    const res = await fetch(rawUrl, {
      headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `DOI '${cleanDoi}' not found in Crossref registry (HTTP ${res.status}).`,
        providerName: "Crossref Official Registry",
      };
    }

    const data = await res.json();
    const item = data.message;
    if (!item) {
      return {
        success: false,
        error: "Empty message payload returned from Crossref.",
        providerName: "Crossref Official Registry",
      };
    }

    const authors = (item.author || []).map(
      (a: any) => `${a.family || ""}, ${a.given || ""}`.trim() || "Unknown"
    );
    const title = (item.title || [])[0] || "Untitled Work";
    const year =
      item.created?.["date-parts"]?.[0]?.[0] ||
      item.published?.["date-parts"]?.[0]?.[0] ||
      new Date().getFullYear();
    const journal = (item["container-title"] || [])[0] || "Unspecified Venue";
    const publisher = item.publisher || "";
    const volume = item.volume || "";
    const issue = item.issue || "";
    const pages = item.page || "";

    const fieldProv = createFieldProvenance(
      { doi: cleanDoi, title, authors, year, journalOrVenue: journal, publisher, volume, issue, pages },
      "Crossref Official Registry",
      rawUrl
    );

    return {
      success: true,
      doi: cleanDoi,
      title,
      authors,
      year,
      journalOrVenue: journal,
      publisher,
      volume,
      issue,
      pages,
      rawUrl,
      providerName: "Crossref Official Registry",
      disclaimer: CrossrefDisclaimer.MESSAGE,
      fieldProvenance: fieldProv,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network failure connecting to Crossref API: ${err.message || err}`,
      providerName: "Crossref Official Registry",
    };
  }
}

// 2. OpenAlex Provider
export async function fetchOpenAlexMetadata(doi: string): Promise<MetadataProviderResult> {
  const cleanDoi = normalizeDoi(doi);
  if (!cleanDoi) {
    return {
      success: false,
      error: "Invalid or unrecognized DOI format.",
      providerName: "OpenAlex Open Catalog",
    };
  }

  const rawUrl = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) {
      return {
        success: false,
        error: `DOI '${cleanDoi}' not found in OpenAlex catalog.`,
        providerName: "OpenAlex Open Catalog",
      };
    }

    const item = await res.json();
    const authors = (item.authorships || []).map(
      (a: any) => a.author?.display_name || "Unknown Author"
    );
    const title = item.title || "Untitled Work";
    const year = item.publication_year || new Date().getFullYear();
    const journal = item.primary_location?.source?.display_name || "Unspecified Catalog Venue";
    const publisher = item.primary_location?.source?.publisher || "";

    const fieldProv = createFieldProvenance(
      { doi: cleanDoi, title, authors, year, journalOrVenue: journal, publisher },
      "OpenAlex Open Catalog",
      rawUrl
    );

    return {
      success: true,
      doi: cleanDoi,
      title,
      authors,
      year,
      journalOrVenue: journal,
      publisher,
      rawUrl,
      providerName: "OpenAlex Open Catalog",
      fieldProvenance: fieldProv,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to fetch OpenAlex metadata: ${err.message || err}`,
      providerName: "OpenAlex Open Catalog",
    };
  }
}

// 3. DataCite Provider
export async function fetchDataCiteMetadata(doi: string): Promise<MetadataProviderResult> {
  const cleanDoi = normalizeDoi(doi);
  if (!cleanDoi) {
    return {
      success: false,
      error: "Invalid DOI format.",
      providerName: "DataCite DOI Registry",
    };
  }

  const rawUrl = `https://api.datacite.org/dois/${encodeURIComponent(cleanDoi)}`;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) {
      return {
        success: false,
        error: `DOI '${cleanDoi}' not found in DataCite repository.`,
        providerName: "DataCite DOI Registry",
      };
    }

    const json = await res.json();
    const attr = json.data?.attributes;
    if (!attr) {
      return {
        success: false,
        error: "Invalid DataCite record attributes.",
        providerName: "DataCite DOI Registry",
      };
    }

    const title = attr.titles?.[0]?.title || "Untitled DataCite Dataset";
    const authors = (attr.creators || []).map((c: any) => c.name || `${c.familyName || ""}, ${c.givenName || ""}`.trim());
    const year = attr.publicationYear || new Date().getFullYear();
    const publisher = attr.publisher || "DataCite Repository";

    const fieldProv = createFieldProvenance(
      { doi: cleanDoi, title, authors, year, publisher },
      "DataCite DOI Registry",
      rawUrl
    );

    return {
      success: true,
      doi: cleanDoi,
      title,
      authors,
      year,
      journalOrVenue: publisher,
      publisher,
      rawUrl,
      providerName: "DataCite DOI Registry",
      fieldProvenance: fieldProv,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to fetch DataCite metadata: ${err.message || err}`,
      providerName: "DataCite DOI Registry",
    };
  }
}

// 4. Europe PMC Provider
export async function fetchEuropePmcMetadata(doi: string): Promise<MetadataProviderResult> {
  const cleanDoi = normalizeDoi(doi);
  if (!cleanDoi) {
    return {
      success: false,
      error: "Invalid DOI format.",
      providerName: "Europe PMC Open Archive",
    };
  }

  const rawUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(cleanDoi)}&format=json`;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) {
      return {
        success: false,
        error: `DOI '${cleanDoi}' search failed in Europe PMC.`,
        providerName: "Europe PMC Open Archive",
      };
    }

    const json = await res.json();
    const resultList = json.resultList?.result;
    if (!resultList || resultList.length === 0) {
      return {
        success: false,
        error: `DOI '${cleanDoi}' not found in Europe PMC archive.`,
        providerName: "Europe PMC Open Archive",
      };
    }

    const item = resultList[0];
    const title = item.title || "Untitled Article";
    const authors = (item.authorString || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const year = item.pubYear ? parseInt(item.pubYear, 10) : new Date().getFullYear();
    const journal = item.journalTitle || "Europe PMC Open Access";
    const volume = item.journalVolume || "";
    const issue = item.issue || "";
    const pages = item.pageInfo || "";
    const abstract = item.abstractText || "";

    const fieldProv = createFieldProvenance(
      { doi: cleanDoi, title, authors, year, journalOrVenue: journal, volume, issue, pages, abstract },
      "Europe PMC Open Archive",
      rawUrl
    );

    return {
      success: true,
      doi: cleanDoi,
      title,
      authors,
      year,
      journalOrVenue: journal,
      volume,
      issue,
      pages,
      abstract,
      rawUrl,
      providerName: "Europe PMC Open Archive",
      fieldProvenance: fieldProv,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to fetch Europe PMC metadata: ${err.message || err}`,
      providerName: "Europe PMC Open Archive",
    };
  }
}

// Provider Registry Metadata
export const PROVIDER_REGISTRY = [
  {
    id: "crossref",
    name: "Crossref Official Registry",
    isAvailable: true,
    requiresApiKey: false,
    fetchByDoi: fetchCrossrefMetadata,
  },
  {
    id: "openalex",
    name: "OpenAlex Open Catalog",
    isAvailable: true,
    requiresApiKey: false,
    fetchByDoi: fetchOpenAlexMetadata,
  },
  {
    id: "datacite",
    name: "DataCite DOI Registry",
    isAvailable: true,
    requiresApiKey: false,
    fetchByDoi: fetchDataCiteMetadata,
  },
  {
    id: "europepmc",
    name: "Europe PMC Open Archive",
    isAvailable: true,
    requiresApiKey: false,
    fetchByDoi: fetchEuropePmcMetadata,
  },
  {
    id: "pubmed_ncbi",
    name: "PubMed (NCBI E-Utilities Direct)",
    isAvailable: false,
    requiresApiKey: true,
    statusMessage: "Unconfigured: requires private API credentials. Routing open access metadata queries through Europe PMC provider.",
  },
];

/**
 * Universal DOI Metadata Lookup Router with provider fallback and strict DOI normalization.
 */
export async function lookupDoiMetadata(rawDoi: string): Promise<MetadataProviderResult> {
  const cleanDoi = normalizeDoi(rawDoi);
  if (!cleanDoi) {
    return {
      success: false,
      error: `Invalid or unrecognized DOI format: '${rawDoi}'. Must match canonical pattern (e.g., 10.xxxx/xxxx).`,
      providerName: "DOI Validation Engine",
    };
  }

  // Fallback cascade: Crossref -> OpenAlex -> DataCite -> Europe PMC
  const providers = [fetchCrossrefMetadata, fetchOpenAlexMetadata, fetchDataCiteMetadata, fetchEuropePmcMetadata];

  let lastError = "";
  for (const providerFn of providers) {
    const res = await providerFn(cleanDoi);
    if (res.success) {
      return res;
    } else {
      lastError = res.error || lastError;
    }
  }

  return {
    success: false,
    error: lastError || `DOI '${cleanDoi}' could not be resolved across authoritative registries.`,
    providerName: "Authoritative Registry Router",
  };
}

/**
 * Candidate search interface for missing citations.
 * Performs real candidate query against open APIs (e.g. Crossref / OpenAlex). Never fabricates sources!
 */
export async function searchMissingCitationCandidates(
  options: CandidateSearchOptions
): Promise<MetadataProviderResult[]> {
  const queryStr = options.query?.trim() || "";
  if (!queryStr && !options.author) {
    return [];
  }

  const crossrefSearchUrl = `https://api.crossref.org/works?query=${encodeURIComponent(queryStr)}&rows=${options.limit || 5}`;

  try {
    const res = await fetch(crossrefSearchUrl, {
      headers: { "User-Agent": "TehqIQ/1.0 (mailto:support@tehqiq.app)" },
    });

    if (!res.ok) return [];

    const json = await res.json();
    const items = json.message?.items || [];

    return items.map((item: any) => {
      const cleanDoi = normalizeDoi(item.DOI || "");
      const title = (item.title || [])[0] || "Untitled Result";
      const authors = (item.author || []).map(
        (a: any) => `${a.family || ""}, ${a.given || ""}`.trim() || "Unknown"
      );
      const year =
        item.created?.["date-parts"]?.[0]?.[0] ||
        item.published?.["date-parts"]?.[0]?.[0] ||
        new Date().getFullYear();
      const journal = (item["container-title"] || [])[0] || "Unspecified Venue";

      const fieldProv = createFieldProvenance(
        { doi: cleanDoi, title, authors, year, journalOrVenue: journal },
        "Crossref Candidate Search",
        `https://api.crossref.org/works/${cleanDoi}`
      );

      return {
        success: true,
        doi: cleanDoi,
        title,
        authors,
        year,
        journalOrVenue: journal,
        publisher: item.publisher || "",
        providerName: "Crossref Candidate Search",
        fieldProvenance: fieldProv,
      };
    });
  } catch {
    return [];
  }
}
