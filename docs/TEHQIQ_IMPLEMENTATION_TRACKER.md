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
| TQ-VSC-006 | PASS | Built on committed TQ-VSC-005 checkpoint `de96307`; working-tree checkpoint pending commit | `src/types.ts`; `src/lib/analysisLifecycle.ts`; `src/lib/aiValidationService.ts`; `src/lib/writingEvidence.ts`; `src/lib/complianceEngine.ts`; `src/lib/exportUtils.ts`; `src/lib/statsEngine.ts`; `src/components/views/DataLabView.tsx`; `src/components/ApprovalModal.tsx`; `server.ts`; `src/tests/lifecycle.test.ts`; `src/tests/numericGrounding.test.ts`; `src/tests/phase6.test.ts`; `src/tests/writingEvidenceIntegrity.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Backward-compatible optional approval/state-history fields. Legacy `isApproved` flags and unaudited approval states remain readable but fail closed for manuscript use. No stored-data rewrite. | `npm run lint`: PASS. Focused Vitest: PASS, 57/57. `npm test`: baseline remains FAIL—20/24 files passed, 171/172 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. `git diff --check`: PASS. | Completed/QC alone never unlock Results. Approval requires ordered lifecycle plus authenticated human actor, timestamp, rationale, matching output ID, dataset hash, and plan ID. Figures/tables share the gate. TQ-VSC-007 and later were not executed. |
| TQ-VSC-007 | PASS | Built on the uncommitted TQ-VSC-006 working tree | `src/types.ts`; `src/lib/aiValidationService.ts`; `src/lib/complianceEngine.ts`; `src/lib/exportUtils.ts`; `src/components/views/AiLedgerView.tsx`; `src/components/views/WritingStudioView.tsx`; `src/components/views/PeerReviewView.tsx`; `src/components/views/ProtocolBuilderView.tsx`; `src/components/views/ResearchCanvasView.tsx`; `src/tests/aiLedgerIntegrity.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Added optional `aiLedgerIntegrity`; old projects hydrate behaviorally to Unknown without rewriting. Empty legacy ledgers no longer imply no AI use. | `npm run lint`: PASS. Focused Vitest: PASS, 20/20. `npm test`: baseline remains FAIL—21/25 files passed, 176/177 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. `git diff --check`: PASS. | Unknown/incomplete history is disclosed explicitly. Four direct server SDK paths and five client call sites are recorded for later gateway centralization. TQ-VSC-008 and later were not executed. |
| TQ-VSC-008 | PASS | Built on the uncommitted TQ-VSC-006/007 working tree | `src/data/baselineOutlets.ts`; `src/types.ts`; `src/lib/complianceEngine.ts`; `src/lib/exportUtils.ts`; `src/components/JournalSelectorDropdown.tsx`; `src/components/views/JournalFinderView.tsx`; `src/components/views/DashboardView.tsx`; `src/tests/baselineOutlets.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Added optional identity provenance fields and `Unverified` OA state. Legacy selected outlets remain readable, but unverified/spoofed outlets cannot drive compliance. No stored-data rewrite. | `npm run lint`: PASS. Focused Vitest: PASS, 33/33. `npm test`: baseline remains FAIL—21/25 files passed, 177/178 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. `git diff --check`: PASS. | Static seeds expose verified identity only; unsourced requirements/claims are discarded. Arbitrary factory input becomes user-added Unverified, live identity requires provider raw-record provenance, and no Q1/human confirmation is auto-set. TQ-VSC-009 and later were not executed. |
| TQ-VSC-009 | PASS | Built on the uncommitted TQ-VSC-006–008 working tree | `src/types.ts`; `src/lib/outletMetrics.ts`; `src/data/baselineOutlets.ts`; `src/components/views/ExportCentreView.tsx`; `src/tests/outletMetrics.test.ts`; `src/tests/baselineOutlets.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Replaced the typed global metric object with optional metric-record arrays. Legacy runtime objects remain readable but normalize to no verified records; no destructive rewrite. | `npm run lint`: PASS. Focused Vitest: PASS, 39/39. `npm test`: baseline remains FAIL—22/26 files passed, 183/184 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS. `git diff --check`: PASS. | Every authoritative metric is provider/year/category/source/retrieval specific. Multiple quartiles are supported; missing/legacy metrics show Not Verified; third parties cannot masquerade as JCR/Scopus. TQ-VSC-010 and later were not executed. |
| TQ-VSC-010 | PASS | Built on the uncommitted TQ-VSC-006–009 working tree | `src/types.ts`; `src/lib/outletRequirements.ts`; `src/data/baselineOutlets.ts`; `src/lib/complianceEngine.ts`; `src/components/views/ExportCentreView.tsx`; `src/tests/outletRequirements.test.ts`; `src/tests/baselineOutlets.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Replaced the narrow requirement shape with backward-compatible versioned field records. Legacy arrays normalize known field aliases to Unverified; absent records display Unavailable. No destructive stored-data rewrite. | `npm run lint`: PASS. Focused Vitest: PASS, 33/33. `npm test`: baseline remains FAIL—23/27 files passed, 193/194 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS, 1,992 modules. `git diff --check`: PASS. | All 18 required fields render an exact review state. Only valid field-level Verified records drive outlet compliance; outlet identity URLs and legacy top-level values are not substituted. TQ-VSC-011 and later were not executed. |
| TQ-VSC-011 | PASS | Built on the uncommitted TQ-VSC-006–010 working tree | `.env.example`; `src/lib/firebaseConfig.ts`; `src/lib/firebase.ts`; `src/context/AuthContext.tsx`; `src/components/AuthModal.tsx`; `src/lib/projectService.ts`; `src/lib/storageService.ts`; `src/tests/firebaseConfiguration.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No stored-data migration. Deployments must provide six validated `VITE_FIREBASE_*` public client variables; missing/invalid values now enter an explicit Not Configured state instead of using a built-in project. | `npm run lint`: PASS. Focused Vitest: PASS, 17/17. `npm test`: baseline remains FAIL—24/28 files passed, 198/199 executed tests passed; same Crossref assertion and three Firebase import failures. `npm run build`: PASS, 1,993 modules. `git diff --check`: PASS. | Removed hard-coded Firebase project configuration and fallback initialization. No Admin SDK/service-account/private-key variable enters client configuration. TQ-VSC-012 and later were not executed. |
| TQ-VSC-012 | PASS | Built on the uncommitted TQ-VSC-006–011 working tree | `firestore.rules`; `firebase.json`; `package.json`; `package-lock.json`; `src/tests/firebaseSecurityRules.test.ts`; `src/tests/firestoreRules.emulator.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No document rewrite. Existing owner records remain directly readable by `ownerUid`; owner updates can repair a missing owner-membership entry. New project creation requires the owner to be mapped as Owner. | `npm run lint`: PASS. Static focused Vitest: PASS, 16/16. Firestore Emulator: PASS, 7/7. `npm test`: 26/29 files passed, 216/218 executed tests passed, 7 emulator-only tests skipped outside emulator; Crossref and localStorage-environment failures remain. `npm run build`: PASS, 1,993 modules. `git diff --check`: PASS. | Private profiles are owner-only; project reads require membership; Viewer writes and Co-author membership/ownership changes are denied; owner/member integrity and cross-project isolation are enforced; version snapshots are immutable. TQ-VSC-013 and later were not executed. |
| TQ-VSC-013 | PASS | Committed TQ-VSC-012 checkpoint `2364ab2`; working-tree checkpoint pending commit | `.env.example`; `package.json`; `package-lock.json`; `server.ts`; `firestore.rules`; `src/types.ts`; `src/server/trustedAudit.ts`; `src/lib/projectService.ts`; `src/tests/trustedAudit.test.ts`; `src/tests/firebaseSecurityRules.test.ts`; `src/tests/firebaseConfiguration.test.ts`; `src/tests/firestoreRules.emulator.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Expanded audit records with optional legacy aliases. Existing client-created records remain readable but fail `isTrustedAuditEvent`; no destructive rewrite. | `npm run lint`: PASS. Focused Vitest: PASS, 23/23. Firestore Emulator: PASS, 8/8. `npm test`: 27/30 files passed, 223/225 executed tests passed, 8 emulator-only tests skipped; Crossref and localStorage-environment failures remain. `npm run build`: PASS, 1,993 modules. `git diff --check`: PASS. | Client create/update/delete on audit events is denied for every role. Trusted append requires verified Firebase actor, membership/RBAC, action/entity validation, existing entity, server-derived snapshots/timestamp, rationale and evidence IDs. TQ-VSC-014 and later were not executed. |
| TQ-VSC-014 | PASS | Built on committed TQ-VSC-013 checkpoint `3c10717`; working-tree checkpoint pending commit | `src/lib/storageService.ts`; `src/tests/storagePersistence.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Extended newly created file metadata with project, SHA-256, persistence, and provenance fields. No existing records are rewritten; legacy metadata remains readable. Failed attempts create no metadata record. | `npm run lint`: PASS. Focused storage Vitest: PASS, 5/5. Combined focused/regression Vitest: 2/3 files and 13/14 tests passed; only the pre-existing jsdom localStorage failure remains. `npm test`: 28/30 executed files passed, 228/230 executed tests passed, 1 file/8 emulator tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,993 modules. `git diff --check`: PASS. | Object URLs are never returned by the research upload path. Only a completed Cloud Storage upload plus download-reference resolution and Firestore metadata write returns success; partial uploads are cleanup-attempted and all failures throw an explicit Local / Unpersisted error. TQ-VSC-015 and later were not executed. |
| TQ-VSC-015 | PASS | Built on committed TQ-VSC-014 checkpoint `aabd971`; working-tree checkpoint pending commit | `storage.rules`; `firebase.json`; `package.json`; `src/tests/storageRules.emulator.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No stored-object or Firestore document migration. Existing objects become private and may require policy-compliant metadata before overwrite. Locked objects cannot be changed or deleted through client rules. | `npm run lint`: PASS. Firestore + Storage Emulator: PASS, 8/8. `npm test`: 28/30 executed files passed, 228/230 executed tests passed, with 2 emulator-only files/16 tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,993 modules. `git diff --check`: PASS. | Authenticated project membership is required to read. Only designated writer roles can create/update, only owners can delete, paths/metadata are project-bound, overwrites cannot use create grants, locked objects are protected, and all unscoped paths are denied. No malware-scanning claim is made. TQ-VSC-016 and later were not executed. |
| TQ-VSC-016 | PASS | Built on committed TQ-VSC-015 checkpoint `40a2b25`; working-tree checkpoint pending commit | `server.ts`; `src/server/authMiddleware.ts`; `src/lib/authenticatedFetch.ts`; `src/App.tsx`; `src/components/views/ResearchCanvasView.tsx`; `src/components/views/ProtocolBuilderView.tsx`; `src/components/views/SourceLibraryView.tsx`; `src/components/views/WritingStudioView.tsx`; `src/components/views/PeerReviewView.tsx`; `src/components/views/DataLabView.tsx`; `src/tests/authMiddleware.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No stored-data migration. Sensitive API clients now require a configured signed-in Firebase user and project ID; deployments require working Firebase Admin credentials for server authorization. | `npm run lint`: PASS. Focused security Vitest: PASS, 19/19. `npm test`: 29/31 executed files passed, 235/237 executed tests passed, with 2 emulator-only files/16 tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,994 modules. `git diff --check`: PASS. | Seven sensitive endpoints use reusable ID-token verification, Firestore-derived membership/RBAC, bounded bodies, safe errors, audit hooks and per-actor/project/route rate limiting. Health remains public. Frontend identity/role claims are ignored. TQ-VSC-017 and later were not executed. |
| TQ-VSC-017 | PASS | Built on the uncommitted TQ-VSC-016 working tree | `server.ts`; `src/server/apiSchemas.ts`; `src/tests/apiSchemas.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No stored-data migration. Generic agent success changes from unvalidated `text` to validated structured `result`; malformed model output now fails with 502 instead of being accepted or filled. | `npm run lint`: PASS. Focused schema/security Vitest: PASS, 22/22. `npm test`: 30/32 executed files passed, 243/245 executed tests passed, with 2 emulator-only files/16 tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,994 modules. `git diff --check`: PASS. | Every non-audit server request has deterministic runtime validation; audit retains its strict validator. Structured agent, draft, peer-review and methodology model output is parsed and validated before use. External analysis responses are validated before return. TQ-VSC-018 and later were not executed. |
| TQ-VSC-018 | PASS | Built on committed TQ-VSC-017 checkpoint `1c611e2`; working-tree checkpoint pending commit | `src/types.ts`; `src/lib/researchArtifacts.ts`; `src/lib/projectService.ts`; `src/lib/storageService.ts`; `src/data/demoProject.ts`; `src/tests/researchArtifacts.test.ts`; `src/tests/storagePersistence.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Backward-compatible optional `researchArtifacts` projection; no destructive rewrite. Existing domain collections remain authoritative and load unchanged. Load/create/save adapters populate canonical metadata, including explicit `Not available` for absent legacy facts. | `npm run lint`: PASS. Focused artifact/storage Vitest: PASS, 11/11. `npm test`: 31/33 executed files passed, 249/251 executed tests passed, with 2 emulator-only files/16 tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,995 modules. `git diff --check`: PASS. | Canonical metadata covers uploaded documents, sources, evidence, protocols, datasets, analysis plans/outputs, tables, figures, manuscript sections, reviews and exports. Existing and older sparse projects remain loadable. TQ-VSC-019 and later were not executed. |
| TQ-VSC-019 | PASS | Built on the uncommitted TQ-VSC-018 working tree | `src/types.ts`; `src/lib/evidenceRecords.ts`; `src/lib/researchArtifacts.ts`; `src/App.tsx`; `src/components/views/ClaimMatrixView.tsx`; `src/components/views/DocumentReaderModal.tsx`; `src/tests/evidenceRecords.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Added optional `evidenceRecords` with non-destructive adapters for traceable legacy extracted/linked passages. Unlocated legacy text is not promoted. Existing inline claim/source passage fields remain readable. | `npm run lint`: PASS. Focused provenance/regression/accessibility Vitest: PASS, 33/33. `npm test`: 32/34 executed files passed, 255/257 executed tests passed, with 2 emulator-only files/16 tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,996 modules. `git diff --check`: PASS. | Evidence is separate from source metadata and requires exact text plus page, section, or paragraph/chunk. AI starts Needs Review; attributable researcher review is required. Reader displays document provenance. TQ-VSC-020 and later were not executed. |
| TQ-VSC-020 | PASS | Built on the uncommitted TQ-VSC-018/019 working tree | `src/types.ts`; `src/lib/claimEvidenceGraph.ts`; `src/lib/researchArtifacts.ts`; `src/lib/writingEvidence.ts`; `src/App.tsx`; `src/components/views/ClaimMatrixView.tsx`; `src/tests/claimEvidenceGraph.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | Added optional graph-edge and manuscript-sentence link collections. Traceable legacy inline links adapt as Unverified/Pending Review; no legacy status is silently elevated. Existing claim/source fields remain readable. | `npm run lint`: PASS. Focused graph/provenance/state/writing/accessibility Vitest: PASS, 63/63. `npm test`: 33/35 executed files passed, 261/263 executed tests passed, with 2 emulator-only files/16 tests skipped; only the established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,997 modules. `git diff --check`: PASS. | Many-to-many and contradiction integrity tests pass. Sentence traversal resolves sentence → claim → edge → exact evidence → source/location. Linking never auto-selects a source or verifies/approves an edge. TQ-VSC-021 and later were not executed. |
| TQ-VSC-021 | PASS | Built on the uncommitted TQ-VSC-018–020 working tree | `src/types.ts`; `src/server/trustedTransitions.ts`; `src/lib/trustedTransitionsClient.ts`; `server.ts`; `firestore.rules`; `src/App.tsx`; `src/components/views/SourceLibraryView.tsx`; `src/components/views/ClaimMatrixView.tsx`; `src/components/views/DataLabView.tsx`; `src/components/views/WritingStudioView.tsx`; `src/tests/trustedTransitions.test.ts`; `src/tests/firebaseSecurityRules.test.ts`; `src/tests/firestoreRules.emulator.test.ts`; `src/tests/authMiddleware.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`; `docs/CURRENT_IMPLEMENTATION_REGISTER.md` | No bulk rewrite. Optional trusted integrity metadata is established on the first trusted transition; immutable records use a new denied-to-clients subcollection. Existing projects remain readable. | `npm run lint`: PASS. Focused transition/security/regression Vitest: PASS, 69/69. Firestore Emulator: PASS, 10/10. `npm test`: 34/36 executed files passed, 271/273 executed tests passed, with 2 emulator-only files/18 tests skipped; only established Crossref-network and localStorage-environment failures remain. `npm run build`: PASS, 1,998 modules. `git diff --check`: PASS. | Eight sensitive transitions are server-transactional. Forged integrity/submission/history writes are denied; direct privileged or locked-content mutation after integrity baseline is digest-detectable and blocks further trusted transitions. TQ-VSC-022 and later were not executed. |

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
- At completion of TQ-VSC-005, TQ-VSC-006 and later remained `NOT STARTED`. See the subsequent TQ-VSC-006 row and details.

## TQ-VSC-006 verification details

### Implementation

- Added `src/lib/analysisLifecycle.ts` as the shared policy for ordered analysis transitions and attributable manuscript approval.
- Enforced Draft Plan → Awaiting Approval → Approved → Queued → Running → Completed → QC Passed → Researcher Reviewed → Approved for Manuscript → Locked. Direct Completed/QC-to-approval shortcuts are rejected.
- Data Lab displays execution status separately from lifecycle state and exposes distinct actions for automated QC, researcher review, and final manuscript approval.
- Automated QC can only record `QC Passed`; it cannot grant either human state. Review and final approval require a currently authenticated researcher and non-empty rationale.
- Final approval records actor UID/email, timestamp, rationale, output ID, dataset hash, and plan ID. All fields must match the output before a Results/manuscript gate opens.
- Removed legacy boolean approval compatibility from client validation and the Gemini drafting server gate.
- Writing Studio, compliance, figures, tables, and PDF/DOCX export use the same attributable approval policy. Generated figures/tables begin unapproved and synchronize only when the linked output reaches valid manuscript approval.
- Researcher-supplied and Not Independently Reproduced flags are preserved through review and approval; approval does not claim reproduction.

### Exact verification results

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. Focused Vitest commands — PASS; final union totals 57 passing tests across lifecycle, writing evidence, numeric grounding, Phase 5, Phase 6, export validation, and scientific-integrity invariants.
3. `npm test` — exit `1`; 20/24 files passed and 171/172 executed tests passed. TQ-VSC-006 tests pass; remaining failures are the pre-existing Crossref assertion and Firebase Firestore/Storage resolution failures.
4. `npm run build` — exit `0`; PASS, 1,990 Vite modules transformed and server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.
6. Production gate scan found only a Data Lab execution-status presentation check and an unrelated claim-review flag; no Results/manuscript gate uses Completed or legacy output approval booleans.

### Tests and compatibility

- Rebuilt `src/tests/lifecycle.test.ts` around the exact sequence, shortcut rejection, automated-QC separation, attributable approval, and imported-output provenance preservation.
- Updated numeric-grounding and Phase 6 fixtures with matching approval provenance.
- Extended Writing Evidence tests to require matching metadata and verify figures/tables remain excluded when the linked output is merely Completed.
- Existing records are not rewritten. Legacy approval flags/states without an attributable matching record intentionally remain ineligible until a researcher completes the lifecycle.

### Remaining blockers and prompt boundary

- Approval transitions are attributable to the authenticated client user and stored through existing project persistence. Server-side Firebase Admin token verification and project-membership/RBAC remain an already documented broader security gap; the UI no longer calls this client audit server-audited.
- Full-suite baseline failures remain unchanged.
- At completion of TQ-VSC-006, TQ-VSC-007 and later remained `NOT STARTED`. See the subsequent TQ-VSC-007 row and details.

## TQ-VSC-007 verification details

### Implementation

- Added optional `AiLedgerIntegrity` with Complete, Incomplete, Unknown, and No AI Use Confirmed states plus attributable assessment metadata and known bypass paths.
- Empty or missing legacy ledgers now produce an explicit Unknown/Incomplete disclosure stating that emptiness is not proof of no AI use.
- A no-use statement is emitted only for `No AI Use Confirmed` with assessment timestamp, assessor UID, and rationale.
- Non-empty ledgers without an attributable completeness assessment disclose the recorded events but warn that they are not a complete history.
- Removed invented default model and CRediT values from disclosure generation. Missing event metadata is shown as Unrecorded/Not recorded.
- PDF/DOCX disclosure export, compliance rules, submission gates, and the ledger UI now use the same fail-closed integrity semantics.
- Direct Methodology, Writing, and Peer Review model paths mark ledger integrity Incomplete in project state. Canvas cannot persist project-level ledger state through its current props, so its UI explicitly reports that the route is unconnected rather than claiming it was logged.

### Model-call paths recorded for later gateway centralization

- `POST /api/gemini/agent` → direct server SDK call; Canvas caller does not create an `AiLedgerEvent`.
- `POST /api/gemini/methodology-proposal` → direct server SDK call; caller records Incomplete integrity but no event.
- `POST /api/gemini/draft-section` → direct server SDK call; event creation occurs later on a researcher decision, so attempted/generated calls are not a complete invocation ledger.
- `POST /api/gemini/peer-review` → direct server SDK call; event creation occurs later on comment disposition and does not establish complete invocation history.
- Writing Studio has both single-section and bulk client call sites for the same drafting endpoint, producing five client call sites across four direct server model routes.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/aiLedgerIntegrity.test.ts src/tests/phase6.test.ts src/tests/exportValidation.test.ts` — exit `0`; PASS, 3/3 files and 20/20 tests.
3. `npm test` — exit `1`; 21/25 files passed and 176/177 executed tests passed. New tests pass; remaining failures are the pre-existing Crossref assertion and three Firebase import-resolution failures.
4. `npm run build` — exit `0`; PASS, 1,990 Vite modules transformed and server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Compatibility, blockers, and prompt boundary

