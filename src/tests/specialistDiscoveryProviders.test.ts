import { afterEach, describe, expect, it, vi } from "vitest";
import {
  discoverUnpaywallAccess,
  fetchArxivMetadata,
  fetchDoajMetadata,
  normalizeArxivId,
  searchArxivMetadata,
  searchDoajMetadata,
  SPECIALIST_PROVIDER_REGISTRY,
} from "../lib/specialistDiscoveryProviders";

const jsonResponse = (status: number, body: unknown = {}, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;
const xmlResponse = (status: number, body: string, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  text: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

afterEach(() => vi.restoreAllMocks());

describe("lawful OA and specialist discovery adapters", () => {
  it("declares capabilities, identifiers, configuration, rate handling and link-only policy", () => {
    expect(SPECIALIST_PROVIDER_REGISTRY.map((provider) => provider.id)).toEqual(["unpaywall", "arxiv", "doaj"]);
    expect(SPECIALIST_PROVIDER_REGISTRY.every((provider) => provider.fullTextPolicy === "provider_supplied_links_only")).toBe(true);
    expect(SPECIALIST_PROVIDER_REGISTRY.find((provider) => provider.id === "unpaywall")).toMatchObject({ requiredConfig: ["email"], identifiers: ["DOI"] });
    expect(SPECIALIST_PROVIDER_REGISTRY.find((provider) => provider.id === "arxiv")?.rateHandling).toMatchObject({ minimumIntervalMs: 3000 });
  });

  it("returns truthful not-configured state for Unpaywall without contacting the provider", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect(await discoverUnpaywallAccess("10.1234/test")).toMatchObject({ success: false, providerId: "unpaywall", errorKind: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves provider-supplied Unpaywall OA links and provenance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {
      doi: "10.1234/test", title: "Observed title", year: 2023, is_oa: true,
      best_oa_location: { url: "https://repository.example/item", url_for_pdf: "https://repository.example/file.pdf", license: "cc-by", evidence: "oa repository" },
    })));
    const result = await discoverUnpaywallAccess("10.1234/test", { email: "contact@example.org" });
    expect(result).toMatchObject({ success: true, providerId: "unpaywall", identifiers: { doi: "10.1234/test" }, openAccess: { status: "open", accessUrl: "https://repository.example/item", pdfUrl: "https://repository.example/file.pdf", license: "cc-by" } });
    expect(result.retrievedAt).toBe(result.fieldProvenance?.openAccess.timestamp);
    expect(result.fieldProvenance?.openAccess.providerId).toBe("unpaywall");
  });

  it("does not synthesize an Unpaywall access URL when none is returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { doi: "10.1234/test", is_oa: false })));
    const result = await discoverUnpaywallAccess("10.1234/test", { email: "contact@example.org" });
    expect(result.openAccess).toEqual({ status: "closed" });
    expect(result.title).toBeUndefined();
  });

  it("normalizes modern, legacy and versioned arXiv IDs", () => {
    expect(normalizeArxivId("arXiv:2401.12345v2")).toBe("2401.12345v2");
    expect(normalizeArxivId("https://arxiv.org/abs/hep-ex/0307015")).toBe("hep-ex/0307015");
    expect(normalizeArxivId("not-an-id")).toBe("");
  });

  it("parses arXiv Atom metadata and only provider-returned links", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse(200, `
      <feed xmlns:arxiv="http://arxiv.org/schemas/atom"><entry>
        <id>https://arxiv.org/abs/2401.12345v2</id><title>Measured result</title>
        <summary>Provider abstract</summary><published>2024-01-20T00:00:00Z</published>
        <author><name>A. Author</name></author><author><name>B. Author</name></author>
        <arxiv:doi>10.1234/test</arxiv:doi><category term="cs.AI"/>
        <link title="pdf" href="https://arxiv.org/pdf/2401.12345"/>
      </entry></feed>`)));
    const result = await fetchArxivMetadata("2401.12345v2");
    expect(result).toMatchObject({ success: true, providerId: "arxiv", providerRecordId: "2401.12345v2", identifiers: { doi: "10.1234/test", arxivId: "2401.12345v2" }, authors: ["A. Author", "B. Author"], year: 2024, categories: ["cs.AI"], openAccess: { accessUrl: "https://arxiv.org/abs/2401.12345v2", pdfUrl: "https://arxiv.org/pdf/2401.12345" } });
  });

  it("supports arXiv metadata search without creating an execution object", async () => {
    const fetchMock = vi.fn().mockResolvedValue(xmlResponse(200, "<feed></feed>")); vi.stubGlobal("fetch", fetchMock);
    expect(await searchArxivMetadata("causal inference", { limit: 5 })).toMatchObject([{ success: false, errorKind: "not_found" }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("max_results=5");
  });

  it("normalizes DOAJ article metadata and provider-supplied full-text link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { results: [{ id: "doaj-record-1", bibjson: {
      title: "Open article", year: "2022", identifier: [{ type: "doi", id: "10.1234/test" }], author: [{ name: "C. Author" }],
      journal: { title: "OA Journal", volume: "4", number: "2" }, link: [{ type: "fulltext", url: "https://journal.example/article" }], license: [{ type: "CC BY" }],
    } }] })));
    const result = await fetchDoajMetadata("10.1234/test");
    expect(result).toMatchObject({ success: true, providerId: "doaj", providerRecordId: "doaj-record-1", identifiers: { doi: "10.1234/test", doajId: "doaj-record-1" }, year: 2022, openAccess: { status: "open", accessUrl: "https://journal.example/article", license: "CC BY" } });
    expect(result.retrievedAt).toBe(result.fieldProvenance?.title.timestamp);
  });

  it("does not invent a DOAJ full-text URL when the record omits one", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { id: "doajrecord123", bibjson: { title: "Metadata only" } })));
    const result = await fetchDoajMetadata("doajrecord123");
    expect(result.openAccess).toEqual({ status: "open", accessUrl: undefined, license: undefined });
  });

  it("supports bounded DOAJ metadata search", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { results: [] })); vi.stubGlobal("fetch", fetchMock);
    expect(await searchDoajMetadata("open science", { limit: 500 })).toMatchObject([{ success: false, providerId: "doaj", errorKind: "not_found" }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("pageSize=100");
  });

  const failures = [
    ["Unpaywall", () => discoverUnpaywallAccess("10.1234/test", { email: "contact@example.org" })],
    ["arXiv", () => fetchArxivMetadata("2401.12345")],
    ["DOAJ", () => fetchDoajMetadata("10.1234/test")],
  ] as const;

  it.each(failures)("preserves %s not-found provenance", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404)));
    expect(await call()).toMatchObject({ success: false, errorKind: "not_found", statusCode: 404, retrievedAt: expect.any(String) });
  });

  it.each(failures)("preserves %s rate errors and retry guidance", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(429, {}, { "retry-after": "11" })));
    expect(await call()).toMatchObject({ success: false, errorKind: "rate_limited", statusCode: 429, retryAfterSeconds: 11 });
  });

  it.each(failures)("preserves %s provider errors", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(503)));
    expect(await call()).toMatchObject({ success: false, errorKind: "provider_error", statusCode: 503 });
  });

  it.each(failures)("preserves %s network errors", async (_name, call) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await call()).toMatchObject({ success: false, errorKind: "network_error", error: expect.stringContaining("offline") });
  });
});
