# Phase 3 Implementation & Verification Status

## Executive Summary
Phase 3 (External Bibliographic Provenance, Reference Parsers & Truth-Based Citation Verification Engine) is fully implemented, verified, and passing all acceptance tests without errors or regressions.

---

## 1. Core Architectural Modules Implemented

### A. Server-Side Crossref & Bibliographic Provider Pipeline
- **Real Crossref REST API Integration**: Implemented `/api/crossref/works/:doi` and `/api/crossref/search` in `server.ts`.
- **Strict DOI Normalization**: Handles `https://doi.org/`, `doi:`, `10.xxxx/yyyy`, and trailing punctuation striping in `src/lib/metadataProviders.ts`.
- **Configured Public Providers**:
  - `Crossref`: Active (Public REST API, no key required).
  - `OpenAlex`: Active (Public REST API, no key required).
  - `DataCite`: Active (Public REST API, no key required).
  - `Europe PMC`: Active (Public REST API, no key required).
  - `PubMed (NCBI direct)`: Marked as `unconfigured` / unavailable due to missing user API key requirements.
- **Field-Level Provenance Tracking**: Tracks `provider`, `retrievedAt`, and field-by-field provenance timestamps for every imported metadata property (`FieldProvenance` and `ProvenanceMetadata`).
- **Mandatory Bibliographic Disclaimer**: Enforces `CrossrefDisclaimer.MESSAGE` across backend responses, UI badges, and Document Reader overlays.

### B. Reference Parser Engine
- **`src/lib/referenceParsers.ts`**:
  - **BibTeX Parser**: Standard `@article`, `@book`, `@inproceedings` parsing with full field-level provenance assignment.
  - **RIS Parser**: Tag-value parser (`TY`, `AU`, `TI`, `JO`, `PY`, `DO`) with provenance assignment.
  - **CSL JSON Parser**: Native JSON array and CSL-data parsing.

### C. Citation Verification Engine & Deterministic Missing Handling
- **Strict Citation Matching (`src/lib/citationVerifier.ts`)**:
  - Direct stable ID matching (`[src-xxx]`).
  - Strict Author surname + Publication Year matching (`(Boyer et al., 2021)`).
  - **Banned**: Loosened title-word guessing and fuzzy surname matching completely purged.
- **Prohibited Synthetic Creation**: `createMissingSourceRecord` explicitly throws an error. Missing citations require candidate search or candidate record resolution via `Candidate Search` UI.

### D. Claim-Evidence Matrix & Document Reader Truth
- **Unlinked Initial State**: New claims strictly initialize as `Draft` / `Unlinked`, `Unverified`, and `isResearcherApproved = false`.
- **Linked Evidence Granularity**: Evidence linking requires explicit `pageNumber`, `sectionName`, and/or `passageQuote`.
- **Document Reader Strict Content Display**: Displays imported full text (`source.fullTextContent`), abstract (`source.abstract`), or verified passage extracts (`source.extractedPassages`). No placeholder fallback or invented text generation.

---

## 2. Acceptance Test Verification Matrix

| Acceptance Test Criterion | Status | Implementation Details |
|---|---|---|
| **1. Invalid DOI Remains Unresolved** | **PASS** | `normalizeDoi` returns empty string for malformed DOIs; `fetchCrossrefMetadata` returns `success: false` with clear error. |
| **2. No Random DOI Generation** | **PASS** | Synthetic DOI generation functions purged; `createMissingSourceRecord` throws an error. |
| **3. Claim Verification Guard** | **PASS** | `performStateTransition` blocks transition of unlinked or unapproved claims to `Verified` state. |
| **4. Strict Verification Matching** | **PASS** | `verifyManuscriptCitations` ignores title words when author/year mismatch occurs (e.g. Jones 2019 vs Boyer 2021). |
| **5. Stable ID Synchronization** | **PASS** | Stable ID tags (`[src-123]`) directly resolve to the exact source record in the reference library. |
| **6. Field Provenance & Disclaimers** | **PASS** | All reference imports attach `FieldProvenance` records and display the official Crossref Bibliographic Disclaimer. |

---

## 3. Build & Linter Verification
- `npm run lint` (`tsc --noEmit`): **Passed cleanly with 0 errors.**
- `npm run build` (`compile_applet`): **Build succeeded without warnings.**
