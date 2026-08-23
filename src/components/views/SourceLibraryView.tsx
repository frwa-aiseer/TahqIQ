import React, { useState } from "react";
import { ProjectState, SourceRecord, SourceState, FieldProvenance } from "../../types";
import { performStateTransition, SOURCE_TRANSITIONS } from "../../lib/stateMachines";
import { useAuth } from "../../context/AuthContext";
import { parseBibTeX, parseRIS, parseCSLJSON } from "../../lib/referenceParsers";
import { searchMissingCitationCandidates, CrossrefDisclaimer } from "../../lib/metadataProviders";
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileText,
  ShieldCheck,
  History,
  ChevronRight,
  GitCommit,
  Upload,
  Info,
  Layers,
  Database
} from "lucide-react";
import { authenticatedProjectFetch } from "../../lib/authenticatedFetch";
import { requestTrustedTransition } from "../../lib/trustedTransitionsClient";

interface SourceLibraryViewProps {
  sources: SourceRecord[];
  onAddSource: (source: SourceRecord) => void;
  onOpenReaderModal: (source: SourceRecord) => void;
  onUpdateSource?: (source: SourceRecord) => void;
  projectId?: string;
  trustedTransitionRevision?: number;
  onTrustedProjectUpdate?: (project: ProjectState) => void;
}

