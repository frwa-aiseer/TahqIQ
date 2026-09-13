# TehqIQ Current Implementation Register

## Scope and evidence

This register describes the source present at checkpoint `6dc9a38` and the TQ-VSC-000 documentation delta. It was derived from live code inspection, not from `PHASE_*_STATUS.md`, `RECOVERY_STATUS.md`, `PROTOTYPE_AUDIT.md`, or similar status documents. It is a baseline inventory, not a production-readiness approval.

## Runtime architecture

- Client: React 19 + TypeScript, built by Vite 6 and styled through Tailwind's Vite plugin. `src/main.tsx` mounts `src/App.tsx`.
- Server: Express 4 in `server.ts`. Development uses Vite middleware; production serves `dist` and a SPA catch-all. The server listens on fixed port `3000` and `0.0.0.0`.
- AI SDK: `@google/genai`, instantiated server-side from `GEMINI_API_KEY`.
- Persistence: Firebase client SDK for Authentication, Firestore, and Storage, plus browser local storage/object-URL fallbacks.
- Data/analysis: Papa Parse and XLSX ingestion; deterministic TypeScript statistical routines in `src/lib/statsEngine.ts`.
- Export: `docx`, `jspdf`, and deterministic text/XML generators in `src/lib/exportUtils.ts`.
- Tests: Vitest + jsdom + Testing Library. Twenty test files are currently discovered.

## Mounted application flow

`src/App.tsx` renders a single 10-step workflow and starts from `createDemoProject()`:

| Step | Mounted implementation |
| --- | --- |
| 1 — Idea & Title | `ResearchCanvasView` |
| 2 — Literature & Gap | `SourceLibraryView` and `GapMapView` |
| 3 — Questions & Hypotheses | `QuestionBuilderView` |
| 4 — Introduction & Review | Filtered `WritingStudioView` |
| 5 — Methodology | `ProtocolBuilderView` and `DataLabView` |
| 6 — Results | `DataLabView` |
| 7 — Discussion & Conclusion | Filtered `WritingStudioView` |
| 8 — Future Work | Filtered `WritingStudioView` |
| 9 — References | `ClaimMatrixView` (the title and mounted behavior do not match) |
| 10 — Preview & Export | `ExportCentreView` |

Hash navigation maps many legacy tab names to these ten steps, but it does not preserve a distinct subview within a step. Header, workflow navigation, quick actions, document reader, authentication, project creation/management, autosave, journal selection, and the prototype banner are mounted around the step content.

## Real client modules and views

### Mounted views and components

- Research definition: `ResearchCanvasView`, `QuestionBuilderView`, `ProjectWizardModal`.
- Literature/evidence: `SearchPlannerView`, `SourceLibraryView`, `DocumentReaderModal`, `GapMapView`, `ClaimMatrixView`.
- Method and analysis: domain-neutral `ProtocolBuilderView`, `DataLabView`.
- Writing/output: `WritingStudioView`, `ManuscriptPreviewPane` (used by export), `ExportCentreView`.
- Shell/governance: `Header`, `Navigation`, `QuickActionsMenu`, `StatusBadge`, `JournalSelectorDropdown`, `AiProposalModal`, `ApprovalModal`.
- Account/project UI: `AuthModal`, `ProjectManagerModal`, with `AuthProvider` wrapping the application.

### Present but not mounted by `src/App.tsx`

The following view modules exist but have no import or render path in the application root:

- `DashboardView`
- `JournalFinderView`
- `EthicsWorkspaceView`
- `ReportingChecklistView`
- `ComplianceCentreView`
- `PeerReviewView`
- `RevisionWorkspaceView`
- `AiLedgerView`

These components may be tested or referenced by legacy labels, but the current hash-to-step mapping does not make them reachable. For example, `ethics` maps to step 5, while step 5 renders Protocol Builder and Data Lab; `peer`, `revision`, `ledger`, `compliance`, and `outlets` map to step 10, which renders only Export Centre.

## Server endpoints and trust boundaries

| Method and path | Current behavior | Authentication / validation observed |
| --- | --- | --- |
| `GET /api/health` | Returns app name, status, and hard-coded version `2.4.0`. | No authentication. |
| `POST /api/gemini/agent` | Sends prompt/context to Gemini and returns free-form text. | No authentication or request schema; client supplies `agentType`, prompt, and context. |
| `POST /api/gemini/draft-section` | Uses Gemini structured output for manuscript section drafting; blocks Results without an approved analysis output. | No authentication; ad hoc field access rather than a request validation schema. Gemini response has an SDK response schema. |
| `POST /api/gemini/peer-review` | Requests schema-shaped reviewer comments from Gemini. | No authentication; checks only that `reviewerRole` exists. |
| `POST /api/gemini/methodology-proposal` | Returns schema-shaped, domain-neutral methodology fields as an `AI Suggested` proposal; unsupported fields are normalized to `Researcher input required`. | No reusable server authentication middleware yet; requires `projectId` and object `projectContext`. Human approval occurs separately in the signed-in client workflow. |
| `POST /api/sources/doi` | Proxies DOI lookup through the metadata provider chain and returns provenance fields. | No authentication; only checks that `doi` exists. |
| `POST /api/projects/:projectId/search-executions` | Executes the exact compiled query independently against every selected supported provider and returns a reproducible `SearchExecution`. | Authenticated project writer role, project-scope match, bounded schema validation, body/rate limits. |
| `POST /api/projects/:projectId/agents/literature-retrieval` | Runs an approved search plan through only its named real provider tools and returns normalized records, provider failures, and `SearchExecution` provenance. It never persists source records. | Authenticated project writer role with verified email, project-scope match, bounded approved-plan schema, body/rate limits. |
| `POST /api/analysis/execute` | Uses an optional external analysis service, otherwise executes the native paired-crossover engine and creates figures/tables. | No authentication or project membership/RBAC check; input checks require only `dataset` and `plan`. |
| `GET *` (production only) | Serves the built SPA index after static middleware. | Public static route. |

