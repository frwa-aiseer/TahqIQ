import type { ProjectRole } from "../types";
import { agentRegistry, type AgentContract, type AgentId } from "./agentRegistry";

export type WorkflowKind = "Empirical" | "Systematic Review" | "Qualitative" | "Existing Dataset" | "Existing Methodology";
export type WorkflowStage = "Intake" | "Outlet Selection" | "Literature" | "Evidence" | "Research Design" | "Methodology" | "Analysis" | "Results" | "Writing" | "Review" | "Export";
export type ArtifactState = "Available" | "Verified" | "Researcher Approved" | "Approved for Manuscript";

export interface WorkflowArtifact {
  key: string;
  state: ArtifactState;
  source: "Researcher Input" | "Researcher Upload" | "Verified Provider" | "TehqIQ Workflow";
}

export interface WorkflowRunRequest {
  projectId: string;
  workflowKind: WorkflowKind;
  stage: WorkflowStage;
  agentId: AgentId;
  role: ProjectRole;
  artifacts: readonly WorkflowArtifact[];
}

interface ArtifactRequirement {
  key: string;
  acceptedStates: readonly ArtifactState[];
}

interface WorkflowRoute {
  agentId: AgentId;
  stage: WorkflowStage;
  workflowKinds: readonly WorkflowKind[];
  requiredInputs: readonly ArtifactRequirement[];
  anyOfInputs?: readonly ArtifactRequirement[];
  outputStorage: string;
}

export interface WorkflowDispatchPlan {
  permitted: true;
  projectId: string;
  workflowKind: WorkflowKind;
  stage: WorkflowStage;
  agent: AgentContract;
  inputArtifactKeys: readonly string[];
  outputStorage: string;
  outputStatus: "AI Suggested" | "Needs Researcher Review";
  approvalRequired: true;
  nextStates: readonly string[];
  automaticNextAgent: null;
}

export interface WorkflowBlock {
  permitted: false;
  agentId: string;
  missingPrerequisites: readonly string[];
}

const ALL_KINDS: readonly WorkflowKind[] = ["Empirical", "Systematic Review", "Qualitative", "Existing Dataset", "Existing Methodology"];
const RESEARCH_KINDS: readonly WorkflowKind[] = ["Empirical", "Systematic Review", "Qualitative"];
const DATA_KINDS: readonly WorkflowKind[] = ["Empirical", "Qualitative", "Existing Dataset", "Existing Methodology"];
const A = ["Available", "Verified", "Researcher Approved", "Approved for Manuscript"] as const;
const V = ["Verified", "Researcher Approved", "Approved for Manuscript"] as const;
const R = ["Researcher Approved", "Approved for Manuscript"] as const;
const M = ["Approved for Manuscript"] as const;
const req = (key: string, acceptedStates: readonly ArtifactState[]): ArtifactRequirement => ({ key, acceptedStates });

