import type { ProjectState, SensitiveTransitionType, TrustedStateTransitionRecord } from "../types";
import { authenticatedProjectFetch } from "./authenticatedFetch";

export async function requestTrustedTransition(input: {
  projectId: string;
  transitionType: SensitiveTransitionType;
  entityId: string;
  rationale: string;
  evidenceIds: string[];
  expectedRevision: number;
}): Promise<{ project: ProjectState; transition: TrustedStateTransitionRecord }> {
  const response = await authenticatedProjectFetch(`/api/projects/${encodeURIComponent(input.projectId)}/transitions`, input.projectId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transitionType: input.transitionType, entityId: input.entityId, rationale: input.rationale, evidenceIds: input.evidenceIds, expectedRevision: input.expectedRevision }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status !== "transitioned") throw new Error(payload.error || payload.errors?.join(" ") || "Trusted transition failed.");
  return { project: payload.project, transition: payload.transition };
}
