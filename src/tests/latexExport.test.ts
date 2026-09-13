import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { generateLatexManuscript } from "../lib/exportUtils";
describe("LaTeX manuscript export", () => {
  it("emits structural LaTeX with escaped manuscript content", () => {
    const project = createEmptyProject(); project.title = "A & B"; project.sections[0].content = "Text_with_underscores & symbols";
    const tex = generateLatexManuscript(project);
    expect(tex).toContain("\\documentclass{article}"); expect(tex).toContain("\\begin{document}"); expect(tex).toContain("Text\\_with\\_underscores \\& symbols"); expect(tex).toContain("\\bibliography{references}");
  });
});
