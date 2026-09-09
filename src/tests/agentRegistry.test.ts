import { describe, expect, it } from "vitest";
import { AgentRegistry, agentRegistry, type AgentContract, type AgentId } from "../server/agentRegistry";

const EXPECTED_IDS: AgentId[] = [
  "research-intake", "outlet-matching", "search-planning", "literature-retrieval", "screening",
  "evidence-extraction", "literature-synthesis", "contradiction-detection", "research-gap",
  "question-hypothesis", "methodology-design", "analysis-planning", "results-interpretation-writing",
  "section-writer", "peer-review", "compliance", "integrity-review", "manuscript-editor", "export",
];

describe("server-controlled AgentRegistry", () => {
  it("registers every required agent family once with complete typed contracts", () => {
    const contracts = agentRegistry.list();
    expect(contracts.map(({ id }) => id).sort()).toEqual([...EXPECTED_IDS].sort());
    expect(new Set(contracts.map(({ id }) => id)).size).toBe(contracts.length);
    for (const contract of contracts) {
      expect(contract.purpose).not.toBe("");
      expect(contract.allowedInputArtifacts.length).toBeGreaterThan(0);
      expect(contract.allowedTools.length).toBeGreaterThan(0);
      expect(contract.outputSchema.requiredFields.length).toBeGreaterThan(0);
      expect(contract.requiredWorkflowStates.length).toBeGreaterThan(0);
      expect(contract.nextStates.length).toBeGreaterThan(0);
      expect(contract.humanReviewRequirement).toMatch(/Required|researcher review/);
      expect(contract.permissions.serverOnly).toBe(true);
      expect(contract.permissions.roles.length).toBeGreaterThan(0);
      expect(contract.prohibitedBehavior.join(" ")).toMatch(/Fabricate/);
      expect(contract.prohibitedBehavior.join(" ")).toMatch(/Self-approve/);
    }
  });

  it("exposes only the bounded intake contract to frontend writers", () => {
    const exposed = agentRegistry.list().filter(({ permissions }) => permissions.frontendInvocation === "Allowed");
    expect(exposed.map(({ id }) => id)).toEqual(["research-intake"]);
    expect(agentRegistry.authorizeFrontend("research-intake", "Owner", ["researchDescription", "statedClassification"]).id).toBe("research-intake");
    expect(agentRegistry.authorizeFrontend("research-intake", "Co-author", ["researchDescription"]).id).toBe("research-intake");
  });

  it("rejects arbitrary IDs, unauthorized roles, prohibited agents, and undeclared inputs", () => {
    expect(() => agentRegistry.authorizeFrontend("arbitrary-agent", "Owner", [])).toThrow(/not registered/);
    expect(() => agentRegistry.authorizeFrontend("question-hypothesis", "Owner", ["researchCanvas"])).toThrow(/cannot be invoked/);
    expect(() => agentRegistry.authorizeFrontend("research-intake", "Viewer", ["researchDescription"])).toThrow(/cannot invoke/);
    expect(() => agentRegistry.authorizeFrontend("research-intake", "Owner", ["rawDataset"])).toThrow(/not allowed/);
  });

  it("rejects duplicate IDs and incomplete contracts", () => {
    const valid = agentRegistry.get("research-intake")!;
    expect(() => new AgentRegistry([valid, valid])).toThrow(/Duplicate agent ID/);
    expect(() => new AgentRegistry([{ ...valid, purpose: "" } as AgentContract])).toThrow(/incomplete contract/);
  });

  it("returns immutable contracts so clients cannot widen permissions", () => {
    const intake = agentRegistry.get("research-intake")!;
    expect(Object.isFrozen(intake)).toBe(true);
    expect(Object.isFrozen(intake.permissions)).toBe(true);
    expect(Object.isFrozen(intake.allowedInputArtifacts)).toBe(true);
  });
});