- No data rewrite is required. Missing integrity state is intentionally interpreted as Unknown.
- Centralized gateway logging remains future work; this prompt records and truthfully surfaces the current bypasses without executing that later architecture.
- Full-suite baseline failures remain unchanged.
- At completion of TQ-VSC-007, TQ-VSC-008 and later remained `NOT STARTED`. See the subsequent TQ-VSC-008 row and details.

## TQ-VSC-008 verification details

### Implementation

- Reworked `createVerifiedStaticOutlet` into an identity-only boundary. It retains the allowlisted static title, type, ISSN/acronym, publisher/society, category, official identity page, and retrieval metadata while discarding unsourced requirements, indexing, OA model, AI policy, formatting, APC, acceptance, deadline, review-time, fit, and metric claims.
- Removed automatic requirement/claim construction and every automatic `humanConfirmed: true` assignment.
- Added an exact static-identity allowlist derived from the audited catalogue constants. Arbitrary or altered input passed to the static factory is downgraded to `USER_ADDED_UNVERIFIED` and cannot become a Verified production record.
- Live retrieved records become Verified only with a named provider plus a distinct HTTPS raw-record URL. Arbitrary caller-supplied requirements, metrics, indexing, fees, and guidelines are not promoted.
- User-added outlets remain Unverified. Supplied requirement/claim confirmation flags are forced false and structured verified metrics are stripped; only explicitly labeled unverified metrics may remain.
- Outlet integrity validation now requires identity provider, source URL, and retrieval date provenance. Live records cannot cite only an outlet homepage as provider provenance.
- Compliance fails closed for unverified/spoofed selected outlets, so their claims cannot drive production compliance results.
- Removed the selector's implicit default journal, Dashboard's fabricated 92% fit fallback, the export `Q1` fallback, and UI wording that represented missing indexing/guidelines/layout as verified defaults.
- Removed hard-coded conference deadline claims from the seed source.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/baselineOutlets.test.ts src/tests/scientificIntegrityInvariants.test.ts src/tests/exportValidation.test.ts` — exit `0`; PASS, 3/3 files and 33/33 tests.
3. `npm test` — exit `1`; 21/25 files passed and 177/178 executed tests passed. TQ-VSC-008 tests pass; remaining failures are the pre-existing Crossref assertion and three Firebase import-resolution failures.
4. `npm run build` — exit `0`; PASS, 1,990 Vite modules transformed and server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Tests and compatibility

- Updated baseline outlet tests to verify identity provenance, absence of auto-generated requirements/claims/metrics/indexing, live provider provenance, and arbitrary static-factory downgrade.
- Added regression coverage proving a generated Q1-looking outlet remains Unverified and produces a compliance failure rather than authoritative rules.
- Existing outlet objects remain schema-readable. Newly optional identity provenance fields do not require document migration; old records lacking them fail closed if they claim Verified.

### Remaining blockers and prompt boundary

- Static catalogue identity provenance does not establish current requirements, indexing, metrics, fees, or policies. Those fields remain Unverified until separately retrieved and modeled.
- Metric provider/year/category modeling belongs to TQ-VSC-009 and was not implemented.
- Full-suite baseline failures remain unchanged.
- At completion of TQ-VSC-008, TQ-VSC-009 and later remained `NOT STARTED`. See the subsequent TQ-VSC-009 row and details.

## TQ-VSC-009 verification details

### Implementation

- Replaced the timeless `jcrQuartile`/`citeScorePercentile` singleton structure with `OutletMetricRecord[]`.
- Each record now carries ID, provider, provider kind, metric name, year, subject category, value, percentile, quartile, source URL/record ID, retrieval time, and verification state.
- Added `src/lib/outletMetrics.ts` for deterministic validation, normalization, verified-record selection, and legacy fail-closed handling.
- Supports multiple records for the same outlet, including different categories, years, and quartiles without collapsing them into a global journal rank.
- JCR, Scopus, and SCImago records must cite the matching official provider domain. Provider names must align with JCR or Scopus provider kinds.
- THIRD_PARTY and other non-provider records cannot use JCR, Journal Citation Reports, CiteScore, or Scopus labels. Invalid records cannot enter the verified selector.
- Missing metrics and legacy singleton objects normalize to no verified records and display `Metrics: Not Verified`.
- Export Centre renders each metric with provider, metric name, verification badge, year, category, value/percentile/quartile, and its actual source link. It has no default provider link or Q1 fallback.
- Static/live factories accept only valid record arrays; user-added metric records are forced Unverified.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/outletMetrics.test.ts src/tests/baselineOutlets.test.ts src/tests/scientificIntegrityInvariants.test.ts src/tests/exportValidation.test.ts` — exit `0`; PASS, 4/4 files and 39/39 tests.
3. `npm test` — exit `1`; 22/26 files passed and 183/184 executed tests passed. TQ-VSC-009 tests pass; remaining failures are the pre-existing Crossref assertion and three Firebase import-resolution failures.
4. `npm run build` — exit `0`; PASS, 1,991 Vite modules transformed and server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.
6. Production scan for `jcrQuartile`, `citeScorePercentile`, `unverifiedMetrics`, and Q1 fallback expressions returned no matches.

