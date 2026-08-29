import React, { useMemo, useState } from "react";
import { CheckCircle2, Database, Download, Loader2, Play, Search, Settings2 } from "lucide-react";
import type { SearchConcept, SearchExecution, SearchExecutionSource, SearchProvider } from "../../types";
import { createSearchExecution } from "../../lib/searchExecution";
import { authenticatedProjectFetch } from "../../lib/authenticatedFetch";

interface SearchPlannerViewProps {
  projectId: string;
  executions: SearchExecution[];
  onSaveExecution: (execution: SearchExecution) => void;
  onImportSources: (execution: SearchExecution, sources: SearchExecutionSource[]) => void;
}

const PROVIDERS: SearchProvider[] = ["PubMed", "Crossref", "OpenAlex", "Europe PMC", "arXiv", "DOAJ"];

function parseConcepts(value: string): SearchConcept[] {
  return value.split("\n").map((line) => {
    const [concept = "", synonyms = ""] = line.split(":", 2);
    return { concept: concept.trim(), synonyms: synonyms.split(",").map((term) => term.trim()).filter(Boolean) };
  }).filter((item) => item.concept);
}

export const SearchPlannerView: React.FC<SearchPlannerViewProps> = ({ projectId, executions, onSaveExecution, onImportSources }) => {
  const [context, setContext] = useState("");
  const [conceptText, setConceptText] = useState("");
  const [providers, setProviders] = useState<SearchProvider[]>(["PubMed"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [draft, setDraft] = useState<SearchExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const activeExecution = draft || executions[0] || null;
  const concepts = useMemo(() => parseConcepts(conceptText), [conceptText]);

  const designSearch = () => {
    if (!context.trim() || !concepts.length) return setNotice("Context and at least one concept are required.");
    const execution = createSearchExecution({ projectId, context, concepts, providers, filters: { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, maxResultsPerProvider: maxResults } });
    setDraft(execution); setSelectedSourceIds([]); setNotice("Search design ready. Review provider syntax, then execute.");
  };

  const executeSearch = async () => {
    if (!draft || !draft.providers.length) return;
    setIsExecuting(true); setNotice(null);
    try {
      const response = await authenticatedProjectFetch(`/api/projects/${encodeURIComponent(projectId)}/search-executions`, projectId, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ searchId: draft.searchId, projectId, context: draft.context, concepts: draft.concepts, providers: draft.providers, filters: draft.filters }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.execution) throw new Error(payload.error || "Search execution failed.");
      const execution = payload.execution as SearchExecution;
      setDraft(execution); onSaveExecution(execution); setNotice(`Execution complete. ${execution.counts.total} records await review.`);
    } catch (error: any) { setNotice(error?.message || "Search execution failed safely."); }
    finally { setIsExecuting(false); }
  };

  const importReviewed = () => {
    if (!activeExecution || !selectedSourceIds.length) return;
    const selected = activeExecution.results.filter((source) => selectedSourceIds.includes(source.sourceId));
    const reviewedAt = new Date().toISOString();
    const imported = { ...activeExecution, status: "Imported" as const, reviewedAt, importedAt: reviewedAt, importedSourceIds: selected.map((source) => source.sourceId) };
    onImportSources(imported, selected); onSaveExecution(imported); setDraft(imported);
    setNotice(`Imported ${selected.length} researcher-selected source record(s) as Unverified metadata.`);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <div>
        <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1"><Search className="w-4 h-4" /><span>Reproducible Search Execution</span></div>
        <h2 className="font-serif font-bold text-xl text-[#102A43]">Design → Select → Execute → Review → Import</h2>
        <p className="text-xs text-slate-600 mt-1">Each selected provider runs separately and retains its exact syntax, timestamps, counts, source IDs, warnings, and errors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label className="text-xs font-semibold text-slate-700">Search context
          <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={3} className="mt-1 w-full border rounded-lg p-2 font-normal" placeholder="Describe the literature-search purpose and scope." />
        </label>
        <label className="text-xs font-semibold text-slate-700">Concepts and synonyms
          <textarea value={conceptText} onChange={(event) => setConceptText(event.target.value)} rows={3} className="mt-1 w-full border rounded-lg p-2 font-mono font-normal" placeholder={"population: athlete, runner\nintervention: warm-up, stretching"} />
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700">Select providers</span>
        <div className="flex flex-wrap gap-2">{PROVIDERS.map((provider) => {
          const selected = providers.includes(provider);
          return <button key={provider} onClick={() => setProviders(selected ? providers.filter((item) => item !== provider) : [...providers, provider])} className={`px-3 py-2 rounded-lg text-xs font-semibold border ${selected ? "bg-[#102A43] text-white border-[#102A43]" : "bg-slate-50 text-slate-700 border-slate-200"}`}><Database className="inline w-3.5 h-3.5 mr-1" />{provider}</button>;
        })}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs text-slate-600">From date<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full border rounded-lg p-2" /></label>
        <label className="text-xs text-slate-600">To date<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full border rounded-lg p-2" /></label>
        <label className="text-xs text-slate-600">Maximum per provider<input type="number" min={1} max={100} value={maxResults} onChange={(event) => setMaxResults(Math.min(100, Math.max(1, Number(event.target.value))))} className="mt-1 w-full border rounded-lg p-2" /></label>
      </div>
      <button onClick={designSearch} className="px-4 py-2 rounded-lg bg-[#0B5D4B] text-white text-xs font-semibold"><Settings2 className="inline w-4 h-4 mr-1" />Design provider queries</button>

      {activeExecution && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono text-xs text-slate-500">{activeExecution.searchId}</p><p className="text-sm font-semibold text-[#102A43]">Status: {activeExecution.status}</p></div>
            {draft?.status === "Selected" && <button onClick={executeSearch} disabled={isExecuting} className="px-4 py-2 rounded-lg bg-[#C8902F] text-white text-xs font-semibold disabled:opacity-50">{isExecuting ? <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> : <Play className="inline w-4 h-4 mr-1" />}Execute {draft.providers.length} provider(s)</button>}
          </div>
          <div className="space-y-2">{activeExecution.providers.map((provider) => <div key={provider} className="rounded-lg border border-slate-200 p-3"><p className="font-semibold text-xs text-[#102A43]">{provider}</p><code className="block mt-1 text-[11px] text-slate-600 whitespace-pre-wrap">{activeExecution.providerSyntax[provider] || "Not available"}</code></div>)}</div>

          {activeExecution.providerExecutions.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{activeExecution.providerExecutions.map((result) => <div key={result.provider} className="rounded-lg bg-slate-50 border p-3 text-xs"><div className="flex justify-between"><strong>{result.provider}</strong><span>{result.status}</span></div><p>{result.count} returned</p>{result.errors.map((error) => <p key={error} className="text-red-700 mt-1">{error}</p>)}{result.warnings.map((warning) => <p key={warning} className="text-amber-700 mt-1">{warning}</p>)}</div>)}</div>}

          {activeExecution.status !== "Selected" && <div className="space-y-2"><h3 className="font-serif font-bold text-[#102A43]">Review returned records</h3>{activeExecution.results.length === 0 ? <p className="text-xs text-slate-500">No records available for review.</p> : activeExecution.results.map((source) => {
            const importable = Boolean(source.title && source.year && source.journalOrVenue);
            return <label key={source.sourceId} className="flex gap-3 rounded-lg border p-3 text-xs"><input type="checkbox" checked={selectedSourceIds.includes(source.sourceId)} disabled={!importable || activeExecution.status === "Imported"} onChange={(event) => setSelectedSourceIds(event.target.checked ? [...selectedSourceIds, source.sourceId] : selectedSourceIds.filter((id) => id !== source.sourceId))} /><span><strong>{source.title || "Missing title"}</strong><span className="block text-slate-500">{source.provider} · {source.year || "Year not available"} · {source.journalOrVenue || "Venue not available"} · {source.doi || source.pmid || source.arxivId || source.providerRecordId || "Identifier not available"}</span>{!importable && <span className="block text-amber-700 mt-1">Researcher input required before import.</span>}</span></label>;
          })}</div>}
          {activeExecution.status === "Review" && <button onClick={importReviewed} disabled={!selectedSourceIds.length} className="px-4 py-2 rounded-lg bg-[#102A43] text-white text-xs font-semibold disabled:opacity-50"><Download className="inline w-4 h-4 mr-1" />Import reviewed selection</button>}
          {activeExecution.status === "Imported" && <p className="text-xs text-emerald-700 font-semibold"><CheckCircle2 className="inline w-4 h-4 mr-1" />Reviewed records imported.</p>}
        </div>
      )}
      {notice && <p className="text-xs rounded-lg bg-slate-50 border p-3 text-slate-700">{notice}</p>}
    </div>
  );
};
