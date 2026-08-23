import React, { useEffect } from "react";
import { SourceRecord, FieldProvenance, EvidenceRecord } from "../../types";
import { X, CheckCircle2, FileText, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { reviewEvidenceRecord } from "../../lib/evidenceRecords";

interface DocumentReaderModalProps {
  source: SourceRecord | null;
  evidenceRecords?: EvidenceRecord[];
  onUpdateEvidenceRecord?: (record: EvidenceRecord) => void;
  onClose: () => void;
}

export const DocumentReaderModal: React.FC<DocumentReaderModalProps> = ({
  source,
  evidenceRecords = [],
  onUpdateEvidenceRecord,
  onClose,
}) => {
  const { user } = useAuth();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && source) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [source, onClose]);

  if (!source) return null;

  const hasFullText = Boolean(source.fullTextContent && source.fullTextContent.trim());
  const hasAbstract = Boolean(source.abstract && source.abstract.trim());
  const hasPassages = evidenceRecords.length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-modal-title"
        className="bg-zinc-900 text-zinc-100 max-w-5xl w-full h-[85vh] rounded-3xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden"
      >
        {/* Modal Topbar */}
        <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-amber-300">
              <FileText className="w-4 h-4" />
            </div>
            <h3 id="reader-modal-title" className="font-bold text-base tracking-tight line-clamp-1">
              Document & Verified Passage Reader
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Bar */}
        <div className="bg-indigo-950/60 border-b border-indigo-500/20 px-6 py-2.5 flex items-center space-x-2 text-xs text-indigo-200">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <p>
            <strong className="text-white">Bibliographic Metadata Verification Only:</strong> Confirming Crossref or registry records verifies official metadata only. It does <em>NOT</em> imply peer-review status, full-text contents, claim support, or retraction clearance.
          </p>
        </div>

        {/* Split Screen Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
          {/* Left Panel: Document Text View */}
          <div className="p-6 overflow-y-auto border-r border-zinc-800 bg-zinc-950 space-y-4">
            <div className="border-b border-zinc-800/80 pb-3 space-y-2">
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {source.metadataProvider || "Bibliographic Metadata Verified"}
              </span>
              <h4 className="font-bold text-lg text-white leading-snug">
                {source.title}
              </h4>
              <p className="text-xs text-zinc-400">
                {source.authors.join(", ")} ({source.year}). {source.journalOrVenue}, {source.volume || ""}({source.issue || ""}), {source.pages || ""}.
              </p>
            </div>

            {/* Field Provenance Display */}
            {source.provenance?.fieldProvenance && (
              <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Field Provenance Audit</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  {Object.entries(source.provenance.fieldProvenance as Record<string, FieldProvenance>).map(([field, prov]) => (
                    <div key={field} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <span className="font-semibold text-zinc-200 capitalize">{field}: </span>
                      <span className="text-zinc-400">{prov.provider}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Content View */}
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <h5 className="font-bold text-indigo-400 uppercase tracking-wider text-[11px]">Full Text / Abstract Content</h5>
              {hasFullText ? (
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 whitespace-pre-wrap font-mono text-xs text-zinc-200">
                  {source.fullTextContent}
                </div>
              ) : hasAbstract ? (
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 italic text-zinc-300">
                  "{source.abstract}"
                </div>
              ) : (
                <div className="bg-zinc-900/60 p-6 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-400 space-y-2">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="font-semibold text-zinc-300">No full text or abstract content available</p>
                  <p className="text-[11px] text-zinc-500">
                    Full text is not available for this source. Upload a document file or retrieve open-access full text to view content.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Structured Extraction Fields */}
          <div className="p-6 overflow-y-auto bg-zinc-900 space-y-4">
            <h4 className="font-bold text-sm text-white border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>Passage Evidence & Provenance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </h4>

            {hasPassages ? (
              <div className="space-y-3 text-xs">
                {evidenceRecords.map((record) => (
                  <div key={record.evidenceId} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider">
                        {record.verification}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {[record.page ? `Page ${record.page}` : "", record.section, record.paragraphOrChunkRef].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <p className="font-mono text-zinc-200 text-xs italic">"{record.exactPassage}"</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-500 border-t border-zinc-800 pt-2">
                      <span>Evidence ID: {record.evidenceId}</span>
                      <span>Extraction: {record.extractionMethod}</span>
                      <span>Document version: {record.documentVersion}</span>
                      <span>Document hash: {record.documentHash}</span>
                      <span>Extracted by: {record.extractedBy}</span>
                      <span>Confidence: {Math.round(record.confidence * 100)}%</span>
                    </div>
                    {record.verification === "Needs Review" && onUpdateEvidenceRecord && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const notes = window.prompt("Record researcher verification notes:");
                            if (!notes) return;
                            try {
                              onUpdateEvidenceRecord?.(reviewEvidenceRecord(record, "Verified", user?.uid || "", notes));
                            } catch (error) {
                              window.alert(error instanceof Error ? error.message : "Evidence review failed.");
                            }
                          }}
                          className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-700 text-white"
                        >
                          Researcher Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const notes = window.prompt("Record rejection rationale:");
                            if (!notes) return;
                            try {
                              onUpdateEvidenceRecord?.(reviewEvidenceRecord(record, "Rejected", user?.uid || "", notes));
                            } catch (error) {
                              window.alert(error instanceof Error ? error.message : "Evidence review failed.");
                            }
                          }}
                          className="text-[10px] font-semibold px-2 py-1 rounded bg-rose-800 text-white"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
                <p className="font-semibold text-zinc-400">No passage-linked evidence extractions</p>
                <p className="text-[11px] text-zinc-500">
                  Select text passages in the document reader to link exact evidence quotes to claims.
                </p>
              </div>
            )}

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs space-y-1">
              <span className="text-zinc-500 font-semibold block uppercase tracking-wider text-[10px]">Researcher Notes</span>
              <p className="text-zinc-300 leading-relaxed">{source.researcherNotes || "No notes recorded."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
