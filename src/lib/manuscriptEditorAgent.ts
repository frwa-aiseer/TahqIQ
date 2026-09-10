import type { ManuscriptSectionContractId } from "./manuscriptSectionContracts";

export type EditorOperation = "Remove Repetition" | "Harmonize Terms/Acronyms" | "Improve Transitions/Order" | "Update Cross-references" | "Align Tense/Style" | "Meet Word Limit";

export interface EditableClaim {
  claimId: string;
  text: string;
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  numericEvidenceIds: readonly string[];
}

export interface ManuscriptEditorInput {
  explicitUserRequest: true;
  projectId: string;
  userEmail: string;
  sectionId: ManuscriptSectionContractId;
  approvedSectionId: string;
  approvedClaims: readonly EditableClaim[];
  operations: readonly EditorOperation[];
  approvedTerminology: readonly { from: string; to: string }[];
  approvedCrossReferences: readonly string[];
  wordLimit?: number;
}

export interface EditedClaim {
  claimId: string;
  beforeText: string;
  afterText: string;
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  numericEvidenceIds: readonly string[];
}

export interface ManuscriptEditCandidate {
  editedClaims: readonly EditedClaim[];
  removedClaimIds: readonly string[];
  proposedContent: string;
  changeSummary: readonly { operation: EditorOperation; description: string }[];
  warnings: readonly string[];
  status: "AI Suggested—Needs Researcher Review";
}

export interface ManuscriptEditorTool {
  edit(context: {
    projectId: string;
    sectionId: ManuscriptSectionContractId;
    approvedClaims: readonly EditableClaim[];
    operations: readonly EditorOperation[];
    approvedTerminology: readonly { from: string; to: string }[];
    approvedCrossReferences: readonly string[];
    wordLimit?: number;
    instruction: string;
  }): Promise<unknown>;
  attribution: { provider: string; model: string; promptVersion: string };
}

export interface ManuscriptEditProposal extends ManuscriptEditCandidate {
  id: string;
  projectId: string;
  sourceSectionId: string;
  sectionId: ManuscriptSectionContractId;
  generatedAt: string;
  generator: { provider: string; model: string; promptVersion: string };
  prePostClaimComparison: readonly { claimId: string; beforeText: string; afterText?: string; disposition: "Edited" | "Unchanged" | "Removed" }[];
  aiUseLog: {
    id: string;
    timestamp: string;
    userEmail: string;
    featureUsed: "ManuscriptEditorAgent";
    sourceSectionId: string;
    sourceClaimIds: readonly string[];
    researcherDecision: "Pending";
  };
}

const OPERATIONS: readonly EditorOperation[] = ["Remove Repetition", "Harmonize Terms/Acronyms", "Improve Transitions/Order", "Update Cross-references", "Align Tense/Style", "Meet Word Limit"];
const CONNECTIVES = new Set("a an the and or but nor so yet for to of in on at by with from as is are was were be been being this that these those it its their respectively however therefore moreover furthermore additionally similarly conversely nevertheless consequently meanwhile overall specifically notably previously subsequently also then thus although whereas while because since during between among through within without before after can could may might should would".split(" "));
const UNCERTAINTY = ["may", "might", "could", "suggest", "suggests", "suggested", "uncertain", "uncertainty", "possible", "possibly", "limitation", "limitations", "caution"];
const MEANING_TERMS = ["not", "no", "increase", "increased", "decrease", "decreased", "positive", "negative", "significant", "nonsignificant", "non-significant", "association", "caused", "causes"];
const OVERSTATEMENT = /\b(proves?|proven|definitive(?:ly)?|certain(?:ly)?|always|never|causes?|guarantees?)\b/i;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const words = (value: string) => value.toLowerCase().match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || [];
const stable = (values: readonly string[]) => JSON.stringify([...values].sort());
const numbers = (value: string) => value.match(/(?<![\w.])-?\d+(?:\.\d+)?(?!\w|\.\d)/g) || [];
const citations = (value: string) => value.match(/\[src-[\w-]+\]/g) || [];
const countWords = (value: string) => words(value).length;

