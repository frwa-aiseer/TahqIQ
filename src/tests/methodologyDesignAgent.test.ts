import { describe, expect, it } from "vitest";
import { confirmReportingGuideline, resolveReportingGuideline } from "../lib/reportingGuidelineRegistry";
import { confirmResearchIntakeClassification, createResearchIntakeProposal } from "../lib/researchIntakeAgent";
import {
  approveMethodologyDesignProposal,
  runMethodologyDesignAgent,
  validateMethodologyDesignCandidate,
  type MethodologyDesignCandidate,
  type MethodologyDesignInput,
  type MethodologyDesignStatement,
} from "../lib/methodologyDesignAgent";

const timestamp = "2026-09-07T03:00:00.000Z";
const statement = (text: string, classification: MethodologyDesignStatement["classification"], researcherFactId?: string, evidenceIds: string[] = []): MethodologyDesignStatement => ({ text, classification, researcherFactId, evidenceIds });
const missing = (name: string) => statement(`${name}: Researcher input required.`, "Missing Information");
const candidate = (): MethodologyDesignCandidate => ({
  proposedDesign: [statement("A cohort design could be considered by the researcher.", "AI Proposal")],
  populationOrDataSource: [statement("The researcher identified an existing administrative dataset.", "Researcher Fact", "fact-data-source")],
  sampling: [missing("Sampling strategy")],
  variablesOrOutcomes: [missing("Variables and outcomes")],
  instruments: [missing("Instruments")], procedure: [missing("Procedure")],
  biasAndConfounding: [statement("The reviewed evidence suggests considering measured confounding.", "Evidence-grounded Recommendation", undefined, ["evidence-1"])],
  analysisNeeds: [statement("A candidate analysis approach should be selected after variable review.", "AI Proposal")],
  ethicsConsiderations: [missing("Ethics determination")], limitations: [missing("Design limitations")],
  unresolvedQuestions: [missing("Unresolved design questions")],
});

const intakeProposal = createResearchIntakeProposal({
  projectId: "project-method", researchDescription: "A clinical cohort study.", statedStudyType: "Cohort study",
}, () => timestamp);
const classification = confirmResearchIntakeClassification(intakeProposal, {}, { uid: "researcher-1", email: "researcher@example.org" }, () => timestamp);
const guidance = confirmReportingGuideline(resolveReportingGuideline("Cohort study").guideline!, { uid: "researcher-1", email: "researcher@example.org" });
const input: MethodologyDesignInput = {
  explicitUserRequest: true, projectId: "project-method",
  approvedResearchQuestion: { id: "rq-1", text: "Researcher-approved question", approvedByUid: "researcher-1", approvedAt: timestamp },
  approvedObjectives: [{ id: "objective-1", text: "Researcher-approved objective", approvedByUid: "researcher-1", approvedAt: timestamp }],
  confirmedClassification: classification, reviewedGapIds: ["gap-1"], reviewedEvidenceIds: ["evidence-1"],
  researcherFacts: [{ id: "fact-data-source", text: "The researcher identified an existing administrative dataset." }],
  constraints: ["Do not assume access beyond the stated data source."], reportingGuidance: guidance,
};
const tool = (output: unknown) => ({
  propose: async () => output,
  attribution: { provider: "Configured methodology provider", model: "configured-model", promptVersion: "methodology-design-v1" },
});

describe("TQ-VSC-042 MethodologyDesignAgent", () => {
  it("runs only after an explicit methodology-help request with approved and confirmed inputs", async () => {
    await expect(runMethodologyDesignAgent({ ...input, explicitUserRequest: false } as unknown as MethodologyDesignInput, tool(candidate()))).rejects.toThrow("only after an explicit user request");
    await expect(runMethodologyDesignAgent({ ...input, approvedObjectives: [] }, tool(candidate()))).rejects.toThrow("approved objective");
    await expect(runMethodologyDesignAgent({ ...input, reportingGuidance: resolveReportingGuideline("Cohort study").guideline! }, tool(candidate()))).rejects.toThrow("Researcher-confirmed reporting guidance");
  });

  it("returns every required design area as a review-pending proposal with source identities", async () => {
    const proposal = await runMethodologyDesignAgent(input, tool(candidate()), () => timestamp);
    expect(proposal).toMatchObject({
      projectId: input.projectId, status: "AI Suggested", reviewState: "Needs Researcher Review",
      sourceResearchQuestionId: "rq-1", sourceObjectiveIds: ["objective-1"], sourceGapIds: ["gap-1"],
      reportingGuidelineId: "strobe", generatedAt: timestamp,
    });
    expect(Object.keys(proposal.candidate)).toHaveLength(11);
    expect(proposal.candidate.ethicsConsiderations[0].classification).toBe("Missing Information");
  });

  it("enforces exact Researcher Facts and reviewed evidence IDs", () => {
    const alteredFact = candidate();
    alteredFact.populationOrDataSource[0].text = "An altered data-source claim.";
    expect(() => validateMethodologyDesignCandidate(alteredFact, input)).toThrow("copy one supplied fact exactly");
    const unknownEvidence = candidate();
    unknownEvidence.biasAndConfounding[0].evidenceIds = ["unknown-evidence"];
    expect(() => validateMethodologyDesignCandidate(unknownEvidence, input)).toThrow("outside the reviewed input set");
  });

  it("rejects invented sample sizes, ethics facts, participants, and completed procedures", () => {
    for (const text of [
      "A sample size of 120 should be used.", "Ethics approval ID ABC-123 is available.",
      "Participants were recruited and assigned.", "Data were collected before analysis.",
    ]) {
      const unsafe = candidate();
      unsafe.sampling = [statement(text, "AI Proposal")];
      expect(() => validateMethodologyDesignCandidate(unsafe, input)).toThrow(/invents a sample size|AI Proposal must use conditional/);
    }
  });

  it("rejects unclassified, malformed, or self-approved model output", async () => {
    const selfApproved = { ...candidate(), status: "Researcher Approved" };
    await expect(runMethodologyDesignAgent(input, tool(selfApproved))).rejects.toThrow("exactly every required section");
    const malformed = candidate() as unknown as Record<string, unknown>;
    delete malformed.unresolvedQuestions;
    expect(() => validateMethodologyDesignCandidate(malformed, input)).toThrow("exactly every required section");
    const unknownField = candidate() as unknown as Record<string, unknown>;
    (unknownField.sampling as Array<Record<string, unknown>>)[0].unsupported = true;
    expect(() => validateMethodologyDesignCandidate(unknownField, input)).toThrow("invalid methodology statement");
  });

  it("requires a separate attributable human approval and leaves the proposal unchanged", async () => {
    const proposal = await runMethodologyDesignAgent(input, tool(candidate()), () => timestamp);
    expect(() => approveMethodologyDesignProposal(proposal, { uid: "", email: "" }, "", () => timestamp)).toThrow("attributable researcher");
    const approved = approveMethodologyDesignProposal(proposal, { uid: "researcher-2", email: "researcher2@example.org" }, "Reviewed every proposed and missing item.", () => "2026-09-07T04:00:00.000Z");
    expect(proposal).toMatchObject({ status: "AI Suggested", reviewState: "Needs Researcher Review" });
    expect(approved).toMatchObject({
      status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id,
      approvedByUid: "researcher-2", approvedAt: "2026-09-07T04:00:00.000Z",
    });
  });
});
