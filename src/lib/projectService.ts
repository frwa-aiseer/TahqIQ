import { getFirebaseServices } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { ProjectState, ProjectRole, ProjectMember, ProjectAuditEvent, ProjectVersionSnapshot } from "../types";
import { createEmptyProject, isDemoRecord } from "../data/demoProject";

const firestore = () => getFirebaseServices().db;

export interface ProjectSaveResult {
  success: boolean;
  version: number;
  updatedAt: string;
  error?: string;
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
        projects.push(data);
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
      return snap.data() as ProjectState;
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
  
  const newProject: ProjectState = {
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
  };

  if (!newProject.isDemoProject) {
    const docRef = doc(firestore(), "projects", newProject.id);
    await setDoc(docRef, newProject);

    // Record initial immutable version and audit event
    await logAuditEvent(newProject.id, ownerUid, ownerEmail, "PROJECT_CREATED", `Created project '${newProject.title}'`);
    await createVersionSnapshot(newProject.id, newProject, ownerUid, ownerEmail, "Initial project baseline creation");
  }

  return newProject;
}

export async function saveProjectToFirestore(
  project: ProjectState,
  currentUserUid: string,
  currentUserEmail: string
): Promise<ProjectSaveResult> {
  if (project.isDemoProject) {
    return {
      success: true,
      version: project.version || 1,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const now = new Date().toISOString();
    const newVersion = (project.version || 1) + 1;

    const updatedProject: ProjectState = {
      ...project,
      version: newVersion,
      updatedAt: now,
    };

    const docRef = doc(firestore(), "projects", project.id);
    await setDoc(docRef, updatedProject, { merge: true });

    return {
      success: true,
      version: newVersion,
      updatedAt: now,
    };
  } catch (err: any) {
    console.error("Firestore save error:", err);
    return {
      success: false,
      version: project.version || 1,
      updatedAt: project.updatedAt,
      error: err.message || "Failed to save project to cloud storage.",
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
    await logAuditEvent(projectId, uid, email, isArchived ? "PROJECT_ARCHIVED" : "PROJECT_UNARCHIVED", `Project set isArchived=${isArchived}`);
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
      await logAuditEvent(projectId, uid, email, "PROJECT_SOFT_DELETED", "Project marked as deleted");
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
    await logAuditEvent(projectId, executorUid, executorEmail, "MEMBER_ROLE_UPDATED", `Assigned role '${newRole}' to member ${targetEmail}`);
    return true;
  } catch (err) {
    console.error("Error updating member role:", err);
    return false;
  }
}

export async function logAuditEvent(
  projectId: string,
  uid: string,
  userEmail: string,
  action: string,
  details: string
): Promise<void> {
  try {
    const eventsRef = collection(firestore(), "projects", projectId, "auditEvents");
    const event: ProjectAuditEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      uid,
      userEmail,
      action,
      details,
    };
    await addDoc(eventsRef, event);
  } catch (err) {
    console.warn("Audit event log notice:", err);
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
    const snapshot: ProjectVersionSnapshot = {
      id: `ver-${project.version || 1}-${Date.now()}`,
      version: project.version || 1,
      timestamp: new Date().toISOString(),
      createdByUid: uid,
      createdByEmail: email,
      summary,
      titleSnapshot: project.title,
      sectionCountSnapshot: project.sections?.length || 0,
    };
    await addDoc(versionsRef, snapshot);
  } catch (err) {
    console.warn("Version snapshot notice:", err);
  }
}
