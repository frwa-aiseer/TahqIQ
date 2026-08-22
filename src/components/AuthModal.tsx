import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, UserPlus, Mail, Lock, User, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, signInWithGoogle, signInWithEmail, signUpWithEmail, sendVerificationEmail, logout } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        setMessage("Account created successfully! A verification email has been sent.");
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      setError("Failed to send verification email. " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="bg-white border border-stone-200 text-stone-900 max-w-md w-full rounded-2xl p-6 shadow-xl relative space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-[#053B2E]" />
            <h2 id="auth-modal-title" className="text-base font-semibold text-stone-900">
              {user ? "Researcher Identity" : isSignUp ? "Create Scholar Account" : "Sign In to TehqIQ"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-stone-400 hover:text-stone-700 text-sm font-medium bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {user ? (
          /* Logged In User State */
          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#053B2E] flex items-center justify-center font-bold text-sm text-white">
                  {user.displayName?.[0] || user.email?.[0] || "U"}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 text-xs">{user.displayName || userProfile?.displayName || "Scholar"}</h3>
                  <p className="text-[11px] text-stone-500 font-mono">{user.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Organization:</span>
                  <span className="text-stone-800 font-mono text-[11px]">{userProfile?.organizationId || "Default Org"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Email Verification:</span>
                  {user.emailVerified ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Pending Verification</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!user.emailVerified && (
              <button
                onClick={handleResendVerification}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium py-2 rounded-lg transition flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Resend Verification Email</span>
              </button>
            )}

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                {message}
              </div>
            )}

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium py-2.5 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4 text-xs">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-stone-50 text-stone-800 font-medium text-xs py-2.5 px-4 rounded-lg border border-stone-200 flex items-center justify-center space-x-2.5 transition shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Sign-In</span>
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-wider text-stone-400">
                <span className="bg-white px-2">Or email authentication</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Dr. Jane Doe"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="researcher@university.edu"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#053B2E]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#053B2E] hover:bg-[#053B2E]/90 text-white font-medium text-xs py-2.5 rounded-lg transition shadow-2xs"
              >
                {loading ? "Processing..." : isSignUp ? "Create Scholar Account" : "Sign In"}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-xs text-[#053B2E] hover:underline font-medium"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need a scholar account? Register"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
