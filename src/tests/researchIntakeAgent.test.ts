import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { confirmResearchIntakeClassification, createResearchIntakeProposal, type ResearchIntakeInput } from "../lib/researchIntakeAgent";

const now = () => "2026-09-07T00:00:00.000Z";
const base = (description: string): ResearchIntakeInput => ({
  projectId: "project-intake-fixture", researchDescription: description,
});

describe("TQ-VSC-040 ResearchIntakeAgent", () => {
  it.each([
    ["clinical", { ...base("A clinical study involving patients and treatment."), statedStudyType: "Cohort study" as const }, "Medicine & Clinical Research", "Cohort study"],
    ["qualitative", base("Qualitative interviews will undergo thematic analysis."), "Social Sciences", "Original qualitative research"],
    ["electrical engineering", base("An electrical engineering hardware prototype for signal processing."), "Engineering", "Engineering experiment"],
    ["machine learning", base("A machine learning classifier using a neural network."), "Computer Science", "Machine-learning study"],
    ["economics", base("An economics panel regression examining inflation."), "Economics", "Original quantitative research"],
    ["systematic review", base("A systematic review with a documented database search strategy."), "Evidence Synthesis", "Systematic review"],
  ])("classifies the %s fixture without a clinical/crossover default", (_name, input, discipline, studyType) => {
    const proposal = createResearchIntakeProposal(input, now);
    expect(proposal).toMatchObject({ discipline, candidateStudyType: studyType, status: "AI Suggested", confidence: "Medium" });
    expect(proposal.candidateStudyType).not.toBe("Crossover study");
  });

  it("reports availability, missing critical information, research stage, and next stage without filling gaps", () => {
    const proposal = createResearchIntakeProposal({
      ...base("A machine learning classifier."), availableEvidence: "Researcher-supplied literature review",
      availableMethod: "Researcher-supplied protocol", availableData: "Researcher-supplied dataset inventory",
    }, now);
    expect(proposal.available).toEqual({
      evidence: "Researcher-supplied literature review", method: "Researcher-supplied protocol", data: "Researcher-supplied dataset inventory",
    });
    expect(proposal.researchStage).toBe("Data available");
    expect(proposal.nextStage).toContain("Verify data provenance");
    expect(proposal.missingCriticalInformation).not.toContain(expect.stringContaining("Available data"));

    const sparse = createResearchIntakeProposal(base("A topic without supported classification terms."), now);
    expect(sparse).toMatchObject({
      discipline: "Researcher input required", subdiscipline: "Researcher input required",
      candidateStudyType: "Researcher input required", manuscriptType: "Researcher input required",
      available: { evidence: "Not available", method: "Not available", data: "Not available" },
      researchStage: "Idea formulation", confidence: "Low",
    });
    expect(sparse.missingCriticalInformation).toHaveLength(7);
  });

  it("includes confidence rationale and an explicit researcher-correction path", () => {
    const proposal = createResearchIntakeProposal({
      ...base("Researcher-described work."), statedDiscipline: "Economics", statedSubdiscipline: "Labour Economics",
      statedStudyType: "Original quantitative research", statedManuscriptType: "Original research manuscript",
    }, now);
    expect(proposal.confidence).toBe("High");
    expect(proposal.confidenceRationale).toContain("explicitly supplied");
    expect(proposal.researcherCorrection).toMatchObject({ allowed: true, correctedFields: [] });
  });

  it("creates a separate attributable confirmed classification and leaves the proposal unchanged", () => {
    const proposal = createResearchIntakeProposal(base("Qualitative interviews and thematic analysis."), now);
    const confirmed = confirmResearchIntakeClassification(
      proposal, { subdiscipline: "Health Services Qualitative Research", researchStage: "Protocol development" },
      { uid: "researcher-1", email: "researcher@example.org" }, () => "2026-09-07T01:00:00.000Z",
    );
    expect(proposal).toMatchObject({ status: "AI Suggested", subdiscipline: "Qualitative Research" });
    expect(confirmed).toMatchObject({
      status: "Researcher Confirmed", sourceProposalId: proposal.id, subdiscipline: "Health Services Qualitative Research",
      researchStage: "Protocol development", confirmedByUid: "researcher-1", confirmedByEmail: "researcher@example.org",
      confirmedAt: "2026-09-07T01:00:00.000Z", correctedFields: ["subdiscipline", "researchStage"],
    });
    expect(confirmed.id).not.toBe(proposal.id);
  });

  it("rejects missing scope and unattributed confirmation", () => {
    expect(() => createResearchIntakeProposal({ projectId: "", researchDescription: "" }, now)).toThrow("Project scope and research description are required");
    const proposal = createResearchIntakeProposal(base("Economics and inflation."), now);
    expect(() => confirmResearchIntakeClassification(proposal, {}, { uid: "", email: "" }, now)).toThrow("attributable researcher");
  });

  it("removes the former clinical, PICO, crossover, and CONSORT defaults from empty projects", () => {
    const project = createEmptyProject();
    expect(project.discipline).toBe("Researcher input required");
    expect(project.projectType).toBe("Custom scholarly project");
    expect(project.canvas.framework).toBe("Researcher input required");
    expect(project.reportingGuideline).toMatchObject({ name: "Not configured", applicableStudyType: "Researcher input required" });
    expect(project.projectType).not.toMatch(/clinical|crossover|randomized/i);
  });
});
