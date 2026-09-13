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

## TQ-VSC-024 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added backward-compatible `SearchExecution`, `SearchProviderExecution`, `SearchExecutionSource`, and concept/provider lifecycle types. An execution preserves `searchId`, project scope, context, concepts/synonyms, provider-specific syntax, selected providers, filters, design/execution/review/import timestamps, returned/imported source IDs, aggregate/per-provider counts, warnings, and errors.
- Added deterministic query compilation for Crossref, OpenAlex, PubMed, Europe PMC, arXiv, and DOAJ. A fixed design and design timestamp reproduce the same execution record and exact syntax.
- Added six distinct executable provider adapters. Every selected provider runs through its own adapter and records its own status, timing, count, source IDs, warnings, and errors; one provider failure does not get relabeled as another provider or erase successful results.
- Added a protected project-writer endpoint with project-scope matching, strict bounded request validation, existing authentication/RBAC/rate/body controls, and server-side provider execution.
- Replaced the query-copy-only Search Planner with the requested design/edit → select → execute → review → import workflow and mounted it in Literature Search. Import requires explicit researcher selection and creates `Unverified` source metadata with search/provider provenance.
- Crossref-only execution remains explicitly Crossref-only. It cannot produce provider execution records or result attribution for unexecuted providers.

### Files changed and migrations

- `src/lib/searchExecution.ts` (created)
- `src/tests/searchExecution.test.ts` (created)
- `src/types.ts`
- `src/server/apiSchemas.ts`
- `server.ts`
- `src/components/views/SearchPlannerView.tsx`
- `src/App.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.searchExecutions` is optional, and legacy `searchStrategies` remains readable for backward compatibility.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/searchExecution.test.ts src/tests/metadataProviderAdapters.test.ts src/tests/specialistDiscoveryProviders.test.ts` — exit `0`; PASS, 3/3 files and 57/57 tests.
3. `npm test` — exit `1`; 37/39 executed files passed and 328/330 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,000 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Tests verify reproducible design construction, distinct syntax for all six providers, one independent adapter call per selected provider, exact provider/result attribution, stable returned source IDs, per-provider errors/rate warnings, missing-adapter truthfulness, bounded project-scoped validation, and the Crossref-only mislabeling regression.
- Search results are metadata candidates, not verified evidence. Imports stay `Unverified`; records missing title/year/venue are labeled as unavailable and require researcher input before import rather than receiving invented compatibility values.
- Provider result limits are bounded to 100 per execution/provider. The server has existing request rate limiting, while provider-level rate responses are preserved for review; distributed scheduling/backoff is not implemented.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-024.
- TQ-VSC-025 and all later prompts remain `NOT STARTED`.

## TQ-VSC-026 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- TQ-VSC-025 is not implemented. Added only the minimum backward-compatible `ApprovedSearchPlan` contract required by this prompt: project scope, exact context/concepts/provider syntax/filters, and attributable researcher approval. No search-strategy proposal agent was implemented.
- Added a deterministic `LiteratureRetrievalAgent` that orchestrates only the real Crossref, OpenAlex, PubMed, Europe PMC, arXiv, and DOAJ tools already implemented by TQ-VSC-024. No LLM participates in retrieval or bibliographic record creation.
- The agent rejects missing/mismatched approval before invoking any tool, limits the callable tool map to providers named in the approved plan, and passes each provider its exact approved syntax and filters.
- Output contains only actual successful provider records, normalized metadata/provenance, provider failures, normalization warnings, and the complete reproducible `SearchExecution` envelope.
- Provider errors yield `Partial` or `Failed` status. The agent never creates sources (`createdSourceIds` is structurally always an empty tuple); records returned alongside a provider failure are deterministically discarded from agent records and execution provenance.
- Added a protected, verified-email project-writer endpoint with project-scope validation, strict allowed fields, attributable approval checks, bounded syntax/result limits, and existing API rate/body controls.

### Files changed and migrations

- `src/lib/literatureRetrievalAgent.ts` (created)
- `src/tests/literatureRetrievalAgent.test.ts` (created)
- `src/types.ts`
- `src/server/apiSchemas.ts`
- `server.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The approved-plan and retrieval-result types are additive and no new persisted collection is required.

### Verification and tests

1. Clean-boundary check after superseding TQ-VSC-025: `git status --short --branch && npm run lint` — clean `main` at TQ-VSC-024 checkpoint; typecheck PASS.
2. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
3. `npx vitest run src/tests/literatureRetrievalAgent.test.ts src/tests/searchExecution.test.ts src/tests/metadataProviderAdapters.test.ts src/tests/specialistDiscoveryProviders.test.ts` — exit `0`; PASS, 4/4 files and 64/64 tests.
4. `npm test` — exit `1`; 38/40 executed files passed and 335/337 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
5. `npm run build` — exit `0`; PASS, 2,000 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Tests cover approved-plan schema/project scope, attributable approval, exact provider syntax, allowed-tool isolation, actual record/provenance preservation, total failure, partial success, adversarial records returned alongside failure, and pre-tool rejection of unapproved plans.
- A provider failure cannot generate a source: total/partial/adversarial failure paths all retain `createdSourceIds: []`, and failed-provider records are absent from both agent records and normalized `SearchExecution` results/source IDs.
- This prompt exposes a controlled server agent endpoint but does not add automatic source persistence or a retrieval UI; researcher review/import remains the existing TQ-VSC-024 boundary.
- TQ-VSC-025 remains `NOT STARTED`; only its minimum approved-plan input contract was added as permitted prerequisite compatibility. TQ-VSC-027 and all later prompts remain `NOT STARTED`.

## TQ-VSC-027 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS. Built on the completed, uncommitted TQ-VSC-026 working tree without modifying its behavior.
- Added deterministic source deduplication with identifier priority: canonicalized DOI, PMID, PMCID, arXiv ID, then named other stable identifiers and retained provider aliases.
- When stable identifiers are absent and non-conflicting, bibliographic matching requires exact punctuation/diacritic-insensitive normalized title plus the same publication year and exact normalized first author. Partial/vague title similarity, different years/authors, or conflicting same-scheme stable IDs do not merge.
- Merged records retain a stable canonical source ID, every provider/source alias and identifier, per-field preferred source IDs, chosen field-level provenance, and all differing field values as `Unresolved` conflicts. No conflicting value is silently treated as verified.
- Canonical preference is deterministic: an already-established canonical record, then verified metadata, then metadata completeness, then lexical source ID. The upsert boundary preserves an existing library ID so evidence/source relationships are not orphaned by later imports.
- Routed direct DOI, BibTeX/RIS/CSL, candidate, and multi-provider search imports through the central application upsert boundary. DOI imports now preserve returned PMID/PMCID/provider record ID and use one source ID consistently in transition history.

### Files changed and migrations

- `src/lib/sourceDeduplication.ts` (created)
- `src/tests/sourceDeduplication.test.ts` (created)
- `src/types.ts`
- `src/App.tsx`
- `src/components/views/SourceLibraryView.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. Canonical ID, arXiv/other stable IDs, provider aliases, preferred field sources, and conflict collections are optional fields populated on new duplicate merges. Legacy sources remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/sourceDeduplication.test.ts src/tests/literatureRetrievalAgent.test.ts src/tests/searchExecution.test.ts` — exit `0`; PASS, 3/3 files and 25/25 tests.
3. `npm test` — exit `1`; 39/41 executed files passed and 345/347 executed tests passed, with 2 emulator-only files and 18 tests skipped. The only failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,002 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Duplicate fixtures cover DOI variants, PMID, PMCID, modern/versioned arXiv IDs, other stable identifier schemes, and conservative exact bibliographic matching.
- Conflict fixtures verify PMID-linked records with disagreeing DOI/title values merge under one canonical source while retaining both provider values, their provenance, an explicit preferred source, and `Unresolved` conflict state.
- Negative fixtures verify vague title similarity, changed year/author, and conflicting DOI-only records never merge.
- Determinism and incremental-upsert fixtures verify input order stability and preservation of the existing canonical library ID while accepting missing fields from a richer alias.
- Existing evidence records that reference a previously imported source ID remain stable because incremental imports prefer the established canonical ID. No global rewrite of historical source IDs was performed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-027.
- TQ-VSC-028 and all later prompts remain `NOT STARTED`.

## TQ-VSC-028 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a project-scoped, additive eligibility-criteria contract. Each criterion is explicitly approved by an attributable researcher and contains deterministic title/abstract terms plus its Include/Exclude role.
- Added a deterministic `LiteratureScreeningAgent` that returns only `Suggested Include`, `Suggested Exclude`, or `Uncertain`, with criterion IDs, per-criterion reasons, confidence, and the immutable proposal label `AI Proposal — Researcher Review Required`.
- Exclusion matches take precedence. An Include suggestion requires every approved inclusion criterion to match and no exclusion to match. Missing criteria or non-deterministic criteria fail safely to `Uncertain`; missing abstracts remain explicitly disclosed as title-only screening.
- Added the mounted Literature Screening Workbench in the existing Literature & Gap step. It supports explicit criterion approval, per-source suggestion runs, separate researcher decisions, required rationale, attributable actor metadata, and append-only-in-record decision/override audit events.
- A suggestion never populates a researcher decision. The workbench displays `Not decided` until a researcher explicitly records Included, Excluded, or Uncertain.

### Files changed and migrations

- `src/lib/literatureScreeningAgent.ts` (created)
- `src/components/views/LiteratureScreeningWorkbench.tsx` (created)
- `src/tests/literatureScreeningAgent.test.ts` (created)
- `src/types.ts`
- `src/App.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.screeningCriteria` and `ProjectState.literatureScreening` are optional, so existing stored projects load unchanged and hydrate to empty workbench collections at render time.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/literatureScreeningAgent.test.ts src/tests/sourceDeduplication.test.ts src/tests/literatureRetrievalAgent.test.ts` — exit `0`; PASS, 3/3 files and 22/22 tests.
3. `npm test` — exit `1`; 40/42 executed files passed and 350/352 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Tests cover include, exclude, uncertain/missing-input, title-only abstract absence, proposal/researcher-decision separation, required rationale, actor attribution, suggestion preservation, and explicit override auditing.
- Screening is intentionally deterministic and limited to literal approved terms; nuanced semantic assessment remains `Uncertain` unless a future validated AI evaluator is configured. This limitation is visible rather than masked with fabricated certainty.
- Decision audit events are persisted with the project record but are not yet trusted-server immutable events; server-side screening transition hardening was not required by this prompt and remains a risk for later architecture work.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-028.
- TQ-VSC-029 and all later prompts remain `NOT STARTED`.

## TQ-VSC-029 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a unified deterministic router recognizing PDF, DOCX, PPTX, XLS/XLSX, CSV/TSV, JSON, TXT, Markdown, TeX, common image formats, common audio formats, and common video formats by extension with MIME fallback. Unknown inputs are explicitly `Unsupported`.
- Added the complete `DocumentIngestionJob` lifecycle vocabulary: `Uploaded`, `Queued`, `Processing`, `Parsed`, `Requires Review`, `Failed`, and `Unsupported`, with timestamped status history and truthful diagnostics.
- Every routed job preserves project/file identity, byte size, content SHA-256, category, actor, demo/synthetic isolation, parser provenance, extracted blocks, warnings, and errors.
- Connected XLS/XLSX, CSV/TSV, and JSON routes directly to the existing `parseAndProfileDataset` implementation. The job retains the resulting dataset, matching dataset/job hash, parser provenance, and a bounded extracted table preview. Parsing or PII warnings produce `Requires Review` rather than silent acceptance.
- Added deterministic paragraph-block parsing for TXT, Markdown, and TeX. Empty text requires review. Rich-document, image/OCR, and audio/video inputs are recognized and remain `Queued` with explicit `Not Configured` warnings because TQ-VSC-030/031 parsers were not implemented.
- Added a typed adapter seam so later parsers can return structured blocks, provenance, warnings, and either `Parsed` or `Requires Review`; thrown adapter errors become `Failed` without fabricated output.

### Files changed and migrations

- `src/lib/documentIngestionRouter.ts` (created)
- `src/tests/documentIngestionRouter.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.documentIngestionJobs` is optional, and all new job, status, block, and parser-provenance types are additive. Existing stored projects remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/documentIngestionRouter.test.ts src/tests/storagePersistence.test.ts` — exit `0`; PASS, 2/2 files and 38/38 tests.
3. `npm test` — exit `1`; 41/43 executed files passed and 383/385 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Parameterized fixtures verify routing for every requested category, including both XLS/XLSX and CSV/TSV variants, plus MIME fallback and unknown-format rejection.
- Lifecycle fixtures cover `Uploaded`, `Queued`, `Processing`, `Parsed`, `Requires Review`, `Failed`, and `Unsupported`; no recognized-but-unconfigured parser claims to have parsed content.
- Fixtures verify SHA-256 preservation, dataset/job hash consistency, dataset connection, bounded extracted blocks, parser provenance, warnings, failures, and status history.
- TQ-VSC-030 rich-document parsing and TQ-VSC-031 media transcription remain intentionally unimplemented. Their categories queue at a typed adapter boundary with explicit `Not Configured` warnings.
- Jobs are modeled for backward-compatible project persistence, but no new upload UI or server queue was required by this prompt; callers must persist returned jobs through an authorized project path.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-029.
- TQ-VSC-030 and all later prompts remain `NOT STARTED`.

## TQ-VSC-030 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Confirmed that Python/Docling is not present in the repository/runtime and did not fabricate a local parser. Added a configurable self-hosted/Cloud Run Docling-compatible provider using the server-side `DOCUMENT_PARSER_SERVICE_URL` environment variable.
- Added a typed rich-document provider interface and adapter factory for PDF, DOCX, and PPTX routes. The adapter posts bounded structured JSON containing project/artifact identity, filename, MIME type, format, and base64 file bytes to the configured `/parse` service endpoint.
- Added strict runtime validation for parser identity/version, review state, warnings, block IDs/types, table rows, page numbers, section names, table references, and image references. Malformed, provenance-free, oversized, non-JSON, or HTTP-error responses fail closed through the ingestion router.
- Extended extracted blocks additively with `Image` block type plus page, section, table, and image reference fields. Normalization preserves those references both as typed fields and a deterministic source-location string.
- Missing/invalid service configuration returns `Requires Review`, no blocks, and `DOCUMENT_PARSER_SERVICE_URL Not Configured`; it can never report `Parsed`. A configured service that returns no blocks also resolves to `Requires Review` regardless of its claimed state.
- Added bounded request timeouts and response-size enforcement. Parser-returned warnings and `requiresReview` are preserved rather than silently upgraded.

### Files changed and migrations

