# TehqIQ Implementation Tracker

This tracker records remediation work verified against the live repository. Status files and earlier audit documents are not treated as implementation evidence.

## Status vocabulary

- `PASS`: the prompt acceptance criteria were met and required checks were run.
- `FAIL`: the prompt was executed but one or more acceptance criteria were not met.
- `BLOCKED`: the prompt could not be completed because a prerequisite or external dependency was unavailable.
- `NOT STARTED`: the prompt has not been executed.

## Prompt execution log

| Prompt ID | Status | Checkpoint | Files changed | Migrations | Tests and verification | Blockers / notes |
| --- | --- | --- | --- | --- | --- | --- |
| TQ-VSC-000 | PASS | Baseline source checkpoint: `6dc9a38`; documentation changes are the working-tree delta for this prompt | `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | None. Documentation-only change; no runtime schema or stored-project change. | `npm run lint`: PASS (`tsc --noEmit`). `npm test`: FAIL at baseline—16/20 files passed, 130/131 executed tests passed; one Crossref network-sensitive assertion failed and three suites failed during import because Vite could not resolve Firebase subpaths. `npm run build`: PASS; Vite transformed 1,986 modules and esbuild produced `dist/server.cjs`. | Baseline test suite is not green. Build warns that Node `crypto` is externalized for the browser and that the main JS chunk is larger than 500 kB. See the current implementation register for source-derived risks. No product behavior was changed. |
| TQ-VSC-001 | PASS | Built on TQ-VSC-000 baseline; working-tree checkpoint pending commit | `src/tests/helpers/scientificIntegrityInvariants.ts`; `src/tests/scientificIntegrityInvariants.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md` | None. Test-only utility and fixture additions; no production schema, API, or persisted-data change. | `npm run lint`: PASS. `npx vitest run src/tests/scientificIntegrityInvariants.test.ts`: PASS, 13/13. `npm test`: baseline remains FAIL—17/21 files passed, 143/144 executed tests passed; the same Crossref assertion and three Firebase import failures remain. `npm run build`: PASS. | Harness exposes malformed/placeholder DOI, ungrounded source/outlet verification, ungrounded empirical numbers, automatic approval, demo contamination of real submission readiness, and AI self-approval. It deliberately does not claim that local DOI syntax proves registry existence. No later prompt was executed. |
| TQ-VSC-002 | PASS | Built on TQ-VSC-001 working tree; checkpoint pending commit | `src/lib/q1ManuscriptEngine.ts`; `src/lib/manuscriptTone.ts`; `src/components/views/WritingStudioView.tsx`; `src/tests/manuscriptEngineDomainIsolation.test.ts`; `src/tests/phase0.test.ts`; `src/tests/phase6.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | None. Existing stored projects and sections remain readable; no schema or persisted-data transformation. Calls that attempt legacy generation for non-demo projects now fail closed with `DemoManuscriptEngineAccessError`. | `npm run lint`: PASS. Focused Vitest command: PASS, 22/22. `npm test`: baseline remains FAIL—17/21 files passed, 148/149 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. | No production component imports the legacy engine. Retained demo generation requires `isDemoProject === true` and outputs `isDemo/isSynthetic` sections. AI/server error paths were audited and no q1 fallback call exists. TQ-VSC-003 and later were not executed. |
| TQ-VSC-003 | PASS | Built on TQ-VSC-002 working tree; checkpoint pending commit | `src/types.ts`; `src/lib/methodologyWorkspace.ts`; `src/components/views/ProtocolBuilderView.tsx`; `src/App.tsx`; `server.ts`; `src/tests/methodologyWorkspace.test.tsx`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Backward-compatible optional `methodologyWorkspace`; old projects hydrate to blank Draft fields at read/render time. No persisted data rewrite. | `npm run lint`: PASS. Focused methodology Vitest: PASS, 8/8. `npm test`: baseline remains FAIL—18/22 files passed, 156/157 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. | Removed all fixed crossover/washout/power/sample defaults from Protocol Builder. Supports researcher entry, label-only text protocol extraction as Needs Review, and structured AI Suggested proposals with attributable human approval. TQ-VSC-004 and later were not executed. |
| TQ-VSC-004 | PASS | Built on TQ-VSC-003 working tree; checkpoint pending commit | `src/lib/writingEvidence.ts`; `src/components/views/WritingStudioView.tsx`; `src/tests/writingEvidenceIntegrity.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | None. Uses existing source, evidence, claim, and analysis fields; no stored-data migration. Older records lacking provenance or exact manuscript approval remain visible elsewhere but are intentionally not insertable. | `npm run lint`: PASS. Focused Vitest: PASS, 25/25. `npm test`: baseline remains FAIL—19/23 files passed, 164/165 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. | Literature requires researcher-reviewed passage/claim evidence plus verified source provenance. Statistics require exact `Approved for Manuscript`. Both are revalidated at insertion time; empty/invalid state cannot generate fallback science. TQ-VSC-005 and later were not executed. |
| TQ-VSC-005 | PASS | Built on TQ-VSC-004 working tree; checkpoint pending commit | `src/lib/aiValidationService.ts`; `src/lib/numericEvidence.ts`; `src/components/views/DataLabView.tsx`; `src/tests/numericGrounding.test.ts`; `src/tests/numericEvidence.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No destructive migration. `numericEvidenceRecords` remains optional for old projects; old/dangling records fail closed until traceable evidence is generated. New completed Data Lab runs persist deterministic evidence records alongside output state. | `npm run lint`: PASS. Focused Vitest: PASS, 28/28. `npm test`: baseline remains FAIL—20/24 files passed, 168/169 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. `git diff --check`: PASS. | The existing `src/types.ts` contract already contained every required `NumericEvidence` field and was reused unchanged by this prompt. Removed numeric value/range allowances. Empirical values require traceable Verified evidence. TQ-VSC-006 and later were not executed. |

