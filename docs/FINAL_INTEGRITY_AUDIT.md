# TehqIQ Final Scientific-Integrity Audit

Date: 2026-09-19  
Scope: **TQ-VSC-093 only** (Phase 21 release audit). TQ-VSC-094 and every later prompt were not executed.

## Method

The audit inspected the live TypeScript/React/server source, Firestore and Storage rules, the demo boundary, and the existing tests. Searches covered fabricated research values, DOI/reference imports, outlet and Q1 claims, ethics and consent declarations, fallback scholarly prose, compliance/readiness success labels, approval transitions, AI/model boundaries, Results gates, object URLs, route protection, and broad rules. Findings were reproduced with focused regression tests before being fixed.

## Findings and dispositions

| ID | Severity | Disposition | Exact source locations |
| --- | --- | --- | --- |
| SI-01 | P1 | **Fixed.** Manuscript preview and DOCX declarations no longer assert an IRB identifier, institutional verification, or consent that is not present in trusted project state. Missing and researcher-supplied values are explicit. | `src/components/ManuscriptPreviewPane.tsx:49-68,596,729-730`; `src/lib/exportUtils.ts:305-324` |
| SI-02 | P1 | **Fixed.** Compliance/readiness output no longer uses static “verified/genuine/100%” success claims. Ethics requires trusted approval state, consent, and an identifier; author sign-off requires attributable actor, timestamp, and rationale. | `src/components/views/DashboardView.tsx:42-53,83-101,235-240,285-290`; `src/lib/complianceEngine.ts:6-11,138-151,253-323`; `src/lib/readinessCalculator.ts:66-105` |
| SI-03 | P1 | **Fixed.** Candidate searches and DOI registry resolution create metadata records as `Unverified` with `peerReviewStatus: Unknown`; a separate trusted transition is required for source verification. Parsers/import handlers no longer infer peer review, verification, relevance, venue, or the current year from imported text. | `src/components/views/SourceLibraryView.tsx:90-120,165-190,502-516`; `src/App.tsx:189-209`; `src/lib/referenceParsers.ts:61-105,117-222,257-290,300-330`; `server.ts:523-570`; `src/types.ts:680-718` |
| SI-04 | P1 | **Fixed.** `Completed`/`Executed` is execution history, not researcher approval. All deterministic methods, the Data Lab gate, readiness calculation, and artifact adaptation use the centralized `Approved` predicate. | `src/lib/analysisLifecycle.ts:8-11`; `src/components/views/DataLabView.tsx:17,463,661-689`; `src/lib/commonComparisonMethods.ts:157`; `src/lib/specializedAnalysisMethods.ts:69`; `src/lib/regressionAnalysisMethods.ts:92`; `src/lib/statsEngine.ts:342-350`; `src/lib/readinessCalculator.ts:80-88`; `src/lib/researchArtifacts.ts:157-169` |
| SI-05 | P1 | **Fixed.** Paired analysis no longer guesses the first two numeric columns. Missing explicit variables produce a failed, reviewable output with no invented statistics. | `src/lib/statsEngine.ts:515-533` |
| SI-06 | P1 | **Fixed.** Analysis approval requires a completed server-created output, approved dataset/version, and researcher-approved plan. Trusted digests now cover execution values, ethics identifiers/consent, author identity and approval attribution; direct mutations are rejected. | `src/types.ts:1250-1270`; `src/server/trustedTransitions.ts:44-74,91-119,171-182`; `server.ts:605-675`; `src/tests/trustedTransitions.test.ts:55-64,98-109` |
| SI-07 | P1 | **Fixed.** AI proposals retain server-returned model/prompt attribution, empty responses fail closed, reviewer fallbacks state that researcher review is required, and no client-side model ID or fallback scholarly prose is introduced. | `src/components/AiProposalModal.tsx:18-31`; `src/components/views/WritingStudioView.tsx:283-314,328-400`; `src/components/views/PeerReviewView.tsx:110-123,161-186`; `src/components/views/AiLedgerView.tsx:74-115`; `src/server/aiGateway.ts:127-145` |
| SI-08 | P1 | **Fixed/verified.** Privileged transition and audit endpoints are authenticated/project-scoped; AI endpoints use `AiGateway`; the only direct Gemini call is inside that gateway; the DOI provider is server-side. Firestore protects trusted-transition and submission fields, and Storage has a deny-all fallback. | `server.ts:182-263,268-345,407-463,465-521,523-570`; `firestore.rules:47-67,78-89`; `storage.rules:93-95` |
| SI-09 | P2/non-finding | **Isolated.** Numeric demo values and Q1-style legacy scaffolding are confined to the explicitly marked demo project and a demo-only engine that rejects real projects before generating content. | `src/data/demoProject.ts:29-35,419-430`; `src/lib/q1ManuscriptEngine.ts:8-17,42-46` |
| SI-10 | Non-finding | Object URLs are used only for an immediate browser download and are revoked; they are not persisted into project records. The `Completed` branch in Data Lab is only a QC action, not an approval gate. | `src/lib/exportUtils.ts:40-48`; `src/components/views/DataLabView.tsx:834-855` |

