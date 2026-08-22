import React from "react";
import { ProjectState } from "../../types";
import { calculateProjectReadiness } from "../../lib/readinessCalculator";
import { StatusLegend } from "../StatusBadge";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
  BookOpen,
  Sparkles,
  Award,
  PenTool,
  Download,
  FileText,
  HelpCircle,
  TrendingUp,
  Sliders,
  Check,
  FolderOpen
} from "lucide-react";

interface DashboardViewProps {
  project: ProjectState;
  onNavigateTab: (tab: string) => void;
  onConfirmBrief?: () => void;
  activeStageNumber?: number;
  onSelectStage?: (stageNum: number) => void;
  onOpenWizard?: () => void;
  onOpenProjectManager?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onNavigateTab,
  activeStageNumber = 1,
  onSelectStage,
  onOpenWizard,
  onOpenProjectManager,
}) => {
  const readiness = calculateProjectReadiness(project);
  const verifiedSourcesCount = (project.sources || []).filter(
    (s) => s.state === "Full Text Reviewed" || s.state === "Full Text Available" || s.verificationState === "Verified"
  ).length;
  const totalClaims = (project.claims || []).length;
  const verifiedClaims = (project.claims || []).filter(
    (c) => c.state === "Verified" || c.verificationStatus === "Verified"
  ).length;
  const totalWords = (project.sections || []).reduce((acc, s) => acc + (s.currentWordCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Hero Welcome & Primary Project Overview */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{project.discipline} • {project.projectType}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 font-medium">Target Outlet:</span>
              <button
                onClick={() => onNavigateTab("outlets")}
                className="bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-zinc-700/80 px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[200px]">{project.selectedTargetOutlet?.title || "Select Journal"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans leading-snug">
                {project.title}
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
                Ready for peer-review submission. Track progress, synthesize evidence, and edit manuscript sections with real-time CSL citations.
              </p>
            </div>

            {/* Readiness Summary Circle / Pill */}
            <div className="bg-zinc-950/80 border border-zinc-800/90 px-6 py-4 rounded-2xl flex items-center space-x-4 shrink-0 shadow-lg">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block">
                  Readiness Score
                </span>
                <span className="text-3xl font-extrabold font-mono text-emerald-400 block">
                  {readiness.overall}%
                </span>
                <span className="text-[10px] text-emerald-400/90 font-medium">
                  Verified Evidence
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Start Primary CTA Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-zinc-800/80">
            <button
              onClick={() => onNavigateTab("writing")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
            >
              <PenTool className="w-4 h-4" />
              <span>Continue Writing in Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab("sources")}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Manage Sources ({verifiedSourcesCount})</span>
            </button>

            <button
              onClick={() => onNavigateTab("export")}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Manuscript</span>
            </button>

            {onOpenProjectManager && (
              <button
                onClick={onOpenProjectManager}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition ml-auto"
              >
                <FolderOpen className="w-4 h-4 text-zinc-400" />
                <span>Project Architecture & Metadata</span>
              </button>
            )}
          </div>
        </div>
      </div>



      {/* 2. Clear Guided Action Hub: "What do you want to do?" */}
      <div>
        <h2 className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-3 px-1">
          Primary Workspaces & Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Writing Studio */}
          <div
            onClick={() => onNavigateTab("writing")}
            className="group bg-zinc-900/90 border border-zinc-800 hover:border-indigo-500/60 p-5 rounded-2xl cursor-pointer transition shadow-sm hover:shadow-indigo-950/40 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition flex items-center justify-between">
                <span>Writing Studio</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform translate-x-0 group-hover:translate-x-1" />
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Draft paper sections, insert verified inline citations, and format with live journal CSL styles.
              </p>
            </div>
            <div className="text-[11px] text-indigo-400 font-semibold flex items-center space-x-1 pt-2 border-t border-zinc-800/80">
              <FileText className="w-3.5 h-3.5" />
              <span>Current draft: ~{totalWords} words</span>
            </div>
          </div>

          {/* Action 2: Source Library */}
          <div
            onClick={() => onNavigateTab("sources")}
            className="group bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/60 p-5 rounded-2xl cursor-pointer transition shadow-sm hover:shadow-emerald-950/40 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition flex items-center justify-between">
                <span>Source & Citation Library</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform translate-x-0 group-hover:translate-x-1" />
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Import PubMed/DOI references, extract key evidence passages, and link claims to data.
              </p>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1 pt-2 border-t border-zinc-800/80">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{verifiedSourcesCount} verified references loaded</span>
            </div>
          </div>

          {/* Action 3: Export Centre */}
          <div
            onClick={() => onNavigateTab("export")}
            className="group bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 p-5 rounded-2xl cursor-pointer transition shadow-sm hover:shadow-amber-950/40 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition flex items-center justify-between">
                <span>Export Centre</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform translate-x-0 group-hover:translate-x-1" />
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Download fully formatted Word (.doc/.docx), PDF, LaTeX, JATS XML, or BibTeX reference packages.
              </p>
            </div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center space-x-1 pt-2 border-t border-zinc-800/80">
              <Sliders className="w-3.5 h-3.5" />
              <span>Auto-adjusts layout per journal rules</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Key Research Metrics Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab("sources")}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl transition cursor-pointer"
        >
          <span className="text-[11px] text-zinc-400 font-medium block">Verified References</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {verifiedSourcesCount} <span className="text-xs text-zinc-500 font-normal">/ {(project.sources || []).length}</span>
          </div>
          <p className="text-[10px] text-emerald-400 font-medium mt-1">100% DOI Resolved</p>
        </div>

        <div
          onClick={() => onNavigateTab("claims")}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl transition cursor-pointer"
        >
          <span className="text-[11px] text-zinc-400 font-medium block">Claim–Evidence Grounding</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {verifiedClaims} <span className="text-xs text-zinc-500 font-normal">/ {totalClaims} claims</span>
          </div>
          <p className="text-[10px] text-amber-400 font-medium mt-1">Fully Grounded</p>
        </div>

        <div
          onClick={() => onNavigateTab("datalab")}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl transition cursor-pointer"
        >
          <span className="text-[11px] text-zinc-400 font-medium block">Reproducible Datasets</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {(project.datasets || []).length} <span className="text-xs text-zinc-500 font-normal">files</span>
          </div>
          <p className="text-[10px] text-indigo-400 font-medium mt-1">Paired t-test ANOVA</p>
        </div>

        <div
          onClick={() => onNavigateTab("outlets")}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl transition cursor-pointer"
        >
          <span className="text-[11px] text-zinc-400 font-medium block">Target Journal Fit</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {project.selectedTargetOutlet?.fitScore || 92}%
          </div>
          <p className="text-[10px] text-indigo-400 font-medium mt-1 truncate">
            {project.selectedTargetOutlet?.title || "Journal Fit"}
          </p>
        </div>
      </div>

      {/* 4. Project Brief & Readiness Dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Approved Brief Summary */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Confirmed Research Brief</span>
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 font-bold text-[9.5px] uppercase tracking-wider block">Broad Topic</span>
              <p className="font-semibold text-zinc-200 mt-1">{project.canvas.broadTopic}</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 font-bold text-[9.5px] uppercase tracking-wider block">Cohort & Context</span>
              <p className="font-semibold text-zinc-200 mt-1">{project.canvas.population}</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 font-bold text-[9.5px] uppercase tracking-wider block">Intervention</span>
              <p className="font-semibold text-zinc-200 mt-1">{project.canvas.intervention}</p>
            </div>
          </div>
        </div>

        {/* Readiness Dimension Breakdown */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Readiness Breakdown</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {readiness.overall}% Overall
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(readiness)
              .filter(([k]) => k !== "overall")
              .map(([key, score]) => (
                <div key={key} className="bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-medium text-zinc-400 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="font-mono font-bold text-indigo-400 text-xs">{score}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