export const SourceLibraryView: React.FC<SourceLibraryViewProps> = ({
  sources,
  onAddSource,
  onOpenReaderModal,
  onUpdateSource,
  projectId,
  trustedTransitionRevision = 0,
  onTrustedProjectUpdate,
}) => {
  const { user } = useAuth();
  const [doiInput, setDoiInput] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedSourceForHistory, setSelectedSourceForHistory] = useState<SourceRecord | null>(null);

  // Import Modal & Reference Parsers State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFormat, setImportFormat] = useState<"bibtex" | "ris" | "csl">("bibtex");
  const [importText, setImportText] = useState("");

  // Candidate Search Modal State
  const [showCandidateSearchModal, setShowCandidateSearchModal] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const [candidateResults, setCandidateResults] = useState<any[]>([]);

  // Metadata Conflict Resolution State
  const [conflictCandidate, setConflictCandidate] = useState<SourceRecord | null>(null);

  const handleImportDoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doiInput.trim()) return;

    setIsResolving(true);
    setNotice(null);

    try {
      const res = await authenticatedProjectFetch("/api/sources/doi", projectId || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: doiInput }),
      });

      if (res.ok) {
        const data = await res.json();

        // Check if duplicate DOI already exists
        const existing = sources.find((s) => s.doi?.toLowerCase() === data.doi?.toLowerCase());
        if (existing) {
          setNotice(`Notice: Source with DOI '${data.doi}' already exists in library: '${existing.title}'.`);
          setIsResolving(false);
          return;
        }

        const newSource: SourceRecord = {
          id: `src-${Date.now()}`,
          title: data.title,
          authors: data.authors,
          year: data.year,
          journalOrVenue: data.journalOrVenue,
          volume: data.volume,
          issue: data.issue,
          pages: data.pages,
          publisher: data.publisher,
          doi: data.doi,
          documentType: "Journal Article",
          peerReviewStatus: "Peer-reviewed",
          verificationState: "Verified",
          state: "Imported",
          provenance: data.provenance || {
            provider: data.metadataProvider || "Crossref Official Registry",
            retrievedAt: new Date().toISOString(),
            fieldProvenance: data.fieldProvenance,
            disclaimer: CrossrefDisclaimer.MESSAGE,
          },
          stateHistory: [
            {
              id: `tr-${Date.now()}`,
              entityType: "Source",
              entityId: `src-${Date.now()}`,
              fromState: "Imported",
              toState: "Imported",
              actorUid: user?.uid || "system",
              actorEmail: user?.email || "system@tehqiq.edu",
              timestamp: new Date().toISOString(),
              reason: "DOI Metadata Verified via Authoritative Registry",
              evidenceRecordIds: [`doi:${data.doi}`],
            },
          ],
          metadataProvider: data.metadataProvider || "Crossref Official Registry",
          verificationDate: new Date().toISOString(),
          relevanceScore: 9,
          tags: ["DOI Import"],
          researcherNotes: "Imported with authoritative registry metadata."
        };

        onAddSource(newSource);
        setDoiInput("");
        setNotice(`Successfully imported & verified DOI: ${data.doi} (${data.metadataProvider})`);
      } else {
        setNotice("DOI lookup failed or was not found in Crossref / authoritative registries.");
      }
    } catch (err) {
      setNotice("Failed to reach DOI resolution server.");
    } finally {
      setIsResolving(false);
    }
  };

  const handleParseImport = () => {
    if (!importText.trim()) return;

    let parsed: SourceRecord[] = [];
    if (importFormat === "bibtex") {
      parsed = parseBibTeX(importText);
    } else if (importFormat === "ris") {
      parsed = parseRIS(importText);
    } else if (importFormat === "csl") {
      parsed = parseCSLJSON(importText);
    }

    if (parsed.length === 0) {
      alert(`No valid ${importFormat.toUpperCase()} records found in input string.`);
      return;
    }

    parsed.forEach((src) => onAddSource(src));
    setNotice(`Successfully imported ${parsed.length} reference(s) from ${importFormat.toUpperCase()}.`);
    setShowImportModal(false);
    setImportText("");
  };

  const handleSearchCandidates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateQuery.trim()) return;

    setIsSearchingCandidates(true);
    const results = await searchMissingCitationCandidates({ query: candidateQuery, limit: 5 });
    setCandidateResults(results);
    setIsSearchingCandidates(false);
  };

  const handleAddCandidate = (cand: any) => {
    const newSource: SourceRecord = {
      id: `src-cand-${Date.now()}`,
      title: cand.title,
      authors: cand.authors,
      year: cand.year,
      journalOrVenue: cand.journalOrVenue,
      doi: cand.doi,
      publisher: cand.publisher,
      documentType: "Journal Article",
      peerReviewStatus: "Unknown",
      verificationState: cand.doi ? "Verified" : "Unverified",
      state: "Imported",
      metadataProvider: cand.providerName,
      provenance: {
        provider: cand.providerName,
        retrievedAt: new Date().toISOString(),
        fieldProvenance: cand.fieldProvenance,
      },
      relevanceScore: 8,
      tags: ["Candidate Search Import"],
      stateHistory: [],
    };

    onAddSource(newSource);
    setNotice(`Added candidate source: '${cand.title.substring(0, 30)}...'`);
    setShowCandidateSearchModal(false);
  };

  const handleTransitionState = async (source: SourceRecord, targetState: SourceState) => {
    if (!onUpdateSource) return;

    const actor = {
      uid: user?.uid || "user-local",
      email: user?.email || "researcher@local",
    };

    const reason = `Transitioned source state to ${targetState}`;
    const evidenceRecordIds = source.doi ? [`doi:${source.doi}`] : [];

    if (targetState === "Metadata Verified") {
      if (!projectId) return alert("A persisted project is required for trusted source verification.");
      try {
        const result = await requestTrustedTransition({ projectId, transitionType: "SOURCE_VERIFIED", entityId: source.id, rationale: reason, evidenceIds: evidenceRecordIds, expectedRevision: trustedTransitionRevision });
        const updated = result.project.sources.find((item) => item.id === source.id);
        if (onTrustedProjectUpdate) onTrustedProjectUpdate(result.project);
        else if (updated) onUpdateSource(updated);
        setNotice(`Source '${source.title.substring(0, 30)}...' verified by the trusted transition service.`);
      } catch (error) { alert(error instanceof Error ? error.message : "Trusted source verification failed."); }
      return;
    }

    const result = performStateTransition("Source", source, targetState, actor, reason, evidenceRecordIds);

    if (result.success) {
      onUpdateSource(result.entity);
      setNotice(`Source '${source.title.substring(0, 30)}...' state updated to '${targetState}'.`);
    } else {
      alert(result.error || "Prohibited transition failed.");
    }
  };

  const filteredSources = sources.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.journalOrVenue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Literature Library & Citation Registry</h2>
            <p className="text-xs text-stone-500">
              Crossref DOI normalization, BibTeX/RIS import, and field provenance auditing.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-white hover:bg-stone-100 text-stone-800 font-medium text-xs px-3 py-1.5 rounded-lg border border-stone-200 transition flex items-center space-x-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" />
            <span>Import BibTeX / RIS / CSL</span>
          </button>
          <button
            onClick={() => setShowCandidateSearchModal(true)}
            className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-stone-200" />
            <span>Candidate Search</span>
          </button>
        </div>
      </div>

      {/* Crossref Verification Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-950">Bibliographic Metadata Verification Scope:</strong>
          <span className="ml-1 text-amber-900">
            Crossref / registry verification confirms official bibliographic metadata records only. It does <em>NOT</em> imply peer-review verification, full-text claim support, or retraction clearance.
          </span>
        </div>
      </div>

      {/* DOI Resolution Form Card */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-stone-700">
          <span className="font-semibold text-stone-900">Direct DOI Import:</span> Enter a DOI to resolve metadata via Crossref or DataCite.
        </div>
        <form onSubmit={handleImportDoi} className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="e.g. 10.1016/j.jbiomech.2023.102345..."
            value={doiInput}
            onChange={(e) => setDoiInput(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
          />
          <button
            type="submit"
            disabled={isResolving}
            className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-4 py-2 rounded-lg transition shrink-0"
          >
            {isResolving ? "Resolving..." : "Import DOI"}
          </button>
        </form>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search sources by title, author, or journal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
        />
      </div>

      {/* Source Cards List */}
      <div className="space-y-3">
        {filteredSources.map((src) => {
          const currentState: SourceState = src.state || "Imported";
          const allowedTransitions = SOURCE_TRANSITIONS[currentState] || [];

          return (
            <div
              key={src.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0B5D4B] transition space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="bg-[#0B5D4B]/10 text-[#0B5D4B] font-bold px-2 py-0.5 rounded">
                      {src.documentType}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                      ID: {src.id}
                    </span>
                    <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                      State: {currentState}
                    </span>
                    {src.metadataProvider && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Database className="w-3 h-3 text-emerald-600" />
                        {src.metadataProvider}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#102A43] leading-snug">
                    {src.title}
                  </h3>

                  <p className="text-xs text-slate-600">
                    {src.authors.join(", ")} ({src.year}). <span className="italic">{src.journalOrVenue}</span>.
                  </p>

                  {src.doi && (
                    <p className="text-[11px] font-mono text-[#0B5D4B]">
                      DOI: https://doi.org/{src.doi}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => onOpenReaderModal(src)}
                    className="bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Reader</span>
                  </button>

                  <button
                    onClick={() => setSelectedSourceForHistory(src)}
                    className="text-slate-500 hover:text-slate-800 text-[11px] font-medium flex items-center space-x-1"
                  >
                    <History className="w-3 h-3 text-slate-400" />
                    <span>Audit Log ({src.stateHistory?.length || 0})</span>
                  </button>
                </div>
              </div>

              {/* Field Provenance Section */}
              {src.provenance?.fieldProvenance && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Field-Level Provenance Audit</span>
                    <span className="text-[10px] text-slate-500">Retrieved: {new Date(src.provenance.retrievedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                    {Object.entries(src.provenance.fieldProvenance as Record<string, FieldProvenance>).map(([f, prov]) => (
                      <span key={f}>
                        <strong className="text-slate-700 capitalize">{f}:</strong> {prov.provider}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* State Machine Transition Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Allowed transitions from <strong className="text-slate-700">{currentState}</strong>:
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {allowedTransitions.length > 0 ? (
                    allowedTransitions.map((tState) => (
                      <button
                        key={tState}
                        onClick={() => handleTransitionState(src, tState)}
                        className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-md transition flex items-center space-x-1"
                      >
                        <ChevronRight className="w-3 h-3 text-[#0B5D4B]" />
                        <span>Move to {tState}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No further transitions (Terminal)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reference Format Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#102A43] flex items-center justify-between">
              <span>Import Reference Library (BibTeX / RIS / CSL)</span>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </h3>

            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setImportFormat("bibtex")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  importFormat === "bibtex" ? "bg-[#0B5D4B] text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                BibTeX (.bib)
              </button>
              <button
                onClick={() => setImportFormat("ris")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  importFormat === "ris" ? "bg-[#0B5D4B] text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                RIS Format (.ris)
              </button>
              <button
                onClick={() => setImportFormat("csl")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  importFormat === "csl" ? "bg-[#0B5D4B] text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                CSL JSON (.json)
              </button>
            </div>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Paste raw ${importFormat.toUpperCase()} reference string here...`}
              className="w-full bg-[#F8F5EC] p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:border-[#0B5D4B]"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleParseImport}
                className="px-4 py-2 bg-[#0B5D4B] text-white rounded-lg text-xs font-semibold hover:bg-[#0B5D4B]/90"
              >
                Parse & Add to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Search Modal */}
      {showCandidateSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#102A43] flex items-center justify-between">
              <span>Missing Citation Candidate Search</span>
              <button onClick={() => setShowCandidateSearchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </h3>

            <p className="text-xs text-slate-600">
              Search Crossref / OpenAlex registries for candidates. Selected candidates will be imported as verified sources.
            </p>

            <form onSubmit={handleSearchCandidates} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search author, title, or query..."
                value={candidateQuery}
                onChange={(e) => setCandidateQuery(e.target.value)}
                className="w-full bg-[#F8F5EC] border border-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#0B5D4B]"
              />
              <button
                type="submit"
                disabled={isSearchingCandidates}
                className="bg-[#0B5D4B] text-white text-xs font-semibold px-4 py-2 rounded-lg shrink-0"
              >
                {isSearchingCandidates ? "Searching..." : "Search Registries"}
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 border-t border-slate-200 pt-3">
              {candidateResults.map((cand, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">{cand.title}</h4>
                    <p className="text-slate-600">{cand.authors?.join(", ")} ({cand.year})</p>
                    {cand.doi && <p className="font-mono text-[10px] text-[#0B5D4B]">DOI: {cand.doi}</p>}
                  </div>
                  <button
                    onClick={() => handleAddCandidate(cand)}
                    className="bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
                  >
                    Select Candidate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {selectedSourceForHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#102A43] flex items-center justify-between">
              <span>Source Transition Audit Log</span>
              <button onClick={() => setSelectedSourceForHistory(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </h3>

            <p className="text-xs font-serif font-bold text-slate-800">{selectedSourceForHistory.title}</p>

            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {selectedSourceForHistory.stateHistory?.map((rec, i) => (
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