const routes: readonly WorkflowRoute[] = [
  { agentId: "research-intake", stage: "Intake", workflowKinds: ALL_KINDS, requiredInputs: [req("researchDescription", A)], outputStorage: "workflow/intake/proposals" },
  { agentId: "outlet-matching", stage: "Outlet Selection", workflowKinds: ALL_KINDS, requiredInputs: [req("manuscriptProfile", R), req("verifiedOutletCatalogue", V), req("outletConstraints", A)], outputStorage: "workflow/outlets/proposals" },
  { agentId: "search-planning", stage: "Literature", workflowKinds: RESEARCH_KINDS, requiredInputs: [req("approvedResearchQuestion", R), req("searchConcepts", A), req("searchConstraints", A)], outputStorage: "workflow/literature/search-plans" },
  { agentId: "literature-retrieval", stage: "Literature", workflowKinds: RESEARCH_KINDS, requiredInputs: [req("approvedSearchPlan", R)], outputStorage: "workflow/literature/retrieval-runs" },
  { agentId: "screening", stage: "Literature", workflowKinds: RESEARCH_KINDS, requiredInputs: [req("retrievedSources", A), req("approvedScreeningCriteria", R)], outputStorage: "workflow/literature/screening-proposals" },
  { agentId: "evidence-extraction", stage: "Evidence", workflowKinds: ALL_KINDS, requiredInputs: [req("verifiedSource", V), req("fullTextChunks", V), req("extractionQuestion", A)], outputStorage: "workflow/evidence/extraction-proposals" },
  { agentId: "literature-synthesis", stage: "Evidence", workflowKinds: ALL_KINDS, requiredInputs: [req("reviewedEvidenceRecords", R)], outputStorage: "workflow/evidence/synthesis-proposals" },
  { agentId: "contradiction-detection", stage: "Evidence", workflowKinds: ALL_KINDS, requiredInputs: [req("reviewedEvidenceRecords", R), req("reviewedSynthesis", R)], outputStorage: "workflow/evidence/contradiction-proposals" },
  { agentId: "research-gap", stage: "Research Design", workflowKinds: RESEARCH_KINDS, requiredInputs: [req("reviewedSynthesis", R), req("reviewedContradictions", R)], outputStorage: "workflow/research-design/gap-proposals" },
  { agentId: "question-hypothesis", stage: "Research Design", workflowKinds: RESEARCH_KINDS, requiredInputs: [req("researchCanvas", A), req("confirmedClassification", R), req("reviewedSynthesis", R), req("approvedGap", R)], outputStorage: "workflow/research-design/question-proposals" },
  { agentId: "methodology-design", stage: "Methodology", workflowKinds: RESEARCH_KINDS, requiredInputs: [req("approvedResearchQuestion", R), req("approvedObjectives", R), req("confirmedClassification", R), req("reviewedEvidence", R), req("approvedGap", R), req("researcherFacts", A), req("confirmedReportingGuidance", R)], outputStorage: "workflow/methodology/proposals" },
  { agentId: "analysis-planning", stage: "Analysis", workflowKinds: DATA_KINDS, requiredInputs: [req("approvedMethodology", R), req("datasetProfile", V), req("variableDictionary", V), req("approvedResearchQuestions", R), req("confirmedClassification", R), req("analysisMethodCapabilities", V)], outputStorage: "workflow/analysis/plan-proposals" },
  { agentId: "results-interpretation-writing", stage: "Results", workflowKinds: DATA_KINDS, requiredInputs: [], anyOfInputs: [req("approvedAnalysisOutputs", M), req("approvedQualitativeFindings", R)], outputStorage: "workflow/results/writing-proposals" },
  { agentId: "section-writer", stage: "Writing", workflowKinds: ALL_KINDS, requiredInputs: [req("sectionRequest", A), req("approvedProjectFacts", R), req("verifiedSources", V)], outputStorage: "workflow/manuscript/section-proposals" },
  { agentId: "peer-review", stage: "Review", workflowKinds: ALL_KINDS, requiredInputs: [req("manuscriptSections", R), req("verifiedSources", V), req("reviewerRole", A)], outputStorage: "workflow/review/peer-review-proposals" },
  { agentId: "compliance", stage: "Review", workflowKinds: ALL_KINDS, requiredInputs: [req("manuscript", R), req("verifiedOutletRequirements", V), req("reportingChecklist", V), req("projectGovernance", V)], outputStorage: "workflow/review/compliance-reports" },
  { agentId: "integrity-review", stage: "Review", workflowKinds: ALL_KINDS, requiredInputs: [req("projectArtifacts", V), req("auditTrail", V), req("aiLedger", V), req("evidenceGraph", V)], outputStorage: "workflow/review/integrity-reports" },
  { agentId: "manuscript-editor", stage: "Writing", workflowKinds: ALL_KINDS, requiredInputs: [req("approvedManuscriptSection", R), req("editInstruction", A), req("approvedEvidence", R)], outputStorage: "workflow/manuscript/edit-proposals" },
  { agentId: "export", stage: "Export", workflowKinds: ALL_KINDS, requiredInputs: [req("approvedManuscript", R), req("verifiedReferences", V), req("approvedFigures", R), req("approvedTables", R), req("exportConfiguration", A)], outputStorage: "workflow/exports/jobs" },
];

