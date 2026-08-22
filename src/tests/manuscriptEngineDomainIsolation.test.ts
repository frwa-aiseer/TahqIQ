import { describe, expect, it } from "vitest";
import { createDemoProject, createEmptyProject } from "../data/demoProject";
import {
  DemoManuscriptEngineAccessError,
  expandFullPaperToQ1Length,
  expandSectionToQ1Length,
} from "../lib/q1ManuscriptEngine";
import { applyToneAndComplexity } from "../lib/manuscriptTone";
import type { ManuscriptSection } from "../types";

function emptySection(title: string): ManuscriptSection {
  return {
    id: `section-${title.toLowerCase().replace(/\W+/g, "-")}`,
    title,
    content: "",
    order: 1,
    currentWordCount: 0,
    citationIds: [],
    status: "Drafting",
    version: 1,
    lastEditedBy: "Researcher",
    lastEditedTimestamp: "2026-08-22T00:00:00.000Z",
  };
}

describe("TQ-VSC-002 q1ManuscriptEngine real-project isolation", () => {
  it.each([
    "Structured Abstract",
    "1. Introduction",
    "2. Materials and Methods",
    "3. Results",
    "4. Discussion",
    "5. Conclusion & Recommendations",
  ])("blocks arbitrary real-project generation for %s", (title) => {
    const realProject = createEmptyProject({
      id: "real-project",
      title: "Quantum Coherence in Solid-State Qubits",
      discipline: "Quantum Physics",
    });
    const section = emptySection(title);

    expect(() => expandSectionToQ1Length(section, realProject, 1000)).toThrow(
      DemoManuscriptEngineAccessError
    );
    expect(section.content).toBe("");
    expect(section.status).toBe("Drafting");
  });

  it("blocks full-paper generation for a non-demo project before modifying sections", () => {
    const realProject = createEmptyProject({
      id: "real-marine-project",
      title: "Ocean Acidification Impact on Coral Calcification",
      discipline: "Marine Biology",
    });
    const originalSections = structuredClone(realProject.sections);

    expect(() => expandFullPaperToQ1Length(realProject, 4500)).toThrow(
      /demo-only.*no substitute scientific content was generated/i
    );
    expect(realProject.sections).toEqual(originalSections);
  });

  it("retains the legacy engine only for an explicit demo fixture", () => {
    const demoProject = createDemoProject();
    expect(demoProject.isDemoProject).toBe(true);

    const expanded = expandSectionToQ1Length(emptySection("1. Introduction"), demoProject, 1000);

    expect(expanded.content.length).toBeGreaterThan(50);
    expect(expanded.state).toBe("AI Suggested");
    expect(expanded.isDemo).toBe(true);
    expect(expanded.isSynthetic).toBe(true);
  });

  it("tags every retained full-paper demo section as demo and synthetic", () => {
    const demoProject = createDemoProject();
    const expanded = expandFullPaperToQ1Length(demoProject, 4500);

    expect(expanded.isDemoProject).toBe(true);
    expect(expanded.sections.length).toBeGreaterThan(0);
    expect(expanded.sections.every((section) => section.isDemo && section.isSynthetic)).toBe(true);
  });

  it("keeps deterministic tone formatting outside the demo generation engine", () => {
    const rawProse = "Accumulating empirical evidence indicates that in order to establish whether the intervention succeeds, a major methodological limitation in existing literature is sample size.";
    const concise = applyToneAndComplexity(rawProse, "Concise Technical");

    expect(concise).toContain("Empirical data show");
    expect(concise).toContain("To evaluate whether");
    expect(concise).toContain("Key methodological limitation:");
  });
});
