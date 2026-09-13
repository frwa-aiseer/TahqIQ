import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { calculateSubmissionReadiness } from "../lib/readinessCalculator";
describe("submission readiness", () => {
  it("is a mandatory-gate result, not an average score", () => {
    const result = calculateSubmissionReadiness(createEmptyProject());
    expect(result.ready).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });
});
