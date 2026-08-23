import React, { useState } from "react";
import { ManuscriptSection, SourceRecord, CSLStyleOption, TargetOutlet, ProjectState, SectionState, AiLedgerEvent } from "../../types";
import { performStateTransition, SECTION_TRANSITIONS } from "../../lib/stateMachines";
import { ApprovalModal } from "../ApprovalModal";
import { AiProposalModal } from "../AiProposalModal";
import { validateAiGeneratedProse, AIValidationResult, isAnalysisOutputApproved } from "../../lib/aiValidationService";
import { useAuth } from "../../context/AuthContext";
import { authenticatedProjectFetch } from "../../lib/authenticatedFetch";
import { formatInTextCitation, formatBibliographyEntry, CSL_STYLES } from "../../lib/cslStyles";
import { applyToneAndComplexity } from "../../lib/manuscriptTone";
import {
  buildApprovedAnalysisInsertion,
  buildLiteratureEvidenceInsertion,
  getApprovedManuscriptAnalysisOutputs,
  getInsertableLiteratureEvidence,
  InsertableLiteratureEvidence,
  StatisticalInsertionMode,
} from "../../lib/writingEvidence";
import { verifyManuscriptCitations, CitationOccurrence, CitationVerificationReport } from "../../lib/citationVerifier";
import {
  JournalStyleVariation,
  getSavedJournalProfiles,
  saveJournalProfiles,
  getActiveJournalProfileId,
  setActiveJournalProfileId,
  sortSourcesByProfile,
  formatCustomInTextCitation,
  formatCustomBibliographyEntry,
  BUILT_IN_JOURNAL_PRESETS,
} from "../../lib/journalStyleConfig";
import {
  PenTool,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award,
  FileText,
  AlertTriangle,
  Maximize2,
  Zap,
  HelpCircle,
  Layers,
  Database,
  Cpu,
  Sliders,
  ArrowRight,
  Search,
  RefreshCw,
  Plus,
  Wand2,
  Check,
  X,
  Save,
  Trash2,
  Copy,
  Bookmark,
  RotateCcw,
  GitCommit,
  History,
  ChevronRight,
  BarChart3,
} from "lucide-react";

interface WritingStudioViewProps {
  sections: ManuscriptSection[];
  sources: SourceRecord[];
  activeCslStyle: CSLStyleOption["id"];
  selectedTargetOutlet?: TargetOutlet;
  project: ProjectState;
  onUpdateSection: (updated: ManuscriptSection) => void;
  onChangeCslStyle: (styleId: CSLStyleOption["id"]) => void;
  onUpdateProject?: (updatedProject: ProjectState) => void;
}

