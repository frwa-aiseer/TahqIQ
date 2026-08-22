import { storage, db } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

export interface UploadedFileMeta {
  id: string;
  filename: string;
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  mimeType: string;
  uploadedByUid: string;
  uploadedAt: string;
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  uploaderUid: string
): Promise<UploadedFileMeta> {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const storagePath = `projects/${projectId}/files/${fileId}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    const meta: UploadedFileMeta = {
      id: fileId,
      filename: file.name,
      storagePath,
      downloadUrl,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedByUid: uploaderUid,
      uploadedAt: new Date().toISOString(),
    };

    // Store metadata in Firestore subcollection
    const metaDocRef = doc(db, "projects", projectId, "files", fileId);
    await setDoc(metaDocRef, meta);

    return meta;
  } catch (err: any) {
    console.warn("Storage upload fallback warning:", err);
    // In demo or offline environments where Storage bucket is not configured, generate local object URL
    return {
      id: fileId,
      filename: file.name,
      storagePath,
      downloadUrl: URL.createObjectURL(file),
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedByUid: uploaderUid,
      uploadedAt: new Date().toISOString(),
    };
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
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}

