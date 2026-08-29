import React, { useState, useEffect } from "react";
import { ProjectState, SourceRecord, CSLStyleOption, ManuscriptSection, ResearchCanvas, ResearchQuestionItem, ClaimItem, TargetOutlet, SearchExecution, SearchExecutionSource } from "./types";
import { createEmptyProject, createDemoProject, canAddRecordToProject } from "./data/demoProject";
import { mapJournalStyleToCslId } from "./data/baselineOutlets";
import { Header } from "./components/Header";
import { Navigation, WORKFLOW_STEPS } from "./components/Navigation";
import { ResearchCanvasView } from "./components/views/ResearchCanvasView";
import { QuestionBuilderView } from "./components/views/QuestionBuilderView";
import { SourceLibraryView } from "./components/views/SourceLibraryView";
import { SearchPlannerView } from "./components/views/SearchPlannerView";
import { DocumentReaderModal } from "./components/views/DocumentReaderModal";
import { ClaimMatrixView } from "./components/views/ClaimMatrixView";
import { GapMapView } from "./components/views/GapMapView";
import { ProtocolBuilderView } from "./components/views/ProtocolBuilderView";
import { DataLabView } from "./components/views/DataLabView";
import { WritingStudioView } from "./components/views/WritingStudioView";
import { ExportCentreView } from "./components/views/ExportCentreView";
import { ProjectWizardModal } from "./components/views/ProjectWizardModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { ProjectManagerModal } from "./components/ProjectManagerModal";
import { QuickActionsMenu } from "./components/QuickActionsMenu";
import { useAutosave } from "./hooks/useAutosave";
import { createProjectInFirestore } from "./lib/projectService";
import { AlertTriangle } from "lucide-react";

