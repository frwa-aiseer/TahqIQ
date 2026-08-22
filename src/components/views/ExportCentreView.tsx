import React, { useState, useEffect } from "react";
import { ProjectState, CSLStyleOption, TargetOutlet, ExportJobRecord } from "../../types";
import {
  generateGenuineDocxBlob,
  downloadPdfPackage,
  generateJatsXml,
  validateJatsXml,
  generateBibTeX,
  generateRIS,
  generateCslJson,
  triggerSafeDownload,
  createExportJobRecord,
  DocxExportConfig,
} from "../../lib/exportUtils";
import { calculateComplianceRules, evaluateExportGateChecks } from "../../lib/complianceEngine";
import { CSL_STYLES } from "../../lib/cslStyles";
import { JournalSelectorDropdown } from "../JournalSelectorDropdown";
import { ManuscriptPreviewPane } from "../ManuscriptPreviewPane";
import {
  ShieldCheck,
  Download,
  CheckCircle2,
  FileText,
  Code,
  AlertTriangle,
  Sliders,
  BookOpen,
  ExternalLink,
  Lock,
  History,
  Calendar,
  AlertOctagon,
  FileJson,
  Database,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

interface ExportCentreViewProps {
  project: ProjectState;
  activeCslStyle: CSLStyleOption["id"];
  onSelectOutlet?: (outlet: TargetOutlet) => void;
  onUpdateProject?: (updated: Partial<ProjectState>) => void;
}

export const ExportCentreView: React.FC<ExportCentreViewProps> = ({
  project,
  activeCslStyle,
  onSelectOutlet,
  onUpdateProject,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [exportMode, setExportMode] = useState<"Submission-Ready" | "Draft Review">("Submission-Ready");

  const outlet = project.selectedTargetOutlet;

  // Formatting Export Configurations - automatically pre-populated from outlet guidelines
  const [lineSpacing, setLineSpacing] = useState<1.0 | 1.15 | 1.5 | 2.0>(outlet?.lineSpacing || 1.5);
  const [fontFamily, setFontFamily] = useState<"Times New Roman" | "Arial" | "Calibri" | "Georgia">(outlet?.fontFamily || "Times New Roman");
  const [fontSizePt, setFontSizePt] = useState<number>(outlet?.fontSizePt || 12);
  const [includeTitlePage, setIncludeTitlePage] = useState<boolean>(true);
  const [includeTablesAndFigures, setIncludeTablesAndFigures] = useState<boolean>(true);
  const [includeReferences, setIncludeReferences] = useState<boolean>(true);
  const [includeEthicsAndAi, setIncludeEthicsAndAi] = useState<boolean>(true);
  const [selectedStyle, setSelectedStyle] = useState<string>(activeCslStyle || "apa");

  // Sync state when project selectedTargetOutlet changes
  useEffect(() => {
    if (outlet) {
      if (outlet.lineSpacing) setLineSpacing(outlet.lineSpacing);
      if (outlet.fontFamily) setFontFamily(outlet.fontFamily);
      if (outlet.fontSizePt) setFontSizePt(outlet.fontSizePt);
    }
  }, [outlet]);

  // Calculated Compliance Rules & Gate Checks
  const calculatedRules = calculateComplianceRules(project, outlet);
  const gateChecks = evaluateExportGateChecks(project, exportMode);
  const hasBlockers = gateChecks.some((g) => g.status === "Blocker");
  const blockerCount = gateChecks.filter((g) => g.status === "Blocker").length;

  const totalWordCount = (project.sections || []).reduce((acc, s) => acc + (s.currentWordCount || 0), 0);

  // Helper to record job and update project
  const recordJob = (
    format: ExportJobRecord["exportFormat"],
    components: ExportJobRecord["includedComponents"]
  ) => {
    const job = createExportJobRecord(
      project,
      format,
      exportMode,
      gateChecks,
      components,
      project.authors?.[0]?.email || "researcher@institution.edu"
    );
    const updatedHistory = [job, ...(project.exportHistory || [])];
    if (onUpdateProject) {
      onUpdateProject({ exportHistory: updatedHistory });
    }
  };

  const handleExportDocx = async () => {
    if (exportMode === "Submission-Ready" && hasBlockers) {
      setExportNotice({
        type: "error",
        message: `Submission-Ready export blocked! ${blockerCount} critical quality gate check(s) must be resolved first. Switch to 'Draft Review' or fix blockers.`,
      });
      return;
    }

    setIsExporting(true);
    setExportNotice(null);
    try {
      const config: DocxExportConfig = {
        lineSpacing,
        fontFamily,
        fontSizePt,
        includeTitlePage,
        includeTablesAndFigures,
        includeReferences,
        includeEthicsAndAiDisclosure: includeEthicsAndAi,
        cslStyle: selectedStyle,
        exportMode,
      };
      const blob = await generateGenuineDocxBlob(project, config);
      const safeTitle = (project.title || "Manuscript").substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
      triggerSafeDownload(blob, `${safeTitle}_${exportMode === "Draft Review" ? "DRAFT" : "SUBMISSION"}.docx`);

      recordJob("DOCX", {
        titlePage: includeTitlePage,
        abstract: true,
        sections: true,
        figuresAndTables: includeTablesAndFigures,
        bibliography: includeReferences,
        ethicsAndAiDisclosure: includeEthicsAndAi,
        supplementarySelections: false,
      });

      setExportNotice({
        type: "success",
        message: `Genuine DOCX document generated and downloaded (~${totalWordCount} words, ${lineSpacing}x spacing, ${fontFamily}).`,
      });
    } catch (e: any) {
      setExportNotice({ type: "error", message: "Failed to export Word file: " + e.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (exportMode === "Submission-Ready" && hasBlockers) {
      setExportNotice({
        type: "error",
        message: `Submission-Ready export blocked! ${blockerCount} critical quality gate check(s) must be resolved first. Switch to 'Draft Review' or fix blockers.`,
      });
      return;
    }

    setIsExporting(true);
    setExportNotice(null);
    try {
      const config: DocxExportConfig = {
        lineSpacing,
        fontFamily,
        fontSizePt,
        includeTitlePage,
        includeTablesAndFigures,
        includeReferences,
        includeEthicsAndAiDisclosure: includeEthicsAndAi,
        cslStyle: selectedStyle,
        exportMode,
      };
      downloadPdfPackage(project, config, exportMode);

      recordJob("PDF", {
        titlePage: includeTitlePage,
        abstract: true,
        sections: true,
        figuresAndTables: includeTablesAndFigures,
        bibliography: includeReferences,
        ethicsAndAiDisclosure: includeEthicsAndAi,
        supplementarySelections: false,
      });

      setExportNotice({
        type: "success",
        message: `Complete PDF proof package generated and downloaded. ${exportMode === "Draft Review" ? "(Draft Review Watermark Applied)" : ""}`,
      });
    } catch (e: any) {
      setExportNotice({ type: "error", message: "Failed to export PDF: " + e.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBibTeX = () => {
    const bibStr = generateBibTeX(project);
    const blob = new Blob([bibStr], { type: "text/plain;charset=utf-8" });
    const safeTitle = (project.title || "References").substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
    triggerSafeDownload(blob, `${safeTitle}.bib`);

    recordJob("BibTeX", {
      titlePage: false,
      abstract: false,
      sections: false,
      figuresAndTables: false,
      bibliography: true,
      ethicsAndAiDisclosure: false,
      supplementarySelections: false,
    });
    setExportNotice({ type: "success", message: `BibTeX file exported with ${project.sources?.length || 0} verified references.` });
  };

  const handleExportRis = () => {
    const risStr = generateRIS(project);
    const blob = new Blob([risStr], { type: "text/plain;charset=utf-8" });
    const safeTitle = (project.title || "References").substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
    triggerSafeDownload(blob, `${safeTitle}.ris`);

    recordJob("RIS", {
      titlePage: false,
      abstract: false,
      sections: false,
      figuresAndTables: false,
      bibliography: true,
      ethicsAndAiDisclosure: false,
      supplementarySelections: false,
    });
    setExportNotice({ type: "success", message: `RIS file exported with ${project.sources?.length || 0} verified references.` });
  };

  const handleExportCslJson = () => {
    const cslStr = generateCslJson(project);
    const blob = new Blob([cslStr], { type: "application/json;charset=utf-8" });
    const safeTitle = (project.title || "References").substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
    triggerSafeDownload(blob, `${safeTitle}.csl.json`);

    recordJob("CSL JSON", {
      titlePage: false,
      abstract: false,
      sections: false,
      figuresAndTables: false,
      bibliography: true,
      ethicsAndAiDisclosure: false,
      supplementarySelections: false,
    });
    setExportNotice({ type: "success", message: `CSL JSON schema file exported with ${project.sources?.length || 0} verified references.` });
  };

  const handleExportJats = () => {
    const xmlStr = generateJatsXml(project);
    const validation = validateJatsXml(xmlStr);

    const blob = new Blob([xmlStr], { type: "application/xml;charset=utf-8" });
    const safeTitle = (project.title || "Manuscript").substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
    triggerSafeDownload(blob, `${safeTitle}.jats.xml`);

    recordJob("JATS XML", {
      titlePage: true,
      abstract: true,
      sections: true,
      figuresAndTables: true,
      bibliography: true,
      ethicsAndAiDisclosure: true,
      supplementarySelections: false,
    });

    setExportNotice({
      type: validation.isValid ? "success" : "warning",
      message: `${validation.label} exported. ${validation.isValid ? "100% NLM DTD compliant." : "Labeled as experimental/unvalidated per submission rules."}`,
    });
  };

  const jatsSampleXml = generateJatsXml(project);
  const jatsValidation = validateJatsXml(jatsSampleXml);

  return (
    <div className="space-y-6">
      {/* Header & Export Mode Switcher */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#053B2E]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#053B2E]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Preview & Manuscript Export</h2>
            <p className="text-xs text-stone-500">
              Quality gates, CSL style formatting, and multi-format publication export for {outlet?.title || "Target Journal"}.
            </p>
          </div>
        </div>

        {/* Export Mode Toggle */}
        <div className="flex items-center bg-stone-200/60 p-1 rounded-lg self-start md:self-auto text-xs">
          <button
            onClick={() => setExportMode("Submission-Ready")}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center space-x-1.5 ${
              exportMode === "Submission-Ready" ? "bg-[#053B2E] text-white shadow-2xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Submission-Ready</span>
          </button>
          <button
            onClick={() => setExportMode("Draft Review")}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center space-x-1.5 ${
              exportMode === "Draft Review" ? "bg-amber-600 text-white shadow-2xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Draft Review</span>
          </button>
        </div>
      </div>

      {/* Critical Export Blockers Banner */}
      {exportMode === "Submission-Ready" && hasBlockers && (
        <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center space-x-2 text-rose-900 font-bold font-serif text-lg">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
            <h3>Export Gate Blocked: {blockerCount} Unresolved Quality & Integrity Violation(s)</h3>
          </div>
          <p className="text-xs text-rose-800">
            Per TehqIQ submission assurance rules, manuscript export is strictly blocked for "Submission-Ready" mode until all unverified, unlinked, or unauthorized records are resolved.
          </p>

          <div className="space-y-2 pt-1">
            {gateChecks
              .filter((g) => g.status === "Blocker")
              .map((b) => (
                <div key={b.checkId} className="bg-white p-3 rounded-lg border border-rose-200 text-xs text-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span className="flex items-center space-x-1.5">
                      <X className="w-4 h-4 text-rose-600" />
                      <span>{b.name}</span>
                    </span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                      {b.category}
                    </span>
                  </div>
                  <p className="text-slate-700">{b.message}</p>
                  <p className="text-indigo-800 font-semibold bg-indigo-50 p-1.5 rounded text-[11px]">
                    <strong>Fix Action:</strong> {b.resolutionPath}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Section 1: Versioned Outlet Requirement Records & Dated Claims */}
      {outlet && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#0B5D4B]" />
              <div>
                <h3 className="font-serif font-bold text-lg text-[#102A43]">
                  Versioned Outlet Requirements & Verified Dated Claims
                </h3>
                <p className="text-xs text-slate-500">
                  Requirements and metrics anchored to official publisher primary URLs and verification dates.
                </p>
              </div>
            </div>

            {onSelectOutlet && (
              <JournalSelectorDropdown selectedOutlet={project.selectedTargetOutlet} onSelectOutlet={onSelectOutlet} variant="toolbar" />
            )}
          </div>

          {/* Metrics & Metrics Separation (JCR Quartile / CiteScore Percentile / Unverified) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* JCR Quartile */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#102A43]">
                <span>Clarivate JCR Quartile</span>
                {outlet.metrics?.jcrQuartile?.quartile ? (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    {outlet.metrics.jcrQuartile.quartile}
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                    Not Available
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {outlet.metrics?.jcrQuartile ? (
                  <>
                    Official Year: {outlet.metrics.jcrQuartile.year} | Human Confirmed:{" "}
                    {outlet.metrics.jcrQuartile.humanConfirmed ? "Yes" : "No"}
                  </>
                ) : (
                  "Official JCR record not linked. Researcher confirmation required."
                )}
              </p>
              <a
                href={outlet.metrics?.jcrQuartile?.officialSourceUrl || "https://journalcitationreports.clarivate.com/"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-700 hover:underline text-[11px] font-semibold"
              >
                <span>Clarivate Journal Citation Reports</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Scopus CiteScore Percentile */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#102A43]">
                <span>Scopus CiteScore Percentile</span>
                {outlet.metrics?.citeScorePercentile?.percentile !== undefined ? (
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    {outlet.metrics.citeScorePercentile.percentile}%ile
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                    Not Available
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {outlet.metrics?.citeScorePercentile ? (
                  <>
                    Rank: {outlet.metrics.citeScorePercentile.rank} | Source Verified:{" "}
                    {outlet.metrics.citeScorePercentile.retrievalDate}
                  </>
                ) : (
                  "Official CiteScore record not linked. Primary Scopus lookup required."
                )}
              </p>
              <a
                href={outlet.metrics?.citeScorePercentile?.officialSourceUrl || "https://www.scopus.com/sources"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-700 hover:underline text-[11px] font-semibold"
              >
                <span>Scopus Primary Source Directory</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Unverified / Aggregated Metrics Notice */}
            <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>Unverified Third-Party Metrics</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                  {outlet.metrics?.unverifiedMetrics?.length ? "Unverified" : "None"}
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                {outlet.metrics?.unverifiedMetrics?.[0] ? (
                  `${outlet.metrics.unverifiedMetrics[0].metricName}: ${outlet.metrics.unverifiedMetrics[0].value}`
                ) : (
                  "No unverified metrics recorded. Strict publisher claims only."
                )}
              </p>
              <p className="text-[10px] text-amber-700 italic">
                Notice: Third-party aggregated indices are kept strictly separate from verified publisher metrics per TehqIQ standards.
              </p>
            </div>
          </div>

          {/* Dated Claims Grid */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-[#102A43] uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#0B5D4B]" />
              <span>Publisher Dated Claims & Primary Sources</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(outlet.datedClaims || []).map((claim, idx) => (
                <div key={idx} className="bg-white p-3 rounded border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 capitalize">
                    <span>{claim.claimName.replace("_", " ")}</span>
                    <span className="text-[10px] font-mono text-slate-500">{claim.retrievalDate}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{claim.value}</p>
                  <a
                    href={claim.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-indigo-600 hover:underline text-[10px] font-mono truncate max-w-full"
                  >
                    <span className="truncate">{claim.officialSourceUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Dynamically Calculated Compliance Rules Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <Sliders className="w-5 h-5 text-[#0B5D4B]" />
          <div>
            <h3 className="font-serif font-bold text-lg text-[#102A43]">
              Calculated Manuscript Compliance Rules
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated in real-time from active manuscript draft and project state against {outlet?.title || "Target Guidelines"}.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                <th className="p-3">Category</th>
                <th className="p-3">Requirement</th>
                <th className="p-3">Target Standard</th>
                <th className="p-3">Actual Value</th>
                <th className="p-3">Status</th>
                <th className="p-3">Official Primary Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculatedRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-600">{rule.category}</td>
                  <td className="p-3 font-bold text-slate-900">{rule.requirementName}</td>
                  <td className="p-3 font-mono text-slate-700">{rule.requiredValue}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{rule.actualValue}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded font-bold text-[11px] ${
                        rule.status === "Pass"
                          ? "bg-emerald-100 text-emerald-800"
                          : rule.status === "Warning"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {rule.status === "Pass" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{rule.status}</span>
                    </span>
                    {rule.actionRequired && (
                      <p className="text-[10px] text-rose-700 font-semibold mt-1 max-w-xs">{rule.actionRequired}</p>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <a
                      href={rule.officialSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center space-x-1"
                    >
                      <span className="truncate max-w-[140px]">{rule.officialSourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-[10px] text-slate-400 block">Verified: {rule.retrievalDate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Formatting & Export Configuration Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-lg text-[#102A43] border-b pb-3">
          Document Output & Export Formatting Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Line Spacing */}
          <div>
            <label className="block font-bold text-[#102A43] mb-1">Line Spacing:</label>
            <select
              value={lineSpacing}
              onChange={(e) => setLineSpacing(parseFloat(e.target.value) as 1.0 | 1.5 | 2.0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-[#102A43] focus:outline-none focus:border-[#0B5D4B]"
            >
              <option value={2.0}>2.0 (Double Spaced - Q1 Standard)</option>
              <option value={1.5}>1.5 Line Spacing</option>
              <option value={1.0}>1.0 Single Spacing</option>
            </select>
          </div>

          {/* Typography Font */}
          <div>
            <label className="block font-bold text-[#102A43] mb-1">Font Family:</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-[#102A43] focus:outline-none focus:border-[#0B5D4B]"
            >
              <option value="Times New Roman">Times New Roman (Standard)</option>
              <option value="Arial">Arial (Sans-serif)</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          {/* Citation Style Selector */}
          <div>
            <label className="block font-bold text-[#102A43] mb-1">Bibliography Style:</label>
            <select
              value={selectedStyle}
              onChange={(e) => {
                const newStyle = e.target.value;
                setSelectedStyle(newStyle);
                if (onUpdateProject) {
                  onUpdateProject({ activeCslStyle: newStyle });
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-[#102A43] focus:outline-none focus:border-[#0B5D4B]"
            >
              {CSL_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.citationFormat})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Component Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTitlePage}
              onChange={(e) => setIncludeTitlePage(e.target.checked)}
              className="rounded text-[#0B5D4B]"
            />
            <span className="font-semibold text-slate-700">Include Title Page & Author Metadata</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTablesAndFigures}
              onChange={(e) => setIncludeTablesAndFigures(e.target.checked)}
              className="rounded text-[#0B5D4B]"
            />
            <span className="font-semibold text-slate-700">Include Tables & Figure Captions</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeReferences}
              onChange={(e) => setIncludeReferences(e.target.checked)}
              className="rounded text-[#0B5D4B]"
            />
            <span className="font-semibold text-slate-700">Include Formatted Bibliography</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEthicsAndAi}
              onChange={(e) => setIncludeEthicsAndAi(e.target.checked)}
              className="rounded text-[#0B5D4B]"
            />
            <span className="font-semibold text-slate-700">Include Ethics & AI Disclosure Declarations</span>
          </label>
        </div>
      </div>

      {/* Interactive Read-Only Manuscript Proof Preview Pane */}
      <ManuscriptPreviewPane
        project={project}
        selectedStyle={selectedStyle}
        lineSpacing={lineSpacing}
        fontFamily={fontFamily}
        fontSizePt={fontSizePt}
        includeTitlePage={includeTitlePage}
        includeTablesAndFigures={includeTablesAndFigures}
        includeReferences={includeReferences}
        includeEthicsAndAi={includeEthicsAndAi}
        exportMode={exportMode}
        onExportDocx={handleExportDocx}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        hasBlockers={hasBlockers}
      />

      {exportNotice && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 text-xs font-semibold ${
            exportNotice.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : exportNotice.type === "warning"
              ? "bg-amber-50 border border-amber-200 text-amber-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {exportNotice.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{exportNotice.message}</span>
        </div>
      )}

      {/* Section 4: Export Format Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Genuine DOCX */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileText className="w-7 h-7 text-[#0B5D4B]" />
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                Genuine Word (.docx)
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#102A43]">Formatted Word Document (.docx)</h3>
            <p className="text-xs text-slate-600">
              Export manuscript formatted with genuine docx library, custom line spacing ({lineSpacing}x), {fontFamily} typography, and XML table structures.
            </p>
          </div>

          <button
            onClick={handleExportDocx}
            disabled={isExporting}
            className={`w-full font-bold text-xs py-3 rounded-lg transition shadow-sm flex items-center justify-center space-x-2 ${
              exportMode === "Submission-Ready" && hasBlockers
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : "bg-[#0B5D4B] hover:bg-[#0B5D4B]/90 text-white"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating DOCX..." : "Export Genuine DOCX"}</span>
          </button>
        </div>

        {/* Complete PDF Package */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Download className="w-7 h-7 text-[#C8902F]" />
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  exportMode === "Draft Review" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                }`}
              >
                {exportMode} PDF
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#102A43]">Complete PDF Proof Package</h3>
            <p className="text-xs text-slate-600">
              Camera-ready complete multi-page PDF layout with title page, abstract, sections, figures, tables, and {selectedStyle.toUpperCase()} references.
            </p>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className={`w-full font-bold text-xs py-3 rounded-lg transition shadow-sm flex items-center justify-center space-x-2 ${
              exportMode === "Submission-Ready" && hasBlockers
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : "bg-[#102A43] hover:bg-[#102A43]/90 text-white"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export PDF Proof Package</span>
          </button>
        </div>

        {/* JATS XML with Validation Label */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Code className="w-7 h-7 text-indigo-600" />
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  jatsValidation.isValid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {jatsValidation.label}
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#102A43]">JATS XML Archival Package</h3>
            <p className="text-xs text-slate-600">
              Journal Article Tag Suite XML format. Validation status is dynamically evaluated and clearly labeled per submission rules.
            </p>
          </div>

          <button
            onClick={handleExportJats}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-lg transition border flex items-center justify-center space-x-2"
          >
            <Code className="w-4 h-4 text-indigo-600" />
            <span>Export JATS XML</span>
          </button>
        </div>

        {/* BibTeX */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileText className="w-7 h-7 text-[#C8902F]" />
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                .BIB
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#102A43]">BibTeX Bibliography (.bib)</h3>
            <p className="text-xs text-slate-600">
              Valid BibTeX entries with escaped characters, DOIs, URLs, and stable citekeys for LaTeX integration.
            </p>
          </div>

          <button
            onClick={handleExportBibTeX}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-lg transition border flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Export BibTeX (.bib)</span>
          </button>
        </div>

        {/* RIS Export */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Database className="w-7 h-7 text-teal-600" />
              <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                .RIS
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#102A43]">RIS Reference Format (.ris)</h3>
            <p className="text-xs text-slate-600">
              Research Information Systems RIS file for Zotero, EndNote, Mendeley, and RefWorks.
            </p>
          </div>

          <button
            onClick={handleExportRis}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-lg transition border flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Export RIS (.ris)</span>
          </button>
        </div>

        {/* CSL JSON */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileJson className="w-7 h-7 text-indigo-600" />
              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                CSL-JSON
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#102A43]">CSL JSON Schema (.json)</h3>
            <p className="text-xs text-slate-600">
              Citation Style Language standard JSON schema representation for automated metadata pipelines.
            </p>
          </div>

          <button
            onClick={handleExportCslJson}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-lg transition border flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export CSL JSON</span>
          </button>
        </div>
      </div>

      {/* Section 5: Persisted Export Job History Log */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <History className="w-5 h-5 text-[#102A43]" />
          <div>
            <h3 className="font-serif font-bold text-lg text-[#102A43]">Export Job Event History</h3>
            <p className="text-xs text-slate-500">
              Audit log of recorded manuscript export events with quality gate status snapshots.
            </p>
          </div>
        </div>

        {(!project.exportHistory || project.exportHistory.length === 0) ? (
          <p className="text-xs text-slate-500 italic py-4">No export jobs recorded in project history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Export Format</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Outlet</th>
                  <th className="p-3">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {project.exportHistory.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-indigo-900">{job.jobId}</td>
                    <td className="p-3 text-slate-600">{new Date(job.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-slate-700 font-sans">{job.userEmail}</td>
                    <td className="p-3 font-bold text-slate-800">{job.exportFormat}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                          job.exportMode === "Submission-Ready" ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {job.exportMode}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-800">{job.selectedOutletTitle || "Standard"}</td>
                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          job.status === "Success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
