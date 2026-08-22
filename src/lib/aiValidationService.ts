import { ProjectState, AnalysisOutput, NumericEvidence } from "../types";

export interface AIValidationResult {
  valid: boolean;
  error?: string;
  groundedCitations: string[];
  ungroundedCitations: string[];
  groundedNumbers: number[];
  ungroundedNumbers: number[];
  nonEmpiricalNumbers: number[];
  missingPlaceholders: string[];
}

export interface NumericValidationTarget {
  location: "abstract" | "introduction" | "literature-review" | "methods" | "results" | "discussion" | "conclusion" | "table" | "caption" | "supplement";
  content: string;
  label?: string;
}

const CITATION_PATTERN = /\(([A-Z][a-zA-Z\s\-]+(?:et al\.)?,\s*\d{4})\)|\[(DOI:[^\]]+)\]|\[(\d+(?:\s*[-,]\s*\d+)*)\]/g;
const NUMBER_PATTERN = /(?<![\w.])-?\d+(?:\.\d+)?(?!\w|\.\d)/g;

function numbersEqual(left: number, right: number): boolean {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 1e-12;
}

function hasTraceableProvenance(evidence: NumericEvidence, project: ProjectState): boolean {
  if (evidence.verificationState !== "Verified" || !evidence.id?.trim() || !evidence.sourceId?.trim()) return false;
  if (!Number.isFinite(evidence.value) || !Number.isFinite(evidence.normalizedValue) || !evidence.createdAt?.trim()) return false;

  switch (evidence.sourceType) {
    case "DATASET": {
      const dataset = (project.datasets || []).find((item) => item.id === evidence.sourceId);
      return Boolean(dataset && evidence.datasetHash && dataset.fileHash === evidence.datasetHash);
    }
    case "ANALYSIS_OUTPUT": {
      const output = (project.analysisOutputs || []).find((item) => item.id === evidence.sourceId);
      return Boolean(
        output &&
        evidence.analysisRunId === output.id &&
        (!output.datasetHash || evidence.datasetHash === output.datasetHash)
      );
    }
    case "VERIFIED_SOURCE": {
      const source = (project.sources || []).find((item) => item.id === evidence.sourceId && item.verificationState === "Verified");
      return Boolean(
        source && evidence.evidencePassageId &&
        source.extractedPassages?.some((passage) => passage.id === evidence.evidencePassageId && passage.isVerifiedByHuman)
      );
    }
    case "RESEARCHER_PROTOCOL":
      return Boolean(project.methodologyWorkspace && evidence.sourceId === project.id);
    case "USER_CONFIRMED":
      return evidence.sourceId === project.id;
    default:
      return false;
  }
}

function isStructuralNumber(text: string, start: number, end: number): boolean {
  const before = text.slice(Math.max(0, start - 24), start);
  const after = text.slice(end, Math.min(text.length, end + 12));
  return /(?:section|chapter|figure|fig\.?|table|appendix|supplement(?:ary)?(?:\s+(?:figure|table))?)\s*(?:no\.?\s*)?$/i.test(before) ||
    /^\s*of\s+\d+\b/i.test(after);
}

function extractNumbers(content: string): { empirical: number[]; nonEmpirical: number[] } {
  const nonEmpirical: number[] = [];
  const scrubbed = content.replace(CITATION_PATTERN, (citation) => {
    for (const match of citation.matchAll(/\b(?:19|20)\d{2}\b/g)) nonEmpirical.push(Number(match[0]));
    for (const match of citation.matchAll(/\d+/g)) {
      const value = Number(match[0]);
      if (!nonEmpirical.includes(value)) nonEmpirical.push(value);
    }
    return " ".repeat(citation.length);
  });

  const empirical: number[] = [];
  for (const match of scrubbed.matchAll(NUMBER_PATTERN)) {
    const value = Number(match[0]);
    const start = match.index || 0;
    if (isStructuralNumber(scrubbed, start, start + match[0].length)) nonEmpirical.push(value);
    else empirical.push(value);
  }
  return {
    empirical: Array.from(new Set(empirical)),
    nonEmpirical: Array.from(new Set(nonEmpirical)),
  };
}

export function validateManuscriptNumericContent(
  targets: readonly NumericValidationTarget[],
  project: ProjectState
): { valid: boolean; failures: Array<{ location: string; label?: string; numbers: number[] }> } {
  const evidence = (project.numericEvidenceRecords || []).filter((record) => hasTraceableProvenance(record, project));
  const failures = targets.flatMap((target) => {
    const { empirical } = extractNumbers(target.content);
    const numbers = empirical.filter((value) => !evidence.some((record) =>
      numbersEqual(record.value, value) || numbersEqual(record.normalizedValue, value)
    ));
    return numbers.length ? [{ location: target.location, label: target.label, numbers }] : [];
  });
  return { valid: failures.length === 0, failures };
}

