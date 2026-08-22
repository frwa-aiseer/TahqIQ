import { validateAiGeneratedProse } from "./src/lib/aiValidationService.js";

const mockProjectWithData = {
  isDemoProject: false,
  numericEvidenceRecords: [
    {
      id: "ev-2",
      value: 8.4,
      normalizedValue: 8.4,
      sourceType: "ANALYSIS_OUTPUT",
      sourceId: "out-1",
      verificationState: "Verified",
      createdAt: new Date().toISOString()
    }
  ],
  analysisOutputs: [
    {
      executionStatus: "Completed",
      isReproduced: true,
    }
  ]
};

const proseWithFakeStat = "Results showed peak activation reached 99.90 % MVIC.";
const result2 = validateAiGeneratedProse(proseWithFakeStat, "Results", mockProjectWithData);
console.log(result2);
