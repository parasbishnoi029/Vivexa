import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AppBackground } from "@/components/layout/AppBackground";
import { Loader2, CheckCircle2, AlertTriangle, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkSessionAndHash() {
      try {
        // 1. Check URL hash or search params for errors (e.g. #error=access_denied&error_description=...)
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);

        const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
        const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
        const error = hashParams.get('error') || searchParams.get('error');

        if (error || errorDesc) {
          if (isMounted) {
            setHasValidSession(false);
            setSessionError(decodeURIComponent(errorDesc || error || "The password reset link is invalid or has expired. Please request a new recovery link."));
            setIsVerifyingSession(false);
          }
          return;
        }

        // 2. Check for hash access_token / refresh_token or PKCE code
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          console.log("[RESET PASSWORD] Setting recovery session from hash tokens...");
          const { data: setRes, error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (!setErr && setRes?.session) {
            if (isMounted) {
              setHasValidSession(true);
              setSessionError(null);
              setIsVerifyingSession(false);
            }
          }
        }

        const code = searchParams.get('code');
        if (code) {
          console.log("[RESET PASSWORD] Exchanging authorization code for session...");
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error("[RESET PASSWORD] Code exchange failed:", exchangeErr);
          }
        }

        // 3. Listen for auth state change (e.g. PASSWORD_RECOVERY event)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("[RESET PASSWORD] Auth state changed:", event, !!session);
          if (event === 'PASSWORD_RECOVERY' || session) {
            if (isMounted) {
              setHasValidSession(true);
              setSessionError(null);
              setIsVerifyingSession(false);
            }
          }
        });

        // 4. Check active session directly
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if access_token or type=recovery exists in hash fragment
        const hasAccessTokenInHash = window.location.hash.includes('access_token=') || window.location.hash.includes('type=recovery');

        if (session || hasAccessTokenInHash) {
          if (isMounted) {
            setHasValidSession(true);
            setSessionError(null);
            setIsVerifyingSession(false);
          }
        } else {
          // Give Supabase client a brief moment to process hash tokens
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (isMounted) {
              if (retrySession) {
                setHasValidSession(true);
                setSessionError(null);
              } else {
                setHasValidSession(false);
                setSessionError("No active recovery session found. Your password reset link may have expired or is invalid. Please request a new link.");
              }
              setIsVerifyingSession(false);
            }
          }, 800);
        }

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err: any) {
        if (isMounted) {
          setHasValidSession(false);
          setSessionError(err.message || "Unable to verify password reset session.");
          setIsVerifyingSession(false);
        }
      }
    }

    checkSessionAndHash();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    if (password.length < 6) {
      setStatus("error");
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match. Please enter matching passwords.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      setIsLoading(false);

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
      } else {
        setStatus("success");
        toast.success("Password updated successfully! Redirecting to sign in...");
        
        // Sign out to enforce clean login with new credentials
        await supabase.auth.signOut();
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred while updating your password.");
    }
  };

  return (
    <AppBackground>
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-2xl shadow-inner border border-indigo-500/30 mb-6">
          V
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          Update password
        </h2>
        <p className="text-sm text-slate-400">
          Set a secure new password for your Vivexa account.
        </p>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 rounded-2xl shadow-2xl p-8 relative overflow-hidden max-w-md w-full mx-auto">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {isVerifyingSession ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
            <p className="text-sm text-slate-400">Verifying password reset security token...</p>
          </div>
        ) : !hasValidSession ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Invalid or Expired Link</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {sessionError || "Your password recovery link is invalid or has expired. Recovery links can only be used once."}
            </p>
            <div className="w-full space-y-3">
              <Link
                to="/forgot-password"
                className="w-full flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-all"
              >
                Request new reset link
              </Link>
              <Link
                to="/login"
                className="w-full flex h-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Password Updated!</h3>
            <p className="text-sm text-slate-400 mb-6">
              Your account password has been reset successfully. Redirecting you to sign in...
            </p>
            <Link
              to="/login"
              className="w-full flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-all"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === "error" && errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 pr-10 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full relative flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute flex items-center justify-center"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Update password
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
        </Link>
      </div>
    </AppBackground>
  );
}
