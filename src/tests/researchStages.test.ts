import { describe, expect, it } from "vitest";
import { RESEARCH_STAGES } from "../components/Navigation";
describe("researcher navigation stages", () => {
  it("exposes six understandable stages while preserving legacy step coverage", () => {
    expect(RESEARCH_STAGES.map((stage) => stage.title)).toEqual(["Project & Target", "Evidence", "Method & Data", "Analysis", "Manuscript", "Review & Export"]);
    expect(RESEARCH_STAGES.flatMap((stage) => stage.stepIds)).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });
});
