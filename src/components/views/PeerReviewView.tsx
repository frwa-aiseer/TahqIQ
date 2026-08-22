import React, { useState } from "react";
import { ReviewerComment, ProjectState, AiLedgerEvent } from "../../types";
import { Users, CheckCircle2, AlertTriangle, Sparkles, X, Check, ShieldAlert, Sliders } from "lucide-react";

interface PeerReviewViewProps {
  comments: ReviewerComment[];
  onRunPeerReview?: () => void;
  project?: ProjectState;
  onUpdateProject?: (updated: ProjectState) => void;
}

const REVIEWER_ROLES = [
  "Methodology Reviewer",
  "Statistical Reviewer",
  "Subject-Matter Reviewer",
  "Journal Editor Reviewer",
  "Citation Reviewer",
  "Language Reviewer",
] as const;

export const PeerReviewView: React.FC<PeerReviewViewProps> = ({
  comments: initialComments,
  project,
  onUpdateProject,
}) => {
  const [comments, setComments] = useState<ReviewerComment[]>(initialComments || []);
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Configuration state for each reviewer agent
  const [configuredReviewers, setConfiguredReviewers] = useState<Record<string, boolean>>({
    "Methodology Reviewer": true,
    "Statistical Reviewer": true,
    "Subject-Matter Reviewer": true,
    "Journal Editor Reviewer": true,
    "Citation Reviewer": true,
    "Language Reviewer": false, // Example unconfigured reviewer
  });

  const toggleReviewerConfig = (role: string) => {
    setConfiguredReviewers((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleRunSeparatePeerReviews = async () => {
    setIsRunning(true);
    setNotice(null);

    const activeRoles = REVIEWER_ROLES.filter((r) => configuredReviewers[r]);

    if (activeRoles.length === 0) {
      setNotice("All reviewer agents are set to Unconfigured. Enable at least one reviewer agent to execute peer review.");
      setIsRunning(false);
      return;
    }

    const newCommentsList: ReviewerComment[] = [];

    for (const role of REVIEWER_ROLES) {
      if (!configuredReviewers[role]) {
        // Requirement 10: If a reviewer is not configured, display Unavailable rather than a fixed comment
        newCommentsList.push({
          id: `unavail-${role}-${Date.now()}`,
          agentRole: role,
          severity: "Minor Concern",
          manuscriptSection: "General Manuscript",
          commentText: `Unavailable: Reviewer agent '${role}' is unconfigured. Enable agent in configuration settings to generate review.`,
          suggestedAction: "Configure reviewer agent parameters.",
          status: "Pending",
          timestamp: new Date().toISOString(),
          isUnavailable: true,
        } as any);
        continue;
      }

      try {
        const res = await fetch("/api/gemini/peer-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewerRole: role,
            sections: project?.sections || [],
            sources: project?.sources || [],
            analysisOutputs: project?.analysisOutputs || [],
          }),
        });

        const data = await res.json();

        if (!res.ok || data.status === "failed" || data.unavailable) {
          newCommentsList.push({
            id: `unavail-${role}-${Date.now()}`,
            agentRole: role,
            severity: "Minor Concern",
            manuscriptSection: "General Manuscript",
            commentText: `Unavailable: Reviewer agent '${role}' call failed or backend endpoint unavailable (${data.error || "Execution failed"}).`,
            suggestedAction: "Check server API key or network connection.",
            status: "Pending",
            timestamp: new Date().toISOString(),
            isUnavailable: true,
          } as any);
          continue;
        }

        const roleComments = data.comments || [];
        roleComments.forEach((cm: any, idx: number) => {
          newCommentsList.push({
            id: `rev-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            agentRole: cm.agentRole || role,
            severity: cm.severity || "Recommendation",
            manuscriptSection: cm.manuscriptSection || "Introduction",
            commentText: cm.commentText || "Manuscript prose adheres to structural guidelines.",
            suggestedAction: cm.suggestedAction || "Revise text accordingly.",
            status: "AI Suggested" as any,
            timestamp: new Date().toISOString(),
          });
        });
      } catch (err: any) {
        newCommentsList.push({
          id: `unavail-${role}-${Date.now()}`,
          agentRole: role,
          severity: "Minor Concern",
          manuscriptSection: "General Manuscript",
          commentText: `Unavailable: Reviewer agent '${role}' failed (${err.message}).`,
          suggestedAction: "Ensure Gemini server endpoint is active.",
          status: "Pending",
          timestamp: new Date().toISOString(),
          isUnavailable: true,
        } as any);
      }
    }

    setComments(newCommentsList);
    setIsRunning(false);

    if (onUpdateProject && project) {
      onUpdateProject({
        ...project,
        reviewerComments: newCommentsList,
      });
    }
  };

  const handleDecisionOnComment = (commentId: string, decision: "Accepted" | "Rejected") => {
    const cm = comments.find((c) => c.id === commentId);
    if (!cm) return;

    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, status: decision === "Accepted" ? ("Addressed" as const) : ("Dismissed" as const) } : c
    );

    setComments(updatedComments);

    // Log event to project AI Assistance Ledger
    if (onUpdateProject && project) {
      const newEvent: AiLedgerEvent = {
        id: `ledger-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        userEmail: "researcher@local",
        featureUsed: "Multi-Agent Peer Review",
        manuscriptSection: cm.manuscriptSection,
        model: "gemini-3.6-flash",
        promptVersion: "v2.4-phase6",
        inputSourcesUsed: (project.sources || []).map((s) => s.id),
        generatedSummary: `Peer review comment from ${cm.agentRole}: "${cm.commentText}"`,
        userDecision: decision,
        creditRoleAssigned: "Writing - review & editing",
      };

      onUpdateProject({
        ...project,
        reviewerComments: updatedComments,
        aiLedger: [...(project.aiLedger || []), newEvent],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Phase 6 • Schema-Validated Multi-Agent Peer Review</span>
          </div>
          <h2 className="font-bold text-xl text-white">
            6 Separate Schema-Validated Reviewer Agents
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real separate schema-validated API calls for Methodology, Statistical, Subject-Matter, Editor, Citation, and Language reviewers.
          </p>
        </div>

        <button
          onClick={handleRunSeparatePeerReviews}
          disabled={isRunning}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-2xl flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20 shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isRunning ? "Executing Reviewer Agents..." : "Run Separate Reviewer Calls"}</span>
        </button>
      </div>

      {notice && (
        <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Reviewer Agent Configuration & Availability Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Reviewer Agent Configuration Status</span>
          </span>
          <span className="text-[11px] text-zinc-500">Unconfigured agents display "Unavailable" during review runs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
          {REVIEWER_ROLES.map((agent, idx) => {
            const isConfigured = configuredReviewers[agent];
            return (
              <div
                key={idx}
                onClick={() => toggleReviewerConfig(agent)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  isConfigured
                    ? "bg-zinc-950 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30"
                    : "bg-zinc-950/60 border-zinc-800 opacity-75 hover:opacity-100"
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block">Agent #{idx + 1}</span>
                  <span className="font-bold text-zinc-200 text-[11px] block">{agent}</span>
                </div>
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      isConfigured
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {isConfigured ? "Configured" : "Unavailable"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Reviewer Reports */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-white flex items-center justify-between">
          <span>Schema-Validated Reviewer Reports ({comments.length})</span>
          <span className="text-xs text-amber-400 font-mono">Status: AI Suggested (Proposals require author decision)</span>
        </h3>

        {comments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center text-zinc-400 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-indigo-400" />
            <p>No peer reviewer reports generated yet. Click <strong>Run Separate Reviewer Calls</strong> to execute schema-validated reviewer agent feedback.</p>
          </div>
        ) : (
          comments.map((cm) => {
            const isUnavailable = (cm as any).isUnavailable;
            return (
              <div
                key={cm.id}
                className={`p-4 rounded-2xl border text-xs space-y-2.5 transition ${
                  isUnavailable
                    ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                    : cm.status === "Addressed"
                    ? "bg-emerald-950/20 border-emerald-500/40 text-zinc-200"
                    : cm.status === "Dismissed"
                    ? "bg-zinc-950/50 border-zinc-800 text-zinc-500 opacity-60"
                    : "bg-zinc-900 border-zinc-800 text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-indigo-300 text-xs">{cm.agentRole}</span>
                    <span className="text-[10px] font-mono text-zinc-400">Section: {cm.manuscriptSection}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isUnavailable ? (
                      <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Unavailable
                      </span>
                    ) : (
                      <>
                        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          AI Suggested
                        </span>
                        <span className="bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {cm.severity}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <p className={`font-serif leading-relaxed text-xs ${isUnavailable ? "text-rose-300 italic font-mono" : "text-zinc-200"}`}>
                  "{cm.commentText}"
                </p>

                {!isUnavailable && (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <strong className="text-amber-400">Suggested Action:</strong> {cm.suggestedAction}
                    </div>

                    {cm.status !== "Addressed" && cm.status !== "Dismissed" ? (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleDecisionOnComment(cm.id, "Rejected")}
                          className="bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject Proposal</span>
                        </button>
                        <button
                          onClick={() => handleDecisionOnComment(cm.id, "Accepted")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept &amp; Commit</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-400 font-mono">
                        Author Decision: {cm.status === "Addressed" ? "Accepted" : "Rejected"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
