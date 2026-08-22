import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  performStateTransition,
  validateEntityStateIntegrity,
  DEFAULT_INITIAL_STATES
} from '../lib/stateMachines';
import { getRolePermissions, ROLE_PERMISSIONS_MAP } from '../lib/permissions';
import { calculateProjectReadiness, calculateProjectPipelineStages } from '../lib/readinessCalculator';
import { profileDataset } from '../lib/statsEngine';
import { parseReferenceTextToSource, parseBibTeXString, parseRISString } from '../lib/referenceParsers';
import { formatBibliographyEntry, CSL_STYLE_DESCRIPTIONS } from '../lib/cslStyles';
import { createEmptyProject, createDemoProject } from '../data/demoProject';

describe('Unit Tests: Standalone Functions and Utility Engines', () => {
  describe('1. State Machines Engine', () => {
    it('validates allowed transitions for Source entity', () => {
      expect(isValidTransition('Source', 'Imported', 'Metadata Pending')).toBe(true);
      expect(isValidTransition('Source', 'Imported', 'Full Text Reviewed')).toBe(false);
      expect(isValidTransition('Source', 'Retracted', 'Full Text Available')).toBe(false); // Retracted is terminal
    });

    it('validates allowed transitions for Claim entity', () => {
      expect(isValidTransition('Claim', 'Draft', 'Unlinked')).toBe(true);
      expect(isValidTransition('Claim', 'Draft', 'Verified')).toBe(false);
    });

    it('executes performStateTransition and updates entity stateHistory', () => {
      const claim = { id: 'claim-1', state: 'Evidence Linked', linkedSourceIds: ['src-1'], stateHistory: [] };
      const actor = { uid: 'user-1', email: 'author@test.com' };

      const result = performStateTransition('Claim', claim, 'Researcher Reviewed', actor, 'Reviewed evidence');
      expect(result.success).toBe(true);
      expect(result.entity.state).toBe('Researcher Reviewed');
      expect((result.entity as any).stateHistory).toHaveLength(1);
      expect((result.entity as any).stateHistory![0].fromState).toBe('Evidence Linked');
      expect((result.entity as any).stateHistory![0].toState).toBe('Researcher Reviewed');
    });


    it('enforces Phase 3 rule: Claim cannot become Verified without linked evidence', () => {
      const claimNoEvidence = { id: 'claim-2', state: 'Researcher Reviewed', linkedSourceIds: [] };
      const actor = { uid: 'user-1', email: 'author@test.com' };

      const result = performStateTransition('Claim', claimNoEvidence, 'Verified', actor, 'Try verify');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/cannot become Verified without linked evidence/i);
    });

    it('detects state manipulation via validateEntityStateIntegrity', () => {
      const manipulatedEntity = { id: 'src-99', state: 'Full Text Reviewed', stateHistory: [] };
      const check = validateEntityStateIntegrity('Source', manipulatedEntity);
      expect(check.isValid).toBe(false);
      expect(check.reason).toMatch(/Client state manipulation detected/i);
    });
  });

  describe('2. Permissions and Roles Engine', () => {
    it('returns correct permissions for Owner and Viewer', () => {
      const ownerPerms = getRolePermissions('Owner');
      expect(ownerPerms.canDeleteProject).toBe(true);
      expect(ownerPerms.canEditManuscript).toBe(true);
      expect(ownerPerms.isReadOnly).toBe(false);

      const viewerPerms = getRolePermissions('Viewer');
      expect(viewerPerms.canDeleteProject).toBe(false);
      expect(viewerPerms.canEditManuscript).toBe(false);
      expect(viewerPerms.isReadOnly).toBe(true);
    });

    it('restricts Statistician to dataset and comment permissions', () => {
      const statPerms = getRolePermissions('Statistician');
      expect(statPerms.canEditDatasets).toBe(true);
      expect(statPerms.canAddReviewerComments).toBe(true);
      expect(statPerms.canEditManuscript).toBe(false);
      expect(statPerms.canManageMembers).toBe(false);
    });

    it('normalizes role title variations', () => {
      expect(getRolePermissions('Project Owner')).toEqual(ROLE_PERMISSIONS_MAP['Owner']);
      expect(getRolePermissions('Research Supervisor')).toEqual(ROLE_PERMISSIONS_MAP['Supervisor']);
      expect(getRolePermissions('Literature Reviewer')).toEqual(ROLE_PERMISSIONS_MAP['Reviewer']);
    });
  });

  describe('3. Readiness Calculator Engine', () => {
    it('returns 0 readiness for empty projects', () => {
      const emptyProj = createEmptyProject();
      const readiness = calculateProjectReadiness(emptyProj);
      expect(readiness.overall).toBe(0);
      expect(readiness.questionClarity).toBe(0);
      expect(readiness.literatureCoverage).toBe(0);
    });

    it('calculates readiness correctly for demo project', () => {
      const demo = createDemoProject();
      const readiness = calculateProjectReadiness(demo);
      expect(readiness.overall).toBeGreaterThan(0);
      expect(readiness.questionClarity).toBeGreaterThan(0);
      expect(readiness.literatureCoverage).toBeGreaterThan(0);
    });

    it('calculates all 20 pipeline stages status', () => {
      const demo = createDemoProject();
      const stages = calculateProjectPipelineStages(demo);
      expect(stages).toHaveLength(20);
      expect(stages[0].name).toBe('Project Setup');
      expect(stages[0].status).toBe('Completed');
    });

  });

  describe('4. Dataset Profiler Engine', () => {
    it('handles empty dataset rows', () => {
      const profile = profileDataset([]);
      expect(profile.recordCount).toBe(0);
      expect(profile.variableCount).toBe(0);
      expect(profile.summary).toEqual({});
    });

    it('profiles numeric and categorical variables correctly', () => {
      const rows = [
        { age: 25, group: 'A' },
        { age: 35, group: 'B' },
        { age: 45, group: 'A' },
      ];
      const profile = profileDataset(rows);
      expect(profile.recordCount).toBe(3);
      expect(profile.variableCount).toBe(2);
      expect(profile.summary.age.type).toBe('Numeric');
      expect(profile.summary.age.mean).toBe(35);
      expect(profile.summary.age.min).toBe(25);
      expect(profile.summary.age.max).toBe(45);
      expect(profile.summary.group.type).toBe('Categorical');
      expect(profile.summary.group.unique).toBe(2);
    });
  });

  describe('5. Reference Parsers and CSL Styles', () => {
    it('parses text into source record with extracted DOI and year', () => {
      const refText = 'Smith J, Doe A. (2024). Empirical analysis of motion. J Sports Sci 40(2): 100-110. https://doi.org/10.1080/02640414.2024.123456';
      const parsed = parseReferenceTextToSource(refText);
      expect(parsed.year).toBe(2024);
      expect(parsed.doi).toBe('10.1080/02640414.2024.123456');
    });

    it('parses BibTeX entry accurately', () => {
      const bibtex = `@article{smith2024,
        author = {Smith, John and Doe, Jane},
        title = {Advanced Biomechanics},
        journal = {Journal of Applied Physiology},
        year = {2024},
        volume = {130},
        pages = {45-52},
        doi = {10.1152/japplphysiol.2024.1}
      }`;
      const sources = parseBibTeXString(bibtex);
      expect(sources).toHaveLength(1);
      expect(sources[0].authors).toContain('Smith, John');
      expect(sources[0].authors).toContain('Doe, Jane');
      expect(sources[0].year).toBe(2024);
      expect(sources[0].doi).toBe('10.1152/japplphysiol.2024.1');
    });

    it('parses RIS string accurately', () => {
      const ris = `TY  - JOUR
TI  - Neuromuscular Adaptation
AU  - Boyer, K. A.
AU  - Mendiguchia, J.
JO  - Medicine & Science in Sports & Exercise
PY  - 2021
VL  - 53
IS  - 4
SP  - 780-790
DO  - 10.1249/MSS.0000000000002500
ER  -`;
      const sources = parseRISString(ris);
      expect(sources).toHaveLength(1);
      expect(sources[0].title).toBe('Neuromuscular Adaptation');
      expect(sources[0].authors).toEqual(['Boyer, K. A.', 'Mendiguchia, J.']);
      expect(sources[0].year).toBe(2021);
    });

    it('formats bibliography entries for APA, IEEE, and Vancouver CSL styles', () => {
      const src = {
        id: 'src-1',
        title: 'Force-velocity profiling in athletes',
        authors: ['Samozino, P.', 'Morin, J. B.'],
        year: 2022,
        journalOrVenue: 'European Journal of Applied Physiology',
        volume: '122',
        issue: '3',
        pages: '600-612',
        doi: '10.1007/s00421-022-04800-x',
        documentType: 'Journal Article',
        peerReviewStatus: 'Peer-reviewed' as const,
        verificationState: 'Verified' as const,
        relevanceScore: 9,
        tags: ['biomechanics'],
        isDemo: false
      };

      const apa = formatBibliographyEntry(src, 0, 'apa');
      expect(apa).toContain('Samozino, P., Morin, J. B.');
      expect(apa).toContain('(2022)');

      const ieee = formatBibliographyEntry(src, 0, 'ieee');
      expect(ieee).toContain('[1]');
      expect(ieee).toContain('"Force-velocity profiling in athletes,"');


      const vancouver = formatBibliographyEntry(src, 0, 'vancouver');
      expect(vancouver).toContain('1. Samozino, P., Morin, J. B.');
    });


    it('contains definitions for required CSL style options', () => {
      expect(CSL_STYLE_DESCRIPTIONS['apa-7th']).toBeDefined();
      expect(CSL_STYLE_DESCRIPTIONS['vancouver']).toBeDefined();
      expect(CSL_STYLE_DESCRIPTIONS['ieee']).toBeDefined();
      expect(CSL_STYLE_DESCRIPTIONS['nature']).toBeDefined();
    });
  });
});
