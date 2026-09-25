# TehqIQ maintainer operations

Source inspection: 2026-09-25, TQ-VSC-097. Read the [architecture guide](TEHQIQ_ARCHITECTURE.md) for the mounted paths and the libraries that are not connected to them. Commands below run from the repository root. This guide documents configuration; it does not claim that Firebase or external providers have been provisioned or tested against a live deployment.

## 1. Install and run locally

[package.json](../package.json) defines the supported repository commands; [package-lock.json](../package-lock.json) is the lockfile used by the npm workflow. A Bun lockfile also exists, but this verification uses npm. There is no `engines` declaration or dedicated Node-version file. The TQ-VSC-097 check environment reports Node `v25.9.0` and npm `11.12.1`; those observations are not a supported-version guarantee.

For a fresh checkout, install dependencies:

```sh
npm ci
```

Use [.env.example](../.env.example) as a template for an ignored `.env` file, preserving any existing configuration. Empty Firebase client values intentionally leave cloud sign-in/persistence Not Configured. Replace provider placeholders with deployment values only when enabling the corresponding capability; never commit credentials. No model download or parser/transcription server is installed by `npm ci`.

```sh
npm run dev
```

Open `http://localhost:3000`. [server.ts](../server.ts) fixes the listener at `0.0.0.0:3000`; there is no `PORT` environment override. If it reports `EADDRINUSE`, inspect the listener with `lsof -nP -iTCP:3000 -sTCP:LISTEN` before starting another process. Do not terminate an unrelated listener.

Read-only process smoke checks:

```sh
curl -fsS http://localhost:3000/api/health
curl -I http://localhost:3000/
```

`/api/health` returns static status/app/version JSON. A successful response proves the Express route is reachable, not that Firebase, model access, rules, parsing, or research approval works. The demo UI can render while those services remain unconfigured. Creating an unsigned-in real project provides in-memory state, not guaranteed durable storage.

## 2. Build and run the production bundle

```sh
npm run lint
npm test
npm run build
NODE_ENV=production npm start
```

`lint` is `tsc --noEmit`; there is no separate ESLint or `typecheck` script. Build runs Vite for `dist` and esbuild for `dist/server.cjs` plus its source map. `npm start` alone does not set `NODE_ENV`; set it to `production` so the server uses built static files. `npm run preview` starts Vite's static preview and does not run the Express APIs.

The server bundle leaves npm packages external and retains the top-level Vite import even in production. Vite appears in both dependency sections of `package.json`; its lockfile entry is not marked development-only. Keep it available at runtime unless the import/bundling strategy changes. An installation with development dependencies omitted was not tested in this task. Run from the repository root because static paths and `.env` resolution use the current working directory. No container, reverse-proxy, or automated deployment pipeline is supplied by this task.

## 3. Environment loading and inventory

Server configuration is loaded through `dotenv.config()` in [server.ts](../server.ts), which reads `.env` using its default behavior. Vite independently loads its client environment and embeds `VITE_*` values at dev startup/build time. Restart development after changing client configuration; rebuild the browser assets for production changes. A value placed only in `.env.local` is not automatically loaded by the server's plain `dotenv.config()` call. Privileged credentials and service endpoints must stay out of `VITE_*` variables.

The inventory includes variables read by code but absent from `.env.example`. “Adapter only” means setting it does not create a UI or API path.

