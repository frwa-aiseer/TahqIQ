import { describe, expect, it } from "vitest";
import { deduplicateSources, upsertDeduplicatedSource } from "../lib/sourceDeduplication";
import type { SourceRecord } from "../types";

function source(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: "source-a",
    title: "Exact Observed Study Title",
    authors: ["Doe, Jane", "Smith, Alex"],
    year: 2024,
    journalOrVenue: "Observed Journal",
    documentType: "Journal Article",
    peerReviewStatus: "Unknown",
    verificationState: "Unverified",
    relevanceScore: 5,
    tags: [],
    stateHistory: [],
    metadataProvider: "Crossref",
    provenance: {
      providerId: "crossref",
      provider: "Crossref",
      retrievedAt: "2026-01-01T00:00:00.000Z",
      fieldProvenance: { title: { providerId: "crossref", provider: "Crossref", timestamp: "2026-01-01T00:00:00.000Z" } },
    },
    ...overrides,
  };
}

describe("deterministic source deduplication", () => {
  it("merges canonical DOI variants before bibliographic matching", () => {
    const result = deduplicateSources([
      source({ id: "a", doi: "https://doi.org/10.1234/ABC" }),
      source({ id: "b", doi: "doi:10.1234/ABC", metadataProvider: "OpenAlex" }),
    ]);
    expect(result.sources).toHaveLength(1);
    expect(result.duplicateGroups[0]).toMatchObject({ canonicalSourceId: "a", aliasSourceIds: ["a", "b"], matchReasons: ["doi:10.1234/abc"] });
    expect(result.sources[0].providerAliases?.map((alias) => alias.sourceId)).toEqual(["a", "b"]);
  });

  it("uses PMID and PMCID as stable identifiers", () => {
    expect(deduplicateSources([source({ id: "a", pmid: "12345" }), source({ id: "b", pmid: "12345", title: "Conflicting title" })]).sources).toHaveLength(1);
    expect(deduplicateSources([source({ id: "a", pmcid: "pmc987" }), source({ id: "b", pmcid: "PMC987", title: "Conflicting title" })]).sources).toHaveLength(1);
  });

  it("uses arXiv and other stable identifiers", () => {
    expect(deduplicateSources([source({ id: "a", arxivId: "2401.12345v2" }), source({ id: "b", url: "https://arxiv.org/abs/2401.12345v2", title: "Other title" })]).sources).toHaveLength(1);
    expect(deduplicateSources([
      source({ id: "a", otherStableIds: [{ scheme: "ERIC", value: "EJ-123" }] }),
      source({ id: "b", otherStableIds: [{ scheme: "eric", value: "ej 123" }], title: "Other title" }),
    ]).sources).toHaveLength(1);
  });

  it("records conflicting identifiers and metadata without silently erasing values", () => {
    const result = deduplicateSources([
      source({ id: "verified", pmid: "123", doi: "10.1234/one", title: "Verified title", verificationState: "Verified" }),
      source({ id: "alias", pmid: "123", doi: "10.1234/two", title: "Provider title", metadataProvider: "PubMed", provenance: { providerId: "pubmed_ncbi", provider: "PubMed", retrievedAt: "2026-01-02", fieldProvenance: { title: { providerId: "pubmed_ncbi", provider: "PubMed", timestamp: "2026-01-02" } } } }),
    ]);
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]).toMatchObject({ id: "verified", canonicalSourceId: "verified", title: "Verified title", doi: "10.1234/one", preferredFieldSources: { title: "verified", doi: "verified" } });
    expect(result.sources[0].fieldConflicts?.map((conflict) => conflict.field)).toEqual(expect.arrayContaining(["title", "doi"]));
    expect(result.sources[0].fieldConflicts?.find((conflict) => conflict.field === "doi")?.values.map((item) => item.value)).toEqual(expect.arrayContaining(["10.1234/one", "10.1234/two"]));
  });

  it("preserves field-level provenance from the preferred source", () => {
    const preferred = source({ id: "preferred", doi: "10.1234/same", verificationState: "Verified" });
    const result = deduplicateSources([preferred, source({ id: "other", doi: "10.1234/same", title: "Conflicting provider title", metadataProvider: "OpenAlex" })]);
    expect(result.sources[0].provenance?.fieldProvenance?.title).toEqual(preferred.provenance?.fieldProvenance?.title);
    expect(result.sources[0].preferredFieldSources?.title).toBe("preferred");
  });

  it("uses conservative exact title, year, and first-author matching when IDs are absent", () => {
    const result = deduplicateSources([
      source({ id: "a", doi: undefined, title: "Café: A Study!", authors: ["Doe, Jane"], year: 2020 }),
      source({ id: "b", doi: undefined, title: "Cafe a study", authors: ["Doe Jane"], year: 2020 }),
    ]);
    expect(result.sources).toHaveLength(1);
    expect(result.duplicateGroups[0].matchReasons).toContain("bibliographic-exact:title+year+first-author");
  });

  it("never merges vague title similarity or a different year/author", () => {
    expect(deduplicateSources([
      source({ id: "a", doi: undefined, title: "Effects of exercise on health", authors: ["Doe, Jane"], year: 2020 }),
      source({ id: "b", doi: undefined, title: "Effects of exercise on health outcomes", authors: ["Doe, Jane"], year: 2020 }),
    ]).sources).toHaveLength(2);
    expect(deduplicateSources([
      source({ id: "a", doi: undefined, year: 2020 }),
      source({ id: "b", doi: undefined, year: 2021 }),
      source({ id: "c", doi: undefined, authors: ["Different, Author"], year: 2020 }),
    ]).sources).toHaveLength(3);
  });

  it("does not bibliographically merge conflicting stable IDs", () => {
    const result = deduplicateSources([source({ id: "a", doi: "10.1234/one" }), source({ id: "b", doi: "10.1234/two" })]);
    expect(result.sources).toHaveLength(2);
    expect(result.duplicateGroups).toEqual([]);
  });

  it("is deterministic regardless of input order", () => {
    const records = [source({ id: "z", doi: "10.1234/same", publisher: "Publisher" }), source({ id: "a", doi: "10.1234/same" })];
    expect(deduplicateSources(records)).toEqual(deduplicateSources([...records].reverse()));
  });

  it("preserves an existing canonical ID when a duplicate is imported later", () => {
    const result = upsertDeduplicatedSource([source({ id: "existing", doi: "10.1234/same" })], source({ id: "new-rich", doi: "10.1234/same", abstract: "Returned abstract", publisher: "Returned publisher" }));
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].id).toBe("existing");
    expect(result.sources[0].canonicalSourceId).toBe("existing");
    expect(result.sources[0].abstract).toBe("Returned abstract");
  });
});
