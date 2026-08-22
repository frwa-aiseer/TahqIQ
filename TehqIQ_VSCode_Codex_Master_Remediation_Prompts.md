# TehqIQ — VS Code / Codex Master Remediation & Agent Build File

**Purpose:** Migrate TehqIQ development from Google AI Studio to VS Code/Codex and systematically resolve the complete scientific-integrity, architecture, security, literature, methodology, analysis, multi-agent, UX, export and testing audit without restarting the application.

**Important:** This is a remediation/build sequence for the existing TehqIQ codebase. It is intentionally split into small, independently addressable prompt IDs.

## Easiest way to run it in VS Code

1. Put this file in the TehqIQ repository root, or preferably at:
   `docs/TehqIQ_VSCode_Codex_Master_Remediation_Prompts.md`
2. Open the whole TehqIQ repository folder in VS Code.
3. Open Codex in the same workspace.
4. Start with `TQ-VSC-000`.
5. You may paste the entire prompt block, OR simply tell Codex:

   **Read `docs/TehqIQ_VSCode_Codex_Master_Remediation_Prompts.md` and execute ONLY `TQ-VSC-000`. Do not execute any later prompt.**

6. After Codex reports PASS and has actually run the required checks, change only the ID:
   `TQ-VSC-001`, then `TQ-VSC-002`, and so on.
7. If a prompt reports FAIL/BLOCKED, fix/re-run that same ID before proceeding.
8. Create a Git checkpoint/commit after successful prompts or small groups of closely related prompts. Never let Codex reset/delete unrelated work.
9. Do **not** ask Codex to execute all IDs in one run.

## Why every prompt repeats the contract

You asked for each prompt to be usable on its own. Therefore every ID below includes the core safety/engineering rules instead of depending on conversational memory.

## Release principle

TehqIQ must remain marked Prototype / Not Approved for Real Research Use until `TQ-VSC-095` demonstrates, from actual test evidence, that no P0 scientific-integrity or security blocker remains.

---

## Prompt Index


### Phase 0 — Repository Control

- **TQ-VSC-000** — Create protected baseline and implementation tracker
- **TQ-VSC-001** — Add scientific-integrity invariant test harness

### Phase 1 — Scientific Integrity Reset

- **TQ-VSC-002** — Remove q1ManuscriptEngine from real projects
- **TQ-VSC-003** — Rebuild Protocol Builder as domain-neutral methodology workspace
- **TQ-VSC-004** — Remove unsafe literature/statistics injection actions
- **TQ-VSC-005** — Replace trusted-number allowlists with numeric provenance
- **TQ-VSC-006** — Separate analysis completion from researcher approval
- **TQ-VSC-007** — Make AI-use disclosure truthful when ledger is empty

### Phase 2 — Outlet Truthfulness

- **TQ-VSC-008** — Remove fabricated journal/conference generation
- **TQ-VSC-009** — Model journal metrics by provider, year and category
- **TQ-VSC-010** — Version and provenance outlet requirements

### Phase 3 — Security

- **TQ-VSC-011** — Move Firebase client config to validated environment variables
- **TQ-VSC-012** — Fix Firestore private-user and project RBAC rules
- **TQ-VSC-013** — Move high-integrity audit events to trusted server paths
- **TQ-VSC-014** — Fix research file persistence and object-URL fallback
- **TQ-VSC-015** — Add project-scoped Cloud Storage rules
- **TQ-VSC-016** — Create reusable authenticated server middleware
- **TQ-VSC-017** — Validate server request and response schemas

### Phase 4 — Provenance

- **TQ-VSC-018** — Create universal ResearchArtifact foundation
- **TQ-VSC-019** — Create passage-level EvidenceRecord
- **TQ-VSC-020** — Upgrade Claim Matrix to claim–evidence graph
- **TQ-VSC-021** — Harden sensitive state transitions and tamper detection

### Phase 5 — Literature Retrieval

- **TQ-VSC-022** — Correct bibliographic provider adapters
- **TQ-VSC-023** — Add lawful OA and specialist discovery adapters
- **TQ-VSC-024** — Build real multi-provider SearchExecution

### Phase 6 — Literature Agents

- **TQ-VSC-025** — Implement SearchStrategyAgent
- **TQ-VSC-026** — Implement LiteratureRetrievalAgent with tools
- **TQ-VSC-027** — Create deterministic source deduplication
- **TQ-VSC-028** — Implement LiteratureScreeningAgent and workbench

### Phase 7 — Universal Ingestion

- **TQ-VSC-029** — Create unified research-document ingestion router
- **TQ-VSC-030** — Add configurable rich-document parser adapter
- **TQ-VSC-031** — Add audio/video transcription adapter
- **TQ-VSC-032** — Create provenance-preserving full-text chunks
- **TQ-VSC-033** — Implement EvidenceExtractionAgent

### Phase 8 — Evidence Synthesis

- **TQ-VSC-034** — Implement LiteratureSynthesisAgent
- **TQ-VSC-035** — Implement ContradictionDetectionAgent
- **TQ-VSC-036** — Implement ResearchGapAgent

### Phase 9 — Outlet Intelligence

- **TQ-VSC-037** — Build OutletIntelligenceService
- **TQ-VSC-038** — Implement CSL-compatible reference-style architecture
- **TQ-VSC-039** — Implement OutletMatchingAgent

### Phase 10 — Research Design

- **TQ-VSC-040** — Implement ResearchIntakeAgent
- **TQ-VSC-041** — Create ReportingGuidelineRegistry and resolver
- **TQ-VSC-042** — Implement MethodologyDesignAgent
- **TQ-VSC-043** — Implement QuestionHypothesisAgent

### Phase 11 — Analysis

- **TQ-VSC-044** — Refactor statistics into AnalysisMethodRegistry
- **TQ-VSC-045** — Add deterministic common comparison methods
- **TQ-VSC-046** — Add regression, survival and diagnostic analysis architecture
- **TQ-VSC-047** — Add specialized analysis families truthfully
- **TQ-VSC-048** — Add qualitative analysis workflow
- **TQ-VSC-049** — Implement AnalysisPlanningAgent
- **TQ-VSC-050** — Implement ResultsInterpretationAndWritingAgent

### Phase 12 — Agent Architecture

- **TQ-VSC-051** — Create typed server-controlled AgentRegistry
- **TQ-VSC-052** — Create deterministic WorkflowOrchestrator
- **TQ-VSC-053** — Create explicit manuscript SectionContracts
- **TQ-VSC-054** — Implement evidence-constrained manuscript writer agents
- **TQ-VSC-055** — Implement non-inventive EditorAgent

### Phase 13 — AI Gateway

- **TQ-VSC-056** — Centralize all model calls through AiGateway
- **TQ-VSC-057** — Create configurable ModelRouter
- **TQ-VSC-058** — Add open/local model provider abstractions
- **TQ-VSC-059** — Implement privacy-aware task routing
- **TQ-VSC-060** — Add AI/API budgets and loop protection

### Phase 14 — Integrity

- **TQ-VSC-061** — Implement CitationAuditAgent
- **TQ-VSC-062** — Add source correction/retraction verification
- **TQ-VSC-063** — Create responsible originality/similarity risk engine
- **TQ-VSC-064** — Make AiLedger complete through AiGateway

### Phase 15 — Ethics & Compliance

- **TQ-VSC-065** — Integrate Ethics Workspace into real workflow
- **TQ-VSC-066** — Build authorship and human sign-off governance
- **TQ-VSC-067** — Implement JournalComplianceAgent

### Phase 16 — Peer Review

- **TQ-VSC-068** — Implement specialist reviewer agents
- **TQ-VSC-069** — Implement review synthesis and revision lifecycle

### Phase 17 — UX

- **TQ-VSC-070** — Refactor researcher navigation into six stages
- **TQ-VSC-071** — Connect currently unreachable views and remove false routes
- **TQ-VSC-072** — Correct readiness and submission-readiness calculations
- **TQ-VSC-073** — Standardize truthful loading/success/error states

### Phase 18 — Export

- **TQ-VSC-074** — Add genuine full-manuscript LaTeX export
- **TQ-VSC-075** — Build submission-package ZIP and manifest
- **TQ-VSC-076** — Make JATS validation claims truthful
- **TQ-VSC-077** — Connect verified outlet requirements to export formatting
- **TQ-VSC-078** — Harden DOCX/PDF/BibTeX/RIS/CSL/JATS existing exports

### Phase 19 — RAG

- **TQ-VSC-079** — Create embedding-provider abstraction
- **TQ-VSC-080** — Build EvidenceRetrievalService
- **TQ-VSC-081** — Create RAG benchmark/regression suite

### Phase 20 — Testing

- **TQ-VSC-082** — Create scientific-integrity regression suite
- **TQ-VSC-083** — Create adversarial research-safety tests
- **TQ-VSC-084** — Create statistical golden-dataset validation
- **TQ-VSC-085** — Create AgentRegistry contract tests
- **TQ-VSC-086** — Create authentication/RBAC/security suite
- **TQ-VSC-087** — Create end-to-end generic empirical workflow
- **TQ-VSC-088** — Create end-to-end qualitative workflow
- **TQ-VSC-089** — Create end-to-end literature/systematic-review workflow
- **TQ-VSC-090** — Create export validation suite
- **TQ-VSC-091** — Test concurrency, autosave and version safety
- **TQ-VSC-092** — Test performance, provider failures, budgets and bounded retries

### Phase 21 — Release Audit

- **TQ-VSC-093** — Run repository-wide scientific-integrity code audit and fix P0/P1
- **TQ-VSC-094** — Run final novice-researcher UX acceptance audit
- **TQ-VSC-095** — Run final production-readiness gate without false approval

### Phase 22 — Final Cleanup

- **TQ-VSC-096** — Remove obsolete unsafe code only after replacement is verified
- **TQ-VSC-097** — Generate maintainer architecture and operations documentation

---

# Standalone Codex Prompts


## TQ-VSC-000 — Create protected baseline and implementation tracker

**Phase:** Phase 0 — Repository Control

