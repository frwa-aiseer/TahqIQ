import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { generateLedgerDisclosureStatement } from "../lib/aiValidationService";
import { evaluateExportGateChecks } from "../lib/complianceEngine";
import type { AiLedgerEvent } from "../types";

const event: AiLedgerEvent = {
  id: "event-1",
  timestamp: "2026-08-22T00:00:00.000Z",
  userEmail: "researcher@example.org",
  featureUsed: "Recorded drafting action",
  manuscriptSection: "Methods",
  model: "recorded-model",
  promptVersion: "recorded-version",
  inputSourcesUsed: [],
  generatedSummary: "Recorded proposal",
  userDecision: "Edited",
};

describe("TQ-VSC-007 AI ledger integrity", () => {
  it("never treats an empty unassessed ledger as proof of no AI use", () => {
    const disclosure = generateLedgerDisclosureStatement([], "Project");
    expect(disclosure).toContain("Unknown/Incomplete");
    expect(disclosure).toContain("empty ledger is not proof");
    expect(disclosure).not.toContain("No AI assistance tools were utilized");
  });

  it("does not accept a claimed status without attributable assessment metadata", () => {
    const disclosure = generateLedgerDisclosureStatement([], "Project", { status: "No AI Use Confirmed" });
    expect(disclosure).toContain("Unknown/Incomplete");
  });

  it("allows an explicit no-use statement only after attributable researcher confirmation", () => {
    const disclosure = generateLedgerDisclosureStatement([], "Project", {
      status: "No AI Use Confirmed",
      assessedAt: "2026-08-22T00:00:00.000Z",
      assessedByUid: "researcher-1",
      rationale: "Researcher reviewed the complete project history and confirmed no AI use.",
    });
    expect(disclosure).toContain("An attributable researcher assessment states that no AI assistance was used");
  });

  it("labels recorded events incomplete when ledger completeness is unassessed", () => {
    const disclosure = generateLedgerDisclosureStatement([event], "Project");
    expect(disclosure).toContain("Total Material AI Calls Logged: 1");
    expect(disclosure).toContain("**Ledger Completeness:** Unknown");
    expect(disclosure).toContain("must not be treated as a complete history");
  });

  it("blocks submission disclosure when an empty ledger has unknown history", () => {
    const project = createEmptyProject();
    const disclosureGate = evaluateExportGateChecks(project).find((gate) => gate.checkId === "gate-ai-disclosure");
    expect(disclosureGate?.status).toBe("Blocker");
    expect(disclosureGate?.message).toContain("emptiness is not proof");
  });
});
