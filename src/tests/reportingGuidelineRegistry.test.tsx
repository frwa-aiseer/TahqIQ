import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportingChecklistView } from "../components/views/ReportingChecklistView";
import { createEmptyProject } from "../data/demoProject";
import { calculateProjectReadiness } from "../lib/readinessCalculator";
import {
  REPORTING_GUIDELINE_REGISTRY,
  assessReportingChecklistItem,
  confirmReportingGuideline,
  isEvidenceBackedChecklistItem,
  resolveReportingGuideline,
} from "../lib/reportingGuidelineRegistry";

describe("TQ-VSC-041 ReportingGuidelineRegistry", () => {
  it.each([
    ["Randomized controlled trial", "CONSORT"], ["Cohort study", "STROBE"],
    ["Systematic review", "PRISMA"], ["Scoping review", "PRISMA-ScR"],
    ["Diagnostic-accuracy study", "STARD"], ["Clinical prediction model study", "TRIPOD"],
    ["Original qualitative research", "COREQ"], ["In vivo animal research", "ARRIVE"], ["Case report", "CARE"],
  ])("suggests reviewable sourced guidance for %s", (studyType, expected) => {
    const result = resolveReportingGuideline(studyType);
    expect(result.status).toBe("Suggested—Needs Researcher Review");
    expect(result.guideline).toMatchObject({ name: expected, recommendationStatus: "Suggested—Needs Researcher Review" });
    expect(result.guideline?.officialUrl).toMatch(/^https:\/\//);
    expect(result.guideline?.checklistItems.every((item) => item.status === "Required")).toBe(true);
  });

  it.each(["Engineering experiment", "Computational study", "Machine-learning study", "Software or tool paper", "Simulation study"])(
    "does not force a clinical checklist onto %s", (studyType) => {
      const result = resolveReportingGuideline(studyType);
      expect(result).toMatchObject({ status: "Not configured", consideredRegistryIds: [] });
      expect(result.guideline).toBeUndefined();
      expect(result.reason).toContain("non-clinical");
    },
  );

  it("keeps unknown and future study types explicitly unconfigured", () => {
    expect(resolveReportingGuideline("Future domain-specific design").guideline).toBeUndefined();
    expect(resolveReportingGuideline("Researcher input required").guideline).toBeUndefined();
    expect(REPORTING_GUIDELINE_REGISTRY.map((item) => item.id)).toEqual(expect.arrayContaining(["consort", "strobe", "prisma", "prisma-scr", "stard", "tripod", "coreq", "arrive", "care"]));
  });

  it("requires researcher confirmation and actual known evidence before marking an item addressed", () => {
    const suggestion = resolveReportingGuideline("Systematic review").guideline!;
    expect(() => assessReportingChecklistItem(suggestion, suggestion.checklistItems[0].id, {
      status: "Addressed", manuscriptLocation: "Methods", evidenceArtifactIds: ["artifact-1"],
    }, { uid: "researcher-1" }, new Set(["artifact-1"]))).toThrow("Researcher-confirmed guidance");
    const confirmed = confirmReportingGuideline(suggestion, { uid: "researcher-1", email: "researcher@example.org" });
    expect(() => assessReportingChecklistItem(confirmed, confirmed.checklistItems[0].id, {
      status: "Addressed", manuscriptLocation: "", evidenceArtifactIds: [],
    }, { uid: "researcher-1" }, new Set())).toThrow("manuscript location and evidence artifact IDs");
    expect(() => assessReportingChecklistItem(confirmed, confirmed.checklistItems[0].id, {
      status: "Addressed", manuscriptLocation: "Methods", evidenceArtifactIds: ["unknown-artifact"],
    }, { uid: "researcher-1" }, new Set(["artifact-1"]))).toThrow("unavailable evidence artifact");
    const assessed = assessReportingChecklistItem(confirmed, confirmed.checklistItems[0].id, {
      status: "Addressed", manuscriptLocation: "Methods: Search strategy", evidenceArtifactIds: ["artifact-1"],
    }, { uid: "researcher-1" }, new Set(["artifact-1"]), () => "2026-09-07T02:00:00.000Z");
    expect(assessed.checklistItems[0]).toMatchObject({ assessedByUid: "researcher-1", assessedAt: "2026-09-07T02:00:00.000Z" });
    expect(isEvidenceBackedChecklistItem(assessed.checklistItems[0])).toBe(true);
  });

  it("does not award readiness for legacy static Addressed ticks without evidence", () => {
    const legacy = createEmptyProject();
    legacy.sections[0].content = "Synthetic fixture content sufficient to enter readiness calculation.";
    legacy.reportingGuideline = { name: "CONSORT", version: "Legacy", applicableStudyType: "Trial", checklistItems: [{
      id: "legacy-item", itemNumber: "1", sectionOrTopic: "Title", description: "Legacy static tick", status: "Addressed",
    }] };
    const baseline = calculateProjectReadiness(legacy).methodCompleteness;
    legacy.reportingGuideline.checklistItems[0] = {
      ...legacy.reportingGuideline.checklistItems[0], manuscriptLocation: "Title", evidenceArtifactIds: ["section-title"],
      assessedByUid: "researcher-1", assessedAt: "2026-09-07T02:00:00.000Z",
    };
    expect(calculateProjectReadiness(legacy).methodCompleteness).toBe(baseline + 25);
  });

  it("renders truthful review and evidence states instead of universal green ticks or fabricated locations", () => {
    const guideline = resolveReportingGuideline("Original qualitative research").guideline!;
    render(<ReportingChecklistView guideline={guideline} />);
    expect(screen.getByText("Suggested guidance requires researcher confirmation before use.")).toBeInTheDocument();
    expect(screen.getByText("Not documented")).toBeInTheDocument();
    const status = screen.getByText("Required").parentElement;
    expect(status?.className).toContain("bg-amber-100");
    expect(status?.className).not.toContain("bg-emerald-100");
  });
});
