import { SourceRecord, CSLStyleOption } from "../types";

export const CSL_STYLES: CSLStyleOption[] = [
  { id: "apa", name: "APA 7th Edition", citationFormat: "author-date" },
  { id: "ieee", name: "IEEE Style", citationFormat: "numeric" },
  { id: "nature", name: "Nature Journal Style", citationFormat: "superscript" },
  { id: "vancouver", name: "Vancouver / NLM Medical Style", citationFormat: "numeric" },
  { id: "chicago", name: "Chicago 17th Ed. (Author-Date)", citationFormat: "author-date" },
  { id: "chicago-notes", name: "Chicago 17th Ed. (Notes & Bibliography)", citationFormat: "footnote" },
  { id: "harvard", name: "Harvard (Cite Them Right 12th)", citationFormat: "author-date" },
  { id: "springer", name: "Springer / BMC Journal Style", citationFormat: "numeric" },
  { id: "elsevier", name: "Elsevier Standard Style", citationFormat: "numeric" },
  { id: "acs", name: "ACS Style (American Chemical Society)", citationFormat: "superscript" },
  { id: "ama", name: "AMA 11th Edition (American Medical)", citationFormat: "superscript" },
  { id: "mla", name: "MLA 9th Edition", citationFormat: "author-date" },
  { id: "cell", name: "Cell Press / Neuron Style", citationFormat: "author-date" },
  { id: "oxford", name: "Oxford / OSCOLA Reference Style", citationFormat: "footnote" },
  { id: "plos", name: "PLOS ONE Journal Style", citationFormat: "numeric" }
];

export const CSL_STYLE_DESCRIPTIONS: Record<string, string> = {
  'apa': 'American Psychological Association 7th Edition',
  'apa-7th': 'American Psychological Association 7th Edition',
  'ieee': 'Institute of Electrical and Electronics Engineers',
  'nature': 'Nature Publishing Group Standard Style',
  'vancouver': 'Vancouver / National Library of Medicine Medical Style',
  'chicago': 'Chicago Manual of Style 17th Edition',
  'chicago-notes': 'Chicago Notes and Bibliography',
  'harvard': 'Harvard Author-Date Reference System',
  'springer': 'Springer BMC Scientific Publishing Style',
  'elsevier': 'Elsevier Standard Journal Format',
  'acs': 'American Chemical Society Format',
  'ama': 'American Medical Association 11th Edition',
  'mla': 'Modern Language Association 9th Edition',
  'cell': 'Cell Press Journal Style',
  'oxford': 'Oxford / OSCOLA Legal and Humanities Style',
  'plos': 'Public Library of Science Open Access Style'
};


export function formatInTextCitation(
  sources: SourceRecord[],
  styleId: CSLStyleOption["id"],
  allSources?: SourceRecord[]
): string {
  if (!sources || sources.length === 0) return "";

  // Compute actual sequential 1-based index from global sources library if provided
  const numbers = sources.map((src, fallbackIdx) => {
    if (allSources && allSources.length > 0) {
      const globalIdx = allSources.findIndex((s) => s.id === src.id);
      return globalIdx !== -1 ? globalIdx + 1 : fallbackIdx + 1;
    }
    return fallbackIdx + 1;
  });

  switch (styleId) {
    case "ieee":
    case "springer":
    case "elsevier":
      return `[${numbers.join(", ")}]`;

    case "plos":
      return `[${numbers.join(",")}]`;

    case "nature":
    case "acs":
    case "ama":
      return `${numbers.map(n => `[${n}]`).join("")}`; // Clean numeric bracket sequence for nature/ama

    case "vancouver":
      return `(${numbers.join(", ")})`;

    case "chicago-notes":
    case "oxford":
      return `[${numbers.join(",")}]`;

    case "mla":
      const mlaItems = sources.map((src) => {
        const authorList = src.authors || [];
        const lastName = authorList.length > 0 ? getLastName(authorList[0]) : "Unknown";
        return `${lastName} ${src.pages || ""}`.trim();
      });
      return `(${mlaItems.join("; ")})`;

    case "cell":
    case "chicago":
    case "harvard":
    case "apa":
    default:
      const formattedItems = sources.map((src) => {
        const authorList = src.authors || [];
        let authorText = "Unknown";
        if (authorList.length === 1) {
          authorText = getLastName(authorList[0]);
        } else if (authorList.length === 2) {
          authorText = `${getLastName(authorList[0])} & ${getLastName(authorList[1])}`;
        } else if (authorList.length > 2) {
          authorText = `${getLastName(authorList[0])} et al.`;
        }
        return `${authorText}, ${src.year || "n.d."}`;
      });
      return `(${formattedItems.join("; ")})`;
  }
}

export function formatBibliographyEntry(src: SourceRecord, index: number, styleId: CSLStyleOption["id"]): string {
  const authorsStr = (src.authors || []).join(", ");
  const year = src.year || "n.d.";
  const title = src.title || "Untitled";
  const venue = src.journalOrVenue || "Unspecified Source";
  const doiStr = src.doi ? ` https://doi.org/${src.doi}` : "";

  switch (styleId) {
    case "ieee":
      return `[${index + 1}] ${authorsStr}, "${title}," *${venue}*, vol. ${src.volume || "1"}, no. ${src.issue || "1"}, pp. ${src.pages || "1-10"}, ${year}.${doiStr}`;

    case "nature":
      return `${index + 1}. ${authorsStr}. ${title}. *${venue}* **${src.volume || "1"}**, ${src.pages || "1-10"} (${year}).${doiStr}`;

    case "vancouver":
    case "ama":
      return `${index + 1}. ${authorsStr}. ${title}. ${venue}. ${year};${src.volume || "1"}(${src.issue || "1"}):${src.pages || "1-10"}.${doiStr}`;

    case "springer":
    case "elsevier":
    case "plos":
      return `[${index + 1}] ${authorsStr} (${year}). ${title}. ${venue}, ${src.volume || "1"}(${src.issue || "1"}), ${src.pages || "1-10"}.${doiStr}`;

    case "acs":
      return `${index + 1}. ${authorsStr}. ${title}. *${venue}* **${year}**, *${src.volume || "1"}*, ${src.pages || "1-10"}.${doiStr}`;

    case "chicago":
    case "chicago-notes":
      return `${authorsStr}. "${title}." *${venue}* ${src.volume || "1"}, no. ${src.issue || "1"} (${year}): ${src.pages || "1-10"}.${doiStr}`;

    case "harvard":
      return `${authorsStr} (${year}) '${title}', *${venue}*, ${src.volume || "1"}(${src.issue || "1"}), pp. ${src.pages || "1-10"}.${doiStr}`;

    case "mla":
      return `${authorsStr}. "${title}." *${venue}*, vol. ${src.volume || "1"}, no. ${src.issue || "1"}, ${year}, pp. ${src.pages || "1-10"}.${doiStr}`;

    case "cell":
      return `${authorsStr} (${year}). ${title}. ${venue} ${src.volume || "1"}, ${src.pages || "1-10"}.${doiStr}`;

    case "oxford":
      return `${index + 1}. ${authorsStr}, '${title}', *${venue}*, ${src.volume || "1"}/${src.issue || "1"} (${year}), ${src.pages || "1-10"}.${doiStr}`;

    case "apa":
    default:
      return `${authorsStr} (${year}). ${title}. *${venue}*, ${src.volume || "1"}(${src.issue || "1"}), ${src.pages || "1-10"}.${doiStr}`;
  }
}

function getLastName(fullName: string): string {
  if (!fullName) return "Unknown";
  const parts = fullName.trim().split(" ");
  return parts[parts.length - 1];
}
