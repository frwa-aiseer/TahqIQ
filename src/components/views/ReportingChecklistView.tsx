import React from "react";
import { ReportingGuideline } from "../../types";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";

interface ReportingChecklistViewProps {
  guideline: ReportingGuideline;
}

export const ReportingChecklistView: React.FC<ReportingChecklistViewProps> = ({ guideline }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Reporting Guidelines • {guideline.name} Checklist</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-[#102A43]">
            {guideline.name} ({guideline.version}) Compliance Matrix
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Ensure every mandatory item for {guideline.applicableStudyType} is addressed before manuscript export.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#102A43] text-white font-serif uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Item #</th>
              <th className="p-3">Section / Topic</th>
              <th className="p-3">Checklist Description</th>
              <th className="p-3">Manuscript Location</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {guideline.checklistItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-mono font-bold text-[#0B5D4B]">{item.itemNumber}</td>
                <td className="p-3 font-semibold text-slate-800">{item.sectionOrTopic}</td>
                <td className="p-3 text-slate-700">{item.description}</td>
                <td className="p-3 font-mono text-slate-600">{item.manuscriptLocation || "Section 2"}</td>
                <td className="p-3 text-right">
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded inline-flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{item.status}</span>
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