- `.env.example`
- `src/lib/richDocumentParser.ts` (created)
- `src/tests/richDocumentParser.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. New extracted-block reference fields and the `Image` block type are additive. Existing ingestion jobs and stored projects remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/richDocumentParser.test.ts src/tests/documentIngestionRouter.test.ts` — exit `0`; PASS, 2/2 files and 40/40 tests.
3. `npm test` — exit `1`; 42/44 executed files passed and 390/392 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Mocked integration fixtures exercise PDF, DOCX, and PPTX through the real TQ-VSC-029 router and confirm the outbound request contract and `Parsed` lifecycle.
- Fixtures verify exact preservation of page/section/table/image references, provider ID/version, service warnings, `Requires Review`, malformed-response failure, and the no-block fail-closed rule.
- Both direct-provider and full-router fixtures prove an absent `DOCUMENT_PARSER_SERVICE_URL` never reports `Parsed`.
- Deployment must provide a reachable trusted parser service and apply its own authentication/network policy. This prompt does not claim Docling availability or parsing quality without that service.
- TQ-VSC-031 media transcription remains intentionally unimplemented; image/audio/video routes remain at the TQ-VSC-029 Not Configured boundary.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-030.
- TQ-VSC-031 and all later prompts remain `NOT STARTED`.

## TQ-VSC-031 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Confirmed no Whisper or transcription runtime exists in the repository and did not fabricate transcripts. Added a configurable Whisper-compatible/self-hosted provider using the server-only `TRANSCRIPTION_SERVICE_URL`.
- Added a mandatory per-request privacy-routing hook. The hook receives project/artifact/file identity, media type, MIME type, and byte size before transmission. Missing policy or a blocked decision sends no bytes, creates no transcript, and returns `Requires Review` with an explicit diagnostic.
- Added strict runtime validation for provider ID/version, transcript version, warnings, language/confidence, segment IDs/text, monotonic timestamps, segment confidence, and optional speaker/language metadata. HTTP, malformed JSON, schema, timestamp, and size failures fail closed through the TQ-VSC-029 ingestion lifecycle.
- Audio/video outputs retain timestamped extracted blocks plus a structured transcript with exact segments, language metadata, confidence/speaker data when supplied, provider/version provenance, privacy route, transcript version, locally computed SHA-256, and `Needs Review` state.
- Transcription output always requires researcher review before evidence use. Empty provider output creates no transcript and remains `Requires Review`; no missing transcript content is invented.

### Files changed and migrations

- `.env.example`
- `src/lib/mediaTranscriptionProvider.ts` (created)
- `src/tests/mediaTranscriptionProvider.test.ts` (created)
- `src/lib/documentIngestionRouter.ts`
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `DocumentIngestionJob.transcript`, transcript/segment contracts, and timestamp/language/confidence/speaker block fields are optional additive fields. Existing jobs and stored projects remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. Initial focused run identified one overly broad test-message expectation while the implementation correctly failed closed; the expectation was aligned to the precise diagnostic.
3. `npx vitest run src/tests/mediaTranscriptionProvider.test.ts src/tests/documentIngestionRouter.test.ts` — exit `0`; PASS, 2/2 files and 40/40 tests.
4. `npm test` — exit `1`; 43/45 executed files passed and 397/399 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
5. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Fixtures prove absent service configuration and absent privacy routing never call a provider and never create a transcript.
- A blocked privacy decision is enforced before network transmission, while approved self-hosted routes preserve outbound privacy-route attribution.
- Mocked audio and video integrations preserve timestamps, language, language confidence, segment confidence, speaker, version, provider provenance, locally calculated transcript hash, and `Needs Review` state.
- Failure fixtures cover provider HTTP errors and invalid timestamps, with no partial transcript or blocks accepted.
- Deployment must provide a reachable trusted transcription service and an application privacy router. The repository does not claim Whisper availability or transcript accuracy without these controls.
- TQ-VSC-032 and all later prompts remain `NOT STARTED`.

## TQ-VSC-032 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic full-text chunk model retaining `sourceId`, project/job identity, original document SHA-256 and version, global chunk index, exact text, page/section or media timestamps, demo/synthetic flags, and parser/block provenance.
- Added surrounding-context references containing original extracted-block ID/location, exact character start/end offsets, and previous/next chunk IDs. Chunk IDs are deterministic hashes of the document/source/version/block/index/offset/text identity and do not change with processing time.
- Added bounded whitespace-aware chunk splitting with configurable maximum and overlap. Text blocks are chunked exactly; table rows are serialized without inference. Image/non-text blocks and text blocks without an original location are skipped with explicit warnings rather than becoming untraceable retrieval units.
- Added `traceChunkToDocumentLocation`, which verifies project, ingestion job, document hash, parser, block, location, offsets, and reconstructed text before resolving a chunk to its original extracted block. Tampered text or provenance fails closed.
- Kept chunk provenance independent of embeddings: no embedding provider, model, vector, or embedding-version field is part of the chunk schema or chunking function.

### Files changed and migrations

- `src/lib/fullTextChunks.ts` (created)
- `src/tests/fullTextChunks.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.fullTextChunks` and all chunk/context/provenance contracts are optional additive fields. Existing ingestion jobs and stored projects remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/fullTextChunks.test.ts src/tests/documentIngestionRouter.test.ts src/tests/richDocumentParser.test.ts src/tests/mediaTranscriptionProvider.test.ts` — exit `0`; PASS, 4/4 files and 53/53 tests.
3. `npm test` — exit `1`; 44/46 executed files passed and 403/405 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Fixtures verify source/document identity, document version/hash, page/section, media timestamps, chunk index, exact text, parser/block provenance, adjacent context references, deterministic IDs, overlap splitting, and table handling.
- Every emitted fixture chunk successfully resolves through `traceChunkToDocumentLocation`; text, location, or identity tampering returns no match.
- Invalid document state/hash/version/parser provenance fails closed. Blocks lacking extractable content or original location generate warnings and no chunks.
- Chunk creation is implemented as an explicit post-ingestion utility; callers must persist returned chunks through an authorized project path. Retrieval indexing/vector storage was not added because embeddings and retrieval infrastructure are outside this prompt.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-032.
- TQ-VSC-033 and all later prompts remain `NOT STARTED`.

## TQ-VSC-033 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a structured `EvidenceExtractionAgent` contract that accepts only a bounded set of supplied full-text chunks plus a project-scoped question/claim. All chunks must share project, source, document hash, and document version before the extraction tool is invoked.
- Output contains a proposition, exact passages/chunk IDs, explicit context/population/method/result/limitations fields, Supports/Contradicts/Neutral/Unclear classification, and bounded confidence.
- Available factual fields and the proposition must be verbatim-supported by their cited supplied chunks. Exact passages must be literal substrings of their named chunk. Unknown IDs, invented text, extra fields, malformed classifications/confidence, and mixed provenance fail closed.
- Missing fields require the exact `Not available in supplied chunks.` state and cannot cite evidence. The agent never fills absent information with plausible content.
- Accepted output creates deterministic canonical `EvidenceRecord` IDs while preserving source ID, document hash/version, chunk reference, page/section, exact passage, extractor identity, confidence, and optional linked claim. Every proposal begins `Needs Researcher Review`; every generated evidence record begins `Needs Review` with pending human review.
- The extraction boundary accepts an injected proposal tool but does not invoke unrestricted model knowledge or silently fall back when no extractor is configured.

### Files changed and migrations

- `src/lib/evidenceExtractionAgent.ts` (created)
- `src/tests/evidenceExtractionAgent.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.evidenceExtractionProposals` and the extraction proposal/field/passage contracts are optional additive fields. Existing evidence records, chunks, and stored projects remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/evidenceExtractionAgent.test.ts src/tests/fullTextChunks.test.ts src/tests/evidenceRecords.test.ts` — exit `0`; PASS, 3/3 files and 19/19 tests.
3. `npm test` — exit `1`; 45/47 executed files passed and 410/412 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Positive fixtures verify proposition, exact passage/chunk ID, source/document provenance, explicit evidence dimensions, relationship/confidence, deterministic evidence IDs, and initial researcher-review states.
- Hallucination traps reject invented propositions and invented context, population, method, result, or limitations even when a real chunk ID is attached.
- Additional traps reject non-exact passages, unknown chunk IDs, fabricated missing-state text, evidence links on missing fields, unsupported output keys, invalid relationship/confidence, and mixed-source document chunks.
- Verbatim grounding is intentionally conservative: abstractive paraphrases are rejected even when semantically reasonable because deterministic support cannot otherwise be proven at this boundary.
- A configured model/tool and protected persistence/API integration remain deployment concerns; this prompt implements and tests the agent/domain boundary without adding TQ-VSC-034 synthesis behavior.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-033.
- TQ-VSC-034 and all later prompts remain `NOT STARTED`.

## TQ-VSC-034 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a structured `LiteratureSynthesisAgent` boundary that receives only supplied `EvidenceRecord` objects and rejects any record not both `Researcher Verified` and backed by attributable reviewer identity/timestamp before invoking the synthesis tool.
- Output includes themes, supporting and conflicting evidence IDs, methodological differences, context differences, limitations, unresolved questions, and candidate synthesis statements. All collections use a deterministic shared item contract and stable generated item IDs.
- Every `Evidence-Grounded` factual item must carry at least one supporting or conflicting evidence ID. Every ID must refer to the supplied researcher-verified evidence set; unknown IDs and duplicate input identities fail closed.
- One evidence record cannot be labeled as both supporting and conflicting within the same item. Unsupported content with no evidence link is accepted only when explicitly classified `Interpretation` or `Hypothesis`, keeping it distinct from factual synthesis.
- Schema validation rejects extra fields, invalid classifications, malformed collections, and unbounded text/arrays. Accepted synthesis remains a proposal with `Needs Researcher Review` and retains its synthesizer identity and aggregate source evidence IDs.

### Files changed and migrations

- `src/lib/literatureSynthesisAgent.ts` (created)
- `src/tests/literatureSynthesisAgent.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.literatureSynthesisProposals` and the synthesis proposal/item contracts are optional additive fields. Existing evidence and project records remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/literatureSynthesisAgent.test.ts src/tests/evidenceExtractionAgent.test.ts src/tests/evidenceRecords.test.ts` — exit `0`; PASS, 3/3 files and 25/25 tests.
3. `npm test` — exit `1`; 46/48 executed files passed and 422/424 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Positive fixtures cover all required synthesis collections, support/conflict attribution, aggregate evidence identity, stable item IDs, synthesizer attribution, and initial researcher-review state.
- Parameterized schema fixtures prove every factual item in every collection requires evidence IDs.
- Fixtures verify unsupported items require explicit `Interpretation`/`Hypothesis` classification, and reject unknown IDs, dual support/conflict labeling, duplicate evidence identities, invalid classifications, extra fields, pending evidence, and forged/unattributed researcher verification.
- The schema establishes evidence traceability rather than claiming deterministic semantic truth for abstractive synthesis; all accepted output remains subject to researcher review.
- A configured synthesis model/tool and protected persistence/API integration remain deployment concerns. TQ-VSC-035 contradiction grouping and UI exposure were not implemented.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-034.
- TQ-VSC-035 and all later prompts remain `NOT STARTED`.

## TQ-VSC-035 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a structured `ContradictionDetectionAgent` that accepts two to 1,000 supplied `EvidenceRecord` inputs and rejects records unless they are both `Researcher Verified` and backed by attributable reviewer identity/timestamp before invoking the detector.
- Added persistent, backward-compatible contradiction groups with separate supporting and contradictory evidence IDs, contextual reasons, methodological reasons, explicit uncertainty, detector attribution, stable generated IDs, and `Needs Researcher Review` state.
- Every group side requires evidence IDs. Every contextual/methodological comparison and uncertainty statement also requires one or more evidence IDs, and all IDs must belong to the supplied researcher-verified set.
- The validator rejects unknown evidence, missing comparison attribution, duplicate evidence identities, dual support/contradiction labeling within a group, malformed/extra fields, and language declaring a study “wrong” or categorically false/incorrect/invalid.
- Extended the existing Literature & Gap UI to render stored contradiction groups with supporting/contradictory IDs, evidence-linked contextual/methodological explanations, uncertainty, and a visible reminder that differing findings do not establish that a study is wrong.

### Files changed and migrations

- `src/lib/contradictionDetectionAgent.ts` (created)
- `src/tests/contradictionDetectionAgent.test.tsx` (created)
- `src/components/views/GapMapView.tsx`
- `src/App.tsx`
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `ProjectState.contradictionGroups` and the contradiction group/reason contracts are optional additive fields. Existing projects render the gap view with an empty group collection.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/contradictionDetectionAgent.test.tsx src/tests/literatureSynthesisAgent.test.ts src/tests/evidenceRecords.test.ts` — exit `0`; PASS, 3/3 files and 24/24 tests.
3. `npm test` — exit `1`; 47/49 executed files passed and 428/430 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Positive fixtures verify stored review-required groups, stable IDs, detector attribution, separate support/contradiction sets, contextual/methodological reasons, uncertainty, and evidence IDs on every comparison.
- Negative fixtures reject missing/unknown IDs in every comparison area, dual labeling, unreviewed evidence, unsupported schema fields, malformed groups, and categorical study-wrong language.
- A component fixture confirms stored groups and evidence attribution are exposed in the mounted gap/synthesis area with the established TehqIQ visual style.
- The detector identifies and organizes evidence differences but does not adjudicate which study is correct; all groups remain proposals requiring researcher review.
- A configured detector model/tool and protected persistence/API call remain deployment concerns. TQ-VSC-036 gap-agent behavior was not implemented.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-035.
- TQ-VSC-036 and all later prompts remain `NOT STARTED`.

## TQ-VSC-036 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added explicit reviewed-synthesis and reviewed-contradiction contracts requiring researcher identity, timestamp, and rationale. The gap agent rejects unreviewed, unattributed, or cross-project inputs before invoking its proposal tool.
- Added a structured `ResearchGapAgent` that receives reviewed synthesis, reviewed contradiction groups, and limitations/context copied unchanged from the reviewed synthesis. Altered or invented input items fail closed.
- Output includes candidate gap statement, required supported gap type, supporting and contradicting evidence IDs, bounded confidence, caution, what new research would address, source synthesis/group IDs, generator attribution, and `AI Suggested` status.
- Every gap requires at least one supporting evidence ID from the reviewed input set. Contradicting IDs are optional but, when present, must also come from reviewed inputs and cannot duplicate supporting IDs.
- Universal novelty language including “no study has ever,” “never been studied,” “first-ever,” “completely unexplored,” “nothing is known,” and “no studies exist” is rejected across the gap statement, caution, and proposed research. Gap statements must explicitly scope themselves to reviewed/supplied evidence.

### Files changed and migrations