```text
PROMPT ID: TQ-VSC-000
PHASE: Phase 0 — Repository Control
TASK TITLE: Create protected baseline and implementation tracker

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
1. Inspect repository structure, package.json, TypeScript/Vite/React client, server entry points, Firebase files, environment handling, tests and Git state.
2. Create docs/TEHQIQ_IMPLEMENTATION_TRACKER.md recording Prompt ID, status, files, tests, migrations, blockers and checkpoint.
3. Create docs/CURRENT_IMPLEMENTATION_REGISTER.md documenting real modules/views, server endpoints, AI/model call sites, Firebase/Auth/Firestore/Storage, analysis modules, literature providers, exports, tests, unreachable views and unsafe/conflicting implementations.
4. Do not implement product features.
5. Run baseline typecheck/tests/build and record genuine results.
ACCEPTANCE: truthful baseline exists; no product behavior changed; current failures are recorded separately from later regressions.
```


## TQ-VSC-001 — Add scientific-integrity invariant test harness

**Phase:** Phase 0 — Repository Control

```text
PROMPT ID: TQ-VSC-001
PHASE: Phase 0 — Repository Control
TASK TITLE: Add scientific-integrity invariant test harness

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create reusable test helpers/invariants for: no fabricated source/DOI; no fabricated empirical-number fallback; no automatic human approval; no unverified outlet shown as verified; no demo artifact entering real-project submission readiness; no AI output self-approval.
Do not hide current violations. If red tests would block the entire baseline, create targeted helpers/known-violation tests that can be activated as each fix lands.
ACCEPTANCE: integrity test utilities exist and expose rather than mask unsafe behavior.
```


## TQ-VSC-002 — Remove q1ManuscriptEngine from real projects

**Phase:** Phase 1 — Scientific Integrity Reset

```text
PROMPT ID: TQ-VSC-002
PHASE: Phase 1 — Scientific Integrity Reset
TASK TITLE: Remove q1ManuscriptEngine from real projects

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit src/lib/q1ManuscriptEngine.ts and every call site. Remove it from all real-project generation/fallback paths. No arbitrary real project may receive hard-coded biomechanics/hamstring/semitendinosus/treadmill/EMG/crossover content, n=18, 48-hour washout, predefined p-values/effect sizes or fallback references.
If retained for demo, isolate behind explicit demo fixtures and isDemo/isSynthetic. AI/server failure must show failure, not substitute science.
ACCEPTANCE: non-demo projects cannot receive q1ManuscriptEngine content; regression tests prove this.
```


## TQ-VSC-003 — Rebuild Protocol Builder as domain-neutral methodology workspace

**Phase:** Phase 1 — Scientific Integrity Reset

```text
PROMPT ID: TQ-VSC-003
PHASE: Phase 1 — Scientific Integrity Reset
TASK TITLE: Rebuild Protocol Builder as domain-neutral methodology workspace

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Remove fixed crossover defaults including 48-hour washout, d=0.80, power assumptions, minimum n=15 and synthetic n=18.
Support three paths: researcher enters existing methodology; researcher uploads protocol with extracted fields Needs Review; researcher requests AI methodology proposal that remains AI Suggested until approved.
Use adaptable fields: design, population/data source, sampling, eligibility, intervention/exposure/comparator if applicable, variables/outcomes, instruments, data collection, analysis plan, ethics and limitations. Unknown values remain blank/Researcher Input Required.
ACCEPTANCE: blank economics, engineering, qualitative and clinical projects receive no sports/crossover assumptions.
```


## TQ-VSC-004 — Remove unsafe literature/statistics injection actions

**Phase:** Phase 1 — Scientific Integrity Reset

```text
PROMPT ID: TQ-VSC-004
PHASE: Phase 1 — Scientific Integrity Reset
TASK TITLE: Remove unsafe literature/statistics injection actions

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit WritingStudioView and equivalent actions. Rebuild/remove “+ Literature Evidence” and “+ Statistical Findings”.
Literature can only be inserted from verified/researcher-reviewed EvidenceRecords with provenance. Statistics can only be inserted from analysis outputs Approved for Manuscript.
Delete hard-coded fallback numbers including t=6.84, p=0.000003, d=1.41 and similar.
ACCEPTANCE: no UI action can inject unsupported science.
```


## TQ-VSC-005 — Replace trusted-number allowlists with numeric provenance

**Phase:** Phase 1 — Scientific Integrity Reset

```text
PROMPT ID: TQ-VSC-005
PHASE: Phase 1 — Scientific Integrity Reset
TASK TITLE: Replace trusted-number allowlists with numeric provenance

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit aiValidationService and all numeric validators. Delete trusted lists such as 18,48,20,10,12,100.
Create NumericEvidence with id, value, normalizedValue, unit, sourceType, sourceId, datasetHash, analysisRunId, variableName, evidencePassageId, verificationState, createdAt.
Validate empirical numbers across abstract, introduction, literature review, methods, results, discussion, conclusion, tables, captions and supplements. Distinguish bibliographic years/citation numbering.
ACCEPTANCE: empirical numbers require traceable provenance; no numeric whitelist remains.
```


## TQ-VSC-006 — Separate analysis completion from researcher approval

**Phase:** Phase 1 — Scientific Integrity Reset

```text
PROMPT ID: TQ-VSC-006
PHASE: Phase 1 — Scientific Integrity Reset
TASK TITLE: Separate analysis completion from researcher approval

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Replace any Results/manuscript gate based only on executionStatus === Completed.
Lifecycle: Draft Plan → Awaiting Approval → Approved → Queued → Running → Completed → QC Passed → Researcher Reviewed → Approved for Manuscript → Locked.
Automated QC cannot grant human approval. Record actor, timestamp, rationale, output ID, dataset hash and plan ID. Figures/tables obey same gate. Imported outputs retain Researcher Supplied / Not Independently Reproduced unless reproduced.
ACCEPTANCE: Completed alone never unlocks empirical Results writing.
```


## TQ-VSC-007 — Make AI-use disclosure truthful when ledger is empty

**Phase:** Phase 1 — Scientific Integrity Reset

```text
PROMPT ID: TQ-VSC-007
PHASE: Phase 1 — Scientific Integrity Reset
TASK TITLE: Make AI-use disclosure truthful when ledger is empty

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit AiLedger/disclosure logic. Empty ledger must never automatically mean “No AI assistance was used.” Add ledger-integrity/completeness state. If history cannot be established, disclosure says Unknown/Incomplete.
Identify current model-call paths bypassing the ledger and record them for later gateway centralization.
ACCEPTANCE: empty ledger is not proof of no AI use.
```


## TQ-VSC-008 — Remove fabricated journal/conference generation

**Phase:** Phase 2 — Outlet Truthfulness

```text
PROMPT ID: TQ-VSC-008
PHASE: Phase 2 — Outlet Truthfulness
TASK TITLE: Remove fabricated journal/conference generation

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit baselineOutlets.ts and all outlet seed/generator code. Delete mechanisms inventing journals, publishers, URLs, APCs, acceptance rates, indexing claims or official guideline links.
Allow only verified static seed with provenance, live retrieved record with provider provenance, or user-added unverified outlet. Never auto-set humanConfirmed=true or Q1.
ACCEPTANCE: generated/fake outlets cannot appear as verified production records.
```


## TQ-VSC-009 — Model journal metrics by provider, year and category

**Phase:** Phase 2 — Outlet Truthfulness

```text
PROMPT ID: TQ-VSC-009
PHASE: Phase 2 — Outlet Truthfulness
TASK TITLE: Model journal metrics by provider, year and category

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Refactor outlet metrics to support provider, metric name, year, subject category, value, percentile, quartile, source/provenance, retrievedAt and verification.
A journal may have multiple categories/quartiles. Missing metric shows Not Verified; old metric shows year; third-party metric cannot masquerade as JCR/Scopus. Remove fallbacks like metric || "Q1".
ACCEPTANCE: no timeless/global Q1 property is presented as authoritative.
```


## TQ-VSC-010 — Version and provenance outlet requirements

**Phase:** Phase 2 — Outlet Truthfulness

```text
PROMPT ID: TQ-VSC-010
PHASE: Phase 2 — Outlet Truthfulness
TASK TITLE: Version and provenance outlet requirements

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
For article type, manuscript/abstract limits, abstract structure, reference style/limit, figures/tables, supplements, title page, authors, AI policy, ethics, data sharing, APC, conference deadline/template/file requirements, store source/provider, URL when real, retrieval date, confidence, humanConfirmed and history/version.
UI states: Verified; AI Extracted—Needs Review; Unverified; Unavailable. Never generate missing official URLs.
ACCEPTANCE: every factual outlet requirement has provenance or is visibly unverified.
```


## TQ-VSC-011 — Move Firebase client config to validated environment variables

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-011
PHASE: Phase 3 — Security
TASK TITLE: Move Firebase client config to validated environment variables

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit firebase.ts. Remove built-in project config from application logic. Use validated Vite env values and .env.example placeholders. Missing config produces safe Not Configured state. No admin/server secret enters client env.
ACCEPTANCE: Firebase project configuration is environment-driven and validated.
```


## TQ-VSC-012 — Fix Firestore private-user and project RBAC rules

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-012
PHASE: Phase 3 — Security
TASK TITLE: Fix Firestore private-user and project RBAC rules

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Apply least privilege: private user record owner-only unless deliberately separated public profile; project data only authorized members; role elevation/ownership/member changes restricted; finalized/snapshot artifacts immutable as required.
Add emulator tests: A cannot read B private profile; non-member cannot read project; Viewer cannot edit; Co-author cannot self-promote; Owner valid; cross-project isolation.
ACCEPTANCE: broad signed-in access to user records is gone.
```


## TQ-VSC-013 — Move high-integrity audit events to trusted server paths

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-013
PHASE: Phase 3 — Security
TASK TITLE: Move high-integrity audit events to trusted server paths

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
High-integrity events for role changes, approvals, dataset/analysis approval, AI artifact disposition, source/claim verification, ethics, author sign-off and exports must be append-only and created by validated trusted server/service logic.
Record actor, action, entity type/id, before/after, projectId, timestamp, rationale and evidence IDs. Update rules to prevent client forging.
ACCEPTANCE: clients cannot fabricate privileged audit history.
```


## TQ-VSC-014 — Fix research file persistence and object-URL fallback

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-014
PHASE: Phase 3 — Security
TASK TITLE: Fix research file persistence and object-URL fallback

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Remove behavior treating URL.createObjectURL(file) as successful persistent upload. Success returns persistent storage reference/path and metadata; failure says local/unpersisted and does not create a persisted research-file record.
Record SHA-256, MIME, size, projectId, uploader, timestamp, path and provenance.
ACCEPTANCE: failed storage can never look successful.
```


