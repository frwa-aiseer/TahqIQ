import { describe, it, expect } from "vitest";
import { validateAiGeneratedProse, validateManuscriptNumericContent } from "../lib/aiValidationService";
import { ProjectState, NumericEvidence } from "../types";

describe("Provenance-Based Numerical Grounding Tests", () => {
  const mockProject: ProjectState = {
    id: "proj-numeric-1",
    title: "Numerical Grounding Test Project",
    discipline: "Test Science",
    isDemoProject: false,
    sources: [
      {
        id: "src-1",
        title: "Test Source",
        authors: ["Doe", "Smith"],
        year: 2024,
        verificationState: "Verified"
      } as any
    ],
    numericEvidenceRecords: [
      {
        id: "ev-1",
        value: 18.5,
        normalizedValue: 18.5,
        sourceType: "DATASET",
        sourceId: "ds-1",
        datasetHash: "hash-1",
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      },
      {
        id: "ev-2",
        value: 48,
        normalizedValue: 48,
        sourceType: "RESEARCHER_PROTOCOL",
        sourceId: "proj-numeric-1",
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      },
      {
        id: "ev-3",
        value: 0.05,
        normalizedValue: 0.05,
        sourceType: "ANALYSIS_OUTPUT",
        sourceId: "out-1",
        analysisRunId: "out-1",
        datasetHash: "analysis-hash",
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      }
    ],
    datasets: [{ id: "ds-1", fileHash: "hash-1" } as any],
    methodologyWorkspace: { sourceMode: "Researcher Entered", reviewState: "Researcher Approved", fields: {} } as any,
    analysisOutputs: [
      {
        id: "out-1",
        analysisPlanId: "plan-1",
        planId: "plan-1",
        datasetHash: "analysis-hash",
        executionStatus: "Completed",
        isReproduced: true,
        state: "Approved for Manuscript",
        researcherApproval: {
          actor: { uid: "researcher-1", email: "researcher@example.org" },
          timestamp: "2026-08-22T00:00:00.000Z",
          rationale: "Reviewed and approved",
          outputId: "out-1",
          datasetHash: "analysis-hash",
          planId: "plan-1",
        },
        summaryText: "Test Output"
      } as any
    ]
  } as ProjectState;

  it("1. Allows grounded empirical numbers and correctly classifies citation years", () => {
    // 18.5 is grounded in DATASET
    // 48 is grounded in RESEARCHER_PROTOCOL
    // 0.05 is grounded in ANALYSIS_OUTPUT
    // 2024 is a citation year
    // 2 is a section number (non-empirical)
    const prose = "As seen in section 2, the baseline was 18.5 units. The protocol lasted 48 hours (Doe et al., 2024). The p-value was 0.05.";
    
    const result = validateAiGeneratedProse(prose, "Results", mockProject);
    
    expect(result.valid).toBe(true);
    expect(result.groundedNumbers).toContain(18.5);
    expect(result.groundedNumbers).toContain(48);
    expect(result.groundedNumbers).toContain(0.05);
    expect(result.nonEmpiricalNumbers).toContain(2024);
    expect(result.nonEmpiricalNumbers).toContain(2);
    expect(result.ungroundedNumbers.length).toBe(0);
  });

  it("2. Blocks ungrounded numbers in ALL manuscript sections (not just Results)", () => {
    const ungroundedProse = "The intervention reduced symptoms by 99 percent."; // 99 is ungrounded

    // Test Introduction
    const resultIntro = validateAiGeneratedProse(ungroundedProse, "Introduction", mockProject);
    expect(resultIntro.valid).toBe(false);
    expect(resultIntro.error).toContain("Ungrounded numerical findings detected (99)");

    // Test Methods
    const resultMethods = validateAiGeneratedProse(ungroundedProse, "Methods", mockProject);
    expect(resultMethods.valid).toBe(false);
    expect(resultMethods.error).toContain("Ungrounded numerical findings detected (99)");

    // Test Abstract
    const resultAbstract = validateAiGeneratedProse(ungroundedProse, "Abstract", mockProject);
    expect(resultAbstract.valid).toBe(false);
    expect(resultAbstract.error).toContain("Ungrounded numerical findings detected (99)");

    // Test Discussion
    const resultDiscussion = validateAiGeneratedProse(ungroundedProse, "Discussion", mockProject);
    expect(resultDiscussion.valid).toBe(false);
    expect(resultDiscussion.error).toContain("Ungrounded numerical findings detected (99)");
  });

  it("3. Validates numbers with decimal precision", () => {
    const precisionProse = "The mean difference was 18.50 units."; // 18.50 is equivalent to 18.5
    const result = validateAiGeneratedProse(precisionProse, "Discussion", mockProject);
    expect(result.valid).toBe(true);
    expect(result.groundedNumbers).toContain(18.5);
  });

  it("4. Distinguishes bibliographic/structural numbers without allowing empirical years", () => {
    const prose = "The cohort started in 1980.";
    const result = validateAiGeneratedProse(prose, "Methods", mockProject);
    expect(result.valid).toBe(false);
    expect(result.ungroundedNumbers).toContain(1980);

    const prose2 = "See Figure 1, Table 2, and prior work (Doe et al., 2024) [1].";
    const result2 = validateAiGeneratedProse(prose2, "Methods", mockProject);
    expect(result2.valid).toBe(true);
    expect(result2.nonEmpiricalNumbers).toEqual(expect.arrayContaining([1, 2, 2024]));
  });

  it("5. Does not let demo status replace numeric provenance", () => {
    const demoProject = { ...mockProject, isDemoProject: true };
    const prose = "There were 100 participants.";
    const result = validateAiGeneratedProse(prose, "Methods", demoProject);
    
    expect(result.valid).toBe(false);
    expect(result.ungroundedNumbers).toContain(100);
  });

  it("6. Rejects matching values when the evidence record has dangling provenance", () => {
    const project = { ...mockProject, numericEvidenceRecords: [{
      id: "dangling", value: 18.5, normalizedValue: 18.5, sourceType: "DATASET",
      sourceId: "missing-dataset", datasetHash: "missing-hash", verificationState: "Verified",
      createdAt: new Date().toISOString()
    } as NumericEvidence] };
    expect(validateAiGeneratedProse("The baseline was 18.5 units.", "Introduction", project).valid).toBe(false);
  });

  it("7. validates every manuscript content surface", () => {
    const locations = ["abstract", "introduction", "literature-review", "methods", "results", "discussion", "conclusion", "table", "caption", "supplement"] as const;
    const result = validateManuscriptNumericContent(
      locations.map((location) => ({ location, content: `${location} reports 777 participants.` })),
      mockProject
    );
    expect(result.valid).toBe(false);
    expect(result.failures.map((failure) => failure.location)).toEqual(locations);
  });
});
