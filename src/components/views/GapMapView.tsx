import React from "react";
import { ResearchGap } from "../../types";
import { Compass, CheckCircle2, ShieldCheck } from "lucide-react";

interface GapMapViewProps {
  gaps: ResearchGap[];
}

export const GapMapView: React.FC<GapMapViewProps> = ({ gaps }) => {
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
    </div>
  );
};

