import type {
  AnalysisOutput,
  AnalysisPlan,
  ArtifactApprovalState,
  ArtifactVerificationState,
  DatasetRecord,
  EvidenceRecord,
  ExportJobRecord,
  GeneratedFigure,
  GeneratedTable,
  ManuscriptSection,
  NumericEvidence,
  ProjectState,
  ResearchArtifact,
  ResearchArtifactType,
  ReviewerComment,
  SourceRecord,
} from "../types";
import { hydrateProjectEvidenceRecords } from "./evidenceRecords";
import { hydrateProjectClaimEvidenceGraph } from "./claimEvidenceGraph";

const MISSING = "Not available";

type LegacyCollection =
  | "sources"
  | "numericEvidenceRecords"
  | "evidenceRecords"
  | "methodologyWorkspace"
  | "datasets"
  | "analysisPlans"
  | "analysisOutputs"
  | "tables"
  | "figures"
  | "sections"
  | "reviewerComments"
  | "exportHistory";

interface LegacyArtifactInput {
  id: string;
  artifactType: ResearchArtifactType;
  title: string;
  collection: LegacyCollection;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceArtifactIds?: string[];
  verificationState?: ArtifactVerificationState;
  approvalState?: ArtifactApprovalState;
  version?: number;
  contentHash?: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
  locked?: boolean;
  provider?: string;
}

function cleanIds(ids: Array<string | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0))];
}

function adaptLegacy(project: ProjectState, input: LegacyArtifactInput): ResearchArtifact {
  const createdAt = input.createdAt || MISSING;
  return {
    id: input.id,
    projectId: project.id,
    artifactType: input.artifactType,
    title: input.title || MISSING,
    createdBy: input.createdBy || project.ownerUid || MISSING,
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    sourceArtifactIds: cleanIds(input.sourceArtifactIds || []),
    provenance: {
      origin: "Legacy Project Adapter",
      provider: input.provider,
      recordedAt: project.updatedAt || MISSING,
      legacyCollection: input.collection,
      legacyRecordId: input.id,
      notes: "Backward-compatible projection; the original domain record remains authoritative.",
    },
    verificationState: input.verificationState || "Unverified",
    approvalState: input.approvalState || "Not Approved",
    version: Math.max(1, input.version || 1),
    ...(input.contentHash ? { contentHash: input.contentHash } : {}),
    isDemo: Boolean(project.isDemoProject || input.isDemo),
    isSynthetic: Boolean(project.isDemoProject || input.isSynthetic),
    locked: Boolean(input.locked),
  };
}

function sourceArtifact(project: ProjectState, source: SourceRecord): ResearchArtifact {
  return adaptLegacy(project, {
    id: source.id,
    artifactType: "Source",
    title: source.title,
    collection: "sources",
    updatedAt: source.verificationDate,
    verificationState: source.verificationState === "Verified" ? "Verified" : "Unverified",
    approvalState: "Not Applicable",
    isDemo: source.isDemo,
    isSynthetic: source.isSynthetic,
    locked: source.state === "Retracted" || source.state === "Corrected",
    provider: source.provenance?.provider || source.metadataProvider,
  });
}

function evidenceArtifact(project: ProjectState, evidence: NumericEvidence): ResearchArtifact {
  return adaptLegacy(project, {
    id: evidence.id,
    artifactType: "Evidence",
    title: evidence.variableName ? `Numeric evidence: ${evidence.variableName}` : "Numeric evidence",
    collection: "numericEvidenceRecords",
    createdAt: evidence.createdAt,
    updatedAt: evidence.createdAt,
    sourceArtifactIds: [evidence.sourceId, evidence.analysisRunId, evidence.evidencePassageId],
    verificationState: evidence.verificationState === "Verified" ? "Verified" : evidence.verificationState === "Rejected" ? "Rejected" : "Unverified",
    approvalState: evidence.verificationState === "Verified" ? "Approved" : "Not Approved",
    contentHash: evidence.datasetHash,
  });
}