## TQ-VSC-000 verification details

### Repository and checkpoint

- Branch at inspection: `main`, tracking `origin/main`.
- HEAD at the protected baseline inspection: `6dc9a38` (`docs: add local setup and remediation materials`).
- Working tree was clean before TQ-VSC-000.
- Package manager evidence: both `package-lock.json` and `bun.lock` exist; required checks were executed using the scripts declared in `package.json` via npm.
- Application remains explicitly marked `Prototype environment — not approved for real research use.` in `src/App.tsx`.

### Exact verification results

1. `npm run lint`
   - Exit code: `0`.
   - Runs: `tsc --noEmit`.
   - Result: PASS with no TypeScript diagnostics.
2. `npm test`
   - Exit code: `1`.
   - Runs: `vitest run`.
   - Result: 16 test files passed and 4 failed; 130 tests passed and 1 failed out of 131 tests that executed.
   - `src/tests/phase3.test.ts`: the invalid-DOI test expected `not found in Crossref registry`, but the provider returned `Network failure connecting to Crossref API: fetch failed` in the restricted/offline test environment.
   - `src/tests/accessibility.test.tsx` and `src/tests/e2eWorkflows.test.tsx`: suite import failed because Vite could not resolve `firebase/firestore` from `src/context/AuthContext.tsx`.
   - `src/tests/integration.test.ts`: suite import failed because Vite could not resolve `firebase/storage` from `src/lib/storageService.ts`.
   - Node also warned that `--localstorage-file` was provided without a valid path.
3. `npm run build`
   - Exit code: `0`.
   - Runs: `vite build`, then bundles `server.ts` with esbuild.
   - Result: PASS. Vite transformed 1,986 modules; `dist/server.cjs` and its source map were produced.
   - Warnings: `crypto` from `src/lib/datasetIngestion.ts` was externalized for browser compatibility; the primary minified JS chunk was approximately 2,473 kB (approximately 694 kB gzip), exceeding Vite's 500 kB warning threshold.

### Tests added or updated

None. TQ-VSC-000 establishes and records the baseline; it does not implement product behavior.

