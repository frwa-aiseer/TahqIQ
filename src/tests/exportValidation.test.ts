import { describe, it, expect } from 'vitest';
import {
  generateGenuineDocxBlob,
  generateBibTeX,
  generateRIS,
  generateCslJson,
  generateJatsXml,
  validateJatsXml,
  createExportJobRecord,
  stripMarkdownTokens
} from '../lib/exportUtils';
import { createDemoProject } from '../data/demoProject';
import { GateCheckResult } from '../types';

const defaultComponents = {
  titlePage: true,
  abstract: true,
  sections: true,
  figuresAndTables: true,
  bibliography: true,
  ethicsAndAiDisclosure: true,
  supplementarySelections: true
};


describe('Export Validation Tests', () => {
  const project = createDemoProject();

  describe('1. DOCX Exporter Validation', () => {
    it('generates a valid DOCX Blob with non-zero size', async () => {
      const blob = await generateGenuineDocxBlob(project, {
        includeTitlePage: true,
        includeAbstract: true,
        includeSections: true,
        includeTablesAndFigures: true,
        includeReferences: true,
        includeEthicsAndAiDisclosure: true,
        lineSpacing: 1.5,
        fontFamily: 'Times New Roman'
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000); // DOCX binary header & XML contents
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  });

  describe('2. BibTeX Exporter & Character Escaping', () => {
    it('generates valid BibTeX entries and escapes special characters', () => {
      const bibtex = generateBibTeX(project);

      expect(bibtex).toContain('@article{');
      expect(bibtex).toContain('author = {');
      expect(bibtex).toContain('title = {');
      expect(bibtex).toContain('journal = {');
      expect(bibtex).toContain('year = {');

      // Verify no unescaped bare raw characters that break BibTeX parsers
      expect(bibtex).not.toMatch(/[^\\]&(?![a-zA-Z]+;)/); // Raw unescaped ampersand check
    });
  });

  describe('3. RIS Exporter Validation', () => {
    it('generates valid RIS structure with TY, TI, AU, PY, ER tags', () => {
      const ris = generateRIS(project);

      expect(ris).toContain('TY  - JOUR');
      expect(ris).toContain('TI  - ');
      expect(ris).toContain('AU  - ');
      expect(ris).toContain('PY  - ');
      expect(ris).toContain('ER  -');
    });
  });

  describe('4. CSL JSON Exporter Validation', () => {
    it('generates valid CSL JSON string that parses to array of objects', () => {
      const cslJsonStr = generateCslJson(project);
      const parsed = JSON.parse(cslJsonStr);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].type).toBe('article-journal');
      expect(parsed[0].title).toBeDefined();
      expect(parsed[0].author).toBeDefined();
      expect(Array.isArray(parsed[0].author)).toBe(true);
    });
  });

  describe('5. JATS XML Exporter & Validation Engine', () => {
    it('generates compliant JATS XML v1.3 and passes validation engine', () => {
      const xml = generateJatsXml(project);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<!DOCTYPE article');
      expect(xml).toContain('<article');
      expect(xml).toContain('<front>');
      expect(xml).toContain('<body>');
      expect(xml).toContain('<back>');

      const validation = validateJatsXml(xml);
      expect(validation.isValid).toBe(true);
      expect(validation.validationErrors).toHaveLength(0);
      expect(validation.label).toContain('Validated JATS XML v1.3');
    });

    it('detects missing tags in malformed XML', () => {
      const badXml = '<?xml version="1.0"?><article><body>No front tag</body></article>';
      const validation = validateJatsXml(badXml);

      expect(validation.isValid).toBe(false);
      expect(validation.validationErrors).toContain('Missing required <front> section.');
    });
  });

  describe('6. Export Job Record History Creation', () => {
    it('creates job record with status Success when no blockers exist', () => {
      const gateChecks: GateCheckResult[] = [
        {
          checkId: 'gc-1',
          category: 'Ethics Mandate',
          name: 'Ethics',
          status: 'Pass',
          message: 'Verified',
          resolutionPath: '/ethics'
        }
      ];

      const job = createExportJobRecord(
        project,
        'DOCX',
        'Submission-Ready',
        gateChecks,
        defaultComponents,
        'author@test.com'
      );

      expect(job.status).toBe('Success');
      expect(job.isBlocked).toBe(false);
      expect(job.fileSizeEstimate).toBeDefined();
    });

    it('creates job record with status Blocked when a Blocker gate check exists in Submission-Ready mode', () => {
      const gateChecks: GateCheckResult[] = [
        {
          checkId: 'gc-1',
          category: 'Ethics Mandate',
          name: 'Ethics Approval',
          status: 'Blocker',
          message: 'Ethics ID missing',
          resolutionPath: '/ethics'
        }
      ];

      const job = createExportJobRecord(
        project,
        'DOCX',
        'Submission-Ready',
        gateChecks,
        defaultComponents,
        'author@test.com'
      );

      expect(job.status).toBe('Blocked');
      expect(job.isBlocked).toBe(true);
    });
  });


  describe('7. Markdown Stripper Helper', () => {
    it('strips markdown tokens to plain clean text', () => {
      const raw = '## Heading 2\nThis is **bold** and *italic* text with `code`.';
      const clean = stripMarkdownTokens(raw);

      expect(clean).toBe('Heading 2\nThis is bold and italic text with code.');
    });
  });
});
