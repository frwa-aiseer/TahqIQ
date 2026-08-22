import React, { useState } from "react";
import {
  Zap,
  PlusCircle,
  BarChart2,
  FileDown,
  BookOpen,
  HelpCircle,
  FileText,
  ShieldCheck,
  ChevronUp,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  Info,
} from "lucide-react";
import { ProjectState } from "../types";

interface QuickActionsMenuProps {
  activeStep: number;
  project: ProjectState;
  onSelectStep: (stepNum: number) => void;
  onAddCitationQuick?: () => void;
  onGenerateFigureQuick?: () => void;
  onExportPdfQuick?: () => void;
}

interface ActionTooltipInfo {
  when: string;
  how: string;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  activeStep,
  project,
  onSelectStep,
  onAddCitationQuick,
  onGenerateFigureQuick,
  onExportPdfQuick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [hoveredTooltipKey, setHoveredTooltipKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => {
      setActionToast(null);
    }, 3000);
  };

  const handleAddCitation = () => {
    setIsOpen(false);
    if (onAddCitationQuick) {
      onAddCitationQuick();
    } else {
      onSelectStep(2);
      showToast("Navigated to Literature Library — Ready to add citation record.");
    }
  };

  const handleGenerateFigure = () => {
    setIsOpen(false);
    if (onGenerateFigureQuick) {
      onGenerateFigureQuick();
    } else {
      onSelectStep(6);
      showToast("Navigated to Data Lab — Statistical figure generator active.");
    }
  };

  const handleExportPdf = () => {
    setIsOpen(false);
    if (onExportPdfQuick) {
      onExportPdfQuick();
    } else {
      onSelectStep(10);
      showToast("Navigated to Export Centre — Manuscript PDF ready for review.");
    }
  };

  // Detailed instruction tooltips
  const actionTooltips: Record<string, ActionTooltipInfo> = {
    citation: {
      when: "When gathering reference studies or grounding manuscript claims in prior work.",
      how: "Click to jump to Literature Library (Step 2) to search DOIs, parse BibTeX, or upload research PDFs.",
    },
    figure: {
      when: "When preparing data visualizers, forest plots, or summary charts for the Results section.",
      how: "Click to open Data Lab (Step 6) to select chart types, configure variables, and generate SVG/PNG figures.",
    },
    export: {
      when: "When completing your paper or sharing drafts for peer and ethics compliance review.",
      how: "Click to open Export Centre (Step 10) to compile formatted manuscripts with full evidence audit trails.",
    },
  };

  // Get current step's recommended primary action
  const getContextualAction = () => {
    switch (activeStep) {
      case 1:
        return {
          key: "canvas",
          label: "Refine Canvas Idea",
          icon: Sparkles,
          tooltip: {
            when: "When initializing project boundaries and problem rationale.",
            how: "Click to refine core population, interventions, and theoretical rationale on the Research Canvas.",
          },
          handler: () => {
            setIsOpen(false);
            showToast("Canvas active — Edit core problem statement & rationale above.");
          },
        };
      case 2:
        return {
          key: "citation",
          label: "Add Citation to Library",
          icon: BookOpen,
          tooltip: actionTooltips.citation,
          handler: handleAddCitation,
        };
      case 3:
        return {
          key: "question",
          label: "Add Research Question",
          icon: HelpCircle,
          tooltip: {
            when: "When formulating testable scientific hypotheses.",
            how: "Click to register structured PICO/FINER questions and specify primary study endpoints.",
          },
          handler: () => {
            setIsOpen(false);
            onSelectStep(3);
            showToast("Question Builder active — Register new PICO question below.");
          },
        };
      case 4:
      case 7:
      case 8:
        return {
          key: "writing",
          label: "Draft Section with Citations",
          icon: FileText,
          tooltip: {
            when: "When drafting Introduction, Methods, Discussion, or Revisions.",
            how: "Click to open Writing Studio with live AI assistance and citation autocompletion.",
          },
          handler: () => {
            setIsOpen(false);
            onSelectStep(activeStep);
            showToast("Writing Studio active — Insert inline citation or draft section.");
          },
        };
      case 5:
      case 6:
        return {
          key: "figure",
          label: "Generate Analysis Figure",
          icon: BarChart2,
          tooltip: actionTooltips.figure,
          handler: handleGenerateFigure,
        };
      case 9:
        return {
          key: "claim",
          label: "Link Evidence to Claim",
          icon: ShieldCheck,
          tooltip: {
            when: "When auditing paper validity prior to publication.",
            how: "Click to map text assertions directly to verified source citations in the Claim Matrix.",
          },
          handler: () => {
            setIsOpen(false);
            onSelectStep(9);
            showToast("Claim Matrix active — Link citation quote to claim.");
          },
        };
      case 10:
        return {
          key: "export",
          label: "Export Manuscript PDF",
          icon: FileDown,
          tooltip: actionTooltips.export,
          handler: handleExportPdf,
        };
      default:
        return {
          key: "citation",
          label: "Add Citation",
          icon: PlusCircle,
          tooltip: actionTooltips.citation,
          handler: handleAddCitation,
        };
    }
  };

  const contextAction = getContextualAction();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2 font-sans select-none">
      {/* Action Notification Toast */}
      {actionToast && (
        <div className="bg-[#053B2E] text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Expanded Actions Card */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-3.5 w-72 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 relative">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 px-1">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-[#053B2E]" />
              <span className="text-xs font-semibold text-stone-900">Quick Actions</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              Step {activeStep} Shortcuts
            </span>
          </div>

          {/* Primary Required Quick Actions */}
          <div className="space-y-1">
            {/* 1. Add Citation */}
            <div
              className="relative group"
              onMouseEnter={() => setHoveredTooltipKey("citation")}
              onMouseLeave={() => setHoveredTooltipKey(null)}
            >
              <button
                onClick={handleAddCitation}
                title={`When: ${actionTooltips.citation.when}\nHow: ${actionTooltips.citation.how}`}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                  activeStep === 2
                    ? "bg-[#053B2E]/10 text-[#053B2E] font-semibold border border-[#053B2E]/20"
                    : "hover:bg-stone-50 text-stone-700 font-medium"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4 text-[#053B2E]" />
                  <span>Add Citation</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-stone-400">Step 2</span>
                  <Info className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition" />
                </div>
              </button>

              {/* Floating Tooltip Box */}
              {hoveredTooltipKey === "citation" && (
                <div className="absolute right-full top-0 mr-3 w-64 bg-stone-900 text-stone-100 p-2.5 rounded-xl shadow-xl text-[11px] leading-relaxed z-50 pointer-events-none animate-in fade-in slide-in-from-right-1 duration-150">
                  <div className="font-semibold text-emerald-300 mb-0.5">When to use:</div>
                  <div className="text-stone-300 mb-1.5">{actionTooltips.citation.when}</div>
                  <div className="font-semibold text-emerald-300 mb-0.5">How to use:</div>
                  <div className="text-stone-300">{actionTooltips.citation.how}</div>
                  <div className="absolute right-[-5px] top-3.5 w-2 h-2 bg-stone-900 rotate-45" />
                </div>
              )}
            </div>

            {/* 2. Generate Figure */}
            <div
              className="relative group"
              onMouseEnter={() => setHoveredTooltipKey("figure")}
              onMouseLeave={() => setHoveredTooltipKey(null)}
            >
              <button
                onClick={handleGenerateFigure}
                title={`When: ${actionTooltips.figure.when}\nHow: ${actionTooltips.figure.how}`}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                  activeStep === 6
                    ? "bg-[#053B2E]/10 text-[#053B2E] font-semibold border border-[#053B2E]/20"
                    : "hover:bg-stone-50 text-stone-700 font-medium"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-[#053B2E]" />
                  <span>Generate Figure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-stone-400">Step 6</span>
                  <Info className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition" />
                </div>
              </button>

              {/* Floating Tooltip Box */}
              {hoveredTooltipKey === "figure" && (
                <div className="absolute right-full top-0 mr-3 w-64 bg-stone-900 text-stone-100 p-2.5 rounded-xl shadow-xl text-[11px] leading-relaxed z-50 pointer-events-none animate-in fade-in slide-in-from-right-1 duration-150">
                  <div className="font-semibold text-emerald-300 mb-0.5">When to use:</div>
                  <div className="text-stone-300 mb-1.5">{actionTooltips.figure.when}</div>
                  <div className="font-semibold text-emerald-300 mb-0.5">How to use:</div>
                  <div className="text-stone-300">{actionTooltips.figure.how}</div>
                  <div className="absolute right-[-5px] top-3.5 w-2 h-2 bg-stone-900 rotate-45" />
                </div>
              )}
            </div>

            {/* 3. Export PDF */}
            <div
              className="relative group"
              onMouseEnter={() => setHoveredTooltipKey("export")}
              onMouseLeave={() => setHoveredTooltipKey(null)}
            >
              <button
                onClick={handleExportPdf}
                title={`When: ${actionTooltips.export.when}\nHow: ${actionTooltips.export.how}`}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                  activeStep === 10
                    ? "bg-[#053B2E]/10 text-[#053B2E] font-semibold border border-[#053B2E]/20"
                    : "hover:bg-stone-50 text-stone-700 font-medium"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileDown className="w-4 h-4 text-[#053B2E]" />
                  <span>Export PDF</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-stone-400">Step 10</span>
                  <Info className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition" />
                </div>
              </button>

              {/* Floating Tooltip Box */}
              {hoveredTooltipKey === "export" && (
                <div className="absolute right-full top-0 mr-3 w-64 bg-stone-900 text-stone-100 p-2.5 rounded-xl shadow-xl text-[11px] leading-relaxed z-50 pointer-events-none animate-in fade-in slide-in-from-right-1 duration-150">
                  <div className="font-semibold text-emerald-300 mb-0.5">When to use:</div>
                  <div className="text-stone-300 mb-1.5">{actionTooltips.export.when}</div>
                  <div className="font-semibold text-emerald-300 mb-0.5">How to use:</div>
                  <div className="text-stone-300">{actionTooltips.export.how}</div>
                  <div className="absolute right-[-5px] top-3.5 w-2 h-2 bg-stone-900 rotate-45" />
                </div>
              )}
            </div>
          </div>

          {/* Contextual Action for Active Step if different */}
          {activeStep !== 2 && activeStep !== 6 && activeStep !== 10 && (
            <div className="pt-2 border-t border-stone-100">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-medium mb-1 px-1 flex items-center justify-between">
                <span>Active Step Action</span>
                <span>Step {activeStep}</span>
              </div>
              <div
                className="relative group"
                onMouseEnter={() => setHoveredTooltipKey(contextAction.key)}
                onMouseLeave={() => setHoveredTooltipKey(null)}
              >
                <button
                  onClick={contextAction.handler}
                  title={`When: ${contextAction.tooltip.when}\nHow: ${contextAction.tooltip.how}`}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-xs bg-stone-50 hover:bg-stone-100 text-stone-800 font-medium border border-stone-200/80 transition"
                >
                  <div className="flex items-center space-x-2">
                    <contextAction.icon className="w-4 h-4 text-[#053B2E]" />
                    <span>{contextAction.label}</span>
                  </div>
                  <Info className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition" />
                </button>

                {/* Floating Tooltip Box */}
                {hoveredTooltipKey === contextAction.key && (
                  <div className="absolute right-full top-0 mr-3 w-64 bg-stone-900 text-stone-100 p-2.5 rounded-xl shadow-xl text-[11px] leading-relaxed z-50 pointer-events-none animate-in fade-in slide-in-from-right-1 duration-150">
                    <div className="font-semibold text-emerald-300 mb-0.5">When to use:</div>
                    <div className="text-stone-300 mb-1.5">{contextAction.tooltip.when}</div>
                    <div className="font-semibold text-emerald-300 mb-0.5">How to use:</div>
                    <div className="text-stone-300">{contextAction.tooltip.how}</div>
                    <div className="absolute right-[-5px] top-3.5 w-2 h-2 bg-stone-900 rotate-45" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="flex items-center space-x-2">
        {/* Quick Badge / Label on Desktop */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            title="Open Quick Actions menu with research workflow shortcuts and usage guides"
            className="hidden sm:flex items-center space-x-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-semibold px-3 py-2 rounded-xl shadow-md hover:border-stone-300 transition"
          >
            <Zap className="w-3.5 h-3.5 text-[#053B2E]" />
            <span>Quick Actions</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Quick Actions Menu"
          title={isOpen ? "Close Quick Actions Menu" : "Open Quick Actions Menu"}
          className={`w-11 h-11 rounded-xl shadow-lg border flex items-center justify-center transition-all duration-200 ${
            isOpen
              ? "bg-stone-900 text-white border-stone-800"
              : "bg-[#053B2E] hover:bg-[#053B2E]/90 text-white border-[#053B2E] hover:scale-105"
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <div className="relative">
              <Zap className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#053B2E]" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

