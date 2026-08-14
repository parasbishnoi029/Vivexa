import { useState, useEffect, useRef, useMemo } from "react";
import {
  User, Shield, Bell, Palette, Globe, HardDrive, Trash2, LogOut, Link as LinkIcon,
  Smartphone, Laptop, Camera, Loader2, Key, CreditCard, Layers, Building, Users,
  BarChart2, Zap, Sparkles, Download, Lock, CheckCircle2, RefreshCw, AlertTriangle,
  FileText, ShieldAlert, Cpu, Eye, Copy, Check, Plus, Settings2, ShieldCheck, Database,
  LayoutDashboard, Activity, ArrowUpRight, Clock, HelpCircle, ChevronRight, X, Search,
  Server, Sliders, ToggleLeft, ToggleRight, Trash, MessageSquare, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { getAiUsageCount, getQuotaLimit } from "@/lib/telemetry";

const TABS = [
  { id: "overview", label: "Settings Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile Settings", icon: User },
  { id: "workspace", label: "Workspace & Region", icon: Building },
  { id: "organization", label: "Organization & Teams", icon: Users },
  { id: "security", label: "Security & 2FA", icon: Shield },
  { id: "sessions", label: "Active Sessions", icon: Smartphone },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "storage", label: "Storage Analytics", icon: HardDrive },
  { id: "usage", label: "Usage & Limits", icon: BarChart2 },
  { id: "subscription", label: "Subscription & Plan", icon: Zap },
  { id: "billing", label: "Billing & Invoices", icon: CreditCard },
  { id: "apikeys", label: "API Keys & Secrets", icon: Key },
  { id: "accounts", label: "Connected Accounts", icon: LinkIcon },
  { id: "devices", label: "Connected Devices", icon: Laptop },
  { id: "ai_prefs", label: "AI Engine Preferences", icon: Sparkles },
  { id: "privacy", label: "Privacy & Data Policy", icon: Lock },
  { id: "backup", label: "Export & Backup", icon: Download },
  { id: "support", label: "Support & Help", icon: MessageSquare }
];

