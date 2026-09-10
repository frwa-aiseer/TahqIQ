import { describe, expect, it } from "vitest";
import {
  createManualSectionDraft,
  runAbstractWriter,
  runConclusionWriter,
  runDiscussionWriter,
  runIntroductionWriter,
  runLiteratureReviewWriter,
  runMethodsWriter,
  type GroundedContentUnit,
  type SectionWriterArtifact,
  type SectionWriterInput,
  type SectionWriterTool,
} from "../lib/manuscriptSectionWriters";
import { runResultsInterpretationAndWritingAgent } from "../lib/resultsInterpretationWritingAgent";
import type { ManuscriptSectionContractId, SectionDraftProposal, SectionInputState } from "../lib/manuscriptSectionContracts";

const timestamp = "2026-09-10T10:00:00.000Z";
const unit = (id: string, text = `Approved statement for ${id}.`, sourceIds: string[] = [], numericEvidence: Array<{ id: string; value: number }> = []): GroundedContentUnit => ({ id, text, evidenceIds: [`evidence-${id}`], sourceIds, numericEvidence });
const artifact = (artifact: string, state: SectionInputState, contentUnit: GroundedContentUnit): SectionWriterArtifact => ({ artifact, state, units: [contentUnit] });
const requiredArtifacts: Record<string, Array<[string, SectionInputState]>> = {
  Introduction: [["approvedProblemStatement", "Researcher Approved"], ["approvedResearchGap", "Researcher Approved"], ["verifiedEvidence", "Verified"]],
  "Literature Review": [["approvedLiteratureSynthesis", "Researcher Approved"], ["verifiedEvidenceGraph", "Verified"]],
  Methods: [["approvedMethodologyOrProtocol", "Researcher Approved"], ["approvedAnalysisPlan", "Researcher Approved"], ["actualEthicsInformation", "Researcher Confirmed"]],
  Discussion: [["approvedResults", "Approved for Manuscript"], ["verifiedLiterature", "Verified"]],
  Conclusion: [["approvedInterpretation", "Researcher Approved"], ["approvedResults", "Approved for Manuscript"]],
  Abstract: [["approvedRelevantSections", "Researcher Approved"], ["approvedResults", "Approved for Manuscript"]],
};

const inputFor = (section: string): SectionWriterInput => ({
  explicitUserRequest: true, projectId: "project-1", projectMode: "Real", userEmail: "researcher@example.org",
  artifacts: requiredArtifacts[section].map(([name, state], index) => artifact(name, state, unit(`${section.toLowerCase().replace(/\s/g, "-")}-${index}`, `Approved ${section} statement ${["alpha", "beta", "gamma"][index]}.`, index ? [] : ["src-verified"]))),
});

const candidateFrom = (sectionId: ManuscriptSectionContractId, input: SectionWriterInput, chosen = input.artifacts[0].units[0]): SectionDraftProposal => ({
  sectionId,
  content: chosen.text,
  claimEvidenceMappings: [{ claimId: chosen.id, claimText: chosen.text, evidenceIds: [...chosen.evidenceIds], sourceIds: [...chosen.sourceIds], numericEvidenceIds: chosen.numericEvidence.map(({ id }) => id) }],
  sourceIds: [...chosen.sourceIds], numericEvidenceIds: chosen.numericEvidence.map(({ id }) => id), missingInformation: [], warnings: [],
  status: "AI Suggested—Needs Researcher Review",
});

const tool = (candidate: unknown, captured?: Record<string, unknown>): SectionWriterTool => ({
  attribution: { provider: "test-provider", model: "test-model", promptVersion: "section-writer-v1" },
  async draft(context) { if (captured) Object.assign(captured, context); return candidate; },
});