### Tests and compatibility

- Added `src/tests/outletMetrics.test.ts` with six tests for multi-category/year quartiles, timeless/category-free rejection, third-party masquerade rejection, official provider domains, legacy/missing fail-closed behavior, and forced user-entry Unverified state.
- Updated baseline outlet tests for the record-array schema and generated-metric downgrade.
- Old persisted singleton metric objects are not treated as authoritative. They remain loadable at runtime but surface as Not Verified until migrated from a real provider record.

### Remaining blockers and prompt boundary

- This task introduces no live JCR or Scopus credentials/integration and therefore creates no metric values. Records must come from separately authorized provider retrieval or explicit unverified entry.
- Outlet-requirement versioning belongs to TQ-VSC-010 and was not implemented.
- Full-suite baseline failures remain unchanged.
- TQ-VSC-010 and all later prompts remain `NOT STARTED`.

## TQ-VSC-010 verification details

### Implementation

- Expanded `VersionedRequirementRecord` to cover article type; manuscript and abstract limits; abstract structure; reference style and limit; figure and table limits; supplements; title page; authors; AI policy; ethics; data sharing; APC; and conference deadline, template, and file requirements.
- Each record now carries an explicit state, value, source provider, real source URL when available, retrieval date, confidence, human-confirmation metadata, version, and prior-version history.
- Added deterministic normalization, validation, latest-version selection, verified selection, display-state calculation, and version creation in `src/lib/outletRequirements.ts`.
- A Verified state is valid only with a non-placeholder HTTPS source, named provider, retrieval date, and human confirmation. Invalid Verified inputs downgrade to Unverified.
- Static and live outlet factories normalize requirement arrays without inventing records. User-added values are retained only as Unverified, unconfirmed requirement records.
- Compliance now reads only valid field-level Verified requirements. It no longer treats top-level legacy word limits/styles or the outlet identity homepage/retrieval date as requirement evidence.
- Export Centre renders a complete requirement register with exact `Verified`, `AI Extracted—Needs Review`, `Unverified`, or `Unavailable` states, value, confidence, version/history count, provider, retrieval date, and a link only when the record contains one.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/outletRequirements.test.ts src/tests/baselineOutlets.test.ts src/tests/outletMetrics.test.ts src/tests/phase6.test.ts` — exit `0`; PASS, 4/4 files and 33/33 tests.
3. `npm test` — exit `1`; 23/27 files passed and 193/194 executed tests passed. The TQ-VSC-010 suite passes; remaining failures are the pre-existing network-sensitive Crossref assertion and three Firebase import-resolution failures.
4. `npm run build` — exit `0`; PASS, 1,992 Vite modules transformed and the server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Tests and compatibility

- Added ten tests for full field coverage, valid and invalid Verified provenance, AI review state, explicit Unavailable state, legacy alias normalization, version history, latest-version selection, top-level fallback rejection, and exact compliance provenance.
- Updated the user-added outlet assertion to use the new `manuscriptWordLimit` field.
- Older `requirementsList` arrays remain readable. Recognized legacy fields normalize to the new field names but fail closed as Unverified unless a complete new Verified record is supplied. Missing records remain Unavailable.

### Remaining blockers and prompt boundary

- This prompt adds no publisher scraper or live guideline ingestion, so it creates no factual requirement claims. Authorized retrieval and researcher review must populate records.
- Client-held records are not server-trusted audit evidence; server-side authentication/RBAC remains a recorded architectural risk for later prompts.
- Full-suite baseline failures remain unchanged.
- TQ-VSC-011 and all later prompts remain `NOT STARTED`.

## TQ-VSC-011 verification details

### Implementation

- Removed the built-in Firebase API key, project ID, domains, sender ID, app ID, and fallback initialization from `src/lib/firebase.ts`.
- Added a deterministic client-environment validator for the six required `VITE_FIREBASE_*` values. It rejects missing values, common placeholders, malformed hostnames, malformed project/sender/app identifiers, and malformed Firebase Web API-key structure.
- Added an explicit `Configured` / `Not Configured` state. Missing or invalid values do not initialize Firebase; SDK initialization failures also downgrade the runtime state to Not Configured.
- Firebase handles are nullable until initialization succeeds. Authentication, project persistence, and storage obtain handles through a guarded accessor that throws a clear Not Configured error rather than retrying with invented values.
- Auth context completes loading safely without registering an auth observer when Firebase is unavailable. Auth UI displays a visible Not Configured notice.
- Cloud file upload fails explicitly when Firebase is Not Configured rather than returning a transient object URL as if it were a cloud upload.
- Added blank public-client placeholders to `.env.example`. No Firebase Admin credential, service-account value, or private key is exposed through Vite client variables.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/firebaseConfiguration.test.ts src/tests/firebaseSecurityRules.test.ts` — exit `0`; PASS, 2/2 files and 17/17 tests.
3. `npm test` — exit `1`; 24/28 files passed and 198/199 executed tests passed. The new configuration suite passes; remaining failures are the pre-existing network-sensitive Crossref assertion and three Firebase subpath import-resolution failures.
4. `npm run build` — exit `0`; PASS, 1,993 Vite modules transformed and the server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.
6. Production-source scan for the removed API-key prefix, old project identifier, `defaultConfig`, literal sender/app configuration, and client Admin/service-account/private-key variables returned no built-in Firebase project configuration or client secret variables.

