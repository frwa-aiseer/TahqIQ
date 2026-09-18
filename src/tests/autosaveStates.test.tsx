import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyProject } from "../data/demoProject";

const projectServiceMocks = vi.hoisted(() => ({
  getProjectById: vi.fn(),
  saveProjectToFirestore: vi.fn(),
}));
const authUser = { uid: "researcher-1", email: "researcher@example.org" };

vi.mock("../lib/projectService", () => projectServiceMocks);
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ user: authUser }) }));

import { useAutosave } from "../hooks/useAutosave";
import type { ProjectState } from "../types";

function baseProject(): ProjectState {
  return createEmptyProject({ id: "autosave-project", version: 1, title: "Autosave manuscript" });
}

function setBrowserOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, value: online });
}

async function flushSaveTimer(milliseconds = 1500) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("TQ-VSC-091 truthful autosave states", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setBrowserOnline(true);
    projectServiceMocks.getProjectById.mockResolvedValue(baseProject());
    projectServiceMocks.saveProjectToFirestore.mockResolvedValue({ success: true, status: "Saved", version: 2, updatedAt: "2026-09-15T00:00:00.000Z" });
  });

  afterEach(() => {
    vi.useRealTimers();
    setBrowserOnline(true);
    vi.clearAllMocks();
  });

  it("shows Saving then Saved and acknowledges the new version", async () => {
    const saved = vi.fn();
    const initial = baseProject();
    const { result, rerender } = renderHook(({ value }) => useAutosave(value, saved), { initialProps: { value: initial } });

    rerender({ value: { ...initial, title: "Researcher edit" } });
    expect(result.current.autosaveState).toBe("Saving");
    await flushSaveTimer();

    expect(result.current.autosaveState).toBe("Saved");
    expect(projectServiceMocks.saveProjectToFirestore).toHaveBeenCalledWith(expect.objectContaining({ title: "Researcher edit", version: 1 }), authUser.uid, authUser.email, 1);
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ title: "Researcher edit", version: 2 }));
  });

  it("shows Conflict and never calls the writer when the remote client is newer", async () => {
    const initial = baseProject();
    projectServiceMocks.getProjectById.mockResolvedValue({ ...initial, version: 2, title: "Remote revision" });
    const { result, rerender } = renderHook(({ value }) => useAutosave(value), { initialProps: { value: initial } });

    rerender({ value: { ...initial, title: "Stale local edit" } });
    await flushSaveTimer();

    expect(result.current.autosaveState).toBe("Conflict");
    expect(result.current.errorMessage).toMatch(/remote project is v2/i);
    expect(projectServiceMocks.saveProjectToFirestore).not.toHaveBeenCalled();
  });

  it("keeps an offline edit pending and retries it after reconnect", async () => {
    const initial = baseProject();
    const { result, rerender } = renderHook(({ value }) => useAutosave(value), { initialProps: { value: initial } });

    setBrowserOnline(false);
    rerender({ value: { ...initial, title: "Offline edit" } });
    expect(result.current.autosaveState).toBe("Offline");
    expect(projectServiceMocks.saveProjectToFirestore).not.toHaveBeenCalled();

    setBrowserOnline(true);
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(0);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(projectServiceMocks.saveProjectToFirestore).toHaveBeenCalledOnce();
    expect(result.current.autosaveState).toBe("Saved");
  });

  it.each([
    ["Failed", { success: false, status: "Failed", error: "Cloud unavailable" }],
    ["Conflict", { success: false, status: "Conflict", conflict: true, version: 2, error: "Immutable approved artifact conflict" }],
  ] as const)("surfaces a truthful %s result from the persistence boundary", async (state, response) => {
    const initial = baseProject();
    projectServiceMocks.getProjectById.mockResolvedValue(initial);
    projectServiceMocks.saveProjectToFirestore.mockResolvedValue(response);
    const { result, rerender } = renderHook(({ value }) => useAutosave(value), { initialProps: { value: initial } });

    rerender({ value: { ...initial, title: `Edit resulting in ${state}` } });
    await flushSaveTimer();

    expect(result.current.autosaveState).toBe(state);
    expect(result.current.errorMessage).toContain(response.error);
  });
});
