import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as fs from "node:fs";
import * as path from "node:path";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const emulatorDescribe = emulatorAvailable ? describe : describe.skip;

emulatorDescribe("Firestore RBAC rules against the emulator", () => {
  let environment: RulesTestEnvironment;

  const project = (ownerUid: string, members: Record<string, string>) => ({
    ownerUid,
    members,
    memberList: Object.entries(members).map(([uid, role]) => ({ uid, role })),
    organizationId: "test-organization",
    title: "Rules test project",
    isDemoProject: false,
  });

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: "demo-tehqiq",
      firestore: { rules: fs.readFileSync(path.resolve(process.cwd(), "firestore.rules"), "utf8") },
    });
  });

  beforeEach(async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();
      await setDoc(doc(firestore, "users/user-a"), { email: "a@test.invalid", privateNote: "private-a" });
      await setDoc(doc(firestore, "users/user-b"), { email: "b@test.invalid", privateNote: "private-b" });
      await setDoc(doc(firestore, "projects/project-a"), project("owner-a", {
        "owner-a": "Owner", "coauthor-a": "Co-author", "viewer-a": "Viewer",
      }));
      await setDoc(doc(firestore, "projects/project-b"), project("owner-b", { "owner-b": "Owner" }));
      await setDoc(doc(firestore, "projects/project-a/versions/version-1"), {
        createdByUid: "owner-a", version: 1, titleSnapshot: "Immutable snapshot",
      });
    });
  });

  afterAll(async () => {
    await environment.cleanup();
  });

  it("prevents user A from reading user B's private profile", async () => {
    const firestore = environment.authenticatedContext("user-a").firestore();
    await assertSucceeds(getDoc(doc(firestore, "users/user-a")));
    await assertFails(getDoc(doc(firestore, "users/user-b")));
  });

  it("prevents a non-member from reading a project", async () => {
    const firestore = environment.authenticatedContext("outsider").firestore();
    await assertFails(getDoc(doc(firestore, "projects/project-a")));
  });

  it("allows an authorized member to read only their project", async () => {
    const firestore = environment.authenticatedContext("coauthor-a").firestore();
    await assertSucceeds(getDoc(doc(firestore, "projects/project-a")));
    await assertFails(getDoc(doc(firestore, "projects/project-b")));
  });

  it("prevents a Viewer from editing project content", async () => {
    const firestore = environment.authenticatedContext("viewer-a").firestore();
    await assertFails(updateDoc(doc(firestore, "projects/project-a"), { title: "Viewer edit" }));
  });

  it("prevents a Co-author from self-promoting or changing membership", async () => {
    const firestore = environment.authenticatedContext("coauthor-a").firestore();
    await assertFails(updateDoc(doc(firestore, "projects/project-a"), { "members.coauthor-a": "Owner" }));
    await assertFails(updateDoc(doc(firestore, "projects/project-a"), { ownerUid: "coauthor-a" }));
  });

  it("allows the Owner to make a valid member-role change without transferring ownership", async () => {
    const firestore = environment.authenticatedContext("owner-a").firestore();
    await assertSucceeds(updateDoc(doc(firestore, "projects/project-a"), {
      "members.viewer-a": "Reviewer",
      memberList: [
        { uid: "owner-a", role: "Owner" },
        { uid: "coauthor-a", role: "Co-author" },
        { uid: "viewer-a", role: "Reviewer" },
      ],
    }));
  });

  it("keeps finalized version snapshots immutable", async () => {
    const firestore = environment.authenticatedContext("owner-a").firestore();
    const snapshot = doc(firestore, "projects/project-a/versions/version-1");
    await assertFails(updateDoc(snapshot, { titleSnapshot: "Rewritten" }));
    await assertFails(deleteDoc(snapshot));
  });

  it("prevents even an Owner client from forging privileged audit history", async () => {
    const firestore = environment.authenticatedContext("owner-a").firestore();
    await assertFails(setDoc(doc(firestore, "projects/project-a/auditEvents/forged-event"), {
      actor: { uid: "owner-a", email: "forged@test.invalid" },
      action: "ANALYSIS_APPROVED",
      entityType: "AnalysisOutput",
      entityId: "analysis-1",
      projectId: "project-a",
      timestamp: new Date().toISOString(),
      before: null,
      after: { state: "Approved for Manuscript" },
      rationale: "Forged directly by an authenticated client.",
      evidenceIds: [],
      trustedServerCreated: true,
    }));
  });
});
