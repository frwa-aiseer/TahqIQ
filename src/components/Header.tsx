import React, { useState } from "react";
import { ProjectState, TargetOutlet } from "../types";
import { INTEGRITY_NOTICE, tehqIQConfig } from "../config/tehqIQConfig";
import { useAuth } from "../context/AuthContext";
import { AutosaveState } from "../hooks/useAutosave";
import { getRolePermissions } from "../lib/permissions";
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  UserCheck,
  AlertTriangle,
  FolderOpen,
  User,
  CheckCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { JournalSelectorDropdown } from "./JournalSelectorDropdown";

interface HeaderProps {
  project: ProjectState;
  onSelectProject: (isDemo: boolean) => void;
  onOpenWizard: () => void;
  onOpenProjectManager: () => void;
  onOpenAuth: () => void;
  onSelectOutlet?: (outlet: TargetOutlet) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  autosaveState: AutosaveState;
  lastSavedTime: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onSelectProject,
  onOpenWizard,
  onOpenProjectManager,
  onOpenAuth,
  onSelectOutlet,
  activeTab,
  setActiveTab,
  autosaveState,
  lastSavedTime,
}) => {
  const [showIntegrityNoticeModal, setShowIntegrityNoticeModal] = useState(false);
  const { user, userProfile } = useAuth();

  const userRole = project.isDemoProject
    ? "Demo Viewer"
    : (user && project.members?.[user.uid]) || project.userRole || "Owner";

  const renderAutosaveBadge = () => {
    switch (autosaveState) {
      case "Saving":
        return (
          <div className="flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-2xl text-[11px] font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case "Saved":
        return (
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-2xl text-[11px] font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Saved {lastSavedTime ? `(${lastSavedTime})` : ""}</span>
          </div>
        );
      case "Offline":
        return (
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-2xl text-[11px] font-bold">
            <CloudOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </div>
        );
      case "Conflict":
        return (
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-2xl text-[11px] font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Version Conflict</span>
          </div>
        );
      case "Failed":
        return (
          <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-1 rounded-2xl text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Save Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white/95 text-stone-900 border-b border-stone-200/80 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      {/* Top Banner for Synthetic Demo Project */}
      {project.isDemoProject && (
        <div className="bg-emerald-900/10 text-emerald-950 border-b border-emerald-900/20 px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              <strong className="text-emerald-950 font-bold">Demonstration Mode Active:</strong> "Effect of a Structured Warm-Up on Semitendinosus Muscle Activation" — Synthetic benchmark data.
            </span>
          </div>
          <span className="bg-emerald-800/10 text-emerald-900 border border-emerald-800/20 text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono font-bold">
            Synthetic Benchmark Data
          </span>
        </div>
      )}

      {/* Email Verification Banner */}
      {user && !user.emailVerified && (
        <div className="bg-amber-500/10 text-amber-900 border-b border-amber-500/20 px-4 py-1 text-xs font-medium flex items-center justify-between">
          <span>Your institutional email ({user.email}) is not yet verified. Please verify your email to unlock full collaboration features.</span>
          <button onClick={onOpenAuth} className="underline font-bold text-amber-900 hover:text-black ml-2">
            Verify Email
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="w-9 h-9 rounded-xl bg-[#053B2E] text-amber-300 flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3v17M12 3C9.5 3 5 4.5 3 6v13c2-1.5 6.5-3 9-3m0-13c2.5 0 7 1.5 9 3v13c-2-1.5-6.5-3-9-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M12 7c-1.5-1-3.5-1.5-5-1.5M12 11c-1.5-1-3.5-1.5-5-1.5M12 15c-1.5-1-3.5-1.5-5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-2xl tracking-tight text-[#053B2E] leading-none">
                  TehqIQ
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wide mt-0.5">
                  Scholarly Research Engine
                </span>
              </div>
            </div>
          </div>

          {/* Project Switcher & Quick Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex bg-stone-100 border border-stone-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => onSelectProject(true)}
                className={`px-3 py-1 rounded-lg transition text-xs font-medium ${
                  project.isDemoProject
                    ? "bg-white text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Demo Project
              </button>
              <button
                onClick={onOpenProjectManager}
                className={`px-3 py-1 rounded-lg transition text-xs font-medium flex items-center space-x-1.5 ${
                  !project.isDemoProject
                    ? "bg-white text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-stone-500" />
                <span>My Projects</span>
              </button>
            </div>

            <button
              onClick={onOpenWizard}
              className="bg-[#053B2E] hover:bg-[#084D3C] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>New Project</span>
            </button>
          </div>

          {/* Autosave, Role Display, Journal & Auth Controls */}
          <div className="flex items-center space-x-3">
            {/* Autosave Indicator */}
            {renderAutosaveBadge()}

            {/* Journal / Conference Quick Selector Dropdown */}
            {onSelectOutlet && (
              <JournalSelectorDropdown
                selectedOutlet={project.selectedTargetOutlet}
                onSelectOutlet={onSelectOutlet}
                variant="header"
              />
            )}

            {/* User Auth Button */}
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition text-stone-700"
            >
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span>{user ? user.displayName?.split(" ")[0] || "Account" : "Sign In"}</span>
            </button>

            {/* Integrity Notice Icon */}
            <button
              onClick={() => setShowIntegrityNoticeModal(true)}
              className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition"
              title="Research Integrity Rules & Author Responsibility Notice"
            >
              <BookOpen className="w-4 h-4 text-emerald-800" />
            </button>
          </div>
        </div>
      </div>

      {/* Integrity Notice Modal */}
      {showIntegrityNoticeModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 max-w-xl w-full rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-[#053B2E]">
              <ShieldCheck className="w-6 h-6 shrink-0 text-[#053B2E]" />
              <h3 className="font-serif font-bold text-lg text-stone-900">TehqIQ Research Integrity Guidelines</h3>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 italic text-xs text-stone-700 leading-relaxed">
              "{INTEGRITY_NOTICE}"
            </div>
            <div className="text-xs text-stone-600 space-y-2">
              <p className="font-semibold text-stone-900">Key Operating Principles:</p>
              <ul className="list-disc pl-5 space-y-1 text-stone-700">
                <li>No fabricated citations, data, or p-values are ever generated.</li>
                <li>AI detector evasion or deceptive grammar modification is strictly prohibited.</li>
                <li>Final export requires explicit human corresponding-author approval.</li>
                <li>All AI assistance is logged in the immutable AI Ledger.</li>
              </ul>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowIntegrityNoticeModal(false)}
                className="bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition shadow-2xs"
              >
                I Acknowledge & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
