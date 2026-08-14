import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCircle2, Search, Filter, Trash2, ExternalLink, Activity, RefreshCw, Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  NotificationItem,
  formatRelativeTime,
  getNotificationIcon,
  getNotificationStyle
} from "@/lib/notifications";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function WorkspaceNotifications() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "today" | "earlier">("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const loadNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else if (data) {
        setNotifications(data.map((n: any) => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.read ?? false)
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channelId = `page_notifs_${user.id}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem: NotificationItem = {
              ...(payload.new as any),
              is_read: payload.new.is_read !== undefined ? payload.new.is_read : (payload.new.read ?? false)
            };
            setNotifications((prev) => [newItem, ...prev.filter(n => n.id !== newItem.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updated: NotificationItem = {
              ...(payload.new as any),
              is_read: payload.new.is_read !== undefined ? payload.new.is_read : (payload.new.read ?? false)
            };
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [user?.id]);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const todayCount = notifications.filter(n => isToday(n.created_at)).length;

  const filtered = notifications.filter(n => {
    const matchesSearch =
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase());

    let matchesTab = true;
    if (activeTab === "unread") matchesTab = !n.is_read;
    if (activeTab === "today") matchesTab = isToday(n.created_at);
    if (activeTab === "earlier") matchesTab = !isToday(n.created_at);

    let matchesType = true;
    if (selectedType !== "all") matchesType = n.type === selectedType;

    return matchesSearch && matchesTab && matchesType;
  });

  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications(notifications.map(n => ({ ...n, is_read: true, read: true })));
    await supabase.from('notifications').update({ is_read: true, read: true }).eq('user_id', user.id);
    toast.success("All notifications marked as read");
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
    await supabase.from('notifications').update({ is_read: true, read: true }).eq('id', id);
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const clearReadNotifications = async () => {
    if (!user) return;
    const readIds = notifications.filter(n => n.is_read).map(n => n.id);
    setNotifications(notifications.filter(n => !n.is_read));
    if (readIds.length > 0) {
      await supabase.from('notifications').delete().in('id', readIds);
    }
    toast.success("Cleared read notifications");
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-md relative text-indigo-400">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm border border-rose-400">
                  {unreadCount}
                </span>
              )}
            </div>
            Notification Center
          </h1>
          <p className="text-sm text-slate-400">Audit, search, and manage all workspace activities and real-time alerts.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={loadNotifications}
            variant="outline"
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          {notifications.some(n => n.is_read) && (
            <Button
              onClick={clearReadNotifications}
              variant="outline"
              className="bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, message, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Grid/List */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Activity className="animate-spin text-indigo-400 h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center text-slate-500">
            <Bell className="h-12 w-12 mb-4 opacity-20 text-indigo-400" />
            <h3 className="text-lg font-medium text-slate-300">No notifications found</h3>
            <p className="mt-1 text-sm max-w-sm text-slate-400">
              {search ? "No notifications match your search query." : "You're completely caught up! New workspace activities will trigger real-time updates here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3">
          <AnimatePresence>
            {filtered.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const style = getNotificationStyle(notification.type, notification.priority);

              return (
                <motion.div key={notification.id} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.95 }}>
                  <Card
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      ${notification.is_read ? 'bg-slate-900/40 border-slate-800/60 opacity-85' : 'bg-slate-800/80 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.06)]'} 
                      backdrop-blur-xl group overflow-hidden relative transition-all duration-200 hover:border-slate-700 cursor-pointer
                    `}
                  >
                    {!notification.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                    <CardContent className="p-4 sm:p-5 flex gap-4 items-start">
                      <div className={`mt-0.5 h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center shadow-md ${style.bg}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-semibold truncate ${notification.is_read ? 'text-slate-300' : 'text-white'}`}>
                              {notification.title}
                            </h3>
                            {notification.priority && notification.priority !== 'low' && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${style.badge}`}>
                                {notification.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(notification.created_at)}
                          </span>
                        </div>

                        <p className={`text-sm ${notification.is_read ? 'text-slate-500' : 'text-slate-300'} mb-2`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="capitalize">{notification.type.replace(/_/g, ' ')}</span>
                          {notification.action_url && (
                            <span className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                              Go to page <ExternalLink className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
