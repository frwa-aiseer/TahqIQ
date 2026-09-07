import type {
  ConfirmedResearchIntakeClassification,
  ResearchIntakeClassification,
  ResearchIntakeProposal,
  ResearchIntakeStage,
  ResearchProjectType,
} from "../types";

export interface ResearchIntakeInput {
  projectId: string;
  researchDescription: string;
  statedDiscipline?: string;
  statedSubdiscipline?: string;
  statedStudyType?: ResearchProjectType;
  statedResearchStage?: ResearchIntakeStage;
  statedManuscriptType?: string;
  availableEvidence?: string;
  availableMethod?: string;
  availableData?: string;
  analysisStatus?: string;
  manuscriptStatus?: string;
}

type ClassificationSeed = Pick<ResearchIntakeClassification, "discipline" | "subdiscipline" | "candidateStudyType" | "manuscriptType">;

const CLASSIFIERS: Array<{ pattern: RegExp; seed: ClassificationSeed }> = [
  {
    pattern: /\b(systematic review|systematic evidence synthesis|prisma|database search strategy)\b/i,
    seed: { discipline: "Evidence Synthesis", subdiscipline: "Systematic Review Methodology", candidateStudyType: "Systematic review", manuscriptType: "Review manuscript" },
  },
  {
    pattern: /\b(electrical engineering|electronic circuit|power system|signal processing|semiconductor|antenna|voltage|hardware prototype)\b/i,
    seed: { discipline: "Engineering", subdiscipline: "Electrical Engineering", candidateStudyType: "Engineering experiment", manuscriptType: "Original research manuscript" },
  },
  {
    pattern: /\b(machine learning|deep learning|neural network|classifier|computer vision|natural language processing)\b/i,
    seed: { discipline: "Computer Science", subdiscipline: "Machine Learning", candidateStudyType: "Machine-learning study", manuscriptType: "Original research manuscript" },
  },
  {
    pattern: /\b(economics|econometric|gross domestic product|inflation|labou?r market|panel regression|monetary policy)\b/i,
    seed: { discipline: "Economics", subdiscipline: "Applied Economics", candidateStudyType: "Original quantitative research", manuscriptType: "Original research manuscript" },
  },
  {
    pattern: /\b(qualitative|interviews?|focus groups?|ethnograph|thematic analysis|grounded theory)\b/i,
    seed: { discipline: "Social Sciences", subdiscipline: "Qualitative Research", candidateStudyType: "Original qualitative research", manuscriptType: "Original research manuscript" },
  },
  {
    pattern: /\b(clinical|patients?|diagnosis|treatment|hospital|randomi[sz]ed trial|health intervention)\b/i,
    seed: { discipline: "Medicine & Clinical Research", subdiscipline: "Clinical Research", candidateStudyType: "Researcher input required", manuscriptType: "Original research manuscript" },
  },
];

const clean = (value?: string): string | undefined => value?.trim() || undefined;

function classify(input: ResearchIntakeInput): { seed: ClassificationSeed; inferred: boolean } {
  const matched = CLASSIFIERS.find((classifier) => classifier.pattern.test(input.researchDescription));
  const fallback: ClassificationSeed = {
    discipline: "Researcher input required", subdiscipline: "Researcher input required",
    candidateStudyType: "Researcher input required", manuscriptType: "Researcher input required",
  };
  const seed = matched?.seed || fallback;
  return {
    seed: {
      discipline: clean(input.statedDiscipline) || seed.discipline,
      subdiscipline: clean(input.statedSubdiscipline) || seed.subdiscipline,
      candidateStudyType: input.statedStudyType || seed.candidateStudyType,
      manuscriptType: clean(input.statedManuscriptType) || seed.manuscriptType,
    },
    inferred: Boolean(matched),
  };
}

function researchStage(input: ResearchIntakeInput): ResearchIntakeStage {
  if (input.statedResearchStage) return input.statedResearchStage;
  if (clean(input.manuscriptStatus)) return "Manuscript preparation";
  if (clean(input.analysisStatus)) return "Analysis in progress";
  if (clean(input.availableData)) return "Data available";
  if (clean(input.availableMethod)) return "Protocol development";
  if (clean(input.availableEvidence)) return "Evidence review";
  return "Idea formulation";
}