Express JSON bodies are limited to 25 MB. No reusable server authentication/RBAC middleware is present in `server.ts`.

## AI/model call sites

All observed model calls are server-side in `server.ts`, but they are separate direct SDK calls rather than a centralized gateway:

1. `/api/gemini/agent` calls `ai.models.generateContent` with model `gemini-3.6-flash` and returns `response.text` without a deterministic application response schema.
2. `/api/gemini/draft-section` calls the same model with an SDK JSON response schema for title, content, citations/evidence/numbers, and missing-information flags.
3. `/api/gemini/peer-review` calls the same model with an SDK JSON response schema for reviewer comments.
4. `/api/gemini/methodology-proposal` calls the same model with required domain-neutral methodology fields and returns `AI Suggested` state only.

Client callers are `ResearchCanvasView`, `WritingStudioView`, `ProtocolBuilderView`, and `PeerReviewView` (the latter is currently unreachable). No source evidence of a centralized AI gateway, model router, budget enforcement, retry policy, privacy router, or complete automatic AI-ledger write path was found.

TQ-VSC-007 records the current ledger coverage gap precisely: `/api/gemini/agent` and `/api/gemini/methodology-proposal` create no `AiLedgerEvent`; `/api/gemini/draft-section` is logged only after a later researcher decision; `/api/gemini/peer-review` is logged only after comment disposition. All four remain direct SDK paths pending later gateway centralization. Project `aiLedgerIntegrity` therefore defaults to Unknown, and known direct paths mark it Incomplete where the current component can persist project state.

TQ-VSC-008 restricts the outlet catalogue to identity-level verification. Static seeds retain only allowlisted identity fields plus official-page retrieval provenance; legacy unsourced requirements, indexing, OA, policy, formatting, fees, acceptance, deadlines, fit, and metrics are not exposed as verified. Live records require provider raw-record provenance, arbitrary static-factory inputs downgrade to user-added Unverified, and unverified outlets cannot drive compliance.

TQ-VSC-009 models outlet metrics as independent provider/year/category records rather than timeless journal properties. Verified selection requires complete provenance and official provider-domain alignment; multiple category quartiles coexist, third-party records cannot use JCR/Scopus branding, and missing or legacy singleton metrics surface as Not Verified.

TQ-VSC-010 models all journal and conference requirements as independently versioned field records with provenance, confidence, human-confirmation state, and history. The Export Centre exposes Verified, AI Extracted—Needs Review, Unverified, and Unavailable states for every required field. Only valid field-level Verified records can drive outlet-specific compliance; identity URLs and legacy top-level values are never substituted as requirement evidence.

TQ-VSC-037 adds a deterministic `OutletIntelligenceService` that assembles independently sourced identity, indexing, provider/year/category metrics, author guidelines, article types, formatting rules, policies, and conference requirements. Identity and metrics reuse their existing validators; indexing has its own source and attributable-human-verification contract; requirement facts require field-level provider, HTTPS source, and retrieval provenance. Sourced AI extraction remains `AI Extracted—Needs Review`, while missing or unsourced values are emitted as `Unavailable`/`Unverified` with no claim value. Legacy top-level indexing, limits, fees, formatting, policy text, and deadlines are never promoted into intelligence facts.

TQ-VSC-038 replaces the citation style switch as the architectural entry point with a registry-backed processor shared by in-text citation and bibliography rendering. It supports bundled CSL style IDs and registration of valid CSL XML files by their embedded ID/title/citation-format metadata, while labeling all current output `Available—Compatible` and never claiming exact journal conformance. Outlet mapping uses only a sourced, human-confirmed `referenceStyle` requirement; missing, unverified, or unsupported styles resolve to `Unavailable` instead of silently falling back to APA. Existing BibTeX, RIS, and CSL JSON import/export paths remain compatible. Imported CSL layout XML is retained, but arbitrary macro/layout execution is not implemented and is disclosed as a limitation.

TQ-VSC-039 adds a deterministic `OutletMatchingAgent` that accepts a researcher-supplied field, manuscript type, abstract, keywords, methodology, and optional outlet constraints. It recommends only unique outlet IDs from the supplied catalogue whose identity passes the existing integrity validator. Fit and mismatch explanations cite verified identity or field-level records; verified metrics retain provider, year, category, source, and retrieval date; unverified metrics are excluded. Unsupported or absent article-type, indexing, methodology-scope, open-access, metric, formatting, guideline, policy, and conference facts remain explicitly missing/unverified. Scores are transparent normalized comparisons across only assessed dimensions, not acceptance probabilities or endorsements.

TQ-VSC-040 adds a conservative `ResearchIntakeAgent` covering discipline/subdiscipline, candidate study type, research stage, manuscript type, exact researcher-supplied evidence/method/data availability, critical missing information, next stage, confidence rationale, and an explicit correction workflow. Its initial result remains `AI Suggested`; attributable confirmation creates a separate `Researcher Confirmed` record with source proposal and corrected-field provenance. Supported deterministic patterns cover clinical, qualitative, electrical engineering, machine learning, economics, and systematic-review inputs; unsupported descriptions remain `Researcher input required`. Empty projects and the creation wizard no longer default to sports/clinical framing, PICO, randomized/crossover designs, or CONSORT, and no longer insert placeholder population/intervention/outcome or methodology facts.

TQ-VSC-041 adds an extensible, official-source-linked reporting-guideline registry and deterministic resolver for randomized, observational, systematic/scoping review, diagnostic accuracy, clinical prediction-model, qualitative interview/focus-group, in-vivo animal, and case-report designs. Suggestions remain `Suggested—Needs Researcher Review`; engineering, computational, general machine-learning, software, simulation, unknown, and future types remain `Not configured` rather than receiving clinical guidance. Checklist templates begin `Required`. An item can count as addressed only after guideline confirmation and an attributable assessment with a real manuscript location and known evidence-artifact IDs. The checklist UI no longer fabricates a section location or renders every state green, and readiness ignores legacy static `Addressed` ticks without evidence.

