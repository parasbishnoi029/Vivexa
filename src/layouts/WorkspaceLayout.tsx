import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FolderKanban, Settings, Bell, Search, Database,
  BarChart3, Bot, FileText, LayoutTemplate, Bookmark, Activity, ScrollText,
  Shield, HelpCircle, MessageSquare, ChevronDown, Moon, Sun, Command, Users, CreditCard, Key,
  Network, Cable, TerminalSquare, Workflow, Blocks, ActivitySquare, BookOpen, Menu, X,
  Boxes, Layers, Globe, Brain, Building2, User, Plus, Wifi, WifiOff
} from "lucide-react";
import { AppBackground } from "@/components/layout/AppBackground";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { supabase } from "@/lib/supabase";
import { isAdminRole } from "@/lib/rbac";
import { toast } from "sonner";

import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import NotificationDrawer from "@/components/workspace/NotificationDrawer";
import QuotaLimitModal from "@/components/workspace/QuotaLimitModal";
import { Logo } from "@/components/ui/Logo";
import { useNotifications } from "@/hooks/useNotifications";

const NavItem = ({ to, icon: Icon, children, disabled = false, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={disabled ? "#" : to} 
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
        } else if (onClick) {
          onClick();
        }
      }}
    >
      {isActive && (
        <motion.div 
          layoutId="active-nav-bg"
          className="absolute inset-0 rounded-xl bg-indigo-500/15 border border-indigo-500/30"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800/50 group-hover:bg-slate-700/50 text-slate-400 group-hover:text-white'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="relative z-10">{children}</span>
    </Link>
  );
};

