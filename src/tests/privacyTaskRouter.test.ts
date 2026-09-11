import { describe, expect, it } from "vitest";
import { PrivacyAwareTaskRouter, readAiPrivacyMode, readLocalProviderLocation, type AiTaskPrivacyDeclaration, type PrivacyAwareProvider } from "../server/privacyTaskRouter";

const baseRoute = { provider: "gemini", model: "cloud-fast", tier: "FAST" as const, taskMode: "Structured Output" as const };
const providers: PrivacyAwareProvider[] = [
  { providerId: "gemini", location: "Cloud", available: true, models: { FAST: "cloud-fast", MAIN: "cloud-main", REVIEW: "cloud-review" } },
  { providerId: "private-llm", location: "Private", available: true, models: { FAST: "private", MAIN: "private", REVIEW: "private" } },
  { providerId: "local-general-llm", location: "Local", available: true, models: { FAST: "local", MAIN: "local", REVIEW: "local" } },
];
const task = (overrides: Partial<AiTaskPrivacyDeclaration> = {}): AiTaskPrivacyDeclaration => ({
  sensitivity: "Internal", includesRawUploads: false, permittedProviders: providers.map(({ providerId }) => providerId), preferredTier: "FAST", ...overrides,
});

describe("privacy-aware AI task routing", () => {
  it("uses cloud in Standard Cloud mode when the task explicitly permits it", () => {
    expect(new PrivacyAwareTaskRouter("Standard Cloud", providers).route(baseRoute, task(), "Structured Output")).toMatchObject({ provider: "gemini", model: "cloud-fast", privacyMode: "Standard Cloud" });
  });

  it("prefers private infrastructure in Private/Hybrid mode", () => {
    expect(new PrivacyAwareTaskRouter("Private/Hybrid", providers).route(baseRoute, task(), "Structured Output")).toMatchObject({ provider: "private-llm", providerLocation: "Private" });
  });

  it("never sends confidential or raw-upload tasks to cloud in Private/Hybrid mode", () => {
    const cloudOnly = providers.filter((provider) => provider.location === "Cloud");
    const router = new PrivacyAwareTaskRouter("Private/Hybrid", cloudOnly);
    expect(() => router.route(baseRoute, task({ sensitivity: "Confidential", permittedProviders: ["gemini"] }), "Structured Output")).toThrow("Cannot Run Under Current Privacy Mode");
    expect(() => router.route(baseRoute, task({ includesRawUploads: true, permittedProviders: ["gemini"] }), "Structured Output")).toThrow("Cannot Run Under Current Privacy Mode");
  });

  it("cannot silently downgrade Local-Only mode to an available cloud provider", () => {
    const router = new PrivacyAwareTaskRouter("Local-Only", providers.map((provider) => provider.location === "Local" ? { ...provider, available: false } : provider));
    expect(() => router.route(baseRoute, task(), "Structured Output")).toThrow("Cannot Run Under Current Privacy Mode");
  });

  it("routes Local-Only tasks only to an explicitly permitted available local provider", () => {
    expect(new PrivacyAwareTaskRouter("Local-Only", providers).route(baseRoute, task(), "Structured Output")).toMatchObject({ provider: "local-general-llm", model: "local", providerLocation: "Local" });
    expect(() => new PrivacyAwareTaskRouter("Local-Only", providers).route(baseRoute, task({ permittedProviders: ["gemini"] }), "Structured Output")).toThrow("Cannot Run Under Current Privacy Mode");
  });

  it("rejects incomplete declarations and tier mismatches", () => {
    const router = new PrivacyAwareTaskRouter("Standard Cloud", providers);
    expect(() => router.route(baseRoute, task({ permittedProviders: [] }), "Structured Output")).toThrow(/incomplete/);
    expect(() => router.route(baseRoute, task({ preferredTier: "MAIN" }), "Structured Output")).toThrow(/preferred tier/);
  });

  it("reads trusted project mode first, preserves the legacy default, and rejects invalid modes", () => {
    expect(readAiPrivacyMode({}, {})).toBe("Standard Cloud");
    expect(readAiPrivacyMode({}, { TEHQIQ_AI_PRIVACY_MODE: "Private/Hybrid" })).toBe("Private/Hybrid");
    expect(readAiPrivacyMode({ aiPrivacyMode: "Local-Only" }, { TEHQIQ_AI_PRIVACY_MODE: "Standard Cloud" })).toBe("Local-Only");
    expect(() => readAiPrivacyMode({ aiPrivacyMode: "Cloud Anyway" }, {})).toThrow(/invalid/);
  });

  it("requires an explicit server-side trust-boundary classification for local/private infrastructure", () => {
    expect(readLocalProviderLocation({})).toBeNull();
    expect(readLocalProviderLocation({ TEHQIQ_LOCAL_LLM_LOCATION: "Local" })).toBe("Local");
    expect(readLocalProviderLocation({ TEHQIQ_LOCAL_LLM_LOCATION: "Private" })).toBe("Private");
    expect(() => readLocalProviderLocation({ TEHQIQ_LOCAL_LLM_LOCATION: "Cloud" })).toThrow(/Local or Private/);
  });
});