function validateInput(input: ManuscriptEditorInput): void {
  if (input.explicitUserRequest !== true) throw new Error("ManuscriptEditorAgent runs only after an explicit user request.");
  if (!input.projectId?.trim() || !input.userEmail?.trim() || !input.approvedSectionId?.trim()) throw new Error("Project, attributable user, and approved source section are required.");
  if (!input.approvedClaims.length || input.approvedClaims.some((claim) => !claim.claimId?.trim() || !claim.text?.trim())) throw new Error("At least one approved source claim is required.");
  if (new Set(input.approvedClaims.map(({ claimId }) => claimId)).size !== input.approvedClaims.length) throw new Error("Approved source claim IDs must be unique.");
  if (!input.operations.length || input.operations.some((operation) => !OPERATIONS.includes(operation))) throw new Error("At least one registered editor operation is required.");
  if (input.wordLimit !== undefined && (!Number.isInteger(input.wordLimit) || input.wordLimit < 1)) throw new Error("Word limit must be a positive integer when supplied.");
  if (input.approvedTerminology.some(({ from, to }) => !from?.trim() || !to?.trim()) || input.approvedCrossReferences.some((item) => !item?.trim())) throw new Error("Approved terminology and cross-references must be non-empty.");
}

function validateAddedVocabulary(before: string, after: string, input: ManuscriptEditorInput): void {
  const beforeWords = new Set(words(before));
  const permitted = new Set([
    ...CONNECTIVES,
    ...input.approvedTerminology.flatMap(({ to }) => words(to)),
    ...input.approvedCrossReferences.flatMap(words),
  ]);
  const unsupported = words(after).find((word) => !beforeWords.has(word) && !permitted.has(word));
  if (unsupported) throw new Error(`Editor introduced unsupported claim vocabulary '${unsupported}'.`);
}

function validateMeaning(before: string, after: string, input: ManuscriptEditorInput): void {
  const stripCrossReferences = (value: string) => input.approvedCrossReferences.reduce((current, reference) => current.split(reference).join(""), value);
  if (stable(numbers(stripCrossReferences(before))) !== stable(numbers(stripCrossReferences(after)))) throw new Error("Editor changed or added numerical/statistical content.");
  if (stable(citations(before)) !== stable(citations(after))) throw new Error("Editor changed or added citations.");
  for (const term of MEANING_TERMS) {
    const pattern = new RegExp(`\\b${term.replace("-", "[- ]?")}\\b`, "gi");
    if ((before.match(pattern) || []).length !== (after.match(pattern) || []).length) throw new Error(`Editor changed protected statistical/claim meaning term '${term}'.`);
  }
  for (const marker of UNCERTAINTY) {
    const pattern = new RegExp(`\\b${marker}\\b`, "gi");
    if ((before.match(pattern) || []).length > (after.match(pattern) || []).length) throw new Error(`Editor removed uncertainty marker '${marker}'.`);
  }
  if (!OVERSTATEMENT.test(before) && OVERSTATEMENT.test(after)) throw new Error("Editor overstated the conclusion.");
}