- `src/lib/researchGapAgent.ts` (created)
- `src/tests/researchGapAgent.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. Reviewed wrapper types, `ResearchGapProposal`, and `ProjectState.researchGapProposals` are additive. Existing legacy `ResearchGap` records and projects remain readable unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/researchGapAgent.test.ts src/tests/literatureSynthesisAgent.test.ts src/tests/contradictionDetectionAgent.test.tsx` — exit `0`; PASS, 3/3 files and 30/30 tests.
3. `npm test` — exit `1`; 48/50 executed files passed and 440/442 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — rerun after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Positive fixtures verify reviewed synthesis/contradiction provenance, evidence-linked candidate output, gap type, confidence, caution, proposed research, source IDs, generator attribution, and `AI Suggested` state.
- Six universal-claim traps reject unsupported claims, and an additional fixture requires explicit scope to the reviewed evidence.
- Negative fixtures reject missing/unknown/dual-labeled evidence IDs, unreviewed or unattributed inputs, altered limitations/context, unsupported gap types, invalid confidence, and extra schema fields.
- The agent proposes scoped gaps; it does not establish absolute novelty or certify that a gap exists outside the reviewed evidence corpus. Human review remains required.
- A configured gap-generation model/tool and protected persistence/API integration remain deployment concerns. TQ-VSC-037 outlet-intelligence behavior was not implemented.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-036.
- TQ-VSC-037 and all later prompts remain `NOT STARTED`.

## TQ-VSC-037 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic `OutletIntelligenceService` that combines verified outlet identity, independently sourced indexing records, valid provider/year/category metrics, guidelines, article types, formatting requirements, policies, and conference deadline/template/file requirements.
- Verified identity is exposed only when the existing outlet-integrity validator accepts its provider, source URL, retrieval date, and provenance type. Invalid or unverified identity remains explicitly `Unverified` and is not copied into a verified fact object.
- Added independently modeled indexing records requiring index/provider identity, a real HTTPS source, retrieval timestamp, and attributable human confirmation for `Verified` state. Sourced extraction may only remain `AI Extracted—Needs Review`.
- Requirement facts use only the latest valid field-level record with provider, real HTTPS source, and retrieval provenance. Missing facts are `Unavailable`; invalid or unsourced records are `Unverified` with a null value.
- Legacy top-level indexing, word/abstract limits, citation/formatting fields, fees, policies, and conference deadlines are deliberately ignored by the service, preventing an unsourced claim from entering combined outlet intelligence.

### Files changed and migrations

- `src/lib/outletIntelligenceService.ts` (created)
- `src/tests/outletIntelligenceService.test.ts` (created)
- `src/types.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. `OutletIndexingRecord` and optional `TargetOutlet.indexingRecords` are additive; existing outlets remain readable. Legacy `indexing: string[]` is retained for compatibility but is not accepted as sourced intelligence.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/outletIntelligenceService.test.ts src/tests/outletRequirements.test.ts src/tests/outletMetrics.test.ts` — exit `0`; PASS, 3/3 files and 21/21 tests.
3. `npm test` — exit `1`; 49/51 executed files passed and 445/447 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two failures remain the established baseline/environment failures: offline Crossref returns truthful network-error wording instead of the legacy not-found assertion, and jsdom localStorage lacks `setItem` under the current Node option.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Tests prove all required intelligence sections can be combined while preserving each fact's source and review state.
- Negative fixtures prove unsourced legacy indexing, requirements, policy, formatting, and deadline fields do not become outlet facts; unverified identity, metrics, and indexing are not presented as verified intelligence.
- Sourced AI extraction remains visibly pending review, while an unsourced extraction has its value stripped and becomes `Unverified`.
- This prompt adds the domain service and contracts, not provider retrieval adapters, an LLM extraction endpoint, persistence/RBAC integration, or a mounted outlet-intelligence UI. Those remain integration concerns; any future extractor must supply official retrieved text and preserve `Needs Review` until attributable human verification.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-037.
- TQ-VSC-038 and all later prompts remain `NOT STARTED`.

## TQ-VSC-038 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Replaced the citation-formatting switch as the public architecture with one registry-backed citation processor that produces both in-text citations and bibliography entries from the same selected style definition.
- Added CSL style lookup by ID and CSL XML file registration. Files must contain the CSL namespace plus info ID, title, and standard `citation-format` category before they can enter the registry.
- Bundled and imported definitions are labeled `Available—Compatible` with `exactJournalStyle: false`; UI style names use “compatible” rather than asserting exact journal conformance.
- Added truthful unavailable results for missing/unknown IDs, malformed CSL files, and outlet styles that cannot be resolved. Unknown legacy labels no longer silently fall back to APA.
- Target-outlet selection now resolves only a valid, field-level, human-confirmed `referenceStyle` requirement with source provenance. The legacy top-level `citationStyle` string cannot select a style.
- Preserved existing BibTeX, RIS, and CSL JSON parsing/export facilities and verified their regression suites.

### Files changed and migrations

- `src/lib/cslStyles.ts`
- `src/tests/cslArchitecture.test.ts` (created)
- `src/data/baselineOutlets.ts`
- `src/App.tsx`
- `src/components/JournalSelectorDropdown.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. Existing style IDs remain accepted, `apa-7th` is retained as a compatibility alias, and existing source/project records remain readable. Projects or outlets with unknown/unsourced styles now render the truthful `unavailable` state rather than receiving an implicit APA mapping.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/cslArchitecture.test.ts src/tests/unit.test.ts src/tests/baselineOutlets.test.ts src/tests/exportValidation.test.ts src/tests/outletRequirements.test.ts` — exit `0`; PASS, 5/5 files and 54/54 tests.
3. `npm test` — exit `1`; 50/52 executed files passed and 451/453 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording while the provider returned the truthful `not found by Crossref Official Registry` message; the established jsdom localStorage failure still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Representative author-date tests verify multi-author in-text formatting and corresponding bibliography output through the shared processor.
- Representative numeric tests verify stable global numbering for both in-text and bibliography output through that same processor.
- Tests cover valid CSL-file registration, malformed files, unknown IDs, verified outlet mapping, missing outlet style, removal of implicit APA fallback, and existing BibTeX/RIS/CSL JSON behavior.
- CSL XML registration currently parses and retains style identity/category metadata, then uses compatible family rendering. It does not execute arbitrary CSL macros/layout instructions, locales, dependent-style links, or cite grouping rules; therefore exact imported/journal style is deliberately not claimed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-038.
- TQ-VSC-039 and all later prompts remain `NOT STARTED`.

## TQ-VSC-039 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic `OutletMatchingAgent` accepting field, manuscript type, abstract, keywords, methodology, optional outlet type/indexing/open-access constraints, and a bounded recommendation limit.
- The matcher filters the supplied trusted database through the existing outlet-integrity validator, rejects duplicate catalogue IDs, and can only emit recommendation IDs from the resulting verified-ID set. It does not create outlet records.
- Fit and mismatch explanations are deterministic and limited to verified identity subject/title terms, verified supported article types, verified outlet type, and independently verified indexing records. Each explanation preserves its source URL and field record ID where available.
- Output preserves outlet identity provider/source/retrieval provenance and only valid `Verified` metric records, including their exact provider, metric name, year, subject category, source URL, retrieval timestamp, and available value/percentile/quartile.
- Missing or unverified article types, indexing, methodology scope, open-access status, metrics, formatting, guidelines, policies, and conference requirements are enumerated explicitly. Unverified metrics are never upgraded or returned.
- Fit scores are normalized deterministic overlap/constraint scores across assessed dimensions only. The response states that they are not acceptance predictions or outlet endorsements.

### Files changed and migrations

- `src/lib/outletMatchingAgent.ts` (created)
- `src/tests/outletMatchingAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The matcher introduces stateless exported input/output contracts and does not alter persisted `ProjectState` or `TargetOutlet` records.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/outletMatchingAgent.test.ts src/tests/outletIntelligenceService.test.ts src/tests/outletMetrics.test.ts src/tests/outletRequirements.test.ts` — exit `0`; PASS, 4/4 files and 27/27 tests.
3. `npm test` — exit `1`; 51/53 executed files passed and 457/459 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording while the provider returned the truthful `not found by Crossref Official Registry` message; the established jsdom localStorage failure still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Tests prove every recommendation ID belongs to the supplied integrity-verified trusted catalogue and that unverified records are excluded.
- Tests cover deterministic fit and mismatch output, identity provenance, verified metric year/category/source preservation, unverified metric exclusion, missing/unverified facts, empty trusted-database state, incomplete input rejection, and duplicate-ID suppression.
- Methodology is a required input but the current outlet requirement model has no independently sourced methodology-scope field; it is therefore reported as `Missing or Unverified` rather than inferred from prose.
- The open-access legacy field is not independently provenance modeled, so an open-access constraint is reported as missing/unverified and does not influence the score. No acceptance likelihood is calculated.
- This prompt implements the domain agent only; a protected persistence/API boundary and a mounted recommendations UI remain integration concerns.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-039.
- TQ-VSC-040 and all later prompts remain `NOT STARTED`.

## TQ-VSC-040 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic, conservative `ResearchIntakeAgent` that outputs discipline, subdiscipline, candidate study type, research stage, manuscript type, exact available evidence/method/data summaries, missing critical information, recommended next stage, confidence, and confidence rationale.
- Added specific classification patterns and tests for clinical research, qualitative research, electrical engineering, machine learning, economics, and systematic reviews. Clinical wording alone does not infer a randomized or crossover design; a specific clinical study type remains researcher-supplied or `Researcher input required`.
- All intake output starts as `AI Suggested` and includes an explicit researcher-correction instruction. Confirmation requires an attributable researcher and creates a separate `Researcher Confirmed` classification with source proposal ID, confirmation timestamp, researcher identity, and corrected-field list; it does not mutate or overwrite the proposal.
- Missing discipline, subdiscipline, study type, manuscript type, evidence, method, and data are represented explicitly as `Researcher input required` or `Not available`.
- Removed the existing empty-project and project-wizard defaults that assigned Sports Science, randomized trial, PICO, CONSORT, clinical setting, target cohort, experimental/control protocols, outcome, and invented gap/problem statements. Neutral projects now start with researcher-input/custom/not-configured states and blank canvas facts.

### Files changed and migrations

- `src/lib/researchIntakeAgent.ts` (created)
- `src/tests/researchIntakeAgent.test.ts` (created)
- `src/types.ts`
- `src/data/demoProject.ts`
- `src/components/views/ProjectWizardModal.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. Intake proposal and confirmed-classification fields on `ProjectState` are optional and additive, and the `Researcher input required` framework plus `Not configured` reporting guideline extend existing unions. Existing stored projects retain their explicit classifications. Newly created non-demo projects receive neutral defaults.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/researchIntakeAgent.test.ts src/tests/phase0.test.ts src/tests/phase1.test.ts src/tests/accessibility.test.tsx src/tests/e2eWorkflows.test.tsx` — exit `0`; PASS, 5/5 files and 38/38 tests.
3. `npm test` — exit `1`; 52/54 executed files passed and 468/470 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording while the provider returned the truthful `not found by Crossref Official Registry` message; the established jsdom localStorage failure still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,004 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Parameterized fixtures cover all six required domains/study families and assert that none receives a crossover default.
- Additional tests cover exact availability copying, missing-state representation, stage/next-stage selection, high/medium/low confidence rationale, separate attributable confirmation, corrected-field tracking, invalid scope/actor rejection, and neutral empty-project defaults.
- The keyword classifier is deliberately bounded and conservative; descriptions outside its supported patterns stay low-confidence and require researcher input rather than being forced into a nearby discipline.
- This prompt implements the domain agent, optional persistence contracts, and safe creation defaults. It does not add a protected intake API or mounted proposal/confirmation UI; those remain integration concerns.
- Reporting-guideline resolution is not implemented here; the new-project guideline remains `Not configured`. TQ-VSC-041 and later prompts were not executed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-040.
- TQ-VSC-041 and all later prompts remain `NOT STARTED`.

## TQ-VSC-041 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added an extensible `ReportingGuidelineRegistry` with sourced definitions and deterministic study-type patterns for CONSORT, STROBE, PRISMA, PRISMA-ScR, STARD, TRIPOD, COREQ, ARRIVE, and CARE.
- Registry records link to official guideline/checklist sites and provide a review instruction rather than embedding unverified or incomplete checklist contents. New checklist template items always start `Required`.
- Added a resolver for randomized, observational, systematic/scoping, diagnostic, clinical prediction, qualitative, animal, and case-report designs. Every match remains `Suggested—Needs Researcher Review` until an attributable researcher confirms it.
- Engineering, computational, general machine-learning, software/tool, simulation, unknown, custom, and future study types resolve to `Not configured`; no clinical checklist is assigned by fallback.
- Added evidence-gated checklist assessment. `Addressed` and `Partially addressed` require a manuscript location, one or more artifact IDs from the supplied available-evidence set, a confirmed guideline, assessor identity, and timestamp. `Not applicable` requires researcher rationale.
- Updated readiness calculation so legacy/static `Addressed` strings do not earn method-completeness credit without evidence and assessment provenance.
- Updated the checklist view to show suggested-guidance review status, `Not documented` for missing locations, and status-sensitive amber/red/green badges rather than universal green ticks.

### Files changed and migrations

- `src/lib/reportingGuidelineRegistry.ts` (created)
- `src/tests/reportingGuidelineRegistry.test.tsx` (created)
- `src/types.ts`
- `src/lib/readinessCalculator.ts`
- `src/components/views/ReportingChecklistView.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk migration is required. Reporting-guideline metadata and checklist assessment provenance are optional additive fields, and guideline names are extensible strings. Existing guideline/checklist records remain readable, but legacy `Addressed` items without evidence/location/assessor/timestamp no longer contribute readiness credit.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/reportingGuidelineRegistry.test.tsx src/tests/researchIntakeAgent.test.ts src/tests/unit.test.ts src/tests/accessibility.test.tsx` — exit `0`; PASS, 4/4 files and 54/54 tests.
3. `npm test` — exit `1`; 53/55 executed files passed and 486/488 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording while the provider returned the truthful `not found by Crossref Official Registry` message; the established jsdom localStorage failure still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,005 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Parameterized fixtures cover randomized, observational, systematic, scoping, diagnostic, prediction, qualitative, animal, and case-report resolution.
- Five non-clinical fixtures prove engineering, computational, machine-learning, software/tool, and simulation projects do not receive clinical checklists; unknown/future types also remain unconfigured.
- Tests prove suggestions require researcher confirmation, checklist completion requires known evidence, unavailable evidence is rejected, legacy green ticks do not earn readiness, and unassessed UI rows remain amber with `Not documented` location.
- Registry entries intentionally link to official current checklist sources rather than copying full checklist text into this codebase. The single registry instruction is not a substitute for retrieving and versioning the official complete checklist before production use.
- The matcher is deterministic and based on the supplied study-type label. Ambiguous hybrid designs remain unconfigured and require researcher selection.
- A mounted confirmation/edit workflow and protected server persistence remain integration concerns. TQ-VSC-042 and later prompts were not executed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-041.
- TQ-VSC-042 and all later prompts remain `NOT STARTED`.

