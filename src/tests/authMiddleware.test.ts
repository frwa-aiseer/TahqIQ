import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createAuthenticatedProjectMiddleware,
  createInMemoryRateLimitHook,
  PROJECT_WRITER_ROLES,
} from "../server/authMiddleware";

function harness(options: {
  authorization?: string;
  decoded?: { uid: string; email?: string };
  tokenError?: Error;
  project?: Record<string, unknown> | null;
  allowedRoles?: typeof PROJECT_WRITER_ROLES;
  body?: Record<string, unknown>;
  rateLimitHook?: () => boolean;
}) {
  const verifyIdToken = options.tokenError
    ? vi.fn().mockRejectedValue(options.tokenError)
    : vi.fn().mockResolvedValue(options.decoded || { uid: "member-1", email: "member@example.test" });
  const project = options.project === undefined
    ? { ownerUid: "owner-1", members: { "owner-1": "Owner", "member-1": "Co-author", "viewer-1": "Viewer" } }
    : options.project;
  const projectRef = {
    get: vi.fn().mockResolvedValue({ exists: Boolean(project), id: "project-1", data: () => project || undefined }),
    collection: vi.fn(),
  };
  const req = {
    body: options.body || {},
    params: {},
    method: "POST",
    path: "/api/protected",
    header: (name: string) => {
      if (name.toLowerCase() === "authorization") return options.authorization || "";
      if (name.toLowerCase() === "x-tehqiq-project-id") return "project-1";
      return undefined;
    },
  } as any;
  const responseEvents = new EventEmitter();
  const res = Object.assign(responseEvents, {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  }) as any;
  const next = vi.fn();
  const middleware = createAuthenticatedProjectMiddleware({
    getAdminServices: () => ({
      adminAuth: { verifyIdToken },
      adminDb: { collection: () => ({ doc: () => projectRef }) },
    }),
    allowedRoles: options.allowedRoles || PROJECT_WRITER_ROLES,
    rateLimitHook: options.rateLimitHook,
  });
  return { middleware, req, res, next, verifyIdToken };
}

async function run(test: ReturnType<typeof harness>) {
  await test.middleware(test.req, test.res, test.next);
  return test;
}

describe("reusable authenticated project middleware", () => {
  it("rejects unauthenticated requests", async () => {
    const result = await run(harness({}));
    expect(result.res.statusCode).toBe(401);
    expect(result.verifyIdToken).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens without leaking verifier details", async () => {
    const result = await run(harness({ authorization: "Bearer invalid", tokenError: new Error("certificate internals") }));
    expect(result.res.statusCode).toBe(401);
    expect(result.res.body).toEqual({ status: "failed", error: "Invalid or expired Firebase ID token." });
  });

  it("rejects authenticated non-members", async () => {
    const result = await run(harness({ authorization: "Bearer valid", decoded: { uid: "outsider" } }));
    expect(result.res.statusCode).toBe(403);
    expect(result.res.body.error).toBe("Project membership required.");
  });

  it("rejects members with an insufficient role", async () => {
    const result = await run(harness({ authorization: "Bearer valid", decoded: { uid: "viewer-1" } }));
    expect(result.res.statusCode).toBe(403);
    expect(result.res.body.error).toBe("Project role is not authorized for this operation.");
  });

  it("authorizes from verified token and stored membership, ignoring frontend identity claims", async () => {
    const result = await run(harness({
      authorization: "Bearer valid-token",
      body: { userId: "forged-owner", email: "forged@example.test", role: "Owner", members: { "member-1": "Owner" } },
    }));
    expect(result.next).toHaveBeenCalledOnce();
    expect(result.req.projectAuth).toMatchObject({
      actor: { uid: "member-1", email: "member@example.test" },
      projectId: "project-1",
      role: "Co-author",
    });
    expect(result.verifyIdToken).toHaveBeenCalledWith("valid-token");
  });

  it("provides a reusable rate-limit hook", async () => {
    const limiter = createInMemoryRateLimitHook(1, 60_000);
    const first = await limiter({ actorUid: "u", projectId: "p", route: "/r", now: 100 });
    const second = await limiter({ actorUid: "u", projectId: "p", route: "/r", now: 101 });
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("applies the reusable project middleware to every sensitive API endpoint", () => {
    const server = readFileSync(resolve(process.cwd(), "server.ts"), "utf8");
    const protectedRoutes = [
      "/api/projects/:projectId/audit-events",
      "/api/gemini/agent",
      "/api/gemini/draft-section",
      "/api/gemini/peer-review",
      "/api/gemini/methodology-proposal",
      "/api/sources/doi",
      "/api/analysis/execute",
    ];
    for (const route of protectedRoutes) {
      expect(server).toMatch(new RegExp(`app\\.post\\(\\"${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\", protectedProjectRoute\\(`));
    }
    expect(server).toContain('app.get("/api/health"');
  });
});
