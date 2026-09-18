import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { AiGatewayLedgerEvent, AiProvider } from "../server/aiGateway";
import { AiGateway } from "../server/aiGateway";
import { AiBudgetGuard, InMemoryAiBudgetStore, type AiBudgetPolicy } from "../server/aiBudgetGuard";
import { ConfigurableModelRouter } from "../server/modelRouter";
import { PrivacyAwareTaskRouter } from "../server/privacyTaskRouter";
import { benchmarkEvidenceRetrieval, retrieveEvidence } from "../lib/evidenceRetrievalService";
import { runEvidenceExtractionAgent, unavailableEvidenceField } from "../lib/evidenceExtractionAgent";
import { routeDocumentIngestion } from "../lib/documentIngestionRouter";
import { executeRegisteredAnalysisMethod } from "../lib/statsEngine";
import { ProjectFileUploadError, uploadProjectFile } from "../lib/storageService";
import type { AnalysisPlan, DatasetRecord, FullTextChunk } from "../types";

const storageMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));
const firestoreMocks = vi.hoisted(() => ({ doc: vi.fn(), setDoc: vi.fn() }));

vi.mock("firebase/storage", () => storageMocks);
vi.mock("firebase/firestore", () => firestoreMocks);
vi.mock("../lib/firebase", () => ({
  firebaseStatus: "Configured",
  getFirebaseServices: () => ({ storage: {}, db: {} }),
}));

const reportPath = path.resolve(process.cwd(), "docs/TQ-VSC-092_PERFORMANCE_FAILURE_REPORT.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as {
  promptId: string;
  status: string;
  scenarios: Array<{ id: string; expectedStatus: string }>;
};

const sourceChunk = (index: number, text = "observed evidence about the research method") : FullTextChunk => ({
  chunkId: `chunk-${index}`,
  projectId: "performance-fixture",
  sourceId: "source-performance",
  documentHash: "a".repeat(64),
  documentVersion: "v1",
  chunkIndex: index,
  text,
  surroundingContext: { sourceBlockId: `block-${index}`, sourceLocation: `page:${(index % 10) + 1}`, characterStart: 0, characterEnd: text.length },
  provenance: { ingestionJobId: "job-performance", parserId: "fixture-parser", parserVersion: "1.0", extractedBlockId: `block-${index}` },
  createdAt: "2026-09-17T00:00:00.000Z",
  isDemo: false,
  isSynthetic: true,
});

const policy = (overrides: Partial<AiBudgetPolicy> = {}): AiBudgetPolicy => ({
  softLimitUsd: 10,
  hardLimitUsd: 20,
  maxProviderCallsPerRequest: 3,
  maxAgentLoopIterations: 3,
  minimumRemainingUsdByTier: {},
  ...overrides,
});

