import { agentRegistry, type AgentId } from "./agentRegistry";

export type AiModelTier = "FAST" | "MAIN" | "REVIEW";
export type AiTaskMode = "Structured Output" | "Controlled Tools";
export interface AiModelRoute { provider: string; model: string; tier: AiModelTier; taskMode: AiTaskMode }
export interface AiModelRouter { route(agentId: AgentId, taskMode: AiTaskMode): AiModelRoute }
export interface AiModelConfiguration { provider: "gemini"; fast: string; main: string; review: string }

const DEFAULT_MODEL = "gemini-3.6-flash";
const REVIEW_AGENTS = new Set<AgentId>(["peer-review", "compliance", "integrity-review"]);

function configuredModel(value: string | undefined, fallback: string, variable: string): string {
  const model = value?.trim() || fallback;
  if (!model || model.length > 200 || /\s/.test(model)) throw new Error(`${variable} contains an invalid model ID.`);
  return model;
}

export function readAiModelConfiguration(env: Record<string, string | undefined>): AiModelConfiguration {
  return Object.freeze({ provider: "gemini", fast: configuredModel(env.TEHQIQ_MODEL_FAST, DEFAULT_MODEL, "TEHQIQ_MODEL_FAST"), main: configuredModel(env.TEHQIQ_MODEL_MAIN, DEFAULT_MODEL, "TEHQIQ_MODEL_MAIN"), review: configuredModel(env.TEHQIQ_MODEL_REVIEW, DEFAULT_MODEL, "TEHQIQ_MODEL_REVIEW") });
}

export class ConfigurableModelRouter implements AiModelRouter {
  constructor(private readonly configuration: AiModelConfiguration) {}
  route(agentId: AgentId, taskMode: AiTaskMode): AiModelRoute {
    const contract = agentRegistry.get(agentId);
    if (!contract) throw new Error(`Agent '${agentId}' is not registered.`);
    const tier: AiModelTier = REVIEW_AGENTS.has(agentId) ? "REVIEW" : contract.modelTier === "Language—Standard" ? "FAST" : "MAIN";
    const key = tier.toLowerCase() as "fast" | "main" | "review";
    return Object.freeze({ provider: this.configuration.provider, model: this.configuration[key], tier, taskMode });
  }
}

export function createModelRouterFromEnv(env: Record<string, string | undefined> = process.env): ConfigurableModelRouter {
  return new ConfigurableModelRouter(readAiModelConfiguration(env));
}
