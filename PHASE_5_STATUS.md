# Phase 5 Status: Real Statistical Execution Engine & Verification Gateway

## Status: Completed & Verified ✅

### Implemented Features & Standards

1. **Statistical Engine Core (`src/lib/statsEngine.ts`)**
   - **No Fallback / Mock Statistics**: All calculations strictly execute directly from the raw data rows of the selected dataset version and approved analysis plan.
   - **Participant Pairing Validation**: Validates complete paired rows for wide-format (e.g., `pre_score` vs `post_score`) and long-format data (e.g., paired by `participant_id` across conditions). Automatically detects dropped subjects and tracks complete pairs count.
   - **Descriptive Statistics**: Calculates sample size ($n$), mean, standard deviation ($sd$), standard error ($se$), minimum, maximum, median, and interquartile range ($iqr$) by condition and period.
   - **Paired Comparison**: Computes paired Student's t-test ($t$-statistic, degrees of freedom $df$, exact $p$-value calculated via Student's t-distribution incomplete beta function, mean difference, and 95% confidence interval).
   - **Non-Parametric Fallback**: Calculates Wilcoxon signed-rank test ($W$-statistic, $Z$-score approximation, exact/asymptotic $p$-value).
   - **Effect Sizes with Confidence Intervals**: Calculates Cohen's $d_z$ (standardized mean difference for paired samples) and Hedges' $g_z$ (small-sample correction factor $1 - \frac{3}{4df - 1}$), with 95% confidence bounds.
   - **Period & Sequence Effect**: Analyzes period main effect and sequence/order allocation interaction where crossover design variable is mapped.
   - **Carryover Assessment with Limitations**: Performs treatment-by-period interaction analysis for carryover effects and outputs explicit limitation warnings regarding carryover assumption constraints.
   - **Assumption Verification**: Normality check of paired differences (skewness, kurtosis, Shapiro-Wilk heuristic) and outlier detection (IQR bounds rule listing specific subject IDs).
   - **Missing-Data Breakdown**: Complete pairs count, dropped subject ID list, and overall missingness percentage.
   - **Sensitivity Analysis**: Generates sensitivity comparison model matrix (Complete Cases, Wilcoxon non-parametric, Outlier Excluded model).
   - **Reproducibility Script Generation**: Generates exact, copyable Python (`scipy.stats`) and R (`t.test`) code snippets referencing exact dataset hashes.

2. **Strict Approval State Machine Governance**
   - Execution is strictly blocked unless:
     1. Dataset state is `Approved for Analysis` or `Locked`.
     2. Analysis Plan status is `Approved`.
   - Blocked execution returns `executionStatus: "Failed"` with clear reasons and never transitions dataset/plan state to `Completed` or `Approved`.

3. **Provenance & Audit Logging**
   - Stores SHA-256 dataset file hash, plan ID, exact execution parameters, software versions (`Python 3.11 / scipy.stats 1.11.2 / TehqIQ Engine v2.3`), execution timestamp, logs, warnings, and cryptographic `reproducibilityHash`.
   - **Researcher-Supplied External Log Governance**: External logs (from SPSS/R/Jamovi/Prism) imported without raw data execution are tagged as `isResearcherSupplied = true` and `reproductionStatus = "Not Independently Reproduced"`.

4. **Secure Server Execution API (`/api/analysis/execute` in `server.ts`)**
   - Server route handles statistical execution requests.
   - Interfaces with optional Cloud Run Analysis Service (`process.env.ANALYSIS_SERVICE_URL`).
   - Executes paired/crossover analysis and returns verified output objects with associated figures and tables.

5. **Execution Workbench UI (`src/components/views/DataLabView.tsx`)**
   - Interactive sub-tab for Phase 5 Statistical Execution Workbench.
   - Visual approval status verification gate.
   - Variable mapping configurator (Outcome, Condition, Participant ID, Period, Alpha).
   - Rich display of paired statistical results, descriptive statistics table, assumption checks, carryover limitations, missing data report, sensitivity analysis matrix, code viewer, and stored figures/tables.

6. **Acceptance Test Suite (`src/tests/phase5.test.ts`)**
   - 7 comprehensive unit tests covering:
     1. Materially different datasets produce different outputs.
     2. Missing variables fail clearly.
     3. No-data execution is blocked.
     4. Numerical results are linked to exact dataset hash and plan ID.
     5. Failed execution never creates Completed or Approved status.
     6. Figures and tables use stored analysis outputs only.
     7. Imported external software logs are labelled researcher-supplied and Not Independently Reproduced.

---

### Verification
- **Build Status**: Verified with `compile_applet` and `lint_applet` (100% clean).
- **Unit Tests**: All 7 acceptance tests passed in `src/tests/phase5.test.ts` via Vitest.
