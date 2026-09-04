import React, { useState } from "react";
import { CheckCircle2, ClipboardCheck, ShieldAlert } from "lucide-react";
import type { LiteratureScreeningRecord, ResearcherScreeningDecision, ScreeningCriterion, SourceRecord } from "../../types";
import { recordResearcherScreeningDecision, runLiteratureScreeningAgent } from "../../lib/literatureScreeningAgent";

interface LiteratureScreeningWorkbenchProps {
  projectId: string;
  sources: SourceRecord[];
  criteria: ScreeningCriterion[];
  records: LiteratureScreeningRecord[];
  actor: { uid: string; email: string };
  onChangeCriteria: (criteria: ScreeningCriterion[]) => void;
  onChangeRecords: (records: LiteratureScreeningRecord[]) => void;
}

export const LiteratureScreeningWorkbench: React.FC<LiteratureScreeningWorkbenchProps> = ({
  projectId, sources, criteria, records, actor, onChangeCriteria, onChangeRecords,
}) => {
  const [kind, setKind] = useState<"Include" | "Exclude">("Include");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const addApprovedCriterion = () => {
    const terms = keywords.split(",").map((item) => item.trim()).filter(Boolean);
    if (!description.trim() || !terms.length) {
      setNotice("Description and at least one deterministic term are required before approval.");
      return;
    }
    const approvedAt = new Date().toISOString();
    onChangeCriteria([...criteria, {
      criterionId: `criterion-${Date.now()}`,
      projectId,
      kind,
      description: description.trim(),
      keywords: terms,
      keywordMatch: "Any",
      approval: { status: "Approved", approvedByUid: actor.uid, approvedByEmail: actor.email, approvedAt },
    }]);
    setDescription("");
    setKeywords("");
    setNotice("Criterion explicitly approved and added to this project.");
  };

  const screenSource = (source: SourceRecord) => {
    const suggestion = runLiteratureScreeningAgent(projectId, source, criteria);
    const next: LiteratureScreeningRecord = { sourceId: source.id, suggestion, decisionAudit: records.find((item) => item.sourceId === source.id)?.decisionAudit || [] };
    onChangeRecords([next, ...records.filter((item) => item.sourceId !== source.id)]);
    setNotice(`Created a ${suggestion.outcome} proposal. No researcher decision was made.`);
  };

  const decide = (record: LiteratureScreeningRecord, decision: ResearcherScreeningDecision) => {
    try {
      const updated = recordResearcherScreeningDecision(record, decision, rationales[record.sourceId] || "", actor);
      onChangeRecords(records.map((item) => item.sourceId === record.sourceId ? updated : item));
      setRationales((current) => ({ ...current, [record.sourceId]: "" }));
      setNotice(`Researcher decision recorded as ${decision}; the original suggestion was preserved.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to record decision.");
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="screening-workbench-title">
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0"><ClipboardCheck className="w-5 h-5 text-[#053B2E]" /></div>
        <div>
          <h2 id="screening-workbench-title" className="text-sm font-semibold text-stone-900">Literature Screening Workbench</h2>
          <p className="text-xs text-stone-500">Suggestions are proposals only. Inclusion and exclusion require a separate, attributable researcher decision.</p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Approved eligibility criteria</h3>
          <p className="text-xs text-stone-500">Define literal abstract/title terms for reproducible screening. Clicking approve records your identity and timestamp.</p>
        </div>
        <div className="grid sm:grid-cols-[130px_1fr_1fr_auto] gap-2">
          <select aria-label="Criterion kind" value={kind} onChange={(event) => setKind(event.target.value as "Include" | "Exclude")} className="border border-stone-200 rounded-lg px-3 py-2 text-xs bg-white">
            <option>Include</option><option>Exclude</option>
          </select>
          <input aria-label="Criterion description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Criterion description" className="border border-stone-200 rounded-lg px-3 py-2 text-xs" />
          <input aria-label="Criterion terms" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Terms, comma separated" className="border border-stone-200 rounded-lg px-3 py-2 text-xs" />
          <button onClick={addApprovedCriterion} className="rounded-lg bg-[#053B2E] text-white px-3 py-2 text-xs font-semibold">Approve & add</button>
        </div>
        {criteria.length === 0 ? <p className="text-xs text-amber-800">Researcher input required: no approved criteria.</p> : (
          <div className="space-y-2">{criteria.map((criterion) => (
            <div key={criterion.criterionId} className="rounded-lg bg-stone-50 border border-stone-100 p-3 text-xs flex flex-col sm:flex-row sm:items-center gap-2">
              <span className={`font-semibold ${criterion.kind === "Include" ? "text-emerald-800" : "text-rose-800"}`}>{criterion.kind}</span>
              <span className="text-stone-800 flex-1">{criterion.description}</span>
              <span className="text-stone-500">Terms: {criterion.keywords.join(", ")}</span>
              <span className="text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>
            </div>
          ))}</div>
        )}
      </div>

      {notice && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{notice}</div>}

      <div className="space-y-3">
        {sources.length === 0 && <p className="text-sm text-stone-500">No retrieved or imported records are available for screening.</p>}
        {sources.map((source) => {
          const record = records.find((item) => item.sourceId === source.id);
          return (
            <article key={source.id} className="rounded-xl border border-stone-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-stone-900">{source.title}</h3><p className="text-xs text-stone-500">{source.abstract || "Abstract not available"}</p></div>
                <button disabled={!criteria.length} onClick={() => screenSource(source)} className="shrink-0 rounded-lg border border-[#053B2E] text-[#053B2E] disabled:opacity-40 px-3 py-1.5 text-xs font-semibold">Run suggestion</button>
              </div>
              {record && (
                <div className="rounded-lg bg-stone-50 p-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#053B2E]">{record.suggestion.outcome}</span>
                    <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5">{record.suggestion.status}</span>
                    <span className="text-stone-500">Confidence {Math.round(record.suggestion.confidence * 100)}%</span>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-stone-600 space-y-1">{record.suggestion.assessments.map((item) => <li key={item.criterionId}><strong>{item.criterionId}</strong>: {item.reason}</li>)}</ul>
                  <div className="border-t border-stone-200 pt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-800"><ShieldAlert className="w-4 h-4 text-amber-700" /> Researcher decision: {record.researcherDecision?.decision || "Not decided"}</div>
                    <textarea aria-label={`Decision rationale for ${source.title}`} value={rationales[source.id] || ""} onChange={(event) => setRationales((current) => ({ ...current, [source.id]: event.target.value }))} placeholder="Required rationale for the researcher decision" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs" />
                    <div className="flex flex-wrap gap-2">{(["Included", "Excluded", "Uncertain"] as ResearcherScreeningDecision[]).map((decision) => <button key={decision} onClick={() => decide(record, decision)} className="rounded-lg bg-white border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:border-[#053B2E]">Record {decision}</button>)}</div>
                    {record.decisionAudit.length > 0 && <p className="text-[11px] text-stone-500">Audit events: {record.decisionAudit.length}. Latest override: {record.decisionAudit.at(-1)?.isOverride ? "Yes" : "No"}.</p>}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
