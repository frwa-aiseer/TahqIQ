import type { NumericEvidence, ProjectState, SourceRecord, TargetOutlet } from "../../types";

export type ScientificIntegrityViolationCode =
  | "SOURCE_DOI_INVALID"
  | "SOURCE_VERIFICATION_UNGROUNDED"
  | "EMPIRICAL_NUMBER_UNGROUNDED"
  | "HUMAN_APPROVAL_AUTOMATIC"
  | "OUTLET_VERIFICATION_UNGROUNDED"
  | "DEMO_ARTIFACT_IN_REAL_SUBMISSION"
  | "AI_OUTPUT_SELF_APPROVED";

export interface ScientificIntegrityViolation {
  code: ScientificIntegrityViolationCode;
  path: string;
  message: string;
}

export interface EmpiricalNumberUse {
  value: number;
  sourceId?: string;
  datasetHash?: string;
  analysisRunId?: string;
  path?: string;
}

export interface HumanApprovalAuditRecord {
  id: string;
  approved: boolean;
  approvalActorType?: "human" | "ai" | "system";
  approvedByUid?: string;
  approvalTimestamp?: string;
  path?: string;
}

export interface AiOutputApprovalAuditRecord {
  id: string;
  generatedByAi: boolean;
  approved: boolean;
  approvalActorType?: "human" | "ai" | "system";
  approvedByUid?: string;
  path?: string;
}

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/i;
const DOI_PLACEHOLDER_PATTERN = /(?:^|[./_-])(invalid|example|placeholder|fake|demo|test)(?:$|[./_-])/i;

function hasSourceProvenance(source: SourceRecord): boolean {
  return Boolean(
    source.metadataProvider?.trim() &&
      source.provenance?.provider?.trim() &&
      source.provenance?.retrievedAt?.trim()
  );
}

/**
 * A local invariant cannot prove that a syntactically valid DOI exists in an
 * external registry. It therefore rejects malformed/placeholder DOI values and
 * rejects Verified source records that lack retrieval provenance. Registry
 * verification remains a separate provider/integration responsibility.
 */
export function findFabricatedSourceOrDoiViolations(
  sources: readonly SourceRecord[]
): ScientificIntegrityViolation[] {
  const violations: ScientificIntegrityViolation[] = [];

  sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    const doi = source.doi?.trim();

    if (doi && (!DOI_PATTERN.test(doi) || DOI_PLACEHOLDER_PATTERN.test(doi))) {
      violations.push({
        code: "SOURCE_DOI_INVALID",
        path: `${path}.doi`,
        message: `Source ${source.id || index} has a malformed or placeholder DOI and must remain Unverified.`,
      });
    }

    if (source.verificationState === "Verified" && (!hasSourceProvenance(source) || !source.title?.trim())) {
      violations.push({
        code: "SOURCE_VERIFICATION_UNGROUNDED",
        path,
        message: `Source ${source.id || index} is marked Verified without complete title and provider retrieval provenance.`,
      });
    }
  });

  return violations;
}

function numbersEqual(left: number, right: number): boolean {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 1e-12;
}

export function findEmpiricalNumberFallbackViolations(
  uses: readonly EmpiricalNumberUse[],
  evidenceRecords: readonly NumericEvidence[]
): ScientificIntegrityViolation[] {
  return uses.flatMap((use, index) => {
    const grounded = evidenceRecords.some((evidence) => {
      if (evidence.verificationState !== "Verified" || !numbersEqual(evidence.normalizedValue, use.value)) {
        return false;
      }

      return Boolean(
        (use.sourceId && evidence.sourceId === use.sourceId) ||
          (use.datasetHash && evidence.datasetHash === use.datasetHash) ||
          (use.analysisRunId && evidence.analysisRunId === use.analysisRunId)
      );
    });

    return grounded
      ? []
      : [{
          code: "EMPIRICAL_NUMBER_UNGROUNDED" as const,
          path: use.path || `empiricalNumbers[${index}]`,
          message: `Empirical number ${use.value} has no matching Verified numeric evidence record and must not be used as fallback content.`,
        }];
  });
}

