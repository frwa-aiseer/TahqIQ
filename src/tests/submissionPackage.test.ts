import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { createSubmissionPackageManifest } from "../lib/exportUtils";
describe("submission package manifest", () => {
  it("includes only supplied existing files", () => {
    const manifest = createSubmissionPackageManifest(createEmptyProject(), [], [{ path: "manuscript.tex", content: "\\documentclass{article}" }, { path: "missing.pdf", content: "" }]);
    expect(manifest.files.map((file) => file.path)).toEqual(["manuscript.tex"]);
  });
});