| Variable | Reader / actual effect |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Public Web client key, validated by [firebaseConfig.ts](../src/lib/firebaseConfig.ts). Required with the other five client identifiers. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase client auth hostname. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase client project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase client bucket hostname. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID. |
| `VITE_FIREBASE_APP_ID` | Firebase application ID. |
| `FIREBASE_ADMIN_PROJECT_ID` | Server Admin project ID, required for protected routes unless the next fallback is set. |
| `GCLOUD_PROJECT` | Server fallback project ID. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Standard Application Default Credentials file setting used by the Admin SDK, not parsed directly by application code. Alternatively use credentials supplied by the hosting environment. Never a client variable. |
| `GEMINI_API_KEY` | Enables construction of the Gemini provider. A nonempty placeholder is not verified access. |
| `TEHQIQ_MODEL_FAST` | FAST model ID in [modelRouter.ts](../src/server/modelRouter.ts). |
| `TEHQIQ_MODEL_MAIN` | MAIN model ID. |
| `TEHQIQ_MODEL_REVIEW` | REVIEW model ID. All three currently fall back to the source literal `gemini-3.6-flash`; confirm configured model availability independently. |
| `TEHQIQ_AI_PRICING_CONFIG_JSON` | Required versioned prices for every selected provider/model; parsed by [aiBudgetGuard.ts](../src/server/aiBudgetGuard.ts). |
| `TEHQIQ_AI_BUDGET_POLICY_JSON` | Required server policy unless stored project `aiBudgetPolicy` supplies it. |
| `TEHQIQ_AI_MAX_OUTPUT_TOKENS` | Gateway requested output cap; server fallback 4096. The current local LLM adapter does not forward this cap. |
| `TEHQIQ_AI_PRIVACY_MODE` | Default when project `aiPrivacyMode` is absent: `Standard Cloud`, `Private/Hybrid`, or `Local-Only`. Source fallback is Standard Cloud. |
| `TEHQIQ_LOCAL_LLM_ENDPOINT` | General LLM base URL; the only local-model capability currently connected to server gateway execution. |
| `TEHQIQ_LOCAL_LLM_MODEL` | General endpoint model ID; fallback `Local-general-compatible`. |
| `TEHQIQ_LOCAL_LLM_API_KEY` | Optional server-side bearer key for health and generation requests. |
| `TEHQIQ_LOCAL_LLM_LOCATION` | Required operator assertion `Local` or `Private` before this provider is eligible. Local-Only permits only Local. |
| `TEHQIQ_SCIENTIFIC_EMBEDDING_ENDPOINT` | Scientific embedding base URL; adapter only. |
| `TEHQIQ_SCIENTIFIC_EMBEDDING_MODEL` | Scientific model ID; fallback `SPECTER2-compatible`. |
| `TEHQIQ_SCIENTIFIC_EMBEDDING_API_KEY` | Optional embedding bearer key. |
| `TEHQIQ_GENERAL_EMBEDDING_ENDPOINT` | General embedding base URL; adapter only. |
| `TEHQIQ_GENERAL_EMBEDDING_MODEL` | General model ID; fallback `BGE-M3-compatible`. |
| `TEHQIQ_GENERAL_EMBEDDING_API_KEY` | Optional embedding bearer key. |
| `TEHQIQ_WHISPER_ENDPOINT` | Generic transcription base URL; falls back to `TRANSCRIPTION_SERVICE_URL` in the endpoint registry. Adapter only. |
| `TEHQIQ_WHISPER_MODEL` | Generic transcription model ID; fallback `Whisper-compatible`. |
| `TEHQIQ_WHISPER_API_KEY` | Optional bearer key for the generic endpoint adapter. |
| `TEHQIQ_VISION_DOCUMENT_ENDPOINT` | Vision/document base URL; adapter only. |
| `TEHQIQ_VISION_DOCUMENT_MODEL` | Vision model ID; fallback `Qwen-VL-compatible`. |
| `TEHQIQ_VISION_DOCUMENT_API_KEY` | Optional vision bearer key. |
| `DOCUMENT_PARSER_SERVICE_URL` | Rich-document `/parse` base URL in [richDocumentParser.ts](../src/lib/richDocumentParser.ts); adapter only. |
| `TRANSCRIPTION_SERVICE_URL` | Provenance-preserving media `/transcribe` base URL in [mediaTranscriptionProvider.ts](../src/lib/mediaTranscriptionProvider.ts); also a generic endpoint fallback. Requires an injected privacy decision in the media adapter. |
| `ANALYSIS_SERVICE_URL` | Optional external `/execute` base URL used by the mounted analysis route. Invalid/failed responses fall through to native registered analysis. |
| `JATS_VALIDATOR_SERVICE_URL` | Full URL, with no appended path, used by `validateJatsWithConfiguredService()` in [exportUtils.ts](../src/lib/exportUtils.ts); adapter only. |
| `NCBI_API_KEY`, `NCBI_EMAIL` | Optional DOI/PubMed lookup configuration passed by `/api/sources/doi`; not automatically passed into search-execution adapters. |
| `NODE_ENV` | Exact `production` selects built static serving; other values start Vite middleware. |
| `DISABLE_HMR` | Exact `true` disables HMR/file watching in [vite.config.ts](../vite.config.ts). |
| `FIRESTORE_EMULATOR_HOST` | Used by Firestore rules tests and emulator tooling; not automatic browser app emulator wiring. |
| `FIREBASE_STORAGE_EMULATOR_HOST` | Enables Storage emulator test coverage; set by emulator tooling. |
| `APP_URL` | Present in `.env.example` but no current application source reads it. It does not configure the listener or OAuth behavior here. |

