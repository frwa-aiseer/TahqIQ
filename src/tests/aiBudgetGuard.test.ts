import { describe, expect, it } from "vitest";
import { AiBudgetGuard, InMemoryAiBudgetStore, parseAiBudgetPolicy, parseAiPricingConfiguration, type AiBudgetPolicy } from "../server/aiBudgetGuard";

const pricing = parseAiPricingConfiguration(JSON.stringify({ version: "prices-2026-09", effectiveAt: "2026-09-01T00:00:00.000Z", entries: [
  { provider: "local", model: "fast", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
  { provider: "local", model: "review", inputUsdPerMillionTokens: 3, outputUsdPerMillionTokens: 6 },
] }));
const policy = (overrides: Partial<AiBudgetPolicy> = {}): AiBudgetPolicy => ({ softLimitUsd: 0.001, hardLimitUsd: 0.01, maxProviderCallsPerRequest: 2, maxAgentLoopIterations: 2, minimumRemainingUsdByTier: {}, ...overrides });
const declaration = (loopId: string, loopIteration = 1) => ({ estimatedInputTokens: 100, maxOutputTokens: 100, loopId, loopIteration, premiumReview: false });

describe("AI budget and loop guard", () => {
  it("rejects a request whose maximum reservation would cross the hard budget", () => {
    const guard = new AiBudgetGuard(pricing, policy({ hardLimitUsd: 0.0002, softLimitUsd: 0.0001 }), new InMemoryAiBudgetStore(), () => "r1");
    expect(() => guard.authorize({ projectId: "p", actorUid: "u", provider: "local", model: "fast", tier: "FAST", declaration: declaration("one") })).toThrow("AI hard budget exceeded");
  });

  it("atomically accounts per project/user and blocks concurrent reservations at the hard limit", () => {
    const store = new InMemoryAiBudgetStore();
    const guard = new AiBudgetGuard(pricing, policy({ hardLimitUsd: 0.001, softLimitUsd: 0.0004 }), store, () => "reservation");
    guard.authorize({ projectId: "p", actorUid: "u", provider: "local", model: "fast", tier: "FAST", declaration: declaration("one") });
    expect(() => guard.authorize({ projectId: "p", actorUid: "u", provider: "local", model: "fast", tier: "FAST", declaration: declaration("two") })).toThrow("AI hard budget exceeded");
    expect(store.get("p", "other").requestCount).toBe(0);
  });

  it("blocks repeated agent loops and explicit out-of-range iterations", () => {
    const store = new InMemoryAiBudgetStore();
    const guard = new AiBudgetGuard(pricing, policy(), store, () => "reservation");
    const input = { projectId: "p", actorUid: "u", provider: "local", model: "fast", tier: "FAST" as const };
    guard.authorize({ ...input, declaration: declaration("loop") });
    guard.authorize({ ...input, declaration: declaration("loop", 2) });
    expect(() => guard.authorize({ ...input, declaration: declaration("loop", 3) })).toThrow("Repeated agent loop limit reached");
  });

  it("tracks calls, tokens, model/provider, premium reviews, versioned cost, and soft-limit state", () => {
    const store = new InMemoryAiBudgetStore();
    const guard = new AiBudgetGuard(pricing, policy({ softLimitUsd: 0.0002 }), store, () => "r1");
    const reservation = guard.authorize({ projectId: "p", actorUid: "u", provider: "local", model: "review", tier: "REVIEW", declaration: { ...declaration("review"), premiumReview: true } });
    const result = guard.settle(reservation, { inputTokens: 50, outputTokens: 25 }, 2);
    expect(result).toEqual({ estimatedCostUsd: 0.0003, pricingVersion: "prices-2026-09", softLimitReached: true, providerCalls: 2, premiumReview: true });
    expect(store.get("p", "u")).toMatchObject({ requestCount: 1, providerCalls: 2, premiumReviews: 1, inputTokens: 50, outputTokens: 25, estimatedCostUsd: 0.0003, reservedCostUsd: 0, providerModels: { "local:review": 2 } });
  });

  it("enforces tier routing thresholds without silently changing models", () => {
    const guard = new AiBudgetGuard(pricing, policy({ hardLimitUsd: 1, minimumRemainingUsdByTier: { REVIEW: 2 } }), new InMemoryAiBudgetStore(), () => "r1");
    expect(() => guard.authorize({ projectId: "p", actorUid: "u", provider: "local", model: "review", tier: "REVIEW", declaration: declaration("review") })).toThrow("REVIEW routing threshold reached");
  });

  it("requires valid versioned external pricing and bounded retry/loop policy", () => {
    expect(() => parseAiPricingConfiguration(undefined)).toThrow("Not Configured");
    expect(() => parseAiPricingConfiguration(JSON.stringify({ version: "v", effectiveAt: "bad", entries: [] }))).toThrow("invalid");
    expect(() => parseAiBudgetPolicy(JSON.stringify({ softLimitUsd: 2, hardLimitUsd: 1, maxProviderCallsPerRequest: 5, maxAgentLoopIterations: 0, minimumRemainingUsdByTier: {} }))).toThrow("invalid");
  });
});