function MainAppContent() {
  const { user, userProfile } = useAuth();
  const [project, setProject] = useState<ProjectState>(() => createDemoProject());
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeCslStyle, setActiveCslStyle] = useState<CSLStyleOption["id"]>("apa-7th");

  // Modals
  const [readerSource, setReaderSource] = useState<SourceRecord | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProjectManagerModal, setShowProjectManagerModal] = useState(false);

  // Autosave Engine
  const { autosaveState, lastSavedTime } = useAutosave(project, (updated) => {
    setProject((prev) => ({ ...prev, version: updated.version, updatedAt: updated.updatedAt }));
  });

  const tabToStepMap: Record<string, number> = {
    dashboard: 1,
    overview: 1,
    canvas: 1,
    "idea-title": 1,
    "step-1": 1,

    sources: 2,
    search: 2,
    gapmap: 2,
    "literature-gap": 2,
    "step-2": 2,

    question: 3,
    hypotheses: 3,
    "questions-hypotheses": 3,
    "step-3": 3,

    writing: 4,
    introduction: 4,
    "introduction-review": 4,
    "step-4": 4,

    protocol: 5,
    ethics: 5,
    methods: 5,
    methodology: 5,
    "step-5": 5,

    datalab: 6,
    results: 6,
    "step-6": 6,

    discussion: 7,
    "discussion-conclusion": 7,
    "step-7": 7,

    future: 8,
    "future-work": 8,
    "step-8": 8,

    claims: 9,
    references: 9,
    "step-9": 9,

    checklist: 10,
    outlets: 10,
    compliance: 10,
    review: 10,
    peer: 10,
    revision: 10,
    ledger: 10,
    export: 10,
    "preview-export": 10,
    "step-10": 10,
  };

  // Deep linking and route restoration via window.location.hash
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      if (hash) {
        const parts = hash.split("/");
        const target = parts[parts.length - 1];
        if (target && tabToStepMap[target]) {
          setActiveStep(tabToStepMap[target]);
        } else {
          const num = parseInt(target.replace("step-", ""), 10);
          if (!isNaN(num) && num >= 1 && num <= 10) {
            setActiveStep(num);
          }
        }
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const handleSelectStep = (stepNum: number) => {
    setActiveStep(stepNum);
    window.location.hash = `#step-${stepNum}`;
  };

  const handleNavigateTab = (tabId: string) => {
    const step = tabToStepMap[tabId] || 1;
    handleSelectStep(step);
  };

  const handleSelectProject = (isDemo: boolean) => {
    if (isDemo) {
      setProject(createDemoProject());
    } else {
      setShowProjectManagerModal(true);
    }
  };

  const handleCreateNewProject = async (newProjData: Partial<ProjectState>) => {
    if (user) {
      const created = await createProjectInFirestore(
        newProjData,
        user.uid,
        user.email || "researcher@local",
        userProfile?.displayName,
        userProfile?.organizationId
      );
      setProject(created);
    } else {
      const freshProject = createEmptyProject(newProjData);
      setProject(freshProject);
    }
    handleSelectStep(1);
  };

  const handleUpdateCanvas = (updatedCanvas: ResearchCanvas) => {
    setProject((prev) => ({ ...prev, canvas: updatedCanvas }));
  };

  const handleUpdateQuestions = (updatedQuestions: ResearchQuestionItem[]) => {
    setProject((prev) => ({ ...prev, researchQuestions: updatedQuestions }));
  };

  const handleAddSource = (newSource: SourceRecord) => {
    if (!canAddRecordToProject(project, newSource)) {
      alert("Guard error: Demo records cannot be added to a real project.");
      return;
    }
    setProject((prev) => ({ ...prev, sources: [newSource, ...prev.sources] }));
  };

  const handleSaveSearchExecution = (execution: SearchExecution) => {
    setProject((prev) => ({ ...prev, searchExecutions: [execution, ...(prev.searchExecutions || []).filter((item) => item.searchId !== execution.searchId)] }));
  };

  const handleImportSearchSources = (execution: SearchExecution, sources: SearchExecutionSource[]) => {
    const imported: SourceRecord[] = sources.filter((source) => source.title && source.year && source.journalOrVenue).map((source) => ({
      id: source.sourceId,
      title: source.title!,
      authors: source.authors || [],
      year: source.year!,
      journalOrVenue: source.journalOrVenue!,
      publisher: source.publisher,
      doi: source.doi,
      pmid: source.pmid,
      pmcid: source.pmcid,
      documentType: source.provider === "arXiv" ? "Preprint" : "Research Source",
      peerReviewStatus: source.provider === "arXiv" ? "Preprint" : "Unknown",
      verificationState: "Unverified",
      state: "Imported",
      stateHistory: [],
      metadataProvider: source.provider,
      provenance: { providerId: source.providerId, provider: source.provider, retrievedAt: source.retrievedAt, fieldProvenance: source.fieldProvenance },
      relevanceScore: 5,
      tags: [`Search Execution ${execution.searchId}`, source.provider],
    }));
    setProject((prev) => ({ ...prev, sources: [...imported.filter((source) => !prev.sources.some((existing) => existing.id === source.id)), ...prev.sources] }));
  };

  const handleUpdateClaims = (updatedClaims: ClaimItem[]) => {
    const validClaims = project.isDemoProject
      ? updatedClaims
      : updatedClaims.filter((c) => canAddRecordToProject(project, c));
    setProject((prev) => ({ ...prev, claims: validClaims }));
  };

  const handleUpdateSection = (updatedSection: ManuscriptSection) => {
    setProject((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => (s.id === updatedSection.id ? updatedSection : s)),
    }));
  };

  const handleSelectOutlet = (outlet: TargetOutlet) => {
    const cslId = mapJournalStyleToCslId(outlet.citationStyle);
    setProject((prev) => ({
      ...prev,
      selectedTargetOutlet: outlet,
      activeCslStyle: cslId,
    }));
  };

  const handleRunAnalysis = () => {
    if (!project.isDemoProject || project.datasets.length === 0) {
      alert("Unavailable in the prototype: this function requires verified data, evidence or a configured backend.");
      return;
    }
    setProject((prev) => ({
      ...prev,
      analysisOutputs: [
        {
          ...prev.analysisOutputs[0],
          executionTimestamp: new Date().toISOString(),
          summaryText: "Analysis executed on demo dataset.",
        },
      ],
    }));
  };

  const activeStepMeta = WORKFLOW_STEPS.find((s) => s.id === activeStep) || WORKFLOW_STEPS[0];

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-stone-900 flex flex-col font-sans selection:bg-[#053B2E] selection:text-white">
      {/* Global Prototype Environment Banner */}
      <div className="bg-amber-50/80 text-amber-900 px-4 py-1.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 border-b border-amber-200/80 shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>Prototype environment — not approved for real research use.</span>
      </div>

      {/* Header */}
      <Header
        project={project}
        onSelectProject={handleSelectProject}
        onOpenWizard={() => setShowWizard(true)}
        onOpenProjectManager={() => setShowProjectManagerModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onSelectOutlet={handleSelectOutlet}
        activeTab={`step-${activeStep}`}
        setActiveTab={handleNavigateTab}
        autosaveState={autosaveState}
        lastSavedTime={lastSavedTime}
      />

      {/* Shell Container: Left Stepper + Single Main Content Panel */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row p-4 sm:p-6 lg:p-8 gap-6 lg:gap-8">
        {/* Left Workflow Stepper */}
        <Navigation
          project={project}
          activeStep={activeStep}
          onSelectStep={handleSelectStep}
          activeTab={`step-${activeStep}`}
          onNavigateTab={handleNavigateTab}
        />

        {/* One Main Content Panel */}
        <main className="flex-1 min-w-0 bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Main Step Header */}
          <div className="pb-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#053B2E] uppercase tracking-wider mb-1">
                Step {activeStepMeta.id} of 10
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                {activeStepMeta.title}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
                {activeStepMeta.subtitle}
              </p>
            </div>
            {project.selectedTargetOutlet && (
              <div className="self-start sm:self-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-700">
                Outlet: <strong className="text-[#053B2E]">{project.selectedTargetOutlet.journalName}</strong>
              </div>
            )}
          </div>

          {/* Active Step Content Panel */}
          <div className="space-y-6">
            {activeStep === 1 && (
              <ResearchCanvasView
                canvas={project.canvas}
                onUpdateCanvas={handleUpdateCanvas}
                isDemoProject={project.isDemoProject}
                projectId={project.id}
              />
            )}

            {activeStep === 2 && (
              <div className="space-y-6">
                <SearchPlannerView
                  projectId={project.id}
                  executions={project.searchExecutions || []}
                  onSaveExecution={handleSaveSearchExecution}
                  onImportSources={handleImportSearchSources}
                />
                <SourceLibraryView
                  sources={project.sources}
                  onAddSource={handleAddSource}
                  onOpenReaderModal={(src) => setReaderSource(src)}
                  onUpdateSource={(source) => setProject((prev) => ({ ...prev, sources: prev.sources.map((item) => item.id === source.id ? source : item) }))}
                  projectId={project.id}
                  trustedTransitionRevision={project.trustedTransitionIntegrity?.revision || 0}
                  onTrustedProjectUpdate={setProject}
                />
                <GapMapView gaps={project.gaps || []} />
              </div>
            )}

            {activeStep === 3 && (
              <QuestionBuilderView
                questions={project.researchQuestions}
                onUpdateQuestions={handleUpdateQuestions}
              />
            )}

            {activeStep === 4 && (
              <WritingStudioView
                sections={(project.sections || []).filter(
                  (s) =>
                    s.title.toLowerCase().includes("introduction") ||
                    s.title.toLowerCase().includes("review") ||
                    s.order <= 2
                )}
                sources={project.sources || []}
                activeCslStyle={activeCslStyle}
                selectedTargetOutlet={project.selectedTargetOutlet}
                project={project}
                onUpdateSection={handleUpdateSection}
                onChangeCslStyle={(styleId) => setActiveCslStyle(styleId)}
                onUpdateProject={(updatedProject) => setProject(updatedProject)}
                onSelectOutlet={handleSelectOutlet}
              />
            )}

            {activeStep === 5 && (
              <div className="space-y-6">
                <ProtocolBuilderView
                  project={project}
                  onUpdateProject={(updatedProject) => setProject(updatedProject)}
                  currentUserUid={user?.uid}
                />
                <DataLabView
                  datasets={project.datasets || []}
                  plans={project.analysisPlans || []}
                  outputs={project.analysisOutputs || []}
                  figures={project.figures || []}
                  tables={project.tables || []}
                  onRunAnalysis={handleRunAnalysis}
                  project={project}
                  onUpdateProject={(updatedProject) => setProject(updatedProject)}
                />
              </div>
            )}

            {activeStep === 6 && (
              <DataLabView
                datasets={project.datasets || []}
                plans={project.analysisPlans || []}
                outputs={project.analysisOutputs || []}
                figures={project.figures || []}
                tables={project.tables || []}
                onRunAnalysis={handleRunAnalysis}
                project={project}
                onUpdateProject={(updatedProject) => setProject(updatedProject)}
              />
            )}

            {activeStep === 7 && (
              <WritingStudioView
                sections={(project.sections || []).filter(
                  (s) =>
                    s.title.toLowerCase().includes("discussion") ||
                    s.title.toLowerCase().includes("conclusion") ||
                    s.order >= 5
                )}
                sources={project.sources || []}
                activeCslStyle={activeCslStyle}
                selectedTargetOutlet={project.selectedTargetOutlet}
                project={project}
                onUpdateSection={handleUpdateSection}
                onChangeCslStyle={(styleId) => setActiveCslStyle(styleId)}
                onUpdateProject={(updatedProject) => setProject(updatedProject)}
                onSelectOutlet={handleSelectOutlet}
              />
            )}

            {activeStep === 8 && (
              <WritingStudioView
                sections={(project.sections || []).filter(
                  (s) =>
                    s.title.toLowerCase().includes("future") ||
                    s.title.toLowerCase().includes("declaration") ||
                    s.order >= 6
                )}
                sources={project.sources || []}
                activeCslStyle={activeCslStyle}
                selectedTargetOutlet={project.selectedTargetOutlet}
                project={project}
                onUpdateSection={handleUpdateSection}
                onChangeCslStyle={(styleId) => setActiveCslStyle(styleId)}
                onUpdateProject={(updatedProject) => setProject(updatedProject)}
                onSelectOutlet={handleSelectOutlet}
              />
            )}

            {activeStep === 9 && (
              <ClaimMatrixView
                claims={project.claims}
                sources={project.sources}
                evidenceRecords={project.evidenceRecords || []}
                claimEvidenceLinks={project.claimEvidenceLinks || []}
                manuscriptSentenceClaimLinks={project.manuscriptSentenceClaimLinks || []}
                onUpdateClaims={handleUpdateClaims}
                onUpdateEvidenceRecords={(evidenceRecords) => setProject((prev) => ({ ...prev, evidenceRecords }))}
                onUpdateClaimEvidenceLinks={(claimEvidenceLinks) => setProject((prev) => ({ ...prev, claimEvidenceLinks }))}
                projectId={project.id}
                trustedTransitionRevision={project.trustedTransitionIntegrity?.revision || 0}
                onTrustedProjectUpdate={setProject}
              />
            )}

            {activeStep === 10 && (
              <ExportCentreView
                project={project}
                activeCslStyle={activeCslStyle}
                onSelectOutlet={handleSelectOutlet}
                onUpdateProject={(updatedPartial) =>
                  setProject((prev) => ({ ...prev, ...updatedPartial }))
                }
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-6 px-4 text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-base text-[#053B2E]">Scholarly Engine</span>
            <span>• Research with Evidence. Write with Integrity.</span>
          </div>
          <p className="text-stone-500 text-center md:text-right text-[11px]">
            Assists researchers with evidence traceability and scholarly formatting.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <DocumentReaderModal
        source={readerSource}
        evidenceRecords={(project.evidenceRecords || []).filter((record) => record.sourceId === readerSource?.id)}
        onUpdateEvidenceRecord={(record) => setProject((prev) => ({
          ...prev,
          evidenceRecords: (prev.evidenceRecords || []).map((item) => item.evidenceId === record.evidenceId ? record : item),
        }))}
        onClose={() => setReaderSource(null)}
      />

      {showWizard && (
        <ProjectWizardModal
          onClose={() => setShowWizard(false)}
          onCreateProject={handleCreateNewProject}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <ProjectManagerModal
        isOpen={showProjectManagerModal}
        onClose={() => setShowProjectManagerModal(false)}
        currentProject={project}
        onSelectProject={(proj) => setProject(proj)}
      />

      {/* Floating Quick Actions Menu */}
      <QuickActionsMenu
        activeStep={activeStep}
        project={project}
        onSelectStep={handleSelectStep}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