export function findAutomaticHumanApprovalViolations(
  records: readonly HumanApprovalAuditRecord[]
): ScientificIntegrityViolation[] {
  return records.flatMap((record, index) => {
    if (!record.approved) return [];

    const hasHumanApproval = Boolean(
      record.approvalActorType === "human" &&
        record.approvedByUid?.trim() &&
        record.approvalTimestamp?.trim()
    );

    return hasHumanApproval
      ? []
      : [{
          code: "HUMAN_APPROVAL_AUTOMATIC" as const,
          path: record.path || `approvalRecords[${index}]`,
          message: `Record ${record.id} is approved without an attributable, timestamped human decision.`,
        }];
  });
}

export function findUnverifiedOutletShownAsVerifiedViolations(
  outlets: readonly TargetOutlet[]
): ScientificIntegrityViolation[] {
  return outlets.flatMap((outlet, index) => {
    if (outlet.verificationStatus !== "Verified") return [];

    const hasEligibleProvenance =
      outlet.outletProvenanceType === "VERIFIED_STATIC_SEED" ||
      outlet.outletProvenanceType === "LIVE_RETRIEVED_RECORD";
    const hasProvider = Boolean(outlet.provenanceProvider?.trim());
    const userAdded = outlet.isUserAdded || outlet.outletProvenanceType === "USER_ADDED_UNVERIFIED";

    return hasEligibleProvenance && hasProvider && !userAdded
      ? []
      : [{
          code: "OUTLET_VERIFICATION_UNGROUNDED" as const,
          path: `outlets[${index}]`,
          message: `Outlet ${outlet.id} is shown as Verified without eligible provider provenance.`,
        }];
  });
}

interface TaggedArtifact {
  id?: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

function projectArtifactGroups(project: ProjectState): Array<[string, readonly TaggedArtifact[]]> {
  return [
    ["authors", project.authors || []],
    ["sources", project.sources || []],
    ["claims", project.claims || []],
    ["datasets", project.datasets || []],
    ["analysisOutputs", project.analysisOutputs || []],
    ["figures", project.figures || []],
    ["tables", project.tables || []],
    ["sections", project.sections || []],
    ["reviewerComments", project.reviewerComments || []],
  ];
}

export function findDemoArtifactsInRealSubmissionViolations(
  project: ProjectState,
  exportMode: "Submission-Ready" | "Draft Review" = "Submission-Ready"
): ScientificIntegrityViolation[] {
  if (project.isDemoProject || exportMode !== "Submission-Ready") return [];

  return projectArtifactGroups(project).flatMap(([groupName, artifacts]) =>
    artifacts.flatMap((artifact, index) =>
      artifact.isDemo || artifact.isSynthetic
        ? [{
            code: "DEMO_ARTIFACT_IN_REAL_SUBMISSION" as const,
            path: `${groupName}[${index}]`,
            message: `Demo/synthetic artifact ${artifact.id || index} cannot enter real-project submission readiness.`,
          }]
        : []
    )
  );
}

export function findAiOutputSelfApprovalViolations(
  records: readonly AiOutputApprovalAuditRecord[]
): ScientificIntegrityViolation[] {
  return records.flatMap((record, index) => {
    if (!record.generatedByAi || !record.approved) return [];

    const approvedByHuman = Boolean(record.approvalActorType === "human" && record.approvedByUid?.trim());
    return approvedByHuman
      ? []
      : [{
          code: "AI_OUTPUT_SELF_APPROVED" as const,
          path: record.path || `aiOutputs[${index}]`,
          message: `AI-generated record ${record.id} is approved without an attributable human decision.`,
        }];
  });
}

export function expectNoScientificIntegrityViolations(
  violations: readonly ScientificIntegrityViolation[]
): void {
  if (violations.length === 0) return;

  const details = violations
    .map((violation) => `${violation.code} at ${violation.path}: ${violation.message}`)
    .join("\n");
  throw new Error(`Scientific-integrity invariant violation(s):\n${details}`);
}
