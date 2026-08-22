import React from "react";
import { ProjectState } from "../../types";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceCentreViewProps {
  project: ProjectState;
}

export const ComplianceCentreView: React.FC<ComplianceCentreViewProps> = ({ project }) => {
  const report = project.complianceReport;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Compliance Engine • Target Outlet Rules</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-[#102A43]">
            Submission-Readiness Compliance Verification
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Validate word counts, abstract formatting, figure limits, ethics declarations, and AI usage disclosures against {project.selectedTargetOutlet?.title || "Target Journal"}.
          </p>
        </div>

        <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono block">Overall Status</span>
          <span className="font-serif font-bold text-lg text-emerald-900">{report?.overallStatus || "Pass"}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#102A43] text-white font-serif uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Category</th>
              <th className="p-3">Target Outlet Requirement</th>
              <th className="p-3">Actual Manuscript Value</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {report?.checks.map((chk, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition">
                <td className="p-3 font-semibold text-slate-800">{chk.category}</td>
                <td className="p-3 text-slate-700">{chk.requirement}</td>
                <td className="p-3 font-mono font-bold text-[#0B5D4B]">{chk.actual}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    chk.status === "Pass" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {chk.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
