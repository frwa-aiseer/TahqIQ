import { firebaseStatus, getFirebaseServices } from "./firebase";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import type { ResearchArtifact } from "../types";
import { hydrateProjectResearchArtifacts } from "./researchArtifacts";

export interface UploadedFileMeta extends Omit<ResearchArtifact, "provenance"> {
  filename: string;
  storagePath: string;
  downloadUrl: string;
  sha256: string;
  sizeBytes: number;
  mimeType: string;
  uploadedByUid: string;
  uploadedAt: string;
  persistenceStatus: "Persisted";
  provenance: {
    origin: "Researcher Upload";
    recordedAt: string;
    actorUid: string;
    source: "Researcher Upload";
    storageProvider: "Firebase Cloud Storage";
    originalFilename: string;
    checksumAlgorithm: "SHA-256";
  };
}

export class ProjectFileUploadError extends Error {
  readonly persistenceStatus = "Local / Unpersisted" as const;
  readonly researchFileRecordCreated = false;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ProjectFileUploadError";
  }
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Unable to read the selected file."));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}

export async function calculateFileSha256(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 is unavailable in this browser.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await readFileBytes(file));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  uploaderUid: string
): Promise<UploadedFileMeta> {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  if (firebaseStatus === "Not Configured") {
    throw new ProjectFileUploadError(
      "Firebase Not Configured: the file remains local/unpersisted and no research-file record was created."
    );
  }

  const safeFilename = file.name.replace(/[\\/]/g, "_");
  const requestedStoragePath = `projects/${projectId}/files/${fileId}_${safeFilename}`;
  let uploadedRef: ReturnType<typeof ref> | null = null;

  try {
    const { storage, db } = getFirebaseServices();
    const sha256 = await calculateFileSha256(file);
    const mimeType = file.type || "application/octet-stream";
    const storageRef = ref(storage, requestedStoragePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: mimeType,
      customMetadata: {
        projectId,
        uploaderUid,
        sha256,
        provenance: "Researcher Upload",
      },
    });
    uploadedRef = snapshot.ref;
    const storagePath = snapshot.ref.fullPath;
    if (!storagePath) throw new Error("Storage did not return a persistent object path.");
    const downloadUrl = await getDownloadURL(snapshot.ref);
    const uploadedAt = new Date().toISOString();

    const meta: UploadedFileMeta = {
      id: fileId,
      artifactType: "Uploaded Document",
      title: file.name,
      createdBy: uploaderUid,
      createdAt: uploadedAt,
      updatedAt: uploadedAt,
      sourceArtifactIds: [],
      verificationState: "Unverified",
      approvalState: "Not Approved",
      version: 1,
      contentHash: sha256,
      isDemo: false,
      isSynthetic: false,
      locked: false,
      filename: file.name,
      projectId,
      storagePath,
      downloadUrl,
      sha256,
      sizeBytes: file.size,
      mimeType,
      uploadedByUid: uploaderUid,
      uploadedAt,
      persistenceStatus: "Persisted",
      provenance: {
        origin: "Researcher Upload",
        recordedAt: uploadedAt,
        actorUid: uploaderUid,
        source: "Researcher Upload",
        storageProvider: "Firebase Cloud Storage",
        originalFilename: file.name,
        checksumAlgorithm: "SHA-256",
      },
    };

    // A research-file record exists only after durable object upload and URL resolution succeed.
    const metaDocRef = doc(db, "projects", projectId, "files", fileId);
    await setDoc(metaDocRef, meta);

    return meta;
  } catch (error) {
    if (uploadedRef) {
      try {
        await deleteObject(uploadedRef);
      } catch (cleanupError) {
        console.warn("Unable to remove incomplete research-file upload:", cleanupError);
      }
    }
    throw new ProjectFileUploadError(
      "Cloud upload failed: the file remains local/unpersisted and no research-file record was created.",
      { cause: error }
    );
  }
}

export function saveProjectToLocalStorage(project: any) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(`tehqiq_project_${project.id}`, JSON.stringify(project));
  }
}

export function loadProjectFromLocalStorage(projectId: string): any | null {
  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(`tehqiq_project_${projectId}`);
    return raw ? hydrateProjectResearchArtifacts(JSON.parse(raw)) : null;
  }
  return null;
}