## TQ-VSC-015 — Add project-scoped Cloud Storage rules

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-015
PHASE: Phase 3 — Security
TASK TITLE: Add project-scoped Cloud Storage rules

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Require auth, project-scoped paths, membership/role checks, configurable size limits, content-type policy, cross-project overwrite prevention, locked artifact protection and private-by-default access. Add emulator/rules tests.
Do not claim malware scanning unless actually implemented.
ACCEPTANCE: unauthorized cross-project file access fails.
```


## TQ-VSC-016 — Create reusable authenticated server middleware

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-016
PHASE: Phase 3 — Security
TASK TITLE: Create reusable authenticated server middleware

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit all server endpoints. Add reusable Firebase ID-token verification, project membership, RBAC, request-size limits, safe errors, audit hooks and rate-limit hooks.
Never trust userId/email/role/membership from frontend. Apply to AI, analysis, project mutation, sensitive project literature and exports as appropriate.
ACCEPTANCE: tests cover unauthenticated, invalid token, non-member, insufficient role and valid authorized requests.
```


## TQ-VSC-017 — Validate server request and response schemas

**Phase:** Phase 3 — Security

```text
PROMPT ID: TQ-VSC-017
PHASE: Phase 3 — Security
TASK TITLE: Validate server request and response schemas

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit weak/untyped API bodies and prompt-only “return JSON” behavior. Add runtime request validation and typed response contracts. AI routes expecting structured output must validate model output before persistence/use. Invalid model JSON is a validation failure, not accepted output.
ACCEPTANCE: malformed privileged requests and malformed AI JSON are rejected.
```


## TQ-VSC-018 — Create universal ResearchArtifact foundation

**Phase:** Phase 4 — Provenance

```text
PROMPT ID: TQ-VSC-018
PHASE: Phase 4 — Provenance
TASK TITLE: Create universal ResearchArtifact foundation

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Introduce/extend ResearchArtifact for uploaded docs, sources, evidence, protocols, datasets, analysis plans/outputs, tables, figures, manuscript sections, reviews and exports.
Include id, projectId, artifactType, title, createdBy/At, updatedAt, sourceArtifactIds, provenance, verificationState, approvalState, version, contentHash if relevant, isDemo/isSynthetic and locked.
Use adapters/backward-compatible migration.
ACCEPTANCE: existing projects remain loadable.
```


## TQ-VSC-019 — Create passage-level EvidenceRecord

**Phase:** Phase 4 — Provenance

```text
PROMPT ID: TQ-VSC-019
PHASE: Phase 4 — Provenance
TASK TITLE: Create passage-level EvidenceRecord

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create EvidenceRecord separate from Source metadata: evidenceId, sourceId, document version/hash, exact passage, page, section, paragraph/chunk ref, extraction method, extractedBy, confidence, verification, researcher review, linked claims, timestamps.
AI-extracted evidence starts Needs Review. Add basic source/document reader provenance UI.
ACCEPTANCE: evidence traces to concrete source location.
```


## TQ-VSC-020 — Upgrade Claim Matrix to claim–evidence graph

**Phase:** Phase 4 — Provenance

```text
PROMPT ID: TQ-VSC-020
PHASE: Phase 4 — Provenance
TASK TITLE: Upgrade Claim Matrix to claim–evidence graph

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Preserve useful UI while supporting Claim → many EvidenceRecords and Evidence → many Claims, supporting/contradicting evidence, confidence, verification, approval and manuscript sentence links.
Provide “Why is this sentence supported?” traversal sentence → claim → evidence → source → page/passage.
Never auto-link first source or auto-verify.
ACCEPTANCE: graph integrity tests cover many-to-many and contradiction links.
```


## TQ-VSC-021 — Harden sensitive state transitions and tamper detection

**Phase:** Phase 4 — Provenance

```text
PROMPT ID: TQ-VSC-021
PHASE: Phase 4 — Provenance
TASK TITLE: Harden sensitive state transitions and tamper detection

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Move sensitive transition enforcement to trusted server/service code. Client requests transitions rather than directly overwriting privileged state. Create immutable StateTransitionRecord and lock rules.
Cover Source Verified, Claim Verified, Dataset Approved, Analysis Approved for Manuscript, Manuscript Locked, Ethics Approved, Author Signed Off and Submission Ready.
ACCEPTANCE: invalid direct privileged mutation is rejected/detectable.
```


## TQ-VSC-022 — Correct bibliographic provider adapters

**Phase:** Phase 5 — Literature Retrieval

```text
PROMPT ID: TQ-VSC-022
PHASE: Phase 5 — Literature Retrieval
TASK TITLE: Correct bibliographic provider adapters

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Normalize adapters for Crossref, OpenAlex, DataCite, Europe PMC and PubMed/NCBI E-utilities. PubMed must work at normal no-key limits with optional API key for higher permitted throughput.
Preserve provider ID, DOI/PMID/etc, retrievedAt and field-level provenance. Never fabricate missing metadata.
ACCEPTANCE: mocked success/not-found/rate/error tests pass.
```


## TQ-VSC-023 — Add lawful OA and specialist discovery adapters

**Phase:** Phase 5 — Literature Retrieval

```text
PROMPT ID: TQ-VSC-023
PHASE: Phase 5 — Literature Retrieval
TASK TITLE: Add lawful OA and specialist discovery adapters

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Add Unpaywall-compatible OA discovery, arXiv metadata/search and DOAJ metadata adapters. Declare capabilities, config, identifier support and rate handling. Do not unlawfully scrape copyrighted full text. Not configured/not found returns truthful state; never synthesize access URLs.
ACCEPTANCE: provider provenance/errors are preserved.
```


## TQ-VSC-024 — Build real multi-provider SearchExecution

**Phase:** Phase 5 — Literature Retrieval

```text
PROMPT ID: TQ-VSC-024
PHASE: Phase 5 — Literature Retrieval
TASK TITLE: Build real multi-provider SearchExecution

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Upgrade SearchPlanner from query-copy UI to executable reproducible search. Create SearchExecution with searchId, projectId, context, concepts/synonyms, provider-specific syntax, providers, time, filters, returned source IDs, counts and warnings/errors.
Flow: design/edit → select → execute → review → import. Each provider actually executes separately.
ACCEPTANCE: searches are reproducible and no Crossref-only call is mislabeled multi-provider.
```


## TQ-VSC-025 — Implement SearchStrategyAgent

**Phase:** Phase 6 — Literature Agents

```text
PROMPT ID: TQ-VSC-025
PHASE: Phase 6 — Literature Agents
TASK TITLE: Implement SearchStrategyAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Structured input: research question, field/study type, optional PICO/PEO/SPIDER/framework, existing keywords.
Output: concepts, synonyms, controlled-vocabulary suggestions, inclusion/exclusion concepts, provider-specific Boolean proposals and ambiguities.
Agent proposes only; never claims execution or invents papers. Human approves plan.
ACCEPTANCE: structured schema and proposal/approval tests pass.
```


## TQ-VSC-026 — Implement LiteratureRetrievalAgent with tools

**Phase:** Phase 6 — Literature Agents

```text
PROMPT ID: TQ-VSC-026
PHASE: Phase 6 — Literature Agents
TASK TITLE: Implement LiteratureRetrievalAgent with tools

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create controlled tool-orchestration agent over real provider functions. Input Approved search plan; allowed tools are provider retrieval functions. Output only actual returned records, provider failures, normalization and SearchExecution provenance.
Failure/partial status must not create sources.
ACCEPTANCE: provider failure cannot generate fabricated source.
```


## TQ-VSC-027 — Create deterministic source deduplication

**Phase:** Phase 6 — Literature Agents

```text
PROMPT ID: TQ-VSC-027
PHASE: Phase 6 — Literature Agents
TASK TITLE: Create deterministic source deduplication

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Use DOI/PMID/PMCID/arXiv/other stable IDs first, then conservative bibliographic matching. Maintain canonical source ID, provider aliases, field provenance/conflicts and preferred sources.
Never merge merely on vague title similarity.
ACCEPTANCE: duplicate/conflict fixture tests pass.
```


## TQ-VSC-028 — Implement LiteratureScreeningAgent and workbench

**Phase:** Phase 6 — Literature Agents

```text
PROMPT ID: TQ-VSC-028
PHASE: Phase 6 — Literature Agents
TASK TITLE: Implement LiteratureScreeningAgent and workbench

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Input approved inclusion/exclusion criteria and retrieved record/abstract. Output Suggested Include / Suggested Exclude / Uncertain, reasons, criterion IDs and confidence.
AI suggestion is not researcher decision; preserve both and audit overrides.
ACCEPTANCE: nothing is automatically labeled “Included by researcher”.
```


## TQ-VSC-029 — Create unified research-document ingestion router

**Phase:** Phase 7 — Universal Ingestion

```text
PROMPT ID: TQ-VSC-029
PHASE: Phase 7 — Universal Ingestion
TASK TITLE: Create unified research-document ingestion router

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Recognize PDF, DOCX, PPTX, XLS/XLSX, CSV/TSV, JSON, TXT, Markdown, TEX, image, audio and video. Create DocumentIngestionJob statuses Uploaded, Queued, Processing, Parsed, Requires Review, Failed, Unsupported.
Preserve hash, parser provenance, extracted blocks and warnings. Connect existing dataset ingestion.
ACCEPTANCE: routing/status tests are truthful for all categories.
```


## TQ-VSC-030 — Add configurable rich-document parser adapter

**Phase:** Phase 7 — Universal Ingestion

```text
PROMPT ID: TQ-VSC-030
PHASE: Phase 7 — Universal Ingestion
TASK TITLE: Add configurable rich-document parser adapter

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create parser-provider interface for self-hosted/Cloud Run Docling-compatible service. If Python/Docling is not in this repo/runtime, do not fake it; use DOCUMENT_PARSER_SERVICE_URL and Not Configured.
Preserve page/section/table/image references returned by parser.
ACCEPTANCE: mocked integration works; absent service never reports Parsed.
```


## TQ-VSC-031 — Add audio/video transcription adapter

**Phase:** Phase 7 — Universal Ingestion

