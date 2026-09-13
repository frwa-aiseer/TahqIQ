import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import type { ProjectRole } from "../types";
import { agentRegistry, type AgentId } from "./agentRegistry";
import type { AiModelRouter, AiTaskMode } from "./modelRouter";
import type { AiTaskPrivacyDeclaration, PrivacyAwareTaskRouter } from "./privacyTaskRouter";
import type { AiBudgetDeclaration, AiBudgetGuard } from "./aiBudgetGuard";

export interface AiGatewayActor {
  uid: string;
  email: string | null;
  role: ProjectRole;
}

export interface AiGatewayArtifactRef {
  id: string;
  type: string;
}

export interface AiGatewayUsage {
  promptTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AiGatewayLedgerEvent {
  id: string;
  traceId: string;
  timestamp: string;
  projectId: string;
  actorUid: string;
  actorEmail: string;
  actorRole: ProjectRole;
  agentId: AgentId;
  provider: string;
  model: string;
  promptVersion: string;
  responseSchemaId: string;
  inputArtifactIds: string[];
  outputArtifactId: string | null;
  status: "Succeeded" | "Failed";
  usage: AiGatewayUsage;
  failureCode?: string;
  privacyMode: string;
  sensitivity: string;
  includesRawUploads: boolean;
  pricingVersion: string;
  estimatedCostUsd: number;
  providerCalls: number;
  premiumReview: boolean;
  softBudgetReached: boolean;
  /** Complete AiLedger projection metadata. */
  feature?: string;
  section?: string;
  disposition?: "Proposed" | "Accepted" | "Edited & Accepted" | "Rejected";
}

export interface AiGatewayOutputArtifact<T> {
  id: string;
  projectId: string;
  agentId: AgentId;
  traceId: string;
  schemaId: string;
  status: "AI Suggested—Needs Researcher Review";
  createdAt: string;
  data: T;
}

export interface AiGatewayResult<T> {
  outputArtifact: AiGatewayOutputArtifact<T>;
  ledgerEvent: AiGatewayLedgerEvent;
  provider: string;
  model: string;
  promptVersion: string;
  traceId: string;
  usage: AiGatewayUsage;
  budget: { pricingVersion: string; estimatedCostUsd: number; providerCalls: number; premiumReview: boolean; softLimitReached: boolean };
}

export interface AiProviderRequest {
  model: string;
  contents: string;
  config: Record<string, unknown>;
}

export interface AiProviderResponse {
  text?: string;
  modelVersion?: string;
  usage?: Partial<AiGatewayUsage>;
}

export interface AiProvider {
  readonly id: string;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
}

export interface AiGatewayRequest<T> {
  projectId: string;
  actor: AiGatewayActor;
  agentId: AgentId;
  promptVersion: string;
  responseSchemaId: string;
  responseSchema: unknown;
  systemInstruction: string;
  contents: string;
  inputArtifacts: readonly AiGatewayArtifactRef[];
  taskMode?: AiTaskMode;
  controlledTools?: readonly { registryToolId: string; name: string; description: string; parameters: Record<string, unknown> }[];
  temperature?: number;
  privacy: AiTaskPrivacyDeclaration;
  budget: AiBudgetDeclaration;
  feature?: string;
  section?: string;
  validateResponse(text: string): { valid: true; value: T } | { valid: false; errors: string[] };
}

export type AiGatewayEventRecorder = (event: AiGatewayLedgerEvent, outputArtifact?: AiGatewayOutputArtifact<unknown>) => Promise<void>;

export class AiGatewayError extends Error {
  constructor(message: string, readonly code: string, readonly ledgerEvent?: AiGatewayLedgerEvent) {
    super(message);
  }
}

const emptyUsage = (): AiGatewayUsage => ({ promptTokens: null, outputTokens: null, totalTokens: null });

export class GeminiAiProvider implements AiProvider {
  readonly id = "gemini";
  private readonly client: GoogleGenAI;
  constructor(apiKey: string) {
    if (!apiKey.trim()) throw new Error("GEMINI_API_KEY environment variable is missing.");
    this.client = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
  }
  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const response = await this.client.models.generateContent(request as Parameters<GoogleGenAI["models"]["generateContent"]>[0]);
    return {
      text: response.text,
      modelVersion: response.modelVersion,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  }
}

export class AiGateway {
  constructor(
    private readonly router: AiModelRouter,
    private readonly providers: ReadonlyMap<string, AiProvider>,
    private readonly privacyRouter: PrivacyAwareTaskRouter,
    private readonly budgetGuard: AiBudgetGuard,
    private readonly recordEvent: AiGatewayEventRecorder,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly createTraceId: () => string = () => randomUUID(),
  ) {}

