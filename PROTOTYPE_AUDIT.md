# TehqIQ Phase 0 — Prototype Audit Log

This document audits all simulated or synthetic research actions disabled or replaced during **Phase 0 (Truthful & Safe Prototype Baseline)**. To preserve scientific integrity, no simulated research actions that cannot yet be performed truthfully are permitted in production paths.

---

| # | Disabled Simulation | Source File(s) | Replacing Future Phase |
|---|---------------------|----------------|------------------------|
| 1 | **Fixed Statistical Execution**<br>Hardcoded means (82.61, 74.21), SDs, t-statistics, p-values (p=0.000003), Cohen's d (1.41), period and carryover effect calculations. | `src/lib/statsEngine.ts`<br>`src/components/views/DataLabView.tsx` | **Phase 1: Statistical Engine & Data Execution**<br>Real reproducible statistical computation engine (R/Python scipy/statsmodels integration). |
| 2 | **Synthetic Reference Creation & Fake DOI Generation**<br>Inventing Crossref DOIs (`10.1016/j.jbiomech...`), fake journals, and synthetic sources from author surname & year. | `src/lib/citationVerifier.ts`<br>`src/components/views/SourceLibraryView.tsx` | **Phase 2: Live Literature & Bibliographic Integration**<br>Real Crossref / OpenAlex / PubMed API lookup and DOI resolution. |
| 3 | **Automatic Claim Linking & Auto-Verification**<br>Automatically linking new manuscript claims to the first source, marking new claims "Verified" and "Researcher Approved". | `src/components/views/ClaimMatrixView.tsx` | **Phase 2: Claim–Evidence Matrix & Extraction**<br>Manual researcher evidence mapping with passage-level extraction verification. |
| 4 | **Fabricated Document Findings**<br>Displaying hardcoded semitendinosus EMG findings and crossover study designs for arbitrary or unread documents. | `src/components/views/DocumentReaderModal.tsx` | **Phase 2: Full-Text Reader & Extraction**<br>True PDF parsing, OCR, and AI-assisted passage extraction. |
| 5 | **Ungrounded Results Section Generation & Fallback Citations**<br>Generating approved Results prose with fabricated 8.40% MVIC stats when no dataset exists, and falling back to Boyer/Mendiguchia citations when source library is empty. | `src/lib/q1ManuscriptEngine.ts`<br>`src/components/views/WritingStudioView.tsx` | **Phase 3: Manuscript Composition & Evidence Grounding**<br>Data-driven section generation conditioned on verified dataset outputs and active source library. |
| 6 | **Simulated Multi-Agent Peer Review**<br>6 simulated reviewer agents producing fixed comments ("Confirm inter-rater reliability coefficients..."). | `src/components/views/PeerReviewView.tsx`<br>`src/App.tsx` | **Phase 3: Multi-Agent Evaluation & Review**<br>LLM-powered specialized reviewer agents analyzing real manuscript text and empirical data. |
| 7 | **Static Pre-Export Assurances**<br>Hardcoded green checkmarks claiming "0 Fabricated Citations", "100% Results Linked", "Ethics Approved", and "Author Sign-off Confirmed". | `src/components/views/ExportCentreView.tsx` | **Phase 4: Pre-Submission Quality Gate**<br>Dynamic audit checking project state, ethics registration, CRediT signoffs, and citation matches. |
| 8 | **Mock Server Execution Endpoint**<br>Server route `/api/analysis/execute` returning fake success without executing statistical code. | `server.ts` | **Phase 1 & Phase 4: Containerized Execution**<br>Secure containerized code runner for reproducible analysis execution. |

---

## Safety & Truthfulness Guardrails Implemented in Phase 0

1. **Explicit Project Separation**:
   - `createEmptyProject()` creates new real research projects with zero synthetic records (no authors, ethics approval, sources, datasets, statistics, manuscript results, figures, reviews, or outlet selection).
   - `createDemoProject()` is used strictly when the explicit demonstration project is selected.
   - Demo records carry `isDemo: true` / `isSynthetic: true` flags and guards prevent them from bleeding into real projects.

2. **Global Prototype Banner**:
   - Visible warning banner rendered across all views: `"Prototype environment — not approved for real research use."`

3. **Standard Disabled State Message**:
   - Replaced unsafe actions with standard notice: `"Unavailable in the prototype: this function requires verified data, evidence or a configured backend."`

4. **Unknown Value Handling**:
   - Unverified or missing fields display as `"Not available"`, `"Not verified"`, or `"Researcher input required"`.
