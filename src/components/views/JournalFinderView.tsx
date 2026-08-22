import React, { useState } from "react";
import { TargetOutlet } from "../../types";
import { BASELINE_JOURNALS, BASELINE_CONFERENCES, validateOutletIntegrity } from "../../data/baselineOutlets";
import { Search, Award, CheckCircle2, AlertTriangle, ExternalLink, Filter, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

interface JournalFinderViewProps {
  selectedOutlet?: TargetOutlet;
  onSelectOutlet: (outlet: TargetOutlet) => void;
}

export const JournalFinderView: React.FC<JournalFinderViewProps> = ({
  selectedOutlet,
  onSelectOutlet,
}) => {
  const [activeTab, setActiveTab] = useState<"journals" | "conferences">("journals");
  const [searchQuery, setSearchQuery] = useState("");
  const [provenanceFilter, setProvenanceFilter] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");

  const outletList = activeTab === "journals" ? BASELINE_JOURNALS : BASELINE_CONFERENCES;
  const filteredList = outletList.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.subjectCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.publisherOrSociety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.citationStyle.toLowerCase().includes(searchQuery.toLowerCase());

    if (provenanceFilter === "VERIFIED") {
      return matchesSearch && o.verificationStatus === "Verified";
    }
    if (provenanceFilter === "UNVERIFIED") {
      return matchesSearch && o.verificationStatus === "Unverified";
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Stages 17-18 • Target Outlet Library & Verified Journal Finder</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-[#102A43]">
            Scholarly Outlet Catalogue & Format Engine
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Strict provenance-verified catalogue. Every outlet links directly to official publisher author guidelines and primary indexing sources. Zero fabricated titles.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("journals")}
            className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition ${
              activeTab === "journals"
                ? "bg-[#102A43] text-white border-t-2 border-[#C8902F]"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Verified Journals ({BASELINE_JOURNALS.length})
          </button>
          <button
            onClick={() => setActiveTab("conferences")}
            className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition ${
              activeTab === "conferences"
                ? "bg-[#102A43] text-white border-t-2 border-[#C8902F]"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Verified Conferences ({BASELINE_CONFERENCES.length})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search category, publisher, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Outlet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((outlet) => {
          const isSelected = selectedOutlet?.id === outlet.id;
          const integrity = validateOutletIntegrity(outlet);

          return (
            <div
              key={outlet.id}
              className={`bg-white p-5 rounded-xl border transition shadow-sm space-y-3 ${
                isSelected ? "border-2 border-[#0B5D4B] bg-[#0B5D4B]/5" : "border-slate-200 hover:border-[#0B5D4B]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] bg-[#102A43] text-white font-bold px-2 py-0.5 rounded uppercase">
                      {outlet.subjectCategory}
                    </span>
                    {outlet.verificationStatus === "Verified" ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Seed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-semibold">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Unverified User Entry</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#102A43] leading-snug">
                    {outlet.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {outlet.publisherOrSociety} • {outlet.issnOrAcronym}
                  </p>
                </div>

                <button
                  onClick={() => onSelectOutlet(outlet)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 ${
                    isSelected
                      ? "bg-[#0B5D4B] text-white"
                      : "bg-[#102A43] text-white hover:bg-[#102A43]/90"
                  }`}
                >
                  {isSelected ? "Selected Target" : "Select Target"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#F8F5EC] p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block font-medium">Word Limit</span>
                  <strong className="text-slate-800">{outlet.wordLimit ? `${outlet.wordLimit.toLocaleString()} words` : "Uncapped / Guidelines"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Open Access</span>
                  <strong className="text-slate-800">{outlet.openAccessModel}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Citation Style</span>
                  <strong className="text-slate-800">{outlet.citationStyle}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="truncate max-w-[280px]">Indexing: {outlet.indexing.length ? outlet.indexing.join(", ") : "Publisher verified"}</span>
                {outlet.officialUrl && (
                  <a
                    href={outlet.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0B5D4B] font-bold hover:underline flex items-center space-x-1 shrink-0"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
