import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, PenLine, Sparkles, Upload } from "lucide-react";
import type { MethodologyFields, MethodologySourceMode, ProjectState } from "../../types";
import {
  METHODOLOGY_FIELD_KEYS,
  METHODOLOGY_FIELD_LABELS,
  countCompletedMethodologyFields,
  createMethodologyWorkspace,
  extractMethodologyFieldsFromText,
  getMethodologyWorkspace,
} from "../../lib/methodologyWorkspace";

interface ProtocolBuilderViewProps {
  project: ProjectState;
  onUpdateProject?: (project: ProjectState) => void;
  currentUserUid?: string;
}

const SOURCE_PATHS: Array<{
  mode: MethodologySourceMode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    mode: "Researcher Entered",
    title: "Enter existing methodology",
    description: "Record only methodology already established by the research team.",
    icon: PenLine,
  },
  {
    mode: "Protocol Upload",
    title: "Upload existing protocol",
    description: "Extract explicitly labelled text fields for researcher review.",
    icon: Upload,
  },
  {
    mode: "AI Proposal",
    title: "Request AI proposal",
    description: "Create a reviewable suggestion; it cannot approve itself.",
    icon: Sparkles,
  },
];

export const ProtocolBuilderView: React.FC<ProtocolBuilderViewProps> = ({
  project,
  onUpdateProject,
  currentUserUid,
}) => {
  const workspace = useMemo(() => getMethodologyWorkspace(project), [project]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [isRequestingAi, setIsRequestingAi] = useState(false);

  const persistWorkspace = (nextWorkspace: typeof workspace) => {
    onUpdateProject?.({
      ...project,
      methodologyWorkspace: {
        ...nextWorkspace,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const selectPath = (mode: MethodologySourceMode) => {
    if (workspace.sourceMode === mode) return;
    persistWorkspace(createMethodologyWorkspace(mode, mode === "Protocol Upload" ? "Needs Review" : mode === "AI Proposal" ? "AI Suggested" : "Draft"));
    setNotice(null);
  };

  const updateField = (key: keyof MethodologyFields, value: string) => {
    persistWorkspace({
      ...workspace,
      reviewState: workspace.sourceMode === "AI Proposal" ? "AI Suggested" : workspace.sourceMode === "Protocol Upload" ? "Needs Review" : "Draft",
      researcherApproval: undefined,
      fields: { ...workspace.fields, [key]: value },
    });
  };

  const handleProtocolUpload = async (file?: File) => {
    if (!file) return;
    const isTextFile = file.type.startsWith("text/") || /\.(txt|md|markdown|csv)$/i.test(file.name);
    if (!isTextFile) {
      setNotice({
        type: "error",
        message: "Not Configured: deterministic extraction currently accepts TXT, Markdown, or CSV text protocols. No fields were inferred.",
      });
      return;
    }

    try {
      const text = await file.text();
      const fields = extractMethodologyFieldsFromText(text);
      const extractedAt = new Date().toISOString();
      persistWorkspace({
        ...createMethodologyWorkspace("Protocol Upload", "Needs Review"),
        fields,
        uploadedProtocol: {
          fileName: file.name,
          mimeType: file.type || "text/plain",
          uploadedAt: extractedAt,
          extractedAt,
        },
      });
      setNotice({
        type: "success",
        message: `Extracted ${countCompletedMethodologyFields(fields)} explicitly labelled field(s). Every field remains Needs Review.`,
      });
    } catch {
      setNotice({ type: "error", message: "Protocol extraction failed. No methodology fields were changed." });
    }
  };

  const requestAiProposal = async () => {
    setIsRequestingAi(true);
    setNotice(null);
    try {
      const response = await fetch("/api/gemini/methodology-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          projectContext: {
            title: project.title || "Researcher input required",
            discipline: project.discipline || "Researcher input required",
            projectType: project.projectType || "Researcher input required",
            researchQuestion: project.researchQuestions?.[0]?.question || "Researcher input required",
            canvas: project.canvas,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== "completed" || !payload.proposal) {
        throw new Error(payload.error || "AI methodology proposal failed.");
      }

      persistWorkspace({
        ...createMethodologyWorkspace("AI Proposal", "AI Suggested"),
        fields: { ...createMethodologyWorkspace().fields, ...payload.proposal },
        aiProposal: {
          generatedAt: payload.timestamp,
          model: payload.model,
          promptVersion: payload.promptVersion,
        },
      });
      setNotice({
        type: "success",
        message: "AI proposal received as AI Suggested. Review and edit every field before researcher approval.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "AI methodology proposal failed. No fallback content was generated.",
      });
    } finally {
      setIsRequestingAi(false);
    }
  };

  const approveWorkspace = () => {
    if (!currentUserUid) {
      setNotice({ type: "error", message: "Researcher sign-in is required to approve methodology." });
      return;
    }
    persistWorkspace({
      ...workspace,
      reviewState: "Researcher Approved",
      researcherApproval: {
        approvedAt: new Date().toISOString(),
        approvedByUid: currentUserUid,
      },
    });
    setNotice({ type: "success", message: "Methodology marked Researcher Approved by the signed-in researcher." });
  };

  const completedCount = countCompletedMethodologyFields(workspace.fields);

  return (
    <div className="space-y-6" data-testid="methodology-workspace">
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Domain-Neutral Methodology Workspace</h2>
            <p className="text-xs text-stone-500">Record, extract, or request a proposal without inventing missing research details.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">Review state</div>
          <div className="text-xs font-bold text-[#053B2E]">{workspace.reviewState}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" aria-label="Methodology source path">
        {SOURCE_PATHS.map(({ mode, title, description, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => selectPath(mode)}
            className={`text-left p-4 rounded-xl border transition-colors ${workspace.sourceMode === mode ? "border-[#053B2E] bg-[#053B2E]/5" : "border-stone-200 bg-white hover:border-stone-300"}`}
            aria-pressed={workspace.sourceMode === mode}
          >
            <Icon className="w-4 h-4 text-[#053B2E] mb-2" />
            <div className="text-xs font-semibold text-stone-900">{title}</div>
            <div className="text-[11px] text-stone-500 mt-1 leading-relaxed">{description}</div>
          </button>
        ))}
      </div>

      {workspace.sourceMode === "Protocol Upload" && (
        <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-stone-800">Upload a labelled text protocol</div>
            <div className="text-[11px] text-stone-500">Only explicitly labelled fields are copied. Missing fields remain Researcher Input Required.</div>
          </div>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept=".txt,.md,.markdown,.csv,text/plain,text/markdown,text/csv"
            onChange={(event) => void handleProtocolUpload(event.target.files?.[0])}
            aria-label="Upload methodology protocol"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-[#053B2E] text-white text-xs font-semibold">
            Choose protocol
          </button>
        </div>
      )}

      {workspace.sourceMode === "AI Proposal" && (
        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-indigo-950">AI output is a proposal only</div>
            <div className="text-[11px] text-indigo-800">Unknown details must remain “Researcher input required.” AI cannot approve this methodology.</div>
          </div>
          <button type="button" disabled={isRequestingAi} onClick={() => void requestAiProposal()} className="px-4 py-2 rounded-lg bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold">
            {isRequestingAi ? "Requesting proposal…" : "Request AI proposal"}
          </button>
        </div>
      )}

      {notice && (
        <div role="status" className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${notice.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
          {notice.type === "error" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Methodology fields</h3>
            <p className="text-[11px] text-stone-500">{completedCount} of {METHODOLOGY_FIELD_KEYS.length} fields contain researcher or source-provided content.</p>
          </div>
          {workspace.uploadedProtocol && <div className="text-[10px] text-stone-500">Source: {workspace.uploadedProtocol.fileName}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {METHODOLOGY_FIELD_KEYS.map((key) => (
            <label key={key} className={`space-y-1.5 ${key === "analysisPlan" || key === "limitations" ? "lg:col-span-2" : ""}`}>
              <span className="text-xs font-semibold text-stone-700">{METHODOLOGY_FIELD_LABELS[key]}</span>
              <textarea
                value={workspace.fields[key]}
                onChange={(event) => updateField(key, event.target.value)}
                placeholder="Researcher Input Required"
                rows={key === "analysisPlan" || key === "limitations" ? 4 : 3}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 placeholder:text-amber-700/70 focus:outline-none focus:ring-2 focus:ring-[#053B2E]/20 focus:border-[#053B2E]"
              />
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-stone-500">
            Blank values are unresolved and must not be treated as methodology facts.
          </p>
          <button
            type="button"
            onClick={approveWorkspace}
            disabled={workspace.reviewState === "Researcher Approved"}
            className="px-4 py-2 rounded-lg border border-[#053B2E] text-[#053B2E] disabled:opacity-50 text-xs font-semibold"
          >
            {workspace.reviewState === "Researcher Approved" ? "Researcher Approved" : "Approve as researcher"}
          </button>
        </div>
      </div>
    </div>
  );
};
