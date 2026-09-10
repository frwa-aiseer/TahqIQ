import { describe, expect, it } from "vitest";
import { ConfigurableModelRouter, createModelRouterFromEnv, readAiModelConfiguration } from "../server/modelRouter";

describe("configurable ModelRouter", () => {
  it("routes standard, advanced, and review agents through FAST, MAIN, and REVIEW configuration", () => {
    const router = new ConfigurableModelRouter({ provider: "gemini", fast: "fast-v1", main: "main-v1", review: "review-v1" });
    expect(router.route("research-intake", "Structured Output")).toMatchObject({ tier: "FAST", model: "fast-v1", taskMode: "Structured Output" });
    expect(router.route("methodology-design", "Structured Output")).toMatchObject({ tier: "MAIN", model: "main-v1" });
    expect(router.route("peer-review", "Structured Output")).toMatchObject({ tier: "REVIEW", model: "review-v1" });
  });

  it("changes routed models through environment values without feature-code edits", () => {
    const first = createModelRouterFromEnv({ TEHQIQ_MODEL_FAST: "fast-a", TEHQIQ_MODEL_MAIN: "main-a", TEHQIQ_MODEL_REVIEW: "review-a" });
    const second = createModelRouterFromEnv({ TEHQIQ_MODEL_FAST: "fast-b", TEHQIQ_MODEL_MAIN: "main-b", TEHQIQ_MODEL_REVIEW: "review-b" });
    expect(first.route("research-intake", "Structured Output").model).toBe("fast-a");
    expect(second.route("research-intake", "Structured Output").model).toBe("fast-b");
    expect(first.route("section-writer", "Structured Output").model).toBe("main-a");
    expect(second.route("section-writer", "Structured Output").model).toBe("main-b");
    expect(first.route("peer-review", "Structured Output").model).toBe("review-a");
    expect(second.route("peer-review", "Structured Output").model).toBe("review-b");
  });

  it("uses explicit server defaults and rejects malformed model IDs", () => {
    expect(readAiModelConfiguration({})).toEqual({ provider: "gemini", fast: "gemini-3.6-flash", main: "gemini-3.6-flash", review: "gemini-3.6-flash" });
    expect(() => readAiModelConfiguration({ TEHQIQ_MODEL_MAIN: "model with spaces" })).toThrow(/invalid model ID/);
  });
});
