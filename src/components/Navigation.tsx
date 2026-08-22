import React, { useState } from "react";
import { Check, CheckCircle2, Circle, ChevronDown, ChevronUp, TrendingUp, ListTodo, Sparkles } from "lucide-react";
import { ProjectState } from "../types";
import { calculateProjectReadiness } from "../lib/readinessCalculator";

export interface WorkflowStep {
  id: number;
  key: string;
  title: string;
  shortLabel?: string;
  subtitle: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 1, key: "idea-title", title: "Idea & Title", shortLabel: "Idea & Title", subtitle: "Let's start with your idea" },
  { id: 2, key: "literature-gap", title: "Literature & Gap", shortLabel: "Literature & Gap", subtitle: "Find relevant literature" },
  { id: 3, key: "questions-hypotheses", title: "Questions & Hypotheses", shortLabel: "Questions & Hypotheses", subtitle: "Formulate research questions" },
  { id: 4, key: "introduction-review", title: "Introduction & Review", shortLabel: "Introduction & Review", subtitle: "Draft introduction & literature review" },
  { id: 5, key: "methodology", title: "Methodology", shortLabel: "Methodology", subtitle: "Add Data & Generate Insights" },
  { id: 6, key: "results", title: "Results", shortLabel: "Results", subtitle: "Empirical findings & data tables" },
  { id: 7, key: "discussion-conclusion", title: "Discussion & Conclusion", shortLabel: "Discussion & Conclusion", subtitle: "Synthesize conclusions & findings" },
  { id: 8, key: "future-work", title: "Future Work", shortLabel: "Future Work", subtitle: "Outline study limitations & future directions" },
  { id: 9, key: "references", title: "References", shortLabel: "References", subtitle: "Verified citations & reference list" },
  { id: 10, key: "preview-export", title: "Preview & Export", shortLabel: "Preview & Export", subtitle: "Review complete manuscript & export" },
];

interface NavigationProps {
  project?: ProjectState;
  activeStep: number;
  onSelectStep: (stepNumber: number) => void;
  // Fallback for activeTab backward compatibility
  activeTab?: string;
  onNavigateTab?: (tabId: string) => void;
}

