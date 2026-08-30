import type {
  ApprovedSearchPlan,
  LiteratureRetrievalAgentResult,
  LiteratureRetrievalProviderFailure,
  SearchExecution,
  SearchExecutionSource,
  SearchProvider,
} from "../types";
import { executeSearchExecution, type SearchProviderAdapters } from "./searchExecution";

export interface LiteratureRetrievalAgentOptions {
  allowedTools?: SearchProviderAdapters;
  now?: () => string;
}

function validateApprovedPlan(plan: ApprovedSearchPlan, expectedProjectId: string): string[] {
  const errors: string[] = [];
  if (!plan || plan.projectId !== expectedProjectId) errors.push("Approved plan project scope does not match the retrieval project.");
  if (!plan?.planId?.trim() || !plan?.context?.trim() || !plan?.concepts?.length || !plan?.providers?.length) errors.push("Approved plan is incomplete.");
  if (!plan?.approval?.researcherUid?.trim() || !plan?.approval?.researcherEmail?.trim() || !plan?.approval?.approvedAt?.trim() || plan?.approval?.rationale?.trim().length < 5) errors.push("Attributable researcher approval is required.");
  if (plan?.providers?.some((provider) => !plan.providerSyntax?.[provider]?.trim())) errors.push("Every approved provider requires exact approved syntax.");
  return errors;
}

function executionFromPlan(plan: ApprovedSearchPlan, startedAt: string): SearchExecution {
  return {
    searchId: `retrieval-${plan.planId}`,
    projectId: plan.projectId,
    context: plan.context,
    concepts: plan.concepts,
    providerSyntax: plan.providerSyntax,
    providers: plan.providers,
    designedAt: plan.approval.approvedAt,
    filters: plan.filters,
    status: "Selected",
    returnedSourceIds: [],
    counts: { total: 0, byProvider: {} },
    warnings: [],
    errors: [],
    providerExecutions: [],
    results: [],
  };
}

export async function runLiteratureRetrievalAgent(
  projectId: string,
  plan: ApprovedSearchPlan,
  options: LiteratureRetrievalAgentOptions = {}
): Promise<LiteratureRetrievalAgentResult> {
  const now = options.now || (() => new Date().toISOString());
  const startedAt = now();
  const validationErrors = validateApprovedPlan(plan, projectId);
  if (validationErrors.length) {
    const failedExecution: SearchExecution = {
      searchId: `retrieval-${plan?.planId || "missing-plan"}`,
      projectId,
      context: plan?.context || "",
      concepts: plan?.concepts || [],
      providerSyntax: plan?.providerSyntax || {},
      providers: plan?.providers || [],
      designedAt: plan?.approval?.approvedAt || startedAt,
      filters: plan?.filters || {},
      status: "Failed",
      returnedSourceIds: [],
      counts: { total: 0, byProvider: {} },
      warnings: [],
      errors: validationErrors,
      providerExecutions: [],
      results: [],
    };
    return { agentRunId: `literature-retrieval-${startedAt.replace(/[^0-9]/g, "")}`, projectId, planId: plan?.planId || "Missing", status: "Failed", startedAt, completedAt: now(), records: [], providerFailures: [], normalizationWarnings: [], searchExecution: failedExecution, createdSourceIds: [] };
  }

  const selectedTools: SearchProviderAdapters = {};
  for (const provider of plan.providers) {
    const tool = options.allowedTools?.[provider];
    if (tool) selectedTools[provider] = tool;
  }
  const searchExecution = await executeSearchExecution(executionFromPlan(plan, startedAt), options.allowedTools ? selectedTools : undefined, now);
  const failedProviders = new Set<SearchProvider>(searchExecution.providerExecutions.filter((execution) => execution.status === "Error" || execution.status === "Rate Limited" || execution.status === "Not Configured").map((execution) => execution.provider));
  const records = searchExecution.results.filter((record) => !failedProviders.has(record.provider));
  const discarded = searchExecution.results.length - records.length;
  const providerFailures: LiteratureRetrievalProviderFailure[] = searchExecution.providerExecutions
    .filter((execution) => failedProviders.has(execution.provider))
    .map((execution) => ({ provider: execution.provider, status: execution.status, errors: execution.errors, warnings: execution.warnings }));
  const normalizationWarnings = [
    ...searchExecution.providerExecutions.filter((execution) => execution.status === "Not Found").map((execution) => `${execution.provider} returned no records.`),
    ...(discarded ? [`Discarded ${discarded} record(s) returned alongside a provider failure.`] : []),
  ];
  const status: LiteratureRetrievalAgentResult["status"] = providerFailures.length ? (records.length ? "Partial" : "Failed") : "Completed";
  const normalizedByProvider = Object.fromEntries(plan.providers.map((provider) => [provider, records.filter((record) => record.provider === provider).length]));
  const completedAt = now();
  return {
    agentRunId: `literature-retrieval-${startedAt.replace(/[^0-9]/g, "")}`,
    projectId,
    planId: plan.planId,
    status,
    startedAt,
    completedAt,
    records,
    providerFailures,
    normalizationWarnings,
    searchExecution: { ...searchExecution, results: records, returnedSourceIds: records.map((record) => record.sourceId), counts: { total: records.length, byProvider: normalizedByProvider } },
    createdSourceIds: [],
  };
}
