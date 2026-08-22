import React, { useState } from "react";
import { EntityType } from "../lib/stateMachines";
import { ShieldCheck, CheckCircle2, AlertTriangle, X, FileText, Link, Lock } from "lucide-react";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  currentState: string;
  targetState: string;
  evidenceRecordIds?: string[];
  onConfirmApproval: (reason: string, evidenceRecordIds: string[]) => Promise<void> | void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  currentState,
  targetState,
  evidenceRecordIds = [],
  onConfirmApproval,
}) => {
  const [reason, setReason] = useState(
    `Verified and approved ${entityType.toLowerCase()} transition from '${currentState}' to '${targetState}'.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorNotice("Approval reason or justification is required for server auditing.");
      return;
    }
    setErrorNotice(null);
    setIsSubmitting(true);
    try {
      await onConfirmApproval(reason.trim(), evidenceRecordIds);
      onClose();
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to record approval on server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 text-stone-900 max-w-lg w-full rounded-2xl p-6 shadow-xl space-y-4 relative">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Formal Scholarly Approval Required
              </h3>
              <p className="text-xs text-stone-500">
                {entityType} ID: {entityId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-800 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* What is being approved */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Target Entity:</span>
            <span className="text-stone-900 font-semibold max-w-xs truncate">{entityTitle}</span>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-stone-200/60 pt-2">
            <span className="text-stone-500">State Transition:</span>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="bg-stone-200 text-stone-800 px-2.5 py-0.5 rounded-md font-medium">
                {currentState}
              </span>
              <span className="text-emerald-700 font-semibold">→</span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-md font-semibold">
                {targetState}
              </span>
            </div>
          </div>

          {evidenceRecordIds.length > 0 && (
            <div className="text-xs border-t border-stone-200/60 pt-2 space-y-1">
              <div className="flex items-center space-x-1.5 text-stone-700 font-semibold">
                <Link className="w-3.5 h-3.5 text-[#053B2E]" />
                <span>Linked Evidence Records ({evidenceRecordIds.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {evidenceRecordIds.map((evId) => (
                  <span key={evId} className="bg-white text-stone-700 text-[10px] px-2 py-0.5 rounded border border-stone-200">
                    {evId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formal Responsibility Notice */}
        <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            By confirming approval, you log a server-audited state transition certifying that this {entityType.toLowerCase()} has been reviewed according to TehqIQ scholarly research integrity guidelines.
          </p>
        </div>

        {errorNotice && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl">
            {errorNotice}
          </div>
        )}

        {/* Approval Reason Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Approval Justification & Reason <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide explicit justification for this state approval..."
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#053B2E] hover:bg-[#053B2E]/90 text-white text-xs font-medium transition shadow-2xs flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Recording Server Approval..." : "Confirm & Record Server Approval"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
