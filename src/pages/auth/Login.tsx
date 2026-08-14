import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AppBackground } from "@/components/layout/AppBackground";
import { Loader2, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/ui/Logo";
import { AUTH_CONFIG, isSocialLoginEnabled } from "@/config/authConfig";
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  const { user, loginAsDemo } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/workspace');
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get("invite_id");
    const emailParam = params.get("email");

    if (inviteId) {
      localStorage.setItem("pending_invite_id", inviteId);
    }
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
    }
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");
    
    console.log("Submitting login with:", formData.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
      options: {
        captchaToken: captchaToken || undefined,
      }
    });

    console.log("Supabase login data:", data);
    console.log("Supabase login error:", error);

    if (error) {
      setIsLoading(false);
      setStatus("error");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);

      const errMessage = error.message?.toLowerCase() || "";
      let finalMsg = error.message;

      if (errMessage.includes("captcha")) {
        finalMsg = "Captcha verification required or token expired. Please complete the security check below.";
      }

      setErrorMessage(finalMsg);
      return;
    }

    setIsLoading(false);
    setStatus("success");
    setTimeout(() => {
      navigate('/workspace');
    }, 1000);
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/workspace`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setIsLoading(false);
      setStatus("error");
      setErrorMessage(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <AppBackground>
      <div className="flex flex-col items-center mb-8">
        <Logo size="lg" showText={false} className="mb-4" />
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          Welcome back
        </h2>
        <p className="text-sm text-slate-400">
          Sign in to your Vivexa workspace
        </p>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Subtle top border highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {status === "error" && errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-3">
            <p className="font-medium">{errorMessage}</p>
            <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
              <span className="text-xs text-slate-400">Locked out or testing auth?</span>
              <button
                type="button"
                onClick={() => loginAsDemo()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-bold transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Enter Workspace as Demo Admin
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-slate-700 bg-slate-950/50 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-slate-900"
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none text-slate-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me for 30 days
            </label>
          </div>

          <div className="flex flex-col items-center justify-center my-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Security Check (hCaptcha)</span>
            </div>
            <HCaptcha
              ref={captchaRef}
              sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => {
                setCaptchaToken(null);
                setErrorMessage("Captcha verification failed. Please try again.");
              }}
              theme="dark"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !captchaToken}
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
              ) : status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute flex items-center justify-center"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Sign in
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>

        {isSocialLoginEnabled() && (
          <>
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className={`mt-6 grid ${AUTH_CONFIG.googleEnabled && AUTH_CONFIG.githubEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {AUTH_CONFIG.googleEnabled && (
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                  </svg>
                  Google
                </button>
              )}
              {AUTH_CONFIG.githubEnabled && (
                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </button>
              )}
            </div>
          </>
        )}
      </div>
      
      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Create a workspace
        </Link>
      </p>
    </AppBackground>
  );
}
