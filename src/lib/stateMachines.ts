import {
  SourceState,
  ClaimState,
  DatasetState,
  AnalysisState,
  SectionState,
  StateTransitionRecord
} from "../types";

export type EntityType = "Source" | "Claim" | "Dataset" | "Analysis" | "ManuscriptSection";

export const SOURCE_TRANSITIONS: Record<SourceState, SourceState[]> = {
  "Imported": ["Metadata Pending"],
  "Metadata Pending": ["Metadata Verified", "Unresolved"],
  "Metadata Verified": ["Full Text Available", "Corrected", "Retracted", "Unresolved"],
  "Full Text Available": ["Full Text Reviewed", "Corrected", "Retracted"],
  "Full Text Reviewed": ["Corrected", "Retracted"],
  "Unresolved": ["Metadata Pending", "Full Text Available"],
  "Corrected": ["Metadata Verified", "Full Text Reviewed"],
  "Retracted": [],
};

export const CLAIM_TRANSITIONS: Record<ClaimState, ClaimState[]> = {
  "Draft": ["Unlinked"],
  "Unlinked": ["Evidence Linked", "Rejected"],
  "Evidence Linked": ["Researcher Reviewed", "Contradicted", "Rejected"],
  "Researcher Reviewed": ["Verified", "Contradicted", "Rejected"],
  "Verified": ["Researcher Reviewed"],
  "Contradicted": ["Evidence Linked", "Researcher Reviewed", "Rejected"],
  "Rejected": ["Draft", "Unlinked"],
};

export const DATASET_TRANSITIONS: Record<DatasetState, DatasetState[]> = {
  "Uploaded": ["Parsing"],
  "Parsing": ["Profiled"],
  "Profiled": ["Requires Review"],
  "Requires Review": ["Approved for Analysis"],
  "Approved for Analysis": ["Locked", "Requires Review"],
  "Locked": ["Approved for Analysis"],
};

export const ANALYSIS_TRANSITIONS: Record<AnalysisState, AnalysisState[]> = {
  "Draft Plan": ["Awaiting Approval"],
  "Awaiting Approval": ["Approved", "Draft Plan"],
  "Approved": ["Queued"],
  "Queued": ["Running"],
  "Running": ["Failed", "Completed"],
  "Failed": ["Draft Plan", "Queued"],
  "Completed": ["QC Passed", "Failed"],
  "QC Passed": ["Researcher Reviewed"],
  "Researcher Reviewed": ["Approved for Manuscript", "Draft Plan"],
  "Approved for Manuscript": ["Locked", "Researcher Reviewed"],
  "Locked": ["Approved for Manuscript"]
};

export const SECTION_TRANSITIONS: Record<SectionState, SectionState[]> = {
  "Empty": ["Draft", "AI Suggested"],
  "Draft": ["Researcher Edited", "AI Suggested", "Under Review"],
  "AI Suggested": ["Researcher Edited", "Under Review"],
  "Researcher Edited": ["Under Review", "Draft"],
  "Under Review": ["Approved", "Researcher Edited"],
  "Approved": ["Locked", "Researcher Edited"],
  "Locked": ["Approved"],
};

export const DEFAULT_INITIAL_STATES: Record<EntityType, string> = {
  Source: "Imported",
  Claim: "Draft",
  Dataset: "Uploaded",
  Analysis: "Draft Plan",
  ManuscriptSection: "Empty",
};

/**
 * Checks if a transition from fromState to toState is allowed for entityType
 */
export function isValidTransition(
  entityType: EntityType,
  fromState: string,
  toState: string
): boolean {
  if (fromState === toState) return true; // Idempotent

  switch (entityType) {
    case "Source":
      return (SOURCE_TRANSITIONS[fromState as SourceState] || []).includes(toState as SourceState);
    case "Claim":
      return (CLAIM_TRANSITIONS[fromState as ClaimState] || []).includes(toState as ClaimState);
    case "Dataset":
      return (DATASET_TRANSITIONS[fromState as DatasetState] || []).includes(toState as DatasetState);
    case "Analysis":
      return (ANALYSIS_TRANSITIONS[fromState as AnalysisState] || []).includes(toState as AnalysisState);
    case "ManuscriptSection":
      return (SECTION_TRANSITIONS[fromState as SectionState] || []).includes(toState as SectionState);
    default:
      return false;
  }
}

