import { describe, it, expect } from 'vitest';
import { executePairedCrossoverAnalysis, profileDataset, studentTTwoTailedPValue, normalCdf } from '../lib/statsEngine';
import { parseCsvTextToDataset } from '../lib/datasetIngestion';

describe('Statistical Input-Sensitivity & Edge Case Tests', () => {
  const approvedPlan = {
    id: 'plan-sens-1',
    title: 'Sensitivity Analysis Plan',
    researchQuestionId: 'rq-1',
    outcomeVariable: 'pre,post',
    predictorVariables: ['cond'],
    statisticalMethod: 'Paired Student t-test',
    assumptions: ['Normality'],
    effectSizeMeasure: 'Cohen d',
    significanceThreshold: 0.05,
    missingDataStrategy: 'Complete Cases',
    status: 'Approved' as const,
    state: 'Approved' as const,
    isPreregistered: true
  };

  describe('1. Boundary Conditions & Sample Size Constraints', () => {
    it('returns graceful failure when raw dataset is empty (N = 0)', () => {
      const emptyDs = parseCsvTextToDataset('empty.csv', 'id,pre,post\n');
      emptyDs.isAnonymizedConfirmed = true;
      emptyDs.state = 'Approved for Analysis';

      const result = executePairedCrossoverAnalysis({ dataset: emptyDs, plan: approvedPlan, outcomeVariable: 'pre,post' });
      expect(result.executionStatus).toBe('Failed');
      expect(result.summaryText).toContain('Dataset contains no raw data records');
    });

    it('returns graceful failure when complete pairs N < 2 (N = 1)', () => {
      const singleRowCsv = `id,pre,post\n1,10.5,15.2`;
      const singleDs = parseCsvTextToDataset('single.csv', singleRowCsv);
      singleDs.isAnonymizedConfirmed = true;
      singleDs.state = 'Approved for Analysis';

      const result = executePairedCrossoverAnalysis({ dataset: singleDs, plan: approvedPlan, outcomeVariable: 'pre,post' });
      expect(result.executionStatus).toBe('Failed');
      expect(result.summaryText).toContain('Insufficient valid paired records');
    });

    it('handles zero variance (identical values across all participants)', () => {
      const zeroVarCsv = `id,pre,post\n1,10,10\n2,10,10\n3,10,10\n4,10,10`;
      const zeroDs = parseCsvTextToDataset('zerovar.csv', zeroVarCsv);
      zeroDs.isAnonymizedConfirmed = true;
      zeroDs.state = 'Approved for Analysis';

      const result = executePairedCrossoverAnalysis({ dataset: zeroDs, plan: approvedPlan, outcomeVariable: 'pre,post' });
      expect(result.executionStatus).toBe('Completed');
      expect(result.numericResults.mean_diff).toBe(0);
      expect(result.numericResults.t_stat).toBe(0);
      expect(result.numericResults.cohens_d).toBe(0);
      expect(result.numericResults.p_val).toBe(1.0);
    });
  });

  describe('2. Missing Data, Non-Numeric Strings & NaNs Filtering', () => {
    it('filters missing values, empty strings, and NaNs, reporting missing count accurately', () => {
      const dirtyCsv = `id,pre,post\n1,10.0,20.0\n2,12.0,N/A\n3,15.0,25.0\n4,,30.0\n5,invalid,40.0\n6,18.0,28.0`;
      const dirtyDs = parseCsvTextToDataset('dirty.csv', dirtyCsv);
      dirtyDs.isAnonymizedConfirmed = true;
      dirtyDs.state = 'Approved for Analysis';

      const result = executePairedCrossoverAnalysis({ dataset: dirtyDs, plan: approvedPlan, outcomeVariable: 'pre,post' });
      expect(result.executionStatus).toBe('Completed');
      expect(result.numericResults.completePairs).toBe(3); // Rows 1, 3, 6
      expect(result.missingDataReport.missingRows).toBe(3); // Rows 2, 4, 5 dropped
    });
  });

  describe('3. Extreme Outlier Detection & Skewness/Kurtosis Calculation', () => {
    it('detects extreme outliers in paired differences and calculates skewness/kurtosis', () => {
      const outlierCsv = `id,pre,post\n1,10,12\n2,11,13\n3,10,12\n4,10,12\n5,10,12\n6,10,100`; // Row 6 diff = 90 (Extreme outlier)
      const ds = parseCsvTextToDataset('outlier.csv', outlierCsv);
      ds.isAnonymizedConfirmed = true;
      ds.state = 'Approved for Analysis';

      const result = executePairedCrossoverAnalysis({ dataset: ds, plan: approvedPlan, outcomeVariable: 'pre,post' });
      expect(result.executionStatus).toBe('Completed');
      expect(result.numericResults.skewness).toBeGreaterThan(1.0); // Skewed
      expect(result.assumptionChecks.some((a) => a.assumption.includes('Outlier') && !a.met)).toBe(true);
      expect(result.sensitivityAnalysis.some((s) => s.model.includes('Outliers Excluded'))).toBe(true);
    });
  });

  describe('4. Mathematical Helper Functions Precision', () => {
    it('verifies normalCdf and studentTTwoTailedPValue precision', () => {
      expect(normalCdf(0)).toBeCloseTo(0.5, 4);
      expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);

      expect(studentTTwoTailedPValue(0, 10)).toBe(1.0);
      expect(studentTTwoTailedPValue(2.228, 10)).toBeCloseTo(0.05, 2);
    });
  });
});
