import React, { useState, useEffect, useRef } from "react";
import { ProjectState, ResearchProjectType } from "../../types";
import { X, Sparkles } from "lucide-react";

interface ProjectWizardModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onCreateProject: (proj: Partial<ProjectState>) => void;
}

export const ProjectWizardModal: React.FC<ProjectWizardModalProps> = ({
  isOpen = true,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState<string>("Sports Science & Biomechanics");
  const [projectType, setProjectType] = useState<ResearchProjectType>("Randomized controlled trial");
  const [broadTopic, setBroadTopic] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (isOpen === false) return null;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateProject({
      title,
      discipline,
      projectType,
      canvas: {
        id: `cnv-${Date.now()}`,
        broadTopic: broadTopic || title,
        practicalProblem: "Problem defined during project setup wizard.",
        scientificProblem: "Scientific gap defined during setup.",
        population: "Target Cohort",
        context: "Clinical / Field Setting",
        intervention: "Experimental Protocol",
        comparator: "Control Protocol",
        outcome: "Primary Outcome",
        framework: "PICO",
        feasibilityScore: 8,
        ethicalRiskScore: 2,
      },
      isDemoProject: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-modal-title"
        className="bg-white text-stone-900 max-w-xl w-full rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
      >
        <div className="bg-stone-50 p-4 flex items-center justify-between border-b border-stone-200/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#053B2E]/10 flex items-center justify-center text-[#053B2E]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 id="wizard-modal-title" className="font-semibold text-sm text-stone-900 tracking-tight">
              Create New Research Project
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFinish} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Working Research Title
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="e.g. Investigation of Biomarker Trajectories in Athletic Recovery"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Primary Academic Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 font-medium focus:bg-white focus:outline-none"
              >
                <option value="Sports Science & Biomechanics">Sports Science & Biomechanics</option>
                <option value="Medicine & Clinical Research">Medicine & Clinical Research</option>
                <option value="Public Health & Epidemiology">Public Health & Epidemiology</option>
                <option value="Psychology & Behavioral Sciences">Psychology & Behavioral Sciences</option>
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Education & Social Sciences">Education & Social Sciences</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Study Methodology Architecture
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ResearchProjectType)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 font-medium focus:bg-white focus:outline-none"
              >
                <option value="Randomized controlled trial">Randomized Trial (CONSORT)</option>
                <option value="Observational study">Observational Study (STROBE)</option>
                <option value="Systematic review">Systematic Review (PRISMA)</option>
                <option value="Original qualitative research">Qualitative Study (COREQ)</option>
                <option value="Case report">Case Report (CARE)</option>
                <option value="Diagnostic-accuracy study">Diagnostic Accuracy (STARD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Broad Domain or Problem Area
            </label>
            <input
              type="text"
              placeholder="e.g. Neuromuscular warm-up interventions in endurance athletes"
              value={broadTopic}
              onChange={(e) => setBroadTopic(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E] transition"
            />
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/80 italic text-[11px] text-stone-600">
            "By initializing this project, you confirm that all empirical data will be uploaded directly by researchers and verified through TehqIQ's evidence traceability matrix."
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs shadow-2xs transition"
            >
              Initialize Project Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
