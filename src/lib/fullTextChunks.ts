import type { DocumentExtractedBlock, DocumentIngestionJob, FullTextChunk } from "../types";
import { calculateSha256 } from "./datasetIngestion";

export interface CreateFullTextChunksInput {
  job: DocumentIngestionJob;
  sourceId: string;
  documentVersion: string;
  maxCharacters?: number;
  overlapCharacters?: number;
}

export interface FullTextChunkingResult {
  chunks: FullTextChunk[];
  warnings: string[];
}

interface PendingChunk {
  block: DocumentExtractedBlock;
  text: string;
  characterStart: number;
  characterEnd: number;
}

function blockText(block: DocumentExtractedBlock): string {
  if (block.text?.trim()) return block.text.trim();
  if (block.blockType === "Table" && block.rows?.length) return JSON.stringify(block.rows);
  return "";
}

function hasConcreteLocation(block: DocumentExtractedBlock): boolean {
  return Boolean(
    (block.sourceLocation.trim() && block.sourceLocation !== "Not available") ||
    block.pageNumber || block.section?.trim() || block.tableReference?.trim() || block.imageReference?.trim() ||
    block.startSeconds !== undefined || block.endSeconds !== undefined
  );
}

function splitBlock(block: DocumentExtractedBlock, maxCharacters: number, overlapCharacters: number): PendingChunk[] {
  const text = blockText(block);
  if (!text) return [];
  const pending: PendingChunk[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxCharacters, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(maxCharacters / 2)) end = boundary;
    }
    const chunkText = text.slice(start, end).trim();
    if (chunkText) pending.push({ block, text: chunkText, characterStart: start, characterEnd: end });
    if (end >= text.length) break;
    const nextStart = Math.max(end - overlapCharacters, start + 1);
    start = nextStart;
  }
  return pending;
}

export async function createFullTextChunks(
  input: CreateFullTextChunksInput,
  now: () => string = () => new Date().toISOString()
): Promise<FullTextChunkingResult> {
  const { job } = input;
  if (!input.sourceId.trim()) throw new Error("A sourceId is required for traceable chunks.");
  if (!input.documentVersion.trim()) throw new Error("A document version is required for traceable chunks.");
  if (!/^[a-f0-9]{64}$/i.test(job.sha256)) throw new Error("The ingestion job requires a valid SHA-256 document hash.");
  if (job.status !== "Parsed" && job.status !== "Requires Review") throw new Error("Only parsed or review-required ingestion jobs can be chunked.");
  if (!job.parserProvenance?.parserId?.trim() || !job.parserProvenance.parserVersion?.trim()) throw new Error("Parser provenance is required before chunking.");

  const maxCharacters = Math.min(Math.max(input.maxCharacters || 2_000, 200), 20_000);
  const overlapCharacters = Math.min(Math.max(input.overlapCharacters ?? 200, 0), Math.floor(maxCharacters / 2));
  const warnings: string[] = [];
  const pending: PendingChunk[] = [];

  for (const block of job.extractedBlocks) {
    if (!blockText(block)) {
      warnings.push(`Block ${block.blockId} has no text or table rows and was not chunked.`);
      continue;
    }
    if (!hasConcreteLocation(block)) {
      warnings.push(`Block ${block.blockId} has no original document location and was not chunked.`);
      continue;
    }
    pending.push(...splitBlock(block, maxCharacters, overlapCharacters));
  }

  const ids = await Promise.all(pending.map(async (item, index) => {
    const identity = `${job.projectId}\n${input.sourceId}\n${job.sha256}\n${input.documentVersion}\n${item.block.blockId}\n${index}\n${item.characterStart}\n${item.characterEnd}\n${item.text}`;
    return `chunk-${(await calculateSha256(identity)).slice(0, 24)}`;
  }));
  const createdAt = now();
  const chunks: FullTextChunk[] = pending.map((item, index) => ({
    chunkId: ids[index],
    projectId: job.projectId,
    sourceId: input.sourceId,
    documentHash: job.sha256,
    documentVersion: input.documentVersion,
    chunkIndex: index,
    text: item.text,
    page: item.block.pageNumber,
    section: item.block.section,
    startSeconds: item.block.startSeconds,
    endSeconds: item.block.endSeconds,
    surroundingContext: {
      sourceBlockId: item.block.blockId,
      sourceLocation: item.block.sourceLocation,
      characterStart: item.characterStart,
      characterEnd: item.characterEnd,
      previousChunkId: ids[index - 1],
      nextChunkId: ids[index + 1],
    },
    provenance: {
      ingestionJobId: job.jobId,
      parserId: item.block.parserId,
      parserVersion: job.parserProvenance!.parserVersion,
      extractedBlockId: item.block.blockId,
    },
    createdAt,
    isDemo: job.isDemo,
    isSynthetic: job.isSynthetic,
  }));
  return { chunks, warnings };
}

export function traceChunkToDocumentLocation(chunk: FullTextChunk, job: DocumentIngestionJob): DocumentExtractedBlock | null {
  if (chunk.projectId !== job.projectId || chunk.documentHash !== job.sha256 || chunk.provenance.ingestionJobId !== job.jobId) return null;
  const block = job.extractedBlocks.find((item) => item.blockId === chunk.provenance.extractedBlockId);
  if (!block || block.parserId !== chunk.provenance.parserId || block.sourceLocation !== chunk.surroundingContext.sourceLocation) return null;
  const original = blockText(block);
  const reconstructed = original.slice(chunk.surroundingContext.characterStart, chunk.surroundingContext.characterEnd).trim();
  return reconstructed === chunk.text ? block : null;
}
