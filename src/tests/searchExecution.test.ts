import { describe, expect, it, vi } from "vitest";
import type { MetadataProviderResult } from "../lib/metadataProviders";
import type { SearchProvider } from "../types";
import {
  compileProviderSyntax,
  createSearchExecution,
  DEFAULT_SEARCH_ADAPTERS,
  executeSearchExecution,
  type SearchProviderAdapters,
} from "../lib/searchExecution";
import { validateSearchExecutionRequest } from "../server/apiSchemas";

const providers: SearchProvider[] = ["Crossref", "OpenAlex", "PubMed", "Europe PMC", "arXiv", "DOAJ"];
const providerIds = { Crossref: "crossref", OpenAlex: "openalex", PubMed: "pubmed_ncbi", "Europe PMC": "europepmc", arXiv: "arxiv", DOAJ: "doaj" } as const;
const designInput = {
  searchId: "search-reproducible-1",
  projectId: "project-1",
  context: "Find intervention evidence for review",
  concepts: [{ concept: "warm-up", synonyms: ["stretching", "pre-exercise"] }, { concept: "runner", synonyms: ["athlete"] }],
  providers,
  filters: { dateFrom: "2020-01-01", dateTo: "2025-12-31", languages: ["English"], maxResultsPerProvider: 5 },
};

function result(provider: SearchProvider): MetadataProviderResult {
  const id = providerIds[provider];
  return { success: true, providerId: id, providerName: provider, providerRecordId: `${id}-record`, identifiers: { doi: `10.1234/${id}` }, doi: `10.1234/${id}`, title: `${provider} observed title`, authors: ["Author, A."], year: 2024, journalOrVenue: "Observed venue", retrievedAt: "2026-01-01T00:00:00.000Z", rawUrl: `https://provider.example/${id}` };
}

describe("reproducible multi-provider SearchExecution", () => {
  it("creates a reproducible design with provider-specific exact syntax", () => {
    const first = createSearchExecution(designInput, "2026-01-01T00:00:00.000Z");
    const second = createSearchExecution(designInput, "2026-01-01T00:00:00.000Z");
    expect(second).toEqual(first);
    expect(first).toMatchObject({ searchId: "search-reproducible-1", projectId: "project-1", context: designInput.context, providers, status: "Selected", returnedSourceIds: [], counts: { total: 0 } });
    expect(first.providerSyntax.Crossref).toContain("query.bibliographic=");
    expect(first.providerSyntax.OpenAlex).toContain("search=");
    expect(first.providerSyntax.PubMed).toContain("[Date - Publication]");
    expect(first.providerSyntax["Europe PMC"]).toContain("TITLE_ABS:");
    expect(first.providerSyntax.arXiv).toContain("all:");
    expect(first.providerSyntax.DOAJ).toContain("bibjson.title:");
    expect(new Set(Object.values(first.providerSyntax)).size).toBe(6);
  });

  it("executes every selected provider separately and preserves attribution", async () => {
    const calls: SearchProvider[] = [];
    const adapters = Object.fromEntries(providers.map((provider) => [provider, vi.fn(async () => {
      calls.push(provider); return { results: [result(provider)] };
    })])) as SearchProviderAdapters;
    const execution = await executeSearchExecution(createSearchExecution(designInput, "2026-01-01T00:00:00.000Z"), adapters, () => "2026-01-01T00:01:00.000Z");
    expect(calls).toEqual(expect.arrayContaining(providers));
    expect(calls).toHaveLength(6);
    expect(execution.status).toBe("Review");
    expect(execution.counts.total).toBe(6);
    expect(execution.providerExecutions).toHaveLength(6);
    expect(execution.providerExecutions.every((item) => item.count === 1 && item.status === "Completed")).toBe(true);
    expect(execution.results.map((source) => source.provider)).toEqual(providers);
    expect(execution.results.find((source) => source.provider === "OpenAlex")?.providerId).toBe("openalex");
    expect(execution.providerExecutions.find((item) => item.provider === "OpenAlex")?.syntax).toBe(execution.providerSyntax.OpenAlex);
    expect(execution.returnedSourceIds).toEqual(execution.results.map((source) => source.sourceId));
  });

  it("never labels a Crossref-only call as multi-provider", async () => {
    const crossref = vi.fn(async () => ({ results: [result("Crossref")] }));
    const input = { ...designInput, providers: ["Crossref" as const] };
    const execution = await executeSearchExecution(createSearchExecution(input), { Crossref: crossref });
    expect(crossref).toHaveBeenCalledOnce();
    expect(execution.providers).toEqual(["Crossref"]);
    expect(execution.providerExecutions.map((item) => item.provider)).toEqual(["Crossref"]);
    expect(execution.results.map((item) => item.provider)).toEqual(["Crossref"]);
  });

  it("preserves provider-specific warnings and errors without blocking other providers", async () => {
    const execution = await executeSearchExecution(createSearchExecution({ ...designInput, providers: ["Crossref", "OpenAlex"] }), {
      Crossref: async () => ({ results: [result("Crossref")] }),
      OpenAlex: async () => ({ results: [], error: { kind: "rate_limited", message: "OpenAlex rate limited.", statusCode: 429, retryAfterSeconds: 8 } }),
    });
    expect(execution.counts).toEqual({ total: 1, byProvider: { Crossref: 1, OpenAlex: 0 } });
    expect(execution.providerExecutions.find((item) => item.provider === "OpenAlex")).toMatchObject({ status: "Rate Limited", count: 0, warnings: ["Retry after 8 seconds."], errors: ["OpenAlex rate limited."] });
    expect(execution.errors).toContain("OpenAlex rate limited.");
  });

  it("truthfully marks a selected provider without an adapter as not configured", async () => {
    const execution = await executeSearchExecution(createSearchExecution({ ...designInput, providers: ["DOAJ"] }), {});
    expect(execution.providerExecutions[0]).toMatchObject({ provider: "DOAJ", status: "Not Configured", count: 0 });
    expect(execution.results).toEqual([]);
  });

  it("ships a distinct executable adapter for every supported provider", () => {
    expect(Object.keys(DEFAULT_SEARCH_ADAPTERS).sort()).toEqual([...providers].sort());
    expect(providers.every((provider) => typeof DEFAULT_SEARCH_ADAPTERS[provider] === "function")).toBe(true);
  });

  it("validates bounded authenticated project-scoped execution requests", () => {
    expect(validateSearchExecutionRequest(designInput, "project-1")).toMatchObject({ valid: true });
    expect(validateSearchExecutionRequest(designInput, "different-project")).toMatchObject({ valid: false, errors: [expect.stringContaining("authenticated project scope")] });
    expect(validateSearchExecutionRequest({ ...designInput, providers: ["Crossref", "Crossref"] }, "project-1")).toMatchObject({ valid: false });
    expect(validateSearchExecutionRequest({ ...designInput, filters: { maxResultsPerProvider: 101 } }, "project-1")).toMatchObject({ valid: false });
  });

  it("compiles missing concepts to an explicit empty syntax", () => {
    expect(compileProviderSyntax([], "Crossref")).toBe("");
  });
});