TQ-VSC-042 adds a structured `MethodologyDesignAgent` that runs only with an explicit user-request flag and attributable approved research question/objectives, a project-scoped researcher-confirmed intake classification, reviewed gap/evidence IDs, supplied researcher facts/constraints, and researcher-confirmed reporting guidance. Its eleven required output areas classify every statement as `Researcher Fact`, `Evidence-grounded Recommendation`, `AI Proposal`, or `Missing Information`, with exact-copy/source-ID validation. Unsupported evidence, altered facts, invented sample sizes/ethics/participants/completed procedures, malformed fields, and self-approved model output fail closed. Output remains `AI Suggested`/`Needs Researcher Review`; a separate attributable approval function produces a new approved record with rationale while leaving the proposal unchanged.

TQ-VSC-043 adds a structured `QuestionHypothesisAgent` requiring a project concept, project-scoped researcher-confirmed intake classification, attributable researcher-reviewed synthesis, and attributable researcher-approved gap. It returns bounded candidate research questions and objectives with reviewed-evidence rationales, variables/concepts, and unresolved assumptions. Hypothesis candidates also require reviewed-evidence rationales and are permitted only when the confirmed study classification is hypothesis-compatible; qualitative, exploratory, systematic/scoping/narrative review, case-report, and theoretical classifications reject non-empty hypotheses. Output remains `AI Suggested`/`Needs Researcher Review`, and a separate attributable, rationalized human action creates an approved record without mutating the proposal.

TQ-VSC-044 refactors statistical execution behind an extensible `AnalysisMethodRegistry`. The existing paired/crossover implementation is retained as the explicit `paired-crossover-comparison` plugin with declared aliases, family, compatible variable types, required inputs, assumptions, output schema, diagnostics, and reproducibility capabilities. Server and client execution resolve the approved plan's named method through the registry; unrelated or unconfigured methods fail with `Researcher input required` and are never assigned paired/crossover assumptions by fallback.

TQ-VSC-045 registers deterministic Welch independent t, Mann–Whitney U, paired t, Wilcoxon signed-rank, one-way ANOVA, Kruskal–Wallis, and one-way repeated-measures ANOVA executors. They require approved inputs, validate variables/group structure/finite records/minimum sample requirements, report complete and excluded counts, emit method-specific statistics and effect sizes with dataset/plan/method reproducibility provenance, and fail without numerical fallbacks. Design and distribution assumptions that cannot be established from values remain explicitly unverified. The legacy paired/crossover plugin now has crossover-specific aliases only, while a general paired t-test resolves to the new non-crossover executor.

TQ-VSC-046 extends every analysis method definition with an enforced `Enabled`, `Planned`, or `Unavailable` availability state. Enabled methods must expose a deterministic executor; planned/unavailable methods cannot expose one and require a visible reason. Deterministic ordinary least-squares linear regression and binary logistic regression are enabled with complete-case validation, full-rank/identifiability checks, coefficient estimates, uncertainty, tests, model summaries, counts, and reproducibility provenance. Poisson, negative-binomial, Kaplan–Meier, Cox, sensitivity/specificity, and ROC/AUC entries are explicitly disabled because their validated data and diagnostic contracts are not implemented. The protected server rejects disabled methods before external or native execution.

TQ-VSC-047 adds explicit capability families for meta-analysis, machine-learning evaluation, engineering/computational analysis, and survey/psychometrics. Enabled deterministic executors are limited to fixed-effect inverse-variance meta-analysis, held-out binary classification evaluation, paired reference/prediction error analysis, and Cronbach's alpha. ML evaluation requires explicit Train/Validation/Test labels and sample IDs, evaluates Test rows only, detects cross-split ID overlap, reports classification/probability/calibration metrics, and performs no training, tuning, CV, or threshold optimization. Broader random-effects/meta-regression, CV/training/AUC, DOE/sensitivity/uncertainty propagation, factor-analysis, and IRT capabilities are visibly `Planned` or `Unavailable` with reasons and no executor. No Gemini/model call performs statistics.

TQ-VSC-048 adds an optional governed qualitative-analysis record to projects: researcher-reviewed hashed corpus documents/passages, versioned researcher and AI-suggested codes, coded passages, disagreement resolution, reflexive memos, themes, exact supporting quotations, and attributable review/approval. AI codes and themes always begin `AI Suggested` and cannot self-approve. Final approval requires the latest approved codebook, researcher-reviewed coding, resolved disagreements, and researcher-disposed themes. An explicit adapter exposes only approved qualitative findings to the existing manuscript evidence pipeline, with `analysisType: Qualitative`, `quantitativeStatistics: Not applicable`, and empty p-value/effect-size arrays. Manuscript scaffolding identifies qualitative evidence rather than inventing statistical diagnostics.

TQ-VSC-049 adds a structured `AnalysisPlanningAgent` that requires an explicit request, project-scoped attributable approved methodology, dataset profile/variable dictionary, approved research questions and hypotheses, researcher-confirmed study classification, and the live `AnalysisMethodRegistry`. It receives registry metadata without executors and proposes primary, secondary, and sensitivity analyses using enabled registered method IDs only, with variable mappings, assumption states, explicit missing variables, proposed preprocessing, and unsupported needs linked only to registered disabled capabilities. It never receives raw rows or computes results. Strict validation rejects invented/unregistered/disabled method IDs, unknown or unapproved question/hypothesis IDs, unknown or type-incompatible variables, mismatched missing-variable lists, performed preprocessing claims, malformed output, and self-approval. A separate attributable researcher action approves the proposal without mutating it.

