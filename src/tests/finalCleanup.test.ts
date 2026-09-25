import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { applyToneAndComplexity } from "../lib/manuscriptTone";

const repositoryRoot = resolve(process.cwd());

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("TQ-VSC-096 final cleanup invariants", () => {
  it("removes the unreachable q1 generator and its one-off patch utilities", () => {
    const obsoletePaths = [
      "src/lib/q1ManuscriptEngine.ts",
      "fix_imports.cjs",
      "fix_lint.cjs",
      "fix_q1_import.cjs",
      "patch_q1ManuscriptEngine.cjs",
    ];

    expect(obsoletePaths.filter((path) => existsSync(resolve(repositoryRoot, path)))).toEqual([]);
  });

  it("keeps production generation on the standalone deterministic tone formatter", () => {
    const productionFiles = [
      resolve(repositoryRoot, "src/App.tsx"),
      resolve(repositoryRoot, "server.ts"),
      ...sourceFiles(resolve(repositoryRoot, "src/components")),
      ...sourceFiles(resolve(repositoryRoot, "src/lib")),
      ...sourceFiles(resolve(repositoryRoot, "src/server")),
    ];
    const q1References = productionFiles.filter((path) => readFileSync(path, "utf8").includes("q1ManuscriptEngine"));

    expect(q1References).toEqual([]);
    expect(readFileSync(resolve(repositoryRoot, "src/components/views/WritingStudioView.tsx"), "utf8")).toContain(
      'from "../../lib/manuscriptTone"'
    );
    expect(applyToneAndComplexity("Accumulating empirical evidence indicates that results were reviewed.", "Concise Technical")).toContain(
      "Empirical data show"
    );
  });
});