describe("evidence-constrained manuscript section writers", () => {
  it.each([
    ["Introduction", runIntroductionWriter], ["Literature Review", runLiteratureReviewWriter], ["Methods", runMethodsWriter],
    ["Discussion", runDiscussionWriter], ["Conclusion", runConclusionWriter], ["Abstract", runAbstractWriter],
  ] as const)("grounds %s through its SectionContract", async (section, writer) => {
    const input = inputFor(section);
    const captured: Record<string, unknown> = {};
    const result = await writer(input, tool(candidateFrom(section, input), captured), () => timestamp);
    expect(result.proposal).toMatchObject({ sectionId: section, status: "AI Suggested—Needs Researcher Review", projectId: "project-1" });
    expect(result.proposal.sourceIds).toEqual(["src-verified"]);
    expect(captured).toMatchObject({ projectId: "project-1", writer: expect.stringMatching(/Writer$/) });
    expect(result.aiUseLog).toMatchObject({ manuscriptSection: section, researcherDecision: "Pending", outputStatus: "AI Suggested—Needs Researcher Review", model: "test-model" });
  });

  it("blocks missing prerequisites, unrequested runs, and real-project demo facts before tool invocation", async () => {
    let calls = 0;
    const never: SectionWriterTool = { ...tool({}), async draft() { calls += 1; return {}; } };
    await expect(runIntroductionWriter({ ...inputFor("Introduction"), artifacts: [] }, never)).rejects.toThrow(/prerequisites failed/);
    await expect(runIntroductionWriter({ ...inputFor("Introduction"), explicitUserRequest: false as true }, never)).rejects.toThrow(/explicit user request/);
    const baseDemo = inputFor("Introduction");
    const demo = { ...baseDemo, artifacts: [{ ...baseDemo.artifacts[0], isSynthetic: true }, ...baseDemo.artifacts.slice(1)] };
    await expect(runIntroductionWriter(demo, never)).rejects.toThrow(/demo\/synthetic/);
    expect(calls).toBe(0);
  });

  it("rejects created references and changed source/evidence mappings", async () => {
    const input = inputFor("Introduction");
    const base = candidateFrom("Introduction", input);
    const invented = { ...base, sourceIds: ["src-invented"], claimEvidenceMappings: [{ ...base.claimEvidenceMappings[0], sourceIds: ["src-invented"] }] };
    await expect(runIntroductionWriter(input, tool(invented))).rejects.toThrow(/changed or omitted its evidence provenance/);
  });

  it("rejects factual methodology text not copied from approved methodology inputs", async () => {
    const input = inputFor("Methods");
    const base = candidateFrom("Methods", input);
    const fabricated = { ...base, content: "Participants were recruited under invented approval.", claimEvidenceMappings: [{ ...base.claimEvidenceMappings[0], claimText: "Participants were recruited under invented approval." }] };
    await expect(runMethodsWriter(input, tool(fabricated))).rejects.toThrow(/copy one supplied grounded content unit exactly/);
  });

  it("rejects altered prose and ungrounded numbers while accepting exact NumericEvidence", async () => {
    const baseInput = inputFor("Discussion");
    const grounded = unit("discussion-number", "The approved estimate was 2.5.", [], [{ id: "numeric-1", value: 2.5 }]);
    const input = { ...baseInput, artifacts: [artifact("approvedResults", "Approved for Manuscript", grounded), ...baseInput.artifacts.slice(1)] };
    await expect(runDiscussionWriter(input, tool(candidateFrom("Discussion", input, grounded)))).resolves.toBeDefined();
    const base = candidateFrom("Discussion", input, grounded);
    await expect(runDiscussionWriter(input, tool({ ...base, content: "The approved estimate was 9.9.", claimEvidenceMappings: [{ ...base.claimEvidenceMappings[0], claimText: "The approved estimate was 9.9." }] }))).rejects.toThrow(/copy one supplied grounded content unit exactly/);
  });

  it("keeps Results on the existing governed ResultsInterpretationAndWritingAgent path", () => {
    expect(typeof runResultsInterpretationAndWritingAgent).toBe("function");
  });

  it("preserves a separate manual-writing path without an AI status or AI-use event", () => {
    expect(createManualSectionDraft("Introduction", "Researcher-authored text.")).toEqual({ sectionId: "Introduction", content: "Researcher-authored text.", origin: "Manual", status: "Researcher Draft" });
  });
});
