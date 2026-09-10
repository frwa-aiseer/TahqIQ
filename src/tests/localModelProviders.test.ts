import { describe, expect, it, vi } from "vitest";
import {
  EmbeddingEndpointAdapter,
  LocalGeneralLlmEndpointAdapter,
  QwenVlCompatibleEndpointAdapter,
  WhisperCompatibleEndpointAdapter,
  createEndpointProviderRegistryFromEnv,
} from "../server/localModelProviders";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

describe("open/local endpoint provider abstractions", () => {
  it("reports missing endpoints as Not Configured and never calls the network", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const registry = createEndpointProviderRegistryFromEnv({}, fetchImpl);

    expect(registry.listStatuses()).toHaveLength(5);
    expect(registry.listStatuses().every((status) => status.state === "Not Configured")).toBe(true);
    expect(registry.listStatuses().every((status) => status.executionLocation === "Server Endpoint")).toBe(true);
    expect(await registry.checkAllHealth()).toEqual(registry.listStatuses());
    expect(registry.route("Scientific Embeddings")).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("routes only providers whose mocked health check succeeds", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.startsWith("https://scientific.test")) return jsonResponse({ status: "ok" });
      if (url.startsWith("https://general.test")) return jsonResponse({}, 503);
      if (url.startsWith("https://whisper.test")) throw new Error("connection refused");
      if (url.startsWith("https://vision.test")) return jsonResponse({ status: "healthy" });
      return jsonResponse({ status: "ok" });
    });
    const registry = createEndpointProviderRegistryFromEnv({
      TEHQIQ_SCIENTIFIC_EMBEDDING_ENDPOINT: "https://scientific.test",
      TEHQIQ_GENERAL_EMBEDDING_ENDPOINT: "https://general.test",
      TEHQIQ_WHISPER_ENDPOINT: "https://whisper.test",
      TEHQIQ_VISION_DOCUMENT_ENDPOINT: "https://vision.test",
      TEHQIQ_LOCAL_LLM_ENDPOINT: "https://llm.test",
    }, fetchImpl);

    expect(registry.listStatuses().every((status) => status.state === "Configured")).toBe(true);
    expect(registry.route("General LLM")).toBeNull();
    const states = Object.fromEntries((await registry.checkAllHealth()).map((status) => [status.providerId, status.state]));
    expect(states).toEqual({
      "specter2-compatible": "Healthy",
      "bge-m3-compatible": "Unavailable",
      "whisper-compatible": "Failed",
      "qwen-vl-compatible": "Healthy",
      "local-general-llm": "Healthy",
    });
    expect(registry.route("Scientific Embeddings")?.providerId).toBe("specter2-compatible");
    expect(registry.route("General Embeddings")).toBeNull();
    expect(registry.route("Transcription")).toBeNull();
    expect(registry.route("Vision/Document")?.providerId).toBe("qwen-vl-compatible");
    expect(registry.route("General LLM")?.providerId).toBe("local-general-llm");
  });

  it("requires a verified Healthy state before invoking an endpoint", async () => {
    const adapter = new EmbeddingEndpointAdapter({ providerId: "embedding", capability: "General Embeddings", endpoint: "https://embed.test", model: "bge", fetchImpl: vi.fn() });
    await expect(adapter.embed(["text"])).rejects.toThrow(/must be Healthy/);
  });

  it("validates embedding results and keeps server credentials out of status", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      if (String(input).endsWith("/health")) return jsonResponse({ status: "ok" });
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer server-secret");
      expect(JSON.parse(String(init?.body))).toEqual({ model: "specter2", input: ["alpha", "beta"] });
      return jsonResponse({ model: "specter2-v2", vectors: [[0.1, 0.2], [0.3, 0.4]] });
    });
    const adapter = new EmbeddingEndpointAdapter({ providerId: "scientific", capability: "Scientific Embeddings", endpoint: "https://embed.test/", model: "specter2", apiKey: "server-secret", fetchImpl });

    await adapter.checkHealth();
    expect(JSON.stringify(adapter.getStatus())).not.toContain("server-secret");
    await expect(adapter.embed(["alpha", "beta"])).resolves.toEqual({ providerId: "scientific", model: "specter2-v2", vectors: [[0.1, 0.2], [0.3, 0.4]] });
  });

  it("validates Whisper-compatible and Qwen-VL-compatible output contracts", async () => {
    const whisperFetch = vi.fn<typeof fetch>(async (input) => String(input).endsWith("/health")
      ? jsonResponse({ status: "ok" })
      : jsonResponse({ text: "Researcher supplied audio", segments: [], language: "en" }));
    const whisper = new WhisperCompatibleEndpointAdapter({ providerId: "whisper", capability: "Transcription", endpoint: "https://whisper.test", model: "whisper", fetchImpl: whisperFetch });
    await whisper.checkHealth();
    await expect(whisper.transcribe("YWJj", "audio/wav")).resolves.toMatchObject({ text: "Researcher supplied audio", language: "en" });

    const visionFetch = vi.fn<typeof fetch>(async (input) => String(input).endsWith("/health")
      ? jsonResponse({ status: "healthy" })
      : jsonResponse({ blocks: [{ type: "text", text: "Observed content" }], warnings: ["Needs researcher review"] }));
    const vision = new QwenVlCompatibleEndpointAdapter({ providerId: "qwen-vl", capability: "Vision/Document", endpoint: "https://vision.test", model: "qwen-vl", fetchImpl: visionFetch });
    await vision.checkHealth();
    await expect(vision.analyze("YWJj", "application/pdf", "Extract visible blocks")).resolves.toMatchObject({ warnings: ["Needs researcher review"] });
  });

  it("implements an OpenAI-compatible local general LLM provider for the gateway boundary", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      if (String(input).endsWith("/health")) return jsonResponse({ status: "ok" });
      const request = JSON.parse(String(init?.body));
      expect(request.model).toBe("qwen-local");
      expect(request.response_format).toEqual({ type: "json_object" });
      return jsonResponse({ model: "qwen-local-v2", choices: [{ message: { content: "{\"proposal\":true}" } }], usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 } });
    });
    const adapter = new LocalGeneralLlmEndpointAdapter({ providerId: "local", capability: "General LLM", endpoint: "http://127.0.0.1:8000", model: "qwen-local", fetchImpl });

    await adapter.checkHealth();
    await expect(adapter.generate({ model: "qwen-local", contents: "Draft a proposal", config: { systemInstruction: "Return a draft", responseMimeType: "application/json" } })).resolves.toEqual({
      text: "{\"proposal\":true}",
      modelVersion: "qwen-local-v2",
      usage: { promptTokens: 4, outputTokens: 3, totalTokens: 7 },
    });
  });
});
