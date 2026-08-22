import { useState, useEffect, useRef } from "react";
import { ProjectState } from "../types";
import { saveProjectToFirestore, getProjectById } from "../lib/projectService";
import { useAuth } from "../context/AuthContext";

export type AutosaveState = "Idle" | "Saving" | "Saved" | "Offline" | "Conflict" | "Failed";

export function useAutosave(
  project: ProjectState,
  onProjectSaved?: (updatedProject: ProjectState) => void
) {
  const { user } = useAuth();
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("Saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialRenderRef = useRef(true);
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    // Skip initial load
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (project.isDemoProject) {
      setAutosaveState("Saved");
      setLastSavedTime("Demo Workspace");
      return;
    }

    if (!navigator.onLine) {
      setAutosaveState("Offline");
      return;
    }

    setAutosaveState("Saving");

    const timer = setTimeout(async () => {
      const currentProject = projectRef.current;
      const uid = user?.uid || "anonymous-researcher";
      const email = user?.email || "researcher@local";

      try {
        // Conflict check: check if remote version is newer
        const remoteSnap = await getProjectById(currentProject.id);
        if (
          remoteSnap &&
          remoteSnap.version &&
          currentProject.version &&
          remoteSnap.version > currentProject.version
        ) {
          setAutosaveState("Conflict");
          setErrorMessage("Remote project was modified by another collaborator.");
          return;
        }

        const res = await saveProjectToFirestore(currentProject, uid, email);
        if (res.success) {
          setAutosaveState("Saved");
          const timeStr = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setLastSavedTime(timeStr);
          setErrorMessage(null);
          if (onProjectSaved) {
            onProjectSaved({ ...currentProject, version: res.version, updatedAt: res.updatedAt });
          }
        } else {
          setAutosaveState("Failed");
          setErrorMessage(res.error || "Autosave failed.");
        }
      } catch (err: any) {
        setAutosaveState("Failed");
        setErrorMessage(err.message || "Autosave error.");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [project, user]);

  const triggerManualSave = async () => {
    if (project.isDemoProject) return;
    setAutosaveState("Saving");
    const uid = user?.uid || "anonymous-researcher";
    const email = user?.email || "researcher@local";

    const res = await saveProjectToFirestore(project, uid, email);
    if (res.success) {
      setAutosaveState("Saved");
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setErrorMessage(null);
    } else {
      setAutosaveState("Failed");
      setErrorMessage(res.error || "Save failed");
    }
  };

  return {
    autosaveState,
    lastSavedTime,
    errorMessage,
    triggerManualSave,
  };
}
