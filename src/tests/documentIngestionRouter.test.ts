import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { classifyDocumentFormat, routeDocumentIngestion } from "../lib/documentIngestionRouter";

const fixedTimes = () => {
  let tick = 0;
  return () => `2026-09-04T00:00:0${tick++}.000Z`;
};
const input = (filename: string, content: string | ArrayBuffer | Uint8Array = "observed content", mimeType = "") => ({
  projectId: "project-1", filename, mimeType, content, createdByUid: "researcher-1",
});

describe("unified document ingestion routing", () => {
  it.each([
    ["paper.pdf", "application/pdf", "PDF"], ["paper.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "DOCX"],
    ["slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "PPTX"],
    ["data.xls", "application/vnd.ms-excel", "Spreadsheet"], ["data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Spreadsheet"],
    ["data.csv", "text/csv", "Delimited Data"], ["data.tsv", "text/tab-separated-values", "Delimited Data"],
    ["data.json", "application/json", "JSON"], ["notes.txt", "text/plain", "Plain Text"],
    ["notes.md", "text/markdown", "Markdown"], ["paper.tex", "application/x-tex", "TeX"],
    ["figure.png", "image/png", "Image"], ["interview.mp3", "audio/mpeg", "Audio"], ["recording.mp4", "video/mp4", "Video"],
  ])("recognizes %s as %s", (filename, mimeType, category) => {
    expect(classifyDocumentFormat(filename, mimeType)).toBe(category);
  });

  it("uses MIME classification when a filename has no recognized extension", () => {
    expect(classifyDocumentFormat("upload", "image/jpeg")).toBe("Image");
    expect(classifyDocumentFormat("upload.bin", "application/pdf")).toBe("PDF");
  });

  it.each(["paper.pdf", "paper.docx", "slides.pptx", "figure.png", "interview.mp3", "recording.mp4"])(
    "queues recognized %s input truthfully when its later parser is not configured",
    async (filename) => {
      const job = await routeDocumentIngestion(input(filename), {}, fixedTimes());
      expect(job.status).toBe("Queued");
      expect(job.warnings.join(" ")).toContain("Not Configured");
      expect(job.extractedBlocks).toEqual([]);
      expect(job.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(job.statusHistory.map((event) => event.status)).toEqual(["Uploaded", "Queued"]);
    }
  );

  it.each([["notes.txt", "first paragraph\n\nsecond paragraph"], ["notes.md", "# Heading\n\nObserved text"], ["paper.tex", "\\section{Observed}"]])(
    "parses supported text input %s into provenance-preserving blocks",
    async (filename, content) => {
      const job = await routeDocumentIngestion(input(filename, content), {}, fixedTimes());
      expect(job.status).toBe("Parsed");
      expect(job.parserProvenance).toMatchObject({ parserVersion: "1.0.0", deterministic: true });
      expect(job.extractedBlocks.length).toBeGreaterThan(0);
      expect(job.extractedBlocks.every((block) => block.parserId === job.parserProvenance?.parserId)).toBe(true);
      expect(job.statusHistory.map((event) => event.status)).toEqual(["Uploaded", "Queued", "Processing", "Parsed"]);
    }
  );

  it.each([["data.csv", "value,group\n1,A\n2,B"], ["data.tsv", "value\tgroup\n1\tA\n2\tB"], ["data.json", '[{"value":1,"group":"A"}]']])(
    "connects %s to the existing dataset parser",
    async (filename, content) => {
      const job = await routeDocumentIngestion(input(filename, content), {}, fixedTimes());
      expect(job.status).toBe("Parsed");
      expect(job.dataset).toMatchObject({ filename, recordCount: expect.any(Number), fileHash: job.sha256 });
      expect(job.parserProvenance?.parserId).toBe("tehqiq-dataset-ingestion");
      expect(job.extractedBlocks[0]).toMatchObject({ blockType: "Table", parserId: "tehqiq-dataset-ingestion" });
    }
  );

  it.each(["data.xls", "data.xlsx"])("connects %s workbooks to the existing dataset parser", async (filename) => {
    const sheet = XLSX.utils.aoa_to_sheet([["value", "group"], [1, "A"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Observed");
    const bytes = XLSX.write(workbook, { type: "array", bookType: filename.endsWith(".xls") ? "xls" : "xlsx" }) as ArrayBuffer;
    const job = await routeDocumentIngestion(input(filename, bytes), {}, fixedTimes());
    expect(job.status).toBe("Parsed");
    expect(job.dataset?.recordCount).toBe(1);
    expect(job.dataset?.fileHash).toBe(job.sha256);
  });

  it("uses Requires Review for an empty supported document", async () => {
    const job = await routeDocumentIngestion(input("empty.txt", ""), {}, fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.warnings[0]).toContain("No extractable text");
  });

  it("uses Unsupported for unknown formats without pretending to parse them", async () => {
    const job = await routeDocumentIngestion(input("archive.xyz", "bytes", "application/octet-stream"), {}, fixedTimes());
    expect(job.status).toBe("Unsupported");
    expect(job.parserProvenance).toBeUndefined();
    expect(job.extractedBlocks).toEqual([]);
  });

  it("preserves configured adapter provenance, blocks, warnings and review status", async () => {
    const job = await routeDocumentIngestion(input("paper.pdf"), { PDF: async () => ({
      status: "Requires Review", warnings: ["Page order requires researcher review."],
      provenance: { parserId: "configured-pdf", parserVersion: "2.0.0", deterministic: false },
      blocks: [{ blockId: "page-1", blockType: "Text", text: "Observed text", sourceLocation: "page:1", parserId: "configured-pdf" }],
    }) }, fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.parserProvenance).toMatchObject({ parserId: "configured-pdf", parserVersion: "2.0.0" });
    expect(job.warnings).toEqual(["Page order requires researcher review."]);
    expect(job.extractedBlocks[0].sourceLocation).toBe("page:1");
  });

  it("uses Failed and preserves a truthful diagnostic when a configured parser throws", async () => {
    const job = await routeDocumentIngestion(input("paper.pdf"), { PDF: async () => { throw new Error("Configured parser unavailable."); } }, fixedTimes());
    expect(job.status).toBe("Failed");
    expect(job.errors).toEqual(["Configured parser unavailable."]);
    expect(job.statusHistory.at(-1)?.status).toBe("Failed");
  });
});