TQ-VSC-050 adds a `ResultsInterpretationAndWritingAgent` that accepts only attributable `Approved for Manuscript`/locked analysis outputs and attributable researcher-approved qualitative themes. The tool can select and order only exact approved finding text, result IDs, and the complete exact warning arrays; altered findings, warnings, IDs, or self-approval fail closed. Results prose is assembled deterministically from those exact fields, not recalculated or freely invented by the model, and numeric grounding runs after assembly against traceable project numeric evidence. No-data projects block before tool invocation, and adversarial significance manipulation is rejected. Output remains `AI Suggested` until a separate attributable researcher approval.

TQ-VSC-011 removes the built-in Firebase project configuration. Firebase Web client identifiers now come exclusively from six validated `VITE_FIREBASE_*` values; missing, placeholder, malformed, or initialization-failed configuration produces an explicit Not Configured runtime with cloud authentication and persistence disabled. The example environment file contains blank public-client placeholders and no Admin/service-account secrets.

TQ-VSC-012 applies least-privilege Firestore rules verified against the real local emulator. Private user profiles are owner-only, project reads require ownership or explicit membership, Viewer/Reviewer writes are denied, non-owner writers cannot modify protected ownership or membership fields, and only `ownerUid` has ownership authority. Version snapshots and audit events are immutable after creation, file actor fields are constrained, and cross-project isolation is enforced.

TQ-VSC-013 moves privileged audit appends to a Firebase Admin server path. Client SDK writes are denied for every role; the server verifies token identity and project RBAC, validates ten action/entity combinations, confirms the entity and current disposition, derives snapshots and timestamp, and appends complete immutable records with rationale and evidence IDs. Legacy client-shaped records remain readable but are never classified as trusted.

TQ-VSC-016 adds a shared Firebase Admin authorization boundary to every sensitive Express endpoint. AI, analysis, methodology, DOI/project-literature, peer-review, and trusted-audit routes verify an ID token, derive project membership and role from Firestore, enforce route-specific roles and body limits, apply per-actor/project/route rate limiting, expose completion-audit hooks, and return bounded safe errors. The health endpoint remains public. Client callers obtain a fresh token from the configured Firebase user and send only the project scope needed for server lookup; frontend UID/email/role/membership claims are not authorization inputs.

TQ-VSC-017 adds deterministic runtime contracts in `src/server/apiSchemas.ts` for agent, section-drafting, peer-review, methodology, DOI, and analysis requests. Structured AI outputs are JSON-parsed and then validated for exact fields, types, bounds, finite numbers, and required arrays/objects before any success response. Missing methodology fields are no longer filled after the model call. The generic agent now uses an SDK response schema and returns a validated structured `result`; malformed AI JSON returns a 502 validation failure. External analysis-service success payloads are also validated before they can be returned, otherwise execution falls back to the typed native engine.

TQ-VSC-018 introduces the universal `ResearchArtifact` provenance envelope and a non-destructive adapter layer. Uploaded documents, sources, numeric evidence, methodology protocols, datasets, analysis plans and outputs, tables, figures, manuscript sections, reviews, and exports now have a common metadata representation with provenance, verification/approval, version, source links, checksums where available, demo/synthetic flags, and locking. Firestore/local reads and create/save paths hydrate the projection while legacy collections remain authoritative. Missing legacy creator or timestamp facts stay explicitly `Not available`.

TQ-VSC-019 adds passage-level `EvidenceRecord` objects separate from `SourceRecord` metadata. Each record requires exact passage text and a concrete page, section, or paragraph/chunk coordinate, carries document version/hash state, extraction actor/method/confidence, linked claims, timestamps, and human-review disposition. AI extraction starts Needs Review. The claim linker no longer falls back to abstracts or placeholder evidence, and the document reader displays provenance plus attributable researcher review controls. Traceable legacy passages adapt non-destructively; unlocated legacy text is not promoted.

TQ-VSC-020 upgrades claims and evidence into a many-to-many graph. Explicit edges record supporting, partial, contextual, or contradictory relationships, confidence, independent verification/approval, sentence IDs, and attributable review. Integrity checks detect orphans, duplicates, invalid confidence, broken sentence links, reciprocal-backlink failures, and demo contamination. Claim Matrix supports deliberate creation or reuse of passage evidence, relationship review, and “Why is this sentence supported?” traversal through claim, evidence, source, and exact location. Legacy inline links adapt as pending rather than verified.

TQ-VSC-021 moves eight privileged state changes to a Firebase Admin transaction service. Source/claim verification, dataset approval/lock, analysis manuscript approval, manuscript lock, ethics approval, author sign-off, and Submission Ready now produce immutable server-created transition records with actor, rationale, evidence IDs, before/after SHA-256 hashes, and optimistic revision control. Firestore denies client transition-history writes and direct changes to integrity/submission controls. Once a baseline exists, direct privileged changes or locked-content rewrites produce a digest mismatch and block further trusted transitions. Legacy projects establish their baseline on first trusted use; earlier history is not retrospectively attested.

## Firebase, authentication, Firestore, and Storage

### Client initialization and auth

- `src/lib/firebase.ts` initializes Firebase from a hard-coded fallback configuration, including a placeholder/demo-looking API key and project identifiers. It does not read Vite environment variables.
- `src/context/AuthContext.tsx` supports Google popup sign-in, email/password sign-in, email/password account creation, verification email, auth-state observation, user profile reads/writes, and logout.
- User profiles are stored under `/users/{uid}`.

### Project persistence

- `src/lib/projectService.ts` implements project list/get/create/save, archive/soft-delete/hard-delete, member role updates, audit-event creation, and immutable version snapshot creation.
- These operations are invoked directly from the client. Audit-event fields, including actor identity and details, are client supplied.
- `src/hooks/useAutosave.ts` connects project changes to persistence and exposes idle/saving/saved/offline/conflict/failed UI states.
- Demo projects bypass Firestore saving; real projects are intended to persist in `/projects/{projectId}`.