### Next prompt boundary

At completion of this baseline entry, TQ-VSC-001 and all later prompts were `NOT STARTED`. See subsequent tracker rows for later execution status.

## TQ-VSC-001 verification details

### Implementation

- Added reusable, deterministic violation finders with stable codes and source paths for all six required invariant areas.
- Added `expectNoScientificIntegrityViolations`, which throws an aggregate, readable failure instead of silently discarding violations.
- DOI checks reject malformed and explicit placeholder values and require retrieval provenance before a source may be treated as Verified. The helper documents that external registry lookup is still required to establish real DOI existence.
- Empirical-number checks require a matching value and source/dataset/analysis identifier in a `Verified` `NumericEvidence` record.
- Approval checks require attributable human actor metadata; AI-generated records cannot count as approved without a human UID.
- Submission-readiness checks scan all currently tagged `ProjectState` artifact collections and reject demo/synthetic artifacts in a real project's `Submission-Ready` mode. Explicit demo projects and `Draft Review` remain permitted and visibly separated.

### Exact verification results

1. `npm run lint`
   - Exit code: `0`.
   - Result: PASS; `tsc --noEmit` produced no diagnostics.
2. `npx vitest run src/tests/scientificIntegrityInvariants.test.ts`
   - Exit code: `0`.
   - Result: PASS; 1/1 test file and 13/13 tests passed.
3. `npm test`
   - Exit code: `1`.
   - Result: 17/21 test files passed; 143 tests passed and 1 failed out of 144 tests that executed.
   - New TQ-VSC-001 suite: 13/13 passed.
   - Pre-existing failures are unchanged: the invalid-DOI test receives a Crossref network failure instead of its expected registry-not-found message; accessibility and E2E suites cannot resolve `firebase/firestore`; integration cannot resolve `firebase/storage`.
4. `npm run build`
   - Exit code: `0`.
   - Result: PASS; Vite transformed 1,986 modules and esbuild produced the server bundle.
   - Pre-existing warnings remain: browser externalization of Node `crypto` and a primary minified JS chunk of approximately 2,473 kB.

### Tests added or updated

- Added `src/tests/scientificIntegrityInvariants.test.ts` with 13 tests covering violation and clean-control cases for every required invariant plus aggregate error visibility.
- Added reusable helpers at `src/tests/helpers/scientificIntegrityInvariants.ts`.

### Data migration and compatibility

None. The harness is test-only and imports existing types without changing them.

### Remaining blockers and prompt boundary

- The repository-wide suite remains red only on the failure groups already recorded by TQ-VSC-000.
- The harness exposes invariant violations when called; production-wide enforcement belongs to the specifically scoped later remediation prompts.
- At completion of TQ-VSC-001, TQ-VSC-002 and all later prompts remained `NOT STARTED`. See subsequent tracker rows for later execution status.

## TQ-VSC-002 verification details

### Implementation

- Added `DemoManuscriptEngineAccessError` and a fail-closed guard at the start of both `expandSectionToQ1Length` and `expandFullPaperToQ1Length`. A project must have `isDemoProject === true` before the engine reads project content or constructs output.
- Retained demo section output is always tagged `isDemo: true` and `isSynthetic: true`.
- Extracted deterministic tone-only text transformations into `src/lib/manuscriptTone.ts`. Writing Studio now imports this neutral formatter and has no production import of `q1ManuscriptEngine`.
- Removed a dead Writing Studio options builder whose only remaining type dependency came from the legacy engine.
- Audited all repository call sites. Remaining generation calls are regression tests and the engine's internal demo full-paper loop; patch scripts reference the filename but are not runtime call sites.
- Audited Writing Studio/server failure handling. AI request failures produce explicit failed/error state; no legacy engine or hard-coded science fallback is invoked.

### Exact verification results

1. `npm run lint`
   - Exit code: `0`.
   - Result: PASS; `tsc --noEmit` produced no diagnostics.
