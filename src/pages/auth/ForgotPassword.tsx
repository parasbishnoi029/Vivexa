import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AppBackground } from "@/components/layout/AppBackground";
import { Loader2, CheckCircle2, ArrowLeft, ExternalLink, Copy, Check } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");
    setResetUrl(null);

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });

      const resJson = await response.json();
      setIsLoading(false);

      if (response.ok && resJson.success) {
        setStatus("success");
        if (resJson.data?.reset_url || resJson.reset_url) {
          setResetUrl(resJson.data?.reset_url || resJson.reset_url);
        }
      } else {
        setStatus("error");
        setErrorMessage(resJson.error || resJson.meta?.error || "Failed to send password reset email. Please try again.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  const copyResetUrl = () => {
    if (resetUrl) {
      navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppBackground>
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-2xl shadow-inner border border-indigo-500/30 mb-6">
          V
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          Reset password
        </h2>
        <p className="text-sm text-slate-400">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 rounded-2xl shadow-2xl p-8 relative overflow-hidden max-w-md w-full mx-auto">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        
        {status === "error" && errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed">
            {errorMessage}
          </div>
        )}

        {status === "success" ? (
          <div className="flex flex-col items-center py-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
            <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
              We've dispatched password recovery instructions to <span className="text-indigo-300 font-medium">{email}</span>. Please check your inbox or spam folder.
            </p>

            {resetUrl && (
              <div className="w-full mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    Testing Mode / Instant Access
                  </span>
                  <button
                    onClick={copyResetUrl}
                    type="button"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Click below to open the reset password screen directly:
                </p>
                <a
                  href={resetUrl}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-all shadow-sm"
                >
                  Proceed to Reset Password <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="w-full flex h-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
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
                    Send recovery email
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