Unpaywall's library accepts a contact-email option; there is no `UNPAYWALL_*` environment binding in the current application. The browser Firebase initialization does not call `connectAuthEmulator`, `connectFirestoreEmulator`, or `connectStorageEmulator`, so running the rules-test emulators does not redirect the app to them.

## 4. Firebase and protected operations

Use the public client identifiers for the intended Firebase Web app, configure its desired authentication providers/authorized hostnames, and supply server Application Default Credentials for the matching project. Client `Configured` means the values pass validation and SDK initialization; it is not a successful cloud connectivity test. Google sign-in uses `signInWithPopup()` in [AuthContext.tsx](../src/context/AuthContext.tsx).

Server actions additionally require a stored project with valid `ownerUid`/`members`. Signing into an account does not make the local demo project a persisted project or grant API access to arbitrary IDs. Validate access using a real development project owned by the test user.

[firebase.json](../firebase.json) declares Firestore port 8080 and Storage port 9199 and points to [firestore.rules](../firestore.rules) and [storage.rules](../storage.rules). Rules changes are not deployed by `npm run build`. Rule tests use the isolated `demo-tehqiq` project; deployment to a real project is a separate operator action and was not performed for TQ-VSC-097.

Inspect `projects/{id}/versions`, `auditEvents`, and `stateTransitions` when diagnosing saves/approvals. Server model records use `aiGatewayEvents` and `aiOutputArtifacts`; current rules do not provide browser read access to those collections. Do not treat the UI's legacy `aiLedger` as a complete projection of them. Do not manually flip approval flags or recalculate trusted digests to bypass a rejected transition.

Storage writes require one of the allowed MIME types, nonempty files up to 25 MB, and identity/checksum metadata. Audio/video/images/PPTX accepted by some parser classifiers are not automatically accepted by the current Storage MIME allow-list. Data Lab parsing does not call the durable `uploadProjectFile()` helper. Preserve original research files separately until a persistent upload path has actually returned success.

## 5. AI configuration and failure diagnosis

An operational AI request needs Firebase membership/auth, an eligible provider, model routing, privacy declaration, pricing, budget policy, and successful event persistence. A provider key alone does not satisfy those requirements.

Pricing JSON has `version`, parseable `effectiveAt`, and a nonempty `entries` array. Each entry has `provider`, `model`, `inputUsdPerMillionTokens`, and `outputUsdPerMillionTokens`. Supply real operator-verified values; this repository does not provide commercial prices. The provider IDs used by mounted routes are `gemini` and `local-general-llm`.

Budget policy requires nonnegative `softLimitUsd`/`hardLimitUsd` with soft ≤ hard, `maxProviderCallsPerRequest` from 1–4, `maxAgentLoopIterations` from 1–20, and optional nonnegative `minimumRemainingUsdByTier` values. The `.env.example` policy is an example, not an enforced deployment budget. A stored project policy takes precedence. Cost accounting is per project/actor and process-local; it resets on restart. Reported tokens can be absent, and the current settlement helper uses zero in that case, so billing reconciliation and durable distributed limits are not implemented.

