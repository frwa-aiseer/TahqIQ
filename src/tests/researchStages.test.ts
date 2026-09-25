import { describe, expect, it } from "vitest";
import { RESEARCH_STAGES, WORKFLOW_STEPS } from "../components/Navigation";
describe("researcher navigation stages", () => {
  it("exposes six understandable stages while preserving legacy step coverage", () => {
    expect(RESEARCH_STAGES.map((stage) => stage.title)).toEqual(["Project & Target", "Evidence", "Method & Data", "Analysis", "Manuscript", "Review & Export"]);
    expect(RESEARCH_STAGES.flatMap((stage) => stage.stepIds)).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });

  it("makes the methods/data boundary explicit in the ten-step labels", () => {
    expect(WORKFLOW_STEPS[4]).toMatchObject({ title: "Methods & Protocol", subtitle: "Define method, ethics, and analysis plan" });
    expect(WORKFLOW_STEPS[5]).toMatchObject({ title: "Data & Results", subtitle: "Upload data, run approved analysis, and review outputs" });
    expect(WORKFLOW_STEPS[9]).toMatchObject({ title: "Review & Export", subtitle: "Review warnings, disclosures, and export files" });
  });
});