### Tests and compatibility

- Added five configuration tests for missing state, valid configuration, malformed/placeholder rejection, complete blank `.env.example` coverage, absence of client Admin secrets, and removal of the built-in fallback.
- Existing local/demo project behavior remains available. Cloud authentication, Firestore, and Storage now require valid deployment environment configuration.
- No Firestore document or browser-storage schema changed.

### Remaining blockers and prompt boundary

- Real Firebase connectivity was not exercised because no deployment configuration or emulator was supplied. The configuration boundary and production compilation were verified locally.
- The full-suite Firebase import-resolution baseline remains: Vite cannot resolve `firebase/firestore` in accessibility/E2E imports or `firebase/storage` in integration imports in this installed dependency environment. TQ-VSC-011 does not alter package installation or implement later security-rule work.
- Full-suite Crossref network expectation remains unchanged.
- TQ-VSC-012 and all later prompts remain `NOT STARTED`.

## TQ-VSC-012 verification details

### Implementation

- Replaced broad signed-in `/users/{userId}` reads with owner-only read, create, update, and delete access. No public-profile collection was introduced.
- Removed the public demo-project read exception. Project documents now require authenticated ownership or explicit membership.
- Project creation requires `ownerUid` to match the authenticated UID and requires that UID to be present in `members` with the Owner role.
- Project ownership is immutable on client updates. Only the `ownerUid` owner may change `members`, `memberList`, or `organizationId`; non-owner writers must preserve all four protected membership/ownership fields.
- Viewer and Reviewer roles cannot write projects. Corresponding Author, Co-author, Supervisor, and Statistician may update project content but cannot self-promote or alter membership/ownership fields.
- Owner identity is derived only from `ownerUid`, so assigning an `Owner` label in the members map cannot transfer ownership or grant deletion/membership-management authority.
- Version snapshots and audit events remain immutable after creation. Snapshot creation now requires `createdByUid` to match the authenticated writer. File creation requires matching `uploadedByUid`, file updates cannot change it, and deletion is owner-only.
- Added Firebase Emulator configuration plus an executable `test:firestore-rules` package script and the official Rules Unit Testing/CLI dev dependencies.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/firebaseSecurityRules.test.ts src/tests/firebaseConfiguration.test.ts` — exit `0`; PASS, 2/2 files and 16/16 tests.
3. `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" XDG_CONFIG_HOME=/private/tmp/tehqiq-firebase-config npm run test:firestore-rules` — exit `0`; real Firestore Emulator PASS, 1/1 file and 7/7 tests.
4. `npm test` — exit `1`; 26/29 files passed, 216 tests passed and 2 failed out of 218 executed, with 7 emulator-only tests skipped because the general suite does not start the emulator. Firebase subpath import failures are resolved after restoring the declared Firebase 12.17.0 package. Remaining failures are the existing network-sensitive Crossref assertion and an integration localStorage test where `window.localStorage.setItem` is unavailable under the current Node local-storage option.
5. `npm run build` — exit `0`; PASS, 1,993 Vite modules transformed and the server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
6. `git diff --check` — exit `0`; PASS.

