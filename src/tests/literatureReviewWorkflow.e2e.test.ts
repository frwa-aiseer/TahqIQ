import { describe, expect, it } from "vitest";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
import { createEmptyProject } from "../data/demoProject";
import { createResearchIntakeProposal, confirmResearchIntakeClassification } from "../lib/researchIntakeAgent";
import { createSearchExecution } from "../lib/searchExecution";
import { runLiteratureRetrievalAgent } from "../lib/literatureRetrievalAgent";
import { deduplicateSources } from "../lib/sourceDeduplication";
import { runLiteratureScreeningAgent, recordResearcherScreeningDecision } from "../lib/literatureScreeningAgent";
import { runEvidenceExtractionAgent } from "../lib/evidenceExtractionAgent";
import { runContradictionDetectionAgent } from "../lib/contradictionDetectionAgent";
import { runLiteratureSynthesisAgent } from "../lib/literatureSynthesisAgent";
import { runResearchGapAgent } from "../lib/researchGapAgent";
import { runCitationAudit } from "../lib/citationAuditAgent";
import { runJournalComplianceAgent } from "../lib/complianceEngine";
import { confirmReportingGuideline, resolveReportingGuideline, assessReportingChecklistItem } from "../lib/reportingGuidelineRegistry";
import { createSubmissionPackageManifest, generateBibTeX, generateGenuineDocxBlob, generateLatexManuscript } from "../lib/exportUtils";
import type { MetadataProviderResult } from "../lib/metadataProviders";
import type { EvidenceRecord, FullTextChunk, SearchExecutionSource, SourceRecord } from "../types";

const projectId = "project-e2e-review";
const researcher = { uid: "reviewer-1", email: "reviewer@example.org" };
const now = () => "2026-09-15T00:00:00.000Z";

function providerResult(provider: "Crossref" | "OpenAlex", doi: string, title: string): MetadataProviderResult {
  return {
    success: true,
    providerId: provider === "Crossref" ? "crossref" : "openalex",
    providerName: provider,
    providerRecordId: `${provider.toLowerCase()}-${doi.split("/").at(-1)}`,
    doi,
    identifiers: { doi },
    title,
    authors: ["Observed, A."],
    year: 2024,
    journalOrVenue: "Observed Review Journal",
    retrievedAt: now(),
    rawUrl: `https://provider.example/${provider.toLowerCase()}/${encodeURIComponent(doi)}`,
  };
}

function toSource(record: SearchExecutionSource): SourceRecord {
  return {
    id: record.sourceId,
    title: record.title || "Not available",
    authors: record.authors || [],
    year: record.year || 0,
    journalOrVenue: record.journalOrVenue || "Not available",
    doi: record.doi,
    documentType: "Article",
    peerReviewStatus: "Unknown",
    verificationState: "Verified",
    metadataProvider: record.provider,
    providerRecordId: record.providerRecordId,
    provenance: { provider: record.provider, providerId: record.providerId, retrievedAt: record.retrievedAt },
    relevanceScore: 8,
    tags: [],
    isDemo: false,
    isSynthetic: false,
  };
}

function chunkFor(source: SourceRecord, index: number): FullTextChunk {
  const text = `The reviewed source ${source.title} reports an observed limitation in the included evidence.`;
  return {
    chunkId: `chunk-${index}`,
    projectId,
    sourceId: source.id,
    documentHash: `${String(index).repeat(64)}`,
    documentVersion: "accepted-v1",
    chunkIndex: 0,
    text,
    page: 2,
    section: "Limitations",
    surroundingContext: { sourceBlockId: `block-${index}`, sourceLocation: `page:2;section:Limitations`, characterStart: 0, characterEnd: text.length },
    provenance: { ingestionJobId: `job-${index}`, parserId: "researcher-transcript-import", parserVersion: "1", extractedBlockId: `block-${index}` },
    createdAt: now(),
    isDemo: false,
    isSynthetic: false,
  };
}

