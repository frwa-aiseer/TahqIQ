import { SourceRecord, FieldProvenance, ProvenanceMetadata } from "../types";

/**
 * Creates field provenance object for imported references
 */
function buildImportProvenance(
  fields: Record<string, any>,
  providerName: "BibTeX Import" | "RIS Import" | "CSL JSON Import"
): ProvenanceMetadata {
  const timestamp = new Date().toISOString();
  const fieldProvenance: Record<string, FieldProvenance> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== "") {
      fieldProvenance[key] = {
        provider: providerName,
        timestamp,
      };
    }
  }

  return {
    provider: providerName,
    retrievedAt: timestamp,
    fieldProvenance,
  };
}

/**
 * Parses BibTeX formatted string into SourceRecord items.
 */
export function parseBibTeX(bibtexString: string): SourceRecord[] {
  if (!bibtexString || !bibtexString.trim()) return [];

  const results: SourceRecord[] = [];
  // Match entry blocks e.g. @article{key, title={...}, author={...}, year={2022}}
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,\s]+)\s*,([^@]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(bibtexString)) !== null) {
    const entryType = match[1].toLowerCase();
    const citeKey = match[2];
    const body = match[3];

    const fields: Record<string, string> = {};
    // Extract key-value pairs e.g. title = {Some Title} or year = "2022" or journal = Nature
    const fieldRegex = /([a-zA-Z0-9_\-]+)\s*=\s*(?:\{([\s\S]*?)\}|"([\s\S]*?)"|([^\s,{}]+))/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const key = fieldMatch[1].toLowerCase();
      const value = (fieldMatch[2] || fieldMatch[3] || fieldMatch[4] || "").trim();
      fields[key] = value;
    }

    const title = fields.title?.replace(/[\{\}]/g, "") || "Untitled BibTeX Entry";
    const authorsRaw = fields.author?.replace(/[\{\}]/g, "") || "";
    const authors = authorsRaw
      ? authorsRaw.split(/\s+and\s+/i).map((a) => a.trim()).filter(Boolean)
      : ["Unknown Author"];
    const year = fields.year ? parseInt(fields.year, 10) : new Date().getFullYear();
    const journal = fields.journal || fields.booktitle || fields.publisher || "BibTeX Import Venue";
    const doi = fields.doi ? fields.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : undefined;
    const volume = fields.volume;
    const issue = fields.number || fields.issue;
    const pages = fields.pages?.replace(/--/g, "-");
    const publisher = fields.publisher;
    const abstract = fields.abstract;

    const sourceId = `src-bib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docTypeMap: Record<string, string> = {
      article: "Journal Article",
      book: "Book",
      inproceedings: "Conference Paper",
      phdthesis: "Dissertation",
      techreport: "Technical Report",
    };

    const prov = buildImportProvenance(
      { title, authors, year, journalOrVenue: journal, doi, volume, issue, pages, publisher, abstract },
      "BibTeX Import"
    );

    results.push({
      id: sourceId,
      title,
      authors,
      year: isNaN(year) ? new Date().getFullYear() : year,
      journalOrVenue: journal,
      volume,
      issue,
      pages,
      doi,
      publisher,
      abstract,
      documentType: docTypeMap[entryType] || "Journal Article",
      peerReviewStatus: entryType === "article" ? "Peer-reviewed" : "Unknown",
      verificationState: doi ? "Verified" : "Unverified",
      state: "Imported",
      relevanceScore: 7,
      tags: ["bibtex-import", citeKey],
      provenance: prov,
      metadataProvider: "BibTeX Import Parser",
      stateHistory: [],
    });
  }

  return results;
}

/**
 * Parses RIS formatted string into SourceRecord items.
 */
export function parseRIS(risString: string): SourceRecord[] {
  if (!risString || !risString.trim()) return [];

  const records: SourceRecord[] = [];
  const entries = risString.split(/ER\s*-\s*\r?\n/g);

  entries.forEach((entryStr) => {
    if (!entryStr.trim()) return;

    let docType = "Journal Article";
    let title = "";
    let authors: string[] = [];
    let year = new Date().getFullYear();
    let journal = "";
    let volume = "";
    let issue = "";
    let pages = "";
    let doi = "";
    let publisher = "";
    let abstract = "";

    const lines = entryStr.split(/\r?\n/);
    lines.forEach((line) => {
      const match = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
      if (!match) return;

      const tag = match[1].trim();
      const val = match[2].trim();

      switch (tag) {
        case "TY":
          if (val === "JOUR") docType = "Journal Article";
          else if (val === "BOOK") docType = "Book";
          else if (val === "CONF") docType = "Conference Paper";
          break;
        case "TI":
        case "T1":
        case "CT":
          if (!title) title = val;
          break;
        case "AU":
        case "A1":
          authors.push(val);
          break;
        case "PY":
        case "Y1":
          const yearMatch = val.match(/\b(19\d\d|20\d\d)\b/);
          if (yearMatch) year = parseInt(yearMatch[1], 10);
          break;
        case "JO":
        case "JF":
        case "T2":
          journal = val;
          break;
        case "VL":
          volume = val;
          break;
        case "IS":
          issue = val;
          break;
        case "SP":
          pages = val;
          break;
        case "EP":
          if (pages) pages += `-${val}`;
          else pages = val;
          break;
        case "DO":
          doi = val.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
          break;
        case "PB":
          publisher = val;
          break;
        case "AB":
        case "N2":
          abstract = val;
          break;
      }
    });

    if (title || authors.length > 0) {
      const sourceId = `src-ris-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const prov = buildImportProvenance(
        { title, authors, year, journalOrVenue: journal || "RIS Venue", doi, volume, issue, pages, publisher, abstract },
        "RIS Import"
      );

      records.push({
        id: sourceId,
        title: title || "Untitled RIS Reference",
        authors: authors.length > 0 ? authors : ["Unknown Author"],
        year,
        journalOrVenue: journal || "RIS Import Venue",
        volume,
        issue,
        pages,
        doi: doi || undefined,
        publisher,
        abstract,
        documentType: docType,
        peerReviewStatus: "Unknown",
        verificationState: doi ? "Verified" : "Unverified",
        state: "Imported",
        relevanceScore: 7,
        tags: ["ris-import"],
        provenance: prov,
        metadataProvider: "RIS Import Parser",
        stateHistory: [],
      });
    }
  });

  return records;
}