/**
 * Performs a server-validated state transition and returns updated entity + audit transition record.
 */
export function performStateTransition<
  T extends { id: string; state?: string; stateHistory?: StateTransitionRecord[] }
>(
  entityType: EntityType,
  entity: T,
  toState: string,
  actor: { uid: string; email: string },
  reason: string,
  evidenceRecordIds: string[] = []
): { success: boolean; entity: T; transitionRecord?: StateTransitionRecord; error?: string } {
  const currentState = entity.state || DEFAULT_INITIAL_STATES[entityType];

  if (currentState !== toState && !isValidTransition(entityType, currentState, toState)) {
    return {
      success: false,
      entity,
      error: `Prohibited transition: Cannot transition ${entityType} '${entity.id}' from '${currentState}' directly to '${toState}'.`,
    };
  }

  // Phase 3 Rule: Claim cannot transition to 'Verified' without linked evidence and prior researcher review
  if (entityType === "Claim" && toState === "Verified") {
    const claim = entity as any;
    const hasEvidence =
      (evidenceRecordIds && evidenceRecordIds.length > 0) ||
      (claim.linkedSourceIds && claim.linkedSourceIds.length > 0) ||
      (claim.linkedEvidence && claim.linkedEvidence.length > 0);

    if (!hasEvidence) {
      return {
        success: false,
        entity,
        error: `Prohibited transition: Claim '${entity.id}' cannot become Verified without linked evidence and researcher review.`,
      };
    }
  }

  // Phase 4 Rule: Dataset cannot transition to 'Approved for Analysis' or 'Locked' without explicit researcher confirmation of anonymization
  if (entityType === "Dataset" && (toState === "Approved for Analysis" || toState === "Locked")) {
    const ds = entity as any;
    if (!ds.isAnonymizedConfirmed) {
      return {
        success: false,
        entity,
        error: `Prohibited transition: Dataset '${entity.id}' cannot transition to '${toState}' without explicit researcher confirmation of anonymization (isAnonymizedConfirmed = true).`,
      };
    }
  }

  const transitionRecord: StateTransitionRecord = {
    id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    entityType,
    entityId: entity.id,
    fromState: currentState,
    toState,
    actorUid: actor.uid,
    actorEmail: actor.email,
    timestamp: new Date().toISOString(),
    reason: reason || `Transitioned to ${toState}`,
    evidenceRecordIds,
  };

  const updatedHistory = [...(entity.stateHistory || []), transitionRecord];

  const updatedEntity = {
    ...entity,
    state: toState,
    stateHistory: updatedHistory,
  };

  return {
    success: true,
    entity: updatedEntity,
    transitionRecord,
  };
}

/**
 * Validates whether an entity's current state is backed by valid transition audit history.
 * Detects unauthorized client-side state elevation (e.g. jumping straight to Approved/Verified/Locked).
 */
export function validateEntityStateIntegrity(
  entityType: EntityType,
  entity: { id: string; state?: string; stateHistory?: StateTransitionRecord[] }
): { isValid: boolean; reason?: string } {
  const currentState = entity.state || DEFAULT_INITIAL_STATES[entityType];
  const initialState = DEFAULT_INITIAL_STATES[entityType];

  // If in initial state, history can be empty
  if (currentState === initialState) {
    return { isValid: true };
  }

  const history = entity.stateHistory || [];
  if (history.length === 0) {
    return {
      isValid: false,
      reason: `Client state manipulation detected: ${entityType} '${entity.id}' is in advanced state '${currentState}' without audit history.`,
    };
  }

  // Verify history continuity
  let simulatedState = initialState;
  for (let i = 0; i < history.length; i++) {
    const rec = history[i];
    if (rec.fromState !== simulatedState) {
      return {
        isValid: false,
        reason: `Broken transition sequence at step ${i + 1}: Expected fromState '${simulatedState}', but audit log recorded '${rec.fromState}'.`,
      };
    }
    if (!isValidTransition(entityType, rec.fromState, rec.toState)) {
      return {
        isValid: false,
        reason: `Invalid transition step recorded in history: '${rec.fromState}' -> '${rec.toState}'.`,
      };
    }
    simulatedState = rec.toState;
  }

  if (simulatedState !== currentState) {
    return {
      isValid: false,
      reason: `Mismatched final state: Audit log ends at '${simulatedState}', but entity state claims '${currentState}'.`,
    };
  }

  return { isValid: true };
}
