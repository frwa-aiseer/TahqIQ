import type {
  AnalysisOutput,
  QualitativeActor,
  QualitativeAnalysisWorkflow,
  QualitativeCode,
  QualitativeCodebookVersion,
  QualitativeCodedPassage,
  QualitativeDisagreement,
  QualitativeTheme,
} from "../types";

const actorValid = (actor?: QualitativeActor): actor is QualitativeActor => Boolean(actor?.uid.trim() && actor?.email.trim());
const required = (value: string, label: string): string => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
};

export function createQualitativeWorkflow(projectId: string, id = `qual-${Date.now()}`): QualitativeAnalysisWorkflow {
  return { id, projectId: required(projectId, "Project ID"), corpus: [], codebookVersions: [], codedPassages: [], themes: [], disagreements: [], reflexiveMemos: [], state: "Draft" };
}

export function addCorpusDocument(workflow: QualitativeAnalysisWorkflow, document: QualitativeAnalysisWorkflow["corpus"][number]): QualitativeAnalysisWorkflow {
  if (document.reviewState !== "Researcher Reviewed" || !actorValid(document.reviewedBy) || !document.reviewedAt.trim() || !document.id.trim() || !document.artifactId.trim() || !document.artifactHash.trim() || !document.passages.length) throw new Error("Corpus documents require attributable researcher-reviewed artifact provenance and passages.");
  if (document.passages.some((passage) => passage.documentId !== document.id || !passage.id.trim() || !passage.text.trim() || !passage.sourceLocation.trim())) throw new Error("Corpus passage provenance is invalid.");
  if (workflow.corpus.some((item) => item.id === document.id)) throw new Error(`Corpus document '${document.id}' already exists.`);
  return { ...workflow, corpus: [...workflow.corpus, document], state: "Draft" };
}

export function addReflexiveMemo(workflow: QualitativeAnalysisWorkflow, text: string, actor: QualitativeActor, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  const memo = { id: `memo-${Date.now()}`, text: required(text, "Reflexive memo"), author: actor, createdAt: now };
  return { ...workflow, reflexiveMemos: [...workflow.reflexiveMemos, memo] };
}

export function addResearcherCode(workflow: QualitativeAnalysisWorkflow, label: string, definition: string, actor: QualitativeActor, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  const code: QualitativeCode = { id: `code-v${(workflow.codebookVersions.at(-1)?.version ?? 0) + 1}`, label: required(label, "Code label"), definition: required(definition, "Code definition"), origin: "Researcher", status: "Researcher Created", createdBy: actor };
  return withCode(workflow, code, now);
}

export function addAiSuggestedCode(workflow: QualitativeAnalysisWorkflow, label: string, definition: string, system: string, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  const code: QualitativeCode = { id: `code-v${(workflow.codebookVersions.at(-1)?.version ?? 0) + 1}`, label: required(label, "Code label"), definition: required(definition, "Code definition"), origin: "AI Suggested", status: "AI Suggested", createdBy: { system: required(system, "Generating system") } };
  return withCode(workflow, code, now);
}

function withCode(workflow: QualitativeAnalysisWorkflow, code: QualitativeCode, now: string): QualitativeAnalysisWorkflow {
  const latest = workflow.codebookVersions.at(-1);
  const version: QualitativeCodebookVersion = {
    id: `codebook-${Date.now()}-${(latest?.version ?? 0) + 1}`,
    version: (latest?.version ?? 0) + 1,
    previousVersionId: latest?.id,
    state: code.origin === "AI Suggested" ? "Needs Review" : "Draft",
    codes: [...(latest?.codes ?? []), code], createdAt: now,
  };
  return { ...workflow, codebookVersions: [...workflow.codebookVersions, version], state: code.origin === "AI Suggested" ? "Needs Review" : workflow.state };
}