### Storage

- `src/lib/storageService.ts` calculates SHA-256 from the selected bytes, uploads to `projects/{projectId}/files/...`, resolves the durable object reference, and only then writes project-scoped metadata beneath the project document.
- Successful metadata records include project ID, actual Storage path, SHA-256, MIME type, size, uploader UID, timestamp, persistence state, and researcher-upload provenance.
- Failed uploads throw an explicit `Local / Unpersisted` error and create no research-file metadata record. If metadata persistence fails after object upload, cleanup of the incomplete object is attempted. The research upload path has no browser object-URL fallback.
- Local-storage save/load helpers also exist.
- `storage.rules` is private by default and restricts `projects/{projectId}/files/{fileId}` using the corresponding Firestore project's owner/member roles. It enforces a centralized 25 MiB limit, an explicit research-document MIME allowlist, project/uploader/checksum/provenance metadata, non-overwrite creation, immutable identity metadata on updates, Owner-only deletion, and locked-object protection.
- `firebase.json` configures both Firestore and Storage emulators. `npm run test:storage-rules` exercises the combined emulators because Storage authorization reads project membership from Firestore.
- No malware scanner is implemented or claimed by the Storage policy.

### Firestore rules observed

- Project reads require authentication plus demo/owner/member conditions; project creates require matching `ownerUid`; updates and deletes use role/owner helpers.
- `/users/{userId}` reads are allowed to any signed-in user, while writes are restricted to the same UID.
- Version and audit subcollections prohibit updates/deletes, but authenticated project members may create audit events directly.
- File metadata reads/writes/deletes are role constrained in Firestore rules; this is distinct from Cloud Storage object authorization.

## Data model and integrity modules

- `src/types.ts` defines project roles, lifecycle states, provenance, sources, extracted passages, claims/evidence links, datasets and versions, analysis plans/outputs, generated figures/tables, manuscript sections, outlets/requirements/metrics, compliance, reviewer comments, AI ledger events, export jobs, and numeric evidence.
- `src/data/demoProject.ts` provides empty/demo project factories and demo-record isolation checks.
- `src/lib/stateMachines.ts` defines source, claim, dataset, analysis, and manuscript-section transitions plus integrity checks.
- `src/lib/permissions.ts` provides deterministic client-side role capability maps.
- `src/lib/readinessCalculator.ts` computes readiness and pipeline-stage status.
- `src/lib/aiValidationService.ts` validates proposed AI prose/numbers and generates a ledger disclosure statement.
- `src/lib/citationVerifier.ts` verifies manuscript citation/source consistency and explicitly prevents automatic missing-source fabrication.
- `src/lib/citationAuditAgent.ts` provides a deterministic CitationAuditAgent-style audit over manuscript citation metadata, real project Sources, EvidenceRecords, and bibliography entries. It reports PASS/WARNING/BLOCKER findings for unresolved identifiers, verification/retraction/correction state, missing researcher-verified evidence, duplicate citations/bibliography, orphan bibliography entries, and missing bibliography entries. External identifier resolution never imports or fabricates a Source.
- `src/lib/sourceIntegrityVerification.ts` verifies identifier-backed Sources through configured integrity metadata providers and stores status, provider, retrieval time, and related identifiers on the Source. Crossref relation/update metadata is supported for retractions, corrections, expressions of concern, and updates; no provider result remains `Unverified` rather than being interpreted as clearance. Citation audit consumes this status, and the existing compliance/export gates consume the resulting Source retraction/correction flags.
- `src/lib/originalityRiskEngine.ts` provides deterministic source-linked quotation, close/verbatim n-gram overlap, uncited close-paraphrase, missing-attribution, duplicate-section, and optional version-self-overlap signals. Findings are cautious researcher-review risks, not plagiarism accusations or originality/AI-detection guarantees. Synthetic sources are excluded, and a licensed similarity provider is an explicit adapter boundary whose availability is reported honestly.
- `src/lib/writingEvidence.ts` is the Writing Studio insertion policy boundary: literature requires researcher-reviewed passage/claim evidence with verified source provenance, while statistics require exact `Approved for Manuscript` state and are revalidated at insertion time.
- `src/lib/aiValidationService.ts` now grounds empirical numbers by exact, Verified `NumericEvidence` provenance rather than value allowlists. It context-classifies bibliographic citations and labeled structural numbering and exposes validation for prose, tables, captions, and supplements.
- Completed, hash-linked Data Lab runs deterministically create `NumericEvidence` records from stored numeric output fields through `src/lib/numericEvidence.ts`; failed or hashless runs create none.
- Analysis completion is separate from manuscript approval. `src/lib/analysisLifecycle.ts` requires Completed → QC Passed → Researcher Reviewed → Approved for Manuscript, with an attributable human approval record matching the output, dataset hash, and plan ID. Results drafting, insertion, compliance, and figure/table export use this common gate.
- `src/lib/complianceEngine.ts` calculates outlet rules and export gates.

Client-side guards and Firestore rules are not substitutes for authentication and RBAC on the Express API routes.

## Analysis implementation

- `src/lib/datasetIngestion.ts` parses/profiles CSV and XLSX inputs, calculates hashes, tracks missingness/duplicates/schema drift/PII warnings, and manages variable dictionary/version updates.
- `src/lib/statsEngine.ts` contains distribution helpers, data profiling, a native paired/crossover analysis execution path, reproducibility hashes, and figure/table generation from stored outputs.
- `DataLabView` calls `/api/analysis/execute` for server execution.
- `ANALYSIS_SERVICE_URL` optionally routes execution to an external `/execute` service; failures fall back to the native engine.
- The native endpoint is specialized to paired/crossover analysis rather than a general analysis registry.
- `src/lib/q1ManuscriptEngine.ts` remains only as a demo-fixture generator. TQ-VSC-002 added a fail-closed `isDemoProject === true` guard to both generation entry points, tags generated sections as demo/synthetic, and removed all production component imports. Deterministic tone-only formatting now lives in `src/lib/manuscriptTone.ts`.

