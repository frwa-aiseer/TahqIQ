import React from "react";
import { EvidenceContradictionGroup, ResearchGap } from "../../types";
import { Compass, CheckCircle2, GitCompareArrows } from "lucide-react";

interface GapMapViewProps {
  gaps: ResearchGap[];
  contradictionGroups?: EvidenceContradictionGroup[];
}

export const GapMapView: React.FC<GapMapViewProps> = ({ gaps, contradictionGroups = [] }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-[#053B2E]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-stone-900">Identified Literature & Evidence Gaps</h3>
            <p className="text-[11px] text-stone-500">
              Systematic evaluation of literature gaps and bounds of novelty.
            </p>
          </div>
        </div>
      </div>

      {/* Gap Cards List */}
      <div className="space-y-3">
        {gaps.map((gap) => (
          <div key={gap.id} className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-[#053B2E]/10 text-[#053B2E] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {gap.type} Gap
              </span>
              <span className="text-xs text-stone-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Search Confidence: {Math.round(gap.confidence * 100)}%</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-stone-900 leading-snug">
              "{gap.gapStatement}"
            </p>

            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-[11px] text-stone-600">
              <strong className="text-stone-800">Standard Scholarly Phrasing:</strong> "Searches performed up to the recorded date did not identify a closely matching study; however, absolute novelty cannot be guaranteed."
            </div>
          </div>
        ))}
      </div>

      {contradictionGroups.length > 0 && (
        <section className="space-y-3" aria-labelledby="contradiction-groups-title">
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
            <GitCompareArrows className="w-5 h-5 text-amber-800 shrink-0" />
            <div>
              <h3 id="contradiction-groups-title" className="text-xs font-semibold text-stone-900">Evidence Contradiction Groups</h3>
              <p className="text-[11px] text-stone-600">Comparisons are evidence-linked proposals awaiting researcher review. Differing findings do not establish that any study is wrong.</p>
            </div>
          </div>
          {contradictionGroups.map((group) => (
            <article key={group.groupId} className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-stone-900">{group.topic}</h4>
                <span className="text-[10px] font-semibold rounded-full bg-amber-100 text-amber-900 px-2 py-1">{group.reviewState}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3"><strong className="text-emerald-900">Supporting evidence</strong><p className="mt-1 text-stone-600">{group.supportingEvidenceIds.join(", ")}</p></div>
                <div className="rounded-lg bg-rose-50/60 border border-rose-100 p-3"><strong className="text-rose-900">Contradictory evidence</strong><p className="mt-1 text-stone-600">{group.contradictoryEvidenceIds.join(", ")}</p></div>
              </div>
              {[...group.contextualReasons.map((item) => ({ ...item, label: "Context" })), ...group.methodologicalReasons.map((item) => ({ ...item, label: "Method" }))].map((item, index) => (
                <div key={`${item.label}-${index}`} className="text-xs text-stone-700"><strong>{item.label}:</strong> {item.text} <span className="text-stone-500">[{item.evidenceIds.join(", ")}]</span></div>
              ))}
              <div className="text-xs bg-stone-50 rounded-lg p-3"><strong>Uncertainty:</strong> {group.uncertainty.text} <span className="text-stone-500">[{group.uncertainty.evidenceIds.join(", ")}]</span></div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};
