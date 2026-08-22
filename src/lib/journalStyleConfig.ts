import { SourceRecord, CSLStyleOption } from "../types";

export interface JournalStyleVariation {
  id: string;
  journalName: string;
  baseCslStyle: CSLStyleOption["id"];
  citationFormatOverride: "author-date" | "numeric" | "footnote" | "superscript";
  referenceOrdering: "alphabetical" | "order_of_appearance" | "year_descending";
  footnotePreference: "inline_bracket" | "numbered_footnote" | "superscript_marker" | "author_year_parenthetical";
  authorNameFormat: "last_first_initial" | "first_last" | "last_only" | "full_name";
  maxAuthorsBeforeEtAl: number; // 1, 2, 3, 6, 10, or 99
  includeDoi: boolean;
  includeUrl: boolean;
  titleCasePreference: "sentence_case" | "title_case" | "as_entered";
  journalTitleFormat: "iso_abbreviated" | "full_title";
  pageNumberFormat: "full" | "abbreviated" | "start_page_only";
  customInTextPrefix: string;
  customInTextSuffix: string;
  notes?: string;
  isPreset?: boolean;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = "researcher_journal_style_profiles_v1";
const ACTIVE_PROFILE_KEY = "researcher_active_journal_style_id_v1";

export const BUILT_IN_JOURNAL_PRESETS: JournalStyleVariation[] = [
  {
    id: "preset-jbiomech",
    journalName: "Journal of Biomechanics (Custom Elsevier)",
    baseCslStyle: "elsevier",
    citationFormatOverride: "numeric",
    referenceOrdering: "order_of_appearance",
    footnotePreference: "inline_bracket",
    authorNameFormat: "last_first_initial",
    maxAuthorsBeforeEtAl: 6,
    includeDoi: true,
    includeUrl: false,
    titleCasePreference: "sentence_case",
    journalTitleFormat: "iso_abbreviated",
    pageNumberFormat: "full",
    customInTextPrefix: "",
    customInTextSuffix: "",
    notes: "Official Elsevier Journal of Biomechanics reference style with DOI integration.",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset-nature-med",
    journalName: "Nature Medicine (Superscript Footnote)",
    baseCslStyle: "nature",
    citationFormatOverride: "superscript",
    referenceOrdering: "order_of_appearance",
    footnotePreference: "superscript_marker",
    authorNameFormat: "last_first_initial",
    maxAuthorsBeforeEtAl: 5,
    includeDoi: true,
    includeUrl: true,
    titleCasePreference: "sentence_case",
    journalTitleFormat: "iso_abbreviated",
    pageNumberFormat: "full",
    customInTextPrefix: "",
    customInTextSuffix: "",
    notes: "Nature Publishing Group format with superscript numbered citations.",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset-bmj-open",
    journalName: "BMJ Open / Medical Footnote",
    baseCslStyle: "vancouver",
    citationFormatOverride: "footnote",
    referenceOrdering: "order_of_appearance",
    footnotePreference: "numbered_footnote",
    authorNameFormat: "last_first_initial",
    maxAuthorsBeforeEtAl: 3,
    includeDoi: true,
    includeUrl: true,
    titleCasePreference: "sentence_case",
    journalTitleFormat: "iso_abbreviated",
    pageNumberFormat: "abbreviated",
    customInTextPrefix: "Ref. ",
    customInTextSuffix: "",
    notes: "BMJ style with footnote marker and maximum 3 authors before et al.",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset-chicago-custom",
    journalName: "Chicago Manual Footnote & Bibliography",
    baseCslStyle: "chicago-notes",
    citationFormatOverride: "footnote",
    referenceOrdering: "alphabetical",
    footnotePreference: "numbered_footnote",
    authorNameFormat: "full_name",
    maxAuthorsBeforeEtAl: 3,
    includeDoi: true,
    includeUrl: true,
    titleCasePreference: "title_case",
    journalTitleFormat: "full_title",
    pageNumberFormat: "full",
    customInTextPrefix: "",
    customInTextSuffix: "",
    notes: "Humanities and social sciences footnote style with alphabetical bibliography.",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset-ieee-trans",
    journalName: "IEEE Transactions (Custom Numeric)",
    baseCslStyle: "ieee",
    citationFormatOverride: "numeric",
    referenceOrdering: "order_of_appearance",
    footnotePreference: "inline_bracket",
    authorNameFormat: "first_last",
    maxAuthorsBeforeEtAl: 6,
    includeDoi: true,
    includeUrl: false,
    titleCasePreference: "title_case",
    journalTitleFormat: "iso_abbreviated",
    pageNumberFormat: "full",
    customInTextPrefix: "[",
    customInTextSuffix: "]",
    notes: "IEEE engineering specification with full titles and bracketed numbers.",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function getSavedJournalProfiles(): JournalStyleVariation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return BUILT_IN_JOURNAL_PRESETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge custom profiles with built-in presets if missing
      const presetIds = new Set(parsed.map((p) => p.id));
      const missingPresets = BUILT_IN_JOURNAL_PRESETS.filter((p) => !presetIds.has(p.id));
      return [...missingPresets, ...parsed];
    }
    return BUILT_IN_JOURNAL_PRESETS;
  } catch {
    return BUILT_IN_JOURNAL_PRESETS;
  }
}