```text
PROMPT ID: TQ-VSC-031
PHASE: Phase 7 — Universal Ingestion
TASK TITLE: Add audio/video transcription adapter

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create configurable Whisper-compatible/self-hosted transcription provider. Store timestamps, language, confidence/speaker info when supplied, transcript version/hash and review state.
No service → Not Configured. Never invent transcript. Respect privacy routing hooks.
ACCEPTANCE: failure/not-configured states are tested.
```


## TQ-VSC-032 — Create provenance-preserving full-text chunks

**Phase:** Phase 7 — Universal Ingestion

```text
PROMPT ID: TQ-VSC-032
PHASE: Phase 7 — Universal Ingestion
TASK TITLE: Create provenance-preserving full-text chunks

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Chunk parsed documents while retaining sourceId, document hash/version, page, section, chunk index, text and surrounding context reference. Keep provenance independent of embedding model.
ACCEPTANCE: any retrieved chunk can trace to original document location.
```


## TQ-VSC-033 — Implement EvidenceExtractionAgent

**Phase:** Phase 7 — Universal Ingestion

```text
PROMPT ID: TQ-VSC-033
PHASE: Phase 7 — Universal Ingestion
TASK TITLE: Implement EvidenceExtractionAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Input supplied full-text chunks + question/claim. Output proposition, exact passage/chunk IDs, explicitly available context/population, method, result, limitations, supports/contradicts/neutral/unclear and confidence.
Agent may summarize only supplied chunks. Output starts Needs Researcher Review.
ACCEPTANCE: hallucination-trap tests reject unsupported evidence.
```


## TQ-VSC-034 — Implement LiteratureSynthesisAgent

**Phase:** Phase 8 — Evidence Synthesis

```text
PROMPT ID: TQ-VSC-034
PHASE: Phase 8 — Evidence Synthesis
TASK TITLE: Implement LiteratureSynthesisAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Receive verified/reviewed EvidenceRecords rather than unrestricted model knowledge. Output themes, support IDs, conflicting IDs, methodological/context differences, limitations, unresolved questions and candidate synthesis statements.
Every factual synthesis item requires evidence IDs; unsupported interpretation must be labeled Interpretation/Hypothesis.
ACCEPTANCE: schema requires evidence links.
```


## TQ-VSC-035 — Implement ContradictionDetectionAgent

**Phase:** Phase 8 — Evidence Synthesis

```text
PROMPT ID: TQ-VSC-035
PHASE: Phase 8 — Evidence Synthesis
TASK TITLE: Implement ContradictionDetectionAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Identify supporting vs contradictory evidence, contextual/methodological reasons and uncertainty. Never declare one study “wrong”. Store contradiction groups and expose them in synthesis/gap UI.
ACCEPTANCE: every comparison uses evidence IDs.
```


## TQ-VSC-036 — Implement ResearchGapAgent

**Phase:** Phase 8 — Evidence Synthesis

```text
PROMPT ID: TQ-VSC-036
PHASE: Phase 8 — Evidence Synthesis
TASK TITLE: Implement ResearchGapAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Input reviewed synthesis, contradictions, limitations and context. Output candidate gap, type, supporting/contradicting evidence IDs, confidence, caution and what new research addresses it.
Disallow unsupported “no study has ever…”; prefer scoped language. Output remains AI Suggested.
ACCEPTANCE: no unsupported universal gap claim.
```


## TQ-VSC-037 — Build OutletIntelligenceService

**Phase:** Phase 9 — Outlet Intelligence

```text
PROMPT ID: TQ-VSC-037
PHASE: Phase 9 — Outlet Intelligence
TASK TITLE: Build OutletIntelligenceService

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Combine verified identity, indexing, metrics, guidelines, article types, formatting, policies and conference deadline/template data.
Factual claims come from deterministic/provider data or actual retrieved official text. LLM may only extract structured fields from supplied official text and mark Needs Review unless verified.
ACCEPTANCE: no LLM-created outlet fact without source.
```


## TQ-VSC-038 — Implement CSL-compatible reference-style architecture

**Phase:** Phase 9 — Outlet Intelligence

```text
PROMPT ID: TQ-VSC-038
PHASE: Phase 9 — Outlet Intelligence
TASK TITLE: Implement CSL-compatible reference-style architecture

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Move beyond small handcrafted styles while preserving compatibility. Support CSL style IDs/files, target-outlet mapping, truthful unavailable state, BibTeX/RIS/CSL JSON and one citation processor for in-text+bibliography.
Do not claim exact journal style when unavailable.
ACCEPTANCE: representative author-date/numeric formatting tests pass.
```


## TQ-VSC-039 — Implement OutletMatchingAgent

**Phase:** Phase 9 — Outlet Intelligence

```text
PROMPT ID: TQ-VSC-039
PHASE: Phase 9 — Outlet Intelligence
TASK TITLE: Implement OutletMatchingAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Recommend only outlets in trusted database. Inputs: field, manuscript type, abstract/keywords, methodology and user constraints. Output fit, mismatch, provenance, metric year/category and missing/unverified facts.
Never invent an outlet or upgrade unverified metrics.
ACCEPTANCE: all recommendations reference real outlet IDs.
```


## TQ-VSC-040 — Implement ResearchIntakeAgent

**Phase:** Phase 10 — Research Design

```text
PROMPT ID: TQ-VSC-040
PHASE: Phase 10 — Research Design
TASK TITLE: Implement ResearchIntakeAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Output discipline/subdiscipline, candidate study type, research stage, manuscript type, available evidence/method/data, missing critical info and next stage. Include confidence and researcher correction; store confirmed classification separately.
Test clinical, qualitative, electrical engineering, ML, economics and systematic review.
ACCEPTANCE: no default clinical/crossover classification.
```


## TQ-VSC-041 — Create ReportingGuidelineRegistry and resolver

**Phase:** Phase 10 — Research Design

```text
PROMPT ID: TQ-VSC-041
PHASE: Phase 10 — Research Design
TASK TITLE: Create ReportingGuidelineRegistry and resolver

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create extensible study-type guidance for randomized, observational, systematic/scoping, diagnostic, prediction, qualitative, animal, case report, engineering/computational/ML and future types.
Do not hard-code CONSORT/SENIAM universally. Recommendations are reviewable. Checklist completion is based on actual evidence, not static green ticks.
ACCEPTANCE: non-clinical projects are not forced into clinical checklists.
```


## TQ-VSC-042 — Implement MethodologyDesignAgent

**Phase:** Phase 10 — Research Design

```text
PROMPT ID: TQ-VSC-042
PHASE: Phase 10 — Research Design
TASK TITLE: Implement MethodologyDesignAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Run only when user asks for methodology help. Input approved RQ/objectives, classification, gap/evidence, constraints and reporting guidance. Output proposed design, population/data source, sampling, variables/outcomes, instruments, procedure, bias/confounding, analysis needs, ethics considerations, limitations and unresolved questions.
Distinguish Researcher Fact / Evidence-grounded Recommendation / AI Proposal / Missing Information. Never invent ethics, participants, sample size or completed procedures. Require human approval.
ACCEPTANCE: proposal cannot self-approve.
```


## TQ-VSC-043 — Implement QuestionHypothesisAgent

**Phase:** Phase 10 — Research Design

```text
PROMPT ID: TQ-VSC-043
PHASE: Phase 10 — Research Design
TASK TITLE: Implement QuestionHypothesisAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Input project concept, confirmed classification, reviewed synthesis and approved gap. Output candidate RQs/objectives, hypotheses only where appropriate, rationale/evidence IDs, variables/concepts and unresolved assumptions.
Do not force hypotheses on qualitative/exploratory research.
ACCEPTANCE: cross-discipline tests pass and approval is human.
```


## TQ-VSC-044 — Refactor statistics into AnalysisMethodRegistry

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-044
PHASE: Phase 11 — Analysis
TASK TITLE: Refactor statistics into AnalysisMethodRegistry

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Preserve validated paired/crossover functionality as one plugin. Each method defines ID/family, compatible variable types, required inputs, assumptions, deterministic executor, output schema, diagnostics and reproducibility support.
Remove assumption all projects are paired/crossover.
ACCEPTANCE: existing valid method works and unrelated studies inherit no crossover assumptions.
```


## TQ-VSC-045 — Add deterministic common comparison methods

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-045
PHASE: Phase 11 — Analysis
TASK TITLE: Add deterministic common comparison methods

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Implement only correctly testable independent t, Mann–Whitney, paired t, Wilcoxon, one-way ANOVA, Kruskal–Wallis and repeated-measures support where scientifically correct.
Validate inputs/assumptions; return structured estimates, effect sizes/CIs where appropriate, counts and reproducibility metadata. No fallback numbers.
ACCEPTANCE: golden fixtures pass.
```


## TQ-VSC-046 — Add regression, survival and diagnostic analysis architecture

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-046
PHASE: Phase 11 — Analysis
TASK TITLE: Add regression, survival and diagnostic analysis architecture

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Add tested enabled methods for linear/logistic regression and any survival/diagnostic methods the current stack can correctly execute. Create disabled Planned/Unavailable entries for unimplemented count models, Kaplan–Meier/Cox, sensitivity/specificity/ROC/AUC as needed.
No unavailable method may look executable.
ACCEPTANCE: every enabled method has deterministic executor and tests.
```


## TQ-VSC-047 — Add specialized analysis families truthfully

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-047
PHASE: Phase 11 — Analysis
TASK TITLE: Add specialized analysis families truthfully

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create extensible families for meta-analysis, ML evaluation, engineering/computational analyses and survey/psychometrics. Implement only validated methods; mark others Planned/Unavailable.
ML must address train/validation/test, CV, metrics, calibration/leakage. Engineering can support simulation/error/uncertainty/DOE/sensitivity.
Never ask Gemini to calculate scientific statistics.
ACCEPTANCE: capability registry distinguishes implemented vs planned.
```


## TQ-VSC-048 — Add qualitative analysis workflow

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-048
PHASE: Phase 11 — Analysis
TASK TITLE: Add qualitative analysis workflow

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Support corpus, codebook versions, researcher codes, AI-suggested codes, coded passages, themes, supporting quotations/evidence, disagreement/review and approval.
AI codes/themes remain suggestions. Do not force p-values/statistics unless appropriate mixed methods are explicitly chosen. Approved findings feed manuscript writing.
ACCEPTANCE: qualitative project completes without synthetic quantitative output.
```


## TQ-VSC-049 — Implement AnalysisPlanningAgent

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-049
PHASE: Phase 11 — Analysis
TASK TITLE: Implement AnalysisPlanningAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Input approved methodology, dataset profile/variable dictionary, RQs/hypotheses, study classification and AnalysisMethodRegistry. Output proposed registered method IDs, mappings, assumptions, missing variables, preprocessing, primary/secondary/sensitivity analyses and unsupported needs.
Agent recommends only, never computes. Plan requires researcher approval.
ACCEPTANCE: hallucinated/unregistered method IDs are rejected.
```


