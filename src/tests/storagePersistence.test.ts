import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));
const firestoreMocks = vi.hoisted(() => ({ doc: vi.fn(), setDoc: vi.fn() }));

vi.mock("firebase/storage", () => storageMocks);
vi.mock("firebase/firestore", () => firestoreMocks);
vi.mock("../lib/firebase", () => ({
  firebaseStatus: "Configured",
  getFirebaseServices: () => ({ storage: {}, db: {} }),
}));

import {
  calculateFileSha256,
  ProjectFileUploadError,
  uploadProjectFile,
} from "../lib/storageService";

function selectedFile(contents = "research-data", name = "observations.csv", type = "text/csv"): File {
  return new File([contents], name, { type });
}

describe("research file persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.ref.mockReturnValue({ fullPath: "requested-path" });
    storageMocks.uploadBytes.mockResolvedValue({
      ref: { fullPath: "projects/project-1/files/persisted_observations.csv" },
    });
    storageMocks.getDownloadURL.mockResolvedValue("https://storage.example/persisted");
    storageMocks.deleteObject.mockResolvedValue(undefined);
    firestoreMocks.doc.mockReturnValue({ id: "metadata-document" });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
  });

  it("calculates a deterministic lowercase SHA-256 digest from the actual file bytes", async () => {
    await expect(calculateFileSha256(selectedFile("abc"))).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("returns and records complete persistent metadata only after cloud persistence succeeds", async () => {
    const file = selectedFile();
    const result = await uploadProjectFile("project-1", file, "researcher-1");

    expect(result).toMatchObject({
      artifactType: "Uploaded Document",
      title: "observations.csv",
      createdBy: "researcher-1",
      sourceArtifactIds: [],
      verificationState: "Unverified",
      approvalState: "Not Approved",
      version: 1,
      isDemo: false,
      isSynthetic: false,
      locked: false,
      filename: "observations.csv",
      projectId: "project-1",
      storagePath: "projects/project-1/files/persisted_observations.csv",
      downloadUrl: "https://storage.example/persisted",
      sizeBytes: file.size,
      mimeType: "text/csv",
      uploadedByUid: "researcher-1",
      persistenceStatus: "Persisted",
      provenance: {
        origin: "Researcher Upload",
        actorUid: "researcher-1",
        source: "Researcher Upload",
        storageProvider: "Firebase Cloud Storage",
        originalFilename: "observations.csv",
        checksumAlgorithm: "SHA-256",
      },
    });
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.contentHash).toBe(result.sha256);
    expect(result.uploadedAt).toEqual(expect.any(String));
    expect(storageMocks.uploadBytes).toHaveBeenCalledWith(
      { fullPath: "requested-path" },
      file,
      expect.objectContaining({
        contentType: "text/csv",
        customMetadata: expect.objectContaining({
          projectId: "project-1",
          uploaderUid: "researcher-1",
          sha256: result.sha256,
          provenance: "Researcher Upload",
        }),
      })
    );
    expect(firestoreMocks.setDoc).toHaveBeenCalledOnce();
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      { id: "metadata-document" },
      expect.objectContaining({ storagePath: result.storagePath, sha256: result.sha256 })
    );
  });

  it("fails as explicitly unpersisted and creates no record when object upload fails", async () => {
    storageMocks.uploadBytes.mockRejectedValueOnce(new Error("bucket unavailable"));

    const failure = uploadProjectFile("project-1", selectedFile(), "researcher-1");
    await expect(failure).rejects.toMatchObject({
      name: "ProjectFileUploadError",
      persistenceStatus: "Local / Unpersisted",
      researchFileRecordCreated: false,
    });
    await expect(failure).rejects.toThrow(/local\/unpersisted.*no research-file record/i);
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
  });

  it("removes the uploaded object and reports failure when metadata persistence fails", async () => {
    firestoreMocks.setDoc.mockRejectedValueOnce(new Error("metadata denied"));

    await expect(uploadProjectFile("project-1", selectedFile(), "researcher-1")).rejects.toBeInstanceOf(
      ProjectFileUploadError
    );
    expect(storageMocks.deleteObject).toHaveBeenCalledWith({
      fullPath: "projects/project-1/files/persisted_observations.csv",
    });
  });

  it("contains no object-URL fallback that can masquerade as a successful upload", () => {
    expect(uploadProjectFile.toString()).not.toContain("createObjectURL");
  });
});
