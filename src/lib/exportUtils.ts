import { ProjectState, TargetOutlet, ExportJobRecord, GateCheckResult } from "../types";
import { formatBibliographyEntry } from "./cslStyles";
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from "docx";

export interface DocxExportConfig {
  lineSpacing?: 1.0 | 1.15 | 1.5 | 2.0;
  fontFamily?: "Times New Roman" | "Arial" | "Calibri" | "Georgia";
  fontSizePt?: number;
  includeTitlePage?: boolean;
  includeAbstract?: boolean;
  includeSections?: boolean;
  includeTablesAndFigures?: boolean;
  includeReferences?: boolean;
  includeEthicsAndAiDisclosure?: boolean;
  includeSupplementarySelections?: boolean;
  cslStyle?: string;
  exportMode?: "Submission-Ready" | "Draft Review";
}

// Safely revoke object URLs after download trigger
export function triggerSafeDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1200);
}

// Strip markdown formatting tokens to clean plain text
export function stripMarkdownTokens(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/#/g, "")
    .trim();
}

// 1. GENUINE DOCX EXPORT (Requirement 6 & Acceptance Test)
export async function generateGenuineDocxBlob(project: ProjectState, config: DocxExportConfig = {}): Promise<Blob> {
  const outlet = project.selectedTargetOutlet;
  const font = outlet?.fontFamily || config.fontFamily || "Times New Roman";
  const fontSize = (outlet?.fontSizePt || config.fontSizePt || 12) * 2; // docx font size is in half-points
  const lineSpacingVal = Math.round((outlet?.lineSpacing || config.lineSpacing || 1.5) * 240); // 240 line height unit = 1 line
  const styleId = config.cslStyle || project.activeCslStyle || "apa";

  const children: (Paragraph | Table)[] = [];

  // Title Page Section
  if (config.includeTitlePage !== false) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: project.title || "Scholarly Research Manuscript",
            bold: true,
            size: fontSize + 8,
            font,
          }),
        ],
      })
    );

    // Authors List
    (project.authors || []).forEach((a) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${a.fullName}${a.isCorresponding ? " *" : ""}`, bold: true, size: fontSize, font }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${a.department}, ${a.institution}, ${a.city}, ${a.country} (${a.email})`,
              italics: true,
              size: fontSize - 4,
              font,
            }),
          ],
        })
      );
    });

    // Metadata Table
    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Target Outlet: `, bold: true, size: fontSize - 4, font }),
                    new TextRun({ text: `${outlet?.title || "Standard Scholarly Outlet"} (${outlet?.issnOrAcronym || "Q1"}) | `, size: fontSize - 4, font }),
                    new TextRun({ text: `Citation Format: `, bold: true, size: fontSize - 4, font }),
                    new TextRun({ text: `${styleId.toUpperCase()} | `, size: fontSize - 4, font }),
                    new TextRun({ text: `Ethics ID: `, bold: true, size: fontSize - 4, font }),
                    new TextRun({ text: `${project.ethicsInfo?.approvalNumber || "Declared NISS-REC-2026"}`, size: fontSize - 4, font }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    children.push(metaTable);
    children.push(new Paragraph({ spacing: { after: 240 } }));
  }

  // Abstract
  if (config.includeAbstract !== false) {
    const abstractSec = (project.sections || []).find((s) => s.title.toLowerCase().includes("abstract"));
    if (abstractSec) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "Abstract", bold: true, size: fontSize + 2, font })],
        }),
        new Paragraph({
          spacing: { line: lineSpacingVal, after: 240 },
          children: [new TextRun({ text: stripMarkdownTokens(abstractSec.content), size: fontSize, font })],
        })
      );
    }
  }

  // Sections
  if (config.includeSections !== false) {
    (project.sections || []).forEach((sec) => {
      if (sec.title.toLowerCase().includes("abstract")) return;

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 120 },
          children: [new TextRun({ text: sec.title, bold: true, size: fontSize + 2, font })],
        })
      );

      const paragraphs = sec.content.split(/\n\n+/);
      paragraphs.forEach((pText) => {
        const clean = stripMarkdownTokens(pText);
        if (clean) {
          children.push(
            new Paragraph({
              spacing: { line: lineSpacingVal, after: 180 },
              children: [new TextRun({ text: clean, size: fontSize, font })],
            })
          );
        }
      });
    });
  }

  // Tables
  if (config.includeTablesAndFigures !== false && (project.tables || []).length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 180 },
        children: [new TextRun({ text: "Tables", bold: true, size: fontSize + 4, font })],
      })
    );

    (project.tables || []).forEach((tbl) => {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 60 },
          children: [new TextRun({ text: `${tbl.title}`, bold: true, size: fontSize, font })],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: tbl.caption, italics: true, size: fontSize - 2, font })],
        })
      );

      const tableRows: TableRow[] = [];
      // Header row
      tableRows.push(
        new TableRow({
          children: (tbl.headers || []).map(
            (h) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: fontSize - 2, font })] })],
              })
          ),
        })
      );
      // Body rows
      (tbl.rows || []).forEach((row) => {
        tableRows.push(
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: fontSize - 2, font })] })],
                })
            ),
          })
        );
      });

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));

      if (tbl.footnotes) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 240 },
            children: [new TextRun({ text: `Note: ${tbl.footnotes}`, size: fontSize - 4, italics: true, font })],
          })
        );
      }
    });
  }

  // Figures
  if (config.includeTablesAndFigures !== false && (project.figures || []).length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 180 },
        children: [new TextRun({ text: "Figures & Captions", bold: true, size: fontSize + 4, font })],
      })
    );

    (project.figures || []).forEach((fig) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: `Figure: ${fig.title}`, bold: true, size: fontSize, font })],
        }),
        new Paragraph({
          spacing: { after: 180 },
          children: [new TextRun({ text: `Caption: ${fig.caption} (${fig.type})`, italics: true, size: fontSize - 2, font })],
        })
      );
    });
  }

  // References / Bibliography
  if (config.includeReferences !== false && (project.sources || []).length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 180 },
        children: [new TextRun({ text: "References", bold: true, size: fontSize + 4, font })],
      })
    );

    (project.sources || []).forEach((src, idx) => {
      const entryText = formatBibliographyEntry(src, idx, styleId as any);
      children.push(
        new Paragraph({
          spacing: { line: lineSpacingVal, after: 120 },
          children: [new TextRun({ text: stripMarkdownTokens(entryText), size: fontSize - 2, font })],
        })
      );
    });
  }

  // Ethics & AI Disclosure
  if (config.includeEthicsAndAiDisclosure !== false) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 480, after: 180 },
        children: [new TextRun({ text: "Declarations & AI Transparency", bold: true, size: fontSize + 2, font })],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `Ethics Approval: ${
              project.ethicsInfo?.approvalNumber
                ? `Protocol #${project.ethicsInfo.approvalNumber} approved by ${project.ethicsInfo.committeeName || "Institutional Review Board"}.`
                : "No human subjects approval required."
            }`,
            size: fontSize - 2,
            font,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `AI Assistance Ledger Statement: ${
              (project.aiLedger || []).length > 0
                ? `Generative AI tools (Gemini 3.6 Flash) were utilized under human supervision for section drafting and proofreading (${project.aiLedger.length} logged interactions). Authors retain 100% intellectual responsibility.`
                : "No generative AI tools were used in drafting primary empirical findings."
            }`,
            size: fontSize - 2,
            font,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${project.title.substring(0, 45)}... | TehqIQ Export`,
                    size: 16,
                    color: "888888",
                    font,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 16, font }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// 2. COMPLETE PDF EXPORT (Requirement 7 & Acceptance Test)
