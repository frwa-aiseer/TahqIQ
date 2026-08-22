import React from "react";
import { ReviewerComment } from "../../types";
import { MessageSquare, CheckCircle2, Download } from "lucide-react";

interface RevisionWorkspaceViewProps {
  comments: ReviewerComment[];
}

export const RevisionWorkspaceView: React.FC<RevisionWorkspaceViewProps> = ({ comments }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Stage 18 • Revision & Response-to-Reviewers Generator</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-[#102A43]">
            Structured Response-to-Reviewers Table
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Record point-by-point author responses and exact manuscript edits for formal resubmission packages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-[#102A43] text-white font-serif uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Reviewer Role</th>
              <th className="p-3">Reviewer Comment</th>
              <th className="p-3">Author Response</th>
              <th className="p-3 text-right">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {comments.map((cm) => (
              <tr key={cm.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-semibold text-[#0B5D4B]">{cm.agentRole}</td>
                <td className="p-3 text-slate-800 font-medium max-w-xs">{cm.commentText}</td>
                <td className="p-3 text-slate-700 font-mono bg-[#F8F5EC] p-2 rounded">{cm.authorResponse || "Response recorded."}</td>
                <td className="p-3 text-right">
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                    {cm.actionTaken || "Accept"}
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
