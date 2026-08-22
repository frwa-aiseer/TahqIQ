import React, { useState } from "react";
import { Sparkles, Check, Edit3, X, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";
import { AIValidationResult } from "../lib/aiValidationService";

interface AiProposalModalProps {
  isOpen: boolean;
  title: string;
  featureUsed: string;
  manuscriptSection?: string;
  proposedContent: string;
  model?: string;
  promptVersion?: string;
  groundingStatus: AIValidationResult;
  onAccept: () => void;
  onEditAndAccept: (editedText: string) => void;
  onReject: () => void;
  onClose: () => void;
}

export const AiProposalModal: React.FC<AiProposalModalProps> = ({
  isOpen,
  title,
  featureUsed,
  manuscriptSection,
  proposedContent,
  model = "gemini-3.6-flash",
  promptVersion = "v2.4-phase6",
  groundingStatus,
  onAccept,
  onEditAndAccept,
  onReject,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(proposedContent);

  if (!isOpen) return null;

  const handleSaveEdit = () => {
    onEditAndAccept(editedText);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-50 p-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center text-[#053B2E]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm text-stone-900">{title}</h3>
                <span className="bg-sky-50 border border-sky-200 text-sky-800 font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI Suggested
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Feature: <strong className="text-stone-800">{featureUsed}</strong> | Model: <strong className="text-[#053B2E] font-medium">{model}</strong> | Prompt: <strong className="text-stone-700">{promptVersion}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grounding Audit Banner */}
        <div className="px-5 pt-4">
          {groundingStatus.valid ? (
            <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Evidence Grounding Verified:</strong> {groundingStatus.groundedCitations.length} Citations &amp; {groundingStatus.groundedNumbers.length} Empirical Stats matched against project.
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Audit Passed
              </span>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>
                  <strong>Grounding Audit Alert:</strong> {groundingStatus.error}
                </span>
              </div>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                Rejected / Blocked
              </span>
            </div>
          )}
        </div>

        {/* Content Preview / Editor */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">
              {isEditing ? "Edit AI Proposal Text Prior to Acceptance" : "Review AI Generated Proposal"}
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#053B2E] hover:underline text-xs font-medium flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Cancel Edit" : "Edit Proposal"}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[220px] bg-stone-50 border border-[#053B2E] rounded-xl p-4 text-xs font-serif leading-relaxed text-stone-900 focus:bg-white focus:outline-none"
            />
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs font-serif leading-relaxed text-stone-800 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {proposedContent}
            </div>
          )}

          {/* Placeholders note */}
          {groundingStatus.missingPlaceholders && groundingStatus.missingPlaceholders.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-[11px] text-amber-900 flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                <strong>Explicit Placeholders Present:</strong> Information missing from source records was rendered as visible placeholders: {groundingStatus.missingPlaceholders.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-stone-50 p-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500">
            Accepting commits content with status <strong className="text-stone-800">AI Suggested</strong> and logs metadata to AI Ledger.
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onReject}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 px-3.5 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Proposal</span>
            </button>

            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Accept Proposal</span>
              </button>
            ) : (
              <button
                onClick={onAccept}
                disabled={!groundingStatus.valid}
                className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition ${
                  groundingStatus.valid
                    ? "bg-[#053B2E] hover:bg-[#053B2E]/90 text-white shadow-2xs"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Proposal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