### Emulator acceptance coverage

- User A can read A's profile but cannot read B's private profile.
- A non-member cannot read a project.
- An authorized member can read its project but cannot read another project.
- Viewer cannot edit.
- Co-author cannot self-promote or transfer ownership.
- Owner can perform a valid member-role change while ownership remains fixed.
- Finalized version snapshots cannot be updated or deleted, including by the Owner.

### Compatibility, blockers, and prompt boundary

- No Firestore document migration runs automatically. Current application-created projects already store the owner in both `ownerUid` and `members`. A legacy owner without the members entry can still read by `ownerUid` and can repair the record in an owner-authorized update.
- The rules were verified locally with Firestore Emulator v1.22.0 on OpenJDK 21. Deployment to a real Firebase project was not requested or performed.
- Installing the requested emulator tooling reported seven dependency audit findings (six moderate, one high); no blanket or breaking `npm audit fix` was run.
- Full-suite Crossref and localStorage-environment failures remain outside this prompt.
- TQ-VSC-013 and all later prompts remain `NOT STARTED`.

## TQ-VSC-013 verification details

### Implementation

- Removed the client `logAuditEvent` writer and all client calls that previously supplied their own actor identity and details.
- Added a server-only `POST /api/projects/:projectId/audit-events` append path backed by Firebase Admin SDK.
- The server verifies the Firebase ID token, requires an email-bearing actor, loads the project through Admin Firestore, derives the actor's project role, and rejects non-members.
- Deterministic validation covers role changes, artifact approvals, dataset/analysis approval, AI-artifact disposition, source/claim verification, ethics changes, author sign-off, and exports. Each action is bound to one entity type; Viewer/Reviewer are rejected and role changes are Owner-only.
- Clients cannot provide event ID, project ID, actor, timestamp, before, or after fields. The server establishes ID/actor/project/timestamp and derives before/after from the existing project entity and its latest state-history entry.
- The audited entity must exist. Approval/disposition actions must match the entity's current approved/disposed state, snapshots must remain within a bounded size, rationale is required, and evidence identifiers are validated and deduplicated.
- New append records contain actor, action, entity type/id, before/after, project ID, timestamp, rationale, evidence IDs, and `trustedServerCreated: true`.
- Firestore rules deny client create/update/delete for `auditEvents`, including Owner clients. Admin writes remain append-only because the server uses document `create`, never overwrite/update.
- Added `isTrustedAuditEvent`; legacy/client-shaped records cannot masquerade as trusted history.
- Documented the server-only `FIREBASE_ADMIN_PROJECT_ID`; credentials use Application Default Credentials and no Admin secret is placed in a `VITE_*` variable.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/trustedAudit.test.ts src/tests/firebaseSecurityRules.test.ts src/tests/firebaseConfiguration.test.ts` — exit `0`; PASS, 3/3 files and 23/23 tests.
3. `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" XDG_CONFIG_HOME=/private/tmp/tehqiq-firebase-config npm run test:firestore-rules` — exit `0`; real Firestore Emulator PASS, 1/1 file and 8/8 tests. The added scenario proves an authenticated Owner cannot create a forged audit event.
4. `npm test` — exit `1`; 27/30 files passed, 223 tests passed and 2 failed out of 225 executed, with 8 emulator-only tests skipped because the general suite does not start the emulator. Remaining failures are the pre-existing Crossref network expectation and localStorage test-environment issue.
5. `npm run build` — exit `0`; PASS, 1,993 Vite modules transformed and the server bundle produced. Existing browser-`crypto` and large-chunk warnings remain.
6. `git diff --check` — exit `0`; PASS.

### Tests and compatibility

- Added seven trusted-audit unit tests covering all ten action/entity mappings, write-role enforcement, Owner-only role events, rejection of forged server fields, bounded request validation, complete trusted record creation, and legacy-event rejection.
- Updated static rules tests to require all client audit mutations to be false.
- Expanded the real emulator suite to prove Owner-level client forgery is denied.
- Existing stored audit documents are not rewritten. Optional legacy aliases permit reading them, but absence of the complete server-established shape and trusted marker prevents them from being treated as trusted.

### Remaining blockers and prompt boundary

- The trusted endpoint requires deployment Application Default Credentials and `FIREBASE_ADMIN_PROJECT_ID`; no live Firebase Admin deployment credentials were available for an end-to-end token test. Deterministic service tests, server compilation, and client-denial emulator tests passed.
- Privileged state mutations still occur through existing project workflows; this prompt secures the high-integrity audit collection and server append validation but does not redesign every state-transition endpoint.
- Firebase Admin installation reports thirteen dependency audit findings (twelve moderate, one high); no breaking blanket audit fix was run.
- Full-suite Crossref and localStorage-environment failures remain outside this prompt.
- TQ-VSC-014 and all later prompts remain `NOT STARTED`.

## TQ-VSC-014 verification details

### Implementation

- Removed the `URL.createObjectURL(file)` fallback from the research upload path. `uploadProjectFile` now either returns verified persistent metadata or rejects; it never returns a transient browser URL as upload success.
- Added deterministic SHA-256 calculation over the selected file bytes before upload.
- Cloud Storage object metadata carries project ID, uploader UID, SHA-256, MIME type, and researcher-upload provenance.
- Successful Firestore research-file metadata records carry the actual path returned by Cloud Storage, download URL, SHA-256, MIME type, size, project ID, uploader UID, timestamp, explicit `Persisted` state, and structured provenance.
- Firestore metadata is written only after object upload and durable download-reference resolution succeed. If that write fails, deletion of the incomplete uploaded object is attempted.
- Every failure throws `ProjectFileUploadError`, which exposes `Local / Unpersisted` and `researchFileRecordCreated: false` and states that no research-file record was created.
- Object filename path separators are neutralized before constructing the project-scoped object path.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/storagePersistence.test.ts` — exit `0`; PASS, 1/1 file and 5/5 tests.
3. `npx vitest run src/tests/storagePersistence.test.ts src/tests/firebaseConfiguration.test.ts src/tests/integration.test.ts` — exit `1`; the new storage suite and Firebase configuration suite passed. Combined result: 2/3 files and 13/14 tests passed. The only failure is the established integration environment issue where `window.localStorage.setItem` is not a function.
4. `npm test` — exit `1`; 28/30 executed files passed, 228/230 executed tests passed, with 1 emulator-only file and 8 tests skipped. The two failures are pre-existing: offline Crossref returns a network-failure message instead of the test's registry-not-found wording, and the jsdom localStorage implementation lacks `setItem` under the current Node option.
5. `npm run build` — exit `0`; PASS, 1,993 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — exit `0`; PASS.

### Tests and compatibility

- Added `src/tests/storagePersistence.test.ts` with deterministic checksum, complete successful metadata, object-upload failure, metadata-write cleanup, and no-object-URL regression coverage.
- No destructive migration is required. Existing file metadata documents remain readable. New successful records add required persistence/provenance fields; failed attempts never create a record.
- The upload function's intentional error contract is stricter: callers that previously received a misleading blob URL now receive an explicit failure and must keep the selected file local or ask the researcher to retry.

### Remaining blockers and prompt boundary

- Cloud Storage access rules remain absent and are explicitly assigned to TQ-VSC-015; they were not implemented in this prompt.
- Cleanup after a metadata-write failure is best effort. A provider failure during deletion may leave an unreferenced Storage object, but it still cannot create or return a successful research-file record.
- Full-suite Crossref and localStorage-environment failures remain outside this prompt.
- TQ-VSC-015 and all later prompts remain `NOT STARTED`.

## TQ-VSC-015 verification details

### Implementation

- Added private-by-default Cloud Storage rules. No path outside `projects/{projectId}/files/{fileId}` has client access.
- Reads require an authenticated owner or explicit member of the path's project, resolved from the existing Firestore project document.
- Creates and updates require Owner, Corresponding Author, Co-author, Supervisor, or Statistician; Viewer and other roles cannot write. Deletes are Owner-only.
- Creation requires the object not to exist, preventing an overwrite from using the less restrictive create grant. Update identity metadata is immutable and must remain tied to the path project and original uploader/checksum/provenance.
- Centralized rules policy caps research uploads at 25 MiB and allows only explicit text, CSV/TSV, JSON, PDF, Word, and Excel MIME types.
- Creation requires matching `projectId`, authenticated `uploaderUid`, a lowercase 64-character SHA-256, and `Researcher Upload` provenance in object metadata.
- Objects with `locked: "true"` metadata cannot be overwritten, unlocked, or deleted through client rules.
- Added Storage emulator configuration and a combined Firestore + Storage rules command because Storage membership checks use Firestore project documents.
- No malware scanning was added or claimed.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" XDG_CONFIG_HOME=/private/tmp/tehqiq-firebase-config npm run test:storage-rules` — exit `0`; real Firestore + Storage Emulator PASS, 1/1 file and 8/8 tests.
3. `npm test` — exit `1`; 28/30 executed files passed, 228/230 executed tests passed, with 2 emulator-only files and 16 tests skipped. The two failures are pre-existing: offline Crossref returns network-failure wording instead of registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 1,993 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Emulator acceptance coverage

