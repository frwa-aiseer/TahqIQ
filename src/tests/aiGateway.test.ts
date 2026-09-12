import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AiGateway, AiGatewayError, type AiGatewayLedgerEvent, type AiProvider } from "../server/aiGateway";
import { ConfigurableModelRouter } from "../server/modelRouter";
import { PrivacyAwareTaskRouter } from "../server/privacyTaskRouter";
import { AiBudgetGuard, InMemoryAiBudgetStore, type AiBudgetPolicy } from "../server/aiBudgetGuard";

const validText = JSON.stringify({ summary: "Proposal", proposals: [], missingInformationFlags: [], evidenceIds: [] });
const actor = { uid: "owner-1", email: "owner@example.org", role: "Owner" as const };
const request = {
  projectId: "project-1", actor, agentId: "research-intake" as const, promptVersion: "prompt-v1", responseSchemaId: "Intake-v1",
  responseSchema: { type: "OBJECT" }, systemInstruction: "Use supplied facts only.", contents: "Research description.",
  inputArtifacts: [{ id: "description-1", type: "researchDescription" }],
  privacy: { sensitivity: "Internal" as const, includesRawUploads: false, permittedProviders: ["gemini"], preferredTier: "FAST" as const },
  budget: { estimatedInputTokens: 100, maxOutputTokens: 100, loopId: "request-1", loopIteration: 1, premiumReview: false },
  validateResponse: (text: string) => text === validText ? { valid: true as const, value: JSON.parse(text) } : { valid: false as const, errors: ["invalid"] },
};
const provider = (generate: AiProvider["generate"]): AiProvider => ({ id: "gemini", generate });
const budgetPolicy: AiBudgetPolicy = { softLimitUsd: 10, hardLimitUsd: 20, maxProviderCallsPerRequest: 1, maxAgentLoopIterations: 3, minimumRemainingUsdByTier: {} };
const budgetGuard = (policy = budgetPolicy) => new AiBudgetGuard({ version: "test-v1", effectiveAt: "2026-01-01T00:00:00.000Z", entries: [
  { provider: "gemini", model: "model-main", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
  { provider: "gemini", model: "model-advanced", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
  { provider: "gemini", model: "model-review", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
] }, policy, new InMemoryAiBudgetStore(), () => "reservation-1");
const gateway = (aiProvider: AiProvider, events: AiGatewayLedgerEvent[], recorder?: (event: AiGatewayLedgerEvent, outputArtifact?: unknown) => Promise<void>) => new AiGateway(
  new ConfigurableModelRouter({ provider: "gemini", fast: "model-main", main: "model-advanced", review: "model-review" }), new Map([["gemini", aiProvider]]),
  new PrivacyAwareTaskRouter("Standard Cloud", [{ providerId: "gemini", location: "Cloud", available: true, models: { FAST: "model-main", MAIN: "model-advanced", REVIEW: "model-review" } }]),
  budgetGuard(),
  recorder || (async (event) => { events.push(event); }),
  () => "2026-09-10T12:00:00.000Z", () => "trace-1",
);

describe("central AiGateway", () => {
  it("is the only production TypeScript boundary allowed to invoke the model provider SDK", () => {
    const root = process.cwd();
    const productionFiles = [path.join(root, "server.ts")];
    const visit = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(target);
        else if (/\.tsx?$/.test(entry.name) && !target.includes(`${path.sep}tests${path.sep}`) && !target.endsWith(`${path.sep}server${path.sep}aiGateway.ts`)) productionFiles.push(target);
      }
    };
    visit(path.join(root, "src"));
    const bypasses = productionFiles.filter((file) => /models\.generateContent|new\s+GoogleGenAI/.test(fs.readFileSync(file, "utf8")));
    expect(bypasses).toEqual([]);
    const gatewaySource = fs.readFileSync(path.join(root, "src/server/aiGateway.ts"), "utf8");
    expect(gatewaySource).toMatch(/this\.client\.models\.generateContent/);
  });

  it("returns a validated review-pending output with routing, schema, usage, trace, and durable ledger metadata", async () => {
    const events: AiGatewayLedgerEvent[] = [];
    const persistedOutputs: unknown[] = [];
    const result = await gateway(provider(async ({ model, config }) => {
      expect(model).toBe("model-main");
      expect(config).toMatchObject({ responseMimeType: "application/json", responseSchema: { type: "OBJECT" } });
      return { text: validText, modelVersion: "model-main-001", usage: { promptTokens: 10, outputTokens: 5, totalTokens: 15 } };
    }), events, async (event, outputArtifact) => { events.push(event); if (outputArtifact) persistedOutputs.push(outputArtifact); }).execute(request);
    expect(result).toMatchObject({ provider: "gemini", model: "model-main-001", promptVersion: "prompt-v1", traceId: "trace-1", usage: { promptTokens: 10, outputTokens: 5, totalTokens: 15 } });
    expect(result.outputArtifact).toMatchObject({ id: "ai-output-trace-1", schemaId: "Intake-v1", status: "AI Suggested—Needs Researcher Review" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ status: "Succeeded", agentId: "research-intake", inputArtifactIds: ["description-1"], outputArtifactId: "ai-output-trace-1" });
    expect(persistedOutputs).toEqual([result.outputArtifact]);
  });

  it("rejects unauthorized roles, deterministic agents, and undeclared or duplicate artifacts before provider use", async () => {
    let calls = 0;
    const instance = gateway(provider(async () => { calls += 1; return { text: validText }; }), []);
    await expect(instance.execute({ ...request, actor: { ...actor, role: "Viewer" } })).rejects.toMatchObject({ code: "AUTHORIZATION_FAILED" });
    await expect(instance.execute({ ...request, agentId: "export" })).rejects.toMatchObject({ code: "AGENT_PROVIDER_MISMATCH" });
    await expect(instance.execute({ ...request, inputArtifacts: [{ id: "raw-1", type: "rawDataset" }] })).rejects.toMatchObject({ code: "INVALID_ARTIFACTS" });
    await expect(instance.execute({ ...request, inputArtifacts: [{ id: "same", type: "researchDescription" }, { id: "same", type: "statedClassification" }] })).rejects.toMatchObject({ code: "INVALID_ARTIFACTS" });
    expect(calls).toBe(0);
  });

  it("enforces structured schemas and controlled function declarations by task mode", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const instance = gateway(provider(async ({ config }) => { calls.push(config); return { text: validText }; }), []);
    await instance.execute(request);
    expect(calls[0]).toMatchObject({ responseMimeType: "application/json", responseSchema: { type: "OBJECT" } });
    expect(calls[0]).not.toHaveProperty("tools");

    await expect(instance.execute({ ...request, controlledTools: [{ registryToolId: "structured-language-model", name: "language_model", description: "Not a function task", parameters: {} }] })).rejects.toMatchObject({ code: "INVALID_TOOLS" });
    await expect(instance.execute({ ...request, taskMode: "Controlled Tools", controlledTools: [{ registryToolId: "undeclared-tool", name: "unsafe_tool", description: "Unsafe", parameters: {} }] })).rejects.toMatchObject({ code: "INVALID_TOOLS" });

    await instance.execute({ ...request, agentId: "section-writer", inputArtifacts: [{ id: "section-1", type: "sectionRequest" }], privacy: { ...request.privacy, preferredTier: "MAIN" }, taskMode: "Controlled Tools", controlledTools: [{ registryToolId: "citation-processor", name: "citation_processor", description: "Resolve supplied stable citation IDs only.", parameters: { type: "object" } }] });
    expect(calls[1]).toMatchObject({ tools: [{ functionDeclarations: [{ name: "citation_processor" }] }], toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["citation_processor"] } } });
    expect(calls[1]).not.toHaveProperty("responseSchema");
  });

  it("records schema-validation failure and never creates a successful output artifact", async () => {
    const events: AiGatewayLedgerEvent[] = [];
    const outputs: unknown[] = [];
    await expect(gateway(provider(async () => ({ text: "malformed", usage: { totalTokens: 4 } })), events, async (event, output) => { events.push(event); if (output) outputs.push(output); }).execute(request)).rejects.toMatchObject({
      code: "SCHEMA_VALIDATION_FAILED", ledgerEvent: { status: "Failed", outputArtifactId: null, traceId: "trace-1", usage: { totalTokens: 4 } },
    });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("Failed");
    expect(outputs).toEqual([]);
  });

  it("records provider failure without a successful output", async () => {
    const events: AiGatewayLedgerEvent[] = [];
    await expect(gateway(provider(async () => { throw new Error("provider secret"); }), events).execute(request)).rejects.toMatchObject({ code: "PROVIDER_FAILURE", ledgerEvent: { outputArtifactId: null, failureCode: "PROVIDER_FAILURE" } });
    expect(events[0].status).toBe("Failed");
  });

  it("fails the request if a success ledger event cannot be durably recorded", async () => {
    const instance = gateway(provider(async () => ({ text: validText })), [], async () => { throw new Error("write unavailable"); });
    await expect(instance.execute(request)).rejects.toMatchObject({ code: "LEDGER_WRITE_FAILED" });
  });

  it("keeps provider failures sanitized while retaining explicit failure codes", async () => {
    const events: AiGatewayLedgerEvent[] = [];
    try {
      await gateway(provider(async () => { throw new Error("API key secret"); }), events).execute(request);
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AiGatewayError);
      expect((error as Error).message).not.toContain("API key secret");
    }
  });

  it("blocks provider execution when the privacy mode cannot be satisfied", async () => {
    let calls = 0;
    const cloud = provider(async () => { calls += 1; return { text: validText }; });
    const instance = new AiGateway(
      new ConfigurableModelRouter({ provider: "gemini", fast: "cloud", main: "cloud", review: "cloud" }),
      new Map([["gemini", cloud]]),
      new PrivacyAwareTaskRouter("Local-Only", [{ providerId: "gemini", location: "Cloud", available: true, models: { FAST: "cloud", MAIN: "cloud", REVIEW: "cloud" } }]),
      budgetGuard(),
      async () => undefined,
    );
    await expect(instance.execute(request)).rejects.toMatchObject({ code: "PRIVACY_MODE_BLOCKED", message: "Cannot Run Under Current Privacy Mode" });
    expect(calls).toBe(0);
  });

  it("bounds provider retries and records the exact provider-call count", async () => {
    let calls = 0;
    const retryingProvider = provider(async () => {
      calls += 1;
      if (calls === 1) throw new Error("temporary failure");
      return { text: validText, usage: { promptTokens: 8, outputTokens: 4, totalTokens: 12 } };
    });
    const events: AiGatewayLedgerEvent[] = [];
    const instance = new AiGateway(
      new ConfigurableModelRouter({ provider: "gemini", fast: "model-main", main: "model-advanced", review: "model-review" }),
      new Map([["gemini", retryingProvider]]),
      new PrivacyAwareTaskRouter("Standard Cloud", [{ providerId: "gemini", location: "Cloud", available: true, models: { FAST: "model-main", MAIN: "model-advanced", REVIEW: "model-review" } }]),
      budgetGuard({ ...budgetPolicy, maxProviderCallsPerRequest: 2 }),
      async (event) => { events.push(event); },
    );
    const result = await instance.execute({ ...request, budget: { ...request.budget, loopId: "retry-request" } });
    expect(calls).toBe(2);
    expect(result.budget).toMatchObject({ providerCalls: 2, pricingVersion: "test-v1" });
    expect(events[0]).toMatchObject({ providerCalls: 2, pricingVersion: "test-v1", usage: { promptTokens: 8, outputTokens: 4, totalTokens: 12 } });
  });
});
