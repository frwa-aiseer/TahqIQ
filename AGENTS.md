# TehqIQ Permanent Engineering Directives

These permanent rules govern all ongoing engineering and AI-assisted development across the TehqIQ codebase:

1. **Source Inspection First**: Always inspect the actual current codebase before modifying or assuming any file or feature implementation.
2. **Codebase Over Status Files**: Do NOT trust stale markdown audit files or phase logs; always verify against current live source code.
3. **Preserve Working Functionality**: Safeguard existing operational components, workflows, tests, and utilities unless explicitly asked to modify or refactor them.
4. **Preserve TehqIQ Branding & Visual Design**: Maintain the established academic-grade UI palette, typography hierarchy, status badges, and styling standards.
5. **Zero Fabrication Policy**:
   - Never generate or introduce fabricated research results, statistics, sample sizes, references, DOIs, journal metrics, journal indexing claims, ethics approval IDs, methodology facts, participant details, empirical evidence, citations, or author approvals.
6. **Synthetic vs. Real Data Isolation**: Demo, sandbox, or synthetic research data must remain strictly isolated and distinctly marked from real project records.
7. **Explicit Missing State Representation**: Never convert missing information into invented information. Use explicit labels:
   - `Missing`
   - `Unverified`
   - `Researcher input required`
   - `Not available`
   - `Not independently reproduced`
8. **Human-in-the-Loop AI Governance**: AI-generated content must always begin as a proposal or draft and must never self-certify, auto-approve, or bypass human researcher review.
9. **Empirical Results Integrity**: Empirical Results must strictly originate from verified analysis outputs or authenticated researcher uploads.
10. **Structured AI Responses**: All critical AI responses consumed by the application must use deterministic structured outputs and validation schemas.
11. **Server-Side Security**: Sensitive API keys, credentials, and privileged operations must remain server-side.
12. **Backward Compatibility**: New features and schemas must remain backward-compatible with existing stored research projects where practical.
13. **Testing & Quality Assurance**: Ensure code passes type checks and linter suites.
14. **Verification & Audit**: Run compilation and linting checks after each task to maintain a clean codebase.
