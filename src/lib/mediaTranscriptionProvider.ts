import type { DocumentExtractedBlock, DocumentFormatCategory, DocumentTranscript, TranscriptSegment } from "../types";
import { calculateSha256 } from "./datasetIngestion";
import type { DocumentIngestionInput, DocumentParserAdapter, DocumentParserAdapters, DocumentParserResult } from "./documentIngestionRouter";

export interface TranscriptionPrivacyContext {
  projectId: string;
  artifactId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category: "Audio" | "Video";
}

export interface TranscriptionPrivacyDecision {
  allowed: boolean;
  route: "Self Hosted" | "Approved External" | "Blocked";
  reason: string;
}

export type TranscriptionPrivacyRouter = (context: TranscriptionPrivacyContext) => Promise<TranscriptionPrivacyDecision> | TranscriptionPrivacyDecision;

export interface MediaTranscriptionProvider {
  providerId: string;
  configured: boolean;
  transcribe(input: DocumentIngestionInput): Promise<DocumentParserResult>;
}

export interface WhisperTranscriptionConfiguration {
  serviceUrl?: string;
  fetchImpl?: typeof fetch;
  privacyRouter?: TranscriptionPrivacyRouter;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

interface WhisperSegmentResponse {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  confidence?: number;
  speaker?: string;
  language?: string;
}

interface WhisperResponse {
  provider: { id: string; version: string };
  transcriptVersion: string;
  language?: string;
  languageConfidence?: number;
  segments: WhisperSegmentResponse[];
  warnings: string[];
}

const MEDIA_CATEGORIES = new Set<DocumentFormatCategory>(["Audio", "Video"]);

function normalizeServiceUrl(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null;
  } catch { return null; }
}

const bytesOf = (content: DocumentIngestionInput["content"]): Uint8Array => typeof content === "string" ? new TextEncoder().encode(content) : content instanceof ArrayBuffer ? new Uint8Array(content) : content;

function contentToBase64(content: DocumentIngestionInput["content"]): string {
  const bytes = bytesOf(content);
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function categoryOf(input: DocumentIngestionInput): "Audio" | "Video" | null {
  const extension = input.filename.toLowerCase().split(".").pop() || "";
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(extension) || input.mimeType?.startsWith("audio/")) return "Audio";
  if (["mp4", "mov", "avi", "webm", "mkv", "m4v"].includes(extension) || input.mimeType?.startsWith("video/")) return "Video";
  return null;
}

function optionalBoundedNumber(value: unknown, field: string, min: number, max: number): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`Transcription response has an invalid ${field}.`);
  return value;
}

function validateResponse(value: unknown): WhisperResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Transcription service returned an invalid response object.");
  const candidate = value as Record<string, unknown>;
  const provider = candidate.provider as Record<string, unknown> | undefined;
  if (!provider || typeof provider.id !== "string" || !provider.id.trim() || typeof provider.version !== "string" || !provider.version.trim()) throw new Error("Transcription response is missing provider provenance.");
  if (typeof candidate.transcriptVersion !== "string" || !candidate.transcriptVersion.trim() || !Array.isArray(candidate.segments) || !Array.isArray(candidate.warnings) || candidate.warnings.some((item) => typeof item !== "string")) throw new Error("Transcription response does not match the required structured schema.");
  if (candidate.language !== undefined && typeof candidate.language !== "string") throw new Error("Transcription response has an invalid language.");
  const languageConfidence = optionalBoundedNumber(candidate.languageConfidence, "language confidence", 0, 1);
  const segments = candidate.segments.map((raw, index): WhisperSegmentResponse => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`Transcript segment ${index + 1} is invalid.`);
    const segment = raw as Record<string, unknown>;
    if (typeof segment.id !== "string" || !segment.id.trim() || typeof segment.text !== "string" || !segment.text.trim()) throw new Error(`Transcript segment ${index + 1} is missing its id or text.`);
    const startSeconds = optionalBoundedNumber(segment.startSeconds, `segment ${index + 1} start`, 0, Number.MAX_SAFE_INTEGER);
    const endSeconds = optionalBoundedNumber(segment.endSeconds, `segment ${index + 1} end`, 0, Number.MAX_SAFE_INTEGER);
    if (startSeconds === undefined || endSeconds === undefined || endSeconds < startSeconds) throw new Error(`Transcript segment ${index + 1} has invalid timestamps.`);
    const confidence = optionalBoundedNumber(segment.confidence, `segment ${index + 1} confidence`, 0, 1);
    for (const field of ["speaker", "language"] as const) if (segment[field] !== undefined && typeof segment[field] !== "string") throw new Error(`Transcript segment ${index + 1} has invalid ${field}.`);
    return { id: segment.id, text: segment.text, startSeconds, endSeconds, confidence, speaker: segment.speaker as string | undefined, language: segment.language as string | undefined };
  });
  return { provider: { id: provider.id, version: provider.version }, transcriptVersion: candidate.transcriptVersion, language: candidate.language as string | undefined, languageConfidence, segments, warnings: candidate.warnings as string[] };
}

function canonicalTranscript(segments: TranscriptSegment[]): string {
  return JSON.stringify(segments.map(({ segmentId, startSeconds, endSeconds, text, language, confidence, speaker }) => ({ segmentId, startSeconds, endSeconds, text, language: language || null, confidence: confidence ?? null, speaker: speaker || null })));
}

