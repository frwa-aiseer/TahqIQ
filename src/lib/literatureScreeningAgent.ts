import type {
  LiteratureScreeningRecord,
  LiteratureScreeningSuggestion,
  ResearcherScreeningDecision,
  ScreeningCriterion,
  ScreeningCriterionAssessment,
  SourceRecord,
} from "../types";

export interface ScreeningActor {
  uid: string;
  email: string;
}

const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function assessCriterion(criterion: ScreeningCriterion, searchableText: string): ScreeningCriterionAssessment {
  const keywords = criterion.keywords.map((keyword) => normalize(keyword.trim())).filter(Boolean);
  if (!keywords.length) {
    return { criterionId: criterion.criterionId, kind: criterion.kind, result: "Unable to Determine", reason: "Researcher input required: this approved criterion has no deterministic screening terms." };
  }
  const matches = keywords.map((keyword) => searchableText.includes(keyword));
  const matched = criterion.keywordMatch === "All" ? matches.every(Boolean) : matches.some(Boolean);
  return {
    criterionId: criterion.criterionId,
    kind: criterion.kind,
    result: matched ? "Matched" : "Not Matched",
    reason: matched
      ? `${criterion.kind} criterion matched its approved ${criterion.keywordMatch.toLowerCase()}-term rule.`
      : `${criterion.kind} criterion did not match its approved ${criterion.keywordMatch.toLowerCase()}-term rule.`,
  };
}

export function runLiteratureScreeningAgent(
  projectId: string,
  source: SourceRecord,
  criteria: ScreeningCriterion[],
  now: () => string = () => new Date().toISOString()
): LiteratureScreeningSuggestion {
  const approved = criteria.filter((criterion) => criterion.projectId === projectId && criterion.approval.status === "Approved");
  const createdAt = now();
  const searchableText = normalize([source.title, source.abstract].filter(Boolean).join(" "));
  const assessments = approved.map((criterion) => assessCriterion(criterion, searchableText));
  const matchedExclusions = assessments.filter((item) => item.kind === "Exclude" && item.result === "Matched");
  const inclusionAssessments = assessments.filter((item) => item.kind === "Include");
  const allInclusionsMatched = inclusionAssessments.length > 0 && inclusionAssessments.every((item) => item.result === "Matched");
  const hasUnable = assessments.some((item) => item.result === "Unable to Determine");

  let outcome: LiteratureScreeningSuggestion["outcome"] = "Uncertain";
  if (matchedExclusions.length) outcome = "Suggested Exclude";
  else if (allInclusionsMatched && !hasUnable) outcome = "Suggested Include";

  const reasons = !approved.length
    ? ["Researcher input required: no approved screening criteria are available for this project."]
    : !source.abstract?.trim()
      ? ["Abstract not available; suggestion is based on title metadata only.", ...assessments.map((item) => item.reason)]
      : assessments.map((item) => item.reason);
  const determinable = assessments.filter((item) => item.result !== "Unable to Determine").length;
  const confidence = assessments.length ? Number((determinable / assessments.length).toFixed(2)) : 0;

  return {
    suggestionId: `screening-${source.id}-${createdAt.replace(/[^0-9]/g, "")}`,
    projectId,
    sourceId: source.id,
    outcome,
    reasons,
    criterionIds: assessments.map((item) => item.criterionId),
    confidence,
    assessments,
    createdAt,
    status: "AI Proposal — Researcher Review Required",
  };
}

export function recordResearcherScreeningDecision(
  record: LiteratureScreeningRecord,
  decision: ResearcherScreeningDecision,
  rationale: string,
  actor: ScreeningActor,
  now: () => string = () => new Date().toISOString()
): LiteratureScreeningRecord {
  if (!rationale.trim()) throw new Error("A researcher rationale is required.");
  if (!actor.uid.trim() || !actor.email.trim()) throw new Error("An attributable researcher is required.");
  const decidedAt = now();
  const suggestedDecision = record.suggestion.outcome === "Suggested Include" ? "Included" : record.suggestion.outcome === "Suggested Exclude" ? "Excluded" : "Uncertain";
  const previousDecision = record.researcherDecision?.decision || null;
  return {
    ...record,
    researcherDecision: { decision, decidedByUid: actor.uid, decidedByEmail: actor.email, decidedAt, rationale: rationale.trim() },
    decisionAudit: [...record.decisionAudit, {
      eventId: `screening-decision-${record.sourceId}-${decidedAt.replace(/[^0-9]/g, "")}`,
      sourceId: record.sourceId,
      timestamp: decidedAt,
      actorUid: actor.uid,
      actorEmail: actor.email,
      previousDecision,
      decision,
      suggestionOutcome: record.suggestion.outcome,
      isOverride: decision !== suggestedDecision,
      rationale: rationale.trim(),
    }],
  };
}
