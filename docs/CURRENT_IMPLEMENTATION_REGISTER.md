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
- `src/lib/documentIngestionRouter.ts` is the unified file-classification and ingestion boundary for PDF, DOCX, PPTX, XLS/XLSX, CSV/TSV, JSON, TXT, Markdown, TeX, image, audio, and video inputs. It preserves SHA-256, status history, parser provenance, extracted blocks, warnings, and errors. Spreadsheet/delimited/JSON inputs invoke the existing dataset ingestion engine; plain text formats use deterministic block extraction. Rich documents and media remain truthfully queued with a `Not Configured` warning until their later parser adapters exist.
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

1. Four direct Gemini integrations are not centralized; TQ-VSC-017 validates their structured server responses, but no universal model gateway exists.
2. Some deeply nested research entity fields are validated at their server-use boundary rather than exhaustively re-declaring the full persisted project schema; schema versioning remains a future compatibility consideration.
3. Several implemented views are unreachable, while legacy route labels misleadingly land on other step content.
4. Step 9 is labeled References but renders Claim Matrix rather than a dedicated reference-list view.
5. `q1ManuscriptEngine.ts` still contains synthetic demonstration prose, but TQ-VSC-002 restricts it to explicit demo projects. TQ-VSC-004 removed abstract/unreviewed literature insertion and non-final statistical insertion from Writing Studio; other writing-generation paths remain separately governed.
6. JATS validation language overstates the local validator's demonstrated assurance.
7. Build externalizes Node `crypto` from browser code and emits a very large main chunk.
8. The baseline suite is red because of a network-dependent DOI expectation and a localStorage test-environment issue.
9. The new in-process API rate limiter is per server instance; no distributed limiter, request budget, explicit bounded provider retry policy, or centralized privacy policy is present.
10. The repository has both npm and Bun lockfiles, creating package-manager ambiguity; the declared verification scripts were run through npm for this baseline.

## Data migration and backward compatibility

TQ-VSC-018 adds an optional canonical artifact projection without rewriting legacy domain collections. Existing project documents remain loadable; adapters populate the projection at read/create/save boundaries and retain explicit missing metadata states.

## Release state

The application remains a prototype and is not approved for real research use. This register must not be interpreted as security, scientific-integrity, statistical, privacy, or production certification.
