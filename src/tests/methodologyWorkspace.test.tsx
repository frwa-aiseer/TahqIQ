import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProtocolBuilderView } from "../components/views/ProtocolBuilderView";
import { createEmptyProject } from "../data/demoProject";
import {
  createBlankMethodologyFields,
  extractMethodologyFieldsFromText,
} from "../lib/methodologyWorkspace";
import type { ProjectState, ResearchProjectType } from "../types";

const FORBIDDEN_FIXED_DEFAULTS = [
  /48-hour/i,
  /washout period/i,
  /d\s*=\s*0\.80/i,
  /power\s*>\s*0\.80/i,
  /minimum 15 participants/i,
  /n\s*=\s*18/i,
  /semitendinosus/i,
  /hamstring/i,
  /treadmill/i,
  /\bEMG\b/,
];

function blankProject(discipline: string, projectType: ResearchProjectType): ProjectState {
  return createEmptyProject({
    id: `blank-${discipline.toLowerCase().replace(/\W+/g, "-")}`,
    title: "",
    discipline,
    subdiscipline: "",
    projectType,
  });
}

describe("TQ-VSC-003 domain-neutral methodology workspace", () => {
  it.each([
    ["Economics", "Original quantitative research"],
    ["Engineering", "Engineering experiment"],
    ["Qualitative Social Science", "Original qualitative research"],
    ["Clinical Research", "Randomized controlled trial"],
  ] as const)("shows blank adaptable fields for a blank %s project", (discipline, projectType) => {
    const { container } = render(
      <ProtocolBuilderView project={blankProject(discipline, projectType)} />
    );

    expect(screen.getByText("Domain-Neutral Methodology Workspace")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("Researcher Input Required")).toHaveLength(11);
    for (const forbidden of FORBIDDEN_FIXED_DEFAULTS) {
      expect(container.textContent).not.toMatch(forbidden);
    }
  });

  it("copies only explicitly labelled uploaded-protocol fields and leaves unknowns blank", () => {
    const fields = extractMethodologyFieldsFromText(`
Design: Longitudinal observational design
Data source: Public administrative records
Sampling: Stratified sampling documented by the researcher
This unlabelled sentence mentions 200 participants and must not be inferred.
Analysis plan: Researcher-defined regression specification
    `);

    expect(fields.design).toBe("Longitudinal observational design");
    expect(fields.populationOrDataSource).toBe("Public administrative records");
    expect(fields.sampling).toBe("Stratified sampling documented by the researcher");
    expect(fields.analysisPlan).toBe("Researcher-defined regression specification");
    expect(fields.eligibility).toBe("");
    expect(fields.interventionExposureComparator).toBe("");
    expect(JSON.stringify(fields)).not.toContain("200 participants");
  });

  it("switches uploads to Needs Review and AI requests to AI Suggested", () => {
    const project = blankProject("Economics", "Original quantitative research");
    const onUpdateProject = vi.fn();
    const { rerender } = render(
      <ProtocolBuilderView project={project} onUpdateProject={onUpdateProject} />
    );

    fireEvent.click(screen.getByRole("button", { name: /upload existing protocol/i }));
    expect(onUpdateProject).toHaveBeenLastCalledWith(
      expect.objectContaining({
        methodologyWorkspace: expect.objectContaining({
          sourceMode: "Protocol Upload",
          reviewState: "Needs Review",
        }),
      })
    );

    const uploadProject = onUpdateProject.mock.calls.at(-1)?.[0] as ProjectState;
    rerender(<ProtocolBuilderView project={uploadProject} onUpdateProject={onUpdateProject} />);
    fireEvent.click(screen.getByRole("button", { name: /request ai proposal/i }));
    expect(onUpdateProject).toHaveBeenLastCalledWith(
      expect.objectContaining({
        methodologyWorkspace: expect.objectContaining({
          sourceMode: "AI Proposal",
          reviewState: "AI Suggested",
        }),
      })
    );
  });

  it("keeps AI-proposed fields AI Suggested when edited", () => {
    const project = blankProject("Engineering", "Engineering experiment");
    project.methodologyWorkspace = {
      sourceMode: "AI Proposal",
      reviewState: "AI Suggested",
      fields: { ...createBlankMethodologyFields(), design: "Researcher input required" },
      aiProposal: {
        generatedAt: "2026-08-22T00:00:00.000Z",
        model: "gemini-3.6-flash",
        promptVersion: "tq-vsc-003-v1",
      },
      updatedAt: "2026-08-22T00:00:00.000Z",
    };
    const onUpdateProject = vi.fn();
    render(<ProtocolBuilderView project={project} onUpdateProject={onUpdateProject} />);

    fireEvent.change(screen.getByLabelText("Design"), {
      target: { value: "Researcher-edited proposed design" },
    });

    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        methodologyWorkspace: expect.objectContaining({
          reviewState: "AI Suggested",
          researcherApproval: undefined,
        }),
      })
    );
  });

  it("requires an attributable signed-in researcher before approval", () => {
    const project = blankProject("Clinical Research", "Randomized controlled trial");
    project.methodologyWorkspace = {
      sourceMode: "AI Proposal",
      reviewState: "AI Suggested",
      fields: createBlankMethodologyFields(),
      updatedAt: "2026-08-22T00:00:00.000Z",
    };
    const onUpdateProject = vi.fn();
    const { rerender } = render(
      <ProtocolBuilderView project={project} onUpdateProject={onUpdateProject} />
    );

    fireEvent.click(screen.getByRole("button", { name: /approve as researcher/i }));
    expect(screen.getByText(/researcher sign-in is required/i)).toBeInTheDocument();
    expect(onUpdateProject).not.toHaveBeenCalled();

    rerender(
      <ProtocolBuilderView
        project={project}
        onUpdateProject={onUpdateProject}
        currentUserUid="researcher-1"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /approve as researcher/i }));
    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        methodologyWorkspace: expect.objectContaining({
          reviewState: "Researcher Approved",
          researcherApproval: expect.objectContaining({ approvedByUid: "researcher-1" }),
        }),
      })
    );
  });
});