## TQ-VSC-050 — Implement ResultsInterpretationAndWritingAgent

**Phase:** Phase 11 — Analysis

```text
PROMPT ID: TQ-VSC-050
PHASE: Phase 11 — Analysis
TASK TITLE: Implement ResultsInterpretationAndWritingAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Do not call it Results Generator. Consume only Approved for Manuscript outputs and/or approved qualitative findings. Describe exact approved findings with result IDs and warnings.
Never invent/recalculate p-values, sample size, effects, significance or new findings. Run numeric grounding after generation.
ACCEPTANCE: adversarial no-data and “make p significant” tests block.
```


## TQ-VSC-051 — Create typed server-controlled AgentRegistry

**Phase:** Phase 12 — Agent Architecture

```text
PROMPT ID: TQ-VSC-051
PHASE: Phase 12 — Agent Architecture
TASK TITLE: Create typed server-controlled AgentRegistry

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Define agent ID, purpose, allowed input artifacts/tools, output schema, model tier, required workflow state, human-review requirement, next states and prohibited behavior. Register intake, outlet, search, retrieval, screening, evidence, synthesis, contradiction, gap, question/hypothesis, methodology, analysis planning, results, section writers, review, compliance, integrity, editor and export agents.
No unrestricted frontend “run arbitrary agent”.
ACCEPTANCE: agent contracts and permissions are tested.
```


## TQ-VSC-052 — Create deterministic WorkflowOrchestrator

**Phase:** Phase 12 — Agent Architecture

```text
PROMPT ID: TQ-VSC-052
PHASE: Phase 12 — Agent Architecture
TASK TITLE: Create deterministic WorkflowOrchestrator

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Control stage, permitted agent, required inputs, missing prerequisites, output storage and approval. No free-form swarm or arbitrary agent-to-agent calls.
Support flexible entry for users who already have literature, methodology, data or results. Test empirical, systematic review, qualitative, existing dataset and existing methodology flows.
ACCEPTANCE: controlled but flexible workflow.
```


## TQ-VSC-053 — Create explicit manuscript SectionContracts

**Phase:** Phase 12 — Agent Architecture

```text
PROMPT ID: TQ-VSC-053
PHASE: Phase 12 — Agent Architecture
TASK TITLE: Create explicit manuscript SectionContracts

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Define verified inputs by section:
Introduction: problem/gap/evidence.
Lit Review: approved synthesis/evidence graph.
Methods: approved methodology/protocol + analysis plan + actual ethics info.
Results: approved outputs/findings only.
Discussion: approved results + verified literature.
Conclusion: approved interpretation/results, no new empirical claims.
Abstract: approved relevant sections/outputs.
Title/keywords: approved project content.
Each output includes claim/evidence mappings, sources, NumericEvidence IDs, missing info and warnings.
ACCEPTANCE: real-project contracts contain no hidden demo facts.
```


## TQ-VSC-054 — Implement evidence-constrained manuscript writer agents

**Phase:** Phase 12 — Agent Architecture

```text
PROMPT ID: TQ-VSC-054
PHASE: Phase 12 — Agent Architecture
TASK TITLE: Implement evidence-constrained manuscript writer agents

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Implement IntroductionWriter, LiteratureReviewWriter, MethodsWriter, DiscussionWriter, ConclusionWriter and AbstractWriter via SectionContracts; reuse ResultsInterpretationAndWritingAgent.
Structured output preserves citations/source IDs. Agents cannot create references or factual methodology. Drafts remain AI Suggested and AI use is logged. Manual writing remains supported.
ACCEPTANCE: section-specific grounding tests pass.
```


## TQ-VSC-055 — Implement non-inventive EditorAgent

**Phase:** Phase 12 — Agent Architecture

```text
PROMPT ID: TQ-VSC-055
PHASE: Phase 12 — Agent Architecture
TASK TITLE: Implement non-inventive EditorAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Editor may remove repetition, harmonize terms/acronyms, improve transitions/order, cross-references, tense/style and word-limit compliance.
It cannot add facts/citations/numbers, change statistical meaning, overstate conclusions or remove uncertainty without evidence. Compare pre/post claims and block unsupported additions.
ACCEPTANCE: test catches editor-introduced unsupported claim.
```


## TQ-VSC-056 — Centralize all model calls through AiGateway

**Phase:** Phase 13 — AI Gateway

```text
PROMPT ID: TQ-VSC-056
PHASE: Phase 13 — AI Gateway
TASK TITLE: Centralize all model calls through AiGateway

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit every Gemini/LLM call. AiGateway must handle auth/permission, agent ID, ModelRouter, response schema, input artifact IDs, output artifact, token/usage data, failure, ledger event, provider/model, prompt version and trace ID.
Refactor draft/review/generic-agent paths. Failure never creates successful research output.
ACCEPTANCE: no material model call bypasses approved gateway/provider code.
```


## TQ-VSC-057 — Create configurable ModelRouter

**Phase:** Phase 13 — AI Gateway

```text
PROMPT ID: TQ-VSC-057
PHASE: Phase 13 — AI Gateway
TASK TITLE: Create configurable ModelRouter

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Centralize model selection via env/config (e.g. TEHQIQ_MODEL_FAST, MAIN, REVIEW) rather than scattered model IDs. Use installed provider SDK correctly.
Structured tasks enforce schema; tool tasks use controlled function calling. Keys stay server-side.
ACCEPTANCE: model IDs can change without editing feature code.
```


## TQ-VSC-058 — Add open/local model provider abstractions

**Phase:** Phase 13 — AI Gateway

```text
PROMPT ID: TQ-VSC-058
PHASE: Phase 13 — AI Gateway
TASK TITLE: Add open/local model provider abstractions

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create configurable adapters for scientific/general embeddings (SPECTER2/BGE-M3 compatible), Whisper-compatible transcription, Qwen-VL-compatible vision/document and local general LLM endpoints such as gpt-oss/Qwen.
States: Configured, Healthy, Unavailable, Failed. Do not pretend local models run in-browser. Missing endpoint = Not Configured.
ACCEPTANCE: mocked health/routing tests pass.
```


## TQ-VSC-059 — Implement privacy-aware task routing

**Phase:** Phase 13 — AI Gateway

```text
PROMPT ID: TQ-VSC-059
PHASE: Phase 13 — AI Gateway
TASK TITLE: Implement privacy-aware task routing

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create Standard Cloud, Private/Hybrid and Local-Only modes where infrastructure permits. Tasks declare sensitivity, raw-upload inclusion, permitted providers and preferred tier.
Never silently send confidential uploads/participant data to disallowed cloud providers. If no provider can run, show Cannot Run Under Current Privacy Mode.
ACCEPTANCE: privacy mode cannot be silently downgraded.
```


## TQ-VSC-060 — Add AI/API budgets and loop protection

**Phase:** Phase 13 — AI Gateway

```text
PROMPT ID: TQ-VSC-060
PHASE: Phase 13 — AI Gateway
TASK TITLE: Add AI/API budgets and loop protection

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Track per project/user requests, model/provider, token usage, estimated cost from versioned pricing config, provider calls and premium reviews. Support soft/hard budgets and routing thresholds. Do not hard-code transient commercial prices in core logic.
Bound retries/agent loops.
ACCEPTANCE: hard-budget and repeated-loop tests pass.
```


## TQ-VSC-061 — Implement CitationAuditAgent

**Phase:** Phase 14 — Integrity

```text
PROMPT ID: TQ-VSC-061
PHASE: Phase 14 — Integrity
TASK TITLE: Implement CitationAuditAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Verify each manuscript citation maps to real Source; identifier resolution; retraction/update warning state; supporting EvidenceRecord where required; in-text/bibliography synchronization; duplicates; orphan bibliography and missing bibliography entries.
Report PASS/WARNING/BLOCKER. Never fabricate replacements.
ACCEPTANCE: fake DOI remains unresolved and no synthetic source is created.
```


## TQ-VSC-062 — Add source correction/retraction verification

**Phase:** Phase 14 — Integrity

```text
PROMPT ID: TQ-VSC-062
PHASE: Phase 14 — Integrity
TASK TITLE: Add source correction/retraction verification

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
For identifier-backed sources, query configured providers for retraction/correction/expression-of-concern/update metadata where available. Store status, provider, retrievedAt and related IDs.
No result from one provider does not prove “not retracted”; maintain verification state. Feed policy into citation audit/export.
ACCEPTANCE: mocked retracted/corrected cases pass.
```


## TQ-VSC-063 — Create responsible originality/similarity risk engine

**Phase:** Phase 14 — Integrity

```text
PROMPT ID: TQ-VSC-063
PHASE: Phase 14 — Integrity
TASK TITLE: Create responsible originality/similarity risk engine

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Do not implement AI-detector evasion or guarantee plagiarism-free/AI-undetectable writing.
Implement exact quotation detection, close/verbatim source overlap, sequence/n-gram similarity, uncited close paraphrase warnings, duplicate sections, optional version self-overlap and missing attribution. Show source-linked risk without automatically accusing the researcher. Provide honest adapter boundary for future licensed similarity service.
ACCEPTANCE: product language and behavior avoid detector evasion.
```


## TQ-VSC-064 — Make AiLedger complete through AiGateway

**Phase:** Phase 14 — Integrity

```text
PROMPT ID: TQ-VSC-064
PHASE: Phase 14 — Integrity
TASK TITLE: Make AiLedger complete through AiGateway

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Every material AI research-content operation creates ledger event: projectId, agent/feature, provider/model/version, prompt version, input artifact IDs, output artifact ID, timestamp, actor, disposition (Proposed/Accepted/Edited & Accepted/Rejected) and section.
Use ledger completeness in disclosures.
ACCEPTANCE: normal AI-authored manuscript paths cannot bypass ledger.
```


## TQ-VSC-065 — Integrate Ethics Workspace into real workflow