const NEXT_STAGE: Record<ResearchIntakeStage, string> = {
  "Idea formulation": "Clarify the research question and critical design information.",
  "Evidence review": "Complete and document the evidence-review scope.",
  "Protocol development": "Complete and obtain researcher approval for the protocol.",
  "Data available": "Verify data provenance and approve an analysis plan.",
  "Analysis in progress": "Verify analysis outputs before drafting empirical results.",
  "Manuscript preparation": "Complete evidence, reporting, and outlet compliance review.",
  "Researcher input required": "Researcher input required to determine the next stage.",
};

export function createResearchIntakeProposal(input: ResearchIntakeInput, now = () => new Date().toISOString()): ResearchIntakeProposal {
  if (!input?.projectId?.trim() || !input.researchDescription?.trim()) throw new Error("Project scope and research description are required.");
  const { seed, inferred } = classify(input);
  const stage = researchStage(input);
  const available = {
    evidence: clean(input.availableEvidence) || "Not available" as const,
    method: clean(input.availableMethod) || "Not available" as const,
    data: clean(input.availableData) || "Not available" as const,
  };
  const missingCriticalInformation: string[] = [];
  if (seed.discipline === "Researcher input required") missingCriticalInformation.push("Discipline: Researcher input required");
  if (seed.subdiscipline === "Researcher input required") missingCriticalInformation.push("Subdiscipline: Researcher input required");
  if (seed.candidateStudyType === "Researcher input required") missingCriticalInformation.push("Study type: Researcher input required");
  if (seed.manuscriptType === "Researcher input required") missingCriticalInformation.push("Manuscript type: Researcher input required");
  if (available.evidence === "Not available") missingCriticalInformation.push("Available evidence: Not available");
  if (available.method === "Not available") missingCriticalInformation.push("Available method: Not available");
  if (available.data === "Not available") missingCriticalInformation.push("Available data: Not available");
  const explicitClassifications = [input.statedDiscipline, input.statedSubdiscipline, input.statedStudyType, input.statedManuscriptType].filter(Boolean).length;
  const confidence = explicitClassifications >= 3 ? "High" : inferred ? "Medium" : "Low";
  const generatedAt = now();
  return {
    id: `intake-${input.projectId}-${generatedAt}`, projectId: input.projectId, ...seed, researchStage: stage,
    available, missingCriticalInformation, nextStage: NEXT_STAGE[stage], confidence,
    confidenceRationale: confidence === "High" ? "Three or more classification fields were explicitly supplied by the researcher."
      : confidence === "Medium" ? "Classification uses discipline-specific terms in the supplied description and requires researcher confirmation."
        : "No supported discipline pattern or sufficient explicit classification was supplied.",
    status: "AI Suggested", generatedAt,
    researcherCorrection: {
      allowed: true, correctedFields: [],
      instruction: "Review and correct any classification field before creating a separate researcher-confirmed record.",
    },
  };
}

type CorrectableField = "discipline" | "subdiscipline" | "candidateStudyType" | "researchStage" | "manuscriptType" | "nextStage";
export type ResearchIntakeCorrections = Partial<Pick<ResearchIntakeClassification, CorrectableField>>;

export function confirmResearchIntakeClassification(
  proposal: ResearchIntakeProposal,
  corrections: ResearchIntakeCorrections,
  actor: { uid: string; email: string },
  now = () => new Date().toISOString(),
): ConfirmedResearchIntakeClassification {
  if (!proposal || proposal.status !== "AI Suggested" || !actor.uid?.trim() || !actor.email?.trim()) {
    throw new Error("An AI-suggested proposal and attributable researcher are required.");
  }
  const allowed = new Set<CorrectableField>(["discipline", "subdiscipline", "candidateStudyType", "researchStage", "manuscriptType", "nextStage"]);
  for (const [key, value] of Object.entries(corrections)) {
    if (!allowed.has(key as CorrectableField) || typeof value !== "string" || !value.trim()) throw new Error(`Invalid researcher correction: ${key}.`);
  }
  const confirmedAt = now();
  const { status: _status, generatedAt: _generatedAt, researcherCorrection: _researcherCorrection, ...classification } = proposal;
  return {
    ...classification, ...corrections, id: `confirmed-${proposal.id}`, status: "Researcher Confirmed",
    sourceProposalId: proposal.id, confirmedAt, confirmedByUid: actor.uid, confirmedByEmail: actor.email,
    correctedFields: Object.keys(corrections),
  };
}