export const WritingStudioView: React.FC<WritingStudioViewProps> = ({
  sections,
  sources,
  activeCslStyle,
  selectedTargetOutlet,
  project,
  onUpdateSection,
  onChangeCslStyle,
  onUpdateProject,
}) => {
  const { user } = useAuth();
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || "");
  const [rightDrawerTab, setRightDrawerTab] = useState<"evidence" | "outlet" | "integrity" | "csl" | "config">("evidence");
  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [showAssistantHelpModal, setShowAssistantHelpModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Section Approval Modal & Audit Trail State
  const [sectionApprovalModalConfig, setSectionApprovalModalConfig] = useState<{
    isOpen: boolean;
    section: ManuscriptSection | null;
    targetState: SectionState;
  }>({
    isOpen: false,
    section: null,
    targetState: "Approved",
  });
  const [selectedSectionAuditHistory, setSelectedSectionAuditHistory] = useState<ManuscriptSection | null>(null);

  const handleInitiateSectionTransition = (sec: ManuscriptSection, targetState: SectionState) => {
    if (targetState === "Approved" || targetState === "Locked") {
      setSectionApprovalModalConfig({
        isOpen: true,
        section: sec,
        targetState,
      });
    } else {
      executeSectionTransition(sec, targetState, `Transitioned manuscript section state to ${targetState}`, sec.citationIds || []);
    }
  };

  const executeSectionTransition = (
    sec: ManuscriptSection,
    targetState: SectionState,
    reason: string,
    evidenceRecordIds: string[]
  ) => {
    const actor = {
      uid: user?.uid || "user-local",
      email: user?.email || "researcher@local",
    };

    const result = performStateTransition("ManuscriptSection", sec, targetState, actor, reason, evidenceRecordIds);

    if (result.success) {
      onUpdateSection(result.entity as ManuscriptSection);
    } else {
      alert(result.error || "Prohibited transition failed.");
    }
  };

  // Journal Style Configuration & Session Persistence
  const [savedProfiles, setSavedProfiles] = useState<JournalStyleVariation[]>(getSavedJournalProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(getActiveJournalProfileId);
  const activeProfile = savedProfiles.find((p) => p.id === activeProfileId) || savedProfiles[0] || BUILT_IN_JOURNAL_PRESETS[0];
  const [editProfile, setEditProfile] = useState<JournalStyleVariation>(activeProfile);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const handleProfileSelect = (profileId: string) => {
    setActiveProfileId(profileId);
    setActiveJournalProfileId(profileId);
    const found = savedProfiles.find((p) => p.id === profileId);
    if (found) {
      setEditProfile(found);
      onChangeCslStyle(found.baseCslStyle);
    }
  };

  const handleSaveProfile = () => {
    const isExisting = savedProfiles.some((p) => p.id === editProfile.id);
    const updatedProfile = { ...editProfile, updatedAt: new Date().toISOString() };
    const newList = isExisting ? savedProfiles.map((p) => (p.id === editProfile.id ? updatedProfile : p)) : [...savedProfiles, updatedProfile];

    setSavedProfiles(newList);
    saveJournalProfiles(newList);
    setActiveProfileId(updatedProfile.id);
    setActiveJournalProfileId(updatedProfile.id);
    setSaveNotification("Journal style configuration saved to session!");
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleDuplicateProfile = () => {
    const newId = `custom-${Date.now()}`;
    const newProfile: JournalStyleVariation = {
      ...editProfile,
      id: newId,
      journalName: `${editProfile.journalName} (Custom Copy)`,
      isPreset: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newList = [...savedProfiles, newProfile];
    setSavedProfiles(newList);
    saveJournalProfiles(newList);
    setActiveProfileId(newId);
    setActiveJournalProfileId(newId);
    setEditProfile(newProfile);
    setSaveNotification("Created custom journal variation profile!");
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleDeleteProfile = (id: string) => {
    if (editProfile.isPreset) return;
    const newList = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(newList);
    saveJournalProfiles(newList);
    const fallbackId = newList[0]?.id || BUILT_IN_JOURNAL_PRESETS[0].id;
    handleProfileSelect(fallbackId);
    setSaveNotification("Profile removed.");
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleResetProfile = () => {
    const original = BUILT_IN_JOURNAL_PRESETS.find((p) => p.id === editProfile.id);
    if (original) {
      setEditProfile(original);
      setSaveNotification("Reset parameters to preset journal defaults.");
      setTimeout(() => setSaveNotification(null), 3000);
    }
  };

  // Citation Verification Audit Engine
  const verificationReport: CitationVerificationReport = verifyManuscriptCitations(sections, sources, activeCslStyle);
  const [auditSubFilter, setAuditSubFilter] = useState<"all" | "missing" | "uncited" | "issues">("all");

  // Evidence-Grounded Manuscript Assistant Options & Tone / Complexity
  const [focusStyle, setFocusStyle] = useState<"General Scholarly Journal" | "Empirical Study" | "Clinical Medicine" | "Quantitative & Experimental">("General Scholarly Journal");
  const [useCanvasContext, setUseCanvasContext] = useState<boolean>(true);
  const [useSourceContext, setUseSourceContext] = useState<boolean>(true);
  const [useAnalysisContext, setUseAnalysisContext] = useState<boolean>(true);

  // Per-section Tone & Complexity state
  const [sectionTones, setSectionTones] = useState<Record<string, "Concise Technical" | "Narrative Descriptive" | "Formal Academic">>({});

  const currentSection = sections.find((s) => s.id === selectedSectionId) || sections[0];
  const currentSectionTone = selectedSectionId ? (sectionTones[selectedSectionId] || "Formal Academic") : "Formal Academic";
  const totalWordCount = sections.reduce((sum, s) => sum + (s.currentWordCount || 0), 0);

  const handleContentChange = (newContent: string) => {
    if (!currentSection) return;
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;
    const updated: ManuscriptSection = {
      ...currentSection,
      content: newContent,
      currentWordCount: words,
      lastEditedTimestamp: new Date().toISOString(),
    };
    onUpdateSection(updated);
  };

  const handleSectionToneChange = (newTone: "Concise Technical" | "Narrative Descriptive" | "Formal Academic") => {
    if (!selectedSectionId) return;
    setSectionTones((prev) => ({ ...prev, [selectedSectionId]: newTone }));
    if (currentSection && currentSection.content) {
      const updatedContent = applyToneAndComplexity(currentSection.content, newTone);
      handleContentChange(updatedContent);
    }
  };

  // Phase 6 AI Proposal Modal State
  const [aiProposalState, setAiProposalState] = useState<{
    isOpen: boolean;
    title: string;
    featureUsed: string;
    targetSection: ManuscriptSection | null;
    proposedContent: string;
    groundingStatus: AIValidationResult;
  }>({
    isOpen: false,
    title: "",
    featureUsed: "",
    targetSection: null,
    proposedContent: "",
    groundingStatus: {
      valid: true,
      groundedCitations: [],
      ungroundedCitations: [],
      groundedNumbers: [],
      ungroundedNumbers: [],
      missingPlaceholders: [],
    },
  });

  const logLedgerEvent = (
    secTitle: string,
    decision: "Accepted" | "Edited" | "Rejected",
    summary: string
  ) => {
    if (!onUpdateProject) return;
    const newEvent: AiLedgerEvent = {
      id: `ledger-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userEmail: user?.email || "researcher@local",
      featureUsed: "Evidence-First Section Drafting",
      manuscriptSection: secTitle,
      model: "gemini-3.6-flash",
      promptVersion: "v2.4-phase6",
      inputSourcesUsed: sources.map((s) => s.id),
      generatedSummary: summary,
      userDecision: decision,
      creditRoleAssigned: "Writing - original draft",
    };

    const updatedLedger = [...(project.aiLedger || []), newEvent];
    onUpdateProject({
      ...project,
      aiLedger: updatedLedger,
      aiLedgerIntegrity: {
        status: "Incomplete",
        assessedAt: new Date().toISOString(),
        assessedByUid: user?.uid || "tehqiq-system",
        rationale: "Section drafting uses a direct model-call path pending centralized gateway coverage verification.",
        knownBypassPaths: ["POST /api/gemini/draft-section"],
      },
    });
  };

  const handleExpandCurrentSection = async () => {
    if (!currentSection) return;
    await triggerAiDraftProposal(currentSection);
  };

  const handleExpandSpecificSection = async (targetSec: ManuscriptSection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSectionId(targetSec.id);
    await triggerAiDraftProposal(targetSec);
  };

  const triggerAiDraftProposal = async (targetSec: ManuscriptSection) => {
    setIsExpanding(true);

    // Check Results section blocking rule first
    if (targetSec.title.toLowerCase().includes("result")) {
      const hasApprovedAnalysis =
        project.analysisOutputs &&
        project.analysisOutputs.length > 0 &&
        project.analysisOutputs.some(
          (out) => isAnalysisOutputApproved(out)
        );

      if (!hasApprovedAnalysis) {
        setIsExpanding(false);
        alert(
          "Drafting Results section blocked: No approved analysis outputs exist in project. Upload dataset and execute an approved analysis plan first."
        );
        return;
      }
    }

    let generatedText = "";
    try {
      const res = await authenticatedProjectFetch("/api/gemini/draft-section", project.id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: targetSec.title,
          canvas: project.canvas,
          sources: project.sources,
          claims: project.claims,
          analysisOutputs: project.analysisOutputs,
          targetWordCount: targetSec.targetWordLimit || 1200,
          focusStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status === "failed") {
        alert(`AI Drafting Unavailable: ${data.error || "Failed to generate section."}`);
        setIsExpanding(false);
        return;
      }

      generatedText = data.draft?.content || "";
    } catch (err: any) {
      alert(`AI Drafting Service Unavailable: ${err?.message || "Could not reach drafting server."}. Local substitution of synthetic content is disabled to protect scientific integrity.`);
      setIsExpanding(false);
      return;
    }

    setIsExpanding(false);

    // Validate prose before storage
    const grounding = validateAiGeneratedProse(generatedText, targetSec.title, project);

    setAiProposalState({
      isOpen: true,
      title: `AI Proposed Section: ${targetSec.title}`,
      featureUsed: "Evidence-First Section Drafting",
      targetSection: targetSec,
      proposedContent: generatedText,
      groundingStatus: grounding,
    });
  };

  const handleAcceptProposal = () => {
    if (!aiProposalState.targetSection) return;
    const words = aiProposalState.proposedContent.trim().split(/\s+/).filter(Boolean).length;
    const updated: ManuscriptSection = {
      ...aiProposalState.targetSection,
      content: aiProposalState.proposedContent,
      currentWordCount: words,
      status: "AI Suggested",
      state: "AI Suggested",
      lastEditedTimestamp: new Date().toISOString(),
    };

    onUpdateSection(updated);
    logLedgerEvent(aiProposalState.targetSection.title, "Accepted", `Accepted AI proposal for ${aiProposalState.targetSection.title}`);
    setAiProposalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleEditAndAcceptProposal = (editedText: string) => {
    if (!aiProposalState.targetSection) return;
    const words = editedText.trim().split(/\s+/).filter(Boolean).length;
    const updated: ManuscriptSection = {
      ...aiProposalState.targetSection,
      content: editedText,
      currentWordCount: words,
      status: "AI Suggested",
      state: "AI Suggested",
      lastEditedTimestamp: new Date().toISOString(),
    };

    onUpdateSection(updated);
    logLedgerEvent(aiProposalState.targetSection.title, "Edited", `Researcher edited and accepted AI proposal for ${aiProposalState.targetSection.title}`);
    setAiProposalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRejectProposal = () => {
    if (aiProposalState.targetSection) {
      logLedgerEvent(aiProposalState.targetSection.title, "Rejected", `Rejected AI proposal for ${aiProposalState.targetSection.title}`);
    }
    setAiProposalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleExpandFullPaper = async () => {
    if (!sections || sections.length === 0) return;
    setIsExpanding(true);

    let draftedCount = 0;
    const errors: string[] = [];

    for (const sec of sections) {
      // Check Results section blocking rule
      if (sec.title.toLowerCase().includes("result")) {
        const hasApprovedAnalysis =
          project.analysisOutputs &&
          project.analysisOutputs.length > 0 &&
          project.analysisOutputs.some(
            (out) => isAnalysisOutputApproved(out)
          );
        if (!hasApprovedAnalysis) {
          continue;
        }
      }

      try {
        const res = await authenticatedProjectFetch("/api/gemini/draft-section", project.id, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionTitle: sec.title,
            canvas: project.canvas,
            sources: project.sources,
            claims: project.claims,
            analysisOutputs: project.analysisOutputs,
            targetWordCount: sec.targetWordLimit || 1200,
            focusStyle,
          }),
        });

        const data = await res.json();
        if (res.ok && data.status !== "failed" && data.draft?.content) {
          const words = data.draft.content.trim().split(/\s+/).filter(Boolean).length;
          onUpdateSection({
            ...sec,
            content: data.draft.content,
            currentWordCount: words,
            status: "AI Suggested",
            state: "AI Suggested",
            lastEditedTimestamp: new Date().toISOString(),
          });
          draftedCount++;
        } else {
          errors.push(`${sec.title}: ${data.error || "Draft generation failed"}`);
        }
      } catch (err: any) {
        errors.push(`${sec.title}: ${err?.message || "Service unavailable"}`);
        break;
      }
    }

    setIsExpanding(false);
    if (errors.length > 0 && draftedCount === 0) {
      alert(`AI Drafting Service Unavailable: ${errors.join("; ")}. Local substitution of synthetic content is disabled to protect scientific integrity.`);
    } else if (draftedCount > 0) {
      alert(`Evidence-Grounded Assistant: Successfully drafted ${draftedCount} section(s) with 'AI Suggested' status for researcher review.`);
    }
  };

  // Literature Evidence & Statistical Findings Modal and Selection States
  const [showLiteratureEvidenceModal, setShowLiteratureEvidenceModal] = useState<boolean>(false);
  const [showStatisticalFindingsModal, setShowStatisticalFindingsModal] = useState<boolean>(false);
  const [evidenceSearchTerm, setEvidenceSearchTerm] = useState<string>("");

  const verifiedLiteratureEvidenceList = React.useMemo(
    () => getInsertableLiteratureEvidence(project),
    [project]
  );

  // 2. Gather strictly Researcher-Approved analysis outputs
  const approvedAnalysisOutputs = React.useMemo(
    () => getApprovedManuscriptAnalysisOutputs(project),
    [project]
  );

  const handleSelectAndInsertLiteratureEvidence = (
    item: InsertableLiteratureEvidence,
    formatMode: "blockquote" | "inline"
  ) => {
    if (!currentSection) return;
    try {
      const textToInsert = buildLiteratureEvidenceInsertion(item, project, formatMode);
      handleContentChange(currentSection.content + textToInsert);
      setShowLiteratureEvidenceModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Literature insertion blocked.");
    }
  };

  const handleSelectAndInsertStatisticalFinding = (
    output: (typeof approvedAnalysisOutputs)[0],
    insertMode: StatisticalInsertionMode
  ) => {
    if (!currentSection) return;
    try {
      const textToInsert = buildApprovedAnalysisInsertion(output, project, insertMode);
      handleContentChange(currentSection.content + textToInsert);
      setShowStatisticalFindingsModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Statistical insertion blocked.");
    }
  };

  const handleInsertCitation = (src: SourceRecord) => {
    if (!currentSection) return;
    const citationTag = ` ${formatInTextCitation([src], activeCslStyle, sources)}`;
    const updatedContent = currentSection.content + citationTag;
    handleContentChange(updatedContent);
  };

  const handleOpenCandidateSearchForMissing = (occ: CitationOccurrence) => {
    // Missing-citation resolution is a candidate search, never automatic source creation.
    alert(`Candidate Search Required: Please use Candidate Search in the Reference Library to find and import verified records for '${occ.authorOrRef}' (${occ.year || "N/A"}).`);
  };

  return (
    <div className="space-y-4">
      {/* Evidence-Grounded Manuscript Assistant Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-emerald-950/60 p-5 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base text-white">Evidence-Grounded Manuscript Assistant</h2>
                <button
                  onClick={() => setShowAssistantHelpModal(!showAssistantHelpModal)}
                  className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center space-x-1 underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Why Grounded Context?</span>
                </button>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Current Manuscript: <strong className="text-amber-300 font-mono">{totalWordCount} words</strong> (Target Length: <strong className="text-emerald-400 font-mono">3,500 – 6,000 words</strong>)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExpandCurrentSection}
              disabled={isExpanding}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isExpanding ? "Drafting with Assistant..." : "⚡ Evidence-Grounded Section Draft"}</span>
            </button>

            <button
              onClick={handleExpandFullPaper}
              disabled={isExpanding}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Zap className="w-4 h-4" />
              <span>{isExpanding ? "Drafting Manuscript Sections..." : "🚀 Draft Full Paper with Assistant"}</span>
            </button>
          </div>
        </div>

        {/* Deep Context Indicators & Controls */}
        <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-stone-700">
              <Sliders className="w-4 h-4 text-[#053B2E]" />
              <span className="font-semibold text-stone-900">Focus Discipline:</span>
              <select
                value={focusStyle}
                onChange={(e) => setFocusStyle(e.target.value as any)}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
              >
                <option value="General Scholarly Journal">General Scholarly Journal</option>
                <option value="Empirical Study">Empirical Study</option>
                <option value="Clinical Medicine">Clinical Medicine</option>
                <option value="Quantitative & Experimental">Quantitative & Experimental</option>
              </select>
            </div>

            <div className="hidden sm:flex items-center space-x-3 text-[11px] text-stone-600">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCanvasContext}
                  onChange={(e) => setUseCanvasContext(e.target.checked)}
                  className="rounded text-[#053B2E]"
                />
                <span>Canvas Context</span>
              </label>

              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSourceContext}
                  onChange={(e) => setUseSourceContext(e.target.checked)}
                  className="rounded text-[#053B2E]"
                />
                <span>Sources ({sources.length})</span>
              </label>

              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAnalysisContext}
                  onChange={(e) => setUseAnalysisContext(e.target.checked)}
                  className="rounded text-[#053B2E]"
                />
                <span>Analysis Outputs</span>
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-insert-literature-evidence"
              onClick={() => {
                if (verifiedLiteratureEvidenceList.length === 0) {
                  alert(
                    "No verified literature evidence available. Please add and verify sources or extract evidence passages in the Reference Library first."
                  );
                  return;
                }
                setShowLiteratureEvidenceModal(true);
              }}
              disabled={verifiedLiteratureEvidenceList.length === 0}
              title={
                verifiedLiteratureEvidenceList.length === 0
                  ? "No verified literature evidence available. Add and verify sources or extract passages in Reference Library first."
                  : `Select from ${verifiedLiteratureEvidenceList.length} verified literature evidence record(s)`
              }
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center space-x-1.5 ${
                verifiedLiteratureEvidenceList.length === 0
                  ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60"
                  : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs cursor-pointer"
              }`}
            >
              <BookOpen className="w-3 h-3 text-[#053B2E]" />
              <span>+ Literature Evidence ({verifiedLiteratureEvidenceList.length})</span>
            </button>

            <button
              id="btn-insert-statistical-findings"
              onClick={() => {
                if (approvedAnalysisOutputs.length === 0) {
                  alert(
                    "No analysis outputs Approved for Manuscript are available. Complete analysis review and explicit manuscript approval in the Data Lab first."
                  );
                  return;
                }
                setShowStatisticalFindingsModal(true);
              }}
              disabled={approvedAnalysisOutputs.length === 0}
              title={
                approvedAnalysisOutputs.length === 0
                  ? "No analysis outputs Approved for Manuscript are available."
                  : `Select from ${approvedAnalysisOutputs.length} output(s) Approved for Manuscript`
              }
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center space-x-1.5 ${
                approvedAnalysisOutputs.length === 0
                  ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60"
                  : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs cursor-pointer"
              }`}
            >
              <BarChart3 className="w-3 h-3 text-emerald-600" />
              <span>+ Statistical Findings ({approvedAnalysisOutputs.length})</span>
            </button>
          </div>
        </div>

        {showAssistantHelpModal && (
          <div className="bg-stone-900 text-stone-100 border border-stone-800 p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-serif font-bold text-emerald-400 text-sm">Evidence-Grounded Manuscript Assistant</h4>
            <p className="text-stone-300">
              Assists drafting by synthesizing strictly verified data directly from your Idea Canvas, Reference Library, and Data Lab outputs.
            </p>
          </div>
        )}
      </div>

      {/* Top Bar Controls */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center text-[#053B2E]">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-stone-900">
              Scholarly Manuscript Editor
            </h2>
            <p className="text-xs text-stone-500">
              Section-by-section drafting with CSL citation rendering & evidence traceability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Citation Verification Utility Trigger */}
          <button
            onClick={() => setShowAuditModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition ${
              verificationReport.missingCount > 0
                ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Citation Audit: <strong>{verificationReport.overallScore}% Verified</strong></span>
            {verificationReport.missingCount > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {verificationReport.missingCount} Missing
              </span>
            )}
          </button>

          {/* CSL Style Switcher & Style Configuration Trigger */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setRightDrawerTab("config")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition ${
                rightDrawerTab === "config"
                  ? "bg-[#053B2E] border-[#053B2E] text-white"
                  : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-stone-400" />
              <span className="max-w-[150px] truncate">
                Style: <strong>{editProfile.journalName}</strong>
              </span>
            </button>

            <select
              value={activeCslStyle}
              onChange={(e) => onChangeCslStyle(e.target.value as CSLStyleOption["id"])}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
            >
              {CSL_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name} ({style.citationFormat})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[70vh]">
        {/* Left Panel: Manuscript Outline & Sections */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between overflow-y-auto space-y-4">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-2.5 mb-3">
              Manuscript Sections
            </h3>
            <div className="space-y-2">
              {sections.map((sec) => {
                const isSelected = sec.id === currentSection?.id;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`p-3 rounded-lg text-xs font-medium transition space-y-2 border cursor-pointer ${
                      isSelected
                        ? "bg-[#053B2E] text-white border-[#053B2E] shadow-2xs"
                        : "bg-stone-50/60 text-stone-800 hover:bg-stone-100 border-stone-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{sec.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isSelected ? "bg-[#042d23] text-stone-200" : "bg-stone-200 text-stone-700"}`}>
                        {sec.currentWordCount}w
                      </span>
                    </div>

                    <div className={`flex items-center justify-between text-[10px] pt-1 border-t ${isSelected ? "border-emerald-800/50 text-stone-300" : "border-stone-200 text-stone-500"}`}>
                      <span className="truncate">
                        Target: {sec.targetWordLimit || 1200}w
                      </span>
                      <button
                        onClick={(e) => handleExpandSpecificSection(sec, e)}
                        disabled={isExpanding}
                        title="Draft section using evidence"
                        className={`px-2 py-0.5 rounded font-semibold flex items-center space-x-1 transition shrink-0 disabled:opacity-50 ${
                          isSelected ? "bg-amber-400 text-stone-900 hover:bg-amber-300" : "bg-[#053B2E] text-white hover:bg-[#053B2E]/90"
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Expand</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs space-y-1">
            <span className="text-stone-500 block text-[10px] uppercase font-mono tracking-wider">Total Word Count</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">
                {totalWordCount} Words
              </span>
              <span className="text-[10px] text-stone-600 font-medium">Target: ~4,500w</span>
            </div>
          </div>
        </div>

        {/* Centre Panel: Rich Text Editor */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-between space-y-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {currentSection?.title}
                </h3>
                <span className="bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-stone-200">
                  {currentSection?.state || "Draft"}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                {currentSection?.currentWordCount}w / Target: {currentSection?.targetWordLimit || 1200}w
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedSectionAuditHistory(currentSection)}
                className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium flex items-center space-x-1 border border-stone-200"
                title="View Audit Trail"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Audit</span>
              </button>

              <button
                onClick={handleExpandCurrentSection}
                disabled={isExpanding}
                className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{isExpanding ? "Expanding..." : "Expand Section"}</span>
              </button>
            </div>
          </div>

          {/* Section State Machine Transition Toolbar */}
          {currentSection && (
            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-zinc-400 font-mono text-[11px] font-bold">
                Next State Transitions for '{currentSection.title}':
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(SECTION_TRANSITIONS[currentSection.state || "Empty"] || []).map((targetState) => (
                  <button
                    key={targetState}
                    onClick={() => handleInitiateSectionTransition(currentSection, targetState)}
                    className={`font-bold text-[11px] px-2.5 py-1 rounded-xl transition flex items-center space-x-1 shadow-sm ${
                      targetState === "Approved" || targetState === "Locked"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    <span>Advance to '{targetState}'</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Tone & Complexity Control Bar */}
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-950/80 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-200 block leading-tight">
                  Tone & Complexity Toggle
                </span>
                <span className="text-[10px] text-zinc-400">
                  Target Section: <strong className="text-indigo-300">{currentSection?.title}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 space-x-1">
              {(["Concise Technical", "Narrative Descriptive", "Formal Academic"] as const).map((toneOption) => {
                const isActive = currentSectionTone === toneOption;
                return (
                  <button
                    key={toneOption}
                    onClick={() => handleSectionToneChange(toneOption)}
                    title={`Set writing style to ${toneOption} for ${currentSection?.title}`}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                    }`}
                  >
                    {toneOption === "Concise Technical" && <span>⚡ Concise Technical</span>}
                    {toneOption === "Narrative Descriptive" && <span>📖 Narrative Descriptive</span>}
                    {toneOption === "Formal Academic" && <span>🏛️ Formal Academic</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Area */}
          <textarea
            value={currentSection?.content || ""}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full min-h-[380px] flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-xs font-serif leading-relaxed text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none transition"
            placeholder="Draft manuscript section here..."
          />

          {/* Word count & CSL Live Render Preview */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            <span>Word Count: <strong className="text-white">{currentSection?.currentWordCount}</strong></span>
            <span className="font-mono text-indigo-400">
              Style Output ({editProfile.journalName}): {formatCustomInTextCitation(sources.slice(0, 2), editProfile)}
            </span>
          </div>
        </div>

        {/* Right Panel: Evidence & Outlet Drawer */}
        <div className="lg:col-span-3 bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex flex-col justify-between overflow-y-auto space-y-4">
          <div>
            {/* Drawer Tabs */}
            <div className="flex items-center space-x-1 border-b border-zinc-800 pb-3 mb-4 overflow-x-auto">
              <button
                onClick={() => setRightDrawerTab("evidence")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  rightDrawerTab === "evidence" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                Evidence
              </button>
              <button
                onClick={() => setRightDrawerTab("integrity")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                  rightDrawerTab === "integrity"
                    ? "bg-amber-600 text-white"
                    : verificationReport.missingCount > 0
                    ? "text-amber-400 hover:bg-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Audit</span>
                {verificationReport.missingCount > 0 && (
                  <span className="bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                    {verificationReport.missingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightDrawerTab("outlet")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  rightDrawerTab === "outlet" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                Outlet
              </button>
              <button
                onClick={() => setRightDrawerTab("csl")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  rightDrawerTab === "csl" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                Bibliography
              </button>
              <button
                onClick={() => setRightDrawerTab("config")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                  rightDrawerTab === "config" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Style Config</span>
              </button>
            </div>

            {/* Evidence List */}
            {rightDrawerTab === "evidence" && (
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Insert Citation into Text</h4>
                {sources.map((src) => (
                  <div key={src.id} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-xs space-y-2">
                    <p className="font-semibold text-zinc-200 line-clamp-1">{src.title}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">{src.authors[0]} ({src.year})</span>
                      <button
                        onClick={() => handleInsertCitation(src)}
                        className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-500 transition font-bold"
                      >
                        + Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Citation Verification & Integrity Drawer Panel */}
            {rightDrawerTab === "integrity" && (
              <div className="space-y-3.5 text-xs">
                {/* Score Header */}
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 text-xs flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Audit Score</span>
                    </span>
                    <span className={`font-mono font-bold text-xs ${verificationReport.overallScore >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                      {verificationReport.overallScore}% Verified
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${verificationReport.overallScore >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${verificationReport.overallScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                    <span>Found: {verificationReport.totalCitationsFound}</span>
                    <span>Matched: {verificationReport.matchedCount}</span>
                    <span className="text-amber-400 font-semibold">Missing: {verificationReport.missingCount}</span>
                  </div>
                </div>

                {/* Warnings */}
                {verificationReport.styleWarnings.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-2xl space-y-1 text-amber-300 text-[11px]">
                    <div className="flex items-center space-x-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Format Mismatch Alert</span>
                    </div>
                    {verificationReport.styleWarnings.map((w, i) => (
                      <p key={i}>{w}</p>
                    ))}
                  </div>
                )}

                {/* Missing References */}
                {verificationReport.missingCitations.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-amber-400">
                      <span>Missing In-Text References ({verificationReport.missingCitations.length})</span>
                    </div>
                    {verificationReport.missingCitations.map((occ) => (
                      <div key={occ.id} className="bg-zinc-950 p-3 rounded-2xl border border-amber-500/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">{occ.authorOrRef} ({occ.year || "n.d."})</span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Unmatched</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 italic line-clamp-2">{occ.excerpt}</p>
                        <button
                          onClick={() => handleOpenCandidateSearchForMissing(occ)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition"
                        >
                          <Search className="w-3 h-3" />
                          <span>Candidate Search</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl text-[11px] text-emerald-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All in-text citations are verified in the Source Library!</span>
                  </div>
                )}

                {/* Uncited Library Sources */}
                {verificationReport.uncitedSources.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Uncited Library Sources ({verificationReport.uncitedSources.length})
                    </span>
                    {verificationReport.uncitedSources.slice(0, 3).map(({ source: src }) => (
                      <div key={src.id} className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 text-[11px] space-y-1">
                        <p className="font-semibold text-zinc-300 truncate">{src.title}</p>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500">{src.authors[0]} ({src.year})</span>
                          <button
                            onClick={() => handleInsertCitation(src)}
                            className="text-indigo-400 hover:text-indigo-300 font-bold"
                          >
                            + Cite in Text
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bibliographic Metadata Issues */}
                {verificationReport.bibliographicIssues.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Metadata Inconsistencies ({verificationReport.bibliographicIssues.length})
                    </span>
                    {verificationReport.bibliographicIssues.slice(0, 3).map(({ source: src, missingFields }) => (
                      <div key={src.id} className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 text-[11px] space-y-1">
                        <p className="font-semibold text-zinc-300 truncate">{src.title}</p>
                        <p className="text-[10px] text-amber-400">Missing: {missingFields.join(", ")}</p>
                        <button
                          onClick={() => alert("DOI Lookup or Candidate Search is required to verify and populate official bibliographic metadata.")}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1"
                        >
                          <Search className="w-3 h-3 text-indigo-400" />
                          <span>Verify Metadata</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowAuditModal(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View Deep Verification Report</span>
                </button>
              </div>
            )}

            {/* Target Outlet Requirements */}
            {rightDrawerTab === "outlet" && selectedTargetOutlet && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-white">{selectedTargetOutlet.title}</h4>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-zinc-300">
                  <p>Word Limit: <strong className="text-white">{selectedTargetOutlet.wordLimit}</strong></p>
                  <p>Citation Style: <strong className="text-indigo-400">{selectedTargetOutlet.citationStyle}</strong></p>
                  <p>Figures/Tables Limit: <strong className="text-white">{selectedTargetOutlet.figureTableLimit}</strong></p>
                </div>
              </div>
            )}

            {/* Live Bibliography Preview */}
            {rightDrawerTab === "csl" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">Live Bibliography Output</h4>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {editProfile.journalName} ({editProfile.referenceOrdering})
                  </span>
                </div>
                <div className="space-y-2 text-[11px] font-serif text-zinc-300">
                  {sortSourcesByProfile(sources, editProfile).map((src, idx) => (
                    <div key={src.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 leading-relaxed">
                      {formatCustomBibliographyEntry(src, idx, editProfile)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persistent Style Configuration Sidebar Panel */}
            {rightDrawerTab === "config" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Journal Style Configuration</span>
                  </h4>
                  <span className="text-[10px] bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                    {editProfile.isPreset ? "Preset" : "Custom Variation"}
                  </span>
                </div>

                {saveNotification && (
                  <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-2.5 rounded-xl text-[11px] font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{saveNotification}</span>
                  </div>
                )}

                {/* Profile Selection & Actions Bar */}
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Active Journal Style Variation Profile
                    </label>
                    <select
                      value={editProfile.id}
                      onChange={(e) => handleProfileSelect(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      {savedProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.journalName} {p.isPreset ? "(Preset)" : "(Custom)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDuplicateProfile}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 transition"
                    >
                      <Copy className="w-3 h-3 text-indigo-400" />
                      <span>Duplicate Profile</span>
                    </button>

                    {!editProfile.isPreset ? (
                      <button
                        onClick={() => handleDeleteProfile(editProfile.id)}
                        className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 transition"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Delete Profile</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleResetProfile}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 transition"
                      >
                        <RotateCcw className="w-3 h-3 text-zinc-400" />
                        <span>Reset Defaults</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Inputs for Custom Variation */}
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3.5 text-zinc-300">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Target Journal Profile Title
                    </label>
                    <input
                      type="text"
                      value={editProfile.journalName}
                      onChange={(e) => setEditProfile({ ...editProfile, journalName: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Base CSL Foundation Style
                    </label>
                    <select
                      value={editProfile.baseCslStyle}
                      onChange={(e) => {
                        const baseId = e.target.value as CSLStyleOption["id"];
                        setEditProfile({ ...editProfile, baseCslStyle: baseId });
                        onChangeCslStyle(baseId);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {CSL_STYLES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.citationFormat})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Reference Ordering (Bibliography)
                    </label>
                    <select
                      value={editProfile.referenceOrdering}
                      onChange={(e) => setEditProfile({ ...editProfile, referenceOrdering: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="order_of_appearance">Order of Appearance (1, 2, 3... in text)</option>
                      <option value="alphabetical">Alphabetical (Author Last Name A-Z)</option>
                      <option value="year_descending">Chronological (Newest Publication First)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      In-Text Citation & Footnote Style
                    </label>
                    <select
                      value={editProfile.footnotePreference}
                      onChange={(e) => setEditProfile({ ...editProfile, footnotePreference: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="inline_bracket">Inline Brackets [1, 2]</option>
                      <option value="superscript_marker">Superscript Numbers ¹</option>
                      <option value="numbered_footnote">Numbered Footnote Symbol ¹</option>
                      <option value="author_year_parenthetical">Author-Date Parenthetical (Smith et al., 2024)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Author Name Format
                    </label>
                    <select
                      value={editProfile.authorNameFormat}
                      onChange={(e) => setEditProfile({ ...editProfile, authorNameFormat: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="last_first_initial">Last Name, First Initial (e.g. Smith, J.P.)</option>
                      <option value="first_last">First Initial Last Name (e.g. J.P. Smith)</option>
                      <option value="last_only">Last Name Only (e.g. Smith)</option>
                      <option value="full_name font">Full Name as Entered (e.g. John P. Smith)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Max Authors (et al.)
                      </label>
                      <select
                        value={editProfile.maxAuthorsBeforeEtAl}
                        onChange={(e) => setEditProfile({ ...editProfile, maxAuthorsBeforeEtAl: parseInt(e.target.value, 10) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value={1}>1 Author</option>
                        <option value={2}>2 Authors</option>
                        <option value={3}>3 Authors</option>
                        <option value={6}>6 Authors</option>
                        <option value={10}>10 Authors</option>
                        <option value={99}>All Authors</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Page Numbering
                      </label>
                      <select
                        value={editProfile.pageNumberFormat}
                        onChange={(e) => setEditProfile({ ...editProfile, pageNumberFormat: e.target.value as any })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="full">Full Range (102-118)</option>
                        <option value="abbreviated">Abbreviated (102-18)</option>
                        <option value="start_page_only">Start Page (102)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Title Case Preference
                    </label>
                    <select
                      value={editProfile.titleCasePreference}
                      onChange={(e) => setEditProfile({ ...editProfile, titleCasePreference: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="sentence_case">Sentence case (First word capitalized)</option>
                      <option value="title_case">Title Case (Major Words Capitalized)</option>
                      <option value="as_entered">As Entered in Database</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editProfile.includeDoi}
                        onChange={(e) => setEditProfile({ ...editProfile, includeDoi: e.target.checked })}
                        className="rounded text-indigo-500 bg-zinc-900 border-zinc-700"
                      />
                      <span>Include DOI Links</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editProfile.includeUrl}
                        onChange={(e) => setEditProfile({ ...editProfile, includeUrl: e.target.checked })}
                        className="rounded text-indigo-500 bg-zinc-900 border-zinc-700"
                      />
                      <span>Include URLs</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        In-Text Prefix
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ref. "
                        value={editProfile.customInTextPrefix || ""}
                        onChange={(e) => setEditProfile({ ...editProfile, customInTextPrefix: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        In-Text Suffix
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. (see text)"
                        value={editProfile.customInTextSuffix || ""}
                        onChange={(e) => setEditProfile({ ...editProfile, customInTextSuffix: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Variation Action Button */}
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration to Session</span>
                </button>

                {/* Live Render Preview */}
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                  <h5 className="font-bold text-zinc-200 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Citation & Reference Preview</span>
                  </h5>
                  <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] space-y-2">
                    <p className="text-zinc-400">
                      In-Text: <span className="text-indigo-300 font-mono font-bold">{formatCustomInTextCitation(sources.slice(0, 2), editProfile)}</span>
                    </p>
                    {sources[0] && (
                      <div className="text-zinc-200 font-serif border-t border-zinc-800 pt-1.5 leading-relaxed">
                        {formatCustomBibliographyEntry(sources[0], 0, editProfile)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Citation Verification Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>Manuscript Citation Verification & Reference Audit</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Automated cross-referencing of in-text citations against the Source Library and bibliographic metadata.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Summary Metric Bar */}
            <div className="p-6 bg-zinc-950 border-b border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Overall Audit Score</span>
                <p className={`text-2xl font-black mt-1 font-mono ${verificationReport.overallScore >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                  {verificationReport.overallScore}%
                </p>
                <span className="text-[10px] text-zinc-500">CSL: {activeCslStyle.toUpperCase()}</span>
              </div>

              <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">In-Text Citations</span>
                <p className="text-2xl font-black mt-1 font-mono text-white">
                  {verificationReport.totalCitationsFound}
                </p>
                <span className="text-[10px] text-emerald-400 font-semibold">{verificationReport.matchedCount} Verified in Library</span>
              </div>

              <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Missing References</span>
                <p className={`text-2xl font-black mt-1 font-mono ${verificationReport.missingCount > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                  {verificationReport.missingCount}
                </p>
                {verificationReport.missingCount > 0 ? (
                  <span className="text-[10px] text-amber-300 font-bold">Candidate Search Required</span>
                ) : (
                  <span className="text-[10px] text-emerald-400">No missing citations</span>
                )}
              </div>

              <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bibliographic Issues</span>
                <p className={`text-2xl font-black mt-1 font-mono ${verificationReport.bibliographicIssuesCount > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                  {verificationReport.bibliographicIssuesCount}
                </p>
                <span className="text-[10px] text-zinc-400">Missing DOI / Volume</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAuditSubFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    auditSubFilter === "all" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  All In-Text Citations ({verificationReport.occurrences.length})
                </button>
                <button
                  onClick={() => setAuditSubFilter("missing")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    auditSubFilter === "missing" ? "bg-amber-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Missing References ({verificationReport.missingCount})
                </button>
                <button
                  onClick={() => setAuditSubFilter("uncited")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    auditSubFilter === "uncited" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Uncited Library Sources ({verificationReport.uncitedSourcesCount})
                </button>
                <button
                  onClick={() => setAuditSubFilter("issues")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    auditSubFilter === "issues" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Metadata Issues ({verificationReport.bibliographicIssuesCount})
                </button>
              </div>

              {verificationReport.missingCount > 0 && (
                <div className="bg-amber-950/60 border border-amber-500/40 text-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Candidate Search Required for {verificationReport.missingCount} Item(s)</span>
                </div>
              )}
            </div>

            {/* Audit Content List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {auditSubFilter === "all" && (
                <div className="space-y-3">
                  {verificationReport.occurrences.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">
                      No in-text citations found in current manuscript draft.
                    </div>
                  ) : (
                    verificationReport.occurrences.map((occ) => (
                      <div
                        key={occ.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2 transition ${
                          occ.status === "matched"
                            ? "bg-zinc-950 border-zinc-800/80"
                            : "bg-amber-950/20 border-amber-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{occ.authorOrRef} ({occ.year || "n.d."})</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                              Section: {occ.sectionTitle}
                            </span>
                          </div>
                          {occ.status === "matched" ? (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Verified in Library</span>
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Missing Reference</span>
                              </span>
                              <button
                                onClick={() => handleOpenCandidateSearchForMissing(occ)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg font-bold text-[10px] transition"
                              >
                                Candidate Search
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-zinc-400 font-serif italic bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/60">
                          {occ.excerpt}
                        </p>

                        {occ.matchedSource && (
                          <div className="text-[11px] text-zinc-300 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                            <span className="truncate">Source Record: <strong>{occ.matchedSource.title}</strong></span>
                            <span className="text-zinc-500 font-mono text-[10px] shrink-0 ml-2">DOI: {occ.matchedSource.doi || "N/A"}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {auditSubFilter === "missing" && (
                <div className="space-y-3">
                  {verificationReport.missingCitations.length === 0 ? (
                    <div className="text-center py-10 text-emerald-400 text-xs font-semibold flex flex-col items-center space-y-2">
                      <CheckCircle2 className="w-8 h-8" />
                      <span>Zero missing references detected! All in-text citations are matched in the Source Library.</span>
                    </div>
                  ) : (
                    verificationReport.missingCitations.map((occ) => (
                      <div key={occ.id} className="bg-amber-950/20 border border-amber-500/40 p-4 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 text-sm">{occ.authorOrRef} ({occ.year || "n.d."})</span>
                          <button
                            onClick={() => handleOpenCandidateSearchForMissing(occ)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition shadow"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Candidate Search</span>
                          </button>
                        </div>
                        <p className="text-zinc-300 font-serif italic bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                          {occ.excerpt}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {auditSubFilter === "uncited" && (
                <div className="space-y-3">
                  {verificationReport.uncitedSources.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">
                      All sources in the Source Library are cited in the manuscript prose!
                    </div>
                  ) : (
                    verificationReport.uncitedSources.map(({ source: src, reason }) => (
                      <div key={src.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{src.title}</span>
                          <button
                            onClick={() => {
                              handleInsertCitation(src);
                              setShowAuditModal(false);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition"
                          >
                            + Insert Citation into Prose
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Authors: {src.authors.join(", ")} ({src.year})</span>
                          <span className="text-amber-400 font-mono text-[10px]">{reason}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {auditSubFilter === "issues" && (
                <div className="space-y-3">
                  {verificationReport.bibliographicIssues.length === 0 ? (
                    <div className="text-center py-10 text-emerald-400 text-xs font-semibold flex flex-col items-center space-y-2">
                      <CheckCircle2 className="w-8 h-8" />
                      <span>All source records have complete bibliographic metadata!</span>
                    </div>
                  ) : (
                    verificationReport.bibliographicIssues.map(({ source: src, missingFields, description }) => (
                      <div key={src.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{src.title}</span>
                          <button
                            onClick={() => alert("Candidate Search / Crossref lookup is required to populate official bibliographic fields.")}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Lookup Metadata</span>
                          </button>
                        </div>
                        <p className="text-amber-300 text-[11px] font-mono">{description}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">Audit Last Executed: {new Date(verificationReport.timestamp).toLocaleTimeString()}</span>
              <button
                onClick={() => setShowAuditModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-bold transition"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Approval Modal */}
      {sectionApprovalModalConfig.section && (
        <ApprovalModal
          isOpen={sectionApprovalModalConfig.isOpen}
          onClose={() => setSectionApprovalModalConfig({ isOpen: false, section: null, targetState: "Approved" })}
          entityType="ManuscriptSection"
          entityId={sectionApprovalModalConfig.section.id}
          entityTitle={sectionApprovalModalConfig.section.title}
          currentState={sectionApprovalModalConfig.section.state || "Empty"}
          targetState={sectionApprovalModalConfig.targetState}
          evidenceRecordIds={sectionApprovalModalConfig.section.citationIds}
          onConfirmApproval={(reason, evidenceRecordIds) => {
            if (sectionApprovalModalConfig.section) {
              executeSectionTransition(
                sectionApprovalModalConfig.section,
                sectionApprovalModalConfig.targetState,
                reason,
                evidenceRecordIds
              );
            }
          }}
        />
      )}

      {/* Section State History Modal */}
      {selectedSectionAuditHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 max-w-xl w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <History className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Section Audit Trail: {selectedSectionAuditHistory.title}</h3>
              </div>
              <button
                onClick={() => setSelectedSectionAuditHistory(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(selectedSectionAuditHistory.stateHistory || []).length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No transition audit records found.</p>
              ) : (
                selectedSectionAuditHistory.stateHistory?.map((tr) => (
                  <div key={tr.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-indigo-300 font-bold">
                        {tr.fromState} → {tr.toState}
                      </span>
                      <span className="text-zinc-500">{new Date(tr.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-300 font-sans text-[11px]">{tr.reason}</p>
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-900">
                      <span>Actor: {tr.actorEmail}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 6 AI Proposal Modal */}
      <AiProposalModal
        isOpen={aiProposalState.isOpen}
        title={aiProposalState.title}
        featureUsed={aiProposalState.featureUsed}
        manuscriptSection={aiProposalState.targetSection?.title}
        proposedContent={aiProposalState.proposedContent}
        groundingStatus={aiProposalState.groundingStatus}
        onAccept={handleAcceptProposal}
        onEditAndAccept={handleEditAndAcceptProposal}
        onReject={handleRejectProposal}
        onClose={() => setAiProposalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Literature Evidence Selection Modal */}
      {showLiteratureEvidenceModal && (
        <div
          id="modal-literature-evidence-selector"
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 max-w-2xl w-full rounded-3xl p-6 space-y-4 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <BookOpen className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Insert Verified Literature Evidence
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Select a researcher-reviewed evidence passage with verified source provenance. Abstracts and unreviewed text cannot be inserted.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLiteratureEvidenceModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search verified passages, source titles, or authors..."
                value={evidenceSearchTerm}
                onChange={(e) => setEvidenceSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Evidence List */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {verifiedLiteratureEvidenceList.filter(
                (item) =>
                  !evidenceSearchTerm ||
                  item.sourceTitle.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                  item.passageText.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                  item.sourceId.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                  item.sourceAuthors.some((a) =>
                    a.toLowerCase().includes(evidenceSearchTerm.toLowerCase())
                  )
              ).length === 0 ? (
                <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                  <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">
                    No matching verified literature evidence records found.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Add verified sources or extract verified passages in the Reference Library first.
                  </p>
                </div>
              ) : (
                verifiedLiteratureEvidenceList
                  .filter(
                    (item) =>
                      !evidenceSearchTerm ||
                      item.sourceTitle.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                      item.passageText.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                      item.sourceId.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                      item.sourceAuthors.some((a) =>
                        a.toLowerCase().includes(evidenceSearchTerm.toLowerCase())
                      )
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 hover:border-emerald-500/40 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-xs">{item.sourceTitle}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>
                              {item.sourceAuthors.length > 0
                                ? item.sourceAuthors.join(", ")
                                : "Lead Author"}{" "}
                              ({item.sourceYear || "n.d."})
                            </span>
                            <span className="font-mono text-emerald-400">
                              [Source ID: {item.sourceId}]
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {item.location && (
                            <span className="text-[9px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                              {item.location}
                            </span>
                          )}
                          <span className="text-[9px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                            {item.verificationBadge}
                          </span>
                        </div>
                      </div>

                      {/* Evidence Passage */}
                      <blockquote className="bg-zinc-900/90 border-l-2 border-emerald-500/60 p-3 rounded-r-xl text-xs text-zinc-200 font-serif italic leading-relaxed">
                        "{item.passageText}"
                      </blockquote>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        Provenance: {item.provenance.provider} · Retrieved {item.provenance.retrievedAt}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={() => handleSelectAndInsertLiteratureEvidence(item, "inline")}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Insert In-line
                        </button>
                        <button
                          onClick={() => handleSelectAndInsertLiteratureEvidence(item, "blockquote")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Insert as Blockquote</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[11px]">
                {verifiedLiteratureEvidenceList.length} verified evidence record(s) in project
              </span>
              <button
                onClick={() => setShowLiteratureEvidenceModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistical Findings Selection Modal */}
      {showStatisticalFindingsModal && (
        <div
          id="modal-statistical-findings-selector"
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 max-w-2xl w-full rounded-3xl p-6 space-y-4 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <BarChart3 className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Insert Findings Approved for Manuscript
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Select an empirical output with state Approved for Manuscript. Only its recorded values can be inserted; no fallback numbers are generated.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatisticalFindingsModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approved Outputs List */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {approvedAnalysisOutputs.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                  <BarChart3 className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">
                    No analysis outputs Approved for Manuscript found.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Upload a verified dataset and execute an approved analysis plan in the Data Lab first.
                  </p>
                </div>
              ) : (
                approvedAnalysisOutputs.map((out) => {
                  const plan = project.analysisPlans?.find((p) => p.id === out.analysisPlanId);
                  const planTitle = plan?.title || out.softwareEnvironment || "Empirical Statistical Analysis";

                  return (
                    <div
                      key={out.id}
                      className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 hover:border-emerald-500/40 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-xs">{planTitle}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                            <span className="font-mono text-emerald-400">[Output ID: {out.id}]</span>
                            {out.executionTimestamp && (
                              <span>
                                Executed: {new Date(out.executionTimestamp).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          Approved for Manuscript
                        </span>
                      </div>

                      {/* Summary Text if present */}
                      {out.summaryText && (
                        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            Recorded Summary:
                          </p>
                          <p>{out.summaryText}</p>
                        </div>
                      )}

                      {/* Actual Quantitative Metrics */}
                      <div className="space-y-1.5 text-xs">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Verified Quantitative Metrics:
                        </p>
                        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          {out.numericResults &&
                            Object.entries(out.numericResults).map(([k, v]) => (
                              <div key={k} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                <span className="text-zinc-400 text-[10px] block capitalize">
                                  {k.replace(/_/g, " ")}
                                </span>
                                <span className="font-mono font-bold text-white">
                                  {typeof v === "number" ? v.toFixed(4) : String(v)}
                                </span>
                              </div>
                            ))}

                          {out.pValues &&
                            out.pValues.map((pv, idx) => (
                              <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                <span className="text-zinc-400 text-[10px] block truncate">{pv.test}</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {pv.formatted || `p = ${pv.pValue}`}
                                </span>
                              </div>
                            ))}

                          {out.effectSizes &&
                            out.effectSizes.map((es, idx) => (
                              <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                <span className="text-zinc-400 text-[10px] block truncate">{es.metric}</span>
                                <span className="font-mono font-bold text-emerald-300">
                                  {es.value}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-zinc-900">
                        {out.summaryText && (
                          <button
                            onClick={() => handleSelectAndInsertStatisticalFinding(out, "summary_only")}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            Insert Summary Only
                          </button>
                        )}
                        <button
                          onClick={() => handleSelectAndInsertStatisticalFinding(out, "metrics_only")}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Insert Metrics Only
                        </button>
                        <button
                          onClick={() => handleSelectAndInsertStatisticalFinding(out, "full")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Insert Full Findings</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[11px]">
                {approvedAnalysisOutputs.length} approved analysis output(s) available
              </span>
              <button
                onClick={() => setShowStatisticalFindingsModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
