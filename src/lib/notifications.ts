import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  Bell, Database, FolderKanban, Sparkles, Cpu, LineChart, FileText,
  BookOpen, Key, Mail, Users, CreditCard, Shield, AlertTriangle, CheckCircle2, Info, XCircle
} from "lucide-react";

export type NotificationType =
  | 'project_created'
  | 'project_deleted'
  | 'dataset_uploaded'
  | 'dataset_cleaned'
  | 'eda_completed'
  | 'ai_analysis'
  | 'model_trained'
  | 'forecast_completed'
  | 'report_generated'
  | 'notebook_saved'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'workspace_invitation'
  | 'member_joined'
  | 'subscription_updated'
  | 'billing_event'
  | 'password_changed'
  | 'profile_updated'
  | 'system_maintenance'
  | 'warning'
  | 'error'
  | string;

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  read?: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  userId?: string;
  showToast?: boolean;
}

export function getLocalNotifications(userId: string): NotificationItem[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`vivexa_notifications_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[getLocalNotifications]", err);
  }
  return [];
}

export function saveLocalNotifications(userId: string, items: NotificationItem[]) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`vivexa_notifications_${userId}`, JSON.stringify(items));
    window.dispatchEvent(new Event("vivexa_notifications_updated"));
  } catch (err) {
    console.error("[saveLocalNotifications]", err);
  }
}

export function generateSeedNotifications(userId: string): NotificationItem[] {
  const now = new Date();
  const seedItems: NotificationItem[] = [
    {
      id: `seed-1-${userId}`,
      user_id: userId,
      title: "Welcome to Vivexa Enterprise AI Platform",
      message: "Your decision intelligence workspace is ready. Access AI Chat, Predictive Models, and Executive Briefings.",
      type: "system_maintenance",
      priority: "low",
      is_read: false,
      action_url: "/workspace/ai/chat",
      created_at: new Date(now.getTime() - 1000 * 60 * 15).toISOString()
    },
    {
      id: `seed-2-${userId}`,
      user_id: userId,
      title: "Monthly AI API Quota Active",
      message: "Your account is allocated 250 AI API calls per billing cycle. Monitor usage in Telemetry.",
      type: "billing_event",
      priority: "medium",
      is_read: false,
      action_url: "/workspace/billing",
      created_at: new Date(now.getTime() - 1000 * 60 * 45).toISOString()
    },
    {
      id: `seed-3-${userId}`,
      user_id: userId,
      title: "Automated Data Profiler Engine Online",
      message: "Data engine initialized with Pearson correlation calculations and anomaly detection.",
      type: "eda_completed",
      priority: "low",
      is_read: true,
      action_url: "/workspace/datasets",
      created_at: new Date(now.getTime() - 1000 * 60 * 180).toISOString()
    },
    {
      id: `seed-4-${userId}`,
      user_id: userId,
      title: "Security & Governance Audit Verified",
      message: "Role-based access rules and data isolation policies verified for active session.",
      type: "profile_updated",
      priority: "low",
      is_read: true,
      action_url: "/workspace/settings",
      created_at: new Date(now.getTime() - 1000 * 60 * 360).toISOString()
    }
  ];

  saveLocalNotifications(userId, seedItems);
  return seedItems;
}

/**
 * Creates a notification in public.notifications and local storage
 */
export async function createNotification(input: CreateNotificationInput): Promise<NotificationItem | null> {
  try {
    const user = useAuthStore.getState().user;
    const targetUserId = input.userId || user?.id || "default_user";

    const newItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: targetUserId,
      title: input.title,
      message: input.message,
      type: input.type || 'system_maintenance',
      priority: input.priority || 'medium',
      is_read: false,
      read: false,
      action_url: input.actionUrl || undefined,
      metadata: input.metadata || {},
      created_at: new Date().toISOString()
    };

    // 1. Save to Local Storage Cache
    const currentLocals = getLocalNotifications(targetUserId);
    saveLocalNotifications(targetUserId, [newItem, ...currentLocals.filter(n => n.id !== newItem.id)]);

    // 2. Try Supabase Insert
    if (user) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            title: input.title,
            message: input.message,
            type: input.type || 'system_maintenance',
            priority: input.priority || 'medium',
            is_read: false,
            action_url: input.actionUrl || null,
            metadata: input.metadata || {}
          })
          .select()
          .single();

        if (data && !error) {
          newItem.id = data.id;
        }
      } catch (dbErr) {
        console.warn("[Notifications DB Insert Notice]", dbErr);
      }
    }

    if (input.showToast !== false) {
      triggerToast(input.title, input.message, input.priority);
    }

    return newItem;
  } catch (err) {
    console.error("[createNotification Exception]", err);
    return null;
  }
}

function triggerToast(title: string, message: string, priority?: NotificationPriority) {
  if (priority === 'urgent' || priority === 'high') {
    toast.error(title, { description: message, duration: 5000 });
  } else if (priority === 'medium') {
    toast.info(title, { description: message, duration: 4000 });
  } else {
    toast.success(title, { description: message, duration: 3000 });
  }
}

/**
 * Formats relative timestamp
 */
export function formatRelativeTime(dateInput: string | Date): string {
  if (!dateInput) return "Just now";
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Returns icon component for notification type
 */
export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'dataset_uploaded':
    case 'dataset_cleaned':
    case 'eda_completed':
      return Database;
    case 'project_created':
    case 'project_deleted':
      return FolderKanban;
    case 'ai_analysis':
      return Sparkles;
    case 'model_trained':
      return Cpu;
    case 'forecast_completed':
      return LineChart;
    case 'report_generated':
      return FileText;
    case 'notebook_saved':
      return BookOpen;
    case 'api_key_created':
    case 'api_key_revoked':
      return Key;
    case 'workspace_invitation':
      return Mail;
    case 'member_joined':
      return Users;
    case 'subscription_updated':
    case 'billing_event':
      return CreditCard;
    case 'password_changed':
    case 'profile_updated':
      return Shield;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    default:
      return Bell;
  }
}

/**
 * Returns color classes for notification type / priority
 */
export function getNotificationStyle(type: NotificationType, priority: NotificationPriority) {
  if (priority === 'urgent') {
    return {
      bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    };
  }
  if (priority === 'high') {
    return {
      bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    };
  }

  switch (type) {
    case 'dataset_uploaded':
    case 'dataset_cleaned':
    case 'eda_completed':
      return { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'project_created':
    case 'ai_analysis':
    case 'report_generated':
      return { bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    case 'model_trained':
    case 'forecast_completed':
      return { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'api_key_created':
    case 'security':
    case 'password_changed':
      return { bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    case 'warning':
    case 'api_key_revoked':
      return { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'error':
      return { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    default:
      return { bg: 'bg-slate-800 border-slate-700 text-slate-300', badge: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
}