interface ProjectTaskItem {
  id: number;
  label: string;
  completed: boolean;
  stepId: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  project,
  activeStep,
  onSelectStep,
}) => {
  const [showTaskBreakdown, setShowTaskBreakdown] = useState(false);

  // Compute tasks checklist status
  const tasks: ProjectTaskItem[] = React.useMemo(() => {
    if (!project) return [];

    const hasTitleOrCanvas = Boolean(
      (project.title && project.title.trim().length > 5) ||
      (project.canvas?.broadTopic && project.canvas.broadTopic.trim().length > 3) ||
      (project.canvas?.scientificProblem && project.canvas.scientificProblem.trim().length > 5)
    );

    const hasSources = Boolean(
      (project.sources || []).length > 0 &&
      (project.sources.some((s) => s.state === "Full Text Reviewed" || s.state === "Full Text Available" || s.verificationState === "Verified" || (s.title && s.title.length > 5)))
    );

    const hasQuestions = Boolean((project.researchQuestions || []).length > 0);

    const hasIntroOrReview = Boolean(
      (project.sections || []).some(
        (s) =>
          (s.title.toLowerCase().includes("introduction") || s.title.toLowerCase().includes("review") || s.order <= 2) &&
          (s.content || "").trim().length > 40
      )
    );

    const hasMethodology = Boolean(
      (project.searchStrategies || []).length > 0 ||
      Boolean(project.ethicsInfo?.approvalNumber || project.ethicsInfo?.consentObtained) ||
      (project.sections || []).some(
        (s) => s.title.toLowerCase().includes("method") && (s.content || "").trim().length > 40
      )
    );

    const hasResultsOrData = Boolean(
      (project.datasets || []).length > 0 ||
      (project.analysisPlans || []).length > 0 ||
      (project.sections || []).some(
        (s) => s.title.toLowerCase().includes("result") && (s.content || "").trim().length > 40
      )
    );

    const hasDiscussionOrConclusion = Boolean(
      (project.sections || []).some(
        (s) =>
          (s.title.toLowerCase().includes("discussion") || s.title.toLowerCase().includes("conclusion")) &&
          (s.content || "").trim().length > 40
      )
    );

    const hasFutureWork = Boolean(
      (project.sections || []).some(
        (s) =>
          (s.title.toLowerCase().includes("future") || s.title.toLowerCase().includes("limitation") || s.title.toLowerCase().includes("direction")) &&
          (s.content || "").trim().length > 20
      )
    );

    const hasEvidenceOrCitations = Boolean(
      (project.claims || []).some((c) => c.state === "Verified" || c.verificationStatus === "Verified") ||
      (project.sections || []).some((s) => (s.citationIds || []).length > 0)
    );

    const hasTargetOutletOrCompliance = Boolean(
      project.selectedTargetOutlet ||
      project.complianceReport?.overallStatus === "Pass" ||
      project.termsAccepted
    );

    return [
      { id: 1, label: "Idea & Canvas Defined", completed: hasTitleOrCanvas, stepId: 1 },
      { id: 2, label: "Literature Sources Added", completed: hasSources, stepId: 2 },
      { id: 3, label: "Research Questions Formulated", completed: hasQuestions, stepId: 3 },
      { id: 4, label: "Introduction & Review Drafted", completed: hasIntroOrReview, stepId: 4 },
      { id: 5, label: "Methods & Protocols Outlined", completed: hasMethodology, stepId: 5 },
      { id: 6, label: "Data Lab & Results Prepared", completed: hasResultsOrData, stepId: 6 },
      { id: 7, label: "Discussion & Conclusions Synthesized", completed: hasDiscussionOrConclusion, stepId: 7 },
      { id: 8, label: "Limitations & Future Work Defined", completed: hasFutureWork, stepId: 8 },
      { id: 9, label: "Citations & Evidence Verified", completed: hasEvidenceOrCitations, stepId: 9 },
      { id: 10, label: "Target Outlet & Compliance Ready", completed: hasTargetOutletOrCompliance, stepId: 10 },
    ];
  }, [project]);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length || 10;
  
  // Calculate percentage: if readiness is available and has non-zero, combine with task completion
  const taskPercentage = Math.round((completedTasksCount / totalTasks) * 100);
  const readiness = project ? calculateProjectReadiness(project) : null;
  const displayPercentage = readiness && readiness.overall > 0 
    ? Math.max(taskPercentage, readiness.overall)
    : taskPercentage;

  const getProgressLabel = (pct: number) => {
    if (pct >= 90) return "Ready for Export";
    if (pct >= 70) return "Advanced Stage";
    if (pct >= 40) return "In Active Progress";
    if (pct > 0) return "Drafting Started";
    return "Project Initialized";
  };

  return (
    <aside aria-label="Workflow Navigation" className="w-full md:w-64 lg:w-72 shrink-0">
      {/* Desktop Left Stepper Panel */}
      <div className="hidden md:block sticky top-20 bg-[#FBFBF9] border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Header */}
        <div className="px-1 pb-2 border-b border-stone-200/60 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
            Research Workflow
          </span>
          <span className="text-xs font-semibold text-[#053B2E] bg-emerald-950/5 px-2 py-0.5 rounded-full">
            Step {activeStep} of 10
          </span>
        </div>

        {/* Visual Completion Progress Indicator */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-stone-800">
              <TrendingUp className="w-3.5 h-3.5 text-[#053B2E]" />
              <span>Completion Progress</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#053B2E]">
              {displayPercentage}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden relative" role="progressbar" aria-valuenow={displayPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Project Completion Progress">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#053B2E] to-emerald-600"
              style={{ width: `${Math.max(displayPercentage, 3)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
            <span className="font-medium">{completedTasksCount} of {totalTasks} tasks finished</span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              {getProgressLabel(displayPercentage)}
            </span>
          </div>

          {/* Collapsible Task Breakdown Toggle */}
          <button
            onClick={() => setShowTaskBreakdown(!showTaskBreakdown)}
            className="w-full flex items-center justify-between pt-1 border-t border-stone-100 text-[11px] text-stone-600 hover:text-[#053B2E] font-medium transition"
          >
            <span className="flex items-center space-x-1">
              <ListTodo className="w-3 h-3 text-stone-400" />
              <span>{showTaskBreakdown ? "Hide Tasks Breakdown" : "View Tasks Breakdown"}</span>
            </span>
            {showTaskBreakdown ? (
              <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            )}
          </button>

          {/* Task Breakdown Checklist */}
          {showTaskBreakdown && (
            <div className="pt-2 border-t border-stone-100 space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px] scrollbar-thin">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelectStep(task.stepId)}
                  className="w-full flex items-start space-x-2 text-left p-1 rounded hover:bg-stone-50 transition group"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`flex-1 leading-tight ${
                      task.completed
                        ? "text-stone-800 font-medium line-through decoration-stone-300"
                        : "text-stone-600 group-hover:text-stone-900"
                    }`}
                  >
                    {task.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step Navigation List */}
        <nav className="space-y-1">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const taskMatch = tasks.find((t) => t.stepId === step.id);
            const isCompleted = taskMatch?.completed ?? (step.id < activeStep);

            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                aria-current={isActive ? "step" : undefined}
                aria-label={step.id === 1 ? "Dashboard - Idea & Title" : step.title}
                className={`w-full flex items-center space-x-3.5 px-3 py-2.5 rounded-xl transition text-left group ${
                  isActive
                    ? "bg-white border border-stone-200 shadow-xs text-stone-900 font-bold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
                }`}
              >
                {/* Number / Status Badge */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                    isActive
                      ? "bg-[#053B2E] text-white ring-2 ring-[#053B2E]/20"
                      : isCompleted
                      ? "bg-emerald-800 text-white"
                      : "bg-white border border-stone-300 text-stone-500 group-hover:border-stone-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>

                {/* Step Title */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs tracking-tight truncate ${
                      isActive
                        ? "font-bold text-stone-900"
                        : "font-medium text-stone-600 group-hover:text-stone-900"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>

                {/* Completion Mini Dot */}
                {isCompleted && !isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" title="Completed" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Horizontal Stepper Scroll Bar with Completion Progress */}
      <div className="md:hidden bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-xs mb-4 space-y-2.5">
        {/* Mobile Progress Bar & Tally Header */}
        <div className="space-y-1.5 pb-2 border-b border-stone-100">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-1.5 text-stone-800">
              <TrendingUp className="w-3.5 h-3.5 text-[#053B2E]" />
              <span>Completion Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-stone-500 font-normal">
                {completedTasksCount}/{totalTasks} tasks
              </span>
              <span className="font-mono font-bold text-[#053B2E] bg-emerald-50 px-2 py-0.5 rounded text-xs">
                {displayPercentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden" role="progressbar" aria-valuenow={displayPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Project Completion Progress">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#053B2E] to-emerald-600"
              style={{ width: `${Math.max(displayPercentage, 3)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-800">
            Step {activeStep}: {WORKFLOW_STEPS.find((s) => s.id === activeStep)?.title}
          </span>
          <span className="text-[10px] text-stone-500 font-medium">{activeStep}/10</span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const taskMatch = tasks.find((t) => t.stepId === step.id);
            const isCompleted = taskMatch?.completed ?? (step.id < activeStep);

            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  isActive
                    ? "bg-[#053B2E] text-white shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200/60"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isCompleted
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-200 text-stone-700"
                }`}>
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : step.id}
                </span>
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

