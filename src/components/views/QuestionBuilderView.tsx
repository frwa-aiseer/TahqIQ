import React, { useMemo, useState } from "react";
import { ResearchQuestionItem } from "../../types";
import { HelpCircle, CheckCircle2, Award, Plus, Target } from "lucide-react";

interface QuestionBuilderViewProps {
  questions: ResearchQuestionItem[];
  onUpdateQuestions: (updated: ResearchQuestionItem[]) => void;
}

export const QuestionBuilderView: React.FC<QuestionBuilderViewProps> = ({
  questions,
  onUpdateQuestions,
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || "");
  const [notice, setNotice] = useState<string | null>(null);
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId);

  const scoreTotal = useMemo(() => {
    if (!selectedQuestion) return null;
    const scores = [
      selectedQuestion.finerScore.feasible,
      selectedQuestion.finerScore.interesting,
      selectedQuestion.finerScore.novel,
      selectedQuestion.finerScore.ethical,
      selectedQuestion.finerScore.relevant,
    ];
    return scores.every((score) => typeof score === "number")
      ? scores.reduce((total, score) => total + (score as number), 0)
      : null;
  }, [selectedQuestion]);

  const createBlankQuestion = (): ResearchQuestionItem => ({
    id: `rq-${Date.now()}`,
    question: "",
    type: "Primary",
    finerScore: { feasible: null, interesting: null, novel: null, ethical: null, relevant: null, totalScore: null },
    hypotheses: [],
    isApproved: false,
  });

  const handleAddQuestion = () => {
    const question = createBlankQuestion();
    onUpdateQuestions([...questions, question]);
    setSelectedQuestionId(question.id);
    setNotice(null);
  };

  const updateSelectedQuestion = (updates: Partial<ResearchQuestionItem>) => {
    if (!selectedQuestion) return;
    const updated = { ...selectedQuestion, ...updates };
    onUpdateQuestions(questions.map((question) => question.id === updated.id ? updated : question));
  };

  const updateFinerScore = (key: keyof ResearchQuestionItem["finerScore"], value: string) => {
    if (!selectedQuestion || key === "totalScore") return;
    const numericValue = value === "" ? null : Math.min(10, Math.max(1, Number(value)));
    const finerScore = { ...selectedQuestion.finerScore, [key]: numericValue };
    const scoreValues = [finerScore.feasible, finerScore.interesting, finerScore.novel, finerScore.ethical, finerScore.relevant];
    finerScore.totalScore = scoreValues.every((score) => typeof score === "number")
      ? scoreValues.reduce((total, score) => total + (score as number), 0)
      : null;
    updateSelectedQuestion({ finerScore });
  };

  const handleToggleApproval = () => {
    if (!selectedQuestion) return;
    if (!selectedQuestion.question.trim()) {
      setNotice("Researcher input required: enter the question before approval.");
      return;
    }
    if (scoreTotal === null) {
      setNotice("Researcher input required: score all five FINER criteria before approval.");
      return;
    }
    updateSelectedQuestion({ isApproved: !selectedQuestion.isApproved, approvalDate: new Date().toISOString() });
    setNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Research Questions & FINER Assessment</h2>
            <p className="text-xs text-stone-500">
              Formulate primary research questions, evaluate FINER criteria, and define null/alternative hypotheses.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="self-start sm:self-center bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add research question</span>
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl">
          {notice}
        </div>
      )}

      {/* Main Grid: Left List, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Questions Column */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Questions ({questions.length})
            </h3>
          </div>

          {questions.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">No research question has been added.</p>
              <p>Start here by adding your question. FINER scores remain Researcher Input Required until you enter them.</p>
            </div>
          )}

          {questions.map((q) => {
            const isSelected = selectedQuestion?.id === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuestionId(q.id)}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-[#053B2E] text-white border-[#053B2E] shadow-xs"
                    : "bg-white text-stone-800 border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold uppercase tracking-wide ${isSelected ? "text-amber-300" : "text-[#053B2E]"}`}>
                    {q.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    q.isApproved
                      ? isSelected ? "bg-emerald-800 text-emerald-100" : "bg-emerald-50 text-emerald-700"
                      : isSelected ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"
                  }`}>
                    {q.isApproved ? "Approved" : "Draft"}
                  </span>
                </div>

                <p className="text-xs font-medium leading-snug line-clamp-2">
                  {q.question}
                </p>

                <div className={`pt-1 text-[10px] flex items-center justify-between ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                  <span>FINER: {q.finerScore.totalScore === null || q.finerScore.totalScore === undefined ? "Researcher input required" : `${q.finerScore.totalScore}/50`}</span>
                  <span>{q.hypotheses.length} Hypotheses</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Question Detail & FINER Matrix */}
        <div className="lg:col-span-2 space-y-5">
          {!selectedQuestion && (
            <div className="bg-white p-6 rounded-xl border border-stone-200 text-sm text-stone-600">
              Select <strong>Add research question</strong> to begin. Nothing is approved or scored automatically.
            </div>
          )}
          {selectedQuestion && (
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#053B2E]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Question Specification
                </h3>
              </div>

              <button
                onClick={handleToggleApproval}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  selectedQuestion.isApproved
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-[#053B2E] text-white hover:bg-[#053B2E]/90"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedQuestion.isApproved ? "Approved by researcher" : "Approve as researcher"}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Question Statement
              </label>
              <textarea
                rows={3}
                value={selectedQuestion.question}
                onChange={(e) => updateSelectedQuestion({ question: e.target.value, isApproved: false, approvalDate: undefined })}
                placeholder="Write the question your study will answer..."
                className="w-full bg-stone-50/60 border border-stone-200 rounded-lg p-3 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E] transition"
              />
            </div>

            {/* FINER Score Card */}
            <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-xs text-stone-900">
                  FINER Framework Evaluation
                </span>
                  <span className="text-xs font-bold text-[#053B2E]">
                  Total: {scoreTotal === null ? "Researcher input required" : `${scoreTotal} / 50`}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {([
                  ["Feasible", "feasible"], ["Interesting", "interesting"], ["Novel", "novel"], ["Ethical", "ethical"], ["Relevant", "relevant"],
                ] as const).map(([label, key]) => (
                  <label key={key} className="bg-white p-2 rounded-lg border border-stone-200 block">
                    <span className="text-[10px] text-stone-500 block">{label}</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedQuestion.finerScore[key] ?? ""}
                      onChange={(event) => updateFinerScore(key, event.target.value)}
                      aria-label={`${label} FINER score`}
                      placeholder="Required"
                      className="w-full text-center font-semibold text-stone-900 text-xs bg-transparent focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-stone-500">Score each criterion from 1–10 using your own research judgement. TehqIQ does not infer a score.</p>
            </div>

            {/* Hypotheses Breakdown */}
            {selectedQuestion.hypotheses && selectedQuestion.hypotheses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-stone-800">Hypotheses</h4>
                <div className="space-y-2">
                  {selectedQuestion.hypotheses.map((h, idx) => (
                    <div key={idx} className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs flex items-start space-x-2">
                      <span className="font-bold text-[#053B2E] shrink-0">{h.label || `H${idx + 1}`}:</span>
                      <span className="text-stone-800">{h.statement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
