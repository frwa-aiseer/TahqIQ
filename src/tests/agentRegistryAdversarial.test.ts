import { describe, expect, it } from "vitest";
import { agentRegistry } from "../server/agentRegistry";
describe("AgentRegistry boundary contracts", () => {
  it("prevents cross-domain privilege escalation", () => {
    const writer = agentRegistry.get("section-writer")!;
    const results = agentRegistry.get("results-interpretation-writing")!;
    const retrieval = agentRegistry.get("literature-retrieval")!;
    const reviewer = agentRegistry.get("peer-review")!;
    const editor = agentRegistry.get("manuscript-editor")!;
    const exporter = agentRegistry.get("export")!;
    expect(writer.allowedInputArtifacts).not.toContain("sourceWrite");
    expect(results.allowedTools).not.toContain("analysis-executor");
    expect(retrieval.allowedInputArtifacts).not.toContain("manuscriptWrite");
    expect(reviewer.prohibitedBehavior.join(" ")).toMatch(/Self-approve/);
    expect(editor.prohibitedBehavior.join(" ")).toMatch(/Change empirical meaning/);
    expect(exporter.prohibitedBehavior.join(" ")).toMatch(/Export when readiness/);
  });
});
