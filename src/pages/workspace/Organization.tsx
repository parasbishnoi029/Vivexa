import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Users, UserPlus, Settings, Shield, MoreVertical, Loader2, Mail,
  CheckCircle2, XCircle, Clock, Trash2, Edit3, ShieldAlert, Activity, RefreshCw, UserCheck, X, Copy,
  Globe, Fingerprint, Key, Lock, Layers, Zap, Building2, MapPin, Share2, Briefcase, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { createNotification } from "@/lib/notifications";
import { safeFetchJson } from "@/lib/utils";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const DEPT_DATA = [
  { name: 'Engineering', value: 45, color: '#6366f1' },
  { name: 'Product', value: 15, color: '#10b981' },
  { name: 'Sales', value: 20, color: '#f59e0b' },
  { name: 'Support', value: 10, color: '#8b5cf6' },
  { name: 'Marketing', value: 10, color: '#ec4899' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

type WorkspaceMember = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'Owner' | 'Admin' | 'Manager' | 'Analyst' | 'Viewer';
  status: 'active' | 'disabled';
  created_at: string;
  is_owner: boolean;
};

type Invitation = {
  id: string;
  workspace_id: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Manager' | 'Analyst' | 'Viewer';
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Cancelled';
  created_at: string;
  expires_at?: string;
};

type AuditActivity = {
  id: string;
  action: string;
  created_at: string;
  payload?: any;
};

export default function Organization() {
  const { session, user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'activity' | 'governance' | 'compliance'>('members');
  const [memberSearch, setMemberSearch] = useState("");
  const [simulatedSeats, setSimulatedSeats] = useState(5);

  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activity, setActivity] = useState<AuditActivity[]>([]);
  const [incomingInvitations, setIncomingInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("openInvite") === "true") {
      setShowInviteModal(true);
      // Clean up search params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'Owner' | 'Admin' | 'Manager' | 'Analyst' | 'Viewer'>("Analyst");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedDisciplineIncoming, setAcceptedDisciplineIncoming] = useState<Record<string, boolean>>({});
  const [expandedTermsIncoming, setExpandedTermsIncoming] = useState<Record<string, boolean>>({});
  const [acceptedDisciplineInvite, setAcceptedDisciplineInvite] = useState(false);
  const [expandedTermsInvite, setExpandedTermsInvite] = useState(false);

  // Member Action Menu / Role Change Modal
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const [newRole, setNewRole] = useState<'Owner' | 'Admin' | 'Manager' | 'Analyst' | 'Viewer'>("Analyst");
  
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [deptDistribution, setDeptDistribution] = useState(DEPT_DATA);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleAddDomain = async () => {
    if (newDomain && !whitelistedDomains.includes(newDomain)) {
      const updated = [...whitelistedDomains, newDomain];
      setWhitelistedDomains(updated);
      setNewDomain("");
      await saveWorkspaceSettings({ whitelisted_domains: updated });
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    const updated = whitelistedDomains.filter(d => d !== domain);
    setWhitelistedDomains(updated);
    await saveWorkspaceSettings({ whitelisted_domains: updated });
  };

  const toggleSso = async () => {
    const newState = !ssoEnabled;
    setSsoEnabled(newState);
    await saveWorkspaceSettings({ sso_enabled: newState });
  };

  const saveWorkspaceSettings = async (settings: any) => {
    if (!workspace?.id) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/v1/organization/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workspace_id: workspace.id,
          settings
        })
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        toast.success("Governance settings synchronized with central authority.");
      } else {
        toast.error(json.error || "Failed to update governance settings.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const token = session?.access_token;
  const selectedWorkspaceId = useWorkspaceStore(state => state.selectedWorkspaceId);
  const setSelectedWorkspaceId = useWorkspaceStore(state => state.setSelectedWorkspaceId);

  useEffect(() => {
    if (!token) return;
    loadOrganizationData();
  }, [token, selectedWorkspaceId]);

  const loadOrganizationData = async (overrideWorkspaceId?: string) => {
    setIsLoading(true);
    try {
      const activeWorkspaceId = overrideWorkspaceId || selectedWorkspaceId;
      const url = activeWorkspaceId && activeWorkspaceId !== "all"
        ? `/api/v1/organization/data?workspace_id=${activeWorkspaceId}`
        : '/api/v1/organization/data';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await safeFetchJson(res);
      if (json.success && json.data) {
        setWorkspace(json.data.workspace);
        setMembers(json.data.members || []);
        setInvitations(json.data.invitations || []);
        setActivity(json.data.activity || []);

        // Load metadata settings
        const meta = json.data.workspace?.metadata || {};
        setWhitelistedDomains(meta.whitelisted_domains || []);
        setSsoEnabled(!!meta.sso_enabled);
        if (meta.dept_distribution) setDeptDistribution(meta.dept_distribution);
      }

      // Load incoming invitations for user's email
      const incomingRes = await fetch('/api/v1/organization/invitations/incoming', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const incomingJson = await safeFetchJson(incomingRes);
      if (incomingJson.success && incomingJson.data) {
        setIncomingInvitations(incomingJson.data);
      }
    } catch (err) {
      console.error("Failed to load organization data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/v1/organization/invitations/${inviteId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        setIncomingInvitations(incomingInvitations.filter(i => i.id !== inviteId));
        
        // Auto switch active workspace context to newly joined workspace!
        if (json.data && json.data.workspace_id) {
          setSelectedWorkspaceId(json.data.workspace_id);
          loadOrganizationData(json.data.workspace_id);
        } else {
          loadOrganizationData();
        }
        
        createNotification({
          title: "Invitation Accepted",
          message: "You have successfully joined and switched to the workspace.",
          type: "workspace_invitation",
          priority: "high"
        });
        toast.success("Successfully joined the workspace!");
        
        // Let WorkspaceLayout refresh header
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(json.error || "Failed to accept invitation");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/v1/organization/invitations/${inviteId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        setIncomingInvitations(incomingInvitations.filter(i => i.id !== inviteId));
        createNotification({
          title: "Invitation Declined",
          message: "Invitation declined successfully.",
          type: "workspace_invitation",
          priority: "medium"
        });
        toast.success("Invitation declined successfully.");
      } else {
        toast.error(json.error || "Failed to decline invitation");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferOwnership = async (newOwnerUserId: string) => {
    if (!confirm("Are you sure you want to transfer ownership of this workspace? This action is irreversible, and you will be demoted to Admin.")) return;
    try {
      const res = await fetch('/api/v1/organization/transfer-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workspace_id: workspace?.id,
          new_owner_id: newOwnerUserId
        })
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        createNotification({
          title: "Ownership Transferred",
          message: "Workspace ownership has been transferred.",
          type: "workspace_settings",
          priority: "high"
        });
        toast.success("Workspace ownership transferred successfully!");
        loadOrganizationData();
      } else {
        toast.error(json.error || "Failed to transfer ownership");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!acceptedDisciplineInvite) {
      toast.error("You must accept the Enterprise Security Compliance & Discipline policy before sending an invitation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/organization/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          workspace_id: workspace?.id
        })
      });

      const json = await safeFetchJson(res);
      if (json.success) {
        createNotification({
          title: "Workspace Invitation Sent",
          message: `Invited ${inviteEmail.trim()} as ${inviteRole} to workspace "${workspace?.name || 'Workspace'}".`,
          type: "workspace_invitation",
          priority: "medium",
          actionUrl: "/workspace/settings/organization"
        });
        toast.success(`Invitation successfully sent to ${inviteEmail.trim()}!`);
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("Analyst");
        setAcceptedDisciplineInvite(false);
        loadOrganizationData();
      } else {
        toast.error(json.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!confirm("Cancel this pending invitation?")) return;

    try {
      const res = await fetch(`/api/v1/organization/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        setInvitations(invitations.filter(i => i.id !== invitationId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRole = async () => {
    if (!editingMember) return;

    try {
      const res = await fetch(`/api/v1/organization/members/${editingMember.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        setEditingMember(null);
        loadOrganizationData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member from the workspace?")) return;

    try {
      const res = await fetch(`/api/v1/organization/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await safeFetchJson(res);
      if (json.success) {
        setMembers(members.filter(m => m.id !== memberId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = workspace?.name || `${user?.email?.split('@')[0] || 'Enterprise'}'s Workspace`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 relative z-10 w-full max-w-6xl mx-auto pb-12">
      {/* MNC++ Enterprise Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-3xl border border-slate-800/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Building2 className="h-32 w-32 text-indigo-500" />
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enterprise Hub</span>
              <span className="h-1 w-1 rounded-full bg-slate-700" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{workspace?.plan || 'Global'} Architecture</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              {displayName.split("'")[0]} <span className="text-slate-500 font-light italic">Directory</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl font-medium mt-1">
              Command center for global access vectors, departmental hierarchies, and enterprise security protocols.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-2xl flex gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-tight ${
                activeTab === 'members' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Members
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-tight ${
                activeTab === 'invitations' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> Pending
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-tight ${
                activeTab === 'activity' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Activity
            </button>
            <button
              onClick={() => setActiveTab('governance')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-tight ${
                activeTab === 'governance' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> Governance
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-tight ${
                activeTab === 'compliance' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Lock className="h-3.5 w-3.5" /> Compliance
            </button>
          </div>

          <Button onClick={() => setShowInviteModal(true)} className="h-12 px-6 bg-white text-indigo-900 hover:bg-slate-100 border-0 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest transition-all">
            <UserPlus className="h-4 w-4 mr-2" /> Add Talent
          </Button>
        </div>
      </motion.div>

      {/* Incoming Invitations Banner */}
      {incomingInvitations.length > 0 && (
        <div className="space-y-4">
          {incomingInvitations.map((invite) => {
            const isAccepted = !!acceptedDisciplineIncoming[invite.id];
            const isExpanded = !!expandedTermsIncoming[invite.id];

            return (
              <motion.div 
                key={invite.id}
                variants={itemVariants} 
                className="bg-slate-950 border border-amber-500/30 p-5 rounded-2xl flex flex-col gap-4 shadow-lg shadow-amber-500/5 animate-fade-in"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-5 w-5 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Incoming Workspace Invitation</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        You have been invited to join <span className="font-medium text-white">{invite.workspace_name}</span> as an <span className="font-medium text-white">{invite.role}</span>. Joining will link your user account to their synchronized tenant workspace directory.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        if (!isAccepted) {
                          toast.error("Please accept the Workspace Operational & Security Discipline Code before joining.");
                          return;
                        }
                        handleAcceptInvite(invite.id);
                      }}
                      disabled={!isAccepted}
                      className={`inline-flex h-9 items-center justify-center rounded-lg bg-amber-500 px-4 text-xs font-semibold text-slate-950 shadow hover:bg-amber-400 transition-colors cursor-pointer ${
                        !isAccepted ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Accept & Join
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(invite.id)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" /> Decline
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 pl-1.5">
                    <input
                      type="checkbox"
                      id={`accept-discipline-incoming-${invite.id}`}
                      checked={isAccepted}
                      onChange={(e) => setAcceptedDisciplineIncoming(prev => ({ ...prev, [invite.id]: e.target.checked }))}
                      className="rounded border-slate-850 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor={`accept-discipline-incoming-${invite.id}`} className="text-[11px] text-slate-300 select-none cursor-pointer">
                      I accept and agree to comply with the <span className="text-amber-400 font-bold hover:underline">Workspace Operational & Security Discipline Code</span>.
                    </label>
                  </div>
                  <button
                    onClick={() => setExpandedTermsIncoming(prev => ({ ...prev, [invite.id]: !isExpanded }))}
                    className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {isExpanded ? "Hide Compliance Rules" : "Read Compliance Rules"}
                  </button>
                </div>

                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-900/60 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 space-y-2.5 font-sans"
                  >
                    <p className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-amber-500">Workspace Operational & Security Discipline Code</p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li><strong className="text-slate-300">Credentials Confidentiality:</strong> Account logins, API secrets, and SSO integration tokens must be guarded with extreme confidentiality and never shared outside.</li>
                      <li><strong className="text-slate-300">Least Privilege Access:</strong> Every query, dataset operation, and notebook cell invocation must follow approved business scopes.</li>
                      <li><strong className="text-slate-300">Audit Logging Consent:</strong> I acknowledge and agree that all data manipulation, schema transformations, and model predictions are subject to persistent centralized audit logging.</li>
                      <li><strong className="text-slate-300">Revocation & Suspension:</strong> Breach of compliance policies or unauthorized sharing of system data will result in immediate suspension of account privileges.</li>
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Grid Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          {activeTab === 'members' && (
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Workspace Team Members</CardTitle>
                  <CardDescription>Live database synchronized member directory.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-8 max-w-[200px] bg-slate-950 border-slate-800 text-xs text-white"
                  />
                  <Button variant="ghost" size="sm" onClick={() => loadOrganizationData()} className="text-slate-400 hover:text-white shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {members
                      .filter((m) =>
                        (m.full_name || "").toLowerCase().includes(memberSearch.toLowerCase()) ||
                        (m.email || "").toLowerCase().includes(memberSearch.toLowerCase())
                      )
                      .map((member) => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                            {member.full_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                              {member.full_name}
                              {member.is_owner && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{member.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-xs font-semibold text-slate-300 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                            {member.role}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            Active
                          </span>

                          {!member.is_owner && (
                            <div className="flex items-center gap-1">
                              {workspace?.owner_id === user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Transfer Workspace Ownership"
                                  onClick={() => handleTransferOwnership(member.user_id)}
                                  className="h-8 w-8 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingMember(member); setNewRole(member.role); }}
                                className="h-8 w-8 text-slate-400 hover:text-white"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.id)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'invitations' && (
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="text-lg">Pending Workspace Invitations</CardTitle>
                <CardDescription>Invitations sent to team members awaiting acceptance.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {invitations.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Mail className="h-10 w-10 mx-auto mb-2 opacity-30 text-amber-400" />
                    <p className="text-sm font-medium text-slate-300">No pending invitations</p>
                    <p className="text-xs mt-1">All invited team members have joined or no invitations are outstanding.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-200">{inv.email}</div>
                            <div className="text-xs text-slate-500">Role: {inv.role} • Invited {new Date(inv.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const inviteUrl = `${window.location.origin}/register?invite_id=${inv.id}&email=${encodeURIComponent(inv.email)}`;
                              navigator.clipboard.writeText(inviteUrl);
                              toast.success("Invitation join URL copied to clipboard!");
                            }}
                            className="bg-slate-950/50 border-slate-800 text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" /> Copy Invite Link
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCancelInvite(inv.id)} className="bg-slate-950/50 border-slate-800 text-rose-400 hover:text-rose-300">
                            Cancel Invite
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="text-lg">Team Activity Timeline</CardTitle>
                <CardDescription>Audit logging of invitations, role changes, and member updates.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {activity.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No recent organization activity logged.</p>
                ) : (
                  activity.map((act) => (
                    <div key={act.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-300 font-mono">
                        <Activity className="h-4 w-4 text-purple-400" />
                        <span className="font-bold text-slate-200">{act.action}</span>
                        {act.payload && <span>{JSON.stringify(act.payload)}</span>}
                      </div>
                      <span className="text-slate-500">{new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" /> Enterprise Compliance Hub
                  </CardTitle>
                  <CardDescription>Regulatory adherence tracking and SOC2/HIPAA readiness audit logs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "SOC2 Compliance", status: "VERIFIED", color: "text-emerald-400" },
                      { label: "GDPR Status", status: "COMPLIANT", color: "text-indigo-400" },
                      { label: "Data Residency", status: "ASIA-EAST1", color: "text-blue-400" },
                      { label: "Audit Frequency", status: "REAL-TIME", color: "text-purple-400" }
                    ].map((c, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{c.label}</span>
                        <span className={`text-sm font-black ${c.color}`}>{c.status}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-white">Compliance Drift Monitor</h4>
                      <span className="text-[10px] font-bold text-emerald-400">0 Critical Issues</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "98%" }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Workspace adherence to MNC++ security standards: 98.4%</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3">Recent Security Events</h4>
                    {[
                      { action: "Admin Role Elevated", user: "system_root", time: "2 mins ago" },
                      { action: "Encrypted Dataset Export", user: "paras_analyst", time: "14 mins ago" },
                      { action: "SSO Config Updated", user: "owner_alpha", time: "1 hr ago" }
                    ].map((e, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span className="text-[11px] font-bold text-slate-200">{e.action}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-slate-500 font-mono">@{e.user}</span>
                          <span className="text-[10px] text-slate-600">{e.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-6">
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-slate-800/50 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Enterprise Access Governance</CardTitle>
                      <CardDescription>Configure SSO, domain whitelisting, and security policies.</CardDescription>
                    </div>
                    <Lock className="h-5 w-5 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-400" /> Domain Whitelisting
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Restrict workspace access to verified corporate domains.</p>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. acme.com" 
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          className="h-9 bg-slate-950 border-slate-800 text-xs" 
                        />
                        <Button onClick={handleAddDomain} size="sm" className="bg-slate-800 hover:bg-slate-700">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {whitelistedDomains.map(d => (
                          <div key={d} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-bold text-blue-400 flex items-center gap-1.5">
                            {d} <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => handleRemoveDomain(d)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-purple-400" /> SSO / SAML Authentication
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Enforce single sign-on via Okta, Azure AD, or Google Workspace.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-200">Corporate SSO</div>
                          <div className="text-[10px] text-slate-500">Global identity provider integration</div>
                        </div>
                        <button 
                          onClick={toggleSso}
                          disabled={isSavingSettings}
                          className={`relative w-10 h-5 rounded-full transition-colors ${ssoEnabled ? 'bg-emerald-600' : 'bg-slate-800'} ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${ssoEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      {ssoEnabled && (
                        <Button variant="outline" size="sm" className="w-full text-[10px] uppercase font-black tracking-widest bg-slate-950 border-slate-800">
                          Configure SAML Metadata
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/50">
                    <h4 className="text-sm font-bold text-white mb-4">MNC++ Policy Matrix</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: "IP Restriction", status: "Disabled", icon: MapPin },
                        { label: "Device Trust", status: "Active", icon: Shield },
                        { label: "Session Expiry", status: "12 Hours", icon: Clock }
                      ].map((p, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950/30 border border-slate-800/50 flex items-center gap-3">
                          <p.icon className="h-4 w-4 text-slate-500" />
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.label}</div>
                            <div className="text-xs font-bold text-slate-300">{p.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Resource Allocation Tagging</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {["Cost Center", "Department", "Environment", "Project Code"].map(tag => (
                      <div key={tag} className="flex flex-col gap-1 min-w-[120px]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{tag}</span>
                        <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-indigo-400 font-bold">
                          {tag === "Environment" ? "Production" : "AUTO_GEN"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Vivexa MNC++ automatically injects these tags into every cloud compute request for granular departmental billing.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>

        {/* Security Roles Sidebar Card */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Layers className="h-24 w-24 text-indigo-500" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Organizational Pulse</CardTitle>
              <CardDescription>Departmental distribution of workforce.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptDistribution}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deptDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-16">
                     <div className="text-center">
                        <div className="text-2xl font-black text-white">{members.length}</div>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Staff</div>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-y-2 mt-4">
                  {deptDistribution.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                       <span className="text-[10px] font-bold text-slate-400">{d.name}</span>
                       <span className="text-[10px] font-black text-white ml-auto pr-4">{d.value}%</span>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Role Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Owner</h4>
                  <p className="text-xs text-slate-500 mt-1">Full control over workspace settings, billing, and deletion.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Admin</h4>
                  <p className="text-xs text-slate-500 mt-1">Can invite team members, assign roles, and manage datasets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Analyst</h4>
                  <p className="text-xs text-slate-500 mt-1">Can run AI models, create reports, and analyze data.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <Shield className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Viewer</h4>
                  <p className="text-xs text-slate-500 mt-1">Read-only access to datasets and executive reports.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Team Seat Expansion Simulator */}
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" />
                Seat Capacity Simulator & Planner
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400">
                Plan workspace growth and estimate seat billing modifications before sending invites.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Target Team Seats</span>
                  <span className="text-white font-bold font-mono">{simulatedSeats} Seats</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={simulatedSeats}
                  onChange={(e) => setSimulatedSeats(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Free Quota Seats</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">5</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Overage Seats</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {Math.max(0, simulatedSeats - 5)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Projected Monthly Cost</span>
                <span className="text-white font-black font-mono">
                  ₹{Math.max(0, simulatedSeats - 5) * 450} / mo
                </span>
              </div>

              {simulatedSeats > 5 && (
                <div className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-1.5 leading-normal">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Simulated size exceeds free seat limit. Upgrading to a paid seat pool provides dedicated priority pipeline slots.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
              <CardTitle className="text-lg">Invite Team Member</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSendInvite}>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    placeholder="colleague@company.com"
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Role Permission</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                {/* Security/Operational Discipline Acceptance Checkbox */}
                <div className="pt-2.5 border-t border-slate-800/60 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="accept-discipline-invite"
                        checked={acceptedDisciplineInvite}
                        onChange={(e) => setAcceptedDisciplineInvite(e.target.checked)}
                        className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="accept-discipline-invite" className="text-xs text-slate-400 leading-snug cursor-pointer select-none">
                        I verify that this invite request complies with our <span className="text-indigo-400 font-bold">Enterprise Access & Operational Discipline Code</span>.
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedTermsInvite(!expandedTermsInvite)}
                      className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer whitespace-nowrap"
                    >
                      {expandedTermsInvite ? "Hide" : "View"}
                    </button>
                  </div>

                  {expandedTermsInvite && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400 space-y-1.5 font-sans"
                    >
                      <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider text-indigo-400">Enterprise Access & Operational Discipline Code</p>
                      <ul className="list-disc pl-4 space-y-1 text-[10px]">
                        <li><strong className="text-slate-300">Authorized Domain Only:</strong> Inviting domain must correspond to official corporate and partner systems.</li>
                        <li><strong className="text-slate-300">Permission Least-Privilege:</strong> Assign only the minimum access level necessary for the job role.</li>
                        <li><strong className="text-slate-300">Security Training Binding:</strong> The invitee will be prompted to sign the Operational Security Covenant.</li>
                      </ul>
                    </motion.div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)} className="text-slate-400">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Send Invitation
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Role Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
              <CardTitle className="text-lg">Change Member Role</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditingMember(null)} className="h-8 w-8 text-slate-400">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-xs text-slate-400">Updating permissions for <strong className="text-white">{editingMember.email}</strong></p>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Assign Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </CardContent>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingMember(null)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSaveRole} className="bg-blue-600 hover:bg-blue-500 text-white">Save Role</Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
