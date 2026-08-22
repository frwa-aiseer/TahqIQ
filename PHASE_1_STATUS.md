# TehqIQ Phase 1 — Identity, Persistence & Governance Status

This document summarizes the completion of **Phase 1 (Identity, Persistence & Server-Enforced Governance)** of TehqIQ. Phase 0 safeguards remain fully intact.

---

## Key Achievements & Architectural Changes

1. **Google & Email Authentication (`src/context/AuthContext.tsx`, `src/components/AuthModal.tsx`)**:
   - Google Sign-In via `signInWithPopup(GoogleAuthProvider)`.
   - Email & Password Registration and Sign-In with automated email verification dispatch (`sendEmailVerification`).
   - Email verification state badge and warning banner for pending institutional accounts.

2. **Server-Enforced Role Hierarchy & Role Selector Removal (`src/lib/permissions.ts`, `src/components/Header.tsx`)**:
   - Replaced the client-side role dropdown selector with a **read-only server-enforced role display**.
   - Server-enforced roles: `Owner`, `Corresponding Author`, `Co-author`, `Supervisor`, `Statistician`, `Reviewer`, and `Viewer`.
   - Client state mutations cannot elevate a user's role (permissions evaluated strictly against `/projects/{projectId}` membership data).

3. **Cloud Firestore Persistence & Storage (`src/lib/projectService.ts`, `src/lib/storageService.ts`)**:
   - Real cloud project lifecycle: **List**, **Create**, **Open**, **Rename**, **Archive/Unarchive**, and **Delete/Trash** workflows.
   - Organization and user project isolation based on `ownerUid` and `members` collection mapping.
   - Upload service for dataset CSVs, protocol files, and manuscript attachments (`Cloud Storage` with metadata stored in Firestore).

4. **Visible Autosave Engine (`src/hooks/useAutosave.ts`)**:
   - Real-time debounced autosave hook with 5 explicit UI states:
     - 🔵 **Saving**: Active network sync to Firestore.
     - 🟢 **Saved**: Persisted state with exact timestamp.
     - 🟡 **Offline**: Cached local edits when disconnected.
     - 🟠 **Conflict**: Remote concurrent edit warning.
     - 🔴 **Failed**: Error recovery and manual retry trigger.

5. **Immutable Versioning & Audit Logs (`src/lib/projectService.ts`, `firestore.rules`)**:
   - Immutable `/projects/{projectId}/versions` snapshot records created on milestone updates.
   - Immutable `/projects/{projectId}/auditEvents` logging project creation, role assignments, archive/delete actions, and dataset uploads.

6. **Isolated Explicit Demo Workspace**:
   - The synthetic demo project remains available via "Demo Project" mode.
   - Demo records (`isDemo: true` / `isSynthetic: true`) are strictly guarded (`canAddRecordToProject`) and cannot bleed into real user projects or storage.

---

## Files Modified & Created

### Created Files
- `/firestore.rules` — Firestore security rules enforcing user & project isolation, role limits, and immutable subcollections.
- `/firebase-blueprint.json` — Firebase entity schema and collection definitions.
- `/src/lib/firebase.ts` — Firebase App, Auth, Firestore, and Storage initialization.
- `/src/lib/permissions.ts` — Granular role permissions matrix and normalizers.
- `/src/lib/projectService.ts` — Firestore CRUD, versioning, audit logging, and member role management.
- `/src/lib/storageService.ts` — Cloud Storage upload handler and file metadata writer.
- `/src/context/AuthContext.tsx` — React authentication provider for Google & Email sign-in.
- `/src/hooks/useAutosave.ts` — Visible state autosave engine hook.
- `/src/components/AuthModal.tsx` — Modal for Google sign-in, email login, registration, and email verification.
- `/src/components/ProjectManagerModal.tsx` — Project manager workspace for project CRUD and team member role assignment.
- `/src/tests/phase1.test.ts` — Automated acceptance test suite for Phase 1.
- `/PHASE_1_STATUS.md` — Phase 1 status report.

### Modified Files
- `/src/types.ts` — Extended `ProjectState` with `isArchived`, `isDeleted`, `ownerUid`, `organizationId`, `members`, `memberList`, `version`, and added `ProjectRole`, `ProjectMember`, `ProjectVersionSnapshot`, `ProjectAuditEvent` interfaces.
- `/src/components/Header.tsx` — Replaced fake client role selector with read-only server role display, added autosave state badge, email verification banner, and Auth / Project Manager modal triggers.
- `/src/App.tsx` — Wrapped application with `AuthProvider`, connected `useAutosave`, and wired Auth & Project Manager modals.
- `/package.json` — Added `firebase` dependency and updated `test` script to run Phase 0 and Phase 1 test suites.

---

## Acceptance Test Suite Results

Both test suites execute via `npm test`:

1. **Phase 0 Verification Tests (`src/tests/phase0.test.ts`)**:
   - Real projects contain zero synthetic records.
   - Demo project is isolated and synthetic records carry `isDemo: true` flags.
   - Record guard (`canAddRecordToProject`) blocks demo data from entering real projects.
   - Unsafe statistical/citation actions return disabled prototype notices.

2. **Phase 1 Acceptance Tests (`src/tests/phase1.test.ts`)**:
   - **Role Matrix**: Owner, Co-author, Reviewer permissions verified.
   - **Role Elevation Guard**: Client state mutation cannot elevate role permissions.
   - **Membership Isolation**: Users without membership cannot read private projects.
   - **Demo Record Isolation**: Synthetic records blocked from real projects.
   - **Archive/Delete Workflow**: Project soft-delete and archive flags verified.

---

## Manual Firebase Console Setup Requirements

For full cloud deployment on external Firebase projects, complete the following in the [Firebase Console](https://console.firebase.google.com/):

1. **Authentication**:
   - Go to **Authentication > Sign-in method**.
   - Enable **Google** sign-in provider.
   - Enable **Email/Password** sign-in provider.

2. **Cloud Firestore**:
   - Go to **Firestore Database**.
   - Deploy the rules from `firestore.rules`.

3. **Cloud Storage**:
   - Go to **Storage**.
   - Enable Cloud Storage bucket for project file uploads.