function passageEvidenceArtifact(project: ProjectState, evidence: EvidenceRecord): ResearchArtifact {
  return adaptLegacy(project, {
    id: evidence.evidenceId,
    artifactType: "Evidence",
    title: `Passage evidence ${evidence.evidenceId}`,
    collection: "evidenceRecords",
    createdBy: evidence.extractedBy,
    createdAt: evidence.createdAt,
    updatedAt: evidence.updatedAt,
    sourceArtifactIds: [evidence.sourceId, ...evidence.linkedClaimIds],
    verificationState: evidence.verification === "Researcher Verified" ? "Verified" : evidence.verification === "Rejected" ? "Rejected" : "Needs Review",
    approvalState: evidence.researcherReview.status === "Verified" ? "Approved" : evidence.researcherReview.status === "Rejected" ? "Rejected" : "Pending Review",
    contentHash: evidence.documentHash === "Not available" ? undefined : evidence.documentHash,
    isDemo: evidence.isDemo,
    isSynthetic: evidence.isSynthetic,
  });
}

function datasetArtifact(project: ProjectState, dataset: DatasetRecord): ResearchArtifact {
  return adaptLegacy(project, {
    id: dataset.id,
    artifactType: "Dataset",
    title: dataset.filename,
    collection: "datasets",
    createdAt: dataset.uploadDate,
    updatedAt: dataset.uploadDate,
    verificationState: dataset.state === "Approved for Analysis" || dataset.state === "Locked" ? "Verified" : "Needs Review",
    approvalState: dataset.state === "Approved for Analysis" || dataset.state === "Locked" ? "Approved" : "Not Approved",
    version: dataset.version,
    contentHash: dataset.fileHash,
    isDemo: dataset.isDemo,
    isSynthetic: dataset.isSynthetic,
    locked: dataset.state === "Locked",
  });
}

function planArtifact(project: ProjectState, plan: AnalysisPlan): ResearchArtifact {
  return adaptLegacy(project, {
    id: plan.id,
    artifactType: "Analysis Plan",
    title: plan.title,
    collection: "analysisPlans",
    createdAt: plan.approvalTimestamp,
    updatedAt: plan.approvalTimestamp,
    sourceArtifactIds: [plan.researchQuestionId, plan.hypothesisId],
    verificationState: plan.status === "Approved" || plan.status === "Executed" ? "Verified" : "Needs Review",
    approvalState: plan.status === "Approved" || plan.status === "Executed" ? "Approved" : "Not Approved",
    locked: plan.state === "Locked",
  });
}

function outputArtifact(project: ProjectState, output: AnalysisOutput): ResearchArtifact {
  return adaptLegacy(project, {
    id: output.id,
    artifactType: "Analysis Output",
    title: `Analysis output ${output.id}`,
    collection: "analysisOutputs",
    createdAt: output.executionTimestamp,
    updatedAt: output.researcherApproval?.timestamp || output.executionTimestamp,
    createdBy: output.researcherApproval?.actor.uid,
    sourceArtifactIds: [output.analysisPlanId, output.planId],
    verificationState: output.isReproduced ? "Verified" : "Needs Review",
    approvalState: output.researcherApproval ? "Approved" : "Not Approved",
    contentHash: output.reproducibilityHash,
    isDemo: output.isDemo,
    isSynthetic: output.isSynthetic,
    locked: output.state === "Locked",
  });
}

function tableArtifact(project: ProjectState, table: GeneratedTable): ResearchArtifact {
  return adaptLegacy(project, {
    id: table.id,
    artifactType: "Table",
    title: table.title,
    collection: "tables",
    sourceArtifactIds: [table.analysisRunId],
    verificationState: table.isApproved ? "Verified" : "Needs Review",
    approvalState: table.isApproved ? "Approved" : "Not Approved",
    isDemo: table.isDemo,
    isSynthetic: table.isSynthetic,
  });
}

function figureArtifact(project: ProjectState, figure: GeneratedFigure): ResearchArtifact {
  return adaptLegacy(project, {
    id: figure.id,
    artifactType: "Figure",
    title: figure.title,
    collection: "figures",
    sourceArtifactIds: [figure.analysisRunId],
    verificationState: figure.isApproved ? "Verified" : "Needs Review",
    approvalState: figure.isApproved ? "Approved" : "Not Approved",
    isDemo: figure.isDemo,
    isSynthetic: figure.isSynthetic,
  });
}

function sectionArtifact(project: ProjectState, section: ManuscriptSection): ResearchArtifact {
  return adaptLegacy(project, {
    id: section.id,
    artifactType: "Manuscript Section",
    title: section.title,
    collection: "sections",
    createdAt: section.lastEditedTimestamp,
    updatedAt: section.lastEditedTimestamp,
    createdBy: section.lastEditedBy,
    sourceArtifactIds: section.citationIds,
    verificationState: section.status === "Approved" ? "Verified" : "Needs Review",
    approvalState: section.status === "Approved" ? "Approved" : "Not Approved",
    version: section.version,
    isDemo: section.isDemo,
    isSynthetic: section.isSynthetic,
    locked: section.state === "Locked",
  });
}