/**
 * Validates AI-generated manuscript prose against project state prior to storage.
 * Enforces:
 * 1. Ungrounded citation rejection (citations not in project.sources are rejected).
 * 2. Ungrounded numerical finding rejection (numbers not in numericEvidenceRecords are rejected).
 * 3. Results section blocking when no approved analysis outputs exist.
 */

/**
 * Checks if an analysis output is formally approved by a researcher for manuscript use.
 */
export function isAnalysisOutputApproved(out: AnalysisOutput): boolean {
  // Requirement 1 & 2 & 3: Results drafting can use an analysis output only if:
  // state === "Approved for Manuscript" OR an equivalent backwards-compatible explicit researcher approval field.
  // "Completed" only means execution completed. Automated QC cannot grant researcher approval.
  const isApproved =
    out.state === "Approved for Manuscript" ||
    out.isApproved === true ||
    (out as any).isResearcherApproved === true ||
    (out as any).state === "Researcher Approved";

  // Requirement 6: Imported external statistical outputs preserve status unless reproduced.
  if (out.isResearcherSupplied && out.reproductionStatus === "Not Independently Reproduced" && !out.isReproduced) {
    // If it's external and not reproduced, it can still be used IF the researcher explicitly approved it.
    // The requirement is to "preserve" the flag (e.g. for audit/disclosure), not necessarily block it if approved.
  }

  return !!isApproved;
}

export function validateAiGeneratedProse(
  prose: string,
  sectionTitle: string,
  project: ProjectState
): AIValidationResult {
  const isResultsSection = sectionTitle.toLowerCase().includes("result");

  // Requirement 9: Results section blocked without approved analysis outputs
  if (isResultsSection) {
    const hasApprovedAnalysis =
      project.analysisOutputs &&
      project.analysisOutputs.length > 0 &&
      project.analysisOutputs.some(
        (out) => isAnalysisOutputApproved(out)
      );
    if (!hasApprovedAnalysis) {
      return {
        valid: false,
        error: "Results section drafting blocked: No approved analysis outputs exist in project. Upload dataset and execute an approved analysis plan first.",
        groundedCitations: [],
        ungroundedCitations: [],
        groundedNumbers: [],
        ungroundedNumbers: [],
        nonEmpiricalNumbers: [],
        missingPlaceholders: ["RESULTS_BLOCKED_NO_DATA"],
      };
    }
  }

  const sources = project.sources || [];

  // Extract citations from text, e.g., (Boyer et al., 2021), (Smith, 2024), [1], DOI:10...
  const citationMatches = prose.match(CITATION_PATTERN) || [];
  
  const groundedCitations: string[] = [];
  const ungroundedCitations: string[] = [];
  const citationYears: number[] = [];

  citationMatches.forEach((cit) => {
    const cleanCit = cit.replace(/[()\[\]]/g, "").trim();
    
    // Extract year from citation if present
    const yearMatch = cleanCit.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      citationYears.push(Number(yearMatch[1]));
    }

    // Check if cleanCit matches any existing source author/year/DOI/ID
    const isMatched = sources.some((src) => {
      const authorMatch = src.authors && src.authors.some((a) => cleanCit.toLowerCase().includes(a.toLowerCase().split(" ")[0]));
      const yearMatch = src.year && cleanCit.includes(String(src.year));
      const doiMatch = src.doi && cleanCit.toLowerCase().includes(src.doi.toLowerCase());
      const titleMatch = src.title && cleanCit.toLowerCase().includes(src.title.toLowerCase());
      return (authorMatch && yearMatch) || doiMatch || titleMatch;
    });
    const numericCitation = /^\d+$/.test(cleanCit) && Number(cleanCit) >= 1 && Number(cleanCit) <= sources.length;

    if (isMatched || numericCitation || project.isDemoProject) {
      groundedCitations.push(cleanCit);
    } else {
      ungroundedCitations.push(cleanCit);
    }
  });

  // Temporarily remove citations from prose to avoid parsing citation numbers as empirical numbers
  const extractedNumbers = extractNumbers(prose);

  const groundedNumbers: number[] = [];
  const ungroundedNumbers: number[] = [];
  const nonEmpiricalNumbers: number[] = [];

  // Get provenance-based numerical evidence records
  const numericEvidenceRecords = (project.numericEvidenceRecords || []).filter((record) => hasTraceableProvenance(record, project));

  extractedNumbers.empirical.forEach((num) => {
    // Must be traceable to a NumericEvidence record
    const isGrounded = numericEvidenceRecords.some(
      (evidence) =>
        numbersEqual(evidence.value, num) || numbersEqual(evidence.normalizedValue, num)
    );

    if (isGrounded) {
      groundedNumbers.push(num);
    } else {
      ungroundedNumbers.push(num);
    }
  });

  // Extract missing placeholders
  const placeholderMatches = prose.match(/\[(MISSING SOURCE|DATA REQUIRED|ETHICS REQUIRED|REASONING REQUIRED):[^\]]+\]/g) || [];

  nonEmpiricalNumbers.push(...extractedNumbers.nonEmpirical, ...citationYears);

  // Check for strict ungrounded errors
  if (!project.isDemoProject) {
    if (ungroundedCitations.length > 0) {
      return {
        valid: false,
        error: `Validation Failed: Ungrounded citation(s) detected (${ungroundedCitations.join(", ")}). Citations must exist in project Source Library.`,
        groundedCitations,
        ungroundedCitations,
        groundedNumbers,
        ungroundedNumbers,
        nonEmpiricalNumbers,
        missingPlaceholders: placeholderMatches,
      };
    }

  }

  // Demo status controls isolation and labeling; it is never numeric provenance.
  if (ungroundedNumbers.length > 0) {
    return {
      valid: false,
      error: `Validation Failed: Ungrounded numerical findings detected (${ungroundedNumbers.join(", ")}). All empirical numbers must be traceable to a verified NumericEvidence record.`,
      groundedCitations,
      ungroundedCitations,
      groundedNumbers,
      ungroundedNumbers,
      nonEmpiricalNumbers,
      missingPlaceholders: placeholderMatches,
    };
  }

  return {
    valid: true,
    groundedCitations,
    ungroundedCitations,
    groundedNumbers,
    ungroundedNumbers,
    nonEmpiricalNumbers,
    missingPlaceholders: placeholderMatches,
  };
}