export function reviewAiCode(workflow: QualitativeAnalysisWorkflow, codeId: string, decision: "Approve" | "Reject", actor: QualitativeActor, rationale: string, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  required(rationale, "Review rationale");
  const latest = workflow.codebookVersions.at(-1);
  if (!latest) throw new Error("No codebook version exists.");
  let found = false;
  const codes = latest.codes.map((code) => {
    if (code.id !== codeId) return code;
    found = true;
    if (code.origin !== "AI Suggested" || code.status !== "AI Suggested") throw new Error("Only pending AI-suggested codes use this review action.");
    return { ...code, status: decision === "Approve" ? "Researcher Approved" as const : "Rejected" as const, reviewedBy: actor, reviewedAt: now, reviewRationale: rationale.trim() };
  });
  if (!found) throw new Error(`Code '${codeId}' is not available in the current codebook.`);
  const version: QualitativeCodebookVersion = { id: `codebook-${Date.now()}-${latest.version + 1}`, version: latest.version + 1, previousVersionId: latest.id, state: codes.some((code) => code.status === "AI Suggested") ? "Needs Review" : "Draft", codes, createdAt: now };
  return { ...workflow, codebookVersions: [...workflow.codebookVersions, version], state: "Needs Review" };
}

export function approveLatestCodebook(workflow: QualitativeAnalysisWorkflow, actor: QualitativeActor, rationale: string, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  required(rationale, "Approval rationale");
  const latest = workflow.codebookVersions.at(-1);
  if (!latest || !latest.codes.some((code) => code.status !== "Rejected")) throw new Error("A non-empty codebook is required.");
  if (latest.codes.some((code) => code.status === "AI Suggested")) throw new Error("AI-suggested codes require researcher disposition before codebook approval.");
  const approved = { ...latest, state: "Researcher Approved" as const, approvedBy: actor, approvedAt: now, approvalRationale: rationale.trim() };
  return { ...workflow, codebookVersions: workflow.codebookVersions.map((version) => version.id === latest.id ? approved : version), state: "Needs Review" };
}

export function validateQualitativeWorkflow(workflow: QualitativeAnalysisWorkflow): void {
  required(workflow.projectId, "Project ID");
  const documentIds = new Set(workflow.corpus.map((document) => document.id));
  const passages = new Map(workflow.corpus.flatMap((document) => document.passages.map((passage) => [passage.id, passage] as const)));
  workflow.corpus.forEach((document) => {
    if (!documentIds.has(document.id) || document.reviewState !== "Researcher Reviewed" || !actorValid(document.reviewedBy) || !document.reviewedAt.trim() || !document.artifactHash.trim()) throw new Error("Corpus documents require attributable reviewed, hashed provenance.");
    document.passages.forEach((passage) => { if (passage.documentId !== document.id || !passage.text.trim() || !passage.sourceLocation.trim()) throw new Error("Corpus passage provenance is invalid."); });
  });
  const codebooks = new Map(workflow.codebookVersions.map((version) => [version.id, version]));
  workflow.codebookVersions.forEach((version) => {
    if (version.state === "Researcher Approved" && (!actorValid(version.approvedBy) || !version.approvedAt || !version.approvalRationale?.trim())) throw new Error("Approved codebooks require attributable approval provenance.");
    version.codes.forEach((code) => {
      if (code.origin === "AI Suggested" && code.status === "Researcher Approved" && (!actorValid(code.reviewedBy) || !code.reviewedAt || !code.reviewRationale?.trim())) throw new Error("Approved AI codes require attributable review provenance.");
    });
  });
  workflow.codedPassages.forEach((coded) => {
    if (!passages.has(coded.passageId) || !codebooks.has(coded.codebookVersionId)) throw new Error("Coded passage references unknown corpus or codebook provenance.");
    const codes = new Set(codebooks.get(coded.codebookVersionId)!.codes.filter((code) => code.status !== "Rejected").map((code) => code.id));
    if (!coded.assignments.length || coded.assignments.some((assignment) => !codes.has(assignment.codeId))) throw new Error("Coded passage assignments require known, non-rejected codes.");
    if (coded.reviewState === "Researcher Reviewed" && (!actorValid(coded.reviewedBy) || !coded.reviewedAt || !coded.reviewRationale?.trim())) throw new Error("Reviewed coded passages require attributable review provenance.");
  });
  const codedIds = new Set(workflow.codedPassages.map((coded) => coded.id));
  workflow.themes.forEach((theme) => {
    if (!theme.supportingCodedPassageIds.length || theme.supportingCodedPassageIds.some((id) => !codedIds.has(id))) throw new Error("Themes require known supporting coded passages.");
    if (!theme.supportingQuotations.length) throw new Error("Themes require supporting quotations.");
    theme.supportingQuotations.forEach(({ passageId, quotation }) => {
      const passage = passages.get(passageId);
      if (!passage || !quotation.trim() || !passage.text.includes(quotation)) throw new Error("Theme quotations must be exact text from a known corpus passage.");
    });
    if (theme.status === "Researcher Approved" && (!actorValid(theme.reviewedBy) || !theme.reviewedAt || !theme.reviewRationale?.trim())) throw new Error("Approved themes require attributable review provenance.");
  });
  workflow.disagreements.forEach((item) => {
    if (item.status === "Resolved" && (!actorValid(item.resolvedBy) || !item.resolvedAt || !item.resolution?.trim() || !item.resolutionRationale?.trim())) throw new Error("Resolved disagreements require attributable resolution provenance and rationale.");
  });
}

