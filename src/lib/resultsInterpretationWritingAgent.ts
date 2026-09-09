import type { AnalysisOutput, ProjectState, QualitativeAnalysisWorkflow } from "../types";
import { hasAttributableManuscriptApproval } from "./analysisLifecycle";
import { validateManuscriptNumericContent } from "./aiValidationService";
import { validateQualitativeWorkflow } from "./qualitativeAnalysisWorkflow";

export type ApprovedResultSourceType = "Approved Analysis Output" | "Approved Qualitative Finding";

export interface ResultsFindingSelection {
  resultId: string;
  sourceType: ApprovedResultSourceType;
  exactFindingText: string;
  warnings: string[];
}

export interface ResultsWritingCandidate {
  findings: ResultsFindingSelection[];
  unresolvedInformation: string[];
}

export interface ResultsInterpretationInput {
  explicitUserRequest: true;
  project: ProjectState;
}

export interface ResultsInterpretationProposal {
  id: string;
  projectId: string;
  status: "AI Suggested";
  reviewState: "Needs Researcher Review";
  generatedAt: string;
  generator: { provider: string; model: string; promptVersion: string };
  sourceResultIds: string[];
  findings: ResultsFindingSelection[];
  unresolvedInformation: string[];
  manuscriptDraft: string;
  numericGrounding: { valid: true; checkedLocations: ["results"] };
}

export interface ApprovedResultsInterpretation extends Omit<ResultsInterpretationProposal, "id" | "status" | "reviewState"> {
  id: string;
  status: "Researcher Approved";
  reviewState: "Researcher Approved";
  sourceProposalId: string;
  approvedByUid: string;
  approvedByEmail: string;
  approvedAt: string;
  rationale: string;
}

