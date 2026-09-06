import type { CSLStyleOption, SourceRecord, TargetOutlet } from "../types";
import { getVerifiedRequirement } from "./outletRequirements";

export type CslStyleAvailability = "Available—Compatible" | "Unavailable";
export type CslStyleOrigin = "bundled" | "csl-file";

export interface CslStyleDefinition extends CSLStyleOption {
  availability: CslStyleAvailability;
  origin: CslStyleOrigin;
  exactJournalStyle: false;
  cslXml?: string;
}

export interface CitationProcessingResult {
  status: CslStyleAvailability;
  style?: CslStyleDefinition;
  inText: string;
  bibliography: string[];
  message?: string;
}

export interface OutletCslResolution {
  status: CslStyleAvailability;
  requestedStyle: string | null;
  styleId?: string;
  message: string;
  sourceRecordId?: string;
  sourceUrl?: string;
}

const bundled: CslStyleDefinition[] = [
  { id: "apa", name: "APA-compatible author-date", citationFormat: "author-date", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "apa-7th", name: "APA-compatible author-date", citationFormat: "author-date", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "ieee", name: "IEEE-compatible numeric", citationFormat: "numeric", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "nature", name: "Nature-compatible numeric", citationFormat: "superscript", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "vancouver", name: "Vancouver-compatible numeric", citationFormat: "numeric", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "chicago", name: "Chicago-compatible author-date", citationFormat: "author-date", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "chicago-notes", name: "Chicago-compatible notes", citationFormat: "footnote", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "harvard", name: "Harvard-compatible author-date", citationFormat: "author-date", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "springer", name: "Springer-compatible numeric", citationFormat: "numeric", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "elsevier", name: "Elsevier-compatible numeric", citationFormat: "numeric", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "acs", name: "ACS-compatible numeric", citationFormat: "superscript", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "ama", name: "AMA-compatible numeric", citationFormat: "superscript", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "mla", name: "MLA-compatible author-page", citationFormat: "author-date", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "cell", name: "Cell-compatible author-date", citationFormat: "author-date", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "oxford", name: "Oxford-compatible notes", citationFormat: "footnote", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
  { id: "plos", name: "PLOS-compatible numeric", citationFormat: "numeric", availability: "Available—Compatible", origin: "bundled", exactJournalStyle: false },
];

const styleRegistry = new Map<string, CslStyleDefinition>(bundled.map((style) => [style.id, style]));
const unavailableOption: CSLStyleOption = { id: "unavailable", name: "Reference style unavailable", citationFormat: "author-date" };
export const CSL_STYLES: CSLStyleOption[] = [...bundled, unavailableOption];
export const CSL_STYLE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  bundled.map((style) => [style.id, `${style.name}; compatible rendering, not a claim of exact journal conformance`]),
);

function xmlValue(xml: string, tag: string): string | undefined {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1]?.replace(/<[^>]+>/g, "").trim();
}

