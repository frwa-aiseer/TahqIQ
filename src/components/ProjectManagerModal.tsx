import React, { useState, useEffect } from "react";
import { ProjectState, ProjectRole, ResearchProjectType } from "../types";
import {
  getUserProjects,
  createProjectInFirestore,
  archiveProjectInFirestore,
  deleteProjectInFirestore,
  updateMemberRoleInFirestore,
  saveProjectToFirestore
} from "../lib/projectService";
import { useAuth } from "../context/AuthContext";
import {
  Folder,
  Plus,
  Archive,
  Trash2,
  Edit2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  FileSpreadsheet,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectState;
  onSelectProject: (proj: ProjectState) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSelectProject,
}) => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "members">("list");
  const [projectsList, setProjectsList] = useState<ProjectState[]>([]);
  const [filter, setFilter] = useState<"active" | "archived" | "deleted">("active");
  const [loading, setLoading] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newProjectType, setNewProjectType] = useState<ResearchProjectType>("Randomized controlled trial");
  const [newDiscipline, setNewDiscipline] = useState("Sports Science & Biomechanics");
  const [newSubdiscipline, setNewSubdiscipline] = useState("");

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamedTitle, setRenamedTitle] = useState("");

  // New Member state
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectRole>("Co-author");

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    const projs = await getUserProjects(user.uid);
    setProjectsList(projs);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);

    const uid = user?.uid || `user-${Date.now()}`;
    const email = user?.email || "researcher@local";

    const created = await createProjectInFirestore(
      {
        title: newTitle,
        projectType: newProjectType,
        discipline: newDiscipline,
        subdiscipline: newSubdiscipline,
      },
      uid,
      email,
      userProfile?.displayName,
      userProfile?.organizationId
    );

    setNewTitle("");
    setLoading(false);
    onSelectProject(created);
    onClose();
  };

  const handleRename = async (proj: ProjectState) => {
    if (!renamedTitle.trim() || !user) return;
    const updated = { ...proj, title: renamedTitle };
    await saveProjectToFirestore(updated, user.uid, user.email || "");
    setRenamingId(null);
    loadProjects();
    if (currentProject.id === proj.id) {
      onSelectProject(updated);
    }
  };

  const handleArchiveToggle = async (proj: ProjectState) => {
    if (!user) return;
    const nextState = !proj.isArchived;
    await archiveProjectInFirestore(proj.id, nextState, user.uid, user.email || "");
    loadProjects();
    if (currentProject.id === proj.id) {
      onSelectProject({ ...proj, isArchived: nextState });
    }
  };

  const handleDelete = async (proj: ProjectState) => {
    if (!user) return;
    if (confirm(`Are you sure you want to move '${proj.title}' to the trash?`)) {
      await deleteProjectInFirestore(proj.id, true, user.uid, user.email || "");
      loadProjects();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim() || !user) return;
    const dummyUid = `uid-${memberEmail.replace(/[^a-zA-Z0-9]/g, "")}`;
    await updateMemberRoleInFirestore(
      currentProject.id,
      dummyUid,
      memberEmail,
      memberRole,
      user.uid,
      user.email || ""
    );
    setMemberEmail("");
    loadProjects();
  };

  const filteredProjects = projectsList.filter((p) => {
    if (filter === "archived") return p.isArchived && !p.isDeleted;
    if (filter === "deleted") return p.isDeleted;
    return !p.isArchived && !p.isDeleted;
  });

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-modal-title"
        className="bg-white border border-stone-200 text-stone-900 max-w-3xl w-full rounded-2xl p-6 shadow-xl relative space-y-5 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5 shrink-0">
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-5 h-5 text-[#053B2E]" />
            <h2 id="manager-modal-title" className="text-base font-semibold text-stone-900">Project Workspaces & Governance</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-stone-500 hover:text-stone-800 text-xs font-medium bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition"
          >
            Close
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center space-x-2 border-b border-stone-100 pb-2 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
              activeTab === "list" ? "bg-[#053B2E] text-white shadow-2xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>My Projects ({projectsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
              activeTab === "create" ? "bg-[#053B2E] text-white shadow-2xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
              activeTab === "members" ? "bg-[#053B2E] text-white shadow-2xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Project Team</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === "list" && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setFilter("active")}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    filter === "active" ? "bg-stone-200 text-stone-900 font-semibold" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Active Projects
                </button>
                <button
                  onClick={() => setFilter("archived")}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    filter === "archived" ? "bg-stone-200 text-stone-900 font-semibold" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Archived
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-stone-500 text-xs flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#053B2E]" />
                  <span>Loading projects...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="bg-stone-50 p-8 rounded-xl border border-stone-200/80 text-center space-y-2">
                  <p className="text-xs font-semibold text-stone-700">No {filter} projects found in your workspace.</p>
                  <p className="text-xs text-stone-500">Create a new project or select the demonstration project.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredProjects.map((proj) => {
                    const isCurrent = proj.id === currentProject.id;
                    const isRenaming = renamingId === proj.id;
                    const userRole = (user && proj.members?.[user.uid]) || proj.userRole || "Owner";

                    return (
                      <div
                        key={proj.id}
                        className={`bg-white p-4 rounded-xl border transition flex items-center justify-between ${
                          isCurrent ? "border-[#053B2E] shadow-2xs" : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="space-y-1 max-w-lg">
                          {isRenaming ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={renamedTitle}
                                onChange={(e) => setRenamedTitle(e.target.value)}
                                className="bg-stone-50 border border-stone-200 px-3 py-1 rounded-lg text-xs text-stone-900"
                              />
                              <button
                                onClick={() => handleRename(proj)}
                                className="bg-[#053B2E] text-white text-xs px-3 py-1 rounded-lg font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setRenamingId(null)}
                                className="text-stone-500 text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-stone-900 text-xs">{proj.title}</h3>
                              {isCurrent && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                  Active
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-3 text-[11px] text-stone-500">
                            <span>{proj.projectType}</span>
                            <span>•</span>
                            <span>Role: <strong className="text-stone-800">{userRole}</strong></span>
                            <span>•</span>
                            <span>v{proj.version || 1}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1.5">
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                onSelectProject(proj);
                                onClose();
                              }}
                              className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                            >
                              Open
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRenamingId(proj.id);
                              setRenamedTitle(proj.title);
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition"
                            title="Rename Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveToggle(proj)}
                            className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 hover:text-amber-800 transition"
                            title={proj.isArchived ? "Unarchive" : "Archive"}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(proj)}
                            className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 hover:text-rose-700 transition"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "create" && (
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Neuromuscular Adaptations to High-Intensity Interval Sprinting"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Research Project Methodology Type</label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value as ResearchProjectType)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                >
                  <option value="Randomized controlled trial">Randomized Controlled Trial</option>
                  <option value="Crossover study">Crossover Study</option>
                  <option value="Systematic review">Systematic Review</option>
                  <option value="Cohort study">Cohort Study</option>
                  <option value="Original quantitative research">Original Quantitative Research</option>
                  <option value="Original qualitative research">Original Qualitative Research</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Discipline</label>
                  <input
                    type="text"
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Subdiscipline</label>
                  <input
                    type="text"
                    value={newSubdiscipline}
                    onChange={(e) => setNewSubdiscipline(e.target.value)}
                    placeholder="e.g. Electromyography"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs py-2.5 rounded-lg transition shadow-2xs"
              >
                {loading ? "Creating Project Workspace..." : "Create Project Workspace"}
              </button>
            </form>
          )}

          {activeTab === "members" && (
            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h3 className="font-semibold text-stone-900 text-xs">Current Project Team Members ({currentProject.memberList?.length || 1})</h3>
                <div className="space-y-2">
                  {(currentProject.memberList || [
                    {
                      uid: user?.uid || "owner-1",
                      email: user?.email || "owner@tehqiq.edu",
                      role: currentProject.userRole || "Owner",
                      joinedAt: currentProject.createdAt,
                    },
                  ]).map((m) => (
                    <div key={m.uid} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200 text-xs">
                      <div>
                        <span className="font-medium text-stone-900">{m.email}</span>
                        <span className="text-[10px] text-stone-500 ml-2">Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddMember} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h3 className="font-semibold text-stone-900 text-xs">Invite Team Member & Assign Role</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="coauthor@university.edu"
                    className="col-span-2 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900"
                  />
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as ProjectRole)}
                    className="bg-white border border-stone-200 rounded-lg px-2 py-2 text-xs text-stone-900"
                  >
                    <option value="Corresponding Author">Corresponding Author</option>
                    <option value="Co-author">Co-author</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Statistician">Statistician</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
                >
                  Invite & Assign Role
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
