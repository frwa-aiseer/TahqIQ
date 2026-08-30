import { describe, expect, it, vi } from "vitest";
import { runLiteratureRetrievalAgent } from "../lib/literatureRetrievalAgent";
import { validateLiteratureRetrievalRequest } from "../server/apiSchemas";
import type { ApprovedSearchPlan, SearchProvider } from "../types";
import type { MetadataProviderResult } from "../lib/metadataProviders";

const plan: ApprovedSearchPlan = {
  planId: "approved-plan-1",
  projectId: "project-1",
  context: "Researcher-approved literature retrieval scope",
  concepts: [{ concept: "population", synonyms: ["group"] }],
  providerSyntax: { Crossref: 'query.bibliographic=("population" OR "group")', OpenAlex: 'search=("population" OR "group")' },
  providers: ["Crossref", "OpenAlex"],
  filters: { maxResultsPerProvider: 5 },
  approval: { researcherUid: "researcher-1", researcherEmail: "researcher@example.org", approvedAt: "2026-01-01T00:00:00.000Z", rationale: "Reviewed exact terms and providers." },
};

function providerRecord(provider: SearchProvider): MetadataProviderResult {
  const providerId = provider === "Crossref" ? "crossref" : "openalex";
  return { success: true, providerId, providerName: provider, providerRecordId: `${providerId}-record`, doi: `10.1234/${providerId}`, identifiers: { doi: `10.1234/${providerId}` }, title: `${provider} actual response`, authors: ["Returned, A."], year: 2024, journalOrVenue: "Returned venue", retrievedAt: "2026-01-02T00:00:00.000Z", rawUrl: `https://provider.example/${providerId}` };
}

describe("LiteratureRetrievalAgent controlled provider tools", () => {
  it("accepts only a bounded attributable approved plan in project scope", () => {
    expect(validateLiteratureRetrievalRequest({ plan }, "project-1")).toMatchObject({ valid: true });
    expect(validateLiteratureRetrievalRequest({ plan }, "other-project")).toMatchObject({ valid: false });
    expect(validateLiteratureRetrievalRequest({ plan: { ...plan, approval: undefined } }, "project-1")).toMatchObject({ valid: false });
    expect(validateLiteratureRetrievalRequest({ plan, prompt: "invent sources" }, "project-1")).toMatchObject({ valid: false });
  });

  it("calls only approved provider tools with exact approved syntax", async () => {
    const crossref = vi.fn(async () => ({ results: [providerRecord("Crossref")] }));
    const openAlex = vi.fn(async () => ({ results: [providerRecord("OpenAlex")] }));
    const doaj = vi.fn(async () => ({ results: [] }));
    const result = await runLiteratureRetrievalAgent("project-1", plan, { allowedTools: { Crossref: crossref, OpenAlex: openAlex, DOAJ: doaj }, now: () => "2026-01-03T00:00:00.000Z" });
    expect(crossref).toHaveBeenCalledWith(plan.providerSyntax.Crossref, plan.filters);
    expect(openAlex).toHaveBeenCalledWith(plan.providerSyntax.OpenAlex, plan.filters);
    expect(doaj).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "Completed", projectId: "project-1", planId: "approved-plan-1", createdSourceIds: [], records: [{ provider: "Crossref", title: "Crossref actual response" }, { provider: "OpenAlex", title: "OpenAlex actual response" }] });
    expect(result.searchExecution.providerExecutions.map((execution) => execution.provider)).toEqual(["Crossref", "OpenAlex"]);
  });

  it("preserves normalization and SearchExecution provenance", async () => {
    const result = await runLiteratureRetrievalAgent("project-1", { ...plan, providers: ["Crossref"], providerSyntax: { Crossref: plan.providerSyntax.Crossref } }, { allowedTools: { Crossref: async () => ({ results: [providerRecord("Crossref")] }) }, now: () => "2026-01-03T00:00:00.000Z" });
    expect(result.records[0]).toMatchObject({ providerId: "crossref", providerRecordId: "crossref-record", doi: "10.1234/crossref", retrievedAt: "2026-01-02T00:00:00.000Z", rawUrl: "https://provider.example/crossref" });
    expect(result.searchExecution).toMatchObject({ searchId: "retrieval-approved-plan-1", context: plan.context, concepts: plan.concepts, providerSyntax: { Crossref: plan.providerSyntax.Crossref }, returnedSourceIds: [result.records[0].sourceId] });
  });

  it("a total provider failure cannot generate or create a source", async () => {
    const failed = { results: [], error: { kind: "provider_error" as const, message: "Crossref HTTP 503", statusCode: 503 } };
    const result = await runLiteratureRetrievalAgent("project-1", { ...plan, providers: ["Crossref"], providerSyntax: { Crossref: plan.providerSyntax.Crossref } }, { allowedTools: { Crossref: async () => failed } });
    expect(result).toMatchObject({ status: "Failed", records: [], createdSourceIds: [], providerFailures: [{ provider: "Crossref", status: "Error", errors: ["Crossref HTTP 503"] }] });
    expect(result.searchExecution.results).toEqual([]);
    expect(result.searchExecution.returnedSourceIds).toEqual([]);
  });

  it("partial status returns only actual successful records and creates no sources", async () => {
    const result = await runLiteratureRetrievalAgent("project-1", plan, { allowedTools: {
      Crossref: async () => ({ results: [providerRecord("Crossref")] }),
      OpenAlex: async () => ({ results: [], error: { kind: "rate_limited", message: "OpenAlex rate limited", statusCode: 429, retryAfterSeconds: 12 } }),
    } });
    expect(result).toMatchObject({ status: "Partial", records: [{ provider: "Crossref" }], createdSourceIds: [], providerFailures: [{ provider: "OpenAlex", status: "Rate Limited" }] });
    expect(result.records.some((record) => record.provider === "OpenAlex")).toBe(false);
  });

  it("discards records returned alongside a failed provider response", async () => {
    const result = await runLiteratureRetrievalAgent("project-1", { ...plan, providers: ["Crossref"], providerSyntax: { Crossref: plan.providerSyntax.Crossref } }, { allowedTools: {
      Crossref: async () => ({ results: [providerRecord("Crossref")], error: { kind: "provider_error", message: "Malformed partial provider response", statusCode: 502 } }),
    } });
    expect(result).toMatchObject({ status: "Failed", records: [], createdSourceIds: [], normalizationWarnings: ["Discarded 1 record(s) returned alongside a provider failure."] });
  });

  it("rejects unapproved or incomplete plans before any tool call", async () => {
    const crossref = vi.fn(async () => ({ results: [providerRecord("Crossref")] }));
    const result = await runLiteratureRetrievalAgent("project-1", { ...plan, approval: { ...plan.approval, researcherUid: "" } }, { allowedTools: { Crossref: crossref } });
    expect(result).toMatchObject({ status: "Failed", records: [], createdSourceIds: [] });
    expect(crossref).not.toHaveBeenCalled();
  });
});
