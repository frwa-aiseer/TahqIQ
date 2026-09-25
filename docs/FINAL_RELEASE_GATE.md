# TehqIQ final production-readiness gate

**Prompt:** TQ-VSC-095  
**Date:** 2026-09-19  
**Decision:** **PARTIAL — NOT READY FOR PRODUCTION APPROVAL**  
**Prototype warning:** **RETAINED.** This gate does not remove the global “Prototype environment — not approved for real research use” warning.

This is an evidence report, not a claim that every release control is complete. `PASS` means the named current-tree check ran and passed. `PARTIAL` means evidence exists but a required environment, test, or capability is incomplete. `NOT TESTED` means no current-run evidence is claimed.

## Gate results

| Area | Status | Current evidence | Release implication |
| --- | --- | --- | --- |
| TypeScript | PASS | `npm run lint` (`tsc --noEmit`) exited 0. | No current typecheck failure. |
| Production build | PASS | `npm run build` exited 0; Vite transformed 2,017 modules and esbuild produced `dist/server.cjs`. | Existing warnings remain for browser `crypto` externalization and a >500 kB application chunk. |
| Full test suite | PARTIAL | `npm test`: 104 files passed, 2 failed, 2 skipped; 712 passed, 2 failed, 18 skipped. | Two known failures remain: incomplete jsdom `localStorage` mock (`integration.test.ts`) and provider-dependent DOI wording (`phase3.test.ts`). |
| Scientific integrity | PASS | Focused current run: 16 files, 106 tests passed, including final integrity, invariant, regression, adversarial-safety, lifecycle, numeric grounding, and data-integrity suites. | Tested paths fail closed for unsupported evidence, approvals, empirical values, and demo contamination. |
| Citation integrity | PASS | Current focused run includes `citationVerifierRules.test.ts`, `citationAuditAgent.test.ts`, `writingEvidenceIntegrity.test.ts`, and export truthfulness coverage. | Citation/source verification remains distinct from registry metadata and peer-review claims. |
| Statistics validation | PASS | Current focused run includes numeric evidence/grounding, analysis registry, statistical sensitivity, lifecycle, and data-integrity tests. | Analysis execution and manuscript reuse remain approval- and provenance-gated. |
| Provenance and evidence trace | PASS | Current focused run includes evidence records, claim-evidence graph, source-integrity verification, evidence retrieval, and full-text provenance tests. | Exact evidence locations and source links are retained and revalidated. |
| Methodology governance | PASS | Current focused run includes methodology workspace, methodology-design agent, analysis-planning agent, manuscript contracts, and approval tests. | Missing fields remain explicit; AI/uploaded methodology remains review-pending. |
| Outlet provenance | PASS | Current focused run includes baseline outlet identity, metrics, requirements, formatting, and outlet-matching tests. | Outlet identity and field-level requirements are not substituted with unsupported Q1/indexing/metric claims. |
| Firebase/server/storage security | PARTIAL | Static/auth/RBAC/rules/security group: 12 files, 82 tests passed; 8 emulator tests skipped. `npm run test:firestore-rules` and `npm run test:storage-rules` could not start because Java is unavailable. | Emulator-backed rules evidence must be rerun in a Java-enabled release environment. Current `.env` also reports Firebase `Not Configured`, so cloud auth/persistence are unavailable locally. |
| Privacy routing | PASS | `privacyTaskRouter.test.ts` passed in the current security group; local/private/cloud restrictions and raw-upload routing are covered. | Privacy mode decisions are deterministic and fail closed when no eligible provider exists. |
| AI ledger and gateway | PASS | Current security group includes AI gateway, ledger-integrity, budget-guard, and agent contract tests; all executed tests passed. | AI responses remain proposals, attribution is recorded, and budget/privacy failures are explicit. |
| Export validation | PASS | Current export group passed 20 files / 84 tests, including DOCX/PDF/LaTeX/BibTeX/RIS/CSL/JATS/package and blocker validation. | Implemented formats are machine-checked; external JATS validation remains explicitly Not Configured without a validator. |
| RAG benchmark | PASS | `ragBenchmark.test.ts` passed in the current export/RAG group. | Recall/precision/provenance/wrong-source regression thresholds are measured by deterministic fixtures. |
| Three governed E2E workflows | PASS | `genericEmpiricalWorkflow.e2e.test.ts`, `qualitativeWorkflow.e2e.test.ts`, and `literatureReviewWorkflow.e2e.test.ts` all passed in the current group. | The tested empirical, qualitative, and review workflows preserve their approval/provenance gates. |
| Accessibility/basic UX | PARTIAL | React/jsdom accessibility, E2E UI, novice UX, and navigation tests passed in the current group. | No visual/browser session was available; responsive layout, keyboard traversal in a real browser, and click-through behavior remain NOT TESTED. |
| Cost/failure resilience | PASS | Current resilience group: 11 files, 86 tests passed; security group also passed AI budget tests. | Provider/parser/storage/analysis failures and bounded cost/loop behavior remain explicit rather than successful fallbacks. |

## P0/P1 release assessment

No new P0 scientific-integrity defect was introduced by TQ‑VSC‑095 because this prompt changes documentation only. The current source and focused tests show no tested-path bypass of approval, provenance, demo isolation, or AI proposal boundaries. Nevertheless, the release is **not approved** because the full suite is not green, Firebase emulator rules are not currently executable, and real-browser UX coverage is unavailable. The prototype warning must remain until those release-environment gaps are resolved and a maintainer makes an explicit approval decision.

## Environment and evidence boundaries

- Local smoke check: `curl -sS -I http://localhost:3000/` returned HTTP 200 from the already-running development server.
- No browser session was available in this environment; no browser-only result is described as passed.
- No Firebase secrets were added or inferred. A deployment must provide valid `VITE_FIREBASE_*` client settings and server Firebase Admin configuration before cloud authentication, persistence, and emulator-backed release verification can be treated as configured.
- The two full-suite failures are retained as blockers/risks, not reclassified as passed or silently changed.

## Conclusion

**TQ-VSC-095 acceptance: PASS for the reporting task.** The final gate is evidence-based and records PASS/PARTIAL/NOT TESTED boundaries without false production approval. The product release decision itself remains **PARTIAL — NOT READY FOR PRODUCTION APPROVAL**.