## Backward compatibility and migration

No destructive schema migration was introduced. `SourceRecord.year` and `relevanceScore` are now optional so imported records can remain explicitly unscored/missing; existing populated records remain valid. `ProvenanceMetadata.trustedServerRetrieved` and `AnalysisOutput.trustedServerCreated` are additive server-boundary markers. Existing legacy records that lack attributable approval, trusted provenance, or server-created execution metadata fail closed and require the normal researcher review/transition flow; no records are silently promoted.

The expanded trusted digest intentionally invalidates stale digests that do not cover the newly protected fields. Such projects must be re-established through authenticated transitions; this is a safe fail-closed compatibility behavior, not a data rewrite.

## Regression coverage added or updated

- `src/tests/finalIntegrityAudit.test.ts` covers fabricated declarations, static success labels, imported DOI/reference verification, missing-year handling, unscored relevance, approval-state gates, anonymization-only readiness, executed-plan artifact status, attributable author gates, server provenance, and implicit variable fallback removal.
- `src/tests/trustedTransitions.test.ts` covers trusted server execution requirements and digest detection for forged output values, author attribution, and ethics identifiers.
- Existing qualitative and literature-review fixtures were updated with attributable author approvals required by the stricter gates.

## Verification

- `npm run lint` — **PASS** (`tsc --noEmit`).
- `npx vitest run src/tests/finalIntegrityAudit.test.ts src/tests/trustedTransitions.test.ts src/tests/lifecycle.test.ts` — **PASS**, 3 files / 22 tests.
- `npx vitest run src/tests/finalIntegrityAudit.test.ts src/tests/trustedTransitions.test.ts src/tests/lifecycle.test.ts src/tests/qualitativeWorkflow.e2e.test.ts src/tests/literatureReviewWorkflow.e2e.test.ts src/tests/exportSecurityValidation.test.ts` — **PASS**, 6 files / 34 tests.
- `npm run build` — **PASS**. Vite emitted the existing crypto externalization and large-chunk warnings; the client and bundled server completed successfully.
- `npm test` — **706 passed, 2 failed, 18 skipped; 102 files passed, 2 failed, 2 skipped.** The two failures are pre-existing, non-P0 blockers: `src/tests/integration.test.ts` uses an incomplete `window.localStorage` mock (`setItem is not a function`), and `src/tests/phase3.test.ts` expects older Crossref error wording while the provider returns `was not found by Crossref Official Registry`.
- `git diff --check` — **PASS**.

## Acceptance

**PASS for TQ-VSC-093.** All confirmed P0/P1 scientific-integrity findings in the audited production paths were fixed or fail-closed, with the two pre-existing non-P0 test blockers documented above. TQ-VSC-094 and later prompts were not executed.
