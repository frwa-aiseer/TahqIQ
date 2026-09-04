import type {
  DocumentExtractedBlock,
  DocumentFormatCategory,
  DocumentIngestionJob,
  DocumentIngestionStatus,
  DocumentParserProvenance,
} from "../types";
import { calculateSha256, parseAndProfileDataset } from "./datasetIngestion";

export interface DocumentIngestionInput {
  projectId: string;
  filename: string;
  mimeType?: string;
  content: string | ArrayBuffer | Uint8Array;
  createdByUid: string;
  artifactId?: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface DocumentParserResult {
  status: "Parsed" | "Requires Review";
  blocks: DocumentExtractedBlock[];
  warnings: string[];
  provenance: Omit<DocumentParserProvenance, "executedAt">;
}

export type DocumentParserAdapter = (input: DocumentIngestionInput) => Promise<DocumentParserResult>;
export type DocumentParserAdapters = Partial<Record<DocumentFormatCategory, DocumentParserAdapter>>;

const EXTENSION_CATEGORIES: Record<string, DocumentFormatCategory> = {
  pdf: "PDF", docx: "DOCX", pptx: "PPTX", xls: "Spreadsheet", xlsx: "Spreadsheet",
  csv: "Delimited Data", tsv: "Delimited Data", json: "JSON", txt: "Plain Text", md: "Markdown",
  markdown: "Markdown", tex: "TeX", png: "Image", jpg: "Image", jpeg: "Image", gif: "Image",
  webp: "Image", tif: "Image", tiff: "Image", bmp: "Image", svg: "Image", mp3: "Audio",
  wav: "Audio", m4a: "Audio", aac: "Audio", ogg: "Audio", flac: "Audio", mp4: "Video",
  mov: "Video", avi: "Video", webm: "Video", mkv: "Video", m4v: "Video",
};

const MIME_CATEGORIES: Array<[RegExp, DocumentFormatCategory]> = [
  [/^application\/pdf$/i, "PDF"],
  [/wordprocessingml|msword/i, "DOCX"],
  [/presentationml|powerpoint/i, "PPTX"],
  [/spreadsheetml|ms-excel/i, "Spreadsheet"],
  [/^text\/(csv|tab-separated-values)$/i, "Delimited Data"],
  [/json/i, "JSON"],
  [/^text\/markdown$/i, "Markdown"],
  [/^(application\/x-tex|text\/x-tex)$/i, "TeX"],
  [/^text\/plain$/i, "Plain Text"],
  [/^image\//i, "Image"],
  [/^audio\//i, "Audio"],
  [/^video\//i, "Video"],
];

const sizeOf = (content: DocumentIngestionInput["content"]): number =>
  typeof content === "string" ? new TextEncoder().encode(content).byteLength : content instanceof ArrayBuffer ? content.byteLength : content.byteLength;

const toText = (content: DocumentIngestionInput["content"]): string =>
  typeof content === "string" ? content : new TextDecoder("utf-8", { fatal: false }).decode(content instanceof ArrayBuffer ? new Uint8Array(content) : content);

export function classifyDocumentFormat(filename: string, mimeType = ""): DocumentFormatCategory {
  const extension = filename.toLowerCase().split(".").pop() || "";
  if (EXTENSION_CATEGORIES[extension]) return EXTENSION_CATEGORIES[extension];
  return MIME_CATEGORIES.find(([pattern]) => pattern.test(mimeType.trim()))?.[1] || "Unsupported";
}

function textAdapter(category: "Plain Text" | "Markdown" | "TeX"): DocumentParserAdapter {
  return async (input) => {
    const text = toText(input.content).replace(/\r\n/g, "\n").trim();
    const blocks = text ? text.split(/\n\s*\n/).map((part, index) => ({
      blockId: `block-${index + 1}`, blockType: "Text" as const, text: part.trim(),
      sourceLocation: `paragraph:${index + 1}`, parserId: `tehqiq-${category.toLowerCase().replace(/\s/g, "-")}`,
    })) : [];
    return {
      status: blocks.length ? "Parsed" : "Requires Review",
      blocks,
      warnings: blocks.length ? [] : ["No extractable text was found. Researcher review required."],
      provenance: { parserId: `tehqiq-${category.toLowerCase().replace(/\s/g, "-")}`, parserVersion: "1.0.0", deterministic: true },
    };
  };
}

const defaultAdapters: DocumentParserAdapters = {
  "Plain Text": textAdapter("Plain Text"), Markdown: textAdapter("Markdown"), TeX: textAdapter("TeX"),
};

const pendingAdapter = (category: DocumentFormatCategory): string =>
  category === "PDF" || category === "DOCX" || category === "PPTX" ? "Rich-document parser Not Configured."
    : category === "Image" ? "Image extraction/OCR parser Not Configured."
      : category === "Audio" || category === "Video" ? "Audio/video transcription parser Not Configured."
        : "Parser Not Configured.";

function transition(job: DocumentIngestionJob, status: DocumentIngestionStatus, timestamp: string, message: string): DocumentIngestionJob {
  return { ...job, status, updatedAt: timestamp, statusHistory: [...job.statusHistory, { status, timestamp, message }] };
}

export async function routeDocumentIngestion(
  input: DocumentIngestionInput,
  adapters: DocumentParserAdapters = {},
  now: () => string = () => new Date().toISOString()
): Promise<DocumentIngestionJob> {
  const createdAt = now();
  const formatCategory = classifyDocumentFormat(input.filename, input.mimeType);
  const sha256 = await calculateSha256(input.content);
  let job: DocumentIngestionJob = {
    jobId: `ingestion-${sha256.slice(0, 12)}-${createdAt.replace(/[^0-9]/g, "")}`,
    projectId: input.projectId, artifactId: input.artifactId, filename: input.filename,
    mimeType: input.mimeType?.trim() || "application/octet-stream", sizeBytes: sizeOf(input.content), sha256,
    formatCategory, status: "Uploaded", statusHistory: [{ status: "Uploaded", timestamp: createdAt, message: "File bytes received by the ingestion router." }],
    extractedBlocks: [], warnings: [], errors: [], createdAt, updatedAt: createdAt, createdByUid: input.createdByUid,
    isDemo: input.isDemo === true, isSynthetic: input.isSynthetic === true,
  };

  if (formatCategory === "Unsupported") {
    return transition(job, "Unsupported", now(), "No supported file category matched the filename or MIME type.");
  }
  job = transition(job, "Queued", now(), `Routed to the ${formatCategory} ingestion path.`);

  if (["Spreadsheet", "Delimited Data", "JSON"].includes(formatCategory)) {
    job = transition(job, "Processing", now(), "Dataset parser started.");
    try {
      const parsed = await parseAndProfileDataset({ filename: input.filename, mimeType: input.mimeType, fileBufferOrString: input.content });
      const executedAt = now();
      const warnings = [
        ...parsed.errors.map((error) => `Parsing warning${error.row ? ` at row ${error.row}` : ""}: ${error.message}`),
        ...(parsed.dataset.piiWarnings || []).map((warning) => `PII review required for ${warning.variableName}: ${warning.warningType}.`),
      ];
      const status: DocumentIngestionStatus = warnings.length ? "Requires Review" : "Parsed";
      job = { ...job, dataset: parsed.dataset, warnings, parserProvenance: { parserId: "tehqiq-dataset-ingestion", parserVersion: "1.0.0", executedAt, deterministic: true }, extractedBlocks: [{ blockId: "dataset-preview", blockType: "Table", rows: parsed.rawRows.slice(0, 25), sourceLocation: "dataset:rows:1-25", parserId: "tehqiq-dataset-ingestion" }] };
      return transition(job, status, executedAt, status === "Parsed" ? "Dataset parsed successfully." : "Dataset parsed and requires researcher review of warnings.");
    } catch (error) {
      const failedAt = now();
      job = { ...job, errors: [error instanceof Error ? error.message : "Dataset parser failed without a diagnostic message."], parserProvenance: { parserId: "tehqiq-dataset-ingestion", parserVersion: "1.0.0", executedAt: failedAt, deterministic: true } };
      return transition(job, "Failed", failedAt, "Dataset parser failed.");
    }
  }

  const adapter = adapters[formatCategory] || defaultAdapters[formatCategory];
  if (!adapter) return { ...job, warnings: [pendingAdapter(formatCategory)] };

  job = transition(job, "Processing", now(), `${formatCategory} parser started.`);
  try {
    const result = await adapter(input);
    const executedAt = now();
    job = { ...job, extractedBlocks: result.blocks, warnings: result.warnings, parserProvenance: { ...result.provenance, executedAt } };
    return transition(job, result.status, executedAt, result.status === "Parsed" ? "Document parsed successfully." : "Document parsed and requires researcher review.");
  } catch (error) {
    const failedAt = now();
    job = { ...job, errors: [error instanceof Error ? error.message : "Parser failed without a diagnostic message."] };
    return transition(job, "Failed", failedAt, `${formatCategory} parser failed.`);
  }
}
