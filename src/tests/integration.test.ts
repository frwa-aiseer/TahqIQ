import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEmptyProject, createDemoProject } from '../data/demoProject';
import { executePairedCrossoverAnalysis, generateAnalysisFiguresAndTables } from '../lib/statsEngine';
import { verifyManuscriptCitations } from '../lib/citationVerifier';
import { calculateProjectReadiness, calculateProjectPipelineStages } from '../lib/readinessCalculator';
import { generateGenuineDocxBlob, createExportJobRecord, validateJatsXml, generateJatsXml } from '../lib/exportUtils';
import { performStateTransition } from '../lib/stateMachines';
import { saveProjectToLocalStorage, loadProjectFromLocalStorage } from '../lib/storageService';
import { parseCsvTextToDataset } from '../lib/datasetIngestion';
import { ProjectState, ManuscriptSection } from '../types';

describe('Integration Tests: Multi-Module Interactions and Pipeline Workflows', () => {
  let project: ProjectState;

  beforeEach(() => {
    project = createEmptyProject({
      id: 'proj-int-1',
      title: 'Biomechanics of Crossover Training',
      projectType: 'Original quantitative research',
      ownerUid: 'user-123',
      members: { 'user-123': 'Owner' }
    });
  });

  describe('1. Storage Service & Autosave Integration', () => {
    it('serializes and deserializes project state to/from localStorage accurately', () => {
      project.title = 'Updated Biomechanics Title';
      project.authors = [
        {
          id: 'auth-1',
          fullName: 'Dr. Jane Smith',
          publicationName: 'Smith J',
          email: 'jane@university.edu',
          department: 'Kinesiology',
          institution: 'State University',
          city: 'Chicago',
          country: 'USA',
          orcid: '0000-0002-1825-0097',
          isCorresponding: true,
          order: 1,
          creditRoles: ['Conceptualization'],
          conflictDeclaration: 'None declared',
          finalApproval: true
        }

      ];

      saveProjectToLocalStorage(project);
      const loaded = loadProjectFromLocalStorage(project.id);

      expect(loaded).not.toBeNull();
      expect(loaded?.title).toBe('Updated Biomechanics Title');
      expect(loaded?.authors).toHaveLength(1);
      expect(loaded?.authors[0].fullName).toBe('Dr. Jane Smith');
    });
  });

  describe('2. Dataset Ingestion -> Anonymization -> State Transition -> Stats Engine Integration', () => {
    it('ingests CSV, approves dataset, and runs stats analysis to produce figures and tables', async () => {
      const csvContent = `id,subject,pre_emg,post_emg\n1,S1,120.5,145.2\n2,S2,110.2,138.4\n3,S3,135.0,162.1\n4,S4,105.8,129.0\n5,S5,140.1,168.5`;
      const dataset = parseCsvTextToDataset('emg_study.csv', csvContent);

      expect(dataset.variables).toHaveLength(4);
      expect(dataset.rawPreview).toHaveLength(5);
      expect(dataset.state).toBe('Uploaded');

      // Attempt analysis without approval -> expect execution block
      const dummyPlan = {
        id: 'plan-0',
        title: 'Unapproved Plan',
        researchQuestionId: 'rq-1',
        outcomeVariable: 'pre_emg,post_emg',
        predictorVariables: [],
        statisticalMethod: 'Paired t-test',
        assumptions: [],
        effectSizeMeasure: 'Cohen d',
        significanceThreshold: 0.05,
        missingDataStrategy: 'Complete Cases',
        status: 'Draft' as const,
        state: 'Draft Plan' as const,
        isPreregistered: false
      };
      const unapprovedRun = executePairedCrossoverAnalysis({ dataset, plan: dummyPlan, outcomeVariable: 'pre_emg,post_emg' });
      expect(unapprovedRun.executionStatus).toBe('Failed');
      expect(unapprovedRun.summaryText).toContain('Execution Blocked');


      // Step 2: Confirm anonymization and transition to 'Approved for Analysis'
      dataset.isAnonymizedConfirmed = true;
      const actor = { uid: 'user-123', email: 'owner@test.com' };

      // Transition Uploaded -> Parsing -> Profiled -> Requires Review -> Approved for Analysis
      let currentDataset = dataset;
      currentDataset = performStateTransition('Dataset', currentDataset, 'Parsing', actor, 'Parsing dataset').entity;
      currentDataset = performStateTransition('Dataset', currentDataset, 'Profiled', actor, 'Profiled dataset').entity;
      currentDataset = performStateTransition('Dataset', currentDataset, 'Requires Review', actor, 'Reviewing dataset').entity;
      const transitionRes = performStateTransition('Dataset', currentDataset, 'Approved for Analysis', actor, 'Approved dataset');


      expect(transitionRes.success).toBe(true);
      expect(transitionRes.entity.state).toBe('Approved for Analysis');

      // Step 3: Set analysis plan approval
      const plan = {
        id: 'plan-1',
        title: 'Paired t-test for EMG',
        researchQuestionId: 'rq-1',
        outcomeVariable: 'pre_emg,post_emg',
        predictorVariables: ['condition'],
        statisticalMethod: 'Paired Student t-test',
        assumptions: ['Normality'],
        effectSizeMeasure: 'Cohen d',
        significanceThreshold: 0.05,
        missingDataStrategy: 'Complete Cases',
        status: 'Approved' as const,
        state: 'Approved' as const,
        isPreregistered: true
      };

      // Step 4: Execute statistical analysis engine
      const output = executePairedCrossoverAnalysis({
        dataset: transitionRes.entity,
        plan,
        outcomeVariable: 'pre_emg,post_emg'
      });

      expect(output.executionStatus).toBe('Completed');
      expect(output.numericResults.completePairs).toBe(5);
      expect(output.numericResults.p_val).toBeLessThan(0.05);
      expect(output.effectSizes[0].value).toBeGreaterThan(1.0); // Large effect

      // Step 5: Generate Figures and Tables
      const { figures, tables } = generateAnalysisFiguresAndTables(output, transitionRes.entity, plan);
      expect(figures).toHaveLength(2);
      expect(tables).toHaveLength(1);
      expect(tables[0].headers).toContain('Condition / Test');
    });
  });

  describe('3. Citation Verifier + Manuscript Section + CSL Integration', () => {
    it('verifies in-text citations against source library and updates verification report', () => {
      project.sources = [
        {
          id: 'src-1',
          title: 'Hamstring EMG in Crossover Training',
          authors: ['Boyer, K. A.', 'Mendiguchia, J.'],
          year: 2021,
          journalOrVenue: 'J Biomech',
          volume: '45',
          issue: '2',
          pages: '100-110',
          doi: '10.1016/j.jbiomech.2021.01.001',
          documentType: 'Journal Article',
          peerReviewStatus: 'Peer-reviewed',
          verificationState: 'Verified',
          relevanceScore: 9,
          tags: ['biomechanics'],
          isDemo: false
        }
      ];


      project.sections = [
        {
          id: 'sec-intro',
          title: '1. Introduction',
          content: 'As demonstrated by Boyer et al. (2021), hamstring activation increases significantly during crossover loading [src-1].',
          order: 1,
          currentWordCount: 15,
          citationIds: ['src-1'],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        },
        {
          id: 'sec-methods',
          title: '2. Methods',
          content: 'Data was collected according to protocol described by Smith (2025).', // Missing citation!
          order: 2,
          currentWordCount: 10,
          citationIds: [],
          status: 'Drafting',
          version: 1,
          lastEditedBy: 'Author',
          lastEditedTimestamp: new Date().toISOString()
        }
      ];

      const report = verifyManuscriptCitations(project.sections, project.sources, 'apa-7th');

      expect(report.totalCitationsFound).toBeGreaterThanOrEqual(2);
      expect(report.matchedCount).toBeGreaterThanOrEqual(1);
      expect(report.missingCount).toBeGreaterThanOrEqual(1);
      expect(report.missingCitations.some((m) => m.authorOrRef.includes('Smith'))).toBe(true);
    });
  });

  describe('4. Readiness Calculator + Export Utils Integration', () => {
    it('calculates project readiness, checks export gate checks, and generates JATS XML and Export Job', async () => {
      const demo = createDemoProject();
      const readiness = calculateProjectReadiness(demo);

      expect(readiness.overall).toBeGreaterThan(0);

      // Generate JATS XML
      const xml = generateJatsXml(demo);
      const jatsValidation = validateJatsXml(xml);
      expect(jatsValidation.isValid).toBe(true);

      // Create Export Job Record
      const gateChecks: any[] = [
        { checkId: 'gc-1', category: 'Ethics Mandate', name: 'Ethics Approval', status: 'Pass', message: 'Ethics ID verified', resolutionPath: '/ethics' },
        { checkId: 'gc-2', category: 'Citation Integrity', name: 'Peer Review', status: 'Pass', message: 'Reviewed', resolutionPath: '/review' }
      ];


      const job = createExportJobRecord(
        demo,
        'DOCX',
        'Submission-Ready',
        gateChecks,
        {
          titlePage: true,
          abstract: true,
          sections: true,
          figuresAndTables: true,
          bibliography: true,
          ethicsAndAiDisclosure: true,
          supplementarySelections: true
        },
        'author@test.com'
      );


      expect(job.status).toBe('Success');
      expect(job.isBlocked).toBe(false);
      expect(job.userEmail).toBe('author@test.com');
    });
  });
});
