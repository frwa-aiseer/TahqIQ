import { describe, expect, it } from "vitest";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
import { createEmptyProject } from "../data/demoProject";
import { createResearchIntakeProposal, confirmResearchIntakeClassification } from "../lib/researchIntakeAgent";
import { runCitationAudit } from "../lib/citationAuditAgent";
import { runJournalComplianceAgent } from "../lib/complianceEngine";
import { createSubmissionPackageManifest, generateBibTeX, generateGenuineDocxBlob, generateLatexManuscript } from "../lib/exportUtils";
import { runSpecialistReview } from "../lib/specialistReviewAgents";
import {
  addAiSuggestedCode,
  addCodedPassage,
  addCorpusDocument,
  addReflexiveMemo,
  addResearcherCode,
  addTheme,
  approveLatestCodebook,
  approveQualitativeFindings,
  createQualitativeManuscriptOutput,
  createQualitativeWorkflow,
  reviewAiCode,
  reviewCodedPassage,
  reviewTheme,
  validateQualitativeWorkflow,
} from "../lib/qualitativeAnalysisWorkflow";
import type { EvidenceRecord, QualitativeActor, QualitativeTheme, SourceRecord } from "../types";

const researcher: QualitativeActor = { uid: "qual-researcher", email: "researcher@example.org" };
const timestamp = "2026-09-15T00:00:00.000Z";
const passageText = "Participants described the review process as transparent but time consuming.";