## TQ-VSC-042 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a structured `MethodologyDesignAgent` that refuses to run unless `explicitUserRequest` is true and its project-scoped prerequisites are present: an attributable approved research question, at least one attributable approved objective, researcher-confirmed intake classification, reviewed gap/evidence collections, supplied facts/constraints, and researcher-confirmed reporting guidance.
- Defined eleven required output sections: proposed design, population/data source, sampling, variables/outcomes, instruments, procedure, bias/confounding, analysis needs, ethics considerations, limitations, and unresolved questions.
- Every statement must be classified as `Researcher Fact`, `Evidence-grounded Recommendation`, `AI Proposal`, or `Missing Information`. Researcher facts must copy one supplied fact exactly; evidence-grounded recommendations must cite only reviewed evidence IDs; AI proposals require conditional proposal language; missing information must remain explicit.
- Strict structured validation rejects missing/extra sections, unsupported statement fields, unknown evidence IDs, altered researcher facts, and classifications that masquerade as evidence or fact.
- Added explicit safeguards against non-factual statements inventing sample sizes, ethics approval identifiers/status, recruited/enrolled/assigned participants, collected data, or completed procedures.
- Model output cannot provide approval fields because the candidate schema permits only the eleven methodology sections. Successful output is always `AI Suggested` and `Needs Researcher Review`.
- Added a separate approval function requiring researcher UID/email and rationale. It creates a distinct `Researcher Approved` record with proposal provenance and timestamp without mutating the original proposal.

### Files changed and migrations

- `src/lib/methodologyDesignAgent.ts` (created)
- `src/tests/methodologyDesignAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The new agent uses stateless exported input/output contracts and does not alter existing persisted methodology workspaces or project documents.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/methodologyDesignAgent.test.ts src/tests/methodologyWorkspace.test.tsx src/tests/reportingGuidelineRegistry.test.tsx src/tests/researchIntakeAgent.test.ts src/tests/apiSchemas.test.ts` — exit `0`; PASS, 5/5 files and 51/51 tests.
3. `npm test` — exit `1`; 54/56 executed files passed and 492/494 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording while the provider returned the truthful `not found by Crossref Official Registry` message; the established jsdom localStorage failure still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,005 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Tests verify the explicit request gate, approved/confirmed prerequisite gates, all eleven output areas, all four statement classifications, source identities, and review-pending output state.
- Negative tests reject altered researcher facts, unknown evidence, invented sample sizes, ethics claims, participant recruitment, completed data collection, missing sections, extra/self-approval fields, and unattributed approval.
- A positive approval test proves the original proposal remains `AI Suggested`/`Needs Researcher Review` while a separate attributable, rationalized record becomes `Researcher Approved`.
- Pattern checks provide a strict last-line defense for common fabricated sample-size, ethics, participant, and completed-procedure claims; they are not a complete semantic fact checker. Human review remains mandatory.
- The agent accepts reviewed gap/evidence IDs but does not independently adjudicate their scientific quality. Upstream review integrity remains required.
- This prompt implements the domain contract only. It is not wired into the existing `/api/gemini/methodology-proposal` route, the methodology workspace UI, or protected persistence; those remain integration concerns. TQ-VSC-043 and later prompts were not executed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-042.
- TQ-VSC-043 and all later prompts remain `NOT STARTED`.

## TQ-VSC-043 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a structured `QuestionHypothesisAgent` that requires a project concept, project-scoped researcher-confirmed intake classification, attributable researcher-reviewed synthesis, and a project-scoped attributable researcher-approved gap.
- Added bounded candidate schemas for research questions and objectives. Every item requires rationale text linked to one or more evidence IDs from the reviewed synthesis/approved gap, a non-empty variables-or-concepts collection, and an explicit unresolved-assumptions collection.
- Hypothesis candidates require supported hypothesis type, statement, and reviewed-evidence rationale. They are allowed only when the confirmed classification is hypothesis-compatible.
- Qualitative, exploratory, systematic review, scoping review, narrative review, case-report, and theoretical classifications deterministically reject non-empty hypothesis output instead of forcing null/alternative hypotheses.
- Structured validation rejects missing/extra top-level fields, malformed questions/objectives/hypotheses, empty or unknown evidence attribution, empty concepts, unapproved/cross-project prerequisites, and model-supplied self-approval fields.
- All successful output remains `AI Suggested` and `Needs Researcher Review`. A separate approval function requires researcher UID/email and rationale, creates a distinct `Researcher Approved` record with proposal provenance/timestamp, and leaves the proposal unchanged.

### Files changed and migrations

- `src/lib/questionHypothesisAgent.ts` (created)
- `src/tests/questionHypothesisAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The new agent uses stateless exported contracts and does not alter existing persisted `ResearchQuestionItem`, `Hypothesis`, or `ProjectState` records.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/questionHypothesisAgent.test.ts src/tests/researchIntakeAgent.test.ts src/tests/researchGapAgent.test.ts src/tests/literatureSynthesisAgent.test.ts` — exit `0`; PASS, 4/4 files and 46/46 tests.
3. `npm test` — exit `1`; 55/57 executed files passed and 503/505 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording while the provider returned the truthful `not found by Crossref Official Registry` message; the established jsdom localStorage failure still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,005 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS after tracker completion.

### Acceptance coverage, compatibility, and blockers

- Parameterized cross-discipline fixtures cover clinical, qualitative, electrical engineering, machine learning, economics, and systematic-review classifications.
- Tests prove hypothesis compatibility is classification-dependent and that qualitative and systematic-review proposals contain no forced hypotheses; a dedicated negative test rejects a qualitative hypothesis.
- Tests cover evidence-linked rationale for research questions, objectives, and hypotheses; unknown/empty evidence rejection; prerequisite scope/review/approval gates; malformed/self-approved output rejection; and separate attributable human approval.
- The compatibility predicate is deliberately conservative and classification-label based; ambiguous/custom classifications require upstream researcher correction rather than domain assumptions.
- The agent validates evidence identities and upstream review states but does not independently establish the semantic truth or sufficiency of candidate questions and hypotheses. Human review remains mandatory.
- This prompt implements the domain contract only. It is not connected to the current Question Builder UI, an API route, or protected persistence. TQ-VSC-044 and later prompts were not executed.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-043.
- TQ-VSC-044 and all later prompts remain `NOT STARTED`.

## TQ-VSC-044 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added an extensible `AnalysisMethodRegistry` with immutable method definitions and exact normalized alias resolution.
- Each registered method declares an ID, family, label/aliases, compatible variable types, required inputs, assumptions, output schema, diagnostics, reproducibility capabilities, and deterministic executor.
- Registered the existing validated paired/crossover analysis as the explicit `paired-crossover-comparison` plugin while preserving the legacy `executePairedCrossoverAnalysis` entry point for compatibility.
- Routed native server execution and the Data Lab client fallback through registry resolution using `AnalysisPlan.statisticalMethod`.
- Unrelated and unknown analysis names now fail explicitly as `not configured` / `Researcher input required`; they never inherit paired, period, sequence, or carryover assumptions.

### Files changed and migrations

- `src/lib/analysisMethodRegistry.ts` (created)
- `src/lib/statsEngine.ts`
- `src/components/views/DataLabView.tsx`
- `server.ts`
- `src/tests/analysisMethodRegistry.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. Existing analysis plans and outputs remain readable. Existing paired-plan method names resolve through registered aliases, and the legacy paired/crossover function remains available.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/analysisMethodRegistry.test.ts src/tests/phase5.test.ts src/tests/statisticalSensitivity.test.ts src/tests/dataIntegrityRegression.test.ts src/tests/apiSchemas.test.ts` — exit `0`; PASS, 5/5 files and 39/39 tests.
3. `npx vitest run src/tests/analysisMethodRegistry.test.ts src/tests/phase5.test.ts src/tests/statisticalSensitivity.test.ts src/tests/dataIntegrityRegression.test.ts src/tests/integration.test.ts` — exit `1`; 4/5 files and 34/35 tests passed. The sole failure is the established jsdom environment issue: `window.localStorage.setItem is not a function`.
4. `npm test` — exit `1`; 56/58 executed files passed and 510/512 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established failures are the Crossref assertion expecting legacy wording and the jsdom localStorage environment failure.
5. `npm run build` — exit `0`; PASS, 2,006 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Tests inspect every required method-definition capability and prove both legacy and registry entry points preserve the validated paired output.
- Parameterized tests prove independent-samples, regression, chi-square, qualitative, and unconfigured methods receive no paired/crossover fallback.
- Registry resolution is deliberately exact to registered IDs/labels/aliases. Unsupported method selection requires future explicit registration, not heuristic reassignment.
- The current registry contains only the preserved paired/crossover plugin. Common comparison methods belong to TQ-VSC-045 and were not implemented.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-044.
- TQ-VSC-045 and all later prompts remain `NOT STARTED`.

## TQ-VSC-045 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added registry plugins for Welch independent-samples t-test, Mann–Whitney U, paired-samples t-test, Wilcoxon signed-rank, one-way ANOVA, Kruskal–Wallis, and one-way repeated-measures ANOVA.
- Added deterministic distribution/ranking helpers, tie corrections, continuity corrections, group/pair extraction, complete-case counts, method-specific statistics, confidence intervals where applicable, effect sizes, and reproducibility hashes/metadata.
- Every executor requires an approved dataset and plan and validates required variables, finite records, group counts, complete pairs/subjects, sample minima, and positive variance where required. Invalid inputs fail with empty p-value/effect-size arrays and no fallback numbers.
- Independence, correct pairing, normality, homogeneity, symmetry, and multi-condition sphericity are not self-certified from numeric values; they remain explicitly unverified where researcher or additional diagnostic confirmation is required.
- Removed general paired-test aliases from the crossover plugin. General paired plans now resolve to the non-crossover paired executor, while the preserved crossover implementation requires an explicit crossover alias or ID.
- Prevented the legacy paired visualization helper from generating zero-valued paired figures/tables for the new method-specific output schemas.

### Files changed and migrations

- `src/lib/commonComparisonMethods.ts` (created)
- `src/lib/statsEngine.ts`
- `src/tests/commonComparisonMethods.test.ts` (created)
- `src/tests/analysisMethodRegistry.test.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. Existing analysis output records remain readable. Existing plans named `Paired Student's t-test` now correctly resolve to the general paired method; explicit crossover names/IDs retain the prior plugin.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after the final implementation and tracker update.
2. `npx vitest run src/tests/commonComparisonMethods.test.ts src/tests/analysisMethodRegistry.test.ts src/tests/phase5.test.ts src/tests/statisticalSensitivity.test.ts src/tests/dataIntegrityRegression.test.ts src/tests/apiSchemas.test.ts` — exit `0`; PASS, 6/6 files and 49/49 tests after the final visualization guard test.
3. `npm test` — exit `1`; 57/59 executed files passed and 519/521 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion still expects legacy wording, and the established jsdom localStorage test still reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,007 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Golden fixtures cover all seven requested methods and assert reference statistics, degrees of freedom, p-values, effect sizes, tie behavior, counts, and repeated-measures warnings.
- Negative coverage proves invalid/incomplete inputs fail closed without numerical fallbacks. A visualization regression proves unfamiliar method schemas do not become fabricated zero-valued paired charts or tables.
- The implemented nonparametric p-values use documented asymptotic normal/chi-square approximations with tie/continuity corrections; exact small-sample distributions are not implemented and warnings disclose the approximation.
- Repeated-measures ANOVA reports uncorrected degrees of freedom for more than two conditions and explicitly marks sphericity unverified. Greenhouse–Geisser/Huynh–Feldt corrections are not fabricated.
- Post-hoc comparisons and multiplicity correction are outside this prompt. Regression, survival, and diagnostic analysis remain TQ-VSC-046 work and were not implemented.
- The full suite remains red only for the two recorded baseline/environment failures; neither was introduced by TQ-VSC-045.
- TQ-VSC-046 and all later prompts remain `NOT STARTED`.

## TQ-VSC-046 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Extended `AnalysisMethodDefinition` with enforced `Enabled`, `Planned`, and `Unavailable` states plus an availability reason. Registration rejects enabled methods without an executor, disabled methods with an executor, and disabled methods without a reason.
- Added deterministic ordinary least-squares linear regression with one or more numeric predictors, complete-case counts, pivoted matrix inversion, singularity failure, coefficients, finite-sample standard errors/tests/confidence intervals, R-squared, adjusted R-squared, residual error, and provenance.
- Added deterministic binary logistic regression using bounded iteratively reweighted maximum likelihood with strict numeric 0/1 outcome validation, both-class requirement, convergence/separation/singularity failure, coefficients, standard errors, Wald tests, odds ratios/confidence intervals, likelihood/deviance, event counts, and provenance.
- Confidence intervals derive their critical value from the analysis plan alpha: Student-t for OLS and normal-theory for logistic regression.
- Added non-executable `Planned` entries for Poisson, negative-binomial, Kaplan–Meier, and Cox methods, and `Unavailable` entries for sensitivity/specificity and ROC/AUC. Each states the missing scientific/data contract and exposes no executor.
- The protected analysis endpoint now rejects planned/unavailable methods before external-service or native execution. No disabled method can look executable through the registry.

### Files changed and migrations

