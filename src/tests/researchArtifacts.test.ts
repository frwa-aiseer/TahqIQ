import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { adaptProjectResearchArtifacts, hydrateProjectResearchArtifacts } from "../lib/researchArtifacts";
import type { ProjectState, ResearchArtifact } from "../types";

function legacyProject(): ProjectState {
  const project = createEmptyProject({ title: "Legacy project" });
  project.id = "legacy-project";
  project.ownerUid = "owner-1";
  project.sources = [{
    id: "source-1", title: "Verified source", authors: [], year: 2024, journalOrVenue: "Journal",
    documentType: "Article", peerReviewStatus: "Peer-reviewed", verificationState: "Verified",
    relevanceScore: 8, tags: [],
  }];
  project.numericEvidenceRecords = [{
    id: "evidence-1", value: 2, normalizedValue: 2, sourceType: "DATASET", sourceId: "dataset-1",
    datasetHash: "hash-1", verificationState: "Verified", createdAt: "2026-01-02T00:00:00.000Z",
  }];
  project.methodologyWorkspace = {
    sourceMode: "Researcher Entered", reviewState: "Researcher Approved",
    fields: { design: "", populationOrDataSource: "", sampling: "", eligibility: "", interventionExposureComparator: "", variablesOrOutcomes: "", instruments: "", dataCollection: "", analysisPlan: "", ethics: "", limitations: "" },
    researcherApproval: { approvedAt: "2026-01-03T00:00:00.000Z", approvedByUid: "owner-1" },
    updatedAt: "2026-01-03T00:00:00.000Z",
  };
  project.datasets = [{
    id: "dataset-1", filename: "data.csv", fileHash: "hash-1", uploadDate: "2026-01-01T00:00:00.000Z",
    recordCount: 0, variableCount: 0, variables: [], missingnessPercent: 0, isAnonymizedConfirmed: true,
    state: "Approved for Analysis",
  }];
  project.analysisPlans = [{
    id: "plan-1", title: "Plan", researchQuestionId: "rq-1", outcomeVariable: "outcome",
    predictorVariables: [], statisticalMethod: "Researcher specified", assumptions: [], effectSizeMeasure: "Researcher specified",
    significanceThreshold: 0.05, missingDataStrategy: "Researcher specified", status: "Approved", isPreregistered: false,
  }];
  project.analysisOutputs = [{
    id: "output-1", analysisPlanId: "plan-1", executionTimestamp: "2026-01-04T00:00:00.000Z",
    softwareEnvironment: "Verified environment", summaryText: "", numericResults: {}, pValues: [], effectSizes: [],
    assumptionChecks: [], isReproduced: false, reproducibilityHash: "result-hash",
  }];
  project.tables = [{ id: "table-1", number: 1, title: "Table", caption: "", headers: [], rows: [], analysisRunId: "output-1", isApproved: false }];
  project.figures = [{ id: "figure-1", title: "Figure", caption: "", type: "Bar Chart", analysisRunId: "output-1", dataPoints: [], xAxisLabel: "", yAxisLabel: "", isApproved: false }];
  project.reviewerComments = [{ id: "review-1", agentRole: "Methodology Reviewer", severity: "Recommendation", manuscriptSection: "Methods", commentText: "Review", suggestedAction: "Check", status: "Open", timestamp: "2026-01-05T00:00:00.000Z" }];
  project.exportHistory = [{ id: "export-1", jobId: "job-1", timestamp: "2026-01-06T00:00:00.000Z", userEmail: "owner@example.com", manuscriptVersion: 1, exportFormat: "PDF", exportMode: "Draft Review", isBlocked: false, gateChecksResults: [], includedComponents: { titlePage: true, abstract: true, sections: true, figuresAndTables: true, bibliography: true, ethicsAndAiDisclosure: true, supplementarySelections: false }, fileSizeEstimate: "Not available", status: "Success" }];
  return project;
}

describe("ResearchArtifact backward-compatible foundation", () => {
  it("adapts every existing requested project collection without removing legacy records", () => {
    const project = legacyProject();
    const hydrated = hydrateProjectResearchArtifacts(project);
    const types = new Set(hydrated.researchArtifacts?.map((artifact) => artifact.artifactType));

    expect(types).toEqual(new Set([
      "Source", "Evidence", "Protocol", "Dataset", "Analysis Plan", "Analysis Output",
      "Table", "Figure", "Manuscript Section", "Review", "Export",
    ]));
    expect(hydrated.sources).toBe(project.sources);
    expect(hydrated.datasets).toBe(project.datasets);
  });

  it("populates the complete canonical envelope and preserves source relationships", () => {
    const artifacts = adaptProjectResearchArtifacts(legacyProject());
    const evidence = artifacts.find((artifact) => artifact.id === "evidence-1");
    expect(evidence).toMatchObject({
      projectId: "legacy-project", artifactType: "Evidence", createdBy: "owner-1",
      sourceArtifactIds: ["dataset-1"], contentHash: "hash-1", verificationState: "Verified",
      approvalState: "Approved", version: 1, isDemo: false, isSynthetic: false, locked: false,
      provenance: { origin: "Legacy Project Adapter", legacyCollection: "numericEvidenceRecords" },
    });
  });

  it("represents unavailable legacy metadata explicitly instead of inventing it", () => {
    const source = adaptProjectResearchArtifacts(legacyProject()).find((artifact) => artifact.id === "source-1");
    expect(source?.createdAt).toBe("Not available");
    expect(source?.updatedAt).toBe("Not available");
  });

  it("preserves canonical uploaded-document artifacts while refreshing legacy projections", () => {
    const project = legacyProject();
    const upload: ResearchArtifact = {
      id: "file-1", projectId: project.id, artifactType: "Uploaded Document", title: "protocol.pdf",
      createdBy: "owner-1", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      sourceArtifactIds: [], provenance: { origin: "Researcher Upload", recordedAt: "2026-01-01T00:00:00.000Z" },
      verificationState: "Unverified", approvalState: "Not Approved", version: 1,
      contentHash: "file-hash", isDemo: false, isSynthetic: false, locked: false,
    };
    project.researchArtifacts = [upload];
    expect(adaptProjectResearchArtifacts(project)).toContainEqual(upload);
  });

  it("propagates project-level demo isolation to every adapted artifact", () => {
    const project = legacyProject();
    project.isDemoProject = true;
    expect(adaptProjectResearchArtifacts(project).every((artifact) => artifact.isDemo && artifact.isSynthetic)).toBe(true);
  });

  it("loads older project shapes with absent artifact collections as an empty canonical projection", () => {
    const older = legacyProject() as ProjectState & Record<string, unknown>;
    for (const key of ["sources", "datasets", "analysisPlans", "analysisOutputs", "tables", "figures", "sections", "reviewerComments"]) {
      delete older[key];
    }
    delete older.numericEvidenceRecords;
    delete older.exportHistory;
    delete older.methodologyWorkspace;
    expect(hydrateProjectResearchArtifacts(older).researchArtifacts).toEqual([]);
  });
});
