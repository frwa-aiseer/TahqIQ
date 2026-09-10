import { describe, expect, it } from "vitest";
import { runManuscriptEditorAgent, validateManuscriptEditCandidate, type ManuscriptEditorInput, type ManuscriptEditorTool } from "../lib/manuscriptEditorAgent";

const timestamp = "2026-09-10T11:00:00.000Z";
const input: ManuscriptEditorInput = {
  explicitUserRequest: true, projectId: "project-1", userEmail: "researcher@example.org", sectionId: "Discussion", approvedSectionId: "section-1",
  approvedClaims: [
    { claimId: "claim-1", text: "The approved estimate was 2.5 and may suggest a positive association [src-one].", evidenceIds: ["evidence-1"], sourceIds: ["src-one"], numericEvidenceIds: ["numeric-1"] },
    { claimId: "claim-2", text: "The finding may be interpreted cautiously.", evidenceIds: ["evidence-2"], sourceIds: [], numericEvidenceIds: [] },
  ],
  operations: ["Remove Repetition", "Improve Transitions/Order", "Harmonize Terms/Acronyms", "Meet Word Limit"],
  approvedTerminology: [{ from: "estimate", to: "estimated value" }], approvedCrossReferences: ["the Methods section"], wordLimit: 40,
};
const candidate = {
  editedClaims: [
    { claimId: "claim-2", beforeText: input.approvedClaims[1].text, afterText: "However, the finding may be interpreted cautiously.", evidenceIds: ["evidence-2"], sourceIds: [], numericEvidenceIds: [] },
    { claimId: "claim-1", beforeText: input.approvedClaims[0].text, afterText: input.approvedClaims[0].text, evidenceIds: ["evidence-1"], sourceIds: ["src-one"], numericEvidenceIds: ["numeric-1"] },
  ],
  removedClaimIds: [],
  proposedContent: `However, the finding may be interpreted cautiously.\n\n${input.approvedClaims[0].text}`,
  changeSummary: [{ operation: "Improve Transitions/Order", description: "Reordered the approved claims and added a transition." }],
  warnings: ["Researcher review required."], status: "AI Suggested—Needs Researcher Review",
} as const;
const tool = (output: unknown, called?: { count: number }): ManuscriptEditorTool => ({
  attribution: { provider: "test-provider", model: "test-model", promptVersion: "editor-v1" },
  async edit() { if (called) called.count += 1; return output; },
});

