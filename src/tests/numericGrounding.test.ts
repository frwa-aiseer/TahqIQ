import { describe, it, expect } from "vitest";
import { validateAiGeneratedProse } from "../lib/aiValidationService";
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
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      },
      {
        id: "ev-2",
        value: 48,
        normalizedValue: 48,
        sourceType: "RESEARCHER_PROTOCOL",
        sourceId: "proto-1",
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      },
      {
        id: "ev-3",
        value: 0.05,
        normalizedValue: 0.05,
        sourceType: "ANALYSIS_OUTPUT",
        sourceId: "out-1",
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      }
    ],
    analysisOutputs: [
      {
        id: "out-1",
        executionStatus: "Completed",
        isReproduced: true,
        state: "Approved for Manuscript",
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

  it("4. Blocks non-empirical numbers that are not classified as safe", () => {
    const prose = "The cohort started in 1980."; // 1980 is a year, but it's classified as nonEmpirical if standalone.
    const result = validateAiGeneratedProse(prose, "Methods", mockProject);
    // Since 1980 falls in the safe non-empirical year range (1900-2100), it should pass.
    expect(result.valid).toBe(true);
    expect(result.nonEmpiricalNumbers).toContain(1980);

    const prose2 = "There were 1880 participants."; // 1880 is outside 1900-2100 and not small integer
    const result2 = validateAiGeneratedProse(prose2, "Methods", mockProject);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain("1880");
  });

  it("5. Respects demonstration projects (allows ungrounded numbers)", () => {
    const demoProject = { ...mockProject, isDemoProject: true };
    const prose = "There were 100 participants.";
    const result = validateAiGeneratedProse(prose, "Methods", demoProject);
    
    // Valid because demo projects skip strict ungrounded checks
    expect(result.valid).toBe(true);
    // In demo projects, ungrounded numbers are added to groundedNumbers anyway
    expect(result.groundedNumbers).toContain(100);
  });
});
