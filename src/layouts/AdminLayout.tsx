import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Users, CreditCard, Activity, Database, ShieldAlert, FileWarning, Shield, Server, 
  HardDrive, Loader2, Mail, Bell, Menu, X, Search, Command, Cpu, Terminal, Zap,
  RefreshCw, Lock, Sparkles, CheckCircle2, Sliders, ChevronRight
} from "lucide-react";
import { AppBackground } from "@/components/layout/AppBackground";
import { useAuthStore } from "@/stores/authStore";
import { getUserRoleFromDb, isAdminRole } from "@/lib/rbac";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { Logo } from "@/components/ui/Logo";
import NotificationDrawer from "@/components/workspace/NotificationDrawer";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function AdminLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  // System Live Indicators
  const [sysHealth, setSysHealth] = useState({
    cpu: 12,
    mem: 42,
    dbLatency: "11ms",
    status: "Operational"
  });

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
    async function checkRole() {
      if (!user) {
        setHasAdminAccess(false);
        setCheckingRole(false);
        return;
      }

      const role = await getUserRoleFromDb(user.id, user.email || undefined);
      setHasAdminAccess(isAdminRole(role, user.email));
      setCheckingRole(false);
    }

    checkRole();
  }, [user]);

  // Command Palette Keyboard Shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Periodic System Health Ping
  useEffect(() => {
    const pingDb = async () => {
      try {
        const start = performance.now();
        await supabase.from("profiles").select("id", { count: "exact", head: true });
        const latency = Math.round(performance.now() - start);
        setSysHealth(prev => ({
          ...prev,
          dbLatency: `${latency}ms`,
          status: "Operational"
        }));
      } catch {
        setSysHealth(prev => ({ ...prev, status: "Degraded" }));
      }
    };
    pingDb();
    const interval = setInterval(pingDb, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminNavGroups = [
    {
      title: "Overview & Metrics",
      items: [
        { path: "/admin", label: "Platform Overview", icon: Activity, exact: true, badge: "Live" },
        { path: "/admin/system", label: "System Health & Status", icon: Server },
        { path: "/admin/infrastructure", label: "Infrastructure Cluster", icon: Cpu }
      ]
    },
    {
      title: "Identity & Governance",
      items: [
        { path: "/admin/users", label: "User Management", icon: Users },
        { path: "/admin/requests", label: "Upgrade Requests", icon: CreditCard, badge: "3 Pending" },
        { path: "/admin/roles", label: "Role & RBAC Matrix", icon: Shield }
      ]
    },
    {
      title: "Resources & Assets",
      items: [
        { path: "/admin/projects", label: "Projects Directory", icon: HardDrive },
        { path: "/admin/datasets", label: "Dataset Management", icon: Database }
      ]
    },
    {
      title: "Security & Observability",
      items: [
        { path: "/admin/audit-logs", label: "Audit Logs", icon: FileWarning },
        { path: "/admin/security", label: "Security & SIEM Logs", icon: ShieldAlert, badge: "Protected" },
        { path: "/admin/errors", label: "Error Center / Diagnostics", icon: Terminal },
        { path: "/admin/emails", label: "Email Delivery & Logs", icon: Mail }
      ]
    }
  ];

  const quickCommands = [
    { name: "Go to Platform Overview", route: "/admin", icon: Activity },
    { name: "Go to User Management", route: "/admin/users", icon: Users },
    { name: "Go to Security & SIEM Logs", route: "/admin/security", icon: ShieldAlert },
    { name: "Go to System Health", route: "/admin/system", icon: Server },
    { name: "Go to Infrastructure Cluster", route: "/admin/infrastructure", icon: Cpu },
    { name: "Go to Audit Trail Logs", route: "/admin/audit-logs", icon: FileWarning },
    { name: "Go to Error Diagnostics Console", route: "/admin/errors", icon: Terminal },
    { name: "Go to Role Management Policy", route: "/admin/roles", icon: Shield }
  ].filter(c => !commandSearch || c.name.toLowerCase().includes(commandSearch.toLowerCase()));

  if (checkingRole) {
    return (
      <AppBackground centered={true}>
        <div className="flex flex-col items-center justify-center gap-3 text-slate-300 font-sans">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold tracking-wide">Verifying Administrative Credentials...</span>
        </div>
      </AppBackground>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AppBackground centered={false}>
        <AccessDenied 
          title="403 - Administrative Privilege Required" 
          message="You are attempting to access the Vivexa System Admin Console. Your account lacks 'Admin' or 'Super Admin' privileges."
          requiredRole="Admin or Super Admin"
        />
      </AppBackground>
    );
  }

  return (
    <AppBackground centered={false}>
      <div className="flex h-screen w-full relative z-10 text-slate-50 overflow-hidden font-sans">
        {/* Admin Sidebar - Desktop */}
        <aside className="hidden lg:flex w-64 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl flex-col shrink-0">
          <div className="flex h-16 items-center px-5 border-b border-slate-800/80 justify-between">
            <Link to="/admin" className="flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors text-slate-200 hover:text-white">
              <Logo size="sm" />
            </Link>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold tracking-wider">
              ADMIN CONSOLE
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {adminNavGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {group.title}
                </div>
                {group.items.map((navItem) => {
                  const Icon = navItem.icon;
                  return (
                    <NavLink
                      key={navItem.path}
                      to={navItem.path}
                      end={navItem.exact}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? "text-white bg-slate-800/80 border border-slate-700/60 shadow-md shadow-indigo-950/20"
                            : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent"
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-indigo-400" />
                        <span>{navItem.label}</span>
                      </div>
                      {navItem.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                          {navItem.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-800/80 p-3 bg-slate-950/60">
            <Link 
              to="/workspace" 
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-800 transition-all shadow-sm"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180 text-indigo-400" />
              Return to Workspace
            </Link>
          </div>
        </aside>

        {/* Admin Sidebar - Mobile Slide-out */}
        <AnimatePresence>
          {isAdminSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdminSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden"
              />

              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 p-4 flex flex-col h-full shadow-2xl lg:hidden overflow-hidden text-slate-100"
              >
                <div className="flex h-14 items-center px-2 justify-between border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <Logo size="sm" />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                      ADMIN
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAdminSidebarOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-5">
                  {adminNavGroups.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {group.title}
                      </div>
                      {group.items.map((navItem) => {
                        const Icon = navItem.icon;
                        return (
                          <NavLink
                            key={navItem.path}
                            to={navItem.path}
                            end={navItem.exact}
                            onClick={() => setIsAdminSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                                isActive
                                  ? "text-white bg-slate-800/80 border border-slate-700/60"
                                  : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                              }`
                            }
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4 text-indigo-400" />
                              <span>{navItem.label}</span>
                            </div>
                            {navItem.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {navItem.badge}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 p-3 mt-auto">
                  <Link 
                    to="/workspace" 
                    onClick={() => setIsAdminSidebarOpen(false)} 
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
                  >
                    Return to Workspace
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <header className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-4 md:px-6 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAdminSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Toggle admin sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              
              {/* Command Palette Trigger Input */}
              <button
                onClick={() => setShowCommandPalette(true)}
                className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs transition-all w-64 md:w-80"
              >
                <Search className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate">Search admin console, users, routes...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 border border-slate-700">
                  <Command className="h-3 w-3" />K
                </kbd>
              </button>

              {/* Status Indicator Badge */}
              <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-xl font-mono text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${sysHealth.status === 'Operational' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-slate-400 font-sans">Status:</span>
                  <span className="text-emerald-400 font-semibold">{sysHealth.status}</span>
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400 font-sans">DB Latency: <span className="text-cyan-300">{sysHealth.dbLatency}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => setIsNotificationDrawerOpen(true)}
                aria-label="Open notifications"
                className="relative rounded-xl p-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors border border-transparent hover:border-slate-700/50 cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-rose-400">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.button>
              <div className="h-6 w-px bg-slate-800 mx-1" />
              <ProfileDropdown />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="h-full max-w-7xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Command Palette Modal */}
        <AnimatePresence>
          {showCommandPalette && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans"
              >
                <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950">
                  <Search className="h-4 w-4 text-indigo-400 mr-2" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search admin console commands & navigation..."
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                  <button onClick={() => setShowCommandPalette(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {quickCommands.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No matching commands found.</div>
                  ) : (
                    quickCommands.map((cmd, idx) => {
                      const CmdIcon = cmd.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setShowCommandPalette(false);
                            navigate(cmd.route);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs text-slate-200 group"
                        >
                          <div className="flex items-center gap-3">
                            <CmdIcon className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                            <span className="font-medium">{cmd.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">{cmd.route}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Use <b>↑</b> <b>↓</b> to navigate, <b>Enter</b> to select</span>
                  <span>Esc to close</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
      </div>
    </AppBackground>
  );
}