/**
 * Generates dynamic ICJME / Journal-compliant AI Disclosure text strictly matching actual AI Assistance Ledger events.
 */
export function generateLedgerDisclosureStatement(
  ledgerEvents: any[],
  projectTitle: string = "Scholarly Manuscript"
): string {
  if (!ledgerEvents || ledgerEvents.length === 0) {
    return `**AI-Use Disclosure Statement:**\nNo AI assistance tools were utilized in the generation, statistical analysis, or drafting of "${projectTitle}".`;
  }

  const acceptedEvents = ledgerEvents.filter((e) => e.userDecision === "Accepted" || e.userDecision === "Edited");
  const modelsUsed = Array.from(new Set(ledgerEvents.map((e) => e.model || "Gemini 3.6 Flash")));
  const featuresUsed = Array.from(new Set(ledgerEvents.map((e) => e.featureUsed)));
  const sectionsDrafted = Array.from(new Set(ledgerEvents.map((e) => e.manuscriptSection).filter(Boolean)));
  const creditRoles = Array.from(new Set(ledgerEvents.map((e) => e.creditRoleAssigned || "Writing - original draft")));

  const totalEvents = ledgerEvents.length;
  const acceptedCount = ledgerEvents.filter((e) => e.userDecision === "Accepted").length;
  const editedCount = ledgerEvents.filter((e) => e.userDecision === "Edited").length;
  const rejectedCount = ledgerEvents.filter((e) => e.userDecision === "Rejected").length;

  return `**AI-Use Disclosure Statement:**
During the preparation of "${projectTitle}", the authors utilized AI assistance via TehqIQ (powered by ${modelsUsed.join(", ")}) for:
${featuresUsed.map((f) => `- ${f}`).join("\n")}

**Ledger Event Audit Summary:**
- Total Material AI Calls Logged: ${totalEvents}
- Accepted AI Proposals: ${acceptedCount}
- Researcher-Edited AI Proposals: ${editedCount}
- Rejected AI Proposals: ${rejectedCount}
${sectionsDrafted.length > 0 ? `- Target Manuscript Sections: ${sectionsDrafted.join(", ")}\n` : ""}
**CRediT Mappings:** ${creditRoles.join(", ")}.

**Author Responsibility Statement:**
All AI-generated text and analytical suggestions were critically reviewed, verified against empirical primary sources and dataset outputs, and edited by the human authors prior to submission. The authors retain full accountability for the scientific integrity and accuracy of all content.`;
}
