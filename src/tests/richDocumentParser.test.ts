import { describe, expect, it, vi } from "vitest";
import { routeDocumentIngestion } from "../lib/documentIngestionRouter";
import { createDoclingCompatibleProvider, createRichDocumentParserAdapters, createRichDocumentParserAdaptersFromEnvironment } from "../lib/richDocumentParser";

const fixedTimes = () => {
  let tick = 0;
  return () => `2026-09-04T01:00:0${tick++}.000Z`;
};
const input = (filename = "observed.pdf") => ({
  projectId: "project-1", artifactId: "artifact-1", filename, mimeType: "application/pdf",
  content: new Uint8Array([37, 80, 68, 70]), createdByUid: "researcher-1",
});

describe("Docling-compatible rich-document parser adapter", () => {
  it("reports Not Configured and never Parsed when the service URL is absent", async () => {
    const provider = createDoclingCompatibleProvider({ serviceUrl: undefined });
    expect(provider.configured).toBe(false);
    const direct = await provider.parse(input());
    expect(direct.status).toBe("Requires Review");
    expect(direct.warnings.join(" ")).toContain("DOCUMENT_PARSER_SERVICE_URL Not Configured");
    expect(direct.blocks).toEqual([]);

    const job = await routeDocumentIngestion(input(), createRichDocumentParserAdaptersFromEnvironment({}), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.status).not.toBe("Parsed");
    expect(job.extractedBlocks).toEqual([]);
  });

  it.each(["observed.pdf", "observed.docx", "observed.pptx"])("parses mocked %s service output through the ingestion router", async (filename) => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body));
      expect(request).toMatchObject({ projectId: "project-1", artifactId: "artifact-1", filename });
      expect(request.contentBase64).toBe("JVBERg==");
      return new Response(JSON.stringify({
        parser: { id: "docling-cloud-run", version: "2.4.0" }, requiresReview: false, warnings: [],
        blocks: [
          { id: "text-1", type: "text", text: "Observed paragraph", pageNumber: 2, section: "Methods" },
          { id: "table-1", type: "table", rows: [{ observed: "value" }], pageNumber: 3, section: "Results", tableReference: "Table 1" },
          { id: "image-1", type: "image", pageNumber: 4, imageReference: "Figure 2" },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    const job = await routeDocumentIngestion({ ...input(filename), mimeType: undefined }, createRichDocumentParserAdapters({ serviceUrl: "https://parser.internal", fetchImpl }), fixedTimes());
    expect(job.status).toBe("Parsed");
    expect(job.parserProvenance).toMatchObject({ parserId: "docling-cloud-run", parserVersion: "2.4.0", deterministic: false });
    expect(job.extractedBlocks).toEqual([
      expect.objectContaining({ blockId: "text-1", blockType: "Text", pageNumber: 2, section: "Methods", sourceLocation: "page:2;section:Methods" }),
      expect.objectContaining({ blockId: "table-1", blockType: "Table", pageNumber: 3, section: "Results", tableReference: "Table 1", sourceLocation: "page:3;section:Results;table:Table 1" }),
      expect.objectContaining({ blockId: "image-1", blockType: "Image", pageNumber: 4, imageReference: "Figure 2", sourceLocation: "page:4;image:Figure 2" }),
    ]);
    expect(fetchImpl).toHaveBeenCalledWith("https://parser.internal/parse", expect.objectContaining({ method: "POST" }));
  });

  it("preserves provider warnings and Requires Review", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      parser: { id: "docling-self-hosted", version: "1.0.0" }, requiresReview: true,
      warnings: ["Table reading order is uncertain."], blocks: [{ id: "table-1", type: "table", tableReference: "Table A", pageNumber: 1 }],
    }), { status: 200 })) as typeof fetch;
    const job = await routeDocumentIngestion(input(), createRichDocumentParserAdapters({ serviceUrl: "http://docling:8080/", fetchImpl }), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.warnings).toEqual(["Table reading order is uncertain."]);
    expect(job.extractedBlocks[0].tableReference).toBe("Table A");
  });

  it("fails closed on malformed or provenance-free service output", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ requiresReview: false, warnings: [], blocks: [] }), { status: 200 })) as typeof fetch;
    const job = await routeDocumentIngestion(input(), createRichDocumentParserAdapters({ serviceUrl: "https://parser.internal", fetchImpl }), fixedTimes());
    expect(job.status).toBe("Failed");
    expect(job.errors[0]).toContain("parser provenance");
    expect(job.extractedBlocks).toEqual([]);
  });

  it("fails closed when a configured service returns no blocks despite a Parsed claim", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      parser: { id: "docling-cloud-run", version: "2.4.0" }, requiresReview: false, warnings: [], blocks: [],
    }), { status: 200 })) as typeof fetch;
    const job = await routeDocumentIngestion(input(), createRichDocumentParserAdapters({ serviceUrl: "https://parser.internal", fetchImpl }), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.warnings[0]).toContain("no extractable blocks");
  });
});
