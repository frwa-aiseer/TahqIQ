import { describe, it, expect } from 'vitest';
import {
  performStateTransition,
} from '../lib/stateMachines';
import { calculateProjectReadiness, calculateProjectPipelineStages } from '../lib/readinessCalculator';
import {
  SourceRecord,
  ClaimItem,
  DatasetRecord,
  AnalysisPlan,
  ProjectState,
} from '../types';
import { createEmptyProject } from '../data/demoProject';

describe('Phase 2 State Machine and Readiness Tests', () => {
  const actor = {
    uid: 'user-tester-123',
    email: 'tester@tehqiq.edu',
  };

  it('1. Source State Machine Transitions', () => {
    let source: SourceRecord = {
      id: 'src-1',
      title: 'Electromyographic study of warm-ups',
      authors: ['Smith, A.'],
      year: 2023,
      journalOrVenue: 'Journal of Applied Biomechanics',
      documentType: 'Journal Article',
      peerReviewStatus: 'Peer-reviewed',
      relevanceScore: 9,
      tags: ['emg'],
      verificationState: 'Unverified',
      state: 'Imported',
      stateHistory: [],
    };

    let result = performStateTransition('Source', source, 'Metadata Pending', actor, 'Imported source metadata pending');
    expect(result.success).toBe(true);
    source = result.entity as SourceRecord;
    expect(source.state).toBe('Metadata Pending');

    const src2: SourceRecord = { ...source, id: 'src-2', state: 'Imported' };
    const prohibitedRes = performStateTransition('Source', src2, 'Full Text Reviewed', actor, 'Bypassing verification');
    expect(prohibitedRes.success).toBe(false);
  });

  it('2. Claim State Machine Transitions', () => {
    const claim: ClaimItem = {
      id: 'claim-1',
      claimText: 'Warm-up increases peak torque',
      claimType: 'Associational claim',
      manuscriptSection: 'Results',
      importance: 'High',
      linkedSourceIds: [],
      evidenceRelationship: 'No support identified',
      isResearcherApproved: false,
      verificationStatus: 'Unverified',
      state: 'Draft',
      stateHistory: [],
    };

    const jumpRes = performStateTransition('Claim', claim, 'Verified', actor, 'Skip linking');
    expect(jumpRes.success).toBe(false);
  });

  it('3. Dataset State Machine Transitions', () => {
    let dataset: DatasetRecord = {
      id: 'ds-1',
      filename: 'sEMG_cohort_A.csv',
      fileHash: 'sha256-mock-hash',
      uploadDate: new Date().toISOString(),
      recordCount: 18,
      variableCount: 12,
      variables: [],
      missingnessPercent: 0,
      isAnonymizedConfirmed: true,
      state: 'Uploaded',
      stateHistory: [],
    };

    const dsRes = performStateTransition('Dataset', dataset, 'Parsing', actor, 'Start parsing');
    expect(dsRes.success).toBe(true);
  });

  it('4. Analysis Plan State Machine Transitions', () => {
    let analysis: AnalysisPlan = {
      id: 'an-1',
      title: 'Grizzle 2x2 Crossover Model',
      researchQuestionId: 'rq-1',
      outcomeVariable: 'peakTorque',
      predictorVariables: ['warmupType'],
      statisticalMethod: 'ANOVA',
      assumptions: ['Normality'],
      effectSizeMeasure: 'Cohen d',
      significanceThreshold: 0.05,
      missingDataStrategy: 'Complete case',
      status: 'Draft',
      isPreregistered: false,
      state: 'Draft Plan',
      stateHistory: [],
    };

    const anRes = performStateTransition('Analysis', analysis, 'Awaiting Approval', actor, 'Submit plan');
    expect(anRes.success).toBe(true);
  });

  it('5. Readiness Calculator Evaluation', () => {
    const emptyProject: ProjectState = createEmptyProject({ title: 'Empty Test' });
    const readiness = calculateProjectReadiness(emptyProject);
    expect(readiness.overall).toBe(0);

    const stages = calculateProjectPipelineStages(emptyProject);
    expect(stages.length).toBe(20);
  });
});
