import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  NotificationItem,
  getLocalNotifications,
  saveLocalNotifications,
  generateSeedNotifications,
  createNotification
} from "@/lib/notifications";
import { toast } from "sonner";

export function useNotifications(pollIntervalMs: number = 15000) {
  const { user } = useAuthStore();
  const userId = user?.id || "default_user";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isInitialLoadRef = useRef(true);

  // Load and merge local + remote notifications
  const loadNotifications = useCallback(async (silent: boolean = false) => {
    if (!silent && isInitialLoadRef.current) {
      setIsLoading(true);
    }

    try {
      const localItems = getLocalNotifications(userId);
      let remoteItems: NotificationItem[] = [];

      if (user) {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data) {
          remoteItems = data.map((n: any) => ({
            ...n,
            is_read: n.is_read !== undefined ? n.is_read : (n.read ?? false)
          }));
        }
      }

      const map = new Map<string, NotificationItem>();
      [...remoteItems, ...localItems].forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      let merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (merged.length === 0) {
        merged = generateSeedNotifications(userId);
      } else {
        saveLocalNotifications(userId, merged);
      }

      setNotifications(merged);
      const unread = merged.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("[useNotifications] Exception loading notifications:", err);
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [user, userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Window event listener for local updates across components
  useEffect(() => {
    const handleLocalUpdate = () => {
      const locals = getLocalNotifications(userId);
      if (locals.length > 0) {
        setNotifications(locals);
        setUnreadCount(locals.filter((n) => !n.is_read).length);
      }
    };

    window.addEventListener("vivexa_notifications_updated", handleLocalUpdate);
    return () => window.removeEventListener("vivexa_notifications_updated", handleLocalUpdate);
  }, [userId]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user?.id) return;

    // Use a unique channel ID per component instance to prevent channel collisions
    const channelId = `user_notifs_${user.id}_${Math.random().toString(36).substring(2, 9)}`;

    // Remove any stale channels for this user if existing
    try {
      const activeChannels = supabase.getChannels();
      activeChannels.forEach((ch: any) => {
        const name = ch.topic || ch.subTopic || ch.name || "";
        if (name.includes(`user_notifs_${user.id}`)) {
          supabase.removeChannel(ch);
        }
      });
    } catch {
      // ignore channel lookup error
    }

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
            setNotifications((prev) => {
              const updated = [newItem, ...prev.filter((n) => n.id !== newItem.id)];
              saveLocalNotifications(userId, updated);
              setUnreadCount(updated.filter((n) => !n.is_read).length);
              return updated;
            });
            toast.info(newItem.title, { description: newItem.message });
          } else if (payload.eventType === "UPDATE") {
            const updatedItem: NotificationItem = {
              ...(payload.new as any),
              is_read: payload.new.is_read !== undefined ? payload.new.is_read : (payload.new.read ?? false)
            };
            setNotifications((prev) => {
              const updated = prev.map((n) => (n.id === updatedItem.id ? updatedItem : n));
              saveLocalNotifications(userId, updated);
              setUnreadCount(updated.filter((n) => !n.is_read).length);
              return updated;
            });
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => {
              const updated = prev.filter((n) => n.id !== payload.old.id);
              saveLocalNotifications(userId, updated);
              setUnreadCount(updated.filter((n) => !n.is_read).length);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore cleanup error
      }
    };
  }, [user?.id, userId]);

  // Polling loop
  useEffect(() => {
    if (pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      loadNotifications(true);
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs, loadNotifications]);

  // Actions
  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, is_read: true, read: true } : n));
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.is_read).length);
    saveLocalNotifications(userId, updated);
    try {
      if (user) {
        await supabase
          .from("notifications")
          .update({ is_read: true, read: true })
          .eq("id", id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, is_read: true, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    saveLocalNotifications(userId, updated);
    try {
      if (user) {
        await supabase
          .from("notifications")
          .update({ is_read: true, read: true })
          .eq("user_id", user.id);
      }
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.is_read).length);
    saveLocalNotifications(userId, updated);
    try {
      if (user) {
        await supabase.from("notifications").delete().eq("id", id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllRead = async () => {
    const readIds = notifications.filter((n) => n.is_read).map((n) => n.id);
    const updated = notifications.filter((n) => !n.is_read);
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.is_read).length);
    saveLocalNotifications(userId, updated);
    try {
      if (readIds.length > 0 && user) {
        await supabase.from("notifications").delete().in("id", readIds);
      }
      toast.success("Cleared read notifications");
    } catch (err) {
      console.error(err);
    }
  };

  const addNotification = async (input: Parameters<typeof createNotification>[0]) => {
    const notif = await createNotification({ ...input, userId });
    if (notif) {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      setUnreadCount((prev) => prev + 1);
    }
    return notif;
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    addNotification
  };
}