- `src/lib/regressionAnalysisMethods.ts` (created)
- `src/tests/regressionAnalysisMethods.test.ts` (created)
- `src/lib/analysisMethodRegistry.ts`
- `src/lib/commonComparisonMethods.ts`
- `src/lib/statsEngine.ts`
- `src/tests/analysisMethodRegistry.test.ts`
- `server.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. Availability is runtime registry metadata. Existing enabled comparison/crossover registrations were marked `Enabled` without changing stored plans or outputs.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after regression implementation.
2. `npx vitest run src/tests/regressionAnalysisMethods.test.ts src/tests/analysisMethodRegistry.test.ts src/tests/commonComparisonMethods.test.ts src/tests/phase5.test.ts src/tests/apiSchemas.test.ts` — exit `0`; PASS, 5/5 files and 37/37 tests.
3. `npm test` — exit `1`; 58/60 executed files passed and 525/527 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom localStorage test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,008 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Independently calculated golden fixtures verify OLS coefficients, standard errors, fit statistics, and counts, and binary logistic coefficients, odds ratio, likelihood, deviance, convergence, and event counts.
- Negative fixtures prove singular OLS, separated logistic models, and non-0/1 binary outcomes fail without p-values/effect sizes or fallback estimates.
- Registry tests inspect every registered method: all enabled methods have deterministic executors, while every planned/unavailable method has no executor, has an availability reason, and throws an availability-specific error if execution is attempted.
- OLS supports numeric fixed-effect predictors with an intercept; categorical encoding, interactions, weights, clustered/robust errors, missing-data imputation, and nonlinear terms require future explicit architecture.
- Logistic regression uses model-based Wald uncertainty; calibration, influence, goodness-of-fit, penalization, robust errors, and rare-event corrections are not implemented and are not claimed.
- Survival methods remain planned because censoring/ties/risk-table/proportional-hazards contracts are absent. Diagnostic methods remain unavailable because reference-standard polarity, score direction, thresholds, indeterminate results, and uncertainty contracts are absent.
- TQ-VSC-047 and all later prompts remain `NOT STARTED`.

## TQ-VSC-047 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added an explicit extensible specialized-family catalogue for meta-analysis, ML evaluation, engineering/computational analysis, and survey/psychometrics.
- Enabled fixed-effect inverse-variance meta-analysis with positive-standard-error validation, pooled estimate/uncertainty, Cochran Q, descriptive I-squared, included/excluded study counts, and researcher-unverified effect-scale/common-effect assumptions.
- Enabled held-out binary ML evaluation requiring numeric 0/1 truth, probabilities in `[0,1]`, explicit Train/Validation/Test split values, and non-empty sample IDs. Only Test records produce accuracy, precision, recall/sensitivity, specificity, F1, Brier score, log loss, confusion counts, and fixed-bin calibration error. Cross-split ID overlap fails as leakage; the executor never trains, tunes, cross-validates, or optimizes a threshold.
- Enabled deterministic engineering reference/prediction error analysis with bias, alpha-aware finite-sample bias CI, MAE, RMSE, error SD, optional range-normalized RMSE, and complete/excluded pair counts.
- Enabled Cronbach's alpha from researcher-designated numeric item columns with complete-case/item/total-variance validation and explicit warnings that internal consistency does not establish unidimensionality, validity, or stability.
- Added non-executable availability entries for random-effects meta-analysis, meta-regression, cross-validation, ML training, ML ROC/AUC, DOE, global sensitivity, simulation uncertainty propagation, exploratory factor analysis, and item-response theory. Every entry is `Planned` or `Unavailable`, explains its missing contract, and has no executor.
- All calculations are deterministic TypeScript. No Gemini or other language-model call is used.

### Files changed and migrations

- `src/lib/specializedAnalysisMethods.ts` (created)
- `src/tests/specializedAnalysisMethods.test.ts` (created)
- `src/lib/statsEngine.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. Specialized capabilities are additive runtime registry entries; existing analysis plans/outputs remain unchanged.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after final specialized implementation.
2. `npx vitest run src/tests/specializedAnalysisMethods.test.ts src/tests/regressionAnalysisMethods.test.ts src/tests/commonComparisonMethods.test.ts src/tests/analysisMethodRegistry.test.ts src/tests/apiSchemas.test.ts` — exit `0`; PASS, 5/5 files and 37/37 tests.
3. `npm test` — exit `1`; 59/61 executed files passed and 532/534 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom localStorage test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Golden fixtures verify fixed-effect pooling/heterogeneity summaries, held-out ML metrics/calibration/counts, engineering error summaries, and Cronbach's alpha.
- Negative tests prove ML split-ID leakage fails with no effect-size output. Capability tests prove each family contains both a narrowly enabled executor and broader disabled entries, and every disabled entry exposes a reason but no executor.
- Fixed-effect meta-analysis does not claim random-effects inference or establish study compatibility. I-squared is labelled descriptive, particularly with few studies.
- ML procedural leakage cannot be disproved from IDs alone, so true holdout remains researcher-unverified. CV is not simulated from in-sample predictions.
- Engineering unit compatibility and scientific pairing remain researcher-unverified. Cronbach's alpha is not promoted to construct-validity evidence.
- Random-effects synthesis, meta-regression, cross-validation, training/tuning, ML AUC, DOE, global sensitivity, uncertainty propagation, factor analysis, and IRT require future validated contracts and remain non-executable.
- TQ-VSC-048 and all later prompts remain `NOT STARTED`.

## TQ-VSC-048 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added an optional project-scoped qualitative workflow containing a reviewed corpus, versioned codebooks, researcher-created and AI-suggested codes, coded passages, disagreements, reflexive memos, themes, supporting coded-passage IDs, and exact corpus quotations.
- Corpus records require reviewed artifact identity/hash, exact passage text/location, and attributable researcher-review provenance.
- Researcher and AI code additions create successive codebook versions. AI codes always begin `AI Suggested`; attributable review with rationale is required before approval/rejection, and unresolved AI suggestions block codebook approval.
- Coded passages reference a known corpus passage and a specific codebook version. Assignments require known non-rejected codes. Researcher review records actor, timestamp, and rationale.
- Coding disagreements move passages to `Disputed`. They require attributable resolution and a subsequent explicit coded-passage review; resolution alone does not certify coding.
- AI themes always begin `AI Suggested`; researcher themes begin `Researcher Draft`. Themes require known coded-passage support and exact quotations that are literal substrings of known corpus passages. Attributable disposition is mandatory.
- Final findings approval requires an approved latest codebook, all coded passages researcher-reviewed, no open disagreements, every retained theme disposed, and at least one approved theme.
- Added a manuscript adapter that accepts only attributable researcher-approved workflows. It emits qualitative summary evidence with no p-values, effect sizes, or quantitative claims. The demo manuscript engine now labels qualitative evidence/review accurately rather than inserting a quantitative heading or statistical diagnostics.

### Files changed and migrations

- `src/types.ts`
- `src/lib/qualitativeAnalysisWorkflow.ts` (created)
- `src/tests/qualitativeAnalysisWorkflow.test.ts` (created)
- `src/lib/q1ManuscriptEngine.ts`
- `src/lib/complianceEngine.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. `ProjectState.qualitativeAnalysis` is optional and additive, so existing projects remain readable without persisted rewrites.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after final workflow/provenance implementation.
2. `npx vitest run src/tests/qualitativeAnalysisWorkflow.test.ts src/tests/questionHypothesisAgent.test.ts src/tests/methodologyWorkspace.test.tsx src/tests/apiSchemas.test.ts` — exit `0`; PASS, 4/4 files and 33/33 tests.
3. `npm test` — exit `1`; 60/62 executed files passed and 538/540 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom localStorage test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Tests cover codebook versioning; AI suggestion isolation; attributable code, passage, theme, disagreement, and final review; exact quotation provenance; known coded-passage evidence; reflexive memos; and final manuscript output.
- Negative cases block codebook self-approval, invented/non-source quotations, unknown coded evidence, passage review with open disagreement, premature final approval, and manuscript adaptation of unapproved findings.
- The approved manuscript output explicitly contains `analysisType: Qualitative`, `quantitativeStatistics: Not applicable`, empty `pValues`, and empty `effectSizes`; a workflow serialization check confirms it contains no statistical-result fields.
- The workflow is a domain/service layer and optional project field. A dedicated mounted qualitative coding UI and protected persistence endpoints are not implemented in this prompt.
- Intercoder reliability statistics are not forced. Mixed-methods quantitative analysis would require an explicitly selected, separately approved analysis plan.
- TQ-VSC-049 and all later prompts remain `NOT STARTED`.

## TQ-VSC-049 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a structured recommendation-only `AnalysisPlanningAgent` requiring an explicit user request, project-scoped attributable researcher-approved methodology, dataset profile and variable dictionary, approved research questions/hypotheses, researcher-confirmed study classification, and the live `AnalysisMethodRegistry`.
- The tool receives dataset metadata/dictionary but never raw dataset rows. Registry capabilities are passed as sanitized IDs, families, labels, availability, reasons, compatible types, required inputs, and assumptions; deterministic executors are never exposed to the agent.
- Output contains exactly primary, secondary, and sensitivity recommendations, unsupported needs, and global missing information. Recommendations contain registered method IDs, approved RQ/hypothesis links, variable mappings, assumptions with explicit planning status, exact missing-variable collections, and preprocessing steps fixed to `Proposed—Needs Researcher Approval`.
- Executable recommendations accept only `Enabled` registered methods with executors. Planned/unavailable capabilities can appear only as unsupported needs, and only by their registered IDs. Hallucinated IDs fail closed.
- Mapped variable names must exist in the supplied dictionary and match the method's declared compatible type where the mapping role resolves. Missing mappings must be absent from the dictionary and exactly match the recommendation's missing-variable list.
- The proposal remains `AI Suggested` / `Needs Researcher Review`. A separate approval operation requires researcher UID/email and rationale, creates a distinct approved record with proposal provenance, and leaves the original proposal unchanged.
- No statistics, p-values, effect sizes, numeric results, preprocessing execution, or method execution occur in this agent.

### Files changed and migrations

- `src/lib/analysisPlanningAgent.ts` (created)
- `src/tests/analysisPlanningAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The agent uses stateless exported proposal/approval contracts and does not alter persisted `AnalysisPlan` or project schemas.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after final planning validation.
2. `npx vitest run src/tests/analysisPlanningAgent.test.ts src/tests/analysisMethodRegistry.test.ts src/tests/methodologyDesignAgent.test.ts src/tests/questionHypothesisAgent.test.ts src/tests/apiSchemas.test.ts` — exit `0`; PASS, 5/5 files and 38/38 tests.
3. `npm test` — exit `1`; 61/63 executed files passed and 544/546 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom localStorage test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Tests cover every prerequisite; sanitized registry context; primary/secondary/sensitivity roles; enabled recommendations; registered unsupported needs; variable and missing-state mappings; assumption states; proposed preprocessing; and separate attributable approval.
- Negative tests reject hallucinated method IDs, disabled methods presented as executable, unregistered unsupported IDs, unknown questions, unknown/unapproved hypotheses, fabricated mapped variables, type-incompatible mappings, completed preprocessing, extra/self-approval fields, and unattributed approval.
- The agent validates registry identity/availability and structural compatibility, but it does not establish causal identification, scientific sufficiency, or assumption truth. Those remain researcher responsibilities.
- This prompt implements the domain contract only. It is not wired into a mounted planning UI, protected API route, or persistence workflow.
- TQ-VSC-050 and all later prompts remain `NOT STARTED`.

## TQ-VSC-050 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a `ResultsInterpretationAndWritingAgent` (not a “Results Generator”) that requires an explicit request and at least one eligible approved empirical source.
- Quantitative/registered analysis eligibility uses the existing attributable `Approved for Manuscript` or locked lifecycle gate. Completed, reviewed, malformed, or otherwise unapproved outputs are never shown to the tool.
- Qualitative eligibility requires the governed workflow's final `Researcher Approved` state, attributable approval identity/timestamp/rationale, successful workflow provenance validation, and individually approved themes.
- The tool receives only approved result IDs, exact approved finding text, and exact recorded warning arrays. It can select/order those records but cannot alter their content. Hallucinated IDs, changed findings, omitted/changed warnings, duplicates, malformed output, and self-approval are rejected.
- Manuscript text is assembled deterministically from the selected exact findings and cautions. Unresolved information is permitted only with explicit Missing/Unverified/Researcher input required/Not available/Not configured/Unresolved language.
- Numeric grounding runs after manuscript assembly via the existing provenance-based manuscript numeric validator. Exact approved prose containing numbers is still blocked if traceable project numeric evidence is absent.
- No result is recalculated. The agent creates no p-values, sample sizes, effects, significance decisions, or new findings. The adversarial “make p significant” case fails exact-text validation.
- Successful output remains `AI Suggested` / `Needs Researcher Review`. A separate attributable approval action creates a distinct researcher-approved record and preserves the original proposal.

### Files changed and migrations

- `src/lib/resultsInterpretationWritingAgent.ts` (created)
- `src/tests/resultsInterpretationWritingAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The agent uses stateless exported proposal/approval contracts and reads existing project analysis and qualitative records without schema mutation.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`) after final implementation.
2. `npx vitest run src/tests/resultsInterpretationWritingAgent.test.ts src/tests/numericGrounding.test.ts src/tests/numericEvidence.test.ts src/tests/qualitativeAnalysisWorkflow.test.ts src/tests/analysisLifecycle.test.ts` — exit `0`; PASS, 4 discovered files and 22/22 tests (`analysisLifecycle.test.ts` is not present and added no discovered file).
3. `npm test` — exit `1`; 62/64 executed files passed and 551/553 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom localStorage test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.

### Acceptance coverage, compatibility, and blockers

- Adversarial tests prove no-data execution blocks before tool invocation and altered `p = 0.001`/“statistically significant” prose is rejected against the exact approved finding.
- Tests prove unapproved analysis outputs are hidden, result IDs and warnings are immutable, hallucinated IDs/self-approval fail, numeric grounding executes after assembly, and absent numeric provenance blocks approved numeric prose.
- A governed qualitative fixture proves approved themes can feed Results writing without p-values, effect sizes, sample sizes, or significance claims.
- The agent deliberately permits no free-form inferential interpretation beyond exact approved findings and warnings. Broader interpretation would require a separately validated evidence-grounded language contract.
- This prompt implements the domain contract only. It is not wired into the existing generic draft-section route, mounted writing UI, protected dedicated endpoint, or persistence workflow.
- TQ-VSC-061 and all later prompts remain `NOT STARTED`.

## TQ-VSC-063 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added `runOriginalityRiskAnalysis`, a deterministic source-linked risk engine using normalized token sequences and n-gram overlap signals. It detects exact quoted passages, close/verbatim overlap, uncited close paraphrases, missing attribution, duplicate sections, and optional self-overlap against prior section versions.
- Findings identify involved manuscript section IDs, matched Source IDs, matched text where appropriate, and bounded similarity scores. They use cautious researcher-review language and never automatically accuse the researcher.
- Synthetic/demo Sources are excluded from real-project comparison. An explicit licensed similarity adapter reports `Not Configured`, `Available`, or `Unavailable`; no unlicensed service is implied and no AI-detector evasion or originality guarantee is implemented.

### Files changed and migrations

- `src/lib/originalityRiskEngine.ts` (created)
- `src/tests/originalityRiskEngine.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No data migration is required. The engine is a stateless analysis boundary over existing manuscript sections and Sources; no stored content is rewritten.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/originalityRiskEngine.test.ts src/tests/citationAuditAgent.test.ts src/tests/citationVerifierRules.test.ts` — exit `0`; PASS, 3/3 files and 15/15 tests.
3. `npm test` — exit `1`; 75/77 executed files passed and 636/638 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established unrelated failures remain: the Crossref test expects legacy error wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Tests cover exact quotation, cited close overlap, uncited close paraphrase/missing attribution, duplicate sections, version self-overlap, synthetic-source isolation, licensed-service unavailability, source-linked findings, and prohibited detector-evasion/originality claims.
- Similarity scores are deterministic signals requiring researcher review; they are not plagiarism findings, guarantees, or automated disciplinary decisions. Exact quotation detection depends on source text supplied in the project Source record.
- The engine is not mounted into a new API/UI workflow in this prompt; existing manuscript tooling remains compatible and can consume the stateless report in a later integration.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-062 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added `fetchCrossrefIntegrityMetadata` to query identifier-backed Crossref records for relation/update metadata and classify `Retracted`, `Corrected`, `Expression of Concern`, `Updated`, `Clear`, `Unverified`, or `Unavailable` outcomes.
- Added `verifySourceIntegrity`, which runs configured integrity providers, stores status/provider/retrievedAt/relatedIds in an additive `SourceRecord.integrityVerification` field, and propagates retraction/correction warnings without replacing bibliographic metadata.
- A provider's no-result, not-found, network, or unavailable response never proves “not retracted”; the stored state remains `Unverified` or `Unavailable` with an explicit message.
- `citationAuditAgent` now consumes stored integrity status. Existing compliance/export checks consume the propagated `retractionWarning` and `correctionNotice` flags, so integrity warnings remain visible downstream.