describe("qualitative workflow — governed end-to-end fixture", () => {
  it("classifies, reviews, approves, validates, reviews, and exports qualitative Findings", async () => {
    const projectId = "project-e2e-qualitative";
    const intake = createResearchIntakeProposal({ projectId, researchDescription: "Qualitative interviews about the transparency of a review process", availableEvidence: "Verified provider literature", availableMethod: "Semi-structured interviews", availableData: "Researcher-uploaded transcript" }, () => timestamp);
    const classification = confirmResearchIntakeClassification(intake, {}, researcher, () => timestamp);
    expect(classification.candidateStudyType).toBe("Original qualitative research");
    expect(classification.status).toBe("Researcher Confirmed");

    const transcript = {
      id: "transcript-1", title: "Researcher-reviewed interview transcript", artifactId: "upload-1", artifactHash: "a".repeat(64),
      reviewState: "Researcher Reviewed" as const, reviewedBy: researcher, reviewedAt: timestamp,
      passages: [{ id: "passage-1", documentId: "transcript-1", text: passageText, sourceLocation: "Transcript 1, lines 10-12" }],
    };
    let workflow = addCorpusDocument(createQualitativeWorkflow(projectId, "qual-workflow-e2e"), transcript);
    workflow = addResearcherCode(workflow, "Transparency", "Statements concerning clarity or openness.", researcher, timestamp);
    workflow = addAiSuggestedCode(workflow, "Process burden", "Statements concerning effort or time burden.", "structured-qualitative-agent-v1", timestamp);
    const aiCode = workflow.codebookVersions.at(-1)!.codes.find((code) => code.origin === "AI Suggested")!;
    expect(aiCode.status).toBe("AI Suggested");
    expect(() => approveLatestCodebook(workflow, researcher, "Premature approval must be blocked.", timestamp)).toThrow(/AI-suggested codes require researcher disposition/);
    workflow = reviewAiCode(workflow, aiCode.id, "Approve", researcher, "Definition matches the reviewed transcript.", timestamp);
    workflow = approveLatestCodebook(workflow, researcher, "Code definitions reviewed against the transcript.", timestamp);

    const codebook = workflow.codebookVersions.at(-1)!;
    workflow = addCodedPassage(workflow, { id: "coded-1", passageId: "passage-1", codebookVersionId: codebook.id, assignments: [{ codeId: codebook.codes.find((code) => code.status !== "Rejected")!.id, coder: researcher, origin: "Researcher" }], reviewState: "Needs Review" });
    workflow = reviewCodedPassage(workflow, "coded-1", researcher, "Coding checked against the exact transcript passage.", timestamp);
    const theme: QualitativeTheme = { id: "theme-1", name: "Transparency with burden", analyticStatement: "The reviewed account describes transparency alongside time burden.", supportingCodedPassageIds: ["coded-1"], supportingQuotations: [{ passageId: "passage-1", quotation: "transparent but time consuming" }], origin: "AI Suggested", status: "AI Suggested" };
    workflow = addTheme(workflow, theme);
    expect(workflow.themes[0].status).toBe("AI Suggested");
    workflow = reviewTheme(workflow, theme.id, "Approve", researcher, "Theme is grounded in the exact reviewed quotation.", timestamp);
    workflow = addReflexiveMemo(workflow, "Researcher documented how the interview guide may have shaped the account.", researcher, timestamp);
    workflow = approveQualitativeFindings(workflow, researcher, "Corpus, coding, quotations, and retained themes reviewed.", timestamp);
    validateQualitativeWorkflow(workflow);

    const findings = createQualitativeManuscriptOutput(workflow);
    expect(findings.summaryText).toContain("Transparency with burden");
    expect(findings.pValues).toEqual([]);
    expect(findings.effectSizes).toEqual([]);
    expect(findings.numericResults).toEqual({ analysisType: "Qualitative", quantitativeStatistics: "Not applicable" });
    expect(findings.warnings.join(" ")).toMatch(/do not imply p-values/i);

    const literatureSource: SourceRecord = { id: "source-lit", title: "Observed qualitative review evidence", authors: ["Researcher, A."], year: 2024, journalOrVenue: "Observed Journal", doi: "10.1234/qual-fixture", documentType: "Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified", relevanceScore: 8, tags: [], isDemo: false, isSynthetic: false };
    const literatureEvidence: EvidenceRecord = { evidenceId: "evidence-lit", sourceId: literatureSource.id, documentVersion: "v1", documentHash: "b".repeat(64), exactPassage: "Observed literature passage.", extractionMethod: "Researcher Selected", extractedBy: researcher.uid, confidence: 1, verification: "Researcher Verified", researcherReview: { status: "Verified", reviewedBy: researcher.uid, reviewedAt: timestamp }, linkedClaimIds: [], createdAt: timestamp, updatedAt: timestamp };
    const project = createEmptyProject({ id: projectId, title: "Qualitative fixture workflow", sources: [literatureSource], evidenceRecords: [literatureEvidence], selectedTargetOutlet: BASELINE_JOURNALS[0], authors: [{ id: "author-1", fullName: "Researcher A", publicationName: "Researcher A", email: researcher.email, department: "", institution: "", city: "", country: "", isCorresponding: true, order: 1, creditRoles: [], conflictDeclaration: "", finalApproval: true }], aiLedger: [{ id: "ai-qual-1", timestamp, userEmail: researcher.email, featureUsed: "Qualitative code suggestion", model: "structured-qualitative-agent-v1", promptVersion: "qual-v1", inputSourcesUsed: [transcript.artifactId], generatedSummary: "Suggested a candidate code for researcher review.", userDecision: "Accepted" }], aiLedgerIntegrity: { status: "Complete", assessedAt: timestamp, assessedByUid: researcher.uid, rationale: "The qualitative suggestion was reviewed and accepted by the researcher." } });
    project.sections = project.sections.map((section) => section.title === "Results" ? { ...section, title: "Findings", content: findings.summaryText, status: "Approved" as const } : section.title === "Discussion" ? { ...section, content: "The reviewed literature [source-lit] provides context for the participant account.", citationIds: [literatureSource.id], status: "Approved" as const } : section);
    project.analysisOutputs = [findings];

    const discussion = project.sections.find((section) => section.title === "Discussion")!;
    const citationAudit = await runCitationAudit({ projectId, sections: [discussion], sources: [literatureSource], evidenceRecords: [literatureEvidence], bibliography: [{ entryId: "bib-lit", sourceId: literatureSource.id, text: "Researcher (2024)" }] });
    expect(citationAudit.status).toBe("PASS");
    expect(runSpecialistReview("DomainReviewAgent", true).status).toBe("AI Suggested—Needs Researcher Review");
    const compliance = runJournalComplianceAgent(project);
    expect(compliance.some((rule) => rule.status === "Fail")).toBe(false);

    const docx = await generateGenuineDocxBlob(project);
    const bibtex = generateBibTeX(project);
    const latex = generateLatexManuscript(project);
    expect(docx.size).toBeGreaterThan(1000);
    expect(bibtex).toContain("@article{");
    expect(latex).toContain("\\documentclass");
    const manifest = createSubmissionPackageManifest(project, [], [
      { path: "manuscript.docx", content: Buffer.from(await docx.arrayBuffer()).toString("base64") },
      { path: "references.bib", content: bibtex }, { path: "manuscript.tex", content: latex },
    ], "export-qualitative-e2e");
    expect(manifest.files.map((file) => file.path)).toEqual(["manuscript.docx", "references.bib", "manuscript.tex"]);
    expect(JSON.stringify(project)).not.toMatch(/isDemo(?:Project)?\"?:true|isSynthetic\"?:true/);
  });
});
