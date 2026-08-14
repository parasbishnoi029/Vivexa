import express from "express";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "./emailService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

export const organizationRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// Resilient clients getter
const getAdminSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return createClient(url || "", serviceRoleKey || "");
};

const getUserSupabaseClient = (req: express.Request) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return createClient(url || "", supabaseKey || "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
  }
  return supabase;
};

// 1. GET /api/v1/organization/data - Load real workspace, members, and pending invitations
organizationRouter.get('/data', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const requestedWorkspaceId = req.query.workspace_id as string;
    const adminClient = getAdminSupabaseClient();

    let workspace = null;

    if (requestedWorkspaceId && requestedWorkspaceId !== "all" && requestedWorkspaceId !== "undefined") {
      // Load specific workspace and verify membership/ownership
      const { data: ws } = await adminClient
        .from('workspaces')
        .select('*')
        .eq('id', requestedWorkspaceId)
        .maybeSingle();

      if (ws) {
        if (ws.owner_id === user.id) {
          workspace = ws;
        } else {
          const { data: isMember } = await adminClient
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', requestedWorkspaceId)
            .eq('user_id', user.id)
            .maybeSingle();
          if (isMember) {
            workspace = ws;
          }
        }
      }
    }

    // Fallback: If no workspace loaded yet, fetch workspace owned by user or where they are a member
    if (!workspace) {
      const { data: ownedWs, error: wsError } = await adminClient
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (ownedWs && ownedWs.length > 0) {
        workspace = ownedWs[0];
      } else {
        // Check memberships
        const { data: memberships } = await adminClient
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id);

        if (memberships && memberships.length > 0) {
          const wsIds = memberships.map(m => m.workspace_id);
          const { data: memberWs } = await adminClient
            .from('workspaces')
            .select('*')
            .in('id', wsIds)
            .limit(1);
          if (memberWs && memberWs.length > 0) {
            workspace = memberWs[0];
          }
        }
      }
    }

    if (!workspace) {
      // Auto-provision personal workspace if none exists yet
      const { data: newWs } = await adminClient
        .from('workspaces')
        .insert({
          owner_id: user.id,
          name: `${user.email?.split('@')[0] || 'My'}'s Workspace`,
          slug: `${user.email?.split('@')[0] || 'workspace'}-${Date.now()}`,
          is_personal: true,
          metadata: {
            whitelisted_domains: ["vivexa.ai"],
            sso_enabled: false,
            dept_distribution: [
              { name: 'Engineering', value: 45, color: '#6366f1' },
              { name: 'Product', value: 15, color: '#10b981' },
              { name: 'Sales', value: 20, color: '#f59e0b' },
              { name: 'Support', value: 10, color: '#8b5cf6' },
              { name: 'Marketing', value: 10, color: '#ec4899' },
            ]
          }
        })
        .select()
        .single();
      workspace = newWs;

      if (workspace) {
        // Automatically insert into workspace_members
        await adminClient.from('workspace_members').insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'Owner',
          status: 'active'
        });
      }
    }

    if (!workspace) {
      return res.status(500).json(successResponse(null, { error: 'Failed to find or create workspace' }));
    }

    // Migration failsafe: If workspace exists but metadata is missing or null, initialize it
    if (!workspace.metadata) {
      const initialMetadata = {
        whitelisted_domains: ["vivexa.ai"],
        sso_enabled: false,
        dept_distribution: [
          { name: 'Engineering', value: 45, color: '#6366f1' },
          { name: 'Product', value: 15, color: '#10b981' },
          { name: 'Sales', value: 20, color: '#f59e0b' },
          { name: 'Support', value: 10, color: '#8b5cf6' },
          { name: 'Marketing', value: 10, color: '#ec4899' },
        ]
      };
      const { data: updatedWs } = await adminClient.from('workspaces').update({ metadata: initialMetadata }).eq('id', workspace.id).select().single();
      if (updatedWs) workspace = updatedWs;
    }

    // Fetch Workspace Members using admin privilege to bypass restrictive RLS policies
    const { data: rawMembers, error: membersErr } = await adminClient
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id);

    if (membersErr) console.error("Members fetch error:", membersErr);

    // Fetch Profiles for members
    const memberUserIds = (rawMembers || []).map(m => m.user_id).concat(workspace.owner_id);
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', memberUserIds);

    const { data: usersList } = await adminClient
      .from('users')
      .select('id, email')
      .in('id', memberUserIds);

    let authUsers: any[] = [];
    try {
      const { data: authList, error: authListErr } = await adminClient.auth.admin.listUsers();
      if (authListErr) {
        console.error("[Organization Server] Auth list users error:", authListErr);
      } else if (authList && authList.users) {
        authUsers = authList.users;
      }
    } catch (authErr) {
      console.error("[Organization Server] Auth fetch exception:", authErr);
    }

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const userMap = new Map((usersList || []).map(u => [u.id, u]));
    const authUserMap = new Map(authUsers.map(u => [u.id, u]));

    // Format Owner as first member
    const ownerUser = userMap.get(workspace.owner_id) || authUserMap.get(workspace.owner_id);
    const ownerProfile = profileMap.get(workspace.owner_id);

    const members = [
      {
        id: `owner-${workspace.owner_id}`,
        user_id: workspace.owner_id,
        email: ownerUser?.email || user.email,
        full_name: ownerProfile?.full_name || ownerUser?.user_metadata?.full_name || ownerUser?.email?.split('@')[0] || user.email?.split('@')[0] || 'Workspace Owner',
        avatar_url: ownerProfile?.avatar_url,
        role: 'Owner',
        status: 'active',
        created_at: workspace.created_at,
        is_owner: true
      }
    ];

    // Format other members
    (rawMembers || []).forEach(m => {
      if (m.user_id !== workspace.owner_id) {
        const u = userMap.get(m.user_id) || authUserMap.get(m.user_id);
        const p = profileMap.get(m.user_id);
        members.push({
          id: m.id,
          user_id: m.user_id,
          email: u?.email || 'team.member@domain.com',
          full_name: p?.full_name || u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Team Member',
          avatar_url: p?.avatar_url,
          role: m.role || 'Analyst',
          status: m.status || 'active',
          created_at: m.created_at,
          is_owner: false
        });
      }
    });

    // Fetch Pending Invitations from workspace metadata emulation
    const wsMetadata = workspace.metadata || {};
    const rawInvitations = wsMetadata.invitations || [];
    const invitations = rawInvitations.filter((inv: any) => inv.status === 'Pending');

    // Fetch Activity Log
    const { data: activity } = await adminClient
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json(successResponse({
      workspace,
      members,
      invitations: invitations || [],
      activity: activity || []
    }));
  } catch (err: any) {
    console.error("Organization data error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 1.5 GET /api/v1/organization/workspaces - Fetch all workspaces user owns or is a member of
organizationRouter.get('/workspaces', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminSupabaseClient();

    // 1. Fetch owned workspaces
    const { data: ownedWorkspaces, error: ownedErr } = await adminClient
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id);

    if (ownedErr) console.error("Error fetching owned workspaces:", ownedErr);

    // 2. Fetch joined workspaces via members table
    const { data: memberships, error: memErr } = await adminClient
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id);

    if (memErr) console.error("Error fetching memberships:", memErr);

    let joinedWorkspaces: any[] = [];
    if (memberships && memberships.length > 0) {
      const wsIds = memberships.map(m => m.workspace_id);
      const { data: wsList } = await adminClient
        .from('workspaces')
        .select('*')
        .in('id', wsIds);
      
      if (wsList) {
        const roleMap = new Map(memberships.map(m => [m.workspace_id, m.role]));
        joinedWorkspaces = wsList.map(ws => ({
          ...ws,
          user_role: roleMap.get(ws.id) || 'Member'
        }));
      }
    }

    // Combine safely to avoid duplicates
    const allWorkspacesMap = new Map<string, any>();
    
    (ownedWorkspaces || []).forEach(ws => {
      allWorkspacesMap.set(ws.id, {
        ...ws,
        user_role: 'Owner',
        is_owner: true
      });
    });

    joinedWorkspaces.forEach(ws => {
      if (!allWorkspacesMap.has(ws.id)) {
        allWorkspacesMap.set(ws.id, {
          ...ws,
          user_role: ws.user_role,
          is_owner: ws.owner_id === user.id
        });
      }
    });

    const workspaces = Array.from(allWorkspacesMap.values());
    return res.json(successResponse(workspaces));
  } catch (err: any) {
    console.error("Fetch workspaces error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 1.6 POST /api/v1/organization/workspaces - Create new workspace
organizationRouter.post('/workspaces', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(successResponse(null, { error: 'Workspace name is required' }));
    }

    const adminClient = getAdminSupabaseClient();
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const { data: newWs, error: wsErr } = await adminClient
      .from('workspaces')
      .insert({
        owner_id: user.id,
        name: name.trim(),
        slug,
        is_personal: false,
        metadata: {
          whitelisted_domains: ["vivexa.ai"],
          sso_enabled: false,
          dept_distribution: [
            { name: 'Engineering', value: 40, color: '#6366f1' },
            { name: 'Product', value: 20, color: '#10b981' },
            { name: 'Sales', value: 15, color: '#f59e0b' },
            { name: 'Support', value: 15, color: '#8b5cf6' },
            { name: 'Marketing', value: 10, color: '#ec4899' },
          ]
        }
      })
      .select()
      .single();

    if (wsErr) {
      console.error("Create workspace error:", wsErr);
      return res.status(500).json(successResponse(null, { error: wsErr.message }));
    }

    // Automatically insert into workspace_members as Owner
    await adminClient.from('workspace_members').insert({
      workspace_id: newWs.id,
      user_id: user.id,
      role: 'Owner',
      status: 'active'
    });

    // Log to audit
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'WORKSPACE_CREATED',
      resource_type: 'WORKSPACE',
      resource_id: newWs.id,
      payload: { name: name.trim() }
    });

    return res.status(201).json(successResponse(newWs));
  } catch (err: any) {
    console.error("Workspace creation error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 2. POST /api/v1/organization/invite - Invite new member by email
organizationRouter.post('/invite', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { email, role = 'Analyst', workspace_id } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
    }

    const adminClient = getAdminSupabaseClient();

    // Get workspace ID
    let targetWorkspaceId = workspace_id;
    if (!targetWorkspaceId) {
      const { data: ws } = await adminClient
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      targetWorkspaceId = ws?.id;
    }

    if (!targetWorkspaceId) {
      return res.status(404).json(successResponse(null, { error: 'Workspace context not found' }));
    }

    // Load workspace to verify authority
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('owner_id, name, metadata')
      .eq('id', targetWorkspaceId)
      .maybeSingle();

    if (!workspace) {
      return res.status(404).json(successResponse(null, { error: 'Workspace not found' }));
    }

    // Verify permission: User must be Owner/Admin/Manager of this workspace
    const isOwner = workspace.owner_id === user.id;
    let isAuthorized = isOwner;
    
    if (!isAuthorized) {
      const { data: memberRecord } = await adminClient
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', targetWorkspaceId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      const memberRole = memberRecord?.role?.toLowerCase();
      if (memberRole === 'owner' || memberRole === 'admin' || memberRole === 'manager') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden: Only Workspace Owners, Admins, or Managers can send invitations' }));
    }

    const workspaceName = workspace.name || "Analytical Workspace";

    // Check if user exists in public.users
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    // Check if user is already a member
    if (existingUser) {
      const { data: isMember } = await adminClient
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', targetWorkspaceId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (isMember) {
        return res.status(400).json(successResponse(null, { error: 'User is already a member of this workspace' }));
      }
    }

    const currentMetadata = workspace.metadata || {};
    if (!currentMetadata.invitations) {
      currentMetadata.invitations = [];
    }

    // Check for existing pending invitation
    const existingInvite = currentMetadata.invitations.find(
      (inv: any) => inv.email?.toLowerCase() === email.trim().toLowerCase() && inv.status === 'Pending'
    );

    if (existingInvite) {
      return res.status(400).json(successResponse(null, { error: 'An invitation has already been sent to this email address' }));
    }

    // Create new invitation object
    const newInviteId = crypto.randomUUID();
    const newInvite = {
      id: newInviteId,
      workspace_id: targetWorkspaceId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
      status: 'Pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiration
    };

    currentMetadata.invitations.push(newInvite);

    // Update workspace metadata in DB
    const { error: updateErr } = await adminClient
      .from('workspaces')
      .update({ metadata: currentMetadata })
      .eq('id', targetWorkspaceId);

    if (updateErr) {
      console.error("Invite DB Error:", updateErr);
      return res.status(500).json(successResponse(null, { error: updateErr.message }));
    }

    // Generate real join/registration URL
    const origin = req.headers.referer || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const inviteUrl = `${cleanOrigin}/register?invite_id=${newInvite.id}&email=${encodeURIComponent(email.trim().toLowerCase())}`;

    // Dispatch email
    const emailResult = await sendEmail({
      recipient: email.trim().toLowerCase(),
      template: "invite",
      subject: `Invitation to join ${workspaceName} on Vivexa`,
      data: {
        workspace_id: targetWorkspaceId,
        inviter_name: user.email?.split('@')[0] || "A collaborator",
        inviter_email: user.email || "partner@vivexa.com",
        role,
        invite_url: inviteUrl,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        workspace_name: workspaceName
      }
    });

    if (!emailResult.success) {
      console.warn(`[INVITATION WARNING] Email delivery failed for ${email}: ${emailResult.error}`);
    }

    // Send in-app notification if user exists
    if (existingUser) {
      await adminClient.from('notifications').insert({
        user_id: existingUser.id,
        type: 'invitation',
        title: 'Workspace Invitation Received',
        message: `You have been invited to join ${workspaceName} as ${role}.`,
        link: '/workspace/organization'
      });
    }

    // Log in audit_logs
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'MEMBER_INVITED',
      resource_type: 'WORKSPACE',
      resource_id: targetWorkspaceId,
      payload: { invited_email: email, role }
    });

    return res.status(201).json(successResponse(newInvite));
  } catch (err: any) {
    console.error("Invite handler error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 3. DELETE /api/v1/organization/invitations/:id - Cancel invitation
organizationRouter.delete('/invitations/:id', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminSupabaseClient();
    const { data: allWorkspaces } = await adminClient
      .from('workspaces')
      .select('id, owner_id, metadata');

    let foundWorkspace: any = null;
    let invite: any = null;

    for (const ws of (allWorkspaces || [])) {
      const metadata = ws.metadata || {};
      const invitations = metadata.invitations || [];
      const found = invitations.find((inv: any) => inv.id === id);
      if (found) {
        foundWorkspace = ws;
        invite = found;
        break;
      }
    }

    if (!invite) {
      return res.status(404).json(successResponse(null, { error: 'Invitation not found' }));
    }

    const isInviter = invite.invited_by === user.id;
    let isAuthorized = isInviter;

    if (!isAuthorized) {
      const isOwner = foundWorkspace.owner_id === user.id;
      if (isOwner) {
        isAuthorized = true;
      } else {
        const { data: reqMember } = await adminClient
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', foundWorkspace.id)
          .eq('user_id', user.id)
          .maybeSingle();
        const roleLower = reqMember?.role?.toLowerCase();
        if (roleLower === 'owner' || roleLower === 'admin') {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden: Only the inviter or Workspace Owners/Admins can cancel invitations' }));
    }

    // Update status to Cancelled inside the metadata array
    const updatedMetadata = foundWorkspace.metadata || {};
    updatedMetadata.invitations = updatedMetadata.invitations.map((inv: any) => {
      if (inv.id === id) {
        return { ...inv, status: 'Cancelled' };
      }
      return inv;
    });

    const { error: updateErr } = await adminClient
      .from('workspaces')
      .update({ metadata: updatedMetadata })
      .eq('id', foundWorkspace.id);

    if (updateErr) {
      return res.status(400).json(successResponse(null, { error: updateErr.message }));
    }

    return res.json(successResponse({ id, status: 'Cancelled' }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 4. PATCH /api/v1/organization/members/:id/role - Update member role
organizationRouter.patch('/members/:id/role', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { role } = req.body;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
    if (!role) return res.status(400).json(successResponse(null, { error: 'Role is required' }));

    const adminClient = getAdminSupabaseClient();
    const { data: targetMember } = await adminClient
      .from('workspace_members')
      .select('workspace_id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (!targetMember) {
      return res.status(404).json(successResponse(null, { error: 'Member not found' }));
    }

    const { data: ws } = await adminClient
      .from('workspaces')
      .select('owner_id')
      .eq('id', targetMember.workspace_id)
      .maybeSingle();

    const isOwner = ws?.owner_id === user.id;
    let isAuthorized = isOwner;

    if (!isAuthorized) {
      const { data: reqMember } = await adminClient
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', targetMember.workspace_id)
        .eq('user_id', user.id)
        .maybeSingle();
      const roleLower = reqMember?.role?.toLowerCase();
      if (roleLower === 'owner' || roleLower === 'admin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden: Only Workspace Owners or Admins can modify member roles' }));
    }

    if (ws?.owner_id === targetMember.user_id) {
      return res.status(400).json(successResponse(null, { error: 'Cannot modify the role of the workspace owner' }));
    }

    const { data, error } = await adminClient
      .from('workspace_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'MEMBER_ROLE_UPDATED',
      resource_type: 'WORKSPACE_MEMBER',
      resource_id: id,
      payload: { new_role: role }
    });

    return res.json(successResponse(data));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 5. DELETE /api/v1/organization/members/:id - Remove member from workspace
organizationRouter.delete('/members/:id', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminSupabaseClient();
    const { data: targetMember } = await adminClient
      .from('workspace_members')
      .select('workspace_id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (!targetMember) {
      return res.status(404).json(successResponse(null, { error: 'Member not found' }));
    }

    const { data: ws } = await adminClient
      .from('workspaces')
      .select('owner_id')
      .eq('id', targetMember.workspace_id)
      .maybeSingle();

    const isOwner = ws?.owner_id === user.id;
    let isAuthorized = isOwner;

    if (!isAuthorized) {
      const { data: reqMember } = await adminClient
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', targetMember.workspace_id)
        .eq('user_id', user.id)
        .maybeSingle();
      const roleLower = reqMember?.role?.toLowerCase();
      if (roleLower === 'owner' || roleLower === 'admin') {
        isAuthorized = true;
      }
    }

    if (targetMember.user_id === user.id) {
      isAuthorized = true; // Users can leave workspaces they joined
    }

    if (!isAuthorized) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden: Only Workspace Owners or Admins can remove members' }));
    }

    if (ws?.owner_id === targetMember.user_id) {
      return res.status(400).json(successResponse(null, { error: 'Cannot remove the workspace owner' }));
    }

    const { error } = await adminClient
      .from('workspace_members')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'MEMBER_REMOVED',
      resource_type: 'WORKSPACE_MEMBER',
      resource_id: id,
      payload: { removed_at: new Date().toISOString() }
    });

    return res.json(successResponse({ id, deleted: true }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 6. GET /api/v1/organization/invitations/incoming - Get pending invitations for logged-in user
organizationRouter.get('/invitations/incoming', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminSupabaseClient();
    const { data, error } = await adminClient
      .from('workspace_invitations')
      .select('*, workspaces(name)')
      .eq('email', user.email?.trim().toLowerCase())
      .eq('status', 'Pending');

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    const invitesWithWorkspace = (data || []).map(invite => ({
      ...invite,
      workspace_name: invite.workspaces?.name || 'Workspace'
    }));

    return res.json(successResponse(invitesWithWorkspace));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 7. POST /api/v1/organization/invitations/:id/accept - Accept invitation
organizationRouter.post('/invitations/:id/accept', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminSupabaseClient();

    // Fetch invitation
    const { data: invite, error: inviteErr } = await adminClient
      .from('workspace_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (inviteErr || !invite) {
      return res.status(404).json(successResponse(null, { error: 'Invitation not found' }));
    }

    if (invite.status !== 'Pending') {
      return res.status(400).json(successResponse(null, { error: 'Invitation is no longer pending' }));
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json(successResponse(null, { error: 'This invitation was sent to a different email address' }));
    }

    // 1. Update invitation status
    const { error: updateErr } = await adminClient
      .from('workspace_invitations')
      .update({ status: 'Accepted', accepted_at: new Date().toISOString() })
      .eq('id', id);

    if (updateErr) throw updateErr;

    // 2. Check if already a member (failsafe)
    const { data: existingMember } = await adminClient
      .from('workspace_members')
      .select('id, workspace_id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    let memberData = existingMember;
    if (!existingMember) {
      // Insert workspace_member
      const { data: newMember, error: memberErr } = await adminClient
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role || 'Analyst',
          status: 'active'
        })
        .select()
        .single();

      if (memberErr) throw memberErr;
      memberData = newMember;
    }

    // Log to audit
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'MEMBER_JOINED',
      resource_type: 'WORKSPACE',
      resource_id: invite.workspace_id,
      payload: { invitation_id: id, role: invite.role }
    });

    return res.json(successResponse(memberData));
  } catch (err: any) {
    console.error("Accept invite error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 8. POST /api/v1/organization/invitations/:id/decline - Decline invitation
organizationRouter.post('/invitations/:id/decline', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminSupabaseClient();
    const { error } = await adminClient
      .from('workspace_invitations')
      .update({ status: 'Declined' })
      .eq('id', id)
      .eq('email', user.email?.trim().toLowerCase());

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse({ id, status: 'Declined' }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 10. PATCH /api/v1/organization/settings - Update workspace governance settings
organizationRouter.patch('/settings', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { workspace_id, settings } = req.body;
    if (!workspace_id || !settings) {
      return res.status(400).json(successResponse(null, { error: 'Workspace ID and settings are required' }));
    }

    const adminClient = getAdminSupabaseClient();

    // Verify ownership
    const { data: ws } = await adminClient
      .from('workspaces')
      .select('owner_id, metadata')
      .eq('id', workspace_id)
      .single();

    if (!ws || ws.owner_id !== user.id) {
      return res.status(403).json(successResponse(null, { error: 'Only workspace owner can update governance settings' }));
    }

    const mergedMetadata = {
      ...(ws.metadata || {}),
      ...settings
    };

    const { data: updatedWs, error: updateErr } = await adminClient
      .from('workspaces')
      .update({ metadata: mergedMetadata, updated_at: new Date().toISOString() })
      .eq('id', workspace_id)
      .select()
      .single();

    if (updateErr) {
      return res.status(400).json(successResponse(null, { error: updateErr.message }));
    }

    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'SETTINGS_UPDATED',
      resource_type: 'WORKSPACE',
      resource_id: workspace_id,
      payload: { updated_keys: Object.keys(settings) }
    });

    return res.json(successResponse(updatedWs));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 11. POST /api/v1/organization/transfer-owner - Transfer workspace ownership
organizationRouter.post('/transfer-owner', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { workspace_id, new_owner_id } = req.body;
    if (!workspace_id || !new_owner_id) {
      return res.status(400).json(successResponse(null, { error: 'Workspace ID and new owner ID are required' }));
    }

    const adminClient = getAdminSupabaseClient();

    // Check if requester is currently the owner
    const { data: ws, error: wsErr } = await adminClient
      .from('workspaces')
      .select('*')
      .eq('id', workspace_id)
      .single();

    if (wsErr || !ws) {
      return res.status(404).json(successResponse(null, { error: 'Workspace not found' }));
    }

    if (ws.owner_id !== user.id) {
      return res.status(403).json(successResponse(null, { error: 'Only the workspace owner can transfer ownership' }));
    }

    // Update workspace owner_id
    const { error: updateErr } = await adminClient
      .from('workspaces')
      .update({ owner_id: new_owner_id })
      .eq('id', workspace_id);

    if (updateErr) {
      return res.status(400).json(successResponse(null, { error: updateErr.message }));
    }

    // Add old owner as Admin to avoid lock-out
    const { data: isMember } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isMember) {
      await adminClient.from('workspace_members').insert({
        workspace_id,
        user_id: user.id,
        role: 'Admin',
        status: 'active'
      });
    } else {
      await adminClient.from('workspace_members')
        .update({ role: 'Admin' })
        .eq('workspace_id', workspace_id)
        .eq('user_id', user.id);
    }

    // Remove new owner from workspace_members to avoid redundancy (since they are now the Owner)
    await adminClient.from('workspace_members')
      .delete()
      .eq('workspace_id', workspace_id)
      .eq('user_id', new_owner_id);

    // Audit trailing
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'OWNER_TRANSFERRED',
      resource_type: 'WORKSPACE',
      resource_id: workspace_id,
      payload: { old_owner: user.id, new_owner: new_owner_id }
    });

    return res.json(successResponse({ success: true, workspace_id, new_owner_id }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 12. POST /api/v1/organization/test-smtp - Test custom SMTP connection settings
organizationRouter.post('/test-smtp', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, recipient } = req.body;

    if (!smtp_host || !smtp_user || !smtp_password) {
      return res.status(400).json(successResponse(null, { error: 'Host, Username, and Password are required to test connection.' }));
    }

    const nodemailer = await import("nodemailer");
    const portVal = parseInt(smtp_port || "587");
    
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: portVal,
      secure: portVal === 465,
      auth: {
        user: smtp_user,
        pass: smtp_password
      },
      connectTimeout: 5000
    });

    const targetRecipient = recipient || user.email || "info.vivexa@gmail.com";
    const senderEmail = from_email || smtp_user;
    const senderName = from_name || "Vivexa Mail Diagnostics";

    console.log(`[SMTP TEST] Attempting connection test to ${smtp_host}:${portVal} for ${smtp_user}...`);

    try {
      await transporter.verify();
      
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: targetRecipient,
        subject: "Vivexa Enterprise SMTP Test Connection - Success ✔",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f2937;">
            <h1 style="color: #6366f1; font-size: 20px; font-weight: 700; margin-top: 0;">✔ SMTP Connection Verified</h1>
            <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Your custom SMTP server has been successfully configured and authenticated inside Vivexa.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #030712; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937; color: #9ca3af; font-size: 12px; font-weight: 600;">SMTP Host</td>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937; color: #ffffff; font-size: 12px; font-family: monospace;">${smtp_host}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937; color: #9ca3af; font-size: 12px; font-weight: 600;">SMTP Port</td>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937; color: #ffffff; font-size: 12px; font-family: monospace;">${portVal}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937; color: #9ca3af; font-size: 12px; font-weight: 600;">Authorized User</td>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937; color: #ffffff; font-size: 12px; font-family: monospace;">${smtp_user}</td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #9ca3af; font-size: 12px; font-weight: 600;">Sender Address</td>
                <td style="padding: 12px; color: #ffffff; font-size: 12px; font-family: monospace;">${senderEmail}</td>
              </tr>
            </table>
            <p style="color: #9ca3af; font-size: 11px; margin-bottom: 0;">This is an automated diagnostic transmission. You do not need to reply to this message.</p>
          </div>
        `
      });

      console.log(`[SMTP TEST] Successful! Message ID: ${info.messageId}`);
      return res.json(successResponse({ success: true, messageId: info.messageId }));
    } catch (testErr: any) {
      console.error("[SMTP TEST] Connection failed:", testErr);
      
      let hint = "";
      const lowerHost = smtp_host.toLowerCase();
      const lowerUser = smtp_user.toLowerCase();
      
      if (lowerHost.includes("gmail") || lowerUser.includes("gmail.com")) {
        hint = "Gmail SMTP requires generating a 16-character Google App Password (2-Step Verification must be enabled in your Google Account). Standard account passwords will be blocked.";
      } else if (lowerHost.includes("brevo") || lowerHost.includes("sendinblue")) {
        hint = "Brevo SMTP requires your master SMTP Key as the password, and your registered account email as the user. Make sure your 'Sender Address' is fully authorized in Brevo Senders dashboard.";
      } else if (lowerHost.includes("outlook") || lowerHost.includes("office365")) {
        hint = "Office 365 / Outlook SMTP requires App Passwords if Multi-Factor Authentication is active.";
      }

      return res.status(400).json(successResponse(null, { 
        error: testErr.message || "Failed to establish SMTP connection", 
        code: testErr.code, 
        hint 
      }));
    }
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});
