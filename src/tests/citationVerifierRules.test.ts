import { describe, it, expect } from 'vitest';
import { verifyManuscriptCitations, createMissingSourceRecord } from '../lib/citationVerifier';
import { SourceRecord, ManuscriptSection } from '../types';

describe('Citation Verifier: False-Positive and False-Negative Tests', () => {
  const sources: SourceRecord[] = [
    {
      id: 'src-1',
      title: 'Neuromuscular adaptative responses',
      authors: ['Pérez-Gómez, J.', "O'Connor, M."],
      year: 2024,
      journalOrVenue: 'J Biomech',
      documentType: 'Journal Article',
      peerReviewStatus: 'Peer-reviewed',
      verificationState: 'Verified',
      relevanceScore: 9,
      tags: ['biomechanics'],
      isDemo: false
    },
    {
      id: 'src-2',
      title: 'Hamstring activation in sprinting',
      authors: ['Mendiguchia, J.', 'Boyer, K. A.'],
      year: 2022,
      journalOrVenue: 'Sports Med',
      documentType: 'Journal Article',
      peerReviewStatus: 'Peer-reviewed',
      verificationState: 'Verified',
      relevanceScore: 9,
      tags: ['sprinting'],
      isDemo: false
    }
  ];


  describe('1. False-Positive Avoidance Tests', () => {
    it('does not flag plain narrative year references as missing citations', () => {
      const sections: ManuscriptSection[] = [
        {
          id: 'sec-1',
          title: 'Introduction',
          content: 'In 2024, the laboratory acquired high-speed optical capture equipment.',
          order: 1,
          currentWordCount: 10,
          citationIds: [],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(sections, sources, 'apa-7th');
      // Plain year "2024" without author context or parenthetical brackets shouldn't produce a missing citation
      const missingForPlainYear = report.missingCitations.filter((m) => m.rawText === '2024');
      expect(missingForPlainYear).toHaveLength(0);
    });
  });

  describe('2. False-Negative Detection Tests', () => {
    it('correctly matches stable source IDs [src-1] and [src-2]', () => {
      const sections: ManuscriptSection[] = [
        {
          id: 'sec-1',
          title: 'Introduction',
          content: 'Primary measurements were collected using established protocols [src-1] and verified [src-2].',
          order: 1,
          currentWordCount: 12,
          citationIds: ['src-1', 'src-2'],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(sections, sources, 'apa-7th');
      expect(report.matchedCount).toBe(2);
      expect(report.missingCount).toBe(0);
      expect(report.overallScore).toBe(100);
    });

    it('correctly matches narrative citations with hyphenated and apostrophe author surnames', () => {
      const sections: ManuscriptSection[] = [
        {
          id: 'sec-1',
          title: 'Introduction',
          content: 'As shown by Pérez-Gómez et al. (2024), peak muscle force occurs during leg extension.',
          order: 1,
          currentWordCount: 14,
          citationIds: [],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(sections, sources, 'apa-7th');
      const matched = report.occurrences.find((o) => o.status === 'matched');
      expect(matched).toBeDefined();
      expect(matched?.matchedSource?.id).toBe('src-1');
    });

    it('correctly handles multi-source parenthetical citations (Mendiguchia et al., 2022; Pérez-Gómez et al., 2024)', () => {
      const sections: ManuscriptSection[] = [
        {
          id: 'sec-1',
          title: 'Introduction',
          content: 'Previous studies support these findings (Mendiguchia et al., 2022; Pérez-Gómez et al., 2024).',
          order: 1,
          currentWordCount: 11,
          citationIds: [],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(sections, sources, 'apa-7th');
      expect(report.matchedCount).toBe(2);
      expect(report.missingCount).toBe(0);
    });

    it('correctly identifies missing citations when uncited author is referenced', () => {
      const sections: ManuscriptSection[] = [
        {
          id: 'sec-1',
          title: 'Introduction',
          content: 'According to Smith et al. (2025), loading rates double during sprint transitions.',
          order: 1,
          currentWordCount: 12,
          citationIds: [],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(sections, sources, 'apa-7th');
      expect(report.missingCount).toBeGreaterThanOrEqual(1);
      expect(report.missingCitations.some((m) => m.authorOrRef.includes('Smith'))).toBe(true);
    });
  });

  describe('3. Prohibition of Fabricated Sources', () => {
    it('throws prohibition error if createMissingSourceRecord is called', () => {
      expect(() => createMissingSourceRecord('Smith J', 2025)).toThrow(/prohibited/i);
    });
  });

  describe('4. CSL Style Mismatch Warnings', () => {
    it('generates style warning if IEEE (numeric) style is active but author-date citations are used', () => {
      const sections: ManuscriptSection[] = [
        {
          id: 'sec-1',
          title: 'Introduction',
          content: 'As shown by Mendiguchia et al. (2022), hamstring adaptation is rapid.',
          order: 1,
          currentWordCount: 10,
          citationIds: [],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(sections, sources, 'ieee');
      expect(report.styleWarnings.length).toBeGreaterThan(0);
      expect(report.styleWarnings[0]).toMatch(/Active CSL Style is set to IEEE/i);
    });
  });
});
