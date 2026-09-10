import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AiGateway, AiGatewayError, StaticAiModelRouter, type AiGatewayLedgerEvent, type AiProvider } from "../server/aiGateway";

const validText = JSON.stringify({ summary: "Proposal", proposals: [], missingInformationFlags: [], evidenceIds: [] });
const actor = { uid: "owner-1", email: "owner@example.org", role: "Owner" as const };
const request = {
  projectId: "project-1", actor, agentId: "research-intake" as const, promptVersion: "prompt-v1", responseSchemaId: "Intake-v1",
  responseSchema: { type: "OBJECT" }, systemInstruction: "Use supplied facts only.", contents: "Research description.",
  inputArtifacts: [{ id: "description-1", type: "researchDescription" }],
  validateResponse: (text: string) => text === validText ? { valid: true as const, value: JSON.parse(text) } : { valid: false as const, errors: ["invalid"] },
};
const provider = (generate: AiProvider["generate"]): AiProvider => ({ id: "gemini", generate });
const gateway = (aiProvider: AiProvider, events: AiGatewayLedgerEvent[], recorder?: (event: AiGatewayLedgerEvent, outputArtifact?: unknown) => Promise<void>) => new AiGateway(
  new StaticAiModelRouter("gemini", "model-main"), new Map([["gemini", aiProvider]]), recorder || (async (event) => { events.push(event); }),
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
});