export function saveJournalProfiles(profiles: JournalStyleVariation[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error("Failed to save journal style profiles:", err);
  }
}

export function getActiveJournalProfileId(): string {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || BUILT_IN_JOURNAL_PRESETS[0].id;
  } catch {
    return BUILT_IN_JOURNAL_PRESETS[0].id;
  }
}

export function setActiveJournalProfileId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch (err) {
    console.error("Failed to set active journal style id:", err);
  }
}

/**
 * Transforms article title according to title casing preference
 */
export function formatTitleCase(title: string, preference: JournalStyleVariation["titleCasePreference"]): string {
  if (!title) return "";
  if (preference === "as_entered") return title;
  if (preference === "sentence_case") {
    // Capitalize first letter and keep rest lower, except known acronyms
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase().replace(/\b(dna|rna|acl|mri|emg|3d|2d)\b/gi, (m) => m.toUpperCase());
  }
  if (preference === "title_case") {
    const minorWords = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "with", "in", "of"]);
    return title
      .split(/\s+/)
      .map((word, index) => {
        const lower = word.toLowerCase();
        if (index > 0 && minorWords.has(lower)) {
          return lower;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }
  return title;
}

/**
 * Formats author names according to profile author name preference and max cut-off
 */
export function formatAuthorsList(authors: string[], profile: JournalStyleVariation): string {
  if (!authors || authors.length === 0) return "Unknown Author";

  const max = profile.maxAuthorsBeforeEtAl || 6;
  const count = authors.length;
  const isTruncated = count > max;
  const displayAuthors = isTruncated ? authors.slice(0, max) : authors;

  const formatted = displayAuthors.map((name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const firstInitials = parts.slice(0, parts.length - 1).map((p) => p[0]?.toUpperCase() + ".").join("");

    switch (profile.authorNameFormat) {
      case "last_first_initial":
        return `${lastName}, ${firstInitials}`;
      case "first_last":
        return `${firstInitials} ${lastName}`;
      case "last_only":
        return lastName;
      case "full_name":
      default:
        return name;
    }
  });

  if (isTruncated) {
    return `${formatted.join(", ")}, et al.`;
  }
  if (formatted.length === 2) {
    return `${formatted[0]} & ${formatted[1]}`;
  }
  return formatted.join(", ");
}

/**
 * Sorts sources according to the journal reference ordering rule
 */
export function sortSourcesByProfile(sources: SourceRecord[], profile: JournalStyleVariation): SourceRecord[] {
  const cloned = [...sources];
  if (profile.referenceOrdering === "alphabetical") {
    return cloned.sort((a, b) => {
      const authorA = (a.authors?.[0] || "").toLowerCase();
      const authorB = (b.authors?.[0] || "").toLowerCase();
      return authorA.localeCompare(authorB);
    });
  }
  if (profile.referenceOrdering === "year_descending") {
    return cloned.sort((a, b) => (b.year || 0) - (a.year || 0));
  }
  // Default: order_of_appearance (keep original array sequence)
  return cloned;
}

/**
 * Formats custom in-text citation based on active journal style profile
 */
export function formatCustomInTextCitation(sources: SourceRecord[], profile: JournalStyleVariation): string {
  if (!sources || sources.length === 0) return "";

  const prefix = profile.customInTextPrefix || "";
  const suffix = profile.customInTextSuffix || "";
  const indices = sources.map((_, i) => i + 1);

  if (profile.footnotePreference === "inline_bracket") {
    return `${prefix}[${indices.join(", ")}]${suffix}`;
  }
  if (profile.footnotePreference === "superscript_marker") {
    const superDigits = indices.map((n) => "\u207B" + n + "\u207B").join(",");
    return `${prefix}${superDigits}${suffix}`;
  }
  if (profile.footnotePreference === "numbered_footnote") {
    return `${prefix}\u00B9${suffix}`;
  }

  // author_year_parenthetical
  const formattedItems = sources.map((src) => {
    const firstAuthor = src.authors?.[0] ? src.authors[0].split(/\s+/).pop() : "Unknown";
    const authorText = src.authors && src.authors.length > 2 ? `${firstAuthor} et al.` : src.authors && src.authors.length === 2 ? `${firstAuthor} & ${src.authors[1].split(/\s+/).pop()}` : firstAuthor;
    return `${authorText}, ${src.year || "n.d."}`;
  });

  return `${prefix}(${formattedItems.join("; ")})${suffix}`;
}

/**
 * Formats custom bibliography entry using the journal style profile parameters
 */
export function formatCustomBibliographyEntry(src: SourceRecord, index: number, profile: JournalStyleVariation): string {
  const authorsStr = formatAuthorsList(src.authors || [], profile);
  const year = src.year || "n.d.";
  const title = formatTitleCase(src.title || "Untitled", profile.titleCasePreference);
  const venue = src.journalOrVenue || "Unspecified Source";
  const vol = src.volume ? `vol. ${src.volume}` : "vol. 1";
  const issue = src.issue ? `no. ${src.issue}` : "no. 1";

  let pagesStr = src.pages || "1-10";
  if (profile.pageNumberFormat === "start_page_only" && src.pages?.includes("-")) {
    pagesStr = src.pages.split("-")[0];
  } else if (profile.pageNumberFormat === "abbreviated" && src.pages?.includes("-")) {
    const [p1, p2] = src.pages.split("-");
    pagesStr = `${p1}-${p2.slice(-2)}`;
  }

  const doiStr = profile.includeDoi && src.doi ? ` https://doi.org/${src.doi}` : "";
  const urlStr = profile.includeUrl && src.url ? ` Available at: ${src.url}` : "";

  if (profile.citationFormatOverride === "numeric" || profile.footnotePreference === "inline_bracket") {
    return `[${index + 1}] ${authorsStr}, "${title}," *${venue}*, ${vol}, ${issue}, pp. ${pagesStr}, ${year}.${doiStr}${urlStr}`;
  }
  if (profile.footnotePreference === "superscript_marker" || profile.citationFormatOverride === "superscript") {
    return `${index + 1}. ${authorsStr}. ${title}. *${venue}* **${src.volume || "1"}**, ${pagesStr} (${year}).${doiStr}${urlStr}`;
  }
  if (profile.footnotePreference === "numbered_footnote" || profile.citationFormatOverride === "footnote") {
    return `${index + 1}. ${authorsStr}, '${title}', *${venue}*, ${vol}/${issue} (${year}), pp. ${pagesStr}.${doiStr}${urlStr}`;
  }

  // Default author-date format
  return `${authorsStr} (${year}). ${title}. *${venue}*, ${vol}(${issue}), ${pagesStr}.${doiStr}${urlStr}`;
}