2. `npx vitest run src/tests/manuscriptEngineDomainIsolation.test.ts src/tests/phase0.test.ts src/tests/phase6.test.ts`
   - Exit code: `0`.
   - Result: PASS; 3/3 files and 22/22 tests passed.
3. `npm test`
   - Exit code: `1`.
   - Result: 17/21 test files passed; 148 tests passed and 1 failed out of 149 tests that executed.
   - TQ-VSC-002 isolation tests pass. The only failures are the pre-existing invalid-DOI network assertion and Firebase Firestore/Storage import-resolution failures in three suites.
4. `npm run build`
   - Exit code: `0`.
   - Result: PASS; Vite transformed 1,986 modules and esbuild generated `dist/server.cjs`.
   - Pre-existing browser-`crypto` externalization and large main-chunk warnings remain.
5. `git diff --check`
   - Exit code: `0`.
   - Result: PASS.

### Tests added or updated

- Reworked `src/tests/manuscriptEngineDomainIsolation.test.ts` to test six section categories, full-paper immutability for arbitrary real projects, explicit demo-only access, demo/synthetic output tagging, and the separated tone formatter.
- Updated Phase 0 and Phase 6 regression expectations: real-project legacy generation must throw and leave input content/state unchanged, rather than returning substitute prose.

### Data migration and compatibility

- No data migration is required.
- Existing project and manuscript records are unchanged.
- Backward-compatible named export of `applyToneAndComplexity` remains in the legacy module for non-runtime consumers, while production imports use `manuscriptTone.ts` directly.
- Any external caller that invokes legacy expansion with a real project now receives an explicit error instead of generated fallback content. This intentional behavior change is the scientific-integrity boundary required by TQ-VSC-002.

### Remaining blockers and prompt boundary

- The repository-wide test command remains red only on baseline failures documented under TQ-VSC-000.
- The legacy demo engine still contains synthetic fixture prose; it is retained solely behind the explicit demo guard and tagged outputs.
- At completion of TQ-VSC-002, TQ-VSC-003 and all later prompts remained `NOT STARTED`. See subsequent tracker rows for later execution status.

## TQ-VSC-003 verification details

### Implementation

- Replaced the fixed Protocol Builder display with an editable, domain-neutral methodology workspace.
- Added adaptable fields for design; population/data source; sampling; eligibility; intervention/exposure/comparator when applicable; variables/outcomes; instruments/materials; data collection; analysis plan; ethics; and limitations.
- Blank fields remain empty in state and display `Researcher Input Required`; project discipline or project type does not inject methodology facts.
- Added three explicit source paths:
  - `Researcher Entered`: editable Draft fields.
  - `Protocol Upload`: deterministic extraction from explicitly labelled TXT/Markdown/CSV lines only; output is `Needs Review`. Unsupported binary formats show `Not Configured` and do not infer content.
  - `AI Proposal`: structured server response stored as `AI Suggested`; errors display failure and do not generate fallback methodology.
- Added a signed-in researcher approval action. AI-proposed or uploaded content cannot become `Researcher Approved` without an attributable user UID.
- Added `/api/gemini/methodology-proposal` with a deterministic response schema and required fields. The prompt prohibits invented participants, sample sizes, power assumptions, instruments, timings, ethics approvals, statistical values, interventions, exposures, comparators, or data sources; unsupported fields are normalized to `Researcher input required`.

### Exact verification results

1. `npm run lint`
   - Exit code: `0`.
   - Result: PASS; `tsc --noEmit` produced no diagnostics.
2. `npx vitest run src/tests/methodologyWorkspace.test.tsx`
   - Exit code: `0`.
   - Result: PASS; 1/1 file and 8/8 tests passed.
3. `npm test`
   - Exit code: `1`.
   - Result: 18/22 test files passed; 156 tests passed and 1 failed out of 157 tests that executed.
   - TQ-VSC-003 tests pass. The only failures are the pre-existing invalid-DOI network assertion and Firebase Firestore/Storage resolution failures in three suites.