function reviewed(record: EvidenceRecord): EvidenceRecord {
  return { ...record, verification: "Researcher Verified", researcherReview: { status: "Verified", reviewedBy: researcher.uid, reviewedAt: now(), notes: "Checked against the imported full text." } };
}

describe("review-project literature/systematic-review workflow", () => {
  it("runs question, provider retrieval, screening, evidence, synthesis, gap, review, compliance, and export without a dataset", async () => {
    const intake = createResearchIntakeProposal({ projectId, researchDescription: "Systematic review of evidence on transparent review processes", availableEvidence: "Verified provider literature", availableMethod: "Systematic review protocol", availableData: "Not applicable — literature corpus" }, now);
    const classification = confirmResearchIntakeClassification(intake, {}, researcher, now);
    expect(classification.candidateStudyType).toBe("Systematic review");

    const searchPlan = { planId: "search-plan-e2e", projectId, context: "Researcher-approved systematic review search", concepts: [{ concept: "transparent review", synonyms: ["open review"] }], providers: ["Crossref", "OpenAlex"] as const, filters: { maxResultsPerProvider: 5 }, approval: { researcherUid: researcher.uid, researcherEmail: researcher.email, approvedAt: now(), rationale: "Approved provider scope and exact search concepts." } };
    const designedSearch = createSearchExecution({ projectId, context: searchPlan.context, concepts: searchPlan.concepts, providers: [...searchPlan.providers], filters: searchPlan.filters }, now());
    expect(designedSearch.providerSyntax.Crossref).toContain("transparent review");
    const retrieval = await runLiteratureRetrievalAgent(projectId, { ...searchPlan, providerSyntax: designedSearch.providerSyntax, providers: [...searchPlan.providers] }, {
      now,
      allowedTools: {
        Crossref: async () => ({ results: [providerResult("Crossref", "10.1234/review-shared", "Observed review evidence"), providerResult("Crossref", "10.1234/review-one", "Observed review evidence one")] }),
        OpenAlex: async () => ({ results: [providerResult("OpenAlex", "10.1234/review-shared", "Observed review evidence"), providerResult("OpenAlex", "10.1234/review-two", "Observed review evidence two")] }),
      },
    });
    expect(retrieval.status).toBe("Completed");
    expect(retrieval.records).toHaveLength(4);
    const deduped = deduplicateSources(retrieval.records.map(toSource));
    expect(deduped.duplicateGroups).toHaveLength(1);
    expect(deduped.sources).toHaveLength(3);
    expect(deduped.sources.every((source) => source.verificationState === "Verified" && !source.isDemo && !source.isSynthetic)).toBe(true);

    const criteria = [{ criterionId: "include-review", projectId, kind: "Include" as const, description: "Review-process evidence", keywords: ["review"], keywordMatch: "Any" as const, approval: { status: "Approved" as const, approvedByUid: researcher.uid, approvedByEmail: researcher.email, approvedAt: now() } }];
    const screeningRecords = deduped.sources.map((source) => {
      const suggestion = runLiteratureScreeningAgent(projectId, source, criteria, now);
      expect(suggestion.outcome).toBe("Suggested Include");
      return recordResearcherScreeningDecision({ sourceId: source.id, suggestion, decisionAudit: [] }, "Included", "Included under the approved review criteria.", researcher, now);
    });
    expect(screeningRecords.every((record) => record.researcherDecision?.decision === "Included")).toBe(true);

    const extractionResults = await Promise.all(deduped.sources.slice(0, 2).map(async (source, index) => {
      const chunk = chunkFor(source, index + 1);
      const exact = chunk.text;
      const proposal = await runEvidenceExtractionAgent({ projectId, questionOrClaim: "What limitation is reported?", chunks: [chunk] }, {
        extractorId: "evidence-extraction-fixture", now,
        propose: async () => ({ proposition: exact, passages: [{ chunkId: chunk.chunkId, exactPassage: exact }], context: { status: "Not Available", text: "Not available in supplied chunks.", chunkIds: [] }, population: { status: "Not Available", text: "Not available in supplied chunks.", chunkIds: [] }, method: { status: "Not Available", text: "Not available in supplied chunks.", chunkIds: [] }, result: { status: "Not Available", text: "Not available in supplied chunks.", chunkIds: [] }, limitations: { status: "Available", text: exact, chunkIds: [chunk.chunkId] }, relationship: "Supports", confidence: 0.8 }),
      });
      return reviewed(proposal.evidenceRecords[0]);
    }));
    expect(extractionResults.every((record) => record.verification === "Researcher Verified")).toBe(true);

    const synthesis = await runLiteratureSynthesisAgent({ projectId, researchQuestion: "What limitations are reported?", evidenceRecords: extractionResults }, {
      synthesizerId: "literature-synthesis-fixture", now,
      propose: async () => ({ themes: [{ text: "The reviewed sources report a limitation.", classification: "Evidence-Grounded", supportingEvidenceIds: extractionResults.map((record) => record.evidenceId), conflictingEvidenceIds: [] }], methodologicalDifferences: [], contextDifferences: [{ text: "The reviewed sources represent different contexts.", classification: "Evidence-Grounded", supportingEvidenceIds: [extractionResults[0].evidenceId], conflictingEvidenceIds: [] }], limitations: [{ text: "The reviewed sources report limited follow-up.", classification: "Evidence-Grounded", supportingEvidenceIds: [extractionResults[0].evidenceId], conflictingEvidenceIds: [] }], unresolvedQuestions: [], candidateSynthesisStatements: [] }),
    });
    const reviewedSynthesis = { ...synthesis, reviewState: "Researcher Reviewed" as const, researcherReview: { reviewedByUid: researcher.uid, reviewedAt: now(), rationale: "Synthesis checked against each reviewed evidence record." } };
    const contradiction = await runContradictionDetectionAgent({ projectId, researchQuestion: "Why do the reviewed contexts differ?", evidenceRecords: extractionResults }, {
      detectorId: "contradiction-fixture", now,
      propose: async () => [{ topic: "Different reviewed contexts", supportingEvidenceIds: [extractionResults[0].evidenceId], contradictoryEvidenceIds: [extractionResults[1].evidenceId], contextualReasons: [{ text: "The reviewed sources describe different contexts.", evidenceIds: extractionResults.map((record) => record.evidenceId) }], methodologicalReasons: [{ text: "The reviewed sources use different reporting contexts.", evidenceIds: extractionResults.map((record) => record.evidenceId) }], uncertainty: { text: "The supplied evidence does not resolve the contextual difference.", evidenceIds: extractionResults.map((record) => record.evidenceId) } }],
    });
    const reviewedContradiction = contradiction.map((group) => ({ ...group, reviewState: "Researcher Reviewed" as const, researcherReview: { reviewedByUid: researcher.uid, reviewedAt: now(), rationale: "Contradiction comparison checked without adjudicating truth." } }));
    const gap = await runResearchGapAgent({ projectId, reviewedSynthesis, reviewedContradictions: reviewedContradiction, limitations: reviewedSynthesis.limitations, context: reviewedSynthesis.contextDifferences }, {
      generatorId: "research-gap-fixture", now,
      propose: async () => [{ gapStatement: "Within the reviewed evidence, longer follow-up remains insufficiently compared.", type: "Temporal", supportingEvidenceIds: [extractionResults[0].evidenceId], contradictingEvidenceIds: [], confidence: 0.7, caution: "This gap is limited to the reviewed evidence and does not establish universal novelty.", newResearchAddressesIt: "A future review could compare longer follow-up records." }],
    });
    expect(gap[0].status).toBe("AI Suggested");

    const reporting = confirmReportingGuideline(resolveReportingGuideline("Systematic review").guideline!, researcher);
    const assessedReporting = assessReportingChecklistItem(reporting, reporting.checklistItems[0].id, { status: "Addressed", manuscriptLocation: "Methods: Search strategy", evidenceArtifactIds: [searchPlan.planId] }, researcher, new Set([searchPlan.planId]), now);
    expect(assessedReporting.checklistItems[0].status).toBe("Addressed");
    const sourceById = new Map(deduped.sources.map((source) => [source.id, source]));
    const discussion = { id: "discussion", title: "Discussion", order: 1, currentWordCount: 12, content: `The reviewed literature reports a bounded limitation [${deduped.sources[0].id}].`, citationIds: [deduped.sources[0].id], status: "Approved" as const, version: 1, lastEditedBy: researcher.uid, lastEditedTimestamp: now() };
    const citationAudit = await runCitationAudit({ projectId, sections: [discussion], sources: [...sourceById.values()], evidenceRecords: extractionResults, bibliography: [{ entryId: "bib-1", sourceId: deduped.sources[0].id, text: "Observed (2024)" }] });
    expect(citationAudit.status).toBe("PASS");

    const project = createEmptyProject({ id: projectId, title: "Evidence review fixture", projectType: "Systematic review", isDemoProject: false, sources: [...sourceById.values()], evidenceRecords: extractionResults, reportingGuideline: assessedReporting, selectedTargetOutlet: BASELINE_JOURNALS[0], authors: [{ id: "author-1", fullName: "Researcher A", publicationName: "Researcher A", email: researcher.email, department: "", institution: "", city: "", country: "", isCorresponding: true, order: 1, creditRoles: [], conflictDeclaration: "", finalApproval: true, approvalActorUid: researcher.uid, approvalTimestamp: now(), approvalRationale: "Researcher reviewed the manuscript sign-off record." }], aiLedger: [{ id: "ai-review-1", timestamp: now(), userEmail: researcher.email, featureUsed: "Literature review proposals", model: "review-fixture", promptVersion: "review-v1", inputSourcesUsed: extractionResults.map((record) => record.evidenceId), generatedSummary: "Proposals remained subject to researcher review.", userDecision: "Accepted" }], aiLedgerIntegrity: { status: "Complete", assessedAt: now(), assessedByUid: researcher.uid, rationale: "AI proposal use was reviewed and disclosed." } });
    project.sections = [discussion, { ...project.sections[0], title: "Methods", content: "Search strategy and screening criteria were researcher approved.", status: "Approved" }, { ...project.sections[1], title: "Introduction", content: "The reviewed evidence establishes the bounded context.", citationIds: [deduped.sources[0].id], status: "Approved" }, { ...project.sections[2], title: "Declarations", content: "Artificial intelligence assistance was limited to review proposals and was checked by the researcher.", status: "Approved" }];
    project.datasets = [];
    project.analysisOutputs = [];
    const compliance = runJournalComplianceAgent(project);
    expect(compliance.some((rule) => rule.status === "Fail")).toBe(false);
    expect(project.datasets).toHaveLength(0);
    const bibtex = generateBibTeX(project); const latex = generateLatexManuscript(project); const docx = await generateGenuineDocxBlob(project);
    expect(bibtex).toContain("@article{"); expect(latex).toContain("\\documentclass"); expect(docx.size).toBeGreaterThan(1000);
    const manifest = createSubmissionPackageManifest(project, [], [{ path: "review.docx", content: Buffer.from(await docx.arrayBuffer()).toString("base64") }, { path: "references.bib", content: bibtex }, { path: "review.tex", content: latex }], "export-review-e2e");
    expect(manifest.files.map((file) => file.path)).toEqual(["review.docx", "references.bib", "review.tex"]);
    expect(JSON.stringify(project)).not.toMatch(/isDemo(?:Project)?\"?:true|isSynthetic\"?:true/);
    expect(gap[0].status).toBe("AI Suggested");
  });
});
