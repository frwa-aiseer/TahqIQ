import { describe, it, expect } from 'vitest';
import { createEmptyProject, createDemoProject, canAddRecordToProject } from "../data/demoProject";
import { executePairedCrossoverAnalysis } from "../lib/statsEngine";
import { createMissingSourceRecord } from "../lib/citationVerifier";
import { expandSectionToQ1Length } from "../lib/q1ManuscriptEngine";
import { ManuscriptSection } from "../types";

describe('Phase 0 Verification Tests', () => {
  it('1. Real projects contain no demo records', () => {
    const realProject = createEmptyProject();
    expect(realProject.isDemoProject).toBe(false);
    expect(realProject.sources.length).toBe(0);
    expect(realProject.datasets.length).toBe(0);
    expect(realProject.analysisOutputs.length).toBe(0);
    expect(realProject.claims.length).toBe(0);
    expect(realProject.reviewerComments.length).toBe(0);
    expect(realProject.authors.length).toBe(0);
    expect(realProject.ethicsInfo?.approvalNumber).toBe("");
  });

  it('2. Demo projects open only when explicitly created', () => {
    const demoProject = createDemoProject();
    expect(demoProject.isDemoProject).toBe(true);
    expect(demoProject.sources.length).toBeGreaterThan(0);
    expect(demoProject.sources.every((s) => s.isDemo === true)).toBe(true);
  });

  it('3. Real projects cannot accept demo data records', () => {
    const realProject = createEmptyProject();
    const demoProject = createDemoProject();

    const demoSource: any = {
      id: "demo-src-1",
      title: "Demo Source",
      authors: ["Demo Author"],
      year: 2023,
      isDemo: true,
    };
    const realSource: any = {
      id: "real-src-1",
      title: "Real Source",
      authors: ["Real Author"],
      year: 2026,
      isDemo: false,
    };

    expect(canAddRecordToProject(demoSource, realProject)).toBe(false);
    expect(canAddRecordToProject(realSource, realProject)).toBe(true);
    expect(canAddRecordToProject(demoSource, demoProject)).toBe(true);
  });

  it('4. Unsafe actions return disabled state message', () => {
    const realDataset: any = { id: "real-ds-1", filename: "real_data.csv", isDemo: false, isSynthetic: false, state: "Uploaded" };
    const statsResult = executePairedCrossoverAnalysis(realDataset, "peak_emg", "condition");
    expect(statsResult.summaryText).toMatch(/Execution Blocked|Unavailable in the prototype/);
  });

  it('5. Creating synthetic sources from surname/year throws disabled or prohibition error', () => {
    expect(() => createMissingSourceRecord("Smith", 2024)).toThrow(/prohibited/i);
  });

  it('6. Manuscript engine does not output fake Results or Boyer citations for real projects', () => {
    const realProject = createEmptyProject();
    const disabledMsg = "Unavailable in the prototype: this function requires verified data, evidence or a configured backend.";
    const sectionToExpand: ManuscriptSection = {
      id: "sec-3",
      title: "3. Results",
      content: "",
      order: 3,
      currentWordCount: 0,
      citationIds: [],
      status: "Drafting",
      version: 1,
      lastEditedBy: "Researcher",
      lastEditedTimestamp: new Date().toISOString()
    };

    const expandedResults = expandSectionToQ1Length(sectionToExpand, realProject);
    expect(expandedResults.content).toContain(disabledMsg);
    expect(expandedResults.content).not.toContain("Boyer et al.");
  });
});
