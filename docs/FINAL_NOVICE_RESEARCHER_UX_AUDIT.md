# TehqIQ final novice-researcher UX acceptance audit

**Prompt:** TQ-VSC-094  
**Date:** 2026-09-19  
**Scope:** The live source tree and the locally served application entry point. This audit does not treat earlier status documents as proof of behavior.

## Method

- Inspected the live workflow shell in `src/App.tsx`, `src/components/Navigation.tsx`, and every workflow view mounted by the ten steps.
- Inspected the data, evidence, approval, warning, AI-ledger, peer-review, compliance, and export services used by those views.
- Confirmed the local server entry point responds with HTTP 200 at `http://localhost:3000/`.
- Ran the focused UI regressions (21 tests), TypeScript check, full Vitest suite (710 passed, 2 pre-existing failures, 18 skipped), production build, and whitespace check listed in the implementation tracker.
- A browser session was not available in this environment (`agent.browsers.list()` returned no connected browser), so no visual/browser interaction result is represented as passed.

## Acceptance matrix

| Researcher task | Live path inspected | Result | Evidence / limitation |
| --- | --- | --- | --- |
| Start a project | `ProjectWizardModal` → `createEmptyProject` → Step 1 | PASS | New projects retain blank researcher fields and the global prototype warning; no scientific defaults are injected. |
| Select or discover an outlet | `JournalFinderView`, `JournalSelectorDropdown`, `baselineOutlets` | PASS with review boundary | Outlet identity has provenance; requirements, metrics, indexing, fees, and peer-review claims remain Unverified unless separately sourced. |
| Search and import literature | `SearchPlannerView`, `SourceLibraryView`, reference parsers | PASS for configured paths | Search executions and BibTeX/RIS/CSL/DOI imports are visible; imported records remain Unverified and registry metadata is not treated as peer-review or full-text evidence. |
| Map evidence and gaps | `ClaimMatrixView`, `DocumentReaderModal`, `GapMapView` | PASS | Claims require passage-linked evidence and gap language is bounded to the reviewed evidence. |
| Enter/upload/propose methodology | `ProtocolBuilderView`, `methodologyWorkspace` | PASS | Researcher entry, labelled text upload, and AI proposal paths are distinct; AI/uploaded material remains review-pending until researcher approval. |
| Upload data and qualitative material | `DataLabView`, qualitative workflow services | PARTIAL / explicit Not Configured | Data Lab supports CSV/TSV/XLSX/JSON numeric ingestion and approval gates. Qualitative corpus/coding services exist, but no qualitative upload workbench is mounted in the current workflow; the Data Lab now says so explicitly for qualitative projects and warns not to upload transcripts as numeric data. |
| Approve and execute analysis | `DataLabView`, `analysisLifecycle`, `ApprovalModal` | PASS | Execution requires an approved dataset and researcher-approved analysis plan; Completed/QC states do not unlock manuscript use. |
| Draft manuscript sections | `WritingStudioView`, manuscript section contracts/writers | PASS with proposal boundary | Section drafting is evidence/approval gated; Results cannot be generated from unapproved or absent empirical findings. |
| Trace evidence | `ClaimMatrixView`, evidence records, manuscript preview | PASS | Source, passage, evidence, and claim links remain visible and revalidated at insertion/export boundaries. |
| Understand warnings and missing state | global prototype banner, operation states, source/export notices | PASS | Prototype, Unverified, Missing, Researcher input required, Not Configured, and blocker states remain visible rather than converted into success. |
| Run peer review and revisions | `PeerReviewView`, `RevisionWorkspaceView`, review lifecycle | PASS | Reviewer output is labelled AI Suggested; issue resolution requires researcher action and rationale. |
| Disclose AI use | `AiLedgerView`, `ManuscriptPreviewPane` | PASS | Ledger completeness is shown separately; unknown history is not presented as “no AI used.” |
| Understand submission blockers | `complianceEngine`, `ExportCentreView`, readiness calculator | PASS | Submission-Ready export lists blocker messages and resolution paths; draft review remains a separate mode. |
| Export Word/LaTeX/references/package | `ExportCentreView`, `exportUtils` | PASS for implemented formats | DOCX, PDF proof package, LaTeX, BibTeX, RIS, CSL JSON, JATS, and submission manifest paths are covered by deterministic tests; JATS external validation remains explicitly Not Configured unless a validator is supplied. |

## Ambiguities fixed in this prompt

1. A blank project previously displayed an invented `41/50` FINER assessment and an approval control that could not persist a question. New projects now show an empty state, an **Add research question** action, blank FINER inputs, explicit researcher-input labels, deterministic score calculation, and approval checks for a non-empty question plus all five scores.
2. The ten-step labels previously made Step 5 (“Methodology”) and Step 6 (“Results”) appear to overlap. They now read **Methods & Protocol** and **Data & Results** with researcher-facing subtitles that describe the hand-off.
3. Data Lab previously advertised “Analysis Engine Ready” before a dataset and approved plan existed. The status now reports whether it is waiting for inputs, blocked by the approval gate, or ready for researcher-approved analysis.
4. A high progress percentage previously could read “Ready for Export” even while submission gates were blocked. The label now reads **Review Submission Blockers** until the actual submission gate is clear.
5. Adding a blank question no longer marks the workflow task complete; progress only counts a question with researcher-entered text.

## Remaining risks and blockers

- No connected browser was available, so responsive layout, keyboard traversal, and click-through behavior were not claimed as browser-tested. The focused React accessibility suite passed in jsdom.
- Qualitative upload/coding is not yet mounted as a novice-facing workbench; the limitation is now explicit instead of being hidden behind the numeric Data Lab.
- Firebase remains `Not Configured` without valid `VITE_FIREBASE_*` client settings; cloud sign-in and persistence are intentionally unavailable in that state.
- The repository-wide suite retains the two previously documented non-TQ-VSC-094 failures: the localStorage mock failure in `src/tests/integration.test.ts` and the provider-dependent DOI error-string assertion in `src/tests/phase3.test.ts`.
- The production build retains existing Vite warnings about browser `crypto` externalization and the large main chunk.

## Audit conclusion

**TQ-VSC-094 acceptance: PASS.** The audit report is evidence-based, the major novice-facing ambiguities found in the live source were corrected, focused tests/typecheck/build checks were run, and unavailable capabilities are explicitly marked rather than presented as complete.
