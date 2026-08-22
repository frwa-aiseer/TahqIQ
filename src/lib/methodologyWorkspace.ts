import type {
  MethodologyFields,
  MethodologyReviewState,
  MethodologySourceMode,
  MethodologyWorkspace,
  ProjectState,
} from "../types";

export const METHODOLOGY_FIELD_KEYS: ReadonlyArray<keyof MethodologyFields> = [
  "design",
  "populationOrDataSource",
  "sampling",
  "eligibility",
  "interventionExposureComparator",
  "variablesOrOutcomes",
  "instruments",
  "dataCollection",
  "analysisPlan",
  "ethics",
  "limitations",
];

export const METHODOLOGY_FIELD_LABELS: Record<keyof MethodologyFields, string> = {
  design: "Design",
  populationOrDataSource: "Population or data source",
  sampling: "Sampling",
  eligibility: "Eligibility",
  interventionExposureComparator: "Intervention, exposure, or comparator (if applicable)",
  variablesOrOutcomes: "Variables or outcomes",
  instruments: "Instruments or materials",
  dataCollection: "Data collection",
  analysisPlan: "Analysis plan",
  ethics: "Ethics",
  limitations: "Limitations",
};

const LABEL_PATTERNS: Record<keyof MethodologyFields, RegExp> = {
  design: /^(?:study\s+)?design\s*[:\-]\s*(.+)$/i,
  populationOrDataSource: /^(?:population|participants?|data\s+source)\s*[:\-]\s*(.+)$/i,
  sampling: /^(?:sampling|sample\s+strategy)\s*[:\-]\s*(.+)$/i,
  eligibility: /^(?:eligibility|inclusion(?:\/exclusion)?\s+criteria)\s*[:\-]\s*(.+)$/i,
  interventionExposureComparator: /^(?:intervention|exposure|comparator|intervention\/exposure\/comparator)\s*[:\-]\s*(.+)$/i,
  variablesOrOutcomes: /^(?:variables?|outcomes?|variables?\/outcomes?)\s*[:\-]\s*(.+)$/i,
  instruments: /^(?:instruments?|materials?|measures?)\s*[:\-]\s*(.+)$/i,
  dataCollection: /^(?:data\s+collection|collection\s+procedure)\s*[:\-]\s*(.+)$/i,
  analysisPlan: /^(?:analysis(?:\s+plan)?|data\s+analysis)\s*[:\-]\s*(.+)$/i,
  ethics: /^(?:ethics|ethical\s+considerations?)\s*[:\-]\s*(.+)$/i,
  limitations: /^(?:limitations?|methodological\s+limitations?)\s*[:\-]\s*(.+)$/i,
};

export function createBlankMethodologyFields(): MethodologyFields {
  return {
    design: "",
    populationOrDataSource: "",
    sampling: "",
    eligibility: "",
    interventionExposureComparator: "",
    variablesOrOutcomes: "",
    instruments: "",
    dataCollection: "",
    analysisPlan: "",
    ethics: "",
    limitations: "",
  };
}

export function createMethodologyWorkspace(
  sourceMode: MethodologySourceMode = "Researcher Entered",
  reviewState: MethodologyReviewState = "Draft"
): MethodologyWorkspace {
  return {
    sourceMode,
    reviewState,
    fields: createBlankMethodologyFields(),
    updatedAt: new Date().toISOString(),
  };
}

export function getMethodologyWorkspace(project: ProjectState): MethodologyWorkspace {
  const existing = project.methodologyWorkspace;
  if (!existing) return createMethodologyWorkspace();

  return {
    ...existing,
    fields: {
      ...createBlankMethodologyFields(),
      ...existing.fields,
    },
  };
}

/**
 * Deterministic, label-only extraction. It copies explicitly labelled protocol
 * text and never infers absent methodology details.
 */
export function extractMethodologyFieldsFromText(text: string): MethodologyFields {
  const fields = createBlankMethodologyFields();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-*]\s+/, "");
    if (!line) continue;

    for (const key of METHODOLOGY_FIELD_KEYS) {
      const match = line.match(LABEL_PATTERNS[key]);
      if (match?.[1]?.trim()) {
        fields[key] = fields[key]
          ? `${fields[key]}\n${match[1].trim()}`
          : match[1].trim();
        break;
      }
    }
  }

  return fields;
}

export function countCompletedMethodologyFields(fields: MethodologyFields): number {
  return METHODOLOGY_FIELD_KEYS.filter((key) => fields[key].trim().length > 0).length;
}
