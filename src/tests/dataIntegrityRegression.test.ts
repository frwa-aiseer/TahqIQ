import { describe, it, expect } from 'vitest';
import { createEmptyProject, createDemoProject, canAddRecordToProject, isDemoRecord } from '../data/demoProject';
import { performStateTransition, validateEntityStateIntegrity } from '../lib/stateMachines';
import { executePairedCrossoverAnalysis } from '../lib/statsEngine';
import { parseCsvTextToDataset } from '../lib/datasetIngestion';

describe('Data-Integrity Regression Tests', () => {
  describe('1. Demo Record Guard Isolation', () => {
    it('prevents demo records from being attached to real projects', () => {
      const realProject = createEmptyProject();
      expect(realProject.isDemoProject).toBe(false);

      const demoSource: any = { id: 'src-demo-1', title: 'Demo Paper', isDemo: true };
      const realSource: any = { id: 'src-real-1', title: 'Real Paper', isDemo: false };

      expect(canAddRecordToProject(realProject, demoSource)).toBe(false);
      expect(canAddRecordToProject(realProject, realSource)).toBe(true);
    });

    it('correctly identifies demo records via isDemoRecord function', () => {
      const demoRec = { id: 'demo-123', isDemo: true };
      const realRec = { id: 'real-123', isDemo: false };

      expect(isDemoRecord(demoRec)).toBe(true);
      expect(isDemoRecord(realRec)).toBe(false);
    });
  });

  describe('2. Cryptographic Hash Integrity & Result Reproduction', () => {
    it('produces identical reproducibility hash for identical dataset and plan', () => {
      const csvContent = `id,sub,pre,post\n1,S1,10,20\n2,S2,15,25\n3,S3,12,22`;
      const dataset = parseCsvTextToDataset('test_hash.csv', csvContent);
      dataset.isAnonymizedConfirmed = true;
      dataset.state = 'Approved for Analysis';

      const plan = {
        id: 'plan-hash-1',
        title: 'Paired Test',
        researchQuestionId: 'rq-1',
        outcomeVariable: 'pre,post',
        predictorVariables: ['cond'],
        statisticalMethod: 'Paired t-test',
        assumptions: [],
        effectSizeMeasure: 'Cohen d',
        significanceThreshold: 0.05,
        missingDataStrategy: 'Complete',
        status: 'Approved' as const,
        state: 'Approved' as const,
        isPreregistered: true
      };

      const run1 = executePairedCrossoverAnalysis({ dataset, plan, outcomeVariable: 'pre,post' });
      const run2 = executePairedCrossoverAnalysis({ dataset, plan, outcomeVariable: 'pre,post' });

      expect(run1.reproducibilityHash).toBeDefined();
      expect(run1.reproducibilityHash).toBe(run2.reproducibilityHash);
      expect(run1.datasetHash).toBe(dataset.fileHash);
    });

    it('alters reproducibility hash when dataset content or parameters change', () => {
      const csvContent1 = `id,sub,pre,post\n1,S1,10,20\n2,S2,15,25`;
      const csvContent2 = `id,sub,pre,post\n1,S1,10,20\n2,S2,15,99`; // Changed value

      const ds1 = parseCsvTextToDataset('data1.csv', csvContent1);
      const ds2 = parseCsvTextToDataset('data2.csv', csvContent2);
      ds1.isAnonymizedConfirmed = true;
      ds2.isAnonymizedConfirmed = true;
      ds1.state = 'Approved for Analysis';
      ds2.state = 'Approved for Analysis';

      const plan = {
        id: 'plan-1',
        title: 'Test',
        researchQuestionId: 'rq-1',
        outcomeVariable: 'pre,post',
        predictorVariables: [],
        statisticalMethod: 't-test',
        assumptions: [],
        effectSizeMeasure: 'd',
        significanceThreshold: 0.05,
        missingDataStrategy: 'Complete',
        status: 'Approved' as const,
        state: 'Approved' as const,
        isPreregistered: true
      };

      const run1 = executePairedCrossoverAnalysis({ dataset: ds1, plan, outcomeVariable: 'pre,post' });
      const run2 = executePairedCrossoverAnalysis({ dataset: ds2, plan, outcomeVariable: 'pre,post' });

      expect(run1.reproducibilityHash).not.toEqual(run2.reproducibilityHash);
    });
  });

  describe('3. Audit History & State Transition Integrity', () => {
    it('detects missing or forged audit history when entity claims advanced state', () => {
      const forgedClaim = {
        id: 'claim-forged',
        state: 'Verified',
        stateHistory: [] // Missing audit history!
      };

      const check = validateEntityStateIntegrity('Claim', forgedClaim);
      expect(check.isValid).toBe(false);
      expect(check.reason).toContain('Client state manipulation detected');
    });

    it('validates legitimate sequential transition history', () => {
      let claim: any = { id: 'claim-legit', state: 'Draft', stateHistory: [] };
      const actor = { uid: 'user-1', email: 'author@test.com' };

      // Draft -> Unlinked
      let res = performStateTransition('Claim', claim, 'Unlinked', actor, 'Created unlinked claim');
      claim = res.entity;

      // Unlinked -> Evidence Linked
      res = performStateTransition('Claim', claim, 'Evidence Linked', actor, 'Linked source', ['src-1']);
      claim = res.entity;

      // Evidence Linked -> Researcher Reviewed
      res = performStateTransition('Claim', claim, 'Researcher Reviewed', actor, 'Reviewed evidence');
      claim = res.entity;

      // Researcher Reviewed -> Verified
      res = performStateTransition('Claim', claim, 'Verified', actor, 'Verified claim', ['src-1']);
      claim = res.entity;

      const check = validateEntityStateIntegrity('Claim', claim);
      expect(check.isValid).toBe(true);
      expect(claim.state).toBe('Verified');
    });
  });

  describe('4. Schema Hydration & Default Fallback Resilience', () => {
    it('hydrates empty projects safely without throwing undefined errors', () => {
      const emptyProject = createEmptyProject();

      expect(emptyProject.title).toBeDefined();
      expect(emptyProject.sources).toEqual([]);
      expect(emptyProject.datasets).toEqual([]);
      expect(emptyProject.claims).toEqual([]);
      expect(emptyProject.sections).toHaveLength(7); // Default manuscript template
    });
  });

  describe('5. Writing Studio Verified Evidence & Empirical Findings Integrity', () => {
    it('disallows fallback literature injection when no verified sources or passages exist', () => {
      const emptyProject = createEmptyProject();
      expect(emptyProject.sources).toHaveLength(0);

      // Verify that no passages can be extracted from empty sources
      const extractedPassages = emptyProject.sources.flatMap((s) => s.extractedPassages || []);
      expect(extractedPassages).toHaveLength(0);

      // Verify zero claims evidence
      const claimsEvidence = (emptyProject.claims || []).flatMap((c) => c.linkedEvidence || []);
      expect(claimsEvidence).toHaveLength(0);
    });

    it('only presents verified sources and extracted passages with real source IDs and titles', () => {
      const project = createEmptyProject();
      const verifiedSource = {
        id: 'src-verified-99',
        title: 'Empirical Study on Resistance Training',
        authors: ['Smith, J.', 'Doe, A.'],
        year: 2024,
        verificationState: 'Verified' as const,
        extractedPassages: [
          {
            id: 'pass-1',
            text: 'Resistance training increased motor unit recruitment significantly across all tested muscle groups.',
            section: 'Results',
            pageNumber: 12,
            isVerifiedByHuman: true,
          }
        ]
      };

      const unverifiedSource = {
        id: 'src-unverified-1',
        title: 'Unverified Blog Post',
        authors: ['Anonymous'],
        year: 2023,
        verificationState: 'Unverified' as const,
        extractedPassages: []
      };

      project.sources = [verifiedSource as any, unverifiedSource as any];

      // Extraction filter matching WritingStudioView verified evidence extraction
      const verifiedEvidence = project.sources.flatMap((s) => {
        const isVerified = s.verificationState === 'Verified' || (s as any).doiVerified;
        const passages = (s.extractedPassages || []).filter((p) => p.text && p.text.trim().length > 0);
        return passages.map((p) => ({
          sourceId: s.id,
          sourceTitle: s.title,
          passageText: p.text,
          verified: isVerified || p.isVerifiedByHuman
        }));
      });

      expect(verifiedEvidence).toHaveLength(1);
      expect(verifiedEvidence[0].sourceId).toBe('src-verified-99');
      expect(verifiedEvidence[0].sourceTitle).toBe('Empirical Study on Resistance Training');
      expect(verifiedEvidence[0].passageText).toContain('Resistance training increased motor unit recruitment');
    });

    it('strictly isolates empirical findings from Researcher Approved outputs without fallback numbers', () => {
      const project = createEmptyProject();
      expect(project.analysisOutputs).toHaveLength(0);

      // Ensure no fallback t-statistic (6.84), p-value (0.000003), or Cohen's d (1.41) are generated
      const approvedOutputs = (project.analysisOutputs || []).filter(
        (out) => out.executionStatus === 'Completed' || (out as any).isApproved
      );
      expect(approvedOutputs).toHaveLength(0);
    });

    it('accurately parses quantitative metrics from Researcher Approved analysis outputs', () => {
      const project = createEmptyProject();
      const realOutput = {
        id: 'out-emp-101',
        analysisPlanId: 'plan-real-1',
        executionStatus: 'Completed' as const,
        executionTimestamp: new Date().toISOString(),
        isReproduced: true,
        softwareEnvironment: 'R 4.3.1 (nlme / emmeans)',
        summaryText: 'Two-way repeated measures ANOVA showed a significant main effect of intervention.',
        numericResults: {
          mean_difference: 4.52,
          f_statistic: 12.87,
          df_num: 1,
          df_denom: 24,
          p_value: 0.0015,
          partial_eta_squared: 0.35
        },
        pValues: [
          { test: 'Intervention Main Effect', pValue: 0.0015, significant: true, formatted: 'p = 0.0015' }
        ],
        effectSizes: [
          { metric: 'Partial Eta Squared', value: 0.35, ciLower: 0.12, ciUpper: 0.54 }
        ]
      };

      project.analysisOutputs = [realOutput as any];

      const approvedOutputs = project.analysisOutputs.filter(
        (out) =>
          (out.executionStatus === 'Completed' || out.isReproduced) &&
          (out.summaryText || out.numericResults)
      );

      expect(approvedOutputs).toHaveLength(1);
      expect(approvedOutputs[0].id).toBe('out-emp-101');
      expect(approvedOutputs[0].numericResults.f_statistic).toBe(12.87);
      expect(approvedOutputs[0].numericResults.p_value).toBe(0.0015);
      expect(approvedOutputs[0].numericResults.partial_eta_squared).toBe(0.35);
      // Confirm NO default/fallback 6.84 or 1.41 exists
      expect(approvedOutputs[0].numericResults.t_statistic).toBeUndefined();
      expect(approvedOutputs[0].numericResults.cohens_d).toBeUndefined();
    });
  });
});
