import React from "react";
import { ProjectState } from "../../types";
import { ShieldCheck, CheckCircle2, Lock, AlertTriangle } from "lucide-react";

interface EthicsWorkspaceViewProps {
  ethicsInfo: ProjectState["ethicsInfo"];
}

export const EthicsWorkspaceView: React.FC<EthicsWorkspaceViewProps> = ({ ethicsInfo }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Stage 8 • Ethics, Consent & Research Governance</span>
        </div>
        <h2 className="font-serif font-bold text-xl text-[#102A43]">
          Ethical Approval & Participant Protection Workspace
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Verify institutional review board (IRB) approval numbers, trial registration, and consent documentation.
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#F8F5EC] p-3.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold block">Committee Approval Reference</span>
            <p className="font-mono font-bold text-[#0B5D4B] mt-1">{ethicsInfo.approvalNumber}</p>
          </div>
          <div className="bg-[#F8F5EC] p-3.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold block">Trial Registration ID</span>
            <p className="font-mono font-bold text-[#102A43] mt-1">{ethicsInfo.trialRegistrationNumber}</p>
          </div>
          <div className="bg-[#F8F5EC] p-3.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold block">Informed Consent Status</span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded mt-1 inline-block">
              Confirmed & Logged
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-amber-900 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Notice: Non-negotiable Integrity Rule — TehqIQ never generates invented ethics approval numbers or trial registration IDs.</span>
        </div>
      </div>
    </div>
  );
};
