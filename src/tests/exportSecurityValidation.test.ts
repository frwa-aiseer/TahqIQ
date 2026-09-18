import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
import { evaluateExportGateChecks } from "../lib/complianceEngine";
import {
  createExportJobRecord,
  createSubmissionPackageManifest,
  downloadPdfPackage,
  generateBibTeX,
  generateCslJson,
  generateGenuineDocxBlob,
  generateJatsXml,
  generateLatexManuscript,
  generateRIS,
  validateJatsWithConfiguredService,
  validateJatsXml,
} from "../lib/exportUtils";
import type { ProjectState, SourceRecord } from "../types";

const source = (overrides: Partial<SourceRecord> = {}): SourceRecord => ({
  id: "source-export", title: "Observed & verified source", authors: ["Doe, Jane"], year: 2024,
  journalOrVenue: "Observed Journal", doi: "10.1234/export-fixture", documentType: "Article",
  peerReviewStatus: "Peer-reviewed", verificationState: "Verified", relevanceScore: 8, tags: [], isDemo: false, isSynthetic: false, ...overrides,
});

function exportFixture(): ProjectState {
  const project = createEmptyProject({
    id: "project-export-validation", title: "Observed Export Manuscript", selectedTargetOutlet: BASELINE_JOURNALS[0],
    sources: [source()], authors: [{ id: "author-1", fullName: "Jane Doe", publicationName: "Jane Doe", email: "jane@example.org", department: "Research", institution: "Observed University", city: "", country: "", isCorresponding: true, order: 1, creditRoles: [], conflictDeclaration: "None declared", finalApproval: true }],
  });
  project.sections = [
    { ...project.sections[0], content: "Observed abstract." },
    { ...project.sections[1], title: "Introduction", content: "Observed introduction [source-export].", citationIds: ["source-export"] },
    { ...project.sections[2], title: "Methods", content: "Observed & methods." },
  ];
  return project;
}

function blocker(project: ProjectState, checkId: string, mutate: (value: ProjectState) => void) {
  mutate(project);
  const checks = evaluateExportGateChecks(project, "Submission-Ready");
  const check = checks.find((item) => item.checkId === checkId);
  expect(check?.status, `${checkId} should block submission`).toBe("Blocker");
  const job = createExportJobRecord(project, "DOCX", "Submission-Ready", checks, {
    titlePage: true, abstract: true, sections: true, figuresAndTables: true, bibliography: true, ethicsAndAiDisclosure: true, supplementarySelections: true,
  }, "researcher@example.org");
  expect(job.status).toBe("Blocked");
}

