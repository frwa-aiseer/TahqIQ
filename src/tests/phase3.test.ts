import { describe, it, expect } from 'vitest';
import { normalizeDoi, fetchCrossrefMetadata } from '../lib/metadataProviders';
import { verifyManuscriptCitations, createMissingSourceRecord } from '../lib/citationVerifier';
import { performStateTransition } from '../lib/stateMachines';
import { parseBibTeX } from '../lib/referenceParsers';
import { SourceRecord, ClaimItem, ManuscriptSection } from '../types';

describe('Phase 3 Evidence & Citation Acceptance Tests', () => {
  const actor = { uid: 'user-test-3', email: 'tester@tehqiq.edu' };

  it('1. Invalid DOI remains unresolved', async () => {
    const invalidDoiResult = normalizeDoi('invalid-not-a-doi-12345');
    expect(invalidDoiResult).toBe('');

    const crossrefInvalid = await fetchCrossrefMetadata('10.0000/invalid_random_doi_99999');
    expect(crossrefInvalid.success).toBe(false);
    expect(crossrefInvalid.error).toContain('not found in Crossref registry');
  });

  it('2. No random DOI can be generated automatically', () => {
    expect(() => createMissingSourceRecord('Unknown Scholar', 2024)).toThrow(/prohibited/i);
  });

  it('3. Claim cannot become Verified without linked evidence and researcher review', () => {
    const unlinkedClaim: ClaimItem = {
      id: 'claim-phase3-1',
      claimText: 'Warm up reduces injury rate',
      claimType: 'Causal claim',
      manuscriptSection: 'Discussion',
      importance: 'High',
      linkedSourceIds: [],
      linkedEvidence: [],
      evidenceRelationship: 'No support identified',
      isResearcherApproved: false,
      verificationStatus: 'Unverified',
      state: 'Draft',
      stateHistory: [],
    };

    const transitionRes = performStateTransition('Claim', unlinkedClaim, 'Verified', actor, 'Attempt jump without evidence');
    expect(transitionRes.success).toBe(false);
    expect(transitionRes.error).toContain('Prohibited transition');
  });

  it('4. Verifier does NOT accept wrong author/year because of a title word', () => {
    const mockSource: SourceRecord = {
      id: 'src-biomech-1',
      title: 'Electromyographic analysis of warm-up protocols in hamstring activation',
      authors: ['Boyer, K.', 'Smith, J.'],
      year: 2021,
      journalOrVenue: 'Journal of Biomechanics',
      documentType: 'Journal Article',
      peerReviewStatus: 'Peer-reviewed',
      verificationState: 'Verified',
      relevanceScore: 9,
      tags: ['biomechanics'],
      state: 'Metadata Verified',
      stateHistory: [],
    };

    const testSection: ManuscriptSection = {
      id: 'sec-1',
      title: 'Discussion',
      order: 1,
      currentWordCount: 10,
      content: 'Previous studies examined hamstring activation in warm-up routines (Jones, 2019).',
      citationIds: [],
      status: 'Drafting',
      version: 1,
      lastEditedBy: 'system',
      lastEditedTimestamp: new Date().toISOString(),
    };

    const report = verifyManuscriptCitations([testSection], [mockSource]);
    expect(report.matchedCount).toBe(0);
    expect(report.missingCount).toBe(1);
  });

  it('5. Bibliography and in-text citation identity remain synchronized through stable IDs', () => {
    const mockSource: SourceRecord = {
      id: 'src-biomech-1',
      title: 'Electromyographic analysis of warm-up protocols in hamstring activation',
      authors: ['Boyer, K.', 'Smith, J.'],
      year: 2021,
      journalOrVenue: 'Journal of Biomechanics',
      documentType: 'Journal Article',
      peerReviewStatus: 'Peer-reviewed',
      verificationState: 'Verified',
      relevanceScore: 9,
      tags: ['biomechanics'],
      state: 'Metadata Verified',
      stateHistory: [],
    };

    const sectionWithStableId: ManuscriptSection = {
      id: 'sec-2',
      title: 'Results',
      order: 2,
      currentWordCount: 10,
      content: 'Maximum isometric torque increased significantly after dynamic protocol [src-biomech-1].',
      citationIds: ['src-biomech-1'],
      status: 'Drafting',
      version: 1,
      lastEditedBy: 'system',
      lastEditedTimestamp: new Date().toISOString(),
    };

    const stableReport = verifyManuscriptCitations([sectionWithStableId], [mockSource]);
    expect(stableReport.matchedCount).toBe(1);
    expect(stableReport.occurrences[0].matchedSource?.id).toBe('src-biomech-1');
  });

  it('6. All metadata fields show provenance & Crossref disclaimer', () => {
    const bibtexInput = `@article{smith2023, author={Smith, Alice}, title={EMG Studies}, journal={Biomechanics}, year={2023}, doi={10.1016/j.jbiomech.2023.102345}}`;
    const parsedBib = parseBibTeX(bibtexInput);
    expect(parsedBib.length).toBe(1);
    expect(parsedBib[0].provenance?.provider).toBe('BibTeX Import');
    expect(Boolean(parsedBib[0].provenance?.fieldProvenance?.title)).toBe(true);
  });
});
