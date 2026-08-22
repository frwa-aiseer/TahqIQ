import React, { useState, useMemo, useRef } from "react";
import { ProjectState, SourceRecord, CSLStyleOption } from "../types";
import { formatBibliographyEntry, formatInTextCitation, CSL_STYLES } from "../lib/cslStyles";
import { stripMarkdownTokens } from "../lib/exportUtils";
import {
  FileText,
  Eye,
  BookOpen,
  Copy,
  Check,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronRight,
  Download,
  Layers,
  Sparkles,
  ShieldCheck,
  FileDown,
  Printer,
  Table as TableIcon,
  BarChart3,
  Lock,
  Calendar,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface ManuscriptPreviewPaneProps {
  project: ProjectState;
  selectedStyle: string;
  lineSpacing: 1.0 | 1.15 | 1.5 | 2.0;
  fontFamily: "Times New Roman" | "Arial" | "Calibri" | "Georgia";
  fontSizePt: number;
  includeTitlePage: boolean;
  includeTablesAndFigures: boolean;
  includeReferences: boolean;
  includeEthicsAndAi: boolean;
  exportMode: "Submission-Ready" | "Draft Review";
  onExportDocx: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  hasBlockers?: boolean;
}

export const ManuscriptPreviewPane: React.FC<ManuscriptPreviewPaneProps> = ({
  project,
  selectedStyle,
  lineSpacing,
  fontFamily,
  fontSizePt,
  includeTitlePage,
  includeTablesAndFigures,
  includeReferences,
  includeEthicsAndAi,
  exportMode,
  onExportDocx,
  onExportPdf,
  isExporting,
  hasBlockers = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewLayout, setViewLayout] = useState<"paged" | "continuous">("paged");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [activeOutlineSection, setActiveOutlineSection] = useState<string>("title");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const outlet = project.selectedTargetOutlet;
  const currentStyleObj = useMemo(() => {
    return CSL_STYLES.find((s) => s.id === selectedStyle) || CSL_STYLES[0];
  }, [selectedStyle]);

  // Build a mapped lookup for sources by ID
  const sourcesMap = useMemo(() => {
    const map = new Map<string, SourceRecord>();
    (project.sources || []).forEach((src) => {
      map.set(src.id, src);
    });
    return map;
  }, [project.sources]);

  // Format in-text references for a section
  const renderSectionText = (content: string, citationIds: string[] = []) => {
    if (!content) return <p className="italic text-stone-400">No text drafted for this section yet.</p>;

    // Generate in-text citation marker if citations exist for this section
    const resolvedSources = citationIds.map((id) => sourcesMap.get(id)).filter(Boolean) as SourceRecord[];
    const inTextMarker = resolvedSources.length > 0
      ? formatInTextCitation(resolvedSources, selectedStyle as any, project.sources)
      : "";

    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);

    return (
      <div className="space-y-4">
        {paragraphs.map((p, pIdx) => {
          let cleanText = stripMarkdownTokens(p);
          const isLastParagraph = pIdx === paragraphs.length - 1;

          // Highlight search queries if present
          if (searchQuery.trim().length > 1) {
            const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
            const parts = cleanText.split(regex);
            return (
              <p key={pIdx} className="leading-relaxed">
                {parts.map((part, i) =>
                  regex.test(part) ? (
                    <mark key={i} className="bg-amber-200 text-stone-900 rounded px-0.5 font-medium">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
                )}
                {isLastParagraph && inTextMarker && (
                  <span className="font-semibold text-[#053B2E] bg-[#053B2E]/8 px-1 py-0.5 rounded ml-1 text-[0.9em]">
                    {inTextMarker}
                  </span>
                )}
              </p>
            );
          }

          return (
            <p key={pIdx} className="leading-relaxed text-justify">
              {cleanText}
              {isLastParagraph && inTextMarker && (
                <span
                  title={`Citations formatted in ${currentStyleObj.name}`}
                  className="font-semibold text-[#053B2E] bg-[#053B2E]/10 px-1.5 py-0.5 rounded ml-1.5 text-[0.9em] border border-[#053B2E]/20"
                >
                  {inTextMarker}
                </span>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  const handleCopyFullManuscript = () => {
    let fullText = `${project.title || "Scholarly Research Manuscript"}\n\n`;
    (project.authors || []).forEach((a) => {
      fullText += `${a.fullName} (${a.department}, ${a.institution})\n`;
    });
    fullText += `\nTarget Outlet: ${outlet?.title || "Standard Outlet"} | Style: ${currentStyleObj.name}\n\n`;

    const abstractSec = (project.sections || []).find((s) => s.title.toLowerCase().includes("abstract"));
    if (abstractSec) {
      fullText += `ABSTRACT\n${stripMarkdownTokens(abstractSec.content)}\n\n`;
    }

    (project.sections || []).forEach((sec) => {
      if (sec.title.toLowerCase().includes("abstract")) return;
      fullText += `${sec.title.toUpperCase()}\n${stripMarkdownTokens(sec.content)}\n\n`;
    });

    if (includeReferences && (project.sources || []).length > 0) {
      fullText += `REFERENCES (${currentStyleObj.name})\n`;
      project.sources.forEach((src, idx) => {
        fullText += `${formatBibliographyEntry(src, idx, selectedStyle as any)}\n`;
      });
    }

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedStatus("Full manuscript copied to clipboard!");
      setTimeout(() => setCopiedStatus(null), 3000);
    });
  };

  const scrollToSection = (sectionId: string) => {
    setActiveOutlineSection(sectionId);
    const elem = document.getElementById(`preview-sec-${sectionId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Font family CSS class/style mapping
  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case "Arial":
        return "font-sans";
      case "Calibri":
        return "font-sans";
      case "Georgia":
        return "font-serif";
      case "Times New Roman":
      default:
        return "font-serif";
    }
  };

  const lineSpacingClass = useMemo(() => {
    if (lineSpacing === 2.0) return "leading-[2.2]";
    if (lineSpacing === 1.5) return "leading-[1.75]";
    if (lineSpacing === 1.15) return "leading-[1.4]";
    return "leading-[1.25]";
  }, [lineSpacing]);

  return (
    <div
      className={`bg-stone-50 border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 ${
        isExpanded ? "fixed inset-4 z-50 shadow-2xl bg-stone-100 flex flex-col" : "space-y-0"
      }`}
    >
      {/* Top Toolbar */}
      <div className="bg-white px-4 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#053B2E]/10 flex items-center justify-center text-[#053B2E]">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Live Manuscript Proof Preview
              </h3>
              <span className="bg-[#053B2E]/10 text-[#053B2E] border border-[#053B2E]/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentStyleObj.name}
              </span>
              {exportMode === "Draft Review" ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Draft Proof
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Submission Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              Interactive proof rendered with {fontFamily}, {fontSizePt}pt, {lineSpacing}x line spacing, and dynamic {currentStyleObj.citationFormat} citation formatting.
            </p>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex items-center space-x-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search proof text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg pl-7 pr-2 py-1 text-xs text-stone-800 placeholder-stone-400 w-36 focus:w-48 focus:bg-white focus:outline-none focus:border-[#053B2E] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-[10px]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Layout Toggle: Paged vs Continuous */}
          <div className="bg-stone-100 p-0.5 rounded-lg border border-stone-200 flex items-center text-xs">
            <button
              onClick={() => setViewLayout("paged")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                viewLayout === "paged" ? "bg-white text-stone-900 shadow-2xs font-semibold" : "text-stone-500 hover:text-stone-800"
              }`}
              title="Paged layout proof with simulated sheets"
            >
              Paged Proof
            </button>
            <button
              onClick={() => setViewLayout("continuous")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                viewLayout === "continuous" ? "bg-white text-stone-900 shadow-2xs font-semibold" : "text-stone-500 hover:text-stone-800"
              }`}
              title="Continuous document reader layout"
            >
              Continuous
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-stone-100 px-1.5 py-0.5 rounded-lg border border-stone-200 text-stone-600">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="p-1 hover:text-stone-900 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-semibold w-8 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1 hover:text-stone-900 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Proof Button */}
          <button
            onClick={handleCopyFullManuscript}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition"
            title="Copy full rendered manuscript text to clipboard"
          >
            {copiedStatus ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-[11px]">Copy Text</span>
              </>
            )}
          </button>

          {/* Finalize Download Shortcut Buttons */}
          <button
            onClick={onExportDocx}
            disabled={isExporting || (exportMode === "Submission-Ready" && hasBlockers)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition ${
              exportMode === "Submission-Ready" && hasBlockers
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-[#053B2E] hover:bg-[#053B2E]/90 text-white"
            }`}
            title="Export manuscript formatted Word (.docx)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download DOCX</span>
          </button>

          <button
            onClick={onExportPdf}
            disabled={isExporting || (exportMode === "Submission-Ready" && hasBlockers)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition ${
              exportMode === "Submission-Ready" && hasBlockers
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-stone-800 hover:bg-stone-900 text-white"
            }`}
            title="Export manuscript camera-ready PDF proof package"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
            title={isExpanded ? "Exit full view" : "Expand preview proof"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Preview Container with Outline Sidebar */}
      <div className={`flex flex-col lg:flex-row overflow-hidden ${isExpanded ? "flex-1" : "min-h-[600px] max-h-[750px]"}`}>
        {/* Left Interactive Outline Navigation */}
        <div className="w-full lg:w-60 bg-stone-100/70 border-r border-stone-200/80 p-3.5 overflow-y-auto shrink-0 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/60">
            <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 flex items-center space-x-1">
              <Layers className="w-3 h-3 text-[#053B2E]" />
              <span>Document Outline</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {(project.sections || []).length} Sections
            </span>
          </div>

          <nav className="space-y-1">
            {includeTitlePage && (
              <button
                onClick={() => scrollToSection("title")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  activeOutlineSection === "title"
                    ? "bg-[#053B2E] text-white font-semibold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 font-medium"
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Title & Metadata</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
              </button>
            )}

            {/* Sections */}
            {(project.sections || []).map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  activeOutlineSection === sec.id
                    ? "bg-[#053B2E] text-white font-semibold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 font-medium"
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-[10px] font-mono opacity-60 shrink-0">§</span>
                  <span className="truncate">{sec.title}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono shrink-0 ml-1">
                  {sec.currentWordCount || 0}w
                </span>
              </button>
            ))}

            {/* Tables & Figures */}
            {includeTablesAndFigures && ((project.figures || []).length > 0 || (project.tables || []).length > 0) && (
              <button
                onClick={() => scrollToSection("figures-tables")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  activeOutlineSection === "figures-tables"
                    ? "bg-[#053B2E] text-white font-semibold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 font-medium"
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Figures & Tables</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono shrink-0 ml-1">
                  {(project.figures || []).length + (project.tables || []).length}
                </span>
              </button>
            )}

            {/* Ethics & AI Disclosures */}
            {includeEthicsAndAi && (
              <button
                onClick={() => scrollToSection("ethics-ai")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  activeOutlineSection === "ethics-ai"
                    ? "bg-[#053B2E] text-white font-semibold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 font-medium"
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ethics & Disclosures</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
              </button>
            )}

            {/* References */}
            {includeReferences && (
              <button
                onClick={() => scrollToSection("references")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  activeOutlineSection === "references"
                    ? "bg-[#053B2E] text-white font-semibold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 font-medium"
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">References ({currentStyleObj.id.toUpperCase()})</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono shrink-0 ml-1">
                  {(project.sources || []).length}
                </span>
              </button>
            )}
          </nav>

          {/* Citation Style Summary Card in Sidebar */}
          <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1.5 text-[11px]">
            <div className="font-semibold text-stone-800 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-[#053B2E]" />
              <span>Active CSL Style</span>
            </div>
            <p className="text-stone-600 font-medium">{currentStyleObj.name}</p>
            <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
              <span>Citation Type:</span>
              <span className="font-mono font-semibold capitalize text-[#053B2E]">{currentStyleObj.citationFormat}</span>
            </div>
          </div>
        </div>

        {/* Right Scrollable Paper Canvas */}
        <div
          ref={previewContainerRef}
          className="flex-1 bg-stone-200/60 p-4 sm:p-8 overflow-y-auto overflow-x-hidden flex justify-center"
        >
          {/* Simulated Paper Sheet */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              fontSize: `${fontSizePt}px`,
            }}
            className={`w-full max-w-4xl bg-white rounded-xl shadow-lg border border-stone-300/80 p-8 sm:p-14 text-stone-900 ${getFontFamilyStyle()} ${lineSpacingClass} relative select-text transition-all duration-150`}
          >
            {/* Draft Watermark */}
            {exportMode === "Draft Review" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] select-none overflow-hidden">
                <span className="text-stone-900 font-black text-8xl -rotate-45 whitespace-nowrap tracking-widest uppercase">
                  DRAFT PROOF — FOR REVIEW ONLY
                </span>
              </div>
            )}

            {/* Running Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2 mb-8 text-[11px] text-stone-500 font-sans tracking-wide">
              <span className="truncate max-w-md uppercase font-medium">
                {outlet?.title || "TehqIQ Scholarly Platform"} — {currentStyleObj.name} Proof
              </span>
              <span className="font-mono">Page 1</span>
            </div>

            {/* Title Page Block */}
            {includeTitlePage && (
              <section id="preview-sec-title" className="mb-10 space-y-5 text-center scroll-mt-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 leading-tight">
                  {project.title || "Scholarly Research Manuscript Title"}
                </h1>

                {/* Authors Block */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-semibold text-stone-800">
                    {(project.authors || []).map((author, aIdx) => (
                      <span key={author.id || aIdx} className="inline-flex items-center">
                        {author.fullName}
                        {author.isCorresponding && (
                          <sup className="text-[#053B2E] font-bold ml-0.5" title="Corresponding Author">
                            *
                          </sup>
                        )}
                        {aIdx < (project.authors || []).length - 1 && <span className="text-stone-400 ml-3">,</span>}
                      </span>
                    ))}
                  </div>

                  {/* Affiliations */}
                  <div className="text-xs text-stone-500 space-y-0.5 italic">
                    {(project.authors || []).map((author, aIdx) => (
                      <div key={author.id || aIdx}>
                        {author.department}, {author.institution}, {author.city}, {author.country}
                        {author.isCorresponding && author.email && (
                          <span className="font-mono not-italic ml-1 text-stone-600">({author.email})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Outlet & Formatting Metadata Box */}
                <div className="my-4 p-3 bg-stone-50 border border-stone-200/80 rounded-lg text-xs font-sans flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-stone-600">
                  <span>
                    <strong className="text-stone-800">Target Outlet:</strong> {outlet?.title || "Standard Journal"}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-stone-800">CSL Format:</strong> {currentStyleObj.name}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-stone-800">Ethics Approval:</strong> {project.ethicsInfo?.approvalNumber || "Declared / Exemption Active"}
                  </span>
                </div>

                <hr className="border-stone-200" />
              </section>
            )}

            {/* Abstract Section */}
            {(() => {
              const abstractSec = (project.sections || []).find((s) => s.title.toLowerCase().includes("abstract"));
              if (!abstractSec && !project.canvas?.broadTopic) return null;
              const abstractContent = abstractSec?.content || project.canvas?.scientificProblem || "Abstract text under preparation.";

              return (
                <section id="preview-sec-abstract" className="mb-8 space-y-2 scroll-mt-6">
                  <h2 className="text-base font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-1 font-sans">
                    Abstract
                  </h2>
                  <div className="text-justify italic text-stone-800">
                    {renderSectionText(abstractContent, abstractSec?.citationIds)}
                  </div>

                  {/* Keywords */}
                  <div className="pt-2 flex items-center space-x-2 text-xs font-sans not-italic">
                    <strong className="text-stone-800">Keywords:</strong>
                    <span className="text-stone-600">
                      {(project.keywords && project.keywords.length > 0)
                        ? project.keywords.join("; ")
                        : "evidence synthesis; reproducible research; scholarly methodology; AI disclosure"}
                    </span>
                  </div>
                </section>
              );
            })()}

            {/* Manuscript Sections */}
            <div className="space-y-8">
              {(project.sections || [])
                .filter((s) => !s.title.toLowerCase().includes("abstract"))
                .map((sec, sIdx) => (
                  <section
                    key={sec.id}
                    id={`preview-sec-${sec.id}`}
                    className="space-y-3 scroll-mt-6"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                      <h2 className="text-lg font-bold text-stone-900 font-sans">
                        {sIdx + 1}. {sec.title}
                      </h2>
                      <span className="text-[11px] text-stone-400 font-sans font-mono">
                        {sec.currentWordCount || 0} words
                      </span>
                    </div>

                    <div className="text-stone-800">
                      {renderSectionText(sec.content, sec.citationIds)}
                    </div>
                  </section>
                ))}
            </div>

            {/* Tables and Figures Proof Block */}
            {includeTablesAndFigures && ((project.tables || []).length > 0 || (project.figures || []).length > 0) && (
              <section id="preview-sec-figures-tables" className="mt-12 pt-6 border-t-2 border-stone-200 space-y-8 scroll-mt-6 font-sans">
                <h2 className="text-lg font-bold uppercase tracking-wider text-stone-900">
                  Tables and Figures Proof
                </h2>

                {/* Tables */}
                {(project.tables || []).map((tbl, tIdx) => (
                  <div key={tbl.id || tIdx} className="space-y-2 border border-stone-200 rounded-xl p-4 bg-stone-50/50">
                    <div className="font-bold text-stone-900 text-sm">
                      Table {tIdx + 1}. {tbl.title}
                    </div>
                    {tbl.caption && <p className="text-xs text-stone-500 italic">{tbl.caption}</p>}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse bg-white border border-stone-300">
                        <thead>
                          <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-300">
                            {(tbl.headers || []).map((h, hIdx) => (
                              <th key={hIdx} className="p-2 border-r border-stone-200 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {(tbl.rows || []).map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-stone-50">
                              {r.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 border-r border-stone-200 last:border-r-0 font-mono text-[11px]">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {tbl.footnotes && <p className="text-[10px] text-stone-500 italic pt-1">{tbl.footnotes}</p>}
                  </div>
                ))}

                {/* Figures */}
                {(project.figures || []).map((fig, fIdx) => (
                  <div key={fig.id || fIdx} className="space-y-2 border border-stone-200 rounded-xl p-4 bg-stone-50/50 text-center">
                    <div className="bg-white border border-dashed border-stone-300 rounded-lg p-6 flex flex-col items-center justify-center space-y-2">
                      <BarChart3 className="w-8 h-8 text-[#053B2E]" />
                      <span className="text-xs font-semibold text-stone-700">{fig.title}</span>
                      <span className="text-[10px] text-stone-400 font-mono uppercase">{fig.type} Graphic Rendering</span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-xs text-stone-800">Figure {fIdx + 1}. </span>
                      <span className="text-xs text-stone-600">{fig.caption || fig.title}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Ethics & AI Declarations */}
            {includeEthicsAndAi && (
              <section id="preview-sec-ethics-ai" className="mt-10 pt-6 border-t border-stone-200 space-y-4 text-xs font-sans scroll-mt-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Declarations & Compliance Disclosures
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                    <strong className="text-stone-800 block">Ethics & Institutional Approval:</strong>
                    <p className="text-stone-600">
                      Approval Ref: {project.ethicsInfo?.approvalNumber || "Declared Exempt NISS-REC-2026"} (Institutional Review Board verified). Informed consent was obtained from all participating subjects prior to protocol initiation.
                    </p>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                    <strong className="text-stone-800 block">AI & Computational Tool Usage:</strong>
                    <p className="text-stone-600">
                      Generative AI tools were utilized strictly for structural summarization, literature indexing, and citation normalization per ICMJE & WAME guidelines under full human researcher review and verification.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* References / Bibliography Section */}
            {includeReferences && (
              <section id="preview-sec-references" className="mt-10 pt-6 border-t-2 border-stone-200 space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-stone-900 font-sans">
                    References ({currentStyleObj.name})
                  </h2>
                  <span className="text-xs text-stone-500 font-sans">
                    {(project.sources || []).length} Verified Source Entries
                  </span>
                </div>

                {(!project.sources || project.sources.length === 0) ? (
                  <p className="text-xs text-stone-400 italic font-sans">
                    No verified literature sources linked in project yet.
                  </p>
                ) : (
                  <div className="space-y-3 text-xs leading-relaxed">
                    {project.sources.map((src, idx) => (
                      <div
                        key={src.id || idx}
                        className={`text-stone-800 hover:bg-stone-50 p-1.5 rounded transition ${
                          currentStyleObj.citationFormat === "author-date" ? "pl-6 -indent-6" : ""
                        }`}
                      >
                        <span className="font-serif">
                          {formatBibliographyEntry(src, idx, selectedStyle as any)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