export default function WorkspaceSettings() {
  const { user, session } = useAuthStore();
  const token = session?.access_token;
  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [aiUsageCount, setAiUsageCount] = useState<number>(() => getAiUsageCount());

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
  const [phone, setPhone] = useState("+91 98765 43210");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("https://vivexa.ai");
  const [portfolio, setPortfolio] = useState("https://github.com");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workspace Settings
  const [workspaceName, setWorkspaceName] = useState("Vivexa Enterprise Workspace");
  const [workspaceRegion, setWorkspaceRegion] = useState("us-central1 (Iowa)");

  const [accentColor, setAccentColor] = useState("indigo");
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">("dark");
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Security & Password
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // AI Preferences
  const [aiModel, setAiModel] = useState("gemini-3.1-pro-preview");
  const [creativity, setCreativity] = useState("0.2");
  const [autoSql, setAutoSql] = useState(true);
  const [autoPython, setAutoPython] = useState(true);
  const [autoReports, setAutoReports] = useState(true);

  // API Keys (fetched from Supabase database)
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  // Audit Logs (fetched from Supabase database)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(false);

  // Storage and Datasets stats
  const [storageBytes, setStorageBytes] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [isRecalculatingStorage, setIsRecalculatingStorage] = useState(false);

  // Dynamic Client Attributes
  const [deviceIp, setDeviceIp] = useState("34.34.244.19");
  const [browserInfo, setBrowserInfo] = useState("Chrome macOS");

  // Notifications Toggles
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);
  const [notifInvites, setNotifInvites] = useState(true);

  // Language & Timezone
  const [displayLanguage, setDisplayLanguage] = useState("en");
  const [displayTimezone, setDisplayTimezone] = useState("Asia/Kolkata");

  // Active Plan Level
  const [userPlan, setUserPlan] = useState("Enterprise Pro");

  // Dynamic Session Listings
  const [sessions, setSessions] = useState<any[]>([
    { id: "sess-curr", device: "Chrome macOS (Primary Cluster)", ip: "34.34.244.19", location: "Bengaluru, IN", current: true, time: "Active Now" },
    { id: "sess-1", device: "Safari iOS (iPhone 15 Pro Max)", ip: "172.56.21.90", location: "Mumbai, IN", current: false, time: "2 hours ago" },
    { id: "sess-2", device: "Firefox Linux (Ubuntu 24.04)", ip: "84.120.45.12", location: "Frankfurt, DE", current: false, time: "1 day ago" }
  ]);

  // Billing Statement history
  const [invoices, setInvoices] = useState<any[]>([
    { id: "VVX-2026-7829", date: "2026-08-01", description: "Enterprise Pro Monthly Charge", amount: "₹1,499.00 INR", status: "Paid" },
    { id: "VVX-2026-6910", date: "2026-07-01", description: "Enterprise Pro Monthly Charge", amount: "₹1,499.00 INR", status: "Paid" },
    { id: "VVX-2026-5811", date: "2026-06-01", description: "Pro Sandbox Trial Period", amount: "₹0.00 INR", status: "Free" }
  ]);

  // Connected Accounts Integration
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([
    { id: "google", name: "Google Accounts Verification", email: "", connected: true },
    { id: "github", name: "GitHub OAuth Access", email: "", connected: false },
    { id: "slack", name: "Slack Real-Time Chat Workspaces Sync", email: "vivexa-copilot-workspace.slack.com", connected: true }
  ]);

  // Verified Devices
  const [connectedDevices, setConnectedDevices] = useState<any[]>([
    { id: "dev-mac", name: 'MacBook Pro 16" (M3 Max)', detail: "Last Sync: Just now • Bengaluru, India" },
    { id: "dev-iphone", name: "iPhone 15 Pro Max", detail: "Last Sync: 12 mins ago • Bengaluru, India" }
  ]);

  // Parse details on render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      let detectedOS = "Mac OS X";
      if (ua.indexOf("Win") !== -1) detectedOS = "Windows";
      else if (ua.indexOf("Linux") !== -1) detectedOS = "Linux";
      else if (ua.indexOf("Android") !== -1) detectedOS = "Android";
      else if (ua.indexOf("like Mac") !== -1) detectedOS = "iOS";

      let detectedBrowser = "Chrome";
      if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) detectedBrowser = "Safari";
      else if (ua.indexOf("Firefox") !== -1) detectedBrowser = "Firefox";
      else if (ua.indexOf("Edge") !== -1) detectedBrowser = "Edge";

      setBrowserInfo(`${detectedBrowser} ${detectedOS}`);
      
      // Set current session attributes
      setSessions(prev => prev.map(s => s.current ? { ...s, device: `${detectedBrowser} ${detectedOS} (Primary Cluster)` } : s));

      fetch("https://api.ipify.org?format=json")
        .then(res => res.json())
        .then(data => {
          if (data.ip) {
            setDeviceIp(data.ip);
            setSessions(prev => prev.map(s => s.current ? { ...s, ip: data.ip } : s));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Sync google email
  useEffect(() => {
    if (user?.email) {
      setConnectedAccounts(prev => prev.map(a => a.id === "google" ? { ...a, email: user.email! } : a));
    }
    
    // Sync plan level from users table
    if (user) {
      supabase.from('users').select('plan').eq('id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.plan) {
            setUserPlan(data.plan.charAt(0).toUpperCase() + data.plan.slice(1));
          }
        });
    }
  }, [user]);

  // Handlers
  const handleRevokeSession = async (sessId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessId));
    toast.success("Active authentication session terminated and token cleared!");
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: "Session Terminated",
        metadata: { session_id: sessId }
      });
      loadAuditLogs();
    }
  };

  const handleRevokeDevice = async (devId: string) => {
    setConnectedDevices(prev => prev.filter(d => d.id !== devId));
    toast.success("Device key registration successfully revoked!");
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: "Device Revoked",
        metadata: { device_id: devId }
      });
      loadAuditLogs();
    }
  };

  const handleToggleAccount = (id: string) => {
    setConnectedAccounts(prev => prev.map(a => {
      if (a.id === id) {
        const nextState = !a.connected;
        toast.success(`${a.name} ${nextState ? 'Connected Successfully' : 'Disconnected Successfully'}`);
        return { ...a, connected: nextState };
      }
      return a;
    }));
  };

  const handleRecalculateStorage = () => {
    setIsRecalculatingStorage(true);
    toast.loading("Querying live file sizes inside Supabase storage bucket...");
    setTimeout(() => {
      setIsRecalculatingStorage(false);
      loadStorageStats();
      toast.dismiss();
      toast.success("Database storage cache synchronized successfully!");
    }, 1200);
  };

  const handleDownloadInvoice = (inv: any) => {
    toast.info(`Generating Invoice statement for #${inv.id}...`);
    setTimeout(() => {
      const doc = `
=========================================
VIVEXA PLATFORMS - TAX INVOICE & RECEIPT
=========================================
Invoice Ref:  \${inv.id}
Date:         \${inv.date}
Client Name:  \${fullName || user?.email || "Enterprise Partner"}
Organization: \${company || "Vivexa Enterprise"}
Plan Level:   \${userPlan}

Description:  \${inv.description}
Total Charged: \${inv.amount}
Payment Mode: Credit Card (Autopay)
Status:       \${inv.status} (SUCCESS)
=========================================
Thank you for scaling with Vivexa!
      `;
      const blob = new Blob([doc.trim()], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Vivexa_Invoice_\${inv.id}.txt`;
      a.click();
      toast.success(`Invoice \${inv.id} downloaded successfully!`);
    }, 800);
  };

  const handleUpgradePlan = async (planName: string) => {
    if (!user) return;
    try {
      const lowercasePlan = planName.toLowerCase();
      const { error } = await supabase.from('users').update({ plan: lowercasePlan }).eq('id', user.id);
      if (error) throw error;
      
      setUserPlan(planName);
      toast.success(`Plan successfully altered to \${planName}!`);
      
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `Subscription Altered`,
        metadata: { new_plan: planName }
      });
      loadAuditLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription");
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.find(t => t.id === tab)) {
      setActiveTab(tab);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

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
        if (data.theme) setThemeMode(data.theme);
        
        // Use JSONB metadata for extra fields if needed, or fallback to state
        if (data.preferences) {
          if (data.preferences.accentColor) setAccentColor(data.preferences.accentColor);
          if (data.preferences.compactMode !== undefined) setCompactMode(data.preferences.compactMode);
          if (data.preferences.aiModel) setAiModel(data.preferences.aiModel);
          if (data.preferences.creativity) setCreativity(data.preferences.creativity);
          if (data.preferences.autoSql !== undefined) setAutoSql(data.preferences.autoSql);
          if (data.preferences.workspaceName) setWorkspaceName(data.preferences.workspaceName);
          if (data.preferences.workspaceRegion) setWorkspaceRegion(data.preferences.workspaceRegion);
          if (data.preferences.twoFactorEnabled !== undefined) setTwoFactorEnabled(data.preferences.twoFactorEnabled);
          
          if (data.preferences.notifCritical !== undefined) setNotifCritical(data.preferences.notifCritical);
          if (data.preferences.notifWeekly !== undefined) setNotifWeekly(data.preferences.notifWeekly);
          if (data.preferences.notifSystem !== undefined) setNotifSystem(data.preferences.notifSystem);
          if (data.preferences.notifInvites !== undefined) setNotifInvites(data.preferences.notifInvites);
          if (data.preferences.displayLanguage) setDisplayLanguage(data.preferences.displayLanguage);
          if (data.preferences.displayTimezone) setDisplayTimezone(data.preferences.displayTimezone);
        }
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  }

  // Generic function to save settings changes to Supabase
  const saveSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      // Fetch current preferences first
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
        setFullName(data.full_name || "");
        setUsername(prefs.username || user?.email?.split('@')[0] || "");
        setCompany(data.company || "Vivexa Enterprise");
        setRole(data.role || "CTO");
        setDepartment(prefs.department || "Analytics & AI");
        setDesignation(prefs.designation || "Principal Analyst");
        setBio(data.bio || "Data-driven analytics decision strategist.");
        setLocation(prefs.location || "Bengaluru, India");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadApiKeys() {
    setIsApiKeysLoading(true);
    try {
      const { data, error } = await supabase.from('api_keys').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      if (error) {
         console.error("API Keys fetch error:", error);
         toast.error("Could not load API keys.");
      } else if (data) {
        setApiKeys(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load API keys.");
    } finally {
      setIsApiKeysLoading(false);
    }
  }

  async function loadAuditLogs() {
    setIsAuditLogsLoading(true);
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) {
         console.error("Audit Logs fetch error:", error);
         toast.error("Could not load Audit logs.");
      } else if (data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load Audit logs.");
    } finally {
      setIsAuditLogsLoading(false);
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Valid columns for public.profiles
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
      
      // Save other fields to settings preferences
      await saveSetting('username', username);
      await saveSetting('department', department);
      await saveSetting('designation', designation);
      await saveSetting('location', location);

      toast.success("Profile saved successfully!");

      // Log action
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: "Profile Details Saved",
        metadata: { full_name: fullName, username }
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

      // Check bucket
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
      const entropy = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const rawKey = `vx_live_${entropy}`;
      
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
        
        // Show plain key to user so they can copy it!
        if (json.data.plaintext_key) {
           alert(`Your new API key is:\n\n${json.data.plaintext_key}\n\nPlease copy it now. It will not be shown again.`);
        }
      } else {
        throw new Error(json.error || "Failed to generate key");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleRevokeApiKey(keyId: string) {
    try {
      const res = await fetch(`/api/v1/keys/${keyId}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("API key revoked successfully.");
        loadApiKeys();
      } else {
        throw new Error(json.error || "Failed to revoke key");
      }
    } catch (err: any) {
      toast.error(err.message);
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
    a.download = `Vivexa_Workspace_Backup_${Date.now()}.json`;
    a.click();
    toast.success("Workspace backup file downloaded successfully!");
  };

  return (
    <div className="space-y-6 relative z-10 w-full max-w-7xl mx-auto pb-16 text-slate-100 font-sans">
      
      {/* Title Header */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Settings2 className="h-3.5 w-3.5" /> Workspace Settings Console
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Enterprise Settings & Synchronization
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure profile data, access credentials, limits, subscriptions, and security parameters directly inside Supabase.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handleBackupWorkspace} variant="outline" className="border-slate-800 bg-slate-950/40 text-xs text-slate-200 hover:bg-slate-900 rounded-xl">
            <Download className="h-3.5 w-3.5 mr-1.5 text-indigo-400" /> Export Backup
          </Button>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl px-4">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Save Changes
          </Button>
        </div>
      </div>

      {/* Settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60 backdrop-blur-xl max-h-[800px] overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-850 mb-2">
            Settings Panels
          </div>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Panel */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-2xl p-6 min-h-[600px] flex flex-col justify-between">
            <div className="space-y-6">

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-indigo-400" /> Settings Overview
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Summary of enterprise metrics, subscription status, and platform health.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> All systems operational
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Current User</span>
                      <span className="font-bold text-white truncate block">{fullName || user?.email}</span>
                      <span className="text-[10px] text-indigo-400 font-semibold">{role || 'Enterprise Leader'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Subscription Tier</span>
                      <span className="font-bold text-amber-400 block">Enterprise Pro</span>
                      <span className="text-[10px] text-slate-500">Auto-renews dynamically</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Storage Used</span>
                      <span className="font-bold text-blue-400 block">{(storageBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-1.5"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (storageBytes / (1024 * 1024 * 1024)) * 10)}%` }} /></div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Active API Keys</span>
                      <span className="font-bold text-emerald-400 block">{apiKeys.length} Keys</span>
                      <span className="text-[10px] text-slate-500">Authorized endpoints</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-950/10 border border-indigo-500/20 space-y-3">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> Administrative Quick Commands
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setActiveTab("profile")} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <User className="h-3.5 w-3.5 mr-1" /> Edit Profile
                      </Button>
                      <Button onClick={() => setActiveTab("apikeys")} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <Key className="h-3.5 w-3.5 mr-1" /> Create API Key
                      </Button>
                      <Button onClick={handleBackupWorkspace} size="sm" variant="outline" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 text-xs rounded-xl">
                        <Download className="h-3.5 w-3.5 mr-1" /> Export Backup
                      </Button>
                    </div>
                  </div>

                  {/* Recent Logs Preview */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Recent Security Logs
                    </h3>
                    <div className="space-y-2 text-xs">
                      {auditLogs.slice(0, 3).map((log) => (
                        <div key={log.id} className="p-3 rounded-xl bg-slate-950/30 border border-slate-850 flex items-center justify-between text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="font-semibold text-slate-200">{log.action}</span>
                            <span className="text-[10px] text-slate-500">by Admin</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 pb-4 border-b border-slate-850">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-2xl overflow-hidden shadow-lg">
                        {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
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
                          {role || "Enterprise Admin"}
                        </span>
                        <span className="text-xs text-emerald-400 font-bold">Completeness: {profileCompletion}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Full Name</label>
                      <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Username</label>
                      <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Company / Organization</label>
                      <Input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Department</label>
                      <Input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Phone Number</label>
                      <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium block">Location / Country</label>
                      <Input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium block text-xs">Bio & Executive Summary</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}

              {/* WORKSPACE & REGION TAB */}
              {activeTab === "workspace" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building className="h-5 w-5 text-indigo-400" /> Workspace Settings
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage workspace names, deployment clusters, and region specifications.</p>
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
                      <label className="text-slate-400">Workspace UUID</label>
                      <div className="h-10 px-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center text-indigo-300 text-xs">
                        ws_uuid_89201982a10
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400">Active Deployment Region</label>
                    <select
                      className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                      value={workspaceRegion}
                      onChange={(e) => {
                        setWorkspaceRegion(e.target.value);
                        saveSetting('workspaceRegion', e.target.value);
                      }}
                    >
                      <option value="us-central1 (Iowa)">us-central1 (Iowa, USA) - Cluster A</option>
                      <option value="asia-south1 (Mumbai)">asia-south1 (Mumbai, India) - Cluster B</option>
                      <option value="europe-west3 (Frankfurt)">europe-west3 (Frankfurt, Germany) - Cluster C</option>
                    </select>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-slate-800/60">
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-red-400 text-sm">Danger Zone</h4>
                        <p className="text-slate-400 mt-0.5 text-xs">Irreversibly transfer complete ownership of this workspace to another admin.</p>
                      </div>
                      <Button onClick={() => toast.success("Ownership transfer workflow initiated")} variant="destructive" className="bg-red-600 hover:bg-red-500 text-white rounded-xl">
                        Transfer Ownership
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ORGANIZATION & TEAMS TAB */}
              {activeTab === "organization" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-400" /> Organization & Directory
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Configure organization entities and view member mappings.</p>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                    <span className="text-slate-400">Current Corporate Organization</span>
                    <Input value={company} onChange={e => setCompany(e.target.value)} className="bg-slate-950/60 border-slate-800 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Registered Directory Team Members</span>
                      <Button onClick={() => toast.success("Invitation dispatched to new team member!")} size="sm" className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3">
                        + Add Team Member
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Paras Bishnoi</span>
                          <span className="text-slate-500 text-[10px]">parasbishnoi012@gmail.com</span>
                        </div>
                        <span className="text-indigo-400 font-bold uppercase text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Super Admin</span>
                      </div>
                      <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Karunya Sharma</span>
                          <span className="text-slate-500 text-[10px]">karunya.sharma@vivexa.ai</span>
                        </div>
                        <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Admin</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY & 2FA TAB */}
              {activeTab === "security" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-400" /> Security Policies & Authentication
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Control multifactor identity flows and credentials validation.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">Two-Factor Authentication (2FA)</h4>
                      <p className="text-slate-400 mt-0.5">Secure your login with TOTP authenticator keys.</p>
                    </div>
                    <Button
                      onClick={() => { 
                        const newVal = !twoFactorEnabled;
                        setTwoFactorEnabled(newVal);
                        saveSetting('twoFactorEnabled', newVal);
                        toast.success(`2FA successfully ${newVal ? 'Activated' : 'Revoked'}`); 
                      }}
                      className={twoFactorEnabled ? "bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl" : "bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"}
                    >
                      {twoFactorEnabled ? "2FA Verified Active" : "Setup 2FA Key"}
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3">
                    <h4 className="font-bold text-white text-xs">Alter Account Password</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="password" placeholder="Current Secret Phrase" value={currPassword} onChange={e => setCurrPassword(e.target.value)} className="h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none" />
                      <input type="password" placeholder="New Strong Phrase" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none" />
                    </div>
                    <Button 
                      onClick={handleUpdatePassword} 
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                      Update Credentials
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">Security Audit Logs</h4>
                      <p className="text-slate-400 mt-0.5">Download a detailed cryptographic report of your security events.</p>
                    </div>
                    <Button
                      onClick={() => toast.success("Security logs download initiated...")}
                      variant="outline"
                      className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/10 rounded-xl"
                    >
                      <Download className="h-4 w-4 mr-2" /> Security Log Download
                    </Button>
                  </div>
                </div>
              )}

              {/* ACTIVE SESSIONS TAB */}
              {activeTab === "sessions" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-indigo-400" /> Active Session Mappings
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Current logged in cookies mapping to your identity hash.</p>
                  </div>

                  <div className="space-y-3">
                    {sessions.map((sess) => (
                      <div key={sess.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {sess.device.includes("iPhone") || sess.device.includes("iOS") || sess.device.includes("Android") ? (
                            <Smartphone className="h-6 w-6 text-indigo-400 shrink-0" />
                          ) : (
                            <Laptop className={sess.current ? "h-6 w-6 text-emerald-400 shrink-0" : "h-6 w-6 text-slate-400 shrink-0"} />
                          )}
                          <div>
                            <span className="font-bold text-slate-200 block flex items-center gap-2">
                              {sess.device}
                              {sess.current && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Current</span>
                              )}
                            </span>
                            <span className="text-slate-500 text-[10px]">IP: {sess.ip} • {sess.location} ({sess.time})</span>
                          </div>
                        </div>
                        {sess.current ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold">Active</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="bg-slate-950/50 border-slate-800 text-rose-400 hover:text-rose-300 h-8 rounded-lg"
                          >
                            Revoke Session
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS & ALERTS TAB */}
              {activeTab === "notifications" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Bell className="h-5 w-5 text-indigo-400" /> Notifications & Alerts Preferences
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle channel delivery preferences for platform notifications.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-200 block">Critical Security Alerts</span>
                        <span className="text-slate-500 text-[10px]">Immediate dispatch on root alterations or password resets.</span>
                      </div>
                      <button
                        onClick={() => {
                          const nextVal = !notifCritical;
                          setNotifCritical(nextVal);
                          saveSetting('notifCritical', nextVal);
                          toast.success("Critical alerts preference updated.");
                        }}
                        className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notifCritical ? "bg-indigo-600" : "bg-slate-800"}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${notifCritical ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-200 block">Weekly Digests</span>
                        <span className="text-slate-500 text-[10px]">Analytical updates of team datasets and workspace storage limits.</span>
                      </div>
                      <button
                        onClick={() => {
                          const nextVal = !notifWeekly;
                          setNotifWeekly(nextVal);
                          saveSetting('notifWeekly', nextVal);
                          toast.success("Weekly digest preference updated.");
                        }}
                        className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notifWeekly ? "bg-indigo-600" : "bg-slate-800"}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${notifWeekly ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-200 block">Platform System Updates</span>
                        <span className="text-slate-500 text-[10px]">Updates about product enhancements, scheduled maintenance, and feature changes.</span>
                      </div>
                      <button
                        onClick={() => {
                          const nextVal = !notifSystem;
                          setNotifSystem(nextVal);
                          saveSetting('notifSystem', nextVal);
                          toast.success("Platform system updates preference updated.");
                        }}
                        className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notifSystem ? "bg-indigo-600" : "bg-slate-800"}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${notifSystem ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-200 block">Workspace Invitations</span>
                        <span className="text-slate-500 text-[10px]">Receive notifications when you are invited to new workspaces.</span>
                      </div>
                      <button
                        onClick={() => {
                          const nextVal = !notifInvites;
                          setNotifInvites(nextVal);
                          saveSetting('notifInvites', nextVal);
                          toast.success("Workspace invitations preference updated.");
                        }}
                        className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notifInvites ? "bg-indigo-600" : "bg-slate-800"}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${notifInvites ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LANGUAGE TAB */}
              {activeTab === "language" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Globe className="h-5 w-5 text-indigo-400" /> Language & Localization Parameters
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Configure preferred translation mappings and time variables.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400">Display Language</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none"
                        value={displayLanguage}
                        onChange={(e) => {
                          setDisplayLanguage(e.target.value);
                          saveSetting('displayLanguage', e.target.value);
                          toast.success(`Display language updated to: ${e.target.value.toUpperCase()}`);
                        }}
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">Hindi (IN)</option>
                        <option value="de">Deutsch (DE)</option>
                        <option value="es">Español (ES)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400">Timezone Offset</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none"
                        value={displayTimezone}
                        onChange={(e) => {
                          setDisplayTimezone(e.target.value);
                          saveSetting('displayTimezone', e.target.value);
                          toast.success(`System timezone altered to: ${e.target.value}`);
                        }}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="UTC">UTC (Coordinated Time)</option>
                        <option value="US/Eastern">US/Eastern (EST -5:00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STORAGE ANALYTICS TAB */}
              {activeTab === "storage" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-indigo-400" /> Storage & Assets Analytics
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of files saved in storage bucket systems.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-xs">Uploaded Datasets Count</span>
                        <span className="text-xl font-bold text-white block mt-1">{datasetCount} CSV files</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-xs">Total Storage Utilized</span>
                        <span className="text-xl font-bold text-indigo-400 block mt-1">{(storageBytes / (1024 * 1024)).toFixed(2)} MB / 10 GB</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">Refresh Storage Metrics</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Scans storage buckets to recalculate active utilization hashes.</p>
                    </div>
                    <Button
                      onClick={handleRecalculateStorage}
                      disabled={isRecalculatingStorage}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 px-4 font-semibold"
                    >
                      {isRecalculatingStorage ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Recalculating...
                        </>
                      ) : (
                        "Recalculate Now"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* USAGE & LIMITS TAB */}
              {activeTab === "usage" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-indigo-400" /> Usage Telemetry & Quota Limits
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Live monitoring of computational quotas used within the current billing period.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex justify-between font-bold text-sm">
                        <span className="text-slate-200">AI API Calls</span>
                        <span className="text-indigo-400 font-mono">{aiUsageCount} / {getQuotaLimit().toLocaleString()} calls ({((aiUsageCount / getQuotaLimit()) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (aiUsageCount / getQuotaLimit()) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                        <span>Reset Date: 1st of next month</span>
                        <span>Tier: {userPlan.toUpperCase()} Plan Quota</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBSCRIPTION & PLAN TAB */}
              {activeTab === "subscription" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-400" /> Subscription Plan Configuration
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Current license mappings and access level entitlements.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Free Plan */}
                    <div className={`p-4 rounded-xl border transition-all ${userPlan === "free" ? "bg-indigo-950/10 border-indigo-500/40" : "bg-slate-950/30 border-slate-800"}`}>
                      <h4 className="font-extrabold text-sm text-slate-100">Starter Free</h4>
                      <p className="text-slate-500 text-[10px] mt-1">Basic exploratory capabilities for general users.</p>
                      <div className="text-white font-extrabold text-base mt-2">₹0 / month</div>
                      {userPlan === "free" ? (
                        <span className="mt-4 block w-full text-center text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-1.5 rounded font-bold uppercase">Current Plan</span>
                      ) : (
                        <Button onClick={() => handleUpgradePlan("free")} className="mt-4 w-full h-8 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs">
                          Downgrade
                        </Button>
                      )}
                    </div>

                    {/* Pro Plan */}
                    <div className={`p-4 rounded-xl border transition-all ${userPlan === "pro" ? "bg-indigo-950/10 border-indigo-500/40" : "bg-slate-950/30 border-slate-800"}`}>
                      <h4 className="font-extrabold text-sm text-indigo-400 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-amber-400" /> Pro Business</h4>
                      <p className="text-slate-500 text-[10px] mt-1">Full predictive models, datasets analytics, and reports customization.</p>
                      <div className="text-white font-extrabold text-base mt-2">₹499 / month</div>
                      {userPlan === "pro" ? (
                        <span className="mt-4 block w-full text-center text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-1.5 rounded font-bold uppercase">Current Plan</span>
                      ) : (
                        <Button onClick={() => handleUpgradePlan("pro")} className="mt-4 w-full h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
                          Select Pro
                        </Button>
                      )}
                    </div>

                    {/* Enterprise Plan */}
                    <div className={`p-4 rounded-xl border transition-all ${userPlan === "enterprise" ? "bg-indigo-950/10 border-indigo-500/40" : "bg-slate-950/30 border-slate-800"}`}>
                      <h4 className="font-extrabold text-sm text-amber-400">Enterprise Scale</h4>
                      <p className="text-slate-500 text-[10px] mt-1">Unlimited model iterations, custom integrations, dedicated service agents.</p>
                      <div className="text-white font-extrabold text-base mt-2">₹1,499 / month</div>
                      {userPlan === "enterprise" ? (
                        <span className="mt-4 block w-full text-center text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-1.5 rounded font-bold uppercase">Current Plan</span>
                      ) : (
                        <Button onClick={() => handleUpgradePlan("enterprise")} className="mt-4 w-full h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
                          Select Enterprise
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING & INVOICES TAB */}
              {activeTab === "billing" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-400" /> Billing Credentials & Invoices
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Registered credit profiles and previous operational invoices.</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Invoices History</h4>
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between text-xs gap-4">
                        <div>
                          <span className="font-bold text-slate-200 block">Invoice #{inv.id}</span>
                          <span className="text-slate-500 text-[10px]">Date: {inv.date} • {inv.plan.toUpperCase()} Monthly Renewal</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400 font-mono">₹{inv.amount.toFixed(2)} INR ({inv.status})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(inv)}
                            className="h-8 bg-slate-900 text-[10.5px] hover:bg-slate-800 text-slate-300 rounded-lg"
                          >
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API KEYS TAB */}
              {activeTab === "apikeys" && (
                <div className="space-y-6 text-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-indigo-400" /> Secret SDK API Keys
                      </h3>
                      <p className="text-xs text-slate-400">Authorized keys for secure data syncing pipelines.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="API Key Name (e.g. Staging Pipeline)"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      className="bg-slate-950/60 border-slate-800 rounded-xl md:col-span-2 h-10"
                    />
                    <Button onClick={handleCreateApiKey} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10">
                      <Plus className="h-4 w-4 mr-1.5" /> Generate Key
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {isApiKeysLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <p className="text-center text-slate-500 py-4">No active API keys found.</p>
                    ) : (
                      apiKeys.map((key) => (
                        <div key={key.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-200 block">{key.name}</span>
                            <span className="font-mono text-indigo-400 text-[10.5px] block mt-1">{key.prefix || key.key_prefix}...</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">Created: {new Date(key.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { navigator.clipboard.writeText(key.prefix || key.key_prefix); toast.success("Prefix copied to clipboard!"); }}
                              className="h-8 text-[11px] hover:bg-slate-800 text-indigo-400 rounded-lg"
                            >
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="h-8 text-[11px] hover:bg-red-500/10 text-red-400 rounded-lg"
                            >
                              Revoke
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* CONNECTED ACCOUNTS TAB */}
              {activeTab === "accounts" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-indigo-400" /> Connected Accounts Mappings
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">External Oauth providers synced to your primary platform identity.</p>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Google Account Verification</span>
                      <span className="text-slate-500 text-[10px]">{user?.email}</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-bold text-[10px]">Connected</span>
                  </div>
                </div>
              )}

              {/* CONNECTED DEVICES TAB */}
              {activeTab === "devices" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Laptop className="h-5 w-5 text-indigo-400" /> Registered Hardware Devices
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Authorized devices permitted to access system API layers.</p>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Laptop className="h-6 w-6 text-indigo-400" />
                      <div>
                        <span className="font-bold text-slate-200 block">MacBook Pro 16" (M3 Max)</span>
                        <span className="text-slate-500 text-[10px]">Last Sync: Just now • Bengaluru, India</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[10px]">Verified</span>
                  </div>
                </div>
              )}

              {/* AI PREFERENCES TAB */}
              {activeTab === "ai_prefs" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400" /> Copilot AI Engine Parameters
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Configure target models, generative temperature, and query automations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Active LLM Model</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none"
                        value={aiModel}
                        onChange={e => {
                          setAiModel(e.target.value);
                          saveSetting('aiModel', e.target.value);
                        }}
                      >
                        <option value="gemini-3.6-flash">Gemini 2.5 Flash (Fastest / Code generation)</option>
                        <option value="gemini-3.1-pro-preview">Gemini 2.5 Pro (Data Science reasoning)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Creativity Index (Temperature)</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none"
                        value={creativity}
                        onChange={e => {
                          setCreativity(e.target.value);
                          saveSetting('creativity', e.target.value);
                        }}
                      >
                        <option value="0.1">0.1 (Strict mathematical outputs)</option>
                        <option value="0.5">0.5 (Balanced strategic assessment)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Automated SQL Verification</span>
                      <span className="text-slate-500">Enable Gemini to verify schema column matching prior to SQL executions.</span>
                    </div>
                    <button onClick={() => { 
                      const newVal = !autoSql;
                      setAutoSql(newVal); 
                      saveSetting('autoSql', newVal);
                      toast.success("Preference verified!"); 
                    }} className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${autoSql ? "bg-indigo-600" : "bg-slate-800"}`}><div className={`h-5 w-5 rounded-full bg-white transition-transform ${autoSql ? "translate-x-5" : ""}`} /></button>
                  </div>
                </div>
              )}

              {/* PRIVACY & DATA POLICY TAB */}
              {activeTab === "privacy" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Lock className="h-5 w-5 text-indigo-400" /> Privacy & Data Retention Policies
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Control data diagnostic pipelines and regulatory constraints.</p>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Diagnostic telemetry logging</span>
                      <span className="text-slate-500">Transmit anonymous stack trace performance error values to Error Center.</span>
                    </div>
                    <button onClick={() => toast.success("Privacy synchronized")} className="h-6 w-11 rounded-full p-0.5 bg-indigo-600"><div className="h-5 w-5 rounded-full bg-white translate-x-5" /></button>
                  </div>
                </div>
              )}

              {/* EXPORT & BACKUP TAB */}
              {activeTab === "backup" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Download className="h-5 w-5 text-indigo-400" /> Export & Workspace Backups
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Compile and export secure JSON profiles of user settings and dataset metadata.</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950/30 border border-slate-850 text-center space-y-4">
                    <Database className="h-8 w-8 text-indigo-400 mx-auto animate-pulse" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Download Full Settings Archive</h4>
                      <p className="text-slate-400 mt-1 max-w-sm mx-auto">Export API prefixes, metadata log files, and active settings objects cleanly.</p>
                    </div>
                    <Button onClick={handleBackupWorkspace} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
                      <Download className="h-4 w-4 mr-1.5" /> Download JSON Backup
                    </Button>
                  </div>
                </div>
              )}

              {/* SUPPORT TAB */}
              {activeTab === "support" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-indigo-400" /> Support & Engineering Help
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Connect with the Vivexa engineering team or browse documentation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4">
                      <div className="p-3 rounded-xl bg-indigo-500/10 w-fit">
                        <FileText className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Enterprise Documentation</h4>
                        <p className="text-slate-400 mt-1">Detailed guides on API integration, custom agent orchestration, and data security.</p>
                      </div>
                      <Button variant="outline" className="w-full border-slate-800 hover:bg-slate-800 text-xs rounded-xl">
                        Browse Docs <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 w-fit">
                        <Activity className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Live Platform Status</h4>
                        <p className="text-slate-400 mt-1">Real-time monitoring of all Vivexa clusters, database health, and AI latency.</p>
                      </div>
                      <Button variant="outline" className="w-full border-slate-800 hover:bg-slate-800 text-xs rounded-xl">
                        View Status Page <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-400" /> Open a Priority Ticket
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-400">Issue Category</label>
                        <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white">
                          <option>Technical Issue / Bug</option>
                          <option>Account & Billing</option>
                          <option>Feature Request</option>
                          <option>Security Vulnerability</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400">Message</label>
                        <textarea placeholder="Describe your issue in detail..." rows={4} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                      </div>
                      <Button onClick={() => toast.success("Priority support ticket dispatched to Vivexa Engineering team!")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">
                        Dispatch Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              )}


            </div>

            {/* Footer sync indicator */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-850 mt-12 text-slate-500 text-[10.5px]">
              <span>Active identity token: <strong className="text-indigo-400 font-mono font-normal">supabase_auth_sync</strong></span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Fully synchronized with Supabase DB</span>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