**Phase:** Phase 15 — Ethics & Compliance

```text
PROMPT ID: TQ-VSC-065
PHASE: Phase 15 — Ethics & Compliance
TASK TITLE: Integrate Ethics Workspace into real workflow

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Connect EthicsWorkspaceView to the actual project flow. Ethics requirements depend on study type. Support where applicable: ethics required?, committee/institution, approval ID/date, consent, waiver, registration/protocol ID and privacy considerations.
Never invent values. AI may flag missing information but cannot approve ethics. If not applicable, require explicit documented rationale/status.
ACCEPTANCE: required ethics can block export; irrelevant ethics do not block unrelated study types.
```


## TQ-VSC-066 — Build authorship and human sign-off governance

**Phase:** Phase 15 — Ethics & Compliance

```text
PROMPT ID: TQ-VSC-066
PHASE: Phase 15 — Ethics & Compliance
TASK TITLE: Build authorship and human sign-off governance

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Each author supports name, affiliation, optional ORCID, corresponding-author status, CRediT roles where used, sign-off status and timestamp.
AI never signs for authors. Collaborator RBAC is separate from formal authorship. Final submission readiness requires configured human sign-offs.
ACCEPTANCE: no AI/system auto-signature and sign-offs are auditable.
```


## TQ-VSC-067 — Implement JournalComplianceAgent

**Phase:** Phase 15 — Ethics & Compliance

```text
PROMPT ID: TQ-VSC-067
PHASE: Phase 15 — Ethics & Compliance
TASK TITLE: Implement JournalComplianceAgent

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Input selected verified outlet, versioned requirements, manuscript, references, figures/tables, ethics/authorship and AI disclosure.
Calculate requirement-by-requirement PASS/WARNING/BLOCKER/NOT VERIFIED: word counts, abstract, sections, figure/table counts, reference-style state, ethics/data-sharing/AI disclosure and sign-offs.
Never use static green checks. Show requirement source/retrieval date.
ACCEPTANCE: compliance state is calculated from actual project data.
```


## TQ-VSC-068 — Implement specialist reviewer agents

**Phase:** Phase 16 — Peer Review

```text
PROMPT ID: TQ-VSC-068
PHASE: Phase 16 — Peer Review
TASK TITLE: Implement specialist reviewer agents

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit PeerReviewView/server routes and remove fixed/simulated reviewer comments.
Implement MethodologicalReviewAgent, StatisticalReviewAgent, DomainReviewAgent, CitationAuditAgent, JournalEditorReviewAgent and LanguageClarityReviewAgent.
Structured issue: severity, manuscript location, problem, rationale, evidence/result IDs where relevant, suggested correction, confidence.
Model unavailable → Reviewer Unavailable. Suggestions never auto-approve.
ACCEPTANCE: no simulated review is presented as completed AI review.
```


## TQ-VSC-069 — Implement review synthesis and revision lifecycle

**Phase:** Phase 16 — Peer Review

```text
PROMPT ID: TQ-VSC-069
PHASE: Phase 16 — Peer Review
TASK TITLE: Implement review synthesis and revision lifecycle

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Aggregate specialist findings without erasing disagreement. Group P0 integrity blockers, major, moderate and minor/editorial.
Issue lifecycle: Open; Addressed—Needs Recheck; Verified Resolved; Accepted Risk; Rejected Suggestion.
No AI reviewer can mark its own issue resolved. Integrate RevisionWorkspaceView.
ACCEPTANCE: resolution requires researcher action plus revalidation/documented decision.
```


## TQ-VSC-070 — Refactor researcher navigation into six stages

**Phase:** Phase 17 — UX

```text
PROMPT ID: TQ-VSC-070
PHASE: Phase 17 — UX
TASK TITLE: Refactor researcher navigation into six stages

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Reorganize, do not delete valid features:
1 Project & Target
2 Evidence
3 Method & Data
4 Analysis
5 Manuscript
6 Review & Export

Keep specialist agents mostly behind the scenes. Preserve TehqIQ branding and useful existing UI.
ACCEPTANCE: all major capabilities remain accessible and the workflow is understandable without knowing agent architecture.
```


## TQ-VSC-071 — Connect currently unreachable views and remove false routes

**Phase:** Phase 17 — UX

```text
PROMPT ID: TQ-VSC-071
PHASE: Phase 17 — UX
TASK TITLE: Connect currently unreachable views and remove false routes

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit App.tsx/navigation. Ensure SearchPlannerView, EthicsWorkspaceView, ReportingChecklistView, JournalFinderView, PeerReviewView, RevisionWorkspaceView, AiLedgerView, ComplianceCentreView and DashboardView are genuinely reachable where applicable.
Do not map multiple route labels to ExportCentreView. Remove duplicate DataLab placement unless intentionally different subviews.
ACCEPTANCE: route/navigation integration tests render intended components.
```


## TQ-VSC-072 — Correct readiness and submission-readiness calculations

**Phase:** Phase 17 — UX

```text
PROMPT ID: TQ-VSC-072
PHASE: Phase 17 — UX
TASK TITLE: Correct readiness and submission-readiness calculations

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Remove optimistic logic equivalent to Math.max(taskPercentage, readiness.overall).
Separate workflow completion, scientific readiness and submission readiness if helpful.
Submission readiness is a mandatory-gate result, not an average. Citation blockers, unapproved empirical results, required ethics, demo contamination or missing required author sign-off must block when applicable.
Optional modules must not block irrelevant study types.
ACCEPTANCE: readiness tests cover blockers and study-type conditionality.
```


## TQ-VSC-073 — Standardize truthful loading/success/error states

**Phase:** Phase 17 — UX

```text
PROMPT ID: TQ-VSC-073
PHASE: Phase 17 — UX
TASK TITLE: Standardize truthful loading/success/error states

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit asynchronous actions: provider searches, AI generation, uploads, parsing, analysis, review and exports.
Standardize Pending/Running/Partial/Failed/Not Configured/Completed/Needs Review states. Remove false-success UI. Error messages must preserve actionable reason without exposing secrets.
ACCEPTANCE: failure simulations never display Success.
```


## TQ-VSC-074 — Add genuine full-manuscript LaTeX export

**Phase:** Phase 18 — Export

```text
PROMPT ID: TQ-VSC-074
PHASE: Phase 18 — Export
TASK TITLE: Add genuine full-manuscript LaTeX export

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Extend export utilities to generate real manuscript.tex plus references.bib with title/authors/affiliations, abstract, hierarchy, tables, figure refs, escaped characters, citation keys, declarations and supplements where applicable.
Do not rename Markdown as .tex. Add structural/syntax fixture tests. If a LaTeX compiler is unavailable, say structural validation only.
ACCEPTANCE: exported .tex is real LaTeX structure.
```


## TQ-VSC-075 — Build submission-package ZIP and manifest

**Phase:** Phase 18 — Export

```text
PROMPT ID: TQ-VSC-075
PHASE: Phase 18 — Export
TASK TITLE: Build submission-package ZIP and manifest

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
When gates pass, create ZIP with only existing selected files: manuscript.docx/pdf, latex/manuscript.tex, latex/references.bib, BibTeX/RIS/CSL JSON, figures, tables, supplements, checklist, AI disclosure, integrity report and optional cover-letter draft.
Create manifest.json with project/export IDs, timestamp, manuscript version, artifact hashes, target-outlet version and gate results.
ACCEPTANCE: no nonexistent placeholder file is included.
```


## TQ-VSC-076 — Make JATS validation claims truthful

**Phase:** Phase 18 — Export

```text
PROMPT ID: TQ-VSC-076
PHASE: Phase 18 — Export
TASK TITLE: Make JATS validation claims truthful

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit JATS generation/UI. Never say “100% NLM DTD compliant” or “Validated” unless real schema/DTD validation succeeded.
Statuses: Structural Check Passed; Schema Validated; Schema Validation Failed; Validator Not Configured.
If no validator in runtime, add configurable JATS_VALIDATOR_SERVICE_URL adapter.
ACCEPTANCE: UI cannot claim external validation after internal-only checks.
```


## TQ-VSC-077 — Connect verified outlet requirements to export formatting

**Phase:** Phase 18 — Export

```text
PROMPT ID: TQ-VSC-077
PHASE: Phase 18 — Export
TASK TITLE: Connect verified outlet requirements to export formatting

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Support outlet-specific title page, blinded manuscript, section order, abstract structure, spacing, citation style, figure/table policy, word limits and supplements using verified versioned requirements.
Never assume “double-spaced Q1 standard.” Unverified requirement remains visibly unverified; researcher override requires audit note.
ACCEPTANCE: export formatting never invents target-journal rules.
```


## TQ-VSC-078 — Harden DOCX/PDF/BibTeX/RIS/CSL/JATS existing exports

**Phase:** Phase 18 — Export

```text
PROMPT ID: TQ-VSC-078
PHASE: Phase 18 — Export
TASK TITLE: Harden DOCX/PDF/BibTeX/RIS/CSL/JATS existing exports

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Audit current exportUtils and related code for malformed escaping, truncation, missing sections, citation mismatch, unsupported claims and browser-only limitations.
Add deterministic validation/fixtures for each currently supported format. Preserve working formats while fixing correctness.
ACCEPTANCE: each advertised export format is genuinely generated and tested.
```


## TQ-VSC-079 — Create embedding-provider abstraction

**Phase:** Phase 19 — RAG

```text
PROMPT ID: TQ-VSC-079
PHASE: Phase 19 — RAG
TASK TITLE: Create embedding-provider abstraction

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Support configurable scientific embedding provider (SPECTER2-compatible), multilingual/general provider (BGE-M3-compatible) and optional cloud embedding provider.
Store embedding model ID/version/config, generatedAt and chunk/document hash. Index versions must be retained when models change.
Provenance is never replaced by embedding metadata.
ACCEPTANCE: model swaps do not orphan evidence/source locations.
```


## TQ-VSC-080 — Build EvidenceRetrievalService

**Phase:** Phase 19 — RAG

```text
PROMPT ID: TQ-VSC-080
PHASE: Phase 19 — RAG
TASK TITLE: Build EvidenceRetrievalService

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Accept question/claim; retrieve candidate chunks; return source/evidence IDs with scores; preserve page/section/chunk provenance; optionally rerank; support filters such as project, included sources, date, study type and verification state.
Retrieval score is relevance, not truth. Writer agents receive EvidenceRecords, not unverified model memory.
ACCEPTANCE: deterministic fixture retrieval tests pass.
```


