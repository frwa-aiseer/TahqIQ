import { ProjectRole } from "../types";

export interface RolePermissions {
  canEditMetadata: boolean;
  canManageMembers: boolean;
  canEditManuscript: boolean;
  canEditDatasets: boolean;
  canEditQuestionsAndCanvas: boolean;
  canEditSourcesAndClaims: boolean;
  canAddReviewerComments: boolean;
  canArchiveProject: boolean;
  canDeleteProject: boolean;
  isReadOnly: boolean;
}

export const ROLE_PERMISSIONS_MAP: Record<ProjectRole, RolePermissions> = {
  Owner: {
    canEditMetadata: true,
    canManageMembers: true,
    canEditManuscript: true,
    canEditDatasets: true,
    canEditQuestionsAndCanvas: true,
    canEditSourcesAndClaims: true,
    canAddReviewerComments: true,
    canArchiveProject: true,
    canDeleteProject: true,
    isReadOnly: false,
  },
  "Corresponding Author": {
    canEditMetadata: true,
    canManageMembers: true,
    canEditManuscript: true,
    canEditDatasets: true,
    canEditQuestionsAndCanvas: true,
    canEditSourcesAndClaims: true,
    canAddReviewerComments: true,
    canArchiveProject: false,
    canDeleteProject: false,
    isReadOnly: false,
  },
  "Co-author": {
    canEditMetadata: false,
    canManageMembers: false,
    canEditManuscript: true,
    canEditDatasets: false,
    canEditQuestionsAndCanvas: true,
    canEditSourcesAndClaims: true,
    canAddReviewerComments: true,
    canArchiveProject: false,
    canDeleteProject: false,
    isReadOnly: false,
  },
  Supervisor: {
    canEditMetadata: false,
    canManageMembers: false,
    canEditManuscript: true,
    canEditDatasets: false,
    canEditQuestionsAndCanvas: true,
    canEditSourcesAndClaims: true,
    canAddReviewerComments: true,
    canArchiveProject: false,
    canDeleteProject: false,
    isReadOnly: false,
  },
  Statistician: {
    canEditMetadata: false,
    canManageMembers: false,
    canEditManuscript: false,
    canEditDatasets: true,
    canEditQuestionsAndCanvas: false,
    canEditSourcesAndClaims: false,
    canAddReviewerComments: true,
    canArchiveProject: false,
    canDeleteProject: false,
    isReadOnly: false,
  },
  Reviewer: {
    canEditMetadata: false,
    canManageMembers: false,
    canEditManuscript: false,
    canEditDatasets: false,
    canEditQuestionsAndCanvas: false,
    canEditSourcesAndClaims: false,
    canAddReviewerComments: true,
    canArchiveProject: false,
    canDeleteProject: false,
    isReadOnly: true,
  },
  Viewer: {
    canEditMetadata: false,
    canManageMembers: false,
    canEditManuscript: false,
    canEditDatasets: false,
    canEditQuestionsAndCanvas: false,
    canEditSourcesAndClaims: false,
    canAddReviewerComments: false,
    canArchiveProject: false,
    canDeleteProject: false,
    isReadOnly: true,
  },
};

export function getRolePermissions(role: string): RolePermissions {
  const normalizeRole = (r: string): ProjectRole => {
    if (r === "Project Owner" || r === "Owner") return "Owner";
    if (r === "Corresponding Author") return "Corresponding Author";
    if (r === "Co-author") return "Co-author";
    if (r === "Research Supervisor" || r === "Supervisor") return "Supervisor";
    if (r === "Statistician") return "Statistician";
    if (r === "Literature Reviewer" || r === "Reviewer") return "Reviewer";
    return "Viewer";
  };

  const projectRole = normalizeRole(role);
  return ROLE_PERMISSIONS_MAP[projectRole];
}
