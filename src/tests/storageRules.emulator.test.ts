// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
const describeWithStorageEmulator = emulatorHost ? describe : describe.skip;

const ownerUid = "storage-owner";
const memberUid = "storage-member";
const viewerUid = "storage-viewer";
const outsiderUid = "storage-outsider";
const otherOwnerUid = "other-owner";
const validHash = "a".repeat(64);
const storageBucket = "gs://demo-tehqiq.appspot.com";

function metadata(projectId: string, uploaderUid: string, extra: Record<string, string> = {}) {
  return {
    contentType: "text/csv",
    customMetadata: {
      projectId,
      uploaderUid,
      sha256: validHash,
      provenance: "Researcher Upload",
      ...extra,
    },
  };
}

async function expectStorageDenied(operation: Promise<unknown>) {
  await expect(operation).rejects.toMatchObject({
    code: expect.stringMatching(/^storage\/(unauthenticated|unauthorized|unknown)$/),
  });
}

describeWithStorageEmulator("Cloud Storage project isolation rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const [host, portText] = emulatorHost!.split(":");
    testEnv = await initializeTestEnvironment({
      projectId: "demo-tehqiq",
      firestore: { host, port: 8080 },
      storage: {
        host,
        port: Number(portText),
        rules: readFileSync(resolve(process.cwd(), "storage.rules"), "utf8"),
      },
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "projects", "project-a"), {
        ownerUid,
        members: {
          [ownerUid]: "Owner",
          [memberUid]: "Co-author",
          [viewerUid]: "Viewer",
        },
      });
      await setDoc(doc(context.firestore(), "projects", "project-b"), {
        ownerUid: otherOwnerUid,
        members: { [otherOwnerUid]: "Owner" },
      });
    });
  });

  afterAll(async () => testEnv?.cleanup());

  it("allows an authorized project writer to create and read a valid project file", async () => {
    const storage = testEnv.authenticatedContext(memberUid).storage(storageBucket);
    const fileRef = ref(storage, "projects/project-a/files/authorized.csv");

    await assertSucceeds(uploadBytes(fileRef, new Uint8Array([1, 2, 3]), metadata("project-a", memberUid)));
    await assertSucceeds(getBytes(fileRef));
  });

  it("denies unauthenticated reads and writes", async () => {
    const storage = testEnv.unauthenticatedContext().storage(storageBucket);
    await expectStorageDenied(getBytes(ref(storage, "projects/project-a/files/authorized.csv")));
    await expectStorageDenied(
      uploadBytes(
        ref(storage, "projects/project-a/files/anonymous.csv"),
        new Uint8Array([1]),
        metadata("project-a", "anonymous")
      )
    );
  });

  it("denies Viewer uploads", async () => {
    const storage = testEnv.authenticatedContext(viewerUid).storage(storageBucket);
    await expectStorageDenied(
      uploadBytes(
        ref(storage, "projects/project-a/files/viewer.csv"),
        new Uint8Array([1]),
        metadata("project-a", viewerUid)
      )
    );
  });

  it("denies cross-project reads and overwrites", async () => {
    const outsiderStorage = testEnv.authenticatedContext(otherOwnerUid).storage(storageBucket);
    await expectStorageDenied(getBytes(ref(outsiderStorage, "projects/project-a/files/authorized.csv")));
    await expectStorageDenied(
      uploadBytes(
        ref(outsiderStorage, "projects/project-a/files/authorized.csv"),
        new Uint8Array([9]),
        metadata("project-a", otherOwnerUid)
      )
    );

    const projectAStorage = testEnv.authenticatedContext(ownerUid).storage(storageBucket);
    await expectStorageDenied(
      uploadBytes(
        ref(projectAStorage, "projects/project-b/files/intrusion.csv"),
        new Uint8Array([9]),
        metadata("project-b", ownerUid)
      )
    );
  });

  it("rejects mismatched project/uploader metadata and unsupported content types", async () => {
    const storage = testEnv.authenticatedContext(memberUid).storage(storageBucket);
    await expectStorageDenied(
      uploadBytes(
        ref(storage, "projects/project-a/files/wrong-project.csv"),
        new Uint8Array([1]),
        metadata("project-b", memberUid)
      )
    );
    await expectStorageDenied(
      uploadBytes(
        ref(storage, "projects/project-a/files/wrong-uploader.csv"),
        new Uint8Array([1]),
        metadata("project-a", outsiderUid)
      )
    );
    await expectStorageDenied(
      uploadBytes(
        ref(storage, "projects/project-a/files/executable.bin"),
        new Uint8Array([1]),
        { ...metadata("project-a", memberUid), contentType: "application/x-executable" }
      )
    );
  });

  it("enforces the centralized 25 MiB size limit", async () => {
    const storage = testEnv.authenticatedContext(ownerUid).storage(storageBucket);
    await expectStorageDenied(
      uploadBytes(
        ref(storage, "projects/project-a/files/too-large.csv"),
        new Uint8Array(25 * 1024 * 1024 + 1),
        metadata("project-a", ownerUid)
      )
    );
  });

  it("prevents overwrite, unlock, and deletion of locked artifacts", async () => {
    const ownerStorage = testEnv.authenticatedContext(ownerUid).storage(storageBucket);
    const lockedRef = ref(ownerStorage, "projects/project-a/files/locked.csv");
    await assertSucceeds(
      uploadBytes(lockedRef, new Uint8Array([1]), metadata("project-a", ownerUid, { locked: "true" }))
    );
    await expectStorageDenied(uploadBytes(lockedRef, new Uint8Array([2]), metadata("project-a", ownerUid)));
    await expectStorageDenied(deleteObject(lockedRef));
  });

  it("denies access outside the project-scoped file namespace", async () => {
    const ownerStorage = testEnv.authenticatedContext(ownerUid).storage(storageBucket);
    await expectStorageDenied(
      uploadBytes(
        ref(ownerStorage, "public/unscoped.csv"),
        new Uint8Array([1]),
        metadata("project-a", ownerUid)
      )
    );
  });
});