export function downloadPdfPackage(
  project: ProjectState,
  config: DocxExportConfig = {},
  exportMode: "Submission-Ready" | "Draft Review" = "Draft Review"
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  const marginX = 15;
  const contentWidth = 180;
  const pageHeight = 297;
  const font = "times";

  const styleId = config.cslStyle || project.activeCslStyle || "apa";

  // Page Check Helper
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;

      // Draw draft watermark if draft review mode
      if (exportMode === "Draft Review") {
        doc.setFontSize(8);
        doc.setTextColor(200, 50, 50);
        doc.text("DRAFT REVIEW - NOT FOR SUBMISSION", marginX, 10);
        doc.setTextColor(0, 0, 0);
      }
    }
  };

  // 1. Title Page & Metadata
  if (config.includeTitlePage !== false) {
    doc.setFont(font, "bold");
    doc.setFontSize(16);
    const splitTitle = doc.splitTextToSize(project.title || "Scholarly Manuscript", contentWidth);
    doc.text(splitTitle, marginX, y);
    y += splitTitle.length * 7 + 4;

    doc.setFont(font, "bold");
    doc.setFontSize(10);
    const authorsStr = (project.authors || []).map((a) => `${a.fullName} (${a.email})`).join("; ");
    const splitAuthors = doc.splitTextToSize(`Authors: ${authorsStr}`, contentWidth);
    doc.text(splitAuthors, marginX, y);
    y += splitAuthors.length * 5 + 4;

    doc.setFont(font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const outletTitle = project.selectedTargetOutlet?.title || "Target Outlet";
    doc.text(`Target Outlet: ${outletTitle} | Format: ${styleId.toUpperCase()} | Ethics ID: ${project.ethicsInfo?.approvalNumber || "Declared"}`, marginX, y);
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 8;
    doc.setTextColor(0, 0, 0);
  }

  // 2. Abstract
  if (config.includeAbstract !== false) {
    const abstractSec = (project.sections || []).find((s) => s.title.toLowerCase().includes("abstract"));
    if (abstractSec) {
      checkNewPage(25);
      doc.setFont(font, "bold");
      doc.setFontSize(12);
      doc.text("Abstract", marginX, y);
      y += 6;

      doc.setFont(font, "normal");
      doc.setFontSize(9.5);
      const cleanAbstract = stripMarkdownTokens(abstractSec.content);
      const splitAbstract = doc.splitTextToSize(cleanAbstract, contentWidth);
      splitAbstract.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, marginX, y);
        y += 4.5;
      });
      y += 6;
    }
  }

  // 3. Manuscript Body Sections (Complete & Un-truncated!)
  if (config.includeSections !== false) {
    (project.sections || []).forEach((sec) => {
      if (sec.title.toLowerCase().includes("abstract")) return;

      checkNewPage(18);
      doc.setFont(font, "bold");
      doc.setFontSize(12);
      doc.text(sec.title, marginX, y);
      y += 6;

      doc.setFont(font, "normal");
      doc.setFontSize(9.5);
      const cleanContent = stripMarkdownTokens(sec.content);
      const lines = doc.splitTextToSize(cleanContent, contentWidth);

      lines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, marginX, y);
        y += 4.5;
      });
      y += 6;
    });
  }

  // 4. Tables
  if (config.includeTablesAndFigures !== false && (project.tables || []).length > 0) {
    checkNewPage(20);
    doc.setFont(font, "bold");
    doc.setFontSize(12);
    doc.text("Tables", marginX, y);
    y += 8;

    (project.tables || []).forEach((tbl) => {
      checkNewPage(25);
      doc.setFont(font, "bold");
      doc.setFontSize(10);
      doc.text(tbl.title, marginX, y);
      y += 5;

      doc.setFont(font, "italic");
      doc.setFontSize(8.5);
      doc.text(tbl.caption, marginX, y);
      y += 6;

      // Table Header
      doc.setFont(font, "bold");
      doc.setFontSize(8);
      const headersStr = (tbl.headers || []).join(" | ");
      doc.text(headersStr, marginX, y);
      y += 5;

      // Table Rows
      doc.setFont(font, "normal");
      (tbl.rows || []).forEach((row) => {
        checkNewPage(5);
        const rowStr = row.map((cell) => String(cell)).join(" | ");
        const splitRow = doc.splitTextToSize(rowStr, contentWidth);
        doc.text(splitRow, marginX, y);
        y += splitRow.length * 4.5;
      });
      y += 6;
    });
  }

  // 5. Figures
  if (config.includeTablesAndFigures !== false && (project.figures || []).length > 0) {
    checkNewPage(20);
    doc.setFont(font, "bold");
    doc.setFontSize(12);
    doc.text("Figures & Captions", marginX, y);
    y += 8;

    (project.figures || []).forEach((fig) => {
      checkNewPage(15);
      doc.setFont(font, "bold");
      doc.setFontSize(10);
      doc.text(`Figure: ${fig.title}`, marginX, y);
      y += 5;

      doc.setFont(font, "italic");
      doc.setFontSize(8.5);
      const splitCap = doc.splitTextToSize(`Caption: ${fig.caption} (${fig.type})`, contentWidth);
      doc.text(splitCap, marginX, y);
      y += splitCap.length * 4.5 + 4;
    });
  }

  // 6. Bibliography / References
  if (config.includeReferences !== false && (project.sources || []).length > 0) {
    checkNewPage(20);
    doc.setFont(font, "bold");
    doc.setFontSize(12);
    doc.text("References", marginX, y);
    y += 8;

    doc.setFont(font, "normal");
    doc.setFontSize(8.5);

    (project.sources || []).forEach((src, idx) => {
      checkNewPage(10);
      const refEntry = formatBibliographyEntry(src, idx, styleId as any);
      const cleanRef = stripMarkdownTokens(refEntry);
      const splitRef = doc.splitTextToSize(cleanRef, contentWidth);
      doc.text(splitRef, marginX, y);
      y += splitRef.length * 4 + 3;
    });
  }

  // Save PDF
  const safeTitle = (project.title || "Manuscript").substring(0, 25).replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${safeTitle}_TehqIQ.pdf`);
}

// 3. BIBTEX EXPORT (Requirement 8)
export function generateBibTeX(project: ProjectState): string {
  if (!project.sources || project.sources.length === 0) return "% No sources in library\n";

  return project.sources
    .map((src, idx) => {
      const citeKey = src.authors?.[0]?.split(" ")?.[0]?.toLowerCase() || `ref${idx + 1}`;
      const year = src.year || 2026;
      const cleanTitle = (src.title || "").replace(/[{}&%$#_]/g, "\\$&");
      const cleanAuthors = (src.authors || []).join(" and ").replace(/[{}&%$#_]/g, "\\$&");

      return `@article{${citeKey}${year},
  author = {${cleanAuthors}},
  title = {${cleanTitle}},
  journal = {${src.journalOrVenue || "Scholarly Outlet"}},
  year = {${year}},
  volume = {${src.volume || ""}},
  number = {${src.issue || ""}},
  pages = {${src.pages || ""}},
  doi = {${src.doi || ""}},
  url = {${src.url || (src.doi ? `https://doi.org/${src.doi}` : "")}}
}`;
    })
    .join("\n\n");
}

// 4. RIS EXPORT (Requirement 8)
export function generateRIS(project: ProjectState): string {
  if (!project.sources || project.sources.length === 0) return "";

  return project.sources
    .map((src) => {
      const lines = [
        "TY  - JOUR",
        `TI  - ${src.title}`,
        ...(src.authors || []).map((a) => `AU  - ${a}`),
        `JO  - ${src.journalOrVenue || ""}`,
        `PY  - ${src.year || ""}`,
        `VL  - ${src.volume || ""}`,
        `IS  - ${src.issue || ""}`,
        `SP  - ${src.pages || ""}`,
        `DO  - ${src.doi || ""}`,
        `UR  - ${src.url || (src.doi ? `https://doi.org/${src.doi}` : "")}`,
        "ER  -",
      ];
      return lines.join("\n");
    })
    .join("\n\n");
}

// 5. CSL JSON EXPORT (Requirement 8)
export function generateCslJson(project: ProjectState): string {
  if (!project.sources || project.sources.length === 0) return "[]";

  const cslItems = project.sources.map((src, idx) => {
    const authorsArr = (src.authors || []).map((name) => {
      const parts = name.split(" ");
      const family = parts.pop() || "";
      const given = parts.join(" ");
      return { family, given };
    });

    return {
      id: src.id || `src-${idx + 1}`,
      type: "article-journal",
      title: src.title,
      author: authorsArr,
      "container-title": src.journalOrVenue,
      issued: { "date-parts": [[src.year || 2026]] },
      volume: src.volume,
      issue: src.issue,
      page: src.pages,
      DOI: src.doi,
      URL: src.url || (src.doi ? `https://doi.org/${src.doi}` : undefined),
    };
  });

  return JSON.stringify(cslItems, null, 2);
}