## Methodology workspace

- `ProjectState.methodologyWorkspace` is optional for backward compatibility and stores source mode, review state, adaptable methodology fields, upload/proposal metadata, and attributable researcher approval.
- `src/lib/methodologyWorkspace.ts` provides blank hydration and deterministic label-only extraction; it does not infer absent protocol facts.
- `ProtocolBuilderView` supports researcher entry, text protocol upload (`Needs Review`), and structured AI proposal (`AI Suggested`). Blank values display `Researcher Input Required`.
- The fixed 48-hour washout, power, effect-size, minimum-participant, and synthetic sample defaults were removed from the mounted Protocol Builder.

## Server-controlled agent registry

- `src/server/agentRegistry.ts` is the typed, immutable source of truth for 19 agent contracts spanning intake through export. Contracts declare purpose, permitted artifacts/tools, output schema metadata, model tier, workflow prerequisites, review obligations, next states, prohibited behavior, and server-side role/frontend permissions.
- The authenticated `/api/gemini/agent` endpoint no longer accepts a client-selected `agentType` or free-form task prompt. It resolves a registered ID on the server and rejects unknown/internal agents, unauthorized roles, undeclared context keys, and agents incompatible with the language-model endpoint before model invocation.
- Only the bounded research-intake contract is currently callable from the frontend. Other entries describe server-only contracts and are not evidence that a centralized AI gateway or every listed executable agent has been implemented.
- `src/server/workflowOrchestrator.ts` provides a deterministic route planner for all registered agents. Fixed routes validate workflow kind, stage, registry role, artifact presence/review state, output destination, and approval requirement, while returning no automatic next-agent call. It supports governed flexible entry for existing literature, qualitative findings, datasets, and methodologies.
- The orchestrator is currently a stateless server-domain boundary, not a mounted persistence endpoint. A successful plan does not itself run an agent, store an output, approve content, or mutate project workflow state.

## Central AI gateway

- `src/server/aiGateway.ts` is the sole production TypeScript boundary that constructs the Gemini SDK or invokes `models.generateContent`. The generic agent, draft-section, peer-review, and methodology-proposal endpoints all execute through it.
- The gateway checks authenticated project actor/role, registered agent permissions, non-deterministic provider compatibility, allowed unique input artifact IDs, prompt/schema metadata, and route-specific structured response validation. It returns a traceable `AI Suggested—Needs Researcher Review` output artifact only after durable success-event recording.
- Successful output artifacts and their gateway ledger events are atomically written to append-only project subcollections. Events contain agent/provider/model/prompt/schema/trace, input and output artifact IDs, available token usage, actor context, and success/failure state. Failed provider/schema calls have no output artifact; inability to record a success also fails closed.
- `src/server/modelRouter.ts` centrally maps registered agents to FAST, MAIN, and REVIEW tiers configured by server-only `TEHQIQ_MODEL_FAST`, `TEHQIQ_MODEL_MAIN`, and `TEHQIQ_MODEL_REVIEW` values. Model IDs can change without editing feature routes; absent variables use the prior model through one explicit central default.
- Structured gateway tasks enforce their JSON response schema. Controlled-tool tasks instead require registry-approved tool IDs, SDK-safe function declarations, and an explicit Gemini `allowedFunctionNames` allowlist. Budgets and canonical reconciliation with the legacy project `aiLedger` array remain later work; legacy ledger integrity remains `Incomplete`, not falsely certified.
- `src/server/localModelProviders.ts` adds configurable server-endpoint abstractions for SPECTER2-compatible scientific embeddings, BGE-M3-compatible general embeddings, Whisper-compatible transcription, Qwen-VL-compatible vision/document analysis, and an OpenAI-compatible local general LLM (for example, a separately hosted gpt-oss/Qwen service). Providers report `Not Configured`, `Configured`, `Healthy`, `Unavailable`, or `Failed`; only `Healthy` adapters route. API keys remain private server configuration, response shapes are validated, and no model is represented as running in the browser.
- `src/server/privacyTaskRouter.ts` enforces `Standard Cloud`, `Private/Hybrid`, and `Local-Only` modes before provider invocation. Every gateway task declares sensitivity, whether raw uploads are included, permitted provider IDs, and its registered preferred tier. Private/Hybrid prevents confidential or raw-upload tasks from using cloud providers; Local-Only accepts only explicitly classified local infrastructure. When no permitted healthy provider satisfies the mode, the gateway returns `Cannot Run Under Current Privacy Mode` without calling a provider.
- Privacy mode is read from the trusted project document (`aiPrivacyMode`) ahead of the server default. Local/private endpoint location requires the server operator's explicit `TEHQIQ_LOCAL_LLM_LOCATION` classification and is never inferred from a hostname or client input. Successful and failed gateway events retain the applied privacy mode, sensitivity, and raw-upload declaration.
- `src/server/aiBudgetGuard.ts` adds preflight per-project/per-user maximum-cost reservations, versioned provider/model pricing lookup, soft/hard USD budgets, tier-specific remaining-budget thresholds, premium-review counts, bounded provider attempts, and repeated-agent-loop limits. Prices are supplied through `TEHQIQ_AI_PRICING_CONFIG_JSON`; no transient commercial price is embedded in core logic. Trusted project `aiBudgetPolicy` overrides the server policy default.
- Gateway events now record pricing version, estimated actual cost from provider-reported input/output tokens, exact provider-call count, premium-review classification, and soft-limit state. Hard-budget, tier-threshold, and loop failures stop before provider execution; retries cannot exceed the validated policy maximum.