  async execute<T>(request: AiGatewayRequest<T>): Promise<AiGatewayResult<T>> {
    const contract = agentRegistry.get(request.agentId);
    if (!contract || !request.projectId.trim() || !request.actor.uid.trim() || !contract.permissions.roles.includes(request.actor.role)) {
      throw new AiGatewayError("AI gateway authorization failed.", "AUTHORIZATION_FAILED");
    }
    if (contract.modelTier === "Deterministic") throw new AiGatewayError("Deterministic agents cannot use a language-model provider.", "AGENT_PROVIDER_MISMATCH");
    if (!request.promptVersion.trim() || !request.responseSchemaId.trim() || !request.systemInstruction.trim() || !request.contents.trim()) throw new AiGatewayError("AI gateway request metadata is incomplete.", "INVALID_REQUEST");
    const feature = request.feature?.trim() || request.agentId;
    const section = request.section?.trim() || "Unspecified (researcher input required)";
    const ids = new Set<string>();
    for (const artifact of request.inputArtifacts) {
      if (!artifact.id.trim() || !contract.allowedInputArtifacts.includes(artifact.type) || ids.has(artifact.id)) throw new AiGatewayError("AI gateway input artifacts are missing, duplicated, or outside the agent contract.", "INVALID_ARTIFACTS");
      ids.add(artifact.id);
    }
    const traceId = this.createTraceId();
    const timestamp = this.now();
    const taskMode = request.taskMode || "Structured Output";
    const controlledTools = request.controlledTools || [];
    if (taskMode === "Controlled Tools") {
      if (!controlledTools.length || controlledTools.some((tool) => !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(tool.name) || !tool.description.trim() || !contract.allowedTools.includes(tool.registryToolId))) throw new AiGatewayError("Controlled tool task contains an undeclared or malformed function.", "INVALID_TOOLS");
    } else if (controlledTools.length) {
      throw new AiGatewayError("Structured-output tasks cannot attach function tools.", "INVALID_TOOLS");
    }
    const baseRoute = this.router.route(request.agentId, taskMode);
    let route;
    try {
      route = this.privacyRouter.route(baseRoute, request.privacy, taskMode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cannot Run Under Current Privacy Mode";
      throw new AiGatewayError(message, message === "Cannot Run Under Current Privacy Mode" ? "PRIVACY_MODE_BLOCKED" : "INVALID_PRIVACY_DECLARATION");
    }
    const provider = this.providers.get(route.provider);
    if (!provider) throw new AiGatewayError(`AI provider '${route.provider}' is Not Configured.`, "PROVIDER_NOT_CONFIGURED");
    let reservation;
    try {
      reservation = this.budgetGuard.authorize({ projectId: request.projectId, actorUid: request.actor.uid, provider: route.provider, model: route.model, tier: route.tier, declaration: request.budget });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI budget authorization failed.";
      const code = message.includes("hard budget") ? "HARD_BUDGET_EXCEEDED" : message.includes("loop limit") ? "AGENT_LOOP_LIMIT_REACHED" : message.includes("routing threshold") ? "BUDGET_ROUTING_THRESHOLD" : "BUDGET_CONFIGURATION_ERROR";
      throw new AiGatewayError(message, code);
    }
    let usage = emptyUsage();
    let providerCalls = 0;
    let budgetResult: ReturnType<AiBudgetGuard["settle"]> | undefined;
    try {
      let response: AiProviderResponse | undefined;
      let lastProviderError: unknown;
      for (let attempt = 0; attempt < reservation.maxProviderCalls; attempt += 1) {
        providerCalls += 1;
        try {
          response = await provider.generate({
            model: route.model,
            contents: request.contents,
            config: taskMode === "Controlled Tools"
              ? { systemInstruction: request.systemInstruction, temperature: request.temperature, maxOutputTokens: request.budget.maxOutputTokens, tools: [{ functionDeclarations: controlledTools.map(({ name, description, parameters }) => ({ name, description, parameters })) }], toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: controlledTools.map(({ name }) => name) } } }
              : { systemInstruction: request.systemInstruction, temperature: request.temperature, maxOutputTokens: request.budget.maxOutputTokens, responseMimeType: "application/json", responseSchema: request.responseSchema },
          });
          break;
        } catch (error) { lastProviderError = error; }
      }
      if (!response) throw lastProviderError || new Error("AI provider execution failed.");
      usage = { promptTokens: response.usage?.promptTokens ?? null, outputTokens: response.usage?.outputTokens ?? null, totalTokens: response.usage?.totalTokens ?? null };
      if (!response.text) throw new AiGatewayError("AI provider returned no output.", "EMPTY_PROVIDER_OUTPUT");
      const validated = request.validateResponse(response.text);
      if (validated.valid === false) throw new AiGatewayError(`AI response validation failed: ${validated.errors.join("; ")}`, "SCHEMA_VALIDATION_FAILED");
      const budget = this.budgetGuard.settle(reservation, { inputTokens: usage.promptTokens, outputTokens: usage.outputTokens }, providerCalls);
      budgetResult = budget;
      const outputArtifact: AiGatewayOutputArtifact<T> = {
        id: `ai-output-${traceId}`, projectId: request.projectId, agentId: request.agentId, traceId,
        schemaId: request.responseSchemaId, status: "AI Suggested—Needs Researcher Review", createdAt: timestamp, data: validated.value,
      };
      const ledgerEvent: AiGatewayLedgerEvent = {
        id: `ai-ledger-${traceId}`, traceId, timestamp, projectId: request.projectId, actorUid: request.actor.uid,
        actorEmail: request.actor.email || "Not available", actorRole: request.actor.role, agentId: request.agentId,
        provider: provider.id, model: response.modelVersion || route.model, promptVersion: request.promptVersion,
        responseSchemaId: request.responseSchemaId, inputArtifactIds: [...ids], outputArtifactId: outputArtifact.id,
        status: "Succeeded", usage,
        privacyMode: route.privacyMode, sensitivity: route.sensitivity, includesRawUploads: route.includesRawUploads,
        pricingVersion: budget.pricingVersion, estimatedCostUsd: budget.estimatedCostUsd, providerCalls: budget.providerCalls,
        premiumReview: reservation.premiumReview, softBudgetReached: budget.softLimitReached,
        feature, section, disposition: "Proposed",
      };
      await this.recordEvent(ledgerEvent, outputArtifact);
      return { outputArtifact, ledgerEvent, provider: ledgerEvent.provider, model: ledgerEvent.model, promptVersion: request.promptVersion, traceId, usage, budget };
    } catch (error) {
      const budget = budgetResult || this.budgetGuard.settle(reservation, { inputTokens: usage.promptTokens, outputTokens: usage.outputTokens }, providerCalls);
      const gatewayError = error instanceof AiGatewayError ? error : new AiGatewayError("AI provider execution failed.", "PROVIDER_FAILURE");
      const ledgerEvent: AiGatewayLedgerEvent = {
        id: `ai-ledger-${traceId}`, traceId, timestamp, projectId: request.projectId, actorUid: request.actor.uid,
        actorEmail: request.actor.email || "Not available", actorRole: request.actor.role, agentId: request.agentId,
        provider: provider.id, model: route.model, promptVersion: request.promptVersion, responseSchemaId: request.responseSchemaId,
        inputArtifactIds: [...ids], outputArtifactId: null, status: "Failed", usage, failureCode: gatewayError.code,
        privacyMode: route.privacyMode, sensitivity: route.sensitivity, includesRawUploads: route.includesRawUploads,
        pricingVersion: budget.pricingVersion, estimatedCostUsd: budget.estimatedCostUsd, providerCalls: budget.providerCalls,
        premiumReview: reservation.premiumReview, softBudgetReached: budget.softLimitReached,
        feature, section, disposition: "Rejected",
      };
      try { await this.recordEvent(ledgerEvent); } catch { throw new AiGatewayError("AI gateway failure audit could not be recorded.", "LEDGER_WRITE_FAILED", ledgerEvent); }
      throw new AiGatewayError(gatewayError.message, gatewayError.code, ledgerEvent);
    }
  }
}
