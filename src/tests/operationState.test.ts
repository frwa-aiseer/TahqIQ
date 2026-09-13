import { describe, expect, it } from "vitest";
import { operationFailure, operationSuccess, operationUnavailable } from "../lib/operationState";
describe("truthful operation states", () => {
  it("never represents failures as success", () => expect(operationFailure("network unavailable").state).toBe("Failed"));
  it("distinguishes unavailable and review-required outcomes", () => {
    expect(operationUnavailable().state).toBe("Not Configured");
    expect(operationSuccess("proposal generated", true).state).toBe("Needs Review");
  });
});
