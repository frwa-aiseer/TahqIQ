import { ManuscriptSection, SourceRecord, CSLStyleOption } from "../types";

export interface CitationOccurrence {
  id: string;
  rawText: string;
  sectionId: string;
  sectionTitle: string;
  authorOrRef: string;
  year?: number;
  numericIndex?: number;
  matchedSource?: SourceRecord;
  status: "matched" | "missing" | "format_mismatch";
  excerpt: string;
}

export interface UncitedSource {
  source: SourceRecord;
  reason: string;
}

export interface BibliographicIssue {
  source: SourceRecord;
  missingFields: string[];
  issueSeverity: "high" | "medium" | "low";
  description: string;
}

export interface CitationVerificationReport {
  timestamp: string;
  totalCitationsFound: number;
  matchedCount: number;
  missingCount: number;
  uncitedSourcesCount: number;
  bibliographicIssuesCount: number;
  overallScore: number; // 0 to 100%
  occurrences: CitationOccurrence[];
  missingCitations: CitationOccurrence[];
  uncitedSources: UncitedSource[];
  bibliographicIssues: BibliographicIssue[];
  styleWarnings: string[];
}

/**
 * Extracts author last name from a full name string strictly without title fallback
 */
function getLastName(fullName: string): string {
  if (!fullName) return "";
  const cleaned = fullName.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, "").trim();
  if (cleaned.includes(",")) {
    return cleaned.split(",")[0].trim();
  }
  const parts = cleaned.split(/\s+/);
  return parts[parts.length - 1] || "";
}

/**
 * Verifies all in-text citations across all manuscript sections against the Source Library.
 * Phase 3 Integrity Rules:
 * - NO title-word fallback matching allowed.
 * - In-text citations and bibliography MUST synchronize through stable source IDs or exact author+year matching.
 */