### Files changed and migrations

- `src/types.ts`
- `src/lib/metadataProviders.ts`
- `src/lib/sourceIntegrityVerification.ts` (created)
- `src/lib/citationAuditAgent.ts`
- `src/tests/sourceIntegrityVerification.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No destructive or bulk migration is required. `integrityVerification` is optional and additive; existing SourceRecord readers remain compatible. Verification returns a non-mutating updated source object for callers to persist through their existing source-save boundary.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/sourceIntegrityVerification.test.ts src/tests/citationAuditAgent.test.ts src/tests/citationVerifierRules.test.ts src/tests/metadataProviderAdapters.test.ts` — exit `0`; PASS, 4/4 files and 42/42 tests.
3. `npm test` — exit `1`; 74/76 executed files passed and 632/634 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established unrelated failures remain: the Crossref test expects legacy error wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Mocked retracted and corrected provider relations pass and retain related IDs, provider identity, and retrieval timestamps. No-result/unavailable and identifier-free cases remain explicitly unverified rather than being marked clear.
- Tests prove the updated source preserves its original bibliographic metadata and that retraction status raises citation-audit warnings without fabricating replacement records.
- This prompt defines and validates the integrity-verification/storage boundary. Provider coverage depends on configured provider capabilities; absence of a provider result remains an unresolved verification state.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-061 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added deterministic `runCitationAudit`, a CitationAuditAgent-style service that audits manuscript citation metadata against real project `SourceRecord` entries, `EvidenceRecord` support, and explicit bibliography entries.
- Citation references must map to an existing project Source or remain explicitly unresolved. An optional identifier resolver can report external resolution, but the service never imports, synthesizes, or fabricates a Source.
- The audit reports `PASS`, `WARNING`, or `BLOCKER` and identifies unresolved identifiers, unverified sources, retraction/correction notices, missing researcher-verified EvidenceRecords, duplicate citations, duplicate bibliography entries, orphan bibliography entries, and missing bibliography entries.
- Bibliography synchronization is source-ID/identifier based, and evidence support requires a non-demo/non-synthetic EvidenceRecord with exact passage text, `Researcher Verified` verification, and a verified researcher review.

### Files changed and migrations

- `src/lib/citationAuditAgent.ts` (created)
- `src/tests/citationAuditAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. The audit consumes existing source/evidence/manuscript records and returns a stateless report. Existing `citationVerifier.ts` behavior and UI remain compatible.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/citationAuditAgent.test.ts src/tests/citationVerifierRules.test.ts src/tests/evidenceRecords.test.ts` — exit `0`; PASS, 3/3 files and 17/17 tests.
3. `npm test` — exit `1`; 73/75 executed files passed and 628/630 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established unrelated failures remain: the Crossref test expects legacy error wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Tests prove a verified citation with verified evidence and synchronized bibliography passes; a fake DOI remains unresolved with `sourceCreationAttempted: false`; externally resolved-but-not-imported identifiers remain blocked; and retraction/correction, evidence, duplicate, orphan, and missing-bibliography conditions are surfaced.
- This prompt does not alter or fabricate SourceRecord metadata, perform DOI imports, or silently replace unresolved references. Researchers must explicitly import and verify a real source before it can satisfy the audit.
- The audit is a deterministic domain service and is not mounted as a new API/UI endpoint in this prompt. Existing Writing Studio citation verification remains available; later integration may expose this richer report.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-060 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic `AiBudgetGuard` with atomic in-process maximum-cost reservations scoped by project and authenticated user. Concurrent reservations include current settled plus reserved cost before admitting another request, preventing a server instance from crossing the configured hard budget.
- Versioned pricing is injected from `TEHQIQ_AI_PRICING_CONFIG_JSON` using provider/model-specific input and output USD-per-million-token entries. Missing, malformed, duplicate, or unmatched pricing fails closed; transient commercial prices are not hard-coded in core logic.
- Trusted project `aiBudgetPolicy` can override the server-only `TEHQIQ_AI_BUDGET_POLICY_JSON`. Policies validate soft/hard limits, per-request provider-call maximum, repeated-loop maximum, and optional FAST/MAIN/REVIEW remaining-budget routing thresholds.
- Each gateway task supplies a server-owned budget declaration containing estimated input tokens, maximum output tokens, loop identity/iteration, and premium-review status. The guard reserves the maximum cost across all permitted provider attempts before provider execution.
- Provider retries are bounded to 1–4 calls by validated policy and record the exact call count. Repeated loop identities and declared iterations fail before model invocation once the configured limit is reached.
- Settlement tracks request count, provider calls, premium reviews, provider/model, provider-reported input/output tokens, estimated cost, and released reservation per project/user. Gateway success/failure events record pricing version, cost, calls, premium-review flag, and soft-limit status.
- Hard-limit and tier-threshold failures return explicit budget errors without provider invocation. Soft limits remain advisory and visible rather than silently changing the requested model tier.

### Files changed and migrations

- `src/server/aiBudgetGuard.ts` (created)
- `src/tests/aiBudgetGuard.test.ts` (created)
- `src/server/aiGateway.ts`
- `src/tests/aiGateway.test.ts`
- `server.ts`
- `.env.example`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted research-data migration is required. Gateway event documents gain additive budget metadata. Existing projects may add a trusted `aiBudgetPolicy`; otherwise the required server policy applies. Deployment must supply versioned pricing configuration before AI execution.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/aiBudgetGuard.test.ts src/tests/aiGateway.test.ts src/tests/privacyTaskRouter.test.ts src/tests/modelRouter.test.ts src/tests/localModelProviders.test.ts` — exit `0`; PASS, 5/5 files and 33/33 tests.
3. `npm test` — exit `1`; 72/74 executed files passed and 624/626 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established unrelated failures remain: the Crossref test expects legacy error wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Tests cover hard-budget denial, concurrent-reservation protection, per-project/user isolation, repeated-loop denial, explicit iteration limits, versioned cost estimation, token/provider/model/call/premium tracking, soft-limit state, routing thresholds, configuration rejection, and gateway retries stopping at the configured maximum.
- Cost is an estimate based on versioned operator-supplied pricing and provider-reported tokens. Calls without provider token metadata still record request/provider-call counts but have `0` token-derived incremental cost; operators must select providers that report usage when cost precision is required.
- The current budget store is atomic only inside one server process and resets on restart. Horizontally scaled or restart-durable hard-budget enforcement requires replacing the injected store with a shared transactional implementation before relying on it as a financial control.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-059 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic privacy-aware task router supporting `Standard Cloud`, `Private/Hybrid`, and `Local-Only`. Mode is taken first from the authenticated project document's `aiPrivacyMode`, then the server-only `TEHQIQ_AI_PRIVACY_MODE`; existing projects without either retain the documented `Standard Cloud` compatibility default.
- Every AiGateway invocation now declares sensitivity, raw-upload inclusion, explicit permitted provider IDs, and preferred FAST/MAIN/REVIEW tier. Missing, duplicated, invalid, or tier-inconsistent declarations fail before provider use.
- `Standard Cloud` prefers an explicitly permitted available cloud provider. `Private/Hybrid` prefers private then local infrastructure and prohibits cloud use for confidential/restricted or raw-upload tasks. `Local-Only` accepts only explicitly classified local infrastructure and never falls back to cloud/private.
- Local/general endpoint deployment location must be explicitly asserted server-side as `Local` or `Private` through `TEHQIQ_LOCAL_LLM_LOCATION`; it is not inferred from a URL or accepted from the request. The endpoint must also pass the TQ-VSC-058 health check before it is available.
- If no available provider satisfies the task declaration and mode, gateway execution stops before any provider call and the API returns `Cannot Run Under Current Privacy Mode`. Privacy mode is never silently downgraded.
- Gateway success/failure ledger events now retain privacy mode, sensitivity, and raw-upload inclusion alongside provider/model provenance.

### Files changed and migrations

- `src/server/privacyTaskRouter.ts` (created)
- `src/tests/privacyTaskRouter.test.ts` (created)
- `src/server/aiGateway.ts`
- `src/server/modelRouter.ts`
- `src/server/localModelProviders.ts`
- `src/tests/aiGateway.test.ts`
- `server.ts`
- `.env.example`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No bulk data migration is required. `aiPrivacyMode` is an optional project field for backward compatibility. Existing projects default to the documented server mode; deployments can set a safer global default. Existing gateway event readers remain compatible with the added fields.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/privacyTaskRouter.test.ts src/tests/aiGateway.test.ts src/tests/modelRouter.test.ts src/tests/localModelProviders.test.ts src/tests/authMiddleware.test.ts` — exit `0`; PASS, 5/5 files and 33/33 tests.
3. `npm test` — exit `1`; 71/73 executed files passed and 617/619 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established unrelated failures remain: the Crossref test expects legacy error wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Tests prove each privacy mode's provider ordering, cloud blocking for confidential/raw-upload work, explicit permitted-provider enforcement, unavailable-local blocking, declaration/tier validation, trusted project-mode precedence, legacy default behavior, explicit endpoint trust-boundary classification, and gateway-level blocking before provider invocation.
- The four currently mounted language tasks declare project content `Confidential`, no raw uploads, both configured gateway providers as potentially permitted, and their registered model tier. Consequently they run on cloud only in Standard Cloud; Private/Hybrid and Local-Only require an appropriately classified healthy open/local endpoint.
- TQ-VSC-060 now supplies budgets, bounded retries, and loop protection. This prompt still does not certify that an operator's Local/Private location assertion is true; deployment governance and network controls must verify that assertion.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-058 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added configurable server-endpoint adapters for SPECTER2-compatible scientific embeddings, BGE-M3-compatible general embeddings, Whisper-compatible transcription, Qwen-VL-compatible vision/document analysis, and an OpenAI-compatible local general LLM endpoint such as a separately hosted gpt-oss/Qwen service.
- Every adapter starts as `Not Configured` when its endpoint is absent or invalid and as `Configured` when an HTTP(S) endpoint exists. Mocked `/health` checks transition configured adapters to `Healthy`, `Unavailable` for non-success HTTP status, or `Failed` for transport/malformed-health failures.
- The capability registry routes only `Healthy` providers. Direct inference calls also fail closed until health has been verified, and health/request calls use bounded timeouts.
- Adapter response contracts validate embedding vectors, transcript shape, vision/document blocks and warnings, and OpenAI-compatible chat output before returning data. Server API keys are sent only as bearer headers and are not exposed in provider status.
- All configuration uses server-only environment variables. Status explicitly identifies execution as `Server Endpoint`; no code or UI claims these models execute in-browser.

### Files changed and migrations

- `src/server/localModelProviders.ts` (created)
- `src/tests/localModelProviders.test.ts` (created)
- `.env.example`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. Existing Gemini gateway/model routing and existing `TRANSCRIPTION_SERVICE_URL` behavior remain compatible; the new Whisper adapter accepts that variable as a fallback when `TEHQIQ_WHISPER_ENDPOINT` is absent.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/localModelProviders.test.ts src/tests/aiGateway.test.ts src/tests/modelRouter.test.ts src/tests/mediaTranscriptionProvider.test.ts src/tests/richDocumentParser.test.ts` — exit `0`; PASS, 5/5 files and 31/31 tests.
3. `npm test` — exit `1`; 70/72 executed files passed and 608/610 executed tests passed, with 2 emulator-only files and 18 tests skipped. The same two established unrelated failures remain: the Crossref test expects legacy error wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Mocked tests cover missing configuration without network access; all required health states; capability routing restricted to healthy providers; fail-closed pre-health invocation; bearer-key privacy; request/response contracts for embeddings, transcription, vision/documents, and general LLM output; and gateway-compatible token usage mapping.
- TQ-VSC-059 now selects healthy permitted providers through a privacy-aware server boundary; the adapter behavior implemented here is unchanged.
- Actual endpoint deployment, model installation, capacity, model quality, and runtime health are external operational responsibilities and are not represented as verified by mocked adapter tests.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-057 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a dedicated configurable `ModelRouter` with server-only `TEHQIQ_MODEL_FAST`, `TEHQIQ_MODEL_MAIN`, and `TEHQIQ_MODEL_REVIEW` configuration. Feature routes no longer contain or select model IDs.
- Registered `Language—Standard` agents route to FAST, other language agents route to MAIN, and peer-review/compliance/integrity review identities route to REVIEW. Deterministic-agent rejection remains enforced by the AiGateway before provider execution.
- Environment values are trimmed and validated as bounded whitespace-free model IDs. Explicit safe defaults preserve existing behavior when variables are absent, and `.env.example` documents all three server-only settings.
- AiGateway requests now distinguish `Structured Output` from `Controlled Tools`. Structured tasks always send the configured response schema and JSON MIME type and reject attached tools.
- Controlled-tool tasks require a registry-allowed tool ID, an SDK-safe function name, non-empty description, and parameters. Gemini receives only the declared function definitions plus `ANY` function-calling mode constrained by `allowedFunctionNames`; response-schema settings are not mixed into tool calls.
- The installed `@google/genai` provider remains the sole SDK boundary created in TQ-VSC-056. API keys and model configuration remain server-side.

### Files changed and migrations

- `src/server/modelRouter.ts` (created)
- `src/tests/modelRouter.test.ts` (created)
- `src/server/aiGateway.ts`
- `src/tests/aiGateway.test.ts`
- `server.ts`
- `.env.example`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. Deployments may optionally set the three new server environment variables; absent values retain the prior Gemini model as an explicit central default.

### Verification and tests

1. `npm run lint` — PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/modelRouter.test.ts src/tests/aiGateway.test.ts src/tests/agentRegistry.test.ts src/tests/apiSchemas.test.ts` — PASS, 4/4 files and 25/25 tests.
3. `npm test` — suite reported FAIL; 69/71 executed files passed and 602/604 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `rg -n 'gemini-[0-9]|TEHQIQ_MODEL_' server.ts src/server --glob '*.{ts,tsx}'` — PASS; the only model default/environment reads are centralized in `src/server/modelRouter.ts`, with none in feature routes.
6. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Tests prove FAST/MAIN/REVIEW tier selection, environment-driven changes across each tier without feature-code edits, fallback defaults, invalid-ID rejection, structured schema configuration, rejection of tools on structured tasks, undeclared-tool rejection, SDK-safe controlled declarations, and explicit function allowlisting.
- Existing route behavior is preserved because all three central defaults currently resolve to the prior model unless deployment configuration overrides them.
- Non-Gemini/local provider adapters and provider health states are implemented by TQ-VSC-058, with privacy-aware routing implemented by TQ-VSC-059.
- TQ-VSC-064 and all later prompts remain `NOT STARTED`.

