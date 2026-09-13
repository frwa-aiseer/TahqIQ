import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { generateJatsXml, validateJatsXml } from "../lib/exportUtils";
describe("truthful JATS validation", () => {
  it("labels internal checks as structural, not DTD validation", () => {
    const result = validateJatsXml(generateJatsXml(createEmptyProject()));
    expect(result.status).toBe("Structural Check Passed");
    expect(result.label).not.toMatch(/NLM Standard|100%|Validated JATS/);
  });
});
