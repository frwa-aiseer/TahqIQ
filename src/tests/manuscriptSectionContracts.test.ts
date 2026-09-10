import { describe, expect, it } from "vitest";
import { manuscriptSectionContracts, validateSectionDraftOutput, validateSectionInputs, type ManuscriptSectionContractId, type SectionInputState, type SuppliedSectionInput } from "../lib/manuscriptSectionContracts";

const supplied = (artifact: string, state: SectionInputState, flags: Partial<SuppliedSectionInput> = {}): SuppliedSectionInput => ({ artifact, state, ...flags });

describe("explicit manuscript SectionContracts", () => {
  it("defines the complete section inventory and mandatory traceable output shape", () => {
    const ids: ManuscriptSectionContractId[] = ["Introduction", "Literature Review", "Methods", "Results", "Discussion", "Conclusion", "Abstract", "Title", "Keywords"];
    expect(manuscriptSectionContracts.list().map(({ id }) => id)).toEqual(ids);
    for (const contract of manuscriptSectionContracts.list()) {
      expect(contract.outputSchema.requiredFields).toEqual(["sectionId", "content", "claimEvidenceMappings", "sourceIds", "numericEvidenceIds", "missingInformation", "warnings"]);
      expect(contract.outputStatus).toBe("AI Suggested—Needs Researcher Review");
      expect(contract.prohibitedBehavior.join(" ")).toMatch(/Fabricate/);
      expect(contract.prohibitedBehavior.join(" ")).toMatch(/demo or synthetic/);
      expect(Object.isFrozen(contract)).toBe(true);
    }
  });

  it("defines the exact verified inputs required by each section", () => {
    const requirements = Object.fromEntries(manuscriptSectionContracts.list().map((contract) => [contract.id, contract.requiredInputs.map(({ artifact }) => artifact)]));
    expect(requirements.Introduction).toEqual(["approvedProblemStatement", "approvedResearchGap", "verifiedEvidence"]);
    expect(requirements["Literature Review"]).toEqual(["approvedLiteratureSynthesis", "verifiedEvidenceGraph"]);
    expect(requirements.Methods).toEqual(["approvedMethodologyOrProtocol", "approvedAnalysisPlan", "actualEthicsInformation"]);
    expect(requirements.Discussion).toEqual(["approvedResults", "verifiedLiterature"]);
    expect(requirements.Conclusion).toEqual(["approvedInterpretation", "approvedResults"]);
    expect(requirements.Abstract).toEqual(["approvedRelevantSections", "approvedResults"]);
    expect(requirements.Title).toEqual(["approvedProjectContent"]);
    expect(requirements.Keywords).toEqual(["approvedProjectContent"]);
    expect(manuscriptSectionContracts.get("Results").anyOfInputGroups[0].map(({ artifact }) => artifact)).toEqual(["approvedAnalysisOutputs", "approvedQualitativeFindings"]);
  });

  it("requires actual researcher-confirmed ethics information for Methods", () => {
    const base = [supplied("approvedMethodologyOrProtocol", "Researcher Approved"), supplied("approvedAnalysisPlan", "Researcher Approved")];
    expect(validateSectionInputs("Methods", "Real", base).valid).toBe(false);
    expect(validateSectionInputs("Methods", "Real", [...base, supplied("actualEthicsInformation", "Available" as SectionInputState)]).valid).toBe(false);
    expect(validateSectionInputs("Methods", "Real", [...base, supplied("actualEthicsInformation", "Researcher Confirmed")]).valid).toBe(true);
    expect(validateSectionInputs("Methods", "Real", [...base, supplied("actualEthicsInformation", "Not Applicable—Researcher Confirmed")]).valid).toBe(true);
  });

  it("accepts only approved outputs/findings for Results", () => {
    expect(validateSectionInputs("Results", "Real", [supplied("approvedAnalysisOutputs", "Researcher Approved")]).valid).toBe(false);
    expect(validateSectionInputs("Results", "Real", [supplied("approvedAnalysisOutputs", "Approved for Manuscript")]).valid).toBe(true);
    expect(validateSectionInputs("Results", "Real", [supplied("approvedQualitativeFindings", "Researcher Approved")]).valid).toBe(true);
    expect(validateSectionInputs("Results", "Real", [supplied("verifiedLiterature", "Verified")]).valid).toBe(false);
  });

  it("rejects demo/synthetic facts in real projects and only warns in isolated demo projects", () => {
    const demoInput = supplied("approvedProjectContent", "Researcher Approved", { isDemo: true });
    expect(validateSectionInputs("Title", "Real", [demoInput])).toMatchObject({ valid: false });
    expect(validateSectionInputs("Title", "Real", [demoInput]).missingInformation[0]).toMatch(/prohibited/);
    expect(validateSectionInputs("Title", "Demo", [demoInput])).toMatchObject({ valid: true, warnings: [expect.stringMatching(/isolated/)] });
    expect(manuscriptSectionContracts.list().every((contract) => !(contract as unknown as Record<string, unknown>).defaultContent)).toBe(true);
  });

  it("validates exact proposal fields including claim mappings, sources, NumericEvidence IDs, missing info, and warnings", () => {
    const valid = {
      sectionId: "Discussion", content: "Researcher review required.",
      claimEvidenceMappings: [{ claimId: "claim-1", claimText: "Researcher review required.", evidenceIds: ["evidence-1"], sourceIds: ["source-1"], numericEvidenceIds: ["numeric-1"] }],
      sourceIds: ["source-1"], numericEvidenceIds: ["numeric-1"], missingInformation: ["Researcher Input Required"], warnings: ["Not independently reproduced"],
      status: "AI Suggested—Needs Researcher Review",
    };
    expect(validateSectionDraftOutput("Discussion", valid)).toBe(true);
    expect(validateSectionDraftOutput("Discussion", { ...valid, numericEvidenceIds: undefined })).toBe(false);
    expect(validateSectionDraftOutput("Discussion", { ...valid, status: "Researcher Approved" })).toBe(false);
    expect(validateSectionDraftOutput("Discussion", { ...valid, inventedFact: "hidden" })).toBe(false);
  });
});
