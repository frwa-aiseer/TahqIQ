import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { parseCsvTextToDataset, updateDatasetVariableDictionary } from "../lib/datasetIngestion";

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn((...parts: unknown[]) => ({ path: parts.join("/") })),
  deleteDoc: vi.fn(),
  doc: vi.fn((first: unknown, ...rest: unknown[]) => ({ path: `${typeof first === "object" && first && "path" in first ? (first as { path: string }).path : String(first)}${rest.length ? `/${rest.map(String).join("/")}` : ""}` })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  runTransaction: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock("firebase/firestore", () => firestoreMocks);
vi.mock("../lib/firebase", () => ({ getFirebaseServices: () => ({ db: {} }) }));

import {
  findImmutableProjectConflicts,
  ProjectVersionConflictError,
  saveProjectToFirestore,
} from "../lib/projectService";
import type { ProjectState } from "../types";

function project(overrides: Partial<ProjectState> = {}): ProjectState {
  return createEmptyProject({ id: "project-concurrency", version: 1, title: "Concurrent manuscript", ...overrides });
}

function transactionStore(initial: ProjectState) {
  let remote = structuredClone(initial);
  const snapshots: ProjectState[] = [];
  const transaction = {
    get: vi.fn(async () => ({ exists: () => true, data: () => structuredClone(remote) })),
    set: vi.fn((reference: { path: string }, value: ProjectState | Record<string, unknown>) => {
      if (reference.path.includes("/versions/")) snapshots.push(value as ProjectState);
      else remote = structuredClone(value as ProjectState);
    }),
  };
  firestoreMocks.runTransaction.mockImplementation(async (_db: unknown, callback: (tx: typeof transaction) => unknown) => callback(transaction));
  return { transaction, snapshots, read: () => remote };
}

describe("TQ-VSC-091 project concurrency, versions, and immutable records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the first of two clients to save and rejects the stale client without overwriting it", async () => {
    const base = project();
    const store = transactionStore(base);
    const clientA = { ...base, title: "Client A revision" };
    const clientB = { ...base, title: "Client B stale revision" };

    const first = await saveProjectToFirestore(clientA, "researcher-a", "a@example.org");
    const stale = await saveProjectToFirestore(clientB, "researcher-b", "b@example.org");

    expect(first).toMatchObject({ success: true, status: "Saved", version: 2 });
    expect(stale).toMatchObject({ success: false, status: "Conflict", conflict: true, version: 2 });
    expect(stale.error).toMatch(/expected v1.*stored project is v2/i);
    expect(store.read().title).toBe("Client A revision");
    expect(store.transaction.set).toHaveBeenCalledTimes(2);
  });

  it("returns a typed conflict when a transaction observes a stale version", async () => {
    const base = project({ version: 4 });
    const store = transactionStore({ ...base, version: 5, title: "Newer remote" });
    const result = await saveProjectToFirestore({ ...base, title: "Old local edit" }, "researcher", "researcher@example.org");

    expect(result).toMatchObject({ success: false, status: "Conflict", conflict: true, version: 5, remoteProject: { title: "Newer remote" } });
    expect(store.transaction.set).not.toHaveBeenCalled();
    expect(new ProjectVersionConflictError("conflict", 4, 5).code).toBe("PROJECT_VERSION_CONFLICT");
  });

  it("rejects rewrites or removal of locked datasets and manuscript sections", async () => {
    const lockedDataset = parseCsvTextToDataset("approved.csv", "group,score\nA,1\nB,2");
    lockedDataset.state = "Locked";
    lockedDataset.version = 2;
    const base = project({ datasets: [lockedDataset], sections: [{ ...project().sections[0], state: "Locked", status: "Approved", content: "Approved content" }] });
    const candidate = {
      ...base,
      datasets: [{ ...lockedDataset, fileHash: "replacement-hash" }],
      sections: [{ ...base.sections[0], content: "Unauthorized rewrite" }],
    };

    expect(findImmutableProjectConflicts(base, candidate)).toEqual(expect.arrayContaining([`datasets:${lockedDataset.id}`, `sections:${base.sections[0].id}`]));
    const store = transactionStore(base);
    const result = await saveProjectToFirestore(candidate, "researcher", "researcher@example.org");

    expect(result).toMatchObject({ success: false, status: "Conflict", conflict: true });
    expect(result.error).toMatch(/immutable approved artifact/i);
    expect(store.transaction.set).not.toHaveBeenCalled();
    expect(store.read().datasets[0].fileHash).toBe(lockedDataset.fileHash);
    expect(store.read().sections[0].content).toBe("Approved content");
  });

  it("records an immutable manuscript snapshot as part of each successful revision", async () => {
    const base = project();
    const store = transactionStore(base);
    const result = await saveProjectToFirestore({ ...base, title: "Revision with history" }, "researcher", "researcher@example.org");

    expect(result).toMatchObject({ success: true, version: 2 });
    expect(store.snapshots).toHaveLength(1);
    expect(store.snapshots[0]).toMatchObject({ version: 2, titleSnapshot: "Revision with history", sectionCountSnapshot: base.sections.length, createdByUid: "researcher" });
  });

  it("versions dataset replacements and refuses edits after a dataset is locked", async () => {
    const first = parseCsvTextToDataset("observations.csv", "group,score\nA,1\nB,2");
    const replacement = parseCsvTextToDataset("observations-v2.csv", "group,score\nA,1\nB,3");
    const revised = await updateDatasetVariableDictionary(first, first.variables, "Researcher corrected variable metadata");

    expect(revised.id).toBe(first.id);
    expect(revised.version).toBe(2);
    expect(revised.versionHistory?.at(-1)).toMatchObject({ version: 2, changeNote: "Researcher corrected variable metadata" });
    expect(replacement.id).not.toBe(first.id);
    expect(replacement.version).toBe(1);

    await expect(updateDatasetVariableDictionary({ ...revised, state: "Locked" }, revised.variables, "Attempted locked edit")).rejects.toThrow(/locked and immutable.*replacement dataset/i);
  });
});