## Manuscript section contracts

- `src/lib/manuscriptSectionContracts.ts` defines immutable contracts for Introduction, Literature Review, Methods, Results, Discussion, Conclusion, Abstract, Title, and Keywords. Each contract specifies verified/approved input artifacts, permitted empirical-claim sources, proposal status, and section-specific prohibited behavior.
- The shared output contract requires claim/evidence mappings, source IDs, NumericEvidence IDs, explicit missing-information entries, and warnings. Input validation blocks absent or insufficiently reviewed prerequisites, undeclared inputs, duplicates, and any demo/synthetic artifact in a real project.
- Methods requires actual researcher-confirmed ethics information or a researcher-confirmed not-applicable state. Results accepts only `Approved for Manuscript` quantitative outputs or researcher-approved qualitative findings. Conclusion explicitly prohibits introducing new empirical claims.
- `src/lib/manuscriptSectionWriters.ts` implements Introduction, Literature Review, Methods, Discussion, Conclusion, and Abstract writer domain services over these contracts. They select/order exact grounded units only, preserve claim/evidence/source/NumericEvidence mappings, reject created facts/references/numbers, remain review-pending, and return a pending attributable AI-use record. Results continues to use `ResultsInterpretationAndWritingAgent`.
- A separate manual-draft helper preserves non-AI researcher writing. These writer services are not yet mounted in the existing generic drafting endpoint/UI or persisted to the canonical AI ledger; that integration is not claimed here.
- `src/lib/manuscriptEditorAgent.ts` provides a bounded, non-inventive manuscript editor domain service. It compares every approved pre-edit claim with its proposed post-edit counterpart, preserves provenance/citations/numbers and protected statistical meaning, blocks removed uncertainty and overstatement, and permits added vocabulary only for narrow connectives or researcher-approved terminology/cross-references.
- Repetition removal is fail-closed: unique claims cannot be deleted, and a removed claim requires an exact retained duplicate with matching provenance. Editor output remains `AI Suggested—Needs Researcher Review` with a pending attributable AI-use record. It is not yet mounted or persisted.

## Literature and reference providers

- Normalized DOI provider adapters in `src/lib/metadataProviders.ts`: Crossref, OpenAlex, DataCite, Europe PMC, and PubMed/NCBI E-utilities.
- Provider results preserve provider/record identifiers, DOI/PMID/PMCID where supplied, one retrieval timestamp, and field-level provenance. Missing metadata remains absent rather than receiving synthetic fallback values.
- PubMed operates without an API key at its normal request allowance; the server can supply optional `NCBI_API_KEY` and `NCBI_EMAIL` values for identified/higher-throughput E-utilities use.
- `lookupDoiMetadata` runs the registered provider cascade; `searchMissingCitationCandidates` queries Crossref candidate search with the same no-fabrication normalization.
- `src/lib/specialistDiscoveryProviders.ts` declares and implements Unpaywall-compatible DOI OA discovery, arXiv ID lookup/search, and DOAJ DOI/record lookup/search. It preserves provider errors/provenance and accepts only provider-returned access links; it does not scrape or infer full-text URLs.
- `src/lib/searchExecution.ts` compiles provider-specific syntax and executes Crossref, OpenAlex, PubMed, Europe PMC, arXiv, and DOAJ independently. Stored execution records retain design context, concepts/synonyms, filters, timestamps, exact syntax, returned source IDs, per-provider counts, warnings, and errors.
- The mounted Search Planner implements design/edit → provider selection → protected server execution → researcher review → explicit import. Imported search results remain `Unverified` metadata and retain their execution/provider provenance.
- `src/lib/literatureRetrievalAgent.ts` is a deterministic tool orchestrator over the real TQ-VSC-024 provider adapters. It requires attributable approval and exact per-provider syntax, invokes only selected tools, preserves normalized records/failures/provenance, and returns no created source IDs. Failed-provider payload records are discarded.
- `src/lib/sourceDeduplication.ts` provides the single application import boundary for deterministic source deduplication. DOI/PMID/PMCID/arXiv/other stable identifiers take priority; identifier-free matching requires exact normalized title, year, and first author. Merges retain a stable canonical source ID, provider aliases, preferred field sources/provenance, and explicit unresolved conflicts.
- `src/lib/literatureScreeningAgent.ts` evaluates only project-scoped, researcher-approved deterministic criteria against retrieved title/abstract text. Its structured Include/Exclude/Uncertain suggestions remain proposals; the mounted screening workbench requires an attributable researcher rationale for decisions and preserves suggestion/override audit history separately.
- `src/lib/documentIngestionRouter.ts` is the unified file-classification and ingestion boundary for PDF, DOCX, PPTX, XLS/XLSX, CSV/TSV, JSON, TXT, Markdown, TeX, image, audio, and video inputs. It preserves SHA-256, status history, parser provenance, extracted blocks, warnings, and errors. Spreadsheet/delimited/JSON inputs invoke the existing dataset ingestion engine; plain text formats use deterministic block extraction.
- `src/lib/richDocumentParser.ts` provides a strict self-hosted/Cloud Run Docling-compatible adapter for PDF, DOCX, and PPTX. The server-only `DOCUMENT_PARSER_SERVICE_URL` selects the service; absent configuration returns `Requires Review`, not `Parsed`. Validated service blocks retain page, section, table, and image references plus exact provider/version provenance. Media parsing remains Not Configured.
- `src/lib/mediaTranscriptionProvider.ts` provides a strict Whisper-compatible/self-hosted adapter for audio and video. The server-only `TRANSCRIPTION_SERVICE_URL` and a per-request privacy-routing hook are both required before bytes leave the application. Validated transcripts retain timestamps, language, confidence, speaker metadata, provider/version, a locally computed SHA-256, and `Needs Review`; missing/blocked/failed routes create no transcript.
- `src/lib/fullTextChunks.ts` deterministically chunks parsed text and table blocks while retaining source ID, original document SHA-256/version, global chunk index, page/section or media timestamps, exact block/character context, ingestion-job/parser provenance, and adjacent chunk references. Its trace helper reconstructs each chunk from the original extracted block; unlocated or non-text blocks are not emitted. Chunk provenance contains no embedding-model dependency.
- `src/lib/evidenceExtractionAgent.ts` is a structured, fail-closed evidence-extraction boundary over supplied full-text chunks. Propositions, exact passages, and available context/population/method/result/limitation fields must be verbatim-supported by cited supplied chunks; unsupported or mixed-provenance output is rejected. Accepted proposals and canonical evidence records start `Needs Researcher Review`/`Needs Review`.
- `src/lib/literatureSynthesisAgent.ts` accepts only attributable researcher-verified `EvidenceRecord` inputs and validates a structured synthesis of themes, supporting/conflicting IDs, methodological/context differences, limitations, unresolved questions, and candidate statements. Every evidence-grounded item requires supplied evidence IDs; unsupported content is permitted only when explicitly labeled `Interpretation` or `Hypothesis`. Output remains `Needs Researcher Review`.
- `src/lib/contradictionDetectionAgent.ts` compares only attributable researcher-verified evidence and creates evidence-linked contradiction groups with separate supporting/contradictory IDs, contextual/methodological reasons, and explicit uncertainty. Every comparison statement requires supplied evidence IDs, categorical “study is wrong” language is rejected, and groups remain `Needs Researcher Review`. `GapMapView` exposes stored groups with their evidence attribution.
- `src/lib/researchGapAgent.ts` accepts only attributable researcher-reviewed synthesis and contradiction inputs, with limitations/context copied unchanged from the reviewed synthesis. It produces evidence-linked, scoped `AI Suggested` gap proposals containing type, confidence, caution, contradicting IDs, and proposed new research. Universal novelty claims such as “no study has ever” are rejected.
- Client DOI lookup is routed through `/api/sources/doi`.
- `src/lib/referenceParsers.ts` parses BibTeX, RIS, CSL JSON, and plain reference text.
- `src/lib/cslStyles.ts` and `src/lib/journalStyleConfig.ts` format citations and bibliography entries.
- `src/data/baselineOutlets.ts` contains static journal/conference records, live/user-added record factories, provenance/integrity validation, and style mapping.
- No full-text download pipeline or general agent tool registry was found in the mounted application. The search execution and specialist adapters expose metadata and lawful provider-supplied access locations but do not download content.

