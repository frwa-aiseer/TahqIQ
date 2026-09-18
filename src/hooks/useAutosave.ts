import { useCallback, useState, useEffect, useRef } from "react";
import type { ProjectState } from "../types";
import { saveProjectToFirestore, getProjectById } from "../lib/projectService";
import { useAuth } from "../context/AuthContext";

export type AutosaveState = "Idle" | "Saving" | "Saved" | "Offline" | "Conflict" | "Failed";

/** Version-independent content identity prevents the save acknowledgement from becoming a new dirty edit. */
export function projectContentFingerprint(project: ProjectState): string {
  const { version: _version, updatedAt: _updatedAt, ...content } = project;
  return JSON.stringify(content);
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

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
  const callbackRef = useRef(onProjectSaved);
  const pendingSaveRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedFingerprintRef = useRef(projectContentFingerprint(project));
  projectRef.current = project;
  callbackRef.current = onProjectSaved;

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const persistCurrentProject = useCallback(async () => {
    if (saveInFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    const currentProject = projectRef.current;
    if (currentProject.isDemoProject) {
      pendingSaveRef.current = false;
      lastPersistedFingerprintRef.current = projectContentFingerprint(currentProject);
      setAutosaveState("Saved");
      setLastSavedTime("Demo Workspace");
      return;
    }

    if (isOffline()) {
      pendingSaveRef.current = true;
      setAutosaveState("Offline");
      return;
    }

    saveInFlightRef.current = true;
    setAutosaveState("Saving");
    const uid = user?.uid || "anonymous-researcher";
    const email = user?.email || "researcher@local";
    const expectedVersion = currentProject.version || 1;

    try {
      // This read improves UX for an already-obsolete client. The save service
      // repeats the check in a Firestore transaction to close the read/write race.
      const remoteSnap = await getProjectById(currentProject.id);
      if (remoteSnap && (remoteSnap.version || 1) !== expectedVersion) {
        pendingSaveRef.current = false;
        setAutosaveState("Conflict");
        setErrorMessage(`Remote project is v${remoteSnap.version || 1}; this edit started from v${expectedVersion}. Reload before saving.`);
        return;
      }

      const result = await saveProjectToFirestore(currentProject, uid, email, expectedVersion);
      if (result.success) {
        pendingSaveRef.current = false;
        lastPersistedFingerprintRef.current = projectContentFingerprint(currentProject);
        setAutosaveState("Saved");
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setErrorMessage(null);
        callbackRef.current?.({ ...currentProject, version: result.version, updatedAt: result.updatedAt });
      } else if (result.conflict || result.status === "Conflict") {
        pendingSaveRef.current = false;
        setAutosaveState("Conflict");
        setErrorMessage(result.error || "Remote project changed. Reload before saving.");
      } else {
        pendingSaveRef.current = true;
        setAutosaveState("Failed");
        setErrorMessage(result.error || "Autosave failed.");
      }
    } catch (err: any) {
      pendingSaveRef.current = true;
      setAutosaveState("Failed");
      setErrorMessage(err?.message || "Autosave error.");
    } finally {
      saveInFlightRef.current = false;
      const currentFingerprint = projectContentFingerprint(projectRef.current);
      if (
        pendingSaveRef.current &&
        currentFingerprint !== lastPersistedFingerprintRef.current &&
        !isOffline()
      ) {
        clearSaveTimer();
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          void persistCurrentProject();
        }, 0);
      }
    }
  }, [clearSaveTimer, user]);

  useEffect(() => {
    const fingerprint = projectContentFingerprint(project);
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      lastPersistedFingerprintRef.current = fingerprint;
      return;
    }

    if (project.isDemoProject) {
      pendingSaveRef.current = false;
      lastPersistedFingerprintRef.current = fingerprint;
      setAutosaveState("Saved");
      setLastSavedTime("Demo Workspace");
      return;
    }

    if (fingerprint === lastPersistedFingerprintRef.current && !pendingSaveRef.current) return;

    pendingSaveRef.current = true;
    clearSaveTimer();
    if (isOffline()) {
      setAutosaveState("Offline");
      return;
    }

    setAutosaveState("Saving");
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void persistCurrentProject();
    }, 1500);

    return clearSaveTimer;
  }, [clearSaveTimer, persistCurrentProject, project]);

  useEffect(() => {
    const handleOffline = () => {
      if (projectRef.current.isDemoProject) return;
      const dirty = projectContentFingerprint(projectRef.current) !== lastPersistedFingerprintRef.current;
      if (!dirty && !saveInFlightRef.current) return;
      pendingSaveRef.current = true;
      clearSaveTimer();
      setAutosaveState("Offline");
    };

    const handleOnline = () => {
      if (projectRef.current.isDemoProject || !pendingSaveRef.current) return;
      clearSaveTimer();
      setAutosaveState("Saving");
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void persistCurrentProject();
      }, 0);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [clearSaveTimer, persistCurrentProject]);

  useEffect(() => () => clearSaveTimer(), [clearSaveTimer]);

  const triggerManualSave = async () => {
    if (projectRef.current.isDemoProject) return;
    pendingSaveRef.current = true;
    clearSaveTimer();
    await persistCurrentProject();
  };

  return {
    autosaveState,
    lastSavedTime,
    errorMessage,
    triggerManualSave,
  };
}
