import { supabase } from './supabase';
import { useAuthStore } from '@/stores/authStore';

export interface CreateAuditLogInput {
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  payload?: Record<string, any>;
  created_at: string;
  user_email?: string;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogItem | null> {
  try {
    const user = useAuthStore.getState().user;
    const targetUserId = input.userId || user?.id || null;

    const newRecord = {
      user_id: targetUserId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId || null,
      ip_address: input.ipAddress || '192.168.1.1',
      payload: input.payload || {},
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("[createAuditLog warning]", error.message);
      return {
        id: `local-${Date.now()}`,
        user_id: targetUserId || undefined,
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        ip_address: input.ipAddress || '192.168.1.1',
        payload: input.payload,
        created_at: new Date().toISOString()
      };
    }

    return data as AuditLogItem;
  } catch (err) {
    console.error("[createAuditLog Exception]", err);
    return null;
  }
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  try {
    const token = useAuthStore.getState().session?.access_token;
    if (token) {
      const res = await fetch('/api/v1/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as AuditLogItem[];
      }
    }

    // Direct client-side fallback if not authorized or offline
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      // Fallback query if relation join not set up
      const { data: rawData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (rawData) {
        return rawData as AuditLogItem[];
      }
      return [];
    }

    return data.map((item: any) => ({
      ...item,
      user_email: item.users?.email || item.user_id || 'System'
    }));
  } catch (e) {
    console.error("fetchAuditLogs error:", e);
    return [];
  }
}