4. `npm run build`
   - Exit code: `0`.
   - Result: PASS; Vite transformed 1,987 modules and esbuild produced the server bundle.
   - Pre-existing browser-`crypto` externalization and large main-chunk warnings remain.
5. `git diff --check`
   - Exit code: `0`.
   - Result: PASS.

### Tests added or updated

- Added `src/tests/methodologyWorkspace.test.tsx`.
- Verifies blank economics, engineering, qualitative, and clinical projects render 11 unresolved adaptable fields without sports, crossover, washout, power, sample-size, treadmill, hamstring, or EMG assumptions.
- Verifies label-only extraction ignores unlabelled participant claims and leaves unknown fields blank.
- Verifies upload state is `Needs Review`, AI state remains `AI Suggested` through edits, and approval requires a signed-in researcher UID.

### Data migration and compatibility

- Added optional `ProjectState.methodologyWorkspace`, so existing stored projects remain schema-compatible.
- `getMethodologyWorkspace` hydrates absent or partially stored workspace data with blank fields without mutating persisted records.
- Existing demo and real projects remain readable. The workspace is persisted through the existing project update/autosave flow after the researcher interacts with it.

### Remaining blockers and prompt boundary

- PDF/DOCX protocol extraction is explicitly `Not Configured`; richer ingestion belongs to later, separately scoped ingestion prompts.
- AI proposals require a configured `GEMINI_API_KEY`; failure remains visible and produces no substitute content.
- The repository-wide suite remains red only on baseline failures documented under TQ-VSC-000.
- At completion of TQ-VSC-003, TQ-VSC-004 and all later prompts remained `NOT STARTED`. See subsequent tracker rows for later execution status.

## TQ-VSC-004 verification details

### Implementation

- Added `src/lib/writingEvidence.ts` as the deterministic policy boundary for Writing Studio literature and statistical insertion.
- Literature selection now requires all of the following:
  - a verified source lifecycle/verification state;
  - source provenance with provider and retrieval timestamp;
  - an exact passage reviewed by a human, or linked claim evidence whose claim is researcher reviewed/approved;
  - demo/synthetic isolation for real projects.
- Removed verified-source abstract promotion. Abstract text is not automatically an EvidenceRecord and is not insertable.
- Statistical selection now requires exactly `AnalysisOutput.state === "Approved for Manuscript"`. `Completed`, `QC Passed`, and legacy `isApproved` flags do not qualify.
- Both insertion builders recompute eligibility from the current project at click time, blocking stale or forged UI items.
- Inserted literature includes provider, retrieval timestamp, and source ID. Inserted statistics include only fields stored on the approved output; there are no fallback values or significance labels inferred by the insertion layer.
- Audited `QuickActionsMenu`: its citation and figure actions only navigate to Source Library/Data Lab or invoke supplied callbacks; it contains no literature/statistics manuscript injection path.

### Exact verification results

1. `npm run lint`
   - Exit code: `0`.
   - Result: PASS; `tsc --noEmit` produced no diagnostics.
2. `npx vitest run src/tests/writingEvidenceIntegrity.test.ts src/tests/dataIntegrityRegression.test.ts src/tests/phase6.test.ts`
   - Exit code: `0`.
   - Result: PASS; 3/3 files and 25/25 tests passed.
3. `npm test`
   - Exit code: `1`.
   - Result: 19/23 test files passed; 164 tests passed and 1 failed out of 165 tests that executed.
   - TQ-VSC-004 tests pass. Remaining failures are the pre-existing invalid-DOI network assertion and Firebase Firestore/Storage import-resolution failures in three suites.
4. `npm run build`
   - Exit code: `0`.
   - Result: PASS; Vite transformed 1,988 modules and esbuild produced the server bundle.
   - Pre-existing browser-`crypto` externalization and large main-chunk warnings remain.
5. `git diff --check`
   - Exit code: `0`.
   - Result: PASS.

### Tests added or updated

