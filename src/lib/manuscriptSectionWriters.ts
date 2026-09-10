import {
  manuscriptSectionContracts,
  validateSectionDraftOutput,
  validateSectionInputs,
  type ManuscriptSectionContractId,
  type SectionDraftProposal,
  type SectionInputState,
} from "./manuscriptSectionContracts";

export type WriterSectionId = "Introduction" | "Literature Review" | "Methods" | "Discussion" | "Conclusion" | "Abstract";
export type SectionWriterName = "IntroductionWriter" | "LiteratureReviewWriter" | "MethodsWriter" | "DiscussionWriter" | "ConclusionWriter" | "AbstractWriter";

export interface GroundedContentUnit {
  id: string;
  text: string;
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  numericEvidence: readonly { id: string; value: number }[];
}

export interface SectionWriterArtifact {
  artifact: string;
  state: SectionInputState;
  units: readonly GroundedContentUnit[];
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface SectionWriterInput {
  explicitUserRequest: true;
  projectId: string;
  projectMode: "Real" | "Demo";
  userEmail: string;
  artifacts: readonly SectionWriterArtifact[];
}

export interface SectionWriterTool {
  draft(context: {
    projectId: string;
    writer: SectionWriterName;
    sectionContract: ReturnType<typeof manuscriptSectionContracts.get>;
    groundedUnits: readonly GroundedContentUnit[];
    instruction: string;
  }): Promise<unknown>;
  attribution: { provider: string; model: string; promptVersion: string };
}

export interface SectionWriterAiUseLog {
  id: string;
  projectId: string;
  timestamp: string;
  userEmail: string;
  featureUsed: SectionWriterName;
  manuscriptSection: WriterSectionId;
  provider: string;
  model: string;
  promptVersion: string;
  inputArtifactIds: readonly string[];
  inputSourceIds: readonly string[];
  outputStatus: "AI Suggested—Needs Researcher Review";
  researcherDecision: "Pending";
}

export interface SectionWriterResult {
  proposal: SectionDraftProposal & { id: string; projectId: string; generatedAt: string; writer: SectionWriterName };
  aiUseLog: SectionWriterAiUseLog;
}

export interface ManualSectionDraft {
  sectionId: ManuscriptSectionContractId;
  content: string;
  origin: "Manual";
  status: "Researcher Draft";
}

const WRITERS: Record<WriterSectionId, SectionWriterName> = {
  Introduction: "IntroductionWriter",
  "Literature Review": "LiteratureReviewWriter",
  Methods: "MethodsWriter",
  Discussion: "DiscussionWriter",
  Conclusion: "ConclusionWriter",
  Abstract: "AbstractWriter",
};
const MISSING = /\b(missing|unverified|researcher input required|not available|not configured|not independently reproduced|unresolved)\b/i;
const stable = (values: readonly string[]) => JSON.stringify([...values].sort());

function validateWriterInput(sectionId: WriterSectionId, input: SectionWriterInput): void {
  if (input.explicitUserRequest !== true) throw new Error(`${WRITERS[sectionId]} runs only after an explicit user request.`);
  if (!input.projectId?.trim() || !input.userEmail?.trim()) throw new Error("A project ID and attributable requesting user are required.");
  const validation = validateSectionInputs(sectionId, input.projectMode, input.artifacts.map(({ artifact, state, isDemo, isSynthetic }) => ({ artifact, state, isDemo, isSynthetic })));
  if (!validation.valid) throw new Error(`Section prerequisites failed: ${validation.missingInformation.join("; ")}`);
  for (const artifact of input.artifacts) {
    if (!artifact.units.length) throw new Error(`${artifact.artifact}: approved input contains no grounded content units.`);
    for (const unit of artifact.units) {
      if (!unit.id?.trim() || !unit.text?.trim() || !Array.isArray(unit.evidenceIds) || !Array.isArray(unit.sourceIds) || !Array.isArray(unit.numericEvidence)) throw new Error(`${artifact.artifact}: malformed grounded content unit.`);
      if (unit.numericEvidence.some(({ id, value }) => !id?.trim() || !Number.isFinite(value))) throw new Error(`${artifact.artifact}: malformed NumericEvidence.`);
    }
  }
}

export function validateSectionWriterCandidate(sectionId: WriterSectionId, candidate: unknown, artifacts: readonly SectionWriterArtifact[]): SectionDraftProposal {
  if (!validateSectionDraftOutput(sectionId, candidate)) throw new Error(`${WRITERS[sectionId]} output does not match the SectionContract.`);
  const units = new Map(artifacts.flatMap(({ units }) => units.map((unit) => [unit.id, unit] as const)));
  const seenClaims = new Set<string>();
  for (const mapping of candidate.claimEvidenceMappings) {
    if (!mapping.claimId.trim() || seenClaims.has(mapping.claimId)) throw new Error("Claim IDs must be non-empty and unique.");
    seenClaims.add(mapping.claimId);
    const unit = units.get(mapping.claimId);
    if (!unit || mapping.claimText !== unit.text) throw new Error(`Claim '${mapping.claimId}' must copy one supplied grounded content unit exactly.`);
    if (stable(mapping.evidenceIds) !== stable(unit.evidenceIds) || stable(mapping.sourceIds) !== stable(unit.sourceIds) || stable(mapping.numericEvidenceIds) !== stable(unit.numericEvidence.map(({ id }) => id))) throw new Error(`Claim '${mapping.claimId}' changed or omitted its evidence provenance.`);
  }
  const selectedText = candidate.claimEvidenceMappings.map(({ claimText }) => claimText).join("\n\n");
  if (candidate.content !== selectedText) throw new Error("Draft content must contain only selected exact grounded claims in declared order.");
  const selectedSources = new Set(candidate.claimEvidenceMappings.flatMap(({ sourceIds }) => [...sourceIds]));
  const selectedNumbers = new Set(candidate.claimEvidenceMappings.flatMap(({ numericEvidenceIds }) => [...numericEvidenceIds]));
  if (stable(candidate.sourceIds) !== stable([...selectedSources]) || stable(candidate.numericEvidenceIds) !== stable([...selectedNumbers])) throw new Error("Draft-level source or NumericEvidence IDs do not match claim mappings.");
  if (candidate.missingInformation.some((item) => !item.trim() || !MISSING.test(item)) || candidate.warnings.some((item) => !item.trim())) throw new Error("Missing information and warnings must be explicit non-empty states.");
  const selectedNumericValues = candidate.claimEvidenceMappings.flatMap(({ claimId }) => units.get(claimId)!.numericEvidence.map(({ value }) => value));
  const scrubbed = candidate.content.replace(/\[src-[\w-]+\]/g, "");
  const proseNumbers = [...scrubbed.matchAll(/(?<![\w.])-?\d+(?:\.\d+)?(?!\w|\.\d)/g)].map((match) => Number(match[0]));
  if (proseNumbers.some((value) => !selectedNumericValues.some((allowed) => Math.abs(allowed - value) <= 1e-12))) throw new Error("Draft contains a number without matching NumericEvidence.");
  return candidate;
}

async function runWriter(sectionId: WriterSectionId, input: SectionWriterInput, tool: SectionWriterTool, now = () => new Date().toISOString()): Promise<SectionWriterResult> {
  validateWriterInput(sectionId, input);
  const contract = manuscriptSectionContracts.get(sectionId);
  const groundedUnits = input.artifacts.flatMap(({ units }) => units.map((unit) => ({ ...unit, evidenceIds: [...unit.evidenceIds], sourceIds: [...unit.sourceIds], numericEvidence: unit.numericEvidence.map((record) => ({ ...record })) })));
  const raw = await tool.draft({
    projectId: input.projectId,
    writer: WRITERS[sectionId],
    sectionContract: contract,
    groundedUnits,
    instruction: "Select and order exact grounded content units. Copy text and all evidence/source/NumericEvidence IDs unchanged. Do not create references, methodology facts, claims, numbers, or approval.",
  });
  const candidate = validateSectionWriterCandidate(sectionId, raw, input.artifacts);
  const generatedAt = now();
  const id = `section-writer-${sectionId.toLowerCase().replace(/\s+/g, "-")}-${input.projectId}-${generatedAt}`;
  const inputSourceIds = [...new Set(groundedUnits.flatMap(({ sourceIds }) => [...sourceIds]))];
  return {
    proposal: { ...candidate, id, projectId: input.projectId, generatedAt, writer: WRITERS[sectionId] },
    aiUseLog: {
      id: `ai-use-${id}`, projectId: input.projectId, timestamp: generatedAt, userEmail: input.userEmail,
      featureUsed: WRITERS[sectionId], manuscriptSection: sectionId, provider: tool.attribution.provider,
      model: tool.attribution.model, promptVersion: tool.attribution.promptVersion,
      inputArtifactIds: input.artifacts.flatMap(({ units }) => units.map(({ id }) => id)), inputSourceIds,
      outputStatus: "AI Suggested—Needs Researcher Review", researcherDecision: "Pending",
    },
  };
}

export const runIntroductionWriter = (input: SectionWriterInput, tool: SectionWriterTool, now?: () => string) => runWriter("Introduction", input, tool, now);
export const runLiteratureReviewWriter = (input: SectionWriterInput, tool: SectionWriterTool, now?: () => string) => runWriter("Literature Review", input, tool, now);
export const runMethodsWriter = (input: SectionWriterInput, tool: SectionWriterTool, now?: () => string) => runWriter("Methods", input, tool, now);
export const runDiscussionWriter = (input: SectionWriterInput, tool: SectionWriterTool, now?: () => string) => runWriter("Discussion", input, tool, now);
export const runConclusionWriter = (input: SectionWriterInput, tool: SectionWriterTool, now?: () => string) => runWriter("Conclusion", input, tool, now);
export const runAbstractWriter = (input: SectionWriterInput, tool: SectionWriterTool, now?: () => string) => runWriter("Abstract", input, tool, now);

export function createManualSectionDraft(sectionId: ManuscriptSectionContractId, content: string): ManualSectionDraft {
  return { sectionId, content, origin: "Manual", status: "Researcher Draft" };
}
