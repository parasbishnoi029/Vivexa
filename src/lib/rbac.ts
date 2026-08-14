import { supabase } from './supabase';

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Data Scientist'
  | 'Analyst'
  | 'Member'
  | 'Viewer'
  | 'Guest'
  | 'admin'
  | 'user'
  | 'superadmin';

export type PermissionKey =
  | 'admin_console'
  | 'user_management'
  | 'role_management'
  | 'billing_management'
  | 'api_platform'
  | 'audit_logs'
  | 'feature_flags'
  | 'workspace_settings'
  | 'projects_manage'
  | 'datasets_manage'
  | 'notebooks_execute'
  | 'forecasting_run'
  | 'reports_create'
  | 'ai_chat';

export const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  'Super Admin': [
    'admin_console', 'user_management', 'role_management', 'billing_management',
    'api_platform', 'audit_logs', 'feature_flags', 'workspace_settings',
    'projects_manage', 'datasets_manage', 'notebooks_execute', 'forecasting_run',
    'reports_create', 'ai_chat'
  ],
  'superadmin': [
    'admin_console', 'user_management', 'role_management', 'billing_management',
    'api_platform', 'audit_logs', 'feature_flags', 'workspace_settings',
    'projects_manage', 'datasets_manage', 'notebooks_execute', 'forecasting_run',
    'reports_create', 'ai_chat'
  ],
  'Admin': [
    'admin_console', 'user_management', 'role_management', 'billing_management',
    'api_platform', 'audit_logs', 'feature_flags', 'workspace_settings',
    'projects_manage', 'datasets_manage', 'notebooks_execute', 'forecasting_run',
    'reports_create', 'ai_chat'
  ],
  'admin': [
    'admin_console', 'user_management', 'role_management', 'billing_management',
    'api_platform', 'audit_logs', 'feature_flags', 'workspace_settings',
    'projects_manage', 'datasets_manage', 'notebooks_execute', 'forecasting_run',
    'reports_create', 'ai_chat'
  ],
  'Manager': [
    'workspace_settings', 'projects_manage', 'datasets_manage', 'notebooks_execute',
    'forecasting_run', 'reports_create', 'ai_chat'
  ],
  'Data Scientist': [
    'projects_manage', 'datasets_manage', 'notebooks_execute', 'forecasting_run',
    'reports_create', 'ai_chat'
  ],
  'Analyst': [
    'projects_manage', 'datasets_manage', 'reports_create', 'ai_chat'
  ],
  'Member': [
    'projects_manage', 'datasets_manage', 'reports_create', 'ai_chat'
  ],
  'user': [
    'projects_manage', 'datasets_manage', 'reports_create', 'ai_chat'
  ],
  'Viewer': [
    'reports_create', 'ai_chat'
  ],
  'Guest': []
};

export function normalizeRole(roleString?: string | null): string {
  if (!roleString) return 'Member';
  const lower = roleString.toLowerCase();
  if (lower === 'superadmin' || lower === 'super admin') return 'Super Admin';
  if (lower === 'admin') return 'Admin';
  if (lower === 'manager') return 'Manager';
  if (lower === 'data scientist' || lower === 'datascientist') return 'Data Scientist';
  if (lower === 'analyst') return 'Analyst';
  if (lower === 'viewer') return 'Viewer';
  if (lower === 'guest') return 'Guest';
  return 'Member';
}

export function hasPermission(roleName: string | undefined | null, permission: PermissionKey): boolean {
  if (!roleName) return false;
  const norm = normalizeRole(roleName);
  const permissions = ROLE_PERMISSIONS[norm] || ROLE_PERMISSIONS[roleName] || [];
  return permissions.includes(permission);
}

export function isAdminRole(roleName?: string | null, email?: string | null): boolean {
  if (email === 'parasbishnoi012@gmail.com') return true;
  if (!roleName) return false;
  const norm = normalizeRole(roleName);
  return norm === 'Admin' || norm === 'Super Admin';
}

export async function getUserRoleFromDb(userId: string, email?: string): Promise<string> {
  if (email === 'parasbishnoi012@gmail.com') return 'Super Admin';

  try {
    const { data: userData } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
    if (userData?.role) {
      return normalizeRole(userData.role);
    }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('user_id', userId).maybeSingle();
    if (profileData?.role) {
      return normalizeRole(profileData.role);
    }

    const { data: memberData } = await supabase.from('workspace_members').select('role').eq('user_id', userId).maybeSingle();
    if (memberData?.role) {
      return normalizeRole(memberData.role);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === userId && session.user.user_metadata?.role) {
      return normalizeRole(session.user.user_metadata.role);
    }
  } catch (e) {
    console.warn("getUserRoleFromDb warning:", e);
  }

  return 'Member';
}
