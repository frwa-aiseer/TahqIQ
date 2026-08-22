import React from "react";
import { ProjectState } from "../../types";
import { FileCode, ShieldCheck } from "lucide-react";

interface ProtocolBuilderViewProps {
  project: ProjectState;
}

export const ProtocolBuilderView: React.FC<ProtocolBuilderViewProps> = ({ project }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <FileCode className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Methodology & Study Design Protocol</h2>
            <p className="text-xs text-stone-500">
              Operational definitions, sampling protocols, variables, and methodological bounds.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200/80 space-y-1">
            <span className="font-semibold text-stone-700 text-xs block">Study Architecture</span>
            <p className="text-stone-900 font-medium text-xs">{project.projectType}</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200/80 space-y-1">
            <span className="font-semibold text-stone-700 text-xs block">Inter-Session Washout</span>
            <p className="text-stone-900 font-medium text-xs">48-Hour Inter-Session Washout Period</p>
          </div>
        </div>

        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200/80 space-y-1">
          <span className="font-semibold text-stone-700 text-xs block">Statistical Power & Sample Rationale</span>
          <p className="text-stone-800 text-xs leading-relaxed">
            Statistical power &gt; 0.80 for paired difference d = 0.80 at α = 0.05 requires minimum 15 participants. Synthetic sample set to n = 18.
          </p>
        </div>
      </div>
    </div>
  );
};

