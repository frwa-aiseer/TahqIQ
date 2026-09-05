import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { runContradictionDetectionAgent, validateContradictionCandidates, type ContradictionGroupCandidate } from "../lib/contradictionDetectionAgent";
import { GapMapView } from "../components/views/GapMapView";
import type { EvidenceRecord } from "../types";

const evidence = (id: string, overrides: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  evidenceId: id, sourceId: `source-${id}`, documentVersion: "v1", documentHash: id.padEnd(64, "a").slice(0, 64),
  exactPassage: `Reviewed evidence passage ${id}.`, page: "3", section: "Results", paragraphOrChunkRef: `chunk-${id}`,
  extractionMethod: "Researcher Selected", extractedBy: "researcher-1", confidence: 1, verification: "Researcher Verified",
  researcherReview: { status: "Verified", reviewedBy: "researcher-1", reviewedAt: "2026-09-06T00:00:00.000Z", notes: "Verified." },
  linkedClaimIds: [], createdAt: "2026-09-06T00:00:00.000Z", updatedAt: "2026-09-06T00:00:00.000Z", ...overrides,
});
const candidate = (overrides: Partial<ContradictionGroupCandidate> = {}): ContradictionGroupCandidate => ({
  topic: "Differing observed outcome patterns",
  supportingEvidenceIds: ["ev-support"], contradictoryEvidenceIds: ["ev-contrast"],
  contextualReasons: [{ text: "The evidence was collected in different contexts.", evidenceIds: ["ev-support", "ev-contrast"] }],
  methodologicalReasons: [{ text: "The compared evidence used different measurement approaches.", evidenceIds: ["ev-support", "ev-contrast"] }],
  uncertainty: { text: "The supplied evidence does not resolve whether context explains the difference.", evidenceIds: ["ev-support", "ev-contrast"] },
  ...overrides,
});
const reviewed = [evidence("ev-support"), evidence("ev-contrast")];

describe("ContradictionDetectionAgent", () => {
  it("creates stored review-required groups with evidence IDs on every comparison", async () => {
    const groups = await runContradictionDetectionAgent(
      { projectId: "project-1", researchQuestion: "Why do the reviewed results differ?", evidenceRecords: reviewed },
      { detectorId: "contradiction-agent-v1", propose: async () => [candidate()], now: () => "2026-09-06T01:00:00.000Z" }
    );
    expect(groups[0]).toMatchObject({ groupId: expect.stringMatching(/^contradiction-/), projectId: "project-1", supportingEvidenceIds: ["ev-support"], contradictoryEvidenceIds: ["ev-contrast"], reviewState: "Needs Researcher Review", detectedBy: "contradiction-agent-v1" });
    expect([...groups[0].contextualReasons, ...groups[0].methodologicalReasons, groups[0].uncertainty].every((item) => item.evidenceIds.length > 0)).toBe(true);
  });

  it("rejects missing or unknown evidence IDs in every comparison area", () => {
    expect(() => validateContradictionCandidates([candidate({ supportingEvidenceIds: [] })], reviewed)).toThrow("supportingEvidenceIds");
    expect(() => validateContradictionCandidates([candidate({ contradictoryEvidenceIds: ["unknown"] })], reviewed)).toThrow("researcher-verified evidence IDs");
    expect(() => validateContradictionCandidates([candidate({ contextualReasons: [{ text: "Context differs.", evidenceIds: [] }] })], reviewed)).toThrow("contextual reason");
    expect(() => validateContradictionCandidates([candidate({ methodologicalReasons: [{ text: "Methods differ.", evidenceIds: [] }] })], reviewed)).toThrow("methodological reason");
    expect(() => validateContradictionCandidates([candidate({ uncertainty: { text: "Uncertain.", evidenceIds: [] } })], reviewed)).toThrow("uncertainty");
  });

  it("never accepts language declaring a study wrong", () => {
    for (const mutation of [
      candidate({ topic: "The first study is wrong" }),
      candidate({ contextualReasons: [{ text: "This paper was incorrect.", evidenceIds: ["ev-support"] }] }),
      candidate({ uncertainty: { text: "The source is false.", evidenceIds: ["ev-contrast"] } }),
    ]) expect(() => validateContradictionCandidates([mutation], reviewed)).toThrow("without declaring a study wrong");
  });

  it("rejects unreviewed evidence before calling the detector", async () => {
    let called = false;
    await expect(runContradictionDetectionAgent(
      { projectId: "project-1", researchQuestion: "Question", evidenceRecords: [reviewed[0], evidence("pending", { verification: "Needs Review", researcherReview: { status: "Pending" } })] },
      { detectorId: "agent", propose: async () => { called = true; return [candidate()]; } }
    )).rejects.toThrow("Only attributable researcher-verified EvidenceRecords");
    expect(called).toBe(false);
  });

  it("rejects dual labeling, extra fields, and malformed group schemas", () => {
    expect(() => validateContradictionCandidates([candidate({ contradictoryEvidenceIds: ["ev-support"] })], reviewed)).toThrow("both supporting and contradictory");
    expect(() => validateContradictionCandidates([{ ...candidate(), verdict: "one wins" }], reviewed)).toThrow("structured contract");
    expect(() => validateContradictionCandidates({}, reviewed)).toThrow("bounded array");
  });

  it("exposes stored contradiction groups in the gap UI with evidence attribution", () => {
    render(<GapMapView gaps={[]} contradictionGroups={[{
      groupId: "group-1", projectId: "project-1", ...candidate(), reviewState: "Needs Researcher Review",
      createdAt: "2026-09-06T01:00:00.000Z", detectedBy: "agent",
    }]} />);
    expect(screen.getByRole("heading", { name: "Evidence Contradiction Groups" })).toBeInTheDocument();
    expect(screen.getByText("Differing observed outcome patterns")).toBeInTheDocument();
    expect(screen.getAllByText(/ev-support/).length).toBeGreaterThan(0);
    expect(screen.getByText("Needs Researcher Review")).toBeInTheDocument();
  });
});
