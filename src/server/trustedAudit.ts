import type { ProjectAuditEvent, ProjectRole, TrustedAuditAction, TrustedAuditEntityType } from "../types";

export interface TrustedAuditRequest {
  action: TrustedAuditAction;
  entityType: TrustedAuditEntityType;
  entityId: string;
  rationale: string;
  evidenceIds: string[];
}

const ACTION_ENTITY: Record<TrustedAuditAction, TrustedAuditEntityType> = {
  ROLE_CHANGED: "ProjectMember",
  ARTIFACT_APPROVED: "ManuscriptSection",
  DATASET_APPROVED: "Dataset",
  ANALYSIS_APPROVED: "AnalysisOutput",
  AI_ARTIFACT_DISPOSITIONED: "AiArtifact",
  SOURCE_VERIFICATION_CHANGED: "Source",
  CLAIM_VERIFICATION_CHANGED: "Claim",
  ETHICS_STATUS_CHANGED: "Ethics",
  AUTHOR_SIGNED_OFF: "Author",
  EXPORT_RECORDED: "ExportJob",
};

const WRITER_ROLES: ProjectRole[] = ["Owner", "Corresponding Author", "Co-author", "Supervisor", "Statistician"];
const OWNER_ONLY_ACTIONS: TrustedAuditAction[] = ["ROLE_CHANGED"];
const ALLOWED_KEYS = ["action", "entityType", "entityId", "rationale", "evidenceIds"];

export function validateTrustedAuditRequest(value: unknown, role: ProjectRole): { valid: boolean; errors: string[]; request?: TrustedAuditRequest } {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, errors: ["Audit request must be an object."] };
  const body = value as Record<string, unknown>;
  const unknownKeys = Object.keys(body).filter((key) => !ALLOWED_KEYS.includes(key));
  if (unknownKeys.length) errors.push(`Unsupported audit fields: ${unknownKeys.join(", ")}.`);

  const action = body.action as TrustedAuditAction;
  const entityType = body.entityType as TrustedAuditEntityType;
  if (!Object.prototype.hasOwnProperty.call(ACTION_ENTITY, action)) errors.push("Unsupported privileged audit action.");
  if (ACTION_ENTITY[action] !== entityType) errors.push("Audit action and entity type do not match.");
  if (typeof body.entityId !== "string" || !body.entityId.trim() || body.entityId.length > 200) errors.push("A bounded entityId is required.");
  if (typeof body.rationale !== "string" || body.rationale.trim().length < 8 || body.rationale.length > 2000) errors.push("A rationale of 8–2000 characters is required.");
  if (!Array.isArray(body.evidenceIds) || body.evidenceIds.length > 100 || body.evidenceIds.some((id) => typeof id !== "string" || !id.trim() || id.length > 200)) {
    errors.push("evidenceIds must be an array of up to 100 bounded identifiers.");
  }
  if (!WRITER_ROLES.includes(role)) errors.push("Project role cannot create privileged audit events.");
  if (OWNER_ONLY_ACTIONS.includes(action) && role !== "Owner") errors.push("Only the project owner may record role changes.");

  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    request: {
      action,
      entityType,
      entityId: (body.entityId as string).trim(),
      rationale: (body.rationale as string).trim(),
      evidenceIds: [...new Set((body.evidenceIds as string[]).map((id) => id.trim()))],
    },
  };
}

export function createTrustedAuditEvent(
  projectId: string,
  actor: { uid: string; email: string },
  request: TrustedAuditRequest,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  timestamp = new Date().toISOString(),
  id = `audit-${Date.now()}-${crypto.randomUUID()}`
): ProjectAuditEvent {
  return { id, projectId, timestamp, actor, ...request, before, after, trustedServerCreated: true };
}

export function isTrustedAuditEvent(value: unknown): value is ProjectAuditEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ProjectAuditEvent>;
  return event.trustedServerCreated === true && Boolean(
    event.id?.trim() && event.projectId?.trim() && event.timestamp?.trim() &&
    event.actor?.uid?.trim() && event.actor.email?.trim() && event.action && event.entityType &&
    event.entityId?.trim() && event.rationale?.trim() && Array.isArray(event.evidenceIds)
  );
}
