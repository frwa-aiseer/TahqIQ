import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { applyTrustedTransition, hashPrivilegedState, validateTrustedTransitionIntegrity, validateTrustedTransitionRequest } from "../server/trustedTransitions";
import type { ClaimItem, EvidenceRecord, ProjectState, TrustedTransitionIntegrity } from "../types";

const actor = { uid: "owner-1", email: "owner@example.com", role: "Owner" as const };
const request = (transitionType: Parameters<typeof applyTrustedTransition>[1]["transitionType"], entityId: string, expectedRevision = 0) => ({ transitionType, entityId, rationale: "Researcher reviewed and approved this transition.", evidenceIds: ["evidence-1"], expectedRevision });

function baseProject(): ProjectState {
  const project = createEmptyProject();
  project.id = "project-1";
  project.ownerUid = actor.uid;
  project.members = { [actor.uid]: "Owner" };
  return project;
}

function seal(project: ProjectState, revision = 1): ProjectState {
  const integrity: TrustedTransitionIntegrity = { revision, digest: hashPrivilegedState(project), lastTransitionId: "prior", updatedAt: "2026-01-01", trustedServerCreated: true };
  return { ...project, trustedTransitionIntegrity: integrity };
}

describe("trusted sensitive transitions", () => {
  it("strictly validates requests and rejects client-supplied privileged fields", () => {
    expect(validateTrustedTransitionRequest({ ...request("SOURCE_VERIFIED", "source-1"), actorUid: "forged" }, "Owner")).toMatchObject({ valid: false });
    expect(validateTrustedTransitionRequest(request("SOURCE_VERIFIED", "source-1"), "Viewer")).toMatchObject({ valid: false });
  });

  it("verifies sources only with recorded provider provenance", () => {
    const project = baseProject();
    project.sources = [{ id: "source-1", title: "Source", authors: [], year: 2025, journalOrVenue: "Journal", documentType: "Article", peerReviewStatus: "Unknown", verificationState: "Unverified", provenance: { provider: "Crossref", retrievedAt: "2026-01-01" }, relevanceScore: 8, tags: [] }];
    const result = applyTrustedTransition(project, request("SOURCE_VERIFIED", "source-1"), actor, "2026-01-02", "transition-source");
    expect(result.project.sources[0]).toMatchObject({ state: "Metadata Verified", verificationState: "Verified" });
    expect(result.record).toMatchObject({ trustedServerCreated: true, immutable: true, beforeHash: expect.any(String), afterHash: expect.any(String) });
  });

  it("requires approved verified graph evidence before claim verification", () => {
    const project = baseProject();
    const claim: ClaimItem = { id: "claim-1", claimText: "Claim", claimType: "Background fact", manuscriptSection: "Introduction", importance: "High", linkedSourceIds: [], evidenceRelationship: "Direct support", verificationStatus: "Unverified", state: "Researcher Reviewed", isResearcherApproved: false };
    const evidence: EvidenceRecord = { evidenceId: "evidence-1", sourceId: "source-1", documentVersion: "v1", documentHash: "hash", exactPassage: "Passage", page: "1", extractionMethod: "Researcher Selected", extractedBy: actor.uid, confidence: 1, verification: "Researcher Verified", researcherReview: { status: "Verified", reviewedBy: actor.uid, reviewedAt: "2026-01-01", notes: "Checked" }, linkedClaimIds: [claim.id], createdAt: "2026-01-01", updatedAt: "2026-01-01" };
    project.claims = [claim]; project.evidenceRecords = [evidence]; project.claimEvidenceLinks = [{ id: "edge-1", claimId: claim.id, evidenceId: evidence.evidenceId, relationship: "Supports", confidence: 1, verificationState: "Verified", approvalState: "Approved", manuscriptSentenceIds: [], createdBy: actor.uid, createdAt: "2026-01-01", updatedAt: "2026-01-01" }];
    expect(applyTrustedTransition(project, request("CLAIM_VERIFIED", claim.id), actor).project.claims[0]).toMatchObject({ state: "Verified", verificationStatus: "Verified", isResearcherApproved: true });
  });

  it("approves then irreversibly locks an anonymized reviewed dataset", () => {
    const project = baseProject();
    project.datasets = [{ id: "dataset-1", filename: "data.csv", fileHash: "hash", uploadDate: "2026-01-01", recordCount: 0, variableCount: 0, variables: [], missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Requires Review" }];
    const approved = applyTrustedTransition(project, request("DATASET_APPROVED", "dataset-1"), actor, "2026-01-02", "transition-dataset-1").project;
    expect(approved.datasets[0].state).toBe("Approved for Analysis");
    const locked = applyTrustedTransition(approved, request("DATASET_APPROVED", "dataset-1", 1), actor, "2026-01-03", "transition-dataset-2").project;
    expect(locked.datasets[0].state).toBe("Locked");
    expect(() => applyTrustedTransition(locked, request("DATASET_APPROVED", "dataset-1", 2), actor)).toThrow(/requires Requires Review or Approved/);
  });

  it("creates attributable analysis approval and locks only approved manuscript sections", () => {
    const project = baseProject();
    project.analysisOutputs = [{ id: "output-1", analysisPlanId: "plan-1", planId: "plan-1", datasetHash: "dataset-hash", executionTimestamp: "2026-01-01", softwareEnvironment: "R", summaryText: "", numericResults: {}, pValues: [], effectSizes: [], assumptionChecks: [], isReproduced: true, reproducibilityHash: "hash", state: "Researcher Reviewed" }];
    const analysis = applyTrustedTransition(project, request("ANALYSIS_APPROVED_FOR_MANUSCRIPT", "output-1"), actor).project;
    expect(analysis.analysisOutputs[0]).toMatchObject({ state: "Approved for Manuscript", researcherApproval: { actor: { uid: actor.uid }, datasetHash: "dataset-hash", planId: "plan-1" } });
    const sectionProject = baseProject(); sectionProject.sections = [{ ...sectionProject.sections[0], state: "Approved", status: "Approved" }];
    expect(applyTrustedTransition(sectionProject, request("MANUSCRIPT_LOCKED", sectionProject.sections[0].id), actor).project.sections[0].state).toBe("Locked");
  });

  it("covers ethics approval, author sign-off, and Submission Ready prerequisites", () => {
    let project = baseProject();
    project.ethicsInfo = { approvalRequired: true, committeeName: "Researcher supplied committee", approvalNumber: "Researcher supplied ID", consentObtained: true, approvalState: "Pending" };
    project.authors = [{ id: "author-1", fullName: "Researcher", publicationName: "Researcher", email: actor.email, department: "", institution: "", city: "", country: "", isCorresponding: true, order: 1, creditRoles: [], conflictDeclaration: "", finalApproval: false }];
    project = applyTrustedTransition(project, request("ETHICS_APPROVED", "ethics"), actor).project;
    project = applyTrustedTransition(project, request("AUTHOR_SIGNED_OFF", "author-1", 1), actor).project;
    project.sections = project.sections.map((section) => ({ ...section, state: "Locked", status: "Approved" }));
    project = seal(project, 2);
    const ready = applyTrustedTransition(project, request("SUBMISSION_READY", project.id, 2), actor).project;
    expect(ready).toMatchObject({ submissionState: "Submission Ready" });
  });

  it("detects direct privileged mutation and rejects stale revisions", () => {
    const project = baseProject();
    project.sources = [{ id: "source-1", title: "Source", authors: [], year: 2025, journalOrVenue: "Journal", documentType: "Article", peerReviewStatus: "Unknown", verificationState: "Unverified", provenance: { provider: "Crossref", retrievedAt: "2026-01-01" }, relevanceScore: 8, tags: [] }];
    const trusted = applyTrustedTransition(project, request("SOURCE_VERIFIED", "source-1"), actor).project;
    const forged = { ...trusted, sources: trusted.sources.map((source) => ({ ...source, state: "Unresolved" as const, verificationState: "Unverified" as const })) };
    expect(validateTrustedTransitionIntegrity(forged)).toMatchObject({ valid: false, reason: expect.stringMatching(/digest mismatch/i) });
    expect(() => applyTrustedTransition(trusted, request("SOURCE_VERIFIED", "source-1", 0), actor)).toThrow(/revision conflict/i);
  });

  it("detects direct edits to locked manuscript content", () => {
    const project = baseProject();
    project.sections = [{ ...project.sections[0], state: "Approved", status: "Approved", content: "Approved content" }];
    const locked = applyTrustedTransition(project, request("MANUSCRIPT_LOCKED", project.sections[0].id), actor).project;
    const forged = { ...locked, sections: locked.sections.map((section) => ({ ...section, content: "Client rewrite after lock" })) };
    expect(validateTrustedTransitionIntegrity(forged).valid).toBe(false);
  });
});
