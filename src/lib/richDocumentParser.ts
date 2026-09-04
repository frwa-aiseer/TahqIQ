import type { DocumentExtractedBlock, DocumentFormatCategory } from "../types";
import type {
  DocumentIngestionInput,
  DocumentParserAdapter,
  DocumentParserAdapters,
  DocumentParserResult,
} from "./documentIngestionRouter";

export interface RichDocumentParserProvider {
  providerId: string;
  configured: boolean;
  parse(input: DocumentIngestionInput): Promise<DocumentParserResult>;
}

export interface DoclingParserConfiguration {
  serviceUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

interface DoclingBlockResponse {
  id: string;
  type: "text" | "table" | "image";
  text?: string;
  rows?: Record<string, unknown>[];
  pageNumber?: number;
  section?: string;
  tableReference?: string;
  imageReference?: string;
}

interface DoclingResponse {
  parser: { id: string; version: string };
  blocks: DoclingBlockResponse[];
  warnings: string[];
  requiresReview: boolean;
}

const RICH_CATEGORIES = new Set<DocumentFormatCategory>(["PDF", "DOCX", "PPTX"]);

function normalizeServiceUrl(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function contentToBase64(content: DocumentIngestionInput["content"]): string {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content instanceof ArrayBuffer ? new Uint8Array(content) : content;
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateResponse(value: unknown): DoclingResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Document parser returned an invalid response object.");
  const candidate = value as Record<string, unknown>;
  const parser = candidate.parser as Record<string, unknown> | undefined;
  if (!parser || typeof parser.id !== "string" || !parser.id.trim() || typeof parser.version !== "string" || !parser.version.trim()) {
    throw new Error("Document parser response is missing parser provenance.");
  }
  if (!isStringArray(candidate.warnings) || typeof candidate.requiresReview !== "boolean" || !Array.isArray(candidate.blocks)) {
    throw new Error("Document parser response does not match the required structured schema.");
  }
  const blocks = candidate.blocks.map((raw, index): DoclingBlockResponse => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`Document parser block ${index + 1} is invalid.`);
    const block = raw as Record<string, unknown>;
    if (typeof block.id !== "string" || !block.id.trim() || !["text", "table", "image"].includes(String(block.type))) {
      throw new Error(`Document parser block ${index + 1} is missing a valid id or type.`);
    }
    if (block.pageNumber !== undefined && (!Number.isInteger(block.pageNumber) || Number(block.pageNumber) < 1)) throw new Error(`Document parser block ${index + 1} has an invalid page number.`);
    if (block.rows !== undefined && (!Array.isArray(block.rows) || block.rows.some((row) => !row || typeof row !== "object" || Array.isArray(row)))) throw new Error(`Document parser block ${index + 1} has invalid table rows.`);
    for (const field of ["text", "section", "tableReference", "imageReference"] as const) {
      if (block[field] !== undefined && typeof block[field] !== "string") throw new Error(`Document parser block ${index + 1} has an invalid ${field}.`);
    }
    return block as unknown as DoclingBlockResponse;
  });
  return { parser: { id: parser.id, version: parser.version }, blocks, warnings: candidate.warnings, requiresReview: candidate.requiresReview };
}

function normalizeBlock(block: DoclingBlockResponse, parserId: string): DocumentExtractedBlock {
  const sourceParts = [block.pageNumber ? `page:${block.pageNumber}` : undefined, block.section ? `section:${block.section}` : undefined, block.tableReference ? `table:${block.tableReference}` : undefined, block.imageReference ? `image:${block.imageReference}` : undefined].filter(Boolean);
  return {
    blockId: block.id,
    blockType: block.type === "text" ? "Text" : block.type === "table" ? "Table" : "Image",
    text: block.text,
    rows: block.rows,
    sourceLocation: sourceParts.join(";") || "Not available",
    parserId,
    pageNumber: block.pageNumber,
    section: block.section,
    tableReference: block.tableReference,
    imageReference: block.imageReference,
  };
}

export function createDoclingCompatibleProvider(configuration: DoclingParserConfiguration = {}): RichDocumentParserProvider {
  const serviceUrl = normalizeServiceUrl(configuration.serviceUrl);
  const fetchImpl = configuration.fetchImpl || globalThis.fetch;
  const timeoutMs = Math.min(Math.max(configuration.timeoutMs || 60_000, 1_000), 300_000);
  const maxResponseBytes = Math.min(Math.max(configuration.maxResponseBytes || 10 * 1024 * 1024, 1_024), 50 * 1024 * 1024);

  return {
    providerId: "docling-compatible",
    configured: Boolean(serviceUrl),
    async parse(input) {
      const category = input.filename.toLowerCase().endsWith(".pdf") ? "PDF" : input.filename.toLowerCase().endsWith(".docx") ? "DOCX" : input.filename.toLowerCase().endsWith(".pptx") ? "PPTX" : undefined;
      if (!category || !RICH_CATEGORIES.has(category)) throw new Error("Docling-compatible provider accepts only PDF, DOCX, or PPTX inputs.");
      if (!serviceUrl) return { status: "Requires Review", blocks: [], warnings: ["DOCUMENT_PARSER_SERVICE_URL Not Configured. Rich document was not parsed."], provenance: { parserId: "docling-compatible-not-configured", parserVersion: "Not available", deterministic: false } };
      if (!fetchImpl) throw new Error("Fetch is unavailable for the configured document parser service.");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${serviceUrl}/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ projectId: input.projectId, artifactId: input.artifactId, filename: input.filename, mimeType: input.mimeType || "application/octet-stream", format: category, contentBase64: contentToBase64(input.content) }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Document parser service returned HTTP ${response.status}.`);
        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > maxResponseBytes) throw new Error("Document parser response exceeds the configured size limit.");
        const rawText = await response.text();
        if (new TextEncoder().encode(rawText).byteLength > maxResponseBytes) throw new Error("Document parser response exceeds the configured size limit.");
        let raw: unknown;
        try { raw = JSON.parse(rawText); } catch { throw new Error("Document parser returned malformed JSON."); }
        const parsed = validateResponse(raw);
        const blocks = parsed.blocks.map((block) => normalizeBlock(block, parsed.parser.id));
        const noBlocksWarning = blocks.length ? [] : ["Parser returned no extractable blocks. Researcher review required."];
        return {
          status: parsed.requiresReview || !blocks.length ? "Requires Review" : "Parsed",
          blocks,
          warnings: [...parsed.warnings, ...noBlocksWarning],
          provenance: { parserId: parsed.parser.id, parserVersion: parsed.parser.version, deterministic: false },
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createRichDocumentParserAdapters(configuration: DoclingParserConfiguration = {}): DocumentParserAdapters {
  const provider = createDoclingCompatibleProvider(configuration);
  const adapter: DocumentParserAdapter = (input) => provider.parse(input);
  return { PDF: adapter, DOCX: adapter, PPTX: adapter };
}

export function createRichDocumentParserAdaptersFromEnvironment(
  environment: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}
): DocumentParserAdapters {
  return createRichDocumentParserAdapters({ serviceUrl: environment.DOCUMENT_PARSER_SERVICE_URL });
}
