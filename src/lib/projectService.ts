import { getFirebaseServices } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc, runTransaction } from "firebase/firestore";
import { ProjectState, ProjectRole, ProjectMember, ProjectVersionSnapshot } from "../types";
import { createEmptyProject, isDemoRecord } from "../data/demoProject";
import { hydrateProjectResearchArtifacts } from "./researchArtifacts";

const firestore = () => getFirebaseServices().db;

export interface ProjectSaveResult {
  success: boolean;
  version: number;
  updatedAt: string;
  error?: string;
  conflict?: boolean;
  status?: "Saved" | "Conflict" | "Failed";
  remoteProject?: ProjectState;
}

export class ProjectVersionConflictError extends Error {
  readonly code = "PROJECT_VERSION_CONFLICT" as const;

  constructor(
    message: string,
    readonly expectedVersion: number,
    readonly actualVersion: number,
    readonly remoteProject?: ProjectState
  ) {
    super(message);
    this.name = "ProjectVersionConflictError";
  }
}

type LockableProjectCollection = "datasets" | "analysisOutputs" | "sections";

/**
 * Returns identifiers for locked records that a candidate save attempts to
 * remove or rewrite. These records are immutable after trusted approval.
 */
export function findImmutableProjectConflicts(
  current: ProjectState,
  candidate: ProjectState
): string[] {
  const conflicts: string[] = [];
  const collections: LockableProjectCollection[] = ["datasets", "analysisOutputs", "sections"];

  for (const collectionName of collections) {
    const currentRecords = (current[collectionName] || []) as unknown as Array<Record<string, unknown>>;
    const candidateRecords = (candidate[collectionName] || []) as unknown as Array<Record<string, unknown>>;
    const candidateById = new Map(candidateRecords.map((record) => [String(record.id), record]));

    for (const currentRecord of currentRecords) {
      const isLocked = currentRecord.state === "Locked" || currentRecord.locked === true;
      if (!isLocked) continue;

      const id = String(currentRecord.id || "unknown");
      const candidateRecord = candidateById.get(id);
      if (!candidateRecord || JSON.stringify(candidateRecord) !== JSON.stringify(currentRecord)) {
        conflicts.push(`${collectionName}:${id}`);
      }
    }
  }

  return conflicts;
}

