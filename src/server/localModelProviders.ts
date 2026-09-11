import type { AiProvider, AiProviderRequest, AiProviderResponse } from "./aiGateway";

export type ProviderHealthState = "Not Configured" | "Configured" | "Healthy" | "Unavailable" | "Failed";
export type ProviderCapability = "Scientific Embeddings" | "General Embeddings" | "Transcription" | "Vision/Document" | "General LLM";

export interface ProviderStatus {
  providerId: string;
  capability: ProviderCapability;
  state: ProviderHealthState;
  endpoint: string | null;
  model: string;
  executionLocation: "Server Endpoint";
  checkedAt?: string;
  message: string;
}

export interface EndpointProviderConfiguration {
  providerId: string;
  capability: ProviderCapability;
  endpoint?: string;
  model: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface EmbeddingResult { providerId: string; model: string; vectors: number[][] }
export interface TranscriptionResult { providerId: string; model: string; text: string; segments: unknown[]; language?: string }
export interface VisionDocumentResult { providerId: string; model: string; blocks: unknown[]; warnings: string[] }

function normalizeEndpoint(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null;
  } catch { return null; }
}
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export class ConfigurableEndpointProvider {
  readonly providerId: string;
  readonly capability: ProviderCapability;
  readonly model: string;
  protected readonly endpoint: string | null;
  protected readonly fetchImpl: typeof fetch | undefined;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private status: ProviderStatus;

  constructor(configuration: EndpointProviderConfiguration) {
    if (!configuration.providerId.trim() || !configuration.model.trim()) throw new Error("Endpoint provider identity and model are required.");
    this.providerId = configuration.providerId;
    this.capability = configuration.capability;
    this.model = configuration.model.trim();
    this.endpoint = normalizeEndpoint(configuration.endpoint);
    this.fetchImpl = configuration.fetchImpl || globalThis.fetch;
    this.apiKey = configuration.apiKey?.trim() || undefined;
    this.timeoutMs = Math.min(Math.max(configuration.timeoutMs || 15_000, 500), 120_000);
    this.status = Object.freeze({ providerId: this.providerId, capability: this.capability, state: this.endpoint ? "Configured" : "Not Configured", endpoint: this.endpoint, model: this.model, executionLocation: "Server Endpoint", message: this.endpoint ? "Endpoint configured; health not yet verified." : "Endpoint Not Configured." });
  }

  getStatus(): ProviderStatus { return this.status; }

  protected headers(): Record<string, string> {
    return { Accept: "application/json", "Content-Type": "application/json", ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) };
  }

  protected async request(path: string, init: RequestInit): Promise<unknown> {
    if (!this.endpoint) throw new Error(`${this.providerId} is Not Configured.`);
    if (this.status.state !== "Healthy") throw new Error(`${this.providerId} must be Healthy before it can be used.`);
    if (!this.fetchImpl) throw new Error(`${this.providerId} fetch transport is unavailable.`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers = new Headers(init.headers);
      Object.entries(this.headers()).forEach(([name, value]) => headers.set(name, value));
      const response = await this.fetchImpl(`${this.endpoint}${path}`, { ...init, headers, signal: controller.signal });
      if (!response.ok) throw new Error(`${this.providerId} returned HTTP ${response.status}.`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async checkHealth(now = () => new Date().toISOString()): Promise<ProviderStatus> {
    if (!this.endpoint) return this.status;
    if (!this.fetchImpl) {
      this.status = Object.freeze({ ...this.status, state: "Failed", checkedAt: now(), message: "Fetch transport unavailable." });
      return this.status;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.endpoint}/health`, { method: "GET", headers: this.headers(), signal: controller.signal });
      if (!response.ok) {
        this.status = Object.freeze({ ...this.status, state: "Unavailable", checkedAt: now(), message: `Health endpoint returned HTTP ${response.status}.` });
        return this.status;
      }
      const body = await response.json();
      if (!object(body) || !["ok", "healthy"].includes(String(body.status).toLowerCase())) throw new Error("Malformed health response.");
      this.status = Object.freeze({ ...this.status, state: "Healthy", checkedAt: now(), message: "Endpoint health verified." });
    } catch (error) {
      this.status = Object.freeze({ ...this.status, state: "Failed", checkedAt: now(), message: error instanceof Error ? error.message : "Health check failed." });
    } finally {
      clearTimeout(timer);
    }
    return this.status;
  }
}

export class EmbeddingEndpointAdapter extends ConfigurableEndpointProvider {
  async embed(texts: readonly string[]): Promise<EmbeddingResult> {
    if (!texts.length || texts.some((text) => !text.trim())) throw new Error("Embedding input requires non-empty text.");
    const raw = await this.request("/embeddings", { method: "POST", body: JSON.stringify({ model: this.model, input: texts }) });
    if (!object(raw) || !Array.isArray(raw.vectors) || raw.vectors.length !== texts.length || raw.vectors.some((vector) => !Array.isArray(vector) || !vector.length || vector.some((value) => typeof value !== "number" || !Number.isFinite(value)))) throw new Error("Embedding endpoint returned malformed vectors.");
    return { providerId: this.providerId, model: typeof raw.model === "string" && raw.model.trim() ? raw.model : this.model, vectors: raw.vectors as number[][] };
  }
}

export class WhisperCompatibleEndpointAdapter extends ConfigurableEndpointProvider {
  async transcribe(contentBase64: string, mimeType: string): Promise<TranscriptionResult> {
    if (!contentBase64 || !mimeType) throw new Error("Transcription requires media content and MIME type.");
    const raw = await this.request("/transcribe", { method: "POST", body: JSON.stringify({ model: this.model, contentBase64, mimeType }) });
    if (!object(raw) || typeof raw.text !== "string" || !Array.isArray(raw.segments)) throw new Error("Whisper-compatible endpoint returned malformed transcription.");
    return { providerId: this.providerId, model: typeof raw.model === "string" && raw.model.trim() ? raw.model : this.model, text: raw.text, segments: raw.segments, language: typeof raw.language === "string" ? raw.language : undefined };
  }
}

export class QwenVlCompatibleEndpointAdapter extends ConfigurableEndpointProvider {
  async analyze(contentBase64: string, mimeType: string, instruction: string): Promise<VisionDocumentResult> {
    if (!contentBase64 || !mimeType || !instruction.trim()) throw new Error("Vision/document analysis requires content, MIME type, and instruction.");
    const raw = await this.request("/analyze", { method: "POST", body: JSON.stringify({ model: this.model, contentBase64, mimeType, instruction }) });
    if (!object(raw) || !Array.isArray(raw.blocks) || !Array.isArray(raw.warnings) || raw.warnings.some((warning) => typeof warning !== "string")) throw new Error("Qwen-VL-compatible endpoint returned malformed document output.");
    return { providerId: this.providerId, model: typeof raw.model === "string" && raw.model.trim() ? raw.model : this.model, blocks: raw.blocks, warnings: raw.warnings as string[] };
  }
}

export class LocalGeneralLlmEndpointAdapter extends ConfigurableEndpointProvider implements AiProvider {
  readonly id: string;
  constructor(configuration: EndpointProviderConfiguration) { super(configuration); this.id = configuration.providerId; }
  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const raw = await this.request("/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: request.model || this.model, messages: [{ role: "system", content: String(request.config.systemInstruction || "") }, { role: "user", content: request.contents }], response_format: request.config.responseMimeType === "application/json" ? { type: "json_object" } : undefined, tools: request.config.tools }) });
    if (!object(raw) || !Array.isArray(raw.choices)) throw new Error("Local general LLM endpoint returned malformed output.");
    const firstChoice = raw.choices[0];
    if (!object(firstChoice) || !object(firstChoice.message) || typeof firstChoice.message.content !== "string") throw new Error("Local general LLM endpoint returned malformed output.");
    const usage = object(raw.usage) ? raw.usage : {};
    return { text: firstChoice.message.content, modelVersion: typeof raw.model === "string" ? raw.model : this.model, usage: { promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined, outputTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined, totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined } };
  }
}

export type TehqIqEndpointAdapter = EmbeddingEndpointAdapter | WhisperCompatibleEndpointAdapter | QwenVlCompatibleEndpointAdapter | LocalGeneralLlmEndpointAdapter;

export class EndpointProviderRegistry {
  constructor(private readonly adapters: readonly TehqIqEndpointAdapter[]) {}
  listStatuses(): ProviderStatus[] { return this.adapters.map((adapter) => adapter.getStatus()); }
  async checkAllHealth(): Promise<ProviderStatus[]> { return Promise.all(this.adapters.map((adapter) => adapter.checkHealth())); }
  async checkHealth(capability: ProviderCapability): Promise<ProviderStatus | null> {
    const adapter = this.adapters.find((candidate) => candidate.capability === capability);
    return adapter ? adapter.checkHealth() : null;
  }
  route(capability: ProviderCapability): TehqIqEndpointAdapter | null {
    return this.adapters.find((adapter) => adapter.capability === capability && adapter.getStatus().state === "Healthy") || null;
  }
}

export function createEndpointProviderRegistryFromEnv(env: Record<string, string | undefined> = process.env, fetchImpl?: typeof fetch): EndpointProviderRegistry {
  const common = (providerId: string, capability: ProviderCapability, endpoint: string | undefined, model: string, apiKey?: string): EndpointProviderConfiguration => ({ providerId, capability, endpoint, model, apiKey, fetchImpl });
  return new EndpointProviderRegistry([
    new EmbeddingEndpointAdapter(common("specter2-compatible", "Scientific Embeddings", env.TEHQIQ_SCIENTIFIC_EMBEDDING_ENDPOINT, env.TEHQIQ_SCIENTIFIC_EMBEDDING_MODEL || "SPECTER2-compatible", env.TEHQIQ_SCIENTIFIC_EMBEDDING_API_KEY)),
    new EmbeddingEndpointAdapter(common("bge-m3-compatible", "General Embeddings", env.TEHQIQ_GENERAL_EMBEDDING_ENDPOINT, env.TEHQIQ_GENERAL_EMBEDDING_MODEL || "BGE-M3-compatible", env.TEHQIQ_GENERAL_EMBEDDING_API_KEY)),
    new WhisperCompatibleEndpointAdapter(common("whisper-compatible", "Transcription", env.TEHQIQ_WHISPER_ENDPOINT || env.TRANSCRIPTION_SERVICE_URL, env.TEHQIQ_WHISPER_MODEL || "Whisper-compatible", env.TEHQIQ_WHISPER_API_KEY)),
    new QwenVlCompatibleEndpointAdapter(common("qwen-vl-compatible", "Vision/Document", env.TEHQIQ_VISION_DOCUMENT_ENDPOINT, env.TEHQIQ_VISION_DOCUMENT_MODEL || "Qwen-VL-compatible", env.TEHQIQ_VISION_DOCUMENT_API_KEY)),
    new LocalGeneralLlmEndpointAdapter(common("local-general-llm", "General LLM", env.TEHQIQ_LOCAL_LLM_ENDPOINT, env.TEHQIQ_LOCAL_LLM_MODEL || "Local-general-compatible", env.TEHQIQ_LOCAL_LLM_API_KEY)),
  ]);
}
