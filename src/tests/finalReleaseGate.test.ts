import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("TQ-VSC-095 final release gate report", () => {
  const report = readFileSync(resolve(process.cwd(), "docs/FINAL_RELEASE_GATE.md"), "utf8");

  it("records an evidence-based partial decision and retains the prototype warning", () => {
    expect(report).toContain("Decision:** **PARTIAL — NOT READY FOR PRODUCTION APPROVAL");
    expect(report).toContain("Prototype warning:** **RETAINED");
    expect(report).toContain("No browser session was available");
    expect(report).toContain("npm run test:firestore-rules");
    expect(report).toContain("npm run test:storage-rules");
  });

  it("does not describe the known red full suite as passing", () => {
    expect(report).toContain("104 files passed, 2 failed, 2 skipped");
    expect(report).toContain("712 passed, 2 failed, 18 skipped");
    expect(report).not.toMatch(/`npm test`[^\n]*PASS/);
  });
});