| Symptom | What to inspect |
| --- | --- |
| Firebase Not Configured | `firebaseConfiguration.missingKeys`/`invalidKeys`, client env loading, restart/rebuild. Do not log credentials. |
| API 401 | Missing/expired Firebase ID token; client auth session. |
| API 403 or 404 | Stored project ID, membership and required role; generic agent frontend permission. |
| API 503 | Admin project/credentials, Firestore access, or authorization-service availability. |
| `Cannot Run Under Current Privacy Mode` / 409 | Project mode, permitted providers, healthy local endpoint, Local/Private classification. |
| AI 402 | Hard budget or tier threshold; inspect stored policy and usage rather than retrying blindly. |
| AI 500 with configuration error in server log | Missing/invalid pricing or policy may fail during gateway construction. The public message can be generic. |
| AI 502 | Empty or schema-invalid provider response; inspect `failureCode` and trace ID. |
| `LEDGER_WRITE_FAILED` | Server access to event collections; no success should be inferred from generated text alone. |
| Autosave Conflict | Another client saved a different version. Preserve unsaved work and reload/reconcile before saving; do not overwrite the version token. |
| Autosave Offline/Failed | Network/client Firebase configuration and permissions. Pending edits live in memory; reload can lose them. |
| Analysis not available | Resolve method ID/alias and availability in the registry; provide approved dataset/plan and explicit variables. Client fallback output is not trusted server approval. |

Server access logs use `[TehqIQ API Audit]` with actor UID, project, role, route, result, and timestamp. Gateway events retain trace IDs, model/provider attribution, schema/prompt versions, available token counts, estimated cost, and failure code. Pre-provider refusals are not guaranteed to create gateway events. Route exception logs may contain diagnostics; handle server logs as operational data.

## 6. Local and external service contracts

[localModelProviders.ts](../src/server/localModelProviders.ts) implements HTTP clients, not embedded browser models or launched services. A configured generic endpoint must return JSON `{ "status": "ok" }` or `{ "status": "healthy" }` from `GET /health` before routing. Default timeout is 15 seconds. Optional API keys are sent as bearer headers. The running server health-checks only the General LLM capability on gateway construction.

| Client | Request contract | Expected response / boundary |
| --- | --- | --- |
| Generic embedding adapter | `POST /embeddings`, JSON `model`, `input` text array | `vectors` array with one finite, nonempty numeric vector per input; optional `model`. No vector index/database is provisioned. |
| Generic Whisper adapter | `POST /transcribe`, JSON `model`, `contentBase64`, `mimeType` | `text`, `segments`, optional `model`/`language`. This is not the richer transcript contract below. |
| Generic vision adapter | `POST /analyze`, JSON `model`, `contentBase64`, `mimeType`, `instruction` | `blocks`, string-array `warnings`, optional `model`. |
| General LLM adapter | `POST /v1/chat/completions`, JSON `model`, system/user `messages`, optional `response_format` and `tools` | `choices[0].message.content`, optional `model` and usage counts. JSON output is validated again by the gateway. Full provider-side JSON-schema enforcement and forwarding of output-token limits are not implemented in this adapter. |
| Rich-document adapter | `POST /parse`, JSON `projectId`, `artifactId`, `filename`, `mimeType`, `format`, `contentBase64` | `parser.id/version`, `blocks`, `warnings`, `requiresReview`. Block types are text/table/image, with IDs and optional page/section/table/image locations. Default timeout 60 seconds, response limit 10 MB. |
| Provenance-preserving media adapter | `POST /transcribe`, JSON project/file metadata, `mediaType`, `privacyRoute`, `contentBase64` | `provider.id/version`, `transcriptVersion`, timestamped text `segments`, `warnings`, optional language/confidence. Default timeout 300 seconds, response limit 25 MB. Returns Needs Review, transcript hash, timestamps, and provider provenance. |
| Optional analysis service | `POST /execute`, JSON `dataset`, `plan`, `options` | Response must pass `validateExternalAnalysisResponse()` in [apiSchemas.ts](../src/server/apiSchemas.ts). Failure/invalid shape uses native registry fallback. No request timeout or bearer header is configured in this call site. |
| Optional JATS validator | `POST` to the configured full URL, raw `application/xml` | HTTP success is treated as `Schema Validated`; non-success/network failure is failure. No returned validation report is parsed and no timeout is configured. Not mounted in Export Centre. |