function requirementSatisfied(requirement: ArtifactRequirement, artifacts: ReadonlyMap<string, WorkflowArtifact>): boolean {
  const artifact = artifacts.get(requirement.key);
  return Boolean(artifact && requirement.acceptedStates.includes(artifact.state));
}

export class WorkflowOrchestrator {
  private readonly byAgent = new Map<AgentId, WorkflowRoute>();

  constructor(definitions: readonly WorkflowRoute[] = routes) {
    for (const definition of definitions) {
      if (this.byAgent.has(definition.agentId)) throw new Error(`Duplicate workflow route '${definition.agentId}'.`);
      const contract = agentRegistry.get(definition.agentId);
      if (!contract) throw new Error(`Workflow route references unregistered agent '${definition.agentId}'.`);
      const undeclaredInput = [...definition.requiredInputs, ...(definition.anyOfInputs || [])].find(({ key }) => !contract.allowedInputArtifacts.includes(key));
      if (undeclaredInput) throw new Error(`Workflow route input '${undeclaredInput.key}' is not allowed by agent '${definition.agentId}'.`);
      this.byAgent.set(definition.agentId, Object.freeze({ ...definition }));
    }
    const missingRoute = agentRegistry.list().find(({ id }) => !this.byAgent.has(id));
    if (missingRoute) throw new Error(`Registered agent '${missingRoute.id}' has no workflow route.`);
  }

  plan(request: WorkflowRunRequest): WorkflowDispatchPlan | WorkflowBlock {
    const route = this.byAgent.get(request.agentId);
    const contract = agentRegistry.get(request.agentId);
    if (!route || !contract) return Object.freeze({ permitted: false, agentId: request.agentId, missingPrerequisites: Object.freeze(["agentId: agent is not registered for workflow dispatch"]) });
    const missing: string[] = [];
    if (!request.projectId.trim()) missing.push("projectId: Missing");
    if (route.stage !== request.stage) missing.push(`stage: requires ${route.stage}`);
    if (!route.workflowKinds.includes(request.workflowKind)) missing.push(`workflowKind: ${request.workflowKind} is not permitted`);
    if (!contract.permissions.roles.includes(request.role)) missing.push(`role: ${request.role} is not permitted`);

    const artifacts = new Map<string, WorkflowArtifact>();
    for (const artifact of request.artifacts) {
      if (!artifact.key.trim() || artifacts.has(artifact.key)) {
        missing.push(`artifact: duplicate or invalid key '${artifact.key}'`);
      } else {
        artifacts.set(artifact.key, artifact);
      }
    }
    for (const requirement of route.requiredInputs) {
      if (!requirementSatisfied(requirement, artifacts)) missing.push(`${requirement.key}: requires ${requirement.acceptedStates.join(" or ")}`);
    }
    if (route.anyOfInputs?.length && !route.anyOfInputs.some((requirement) => requirementSatisfied(requirement, artifacts))) {
      missing.push(`one of: ${route.anyOfInputs.map(({ key, acceptedStates }) => `${key} (${acceptedStates.join(" or ")})`).join(", ")}`);
    }
    if (missing.length) return Object.freeze({ permitted: false, agentId: request.agentId, missingPrerequisites: Object.freeze(missing) });

    const suppliedKeys = [...artifacts.keys()];
    const undeclared = suppliedKeys.find((key) => !contract.allowedInputArtifacts.includes(key));
    if (undeclared) return Object.freeze({ permitted: false, agentId: request.agentId, missingPrerequisites: Object.freeze([`${undeclared}: input is not permitted`]) });

    return Object.freeze({
      permitted: true,
      projectId: request.projectId,
      workflowKind: request.workflowKind,
      stage: request.stage,
      agent: contract,
      inputArtifactKeys: Object.freeze(suppliedKeys),
      outputStorage: route.outputStorage,
      outputStatus: contract.modelTier === "Deterministic" ? "Needs Researcher Review" : "AI Suggested",
      approvalRequired: true,
      nextStates: contract.nextStates,
      automaticNextAgent: null,
    });
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();
