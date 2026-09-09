export type ManuscriptSectionContractId =
  | "Introduction" | "Literature Review" | "Methods" | "Results" | "Discussion"
  | "Conclusion" | "Abstract" | "Title" | "Keywords";

export type SectionInputState = "Verified" | "Researcher Approved" | "Approved for Manuscript" | "Researcher Confirmed" | "Not Applicable—Researcher Confirmed";

export interface SectionInputRequirement {
  artifact: string;
  acceptedStates: readonly SectionInputState[];
  purpose: string;
}

export interface ManuscriptSectionContract {
  id: ManuscriptSectionContractId;
  purpose: string;
  requiredInputs: readonly SectionInputRequirement[];
  anyOfInputGroups: readonly (readonly SectionInputRequirement[])[];
  allowedEmpiricalClaimSources: readonly string[];
  outputSchema: {
    id: "SectionDraftProposal";
    version: "1.0";
    requiredFields: readonly ["sectionId", "content", "claimEvidenceMappings", "sourceIds", "numericEvidenceIds", "missingInformation", "warnings"];
  };
  outputStatus: "AI Suggested—Needs Researcher Review";
  prohibitedBehavior: readonly string[];
}

export interface SuppliedSectionInput {
  artifact: string;
  state: SectionInputState;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface SectionDraftProposal {
  sectionId: ManuscriptSectionContractId;
  content: string;
  claimEvidenceMappings: readonly {
    claimId: string;
    evidenceIds: readonly string[];
    sourceIds: readonly string[];
    numericEvidenceIds: readonly string[];
  }[];
  sourceIds: readonly string[];
  numericEvidenceIds: readonly string[];
  missingInformation: readonly string[];
  warnings: readonly string[];
  status: "AI Suggested—Needs Researcher Review";
}

const VERIFIED = ["Verified", "Researcher Approved", "Approved for Manuscript"] as const;
const APPROVED = ["Researcher Approved", "Approved for Manuscript"] as const;
const MANUSCRIPT_APPROVED = ["Approved for Manuscript"] as const;
const ETHICS = ["Researcher Confirmed", "Not Applicable—Researcher Confirmed"] as const;
const input = (artifact: string, acceptedStates: readonly SectionInputState[], purpose: string): SectionInputRequirement => Object.freeze({ artifact, acceptedStates: Object.freeze([...acceptedStates]), purpose });
const outputSchema = Object.freeze({
  id: "SectionDraftProposal" as const,
  version: "1.0" as const,
  requiredFields: Object.freeze(["sectionId", "content", "claimEvidenceMappings", "sourceIds", "numericEvidenceIds", "missingInformation", "warnings"] as const),
});
const COMMON_PROHIBITIONS = Object.freeze([
  "Fabricate or infer missing facts, evidence, sources, citations, numbers, ethics information, or approvals",
  "Use demo or synthetic artifacts in a real project",
  "Represent the proposal as researcher approved",
]);

function define(contract: Omit<ManuscriptSectionContract, "outputSchema" | "outputStatus" | "prohibitedBehavior"> & { prohibitedBehavior?: readonly string[] }): ManuscriptSectionContract {
  return Object.freeze({
    ...contract,
    requiredInputs: Object.freeze([...contract.requiredInputs]),
    anyOfInputGroups: Object.freeze(contract.anyOfInputGroups.map((group) => Object.freeze([...group]))),
    allowedEmpiricalClaimSources: Object.freeze([...contract.allowedEmpiricalClaimSources]),
    outputSchema,
    outputStatus: "AI Suggested—Needs Researcher Review",
    prohibitedBehavior: Object.freeze([...COMMON_PROHIBITIONS, ...(contract.prohibitedBehavior || [])]),
  });
}

const contracts: readonly ManuscriptSectionContract[] = Object.freeze([
  define({ id: "Introduction", purpose: "Frame the researcher-approved problem and gap using verified evidence.", requiredInputs: [input("approvedProblemStatement", APPROVED, "Problem"), input("approvedResearchGap", APPROVED, "Gap"), input("verifiedEvidence", VERIFIED, "Evidence")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["verifiedEvidence"], prohibitedBehavior: ["Introduce unsupported novelty or empirical findings"] }),
  define({ id: "Literature Review", purpose: "Describe the approved synthesis with traceable evidence-graph support.", requiredInputs: [input("approvedLiteratureSynthesis", APPROVED, "Approved synthesis"), input("verifiedEvidenceGraph", VERIFIED, "Evidence graph")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["approvedLiteratureSynthesis", "verifiedEvidenceGraph"], prohibitedBehavior: ["Treat an unsupported synthesis statement as evidence"] }),
  define({ id: "Methods", purpose: "Describe only approved methodology, protocol, analysis planning, and actual ethics information.", requiredInputs: [input("approvedMethodologyOrProtocol", APPROVED, "Methodology or protocol"), input("approvedAnalysisPlan", APPROVED, "Analysis plan"), input("actualEthicsInformation", ETHICS, "Actual ethics status")], anyOfInputGroups: [], allowedEmpiricalClaimSources: [], prohibitedBehavior: ["Invent participants, sample size, instruments, procedures, recruitment, dates, or ethics approval"] }),
  define({ id: "Results", purpose: "Report only findings approved for manuscript use.", requiredInputs: [], anyOfInputGroups: [[input("approvedAnalysisOutputs", MANUSCRIPT_APPROVED, "Approved quantitative outputs"), input("approvedQualitativeFindings", APPROVED, "Approved qualitative findings")]], allowedEmpiricalClaimSources: ["approvedAnalysisOutputs", "approvedQualitativeFindings"], prohibitedBehavior: ["Calculate, alter, reinterpret, or add empirical findings"] }),
  define({ id: "Discussion", purpose: "Interpret approved results in relation to verified literature.", requiredInputs: [input("approvedResults", MANUSCRIPT_APPROVED, "Approved results"), input("verifiedLiterature", VERIFIED, "Verified literature")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["approvedResults", "verifiedLiterature"], prohibitedBehavior: ["Introduce results not present in approved Results inputs"] }),
  define({ id: "Conclusion", purpose: "Conclude from approved interpretation and results without adding empirical claims.", requiredInputs: [input("approvedInterpretation", APPROVED, "Approved interpretation"), input("approvedResults", MANUSCRIPT_APPROVED, "Approved results")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["approvedInterpretation", "approvedResults"], prohibitedBehavior: ["Introduce any new empirical claim"] }),
  define({ id: "Abstract", purpose: "Summarize approved relevant manuscript sections and approved outputs.", requiredInputs: [input("approvedRelevantSections", APPROVED, "Approved manuscript sections"), input("approvedResults", MANUSCRIPT_APPROVED, "Approved outputs")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["approvedRelevantSections", "approvedResults"], prohibitedBehavior: ["Add content not supported by approved manuscript sections or outputs"] }),
  define({ id: "Title", purpose: "Propose a title from approved project content.", requiredInputs: [input("approvedProjectContent", APPROVED, "Approved project content")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["approvedProjectContent"], prohibitedBehavior: ["Claim novelty, design, population, or results absent from approved project content"] }),
  define({ id: "Keywords", purpose: "Propose keywords from approved project content.", requiredInputs: [input("approvedProjectContent", APPROVED, "Approved project content")], anyOfInputGroups: [], allowedEmpiricalClaimSources: ["approvedProjectContent"], prohibitedBehavior: ["Add unsupported study concepts or indexing claims"] }),
]);

export class ManuscriptSectionContractRegistry {
  private readonly byId = new Map<ManuscriptSectionContractId, ManuscriptSectionContract>();
  constructor(items: readonly ManuscriptSectionContract[]) {
    for (const item of items) {
      if (this.byId.has(item.id)) throw new Error(`Duplicate section contract '${item.id}'.`);
      if (!item.requiredInputs.length && !item.anyOfInputGroups.length) throw new Error(`Section contract '${item.id}' has no verified input requirements.`);
      this.byId.set(item.id, item);
    }
  }
  get(id: ManuscriptSectionContractId): ManuscriptSectionContract { return this.byId.get(id)!; }
  list(): readonly ManuscriptSectionContract[] { return Object.freeze([...this.byId.values()]); }
}

export interface SectionInputValidation {
  valid: boolean;
  missingInformation: readonly string[];
  warnings: readonly string[];
}

function satisfies(requirement: SectionInputRequirement, supplied: ReadonlyMap<string, SuppliedSectionInput>): boolean {
  const artifact = supplied.get(requirement.artifact);
  return Boolean(artifact && requirement.acceptedStates.includes(artifact.state));
}

export function validateSectionInputs(sectionId: ManuscriptSectionContractId, projectMode: "Real" | "Demo", inputs: readonly SuppliedSectionInput[]): SectionInputValidation {
  const contract = manuscriptSectionContracts.get(sectionId);
  const supplied = new Map<string, SuppliedSectionInput>();
  const missingInformation: string[] = [];
  const warnings: string[] = [];
  for (const artifact of inputs) {
    if (supplied.has(artifact.artifact)) missingInformation.push(`${artifact.artifact}: duplicate input`);
    supplied.set(artifact.artifact, artifact);
    if (projectMode === "Real" && (artifact.isDemo || artifact.isSynthetic)) missingInformation.push(`${artifact.artifact}: demo/synthetic input prohibited for real projects`);
  }
  const allowed = new Set([...contract.requiredInputs, ...contract.anyOfInputGroups.flat()].map(({ artifact }) => artifact));
  for (const key of supplied.keys()) if (!allowed.has(key)) missingInformation.push(`${key}: input not allowed for ${sectionId}`);
  for (const requirement of contract.requiredInputs) if (!satisfies(requirement, supplied)) missingInformation.push(`${requirement.artifact}: requires ${requirement.acceptedStates.join(" or ")}`);
  for (const group of contract.anyOfInputGroups) if (!group.some((requirement) => satisfies(requirement, supplied))) missingInformation.push(`one of: ${group.map(({ artifact, acceptedStates }) => `${artifact} (${acceptedStates.join(" or ")})`).join(", ")}`);
  if (projectMode === "Demo" && inputs.some(({ isDemo, isSynthetic }) => isDemo || isSynthetic)) warnings.push("Demo/synthetic inputs must remain isolated and visibly labeled in output.");
  return Object.freeze({ valid: missingInformation.length === 0, missingInformation: Object.freeze(missingInformation), warnings: Object.freeze(warnings) });
}

export function validateSectionDraftOutput(sectionId: ManuscriptSectionContractId, candidate: unknown): candidate is SectionDraftProposal {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const value = candidate as Record<string, unknown>;
  const exactKeys = [...outputSchema.requiredFields, "status"];
  if (Object.keys(value).some((key) => !exactKeys.includes(key as typeof exactKeys[number])) || value.sectionId !== sectionId || value.status !== "AI Suggested—Needs Researcher Review" || typeof value.content !== "string") return false;
  if (!Array.isArray(value.claimEvidenceMappings) || !Array.isArray(value.sourceIds) || !Array.isArray(value.numericEvidenceIds) || !Array.isArray(value.missingInformation) || !Array.isArray(value.warnings)) return false;
  const stringArray = (items: unknown[]) => items.every((item) => typeof item === "string");
  if (!stringArray(value.sourceIds) || !stringArray(value.numericEvidenceIds) || !stringArray(value.missingInformation) || !stringArray(value.warnings)) return false;
  return value.claimEvidenceMappings.every((mapping) => {
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) return false;
    const item = mapping as Record<string, unknown>;
    return Object.keys(item).length === 4 && typeof item.claimId === "string" && Array.isArray(item.evidenceIds) && stringArray(item.evidenceIds) && Array.isArray(item.sourceIds) && stringArray(item.sourceIds) && Array.isArray(item.numericEvidenceIds) && stringArray(item.numericEvidenceIds);
  });
}

export const manuscriptSectionContracts = new ManuscriptSectionContractRegistry(contracts);