The rich parser and provenance-preserving transcription clients use their own configuration and do not use the generic registry's health/bearer handling. Media transcription additionally requires an injected privacy router authorizing Self Hosted or Approved External before sending bytes. Setting `TRANSCRIPTION_SERVICE_URL` alone cannot supply that decision. Rich-document parsing has no corresponding gateway privacy hook in its current adapter. Keep these integrations server-side when wiring them.

[documentIngestionRouter.ts](../src/lib/documentIngestionRouter.ts) handles numeric/text formats directly and accepts injected rich/media/image adapters. Without an adapter, rich/media jobs remain queued with Not Configured warnings; missing configured services can return Requires Review with no extracted content. No route currently composes these adapters for production UI uploads. Endpoint availability and fixture tests do not establish that user uploads will reach them.

[embeddingProvider.ts](../src/lib/embeddingProvider.ts) records provider/model/config, document/chunk hashes, timestamps, and index versions. [evidenceRetrievalService.ts](../src/lib/evidenceRetrievalService.ts) still ranks lexical overlap from supplied chunks; configuring an embedding endpoint does not turn it into semantic/vector retrieval.

## 7. Tests and release gates

Required local verification:

```sh
npm run lint
npm test
npm run build
git diff --check
```

Tests run through [vitest.config.ts](../vitest.config.ts) with jsdom and [setup.ts](../src/tests/setup.ts). Relevant suites can be run with `npx vitest run` followed by their paths:

| Concern | Evidence entry points |
| --- | --- |
| Mounted UI, accessibility, six-stage mapping | [appViewRouting.test.ts](../src/tests/appViewRouting.test.ts), [accessibility.test.tsx](../src/tests/accessibility.test.tsx), [noviceResearcherUx.test.tsx](../src/tests/noviceResearcherUx.test.tsx), [researchStages.test.ts](../src/tests/researchStages.test.ts) |
| Workflow and section contracts | [workflowOrchestrator.test.ts](../src/tests/workflowOrchestrator.test.ts), [agentRegistryAdversarial.test.ts](../src/tests/agentRegistryAdversarial.test.ts), [manuscriptSectionContracts.test.ts](../src/tests/manuscriptSectionContracts.test.ts) |
| AI routing/privacy/cost | [aiGateway.test.ts](../src/tests/aiGateway.test.ts), [modelRouter.test.ts](../src/tests/modelRouter.test.ts), [privacyTaskRouter.test.ts](../src/tests/privacyTaskRouter.test.ts), [aiBudgetGuard.test.ts](../src/tests/aiBudgetGuard.test.ts) |
| Auth, stored state, rules | [authRbacSecuritySuite.test.ts](../src/tests/authRbacSecuritySuite.test.ts), [trustedTransitions.test.ts](../src/tests/trustedTransitions.test.ts), [projectConcurrency.integration.test.ts](../src/tests/projectConcurrency.integration.test.ts), [storagePersistence.test.ts](../src/tests/storagePersistence.test.ts) |
| Analysis correctness and integrity | [goldenDatasetValidation.test.ts](../src/tests/goldenDatasetValidation.test.ts), [commonComparisonMethods.test.ts](../src/tests/commonComparisonMethods.test.ts), [statisticalSensitivity.test.ts](../src/tests/statisticalSensitivity.test.ts), [scientificIntegrityRegression.test.ts](../src/tests/scientificIntegrityRegression.test.ts) |
| Evidence, outlets, parsing | [claimEvidenceGraph.test.ts](../src/tests/claimEvidenceGraph.test.ts), [ragBenchmark.test.ts](../src/tests/ragBenchmark.test.ts), [outletIntelligenceService.test.ts](../src/tests/outletIntelligenceService.test.ts), [richDocumentParser.test.ts](../src/tests/richDocumentParser.test.ts), [mediaTranscriptionProvider.test.ts](../src/tests/mediaTranscriptionProvider.test.ts) |
| Exports and failure behavior | [exportSecurityValidation.test.ts](../src/tests/exportSecurityValidation.test.ts), [latexExport.test.ts](../src/tests/latexExport.test.ts), [submissionPackage.test.ts](../src/tests/submissionPackage.test.ts), [performanceFailureSafety.test.ts](../src/tests/performanceFailureSafety.test.ts) |
| Governed workflow fixtures | [genericEmpiricalWorkflow.e2e.test.ts](../src/tests/genericEmpiricalWorkflow.e2e.test.ts), [qualitativeWorkflow.e2e.test.ts](../src/tests/qualitativeWorkflow.e2e.test.ts), [literatureReviewWorkflow.e2e.test.ts](../src/tests/literatureReviewWorkflow.e2e.test.ts) |