- Authorized Co-author creation and member read succeed for a valid project-scoped file.
- Unauthenticated reads and writes fail.
- Viewer upload fails.
- A user authorized for project B cannot read or overwrite project A, and a project A owner cannot write through project B's path.
- Mismatched project/uploader metadata and unsupported executable MIME type fail.
- Files over the centralized 25 MiB limit fail.
- Locked artifacts cannot be overwritten, unlocked, or deleted.
- Unscoped paths are denied.

### Compatibility, blockers, and prompt boundary

- No data migration executes. Existing stored objects remain present, but private-by-default access applies when these rules are deployed. Legacy objects without required metadata remain readable to project members but cannot be overwritten until a deliberate migration or replacement creates policy-compliant metadata.
- The rules were verified locally against Firestore Emulator v1.22.0 and Cloud Storage rules runtime v1.1.3 on OpenJDK 21. Deployment to a live Firebase project was not requested or performed.
- Content-type checks are policy controls, not proof of file contents and not malware scanning.
- TQ-VSC-016 and all later prompts remain `NOT STARTED`.

## TQ-VSC-016 verification details

### Implementation

- Added reusable Express middleware that strictly parses a Bearer token and verifies it with Firebase Admin Auth.
- The middleware resolves project scope from the URL parameter or dedicated project header/body field, loads that project through Admin Firestore, and derives the actor's role from `ownerUid`/`members`. Frontend `userId`, email, role, owner, or membership claims are ignored.
- Added route-specific RBAC: standard project writers may use AI, drafting, methodology, analysis, and trusted-audit routes; Reviewer additionally may invoke peer review; all authenticated project roles may perform DOI lookup for the scoped project.
- Added route-specific serialized-body limits from 16 KiB for DOI lookup through 25 MiB for analysis, while retaining the server-wide parser ceiling.
- Added reusable per-actor/project/route rate-limit hooks with an in-process 60-request/minute policy and structured completion-audit hooks.
- Added safe authentication, authorization, rate-limit, size-limit, lookup, parser, and handler error responses. Raw token-verifier/provider error details remain server logs and are not returned to clients.
- Applied middleware to all seven sensitive POST endpoints. `/api/health` intentionally remains public.
- Added a shared client helper that gets a fresh token from the configured Firebase user's `getIdToken()` and supplies Authorization plus project scope. Updated every current API caller to use it.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/authMiddleware.test.ts src/tests/trustedAudit.test.ts src/tests/firebaseConfiguration.test.ts` — exit `0`; PASS, 3/3 files and 19/19 tests.
3. `npm test` — exit `1`; 29/31 executed files passed, 235/237 executed tests passed, with 2 emulator-only files and 16 tests skipped. The two failures are pre-existing: offline Crossref returns network-failure wording instead of registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 1,994 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Acceptance coverage

- Missing Authorization header returns 401 without invoking token verification.
- Invalid/expired token returns a generic 401 without leaking verifier internals.
- A valid authenticated non-member returns 403.
- A stored Viewer membership returns insufficient-role 403 for a writer-only route.
- A valid Co-author request reaches the handler with UID/email from the verified token and role from stored Firestore membership, even when the body supplies forged owner identity/role/membership fields.
- Rate-limit hook behavior is deterministic and tested.
- A route-audit test enumerates all seven sensitive endpoints and requires the reusable middleware at registration.

### Compatibility, blockers, and prompt boundary

- No data migration is required. API request authentication is intentionally stricter; unsigned legacy calls now fail closed.
- Firebase Not Configured returns 503. Real protected requests require Application Default Credentials plus `FIREBASE_ADMIN_PROJECT_ID`/`GCLOUD_PROJECT`, and clients require valid `VITE_FIREBASE_*` configuration and sign-in.
- The in-memory rate limiter is instance-local and resets on restart; a shared/distributed limiter remains a production deployment consideration.
- There are no server export endpoints in the inspected repository. Existing client-only export generation was not expanded or redesigned.
- TQ-VSC-017 and all later prompts remain `NOT STARTED`.

## TQ-VSC-017 verification details

### Implementation

- Added dependency-free deterministic runtime schemas with typed success/failure results for all non-audit API bodies: generic agent, section drafting, peer review, methodology proposal, DOI lookup, and analysis execution. The privileged audit endpoint continues using its existing strict action/entity/body validator.
- Validators reject non-object bodies, unsupported top-level fields, missing or wrong-typed fields, invalid enums/DOI syntax, non-finite numbers, over-bound collections/strings, mismatched authenticated project scope, malformed analysis entities/options, and incomplete research identifiers.
- Added typed structured-output contracts for generic agent, draft section, peer-review comments, and all eleven methodology fields. Exact keys, required fields, bounded strings/arrays, and finite numbers are enforced after JSON parsing.
- Generic agent calls now request JSON through the SDK response schema and return a validated `result` object instead of unvalidated model text.
- Drafting now requires every declared evidence/number/missing-information array. Invalid JSON or wrong structure returns a 502 validation failure.
- Peer review requires one or two complete comments; missing/empty/arbitrary comment structures are rejected.
- Methodology no longer converts missing model fields into `Researcher input required` after generation. The model must explicitly return every valid field; otherwise no proposal is accepted.
- External analysis-service responses must match the completed analysis envelope before being returned. Invalid external output is logged and execution proceeds through the existing deterministic native engine fallback.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/apiSchemas.test.ts src/tests/authMiddleware.test.ts src/tests/trustedAudit.test.ts` — exit `0`; PASS, 3/3 files and 22/22 tests.
3. `npm test` — exit `1`; 30/32 executed files passed and 243/245 executed tests passed, with 2 emulator-only files and 16 tests skipped. The only failures are pre-existing: offline Crossref returns network-failure wording instead of the test's registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 1,994 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Acceptance coverage

- Malformed privileged analysis bodies and forged/unsupported fields are rejected.
- Methodology body project scope must match the authenticated middleware project.
- Invalid JSON fails parsing and is never accepted as structured model output.
- Structurally malformed agent JSON is rejected.
- Draft JSON missing evidence arrays or containing non-finite numbers is rejected.
- Empty/incomplete peer-review output is rejected.
- Incomplete methodology JSON is rejected rather than filled; only all eleven explicit fields pass.
- Malformed agent, drafting, peer-review and DOI requests are rejected.

### Compatibility, blockers, and prompt boundary

- No persisted documents are migrated. Existing client request shapes are preserved except that malformed or extra top-level fields now fail closed.
- The generic agent success payload intentionally changes from `{ text }` to `{ result }`; the current caller only uses success/failure state and remains compatible.
- SDK response schemas constrain generation but are not trusted as validation; server runtime validation remains authoritative.
- TQ-VSC-018 and all later prompts remain `NOT STARTED`.

## TQ-VSC-018 verification details

### Implementation

- Added a required-field `ResearchArtifact` contract with project/type/title identity, creator/timestamps, source links, structured provenance, verification and approval states, version, optional content hash, demo/synthetic isolation, and lock state.
- Added deterministic backward-compatible adapters for sources, numeric evidence, methodology protocols, datasets, analysis plans, analysis outputs, tables, figures, manuscript sections, reviewer comments, and exports. Original domain records are neither deleted nor reshaped.
- Uploaded research-file metadata now implements the canonical uploaded-document envelope and uses the already calculated SHA-256 checksum as `contentHash`.
- Project Firestore reads, creates, and saves hydrate the canonical projection. Local-storage reads and the demo-project factory use the same adapter.
- Legacy metadata that does not exist is represented as `Not available`; no creator, timestamp, verification, approval, or provenance fact is invented.
- Canonical-only records such as uploaded documents are preserved when legacy projections refresh, and project-level demo status propagates to every adapted artifact.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/researchArtifacts.test.ts src/tests/storagePersistence.test.ts` — exit `0`; PASS, 2/2 files and 11/11 tests.
3. `npm test` — exit `1`; 31/33 executed files passed and 249/251 executed tests passed, with 2 emulator-only files and 16 tests skipped. The only failures are pre-existing: offline Crossref returns network-failure wording instead of the test's registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 1,995 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Acceptance coverage

