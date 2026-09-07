import { describe, expect, it } from "vitest";
import type { QualitativeActor, QualitativeAnalysisWorkflow, QualitativeTheme } from "../types";
import {
  addAiSuggestedCode,
  addCodedPassage,
  addCorpusDocument,
  addDisagreement,
  addReflexiveMemo,
  addResearcherCode,
  addTheme,
  approveLatestCodebook,
  approveQualitativeFindings,
  createQualitativeManuscriptOutput,
  createQualitativeWorkflow,
  resolveDisagreement,
  reviewAiCode,
  reviewCodedPassage,
  reviewTheme,
  validateQualitativeWorkflow,
} from "../lib/qualitativeAnalysisWorkflow";

const researcher: QualitativeActor = { uid: "researcher-1", email: "researcher@example.org" };
const passageText = "Participants described the review process as transparent but time consuming.";

const withCorpus = (): QualitativeAnalysisWorkflow => addCorpusDocument(createQualitativeWorkflow("project-qual", "workflow-qual"), {
  id: "doc-1", title: "Researcher-reviewed transcript", artifactId: "artifact-1", artifactHash: "sha256-transcript",
  reviewState: "Researcher Reviewed", reviewedBy: researcher, reviewedAt: "2026-09-08T00:00:00.000Z",
  passages: [{ id: "passage-1", documentId: "doc-1", text: passageText, sourceLocation: "Transcript 1, lines 10-12" }],
});

const withApprovedCodebook = (): QualitativeAnalysisWorkflow => {
  let workflow = addResearcherCode(withCorpus(), "Transparency", "Statements concerning clarity or openness.", researcher, "2026-09-08T00:00:00.000Z");
  workflow = addAiSuggestedCode(workflow, "Process burden", "Statements concerning effort or time burden.", "structured-qualitative-agent-v1", "2026-09-08T00:01:00.000Z");
  const aiCode = workflow.codebookVersions.at(-1)!.codes.find((code) => code.origin === "AI Suggested")!;
  expect(aiCode.status).toBe("AI Suggested");
  workflow = reviewAiCode(workflow, aiCode.id, "Approve", researcher, "Definition matches the reviewed passage and study question.", "2026-09-08T00:02:00.000Z");
  return approveLatestCodebook(workflow, researcher, "Code definitions reviewed for this corpus.", "2026-09-08T00:03:00.000Z");
};

const withReviewedCoding = (): QualitativeAnalysisWorkflow => {
  let workflow = withApprovedCodebook();
  const codebook = workflow.codebookVersions.at(-1)!;
  const code = codebook.codes.find((item) => item.status !== "Rejected")!;
  workflow = addCodedPassage(workflow, {
    id: "coded-1", passageId: "passage-1", codebookVersionId: codebook.id,
    assignments: [{ codeId: code.id, coder: researcher, origin: "Researcher" }], reviewState: "Needs Review",
  });
  return reviewCodedPassage(workflow, "coded-1", researcher, "Coding checked against the exact passage.", "2026-09-08T00:04:00.000Z");
};

const suggestedTheme = (): QualitativeTheme => ({
  id: "theme-1", name: "Transparency with burden",
  analyticStatement: "The reviewed account describes transparency alongside time burden.",
  supportingCodedPassageIds: ["coded-1"],
  supportingQuotations: [{ passageId: "passage-1", quotation: "transparent but time consuming" }],
  origin: "AI Suggested", status: "AI Suggested",
});