export function validateManuscriptEditCandidate(candidate: unknown, input: ManuscriptEditorInput): ManuscriptEditCandidate {
  if (!object(candidate) || !exactKeys(candidate, ["editedClaims", "removedClaimIds", "proposedContent", "changeSummary", "warnings", "status"]) || candidate.status !== "AI Suggested—Needs Researcher Review" || typeof candidate.proposedContent !== "string" || !Array.isArray(candidate.editedClaims) || !Array.isArray(candidate.removedClaimIds) || !Array.isArray(candidate.changeSummary) || !Array.isArray(candidate.warnings)) throw new Error("Editor output must match the review-pending structured contract and cannot self-approve.");
  const approved = new Map(input.approvedClaims.map((claim) => [claim.claimId, claim]));
  const seen = new Set<string>();
  const editedClaims = candidate.editedClaims.map((raw): EditedClaim => {
    if (!object(raw) || !exactKeys(raw, ["claimId", "beforeText", "afterText", "evidenceIds", "sourceIds", "numericEvidenceIds"]) || typeof raw.claimId !== "string" || typeof raw.beforeText !== "string" || typeof raw.afterText !== "string" || !Array.isArray(raw.evidenceIds) || !Array.isArray(raw.sourceIds) || !Array.isArray(raw.numericEvidenceIds)) throw new Error("Editor returned a malformed pre/post claim comparison.");
    const source = approved.get(raw.claimId);
    if (!source || seen.has(raw.claimId)) throw new Error(`Editor introduced an unsupported or duplicate claim '${raw.claimId}'.`);
    seen.add(raw.claimId);
    if (raw.beforeText !== source.text || stable(raw.evidenceIds as string[]) !== stable(source.evidenceIds) || stable(raw.sourceIds as string[]) !== stable(source.sourceIds) || stable(raw.numericEvidenceIds as string[]) !== stable(source.numericEvidenceIds)) throw new Error(`Editor changed provenance for claim '${raw.claimId}'.`);
    validateMeaning(source.text, raw.afterText, input);
    validateAddedVocabulary(source.text, raw.afterText, input);
    return raw as unknown as EditedClaim;
  });
  if (candidate.removedClaimIds.some((id) => typeof id !== "string" || !approved.has(id) || seen.has(id)) || new Set(candidate.removedClaimIds).size !== candidate.removedClaimIds.length) throw new Error("Removed claims must be unique approved claims not present in edited output.");
  for (const id of candidate.removedClaimIds as string[]) {
    const removed = approved.get(id)!;
    const retainedDuplicate = editedClaims.some((claim) => claim.afterText === removed.text && stable(claim.evidenceIds) === stable(removed.evidenceIds) && stable(claim.sourceIds) === stable(removed.sourceIds) && stable(claim.numericEvidenceIds) === stable(removed.numericEvidenceIds));
    if (!input.operations.includes("Remove Repetition") || !retainedDuplicate) throw new Error(`Claim '${id}' is unique and cannot be removed as repetition.`);
  }
  const accountedFor = new Set([...seen, ...(candidate.removedClaimIds as string[])]);
  if (accountedFor.size !== approved.size || [...approved.keys()].some((id) => !accountedFor.has(id))) throw new Error("Every pre-edit claim must be preserved or explicitly removed.");
  if (candidate.proposedContent !== editedClaims.map(({ afterText }) => afterText).join("\n\n")) throw new Error("Proposed content must exactly match the ordered post-edit claims.");
  if (input.wordLimit !== undefined && countWords(candidate.proposedContent) > input.wordLimit) throw new Error("Proposed content exceeds the approved word limit.");
  if (candidate.changeSummary.some((change) => !object(change) || !exactKeys(change, ["operation", "description"]) || !OPERATIONS.includes(change.operation as EditorOperation) || !input.operations.includes(change.operation as EditorOperation) || typeof change.description !== "string" || !change.description.trim()) || candidate.warnings.some((warning) => typeof warning !== "string" || !warning.trim())) throw new Error("Editor change summary or warnings are invalid.");
  return candidate as unknown as ManuscriptEditCandidate;
}

export async function runManuscriptEditorAgent(input: ManuscriptEditorInput, tool: ManuscriptEditorTool, now = () => new Date().toISOString()): Promise<ManuscriptEditProposal> {
  validateInput(input);
  const raw = await tool.edit({
    projectId: input.projectId, sectionId: input.sectionId,
    approvedClaims: input.approvedClaims.map((claim) => ({ ...claim, evidenceIds: [...claim.evidenceIds], sourceIds: [...claim.sourceIds], numericEvidenceIds: [...claim.numericEvidenceIds] })),
    operations: [...input.operations], approvedTerminology: input.approvedTerminology.map((item) => ({ ...item })), approvedCrossReferences: [...input.approvedCrossReferences], wordLimit: input.wordLimit,
    instruction: "Edit only for registered style operations. Return every source claim as edited/unchanged or explicitly removed. Preserve facts, citations, numbers, statistical meaning, uncertainty, and provenance; do not overstate conclusions or self-approve.",
  });
  const candidate = validateManuscriptEditCandidate(raw, input);
  const generatedAt = now();
  const id = `manuscript-editor-${input.approvedSectionId}-${generatedAt}`;
  const edited = new Map(candidate.editedClaims.map((claim) => [claim.claimId, claim]));
  const removed = new Set(candidate.removedClaimIds);
  return {
    ...candidate, id, projectId: input.projectId, sourceSectionId: input.approvedSectionId, sectionId: input.sectionId, generatedAt,
    generator: { ...tool.attribution },
    prePostClaimComparison: input.approvedClaims.map((claim) => ({ claimId: claim.claimId, beforeText: claim.text, afterText: edited.get(claim.claimId)?.afterText, disposition: removed.has(claim.claimId) ? "Removed" : edited.get(claim.claimId)!.afterText === claim.text ? "Unchanged" : "Edited" })),
    aiUseLog: { id: `ai-use-${id}`, timestamp: generatedAt, userEmail: input.userEmail, featureUsed: "ManuscriptEditorAgent", sourceSectionId: input.approvedSectionId, sourceClaimIds: input.approvedClaims.map(({ claimId }) => claimId), researcherDecision: "Pending" },
  };
}