## TQ-VSC-056 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a central server-side `AiGateway` and the sole approved Gemini SDK provider boundary. The generic agent, draft-section, peer-review, and methodology-proposal routes no longer instantiate the SDK or call `models.generateContent` directly.
- Gateway requests require authenticated project/actor/role context, a registered non-deterministic AgentRegistry ID, a prompt version, response schema ID/schema, server-owned instructions, and unique input artifact IDs whose types are allowed by the agent contract.
- Model selection is delegated to an injected minimal `AiModelRouter` interface. TQ-VSC-056 supplies a static compatibility router only; environment/configurable model policy remains correctly reserved for TQ-VSC-057.
- Provider output is accepted only after the route-specific runtime schema validator succeeds. The gateway creates a traceable review-pending output artifact and records provider, actual/routed model, prompt version, response schema, trace ID, input artifact IDs, output artifact ID, and available prompt/output/total token usage.
- Every provider/schema success must atomically persist its review-pending output under `aiOutputArtifacts` and matching ledger event under `aiGatewayEvents` before the route returns successful research output. Provider, empty-output, and schema failures record `Failed` with `outputArtifactId: null`; a failed persistence batch fails the request rather than returning an unlogged successful artifact.
- Gateway errors exposed by routes are sanitized and include trace/failure metadata when a failure event exists. Provider exception text and secrets are not returned.
- Legacy UI integrity notices no longer label these endpoints as direct-call bypasses. They remain honestly `Incomplete` until gateway-event reconciliation into the legacy project `aiLedger` array is implemented by later ledger work.

### Files changed and migrations

- `src/server/aiGateway.ts` (created)
- `src/tests/aiGateway.test.ts` (created)
- `server.ts`
- `src/components/views/WritingStudioView.tsx`
- `src/components/views/PeerReviewView.tsx`
- `src/components/views/ProtocolBuilderView.tsx`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No destructive data migration is required. New server records are append-only documents under `projects/{projectId}/aiGatewayEvents/{eventId}` and `projects/{projectId}/aiOutputArtifacts/{artifactId}`. Existing project-level `aiLedger` arrays remain readable and are not falsely marked complete.

### Verification and tests

1. `npm run lint` — PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/aiGateway.test.ts src/tests/apiSchemas.test.ts src/tests/authMiddleware.test.ts src/tests/agentRegistry.test.ts src/tests/methodologyWorkspace.test.tsx src/tests/phase6.test.ts` — PASS, 6/6 files and 42/42 tests.
3. `rg -n "models\\.generateContent|new GoogleGenAI|getGeminiClient" --glob '*.{ts,tsx}' . --glob '!node_modules/**' --glob '!dist/**'` — PASS; only `src/server/aiGateway.ts` contains SDK construction/provider invocation, and no legacy helper remains.
4. `npm test` — suite reported FAIL; 68/70 executed files passed and 598/600 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom integration test reports `window.localStorage.setItem is not a function`.
5. `npm run build` — PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
6. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Gateway tests cover successful routing/schema validation, review-pending output creation, token usage, trace/provider/model/prompt metadata, input/output artifact linkage, durable success logging, role/agent/artifact rejection, provider and schema failure records, ledger-write failure, and provider-error sanitization.
- A source-level regression test recursively scans production TypeScript and fails if `GoogleGenAI` construction or `models.generateContent` appears outside the approved gateway/provider module.
- The existing route response fields remain available; gateway metadata is additive. Failures never create or return a successful research output.
- The static model router is intentionally not configurable in this prompt. Provider abstractions beyond Gemini, privacy routing, budgets, retries, and full canonical AI-ledger reconciliation belong to later prompts and were not implemented.
- TQ-VSC-057 and all later prompts remain `NOT STARTED`.

## TQ-VSC-055 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a proposal-only `ManuscriptEditorAgent` supporting the bounded operations requested by this prompt: repetition removal, terminology/acronym harmonization, transitions/order, approved cross-references, tense/style alignment, and word-limit compliance.
- Input requires an explicit user request, attributable project/user context, an approved source section, unique approved claims with evidence/source/NumericEvidence provenance, and a fixed list of requested editor operations. Terminology replacements and cross-references must be supplied as researcher-approved allowances.
- Output uses structured pre/post claim records. Every original claim must be retained or explicitly removed, no new/duplicate claim ID is permitted, provenance arrays must remain exact, and proposed content must exactly match the ordered post-edit claims.
- Deterministic comparison blocks changed/added numbers, citations, protected statistical direction/significance/negation terms, removed uncertainty markers, new overstatement language, and added factual vocabulary outside the source claim plus narrow connective/style vocabulary and approved terminology/cross-references.
- Repetition removal cannot delete a unique claim: a removed claim must have an exact retained duplicate with identical provenance. Approved structural cross-references may contain section numbers without being misclassified as new empirical numbers.
- Successful output remains `AI Suggested—Needs Researcher Review`, includes a complete pre/post claim comparison, and returns a pending attributable AI-use log without inventing a researcher decision.

### Files changed and migrations

- `src/lib/manuscriptEditorAgent.ts` (created)
- `src/tests/manuscriptEditorAgent.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. The editor is a stateless domain service returning a proposal and pending AI-use record; existing manuscript sections remain unchanged until a separate researcher review action is implemented.

### Verification and tests

1. `npm run lint` — PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/manuscriptEditorAgent.test.ts src/tests/manuscriptSectionWriters.test.ts src/tests/manuscriptSectionContracts.test.ts` — PASS, 3/3 files and 26/26 tests.
3. `npm test` — suite reported FAIL; 67/69 executed files passed and 591/593 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- The required adversarial test proves editor-introduced unsupported claim vocabulary is rejected. Additional tests block created citations/numbers, changed statistical direction, removed uncertainty, overstatement, new claim IDs, provenance changes, unaccounted claims, unique-claim deletion, self-approval, excessive word count, and unrequested operations.
- Positive tests cover safe order/transition editing, exact pre/post comparisons, pending AI-use logging, and researcher-approved structural cross-references.
- This service is not mounted in the writing UI, authenticated endpoint, persistence workflow, or canonical AI ledger. It deliberately does not implement the AiGateway reserved for TQ-VSC-056.
- TQ-VSC-056 and all later prompts remain `NOT STARTED`.

## TQ-VSC-054 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added SectionContract-driven `IntroductionWriter`, `LiteratureReviewWriter`, `MethodsWriter`, `DiscussionWriter`, `ConclusionWriter`, and `AbstractWriter` domain services. Results remains on the existing governed `ResultsInterpretationAndWritingAgent`; no competing Results writer was added.
- Each writer requires an explicit user request, attributable user/project context, and section-specific verified/approved artifacts validated by TQ-VSC-053 before a tool can run. Real projects reject demo/synthetic artifacts before invocation.
- Tools receive only cloned grounded content units and the immutable SectionContract. Accepted drafts may select and order exact units only: claim text, evidence IDs, source IDs, and NumericEvidence IDs must remain unchanged, and draft prose must exactly equal the selected claims in declared order.
- Draft-level source/NumericEvidence collections must exactly match their claim mappings. New or omitted references/provenance, invented claim IDs/text, malformed output, extra fields, ungrounded numbers, fabricated methodology text, and self-approved state fail closed.
- Successful drafts remain `AI Suggested—Needs Researcher Review` and return an attributable pending AI-use log with provider/model/prompt version, input artifact IDs, and input source IDs. The log records no fabricated researcher decision.
- Manual writing remains a separate `Researcher Draft` path and does not create an AI-use record.

### Files changed and migrations

- `src/lib/manuscriptSectionWriters.ts` (created)
- `src/tests/manuscriptSectionWriters.test.ts` (created)
- `src/lib/manuscriptSectionContracts.ts`
- `src/tests/manuscriptSectionContracts.test.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. Writer results and AI-use logs are returned as stateless domain records; existing manuscript sections and AI ledger records are unchanged.

### Verification and tests

1. `npm run lint` — PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/manuscriptSectionWriters.test.ts src/tests/manuscriptSectionContracts.test.ts src/tests/resultsInterpretationWritingAgent.test.ts` — PASS, 3/3 files and 25/25 tests.
3. `npm test` — suite reported FAIL; 66/68 executed files passed and 583/585 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Parameterized tests prove successful section-specific grounding for all six requested writers and confirm contract context plus pending AI-use logging.
- Negative tests prove tools are not called when requests/prerequisites fail; real-project synthetic input is blocked; invented references/provenance and factual methodology are rejected; exact NumericEvidence-backed prose is accepted; altered prose/numbers fail; and manual drafting remains available.
- Results reuse is regression-tested against the exported existing `ResultsInterpretationAndWritingAgent` rather than reimplemented.
- These domain services are not yet mounted in the writing UI, an authenticated endpoint, persistence, or the canonical AI ledger. Returning the pending AI-use record makes omission visible, but complete ledger persistence awaits the later centralized AI gateway/ledger work.
- TQ-VSC-055 and all later prompts remain `NOT STARTED`.

## TQ-VSC-053 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added an immutable typed `ManuscriptSectionContractRegistry` for Introduction, Literature Review, Methods, Results, Discussion, Conclusion, Abstract, Title, and Keywords.
- Introduction requires an approved problem statement and research gap plus verified evidence. Literature Review requires approved synthesis and a verified evidence graph. Methods requires approved methodology/protocol, approved analysis plan, and actual ethics information explicitly confirmed by a researcher or explicitly confirmed not applicable.
- Results accepts only analysis outputs with `Approved for Manuscript` state or researcher-approved qualitative findings. Discussion requires approved Results plus verified literature. Conclusion requires approved interpretation and Results and explicitly prohibits new empirical claims. Abstract requires approved relevant sections and approved Results. Title and Keywords require approved project content.
- Every contract shares an exact proposal output schema requiring section ID/content, claim/evidence mappings, source IDs, NumericEvidence IDs, missing information, and warnings. Output remains `AI Suggested—Needs Researcher Review` and cannot self-approve.
- Deterministic input validation rejects missing/under-reviewed prerequisites, duplicate or undeclared artifacts, and demo/synthetic artifacts supplied to a real project. Isolated demo inputs are permitted only with an explicit warning requiring visible labeling and isolation.
- Deterministic output validation rejects missing required traceability arrays, extra hidden fields, incorrect section IDs, malformed claim mappings, and self-approved status.

### Files changed and migrations

- `src/lib/manuscriptSectionContracts.ts` (created)
- `src/tests/manuscriptSectionContracts.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. These are stateless contract and validation definitions; existing `ManuscriptSection` records remain unchanged.

### Verification and tests

1. `npm run lint` — PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/manuscriptSectionContracts.test.ts` — PASS, 1/1 file and 6/6 tests.
3. `npm test` — suite reported FAIL; 65/67 executed files passed and 571/573 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — PASS.

### Acceptance coverage, compatibility, and blockers

- Tests assert the exact nine-section inventory and section-specific input requirements, actual ethics confirmation, quantitative/qualitative Results gates, complete output traceability schema, immutable proposal status, and absence of any default content field.
- Real-project adversarial tests reject demo/synthetic input rather than allowing hidden demonstration facts to enter a section contract. The contract definitions contain no example research content, empirical defaults, or inferred project facts.
- This prompt defines and validates contracts only. It does not implement or wire the evidence-constrained manuscript writer agents reserved for TQ-VSC-054, and it does not modify the existing generic drafting endpoint/UI.
- The two full-suite failures are pre-existing and unrelated to SectionContracts; typecheck, focused tests, production build, and diff validation pass.
- TQ-VSC-054 and all later prompts remain `NOT STARTED`.

## TQ-VSC-052 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a deterministic `WorkflowOrchestrator` with a fixed server-owned route for every registered agent. Each route controls workflow kind, stage, exact prerequisite artifact keys and acceptable review states, permitted registry roles, output storage destination, proposal/review status, and the registry-defined next states.
- Planning returns either a frozen dispatch plan or an explicit list of missing prerequisites. It never invokes a model/tool, chooses a free-form agent, chains another agent, auto-approves output, writes output, or advances workflow state.
- Runtime requests for unregistered agents, incorrect stages/workflow kinds, unauthorized roles, absent or insufficiently reviewed artifacts, duplicate artifacts, and inputs outside the agent contract fail closed.
- Flexible entry is artifact-governed rather than order-forced: supplied literature can enter systematic-review screening, approved qualitative findings can enter Results writing, and existing dataset or existing methodology projects can enter analysis planning when all required governed artifacts are present.
- Deterministic outputs remain `Needs Researcher Review`; language-agent outputs remain `AI Suggested`. Every successful plan sets `approvalRequired: true` and `automaticNextAgent: null`.

### Files changed and migrations

- `src/server/workflowOrchestrator.ts` (created)
- `src/tests/workflowOrchestrator.test.ts` (created)
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted schema or data migration is required. The orchestrator is a stateless server-domain planning boundary over TQ-VSC-051 contracts and supplied artifact metadata.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/workflowOrchestrator.test.ts src/tests/agentRegistry.test.ts` — exit `0`; PASS, 2/2 files and 13/13 tests.
3. `npm test` — exit `1`; 64/66 executed files passed and 565/567 executed tests passed, with 2 emulator-only files and 18 tests skipped. The established Crossref assertion expects legacy wording, and the established jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Acceptance coverage, compatibility, and blockers

- Tests cover the required empirical, systematic-review, qualitative, existing-dataset, and existing-methodology paths, including flexible entry through researcher uploads/inputs with required approval or verification states.
- Negative tests cover missing/under-reviewed prerequisites, incorrect stage, incompatible workflow kind, viewer access, undeclared input, duplicate artifact keys, unregistered runtime agent IDs, and quantitative outputs lacking `Approved for Manuscript` status.
- Output storage is declared but deliberately not performed by this pure planner. Persistence, authenticated endpoint wiring, and state mutation must use a later dedicated server boundary; no such later prompt was implemented here.
- SectionContracts, manuscript writer agents, EditorAgent, and the AI gateway remain outside this prompt.
- The full-suite failures are pre-existing and unrelated to the orchestrator; focused tests, typecheck, build, and diff validation pass.
- TQ-VSC-053 and all later prompts remain `NOT STARTED`.

## TQ-VSC-051 verification details

### Status and implementation

- **Status:** COMPLETE — acceptance criteria PASS.
- Added a typed, immutable, server-controlled `AgentRegistry` containing 19 explicit contracts: research intake, outlet matching, search planning, literature retrieval, screening, evidence extraction, literature synthesis, contradiction detection, research gap, question/hypothesis, methodology design, analysis planning, results interpretation/writing, section writing, peer review, compliance, integrity review, manuscript editing, and export.
- Every contract declares its stable ID, bounded purpose, allowed input artifacts and tools, output schema ID/version/required fields, model tier, prerequisite workflow states, human-review rule, next states, prohibited behavior, and server-side role/frontend permissions.
- The existing generic `/api/gemini/agent` boundary now accepts a registered `agentId` and declared context only. It rejects arbitrary/unknown IDs, disallowed agents, unauthorized roles, undeclared input artifacts, deterministic/non-language agents, extra fields, and client-authored arbitrary task prompts before model invocation.
- Only `research-intake` is frontend-callable. Its authenticated project route establishes the required existing-project state, and its model output remains a structured proposal requiring researcher review. All later-workflow agents remain server-only until their workflow prerequisites can be verified by dedicated server orchestration.
- The mounted Research Canvas request now invokes the bounded intake contract with only a researcher-supplied description and stated classification; missing classification stays explicitly `Missing`.

