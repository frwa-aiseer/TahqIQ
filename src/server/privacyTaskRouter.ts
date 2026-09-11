import type { AiModelRoute, AiModelTier, AiTaskMode } from "./modelRouter";

export type AiPrivacyMode = "Standard Cloud" | "Private/Hybrid" | "Local-Only";
export type AiTaskSensitivity = "Public" | "Internal" | "Confidential" | "Restricted";
export type AiProviderLocation = "Cloud" | "Private" | "Local";

export interface AiTaskPrivacyDeclaration {
  sensitivity: AiTaskSensitivity;
  includesRawUploads: boolean;
  permittedProviders: readonly string[];
  preferredTier: AiModelTier;
}

export interface PrivacyAwareProvider {
  providerId: string;
  location: AiProviderLocation;
  available: boolean;
  models: Readonly<Record<AiModelTier, string>>;
}

export interface PrivacyRouteDecision extends AiModelRoute {
  privacyMode: AiPrivacyMode;
  sensitivity: AiTaskSensitivity;
  includesRawUploads: boolean;
  providerLocation: AiProviderLocation;
}

const MODES: readonly AiPrivacyMode[] = ["Standard Cloud", "Private/Hybrid", "Local-Only"];
const SENSITIVITY: readonly AiTaskSensitivity[] = ["Public", "Internal", "Confidential", "Restricted"];

export function readAiPrivacyMode(project: Record<string, unknown>, env: Record<string, string | undefined> = process.env): AiPrivacyMode {
  const projectValue = project.aiPrivacyMode;
  const candidate = projectValue === undefined ? env.TEHQIQ_AI_PRIVACY_MODE?.trim() || "Standard Cloud" : projectValue;
  if (typeof candidate !== "string" || !MODES.includes(candidate as AiPrivacyMode)) throw new Error("Project AI privacy mode is invalid; Researcher input required.");
  return candidate as AiPrivacyMode;
}

export function readLocalProviderLocation(env: Record<string, string | undefined> = process.env): "Local" | "Private" | null {
  const candidate = env.TEHQIQ_LOCAL_LLM_LOCATION?.trim();
  if (!candidate) return null;
  if (candidate !== "Local" && candidate !== "Private") throw new Error("TEHQIQ_LOCAL_LLM_LOCATION must be Local or Private.");
  return candidate;
}

function permittedByMode(mode: AiPrivacyMode, task: AiTaskPrivacyDeclaration, provider: PrivacyAwareProvider): boolean {
  if (mode === "Local-Only") return provider.location === "Local";
  if (mode === "Private/Hybrid" && provider.location === "Cloud") {
    return !task.includesRawUploads && (task.sensitivity === "Public" || task.sensitivity === "Internal");
  }
  return true;
}

function locationOrder(mode: AiPrivacyMode): readonly AiProviderLocation[] {
  if (mode === "Local-Only") return ["Local"];
  if (mode === "Private/Hybrid") return ["Private", "Local", "Cloud"];
  return ["Cloud", "Private", "Local"];
}

export class PrivacyAwareTaskRouter {
  constructor(private readonly mode: AiPrivacyMode, private readonly providers: readonly PrivacyAwareProvider[]) {}

  route(baseRoute: AiModelRoute, task: AiTaskPrivacyDeclaration, taskMode: AiTaskMode): PrivacyRouteDecision {
    if (!SENSITIVITY.includes(task.sensitivity) || typeof task.includesRawUploads !== "boolean" || !task.permittedProviders.length || task.permittedProviders.some((id) => !id.trim()) || new Set(task.permittedProviders).size !== task.permittedProviders.length) {
      throw new Error("AI task privacy declaration is incomplete or invalid.");
    }
    if (task.preferredTier !== baseRoute.tier) throw new Error("AI task preferred tier does not match its registered model tier.");

    const permitted = new Set(task.permittedProviders);
    const eligible = this.providers.filter((provider) => provider.available && permitted.has(provider.providerId) && permittedByMode(this.mode, task, provider));
    const orderedLocations = locationOrder(this.mode);
    const selected = eligible.sort((left, right) => {
      const locationDifference = orderedLocations.indexOf(left.location) - orderedLocations.indexOf(right.location);
      if (locationDifference) return locationDifference;
      if (left.providerId === baseRoute.provider) return -1;
      if (right.providerId === baseRoute.provider) return 1;
      return left.providerId.localeCompare(right.providerId);
    })[0];
    if (!selected) throw new Error("Cannot Run Under Current Privacy Mode");
    return Object.freeze({
      provider: selected.providerId,
      model: selected.models[task.preferredTier],
      tier: task.preferredTier,
      taskMode,
      privacyMode: this.mode,
      sensitivity: task.sensitivity,
      includesRawUploads: task.includesRawUploads,
      providerLocation: selected.location,
    });
  }
}
