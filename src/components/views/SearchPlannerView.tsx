import React, { useState } from "react";
import { SearchStrategy } from "../../types";
import { Search, Copy, Check, Filter, Database, Sparkles } from "lucide-react";

interface SearchPlannerViewProps {
  strategies: SearchStrategy[];
  onAddStrategy: (stg: SearchStrategy) => void;
}

export const SearchPlannerView: React.FC<SearchPlannerViewProps> = ({
  strategies,
  onAddStrategy,
}) => {
  const [selectedDb, setSelectedDb] = useState<SearchStrategy["database"]>("PubMed");
  const [copied, setCopied] = useState(false);

  const activeStrategy = strategies.find((s) => s.database === selectedDb) || strategies[0];

  const handleCopyQuery = () => {
    if (activeStrategy?.booleanQuery) {
      navigator.clipboard.writeText(activeStrategy.booleanQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0B5D4B] text-xs font-mono uppercase tracking-wider mb-1">
            <Search className="w-4 h-4" />
            <span>Stage 4 • Literature Search Planner & Strategy Builder</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-[#102A43]">
            Database-Specific Boolean Query Builder
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Construct reproducible search strings with MeSH terms, controlled vocabulary, and exact filter parameters.
          </p>
        </div>
      </div>

      {/* DB Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {(["PubMed", "Crossref", "OpenAlex", "Europe PMC", "arXiv", "DOAJ"] as SearchStrategy["database"][]).map((db) => (
          <button
            key={db}
            onClick={() => setSelectedDb(db)}
            className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition ${
              selectedDb === db
                ? "bg-[#102A43] text-white border-t-2 border-[#C8902F]"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {db}
          </button>
        ))}
      </div>

      {/* Strategy Query Card */}
      {activeStrategy && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-[#0B5D4B]" />
              <h3 className="font-serif font-bold text-base text-[#102A43]">
                {activeStrategy.database} Search String
              </h3>
            </div>
            <button
              onClick={handleCopyQuery}
              className="bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Search String"}</span>
            </button>
          </div>

          <div className="bg-[#102A43] text-[#F8F5EC] p-4 rounded-xl font-mono text-xs leading-relaxed border border-[#C8902F]/30 overflow-x-auto">
            {activeStrategy.booleanQuery}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="bg-[#F8F5EC] p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium block">Key Concepts</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {activeStrategy.concepts.join(", ")}
              </p>
            </div>
            <div className="bg-[#F8F5EC] p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium block">Result Yield</span>
              <p className="font-bold text-[#0B5D4B] mt-0.5">
                {activeStrategy.resultCount} records retrieved
              </p>
            </div>
            <div className="bg-[#F8F5EC] p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium block">Date Filters</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {activeStrategy.filters.dateFrom} to {activeStrategy.filters.dateTo}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