describe("TQ-VSC-090 export validation and submission gates", () => {
  it("validates DOCX OpenXML structure and preserves manuscript sections", async () => {
    const blob = await generateGenuineDocxBlob(exportFixture());
    const directory = mkdtempSync(join(tmpdir(), "tehqiq-docx-"));
    const path = join(directory, "manuscript.docx");
    try {
      writeFileSync(path, Buffer.from(await blob.arrayBuffer()));
      const documentXml = execFileSync("unzip", ["-p", path, "word/document.xml"], { encoding: "utf8" });
      expect(documentXml).toContain("Observed Export Manuscript");
      expect(documentXml).toContain("Introduction");
      expect(documentXml).toContain("Methods");
      expect(documentXml).toContain("<w:body>");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("returns a complete PDF artifact containing title and section content", async () => {
    const generatedFile = join(process.cwd(), "Observed_Export_Manuscrip_TehqIQ.pdf");
    try {
      const pdf = downloadPdfPackage(exportFixture(), { includeTitlePage: true, includeAbstract: true, includeSections: true, includeReferences: true }, "Draft Review");
      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe("application/pdf");
      expect(pdf.size).toBeGreaterThan(500);
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      const serialized = new TextDecoder().decode(bytes);
      expect(serialized.slice(0, 5)).toBe("%PDF-");
      expect(serialized).toContain("Introduction");
      expect(serialized).toContain("Methods");
      expect(serialized.match(/\/Type \/Page/g)?.length).toBeGreaterThan(0);
    } finally {
      rmSync(generatedFile, { force: true });
    }
  });

  it("validates BibTeX, RIS, CSL JSON, and LaTeX required fields, escaping, and citations", () => {
    const project = exportFixture();
    const bibtex = generateBibTeX(project);
    expect(bibtex).toMatch(/@article\{doe2024,/);
    expect(bibtex).toContain("author = {Doe, Jane}");
    expect(bibtex).toContain("title = {Observed \\& verified source}");
    expect(bibtex).toContain("journal = {Observed Journal}");
    expect(bibtex).toContain("year = {2024}");

    const ris = generateRIS(project);
    expect(ris).toContain("TY  - JOUR"); expect(ris).toContain("TI  - Observed & verified source"); expect(ris).toContain("AU  - Doe, Jane"); expect(ris).toContain("PY  - 2024"); expect(ris).toContain("ER  -");

    const csl = JSON.parse(generateCslJson(project));
    expect(csl).toHaveLength(1);
    expect(csl[0]).toMatchObject({ id: "source-export", type: "article-journal", title: "Observed & verified source", DOI: "10.1234/export-fixture", issued: { "date-parts": [[2024]] } });
    expect(csl[0].author).toEqual([{ family: "Jane", given: "Doe," }]);

    const latex = generateLatexManuscript(project);
    expect(latex).toContain("\\documentclass{article}");
    expect(latex).toContain("\\section{Introduction}");
    expect(latex).toContain("\\cite{doe2024}");
    expect(latex).toContain("\\&");
    expect(latex).toContain("\\bibliography{references}");
  });

  it("reports truthful JATS validation status and external-validator configuration", async () => {
    const valid = validateJatsXml(generateJatsXml(exportFixture()));
    expect(valid).toMatchObject({ isValid: true, status: "Structural Check Passed", isExperimental: false });
    expect(valid.label).not.toMatch(/DTD compliant|NLM validated|100%/i);
    const malformed = validateJatsXml("<?xml version=\"1.0\"?><article><body /></article>");
    expect(malformed.status).toBe("Schema Validation Failed");
    await expect(validateJatsWithConfiguredService(generateJatsXml(exportFixture()))).resolves.toMatchObject({ status: "Validator Not Configured", isValid: false });
  });

  it("keeps the submission manifest limited to supplied non-empty package files", () => {
    const manifest = createSubmissionPackageManifest(exportFixture(), [], [{ path: "manuscript.docx", content: "docx-bytes" }, { path: "references.bib", content: generateBibTeX(exportFixture()) }, { path: "manuscript.tex", content: generateLatexManuscript(exportFixture()) }, { path: "missing.pdf", content: "" }], "export-validation");
    expect(manifest.files.map((file) => file.path)).toEqual(["manuscript.docx", "references.bib", "manuscript.tex"]);
    expect(manifest.files.every((file) => file.bytes > 0)).toBe(true);
    expect(manifest.exportId).toBe("export-validation");
  });

  it.each([
    ["gate-citation-integrity", (project: ProjectState) => { project.sources = [source({ verificationState: "Unverified" })]; }],
    ["gate-unlinked-results", (project: ProjectState) => {
      project.sections = [...project.sections, { ...project.sections[0], id: "results", title: "Results", content: "Analysis pending researcher approval." }];
      project.analysisOutputs = [{ id: "unapproved-analysis", analysisPlanId: "plan-pending", executionTimestamp: "2026-01-01T00:00:00.000Z", softwareEnvironment: "Researcher supplied — review pending", summaryText: "Researcher review pending.", numericResults: {}, pValues: [], effectSizes: [], assumptionChecks: [], isReproduced: false, reproducibilityHash: "pending", datasetHash: "dataset-pending", planId: "plan-pending", state: "Researcher Reviewed" }];
    }],
    ["gate-ethics-mandate", (project: ProjectState) => { project.ethicsInfo = { ...project.ethicsInfo!, approvalRequired: true, approvalNumber: "", consentObtained: false }; }],
    ["gate-author-signoff", (project: ProjectState) => { project.authors = []; }],
    ["gate-demo-content", (project: ProjectState) => { project.isDemoProject = true; }],
  ] as const)("blocks Submission-Ready export for %s", (checkId, mutate) => {
    blocker(exportFixture(), checkId, mutate);
  });
});