export function createWhisperCompatibleProvider(configuration: WhisperTranscriptionConfiguration = {}): MediaTranscriptionProvider {
  const serviceUrl = normalizeServiceUrl(configuration.serviceUrl);
  const fetchImpl = configuration.fetchImpl || globalThis.fetch;
  const timeoutMs = Math.min(Math.max(configuration.timeoutMs || 300_000, 1_000), 900_000);
  const maxResponseBytes = Math.min(Math.max(configuration.maxResponseBytes || 25 * 1024 * 1024, 1_024), 100 * 1024 * 1024);
  return {
    providerId: "whisper-compatible",
    configured: Boolean(serviceUrl && configuration.privacyRouter),
    async transcribe(input) {
      const category = categoryOf(input);
      if (!category || !MEDIA_CATEGORIES.has(category)) throw new Error("Whisper-compatible provider accepts only audio or video inputs.");
      const unconfigured = (message: string): DocumentParserResult => ({ status: "Requires Review", blocks: [], warnings: [message], provenance: { parserId: "whisper-compatible-not-configured", parserVersion: "Not available", deterministic: false } });
      if (!serviceUrl) return unconfigured("TRANSCRIPTION_SERVICE_URL Not Configured. No transcript was created.");
      if (!configuration.privacyRouter) return unconfigured("Transcription privacy routing Not Configured. No media bytes were sent and no transcript was created.");
      const privacy = await configuration.privacyRouter({ projectId: input.projectId, artifactId: input.artifactId, filename: input.filename, mimeType: input.mimeType || "application/octet-stream", sizeBytes: bytesOf(input.content).byteLength, category });
      if (!privacy.allowed || privacy.route === "Blocked") return { status: "Requires Review", blocks: [], warnings: [`Privacy routing blocked transcription: ${privacy.reason || "Researcher review required."}`], provenance: { parserId: "whisper-compatible-privacy-blocked", parserVersion: "Not available", deterministic: false } };
      if (privacy.route !== "Self Hosted" && privacy.route !== "Approved External") throw new Error("Privacy routing returned an invalid approved route.");
      if (!fetchImpl) throw new Error("Fetch is unavailable for the configured transcription service.");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${serviceUrl}/transcribe`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ projectId: input.projectId, artifactId: input.artifactId, filename: input.filename, mimeType: input.mimeType || "application/octet-stream", mediaType: category, privacyRoute: privacy.route, contentBase64: contentToBase64(input.content) }), signal: controller.signal });
        if (!response.ok) throw new Error(`Transcription service returned HTTP ${response.status}.`);
        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > maxResponseBytes) throw new Error("Transcription response exceeds the configured size limit.");
        const rawText = await response.text();
        if (new TextEncoder().encode(rawText).byteLength > maxResponseBytes) throw new Error("Transcription response exceeds the configured size limit.");
        let raw: unknown;
        try { raw = JSON.parse(rawText); } catch { throw new Error("Transcription service returned malformed JSON."); }
        const parsed = validateResponse(raw);
        if (!parsed.segments.length) return {
          status: "Requires Review",
          blocks: [],
          warnings: [...parsed.warnings, "Transcription service returned no transcript segments. Researcher review required."],
          provenance: { parserId: parsed.provider.id, parserVersion: parsed.provider.version, deterministic: false },
        };
        const segments: TranscriptSegment[] = parsed.segments.map((segment) => ({ segmentId: segment.id, startSeconds: segment.startSeconds, endSeconds: segment.endSeconds, text: segment.text, language: segment.language, confidence: segment.confidence, speaker: segment.speaker }));
        const transcriptHash = await calculateSha256(canonicalTranscript(segments));
        const transcript: Omit<DocumentTranscript, "generatedAt"> = { transcriptVersion: parsed.transcriptVersion, transcriptHash, hashAlgorithm: "SHA-256", language: parsed.language, languageConfidence: parsed.languageConfidence, segments, reviewState: "Needs Review", providerId: parsed.provider.id, providerVersion: parsed.provider.version, privacyRoute: privacy.route };
        const blocks: DocumentExtractedBlock[] = segments.map((segment) => ({ blockId: segment.segmentId, blockType: "Text", text: segment.text, sourceLocation: `time:${segment.startSeconds}-${segment.endSeconds}`, parserId: parsed.provider.id, startSeconds: segment.startSeconds, endSeconds: segment.endSeconds, language: segment.language || parsed.language, confidence: segment.confidence, speaker: segment.speaker }));
        return { status: "Requires Review", blocks, warnings: [...parsed.warnings, "Transcript requires researcher review before use as evidence."], provenance: { parserId: parsed.provider.id, parserVersion: parsed.provider.version, deterministic: false }, transcript };
      } finally { clearTimeout(timer); }
    },
  };
}

export function createMediaTranscriptionAdapters(configuration: WhisperTranscriptionConfiguration = {}): DocumentParserAdapters {
  const provider = createWhisperCompatibleProvider(configuration);
  const adapter: DocumentParserAdapter = (input) => provider.transcribe(input);
  return { Audio: adapter, Video: adapter };
}

export function createMediaTranscriptionAdaptersFromEnvironment(
  privacyRouter?: TranscriptionPrivacyRouter,
  environment: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}
): DocumentParserAdapters {
  return createMediaTranscriptionAdapters({ serviceUrl: environment.TRANSCRIPTION_SERVICE_URL, privacyRouter });
}
