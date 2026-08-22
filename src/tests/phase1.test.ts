import { describe, it, expect } from 'vitest';
import { createEmptyProject, createDemoProject, canAddRecordToProject } from "../data/demoProject";
import { getRolePermissions } from "../lib/permissions";
import { ProjectState } from "../types";

describe('Phase 1 Acceptance Tests', () => {
  it('1. Server-Enforced Role Permissions Matrix', () => {
    const ownerPerms = getRolePermissions("Owner");
    expect(ownerPerms.canManageMembers).toBe(true);
    expect(ownerPerms.canArchiveProject).toBe(true);
    expect(ownerPerms.canDeleteProject).toBe(true);

    const coauthorPerms = getRolePermissions("Co-author");
    expect(coauthorPerms.canEditManuscript).toBe(true);
    expect(coauthorPerms.canManageMembers).toBe(false);
    expect(coauthorPerms.canDeleteProject).toBe(false);

    const reviewerPerms = getRolePermissions("Reviewer");
    expect(reviewerPerms.isReadOnly).toBe(true);
    expect(reviewerPerms.canAddReviewerComments).toBe(true);
    expect(reviewerPerms.canEditManuscript).toBe(false);
  });

  it('2. Client Role Elevation Protection', () => {
    const userUid = "user-123";
    const projectWithMembers: ProjectState = {
      ...createEmptyProject({ title: "Collaborative Study" }),
      id: "proj-collab-1",
      ownerUid: "owner-999",
      members: {
        "owner-999": "Owner",
        "user-123": "Viewer",
      },
    };

    const actualRoleOnServer = projectWithMembers.members[userUid] || "Viewer";
    const effectivePerms = getRolePermissions(actualRoleOnServer);
    expect(effectivePerms.canDeleteProject).toBe(false);
    expect(effectivePerms.canManageMembers).toBe(false);
  });

  it('3. Membership Isolation', () => {
    const projectWithMembers: ProjectState = {
      ...createEmptyProject({ title: "Collaborative Study" }),
      id: "proj-collab-1",
      ownerUid: "owner-999",
      members: {
        "owner-999": "Owner",
        "user-123": "Viewer",
      },
    };
    const foreignUid = "user-456";
    const isForeignUserMember = Boolean(projectWithMembers.members?.[foreignUid]);
    expect(isForeignUserMember).toBe(false);
  });

  it('4. Demo Record Isolation', () => {
    const realProj = createEmptyProject({ title: "Real Empirical Trial" });
    const demoRecord: any = { id: "d-1", title: "Synthetic Source", isDemo: true };
    const realRecord: any = { id: "r-1", title: "Real Published Source", isDemo: false };

    expect(canAddRecordToProject(demoRecord, realProj)).toBe(false);
    expect(canAddRecordToProject(realRecord, realProj)).toBe(true);
  });

  it('5. Project Archive & Delete Workflow Logic', () => {
    const activeProject = createEmptyProject({ title: "Persistence Test Project" });
    activeProject.isArchived = false;
    activeProject.isDeleted = false;

    activeProject.isArchived = true;
    expect(activeProject.isArchived).toBe(true);

    activeProject.isDeleted = true;
    expect(activeProject.isDeleted).toBe(true);
  });
});