- Every artifact category named by TQ-VSC-018 has a canonical representation; uploaded documents use the same contract at persistence time.
- Tests prove required canonical metadata, source relationships, checksums, provenance, approval/verification state, and demo/synthetic propagation.
- Existing domain arrays retain their identities during hydration and remain the authoritative application structures.
- Older sparse project documents with absent artifact collections hydrate successfully to an empty canonical projection.
- Existing canonical-only artifacts survive refresh instead of being discarded by legacy adapters.

### Compatibility, blockers, and prompt boundary

- No bulk Firestore migration or destructive data rewrite is required. `ProjectState.researchArtifacts` is optional for stored legacy records and populated at application boundaries.
- The canonical collection is currently a metadata projection; legacy domain collections remain authoritative until future prompts explicitly migrate individual workflows.
- The full-suite failures are unchanged environmental baseline failures and were not introduced by this prompt.
- TQ-VSC-019 and all later prompts remain `NOT STARTED`.

## TQ-VSC-019 verification details

### Implementation

- Added a project-level `EvidenceRecord` distinct from bibliographic source metadata. It records evidence/source identity, document version/hash, exact passage, page/section/paragraph-or-chunk location, extraction method and actor, bounded confidence, verification, researcher review, linked claims, timestamps, and demo/synthetic flags.
- Added deterministic creation validation: blank passages, unlocated evidence, absent extractor identity, and confidence outside 0–1 are rejected. Missing legacy document version/hash is explicitly `Not available`.
- AI-extracted evidence always begins `Needs Review` with pending researcher review. It cannot self-certify. Verification/rejection requires an authenticated researcher UID and non-empty review notes.
- Replaced the claim linker's abstract/placeholder fallback with exact required passage input. At least one concrete location field is mandatory, and the claim links to the new canonical evidence ID.
- Added non-destructive adapters for legacy `extractedPassages` and inline `linkedEvidence`. Only legacy passages with exact text and a concrete location are promoted; unlocated text is deliberately left inline.
- Added document-reader provenance UI for location, evidence ID, extraction method, document version/hash, extractor, confidence, and review state, with researcher verify/reject controls.
- Passage evidence also projects into the TQ-VSC-018 universal artifact collection and preserves source/claim relationships.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/evidenceRecords.test.ts src/tests/researchArtifacts.test.ts src/tests/storagePersistence.test.ts src/tests/writingEvidenceIntegrity.test.ts src/tests/accessibility.test.tsx` — exit `0`; PASS, 5/5 files and 33/33 tests.
3. Source scan for removed `Verified source passage`, `quotePassage ||`, and `Section 3.2` fallbacks — no matches.
4. `npm test` — exit `1`; 32/34 executed files passed and 255/257 executed tests passed, with 2 emulator-only files and 16 tests skipped. The only failures are pre-existing: offline Crossref returns network-failure wording instead of registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
5. `npm run build` — exit `0`; PASS, 1,996 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — exit `0`; PASS.

### Acceptance coverage

- Every new evidence record traces to a source ID, document version/hash state, exact passage, and at least one concrete location coordinate.
- Source metadata and passage evidence are separate records.
- AI extraction is never accepted as verified evidence without attributable researcher review.
- The reader exposes the provenance necessary to audit an evidence passage against its document.
- Backward-compatible adapters preserve traceable legacy passage evidence without inventing locations for untraceable text.

### Compatibility, blockers, and prompt boundary

- No destructive Firestore migration is required. `ProjectState.evidenceRecords` is optional and hydrated from traceable legacy data at existing read/create/save boundaries.
- Inline `SourceRecord.extractedPassages` and `ClaimItem.linkedEvidence` remain readable for existing projects. New claim links include a canonical `evidenceRecordId`.
- Claim-level graph cardinality and claim-verification gating remain existing behavior; those changes belong to TQ-VSC-020 and were not implemented here.
- The full-suite failures are unchanged baseline/environment failures and were not introduced by this prompt.
- TQ-VSC-020 and all later prompts remain `NOT STARTED`.

## TQ-VSC-020 verification details

### Implementation

- Added explicit `ClaimEvidenceLink` graph edges with claim/evidence IDs, Supports/Partially Supports/Contextual/Contradicts relationship, bounded confidence, independent verification and approval states, manuscript sentence IDs, attributable creation/review metadata, and demo/synthetic flags.
- Added `ManuscriptSentenceClaimLink` and deterministic sentence traversal resolving sentence → claim → graph edge → exact evidence passage → source → page/section/chunk.
- Added graph creation, idempotent pair upsert, attributable approve/reject review, integrity validation, sentence-link validation, and backward-compatible legacy-edge adaptation.
- Graph integrity detects orphan claims/evidence/sources, duplicate edges, invalid confidence, broken sentence links, missing evidence-to-claim backlinks, and demo contamination.
- Claim Matrix lets the researcher deliberately create new passage evidence or reuse a selected existing record, choose a supporting/contradicting relationship and confidence, review the graph edge, and inspect sentence-support traversal. It never selects the first source automatically.
- New edges always start `Unverified` / `Pending Review`; link review requires an authenticated researcher UID and rationale. Existing legacy links adapt to the same pending state instead of inheriting implied approval.
- Claim verification in the UI now requires a non-contradictory, researcher-verified evidence record and a verified/approved graph edge. Source IDs alone are no longer supplied as evidence IDs from this UI.
- Writing evidence accepts canonical graph evidence only when the claim is researcher reviewed, the passage is researcher verified, the edge is verified/approved, the relationship is not contradictory, and source provenance is verified. Legacy reviewed evidence remains backward-compatible.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/claimEvidenceGraph.test.ts src/tests/evidenceRecords.test.ts src/tests/researchArtifacts.test.ts src/tests/writingEvidenceIntegrity.test.ts src/tests/unit.test.ts src/tests/dataIntegrityRegression.test.ts src/tests/accessibility.test.tsx` — exit `0`; PASS, 7/7 files and 63/63 tests.
3. `npm test` — exit `1`; 33/35 executed files passed and 261/263 executed tests passed, with 2 emulator-only files and 16 tests skipped. The only failures are pre-existing: offline Crossref returns network-failure wording instead of registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 1,997 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Acceptance coverage

- A claim can link to multiple evidence records, and one evidence record can link to multiple claims with reciprocal backlinks.
- Contradiction is a first-class graph relationship and retains its direction through researcher review.
- Duplicate/orphan/broken/backlink integrity failures are deterministic and test-covered.
- “Why is this sentence supported?” traversal exposes exact passage and source location rather than stopping at source metadata.
- Graph creation and legacy adaptation never auto-verify or auto-approve links.

### Compatibility, blockers, and prompt boundary

- No destructive data migration is required. `claimEvidenceLinks` and `manuscriptSentenceClaimLinks` are optional stored collections hydrated alongside existing evidence/artifact adapters.
- Existing inline `linkedEvidence` remains readable. Traceable legacy entries receive graph edges only when their canonical passage record exists, and those edges start pending human review.
- The generic lower-level claim state machine retains backward-compatible call signatures; the Claim Matrix applies the new graph eligibility gate. Server-authoritative transition hardening belongs to TQ-VSC-021 and was not implemented.
- The full-suite failures are unchanged baseline/environment failures and were not introduced by this prompt.
- TQ-VSC-021 and all later prompts remain `NOT STARTED`.