export function addCodedPassage(workflow: QualitativeAnalysisWorkflow, coded: QualitativeCodedPassage): QualitativeAnalysisWorkflow {
  const next = { ...workflow, codedPassages: [...workflow.codedPassages, coded], state: "Needs Review" as const };
  validateQualitativeWorkflow(next);
  return next;
}

export function reviewCodedPassage(workflow: QualitativeAnalysisWorkflow, codedPassageId: string, actor: QualitativeActor, rationale: string, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  required(rationale, "Review rationale");
  if (workflow.disagreements.some((item) => item.codedPassageId === codedPassageId && item.status === "Open")) throw new Error("Open coding disagreements must be resolved before passage review.");
  let found = false;
  const codedPassages = workflow.codedPassages.map((coded) => {
    if (coded.id !== codedPassageId) return coded;
    found = true;
    return { ...coded, reviewState: "Researcher Reviewed" as const, reviewedBy: actor, reviewedAt: now, reviewRationale: rationale.trim() };
  });
  if (!found) throw new Error(`Coded passage '${codedPassageId}' is not available.`);
  return { ...workflow, codedPassages, state: "Needs Review" };
}

export function addTheme(workflow: QualitativeAnalysisWorkflow, theme: QualitativeTheme): QualitativeAnalysisWorkflow {
  if (theme.origin === "AI Suggested" && theme.status !== "AI Suggested") throw new Error("AI-generated themes must begin as AI Suggested.");
  if (theme.origin === "Researcher" && theme.status !== "Researcher Draft") throw new Error("Researcher themes must begin as Researcher Draft.");
  const next = { ...workflow, themes: [...workflow.themes, theme], state: "Needs Review" as const };
  validateQualitativeWorkflow(next);
  return next;
}

export function reviewTheme(workflow: QualitativeAnalysisWorkflow, themeId: string, decision: "Approve" | "Reject", actor: QualitativeActor, rationale: string, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  required(rationale, "Review rationale");
  let found = false;
  const themes = workflow.themes.map((theme) => {
    if (theme.id !== themeId) return theme;
    found = true;
    if (theme.status === "Researcher Approved" || theme.status === "Rejected") throw new Error("Theme already has a final disposition.");
    return { ...theme, status: decision === "Approve" ? "Researcher Approved" as const : "Rejected" as const, reviewedBy: actor, reviewedAt: now, reviewRationale: rationale.trim() };
  });
  if (!found) throw new Error(`Theme '${themeId}' is not available.`);
  return { ...workflow, themes, state: "Needs Review" };
}

export function resolveDisagreement(workflow: QualitativeAnalysisWorkflow, disagreementId: string, resolution: string, actor: QualitativeActor, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  required(resolution, "Resolution");
  let found = false;
  const disagreements = workflow.disagreements.map((item) => {
    if (item.id !== disagreementId) return item;
    found = true;
    if (item.status !== "Open") throw new Error("Disagreement is already resolved.");
    return { ...item, status: "Resolved" as const, resolution: resolution.trim(), resolutionRationale: resolution.trim(), resolvedBy: actor, resolvedAt: now };
  });
  if (!found) throw new Error(`Disagreement '${disagreementId}' is not available.`);
  return { ...workflow, disagreements, codedPassages: workflow.codedPassages.map((coded) => coded.id === workflow.disagreements.find((item) => item.id === disagreementId)?.codedPassageId ? { ...coded, reviewState: "Needs Review" } : coded), state: "Needs Review" };
}

