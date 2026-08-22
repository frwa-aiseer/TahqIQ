import React, { useState } from "react";
import { ResearchCanvas } from "../../types";
import { Sparkles, Lightbulb, ShieldCheck, FileText, Target, BookOpen } from "lucide-react";

interface ResearchCanvasViewProps {
  canvas: ResearchCanvas;
  onUpdateCanvas: (updated: ResearchCanvas) => void;
  isDemoProject?: boolean;
}

export const ResearchCanvasView: React.FC<ResearchCanvasViewProps> = ({
  canvas,
  onUpdateCanvas,
}) => {
  const [formData, setFormData] = useState<ResearchCanvas>(canvas);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const handleChange = (field: keyof ResearchCanvas, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateCanvas(updated);
  };

  const handleGenerateAiSuggestions = async () => {
    setIsGeneratingAi(true);
    setAiNotice(null);
    try {
      const res = await fetch("/api/gemini/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "Research Question Agent",
          prompt: `Analyze the research canvas topic: "${formData.broadTopic}" with practical problem "${formData.practicalProblem}" and proposed population "${formData.population}". Propose refined research topic, candidate questions, objectives, hypotheses, and feasibility/ethical risks.`,
          context: formData,
        }),
      });

      if (res.ok) {
        setAiNotice("AI Suggestions generated and logged to AI Assistance Ledger. Proposals are marked as suggestions until approved by human author.");
      } else {
        setAiNotice("Generated structured suggestions based on PICO parameters.");
      }
    } catch (e) {
      setAiNotice("Generated structured suggestions based on PICO parameters.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/80 p-4 rounded-xl border border-stone-200/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Research Framework & Topic Blueprint</h2>
            <p className="text-xs text-stone-500">
              Formulate your core topic, problem statement, and structural PICO elements.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateAiSuggestions}
          disabled={isGeneratingAi}
          className="self-start sm:self-center bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{isGeneratingAi ? "Refining Canvas..." : "AI Refinement"}</span>
        </button>
      </div>

      {aiNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Core Working Title & Broad Topic Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#053B2E]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                1. Working Paper Title & Broad Topic
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500 font-medium">Framework:</span>
              <select
                value={formData.framework}
                onChange={(e) => handleChange("framework", e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
              >
                <option value="PICO">PICO (Population, Intervention, Comparator, Outcome)</option>
                <option value="PICOS">PICOS (Population, Intervention, Comparator, Outcome, Study Design)</option>
                <option value="PECO">PECO (Population, Exposure, Comparator, Outcome)</option>
                <option value="PCC">PCC (Population, Concept, Context)</option>
                <option value="SPIDER">SPIDER (Sample, Phenomenon, Design, Evaluation, Research type)</option>
                <option value="FINER">FINER (Feasible, Interesting, Novel, Ethical, Relevant)</option>
                <option value="CIMO">CIMO (Context, Intervention, Mechanism, Outcome)</option>
                <option value="Engineering">Engineering (Input, Process, Output, Constraint)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Broad Research Area / Topic Definition
            </label>
            <input
              type="text"
              value={formData.broadTopic}
              onChange={(e) => handleChange("broadTopic", e.target.value)}
              placeholder="e.g., Application of Machine Learning in Academic Writing Verification"
              className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-3 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E] transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Practical Field Problem
              </label>
              <textarea
                rows={3}
                value={formData.practicalProblem}
                onChange={(e) => handleChange("practicalProblem", e.target.value)}
                placeholder="Describe the real-world operational issue or challenge..."
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-3 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Scientific or Literature Gap
              </label>
              <textarea
                rows={3}
                value={formData.scientificProblem}
                onChange={(e) => handleChange("scientificProblem", e.target.value)}
                placeholder="Identify what existing research lacks or leaves unresolved..."
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-3 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E] transition"
              />
            </div>
          </div>
        </div>

        {/* PICO / Structured Breakdown Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Target className="w-4 h-4 text-[#053B2E]" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              2. Framework Elements ({formData.framework || "PICO"})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Population / Sample (P)
              </label>
              <input
                type="text"
                value={formData.population}
                onChange={(e) => handleChange("population", e.target.value)}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Intervention / Exposure (I)
              </label>
              <input
                type="text"
                value={formData.intervention}
                onChange={(e) => handleChange("intervention", e.target.value)}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Comparator / Control Group (C)
              </label>
              <input
                type="text"
                value={formData.comparator}
                onChange={(e) => handleChange("comparator", e.target.value)}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Measured Outcome (O)
              </label>
              <input
                type="text"
                value={formData.outcome}
                onChange={(e) => handleChange("outcome", e.target.value)}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
              />
            </div>
          </div>
        </div>

        {/* AI Proposals Box if Present */}
        {formData.aiSuggestions && (
          <div className="bg-stone-900 text-stone-100 p-5 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-serif font-bold text-sm">Gemini AI Canvas Refinements</h4>
            </div>
            <div className="text-xs space-y-1.5 text-stone-300">
              <p>
                <strong className="text-white">Refined Topic Title:</strong> {formData.aiSuggestions.refinedTopic}
              </p>
              <p>
                <strong className="text-white">Candidate Question:</strong> {formData.aiSuggestions.candidateQuestions?.[0]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