export interface ResultsInterpretationTool {
  select(context: {
    projectId: string;
    approvedResults: Array<{ resultId: string; sourceType: ApprovedResultSourceType; exactFindingText: string; warnings: string[] }>;
    instruction: string;
  }): Promise<unknown>;
  attribution: { provider: string; model: string; promptVersion: string };
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && Boolean(value.trim());
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const MISSING_STATE = /\b(missing|unverified|researcher input required|not available|not configured|unresolved)\b/i;

function approvedQualitativeResults(workflow?: QualitativeAnalysisWorkflow): ResultsFindingSelection[] {
  if (!workflow || workflow.state !== "Researcher Approved" || !workflow.approvedBy?.uid?.trim() || !workflow.approvedBy.email?.trim() || !workflow.approvedAt?.trim() || !workflow.approvalRationale?.trim()) return [];
  validateQualitativeWorkflow(workflow);
  return workflow.themes.filter((theme) => theme.status === "Researcher Approved").map((theme) => ({
    resultId: `${workflow.id}:${theme.id}`,
    sourceType: "Approved Qualitative Finding",
    exactFindingText: theme.analyticStatement,
    warnings: [],
  }));
}

function approvedAnalysisResults(outputs: AnalysisOutput[]): ResultsFindingSelection[] {
  return outputs.filter(hasAttributableManuscriptApproval).map((output) => ({
    resultId: output.id,
    sourceType: "Approved Analysis Output",
    exactFindingText: output.summaryText,
    warnings: [...(output.warnings ?? [])],
  }));
}

export function collectApprovedManuscriptResults(project: ProjectState): ResultsFindingSelection[] {
  return [...approvedAnalysisResults(project.analysisOutputs ?? []), ...approvedQualitativeResults(project.qualitativeAnalysis)];
}

export function validateResultsWritingCandidate(candidate: unknown, approvedResults: ResultsFindingSelection[]): ResultsWritingCandidate {
  if (!object(candidate) || !exactKeys(candidate, ["findings", "unresolvedInformation"]) || !Array.isArray(candidate.findings) || !Array.isArray(candidate.unresolvedInformation)) throw new Error("Results interpretation output must contain exactly findings and unresolvedInformation and cannot self-approve.");
  if (!candidate.findings.length) throw new Error("At least one approved finding must be selected.");
  const approved = new Map(approvedResults.map((result) => [result.resultId, result]));
  const seen = new Set<string>();
  const findings = candidate.findings.map((raw): ResultsFindingSelection => {
    if (!object(raw) || !exactKeys(raw, ["resultId", "sourceType", "exactFindingText", "warnings"]) || !nonempty(raw.resultId) || !nonempty(raw.exactFindingText) || !Array.isArray(raw.warnings) || raw.warnings.some((warning) => !nonempty(warning))) throw new Error("Selected result has an invalid structured schema.");
    const source = approved.get(raw.resultId);
    if (!source) throw new Error(`Result ID '${raw.resultId}' is not approved for manuscript use.`);
    if (seen.has(source.resultId)) throw new Error(`Result ID '${source.resultId}' is duplicated.`);
    seen.add(source.resultId);
    if (raw.sourceType !== source.sourceType || raw.exactFindingText !== source.exactFindingText) throw new Error(`Finding text for '${source.resultId}' must exactly match its approved result.`);
    if (JSON.stringify(raw.warnings) !== JSON.stringify(source.warnings)) throw new Error(`Warnings for '${source.resultId}' must exactly match the approved result warnings.`);
    return raw as unknown as ResultsFindingSelection;
  });
  const unresolvedInformation = candidate.unresolvedInformation as unknown[];
  if (unresolvedInformation.some((item) => !nonempty(item) || !MISSING_STATE.test(item))) throw new Error("Unresolved information must remain an explicit missing/unverified state.");
  return { findings, unresolvedInformation: unresolvedInformation as string[] };
}

function buildExactDraft(candidate: ResultsWritingCandidate): string {
  const findingText = candidate.findings.map((finding) => [finding.exactFindingText, ...finding.warnings.map((warning) => `Caution: ${warning}`)].join("\n")).join("\n\n");
  const unresolved = candidate.unresolvedInformation.length ? `\n\nUnresolved information:\n${candidate.unresolvedInformation.map((item) => `- ${item}`).join("\n")}` : "";
  return `${findingText}${unresolved}`;
}

export async function runResultsInterpretationAndWritingAgent(input: ResultsInterpretationInput, tool: ResultsInterpretationTool, now = () => new Date().toISOString()): Promise<ResultsInterpretationProposal> {
  if (input.explicitUserRequest !== true) throw new Error("ResultsInterpretationAndWritingAgent runs only after an explicit user request.");
  if (!input.project?.id?.trim()) throw new Error("A project is required.");
  const approvedResults = collectApprovedManuscriptResults(input.project);
  if (!approvedResults.length) throw new Error("No Approved for Manuscript analysis outputs or approved qualitative findings are available. Results writing is blocked.");
  const raw = await tool.select({
    projectId: input.project.id,
    approvedResults: approvedResults.map((result) => ({ ...result, warnings: [...result.warnings] })),
    instruction: "Select exact approved findings and warnings by result ID. Do not alter, interpret, recalculate, or add findings, numbers, significance, sample sizes, p-values, or effect sizes.",
  });
  const candidate = validateResultsWritingCandidate(raw, approvedResults);
  const manuscriptDraft = buildExactDraft(candidate);
  const grounding = validateManuscriptNumericContent([{ location: "results", content: manuscriptDraft, label: "ResultsInterpretationAndWritingAgent draft" }], input.project);
  if (!grounding.valid) {
    const numbers = grounding.failures.flatMap((failure) => failure.numbers);
    throw new Error(`Numeric grounding failed after generation for value(s): ${numbers.join(", ")}. No draft was accepted.`);
  }
  const generatedAt = now();
  return {
    id: `results-interpretation-${input.project.id}-${generatedAt}`, projectId: input.project.id,
    status: "AI Suggested", reviewState: "Needs Researcher Review", generatedAt,
    generator: { ...tool.attribution }, sourceResultIds: candidate.findings.map((finding) => finding.resultId),
    findings: candidate.findings, unresolvedInformation: candidate.unresolvedInformation,
    manuscriptDraft, numericGrounding: { valid: true, checkedLocations: ["results"] },
  };
}

export function approveResultsInterpretationProposal(proposal: ResultsInterpretationProposal, actor: { uid: string; email: string }, rationale: string, now = () => new Date().toISOString()): ApprovedResultsInterpretation {
  if (proposal.status !== "AI Suggested" || proposal.reviewState !== "Needs Researcher Review" || !nonempty(actor.uid) || !nonempty(actor.email) || !nonempty(rationale)) throw new Error("Results-writing approval requires a review-pending proposal, attributable researcher, and rationale.");
  return { ...proposal, id: `approved-${proposal.id}`, status: "Researcher Approved", reviewState: "Researcher Approved", sourceProposalId: proposal.id, approvedByUid: actor.uid, approvedByEmail: actor.email, approvedAt: now(), rationale: rationale.trim() };
}
