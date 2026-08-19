import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  BarChart3, 
  Database,
  Lock,
  RefreshCw,
  LogOut
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  workspace_id: string;
  workspace_name: string;
  organization_id?: string;
  expires_at?: string;
  is_valid: boolean;
  is_expired?: boolean;
  is_accepted?: boolean;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { setSelectedWorkspaceId } = useWorkspaceStore();

  const inviteId = searchParams.get("invite_id") || searchParams.get("id") || searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [validating, setValidating] = useState<boolean>(false);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Validate invitation on mount
  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      if (!inviteId) {
        if (isMounted) {
          setErrorMessage("No invitation token was provided. Please check the link sent to your email.");
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setValidating(true);
        // Persist token in case user needs to login or register first
        localStorage.setItem("pending_invite_id", inviteId);
        if (emailParam) {
          localStorage.setItem("pending_invite_email", emailParam);
        }

        const sessionResult = await supabase.auth.getSession();
        const token = sessionResult.data.session?.access_token;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/v1/organization/invitations/validate/${encodeURIComponent(inviteId)}`, {
          headers
        });
        const json = await res.json();

        if (!isMounted) return;

        if (json.success && json.data) {
          setInvitation(json.data);
          setErrorMessage(null);
        } else {
          const err = json.error || json.meta?.error || "This invitation link is invalid, expired, or has already been accepted.";
          setErrorMessage(err);
        }
      } catch (err: any) {
        console.error("Error validating invitation:", err);
        if (isMounted) {
          setErrorMessage("Failed to verify invitation. Please check your network connection and try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setValidating(false);
        }
      }
    }

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [inviteId, emailParam]);

  // Handle invitation acceptance for logged-in user
  const handleAccept = async () => {
    if (!inviteId) return;

    if (!user) {
      // Direct user to login or register
      navigate(`/login?invite_id=${encodeURIComponent(inviteId)}${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`);
      return;
    }

    setAccepting(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      if (!session) {
        toast.error("Your session has expired. Please sign in again.");
        navigate(`/login?invite_id=${encodeURIComponent(inviteId)}`);
        return;
      }

      const res = await fetch(`/api/v1/organization/invitations/${encodeURIComponent(inviteId)}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: inviteId })
      });

      const json = await res.json();

      if (json.success) {
        localStorage.removeItem("pending_invite_id");
        localStorage.removeItem("pending_invite_email");

        const targetWorkspaceId = json.data?.workspace_id || invitation?.workspace_id;
        if (targetWorkspaceId) {
          setSelectedWorkspaceId(targetWorkspaceId);
        }

        setIsSuccess(true);
        toast.success(json.data?.message || `Welcome to ${invitation?.workspace_name || "the workspace"}!`);

        setTimeout(() => {
          navigate("/workspace");
        }, 1200);
      } else {
        const errorMsg = json.error || json.meta?.error || "Failed to accept the invitation.";
        toast.error(errorMsg);
        setErrorMessage(errorMsg);
      }
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setAccepting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.info("Signed out. You can now sign in with the invited account.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">VIVEXA</span>
              <span className="block text-xs font-medium text-slate-400">Decision Intelligence Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Invite</span>
          </div>
        </div>

        {/* State 1: Loading / Validating */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Verifying Invitation</h3>
              <p className="text-xs text-slate-400">Authenticating access credentials and workspace policy...</p>
            </div>
          </div>
        )}

        {/* State 2: Success Confirmation */}
        {!loading && isSuccess && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Invitation Accepted</h2>
              <p className="text-sm text-slate-400">
                You have successfully joined <span className="font-semibold text-slate-200">{invitation?.workspace_name || "the workspace"}</span> as a <span className="font-semibold text-indigo-300">{invitation?.role || "Member"}</span>.
              </p>
            </div>
            <div className="w-full pt-4">
              <Button
                onClick={() => navigate("/workspace")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* State 3: Error / Invalid / Expired */}
        {!loading && !isSuccess && errorMessage && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Unable to Validate Invitation</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="w-full pt-4 space-y-3">
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl border border-slate-700 transition-all duration-200"
              >
                Sign In to Vivexa
              </Button>
              <div className="flex justify-center">
                <Link to="/" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* State 4: Valid Invitation Ready to Accept */}
        {!loading && !isSuccess && !errorMessage && invitation && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Workspace Collaboration</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                You're invited to join
              </h1>
              <p className="text-sm text-slate-400">
                You have been granted access to collaborate in the enterprise workspace below.
              </p>
            </div>

            {/* Workspace & Role Card */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Workspace</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {invitation.workspace_name}
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  {invitation.role}
                </div>
              </div>

              {invitation.department && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Department</span>
                  <span className="font-medium text-slate-200">{invitation.department}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Invited Email</span>
                <span className="font-mono text-slate-300">{invitation.email}</span>
              </div>

              {invitation.expires_at && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Valid Until</span>
                  </span>
                  <span>{new Date(invitation.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Capabilities Summary */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Capabilities Included</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                  <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>AI Dashboards & Charts</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live Dataset Explorer</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Decision Intelligence Copilot</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Real-time Semantic Metric Engine</span>
                </div>
              </div>
            </div>

            {/* Active User vs Non-logged-in User Acceptance Branch */}
            {user ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-slate-400">Signed in as: </span>
                      <span className="font-semibold text-slate-200">{user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    title="Sign out to switch accounts"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </button>
                </div>

                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {accepting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Joining Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept Invitation & Enter Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => navigate(`/register?invite_id=${encodeURIComponent(inviteId)}&email=${encodeURIComponent(invitation.email || emailParam)}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  <span>Create Account & Join</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => navigate(`/login?invite_id=${encodeURIComponent(inviteId)}&email=${encodeURIComponent(invitation.email || emailParam)}`)}
                  variant="outline"
                  className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700 font-medium py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Sign In with Existing Account
                </Button>
              </div>
            )}

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected by Vivexa Enterprise Access Control & Encryption</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