/**
 * Parses CSL JSON structure or string into SourceRecord items.
 */
export function parseCSLJSON(cslData: string | any[] | Record<string, any>): SourceRecord[] {
  let items: any[] = [];
  if (typeof cslData === "string") {
    try {
      const parsed = JSON.parse(cslData);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  } else if (Array.isArray(cslData)) {
    items = cslData;
  } else if (typeof cslData === "object" && cslData !== null) {
    items = [cslData];
  }

  return items.map((item) => {
    const title = item.title || "Untitled CSL Item";
    const authors = (item.author || []).map((a: any) =>
      a.literal || `${a.family || ""}, ${a.given || ""}`.trim() || "Unknown Author"
    );
    const yearPart = item.issued?.["date-parts"]?.[0]?.[0];
    const year = typeof yearPart === "number" ? yearPart : new Date().getFullYear();
    const journal = item["container-title"] || item.publisher || "CSL JSON Venue";
    const doi = item.DOI ? item.DOI.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : undefined;
    const volume = item.volume ? String(item.volume) : undefined;
    const issue = item.issue ? String(item.issue) : undefined;
    const pages = item.page ? String(item.page) : undefined;
    const publisher = item.publisher;
    const abstract = item.abstract;

    const sourceId = item.id && !item.id.includes(" ") ? String(item.id) : `src-csl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const prov = buildImportProvenance(
      { title, authors, year, journalOrVenue: journal, doi, volume, issue, pages, publisher, abstract },
      "CSL JSON Import"
    );

    return {
      id: sourceId,
      title,
      authors: authors.length > 0 ? authors : ["Unknown Author"],
      year,
      journalOrVenue: journal,
      volume,
      issue,
      pages,
      doi,
      publisher,
      abstract,
      documentType: item.type === "article-journal" ? "Journal Article" : "Reference",
      peerReviewStatus: item.type === "article-journal" ? "Peer-reviewed" : "Unknown",
      verificationState: doi ? "Verified" : "Unverified",
      state: "Imported",
      relevanceScore: 7,
      tags: ["csl-import"],
      provenance: prov,
      metadataProvider: "CSL JSON Import Parser",
      stateHistory: [],
    };
  });
}

export const parseBibTeXString = parseBibTeX;
export const parseRISString = parseRIS;

/**
 * Parses plain unformatted reference text into a SourceRecord.
 */
export function parseReferenceTextToSource(refText: string): SourceRecord {
  const yearMatch = refText.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  const doiMatch = refText.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  const doi = doiMatch ? doiMatch[0].replace(/\.$/, '') : undefined;

  const titleMatch = refText.match(/\.\s*([A-Z][^\.]+\.)\s*/);
  const title = titleMatch ? titleMatch[1].replace(/\.$/, '') : 'Unformatted Reference Text';

  const authorPart = refText.split(/\(\d{4}\)|\b\d{4}\b/)[0] || 'Unknown Author';
  const authors = authorPart
    .split(/,|&|and/i)
    .map((a) => a.trim())
    .filter((a) => a.length > 1);

  return {
    id: `src-txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    authors: authors.length > 0 ? authors : ['Unknown Author'],
    year,
    journalOrVenue: 'Unformatted Reference Ingestion',
    doi,
    documentType: 'Journal Article',
    peerReviewStatus: 'Unknown',
    verificationState: doi ? 'Verified' : 'Unverified',
    state: 'Imported',
    relevanceScore: 5,
    tags: ['text-import'],
    stateHistory: [],
  };
}


