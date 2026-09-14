import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { createResearchIntakeProposal, confirmResearchIntakeClassification } from "../lib/researchIntakeAgent";
import { runCitationAudit } from "../lib/citationAuditAgent";
import { validateManuscriptNumericContent } from "../lib/aiValidationService";
import { runSpecialistReview } from "../lib/specialistReviewAgents";
import { executeRegisteredAnalysisMethod } from "../lib/statsEngine";
import { transitionAnalysisOutput } from "../lib/analysisLifecycle";
import { createSubmissionPackageManifest, generateBibTeX, generateGenuineDocxBlob, generateLatexManuscript } from "../lib/exportUtils";
import { workflowOrchestrator, type ArtifactState, type WorkflowArtifact, type WorkflowRunRequest } from "../server/workflowOrchestrator";
import type { AnalysisPlan, DatasetRecord, EvidenceRecord, SourceRecord } from "../types";

const actor = { uid: "researcher-1", email: "researcher@example.org" };
const artifact = (key: string, state: ArtifactState = "Researcher Approved", source: WorkflowArtifact["source"] = "TehqIQ Workflow"): WorkflowArtifact => ({ key, state, source });

describe("generic empirical workflow — governed end-to-end fixture", () => {
  it("walks every empirical gate and produces a truthful submission package", async () => {
    const projectId = "project-e2e-empirical";
    const proposal = createResearchIntakeProposal({ projectId, researchDescription: "An economics panel regression of supplied employment data", availableEvidence: "Verified provider literature", availableMethod: "Panel regression", availableData: "Researcher-uploaded CSV" }, () => "2026-09-15T00:00:00.000Z");
    const classification = confirmResearchIntakeClassification(proposal, {}, actor, () => "2026-09-15T00:01:00.000Z");
    expect(classification.status).toBe("Researcher Confirmed");

    const routes: Array<Pick<WorkflowRunRequest, "stage" | "agentId" | "artifacts">> = [
      { stage: "Intake", agentId: "research-intake", artifacts: [artifact("researchDescription", "Available", "Researcher Input")] },
      { stage: "Literature", agentId: "search-planning", artifacts: [artifact("approvedResearchQuestion"), artifact("searchConcepts", "Available", "Researcher Input"), artifact("searchConstraints", "Available", "Researcher Input")] },
      { stage: "Literature", agentId: "literature-retrieval", artifacts: [artifact("approvedSearchPlan")] },
      { stage: "Literature", agentId: "screening", artifacts: [artifact("retrievedSources", "Available", "Verified Provider"), artifact("approvedScreeningCriteria")] },
      { stage: "Evidence", agentId: "evidence-extraction", artifacts: [artifact("verifiedSource", "Verified", "Verified Provider"), artifact("fullTextChunks", "Verified", "Researcher Upload"), artifact("extractionQuestion", "Available", "Researcher Input")] },
      { stage: "Evidence", agentId: "literature-synthesis", artifacts: [artifact("reviewedEvidenceRecords")] },
      { stage: "Evidence", agentId: "contradiction-detection", artifacts: [artifact("reviewedEvidenceRecords"), artifact("reviewedSynthesis")] },
      { stage: "Research Design", agentId: "research-gap", artifacts: [artifact("reviewedSynthesis"), artifact("reviewedContradictions")] },
      { stage: "Research Design", agentId: "question-hypothesis", artifacts: [artifact("researchCanvas", "Available", "Researcher Input"), artifact("confirmedClassification"), artifact("reviewedSynthesis"), artifact("approvedGap")] },
      { stage: "Methodology", agentId: "methodology-design", artifacts: [artifact("approvedResearchQuestion"), artifact("approvedObjectives"), artifact("confirmedClassification"), artifact("reviewedEvidence"), artifact("approvedGap"), artifact("researcherFacts", "Available", "Researcher Input"), artifact("confirmedReportingGuidance")] },
      { stage: "Analysis", agentId: "analysis-planning", artifacts: [artifact("approvedMethodology"), artifact("datasetProfile", "Verified", "Researcher Upload"), artifact("variableDictionary", "Verified", "Researcher Upload"), artifact("approvedResearchQuestions"), artifact("confirmedClassification"), artifact("analysisMethodCapabilities", "Verified")] },
      { stage: "Results", agentId: "results-interpretation-writing", artifacts: [artifact("approvedAnalysisOutputs", "Approved for Manuscript")] },
      { stage: "Writing", agentId: "section-writer", artifacts: [artifact("sectionRequest", "Available", "Researcher Input"), artifact("approvedProjectFacts"), artifact("verifiedSources", "Verified", "Verified Provider")] },
      { stage: "Review", agentId: "peer-review", artifacts: [artifact("manuscriptSections"), artifact("verifiedSources", "Verified", "Verified Provider"), artifact("reviewerRole", "Available", "Researcher Input")] },
      { stage: "Review", agentId: "compliance", artifacts: [artifact("manuscript"), artifact("verifiedOutletRequirements", "Verified", "Verified Provider"), artifact("reportingChecklist", "Verified", "Verified Provider"), artifact("projectGovernance", "Verified", "Researcher Input")] },
      { stage: "Export", agentId: "export", artifacts: [artifact("approvedManuscript"), artifact("verifiedReferences", "Verified", "Verified Provider"), artifact("approvedFigures"), artifact("approvedTables"), artifact("exportConfiguration", "Available", "Researcher Input")] },
    ];
    for (const route of routes) {
      const result = workflowOrchestrator.plan({ projectId, workflowKind: "Empirical", role: "Owner", ...route });
      expect(result.permitted, `${route.agentId} should be dispatchable`).toBe(true);
    }
    expect(routes.flatMap((route) => route.artifacts).some((item) => (item.source as string) === "Synthetic")).toBe(false);

    const source: SourceRecord = { id: "source-fixture", title: "Observed panel evidence", authors: ["Researcher, A."], year: 2024, journalOrVenue: "Observed Journal", doi: "10.1234/fixture", documentType: "Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified", relevanceScore: 8, tags: [], isDemo: false, isSynthetic: false };
    const evidence: EvidenceRecord = { evidenceId: "evidence-fixture", sourceId: source.id, documentVersion: "v1", documentHash: "a".repeat(64), exactPassage: "Observed panel evidence.", extractionMethod: "Researcher Selected", extractedBy: actor.uid, confidence: 1, verification: "Researcher Verified", researcherReview: { status: "Verified", reviewedBy: actor.uid, reviewedAt: "2026-09-15T00:02:00.000Z" }, linkedClaimIds: [], createdAt: "2026-09-15T00:02:00.000Z", updatedAt: "2026-09-15T00:02:00.000Z" };
    const dataset: DatasetRecord = { id: "dataset-fixture", filename: "researcher-upload.csv", fileHash: "b".repeat(64), uploadDate: "2026-09-15T00:03:00.000Z", recordCount: 6, variableCount: 2, variables: [{ name: "group", type: "Categorical", missingCount: 0, uniqueValues: 2 }, { name: "score", type: "Numeric", missingCount: 0, uniqueValues: 6 }], missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Approved for Analysis", rawPreview: [{ group: "A", score: 1 }, { group: "A", score: 2 }, { group: "A", score: 3 }, { group: "B", score: 4 }, { group: "B", score: 5 }, { group: "B", score: 6 }] };
    const plan: AnalysisPlan = { id: "plan-fixture", title: "Approved independent comparison", researchQuestionId: "question-fixture", outcomeVariable: "score", predictorVariables: ["group"], statisticalMethod: "independent-t", assumptions: [], effectSizeMeasure: "Cohen's d", significanceThreshold: 0.05, missingDataStrategy: "Complete cases", status: "Approved", state: "Approved", isPreregistered: false };
    let output = executeRegisteredAnalysisMethod("independent-t", { dataset, plan, outcomeVariable: "score", conditionVariable: "group" });
    output = transitionAnalysisOutput(output, "QC Passed", actor, "Deterministic QC checks passed.", "system");
    output = transitionAnalysisOutput(output, "Researcher Reviewed", actor, "Researcher checked deterministic output.", "human");
    output = transitionAnalysisOutput(output, "Approved for Manuscript", actor, "Researcher approved output for manuscript.", "human");

    const project = createEmptyProject({ id: projectId, title: "Empirical fixture workflow", sources: [source], datasets: [dataset], analysisPlans: [plan], analysisOutputs: [output], authors: [{ id: "author-1", fullName: "Researcher A", publicationName: "Researcher A", email: actor.email, department: "", institution: "", city: "", country: "", isCorresponding: true, order: 1, creditRoles: [], conflictDeclaration: "", finalApproval: true }], aiLedgerIntegrity: { status: "No AI Use Confirmed", assessedAt: "2026-09-15T00:04:00.000Z", assessedByUid: actor.uid, rationale: "No AI-generated content was used in this fixture." } });
    project.sections[1].content = "Observed evidence [source-fixture]."; project.sections[1].citationIds = [source.id]; project.sections[1].status = "Approved";
    const citationReport = await runCitationAudit({ projectId, sections: [project.sections[1]], sources: [source], evidenceRecords: [evidence], bibliography: [{ entryId: "bib-fixture", sourceId: source.id, text: "Researcher (2024)" }] });
    expect(citationReport.status).toBe("PASS");
    expect(validateManuscriptNumericContent([], project).valid).toBe(true);
    expect(runSpecialistReview("StatisticalReviewAgent", true).status).toMatch(/Needs Researcher Review/);

    const docx = await generateGenuineDocxBlob(project); const bibtex = generateBibTeX(project); const latex = generateLatexManuscript(project);
    expect(docx.size).toBeGreaterThan(1000); expect(bibtex).toContain("@article{"); expect(latex).toContain("\\documentclass");
    const manifest = createSubmissionPackageManifest(project, [], [{ path: "manuscript.docx", content: Buffer.from(await docx.arrayBuffer()).toString("base64") }, { path: "references.bib", content: bibtex }, { path: "manuscript.tex", content: latex }], "export-e2e");
    expect(manifest.files.map((file) => file.path)).toEqual(["manuscript.docx", "references.bib", "manuscript.tex"]);
    expect(JSON.stringify(project)).not.toMatch(/isSynthetic[^,]*true|isDemo[^,]*true/);
  });
});
