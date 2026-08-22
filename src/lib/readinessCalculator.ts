import { ProjectState, PipelineStage, StageStatus } from "../types";

export function calculateProjectReadiness(project: ProjectState): {
  overall: number;
  questionClarity: number;
  literatureCoverage: number;
  evidenceVerification: number;
  methodCompleteness: number;
  dataQuality: number;
  reproducibility: number;
  citationAccuracy: number;
  compliance: number;
  integrityReview: number;
} {
  // If no questions, sources, datasets, claims, or manuscript content exist, readiness is 0.
  const hasQuestions = (project.researchQuestions || []).length > 0;
  const hasSources = (project.sources || []).length > 0;
  const hasClaims = (project.claims || []).length > 0;
  const hasDatasets = (project.datasets || []).length > 0;
  const hasAnalyses = (project.analysisPlans || []).length > 0;
  const hasContent = (project.sections || []).some((s) => (s.content || "").trim().length > 20);

  if (!hasQuestions && !hasSources && !hasClaims && !hasDatasets && !hasAnalyses && !hasContent) {
    return {
      overall: 0,
      questionClarity: 0,
      literatureCoverage: 0,
      evidenceVerification: 0,
      methodCompleteness: 0,
      dataQuality: 0,
      reproducibility: 0,
      citationAccuracy: 0,
      compliance: 0,
      integrityReview: 0,
    };
  }

  // 1. Question Clarity
  const totalQuestions = project.researchQuestions.length;
  const approvedQuestions = project.researchQuestions.filter((q) => q.isApproved).length;
  const questionClarity = totalQuestions > 0 ? Math.round((approvedQuestions / totalQuestions) * 100) : 0;

  // 2. Literature Coverage
  const totalSources = project.sources.length;
  const verifiedSources = project.sources.filter(
    (s) => s.state === "Full Text Reviewed" || s.state === "Full Text Available" || s.state === "Metadata Verified" || s.verificationState === "Verified"
  ).length;
  const literatureCoverage = totalSources > 0 ? Math.min(100, Math.round((verifiedSources / Math.max(3, totalSources)) * 100)) : 0;

  // 3. Evidence Verification
  const totalClaims = project.claims.length;
  const verifiedClaims = project.claims.filter(
    (c) => c.state === "Verified" || c.state === "Researcher Reviewed" || c.verificationStatus === "Verified"
  ).length;
  const evidenceVerification = totalClaims > 0 ? Math.round((verifiedClaims / totalClaims) * 100) : 0;

  // 4. Method Completeness
  let methodScore = 0;
  if (hasQuestions) methodScore += 25;
  if ((project.searchStrategies || []).length > 0) methodScore += 25;
  if (project.ethicsInfo?.approvalNumber || project.ethicsInfo?.consentObtained) methodScore += 25;
  if ((project.reportingGuideline?.checklistItems || []).some((i) => i.status === "Addressed")) methodScore += 25;
  const methodCompleteness = Math.min(100, methodScore);

  // 5. Data Quality
  const totalDatasets = project.datasets.length;
  const approvedDatasets = project.datasets.filter(
    (d) => d.state === "Approved for Analysis" || d.state === "Locked" || d.isAnonymizedConfirmed
  ).length;
  const dataQuality = totalDatasets > 0 ? Math.round((approvedDatasets / totalDatasets) * 100) : 0;

  // 6. Reproducibility
  const totalPlans = project.analysisPlans.length;
  const approvedPlans = project.analysisPlans.filter(
    (a) => a.state === "Approved for Manuscript" || (a.state as any) === "Researcher Approved" || a.state === "Completed" || a.status === "Approved" || a.status === "Executed"
  ).length;
  const reproducibility = totalPlans > 0 ? Math.round((approvedPlans / totalPlans) * 100) : 0;

  // 7. Citation Accuracy
  const totalSections = project.sections.length;
  const sectionsWithCitations = project.sections.filter((s) => (s.citationIds || []).length > 0).length;
  const citationAccuracy = totalSections > 0 ? Math.round((sectionsWithCitations / totalSections) * 100) : 0;

  // 8. Compliance
  let complianceScore = 0;
  if (project.selectedTargetOutlet) complianceScore += 50;
  if (project.complianceReport?.overallStatus === "Pass") complianceScore += 50;
  const compliance = complianceScore;

  // 9. Integrity Review
  let integrityScore = 0;
  const authorFinalApprovals = project.authors.filter((a) => a.finalApproval).length;
  if (project.authors.length > 0 && authorFinalApprovals === project.authors.length) integrityScore += 50;
  if (project.termsAccepted) integrityScore += 50;
  const integrityReview = Math.min(100, integrityScore);

  const subScores = [
    questionClarity,
    literatureCoverage,
    evidenceVerification,
    methodCompleteness,
    dataQuality,
    reproducibility,
    citationAccuracy,
    compliance,
    integrityReview,
  ];

  const overall = Math.round(subScores.reduce((acc, val) => acc + val, 0) / subScores.length);

  return {
    overall,
    questionClarity,
    literatureCoverage,
    evidenceVerification,
    methodCompleteness,
    dataQuality,
    reproducibility,
    citationAccuracy,
    compliance,
    integrityReview,
  };
}

export function calculateProjectPipelineStages(project: ProjectState): PipelineStage[] {
  const readiness = calculateProjectReadiness(project);

  return (project.pipelineStages || []).map((stage) => {
    let progressPercent = 0;
    let status: StageStatus = "Not started";

    switch (stage.number) {
      case 1: // Intent & Scope
        progressPercent = project.title && project.projectType ? 100 : 0;
        status = progressPercent === 100 ? "Completed" : "In progress";
        break;
      case 2: // Idea Canvas
        const canvasFilled = Boolean(project.canvas?.broadTopic && project.canvas?.scientificProblem);
        progressPercent = canvasFilled ? 100 : 0;
        status = canvasFilled ? "Completed" : "Not started";
        break;
      case 3: // Question Builder
        progressPercent = readiness.questionClarity;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 4: // Search Planner
        const searchCount = (project.searchStrategies || []).length;
        progressPercent = searchCount > 0 ? 100 : 0;
        status = searchCount > 0 ? "Completed" : "Not started";
        break;
      case 5: // Source Library
        progressPercent = readiness.literatureCoverage;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 6: // Gap Map
        const gapCount = (project.gaps || []).length;
        progressPercent = gapCount > 0 ? 100 : 0;
        status = gapCount > 0 ? "Completed" : "Not started";
        break;
      case 7: // Protocol
      case 8: // Ethics
        progressPercent = readiness.methodCompleteness;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 9: // Data Lab
      case 10:
      case 11:
      case 12:
        progressPercent = readiness.dataQuality;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 13: // Claim Matrix
        progressPercent = readiness.evidenceVerification;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 14: // Writing Studio
        const approvedSections = project.sections.filter((s) => s.state === "Approved" || s.state === "Locked" || s.status === "Approved").length;
        progressPercent = project.sections.length > 0 ? Math.round((approvedSections / project.sections.length) * 100) : 0;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 15: // Checklist
      case 17: // Outlet
        progressPercent = readiness.compliance;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      case 16: // Review
      case 18: // Revision
      case 19: // Audit
      case 20: // Export
        progressPercent = readiness.integrityReview;
        status = progressPercent === 100 ? "Completed" : progressPercent > 0 ? "In progress" : "Not started";
        break;
      default:
        progressPercent = 0;
        status = "Not started";
    }

    return {
      ...stage,
      progressPercent,
      status,
    };
  });
}
