import React, { useState } from "react";
import { TargetOutlet } from "../types";
import { BASELINE_JOURNALS, BASELINE_CONFERENCES, mapJournalStyleToCslId } from "../data/baselineOutlets";
import { BookOpen, Check, Layers, Sliders, Sparkles, Filter } from "lucide-react";

interface JournalSelectorDropdownProps {
  selectedOutlet?: TargetOutlet;
  onSelectOutlet: (outlet: TargetOutlet) => void;
  variant?: "header" | "toolbar" | "card";
}

export const JournalSelectorDropdown: React.FC<JournalSelectorDropdownProps> = ({
  selectedOutlet,
  onSelectOutlet,
  variant = "header"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Journal" | "Conference">("All");

  const allOutlets = [...BASELINE_JOURNALS, ...BASELINE_CONFERENCES];

  const filteredOutlets = allOutlets.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.subjectCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.citationStyle.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "All") return matchesSearch;
    return matchesSearch && o.type === filterType;
  });

  const handleSelect = (outlet: TargetOutlet) => {
    onSelectOutlet(outlet);
    setIsOpen(false);
  };

  const currentOutlet = selectedOutlet;

  if (variant === "toolbar") {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
          title="Change Target Journal/Conference & Auto-Adjust Layout"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate max-w-[180px] font-bold text-white">{currentOutlet?.title || "Select target outlet"}</span>
          {currentOutlet && <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono">{currentOutlet.citationStyle}</span>}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-3 space-y-2 max-h-[480px] flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select Target Journal / Conference</span>
              </span>
              <span className="text-[10px] text-zinc-400">{allOutlets.length} Outlets Available</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800">
              <input
                type="text"
                placeholder="Search by journal name, field, citation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none w-full"
              />
            </div>

            <div className="flex space-x-1 border-b border-zinc-800/60 pb-1.5">
              {(["All", "Journal", "Conference"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    filterType === t ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 custom-scrollbar">
              {filteredOutlets.map((o) => {
                const isSelected = currentOutlet?.id === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => handleSelect(o)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between space-x-2 ${
                      isSelected
                        ? "bg-indigo-950/80 border-indigo-500/50 text-white"
                        : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs truncate">{o.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] text-zinc-400">
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">{o.subjectCategory}</span>
                        <span className="bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          {o.citationStyle}
                        </span>
                        <span>{o.pageMargins ? `${o.pageMargins} margins` : "Margins Unverified"}</span>
                        <span>• {o.columnLayout ? (o.columnLayout === "double" ? "2-Col" : "1-Col") : "Columns Unverified"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
      >
        <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="max-w-[140px] truncate text-white font-bold">{currentOutlet?.title || "Select target outlet"}</span>
        {currentOutlet && <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">{currentOutlet.citationStyle}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl z-50 p-4 space-y-3 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Journal / Conference Database</span>
              </h4>
              <p className="text-[10px] text-zinc-400">Applies only separately verified outlet requirements</p>
            </div>
          </div>

          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search IEEE, Nature, APA, Lancet, NEJM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full"
            />
          </div>

          <div className="flex space-x-1.5">
            {(["All", "Journal", "Conference"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  filterType === t ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
            {filteredOutlets.map((o) => {
              const isSelected = currentOutlet?.id === o.id;
              return (
                <div
                  key={o.id}
                  onClick={() => handleSelect(o)}
                  className={`p-3 rounded-2xl border cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? "bg-indigo-950/90 border-indigo-500/60 text-white shadow-lg shadow-indigo-950/50"
                      : "bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-white leading-snug">{o.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="bg-zinc-950 px-2 py-0.5 rounded-md text-zinc-300 font-medium">{o.subjectCategory}</span>
                    <span className="bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded-md font-mono font-bold">
                      {o.citationStyle}
                    </span>
                    <span className="text-zinc-400">{o.pageMargins || "1.0 in"} margins</span>
                    <span className="text-zinc-400">• {o.columnLayout === "double" ? "2-Col" : "Single Col"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