- Added `src/tests/writingEvidenceIntegrity.test.ts` with eight focused tests.
- Covers empty projects, abstract/unreviewed/missing-provenance rejection, reviewed evidence insertion with provenance, stale/forged item rejection, strict analysis state filtering, recorded-value-only insertion, revalidation, and demo/synthetic isolation.
- Existing data-integrity and Phase 6 tests remain passing in the focused run.

### Data migration and compatibility

- No schema or stored-data migration is required.
- Existing source/claim/analysis records remain readable and editable.
- Records without source provenance or exact `Approved for Manuscript` state are intentionally excluded from insertion until researchers complete the required review workflow.

### Remaining blockers and prompt boundary

- Existing source records may lack provenance metadata and will not become insertable merely because their title/abstract exists; researchers must verify provenance and review an exact passage.
- The repository-wide suite remains red only on baseline failures documented under TQ-VSC-000.
- At completion of TQ-VSC-004, TQ-VSC-005 and all later prompts remained `NOT STARTED`. See the subsequent tracker row for TQ-VSC-005.

## TQ-VSC-005 verification details

### Implementation

- Retained and enforced the complete `NumericEvidence` contract: ID, raw and normalized value, unit, source type/ID, dataset hash, analysis run ID, variable name, evidence passage ID, verification state, and creation time.
- Replaced value-only matching and numeric allowances with exact numeric comparison plus source-type-specific provenance validation.
- Dataset evidence must resolve to a stored dataset and matching file hash; analysis evidence must resolve to the stored run and matching dataset hash; literature evidence must resolve to a Verified source and human-reviewed extracted passage.
- Removed the blanket allowances for `0`, `1`, `2`, and all integers from 1900–2100. Bibliographic citations and labeled section, figure, table, appendix, and supplement numbers are classified from textual context instead.
- Added a multi-surface validator covering abstract, introduction, literature review, methods, results, discussion, conclusion, tables, captions, and supplements.
- Added deterministic numeric-evidence creation from completed Data Lab analysis output fields. Failed/hashless runs create no Verified evidence. Demo status does not substitute for numeric provenance.

### Exact verification results

1. `npm run lint`
   - Exit code: `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/numericGrounding.test.ts src/tests/numericEvidence.test.ts src/tests/scientificIntegrityInvariants.test.ts src/tests/phase6.test.ts`
   - Exit code: `0`; PASS, 4/4 files and 28/28 tests.
3. `npm test`
   - Exit code: `1`; 20/24 files passed and 168/169 executed tests passed.
   - TQ-VSC-005 tests pass. Remaining failures are the pre-existing Crossref network-sensitive assertion and Firebase Firestore/Storage import-resolution failures in three suites.
4. `npm run build`
   - Exit code: `0`; PASS, 1,989 Vite modules transformed and server bundle produced.
   - Existing browser-`crypto` externalization and large main-chunk warnings remain.
5. `git diff --check`
   - Exit code: `0`; PASS.
6. `rg -n "num ===|\\[.*18.*48|trusted.*number|numeric.*allow|allow.*number" src/lib src/components src/tests --glob '!src/data/demoProject.ts'`
   - Exit code: `1` because no matches were found; PASS for removal audit.

### Tests and compatibility

- Updated `src/tests/numericGrounding.test.ts` to exercise exact provenance, dangling-record rejection, empirical years, context-based citation/structural numbering, demo enforcement, and all ten manuscript content surfaces.
- Added `src/tests/numericEvidence.test.ts` for deterministic analysis-run evidence generation and failed/hashless fail-closed behavior.
- Existing projects require no rewrite. Their optional records remain readable, but an old record without resolvable provenance no longer authorizes an empirical number.

### Remaining blockers and prompt boundary

- Projects whose prior analysis outputs predate numeric-evidence persistence must rerun the analysis or acquire explicitly traceable evidence before AI numeric prose is accepted; silently blessing legacy numbers would violate the task.
- Full-suite baseline failures remain unchanged from earlier prompts.
- TQ-VSC-006 and all later prompts remain `NOT STARTED`.