function reviewArtifact(project: ProjectState, review: ReviewerComment): ResearchArtifact {
  return adaptLegacy(project, {
    id: review.id,
    artifactType: "Review",
    title: `${review.agentRole}: ${review.manuscriptSection}`,
    collection: "reviewerComments",
    createdAt: review.timestamp,
    updatedAt: review.timestamp,
    sourceArtifactIds: (project.sections || []).filter((section) => section.title === review.manuscriptSection).map((section) => section.id),
    verificationState: review.status === "Resolved" ? "Verified" : "Needs Review",
    approvalState: review.actionTaken === "Accept" ? "Approved" : review.actionTaken === "Reject with explanation" ? "Rejected" : "Pending Review",
    isDemo: review.isDemo,
    isSynthetic: review.isSynthetic,
  });
}

function exportArtifact(project: ProjectState, job: ExportJobRecord): ResearchArtifact {
  return adaptLegacy(project, {
    id: job.id || job.jobId,
    artifactType: "Export",
    title: `${job.exportFormat} ${job.exportMode} export`,
    collection: "exportHistory",
    createdAt: job.timestamp,
    updatedAt: job.timestamp,
    createdBy: job.userEmail,
    sourceArtifactIds: (project.sections || []).map((section) => section.id),
    verificationState: job.status === "Success" && !job.isBlocked ? "Verified" : "Rejected",
    approvalState: job.status === "Success" && !job.isBlocked ? "Approved" : "Not Approved",
    version: job.manuscriptVersion,
    locked: job.status === "Success",
  });
}

/** Builds a canonical view without deleting or rewriting legacy domain collections. */
export function adaptProjectResearchArtifacts(project: ProjectState): ResearchArtifact[] {
  const adapted: ResearchArtifact[] = [
    ...(project.sources || []).map((item) => sourceArtifact(project, item)),
    ...(project.numericEvidenceRecords || []).map((item) => evidenceArtifact(project, item)),
    ...(project.evidenceRecords || []).map((item) => passageEvidenceArtifact(project, item)),
    ...(project.datasets || []).map((item) => datasetArtifact(project, item)),
    ...(project.analysisPlans || []).map((item) => planArtifact(project, item)),
    ...(project.analysisOutputs || []).map((item) => outputArtifact(project, item)),
    ...(project.tables || []).map((item) => tableArtifact(project, item)),
    ...(project.figures || []).map((item) => figureArtifact(project, item)),
    ...(project.sections || []).map((item) => sectionArtifact(project, item)),
    ...(project.reviewerComments || []).map((item) => reviewArtifact(project, item)),
    ...(project.exportHistory || []).map((item) => exportArtifact(project, item)),
  ];

  if (project.methodologyWorkspace) {
    const workspace = project.methodologyWorkspace;
    adapted.push(adaptLegacy(project, {
      id: `protocol-${project.id}`,
      artifactType: "Protocol",
      title: workspace.uploadedProtocol?.fileName || "Methodology protocol",
      collection: "methodologyWorkspace",
      createdAt: workspace.uploadedProtocol?.uploadedAt || workspace.aiProposal?.generatedAt || workspace.updatedAt,
      updatedAt: workspace.updatedAt,
      createdBy: workspace.researcherApproval?.approvedByUid,
      verificationState: workspace.reviewState === "Researcher Approved" ? "Verified" : "Needs Review",
      approvalState: workspace.reviewState === "Researcher Approved" ? "Approved" : "Not Approved",
      version: 1,
      locked: false,
      provider: workspace.sourceMode,
    }));
  }

  const canonicalOnly = (project.researchArtifacts || []).filter(
    (artifact) => artifact.provenance?.origin !== "Legacy Project Adapter"
  );
  const byId = new Map(canonicalOnly.map((artifact) => [artifact.id, artifact]));
  for (const artifact of adapted) if (!byId.has(artifact.id)) byId.set(artifact.id, artifact);
  return [...byId.values()];
}

export function hydrateProjectResearchArtifacts(project: ProjectState): ProjectState {
  const withEvidence = hydrateProjectEvidenceRecords(project);
  const withGraph = hydrateProjectClaimEvidenceGraph(withEvidence);
  return { ...withGraph, researchArtifacts: adaptProjectResearchArtifacts(withGraph) };
}