The E2E-named tests compose domain functions and fixtures, with mocked provider boundaries. They do not launch a browser or authenticate a real Firebase user. The RAG benchmark is a deterministic lexical fixture benchmark, not a production corpus evaluation. Export tests validate structures; no bundled LaTeX compiler or live external JATS validation is implied.

Rules emulator commands are separately available:

```sh
npm run test:firestore-rules
npm run test:storage-rules
```

These commands need a working Java runtime and Firebase emulator binaries; the CLI may need to download binaries on first use. They use the demo project and configured emulator ports. The normal `npm test` skips emulator suites when the host variables are absent; a skipped suite is not a passed rule test. No production Firebase rules are deployed by these commands.

Release evaluation must include type/build/full-suite results, scientific and citation integrity, registered statistics, methodology and provenance, outlet facts, auth/rules/storage, privacy/ledger/cost, exports, retrieval, workflow fixtures, and real-browser UX. Use [FINAL_RELEASE_GATE.md](FINAL_RELEASE_GATE.md) as the dated TQ-VSC-095 evidence record and [TEHQIQ_IMPLEMENTATION_TRACKER.md](TEHQIQ_IMPLEMENTATION_TRACKER.md) for later checks. Do not infer release approval from a task marked PASS or remove the prototype warning automatically.

TQ-VSC-096 recorded two pre-existing full-suite failures: `integration.test.ts` (`window.localStorage.setItem` unavailable in this test environment) and `phase3.test.ts` (Crossref error-text expectation). Build warnings included browser `crypto` externalization and a large main chunk. The TQ-VSC-097 tracker entry records whether these recur in the current run. Browser/provider acceptance and Firebase emulator evidence must be recorded separately from unit tests. No code change or deployment in this documentation task resolves those release gaps.

## 8. Documentation consistency check

Run this read-only check from the repository root after updating either guide. It checks local link targets and coverage of literal API routes and environment names, not the semantic accuracy of the prose or service availability. Review the corresponding source call sites as well.

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
const documents = ['docs/TEHQIQ_ARCHITECTURE.md', 'docs/TEHQIQ_OPERATIONS.md'];
const failures = [];
let links = 0;
for (const document of documents) {
  const content = fs.readFileSync(document, 'utf8');
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:\/\//i.test(target)) continue;
    links++;
    if (!fs.existsSync(path.resolve(path.dirname(document), target))) failures.push(`${document}: broken link ${target}`);
  }
}
const architecture = fs.readFileSync(documents[0], 'utf8');
const operations = fs.readFileSync(documents[1], 'utf8');
const routes = [...fs.readFileSync('server.ts', 'utf8').matchAll(/app\.(get|post)\("(\/api[^\"]*)"/g)].map((match) => `${match[1].toUpperCase()} ${match[2]}`);
for (const route of routes) if (!architecture.includes(route)) failures.push(`Undocumented route: ${route}`);
const files = fs.readdirSync('src', {recursive: true}).filter((file) => /\.(ts|tsx)$/.test(file) && !file.startsWith('tests/')).map((file) => path.join('src', file));
const source = [...files, 'server.ts', 'vite.config.ts'].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const environment = new Set([
  ...[...source.matchAll(/(?:process\.env|env|environment)\.([A-Z][A-Z0-9_]+)/g)].map((match) => match[1]),
  ...[...fs.readFileSync('.env.example', 'utf8').matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((match) => match[1]),
]);
for (const variable of environment) if (!operations.includes('`' + variable + '`')) failures.push(`Undocumented environment variable: ${variable}`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${links} local documentation links resolve; all ${routes.length} API routes and ${environment.size} source/template environment variables documented.`);
NODE
```
