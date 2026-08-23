import type { AnalysisOutput, AnalysisState } from "../types";
import { performStateTransition } from "./stateMachines";

export interface ResearcherActor {
  uid: string;
  email: string;
}

export function hasAttributableManuscriptApproval(output: AnalysisOutput): boolean {
  const approval = output.researcherApproval;
  return Boolean(
    (output.state === "Approved for Manuscript" || output.state === "Locked") &&
    approval?.actor.uid?.trim() && approval.actor.email?.trim() &&
    approval.timestamp?.trim() && approval.rationale?.trim() &&
    approval.outputId === output.id && approval.datasetHash?.trim() &&
    approval.datasetHash === output.datasetHash && approval.planId?.trim() &&
    approval.planId === (output.planId || output.analysisPlanId)
  );
}

export function transitionAnalysisOutput(
  output: AnalysisOutput,
  targetState: AnalysisState,
  actor: ResearcherActor,
  rationale: string,
  actorType: "human" | "system"
): AnalysisOutput {
  if (!actor.uid?.trim() || !actor.email?.trim() || !rationale.trim()) {
    throw new Error("Analysis transition requires an attributable actor and rationale.");
  }
  if ((targetState === "Researcher Reviewed" || targetState === "Approved for Manuscript") && actorType !== "human") {
    throw new Error(`Automated QC cannot grant '${targetState}'. An authenticated researcher is required.`);
  }
  if (targetState === "Approved for Manuscript" && (!output.datasetHash || !(output.planId || output.analysisPlanId))) {
    throw new Error("Manuscript approval requires the output ID, dataset hash, and plan ID.");
  }

  const result = performStateTransition("Analysis", output, targetState, actor, rationale);
  if (!result.success) throw new Error(result.error || "Analysis transition failed.");
  const transitioned = result.entity as AnalysisOutput;
  if (targetState !== "Approved for Manuscript") return transitioned;

  return {
    ...transitioned,
    researcherApproval: {
      actor: { ...actor },
      timestamp: result.transitionRecord!.timestamp,
      rationale,
      outputId: output.id,
      datasetHash: output.datasetHash!,
      planId: output.planId || output.analysisPlanId,
    },
  };
}
