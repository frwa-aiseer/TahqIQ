import { describe, expect, it } from "vitest";
import { createTrustedAuditEvent, isTrustedAuditEvent, validateTrustedAuditRequest } from "../server/trustedAudit";
import type { ProjectRole, TrustedAuditAction, TrustedAuditEntityType } from "../types";

const request = (action: TrustedAuditAction = "ANALYSIS_APPROVED", entityType: TrustedAuditEntityType = "AnalysisOutput") => ({
  action,
  entityType,
  entityId: "entity-1",
  rationale: "Researcher reviewed the evidence and approved this transition.",
  evidenceIds: ["evidence-1"],
});

describe("trusted privileged audit service", () => {
  it("accepts every required action only with its matching entity type", () => {
    const mappings: Array<[TrustedAuditAction, TrustedAuditEntityType]> = [
      ["ROLE_CHANGED", "ProjectMember"], ["ARTIFACT_APPROVED", "ManuscriptSection"], ["DATASET_APPROVED", "Dataset"],
      ["ANALYSIS_APPROVED", "AnalysisOutput"], ["AI_ARTIFACT_DISPOSITIONED", "AiArtifact"],
      ["SOURCE_VERIFICATION_CHANGED", "Source"], ["CLAIM_VERIFICATION_CHANGED", "Claim"],
      ["ETHICS_STATUS_CHANGED", "Ethics"], ["AUTHOR_SIGNED_OFF", "Author"], ["EXPORT_RECORDED", "ExportJob"],
    ];
    for (const [action, entityType] of mappings) {
      expect(validateTrustedAuditRequest(request(action, entityType), "Owner").valid).toBe(true);
      expect(validateTrustedAuditRequest(request(action, "Claim"), "Owner").valid).toBe(entityType === "Claim");
    }
  });

  it("rejects Viewer and Reviewer privileged history requests", () => {
    for (const role of ["Viewer", "Reviewer"] as ProjectRole[]) expect(validateTrustedAuditRequest(request(), role).valid).toBe(false);
  });

  it("allows only the owner to record role changes", () => {
    expect(validateTrustedAuditRequest(request("ROLE_CHANGED", "ProjectMember"), "Co-author").errors).toContain("Only the project owner may record role changes.");
    expect(validateTrustedAuditRequest(request("ROLE_CHANGED", "ProjectMember"), "Owner").valid).toBe(true);
  });

  it("rejects client attempts to supply actor, timestamp, projectId or event ID", () => {
    const result = validateTrustedAuditRequest({
      ...request(), actor: { uid: "forged", email: "forged@test.invalid" }, timestamp: "2000-01-01", projectId: "other", id: "forged",
    }, "Owner");
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Unsupported audit fields");
  });

  it("requires bounded rationale and evidence identifiers", () => {
    expect(validateTrustedAuditRequest({ ...request(), rationale: "short" }, "Owner").valid).toBe(false);
    expect(validateTrustedAuditRequest({ ...request(), evidenceIds: [""] }, "Owner").valid).toBe(false);
  });

  it("creates the complete append record using trusted actor, timestamp and ID inputs", () => {
    const validated = validateTrustedAuditRequest(request(), "Owner").request!;
    const event = createTrustedAuditEvent(
      "project-1", { uid: "actor-1", email: "actor@test.invalid" }, validated,
      { state: "Researcher Reviewed" }, { state: "Approved for Manuscript" }, "2026-08-23T00:00:00.000Z", "audit-1"
    );
    expect(event).toEqual({
      id: "audit-1", projectId: "project-1", timestamp: "2026-08-23T00:00:00.000Z",
      actor: { uid: "actor-1", email: "actor@test.invalid" }, ...validated,
      before: { state: "Researcher Reviewed" }, after: { state: "Approved for Manuscript" }, trustedServerCreated: true,
    });
    expect(isTrustedAuditEvent(event)).toBe(true);
  });

  it("does not treat legacy client-created history as trusted", () => {
    expect(isTrustedAuditEvent({ id: "legacy", uid: "client", action: "APPROVED", details: "Client supplied" })).toBe(false);
  });
});