const pricing = {
  version: "tq092-test-pricing-v1",
  effectiveAt: "2026-09-17T00:00:00.000Z",
  entries: [
    { provider: "gemini", model: "fast-model", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
    { provider: "gemini", model: "main-model", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
    { provider: "gemini", model: "review-model", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
  ],
} as const;

const validText = JSON.stringify({ summary: "Draft proposal", proposals: [], missingInformationFlags: [], evidenceIds: [] });
const actor = { uid: "researcher-performance", email: "researcher@example.org", role: "Owner" as const };

function gatewayRequest(overrides: Record<string, unknown> = {}) {
  return {
    projectId: "performance-project",
    actor,
    agentId: "research-intake" as const,
    promptVersion: "tq092-performance-v1",
    responseSchemaId: "TQ092-Response-v1",
    responseSchema: { type: "OBJECT" },
    systemInstruction: "Use supplied facts only and return a proposal.",
    contents: "Researcher supplied project description.",
    inputArtifacts: [{ id: "description-1", type: "researchDescription" }],
    privacy: { sensitivity: "Internal" as const, includesRawUploads: false, permittedProviders: ["gemini"], preferredTier: "FAST" as const },
    budget: { estimatedInputTokens: 100, maxOutputTokens: 100, loopId: `tq092-${Date.now()}`, loopIteration: 1, premiumReview: false },
    validateResponse: (text: string) => text === validText ? { valid: true as const, value: JSON.parse(text) } : { valid: false as const, errors: ["invalid structured output"] },
    ...overrides,
  };
}

function createGateway(
  generate: AiProvider["generate"],
  events: AiGatewayLedgerEvent[],
  budgetPolicy: AiBudgetPolicy = policy(),
) {
  return new AiGateway(
    new ConfigurableModelRouter({ provider: "gemini", fast: "fast-model", main: "main-model", review: "review-model" }),
    new Map([["gemini", { id: "gemini", generate }]]),
    new PrivacyAwareTaskRouter("Standard Cloud", [{ providerId: "gemini", location: "Cloud", available: true, models: { FAST: "fast-model", MAIN: "main-model", REVIEW: "review-model" } }]),
    new AiBudgetGuard(pricing, budgetPolicy, new InMemoryAiBudgetStore(), () => "tq092-reservation"),
    async (event) => { events.push(event); },
    () => "2026-09-17T00:00:00.000Z",
    () => `tq092-trace-${events.length + 1}`,
  );
}

function analysisDataset(rows: Record<string, unknown>[]): DatasetRecord {
  return {
    id: "analysis-performance-fixture",
    filename: "analysis-fixture.csv",
    fileHash: "b".repeat(64),
    uploadDate: "2026-09-17T00:00:00.000Z",
    recordCount: rows.length,
    variableCount: Object.keys(rows[0] || {}).length,
    variables: Object.keys(rows[0] || {}).map((name) => ({ name, type: "Numeric", missingCount: 0, uniqueValues: rows.length })),
    missingnessPercent: 0,
    isAnonymizedConfirmed: true,
    state: "Approved for Analysis",
    rawPreview: rows,
    isDemo: false,
    isSynthetic: true,
  };
}

function analysisPlan(method: string, outcome: string, predictors: string[]): AnalysisPlan {
  return {
    id: `plan-${method}`,
    title: method,
    researchQuestionId: "rq-performance-fixture",
    outcomeVariable: outcome,
    predictorVariables: predictors,
    statisticalMethod: method,
    assumptions: [],
    effectSizeMeasure: "Method-specific",
    significanceThreshold: 0.05,
    missingDataStrategy: "Complete cases",
    status: "Approved",
    state: "Approved",
    isPreregistered: false,
  };
}

describe("TQ-VSC-092 performance and failure safety", () => {
  it("keeps large retrieval workloads bounded and provenance-preserving", () => {
    const chunks = Array.from({ length: 2_000 }, (_, index) => sourceChunk(index, index % 17 === 0 ? "observed evidence about the research method and outcome" : "unrelated source text"));
    const started = performance.now();
    const results = retrieveEvidence("observed evidence research method", chunks, [], {}, 7);
    const benchmark = benchmarkEvidenceRetrieval([{ id: "large-library", query: "observed evidence research method", relevantChunkIds: chunks.filter((_, index) => index % 17 === 0).slice(0, 7).map((chunk) => chunk.chunkId) }], chunks, 7);
    const elapsedMs = performance.now() - started;

    expect(results).toHaveLength(7);
    expect(results.every((result) => result.documentHash && result.documentVersion && result.sourceId)).toBe(true);
    expect(benchmark).toMatchObject({ cases: 1, k: 7, provenanceRetentionRate: 1 });
    expect(elapsedMs).toBeLessThan(5_000);
  });

  it("accepts the maximum 500 chunks once, does not duplicate agent calls, and keeps output review-gated", async () => {
    const chunks = Array.from({ length: 500 }, (_, index) => sourceChunk(index, index === 249 ? "The observed result was recorded in the supplied document." : "background source text"));
    let calls = 0;
    const output = await runEvidenceExtractionAgent(
      { projectId: "performance-fixture", questionOrClaim: "What observed result was recorded?", chunks },
      {
        extractorId: "tq092-fixture-extractor",
        propose: async () => {
          calls += 1;
          return {
            proposition: "The observed result was recorded in the supplied document.",
            passages: [{ chunkId: "chunk-249", exactPassage: "The observed result was recorded in the supplied document." }],
            context: unavailableEvidenceField(), population: unavailableEvidenceField(), method: unavailableEvidenceField(),
            result: { status: "Available", text: "The observed result was recorded in the supplied document.", chunkIds: ["chunk-249"] },
            limitations: unavailableEvidenceField(), relationship: "Unclear", confidence: 0.5,
          };
        },
        now: () => "2026-09-17T00:00:00.000Z",
      },
    );
    expect(calls).toBe(1);
    expect(output.evidenceRecords).toHaveLength(1);
    expect(output.reviewState).toBe("Needs Researcher Review");
    await expect(runEvidenceExtractionAgent(
      { projectId: "performance-fixture", questionOrClaim: "Question", chunks: [...chunks, sourceChunk(500)] },
      { extractorId: "must-not-run", propose: async () => { throw new Error("duplicate extraction call"); } },
    )).rejects.toThrow("One to 500 supplied full-text chunks are required");
  });

  it("bounds permanent provider failures and records no false-success artifact", async () => {
    let calls = 0;
    const events: AiGatewayLedgerEvent[] = [];
    const gateway = createGateway(async () => { calls += 1; throw new Error("provider unavailable"); }, events);

    await expect(gateway.execute(gatewayRequest())).rejects.toMatchObject({
      code: "PROVIDER_FAILURE",
      ledgerEvent: { status: "Failed", outputArtifactId: null, providerCalls: 3 },
    });
    expect(calls).toBe(3);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ status: "Failed", providerCalls: 3, outputArtifactId: null });
  });

  it("blocks an expensive review route at its budget threshold before provider use", async () => {
    let calls = 0;
    const events: AiGatewayLedgerEvent[] = [];
    const gateway = createGateway(async () => { calls += 1; return { text: validText }; }, events, policy({ minimumRemainingUsdByTier: { REVIEW: 21 } }));
    const request = gatewayRequest({
      agentId: "peer-review" as const,
      inputArtifacts: [{ id: "manuscript-1", type: "manuscriptSections" }],
      privacy: { sensitivity: "Internal" as const, includesRawUploads: false, permittedProviders: ["gemini"], preferredTier: "REVIEW" as const },
    });

    await expect(gateway.execute(request)).rejects.toMatchObject({ code: "BUDGET_ROUTING_THRESHOLD" });
    expect(calls).toBe(0);
    expect(events).toHaveLength(0);
  });

  it("keeps parser, storage, and analysis failures explicit", async () => {
    const ingestion = await routeDocumentIngestion(
      { projectId: "performance-fixture", filename: "source.pdf", mimeType: "application/pdf", content: "bytes", createdByUid: "researcher", isDemo: false, isSynthetic: true },
      { PDF: async () => { throw new Error("parser service unavailable"); } },
      () => "2026-09-17T00:00:00.000Z",
    );
    expect(ingestion.status).toBe("Failed");
    expect(ingestion.errors).toEqual(["parser service unavailable"]);

    vi.clearAllMocks();
    storageMocks.ref.mockReturnValue({ fullPath: "requested-path" });
    storageMocks.uploadBytes.mockRejectedValue(new Error("storage unavailable"));
    await expect(uploadProjectFile("performance-fixture", new File(["bytes"], "source.pdf", { type: "application/pdf" }), "researcher")).rejects.toMatchObject({
      name: "ProjectFileUploadError",
      persistenceStatus: "Local / Unpersisted",
      researchFileRecordCreated: false,
    } satisfies Partial<ProjectFileUploadError>);
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();

    const failedAnalysis = executeRegisteredAnalysisMethod(
      "linear-regression",
      { dataset: analysisDataset([1, 2, 3, 4].map((x) => ({ x, duplicate: x * 2, y: x }))), plan: analysisPlan("linear-regression", "y", ["x", "duplicate"]) },
    );
    expect(failedAnalysis.executionStatus).toBe("Failed");
    expect(failedAnalysis.pValues).toEqual([]);
    expect(failedAnalysis.effectSizes).toEqual([]);
    expect(failedAnalysis.numericResults.reason).toMatch(/singular/i);
  });

  it("keeps the machine-readable report aligned with this prompt and its safe outcomes", () => {
    expect(report).toMatchObject({ promptId: "TQ-VSC-092", status: "PASS" });
    expect(report.scenarios.length).toBeGreaterThanOrEqual(5);
    expect(report.scenarios.every((scenario) => scenario.expectedStatus === "safe")).toBe(true);
  });
});
