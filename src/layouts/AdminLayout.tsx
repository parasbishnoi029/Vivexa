import { Outlet, Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, CreditCard, Activity, Database, ShieldAlert, FileWarning, Shield, Server, HardDrive, Loader2, Mail, Bell, Menu, X } from "lucide-react";
import { AppBackground } from "@/components/layout/AppBackground";
import { useAuthStore } from "@/stores/authStore";
import { getUserRoleFromDb, isAdminRole } from "@/lib/rbac";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { Logo } from "@/components/ui/Logo";
import NotificationDrawer from "@/components/workspace/NotificationDrawer";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { motion, AnimatePresence } from "motion/react";
import { useNotifications } from "@/hooks/useNotifications";

export default function AdminLayout() {
  const { user } = useAuthStore();
  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);

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
      <div className="flex h-screen w-full relative z-10 text-slate-50 overflow-hidden">
        {/* Admin Sidebar - Desktop */}
        <aside className="hidden lg:flex w-64 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-xl flex-col shrink-0">
          <div className="flex h-16 items-center px-6 border-b border-slate-800/60 justify-between">
            <Link to="/admin" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-white">
              <Logo size="sm" />
            </Link>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">ADMIN</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              <NavLink to="/admin" end className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Activity className="h-4 w-4 text-slate-400" />
                Platform Overview
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Users className="h-4 w-4 text-slate-400" />
                User Management
              </NavLink>
              <NavLink to="/admin/requests" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <CreditCard className="h-4 w-4 text-slate-400" />
                Upgrade Requests
              </NavLink>
              <NavLink to="/admin/roles" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Shield className="h-4 w-4 text-slate-400" />
                Role Management
              </NavLink>
              <NavLink to="/admin/projects" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <HardDrive className="h-4 w-4 text-slate-400" />
                Projects
              </NavLink>
              <NavLink to="/admin/datasets" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Database className="h-4 w-4 text-slate-400" />
                Datasets
              </NavLink>
              <NavLink to="/admin/system" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Server className="h-4 w-4 text-slate-400" />
                System Health
              </NavLink>
               <NavLink to="/admin/infrastructure" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Database className="h-4 w-4 text-slate-400" />
                Infrastructure
              </NavLink>
              <NavLink to="/admin/audit-logs" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <FileWarning className="h-4 w-4 text-slate-400" />
                Audit Logs
              </NavLink>
              <NavLink to="/admin/security" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                Security Logs
              </NavLink>
              <NavLink to="/admin/errors" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                Error Center
              </NavLink>
              <NavLink to="/admin/emails" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <Mail className="h-4 w-4 text-slate-400" />
                Email Logs & Delivery
              </NavLink>
            </nav>
          </div>
          
          <div className="border-t border-slate-800/60 p-4">
            <Link to="/workspace" className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              Return to Workspace
            </Link>
          </div>
        </aside>

        {/* Admin Sidebar - Mobile Slide-out */}
        <AnimatePresence>
          {isAdminSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdminSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              />

              {/* Sidebar Content */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-850 p-4 flex flex-col h-full shadow-2xl lg:hidden overflow-hidden text-slate-100"
              >
                <div className="flex h-16 items-center px-4 justify-between border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">ADMIN</span>
                  </div>
                  <button
                    onClick={() => setIsAdminSidebarOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="space-y-1 px-2">
                    <NavLink to="/admin" end onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Activity className="h-4 w-4 text-slate-400" />
                      Platform Overview
                    </NavLink>
                    <NavLink to="/admin/users" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Users className="h-4 w-4 text-slate-400" />
                      User Management
                    </NavLink>
                    <NavLink to="/admin/requests" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      Upgrade Requests
                    </NavLink>
                    <NavLink to="/admin/roles" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Shield className="h-4 w-4 text-slate-400" />
                      Role Management
                    </NavLink>
                    <NavLink to="/admin/projects" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <HardDrive className="h-4 w-4 text-slate-400" />
                      Projects
                    </NavLink>
                    <NavLink to="/admin/datasets" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Database className="h-4 w-4 text-slate-400" />
                      Datasets
                    </NavLink>
                    <NavLink to="/admin/system" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Server className="h-4 w-4 text-slate-400" />
                      System Health
                    </NavLink>
                     <NavLink to="/admin/infrastructure" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Database className="h-4 w-4 text-slate-400" />
                      Infrastructure
                    </NavLink>
                    <NavLink to="/admin/audit-logs" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <FileWarning className="h-4 w-4 text-slate-400" />
                      Audit Logs
                    </NavLink>
                    <NavLink to="/admin/security" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <ShieldAlert className="h-4 w-4 text-slate-400" />
                      Security Logs
                    </NavLink>
                    <NavLink to="/admin/errors" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <ShieldAlert className="h-4 w-4 text-slate-400" />
                      Error Center
                    </NavLink>
                    <NavLink to="/admin/emails" onClick={() => setIsAdminSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-white bg-slate-800/50 border border-slate-700/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                      <Mail className="h-4 w-4 text-slate-400" />
                      Email Logs & Delivery
                    </NavLink>
                  </nav>
                </div>

                <div className="border-t border-slate-800/60 p-4 mt-auto">
                  <Link to="/workspace" onClick={() => setIsAdminSidebarOpen(false)} className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
                    Return to Workspace
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <header className="flex h-16 items-center justify-between border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl px-4 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setIsAdminSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors shadow-lg cursor-pointer"
                aria-label="Toggle admin panel"
              >
                <Menu className="h-4 w-4" />
              </button>
              
              <div className="text-xs md:text-sm font-medium text-slate-400 truncate max-w-[200px] sm:max-w-none">
                System Status: <span className="text-emerald-400 font-semibold tracking-wide">All systems operational</span>
              </div>
            </div>

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
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 scrollbar-hide">
             <Outlet />
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
      </div>
    </AppBackground>
  );
}