describe("governed qualitative analysis workflow", () => {
  it("versions researcher and AI codes while preventing AI self-approval", () => {
    let workflow = addResearcherCode(withCorpus(), "Transparency", "Clarity and openness.", researcher);
    workflow = addAiSuggestedCode(workflow, "Burden", "Time or effort burden.", "qual-agent-v1");
    expect(workflow.codebookVersions.map((version) => version.version)).toEqual([1, 2]);
    expect(workflow.codebookVersions.at(-1)?.state).toBe("Needs Review");
    expect(workflow.codebookVersions.at(-1)?.codes.find((code) => code.origin === "AI Suggested")?.status).toBe("AI Suggested");
    expect(() => approveLatestCodebook(workflow, researcher, "Reviewed.")).toThrow(/AI-suggested codes require researcher disposition/);
  });

  it("requires exact corpus quotations and known coded-passage evidence for themes", () => {
    const workflow = withReviewedCoding();
    expect(() => addTheme(workflow, { ...suggestedTheme(), supportingQuotations: [{ passageId: "passage-1", quotation: "A quotation not in the transcript" }] })).toThrow(/exact text/);
    expect(() => addTheme(workflow, { ...suggestedTheme(), supportingCodedPassageIds: ["unknown-coded-passage"] })).toThrow(/known supporting coded passages/);
  });

  it("requires disagreement resolution followed by attributable passage review", () => {
    let workflow = withApprovedCodebook();
    const codebook = workflow.codebookVersions.at(-1)!;
    workflow = addCodedPassage(workflow, { id: "coded-1", passageId: "passage-1", codebookVersionId: codebook.id, assignments: [{ codeId: codebook.codes[0].id, coder: researcher, origin: "Researcher" }], reviewState: "Needs Review" });
    workflow = addDisagreement(workflow, { id: "disagreement-1", codedPassageId: "coded-1", description: "Coders differed on scope.", status: "Open", raisedBy: researcher });
    expect(() => reviewCodedPassage(workflow, "coded-1", researcher, "Reviewed.")).toThrow(/Open coding disagreements/);
    workflow = resolveDisagreement(workflow, "disagreement-1", "Retain the narrower code after reviewing context.", researcher, "2026-09-08T00:05:00.000Z");
    expect(workflow.codedPassages[0].reviewState).toBe("Needs Review");
    workflow = reviewCodedPassage(workflow, "coded-1", researcher, "Reviewed after documented resolution.", "2026-09-08T00:06:00.000Z");
    expect(workflow.codedPassages[0]).toMatchObject({ reviewState: "Researcher Reviewed", reviewedBy: researcher });
  });

  it("approves reviewed findings and feeds manuscript writing without quantitative output", () => {
    let workflow = addTheme(withReviewedCoding(), suggestedTheme());
    expect(workflow.themes[0].status).toBe("AI Suggested");
    workflow = reviewTheme(workflow, "theme-1", "Approve", researcher, "Theme is grounded in the cited coded passage.", "2026-09-08T00:07:00.000Z");
    workflow = addReflexiveMemo(workflow, "Reviewer considered how the interview guide may have shaped the account.", researcher, "2026-09-08T00:08:00.000Z");
    workflow = approveQualitativeFindings(workflow, researcher, "Corpus, coding, disagreements, themes, and quotations reviewed.", "2026-09-08T00:09:00.000Z");
    const output = createQualitativeManuscriptOutput(workflow);

    expect(workflow.state).toBe("Researcher Approved");
    expect(output.isApproved).toBe(true);
    expect(output.summaryText).toContain("Transparency with burden");
    expect(output.numericResults).toEqual({ analysisType: "Qualitative", quantitativeStatistics: "Not applicable" });
    expect(output.pValues).toEqual([]);
    expect(output.effectSizes).toEqual([]);
    expect(output.warnings[0]).toMatch(/do not imply p-values/);
    expect(output.researcherApproval?.actor).toEqual(researcher);
  });

  it("blocks final approval while coding, disagreements, or themes await review", () => {
    let workflow = addTheme(withReviewedCoding(), suggestedTheme());
    expect(() => approveQualitativeFindings(workflow, researcher, "Premature approval.")).toThrow(/theme requires researcher disposition/i);
    expect(() => createQualitativeManuscriptOutput(workflow)).toThrow(/researcher-approved qualitative findings/);
  });

  it("validates corpus, codebook, coding, and quotation provenance without statistics", () => {
    const workflow = addTheme(withReviewedCoding(), suggestedTheme());
    expect(() => validateQualitativeWorkflow(workflow)).not.toThrow();
    expect(JSON.stringify(workflow)).not.toMatch(/pValue|effectSize|cohens|tStatistic/i);
  });
});