## Export implementation

`src/lib/exportUtils.ts` and `ExportCentreView` currently expose:

- DOCX generation with the `docx` library.
- Multi-page PDF generation with jsPDF.
- BibTeX, RIS, and CSL JSON serialization.
- JATS XML generation and a local structural validation function.
- Export job records and browser downloads.

Not observed: a full-manuscript LaTeX exporter or submission-package ZIP builder. The current JATS validator performs local string/XML checks; it does not demonstrate validation against the referenced NLM DTD, so the success label `Validated JATS XML v1.3 (NLM Standard)` is stronger than the implementation evidence supports.

## Test inventory and baseline

The repository includes suites covering accessibility, baseline outlet integrity, citation verification, data-integrity regression, end-to-end component workflows, export validation, Firestore rule text/logic, integration flows, lifecycle behavior, manuscript domain isolation, numeric grounding, phases 0–6, statistical sensitivity, and unit utilities.

Baseline on TQ-VSC-000:

- Typecheck: PASS (`npm run lint`).
- Production build: PASS (`npm run build`) with browser-`crypto` and large-chunk warnings.
- Tests: FAIL (`npm test`): 16/20 files passed; 130/131 executed tests passed. One Crossref assertion failed due network failure, and three suites failed import because Vite could not resolve Firebase Firestore/Storage subpaths.

The Firestore rule tests inspect rule source and simulate helper behavior; no Firebase Emulator Suite execution was observed.

## Current unsafe, conflicting, or incomplete implementations

These are source observations, not work completed under later prompts:

1. Material server model calls and model selection are centralized through `AiGateway`, the configurable FAST/MAIN/REVIEW `ModelRouter`, privacy-aware cloud/private/local selection, and a budget/loop guard. Reconciliation of gateway events into the legacy project AI ledger remains incomplete.
2. Some deeply nested research entity fields are validated at their server-use boundary rather than exhaustively re-declaring the full persisted project schema; schema versioning remains a future compatibility consideration.
3. Several implemented views are unreachable, while legacy route labels misleadingly land on other step content.
4. Step 9 is labeled References but renders Claim Matrix rather than a dedicated reference-list view.
5. `q1ManuscriptEngine.ts` still contains synthetic demonstration prose, but TQ-VSC-002 restricts it to explicit demo projects. TQ-VSC-004 removed abstract/unreviewed literature insertion and non-final statistical insertion from Writing Studio; other writing-generation paths remain separately governed.
6. JATS validation language overstates the local validator's demonstrated assurance.
7. Build externalizes Node `crypto` from browser code and emits a very large main chunk.
8. The baseline suite is red because of a network-dependent DOI expectation and a localStorage test-environment issue.
9. The API rate limiter and AI budget reservation store are per server instance. Provider retries are bounded, but distributed hard-budget coordination requires a shared transactional store for horizontally scaled deployment.
10. The repository has both npm and Bun lockfiles, creating package-manager ambiguity; the declared verification scripts were run through npm for this baseline.

## Data migration and backward compatibility

TQ-VSC-018 adds an optional canonical artifact projection without rewriting legacy domain collections. Existing project documents remain loadable; adapters populate the projection at read/create/save boundaries and retain explicit missing metadata states.

## Release state

The application remains a prototype and is not approved for real research use. This register must not be interpreted as security, scientific-integrity, statistical, privacy, or production certification.
