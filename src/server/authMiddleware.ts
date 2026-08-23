import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ProjectRole } from "../types";

export const ALL_PROJECT_ROLES: ProjectRole[] = [
  "Owner", "Corresponding Author", "Co-author", "Supervisor", "Statistician", "Reviewer", "Viewer",
];
export const PROJECT_WRITER_ROLES: ProjectRole[] = [
  "Owner", "Corresponding Author", "Co-author", "Supervisor", "Statistician",
];

interface DecodedFirebaseActor {
  uid: string;
  email?: string;
}

interface ProjectSnapshotLike {
  exists: boolean;
  id: string;
  data(): Record<string, unknown> | undefined;
}

interface ProjectReferenceLike {
  get(): Promise<ProjectSnapshotLike>;
  collection(name: string): { doc(): unknown };
}

export interface AdminSecurityServices {
  adminAuth: { verifyIdToken(token: string): Promise<DecodedFirebaseActor> };
  adminDb: { collection(name: string): { doc(id: string): ProjectReferenceLike } };
}

export interface AuthenticatedProjectContext {
  actor: { uid: string; email: string | null };
  projectId: string;
  role: ProjectRole;
  project: Record<string, unknown>;
  projectRef: ProjectReferenceLike;
}

export interface AuthenticatedProjectRequest extends Request {
  projectAuth?: AuthenticatedProjectContext;
}

export interface SecurityAuditRecord {
  actorUid: string;
  projectId: string;
  role: ProjectRole;
  method: string;
  route: string;
  statusCode: number;
  completedAt: string;
}

export type SecurityAuditHook = (record: SecurityAuditRecord) => void | Promise<void>;
export type RateLimitHook = (input: {
  actorUid: string;
  projectId: string;
  route: string;
  now: number;
}) => boolean | Promise<boolean>;

export interface ProjectMiddlewareOptions {
  getAdminServices: () => AdminSecurityServices;
  allowedRoles?: readonly ProjectRole[];
  maxBodyBytes?: number;
  requireEmail?: boolean;
  rateLimitHook?: RateLimitHook;
  auditHook?: SecurityAuditHook;
}

function fail(res: Response, status: number, error: string) {
  return res.status(status).json({ status: "failed", error });
}

function requestProjectId(req: Request): string | null {
  const candidate = req.params?.projectId || req.header("x-tehqiq-project-id") || req.body?.projectId;
  return typeof candidate === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(candidate) ? candidate : null;
}

function approximateBodyBytes(body: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(body ?? null), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function createAuthenticatedProjectMiddleware(options: ProjectMiddlewareOptions): RequestHandler {
  const allowedRoles = options.allowedRoles || ALL_PROJECT_ROLES;
  const maxBodyBytes = options.maxBodyBytes ?? 1024 * 1024;

  return async (request: Request, response: Response, next: NextFunction) => {
    const req = request as AuthenticatedProjectRequest;
    const authorization = req.header("authorization") || "";
    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!match) return fail(response, 401, "Firebase ID token required.");

    if (approximateBodyBytes(req.body) > maxBodyBytes) {
      return fail(response, 413, "Request body exceeds this endpoint's size limit.");
    }

    let decoded: DecodedFirebaseActor;
    let services: AdminSecurityServices;
    try {
      services = options.getAdminServices();
      decoded = await services.adminAuth.verifyIdToken(match[1]);
    } catch (error) {
      const unavailable = String((error as Error)?.message || "").includes("Not Configured");
      return fail(response, unavailable ? 503 : 401, unavailable ? "Authentication service is Not Configured." : "Invalid or expired Firebase ID token.");
    }

    if (!decoded.uid) return fail(response, 401, "Invalid or expired Firebase ID token.");
    const email = typeof decoded.email === "string" && decoded.email.trim() ? decoded.email.trim() : null;
    if (options.requireEmail && !email) return fail(response, 403, "Authenticated email claim required.");

    const projectId = requestProjectId(req);
    if (!projectId) return fail(response, 400, "A valid projectId is required.");

    try {
      const projectRef = services.adminDb.collection("projects").doc(projectId);
      const snapshot = await projectRef.get();
      if (!snapshot.exists) return fail(response, 404, "Project not found.");
      const project: Record<string, unknown> = { id: snapshot.id, ...(snapshot.data() || {}) };
      const members = project.members && typeof project.members === "object"
        ? project.members as Record<string, unknown>
        : {};
      const role = (project.ownerUid === decoded.uid ? "Owner" : members[decoded.uid]) as ProjectRole | undefined;
      if (!role || !ALL_PROJECT_ROLES.includes(role)) return fail(response, 403, "Project membership required.");
      if (!allowedRoles.includes(role)) return fail(response, 403, "Project role is not authorized for this operation.");

      if (options.rateLimitHook) {
        const allowed = await options.rateLimitHook({ actorUid: decoded.uid, projectId, route: req.path, now: Date.now() });
        if (!allowed) return fail(response, 429, "Request rate limit exceeded. Retry later.");
      }

      req.projectAuth = { actor: { uid: decoded.uid, email }, projectId, role, project, projectRef };
      if (options.auditHook) {
        response.once("finish", () => {
          void Promise.resolve(options.auditHook!({
            actorUid: decoded.uid,
            projectId,
            role,
            method: req.method,
            route: req.path,
            statusCode: response.statusCode,
            completedAt: new Date().toISOString(),
          })).catch(() => undefined);
        });
      }
      return next();
    } catch (error) {
      console.error("Server authorization lookup failed:", error);
      return fail(response, 503, "Project authorization service unavailable.");
    }
  };
}

export function createInMemoryRateLimitHook(maxRequests: number, windowMs: number): RateLimitHook {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return ({ actorUid, projectId, route, now }) => {
    const key = `${actorUid}:${projectId}:${route}`;
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= maxRequests) return false;
    current.count += 1;
    return true;
  };
}

export function safeApiErrorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const bodyTooLarge = (error as { type?: string })?.type === "entity.too.large";
  if (bodyTooLarge) return fail(res, 413, "Request body exceeds the server size limit.");
  console.error("Unhandled API request error:", error);
  return fail(res, 500, "Request failed safely.");
}