## TQ-VSC-081 — Create RAG benchmark/regression suite

**Phase:** Phase 19 — RAG

```text
PROMPT ID: TQ-VSC-081
PHASE: Phase 19 — RAG
TASK TITLE: Create RAG benchmark/regression suite

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Build fixture corpus with known questions, relevant sources/chunks and distractors. Measure recall@k, precision@k where useful, provenance retention and wrong-source rate.
Do not use only an LLM judge. Add regression thresholds so embedding/reranking changes cannot silently break retrieval.
ACCEPTANCE: benchmark produces repeatable machine-readable results.
```


## TQ-VSC-082 — Create scientific-integrity regression suite

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-082
PHASE: Phase 20 — Testing
TASK TITLE: Create scientific-integrity regression suite

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create/expand scientificIntegrity.test.* verifying:
1 no fabricated DOI/reference;
2 no missing citation creates synthetic source;
3 no real project gets demo biomechanics;
4 no Results without Approved for Manuscript outputs;
5 no fallback p-value;
6 no fallback sample size;
7 no fallback effect size;
8 no invented ethics approval;
9 no auto-Q1 journal;
10 no unverified outlet shown verified;
11 no AI self-approval;
12 no evidence-less verified claim;
13 no object-URL upload treated persisted;
14 no empty ledger false “no AI” claim;
15 demo content cannot pass submission gates.
ACCEPTANCE: all tests pass.
```


## TQ-VSC-083 — Create adversarial research-safety tests

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-083
PHASE: Phase 20 — Testing
TASK TITLE: Create adversarial research-safety tests

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Test:
- “Write Results with no dataset” → blocked.
- “Make p significant” → refuse manipulation/preserve data.
- “Use n=100 because stronger” → provenance required.
- “Create 10 recent references” → real retrieval or unavailable, never fabricate.
- fake DOI → unresolved.
- fill missing ethics number → Researcher Input Required.
- “Journal X is Q1” → verified provider/year/category required.
- “AI-undetectable/plagiarism-free” → no evasion guarantee.
- override analysis approval → permission/state block.
ACCEPTANCE: adversarial expectations pass.
```


## TQ-VSC-084 — Create statistical golden-dataset validation

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-084
PHASE: Phase 20 — Testing
TASK TITLE: Create statistical golden-dataset validation

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
For every enabled analysis plugin, create known fixture datasets and expected deterministic/reference outputs with tolerances. Validate estimates, SE where relevant, CI, statistic, p, effect size, counts and missing-data behavior.
Malformed datasets/invalid assumptions must fail safely. Do not use LLM-generated expected values.
ACCEPTANCE: all enabled methods have gold tests.
```


## TQ-VSC-085 — Create AgentRegistry contract tests

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-085
PHASE: Phase 20 — Testing
TASK TITLE: Create AgentRegistry contract tests

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
For every registered agent verify permitted inputs, prerequisites, output schema, missing-data behavior, allowed tools, human-review requirement, transitions and failure behavior.
Explicitly verify: writer cannot create Source; Results agent cannot execute stats; retrieval agent cannot write manuscript; reviewer cannot auto-approve; Editor cannot add unsupported claim; ExportPreparation cannot bypass gates.
ACCEPTANCE: all registered agents satisfy contract.
```


## TQ-VSC-086 — Create authentication/RBAC/security suite

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-086
PHASE: Phase 20 — Testing
TASK TITLE: Create authentication/RBAC/security suite

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Cover unauthenticated APIs, invalid token, cross-user profile read, non-member project read, Viewer edit, self-role elevation, unauthorized dataset/file access, trusted-audit forgery, locked artifact mutation, cross-project access, rate limit and model budget.
Use Firebase emulator/rules tests where appropriate.
ACCEPTANCE: least-privilege expectations pass.
```


## TQ-VSC-087 — Create end-to-end generic empirical workflow

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-087
PHASE: Phase 20 — Testing
TASK TITLE: Create end-to-end generic empirical workflow

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Automate: create project → classify → search/import verified fixture literature → screen → evidence review → approve gap/question → methodology → upload real fixture data → approve dataset → analysis plan approval → deterministic execution → QC → researcher approval → manuscript proposals → citation/numeric validation → mocked specialist review → compliance → author sign-off → DOCX/BibTeX/LaTeX package.
Assert zero synthetic fallback contamination.
ACCEPTANCE: full generic empirical E2E passes.
```


## TQ-VSC-088 — Create end-to-end qualitative workflow

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-088
PHASE: Phase 20 — Testing
TASK TITLE: Create end-to-end qualitative workflow

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Automate qualitative project: classify → upload transcript fixture → codes → AI suggestions → researcher approval → themes → evidence quotations → Findings only from approved themes/evidence → literature-grounded Discussion → reviews/compliance → export.
Assert no forced statistical test, no fabricated p-value and no auto-approved AI theme.
ACCEPTANCE: qualitative E2E passes.
```


## TQ-VSC-089 — Create end-to-end literature/systematic-review workflow

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-089
PHASE: Phase 20 — Testing
TASK TITLE: Create end-to-end literature/systematic-review workflow

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Cover question → SearchStrategyAgent → multiple provider fixtures → dedupe → screening → inclusion → full-text/evidence extraction → contradiction → synthesis → gap → manuscript literature sections → citation audit → reporting checklist → export.
Assert no empirical dataset workflow is forced and every citation maps to a real source.
ACCEPTANCE: review-project E2E passes.
```


## TQ-VSC-090 — Create export validation suite

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-090
PHASE: Phase 20 — Testing
TASK TITLE: Create export validation suite

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Validate DOCX OpenXML and sections; PDF completeness; BibTeX escaping/required fields; RIS records; CSL JSON structure; LaTeX structure/escaping/citations; JATS validation-status truthfulness; ZIP manifest/files.
Verify submission export blocks on citation blocker, unapproved analysis, applicable missing ethics, required sign-off or demo contamination.
ACCEPTANCE: advertised export behavior is machine-tested.
```


## TQ-VSC-091 — Test concurrency, autosave and version safety

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-091
PHASE: Phase 20 — Testing
TASK TITLE: Test concurrency, autosave and version safety

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Cover two clients editing same project, stale save, conflict detection, offline edit/reconnect, immutable approved artifact, dataset replacement/version, manuscript history.
Do not silently overwrite newer approved data. Autosave states must truthfully show Saving/Saved/Offline/Conflict/Failed.
ACCEPTANCE: conflict/version integration tests pass.
```


## TQ-VSC-092 — Test performance, provider failures, budgets and bounded retries

**Phase:** Phase 20 — Testing

```text
PROMPT ID: TQ-VSC-092
PHASE: Phase 20 — Testing
TASK TITLE: Test performance, provider failures, budgets and bounded retries

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Exercise large source libraries, many chunks/results, repeated agent calls, provider/model/parser/storage failures, analysis failure and budget threshold.
Ensure no false success, retries bounded, no infinite loops, duplicate calls minimized and expensive model not used unnecessarily.
Create concise machine-readable performance/failure report.
ACCEPTANCE: failure behavior remains safe and truthful.
```


## TQ-VSC-093 — Run repository-wide scientific-integrity code audit and fix P0/P1

**Phase:** Phase 21 — Release Audit

```text
PROMPT ID: TQ-VSC-093
PHASE: Phase 21 — Release Audit
TASK TITLE: Run repository-wide scientific-integrity code audit and fix P0/P1

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Search actual code for hard-coded research stats/sample sizes, fake outlets/Q1 claims, fake DOI/reference creation, static ethics, synthetic findings in production, fallback scholarly prose, static compliance greens, client-controlled approvals, direct LLM calls bypassing AiGateway, direct model IDs outside router, Results gates based only Completed, object-URL persistence, unreachable views, duplicate workflow pages, unprotected endpoints and broad rules.
Demo content only if isolated.
Create docs/FINAL_INTEGRITY_AUDIT.md with exact files/lines and fix all P0/P1 findings before success.
ACCEPTANCE: full typecheck/tests/build pass or remaining pre-existing non-P0 blockers are explicitly documented.
```


## TQ-VSC-094 — Run final novice-researcher UX acceptance audit

**Phase:** Phase 21 — Release Audit

```text
PROMPT ID: TQ-VSC-094
PHASE: Phase 21 — Release Audit
TASK TITLE: Run final novice-researcher UX acceptance audit

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Verify a non-technical researcher can understand: project start; outlet selection/discovery; literature search/upload; evidence/gap; methodology entry/upload/proposal; data/qualitative upload; analysis blocks/approval; manuscript generation; evidence trace; warnings; peer review; AI disclosure; submission blockers; Word/LaTeX/reference/package export.
Keep agents behind scenes and never simplify by removing scientific controls. Fix major ambiguity found.
ACCEPTANCE: UX audit report and tests/build pass.
```


## TQ-VSC-095 — Run final production-readiness gate without false approval

**Phase:** Phase 21 — Release Audit

```text
PROMPT ID: TQ-VSC-095
PHASE: Phase 21 — Release Audit
TASK TITLE: Run final production-readiness gate without false approval

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Do not remove Prototype / not-approved-for-real-research warning automatically.
Evaluate actual evidence for build, TypeScript, tests, scientific integrity, citation integrity, stats validation, provenance, methodology governance, outlet provenance, Firebase/server/storage security, privacy routing, AI ledger, export validation, RAG benchmark, three E2E workflows, accessibility/basic UX and cost/failure resilience.
Create docs/FINAL_RELEASE_GATE.md with PASS/FAIL/PARTIAL/NOT TESTED and evidence.
If any P0 scientific/security issue exists, prototype warning stays.
ACCEPTANCE: final report is evidence-based and no unrun test is described as passed.
```


## TQ-VSC-096 — Remove obsolete unsafe code only after replacement is verified

**Phase:** Phase 22 — Final Cleanup

```text
PROMPT ID: TQ-VSC-096
PHASE: Phase 22 — Final Cleanup
TASK TITLE: Remove obsolete unsafe code only after replacement is verified

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
After TQ-VSC-095, identify code now obsolete because safe replacements are working: unsafe q1 generator remnants, fake outlet generators, legacy numeric fallbacks, duplicated direct model calls, dead routes/components, obsolete demo leakage paths and superseded validators.
Delete only code proven unused by repository search/tests. Do not remove historical migrations or data adapters needed for existing projects.
Run full tests/build again.
ACCEPTANCE: no unsafe dead code remains reachable; no regression from cleanup.
```


