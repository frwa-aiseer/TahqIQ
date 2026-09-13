import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { generateBibTeX, generateCslJson, generateJatsXml } from "../lib/exportUtils";
describe("export truthfulness", () => {
  it("does not invent publication years when metadata is missing", () => {
    const project = createEmptyProject(); project.sources = [{ id: "s1", title: "Unverified source", authors: [], journalOrVenue: "", documentType: "Article", peerReviewStatus: "Unknown", verificationState: "Unverified", year: undefined } as any];
    expect(generateBibTeX(project)).not.toContain("2026");
    expect(generateCslJson(project)).not.toContain("2026");
    expect(generateJatsXml(project)).not.toContain("2026");
  });
});
