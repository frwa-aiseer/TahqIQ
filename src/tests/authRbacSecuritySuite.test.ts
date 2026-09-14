import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createAuthenticatedProjectMiddleware,
  PROJECT_WRITER_ROLES,
} from "../server/authMiddleware";
import { validateTrustedAuditRequest } from "../server/trustedAudit";
import { validateTrustedTransitionRequest } from "../server/trustedTransitions";
import { AiBudgetGuard, InMemoryAiBudgetStore, parseAiPricingConfiguration, type AiBudgetPolicy } from "../server/aiBudgetGuard";
import type { ProjectRole } from "../types";

function middlewareHarness(decoded: { uid: string; email?: string }, project: Record<string, unknown>, rateLimitHook?: () => boolean) {
  const verifyIdToken = vi.fn().mockResolvedValue(decoded);
  const projectRef = { get: vi.fn().mockResolvedValue({ exists: true, id: "project-a", data: () => project }), collection: vi.fn() };
  const req = {
    body: {}, params: {}, method: "POST", path: "/api/protected",
    header: (name: string) => name.toLowerCase() === "authorization" ? "Bearer verified-token" : "project-a",
  } as any;
  const res = { statusCode: 200, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } } as any;
  const next = vi.fn();
  const middleware = createAuthenticatedProjectMiddleware({
    getAdminServices: () => ({ adminAuth: { verifyIdToken }, adminDb: { collection: () => ({ doc: () => projectRef }) } }),
    allowedRoles: PROJECT_WRITER_ROLES,
    rateLimitHook,
  });
  return { middleware, req, res, next, verifyIdToken };
}

const project = { ownerUid: "owner-a", members: { "owner-a": "Owner", "writer-a": "Co-author", "viewer-a": "Viewer" } };

describe("TQ-VSC-086 authentication/RBAC/security regression suite", () => {
  it("authenticates from the verified token and rejects Viewer/self-role elevation", async () => {
    const viewer = middlewareHarness({ uid: "viewer-a" }, project);
    await viewer.middleware(viewer.req, viewer.res, viewer.next);
    expect(viewer.res.statusCode).toBe(403);
    expect(viewer.next).not.toHaveBeenCalled();

    const writer = middlewareHarness({ uid: "writer-a", email: "writer@test.invalid" }, project);
    await writer.middleware(writer.req, writer.res, writer.next);
    expect(writer.next).toHaveBeenCalledOnce();
    expect(writer.req.projectAuth).toMatchObject({ actor: { uid: "writer-a" }, role: "Co-author", projectId: "project-a" });
  });

  it("fails closed for rate limits and privileged request forgery", async () => {
    const limited = middlewareHarness({ uid: "writer-a" }, project, () => false);
    await limited.middleware(limited.req, limited.res, limited.next);
    expect(limited.res.statusCode).toBe(429);

    const forgedAudit = validateTrustedAuditRequest({ action: "ANALYSIS_APPROVED", entityType: "AnalysisOutput", entityId: "a", rationale: "Researcher reviewed this evidence.", evidenceIds: [], actor: { uid: "forged" }, timestamp: "2000-01-01" }, "Owner");
    expect(forgedAudit.valid).toBe(false);
    expect(validateTrustedTransitionRequest({ transitionType: "SOURCE_VERIFIED", entityId: "source-a", rationale: "Researcher reviewed this evidence.", evidenceIds: [] }, "Viewer").valid).toBe(false);
  });

  it("keeps profiles, projects, files, and locked state project-scoped", () => {
    const firestore = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
    const storage = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");
    expect(firestore).toContain("request.auth.uid == userId");
    expect(firestore).toContain("allow read: if isMember(resource.data);");
    expect(firestore).toContain("request.resource.data.members == resource.data.members");
    expect(firestore).toContain("allow update, delete: if false;");
    expect(storage).toContain("allow read: if isProjectMember(projectId);");
    expect(storage).toContain("existingArtifactIsUnlocked()");
    expect(storage).toContain("match /{allPaths=**}");
  });

  it("enforces per-project AI model budget limits", () => {
    const pricing = parseAiPricingConfiguration(JSON.stringify({ version: "security-test", effectiveAt: "2026-01-01T00:00:00.000Z", entries: [{ provider: "local", model: "fast", inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 1 }] }));
    const policy: AiBudgetPolicy = { softLimitUsd: 0.0001, hardLimitUsd: 0.0002, maxProviderCallsPerRequest: 1, maxAgentLoopIterations: 1, minimumRemainingUsdByTier: {} };
    const guard = new AiBudgetGuard(pricing, policy, new InMemoryAiBudgetStore(), () => "security-reservation");
    expect(() => guard.authorize({ projectId: "project-a", actorUid: "writer-a", provider: "local", model: "fast", tier: "FAST", declaration: { estimatedInputTokens: 100, maxOutputTokens: 200, loopId: "security", loopIteration: 1, premiumReview: false } })).toThrow(/hard budget exceeded/i);
  });

  it("keeps privileged audit roles least-privilege", () => {
    for (const role of ["Viewer", "Reviewer"] as ProjectRole[]) {
      expect(validateTrustedAuditRequest({ action: "ANALYSIS_APPROVED", entityType: "AnalysisOutput", entityId: "a", rationale: "Researcher reviewed this evidence.", evidenceIds: [] }, role).valid).toBe(false);
    }
  });
});
