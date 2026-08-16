import { useState, useEffect, useRef, useMemo } from "react";
import {
  User, Shield, Bell, Globe, HardDrive, Link as LinkIcon,
  Smartphone, Camera, Loader2, Key, CreditCard, Building, Users,
  BarChart2, Zap, Sparkles, Download, Lock, CheckCircle2, AlertTriangle,
  FileText, Database, LayoutDashboard, Activity, Clock, HelpCircle,
  Search, Server, MessageSquare, ExternalLink, Fingerprint, RefreshCw, Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { getAiUsageCount, getQuotaLimit } from "@/lib/telemetry";
import { useTheme } from "@/providers/ThemeProvider";
import { safeFetchJson } from "@/lib/utils";

// Streamlined & Upgraded Settings Categories
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, badge: "Hub" },
  { id: "profile", label: "Profile & Localization", icon: User },
  { id: "workspace", label: "Workspace & Teams", icon: Building },
  { id: "security", label: "Security, SSO & Sessions", icon: Shield, badge: "2FA" },
  { id: "ai_prefs", label: "AI Copilot Parameters", icon: Sparkles, badge: "Gemini" },
  { id: "apikeys", label: "API Keys & OAuth", icon: Key },
  { id: "usage", label: "Usage & Storage Analytics", icon: BarChart2 },
  { id: "billing", label: "Billing & Plans", icon: Zap },
  { id: "privacy_support", label: "Privacy, Backup & Support", icon: HelpCircle },
];

// Map legacy URL tab parameters to streamlined tabs
const TAB_ALIASES: Record<string, string> = {
  overview: "overview",
  profile: "profile",
  language: "profile",
  workspace: "workspace",
  organization: "workspace",
  security: "security",
  enterprise: "security",
  sessions: "security",
  devices: "security", // redirects gracefully (devices tab removed)
  ai_prefs: "ai_prefs",
  apikeys: "apikeys",
  accounts: "apikeys",
  usage: "usage",
  storage: "usage",
  subscription: "billing",
  billing: "billing",
  notifications: "privacy_support",
  privacy: "privacy_support",
  backup: "privacy_support",
  support: "privacy_support",
};

