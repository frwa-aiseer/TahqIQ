import React, { useState } from "react";
import {
  DatasetRecord,
  AnalysisPlan,
  AnalysisOutput,
  GeneratedFigure,
  GeneratedTable,
  ProjectState,
  DatasetState,
  DatasetVariable,
  AnalysisState,
} from "../../types";
import { performStateTransition, DATASET_TRANSITIONS } from "../../lib/stateMachines";
import { parseAndProfileDataset, updateDatasetVariableDictionary } from "../../lib/datasetIngestion";
import { executePairedCrossoverAnalysis, generateAnalysisFiguresAndTables } from "../../lib/statsEngine";
import { createNumericEvidenceFromAnalysis } from "../../lib/numericEvidence";
import { hasAttributableManuscriptApproval, transitionAnalysisOutput } from "../../lib/analysisLifecycle";
import { ApprovalModal } from "../ApprovalModal";
import { useAuth } from "../../context/AuthContext";
import { authenticatedProjectFetch } from "../../lib/authenticatedFetch";
import { requestTrustedTransition } from "../../lib/trustedTransitionsClient";
import {
  FileSpreadsheet,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Database,
  Cpu,
  History,
  ChevronRight,
  Edit3,
  Layers,
  Lock,
  Info,
  XCircle,
  FileText,
  Code2,
  BarChart2,
  Table as TableIcon,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface DataLabViewProps {
  datasets: DatasetRecord[];
  plans: AnalysisPlan[];
  outputs: AnalysisOutput[];
  figures: GeneratedFigure[];
  tables: GeneratedTable[];
  onRunAnalysis: () => void;
  project?: ProjectState;
  onUpdateProject?: (updatedProject: ProjectState) => void;
}

export const DataLabView: React.FC<DataLabViewProps> = ({
  datasets = [],
  plans = [],
  outputs = [],
  figures = [],
  tables = [],
  onRunAnalysis,
  project,
  onUpdateProject,
}) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"profiler" | "dictionary" | "executor" | "outputs" | "upload">("executor");
  const [isIngesting, setIsIngesting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [parsedMessage, setParsedMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Selected Dataset for deep inspection/editing
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || "");
  const activeDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  // Selected Plan for Execution
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "");
  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  // Analysis Execution Parameter Form State
  const [execParams, setExecParams] = useState({
    outcomeVariable: activePlan?.outcomeVariable || "score",
    conditionVariable: (activePlan?.predictorVariables && activePlan.predictorVariables[0]) || "condition",
    participantIdVariable: "id",
    periodVariable: "period",
    sequenceVariable: "sequence",
    alpha: activePlan?.significanceThreshold || 0.05,
  });

  // Latest Execution Output State
  const [latestOutput, setLatestOutput] = useState<AnalysisOutput | null>(outputs[0] || null);

  // Variable Dictionary Editing State
  const [editingVariable, setEditingVariable] = useState<DatasetVariable | null>(null);
  const [editForm, setEditForm] = useState<{
    label: string;
    unit: string;
    type: DatasetVariable["type"];
    role: DatasetVariable["role"];
    coding: string;
    missingTokens: string;
    expectedMin: string;
    expectedMax: string;
  }>({
    label: "",
    unit: "",
    type: "Numeric",
    role: "Predictor",
    coding: "",
    missingTokens: "",
    expectedMin: "",
    expectedMax: "",
  });

  // Version History Audit Modal State
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Approval Modal Config
  const [approvalModalConfig, setApprovalModalConfig] = useState<{
    isOpen: boolean;
    entityType: "Dataset" | "Analysis";
    entityId: string;
    entityTitle: string;
    currentState: string;
    targetState: string;
    itemRef: DatasetRecord | AnalysisOutput | null;
  }>({
    isOpen: false,
    entityType: "Dataset",
    entityId: "",
    entityTitle: "",
    currentState: "",
    targetState: "",
    itemRef: null,
  });

  // Audit Trail History Modal State
  const [selectedAuditHistory, setSelectedAuditHistory] = useState<{
    title: string;
    history: any[];
  } | null>(null);

  // Handle Dataset Anonymization Confirmation
  const handleConfirmAnonymization = (ds: DatasetRecord) => {
    if (!project || !onUpdateProject) return;
    const updatedDatasets = (project.datasets || []).map((d) =>
      d.id === ds.id ? { ...d, isAnonymizedConfirmed: true } : d
    );
    onUpdateProject({ ...project, datasets: updatedDatasets, updatedAt: new Date().toISOString() });
    setParsedMessage(`Explicit researcher anonymization confirmed for dataset '${ds.filename}'.`);
  };

  // File Ingestion Handler (CSV, TSV, XLSX, JSON)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project || !onUpdateProject) return;

    setIsIngesting(true);
    setParsedMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseAndProfileDataset({
        filename: file.name,
        fileBufferOrString: buffer,
        mimeType: file.type,
      });

      const newDataset = result.dataset;
      const updatedProject: ProjectState = {
        ...project,
        datasets: [newDataset, ...(project.datasets || [])],
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updatedProject);
      setSelectedDatasetId(newDataset.id);
      setIsIngesting(false);
      setParsedMessage(
        `Successfully ingested '${file.name}' (${newDataset.recordCount} records, ${newDataset.variableCount} variables). SHA-256: ${newDataset.fileHash.slice(
          0,
          12
        )}...`
      );
    } catch (err: any) {
      setIsIngesting(false);
      alert(`Dataset Ingestion Failed: ${err.message}`);
    }
  };

  // Handle Dataset State Machine Transitions
  const handleDatasetTransition = (ds: DatasetRecord, targetState: DatasetState) => {
    if ((targetState === "Approved for Analysis" || targetState === "Locked") && !ds.isAnonymizedConfirmed) {
      alert("Prohibited Action: You must explicitly confirm researcher anonymization before approving this dataset for analysis.");
      return;
    }

    if (targetState === "Approved for Analysis" || targetState === "Locked") {
      setApprovalModalConfig({
        isOpen: true,
        entityType: "Dataset",
        entityId: ds.id,
        entityTitle: ds.filename,
        currentState: ds.state || "Uploaded",
        targetState,
        itemRef: ds,
      });
    } else {
      executeDatasetTransition(ds, targetState, `Transitioned dataset state to ${targetState}`, [ds.fileHash]);
    }
  };

  const executeDatasetTransition = async (
    ds: DatasetRecord,
    targetState: DatasetState,
    reason: string,
    evidenceRecordIds: string[]
  ) => {
    if (!project || !onUpdateProject) return;

    if (targetState === "Approved for Analysis" || targetState === "Locked") {
      try {
        const result = await requestTrustedTransition({ projectId: project.id, transitionType: "DATASET_APPROVED", entityId: ds.id, rationale: reason, evidenceIds: evidenceRecordIds, expectedRevision: project.trustedTransitionIntegrity?.revision || 0 });
        onUpdateProject(result.project);
        setParsedMessage(`Dataset '${ds.filename}' state transitioned to '${result.project.datasets.find((item) => item.id === ds.id)?.state}'.`);
      } catch (error) { alert(error instanceof Error ? error.message : "Trusted dataset transition failed."); }
      return;
    }

    const actor = {
      uid: user?.uid || "user-local",
      email: user?.email || "researcher@local",
    };

    const result = performStateTransition("Dataset", ds, targetState, actor, reason, evidenceRecordIds);

    if (result.success) {
      const updatedDatasets = (project.datasets || []).map((d) =>
        d.id === ds.id ? (result.entity as DatasetRecord) : d
      );
      onUpdateProject({ ...project, datasets: updatedDatasets, updatedAt: new Date().toISOString() });
      setParsedMessage(`Dataset '${ds.filename}' state transitioned to '${targetState}'.`);
    } else {
      alert(result.error || "Prohibited dataset transition failed.");
    }
  };

  const persistAnalysisTransition = async (
    output: AnalysisOutput,
    targetState: AnalysisState,
    rationale: string,
    actorType: "human" | "system"
  ) => {
    if (!project || !onUpdateProject) return;
    if (actorType === "human" && (!user?.uid || !user.email)) {
      throw new Error("An authenticated researcher is required for review and manuscript approval.");
    }
    if (targetState === "Approved for Manuscript") {
      try {
        const result = await requestTrustedTransition({ projectId: project.id, transitionType: "ANALYSIS_APPROVED_FOR_MANUSCRIPT", entityId: output.id, rationale, evidenceIds: [output.datasetHash, output.planId || output.analysisPlanId].filter((id): id is string => Boolean(id)), expectedRevision: project.trustedTransitionIntegrity?.revision || 0 });
        onUpdateProject(result.project);
        const trustedOutput = result.project.analysisOutputs.find((item) => item.id === output.id);
        if (trustedOutput) setLatestOutput(trustedOutput);
        setParsedMessage(`Analysis output '${output.id}' transitioned to 'Approved for Manuscript'.`);
      } catch (error) { alert(error instanceof Error ? error.message : "Trusted analysis approval failed."); }
      return;
    }
    const actor = actorType === "human"
      ? { uid: user!.uid, email: user!.email! }
      : { uid: "tehqiq-qc", email: "system@tehqiq.local" };
    const updatedOutput = transitionAnalysisOutput(output, targetState, actor, rationale, actorType);
    const updatedOutputs = (project.analysisOutputs || []).map((item) => item.id === output.id ? updatedOutput : item);
    const artifactApproved = hasAttributableManuscriptApproval(updatedOutput);
    const updatedFigures = (project.figures || []).map((item) => item.analysisRunId === output.id ? { ...item, isApproved: artifactApproved } : item);
    const updatedTables = (project.tables || []).map((item) => item.analysisRunId === output.id ? { ...item, isApproved: artifactApproved } : item);
    onUpdateProject({ ...project, analysisOutputs: updatedOutputs, figures: updatedFigures, tables: updatedTables, updatedAt: new Date().toISOString() });
    setLatestOutput(updatedOutput);
    setParsedMessage(`Analysis output '${output.id}' transitioned to '${targetState}'.`);
  };

  const requestHumanAnalysisTransition = (output: AnalysisOutput, targetState: AnalysisState) => {
    if (!user?.uid || !user.email) {
      alert("An authenticated researcher is required for review and manuscript approval.");
      return;
    }
    setApprovalModalConfig({
      isOpen: true,
      entityType: "Analysis",
      entityId: output.id,
      entityTitle: `Analysis output ${output.id}`,
      currentState: output.state || "Completed",
      targetState,
      itemRef: output,
    });
  };

  // Start Editing a Variable
  const handleStartEditVariable = (v: DatasetVariable) => {
    setEditingVariable(v);
    setEditForm({
      label: v.label || v.name,
      unit: v.unit || "",
      type: v.type,
      role: v.role || "Predictor",
      coding: v.coding || "",
      missingTokens: (v.missingValueDefinitions || []).join(", "),
      expectedMin: v.expectedMin !== undefined ? String(v.expectedMin) : "",
      expectedMax: v.expectedMax !== undefined ? String(v.expectedMax) : "",
    });
  };

  // Save Variable Dictionary Changes
  const handleSaveVariable = async () => {
    if (!editingVariable || !activeDataset || !project || !onUpdateProject) return;

    const updatedVars = activeDataset.variables.map((v) => {
      if (v.name !== editingVariable.name) return v;
      return {
        ...v,
        label: editForm.label,
        unit: editForm.unit,
        type: editForm.type,
        role: editForm.role,
        coding: editForm.coding,
        missingValueDefinitions: editForm.missingTokens
          ? editForm.missingTokens.split(",").map((s) => s.trim())
          : undefined,
        expectedMin: editForm.expectedMin !== "" ? Number(editForm.expectedMin) : undefined,
        expectedMax: editForm.expectedMax !== "" ? Number(editForm.expectedMax) : undefined,
      };
    });

    const updatedDataset = await updateDatasetVariableDictionary(
      activeDataset,
      updatedVars,
      `Updated variable metadata dictionary for '${editingVariable.name}'.`
    );

    const updatedProjectDatasets = (project.datasets || []).map((d) =>
      d.id === activeDataset.id ? updatedDataset : d
    );

    onUpdateProject({ ...project, datasets: updatedProjectDatasets, updatedAt: new Date().toISOString() });
    setEditingVariable(null);
    setParsedMessage(`Variable dictionary for '${editingVariable.name}' updated. Version updated to v${updatedDataset.version}.`);
  };

  // ==========================================
  // Phase 5: Execute Real Statistical Analysis
  // ==========================================
  const handleExecuteStatisticalAnalysis = async (isImportedLog = false) => {
    if (!activeDataset || !activePlan) {
      alert("Please select a valid dataset and analysis plan.");
      return;
    }

    setIsExecuting(true);
    setParsedMessage(null);

    try {
      let runOutput: AnalysisOutput;
      let runFigures: GeneratedFigure[] = [];
      let runTables: GeneratedTable[] = [];

      // Attempt secure server API execution path
      try {
        const res = await authenticatedProjectFetch("/api/analysis/execute", project?.id || "", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataset: activeDataset,
            plan: activePlan,
            options: {
              ...execParams,
              isResearcherSuppliedLog: isImportedLog,
            },
          }),
        });

        const data = await res.json();
        if (data.output) {
          runOutput = data.output;
          runFigures = data.figures || [];
          runTables = data.tables || [];
        } else {
          throw new Error(data.error || "Server response lacked output.");
        }
      } catch (apiErr) {
        // Fallback to client-side engine computation
        runOutput = executePairedCrossoverAnalysis({
          dataset: activeDataset,
          plan: activePlan,
          outcomeVariable: execParams.outcomeVariable,
          conditionVariable: execParams.conditionVariable,
          participantIdVariable: execParams.participantIdVariable,
          periodVariable: execParams.periodVariable,
          sequenceVariable: execParams.sequenceVariable,
          alpha: execParams.alpha,
          isResearcherSuppliedLog: isImportedLog,
        });

        if (runOutput.executionStatus !== "Failed") {
          const generated = generateAnalysisFiguresAndTables(runOutput, activeDataset, activePlan);
          runFigures = generated.figures;
          runTables = generated.tables;
        }
      }

      setIsExecuting(false);
      setLatestOutput(runOutput);

      if (runOutput.executionStatus === "Failed") {
        setParsedMessage(`Execution Blocked/Failed: ${runOutput.summaryText}`);
        return;
      }

      // Update project state with new AnalysisOutput, figures, tables, and updated Plan status
      if (project && onUpdateProject) {
        const updatedPlans = (project.analysisPlans || []).map((p) =>
          p.id === activePlan.id ? { ...p, status: "Executed" as const, state: "Executed" as const } : p
        );

        const updatedOutputs = [runOutput, ...(project.analysisOutputs || []).filter((o) => o.id !== runOutput.id)];
        const runNumericEvidence = createNumericEvidenceFromAnalysis(runOutput);
        const updatedNumericEvidence = [
          ...runNumericEvidence,
          ...(project.numericEvidenceRecords || []).filter((record) => record.analysisRunId !== runOutput.id),
        ];
        const updatedFigures = [...runFigures, ...(project.figures || []).filter((f) => !runFigures.some((rf) => rf.id === f.id))];
        const updatedTables = [...runTables, ...(project.tables || []).filter((t) => !runTables.some((rt) => rt.id === t.id))];

        onUpdateProject({
          ...project,
          analysisPlans: updatedPlans,
          analysisOutputs: updatedOutputs,
          numericEvidenceRecords: updatedNumericEvidence,
          figures: updatedFigures,
          tables: updatedTables,
          updatedAt: new Date().toISOString(),
        });
      }

      setParsedMessage(
        `Statistical analysis executed cleanly for plan '${activePlan.title}' on dataset '${activeDataset.filename}'. Linked Dataset Hash: ${runOutput.datasetHash?.slice(0, 10)}...`
      );
    } catch (err: any) {
      setIsExecuting(false);
      alert(`Statistical execution error: ${err.message}`);
    }
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isDatasetApproved = activeDataset && (activeDataset.state === "Approved for Analysis" || activeDataset.state === "Locked");
  const isPlanApproved = activePlan && (activePlan.status === "Approved" || activePlan.state === "Approved" || activePlan.state === "Executed");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              Data Lab & Statistical Engine
            </h2>
            <p className="text-xs text-stone-500">
              Paired t-tests, Wilcoxon signed-rank, Cohen's d_z, period effect carryover assessments, and figure generation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Analysis Engine Ready</span>
          </span>
        </div>
      </div>

      {parsedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{parsedMessage}</span>
          </div>
          <button onClick={() => setParsedMessage(null)} className="font-bold underline text-[11px] shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Datasets Selector & State Bar */}
      {datasets.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#102A43] flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#0B5D4B]" />
              <span>Active Empirical Dataset ({datasets.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {datasets.map((ds) => {
              const isSelected = activeDataset?.id === ds.id;
              const currentState: DatasetState = ds.state || "Uploaded";
              const allowedTransitions = DATASET_TRANSITIONS[currentState] || [];

              return (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDatasetId(ds.id)}
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 cursor-pointer transition ${
                    isSelected
                      ? "bg-slate-900 border-slate-800 text-white shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm truncate block">{ds.filename}</span>
                      <span className="font-mono text-[10px] opacity-75">
                        v{ds.version || 1} • {ds.recordCount} rows, {ds.variableCount} cols
                      </span>
                    </div>
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        currentState === "Approved for Analysis" || currentState === "Locked"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isSelected
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-indigo-100 text-indigo-900"
                      }`}
                    >
                      {currentState}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono space-y-1 opacity-80 border-t border-slate-700/20 pt-2">
                    <p className="truncate">SHA-256: {ds.fileHash}</p>
                    <p>Missingness: {ds.missingnessPercent}%</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    {ds.isAnonymizedConfirmed ? (
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Anonymization Confirmed</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Unconfirmed Anonymization</span>
                      </span>
                    )}
                  </div>

                  {/* Transition Actions */}
                  <div className="pt-2 border-t border-slate-700/20 flex flex-wrap gap-1">
                    {allowedTransitions.map((target) => (
                      <button
                        key={target}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDatasetTransition(ds, target);
                        }}
                        className="bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white font-bold text-[10px] px-2 py-1 rounded transition"
                      >
                        → {target}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main DataLab Workbench */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
        {/* Sub-tabs Navigation */}
        <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveSubTab("executor")}
            className={`pb-2 border-b-2 transition flex items-center space-x-1.5 ${
              activeSubTab === "executor" ? "border-[#0B5D4B] text-[#0B5D4B]" : "border-transparent"
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[#0B5D4B]" />
            <span>Phase 5 Statistical Execution Workbench</span>
          </button>
          <button
            onClick={() => setActiveSubTab("outputs")}
            className={`pb-2 border-b-2 transition flex items-center space-x-1.5 ${
              activeSubTab === "outputs" ? "border-[#0B5D4B] text-[#0B5D4B]" : "border-transparent"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Stored Outputs & Figures/Tables ({outputs.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("profiler")}
            className={`pb-2 border-b-2 transition ${activeSubTab === "profiler" ? "border-[#0B5D4B] text-[#0B5D4B]" : "border-transparent"}`}
          >
            Summary Statistics & Profiler
          </button>
          <button
            onClick={() => setActiveSubTab("dictionary")}
            className={`pb-2 border-b-2 transition ${activeSubTab === "dictionary" ? "border-[#0B5D4B] text-[#0B5D4B]" : "border-transparent"}`}
          >
            Editable Variable Dictionary
          </button>
          <button
            onClick={() => setActiveSubTab("upload")}
            className={`pb-2 border-b-2 transition ${activeSubTab === "upload" ? "border-[#0B5D4B] text-[#0B5D4B]" : "border-transparent"}`}
          >
            Upload New Dataset
          </button>
        </div>

        {/* ========================================== */}
        {/* SUBTAB: Phase 5 Statistical Execution Workbench */}
        {/* ========================================== */}
        {activeSubTab === "executor" && (
          <div className="space-y-6">
            {/* Approval Verification Checklist & Execution Config */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#102A43] flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-[#0B5D4B]" />
                    <span>Statistical Workflow Execution Parameters</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select approved analysis plan and mapped dataset variables to execute real numerical analysis.
                  </p>
                </div>

                {/* Execute Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleExecuteStatisticalAnalysis(true)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 transition"
                  >
                    Import Researcher Log (External)
                  </button>

                  <button
                    onClick={() => handleExecuteStatisticalAnalysis(false)}
                    disabled={isExecuting || !isDatasetApproved || !isPlanApproved}
                    className={`text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition ${
                      isDatasetApproved && isPlanApproved
                        ? "bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>{isExecuting ? "Executing Analysis..." : "Execute Real Analysis"}</span>
                  </button>
                </div>
              </div>

              {/* Strict Approval Requirement Warning Banner */}
              {(!isDatasetApproved || !isPlanApproved) && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-amber-800">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Execution Requirement Gate Active</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    The Execute button strictly requires an approved dataset version (`Approved for Analysis` or `Locked`) and an approved analysis plan (`Approved`).
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px]">
                    <span className={isDatasetApproved ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                      • Dataset ({activeDataset?.filename}): {activeDataset?.state || "Uploaded"} {isDatasetApproved ? "✅" : "❌ (Transition to Approved for Analysis)"}
                    </span>
                    <span className={isPlanApproved ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                      • Plan ({activePlan?.title}): {activePlan?.status || activePlan?.state || "Draft"} {isPlanApproved ? "✅" : "❌ (Approve plan in Pipeline)"}
                    </span>
                  </div>
                </div>
              )}

              {/* Analysis Plan & Variables Mapping Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Analysis Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => {
                      setSelectedPlanId(e.target.value);
                      const plan = plans.find((p) => p.id === e.target.value);
                      if (plan) {
                        setExecParams({
                          ...execParams,
                          outcomeVariable: plan.outcomeVariable || execParams.outcomeVariable,
                          conditionVariable: (plan.predictorVariables && plan.predictorVariables[0]) || execParams.conditionVariable,
                        });
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.status || p.state || "Draft"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outcome Variable (Dependent)</label>
                  <input
                    type="text"
                    value={execParams.outcomeVariable}
                    onChange={(e) => setExecParams({ ...execParams, outcomeVariable: e.target.value })}
                    placeholder="e.g. score or pre_score,post_score"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500">For wide format, enter comma-separated columns (e.g. pre,post).</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condition Variable (Treatment/Group)</label>
                  <input
                    type="text"
                    value={execParams.conditionVariable}
                    onChange={(e) => setExecParams({ ...execParams, conditionVariable: e.target.value })}
                    placeholder="e.g. treatment, condition"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Participant / Subject ID Column</label>
                  <input
                    type="text"
                    value={execParams.participantIdVariable}
                    onChange={(e) => setExecParams({ ...execParams, participantIdVariable: e.target.value })}
                    placeholder="e.g. id, participant_id"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Period Variable (Optional)</label>
                  <input
                    type="text"
                    value={execParams.periodVariable}
                    onChange={(e) => setExecParams({ ...execParams, periodVariable: e.target.value })}
                    placeholder="e.g. period"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alpha Threshold ($\alpha$)</label>
                  <select
                    value={execParams.alpha}
                    onChange={(e) => setExecParams({ ...execParams, alpha: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value={0.05}>0.05 (Standard 95% Confidence)</option>
                    <option value={0.01}>0.01 (Strict 99% Confidence)</option>
                    <option value={0.10}>0.10 (Exploratory 90% Confidence)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Display Active Execution Output */}
            {latestOutput && (
              <div className="space-y-6 border-t border-slate-200 pt-5">
                {/* Status Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          latestOutput.executionStatus === "Completed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        Execution: {latestOutput.executionStatus || "Not available"}
                      </span>
                      <span className="bg-sky-500/20 text-sky-200 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-bold">
                        Lifecycle: {latestOutput.state || "Completed"}
                      </span>

                      {latestOutput.isResearcherSupplied && !latestOutput.isReproduced && latestOutput.reproductionStatus !== "Independently Reproduced" ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                          Researcher-Supplied Log (Not Independently Reproduced)
                        </span>
                      ) : (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Independently Reproduced</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      Executed: {new Date(latestOutput.executionTimestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Dataset SHA-256 Hash:</span>
                      <span className="font-bold text-emerald-400 truncate block">{latestOutput.datasetHash || activeDataset.fileHash}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Plan ID:</span>
                      <span className="font-bold text-indigo-300">{latestOutput.planId || activePlan?.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Reproducibility Hash:</span>
                      <span className="font-bold text-amber-300">{latestOutput.reproducibilityHash}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 font-sans pt-1 italic">{latestOutput.summaryText}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {latestOutput.state === "Completed" && (
                      <button
                        type="button"
                        onClick={() => persistAnalysisTransition(latestOutput, "QC Passed", "Automated deterministic QC checks recorded; no researcher approval granted.", "system")}
                        className="bg-sky-700 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >Record QC Passed</button>
                    )}
                    {latestOutput.state === "QC Passed" && (
                      <button
                        type="button"
                        onClick={() => requestHumanAnalysisTransition(latestOutput, "Researcher Reviewed")}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >Record Researcher Review</button>
                    )}
                    {latestOutput.state === "Researcher Reviewed" && (
                      <button
                        type="button"
                        onClick={() => requestHumanAnalysisTransition(latestOutput, "Approved for Manuscript")}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >Approve for Manuscript</button>
                    )}
                  </div>
                </div>

                {/* Paired Statistical Results Table */}
                {latestOutput.numericResults && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="font-serif font-bold text-sm text-[#102A43] flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#0B5D4B]" />
                      <span>Paired Comparison & Effect Size Metrics</span>
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase block font-sans">Complete Pairs (N)</span>
                        <span className="font-bold text-lg text-slate-900">{latestOutput.numericResults.completePairs || 0}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase block font-sans">Mean Difference</span>
                        <span className="font-bold text-lg text-indigo-700">{latestOutput.numericResults.mean_diff}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase block font-sans">Paired t-statistic (df)</span>
                        <span className="font-bold text-lg text-slate-900">
                          {latestOutput.numericResults.t_stat} ({latestOutput.numericResults.df})
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase block font-sans">Exact p-value</span>
                        <span className="font-bold text-lg text-emerald-700">{latestOutput.pValues[0]?.formatted || latestOutput.numericResults.p_val}</span>
                      </div>
                    </div>

                    {/* Effect Sizes Breakdown */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                            <th className="p-2.5">Effect Size Metric</th>
                            <th className="p-2.5">Calculated Value</th>
                            <th className="p-2.5">95% Confidence Interval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          {latestOutput.effectSizes.map((es, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold font-sans text-slate-800">{es.metric}</td>
                              <td className="p-2.5 text-indigo-700 font-bold">{es.value}</td>
                              <td className="p-2.5 text-slate-600">
                                {es.ciLower !== undefined && es.ciUpper !== undefined ? `[${es.ciLower}, ${es.ciUpper}]` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Carryover Assessment & Assumption Checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assumption Checks */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#102A43] flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#0B5D4B]" />
                      <span>Assumption Verification & Diagnostics</span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      {latestOutput.assumptionChecks.map((chk, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-800">{chk.assumption}</span>
                            <span className={chk.met ? "text-emerald-700" : "text-amber-700"}>
                              {chk.met ? "✅ Satisfied" : "⚠️ Warning"}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] font-sans">{chk.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Carryover Assessment & Limitations */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#102A43] flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Carryover Assessment & Limitations</span>
                    </h4>

                    {latestOutput.carryoverReport && (
                      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-amber-900 font-mono">
                          <span>Treatment-by-Period Interaction:</span>
                          <span>p = {latestOutput.carryoverReport.pValue}</span>
                        </div>
                        <p className="text-amber-800 text-[11px] font-sans leading-relaxed">
                          {latestOutput.carryoverReport.limitationNotice}
                        </p>
                      </div>
                    )}

                    {/* Missing Data Report */}
                    {latestOutput.missingDataReport && (
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1 font-mono">
                        <span className="font-bold text-slate-800 block font-sans">Missing Data Breakdown:</span>
                        <p>Total Rows: {latestOutput.missingDataReport.totalRows} | Complete Pairs: {latestOutput.missingDataReport.completeRows}</p>
                        <p>Dropped Incomplete Pairs: {latestOutput.missingDataReport.missingRows} ({latestOutput.missingDataReport.missingPercent}%)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sensitivity Analysis Table */}
                {latestOutput.sensitivityAnalysis && latestOutput.sensitivityAnalysis.length > 0 && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#102A43] flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#0B5D4B]" />
                      <span>Sensitivity Analysis Models</span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                            <th className="p-2.5">Analysis Model Specification</th>
                            <th className="p-2.5">Mean Diff</th>
                            <th className="p-2.5">p-value</th>
                            <th className="p-2.5">Effect Size (dz)</th>
                            <th className="p-2.5">Model Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                          {latestOutput.sensitivityAnalysis.map((sens, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold font-sans text-slate-900">{sens.model}</td>
                              <td className="p-2.5 text-indigo-700">{sens.meanDiff}</td>
                              <td className="p-2.5 text-emerald-700">{sens.pValue}</td>
                              <td className="p-2.5">{sens.effectSize}</td>
                              <td className="p-2.5 text-slate-600 font-sans">{sens.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reproducibility R & Python Code Viewer */}
                {latestOutput.code && (
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono font-bold">
                        <Code2 className="w-4 h-4" />
                        <span>Exact Reproducibility Code Snippet (Python & R)</span>
                      </div>
                      <button
                        onClick={() => copyCodeToClipboard(latestOutput.code || "")}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] px-3 py-1 rounded border border-slate-700 flex items-center space-x-1"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                      </button>
                    </div>

                    <pre className="text-[11px] font-mono text-emerald-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed p-2 bg-slate-950 rounded-lg">
                      {latestOutput.code}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: Stored Analysis Outputs & Figures/Tables */}
        {/* ========================================== */}
        {activeSubTab === "outputs" && (
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-base text-[#102A43] flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#0B5D4B]" />
              <span>Stored Analysis Outputs & Linked Visualizations</span>
            </h3>

            {outputs.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">No executed statistical runs stored yet. Execute an analysis in the Workbench tab above.</p>
            ) : (
              <div className="space-y-4">
                {outputs.map((out) => (
                  <div key={out.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-sm text-[#102A43]">Run ID: {out.id}</span>
                      <span className="font-mono text-[10px] text-slate-500">{new Date(out.executionTimestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{out.summaryText}</p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Dataset Hash: {out.datasetHash} | Reproducibility Hash: {out.reproducibilityHash}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Render Stored Figures & Tables strictly generated from analysis output */}
            {(figures.length > 0 || tables.length > 0) && (
              <div className="space-y-6 border-t border-slate-200 pt-6">
                <h4 className="font-serif font-bold text-sm text-[#102A43]">Stored Figures & Tables (From Real Outputs)</h4>

                {/* Figures */}
                {figures.map((fig) => (
                  <div key={fig.id} className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h5 className="font-bold text-sm text-indigo-300">{fig.title}</h5>
                      <span className="text-[10px] font-mono text-slate-400">Run ID: {fig.analysisRunId}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans">{fig.caption}</p>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Data Points (Calculated):</span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {fig.dataPoints.map((dp, i) => (
                          <div key={i} className="bg-slate-900 p-2 rounded border border-slate-800">
                            {dp.condition}: Mean = {dp.mean}, SD = {dp.sd}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tables */}
                {tables.map((tbl) => (
                  <div key={tbl.id} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-sm text-[#102A43]">{tbl.title}</h5>
                    <p className="text-xs text-slate-600">{tbl.caption}</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            {tbl.headers.map((h, i) => (
                              <th key={i} className="p-2.5">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                          {tbl.rows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              {r.map((cell, j) => (
                                <td key={j} className="p-2.5">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {tbl.footnotes && <p className="text-[10px] text-slate-500 italic font-mono">{tbl.footnotes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: Profiler & Summary Statistics */}
        {/* ========================================== */}
        {activeSubTab === "profiler" && activeDataset && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="p-2.5">Variable</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Missing</th>
                    <th className="p-2.5">Unique</th>
                    <th className="p-2.5">Summary Statistics (Calculated)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeDataset.variables.map((v) => (
                    <tr key={v.name} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold text-[#102A43] font-mono">
                        {v.name}
                        {v.label && v.label !== v.name && (
                          <span className="block text-[10px] text-slate-500 font-sans">{v.label}</span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono">
                        <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {v.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono">
                        {v.missingCount} ({((v.missingCount / activeDataset.recordCount) * 100).toFixed(1)}%)
                      </td>
                      <td className="p-2.5 font-mono">{v.uniqueValues}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-700">
                        {v.summaryStats?.min !== undefined && (
                          <span>
                            Min: {v.summaryStats.min} | Max: {v.summaryStats.max} | Mean: {v.summaryStats.mean} | SD: {v.summaryStats.sd} | Med: {v.summaryStats.median}
                          </span>
                        )}
                        {v.summaryStats?.frequencies && (
                          <span className="truncate block max-w-md text-slate-600">
                            Top Values: {Object.entries(v.summaryStats.frequencies).slice(0, 4).map(([k, count]) => `${k} (${count})`).join(", ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: Editable Variable Dictionary */}
        {/* ========================================== */}
        {activeSubTab === "dictionary" && activeDataset && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="p-2.5">Variable</th>
                    <th className="p-2.5">Label & Unit</th>
                    <th className="p-2.5">Type Override</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Coding / Missing</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeDataset.variables.map((v) => (
                    <tr key={v.name} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold font-mono text-[#102A43]">{v.name}</td>
                      <td className="p-2.5">
                        <span className="font-semibold">{v.label || v.name}</span>
                        {v.unit && <span className="text-slate-500 text-[10px] block">Unit: {v.unit}</span>}
                      </td>
                      <td className="p-2.5 font-mono">
                        <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px]">
                          {v.type}
                        </span>
                      </td>
                      <td className="p-2.5">{v.role || "Predictor"}</td>
                      <td className="p-2.5 text-[11px] font-mono text-slate-600">
                        {v.coding && <div>Coding: {v.coding}</div>}
                        {v.missingValueDefinitions && <div>Missing: {v.missingValueDefinitions.join(", ")}</div>}
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => handleStartEditVariable(v)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] px-2.5 py-1 rounded transition flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3 text-slate-600" />
                          <span>Edit Dictionary</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: Upload New Dataset */}
        {/* ========================================== */}
        {activeSubTab === "upload" && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-serif font-bold text-sm text-[#102A43]">Ingest New Empirical Dataset File</h4>
            <p className="text-xs text-slate-600">
              Supports CSV, TSV, XLSX, and JSON files up to 25MB. Computes real SHA-256 hash, schema union, and automated profiling.
            </p>
            <div>
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                disabled={isIngesting}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0B5D4B] file:text-white hover:file:bg-[#0B5D4B]/90"
              />
            </div>
            {isIngesting && <p className="text-xs text-indigo-600 font-bold font-mono">Parsing and profiling dataset...</p>}
          </div>
        )}
      </div>

      {/* Edit Variable Dictionary Modal */}
      {editingVariable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-[#102A43]">
                Edit Dictionary: {editingVariable.name}
              </h3>
              <button onClick={() => setEditingVariable(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Variable Label</label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measurement</label>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    placeholder="e.g. kg, mmHg, ms"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Type Override</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="Numeric">Numeric</option>
                    <option value="Categorical">Categorical</option>
                    <option value="Datetime">Datetime</option>
                    <option value="ID">ID</option>
                    <option value="Text">Text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Study Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  <option value="Primary outcome">Primary outcome</option>
                  <option value="Secondary outcome">Secondary outcome</option>
                  <option value="Predictor">Predictor</option>
                  <option value="Covariate">Covariate</option>
                  <option value="ID">ID</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Value Coding / Mapping</label>
                <input
                  type="text"
                  value={editForm.coding}
                  onChange={(e) => setEditForm({ ...editForm, coding: e.target.value })}
                  placeholder="e.g. 0=Control, 1=Treatment"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setEditingVariable(null)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVariable}
                className="bg-[#0B5D4B] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Save Dictionary Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formal Approval Modal */}
      {approvalModalConfig.itemRef && (
        <ApprovalModal
          isOpen={approvalModalConfig.isOpen}
          onClose={() =>
            setApprovalModalConfig({
              isOpen: false,
              entityType: "Dataset",
              entityId: "",
              entityTitle: "",
              currentState: "",
              targetState: "",
              itemRef: null,
            })
          }
          entityType={approvalModalConfig.entityType}
          entityId={approvalModalConfig.entityId}
          entityTitle={approvalModalConfig.entityTitle}
          currentState={approvalModalConfig.currentState}
          targetState={approvalModalConfig.targetState}
          evidenceRecordIds={[]}
          onConfirmApproval={(reason, evidenceRecordIds) => {
            if (approvalModalConfig.entityType === "Dataset") {
              executeDatasetTransition(
                approvalModalConfig.itemRef as DatasetRecord,
                approvalModalConfig.targetState as DatasetState,
                reason,
                evidenceRecordIds
              );
            } else {
              persistAnalysisTransition(
                approvalModalConfig.itemRef as AnalysisOutput,
                approvalModalConfig.targetState as AnalysisState,
                reason,
                "human"
              );
            }
          }}
        />
      )}
    </div>
  );
};
