import { describe, expect, it } from "vitest";
import { analysisMethodRegistry } from "../lib/statsEngine";

describe("statistical golden-dataset coverage", () => {
  it("keeps every enabled deterministic method discoverable for golden fixtures", () => {
    const methods = analysisMethodRegistry.list().filter((method: any) => method.availability === "Enabled");
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every((method: any) => typeof method.id === "string" && typeof method.execute === "function")).toBe(true);
  });
});