/** Registers a CSL 1.x file for compatible rendering without claiming exact conformance. */
export function registerCslStyleFile(xml: string): CslStyleDefinition {
  if (!/<style\b[^>]*xmlns=["']http:\/\/purl\.org\/net\/xbiblio\/csl["'][^>]*>/i.test(xml)) {
    throw new Error("Invalid CSL file: a CSL style root and namespace are required.");
  }
  const id = xmlValue(xml, "id");
  const title = xmlValue(xml, "title");
  const citationFormat = xml.match(/<category\b[^>]*citation-format=["'](author-date|numeric|note)["']/i)?.[1];
  if (!id || !title || !citationFormat) throw new Error("Invalid CSL file: info id, title, and citation-format category are required.");
  const normalizedFormat: CSLStyleOption["citationFormat"] = citationFormat === "note" ? "footnote" : citationFormat as "author-date" | "numeric";
  const definition: CslStyleDefinition = {
    id, name: `${title} (CSL-compatible)`, citationFormat: normalizedFormat,
    availability: "Available—Compatible", origin: "csl-file", exactJournalStyle: false, cslXml: xml,
  };
  styleRegistry.set(id, definition);
  return definition;
}

export function getCslStyle(styleId: string): CslStyleDefinition | undefined {
  return styleRegistry.get(styleId);
}

const LABEL_TO_ID: Array<[RegExp, string]> = [
  [/\bAPA(?:\s*7(?:th)?)?\b/i, "apa"], [/\bIEEE\b/i, "ieee"], [/\bVancouver\b|\bNLM\b/i, "vancouver"],
  [/\bChicago\b/i, "chicago"], [/\bHarvard\b/i, "harvard"], [/\bNature\b/i, "nature"], [/\bACS\b/i, "acs"],
  [/\bAMA\b/i, "ama"], [/\bMLA\b/i, "mla"], [/\bPLOS\b/i, "plos"], [/\bSpringer\b/i, "springer"],
];

export function resolveCslStyleId(labelOrId: string | null | undefined): string | undefined {
  const value = labelOrId?.trim();
  if (!value || /^(?:unverified|unavailable|not configured)$/i.test(value)) return undefined;
  if (styleRegistry.has(value)) return value;
  return LABEL_TO_ID.find(([pattern]) => pattern.test(value))?.[1];
}

/** Resolves only verified field-level outlet requirements; top-level citationStyle is not evidence. */
export function resolveOutletCslStyle(outlet: TargetOutlet): OutletCslResolution {
  const requirement = getVerifiedRequirement(outlet, "referenceStyle");
  const requestedStyle = typeof requirement?.value === "string" ? requirement.value : null;
  const styleId = resolveCslStyleId(requestedStyle);
  if (!requirement || !requestedStyle || !styleId) {
    return {
      status: "Unavailable", requestedStyle,
      message: requirement ? "Verified outlet style is not available to the citation processor." : "Verified outlet reference style is unavailable.",
      sourceRecordId: requirement?.id, sourceUrl: requirement?.sourceUrl,
    };
  }
  return {
    status: "Available—Compatible", requestedStyle, styleId,
    message: "Compatible CSL rendering is available; exact journal conformance is not claimed.",
    sourceRecordId: requirement.id, sourceUrl: requirement.sourceUrl,
  };
}

function lastName(fullName: string): string {
  if (fullName.includes(",")) return fullName.split(",")[0]?.trim() || "Unknown";
  return fullName.trim().split(/\s+/).filter(Boolean).pop() || "Unknown";
}

function numbersFor(sources: SourceRecord[], allSources?: SourceRecord[]): number[] {
  return sources.map((source, index) => {
    const globalIndex = allSources?.findIndex((candidate) => candidate.id === source.id) ?? -1;
    return globalIndex >= 0 ? globalIndex + 1 : index + 1;
  });
}

function renderAuthorDate(sources: SourceRecord[]): string {
  return `(${sources.map((source) => {
    const authors = source.authors || [];
    const author = authors.length === 0 ? "Unknown" : authors.length === 1 ? lastName(authors[0]) : authors.length === 2
      ? `${lastName(authors[0])} & ${lastName(authors[1])}` : `${lastName(authors[0])} et al.`;
    return `${author}, ${source.year || "n.d."}`;
  }).join("; ")})`;
}

function renderBibliography(source: SourceRecord, index: number, style: CslStyleDefinition): string {
  const authors = (source.authors || []).join(", ") || "Unknown";
  const year = source.year || "n.d.";
  const title = source.title || "Untitled";
  const venue = source.journalOrVenue || "Unspecified Source";
  const details = [source.volume, source.issue ? `(${source.issue})` : undefined, source.pages].filter(Boolean).join("");
  const doi = source.doi ? ` https://doi.org/${source.doi}` : "";
  if (style.citationFormat === "author-date") return `${authors} (${year}). ${title}. *${venue}*${details ? `, ${details}` : ""}.${doi}`;
  if (style.id === "ieee") return `[${index + 1}] ${authors}, "${title}," *${venue}*${details ? `, ${details}` : ""}, ${year}.${doi}`;
  return `${index + 1}. ${authors}. ${title}. ${venue}. ${year}${details ? `;${details}` : ""}.${doi}`;
}

/** The single processor used for in-text and bibliography rendering. */
export function processCitationStyle(sources: SourceRecord[], styleId: string, allSources?: SourceRecord[]): CitationProcessingResult {
  const style = getCslStyle(styleId);
  if (!style) return { status: "Unavailable", inText: "", bibliography: [], message: `CSL style '${styleId}' is unavailable.` };
  const numbers = numbersFor(sources, allSources);
  const inText = style.citationFormat === "author-date" ? renderAuthorDate(sources)
    : style.citationFormat === "numeric" ? `[${numbers.join(", ")}]`
      : style.citationFormat === "superscript" ? numbers.map((number) => `[${number}]`).join("")
        : `[${numbers.join(",")}]`;
  return {
    status: "Available—Compatible", style, inText,
    bibliography: sources.map((source, index) => {
      const globalIndex = allSources?.findIndex((item) => item.id === source.id) ?? -1;
      return renderBibliography(source, globalIndex >= 0 ? globalIndex : index, style);
    }),
    message: "Compatible rendering; exact journal conformance is not claimed.",
  };
}

export function formatInTextCitation(sources: SourceRecord[], styleId: CSLStyleOption["id"], allSources?: SourceRecord[]): string {
  return processCitationStyle(sources, styleId, allSources).inText;
}

export function formatBibliographyEntry(source: SourceRecord, index: number, styleId: CSLStyleOption["id"]): string {
  const style = getCslStyle(styleId);
  return style ? renderBibliography(source, index, style) : "Citation style unavailable.";
}
