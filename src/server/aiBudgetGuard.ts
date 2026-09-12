import { randomUUID } from "node:crypto";
import type { AiModelTier } from "./modelRouter";

export interface AiPricingEntry { provider: string; model: string; inputUsdPerMillionTokens: number; outputUsdPerMillionTokens: number }
export interface AiPricingConfiguration { version: string; effectiveAt: string; entries: readonly AiPricingEntry[] }
export interface AiBudgetPolicy {
  softLimitUsd: number;
  hardLimitUsd: number;
  maxProviderCallsPerRequest: number;
  maxAgentLoopIterations: number;
  minimumRemainingUsdByTier: Partial<Record<AiModelTier, number>>;
}
export interface AiBudgetDeclaration { estimatedInputTokens: number; maxOutputTokens: number; loopId: string; loopIteration: number; premiumReview: boolean }
export interface AiBudgetUsage {
  projectId: string; actorUid: string; requestCount: number; providerCalls: number; premiumReviews: number;
  inputTokens: number; outputTokens: number; estimatedCostUsd: number; reservedCostUsd: number;
  providerModels: Record<string, number>; loopIterations: Record<string, number>;
}
export interface AiBudgetReservation { id: string; projectId: string; actorUid: string; provider: string; model: string; pricingVersion: string; estimatedMaximumCostUsd: number; maxProviderCalls: number; premiumReview: boolean; softLimitReached: boolean }

const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const roundUsd = (value: number) => Math.round(value * 1_000_000_000) / 1_000_000_000;

