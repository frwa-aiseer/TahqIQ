import { describe, it, expect } from 'vitest';
import { isAnalysisOutputApproved } from '../lib/aiValidationService';
import { AnalysisOutput } from '../types';

describe('Analysis Lifecycle Rules', () => {
  it('should block Completed output that is not explicitly approved', () => {
    const out = {
      id: "out-1",
      executionStatus: "Completed",
      state: "Completed",
      isResearcherSupplied: false,
      reproductionStatus: "Independently Reproduced",
      isReproduced: true,
    } as AnalysisOutput;

    expect(isAnalysisOutputApproved(out)).toBe(false);
  });

  it('should allow Approved for Manuscript output', () => {
    const out = {
      id: "out-2",
      executionStatus: "Completed",
      state: "Approved for Manuscript",
      isResearcherSupplied: false,
      reproductionStatus: "Independently Reproduced",
      isReproduced: true,
    } as AnalysisOutput;

    expect(isAnalysisOutputApproved(out)).toBe(true);
  });

  it('should allow explicitly approved output (backwards compatibility)', () => {
    const out = {
      id: "out-3",
      executionStatus: "Completed",
      state: "QC Passed", // intermediate state
      isApproved: true,
      isResearcherSupplied: false,
      reproductionStatus: "Independently Reproduced",
      isReproduced: true,
    } as AnalysisOutput;

    expect(isAnalysisOutputApproved(out)).toBe(true);
  });

  it('should allow imported external statistical output only if explicitly approved', () => {
    const out = {
      id: "out-4",
      executionStatus: "Completed",
      state: "Completed",
      isResearcherSupplied: true,
      reproductionStatus: "Not Independently Reproduced",
      isReproduced: false,
    } as AnalysisOutput;

    // Not approved yet
    expect(isAnalysisOutputApproved(out)).toBe(false);
    
    // Once explicitly approved, it can be drafted
    (out as any).isApproved = true;
    expect(isAnalysisOutputApproved(out)).toBe(true);
  });
});