describe("non-inventive ManuscriptEditorAgent", () => {
  it("allows bounded style/order edits and records pre/post claims plus pending AI use", async () => {
    const proposal = await runManuscriptEditorAgent(input, tool(candidate), () => timestamp);
    expect(proposal).toMatchObject({ status: "AI Suggested—Needs Researcher Review", sourceSectionId: "section-1", generator: { model: "test-model" } });
    expect(proposal.prePostClaimComparison.map(({ disposition }) => disposition)).toEqual(["Unchanged", "Edited"]);
    expect(proposal.aiUseLog).toMatchObject({ researcherDecision: "Pending", sourceClaimIds: ["claim-1", "claim-2"] });
  });

  it("catches an editor-introduced unsupported claim", () => {
    const unsupported = { ...candidate, editedClaims: [{ ...candidate.editedClaims[0], afterText: "However, the treatment may be interpreted cautiously." }, candidate.editedClaims[1]], proposedContent: `However, the treatment may be interpreted cautiously.\n\n${input.approvedClaims[0].text}` };
    expect(() => validateManuscriptEditCandidate(unsupported, input)).toThrow(/unsupported claim vocabulary 'treatment'/);
  });

  it("blocks added citations, numbers, and changed statistical meaning", () => {
    const first = candidate.editedClaims[1];
    const replaceFirst = (afterText: string) => ({ ...candidate, editedClaims: [candidate.editedClaims[0], { ...first, afterText }], proposedContent: `${candidate.editedClaims[0].afterText}\n\n${afterText}` });
    expect(() => validateManuscriptEditCandidate(replaceFirst(`${first.afterText} [src-new]`), input)).toThrow(/citations/);
    expect(() => validateManuscriptEditCandidate(replaceFirst(first.afterText.replace("2.5", "9.9")), input)).toThrow(/numerical/);
    expect(() => validateManuscriptEditCandidate(replaceFirst(first.afterText.replace("positive", "negative")), input)).toThrow(/meaning term/);
  });

  it("blocks removal of uncertainty and overstated conclusions", () => {
    const first = candidate.editedClaims[1];
    const replaceFirst = (afterText: string) => ({ ...candidate, editedClaims: [candidate.editedClaims[0], { ...first, afterText }], proposedContent: `${candidate.editedClaims[0].afterText}\n\n${afterText}` });
    expect(() => validateManuscriptEditCandidate(replaceFirst(first.afterText.replace("may ", "")), input)).toThrow(/removed uncertainty/);
    expect(() => validateManuscriptEditCandidate(replaceFirst(first.afterText.replace("may suggest", "definitively proves")), input)).toThrow(/removed uncertainty|meaning term|overstated|unsupported/);
  });

  it("blocks new claim IDs, changed provenance, unaccounted claims, and self-approval", () => {
    expect(() => validateManuscriptEditCandidate({ ...candidate, editedClaims: [{ ...candidate.editedClaims[0], claimId: "new-claim" }, candidate.editedClaims[1]] }, input)).toThrow(/unsupported or duplicate claim/);
    expect(() => validateManuscriptEditCandidate({ ...candidate, editedClaims: [{ ...candidate.editedClaims[0], evidenceIds: ["invented"] }, candidate.editedClaims[1]] }, input)).toThrow(/changed provenance/);
    expect(() => validateManuscriptEditCandidate({ ...candidate, editedClaims: [candidate.editedClaims[0]], proposedContent: candidate.editedClaims[0].afterText }, input)).toThrow(/Every pre-edit claim/);
    expect(() => validateManuscriptEditCandidate({ ...candidate, status: "Researcher Approved" }, input)).toThrow(/cannot self-approve/);
  });

  it("enforces word limits and registered requested operations", () => {
    expect(() => validateManuscriptEditCandidate(candidate, { ...input, wordLimit: 3 })).toThrow(/word limit/);
    expect(() => validateManuscriptEditCandidate({ ...candidate, changeSummary: [{ operation: "Update Cross-references", description: "Changed reference." }] }, input)).toThrow(/change summary/);
  });

  it("allows approved structural cross-references but blocks deletion of unique claims", () => {
    const crossReferenceInput = { ...input, approvedCrossReferences: ["See Section 2"] };
    const first = candidate.editedClaims[1];
    const afterText = `${first.afterText} See Section 2`;
    expect(() => validateManuscriptEditCandidate({ ...candidate, editedClaims: [candidate.editedClaims[0], { ...first, afterText }], proposedContent: `${candidate.editedClaims[0].afterText}\n\n${afterText}` }, crossReferenceInput)).not.toThrow();
    expect(() => validateManuscriptEditCandidate({ ...candidate, editedClaims: [candidate.editedClaims[0]], removedClaimIds: ["claim-1"], proposedContent: candidate.editedClaims[0].afterText }, input)).toThrow(/unique and cannot be removed/);
  });

  it("does not call the tool without an explicit request and approved claims", async () => {
    const called = { count: 0 };
    await expect(runManuscriptEditorAgent({ ...input, explicitUserRequest: false as true }, tool(candidate, called))).rejects.toThrow(/explicit user request/);
    await expect(runManuscriptEditorAgent({ ...input, approvedClaims: [] }, tool(candidate, called))).rejects.toThrow(/approved source claim/);
    expect(called.count).toBe(0);
  });
});
