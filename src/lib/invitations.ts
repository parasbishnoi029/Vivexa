import { supabase } from './supabase';
import { createNotification } from './notifications';
import { createAuditLog } from './auditLogs';

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  invited_by?: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Cancelled';
  created_at: string;
  accepted_at?: string;
  expires_at?: string;
  workspace_name?: string;
}

export async function sendWorkspaceInvitation({
  workspaceId,
  email,
  role = 'Analyst',
  invitedByUserId
}: {
  workspaceId: string;
  email: string;
  role?: string;
  invitedByUserId: string;
}): Promise<WorkspaceInvitation | null> {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newInvite = {
      workspace_id: workspaceId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: invitedByUserId,
      status: 'Pending',
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    const { data, error } = await supabase
      .from('workspace_invitations')
      .insert(newInvite)
      .select()
      .single();

    if (error) {
      console.error("sendWorkspaceInvitation error:", error);
      throw error;
    }

    // Create Audit Log & Notification
    await createAuditLog({
      action: "Workspace Invitation Sent",
      resourceType: "workspace_invitations",
      resourceId: data.id,
      userId: invitedByUserId,
      payload: { invited_email: email, role, workspace_id: workspaceId }
    });

    await createNotification({
      title: "Invitation Sent",
      message: `Sent workspace invitation to ${email} with role '${role}'`,
      type: "workspace_invitation",
      priority: "medium",
      userId: invitedByUserId
    });

    return data as WorkspaceInvitation;
  } catch (err: any) {
    console.error("Failed to send workspace invitation:", err);
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