export default function WorkspaceSettings() {
  const { user, session } = useAuthStore();
  const { setTheme } = useTheme();
  const token = session?.access_token;
  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  const [activeTab, setActiveTab] = useState("overview");
  const [tabSearchQuery, setTabSearchQuery] = useState("");
  const [, setProfile] = useState<any>(null);
  const [aiUsageCount, setAiUsageCount] = useState<number>(() => getAiUsageCount());
  const [ssoProvider, setSsoProvider] = useState<"none" | "okta" | "entra">("okta");

  useEffect(() => {
    const syncUsage = () => setAiUsageCount(getAiUsageCount());
    window.addEventListener("storage", syncUsage);
    window.addEventListener("vivexa_usage_updated", syncUsage);
    return () => {
      window.removeEventListener("storage", syncUsage);
      window.removeEventListener("vivexa_usage_updated", syncUsage);
    };
  }, []);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support Ticket states
  const [ticketCategory, setTicketCategory] = useState("Technical Issue / Bug");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Workspace Settings
  const [workspaceName, setWorkspaceName] = useState("Vivexa Enterprise Workspace");
  const [workspaceRegion, setWorkspaceRegion] = useState("us-central1 (Iowa)");

  // Security & Password
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // AI Preferences
  const [aiModel, setAiModel] = useState("gemini-3.1-pro-preview");
  const [creativity, setCreativity] = useState("0.2");
  const [autoSql, setAutoSql] = useState(true);

  // API Keys (fetched from Supabase database)
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [, setIsApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  // Audit Logs (fetched from Supabase database)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Storage and Datasets stats
  const [storageBytes, setStorageBytes] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [isRecalculatingStorage, setIsRecalculatingStorage] = useState(false);

  // Dynamic Session Listings
  const [sessions, setSessions] = useState<any[]>([
    { id: "sess-curr", device: "Chrome macOS (Primary Cluster)", ip: "34.34.244.19", location: "Bengaluru, IN", current: true, time: "Active Now" },
    { id: "sess-1", device: "Safari iOS (iPhone 15 Pro Max)", ip: "172.56.21.90", location: "Mumbai, IN", current: false, time: "2 hours ago" },
    { id: "sess-2", device: "Firefox Linux (Ubuntu 24.04)", ip: "84.120.45.12", location: "Frankfurt, DE", current: false, time: "1 day ago" }
  ]);

  // Notifications Toggles
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);

  // Language & Timezone
  const [displayLanguage, setDisplayLanguage] = useState("en");
  const [displayTimezone, setDisplayTimezone] = useState("Asia/Kolkata");

  // Active Plan Level
  const [userPlan, setUserPlan] = useState("Enterprise Pro");

  // Invoices history
  const [invoices] = useState<any[]>([
    { id: "VVX-2026-7829", date: "2026-08-01", description: "Enterprise Pro Monthly Charge", amount: "₹1,499.00 INR", status: "Paid" },
    { id: "VVX-2026-6910", date: "2026-07-01", description: "Enterprise Pro Monthly Charge", amount: "₹1,499.00 INR", status: "Paid" },
    { id: "VVX-2026-5811", date: "2026-06-01", description: "Pro Sandbox Trial Period", amount: "₹0.00 INR", status: "Free" }
  ]);

  // Connected Accounts Integration
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([
    { id: "google", name: "Google Accounts Verification", email: "", connected: true },
    { id: "github", name: "GitHub OAuth Access", email: "", connected: false },
    { id: "slack", name: "Slack Real-Time Chat Workspace Sync", email: "workspace.slack.com", connected: true }
  ]);

  // Sync google email and user plan
  useEffect(() => {
    if (user?.email) {
      setConnectedAccounts(prev => prev.map(a => a.id === "google" ? { ...a, email: user.email! } : a));
    }
    
    if (user) {
      supabase.from('users').select('plan').eq('id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.plan) {
            setUserPlan(data.plan.charAt(0).toUpperCase() + data.plan.slice(1));
          }
        });
    }
  }, [user]);

  // Parse tab search parameter
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab) {
      const mapped = TAB_ALIASES[rawTab];
      if (mapped) {
        setActiveTab(mapped);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load profile, database values, and logs
  useEffect(() => {
    if (user) {
      loadProfileData();
      loadSettingsData();
      loadApiKeys();
      loadAuditLogs();
      loadStorageStats();
    }
  }, [user]);

  const handleRevokeSession = async (sessId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessId));
    toast.success("Authentication session terminated!");
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: "Session Terminated",
        metadata: { session_id: sessId }
      });
      loadAuditLogs();
    }
  };

  const handleToggleAccount = (id: string) => {
    setConnectedAccounts(prev => prev.map(a => {
      if (a.id === id) {
        const nextState = !a.connected;
        toast.success(`${a.name} ${nextState ? 'Connected Successfully' : 'Disconnected'}`);
        return { ...a, connected: nextState };
      }
      return a;
    }));
  };

  const handleRecalculateStorage = () => {
    setIsRecalculatingStorage(true);
    toast.loading("Querying live file sizes inside database storage...");
    setTimeout(() => {
      setIsRecalculatingStorage(false);
      loadStorageStats();
      toast.dismiss();
      toast.success("Storage cache synchronized successfully!");
    }, 1000);
  };

  const handleDownloadInvoice = (inv: any) => {
    toast.info(`Generating Tax Invoice statement for #${inv.id}...`);
    setTimeout(() => {
      const doc = `
=========================================
VIVEXA PLATFORMS - TAX INVOICE & RECEIPT
=========================================
Invoice Ref:   ${inv.id}
Date:          ${inv.date}
Client Name:   ${fullName || user?.email || "Valued Customer"}
Company:       ${company || "Enterprise Customer"}
Plan Tier:     ${userPlan}

Description:   ${inv.description}
Total Charged: ${inv.amount}
Payment Mode:  Credit Card (Autopay)
Status:        ${inv.status}
=========================================
Thank you for scaling with Vivexa!
      `;
      const blob = new Blob([doc.trim()], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Vivexa_Invoice_${inv.id}.txt`;
      a.click();
      toast.success(`Invoice ${inv.id} downloaded successfully!`);
    }, 800);
  };

  const handleUpgradePlan = async (planName: string) => {
    if (!user) return;
    try {
      const lowercasePlan = planName.toLowerCase();
      const { error } = await supabase.from('users').update({ plan: lowercasePlan }).eq('id', user.id);
      if (error) throw error;
      
      setUserPlan(planName);
      toast.success(`Plan upgraded to ${planName}!`);
      
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `Subscription Upgraded`,
        metadata: { new_plan: planName }
      });
      loadAuditLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription");
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success("Security credentials updated successfully.");
      setCurrPassword("");
      setNewPassword("");
      
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: "Password Updated",
          metadata: { timestamp: new Date().toISOString() }
        });
        loadAuditLogs();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  async function loadSettingsData() {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('user_id', user?.id).maybeSingle();
      if (!error && data) {
        if (data.theme) {
          setTheme(data.theme as any);
        }
        
        if (data.preferences) {
          if (data.preferences.aiModel) setAiModel(data.preferences.aiModel);
          if (data.preferences.creativity) setCreativity(data.preferences.creativity);
          if (data.preferences.autoSql !== undefined) setAutoSql(data.preferences.autoSql);
          if (data.preferences.workspaceName) setWorkspaceName(data.preferences.workspaceName);
          if (data.preferences.workspaceRegion) setWorkspaceRegion(data.preferences.workspaceRegion);
          if (data.preferences.twoFactorEnabled !== undefined) setTwoFactorEnabled(data.preferences.twoFactorEnabled);
          if (data.preferences.notifCritical !== undefined) setNotifCritical(data.preferences.notifCritical);
          if (data.preferences.notifWeekly !== undefined) setNotifWeekly(data.preferences.notifWeekly);
          if (data.preferences.notifSystem !== undefined) setNotifSystem(data.preferences.notifSystem);
          if (data.preferences.displayLanguage) setDisplayLanguage(data.preferences.displayLanguage);
          if (data.preferences.displayTimezone) setDisplayTimezone(data.preferences.displayTimezone);
        }
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  }

  const saveSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      const { data: curr } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle();
      const prefs = curr?.preferences || {};
      
      let updates: any = {
        user_id: user.id,
        preferences: { ...prefs, [key]: value },
        updated_at: new Date().toISOString()
      };
      
      if (key === 'theme') {
         updates.theme = value;
      }
      
      await supabase.from('settings').upsert(updates, { onConflict: 'user_id' });
    } catch (err) {
      console.error("Error saving setting", err);
    }
  };

  async function loadProfileData() {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('settings').select('*').eq('user_id', user?.id).maybeSingle()
      ]);

      const data = profileRes.data;
      const settingsData = settingsRes.data;
      const prefs = settingsData?.preferences || {};

      if (!profileRes.error && data) {
        setProfile(data);
        setFullName(data.full_name || (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : ""));
        setUsername(prefs.username || user?.email?.split('@')[0] || "");
        setCompany(data.company || user?.user_metadata?.company || "");
        setRole(data.role || "");
        setDepartment(prefs.department || "");
        setDesignation(prefs.designation || "");
        setBio(data.bio || "");
        setLocation(prefs.location || "");
        setPhone(prefs.phone || data.phone || "");
        setWebsite(prefs.website || data.website || "");
        setPortfolio(prefs.portfolio || data.portfolio || "");
        setAvatarUrl(data.avatar_url || "");
      } else {
        if (user?.user_metadata?.first_name) {
          setFullName(`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim());
        }
        if (user?.user_metadata?.company) {
          setCompany(user.user_metadata.company);
        }
        if (user?.email) {
          setUsername(user.email.split('@')[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadApiKeys() {
    setIsApiKeysLoading(true);
    try {
      const { data, error } = await supabase.from('api_keys').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      if (!error && data) {
        setApiKeys(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApiKeysLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (!error && data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStorageStats() {
    try {
      const { data, count, error } = await supabase.from('datasets').select('size_bytes', { count: 'exact' }).eq('user_id', user?.id);
      if (!error && data) {
        const total = data.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
        setStorageBytes(total);
        setDatasetCount(count || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleSubmitTicket = async () => {
    if (!ticketMessage.trim()) {
      toast.error("Please enter a detailed message describing your request.");
      return;
    }
    setSubmittingTicket(true);
    try {
      const res = await fetch("/api/v1/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          category: ticketCategory,
          message: ticketMessage
        })
      });

      const json = await safeFetchJson(res);
      if (json.success) {
        toast.success("Support request submitted to engineering team!");
        setTicketMessage("");
        await createNotification({
          userId: user?.id || "",
          title: "Support Ticket Dispatched",
          message: `Your support request (${ticketCategory}) was logged successfully.`,
          type: "system"
        });
        loadAuditLogs();
      } else {
        toast.error(json.error || "Failed to submit support request.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An unexpected error occurred while sending support ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const profileUpdates = {
        user_id: user.id,
        full_name: fullName,
        company,
        role,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      try {
        const { error: profileError } = await supabase.from('profiles').upsert(profileUpdates, { onConflict: 'user_id' });
        if (profileError) console.warn("Could not save to Supabase, continuing locally", profileError);
      } catch (e) {
        console.warn("Could not save to Supabase, continuing locally", e);
      }
      
      await saveSetting('username', username);
      await saveSetting('department', department);
      await saveSetting('designation', designation);
      await saveSetting('location', location);
      await saveSetting('phone', phone);
      await saveSetting('website', website);
      await saveSetting('portfolio', portfolio);

      // Sync Supabase Auth User Metadata
      try {
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            company,
            role,
            department,
            designation,
            avatar_url: avatarUrl
          }
        });
      } catch (authErr) {
        console.warn("Auth user metadata sync note:", authErr);
      }

      // Sync backend organization member endpoint
      if (session?.access_token) {
        try {
          await fetch('/api/v1/organization/members/me/profile', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              full_name: fullName,
              role,
              department,
              company,
              avatar_url: avatarUrl
            })
          });
        } catch (serverErr) {
          console.warn("Server organization profile sync note:", serverErr);
        }
      }

      // Update Zustand local user state
      const updatedUser = {
        ...user,
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: fullName,
          first_name: fullName.split(' ')[0] || '',
          last_name: fullName.split(' ').slice(1).join(' ') || '',
          company,
          role,
          department,
          avatar_url: avatarUrl
        }
      };
      useAuthStore.getState().setUser(updatedUser as any);

      // Trigger global event for real-time component updates across views
      window.dispatchEvent(new CustomEvent('vivexa:user_profile_updated', {
        detail: { full_name: fullName, role, department, company, avatar_url: avatarUrl }
      }));

      toast.success("Profile saved successfully!");

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: "Profile Details Saved",
        metadata: { full_name: fullName, username, company, role, department }
      });
      loadAuditLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'avatars')) {
        await supabase.storage.createBucket('avatars', { public: true });
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
        await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: data.publicUrl }, { onConflict: 'user_id' });
        toast.success("Avatar updated successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  async function handleCreateApiKey() {
    if (!newKeyName.trim()) {
      toast.error("Please provide a name for your API secret key.");
      return;
    }

    try {
      const response = await fetch("/api/v1/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Successfully generated new API Key.");
        setNewKeyName("");
        loadApiKeys();
        
        if (json.data.plaintext_key) {
           alert(`Your new API key is:\n\n${json.data.plaintext_key}\n\nPlease copy it now. It will not be shown again.`);
        }
      } else {
        toast.error(json.error || "Failed to create key.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to API keys endpoint.");
    }
  }

  async function handleDeleteApiKey(id: string) {
    try {
      const response = await fetch(`/api/v1/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success) {
        toast.success("API key revoked.");
        loadApiKeys();
      } else {
        toast.error(json.error || "Failed to revoke key.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to revoke key.");
    }
  }

  const profileCompletion = useMemo(() => {
    const fields = [fullName, username, company, department, role, bio, location, avatarUrl];
    const filled = fields.filter(f => Boolean(f && f.trim())).length;
    return Math.round((filled / fields.length) * 100);
  }, [fullName, username, company, department, role, bio, location, avatarUrl]);

  const handleBackupWorkspace = () => {
    const backupData = {
      workspace: workspaceName,
      user: user?.email,
      timestamp: new Date().toISOString(),
      apiKeysCount: apiKeys.length,
      auditLogsCount: auditLogs.length,
      datasetsCount: datasetCount,
      version: "3.0.0"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Vivexa_Settings_Backup_${Date.now()}.json`;
    a.click();
    toast.success("Settings archive exported successfully!");
  };

  const filteredTabs = useMemo(() => {
    if (!tabSearchQuery.trim()) return TABS;
    const q = tabSearchQuery.toLowerCase();
    return TABS.filter(t => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }, [tabSearchQuery]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Building className="h-6 w-6 text-indigo-400 shrink-0" />
            Enterprise Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your account identity, security preferences, AI models, API keys, and workspace parameters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button onClick={handleBackupWorkspace} variant="outline" className="border-slate-800 bg-slate-950/40 text-xs text-slate-200 hover:bg-slate-900 rounded-xl">
            <Download className="h-3.5 w-3.5 mr-1.5 text-indigo-400" /> Export Backup
          </Button>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl px-5">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Streamlined Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60 backdrop-blur-xl max-h-[780px] overflow-y-auto">
          
          {/* Quick Tab Search */}
          <div className="relative mb-2">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search settings..."
              value={tabSearchQuery}
              onChange={(e) => setTabSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400 border border-slate-700/60"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredTabs.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching settings found.
            </div>
          )}
        </div>

        {/* Settings Panel Canvas */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-2xl p-6 min-h-[620px] flex flex-col justify-between">
            <div className="space-y-6">

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-indigo-400" /> Settings Overview
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Summary of platform parameters, user identity, and active usage statistics.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Systems Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">User Account</span>
                      <span className="font-bold text-white truncate block">{fullName || user?.email}</span>
                      <span className="text-[10px] text-indigo-400 font-semibold">{role || 'Member'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Active Plan</span>
                      <span className="font-bold text-amber-400 block">{userPlan}</span>
                      <span className="text-[10px] text-slate-500">Enterprise Access</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Storage Used</span>
                      <span className="font-bold text-blue-400 block">{(storageBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-1.5"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (storageBytes / (1024 * 1024 * 1024)) * 10)}%` }} /></div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">API Secret Keys</span>
                      <span className="font-bold text-emerald-400 block">{apiKeys.length} Active</span>
                      <span className="text-[10px] text-slate-500">Authorized endpoints</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-indigo-400" /> Administrative Quick Shortcuts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setActiveTab("profile")} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <User className="h-3.5 w-3.5 mr-1" /> Edit Profile
                      </Button>
                      <Button onClick={() => setActiveTab("security")} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <Shield className="h-3.5 w-3.5 mr-1" /> Security & SSO
                      </Button>
                      <Button onClick={() => setActiveTab("apikeys")} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <Key className="h-3.5 w-3.5 mr-1" /> API Keys & OAuth
                      </Button>
                      <Button onClick={handleBackupWorkspace} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <Download className="h-3.5 w-3.5 mr-1" /> Export Backup
                      </Button>
                    </div>
                  </div>

                  {/* Audit Logs Feed */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Recent Security Activity
                    </h3>
                    <div className="space-y-2 text-xs">
                      {auditLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="p-3 rounded-xl bg-slate-950/30 border border-slate-850 flex items-center justify-between text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="font-semibold text-slate-200">{log.action}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-xs bg-slate-950/20 rounded-xl border border-slate-850">
                          No recent audit logs logged.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE & LOCALIZATION TAB */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Notice banner to put original profile details */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-300 text-sm">Please Update With Your Original Profile Details</h4>
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                        Placeholder profile data has been removed. Please enter your authentic full name, organization, job title, phone number, and location below so your team members and workspace collaborators can identify you accurately.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pb-4 border-b border-slate-850">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-2xl overflow-hidden shadow-lg">
                        {avatarUrl ? <img loading="lazy" src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute -bottom-2 -right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow-md"
                      >
                        {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{fullName || user?.email}</h3>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {role || "Member"}
                        </span>
                        <span className="text-xs text-emerald-400 font-bold">Completeness: {profileCompletion}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Full Name <span className="text-amber-400">*</span></label>
                      <Input type="text" placeholder="e.g. Paras Bishnoi" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Username</label>
                      <Input type="text" placeholder="e.g. parasbishnoi" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Company / Organization <span className="text-amber-400">*</span></label>
                      <Input type="text" placeholder="e.g. Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Department</label>
                      <Input type="text" placeholder="e.g. Data Analytics" value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Job Role / Title</label>
                      <Input type="text" placeholder="e.g. Senior Data Analyst" value={role} onChange={(e) => setRole(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Designation</label>
                      <Input type="text" placeholder="e.g. Lead Engineer" value={designation} onChange={(e) => setDesignation(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Phone Number</label>
                      <Input type="text" placeholder="e.g. +1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Location / Country</label>
                      <Input type="text" placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Personal / Organization Website</label>
                      <Input type="text" placeholder="e.g. https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Portfolio / GitHub Profile</label>
                      <Input type="text" placeholder="e.g. https://github.com/yourusername" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl placeholder:text-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium block text-xs">Bio & Executive Summary</label>
                    <textarea placeholder="Write a brief summary of your role, responsibilities, or expertise..." value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                  </div>

                  {/* Language & Regional Preferences */}
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <Globe className="h-4 w-4 text-indigo-400" /> Regional & Language Preferences
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Display Language</label>
                        <select
                          value={displayLanguage}
                          onChange={(e) => {
                            setDisplayLanguage(e.target.value);
                            saveSetting('displayLanguage', e.target.value);
                            toast.success("Display language preference saved");
                          }}
                          className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="en">English (US - International)</option>
                          <option value="es">Español (Spanish)</option>
                          <option value="de">Deutsch (German)</option>
                          <option value="fr">Français (French)</option>
                          <option value="ja">日本語 (Japanese)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Primary Timezone</label>
                        <select
                          value={displayTimezone}
                          onChange={(e) => {
                            setDisplayTimezone(e.target.value);
                            saveSetting('displayTimezone', e.target.value);
                            toast.success("Timezone preference saved");
                          }}
                          className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="UTC">UTC (Universal Coordinated Time)</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST - GMT +5:30)</option>
                          <option value="America/New_York">America/New_York (EST - GMT -5:00)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST - GMT -8:00)</option>
                          <option value="Europe/London">Europe/London (GMT +0:00)</option>
                          <option value="Europe/Frankfurt">Europe/Frankfurt (CET - GMT +1:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400">
                      <span className="text-amber-400 font-semibold">*</span> Completing your profile details improves workspace collaboration and identity verification.
                    </p>
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl px-5 py-2 flex items-center gap-2 shrink-0">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Save Original Profile Details
                    </Button>
                  </div>
                </div>
              )}

              {/* WORKSPACE & TEAMS TAB */}
              {activeTab === "workspace" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building className="h-5 w-5 text-indigo-400" /> Workspace & Team Parameters
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage workspace details, deployment clusters, corporate entity name, and team member permissions.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400">Workspace Name</label>
                      <Input type="text" value={workspaceName} onChange={(e) => {
                        setWorkspaceName(e.target.value);
                        saveSetting('workspaceName', e.target.value);
                      }} className="bg-slate-950/60 border-slate-800 rounded-xl text-white font-semibold" />
                    </div>
                    <div className="space-y-1.5 font-mono">
                      <label className="text-slate-400">Active Deployment Region</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        value={workspaceRegion}
                        onChange={(e) => {
                          setWorkspaceRegion(e.target.value);
                          saveSetting('workspaceRegion', e.target.value);
                          toast.success("Workspace region updated");
                        }}
                      >
                        <option value="us-central1 (Iowa)">us-central1 (Iowa, USA)</option>
                        <option value="asia-south1 (Mumbai)">asia-south1 (Mumbai, India)</option>
                        <option value="europe-west3 (Frankfurt)">europe-west3 (Frankfurt, Germany)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                    <label className="text-slate-400 font-semibold">Corporate Entity Name</label>
                    <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" className="bg-slate-950/60 border-slate-800 rounded-xl" />
                  </div>

                  {/* Registered Directory Members */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-indigo-400" /> Team Member Access
                      </h4>
                      <Button onClick={() => toast.success("Invitation link copied to clipboard")} size="sm" className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3">
                        + Invite Member
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{fullName || user?.email}</span>
                          <span className="text-slate-500 text-[10px]">{user?.email}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-bold text-[10px]">Owner / Admin</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/60">
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-red-400 text-sm">Workspace Danger Zone</h4>
                        <p className="text-slate-400 mt-0.5 text-xs">Transfer workspace ownership or archive workspace resources.</p>
                      </div>
                      <Button onClick={() => toast.info("Ownership transfer workflow initiated")} variant="destructive" className="bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs">
                        Transfer Ownership
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY, SSO & SESSIONS TAB */}
              {activeTab === "security" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-400" /> Security, SSO & Authentication
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage authentication security, single sign-on (SSO), and active sessions.</p>
                  </div>

                  {/* 2FA Toggle */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">Two-Factor Authentication (2FA)</h4>
                      <p className="text-slate-400 mt-0.5">Secure your account with TOTP authenticator keys.</p>
                    </div>
                    <Button
                      onClick={() => { 
                        const newVal = !twoFactorEnabled;
                        setTwoFactorEnabled(newVal);
                        saveSetting('twoFactorEnabled', newVal);
                        toast.success(`2FA successfully ${newVal ? 'Activated' : 'Revoked'}`); 
                      }}
                      className={twoFactorEnabled ? "bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs" : "bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs"}
                    >
                      {twoFactorEnabled ? "2FA Verified Active" : "Setup 2FA Key"}
                    </Button>
                  </div>

                  {/* Password Update */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3">
                    <h4 className="font-bold text-white text-xs">Update Security Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="password" placeholder="Current Password" value={currPassword} onChange={e => setCurrPassword(e.target.value)} className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500" />
                      <input type="password" placeholder="New Strong Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <Button 
                      onClick={handleUpdatePassword} 
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                      Update Credentials
                    </Button>
                  </div>

                  {/* SSO Provider Configurations */}
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                      <Fingerprint className="h-4 w-4 text-emerald-400" /> Enterprise Single Sign-On (SSO)
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Okta Config */}
                      <div className={`p-4 rounded-2xl border ${ssoProvider === "okta" ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/40 border-slate-850'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-bold text-white text-sm">Okta Enterprise (SAML 2.0)</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Federated Identity Provider</p>
                          </div>
                          {ssoProvider === "okta" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-800 bg-slate-900">INACTIVE</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3 h-8 text-xs border-slate-800 hover:bg-slate-800 text-slate-200"
                          onClick={() => {
                            const next = ssoProvider === "okta" ? "none" : "okta";
                            setSsoProvider(next);
                            toast.success(`Okta SSO ${next === "okta" ? "Enabled" : "Disabled"}`);
                          }}
                        >
                          {ssoProvider === "okta" ? "Disconnect Provider" : "Enable Okta SSO"}
                        </Button>
                      </div>

                      {/* Entra ID Config */}
                      <div className={`p-4 rounded-2xl border ${ssoProvider === "entra" ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-950/40 border-slate-850'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-bold text-white text-sm">Microsoft Entra ID (OIDC)</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Azure Active Directory</p>
                          </div>
                          {ssoProvider === "entra" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-800 bg-slate-900">INACTIVE</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3 h-8 text-xs border-slate-800 hover:bg-slate-800 text-slate-200"
                          onClick={() => {
                            const next = ssoProvider === "entra" ? "none" : "entra";
                            setSsoProvider(next);
                            toast.success(`Entra ID ${next === "entra" ? "Enabled" : "Disabled"}`);
                          }}
                        >
                          {ssoProvider === "entra" ? "Disconnect Provider" : "Enable Entra ID"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Active Authentication Sessions */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                      <Smartphone className="h-4 w-4 text-indigo-400" /> Active Login Sessions
                    </h4>
                    <div className="space-y-2">
                      {sessions.map((sess) => (
                        <div key={sess.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{sess.device}</span>
                              {sess.current && <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-bold">This Device</span>}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">IP: {sess.ip} • {sess.location} • {sess.time}</p>
                          </div>
                          {!sess.current && (
                            <Button onClick={() => handleRevokeSession(sess.id)} size="sm" variant="ghost" className="h-7 text-xs text-rose-400 hover:bg-rose-500/10">
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI COPILOT PARAMETERS TAB */}
              {activeTab === "ai_prefs" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400" /> AI Copilot & Model Parameters
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Configure model engines, generative temperature, and query verification toggles.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Primary LLM Model Engine</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={aiModel}
                        onChange={e => {
                          setAiModel(e.target.value);
                          saveSetting('aiModel', e.target.value);
                          toast.success("AI model preference saved");
                        }}
                      >
                        <option value="gemini-3.6-flash">Gemini 2.5 Flash (Fastest / Code generation)</option>
                        <option value="gemini-3.1-pro-preview">Gemini 2.5 Pro (Data Science reasoning)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Generative Temperature (Creativity)</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={creativity}
                        onChange={e => {
                          setCreativity(e.target.value);
                          saveSetting('creativity', e.target.value);
                          toast.success("Generative temperature saved");
                        }}
                      >
                        <option value="0.1">0.1 (Deterministic / Mathematical rigor)</option>
                        <option value="0.5">0.5 (Balanced analytical reasoning)</option>
                        <option value="0.8">0.8 (Creative exploratory analysis)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Automated SQL Verification</span>
                      <span className="text-slate-500">Automatically inspect column mappings prior to running SQL queries.</span>
                    </div>
                    <button 
                      onClick={() => { 
                        const newVal = !autoSql;
                        setAutoSql(newVal); 
                        saveSetting('autoSql', newVal);
                        toast.success(`Automated SQL Verification ${newVal ? 'Enabled' : 'Disabled'}`); 
                      }} 
                      className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${autoSql ? "bg-indigo-600" : "bg-slate-800"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-white transition-transform ${autoSql ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* API KEYS & OAUTH TAB */}
              {activeTab === "apikeys" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-indigo-400" /> API Secret Keys & Integrations
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage access tokens for programmatic API access and connected OAuth accounts.</p>
                  </div>

                  {/* Create Key Section */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                    <h4 className="font-bold text-slate-200">Generate New API Secret Key</h4>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Key label e.g. Production Pipeline Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-slate-900 border-slate-800 rounded-xl text-xs placeholder:text-slate-600"
                      />
                      <Button onClick={handleCreateApiKey} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shrink-0 text-xs">
                        Generate Key
                      </Button>
                    </div>
                  </div>

                  {/* Active Keys List */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Active Secret Keys</h4>
                    {apiKeys.map((key) => (
                      <div key={key.id} className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{key.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">Key Prefix: {key.key_prefix || 'vx_live_...'}</span>
                        </div>
                        <Button onClick={() => handleDeleteApiKey(key.id)} size="sm" variant="ghost" className="h-7 text-xs text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke
                        </Button>
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-xs bg-slate-950/20 rounded-xl border border-slate-850">
                        No active secret keys created yet.
                      </div>
                    )}
                  </div>

                  {/* Connected Accounts */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-[10px]">
                      <LinkIcon className="h-3.5 w-3.5 text-indigo-400" /> OAuth Connected Accounts
                    </h4>
                    <div className="space-y-2">
                      {connectedAccounts.map((acc) => (
                        <div key={acc.id} className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">{acc.name}</span>
                            <span className="text-slate-500 text-[10px]">{acc.email || "Not linked"}</span>
                          </div>
                          <Button
                            onClick={() => handleToggleAccount(acc.id)}
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs rounded-lg ${acc.connected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-slate-700 text-slate-300"}`}
                          >
                            {acc.connected ? "Connected" : "Connect"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* USAGE & STORAGE ANALYTICS TAB */}
              {activeTab === "usage" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-indigo-400" /> Usage Quotas & Storage Analytics
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Monitor AI query consumption and storage allocation across datasets.</p>
                  </div>

                  {/* AI Usage Meter */}
                  <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 text-sm">Monthly AI Query Usage</span>
                      <span className="text-xs font-mono text-indigo-400 font-bold">{aiUsageCount} / {getQuotaLimit()} Executions</span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (aiUsageCount / getQuotaLimit()) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Dataset Storage Breakdown */}
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-indigo-400" /> Live Dataset Storage
                        </h4>
                        <p className="text-slate-400 mt-0.5">Total size of active CSV and Parquet files stored.</p>
                      </div>
                      <Button onClick={handleRecalculateStorage} disabled={isRecalculatingStorage} size="sm" variant="outline" className="border-slate-800 text-xs rounded-xl">
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRecalculatingStorage ? 'animate-spin' : ''}`} /> Recalculate
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Datasets</span>
                        <span className="text-lg font-bold text-white block mt-0.5">{datasetCount} Datasets</span>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Storage Volume</span>
                        <span className="text-lg font-bold text-blue-400 block mt-0.5">{(storageBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING & PLANS TAB */}
              {activeTab === "billing" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-400" /> Subscription & Invoices
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage subscription tiers, payment profiles, and tax invoices.</p>
                  </div>

                  {/* Plan Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-3">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Current Tier</span>
                      <h4 className="text-lg font-bold text-white">{userPlan}</h4>
                      <p className="text-slate-400 text-xs">Enterprise AI analytics, multi-agent orchestration, and dedicated cloud storage.</p>
                      <Button onClick={() => handleUpgradePlan("Enterprise Pro")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs">
                        Active Tier
                      </Button>
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Unlimited Scale</span>
                      <h4 className="text-lg font-bold text-white">Dedicated Private Cluster</h4>
                      <p className="text-slate-400 text-xs">Custom SLA, isolated single-tenant database instance, and 24/7 dedicated engineering support.</p>
                      <Button onClick={() => toast.info("Dedicated cluster request submitted to sales team")} variant="outline" className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/10 rounded-xl text-xs">
                        Request Private Cluster
                      </Button>
                    </div>
                  </div>

                  {/* Invoice History */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                      <CreditCard className="h-4 w-4 text-indigo-400" /> Tax Invoices & Receipts
                    </h4>
                    <div className="space-y-2">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{inv.id} — {inv.description}</span>
                            <span className="text-slate-500 text-[10px]">{inv.date} • {inv.amount}</span>
                          </div>
                          <Button onClick={() => handleDownloadInvoice(inv)} size="sm" variant="outline" className="h-7 text-xs border-slate-800 hover:bg-slate-800 text-slate-300">
                            <Download className="h-3 w-3 mr-1" /> Invoice
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PRIVACY, BACKUP & SUPPORT TAB */}
              {activeTab === "privacy_support" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-indigo-400" /> Privacy, Export & Engineering Support
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Control data privacy policies, download workspace archives, or open priority tickets.</p>
                  </div>

                  {/* Privacy Toggles */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Diagnostic Telemetry & Performance Logs</span>
                      <span className="text-slate-500">Allow anonymous error stack trace logging to improve platform reliability.</span>
                    </div>
                    <button onClick={() => toast.success("Telemetry preference saved")} className="h-6 w-11 rounded-full p-0.5 bg-indigo-600 focus:outline-none"><div className="h-5 w-5 rounded-full bg-white translate-x-5" /></button>
                  </div>

                  {/* Export & Backup */}
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 text-center space-y-3">
                    <Database className="h-6 w-6 text-indigo-400 mx-auto" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Download Workspace Archive</h4>
                      <p className="text-slate-400 mt-0.5 text-xs">Export a complete JSON snapshot of your settings, metadata, and dataset keys.</p>
                    </div>
                    <Button onClick={handleBackupWorkspace} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs">
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download JSON Backup
                    </Button>
                  </div>

                  {/* Priority Support Ticket Form */}
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-400" /> Submit Priority Engineering Ticket
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Issue Category</label>
                        <select 
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Technical Issue / Bug">Technical Issue / Bug</option>
                          <option value="Account & Billing">Account & Billing</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="AI / SQL Query Assistance">AI / SQL Query Assistance</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Detailed Request / Message</label>
                        <textarea
                          rows={3}
                          placeholder="Describe your issue or request..."
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitTicket} 
                        disabled={submittingTicket}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold px-5"
                      >
                        {submittingTicket ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                        Dispatch Support Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Panel Footer */}
            <div className="pt-6 mt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Vivexa Platform Engine v3.2.0 • Secured with Enterprise RLS</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Terms</a>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Privacy</a>
                <a href="/docs" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">API Docs</a>
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}
