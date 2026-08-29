import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCrossrefMetadata,
  fetchDataCiteMetadata,
  fetchEuropePmcMetadata,
  fetchOpenAlexMetadata,
  fetchPubMedMetadata,
  PROVIDER_REGISTRY,
} from "../lib/metadataProviders";

const response = (status: number, body: unknown = {}, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

afterEach(() => vi.restoreAllMocks());

describe("normalized bibliographic provider adapters", () => {
  it("normalizes Crossref success without fabricating missing fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(200, { message: { DOI: "10.1234/test", title: ["Observed title"], author: [{ family: "Doe", given: "Jane" }] } })));
    const result = await fetchCrossrefMetadata("10.1234/test");
    expect(result).toMatchObject({ success: true, providerId: "crossref", providerRecordId: "10.1234/test", identifiers: { doi: "10.1234/test" }, title: "Observed title", authors: ["Doe, Jane"] });
    expect(result.year).toBeUndefined();
    expect(result.journalOrVenue).toBeUndefined();
    expect(result.retrievedAt).toBe(result.fieldProvenance?.title.timestamp);
    expect(result.fieldProvenance?.title.providerId).toBe("crossref");
    expect(result.fieldProvenance?.year).toBeUndefined();
  });

  it("normalizes OpenAlex provider and DOI identifiers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(200, { id: "https://openalex.org/W1", doi: "https://doi.org/10.1234/test", title: "OA title", authorships: [{ author: { display_name: "A. Author" } }], publication_year: 2022 })));
    expect(await fetchOpenAlexMetadata("10.1234/test")).toMatchObject({ success: true, providerId: "openalex", providerRecordId: "https://openalex.org/W1", identifiers: { doi: "10.1234/test", openAlexId: "https://openalex.org/W1" }, year: 2022 });
  });

  it("normalizes DataCite provider identifiers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(200, { data: { id: "10.1234/test", attributes: { doi: "10.1234/test", titles: [{ title: "Dataset title" }], publicationYear: 2021 } } })));
    expect(await fetchDataCiteMetadata("10.1234/test")).toMatchObject({ success: true, providerId: "datacite", identifiers: { doi: "10.1234/test", dataCiteId: "10.1234/test" }, title: "Dataset title" });
  });

  it("preserves Europe PMC DOI, PMID, PMCID and provider ID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(200, { resultList: { result: [{ id: "MED/123", doi: "10.1234/test", pmid: "123", pmcid: "PMC456", title: "Article" }] } })));
    expect(await fetchEuropePmcMetadata("10.1234/test")).toMatchObject({ success: true, providerId: "europepmc", providerRecordId: "MED/123", doi: "10.1234/test", pmid: "123", pmcid: "PMC456", identifiers: { pmid: "123", pmcid: "PMC456" } });
  });

  it("uses PubMed without a key and preserves PMID/DOI/PMCID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, { result: { "123": { uid: "123", title: "PubMed title", pubdate: "2020 Jan", articleids: [{ idtype: "doi", value: "10.1234/test" }, { idtype: "pmc", value: "PMC9" }] } } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPubMedMetadata("123");
    expect(result).toMatchObject({ success: true, providerId: "pubmed_ncbi", providerRecordId: "123", pmid: "123", doi: "10.1234/test", pmcid: "PMC9", year: 2020 });
    expect(fetchMock.mock.calls[0][0]).not.toContain("api_key=");
  });

  it("adds an optional PubMed API key and resolves DOI through ESearch", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, { esearchresult: { idlist: ["321"] } }))
      .mockResolvedValueOnce(response(200, { result: { "321": { title: "Resolved" } } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPubMedMetadata("10.1234/test", { apiKey: "server-key" });
    expect(result).toMatchObject({ success: true, pmid: "321", doi: "10.1234/test" });
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes("api_key=server-key"))).toBe(true);
  });

  const adapters = [
    ["Crossref", () => fetchCrossrefMetadata("10.1234/test")],
    ["OpenAlex", () => fetchOpenAlexMetadata("10.1234/test")],
    ["DataCite", () => fetchDataCiteMetadata("10.1234/test")],
    ["Europe PMC", () => fetchEuropePmcMetadata("10.1234/test")],
    ["PubMed", () => fetchPubMedMetadata("123")],
  ] as const;

  it.each(adapters)("classifies %s not-found responses", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(404)));
    expect(await call()).toMatchObject({ success: false, errorKind: "not_found", statusCode: 404 });
  });

  it.each(adapters)("classifies %s rate-limit responses", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(429, {}, { "retry-after": "7" })));
    expect(await call()).toMatchObject({ success: false, errorKind: "rate_limited", statusCode: 429, retryAfterSeconds: 7 });
  });

  it.each(adapters)("classifies %s provider errors", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(503)));
    expect(await call()).toMatchObject({ success: false, errorKind: "provider_error", statusCode: 503 });
  });

  it.each(adapters)("classifies %s network errors", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await call()).toMatchObject({ success: false, errorKind: "network_error" });
  });

  it("registers PubMed as available without requiring a key", () => {
    expect(PROVIDER_REGISTRY.find((provider) => provider.id === "pubmed_ncbi")).toMatchObject({ isAvailable: true, requiresApiKey: false, defaultRequestsPerSecond: 3, apiKeyRequestsPerSecond: 10 });
  });
});
