import { createHash, randomUUID } from "node:crypto";
import type {
  ProjectRole,
  ProjectState,
  SensitiveTransitionType,
  TrustedStateTransitionRecord,
  TrustedTransitionIntegrity,
} from "../types";

export interface TrustedTransitionRequest {
  transitionType: SensitiveTransitionType;
  entityId: string;
  rationale: string;
  evidenceIds: string[];
  expectedRevision: number;
}

const TRANSITIONS: SensitiveTransitionType[] = ["SOURCE_VERIFIED", "CLAIM_VERIFIED", "DATASET_APPROVED", "ANALYSIS_APPROVED_FOR_MANUSCRIPT", "MANUSCRIPT_LOCKED", "ETHICS_APPROVED", "AUTHOR_SIGNED_OFF", "SUBMISSION_READY"];
const ALLOWED_KEYS = ["transitionType", "entityId", "rationale", "evidenceIds", "expectedRevision"];
const WRITER_ROLES: ProjectRole[] = ["Owner", "Corresponding Author", "Co-author", "Supervisor", "Statistician"];

export function validateTrustedTransitionRequest(value: unknown, role: ProjectRole): { valid: boolean; errors: string[]; request?: TrustedTransitionRequest } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, errors: ["Transition request must be an object."] };
  const body = value as Record<string, unknown>;
  const errors: string[] = [];
  const unknown = Object.keys(body).filter((key) => !ALLOWED_KEYS.includes(key));
  if (unknown.length) errors.push(`Unsupported transition fields: ${unknown.join(", ")}.`);
  if (!TRANSITIONS.includes(body.transitionType as SensitiveTransitionType)) errors.push("Unsupported sensitive transition.");
  if (typeof body.entityId !== "string" || !body.entityId.trim() || body.entityId.length > 200) errors.push("A bounded entityId is required.");
  if (typeof body.rationale !== "string" || body.rationale.trim().length < 8 || body.rationale.length > 2000) errors.push("A rationale of 8–2000 characters is required.");
  if (!Array.isArray(body.evidenceIds) || body.evidenceIds.length > 100 || body.evidenceIds.some((id) => typeof id !== "string" || !id.trim() || id.length > 200)) errors.push("evidenceIds must contain up to 100 bounded IDs.");
  if (!Number.isSafeInteger(body.expectedRevision) || (body.expectedRevision as number) < 0) errors.push("expectedRevision must be a non-negative integer.");
  if (!WRITER_ROLES.includes(role)) errors.push("Project role cannot request sensitive transitions.");
  if (errors.length) return { valid: false, errors };
  return { valid: true, errors: [], request: { transitionType: body.transitionType as SensitiveTransitionType, entityId: (body.entityId as string).trim(), rationale: (body.rationale as string).trim(), evidenceIds: [...new Set((body.evidenceIds as string[]).map((id) => id.trim()))], expectedRevision: body.expectedRevision as number } };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function privilegedStateSnapshot(project: ProjectState): Record<string, unknown> {
  return {
    sources: (project.sources || []).map(({ id, state, verificationState, verificationDate }) => ({ id, verified: state === "Metadata Verified" || verificationState === "Verified", verificationDate: verificationState === "Verified" ? verificationDate : undefined })),
    claims: (project.claims || []).map(({ id, state, verificationStatus, isResearcherApproved }) => ({ id, verified: state === "Verified" || verificationStatus === "Verified", isResearcherApproved: state === "Verified" ? isResearcherApproved : undefined })),
    datasets: (project.datasets || []).map(({ id, state, fileHash, version, filename }) => ({ id, privilegedState: state === "Approved for Analysis" || state === "Locked" ? state : "Not Approved", lockedContent: state === "Locked" ? { fileHash, version, filename } : undefined })),
    analysisOutputs: (project.analysisOutputs || []).map(({ id, state, researcherApproval }) => ({ id, privilegedState: state === "Approved for Manuscript" || state === "Locked" ? state : "Not Approved", researcherApproval: state === "Approved for Manuscript" || state === "Locked" ? researcherApproval : undefined })),
    sections: (project.sections || []).map(({ id, state, title, content, version, citationIds }) => ({ id, locked: state === "Locked", lockedContent: state === "Locked" ? { title, content, version, citationIds } : undefined })),
    ethicsApprovalState: project.ethicsInfo.approvalState || "Pending",
    authors: (project.authors || []).map(({ id, finalApproval, approvalTimestamp }) => ({ id, finalApproval, approvalTimestamp: finalApproval ? approvalTimestamp : undefined })),
    submissionState: project.submissionState || "Draft",
  };
}