export function addDisagreement(workflow: QualitativeAnalysisWorkflow, disagreement: QualitativeDisagreement): QualitativeAnalysisWorkflow {
  if (!workflow.codedPassages.some((coded) => coded.id === disagreement.codedPassageId) || disagreement.status !== "Open" || !actorValid(disagreement.raisedBy)) throw new Error("Open disagreement requires a known coded passage and attributable researcher.");
  return { ...workflow, disagreements: [...workflow.disagreements, disagreement], codedPassages: workflow.codedPassages.map((coded) => coded.id === disagreement.codedPassageId ? { ...coded, reviewState: "Disputed" } : coded), state: "Needs Review" };
}

export function approveQualitativeFindings(workflow: QualitativeAnalysisWorkflow, actor: QualitativeActor, rationale: string, now = new Date().toISOString()): QualitativeAnalysisWorkflow {
  if (!actorValid(actor)) throw new Error("Attributable researcher identity is required.");
  required(rationale, "Approval rationale");
  validateQualitativeWorkflow(workflow);
  const latest = workflow.codebookVersions.at(-1);
  if (!latest || latest.state !== "Researcher Approved") throw new Error("Latest codebook requires researcher approval.");
  if (!workflow.codedPassages.length || workflow.codedPassages.some((coded) => coded.reviewState !== "Researcher Reviewed")) throw new Error("All coded passages require researcher review and no disputed state.");
  if (workflow.disagreements.some((item) => item.status === "Open")) throw new Error("All disagreements require attributable resolution.");
  if (!workflow.themes.some((theme) => theme.status === "Researcher Approved") || workflow.themes.some((theme) => theme.status === "AI Suggested" || theme.status === "Researcher Draft")) throw new Error("Every retained theme requires researcher disposition and at least one approved theme.");
  return { ...workflow, state: "Researcher Approved", approvedBy: actor, approvedAt: now, approvalRationale: rationale.trim() };
}

export function createQualitativeManuscriptOutput(workflow: QualitativeAnalysisWorkflow): AnalysisOutput {
  if (workflow.state !== "Researcher Approved" || !actorValid(workflow.approvedBy) || !workflow.approvedAt || !workflow.approvalRationale) throw new Error("Only attributable researcher-approved qualitative findings can feed manuscript writing.");
  validateQualitativeWorkflow(workflow);
  const themes = workflow.themes.filter((theme) => theme.status === "Researcher Approved");
  const summary = themes.map((theme) => `${theme.name}: ${theme.analyticStatement}`).join("\n");
  return {
    id: `qual-output-${workflow.id}`, analysisPlanId: workflow.id, planId: workflow.id,
    executionTimestamp: workflow.approvedAt, softwareEnvironment: "TehqIQ Qualitative Analysis Workflow v1.0",
    summaryText: summary, numericResults: { analysisType: "Qualitative", quantitativeStatistics: "Not applicable" },
    pValues: [], effectSizes: [], assumptionChecks: [], isReproduced: false,
    reproducibilityHash: `qualitative-${workflow.id}`, executionStatus: "Completed", state: "Completed",
    isResearcherSupplied: true, reproductionStatus: "Not Independently Reproduced",
    logs: ["Approved qualitative findings derived from researcher-reviewed corpus, codes, coded passages, and themes."],
    warnings: ["Qualitative findings do not imply p-values, effect sizes, or quantitative generalization."],
    isApproved: true,
    researcherApproval: { actor: workflow.approvedBy, timestamp: workflow.approvedAt, rationale: workflow.approvalRationale, outputId: `qual-output-${workflow.id}`, datasetHash: "Not applicable — qualitative corpus provenance", planId: workflow.id },
  };
}
