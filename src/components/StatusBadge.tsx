import React from "react";
import { CheckCircle2, Clock, ShieldCheck, Sparkles, FileEdit, AlertCircle } from "lucide-react";

export type EntityStatus = "Draft" | "Suggested" | "Verified" | "Approved" | string;

interface StatusBadgeProps {
  status: EntityStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "sm",
  showIcon = true,
}) => {
  const normStatus = (status || "Draft").trim();

  let colorClasses = "bg-stone-100 text-stone-700 border-stone-200";
  let label = normStatus;
  let IconComponent = Clock;

  if (
    normStatus === "Draft" ||
    normStatus === "Drafting" ||
    normStatus === "Unverified" ||
    normStatus === "Not Started" ||
    normStatus === "Uploaded"
  ) {
    colorClasses = "bg-amber-50 text-amber-800 border-amber-200/80";
    label = "Draft";
    IconComponent = FileEdit;
  } else if (
    normStatus === "Suggested" ||
    normStatus === "AI Suggested" ||
    normStatus === "Parsing" ||
    normStatus === "Profiled" ||
    normStatus === "In Review" ||
    normStatus === "Requires Review"
  ) {
    colorClasses = "bg-sky-50 text-sky-800 border-sky-200/80";
    label = "Suggested";
    IconComponent = Sparkles;
  } else if (
    normStatus === "Verified" ||
    normStatus === "Full Text Reviewed" ||
    normStatus === "Full Text Available" ||
    normStatus === "Peer Reviewed" ||
    normStatus === "Evidence Linked"
  ) {
    colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    label = "Verified";
    IconComponent = CheckCircle2;
  } else if (
    normStatus === "Approved" ||
    normStatus === "Approved for Analysis" ||
    normStatus === "Finalized" ||
    normStatus === "Passed" ||
    normStatus === "Completed"
  ) {
    colorClasses = "bg-[#053B2E] text-white font-medium border-[#053B2E] shadow-2xs";
    label = "Approved";
    IconComponent = ShieldCheck;
  }

  const paddingClasses = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full border font-medium uppercase tracking-wider ${colorClasses} ${paddingClasses}`}
      title={`Status: ${label}`}
      aria-label={`Status: ${label}`}
    >
      {showIcon && <IconComponent className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{label}</span>
    </span>
  );
};

export const StatusLegend: React.FC = () => {
  return (
    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs text-stone-600 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider">
          Evidence & Record Status Hierarchy
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="flex items-center space-x-1.5">
          <StatusBadge status="Draft" size="sm" />
          <span className="text-stone-500">Initial user entry</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <StatusBadge status="Suggested" size="sm" />
          <span className="text-stone-500">AI / System proposed</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <StatusBadge status="Verified" size="sm" />
          <span className="text-stone-500">DOI / Empirical link</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <StatusBadge status="Approved" size="sm" />
          <span className="text-stone-500">Author sign-off</span>
        </div>
      </div>
    </div>
  );
};