export function hashPrivilegedState(project: ProjectState): string {
  return createHash("sha256").update(canonical(privilegedStateSnapshot(project))).digest("hex");
}

export function validateTrustedTransitionIntegrity(project: ProjectState): { valid: boolean; reason?: string } {
  const integrity = project.trustedTransitionIntegrity;
  if (!integrity) return { valid: true };
  const actual = hashPrivilegedState(project);
  return actual === integrity.digest ? { valid: true } : { valid: false, reason: "Privileged project state digest mismatch: direct mutation or stale trusted state detected." };
}

function eligibleClaimEvidence(project: ProjectState, claimId: string): boolean {
  return (project.claimEvidenceLinks || []).some((link) => {
    const evidence = (project.evidenceRecords || []).find((record) => record.evidenceId === link.evidenceId);
    return link.claimId === claimId && link.relationship !== "Contradicts" && link.verificationState === "Verified" && link.approvalState === "Approved" && evidence?.verification === "Researcher Verified" && evidence.researcherReview.status === "Verified";
  });
}

export function applyTrustedTransition(
  project: ProjectState,
  request: TrustedTransitionRequest,
  actor: { uid: string; email: string; role: ProjectRole },
  timestamp = new Date().toISOString(),
  transitionId = `transition-${randomUUID()}`
): { project: ProjectState; record: TrustedStateTransitionRecord } {
  const integrityCheck = validateTrustedTransitionIntegrity(project);
  if (!integrityCheck.valid) throw new Error(integrityCheck.reason);
  const revision = project.trustedTransitionIntegrity?.revision || 0;
  if (request.expectedRevision !== revision) throw new Error("Transition revision conflict. Reload the project and retry.");
  const beforeHash = hashPrivilegedState(project);
  let entityType: TrustedStateTransitionRecord["entityType"];
  let fromState = "Missing";
  let toState = "Missing";
  let updated: ProjectState = { ...project };

  if (request.transitionType === "SOURCE_VERIFIED") {
    entityType = "Source";
    const source = project.sources.find((item) => item.id === request.entityId);
    if (!source) throw new Error("Source does not exist.");
    if (!source.provenance?.provider?.trim() || !source.provenance.retrievedAt?.trim()) throw new Error("Source verification requires provider and retrieval provenance.");
    if (source.state === "Retracted") throw new Error("A retracted source cannot be verified.");
    fromState = source.state || source.verificationState;
    toState = "Metadata Verified";
    updated.sources = project.sources.map((item) => item.id === source.id ? { ...item, state: "Metadata Verified", verificationState: "Verified", verificationDate: timestamp } : item);
  } else if (request.transitionType === "CLAIM_VERIFIED") {
    entityType = "Claim";
    const claim = project.claims.find((item) => item.id === request.entityId);
    if (!claim) throw new Error("Claim does not exist.");
    if (claim.state !== "Researcher Reviewed" || !eligibleClaimEvidence(project, claim.id)) throw new Error("Claim verification requires prior researcher review and approved, verified supporting passage evidence.");
    fromState = claim.state;
    toState = "Verified";
    updated.claims = project.claims.map((item) => item.id === claim.id ? { ...item, state: "Verified", verificationStatus: "Verified", isResearcherApproved: true } : item);
  } else if (request.transitionType === "DATASET_APPROVED") {
    entityType = "Dataset";
    const dataset = project.datasets.find((item) => item.id === request.entityId);
    if (!dataset) throw new Error("Dataset does not exist.");
    if (!['Requires Review', 'Approved for Analysis'].includes(dataset.state || "") || !dataset.isAnonymizedConfirmed) throw new Error("Dataset approval/lock requires Requires Review or Approved for Analysis state and anonymization confirmation.");
    fromState = dataset.state;
    toState = dataset.state === "Approved for Analysis" ? "Locked" : "Approved for Analysis";
    updated.datasets = project.datasets.map((item) => item.id === dataset.id ? { ...item, state: toState as "Approved for Analysis" | "Locked" } : item);
  } else if (request.transitionType === "ANALYSIS_APPROVED_FOR_MANUSCRIPT") {
    entityType = "Analysis";
    const output = project.analysisOutputs.find((item) => item.id === request.entityId);
    if (!output) throw new Error("Analysis output does not exist.");
    if (output.state !== "Researcher Reviewed" || !output.datasetHash || !(output.planId || output.analysisPlanId)) throw new Error("Analysis approval requires Researcher Reviewed state, dataset hash, and plan ID.");
    fromState = output.state;
    toState = "Approved for Manuscript";
    updated.analysisOutputs = project.analysisOutputs.map((item) => item.id === output.id ? { ...item, state: "Approved for Manuscript", researcherApproval: { actor: { uid: actor.uid, email: actor.email }, timestamp, rationale: request.rationale, outputId: output.id, datasetHash: output.datasetHash!, planId: output.planId || output.analysisPlanId } } : item);
    updated.figures = project.figures.map((item) => item.analysisRunId === output.id ? { ...item, isApproved: true } : item);
    updated.tables = project.tables.map((item) => item.analysisRunId === output.id ? { ...item, isApproved: true } : item);
  } else if (request.transitionType === "MANUSCRIPT_LOCKED") {
    entityType = "ManuscriptSection";
    const section = project.sections.find((item) => item.id === request.entityId);
    if (!section) throw new Error("Manuscript section does not exist.");
    if (section.state !== "Approved") throw new Error("Only an Approved manuscript section can be locked.");
    fromState = section.state;
    toState = "Locked";
    updated.sections = project.sections.map((item) => item.id === section.id ? { ...item, state: "Locked", status: "Approved" } : item);
  } else if (request.transitionType === "ETHICS_APPROVED") {
    entityType = "Ethics";
    if (request.entityId !== "ethics" && request.entityId !== project.id) throw new Error("Ethics entity does not exist.");
    if (project.ethicsInfo.approvalRequired && (!project.ethicsInfo.committeeName?.trim() || !project.ethicsInfo.approvalNumber?.trim())) throw new Error("Ethics approval requires researcher-supplied committee and approval identifiers.");
    fromState = project.ethicsInfo.approvalState || "Pending";
    toState = "Approved";
    updated.ethicsInfo = { ...project.ethicsInfo, approvalState: "Approved" };
  } else if (request.transitionType === "AUTHOR_SIGNED_OFF") {
    entityType = "Author";
    const author = project.authors.find((item) => item.id === request.entityId);
    if (!author) throw new Error("Author does not exist.");
    if (actor.role !== "Owner" && actor.role !== "Corresponding Author" && author.email.toLowerCase() !== actor.email.toLowerCase()) throw new Error("Only the author, owner, or corresponding author may record sign-off.");
    fromState = author.finalApproval ? "Signed Off" : "Pending";
    if (author.finalApproval) throw new Error("Author sign-off is already locked.");
    toState = "Signed Off";
    updated.authors = project.authors.map((item) => item.id === author.id ? { ...item, finalApproval: true, approvalTimestamp: timestamp } : item);
  } else {
    entityType = "Submission";
    if (request.entityId !== project.id) throw new Error("Submission entity must be the project.");
    if (project.isDemoProject) throw new Error("Demo/synthetic projects cannot become Submission Ready.");
    if (project.sections.some((section) => section.state !== "Locked")) throw new Error("Every manuscript section must be locked.");
    if (project.authors.length === 0 || project.authors.some((author) => !author.finalApproval)) throw new Error("Every author must sign off.");
    if (project.ethicsInfo.approvalRequired && project.ethicsInfo.approvalState !== "Approved") throw new Error("Required ethics approval is missing.");
    if (project.analysisOutputs.some((output) => output.state !== "Approved for Manuscript" && output.state !== "Locked")) throw new Error("Every analysis output must be approved for manuscript use.");
    fromState = project.submissionState || "Draft";
    if (fromState === "Submission Ready") throw new Error("Submission Ready state is locked.");
    toState = "Submission Ready";
    updated.submissionState = "Submission Ready";
  }

  const afterHash = hashPrivilegedState(updated);
  const record: TrustedStateTransitionRecord = { id: transitionId, projectId: project.id, transitionType: request.transitionType, entityType, entityId: request.entityId, fromState, toState, actorUid: actor.uid, actorEmail: actor.email, timestamp, reason: request.rationale, evidenceRecordIds: request.evidenceIds, trustedServerCreated: true, immutable: true, beforeHash, afterHash };
  const trustedTransitionIntegrity: TrustedTransitionIntegrity = { revision: revision + 1, digest: afterHash, lastTransitionId: transitionId, updatedAt: timestamp, trustedServerCreated: true };
  updated = { ...updated, trustedTransitionIntegrity, updatedAt: timestamp };
  return { project: updated, record };
}
