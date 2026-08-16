import { supabase } from './supabase';
import { createNotification } from './notifications';
import { createAuditLog } from './auditLogs';
import { useWorkspaceStore } from '../stores/workspaceStore';

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  department?: string;
  specialization?: string;
  notes?: string;
  invited_by?: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Cancelled';
  created_at: string;
  accepted_at?: string;
  expires_at?: string;
  workspace_name?: string;
}

export async function validateInvitationToken(inviteId: string): Promise<{
  id: string;
  email: string;
  role: string;
  department?: string;
  workspace_id: string;
  workspace_name: string;
  organization_id?: string;
  is_valid: boolean;
  is_expired: boolean;
  status: string;
} | null> {
  try {
    const res = await fetch(`/api/v1/organization/invitations/validate/${inviteId}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Invalid invitation token (${res.status})`);
    }
    const json = await res.json();
    return json.data || null;
  } catch (err: any) {
    console.warn("[validateInvitationToken] Token validation note:", err.message);
    return null;
  }
}

export async function sendWorkspaceInvitation({
  workspaceId,
  email,
  role = 'Analyst',
  department = 'Organisational Development & Renewal',
  specialization = '',
  notes = '',
  invitedByUserId
}: {
  workspaceId: string;
  email: string;
  role?: string;
  department?: string;
  specialization?: string;
  notes?: string;
  invitedByUserId: string;
}): Promise<WorkspaceInvitation> {
  try {
    // 1. Get current Supabase session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 2. Call backend enterprise invitation endpoint
    const response = await fetch('/api/v1/organization/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        email: email.trim().toLowerCase(),
        role,
        department,
        specialization,
        notes
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMessage = result.error || 'Failed to dispatch workspace invitation';
      console.error(`[sendWorkspaceInvitation] Server responded with error (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    const invitationData = result.data;

    // 3. Create notification & audit log on client side if needed
    try {
      await createAuditLog({
        action: "Workspace Invitation Sent",
        resourceType: "workspace_invitations",
        resourceId: invitationData.id,
        userId: invitedByUserId,
        payload: { invited_email: email, role, department, workspace_id: workspaceId }
      });

      await createNotification({
        title: "Invitation Sent",
        message: `Sent invitation to ${email} for ${role} in ${department}`,
        type: "workspace_invitation",
        priority: "medium",
        userId: invitedByUserId
      });
    } catch (_) {}

    return invitationData as WorkspaceInvitation;
  } catch (err: any) {
    console.error("[sendWorkspaceInvitation] Error:", err);
    throw err;
  }
}

export async function fetchWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("fetchWorkspaceInvitations error:", error.message);
      return [];
    }

    return (data || []) as WorkspaceInvitation[];
  } catch (err) {
    console.error("fetchWorkspaceInvitations exception:", err);
    return [];
  }
}

export async function cancelWorkspaceInvitation(invitationId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('workspace_invitations')
      .update({ status: 'Cancelled' })
      .eq('id', invitationId);

    if (error) throw error;

    await createAuditLog({
      action: "Workspace Invitation Cancelled",
      resourceType: "workspace_invitations",
      resourceId: invitationId,
      userId
    });

    return true;
  } catch (err) {
    console.error("cancelWorkspaceInvitation error:", err);
    return false;
  }
}

export async function acceptWorkspaceInvitation(invitationId: string): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`/api/v1/organization/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to accept invitation');
  }

  const memberData = json.data;
  if (memberData && memberData.workspace_id) {
    useWorkspaceStore.getState().setSelectedWorkspaceId(memberData.workspace_id);
    try {
      await supabase.auth.refreshSession();
    } catch (_) {}
  }

  return memberData;
}

export async function inviteTeamMember(
  email: string, 
  role: string = 'Analyst',
  department: string = 'Organisational Development & Renewal'
): Promise<WorkspaceInvitation> {
  const workspaceId = useWorkspaceStore.getState().selectedWorkspaceId;
  if (!workspaceId) {
    throw new Error("No active workspace context is selected. Please switch or select an active workspace.");
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("You must be authenticated to invite team members.");
  }

  return await sendWorkspaceInvitation({
    workspaceId,
    email,
    role,
    department,
    invitedByUserId: user.id
  });
}