function buildVersionSnapshot(
  project: ProjectState,
  version: number,
  uid: string,
  email: string,
  summary: string
): ProjectVersionSnapshot {
  return {
    id: `ver-${version}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    version,
    timestamp: new Date().toISOString(),
    createdByUid: uid,
    createdByEmail: email,
    summary,
    titleSnapshot: project.title,
    sectionCountSnapshot: project.sections?.length || 0,
  };
}

export async function getUserProjects(uid: string): Promise<ProjectState[]> {
  try {
    const projectsRef = collection(firestore(), "projects");
    // Fetch user projects where members[uid] exists or ownerUid == uid
    const q = query(projectsRef, where(`members.${uid}`, "!=", null));
    const snap = await getDocs(q);
    
    const projects: ProjectState[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as ProjectState;
      if (!data.isDeleted) {
        projects.push(hydrateProjectResearchArtifacts(data));
      }
    });
    return projects;
  } catch (err) {
    console.warn("Firestore getUserProjects notice:", err);
    return [];
  }
}

export async function getProjectById(projectId: string): Promise<ProjectState | null> {
  try {
    const docRef = doc(firestore(), "projects", projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return hydrateProjectResearchArtifacts(snap.data() as ProjectState);
    }
    return null;
  } catch (err) {
    console.error("Error getting project by ID:", err);
    return null;
  }
}

export async function createProjectInFirestore(
  projectData: Partial<ProjectState>,
  ownerUid: string,
  ownerEmail: string,
  ownerName?: string,
  organizationId: string = "default-org"
): Promise<ProjectState> {
  const base = createEmptyProject(projectData);
  const now = new Date().toISOString();
  
  const newProject = hydrateProjectResearchArtifacts({
    ...base,
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isDemoProject: false,
    isArchived: false,
    isDeleted: false,
    ownerUid,
    organizationId,
    version: 1,
    members: {
      [ownerUid]: "Owner",
    },
    memberList: [
      {
        uid: ownerUid,
        email: ownerEmail,
        displayName: ownerName || ownerEmail.split("@")[0],
        role: "Owner",
        joinedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    userRole: "Owner",
  });

  if (!newProject.isDemoProject) {
    const docRef = doc(firestore(), "projects", newProject.id);
    await setDoc(docRef, newProject);

    // Record initial immutable version. Privileged audit events use the trusted server endpoint.
    await createVersionSnapshot(newProject.id, newProject, ownerUid, ownerEmail, "Initial project baseline creation");
  }

  return newProject;
}

export async function saveProjectToFirestore(
  project: ProjectState,
  currentUserUid: string,
  currentUserEmail: string,
  expectedVersion: number = project.version || 1
): Promise<ProjectSaveResult> {
  if (project.isDemoProject) {
    return {
      success: true,
      version: project.version || 1,
      updatedAt: new Date().toISOString(),
      status: "Saved",
    };
  }

  try {
    const docRef = doc(firestore(), "projects", project.id);
    const result = await runTransaction(firestore(), async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists()) throw new Error("Project not found.");

      const remoteProject = hydrateProjectResearchArtifacts(snapshot.data() as ProjectState);
      const actualVersion = remoteProject.version || 1;
      if (actualVersion !== expectedVersion) {
        throw new ProjectVersionConflictError(
          `Project version conflict: expected v${expectedVersion}, but the stored project is v${actualVersion}. Reload before saving.`,
          expectedVersion,
          actualVersion,
          remoteProject
        );
      }

      const immutableConflicts = findImmutableProjectConflicts(remoteProject, project);
      if (immutableConflicts.length > 0) {
        throw new ProjectVersionConflictError(
          `Immutable approved artifact conflict: ${immutableConflicts.join(", ")}. The newer approved record was not overwritten.`,
          expectedVersion,
          actualVersion,
          remoteProject
        );
      }

      const now = new Date().toISOString();
      const newVersion = actualVersion + 1;
      const updatedProject = hydrateProjectResearchArtifacts({ ...project, version: newVersion, updatedAt: now });
      const versionSnapshot = buildVersionSnapshot(updatedProject, newVersion, currentUserUid, currentUserEmail, "Autosave manuscript/project revision");
      const versionRef = doc(collection(firestore(), "projects", project.id, "versions"), versionSnapshot.id);

      transaction.set(docRef, updatedProject, { merge: true });
      transaction.set(versionRef, versionSnapshot);
      return { updatedProject, versionSnapshot };
    });

    return { success: true, version: result.updatedProject.version || expectedVersion + 1, updatedAt: result.updatedProject.updatedAt, status: "Saved" };
  } catch (err: any) {
    if (err instanceof ProjectVersionConflictError) {
      return {
        success: false,
        version: err.actualVersion,
        updatedAt: err.remoteProject?.updatedAt || project.updatedAt,
        error: err.message,
        conflict: true,
        status: "Conflict",
        remoteProject: err.remoteProject,
      };
    }
    console.error("Firestore save error:", err);
    return {
      success: false,
      version: project.version || 1,
      updatedAt: project.updatedAt,
      error: err.message || "Failed to save project to cloud storage.",
      status: "Failed",
    };
  }
}

export async function archiveProjectInFirestore(
  projectId: string,
  isArchived: boolean,
  uid: string,
  email: string
): Promise<boolean> {
  try {
    const docRef = doc(firestore(), "projects", projectId);
    await updateDoc(docRef, { isArchived, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error("Error archiving project:", err);
    return false;
  }
}

export async function deleteProjectInFirestore(
  projectId: string,
  softDelete: boolean,
  uid: string,
  email: string
): Promise<boolean> {
  try {
    const docRef = doc(firestore(), "projects", projectId);
    if (softDelete) {
      await updateDoc(docRef, { isDeleted: true, updatedAt: new Date().toISOString() });
    } else {
      await deleteDoc(docRef);
    }
    return true;
  } catch (err) {
    console.error("Error deleting project:", err);
    return false;
  }
}

export async function updateMemberRoleInFirestore(
  projectId: string,
  targetUid: string,
  targetEmail: string,
  newRole: ProjectRole,
  executorUid: string,
  executorEmail: string
): Promise<boolean> {
  try {
    const docRef = doc(firestore(), "projects", projectId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const currentData = snap.data() as ProjectState;
    const members = currentData.members || {};
    members[targetUid] = newRole;

    const memberList = (currentData.memberList || []).map((m) =>
      m.uid === targetUid ? { ...m, role: newRole } : m
    );

    if (!memberList.some((m) => m.uid === targetUid)) {
      memberList.push({
        uid: targetUid,
        email: targetEmail,
        role: newRole,
        joinedAt: new Date().toISOString(),
      });
    }

    await updateDoc(docRef, { members, memberList, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error("Error updating member role:", err);
    return false;
  }
}

export async function createVersionSnapshot(
  projectId: string,
  project: ProjectState,
  uid: string,
  email: string,
  summary: string
): Promise<void> {
  try {
    const versionsRef = collection(firestore(), "projects", projectId, "versions");
    const snapshot = buildVersionSnapshot(project, project.version || 1, uid, email, summary);
    await addDoc(versionsRef, snapshot);
  } catch (err) {
    console.warn("Version snapshot notice:", err);
  }
}