export function verifyManuscriptCitations(
  sections: ManuscriptSection[],
  sources: SourceRecord[],
  activeCslStyle: CSLStyleOption["id"] = "apa"
): CitationVerificationReport {
  const occurrences: CitationOccurrence[] = [];
  const styleWarnings: string[] = [];

  sections.forEach((sec) => {
    const text = sec.content || "";
    if (!text.trim()) return;

    // Pattern A: Explicit Stable ID citations e.g. [src-1] or [src-101] or (src-123)
    const stableIdRegex = /\[?(src-[a-zA-Z0-9_\-]+)\]?/g;
    let match: RegExpExecArray | null;

    while ((match = stableIdRegex.exec(text)) !== null) {
      const rawText = match[0];
      const sourceId = match[1];

      // Avoid capturing standard non-source words
      if (sourceId.startsWith("src-")) {
        const targetSource = sources.find((s) => s.id === sourceId);

        const startIdx = Math.max(0, match.index - 35);
        const endIdx = Math.min(text.length, match.index + rawText.length + 35);
        const excerpt = "..." + text.substring(startIdx, endIdx).replace(/\n/g, " ") + "...";

        occurrences.push({
          id: `${sec.id}-stable-${match.index}`,
          rawText,
          sectionId: sec.id,
          sectionTitle: sec.title,
          authorOrRef: targetSource?.authors?.[0] ? `${getLastName(targetSource.authors[0])} (${targetSource.year})` : sourceId,
          year: targetSource?.year,
          matchedSource: targetSource,
          status: targetSource ? "matched" : "missing",
          excerpt,
        });
      }
    }

    // Pattern B: Parenthetical / Bracketed citations e.g. (Boyer et al., 2021), [Mendiguchia, 2022]
    const bracketRegex = /(\[|\()([^\]\)]*?\b(19\d\d|20\d\d)\b[^\]\)]*?)(\]|\))/g;

    while ((match = bracketRegex.exec(text)) !== null) {
      const rawText = match[0];
      const innerContent = match[2];
      const yearMatch = match[3];
      const year = parseInt(yearMatch, 10);

      // Skip if already processed as stable source ID
      if (innerContent.includes("src-")) continue;

      const startIdx = Math.max(0, match.index - 35);
      const endIdx = Math.min(text.length, match.index + rawText.length + 35);
      const excerpt = "..." + text.substring(startIdx, endIdx).replace(/\n/g, " ") + "...";

      const subCitations = innerContent.split(";");
      subCitations.forEach((sub, idx) => {
        const subClean = sub.trim();
        const subYearMatch = subClean.match(/\b(19\d\d|20\d\d)\b/);
        const subYear = subYearMatch ? parseInt(subYearMatch[1], 10) : year;

        // Strict Matching: MUST match exact author surname AND exact year!
        // REMOVED title-word fallback matching as required by Phase 3.
        const matchedSource = sources.find((s) => {
          if (s.year !== subYear) return false;
          return (s.authors || []).some((auth) => {
            const lName = getLastName(auth).toLowerCase();
            return lName.length > 2 && subClean.toLowerCase().includes(lName);
          });
        });

        const authorNameExtracted = subClean.split(/,|et\s+al/i)[0].trim().replace(/^[\[\(]/, "");

        occurrences.push({
          id: `${sec.id}-cit-${match!.index}-${idx}`,
          rawText,
          sectionId: sec.id,
          sectionTitle: sec.title,
          authorOrRef: authorNameExtracted || "Cited Scholar",
          year: subYear,
          matchedSource,
          status: matchedSource ? "matched" : "missing",
          excerpt,
        });
      });
    }

    // Pattern C: Narrative in-text citations e.g., Boyer et al. (2021) or Pérez-Gómez et al. (2024)
    const narrativeRegex = /\b([\p{L}\-']+)(?:\s+et\s+al\.)?\s*\((19\d\d|20\d\d)\)/gu;
    while ((match = narrativeRegex.exec(text)) !== null) {
      const rawText = match[0];
      const authorName = match[1];
      const year = parseInt(match[2], 10);

      const alreadyCaptured = occurrences.some(
        (o) => o.sectionId === sec.id && o.authorOrRef.toLowerCase().includes(authorName.toLowerCase()) && o.year === year
      );

      if (!alreadyCaptured) {
        const startIdx = Math.max(0, match.index - 35);
        const endIdx = Math.min(text.length, match.index + rawText.length + 35);
        const excerpt = "..." + text.substring(startIdx, endIdx).replace(/\n/g, " ") + "...";

        // Strict Matching: Author surname + Year matching ONLY!
        const matchedSource = sources.find((s) => {
          if (s.year !== year) return false;
          return (s.authors || []).some((auth) => getLastName(auth).toLowerCase() === authorName.toLowerCase());
        });

        occurrences.push({
          id: `${sec.id}-narrative-${match.index}`,
          rawText,
          sectionId: sec.id,
          sectionTitle: sec.title,
          authorOrRef: authorName,
          year,
          matchedSource,
          status: matchedSource ? "matched" : "missing",
          excerpt,
        });
      }
    }

    // Pattern D: Numeric citations e.g. [1], [2]
    const numericRegex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
    while ((match = numericRegex.exec(text)) !== null) {
      const rawText = match[0];
      const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean);

      const startIdx = Math.max(0, match.index - 35);
      const endIdx = Math.min(text.length, match.index + rawText.length + 35);
      const excerpt = "..." + text.substring(startIdx, endIdx).replace(/\n/g, " ") + "...";

      nums.forEach((num) => {
        const targetSrc = sources[num - 1];
        occurrences.push({
          id: `${sec.id}-num-${match!.index}-${num}`,
          rawText,
          sectionId: sec.id,
          sectionTitle: sec.title,
          authorOrRef: `Reference [${num}]`,
          numericIndex: num,
          matchedSource: targetSrc,
          status: targetSrc ? "matched" : "missing",
          excerpt,
        });
      });
    }
  });

  // Identify Uncited Sources in Source Library
  const fullTextAllSections = sections.map((s) => s.content || "").join(" ").toLowerCase();
  const uncitedSources: UncitedSource[] = [];

  sources.forEach((src) => {
    let isCited = false;

    if (occurrences.some((o) => o.matchedSource?.id === src.id)) {
      isCited = true;
    } else if (fullTextAllSections.includes(src.id)) {
      isCited = true;
    } else {
      const firstAuthorLastName = src.authors?.[0] ? getLastName(src.authors[0]).toLowerCase() : "";
      if (firstAuthorLastName && firstAuthorLastName.length > 2 && fullTextAllSections.includes(firstAuthorLastName)) {
        isCited = true;
      }
    }

    if (!isCited) {
      uncitedSources.push({
        source: src,
        reason: "Present in Source Library but not cited in any manuscript section text.",
      });
    }
  });

  // Bibliographic Inconsistencies & Metadata Audit
  const bibliographicIssues: BibliographicIssue[] = [];

  sources.forEach((src) => {
    const missing: string[] = [];
    if (!src.journalOrVenue || src.journalOrVenue.toLowerCase().includes("unspecified")) missing.push("Journal/Venue");
    if (!src.year || src.year < 1900) missing.push("Publication Year");
    if (!src.authors || src.authors.length === 0) missing.push("Author List");
    if (!src.doi && !src.url) missing.push("DOI / URL Link");
    if (!src.volume || !src.issue) missing.push("Volume/Issue Numbers");

    if (missing.length > 0) {
      const severity = missing.includes("Publication Year") || missing.includes("Author List") ? "high" : missing.includes("Journal/Venue") ? "medium" : "low";
      bibliographicIssues.push({
        source: src,
        missingFields: missing,
        issueSeverity: severity,
        description: `Source '${src.title}' is missing ${missing.join(", ")}.`,
      });
    }
  });

  // Style Format Warnings
  const isNumericStyle = ["ieee", "nature", "vancouver", "springer", "elsevier", "acs", "ama", "plos"].includes(activeCslStyle);
  const authorDateOccurrencesCount = occurrences.filter((o) => o.year && !o.numericIndex).length;
  const numericOccurrencesCount = occurrences.filter((o) => o.numericIndex).length;

  if (isNumericStyle && authorDateOccurrencesCount > 0 && numericOccurrencesCount === 0) {
    styleWarnings.push(
      `Active CSL Style is set to ${activeCslStyle.toUpperCase()} (Numeric Format), but in-text citations use Author-Date format.`
    );
  } else if (!isNumericStyle && numericOccurrencesCount > 0 && authorDateOccurrencesCount === 0) {
    styleWarnings.push(
      `Active CSL Style is set to ${activeCslStyle.toUpperCase()} (Author-Date Format), but in-text citations use Numeric format.`
    );
  }

  const missingCitations = occurrences.filter((o) => o.status === "missing");
  const matchedCount = occurrences.filter((o) => o.status === "matched").length;

  const overallScore = Math.max(0, Math.min(100, Math.round((matchedCount / Math.max(1, occurrences.length)) * 100)));

  return {
    timestamp: new Date().toISOString(),
    totalCitationsFound: occurrences.length,
    matchedCount,
    missingCount: missingCitations.length,
    uncitedSourcesCount: uncitedSources.length,
    bibliographicIssuesCount: bibliographicIssues.length,
    overallScore: isNaN(overallScore) ? 100 : overallScore,
    occurrences,
    missingCitations,
    uncitedSources,
    bibliographicIssues,
    styleWarnings,
  };
}

/**
 * Phase 3 Rule: Missing-citation resolution MUST be handled via candidate search.
 * Automatic source creation / fabrication is STRICTLY FORBIDDEN.
 */
export function createMissingSourceRecord(authorOrRef: string, year?: number): SourceRecord {
  throw new Error(
    "Automatic source creation is prohibited in TehqIQ Phase 3. Please use Candidate Search (Crossref / OpenAlex / DataCite / Europe PMC) to import verified metadata for missing citations."
  );
}
