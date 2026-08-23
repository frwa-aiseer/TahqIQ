import React, { useState } from "react";
import { ClaimItem, SourceRecord, ClaimState, LinkedEvidenceItem, EvidenceRecord, ClaimEvidenceLink, ClaimEvidenceRelationship, ManuscriptSentenceClaimLink, ProjectState } from "../../types";
import { createEvidenceRecord } from "../../lib/evidenceRecords";
import { createClaimEvidenceLink, reviewClaimEvidenceLink, upsertClaimEvidenceLink } from "../../lib/claimEvidenceGraph";
import { requestTrustedTransition } from "../../lib/trustedTransitionsClient";
import { performStateTransition, CLAIM_TRANSITIONS } from "../../lib/stateMachines";
import { ApprovalModal } from "../ApprovalModal";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  History,
  GitCommit,
  ChevronRight,
  Link as LinkIcon,
  PlusCircle,
  FileText,
  Bookmark
} from "lucide-react";

interface ClaimMatrixViewProps {
  claims: ClaimItem[];
  sources: SourceRecord[];
  evidenceRecords: EvidenceRecord[];
  claimEvidenceLinks: ClaimEvidenceLink[];
  manuscriptSentenceClaimLinks: ManuscriptSentenceClaimLink[];
  onUpdateClaims: (claims: ClaimItem[]) => void;
  onUpdateEvidenceRecords: (evidenceRecords: EvidenceRecord[]) => void;
  onUpdateClaimEvidenceLinks: (links: ClaimEvidenceLink[]) => void;
  projectId: string;
  trustedTransitionRevision: number;
  onTrustedProjectUpdate: (project: ProjectState) => void;
}