export default function WorkspaceLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('User');
  const [userPlan, setUserPlan] = useState<string>('Free');
  const [headerSearch, setHeaderSearch] = useState("");
  const [healthStatus, setHealthStatus] = useState<'online' | 'degraded' | 'offline'>('online');
  const [latency, setLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored. Back online!", { id: "network-status" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Network connection lost. Some features might be offline.", { id: "network-status" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const { selectedWorkspaceId, setSelectedWorkspaceId } = useWorkspaceStore();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      const startTime = Date.now();
      try {
        const res = await fetch('/api/v1/health', { cache: 'no-store' });
        const endTime = Date.now();
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'healthy') {
            setHealthStatus('online');
          } else {
            setHealthStatus('degraded');
          }
          setLatency(endTime - startTime);
        } else {
          setHealthStatus('offline');
          setLatency(null);
        }
      } catch (err) {
        if (!active) return;
        setHealthStatus('offline');
        setLatency(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const {
    notifications,
    unreadCount,
    isLoading: isNotifLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead
  } = useNotifications(15000);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        navigate("/workspace/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleHeaderSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/workspace/search?q=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      navigate("/workspace/search");
    }
  };

  useEffect(() => {
    async function loadWorkspaces() {
      if (!user) return;
      try {
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;
        if (!session) return;

        const res = await fetch('/api/v1/organization/workspaces', {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setWorkspaces(json.data);
          
          const activeId = useWorkspaceStore.getState().selectedWorkspaceId;
          const found = json.data.find((w: any) => w.id === activeId);
          if (!found && json.data.length > 0) {
            setSelectedWorkspaceId(json.data[0].id);
          }
        }
      } catch (err) {
        console.warn("Error fetching workspaces in WorkspaceLayout:", err);
      }
    }
    loadWorkspaces();
  }, [user?.id]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      if (!session) return;

      const res = await fetch("/api/v1/organization/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: newWorkspaceName.trim() })
      });
      const json = await res.json();
      if (json.success && json.data) {
        toast.success(`Created workspace: ${json.data.name}`);
        setShowNewWorkspaceModal(false);
        setNewWorkspaceName("");
        setSelectedWorkspaceId(json.data.id);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(json.error || "Failed to create workspace");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during workspace creation.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  useEffect(() => {
    async function fetchUserMeta() {
      if (!user) return;
      try {
        const { data: uData } = await supabase.from('users').select('role, plan').eq('id', user.id).maybeSingle();
        const { data: pData } = await supabase.from('profiles').select('role, plan').eq('user_id', user.id).maybeSingle();
        
        const role = pData?.role || uData?.role || 'User';
        const plan = uData?.plan || pData?.plan || 'Free';
        
        setUserRole(role);
        setUserPlan(plan);
      } catch (err) {
        console.warn("Error fetching user meta in WorkspaceLayout:", err);
      }
    }
    fetchUserMeta();
  }, [user]);

  useEffect(() => {
    async function checkPendingInvitation() {
      if (!user) return;
      const pendingInviteId = localStorage.getItem("pending_invite_id");
      if (!pendingInviteId) return;

      try {
        console.log(`[INVITE AUTO-ACCEPT] Attempting to auto-accept invitation: ${pendingInviteId}`);
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;
        if (!session) return;

        const res = await fetch(`/api/v1/organization/invitations/${pendingInviteId}/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        const data = await res.json();
        if (data.success) {
          toast.success("Successfully joined the workspace!");
          if (data.data && data.data.workspace_id) {
            setSelectedWorkspaceId(data.data.workspace_id);
          }
          // Reload page/data so the member list/dashboard updates
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          console.error("Auto-accept invitation failed:", data.error || data.meta?.error);
          toast.error(data.error || data.meta?.error || "Could not auto-join the workspace.");
        }
      } catch (err: any) {
        console.error("Error during auto-accepting invitation:", err);
      } finally {
        localStorage.removeItem("pending_invite_id");
      }
    }
    checkPendingInvitation();
  }, [user]);

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeWorkspace = workspaces.find((w: any) => w.id === selectedWorkspaceId);
  const activeWorkspaceName = activeWorkspace?.name || "Enterprise Core";

  const hasAdminPermission = isAdminRole(userRole, user?.email);

  const handleGlobalSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Orchestrating global MNC++ node synchronization...',
        success: 'Global workspace state synchronized across all regions.',
        error: 'Global synchronization failed.',
      }
    );
  };

  return (
    <AppBackground centered={false}>
      <div className="flex h-screen w-full relative z-10 text-slate-200 overflow-hidden">
        {/* Floating Sidebar Container */}
        <div className="hidden lg:block p-4 pr-0 h-full">
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-64 rounded-2xl border border-slate-800/50 bg-slate-900/60 backdrop-blur-2xl flex flex-col shadow-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            
            <div className="flex h-20 items-center px-6 relative z-10">
              <Link to="/workspace" className="flex items-center gap-3 w-full">
                <Logo size="sm" />
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide relative z-10">
              <nav className="space-y-1 px-3">
                <NavItem to="/workspace" icon={LayoutDashboard}>Dashboard</NavItem>
                <NavItem to="/workspace/projects" icon={FolderKanban}>Projects</NavItem>
                <NavItem to="/workspace/datasets" icon={Database}>Datasets</NavItem>
                <NavItem to="/workspace/lakehouse" icon={Network}>Vivexa Lakehouse</NavItem>
              </nav>

              <div className="mt-6 relative z-10">
                <div className="px-6 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">AI Intelligence</div>
                <nav className="space-y-1 px-3">
                  <NavItem to="/workspace/ai" icon={Bot}>AI Analyst</NavItem>
                  <NavItem to="/workspace/ai/chat" icon={MessageSquare}>AI Chat</NavItem>
                  <NavItem to="/workspace/agents" icon={Network}>AI Agents Cockpit</NavItem>
                  <NavItem to="/workspace/search" icon={Search}>Search Analytics</NavItem>
                  <NavItem to="/workspace/predictions" icon={Activity}>Predictions & ML</NavItem>
                  <NavItem to="/workspace/forecasting" icon={BarChart3}>Forecasting</NavItem>
                  <NavItem to="/workspace/recommendations" icon={Bookmark}>Recommendations</NavItem>
                  <NavItem to="/workspace/reports" icon={FileText}>Executive Reports</NavItem>
                  <NavItem to="/workspace/models" icon={Database}>Saved Models</NavItem>
                  <NavItem to="/workspace/memory" icon={ScrollText}>Project Memory</NavItem>
                </nav>
              </div>

              <div className="mt-6 relative z-10">
                <div className="px-6 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">Organisation</div>
                <nav className="space-y-1 px-3">
                  <NavItem to="/workspace/global-search" icon={Search}>Global Search</NavItem>
                  <NavItem to="/workspace/ontology" icon={Boxes}>Enterprise Ontology</NavItem>
                  <NavItem to="/workspace/semantic" icon={Layers}>Semantic Layer</NavItem>
                  <NavItem to="/workspace/organization" icon={Users}>Organisation</NavItem>
                  <NavItem to="/workspace/billing" icon={CreditCard}>Billing & Usage</NavItem>
                  <NavItem to="/workspace/apikeys" icon={Key}>API Keys</NavItem>
                </nav>
              </div>

              <div className="mt-6 relative z-10">
                <div className="px-6 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">Platform Ecosystem</div>
                <nav className="space-y-1 px-3">
                  <NavItem to="/workspace/connectors" icon={Cable}>Data Connectors</NavItem>
                  <NavItem to="/workspace/notebooks" icon={TerminalSquare}>Notebooks</NavItem>
                  <NavItem to="/workspace/automations" icon={Workflow}>Automations</NavItem>
                  <NavItem to="/workspace/plugins" icon={Blocks}>Plugins</NavItem>
                  <NavItem to="/workspace/observability" icon={ActivitySquare}>Observability</NavItem>
                  <NavItem to="/workspace/marketplace" icon={Globe}>Marketplace</NavItem>
                  <NavItem to="/workspace/sdk" icon={TerminalSquare}>Intelligence SDK</NavItem>
                </nav>
              </div>
              
              <div className="mt-6 relative z-10">
                <div className="px-6 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">Help & Resources</div>
                <nav className="space-y-1 px-3">
                  <NavItem to="/workspace/help" icon={HelpCircle}>Help Centre</NavItem>
                  <NavItem to="/workspace/manual" icon={BookOpen}>User Manual</NavItem>
                  <NavItem to="/workspace/notifications" icon={Bell}>Notifications</NavItem>
                  <NavItem to="/workspace/activity" icon={Activity}>Activity</NavItem>
                  <NavItem to="/workspace/changelog" icon={ScrollText}>Changelog</NavItem>
                </nav>
              </div>
            </div>

            <div className="p-4 relative z-10 space-y-3">
              <div className="rounded-2xl bg-slate-950/50 border border-slate-800/50 p-2">
                <nav className="space-y-1">
                  {hasAdminPermission && (
                    <NavItem to="/admin" icon={Shield}>Admin Console</NavItem>
                  )}
                  <NavItem to="/workspace/settings" icon={Settings}>Settings</NavItem>
                </nav>
              </div>

              {/* Robust Status Indicator Block */}
              <div className="rounded-xl bg-slate-950/30 border border-slate-800/30 p-2.5 space-y-2 text-[11px] font-mono">
                {/* Network Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                    )}
                    <span className="text-slate-400">Network:</span>
                    <span className={`font-bold uppercase ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  {!isOnline && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                  )}
                </div>

                <div className="h-[1px] bg-slate-800/20 my-1" />

                {/* Sandbox API Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {healthStatus === 'online' && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                      )}
                      {healthStatus === 'degraded' && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </>
                      )}
                      {healthStatus === 'offline' && (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      )}
                    </span>
                    <span className="text-slate-400">Sandbox API:</span>
                    <span className={`font-bold uppercase ${
                      healthStatus === 'online' ? 'text-emerald-400' :
                      healthStatus === 'degraded' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {healthStatus}
                    </span>
                  </div>
                  {latency !== null && (
                    <span className="text-[10px] text-slate-500">{latency}ms</span>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* Mobile Sidebar Overlay & Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />

              {/* Sidebar Panel */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col h-full shadow-2xl lg:hidden overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                
                <div className="flex h-16 items-center justify-between px-2 relative z-10">
                  <Link to="/workspace" className="flex items-center gap-3" onClick={() => setIsMobileSidebarOpen(false)}>
                    <Logo size="sm" />
                  </Link>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 scrollbar-hide relative z-10">
                  <nav className="space-y-1 px-1">
                    <NavItem to="/workspace" icon={LayoutDashboard} onClick={() => setIsMobileSidebarOpen(false)}>Dashboard</NavItem>
                    <NavItem to="/workspace/projects" icon={FolderKanban} onClick={() => setIsMobileSidebarOpen(false)}>Projects</NavItem>
                    <NavItem to="/workspace/datasets" icon={Database} onClick={() => setIsMobileSidebarOpen(false)}>Datasets</NavItem>
                    <NavItem to="/workspace/lakehouse" icon={Network} onClick={() => setIsMobileSidebarOpen(false)}>Vivexa Lakehouse</NavItem>
                  </nav>

                  <div className="mt-6 relative z-10">
                    <div className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">AI Intelligence</div>
                    <nav className="space-y-1 px-1">
                      <NavItem to="/workspace/ai" icon={Bot} onClick={() => setIsMobileSidebarOpen(false)}>AI Analyst</NavItem>
                      <NavItem to="/workspace/ai/chat" icon={MessageSquare} onClick={() => setIsMobileSidebarOpen(false)}>AI Chat</NavItem>
                      <NavItem to="/workspace/agents" icon={Network} onClick={() => setIsMobileSidebarOpen(false)}>AI Agents Cockpit</NavItem>
                      <NavItem to="/workspace/search" icon={Search} onClick={() => setIsMobileSidebarOpen(false)}>Search Analytics</NavItem>
                      <NavItem to="/workspace/predictions" icon={Activity} onClick={() => setIsMobileSidebarOpen(false)}>Predictions & ML</NavItem>
                      <NavItem to="/workspace/forecasting" icon={BarChart3} onClick={() => setIsMobileSidebarOpen(false)}>Forecasting</NavItem>
                      <NavItem to="/workspace/recommendations" icon={Bookmark} onClick={() => setIsMobileSidebarOpen(false)}>Recommendations</NavItem>
                      <NavItem to="/workspace/reports" icon={FileText} onClick={() => setIsMobileSidebarOpen(false)}>Executive Reports</NavItem>
                      <NavItem to="/workspace/models" icon={Database} onClick={() => setIsMobileSidebarOpen(false)}>Saved Models</NavItem>
                      <NavItem to="/workspace/memory" icon={ScrollText} onClick={() => setIsMobileSidebarOpen(false)}>Project Memory</NavItem>
                    </nav>
                  </div>

                  <div className="mt-6 relative z-10">
                    <div className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">Organisation</div>
                    <nav className="space-y-1 px-1">
                      <NavItem to="/workspace/global-search" icon={Search} onClick={() => setIsMobileSidebarOpen(false)}>Global Search</NavItem>
                      <NavItem to="/workspace/ontology" icon={Boxes} onClick={() => setIsMobileSidebarOpen(false)}>Enterprise Ontology</NavItem>
                      <NavItem to="/workspace/semantic" icon={Layers} onClick={() => setIsMobileSidebarOpen(false)}>Semantic Layer</NavItem>
                      <NavItem to="/workspace/organization" icon={Users} onClick={() => setIsMobileSidebarOpen(false)}>Organisation</NavItem>
                      <NavItem to="/workspace/billing" icon={CreditCard} onClick={() => setIsMobileSidebarOpen(false)}>Billing & Usage</NavItem>
                      <NavItem to="/workspace/apikeys" icon={Key} onClick={() => setIsMobileSidebarOpen(false)}>API Keys</NavItem>
                    </nav>
                  </div>

                  <div className="mt-6 relative z-10">
                    <div className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">Platform Ecosystem</div>
                    <nav className="space-y-1 px-1">
                      <NavItem to="/workspace/connectors" icon={Cable} onClick={() => setIsMobileSidebarOpen(false)}>Data Connectors</NavItem>
                      <NavItem to="/workspace/notebooks" icon={TerminalSquare} onClick={() => setIsMobileSidebarOpen(false)}>Notebooks</NavItem>
                      <NavItem to="/workspace/automations" icon={Workflow} onClick={() => setIsMobileSidebarOpen(false)}>Automations</NavItem>
                      <NavItem to="/workspace/plugins" icon={Blocks} onClick={() => setIsMobileSidebarOpen(false)}>Plugins</NavItem>
                      <NavItem to="/workspace/observability" icon={ActivitySquare} onClick={() => setIsMobileSidebarOpen(false)}>Observability</NavItem>
                      <NavItem to="/workspace/marketplace" icon={Globe} onClick={() => setIsMobileSidebarOpen(false)}>Marketplace</NavItem>
                      <NavItem to="/workspace/sdk" icon={TerminalSquare} onClick={() => setIsMobileSidebarOpen(false)}>Intelligence SDK</NavItem>
                    </nav>
                  </div>
                  
                  <div className="mt-6 relative z-10">
                    <div className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">Help & Resources</div>
                    <nav className="space-y-1 px-1">
                      <NavItem to="/workspace/help" icon={HelpCircle} onClick={() => setIsMobileSidebarOpen(false)}>Help Centre</NavItem>
                      <NavItem to="/workspace/manual" icon={BookOpen} onClick={() => setIsMobileSidebarOpen(false)}>User Manual</NavItem>
                      <NavItem to="/workspace/notifications" icon={Bell} onClick={() => setIsMobileSidebarOpen(false)}>Notifications</NavItem>
                      <NavItem to="/workspace/activity" icon={Activity} onClick={() => setIsMobileSidebarOpen(false)}>Activity</NavItem>
                      <NavItem to="/workspace/changelog" icon={ScrollText} onClick={() => setIsMobileSidebarOpen(false)}>Changelog</NavItem>
                    </nav>
                  </div>
                </div>

                <div className="p-2 relative z-10 mt-auto">
                  <div className="rounded-2xl bg-slate-950/50 border border-slate-800/50 p-2">
                    <nav className="space-y-1">
                      {hasAdminPermission && (
                        <NavItem to="/admin" icon={Shield} onClick={() => setIsMobileSidebarOpen(false)}>Admin Console</NavItem>
                      )}
                      <NavItem to="/workspace/settings" icon={Settings} onClick={() => setIsMobileSidebarOpen(false)}>Settings</NavItem>
                    </nav>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <header className="flex h-20 items-center justify-between px-4 md:px-8 relative z-20">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors shadow-lg cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* MNC++ Multi-Tenant Workspace Switcher */}
              <div className="relative" ref={workspaceMenuRef}>
                <motion.button 
                  whileHover={{ scale: 1.01, translateY: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 backdrop-blur-2xl px-4 py-2 rounded-2xl transition-all hover:bg-slate-800/60 hover:border-indigo-500/40 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden h-14"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-black text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/10 relative z-10">
                    {(activeWorkspaceName || "VX").split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 tracking-tight group-hover:text-white transition-colors truncate max-w-[150px]">
                        {activeWorkspaceName}
                      </span>
                      <div className="relative h-1.5 w-1.5">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                        <div className="relative h-full w-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.1em]">{activeWorkspace?.is_personal ? 'PERSONAL' : userPlan} TENANT</span>
                      <span className="text-[9px] text-slate-600 font-black">•</span>
                      <span className="text-[9px] text-slate-500 font-bold tracking-tight">
                        {activeWorkspace?.is_personal ? 'SANDBOX' : 'ORGANIZATION'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-600 ml-3 transition-all group-hover:translate-y-0.5 group-hover:text-slate-400" />
                </motion.button>
                
                <AnimatePresence>
                  {isWorkspaceMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-3 w-[320px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                    >
                      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Workspace</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                          {workspaces.length} active
                        </span>
                      </div>
                      <div className="p-2 space-y-1 overflow-y-auto scrollbar-hide max-h-[250px]">
                        {workspaces.map((ws: any) => {
                          const isSelected = ws.id === selectedWorkspaceId;
                          return (
                            <button 
                              key={ws.id} 
                              onClick={() => { 
                                setIsWorkspaceMenuOpen(false); 
                                setSelectedWorkspaceId(ws.id);
                                toast.success(`Switched to: ${ws.name}`);
                                setTimeout(() => {
                                  window.location.reload();
                                }, 300);
                              }} 
                              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-800 border border-transparent'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${ws.is_personal ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                  {ws.is_personal ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-white truncate max-w-[180px]">{ws.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {ws.is_personal ? 'Private Sandbox' : `${ws.user_role || 'Member'} • Org`}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              )}
                            </button>
                          );
                        })}
                        {workspaces.length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-500">
                            No workspaces found
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
                        <button 
                          onClick={() => { 
                            setIsWorkspaceMenuOpen(false); 
                            setShowNewWorkspaceModal(true); 
                          }} 
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 transition-all text-xs font-bold cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Create New Workspace
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-5 flex-1 justify-end">
              <form onSubmit={handleHeaderSearchSubmit} className="relative w-full max-w-xs hidden md:block group">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
                <div className="relative flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleHeaderSearchSubmit(e)}
                    className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-md pl-10 pr-12 text-sm outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-500 shadow-inner"
                  />
                  <div 
                    onClick={() => navigate("/workspace/search")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 text-[10px] font-semibold bg-slate-950/50 px-1.5 py-1 rounded-md border border-slate-800 cursor-pointer hover:text-white transition-colors"
                  >
                    <Command className="h-3 w-3" /> K
                  </div>
                </div>
              </form>
              
              <div className="flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  aria-label="Open notifications"
                  className="relative rounded-xl p-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors border border-transparent hover:border-slate-700/50 backdrop-blur-md cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-rose-400">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </motion.button>
                <div className="h-6 w-px bg-slate-800/60 mx-1" />
                <ProfileDropdown />
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 relative z-10 scrollbar-hide">
             <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 8 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -8 }}
                 transition={{ duration: 0.15, ease: "easeOut" }}
                 className="h-full"
               >
                 <Outlet />
               </motion.div>
             </AnimatePresence>
          </main>
        </div>

        <NotificationDrawer 
          isOpen={isNotificationDrawerOpen} 
          onClose={() => setIsNotificationDrawerOpen(false)} 
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isNotifLoading}
          onRefresh={() => loadNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDeleteNotification={deleteNotification}
          onClearAllRead={clearAllRead}
        />
        <QuotaLimitModal />

        {/* Floating Network Offline Status Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
            >
              <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/30 rounded-2xl shadow-xl shadow-rose-950/20 p-4 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/25 shrink-0 animate-pulse">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white tracking-tight">Offline Connection Mode</h4>
                  <p className="text-[10px] text-rose-200 mt-0.5 leading-relaxed">
                    Network loss detected. Some interactive metrics & AI streams are suspended.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Workspace Modal */}
        <AnimatePresence>
          {showNewWorkspaceModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 relative z-10 bg-slate-950/40">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white tracking-tight">Create Workspace</h2>
                      <p className="text-[10px] text-slate-500 font-medium">Add a new collaborative analytics environment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewWorkspaceModal(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateWorkspace} className="p-6 space-y-4 relative z-10">
                  <div className="space-y-1.5">
                    <label htmlFor="workspace-name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace Name</label>
                    <input
                      id="workspace-name"
                      type="text"
                      placeholder="e.g. Finance Analytics, Marketing Dept"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      required
                      disabled={isCreatingWorkspace}
                      className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewWorkspaceModal(false)}
                      disabled={isCreatingWorkspace}
                      className="flex-1 h-11 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                      className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingWorkspace ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Workspace"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppBackground>
  );
}