## TQ-VSC-021 verification details

### Implementation

- Added a Firebase Admin transaction endpoint for eight sensitive transitions: Source Verified, Claim Verified, Dataset Approved/Locked, Analysis Approved for Manuscript, Manuscript Locked, Ethics Approved, Author Signed Off, and Submission Ready.
- The server derives actor identity/role from verified authentication and stored project membership, rejects unsupported/client-forged fields, enforces bounded rationale/evidence IDs, and uses optimistic integrity revisions.
- Transition-specific prerequisites require source provenance, approved graph evidence, dataset anonymization/review, analysis dataset/plan provenance, prior manuscript approval, researcher-supplied ethics identifiers when required, attributable author authority, and complete submission prerequisites.
- Each successful transaction atomically updates the current Firestore project, creates an immutable trusted `StateTransitionRecord` in `/stateTransitions`, and advances a SHA-256 digest/revision covering privileged states and locked content.
- Existing integrity digests are checked before every transition. A direct privileged mutation, stale revision, locked manuscript rewrite, or locked dataset identity change blocks the next trusted operation with a conflict.
- Firestore rules deny all client create/update/delete operations on transition history and prevent clients from changing trusted integrity metadata or `submissionState`, including Owner clients.
- Source verification, claim verification, dataset approval/lock, analysis manuscript approval, and manuscript lock UI paths now request the trusted server transition and replace local state only with the returned trusted project.
- Ethics approval, author sign-off, and Submission Ready are supported by the trusted service even though the current inspected UI exposes no direct privileged mutation control for those states.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/trustedTransitions.test.ts src/tests/firebaseSecurityRules.test.ts src/tests/authMiddleware.test.ts src/tests/unit.test.ts src/tests/dataIntegrityRegression.test.ts src/tests/claimEvidenceGraph.test.ts src/tests/lifecycle.test.ts` — exit `0`; PASS, 7/7 files and 69/69 tests.
3. `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" XDG_CONFIG_HOME=/private/tmp/tehqiq-firebase-config npm run test:firestore-rules` — sandbox attempt could not bind emulator ports; rerun with approved local-port access exited `0`, PASS, 1/1 file and 10/10 real emulator tests.
4. `npm test` — exit `1`; 34/36 executed files passed and 271/273 executed tests passed, with 2 emulator-only files and 18 tests skipped. The only failures are pre-existing: offline Crossref returns network-failure wording instead of registry-not-found wording, and jsdom localStorage lacks `setItem` under the current Node option.
5. `npm run build` — exit `0`; PASS, 1,998 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — exit `0`; PASS.

### Acceptance coverage

- Direct client writes cannot forge trusted integrity, Submission Ready state, or immutable transition records, including as project Owner.
- Server validation rejects unsupported fields, insufficient roles, missing prerequisites, stale revisions, repeated locks/sign-offs, and integrity mismatches.
- Tests exercise all eight named sensitive transitions and verify immutable server provenance/hashes.
- Direct privileged-state mutation and direct rewriting of locked manuscript content are deterministically detected after the integrity baseline exists.

### Compatibility, blockers, and prompt boundary

- Existing projects require no bulk migration. Their first trusted transition establishes revision 1 and a privileged-state digest from the current record.
- The system cannot retrospectively prove whether a legacy project was manipulated before its first integrity baseline; it preserves that state as pre-baseline legacy data rather than fabricating attestation.
- Admin transitions require configured Firebase Admin credentials. Offline/local-only projects cannot claim trusted sensitive transitions.
- The two full-suite failures are unchanged baseline/environment failures and were not introduced by this prompt.
- TQ-VSC-022 and all later prompts remain `NOT STARTED`.

## TQ-VSC-022 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Normalized Crossref, OpenAlex, DataCite, Europe PMC, and PubMed/NCBI E-utilities adapters behind one result contract with stable provider IDs, provider record IDs, identifier maps, one `retrievedAt` value, and field-level provenance.
- Removed invented fallback titles, authors, publication years, venues, and publishers from provider lookup and Crossref candidate search. Missing provider fields remain absent.
- Added deterministic `not_found`, `rate_limited`, `provider_error`, `network_error`, `invalid_request`, and `invalid_response` classifications, including HTTP status and numeric `Retry-After` preservation where available.
- Implemented direct PMID lookup and DOI-to-PMID resolution with NCBI ESearch/ESummary. PubMed is available without a key at the normal three-request-per-second allowance and accepts an optional server-side API key for the higher ten-request-per-second allowance.
- The protected DOI proxy supplies optional `NCBI_API_KEY`/`NCBI_EMAIL`, preserves DOI/PMID/PMCID and provider identity, and reuses the adapter retrieval timestamp instead of generating inconsistent provenance timestamps.

### Files changed and migrations

- `src/lib/metadataProviders.ts`
- `src/types.ts`
- `server.ts`
- `src/tests/metadataProviderAdapters.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No destructive data migration is required. Optional `providerId` fields are backward-compatible with existing provenance records; previously stored records remain readable.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/metadataProviderAdapters.test.ts` — exit `0`; PASS, 1/1 file and 27/27 tests.
3. `npm test` — exit `1`; 35/37 executed files passed and 298/300 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures are unchanged pre-existing failures: the network-dependent Phase 3 Crossref assertion expects not-found wording while the environment returns a truthful network error, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 1,998 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. Provider fallback scan for `Untitled`, `Unknown Author`, `Unspecified`, current-year fallbacks, and the obsolete private-key requirement — no matches.
6. `git diff --check` — exit `0`; PASS before the tracker update and rerun after documentation completion.

### Acceptance coverage, compatibility, and blockers

- Mocked success, not-found, rate-limit, provider HTTP error, and network error behavior passes for all five adapters.
- Tests cover no-key PubMed operation, optional-key query propagation, DOI ESearch resolution, identifier preservation, consistent timestamps/provenance, and absent-field behavior.
- `NCBI_API_KEY` and `NCBI_EMAIL` are optional server configuration; their absence does not disable PubMed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-022.
- TQ-VSC-023 and all later prompts remain `NOT STARTED`.

## TQ-VSC-023 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a standalone specialist-provider layer for Unpaywall-compatible DOI OA discovery, arXiv metadata lookup/search, and DOAJ metadata lookup/search without implementing TQ-VSC-024's multi-provider `SearchExecution` orchestration.
- Declared each provider's capabilities, supported identifiers, required/optional configuration, rate-handling contract, and provider-supplied-links-only full-text policy.
- Unpaywall requires a configured contact email and otherwise returns `not_configured` without making a request. Its OA state and access/PDF URLs are preserved only when returned by the API.
- arXiv supports modern/legacy/versioned arXiv IDs and query search, parses official Atom metadata, and declares the provider-requested three-second inter-request interval.
- DOAJ supports DOI and DOAJ record lookup plus bounded article metadata search. Full-text links and licenses are retained only when present in the DOAJ response.
- All adapters preserve stable provider/record IDs, supplied DOI/arXiv/DOAJ identifiers, one retrieval timestamp, field-level provenance, HTTP status, numeric `Retry-After`, and truthful not-found/rate/provider/network states.

### Files changed and migrations

- `src/lib/specialistDiscoveryProviders.ts` (created)
- `src/tests/specialistDiscoveryProviders.test.ts` (created)
- `src/lib/metadataProviders.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The shared provider identifier/error unions were extended additively; persisted schemas were not rewritten.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/specialistDiscoveryProviders.test.ts` — exit `0`; PASS, 1/1 file and 22/22 tests.
3. `npx vitest run src/tests/metadataProviderAdapters.test.ts src/tests/specialistDiscoveryProviders.test.ts` — exit `0`; PASS, 2/2 files and 49/49 tests.
4. `npm test` — exit `1`; 36/38 executed files passed and 320/322 executed tests passed, with 2 emulator-only files and 18 tests skipped. The only failures are the unchanged baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
5. `npm run build` — exit `0`; PASS, 1,998 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Mocked tests cover success, not configured, not found, rate-limited, provider error, network error, invalid identifiers, identifier normalization, provenance/timestamp preservation, declared capabilities/configuration/rate handling, bounded search, and absent access-link behavior.
- No adapter scrapes HTML, bypasses access controls, downloads copyrighted full text, or synthesizes access/PDF URLs.
- Configuration and access discovery are adapter-level in this prompt. Server routing and multi-provider search execution belong to TQ-VSC-024 and were not implemented.
- The full suite remains red only for the two established baseline/environment failures; neither was introduced by TQ-VSC-023.
- TQ-VSC-024 and all later prompts remain `NOT STARTED`.