export const ClaimMatrixView: React.FC<ClaimMatrixViewProps> = ({
  claims,
  sources,
  evidenceRecords,
  claimEvidenceLinks,
  manuscriptSentenceClaimLinks,
  onUpdateClaims,
  onUpdateEvidenceRecords,
  onUpdateClaimEvidenceLinks,
  projectId,
  trustedTransitionRevision,
  onTrustedProjectUpdate,
}) => {
  const { user } = useAuth();
  const [newClaimText, setNewClaimText] = useState("");
  const [newSection, setNewSection] = useState("Introduction");

  // Evidence Linker Drawer State
  const [activeLinkingClaim, setActiveLinkingClaim] = useState<ClaimItem | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [evidenceLocation, setEvidenceLocation] = useState("");
  const [paragraphOrChunkRef, setParagraphOrChunkRef] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [quotePassage, setQuotePassage] = useState("");
  const [selectedExistingEvidenceId, setSelectedExistingEvidenceId] = useState("");
  const [evidenceRelationship, setEvidenceRelationship] = useState<ClaimEvidenceRelationship>("Supports");
  const [linkConfidence, setLinkConfidence] = useState("1");
  const [expandedSentenceId, setExpandedSentenceId] = useState<string | null>(null);

  const [approvalModalConfig, setApprovalModalConfig] = useState<{
    isOpen: boolean;
    claim: ClaimItem | null;
    targetState: ClaimState;
  }>({
    isOpen: false,
    claim: null,
    targetState: "Verified",
  });

  const [selectedClaimForHistory, setSelectedClaimForHistory] = useState<ClaimItem | null>(null);

  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim()) return;

    // Requirement 8: A new claim starts Unlinked, Unverified, and Not Approved.
    const newClaim: ClaimItem = {
      id: `clm-${Date.now()}`,
      claimText: newClaimText,
      claimType: "Associational claim",
      manuscriptSection: newSection,
      importance: "High",
      linkedSourceIds: [],
      linkedEvidence: [],
      evidenceRelationship: "No support identified",
      verificationStatus: "Unverified",
      state: "Draft",
      stateHistory: [
        {
          id: `tr-${Date.now()}`,
          entityType: "Claim",
          entityId: `clm-${Date.now()}`,
          fromState: "Draft",
          toState: "Draft",
          actorUid: user?.uid || "user-local",
          actorEmail: user?.email || "researcher@local",
          timestamp: new Date().toISOString(),
          reason: "Registered new manuscript claim (Unlinked, Unverified, Not Approved)",
          evidenceRecordIds: [],
        },
      ],
      isResearcherApproved: false,
    };

    onUpdateClaims([...claims, newClaim]);
    setNewClaimText("");
  };

  const handleSaveEvidenceLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLinkingClaim) return;
    const existingEvidence = evidenceRecords.find((item) => item.evidenceId === selectedExistingEvidenceId);
    const effectiveSourceId = existingEvidence?.sourceId || selectedSourceId;
    const sourceObj = sources.find((s) => s.id === effectiveSourceId);
    if (!sourceObj) return;

    const evidenceId = existingEvidence?.evidenceId || `ev-${Date.now()}`;
    const createdAt = new Date().toISOString();
    let evidenceRecord: EvidenceRecord;
    try {
      evidenceRecord = existingEvidence || createEvidenceRecord({
        evidenceId,
        source: sourceObj,
        exactPassage: quotePassage,
        page: pageNumber,
        section: evidenceLocation,
        paragraphOrChunkRef,
        extractionMethod: "Researcher Selected",
        extractedBy: user?.uid || user?.email || "Researcher input required",
        confidence: 1,
        linkedClaimIds: [activeLinkingClaim.id],
        createdAt,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Evidence record validation failed.");
      return;
    }

    const newEvidence: LinkedEvidenceItem = {
      id: evidenceId,
      evidenceRecordId: evidenceId,
      sourceId: effectiveSourceId,
      sourceTitle: sourceObj.title,
      pageNumber: existingEvidence?.page || pageNumber || undefined,
      sectionName: existingEvidence?.section || evidenceLocation || undefined,
      paragraphNumber: existingEvidence?.paragraphOrChunkRef || paragraphOrChunkRef || undefined,
      passageQuote: existingEvidence?.exactPassage || quotePassage.trim(),
      createdAt,
    };

    const updatedLinkedSourceIds = Array.from(new Set([...(activeLinkingClaim.linkedSourceIds || []), effectiveSourceId]));
    const updatedLinkedEvidence = [...(activeLinkingClaim.linkedEvidence || []).filter((item) => (item.evidenceRecordId || item.id) !== evidenceId), newEvidence];

    const updatedClaim: ClaimItem = {
      ...activeLinkingClaim,
      linkedSourceIds: updatedLinkedSourceIds,
      linkedEvidence: updatedLinkedEvidence,
      // Transition claim state to Evidence Linked if currently Draft or Unlinked
      state: activeLinkingClaim.state === "Draft" || activeLinkingClaim.state === "Unlinked" ? "Evidence Linked" : activeLinkingClaim.state,
    };

    const updatedEvidenceRecord = {
      ...evidenceRecord,
      linkedClaimIds: Array.from(new Set([...evidenceRecord.linkedClaimIds, activeLinkingClaim.id])),
      updatedAt: createdAt,
    };
    let graphLink: ClaimEvidenceLink;
    try {
      graphLink = createClaimEvidenceLink({
        id: `edge-${Date.now()}`,
        claim: activeLinkingClaim,
        evidence: updatedEvidenceRecord,
        relationship: evidenceRelationship,
        confidence: Number(linkConfidence),
        createdBy: user?.uid || user?.email || "Researcher input required",
        createdAt,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Claim–evidence link validation failed.");
      return;
    }
    const updatedClaims = claims.map((c) => (c.id === activeLinkingClaim.id ? updatedClaim : c));
    onUpdateClaims(updatedClaims);
    onUpdateEvidenceRecords([...evidenceRecords.filter((item) => item.evidenceId !== evidenceId), updatedEvidenceRecord]);
    onUpdateClaimEvidenceLinks(upsertClaimEvidenceLink(claimEvidenceLinks, graphLink));

    // Reset drawer state
    setActiveLinkingClaim(null);
    setSelectedSourceId("");
    setEvidenceLocation("");
    setPageNumber("");
    setParagraphOrChunkRef("");
    setQuotePassage("");
    setSelectedExistingEvidenceId("");
    setEvidenceRelationship("Supports");
    setLinkConfidence("1");
  };

  const handleInitiateTransition = (claim: ClaimItem, targetState: ClaimState) => {
    if (targetState === "Verified") {
      const eligibleSupportingLink = claimEvidenceLinks.find((link) => {
        const evidence = evidenceRecords.find((record) => record.evidenceId === link.evidenceId);
        return link.claimId === claim.id && link.relationship !== "Contradicts" &&
          link.verificationState === "Verified" && link.approvalState === "Approved" &&
          evidence?.verification === "Researcher Verified" && evidence.researcherReview.status === "Verified";
      });
      if (!eligibleSupportingLink) {
        alert("Prohibited transition: A claim requires researcher-verified passage evidence and an approved supporting graph edge.");
        return;
      }

      setApprovalModalConfig({
        isOpen: true,
        claim,
        targetState,
      });
      return;
    }

    executeTransition(claim, targetState, `Transitioned claim state to ${targetState}`, claimEvidenceLinks.filter((link) => link.claimId === claim.id).map((link) => link.evidenceId));
  };

  const executeTransition = async (
    claim: ClaimItem,
    targetState: ClaimState,
    reason: string,
    evidenceRecordIds: string[]
  ) => {
    if (targetState === "Verified") {
      try {
        const result = await requestTrustedTransition({ projectId, transitionType: "CLAIM_VERIFIED", entityId: claim.id, rationale: reason, evidenceIds: evidenceRecordIds, expectedRevision: trustedTransitionRevision });
        onTrustedProjectUpdate(result.project);
      } catch (error) { alert(error instanceof Error ? error.message : "Trusted claim verification failed."); }
      return;
    }

    const actor = {
      uid: user?.uid || "user-local",
      email: user?.email || "researcher@local",
    };

    const result = performStateTransition("Claim", claim, targetState, actor, reason, evidenceRecordIds);

    if (result.success) {
      const updatedClaims = claims.map((c) => (c.id === claim.id ? (result.entity as ClaimItem) : c));
      onUpdateClaims(updatedClaims);
    } else {
      alert(result.error || "Prohibited transition failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              References & Claim–Evidence Verification
            </h2>
            <p className="text-xs text-stone-500">
              Traceability matrix linking manuscript claims to verified literature citations and passage quotes.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Claim Form */}
      <form onSubmit={handleAddClaim} className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        <h3 className="font-serif font-bold text-xs text-stone-900">
          Register Manuscript Claim
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter claim statement..."
            value={newClaimText}
            onChange={(e) => setNewClaimText(e.target.value)}
            className="flex-1 bg-stone-50 border border-stone-200 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
          />
          <select
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-2.5 text-stone-800 focus:outline-none"
          >
            <option value="Introduction">Introduction</option>
            <option value="Literature Review">Literature Review</option>
            <option value="Methodology">Methodology</option>
            <option value="Results">Results</option>
            <option value="Discussion">Discussion</option>
            <option value="Conclusion">Conclusion</option>
          </select>
          <button
            type="submit"
            className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shrink-0 flex items-center justify-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Claim</span>
          </button>
        </div>
      </form>

      {/* Claims List with Evidence Links & State Machines */}
      <div className="space-y-4">
        {claims.map((clm) => {
          const currentState: ClaimState = clm.state || "Draft";
          const allowedTransitions = CLAIM_TRANSITIONS[currentState] || [];
          const evidenceList = clm.linkedEvidence || [];
          const graphLinks = claimEvidenceLinks.filter((link) => link.claimId === clm.id);
          const sentenceLinks = manuscriptSentenceClaimLinks.filter((link) => link.claimId === clm.id);

          return (
            <div key={clm.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
                      Section: {clm.manuscriptSection}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {clm.claimType}
                    </span>

                    {/* Server-Validated Claim State Badge */}
                    <span className="bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center space-x-1">
                      <GitCommit className="w-3 h-3 text-indigo-600" />
                      <span>State: {currentState}</span>
                    </span>

                    {evidenceList.length === 0 && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                        Unlinked (No Passage Evidence)
                      </span>
                    )}
                  </div>

                  <p className="font-serif font-bold text-base text-[#102A43]">
                    "{clm.claimText}"
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setActiveLinkingClaim(clm)}
                    className="bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Link Evidence Passage</span>
                  </button>

                  <button
                    onClick={() => setSelectedClaimForHistory(clm)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Audit Trail</span>
                  </button>
                </div>
              </div>

              {/* Linked Evidence Passages Display */}
              {evidenceList.length > 0 ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                    <LinkIcon className="w-3 h-3 text-[#0B5D4B]" />
                    <span>Passage-Linked Evidence ({evidenceList.length})</span>
                  </span>

                  <div className="space-y-2">
                    {evidenceList.map((ev) => (
                      <div key={ev.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-[#102A43]">{ev.sourceTitle}</strong>
                          <span className="text-slate-500 font-mono">
                            {ev.pageNumber ? `Page ${ev.pageNumber}` : ""} {ev.sectionName || ""} {ev.paragraphNumber || ""}
                          </span>
                        </div>
                        <p className="font-mono text-slate-700 bg-[#F8F5EC] p-2 rounded text-[11px] italic">
                          "{ev.passageQuote}"
                        </p>
                        {(() => {
                          const record = evidenceRecords.find((item) => item.evidenceId === (ev.evidenceRecordId || ev.id));
                          return record ? (
                            <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                              <span>Document: {record.documentVersion}</span>
                              <span>Hash: {record.documentHash}</span>
                              <span className="font-semibold text-amber-700">{record.verification}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60 text-xs text-amber-900 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Requirement: A claim must have at least one passage-linked evidence quote before transitioning to 'Verified'.</span>
                </div>
              )}

              {graphLinks.length > 0 && (
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200 space-y-2 text-xs">
                  <span className="font-bold text-indigo-900">Claim–Evidence Graph ({graphLinks.length} edges)</span>
                  {graphLinks.map((link) => {
                    const record = evidenceRecords.find((item) => item.evidenceId === link.evidenceId);
                    return (
                      <div key={link.id} className="flex flex-wrap gap-x-3 gap-y-1 bg-white border border-indigo-100 rounded p-2 text-[11px]">
                        <span className={link.relationship === "Contradicts" ? "font-bold text-rose-700" : "font-bold text-emerald-700"}>{link.relationship}</span>
                        <span>Evidence: {link.evidenceId}</span>
                        <span>Confidence: {Math.round(link.confidence * 100)}%</span>
                        <span>{link.verificationState} / {link.approvalState}</span>
                        <span>{record?.page ? `Page ${record.page}` : record?.section || record?.paragraphOrChunkRef || "Location missing"}</span>
                        {link.approvalState === "Pending Review" && (
                          <span className="flex gap-1">
                            <button type="button" onClick={() => {
                              const rationale = window.prompt("Record relationship approval rationale:");
                              if (!rationale) return;
                              try {
                                const reviewed = reviewClaimEvidenceLink(link, "Approved", user?.uid || "", rationale);
                                onUpdateClaimEvidenceLinks(claimEvidenceLinks.map((item) => item.id === link.id ? reviewed : item));
                              } catch (error) { window.alert(error instanceof Error ? error.message : "Link review failed."); }
                            }} className="text-emerald-700 font-bold underline">Approve edge</button>
                            <button type="button" onClick={() => {
                              const rationale = window.prompt("Record relationship rejection rationale:");
                              if (!rationale) return;
                              try {
                                const reviewed = reviewClaimEvidenceLink(link, "Rejected", user?.uid || "", rationale);
                                onUpdateClaimEvidenceLinks(claimEvidenceLinks.map((item) => item.id === link.id ? reviewed : item));
                              } catch (error) { window.alert(error instanceof Error ? error.message : "Link review failed."); }
                            }} className="text-rose-700 font-bold underline">Reject edge</button>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {sentenceLinks.map((sentence) => (
                <div key={sentence.sentenceId} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-serif text-stone-800">“{sentence.exactSentence}”</p>
                  <button type="button" onClick={() => setExpandedSentenceId(expandedSentenceId === sentence.sentenceId ? null : sentence.sentenceId)} className="text-[#0B5D4B] font-bold underline">
                    Why is this sentence supported?
                  </button>
                  {expandedSentenceId === sentence.sentenceId && (
                    <div className="space-y-2 text-[11px]">
                      {graphLinks.filter((link) => link.manuscriptSentenceIds.includes(sentence.sentenceId)).map((link) => {
                        const record = evidenceRecords.find((item) => item.evidenceId === link.evidenceId);
                        const source = sources.find((item) => item.id === record?.sourceId);
                        return <div key={link.id} className="bg-white border rounded p-2">Sentence → Claim “{clm.claimText}” → {link.relationship} → “{record?.exactPassage || "Missing"}” → {source?.title || "Missing"} → {record?.page ? `Page ${record.page}` : record?.section || record?.paragraphOrChunkRef || "Missing location"}</div>;
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Transition Toolbar */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="text-slate-500 font-mono text-[11px] font-bold">
                  Next Valid State Transitions:
                </span>
                {allowedTransitions.length === 0 ? (
                  <span className="text-slate-400 italic text-[11px]">No transitions available (Terminal)</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {allowedTransitions.map((target) => (
                      <button
                        key={target}
                        onClick={() => handleInitiateTransition(clm, target)}
                        className={`font-bold text-[11px] px-2.5 py-1 rounded-md transition flex items-center space-x-1 shadow-sm ${
                          target === "Verified"
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : target === "Rejected"
                            ? "bg-rose-600 hover:bg-rose-500 text-white"
                            : "bg-[#102A43] hover:bg-[#102A43]/90 text-white"
                        }`}
                      >
                        <span>Transition to '{target}'</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Link Passage Evidence Modal / Drawer */}
      {activeLinkingClaim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEvidenceLink} className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#102A43] flex items-center justify-between">
              <span>Link Passage Evidence to Claim</span>
              <button type="button" onClick={() => setActiveLinkingClaim(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </h3>

            <div className="bg-slate-50 p-3 rounded-xl text-xs font-serif italic text-slate-800">
              Claim: "{activeLinkingClaim.claimText}"
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reuse Existing Passage Evidence (optional)</label>
                <select value={selectedExistingEvidenceId} onChange={(e) => setSelectedExistingEvidenceId(e.target.value)} className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2 text-slate-800">
                  <option value="">Create a new passage record</option>
                  {evidenceRecords.map((record) => <option key={record.evidenceId} value={record.evidenceId}>{record.evidenceId}: {record.exactPassage.slice(0, 70)}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Source Record</label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  required={!selectedExistingEvidenceId}
                  disabled={Boolean(selectedExistingEvidenceId)}
                  className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  <option value="">-- Choose verified source from library --</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.authors?.[0] || "Author"}, {s.year})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedExistingEvidenceId && <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Page Number (if available)</label>
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. Discussion"
                    value={evidenceLocation}
                    onChange={(e) => setEvidenceLocation(e.target.value)}
                    className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paragraph / Chunk</label>
                  <input
                    type="text"
                    placeholder="e.g. Para 3"
                    value={paragraphOrChunkRef}
                    onChange={(e) => setParagraphOrChunkRef(e.target.value)}
                    className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>}

              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Record at least one concrete location: page, section, or paragraph/chunk. New evidence remains Needs Review until a researcher verifies it.
              </p>

              {!selectedExistingEvidenceId && <div>
                <label className="block font-bold text-slate-700 mb-1">Exact Quoted Passage / Evidence Text</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste the exact verbatim passage from the document..."
                  value={quotePassage}
                  onChange={(e) => setQuotePassage(e.target.value)}
                  className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Graph Relationship</label>
                  <select value={evidenceRelationship} onChange={(e) => setEvidenceRelationship(e.target.value as ClaimEvidenceRelationship)} className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2">
                    <option>Supports</option><option>Partially Supports</option><option>Contextual</option><option>Contradicts</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Confidence (0–1)</label>
                  <input type="number" min="0" max="1" step="0.01" value={linkConfidence} onChange={(e) => setLinkConfidence(e.target.value)} required className="w-full bg-[#F8F5EC] border border-slate-300 rounded-lg p-2" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveLinkingClaim(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0B5D4B] text-white rounded-lg text-xs font-semibold hover:bg-[#0B5D4B]/90"
              >
                Attach Evidence Passage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formal Approval Modal */}
      {approvalModalConfig.claim && (
        <ApprovalModal
          isOpen={approvalModalConfig.isOpen}
          onClose={() => setApprovalModalConfig({ isOpen: false, claim: null, targetState: "Verified" })}
          entityType="Claim"
          entityId={approvalModalConfig.claim.id}
          entityTitle={approvalModalConfig.claim.claimText}
          currentState={approvalModalConfig.claim.state || "Draft"}
          targetState={approvalModalConfig.targetState}
          evidenceRecordIds={claimEvidenceLinks.filter((link) => link.claimId === approvalModalConfig.claim?.id).map((link) => link.evidenceId)}
          onConfirmApproval={(reason, evidenceRecordIds) => {
            if (approvalModalConfig.claim) {
              executeTransition(
                approvalModalConfig.claim,
                approvalModalConfig.targetState,
                reason,
                evidenceRecordIds
              );
              setApprovalModalConfig({ isOpen: false, claim: null, targetState: "Verified" });
            }
          }}
        />
      )}

      {/* Audit History Modal */}
      {selectedClaimForHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#102A43] flex items-center justify-between">
              <span>Claim Transition Audit Log</span>
              <button onClick={() => setSelectedClaimForHistory(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </h3>

            <p className="text-xs font-serif font-bold text-slate-800">"{selectedClaimForHistory.claimText}"</p>

            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {selectedClaimForHistory.stateHistory?.map((rec, i) => (
                <div key={rec.id || i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">{new Date(rec.timestamp).toLocaleString()}</span>
                    <span>Actor: {rec.actorEmail}</span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    State Change: <span className="text-blue-700">{rec.fromState}</span> → <span className="text-emerald-700">{rec.toState}</span>
                  </p>
                  <p className="text-slate-600 text-[11px]">Reason: {rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