### Files changed and migrations

- `src/server/agentRegistry.ts` (created)
- `src/tests/agentRegistry.test.ts` (created)
- `src/server/apiSchemas.ts`
- `src/tests/apiSchemas.test.ts`
- `src/components/views/ResearchCanvasView.tsx`
- `server.ts`
- `docs/CURRENT_IMPLEMENTATION_REGISTER.md`
- `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`
- No persisted data migration is required. The HTTP request contract intentionally replaces legacy `agentType`/free-form `prompt` with `agentId` plus bounded context; the only repository caller was migrated in the same change.

### Verification and tests

1. `npm run lint` — exit `0`; PASS (`tsc --noEmit`).
2. `npx vitest run src/tests/agentRegistry.test.ts src/tests/apiSchemas.test.ts src/tests/authMiddleware.test.ts` — exit `0`; PASS, 3/3 files and 21/21 tests.
3. `npm test` — exit `1`; 63/65 executed files passed and 557/559 executed tests passed, with 2 emulator-only files and 18 tests skipped. The two established failures remain: the Crossref test expects legacy wording, and the jsdom integration test reports `window.localStorage.setItem is not a function`.
4. `npm run build` — exit `0`; PASS, 2,009 Vite modules transformed and the server bundle produced. Existing browser-`crypto` externalization and large-chunk warnings remain.
5. `git diff --check` — exit `0`; PASS.

### Acceptance coverage, compatibility, and blockers

- Contract tests assert the exact required registry inventory, unique IDs, complete contract fields, immutable server definitions, human-review/no-fabrication/no-self-approval rules, the single bounded frontend permission, writer access, and rejection of unknown agents, internal agents, viewers, undeclared artifacts, duplicate IDs, and incomplete contracts.
- API schema tests prove legacy arbitrary `agentType` and client-authored prompt fields are rejected.
- This prompt does not implement the deterministic WorkflowOrchestrator, SectionContracts, model gateway/router, or later agent implementations. Registry entries describe and constrain those future server integrations; they do not claim those agents are all executable today.
- The full-suite failures are pre-existing and unrelated to the registry change; focused registry/security tests, typecheck, and build pass.
- TQ-VSC-052 and all later prompts remain `NOT STARTED`.

## TQ-VSC-064 verification details

- **Status:** PASS — gateway ledger events now include feature, section, and explicit researcher disposition (`Proposed` on successful AI output, `Rejected` on failed execution); missing metadata receives an explicit researcher-input-required section label.
- **Files changed:** `src/server/aiGateway.ts`; `src/lib/aiValidationService.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** Backward-compatible optional event fields; existing legacy `aiLedger` records remain readable. No destructive migration.
- **Verification:** `npm run lint` PASS; `npx vitest run src/tests/aiGateway.test.ts src/tests/aiLedgerIntegrity.test.ts` PASS (15/15). Build/full suite not rerun because this change is type/test scoped; prior baseline failures remain documented above.
- **Acceptance:** PASS for complete gateway event metadata and disclosure completeness assessment. Normal AI model invocation remains centralized in `AiGateway`; TQ-VSC-065 and later prompts were not executed.

## TQ-VSC-065 verification details

- **Status:** PASS — EthicsWorkspaceView is now part of the real methodology/protocol workflow and renders explicit missing/not-applicable states for approval, registration, and consent data. Existing export compliance gates continue to block required ethics approval while allowing explicitly non-required studies through.
- **Files changed:** `src/App.tsx`; `src/types.ts`; `src/components/views/EthicsWorkspaceView.tsx`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** Added optional backward-compatible ethics fields (`protocolId`, `consentWaiver`, `privacyConsiderations`); no existing project records are rewritten.
- **Verification:** `npm run lint` and focused ethics/export tests executed below; `git diff --check` PASS.
- **Acceptance:** PASS. TQ-VSC-066 and later prompts were not executed.

## TQ-VSC-066 verification details

- **Status:** PASS — author records retain identity, affiliation, optional ORCID, corresponding status, CRediT roles, and now attributable sign-off actor, timestamp, and rationale. Sign-off remains a trusted, RBAC-protected human transition; AI/system actors cannot satisfy it.
- **Files changed:** `src/types.ts`; `src/server/trustedTransitions.ts`; `src/tests/trustedTransitions.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** New sign-off provenance fields are optional and backward-compatible with existing authors. No records are rewritten.
- **Verification:** `npm run lint` and focused trusted-transition/export tests passed; `git diff --check` passed.
- **Acceptance:** PASS. TQ-VSC-067 and later prompts were not executed.

## TQ-VSC-067 verification details

- **Status:** PASS — added the explicit `runJournalComplianceAgent` boundary over the existing deterministic compliance engine. It calculates requirements from the selected verified outlet and live project data, preserving field-level source record and retrieval-date provenance; no static green checks or fabricated values are introduced.
- **Files changed:** `src/lib/complianceEngine.ts`; `src/tests/outletRequirements.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; pure compatibility wrapper over existing project/outlet schemas.
- **Verification:** `npm run lint`; focused outlet/export tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-068 and later prompts were not executed.

## TQ-VSC-068 verification details

- **Status:** PASS — added bounded specialist reviewer contracts for methodological, statistical, domain, citation, journal-editor, and language-clarity review. Outputs are structured issues and remain explicitly AI suggestions; unavailable providers return `Reviewer Unavailable` with no simulated comments.
- **Files changed:** `src/lib/specialistReviewAgents.ts`; `src/tests/specialistReviewAgents.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; new pure service boundary is additive and does not alter stored review records.
- **Verification:** `npm run lint`; focused specialist review tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-069 and later prompts were not executed.

## TQ-VSC-069 verification details

- **Status:** PASS — added deterministic review synthesis grouping (P0/Major/Moderate/Minor), a five-state issue lifecycle, and a resolution boundary requiring attributable researcher action/rationale plus revalidation for verified resolution. RevisionWorkspaceView is now rendered in the live workflow.
- **Files changed:** `src/lib/reviewLifecycle.ts`; `src/tests/reviewLifecycle.test.ts`; `src/App.tsx`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; additive lifecycle metadata and existing reviewer comments remain readable.
- **Verification:** `npm run lint`; focused review lifecycle tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-070 and later prompts were not executed.

## TQ-VSC-070 verification details

- **Status:** PASS — added a researcher-facing six-stage navigation map (Project & Target, Evidence, Method & Data, Analysis, Manuscript, Review & Export) that groups all existing ten legacy steps without deleting or hiding capabilities.
- **Files changed:** `src/components/Navigation.tsx`; `src/tests/researchStages.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** Legacy numeric step IDs remain supported for compatibility and deep links; no persisted data changes.
- **Verification:** `npm run lint`; focused navigation-stage test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-071 and later prompts were not executed.

## TQ-VSC-071 verification details

- **Status:** PASS — connected Dashboard, Journal Finder, Ethics, Reporting Checklist, Peer Review, Revision, AI Ledger, Compliance Centre, and Export views into live App workflow destinations. Existing Search Planner remains in the evidence stage; no valid feature was removed or falsely routed.
- **Files changed:** `src/App.tsx`; `src/tests/appViewRouting.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; existing numeric workflow destinations and persisted project data remain compatible.
- **Verification:** `npm run lint`; focused routing test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-072 and later prompts were not executed.

## TQ-VSC-072 verification details

- **Status:** PASS — removed optimistic `Math.max(taskPercentage, readiness.overall)` behavior, exposed a mandatory-gate `calculateSubmissionReadiness` result, and retained separate workflow/scientific readiness scoring. Submission blockers remain conditional on actual citation, analysis, ethics, AI disclosure, author, and demo state.
- **Files changed:** `src/lib/readinessCalculator.ts`; `src/components/Navigation.tsx`; `src/tests/readinessCalculator.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; readiness is derived from current project records.
- **Verification:** `npm run lint`; focused readiness test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-073 and later prompts were not executed.

## TQ-VSC-073 verification details

- **Status:** PASS — added a shared truthful operation-state vocabulary (`Pending`, `Running`, `Partial`, `Failed`, `Not Configured`, `Completed`, `Needs Review`) and constructors that prevent failed/unconfigured/provider-review outcomes from being represented as success.
- **Files changed:** `src/lib/operationState.ts`; `src/tests/operationState.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; additive utility, existing persisted statuses remain readable.
- **Verification:** `npm run lint`; focused operation-state tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-074 and later prompts were not executed.

## TQ-VSC-074 verification details

- **Status:** PASS — added genuine structural LaTeX manuscript generation with title, authors, abstract, section hierarchy, escaped characters, and bibliography linkage to the existing BibTeX export.
- **Files changed:** `src/lib/exportUtils.ts`; `src/tests/latexExport.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; export-only addition.
- **Verification:** `npm run lint`; focused LaTeX fixture test; `git diff --check`. No LaTeX compiler was available, so validation is structural only.
- **Acceptance:** PASS. TQ-VSC-075 and later prompts were not executed.

## TQ-VSC-076 verification details

- **Status:** PASS — JATS validation now reports `Structural Check Passed` for internal tag checks and no longer claims NLM/DTD compliance. Added optional `JATS_VALIDATOR_SERVICE_URL` adapter with explicit `Validator Not Configured` and schema failure states.
- **Files changed:** `src/lib/exportUtils.ts`; `src/components/views/ExportCentreView.tsx`; `src/tests/exportValidation.test.ts`; `src/tests/jatsTruthfulness.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; labels corrected to reflect actual validation performed.
- **Verification:** `npm run lint`; focused JATS/export tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-077 and later prompts were not executed.

## TQ-VSC-077 verification details

- **Status:** PASS — export formatting now consults the latest versioned reference-style requirement and applies it only when the record is Verified and human-confirmed; otherwise the configured project style remains visible rather than inventing outlet rules.
- **Files changed:** `src/components/views/ExportCentreView.tsx`; `src/tests/outletFormatting.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; existing outlet/project formatting fields remain backward-compatible.
- **Verification:** `npm run lint`; focused outlet-formatting test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-078 and later prompts were not executed.

## TQ-VSC-078 verification details

- **Status:** PASS — hardened supported export formats against fabricated fallback years, preserving explicit missing metadata instead of emitting invented publication dates. Added cross-format truthfulness fixtures alongside existing DOCX/PDF/BibTeX/RIS/CSL/JATS tests.
- **Files changed:** `src/lib/exportUtils.ts`; `src/tests/exportTruthfulness.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; export behavior is backward-compatible, with missing years now represented as `n.d.`/omitted rather than fabricated.
- **Verification:** `npm run lint`; focused export truthfulness tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-079 and later prompts were not executed.

## TQ-VSC-079 verification details

- **Status:** PASS — added a provider-neutral embedding abstraction supporting scientific/SPECTER2-compatible, multilingual/BGE-M3-compatible, and cloud provider kinds. Embeddings retain model/version/config, generation time, chunk/document hashes, and index versions so model swaps do not orphan source locations.
- **Files changed:** `src/lib/embeddingProvider.ts`; `src/tests/embeddingProvider.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; additive metadata model; prior provenance remains authoritative.
- **Verification:** `npm run lint`; focused embedding-provider test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-080 and later prompts were not executed.

## TQ-VSC-080 verification details

- **Status:** PASS — added deterministic `EvidenceRetrievalService` behavior accepting a question/claim, ranking candidate full-text chunks by lexical relevance, returning source/evidence IDs with page/section/document provenance, and supporting project/source/date filters. Scores are explicitly relevance only.
- **Files changed:** `src/lib/evidenceRetrievalService.ts`; `src/tests/evidenceRetrievalService.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; retrieval is read-only and preserves existing EvidenceRecord provenance.
- **Verification:** `npm run lint`; deterministic retrieval test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-081 and later prompts were not executed.

## TQ-VSC-081 verification details

- **Status:** PASS — added a repeatable fixture-based RAG benchmark producing machine-readable recall@k, precision@k, provenance-retention, and wrong-source-rate metrics with deterministic thresholds suitable for regression checks.
- **Files changed:** `src/lib/evidenceRetrievalService.ts`; `src/tests/ragBenchmark.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; benchmark is read-only.
- **Verification:** `npm run lint`; deterministic RAG benchmark test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-082 and later prompts were not executed.

## TQ-VSC-082 verification details

- **Status:** PASS — expanded the scientific-integrity regression harness with deterministic checks for unapproved Results, missing sample/p-value/effect-size fallbacks, invented ethics approval, unsupported Q1 claims, object-URL persistence, and empty-ledger false “no AI” assertions. Existing DOI, provenance, demo-isolation, approval, outlet, and self-approval invariants remain covered.
- **Files changed:** `src/tests/helpers/scientificIntegrityInvariants.ts`; `src/tests/scientificIntegrityRegression.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; test-only changes.
- **Verification:** `npm run lint`; scientific-integrity regression tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-083 and later prompts were not executed.

## TQ-VSC-083 verification details

- **Status:** PASS — added adversarial regression expectations covering no-data Results, significance manipulation, unsupported sample size, invented ethics IDs, fake DOI, unverified Q1 claims, object-URL persistence, and evasion/guarantee requests. All fail closed with explicit integrity violations.
- **Files changed:** `src/tests/adversarialResearchSafety.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; test-only changes.
- **Verification:** `npm run lint`; adversarial safety tests; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-084 and later prompts were not executed.

## TQ-VSC-084 verification details

- **Status:** PASS — added a golden-dataset coverage guard ensuring every enabled deterministic analysis method is discoverable and executable for independently authored fixture tests. Existing common-comparison, regression, and specialized golden fixtures remain the expected-value source; no LLM judge or fabricated statistics are used.
- **Files changed:** `src/tests/goldenDatasetValidation.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; test-only coverage.
- **Verification:** `npm run lint`; golden-dataset coverage test; `git diff --check`.
- **Acceptance:** PASS. TQ-VSC-085 and later prompts were not executed.

## TQ-VSC-075 verification details

- **Status:** PASS — added a manifest builder for submission packages that filters out empty/nonexistent candidates and records project/export IDs, timestamp, manuscript version, target-outlet version, gate results, and file metadata.
- **Files changed:** `src/lib/exportUtils.ts`; `src/tests/submissionPackage.test.ts`; `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`.
- **Migration:** None; additive export metadata only.
- **Verification:** `npm run lint`; focused submission-package test; `git diff --check`.
- **Acceptance:** PASS for omission of nonexistent placeholder files. TQ-VSC-076 and later prompts were not executed.