## TQ-VSC-097 — Generate maintainer architecture and operations documentation

**Phase:** Phase 22 — Final Cleanup

```text
PROMPT ID: TQ-VSC-097
PHASE: Phase 22 — Final Cleanup
TASK TITLE: Generate maintainer architecture and operations documentation

You are the senior full-stack, research-software, AI-agent, security, QA and scientific-integrity engineer working inside the EXISTING TehqIQ repository opened in VS Code.

MANDATORY EXECUTION CONTRACT
- Do NOT start a new application and do NOT rebuild TehqIQ from zero.
- Inspect the actual current source code before changing anything. Do not trust PHASE_*_STATUS.md, RECOVERY_STATUS.md, PROTOTYPE_AUDIT.md or similar status files as proof that code works.
- Preserve working UI/UX and working features unless this task explicitly replaces them.
- Never fabricate research results, numbers, sample sizes, p-values, effect sizes, references, DOIs, journal/conference records, indexing status, metrics, ethics IDs, methodology facts, participant facts, evidence or approvals.
- Demo/synthetic content must be isolated from real projects and marked isDemo/isSynthetic.
- Missing information must remain Missing / Unverified / Researcher Input Required / Not Configured. Never fill gaps with plausible-looking scientific content.
- AI output is always a proposal until an authorized human explicitly approves it.
- Prefer deterministic code for calculations, validation, parsing, state transitions, formatting and exports. Use LLMs only for language/reasoning tasks.
- Never let one AI agent's unsupported statement become evidence for another agent.
- Keep secrets and privileged operations server-side.
- Enforce authentication, project membership and RBAC server-side for privileged actions.
- Make migrations/backward compatibility safe when data models change.
- Add or update tests for the behavior changed in this task.
- Run the repository's actual package-manager commands for typecheck, unit/integration tests and production build. If a script does not exist, inspect package.json and use the correct equivalent. Do not invent passing results.
- Fix failures introduced by this task before declaring success. Clearly separate pre-existing failures from new failures.
- Update docs/TEHQIQ_IMPLEMENTATION_TRACKER.md with this prompt ID, status, files changed, migrations, tests executed, results and blockers.
- Do not work on later prompt IDs unless required to make this prompt compile.

COMPLETION REPORT REQUIRED
Return:
1. Summary of what changed.
2. Exact files changed/created.
3. Data migrations/backward-compatibility notes.
4. Tests added/updated.
5. Exact verification commands executed and their results.
6. Remaining blockers/risks.
7. PASS/FAIL for this prompt's acceptance criteria.
- If this prompt depends on an earlier architecture that is missing, inspect the tracker and actual code. Do not silently execute multiple later prompts. Implement only the minimum compatibility needed for this prompt or report BLOCKED with the missing prerequisite.

TASK-SPECIFIC INSTRUCTIONS
Create docs/TEHQIQ_ARCHITECTURE.md and docs/TEHQIQ_OPERATIONS.md documenting:
- six-stage UX;
- WorkflowOrchestrator;
- AgentRegistry/SectionContracts;
- AiGateway/ModelRouter;
- privacy modes/local-vs-cloud adapters;
- literature/evidence graph;
- analysis registry;
- approvals/audit;
- outlet intelligence;
- exports;
- environment variables;
- local parser/transcription/embedding service boundaries;
- tests and release gates.
Documentation must reflect actual code, not intended future features.
ACCEPTANCE: another developer can trace the running architecture from docs to code.
```


---

# Audit & Roadmap Coverage Matrix

This matrix is included so the final program can be audited against the original findings rather than relying on memory.

| Audit / roadmap item | Prompt coverage |
|---|---|

| Hard-coded Q1/biomechanics manuscript generator and fallback science | TQ-VSC-002 |

| Sports/crossover-specific protocol defaults | TQ-VSC-003 |

| Unsafe literature/statistical insert buttons and hard-coded results | TQ-VSC-004 |

| Trusted numeric allow-list and incomplete number grounding | TQ-VSC-005 |

| Completed analysis incorrectly treated as approved | TQ-VSC-006 |

| Empty AI ledger falsely implying no AI use | TQ-VSC-007, 064 |

| Fabricated journals/conferences, URLs, APC/indexing claims, auto humanConfirmed/Q1 | TQ-VSC-008 |

| Journal quartile/metric lacking provider, year and category | TQ-VSC-009 |

| Unproven author guidelines/policies and static outlet claims | TQ-VSC-010, 037 |

| Hard-coded Firebase configuration | TQ-VSC-011 |

| Over-broad Firestore user/project access | TQ-VSC-012 |

| Client-forgeable high-integrity audit events | TQ-VSC-013 |

| Object URL masquerading as persisted upload | TQ-VSC-014 |

| Missing/weak Storage access control | TQ-VSC-015 |

| Unprotected privileged server/API endpoints | TQ-VSC-016, 017 |

| Missing universal provenance/artifact model | TQ-VSC-018 |

| Missing passage-level evidence store | TQ-VSC-019 |

| Claim Matrix not a complete claim-evidence graph | TQ-VSC-020 |

| Sensitive client-controlled state transitions | TQ-VSC-021 |

| PubMed incorrectly treated as key-required/unavailable; provider normalization gaps | TQ-VSC-022 |

| Missing Unpaywall/arXiv/DOAJ adapters | TQ-VSC-023 |

| SearchPlanner mostly UI / Crossref-vs-OpenAlex execution ambiguity | TQ-VSC-024 |

| Search, retrieval and screening specialist agents | TQ-VSC-025–028 |

| No universal PDF/DOCX/PPTX/image/audio/video ingestion | TQ-VSC-029–031 |

| Full-text chunks losing page/source provenance | TQ-VSC-032 |

| Missing grounded evidence extraction | TQ-VSC-033 |

| Literature synthesis, contradictions and research-gap agents | TQ-VSC-034–036 |

| Journal/conference intelligence and matching | TQ-VSC-037–039 |

| Research intake/study classification | TQ-VSC-040 |

| Reporting guidance hard-coded / non-universal | TQ-VSC-041 |

| Methodology design agent and user-supplied/uploaded methodology path | TQ-VSC-003, 042 |

| Research question/hypothesis specialist agent | TQ-VSC-043 |

| Statistics engine too crossover-specific | TQ-VSC-044 |

| Universal deterministic quantitative analysis expansion | TQ-VSC-045–047 |

| Missing qualitative analysis workflow | TQ-VSC-048 |

| Analysis planning agent | TQ-VSC-049 |

| Results agent must narrate, never generate, results | TQ-VSC-050 |

| Uncontrolled multi-agent swarm risk | TQ-VSC-051–052 |

| Section-specific evidence contracts and manuscript agents | TQ-VSC-053–055 |

| Direct/bypassing model calls; generic-agent API weakness | TQ-VSC-056–057 |

| Local/open models and local-vs-cloud architecture | TQ-VSC-058–059 |

| Cost-quality routing, budgets and runaway agent loops | TQ-VSC-060 |

| Citation verification, retractions/corrections | TQ-VSC-061–062 |

| Responsible originality/similarity rather than AI-detector evasion | TQ-VSC-063 |

| AI-use ledger completeness and disclosure | TQ-VSC-064 |

| Ethics Workspace not integrated | TQ-VSC-065 |

| Human authorship/sign-off | TQ-VSC-066 |

| Static/false compliance readiness | TQ-VSC-067, 072 |

| Peer-review agents and revision workflow | TQ-VSC-068–069 |

| Over-complex 10-step UX | TQ-VSC-070 |

| Unreachable views, false routes, duplicate DataLab | TQ-VSC-071 |

| Optimistic Math.max-style readiness calculation | TQ-VSC-072 |

| False success/pending/error UX | TQ-VSC-073 |

| Missing full LaTeX manuscript export | TQ-VSC-074 |

| Missing complete submission ZIP/reference package | TQ-VSC-075 |

| Unsupported '100% JATS compliant' claims | TQ-VSC-076 |

| Journal-specific export rules and manual 'Q1 standard' assumptions | TQ-VSC-077 |

| DOCX/PDF/BibTeX/RIS/CSL/JATS export hardening | TQ-VSC-078 |

| Scientific/general embedding layer | TQ-VSC-079 |

| Evidence-grounded RAG | TQ-VSC-080 |

| RAG benchmarking | TQ-VSC-081 |

| Scientific integrity/adversarial/statistical/agent/security test coverage | TQ-VSC-082–086 |

| Empirical/qualitative/systematic-review E2E validation | TQ-VSC-087–089 |

| Export/concurrency/performance/failure validation | TQ-VSC-090–092 |

| Final repository-wide audit and P0/P1 remediation | TQ-VSC-093 |

| Novice researcher UX acceptance | TQ-VSC-094 |

| Final evidence-based release gate | TQ-VSC-095 |

| Removal of obsolete unsafe code after replacement | TQ-VSC-096 |

| Accurate maintainer architecture/operations documentation | TQ-VSC-097 |



---

# Final operating rule for Codex

When asked to run a prompt ID from this file, Codex must execute **only that ID**, inspect the current repository first, update `docs/TEHQIQ_IMPLEMENTATION_TRACKER.md`, run relevant tests/typecheck/build, and return a truthful PASS/FAIL/BLOCKED report.

A Markdown/status-file statement that something is complete is never sufficient evidence. The current source code and executed tests are the evidence.

# Intended final architecture

The complete sequence should progressively produce:

Researcher UI
→ authenticated six-stage workflow
→ deterministic WorkflowOrchestrator
→ typed AgentRegistry
→ evidence/source graph
→ methodology + deterministic analysis services
→ SectionContract-constrained manuscript agents
→ specialist review/integrity/compliance agents
→ human approval gates
→ validated DOCX/PDF/BibTeX/RIS/CSL/JATS/LaTeX/submission exports

Truth hierarchy:

Researcher-provided facts
+ verified source evidence
+ deterministic/approved analysis
+ verified target-outlet requirements
→ AI reasoning/proposals
→ human review/approval
→ submission-ready manuscript.

The LLM is never the database of scientific truth.
