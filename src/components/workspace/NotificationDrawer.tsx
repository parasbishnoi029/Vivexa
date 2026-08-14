import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, X, CheckCircle2, Trash2, Search, Filter,
  ExternalLink, Sparkles, Check, Clock, AlertCircle, RefreshCw, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NotificationItem,
  formatRelativeTime,
  getNotificationIcon,
  getNotificationStyle,
  createNotification
} from "@/lib/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  notifications?: NotificationItem[];
  unreadCount?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllRead?: () => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  onUnreadCountChange,
  notifications: propNotifications,
  unreadCount: propUnreadCount,
  isLoading: propIsLoading,
  onRefresh: propOnRefresh,
  onMarkAsRead: propOnMarkAsRead,
  onMarkAllAsRead: propOnMarkAllAsRead,
  onDeleteNotification: propOnDeleteNotification,
  onClearAllRead: propOnClearAllRead
}: NotificationDrawerProps) {
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Hook fallback if props are not provided
  const internalHook = useNotifications(isOpen ? 10000 : 20000);

  const notifications = propNotifications ?? internalHook.notifications;
  const unreadCount = propUnreadCount ?? internalHook.unreadCount;
  const isLoading = propIsLoading ?? internalHook.isLoading;

  const handleRefresh = propOnRefresh ?? (() => internalHook.loadNotifications(false));
  const handleMarkAsRead = propOnMarkAsRead ?? internalHook.markAsRead;
  const handleMarkAllAsRead = propOnMarkAllAsRead ?? internalHook.markAllAsRead;
  const handleDeleteNotification = propOnDeleteNotification ?? internalHook.deleteNotification;
  const handleClearAllRead = propOnClearAllRead ?? internalHook.clearAllRead;

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "today" | "earlier">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Sync unread count with parent callback
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside drawer
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      onClose();
      navigate(notification.action_url);
    }
  };

  // Helper to trigger simulated demo notification
  const handleSimulateAlert = async () => {
    const types = [
      { type: "ai_analysis", title: "AI Decision Model Synthesized", msg: "Gemini 2.5 Pro completed Q3 revenue optimization scenario analysis.", url: "/workspace/ai/chat", priority: "high" },
      { type: "dataset_cleaned", title: "Lakehouse Parquet File Indexed", msg: "1,450,000 rows automatically cleaned and partitioned into Gold Tier.", url: "/workspace/datasets", priority: "medium" },
      { type: "model_trained", title: "Predictive Forecast Model Ready", msg: "ARIMA time-series model achieves 98.4% accuracy rating.", url: "/workspace/predictions", priority: "high" },
      { type: "system_maintenance", title: "Security Governance Scan Passed", msg: "Zero RBAC vulnerabilities detected across enterprise workspace.", url: "/workspace/observability", priority: "low" }
    ] as const;

    const chosen = types[Math.floor(Math.random() * types.length)];
    await createNotification({
      title: chosen.title,
      message: chosen.msg,
      type: chosen.type,
      priority: chosen.priority,
      actionUrl: chosen.url,
      showToast: true
    });
    handleRefresh();
  };

  // Filtering
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    // Search filter
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());

    // Tab filter
    let matchesTab = true;
    if (activeTab === "unread") matchesTab = !n.is_read;
    if (activeTab === "today") matchesTab = isToday(n.created_at);
    if (activeTab === "earlier") matchesTab = !isToday(n.created_at);

    // Category filter
    let matchesCat = true;
    if (selectedCategory !== "all") {
      matchesCat =
        n.type === selectedCategory ||
        (selectedCategory === "system" &&
          (n.type === "system_maintenance" || n.type === "warning" || n.type === "error"));
    }

    return matchesSearch && matchesTab && matchesCat;
  });

  const todayCount = notifications.filter((n) => isToday(n.created_at)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity"
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-md sm:max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 overflow-hidden text-left"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 animate-pulse border-2 border-slate-900" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Notification Center
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {unreadCount} unread
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">Real-time workspace activity & telemetry alerts</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSimulateAlert}
                  className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg"
                  title="Simulate incoming alert"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Refresh notifications"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Controls Bar: Search & Filter Tabs */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Actions & Filter Tabs */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
                <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                  {(
                    [
                      { id: "all", label: "All", count: notifications.length },
                      { id: "unread", label: "Unread", count: unreadCount },
                      { id: "today", label: "Today", count: todayCount },
                      { id: "earlier", label: "Earlier", count: notifications.length - todayCount }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            activeTab === tab.id
                              ? "bg-indigo-700 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-7 px-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark read
                    </Button>
                  )}
                  {notifications.some((n) => n.is_read) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllRead}
                      className="h-7 px-2 text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear read
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
              {isLoading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                  <p className="text-xs">Polling live notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-500">
                  <div className="h-12 w-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300 mb-1">
                    No notifications
                  </h3>
                  <p className="text-xs max-w-xs text-slate-400">
                    {search
                      ? "No items match your search filter."
                      : activeTab === "unread"
                      ? "All caught up! No unread notifications."
                      : "Workspace alerts and automated AI outputs will appear here in real-time."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const style = getNotificationStyle(notification.type, notification.priority);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer backdrop-blur-md
                        ${
                          notification.is_read
                            ? "bg-slate-900/40 border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-700"
                            : "bg-slate-800/80 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.08)] hover:border-indigo-500/60"
                        }
                      `}
                    >
                      {!notification.is_read && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-indigo-500" />
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center shadow-md ${style.bg}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4
                              className={`text-xs sm:text-sm font-bold truncate ${
                                notification.is_read ? "text-slate-300" : "text-white"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>

                          <p
                            className={`text-xs leading-relaxed mb-2 ${
                              notification.is_read ? "text-slate-500" : "text-slate-300"
                            }`}
                          >
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                            <div className="flex items-center gap-1.5">
                              {notification.priority && notification.priority !== "low" && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${style.badge}`}
                                >
                                  {notification.priority}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 capitalize">
                                {notification.type.replace(/_/g, " ")}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              {notification.action_url && (
                                <span className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 mr-1">
                                  View <ExternalLink className="h-2.5 w-2.5" />
                                </span>
                              )}
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded cursor-pointer"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate("/workspace/notifications");
                }}
                className="w-full bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-bold"
              >
                View Full Notification Center →
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
