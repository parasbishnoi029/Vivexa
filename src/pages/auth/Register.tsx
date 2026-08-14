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

export default function Register() {
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
    firstName: "",
    lastName: "",
    company: "",
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
    
    console.log("Submitting with:", formData.email);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        captchaToken: captchaToken || undefined,
        emailRedirectTo: `${window.location.origin}/workspace`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          company: formData.company,
        }
      }
    });

    console.log("Supabase signup data:", data);
    console.log("Supabase signup error:", error);

    if (error) {
      setIsLoading(false);
      setStatus("error");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      const errMessage = error.message?.toLowerCase() || "";
      let finalErrorMessage = error.message || "An unexpected error occurred during signup.";

      // 1. Connection / Network Errors
      if (errMessage.includes("fetch") || errMessage.includes("network") || errMessage.includes("failed to fetch")) {
        finalErrorMessage = "Network connection failed. Please check your internet connection and try again.";
      }
      // 2. Rate Limit Issues
      else if (errMessage.includes("rate limit") || error.status === 429) {
        finalErrorMessage = "Too many sign-up attempts. Please wait a few moments before trying again.";
      }
      // 3. User Already Exists
      else if (errMessage.includes("already registered") || errMessage.includes("user already exists")) {
        console.log("Attempting automatic sign in due to existing account...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (!signInError && signInData.session) {
          setStatus("success");
          setTimeout(() => {
            navigate("/workspace");
          }, 1000);
          return;
        } else {
          finalErrorMessage = "An account with this email already exists. Please navigate to the login page and sign in.";
        }
      }
      // 4. Invalid Password / Authentication formatting
      else if (errMessage.includes("password")) {
        finalErrorMessage = "Invalid password format. Please ensure your password meets the security requirements.";
      }
      // 5. SMTP / Email Delivery
      else if (errMessage.includes("smtp") || errMessage.includes("email")) {
        console.error("🚨 EMAIL DELIVERY FAILED: Supabase encountered an SMTP or Email Service error.", error);
        finalErrorMessage = `Email Delivery Failed: ${error.message}. Please verify your Supabase SMTP settings.`;
      }

      setErrorMessage(finalErrorMessage);
      return;
    }

    setIsLoading(false);

    if (!error) {
      // User is logged in, trigger welcome email and redirect to workspace
      fetch("/api/v1/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, firstName: formData.firstName })
      }).catch(err => console.error("Failed to send welcome email:", err));
      
      setStatus("success");
      setTimeout(() => {
        navigate("/workspace");
      }, 1000);
    }
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
          Create workspace
        </h2>
        <p className="text-sm text-slate-400">
          Start analyzing data in minutes.
        </p>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Subtle top border highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {status === "error" && errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-3">
            <p className="font-medium">{errorMessage}</p>
            <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
              <span className="text-xs text-slate-400">Testing or experiencing auth issues?</span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="first-name" className="text-sm font-medium text-slate-300">
                  First name
                </label>
                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="last-name" className="text-sm font-medium text-slate-300">
                  Last name
                </label>
                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium text-slate-300">
                Company name
              </label>
              <input
                id="company"
                name="company"
                type="text"
                placeholder="Acme Inc."
                value={formData.company}
                onChange={handleChange}
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Work email
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
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            
            {/* Operational & Security Discipline Option */}
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
              <div className="flex items-start gap-2.5">
                <input
                  id="accept-discipline-reg"
                  type="checkbox"
                  required
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="accept-discipline-reg" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
                  I accept and agree to comply with the <span className="text-indigo-400 hover:underline font-bold">Workspace Operational & Security Discipline Code</span>, data handling regulations, and information security protocols.
                </label>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal pl-6">
                Required for enterprise workspace access control, data lineage integrity, and audit logging compliance.
              </p>
            </div>
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
                  Create account
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

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            By creating an account, you acknowledge that you have read and agree to Vivexa's <Link to="/terms" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Sign in
        </Link>
      </p>
    </AppBackground>
  );
}