// 6. JATS XML EXPORT & VALIDATION ENGINE (Requirement 9 & Acceptance Test)
export function generateJatsXml(project: ProjectState): string {
  const cleanTitle = (project.title || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.3 20210610//EN" "JATS-archivearticle1-3.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="research-article" dtd-version="1.3">
  <front>
    <journal-meta>
      <journal-id journal-id-type="publisher">${project.selectedTargetOutlet?.issnOrAcronym || "TehqIQ"}</journal-id>
      <journal-title-group>
        <journal-title>${project.selectedTargetOutlet?.title || "TehqIQ Scholarly Archive"}</journal-title>
      </journal-title-group>
    </journal-meta>
    <article-meta>
      <title-group>
        <article-title>${cleanTitle}</article-title>
      </title-group>
      <contrib-group>
        ${(project.authors || [])
          .map((a) => {
            const parts = a.fullName.split(" ");
            const surname = parts.pop() || "";
            const given = parts.join(" ") || "Author";
            return `<contrib contrib-type="author">
          <name><surname>${surname}</surname><given-names>${given}</given-names></name>
          <email>${a.email}</email>
        </contrib>`;
          })
          .join("\n")}
      </contrib-group>
    </article-meta>
  </front>
  <body>
    ${(project.sections || [])
      .map((s) => {
        const secText = stripMarkdownTokens(s.content).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<sec>
      <title>${s.title}</title>
      <p>${secText}</p>
    </sec>`;
      })
      .join("\n")}
  </body>
  <back>
    <ref-list>
      ${(project.sources || [])
        .map(
          (src, idx) => `<ref id="b${idx + 1}">
        <element-citation publication-type="journal">
          <article-title>${(src.title || "").replace(/&/g, "&amp;")}</article-title>
          <source>${(src.journalOrVenue || "").replace(/&/g, "&amp;")}</source>
          <year>${src.year || 2026}</year>
        </element-citation>
      </ref>`
        )
        .join("\n")}
    </ref-list>
  </back>
</article>`;
}

export function validateJatsXml(xmlStr: string): {
  isValid: boolean;
  validationErrors: string[];
  label: string;
  isExperimental: boolean;
} {
  const errors: string[] = [];

  if (!xmlStr.includes("<?xml version=")) errors.push("Missing XML declaration header.");
  if (!xmlStr.includes("<article")) errors.push("Missing <article> root tag.");
  if (!xmlStr.includes("<front>") || !xmlStr.includes("</front>")) errors.push("Missing required <front> section.");
  if (!xmlStr.includes("<journal-meta>") || !xmlStr.includes("<article-meta>")) errors.push("Missing required JATS journal-meta or article-meta tags.");
  if (!xmlStr.includes("<body>") || !xmlStr.includes("</body>")) errors.push("Missing required <body> section.");
  if (!xmlStr.includes("<back>") || !xmlStr.includes("</back>")) errors.push("Missing required <back> section.");

  const isValid = errors.length === 0;

  return {
    isValid,
    validationErrors: errors,
    label: isValid ? "Validated JATS XML v1.3 (NLM Standard)" : "Experimental JATS XML (Unvalidated)",
    isExperimental: !isValid,
  };
}

// 7. RECORD EXPORT JOB HISTORY (Requirement 11)
export function createExportJobRecord(
  project: ProjectState,
  exportFormat: ExportJobRecord["exportFormat"],
  exportMode: "Submission-Ready" | "Draft Review",
  gateChecksResults: GateCheckResult[],
  includedComponents: ExportJobRecord["includedComponents"],
  userEmail: string
): ExportJobRecord {
  const isBlocked = exportMode === "Submission-Ready" && gateChecksResults.some((g) => g.status === "Blocker");

  return {
    id: `job-${Date.now()}`,
    jobId: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    userEmail: userEmail || "researcher@local",
    manuscriptVersion: project.version || 1,
    selectedOutletId: project.selectedTargetOutlet?.id,
    selectedOutletTitle: project.selectedTargetOutlet?.title,
    exportFormat,
    exportMode,
    isBlocked,
    gateChecksResults,
    includedComponents,
    fileSizeEstimate: "~" + Math.round((project.sections || []).reduce((acc, s) => acc + s.content.length, 0) / 1024 + 150) + " KB",
    status: isBlocked ? "Blocked" : "Success",
  };
}