export function parseAiPricingConfiguration(raw: string | undefined): AiPricingConfiguration {
  if (!raw?.trim()) throw new Error("AI pricing configuration is Not Configured.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("AI pricing configuration is invalid."); }
  const config = value as Partial<AiPricingConfiguration>;
  if (!config || typeof config !== "object" || typeof config.version !== "string" || !config.version.trim() || typeof config.effectiveAt !== "string" || !Number.isFinite(Date.parse(config.effectiveAt)) || !Array.isArray(config.entries) || !config.entries.length) throw new Error("AI pricing configuration is invalid.");
  const keys = new Set<string>();
  for (const entry of config.entries) {
    if (!entry || typeof entry.provider !== "string" || !entry.provider.trim() || typeof entry.model !== "string" || !entry.model.trim() || !finiteNonNegative(entry.inputUsdPerMillionTokens) || !finiteNonNegative(entry.outputUsdPerMillionTokens)) throw new Error("AI pricing configuration contains an invalid entry.");
    const key = `${entry.provider}:${entry.model}`;
    if (keys.has(key)) throw new Error("AI pricing configuration contains a duplicate provider/model entry.");
    keys.add(key);
  }
  return Object.freeze({ version: config.version.trim(), effectiveAt: config.effectiveAt, entries: Object.freeze(config.entries.map((entry) => Object.freeze({ ...entry }))) });
}

export function validateAiBudgetPolicy(value: unknown): AiBudgetPolicy {
  const policy = value as Partial<AiBudgetPolicy>;
  if (!policy || typeof policy !== "object" || !finiteNonNegative(policy.softLimitUsd) || !finiteNonNegative(policy.hardLimitUsd) || policy.softLimitUsd > policy.hardLimitUsd || !Number.isInteger(policy.maxProviderCallsPerRequest) || policy.maxProviderCallsPerRequest! < 1 || policy.maxProviderCallsPerRequest! > 4 || !Number.isInteger(policy.maxAgentLoopIterations) || policy.maxAgentLoopIterations! < 1 || policy.maxAgentLoopIterations! > 20) throw new Error("AI budget policy is invalid.");
  const thresholds = policy.minimumRemainingUsdByTier || {};
  if (Object.values(thresholds).some((threshold) => !finiteNonNegative(threshold))) throw new Error("AI budget routing thresholds are invalid.");
  return Object.freeze({ ...policy, minimumRemainingUsdByTier: Object.freeze({ ...thresholds }) } as AiBudgetPolicy);
}

export function parseAiBudgetPolicy(raw: string | undefined): AiBudgetPolicy {
  if (!raw?.trim()) throw new Error("AI budget policy is Not Configured.");
  try { return validateAiBudgetPolicy(JSON.parse(raw)); } catch (error) {
    if (error instanceof Error && error.message !== "AI budget policy is invalid.") throw error;
    throw new Error("AI budget policy is invalid.");
  }
}

export class InMemoryAiBudgetStore {
  private readonly usage = new Map<string, AiBudgetUsage>();
  private key(projectId: string, actorUid: string) { return `${projectId}:${actorUid}`; }
  get(projectId: string, actorUid: string): AiBudgetUsage {
    return this.usage.get(this.key(projectId, actorUid)) || { projectId, actorUid, requestCount: 0, providerCalls: 0, premiumReviews: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, reservedCostUsd: 0, providerModels: {}, loopIterations: {} };
  }
  reserve(reservation: AiBudgetReservation, declaration: AiBudgetDeclaration, policy: AiBudgetPolicy): void {
    const current = this.get(reservation.projectId, reservation.actorUid);
    if (declaration.loopIteration > policy.maxAgentLoopIterations || (current.loopIterations[declaration.loopId] || 0) >= policy.maxAgentLoopIterations) throw new Error("Repeated agent loop limit reached.");
    if (current.estimatedCostUsd + current.reservedCostUsd + reservation.estimatedMaximumCostUsd > policy.hardLimitUsd) throw new Error("AI hard budget exceeded.");
    this.usage.set(this.key(reservation.projectId, reservation.actorUid), {
      ...current, requestCount: current.requestCount + 1, premiumReviews: current.premiumReviews + (reservation.premiumReview ? 1 : 0),
      reservedCostUsd: roundUsd(current.reservedCostUsd + reservation.estimatedMaximumCostUsd),
      loopIterations: { ...current.loopIterations, [declaration.loopId]: (current.loopIterations[declaration.loopId] || 0) + 1 },
    });
  }
  settle(reservation: AiBudgetReservation, inputTokens: number, outputTokens: number, actualCostUsd: number, providerCalls: number): void {
    const current = this.get(reservation.projectId, reservation.actorUid);
    const providerModel = `${reservation.provider}:${reservation.model}`;
    this.usage.set(this.key(reservation.projectId, reservation.actorUid), {
      ...current, providerCalls: current.providerCalls + providerCalls, inputTokens: current.inputTokens + inputTokens, outputTokens: current.outputTokens + outputTokens,
      estimatedCostUsd: roundUsd(current.estimatedCostUsd + actualCostUsd), reservedCostUsd: roundUsd(Math.max(0, current.reservedCostUsd - reservation.estimatedMaximumCostUsd)),
      providerModels: { ...current.providerModels, [providerModel]: (current.providerModels[providerModel] || 0) + providerCalls },
    });
  }
}

export class AiBudgetGuard {
  constructor(private readonly pricing: AiPricingConfiguration, private readonly policy: AiBudgetPolicy, private readonly store: InMemoryAiBudgetStore, private readonly createId: () => string = () => randomUUID()) {}
  private price(provider: string, model: string) {
    const entry = this.pricing.entries.find((candidate) => candidate.provider === provider && candidate.model === model);
    if (!entry) throw new Error(`Pricing for '${provider}:${model}' is Not Configured.`);
    return entry;
  }
  estimate(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const price = this.price(provider, model);
    return roundUsd((inputTokens * price.inputUsdPerMillionTokens + outputTokens * price.outputUsdPerMillionTokens) / 1_000_000);
  }
  authorize(input: { projectId: string; actorUid: string; provider: string; model: string; tier: AiModelTier; declaration: AiBudgetDeclaration }): AiBudgetReservation {
    const { declaration } = input;
    if (!Number.isInteger(declaration.estimatedInputTokens) || declaration.estimatedInputTokens < 1 || !Number.isInteger(declaration.maxOutputTokens) || declaration.maxOutputTokens < 1 || !declaration.loopId.trim() || !Number.isInteger(declaration.loopIteration) || declaration.loopIteration < 1 || typeof declaration.premiumReview !== "boolean") throw new Error("AI budget declaration is invalid.");
    const usage = this.store.get(input.projectId, input.actorUid);
    const remaining = this.policy.hardLimitUsd - usage.estimatedCostUsd - usage.reservedCostUsd;
    const threshold = this.policy.minimumRemainingUsdByTier[input.tier] || 0;
    if (remaining < threshold) throw new Error(`AI ${input.tier} routing threshold reached.`);
    const estimatedMaximumCostUsd = roundUsd(this.estimate(input.provider, input.model, declaration.estimatedInputTokens, declaration.maxOutputTokens) * this.policy.maxProviderCallsPerRequest);
    const reservation: AiBudgetReservation = Object.freeze({ id: this.createId(), projectId: input.projectId, actorUid: input.actorUid, provider: input.provider, model: input.model, pricingVersion: this.pricing.version, estimatedMaximumCostUsd, maxProviderCalls: this.policy.maxProviderCallsPerRequest, premiumReview: declaration.premiumReview, softLimitReached: usage.estimatedCostUsd + estimatedMaximumCostUsd > this.policy.softLimitUsd });
    this.store.reserve(reservation, declaration, this.policy);
    return reservation;
  }
  settle(reservation: AiBudgetReservation, usage: { inputTokens: number | null; outputTokens: number | null }, providerCalls: number) {
    const inputTokens = usage.inputTokens || 0;
    const outputTokens = usage.outputTokens || 0;
    const estimatedCostUsd = this.estimate(reservation.provider, reservation.model, inputTokens, outputTokens);
    this.store.settle(reservation, inputTokens, outputTokens, estimatedCostUsd, providerCalls);
    return { estimatedCostUsd, pricingVersion: reservation.pricingVersion, softLimitReached: reservation.softLimitReached, providerCalls, premiumReview: reservation.premiumReview };
  }
}
