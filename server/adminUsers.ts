import express from "express";
import { sendEmail } from "./emailService";
import { AdminUserService } from "./services/AdminUserService";

export const adminUsersRouter = express.Router();

const supabase = new Proxy({} as ReturnType<typeof AdminUserService.getAdminClient>, {
  get(_target, prop) {
    const client = AdminUserService.getAdminClient() as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

function isUserAdminRole(user: any): boolean {
  if (!user) return false;
  if (user.email === 'info.vivexa@gmail.com' || user.email === 'parasbishnoi012@gmail.com') return true;
  const role = (user.role || user.user_metadata?.role || '').toLowerCase();
  return role === 'admin' || role === 'super admin' || role === 'superadmin' || role === 'owner' || role === 'cto';
}

// 1. GET /api/v1/admin/users - Load all users with full metadata
adminUsersRouter.get('/users', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const users = await AdminUserService.loadAllUsers(adminUser);
    return res.json(successResponse(users));
  } catch (err: any) {
    console.error("Admin list users error:", err);
    return res.status(500).json(successResponse(null, { error: err.message || 'Failed to load enterprise users' }));
  }
});

// 1b. GET /api/v1/admin/users/:userId - Load single user DTO
adminUsersRouter.get('/users/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const user = await AdminUserService.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json(successResponse(null, { error: `User ${req.params.userId} not found` }));
    }
    return res.json(successResponse(user));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 1c. PUT & PATCH /api/v1/admin/users/:userId - Update User Full Identity
async function handleUpdateUserIdentity(req: express.Request, res: express.Response) {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { userId } = req.params;
    const updatedUser = await AdminUserService.updateUserProfile(userId, req.body);

    return res.json(successResponse(updatedUser));
  } catch (err: any) {
    console.error("Update user identity error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
}

adminUsersRouter.put('/users/:userId', handleUpdateUserIdentity);
adminUsersRouter.patch('/users/:userId', handleUpdateUserIdentity);

// 2. POST /api/v1/admin/users/invite - Complete Invitation Workflow
adminUsersRouter.post('/users/invite', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { email, full_name, workspace, role = 'Analyst', plan = 'Pro', message, expiration_days = 14, permissions } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json(successResponse(null, { error: 'A valid email address is required.' }));
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingUser) {
      return res.status(400).json(successResponse(null, { error: `User with email ${cleanEmail} already exists.` }));
    }

    // Expiration
    const expiresAt = new Date(Date.now() + (expiration_days * 24 * 60 * 60 * 1000)).toISOString();

    // Create invitation record in workspace_invitations
    const { data: invite, error: inviteErr } = await supabase.from('workspace_invitations').insert({
      email: cleanEmail,
      role,
      status: 'Pending',
      expires_at: expiresAt
    }).select().single();

    if (inviteErr) {
      console.warn("Invitation table notice:", inviteErr.message);
    }

    // Record Audit Log
    try {
      await supabase.from('audit_logs').insert({
        action: 'Invite Sent',
        user_id: adminUser.id,
        details: `Invited ${full_name || cleanEmail} as ${role} (${plan} Plan) to ${workspace || 'Enterprise Workspace'}. Message: "${message || 'Welcome to Vivexa'}"`
      });
    } catch (_) {}

    // Record Notification
    try {
      await supabase.from('notifications').insert({
        user_id: adminUser.id,
        type: 'invitation',
        title: 'User Invitation Dispatched',
        message: `An invitation link has been dispatched to ${cleanEmail} for role ${role}.`
      });
    } catch (_) {}

    return res.json(successResponse({
      id: invite?.id || `inv-${Date.now()}`,
      email: cleanEmail,
      full_name: full_name || cleanEmail.split('@')[0],
      role,
      plan,
      workspace: workspace || 'Main Workspace',
      status: 'Pending',
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }));
  } catch (err: any) {
    console.error("Invite user error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// Helper to handle role, plan, status, permissions updates with AdminUserService, audit & notification
async function updateUserField(req: any, res: any, fieldType: 'role' | 'plan' | 'status' | 'permissions') {
  try {
    const adminUser = req.user || { id: 'admin-system', email: 'admin@vivexa.ai' };
    const { userId } = req.params;
    const updateVal = req.body[fieldType] !== undefined ? req.body[fieldType] : req.body.value;
    const reason = req.body.reason || 'Administrative update via Admin Console';

    if (updateVal === undefined || updateVal === null) {
      return res.status(400).json(successResponse(null, { error: `${fieldType} is required` }));
    }

    let updatedUser: any = null;

    if (fieldType === 'role') {
      updatedUser = await AdminUserService.updateRole(userId, updateVal);
    } else if (fieldType === 'plan') {
      updatedUser = await AdminUserService.updatePlan(userId, updateVal);
    } else if (fieldType === 'status') {
      updatedUser = await AdminUserService.updateStatus(userId, updateVal);
    } else if (fieldType === 'permissions') {
      updatedUser = await AdminUserService.updatePermissions(userId, updateVal);
    }

    return res.json(successResponse(updatedUser || { userId, [fieldType]: updateVal }));
  } catch (err: any) {
    console.error(`Update ${fieldType} error:`, err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
}

// 3. PUT & PATCH /api/v1/admin/users/:userId/role
adminUsersRouter.put('/users/:userId/role', (req, res) => updateUserField(req, res, 'role'));
adminUsersRouter.patch('/users/:userId/role', (req, res) => updateUserField(req, res, 'role'));

// 4. PUT & PATCH /api/v1/admin/users/:userId/plan
adminUsersRouter.put('/users/:userId/plan', (req, res) => updateUserField(req, res, 'plan'));
adminUsersRouter.patch('/users/:userId/plan', (req, res) => updateUserField(req, res, 'plan'));

// 5. PUT & PATCH /api/v1/admin/users/:userId/status
adminUsersRouter.put('/users/:userId/status', (req, res) => updateUserField(req, res, 'status'));
adminUsersRouter.patch('/users/:userId/status', (req, res) => updateUserField(req, res, 'status'));

// 5b. PUT & PATCH /api/v1/admin/users/:userId/permissions
adminUsersRouter.put('/users/:userId/permissions', (req, res) => updateUserField(req, res, 'permissions'));
adminUsersRouter.patch('/users/:userId/permissions', (req, res) => updateUserField(req, res, 'permissions'));


// 6. POST /api/v1/admin/users/:userId/reset-password
adminUsersRouter.post('/users/:userId/reset-password', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // Fetch user details from DB
    const { data: dbUser } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
    let userEmail = dbUser?.email;

    if (!userEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      userEmail = authUser?.user?.email;
    }

    if (!userEmail) {
      return res.status(404).json(successResponse(null, { error: 'User record or email address not found.' }));
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    let publicOrigin = 'http://localhost:3000';
    if (req.headers.origin && !req.headers.origin.includes('localhost') && !req.headers.origin.includes('127.0.0.1')) {
      publicOrigin = req.headers.origin.replace(/\/$/, '');
    } else if (req.headers.referer) {
      try {
        const refUrl = new URL(req.headers.referer);
        if (!refUrl.host.includes('localhost') && !refUrl.host.includes('127.0.0.1')) {
          publicOrigin = refUrl.origin;
        }
      } catch (e) {}
    }

    const resetRedirectUrl = `${publicOrigin}/reset-password`;

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: { redirectTo: resetRedirectUrl }
    });

    if (linkErr || !linkData?.properties?.action_link) {
      return res.status(400).json(successResponse(null, { error: linkErr?.message || 'Failed to generate reset link for user.' }));
    }

    const rawActionLink = linkData.properties.action_link;
    let resetUrl = rawActionLink;

    try {
      const verifyRes = await fetch(rawActionLink, { redirect: 'manual' });
      const location = verifyRes.headers.get('location');
      if (location) {
        if (location.includes('#')) {
          resetUrl = `${publicOrigin}/reset-password${location.substring(location.indexOf('#'))}`;
        } else if (location.includes('?')) {
          resetUrl = `${publicOrigin}/reset-password${location.substring(location.indexOf('?'))}`;
        }
      }
    } catch (err) {
      console.warn('[ADMIN RESET] Direct resolution failed, using raw link:', err);
    }

    const emailResult = await sendEmail({
      recipient: cleanEmail,
      template: 'password_reset',
      subject: 'Admin Issued Reset: Update Your Vivexa Password',
      data: {
        reset_url: resetUrl,
        expires_at: '24 hours'
      }
    });

    if (!emailResult.success) {
      return res.status(500).json(successResponse(null, { error: `Failed to deliver email: ${emailResult.error}` }));
    }

    return res.json(successResponse({ 
      message: `Password reset instructions dispatched to ${cleanEmail}.`,
      reset_url: resetUrl
    }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 7. DELETE /api/v1/admin/users/:userId - Delete User via AdminUserService
adminUsersRouter.delete('/users/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    await AdminUserService.deleteUser(userId);
    return res.json(successResponse({ userId, deleted: true }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 8. GET /api/v1/admin/invitations - Pending invitations
adminUsersRouter.get('/invitations', async (req: express.Request, res: express.Response) => {
  try {
    const { data: invitations } = await supabase.from('workspace_invitations').select('*').order('created_at', { ascending: false });
    return res.json(successResponse(invitations || []));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 8c. GET /api/v1/admin/audit-logs - Secure System Audit Logs
adminUsersRouter.get('/audit-logs', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser || !isUserAdminRole(adminUser)) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden' }));
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      // Fallback query if relation join is not configured in this database
      const { data: rawData, error: rawErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (rawErr) {
        console.error("Audit logs query error:", rawErr);
        return res.json(successResponse([]));
      }
      return res.json(successResponse(rawData || []));
    }

    const formattedLogs = data.map((item: any) => ({
      ...item,
      user_email: item.users?.email || item.user_id || 'System'
    }));

    return res.json(successResponse(formattedLogs));
  } catch (err: any) {
    console.error("Admin audit logs error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 8b. GET /api/v1/admin/workspace-members - Scoped Workspace Members
adminUsersRouter.get('/workspace-members', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    // Fetch workspace_members
    const { data: members, error: mErr } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, status, created_at, updated_at');
    
    // Fetch related users & profiles & workspaces safely
    const { data: usersList } = await supabase.from('users').select('*');
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: workspaces } = await supabase.from('workspaces').select('*');

    if (mErr || !members) {
      // Fallback: construct member views from profiles if workspace_members table doesn't exist or is empty
      const fallbackResults = (profiles || []).map((p: any) => ({
        id: p.id || p.user_id,
        workspace_id: 'ws-default',
        user_id: p.user_id || p.id,
        role: p.role || 'Analyst',
        status: p.status || 'active',
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
        full_name: p.full_name || p.email?.split('@')[0] || 'Enterprise User',
        email: p.email || 'user@domain.com',
        avatar_url: p.avatar_url || '',
        workspace_name: 'Enterprise Workspace',
        workspace_slug: 'workspace'
      }));
      return res.json(successResponse(fallbackResults));
    }

    // Build workspace members list
    const results = (members || []).map(m => {
      const uRecord = (usersList || []).find(u => u.id === m.user_id);
      const pRecord = (profiles || []).find(p => p.user_id === m.user_id || p.id === m.user_id);
      const wsRecord = (workspaces || []).find(w => w.id === m.workspace_id);

      const email = pRecord?.email || uRecord?.email || `user_${m.user_id.slice(0, 6)}@domain.com`;

      return {
        id: m.id,
        workspace_id: m.workspace_id,
        user_id: m.user_id,
        role: m.role || 'Analyst',
        status: m.status || 'active',
        created_at: m.created_at || new Date().toISOString(),
        updated_at: m.updated_at || new Date().toISOString(),
        full_name: pRecord?.full_name || email.split('@')[0],
        email: email,
        avatar_url: pRecord?.avatar_url || '',
        workspace_name: wsRecord?.name || 'Enterprise Workspace',
        workspace_slug: wsRecord?.slug || 'workspace'
      };
    });

    return res.json(successResponse(results));
  } catch (err: any) {
    console.error("Admin list workspace members error:", err);
    return res.json(successResponse([]));
  }
});

// 8c. GET /api/v1/admin/email-logs - Load all email delivery logs
adminUsersRouter.get('/email-logs', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { data: logs, error: logErr } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (logErr) {
      return res.json(successResponse([]));
    }

    return res.json(successResponse(logs || []));
  } catch (err: any) {
    return res.json(successResponse([]));
  }
});

// 9. DELETE /api/v1/admin/invitations/:inviteId - Cancel invite
adminUsersRouter.delete('/invitations/:inviteId', async (req: express.Request, res: express.Response) => {
  try {
    const { inviteId } = req.params;
    await supabase.from('workspace_invitations').update({ status: 'Cancelled' }).eq('id', inviteId);
    return res.json(successResponse({ inviteId, cancelled: true }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 10. POST /api/v1/admin/users/sync-directory - Enterprise Identity Synchronization
adminUsersRouter.post('/users/sync-directory', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: usersList } = await supabase.from('users').select('*');
    const { data: workspaces } = await supabase.from('workspaces').select('*');
    const { data: members } = await supabase.from('workspace_members').select('*');
    const { data: subscriptions } = await supabase.from('subscriptions').select('*');
    const { data: settings } = await supabase.from('settings').select('*');

    const userIds = new Set<string>();
    if (adminUser?.id) userIds.add(adminUser.id);
    (usersList || []).forEach(u => userIds.add(u.id));
    (profiles || []).forEach(p => userIds.add(p.user_id || p.id));
    (workspaces || []).forEach(w => { if (w.owner_id) userIds.add(w.owner_id); });
    (members || []).forEach(m => { if (m.user_id) userIds.add(m.user_id); });
    (subscriptions || []).forEach(s => { if (s.user_id) userIds.add(s.user_id); });
    (settings || []).forEach(st => { if (st.user_id) userIds.add(st.user_id); });

    // Core enhancement: Retrieve all authenticated users from auth.users to discover non-synced signups!
    const authUsersMap = new Map<string, any>();
    try {
      const { data: authList, error: authErr } = await supabase.auth.admin.listUsers();
      if (!authErr && authList && authList.users) {
        console.log(`[DIRECTORY SYNC] Loaded ${authList.users.length} accounts from auth.users`);
        (authList.users as any[]).forEach((u: any) => {
          userIds.add(u.id);
          authUsersMap.set(u.id, u);
        });
      } else if (authErr) {
        console.warn("[DIRECTORY SYNC] Could not list auth.users during sync:", authErr.message);
      }
    } catch (err: any) {
      console.warn("[DIRECTORY SYNC] auth.admin.listUsers exception:", err.message);
    }

    let repairedProfiles = 0;
    let repairedUsers = 0;
    let repairedWorkspaces = 0;
    let repairedMemberships = 0;
    let repairedSubscriptions = 0;
    let repairedSettings = 0;
    let repairedNotifications = 0;
    let repairedAuditLogs = 0;
    let repairedUsageLogs = 0;

    for (const uid of userIds) {
      const authUser = authUsersMap.get(uid);
      const email = authUser?.email || (uid === adminUser.id ? adminUser.email : `user_${uid.slice(0, 6)}@vivexa.ai`);
      const fullName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 
        (uid === adminUser.id ? (adminUser.user_metadata?.full_name || 'Paras Bishnoi') : 'Enterprise User');

      const hasUser = (usersList || []).some(u => u.id === uid);
      if (!hasUser) {
        await supabase.from('users').upsert({
          id: uid,
          email,
          role: (email === 'info.vivexa@gmail.com' || email === 'parasbishnoi012@gmail.com') ? 'superadmin' : 'user',
          plan: (email === 'info.vivexa@gmail.com' || email === 'parasbishnoi012@gmail.com') ? 'enterprise' : 'free',
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        repairedUsers++;
      }

      const hasProfile = (profiles || []).some(p => p.user_id === uid || p.id === uid);
      if (!hasProfile) {
        await supabase.from('profiles').upsert({
          user_id: uid,
          full_name: fullName,
          avatar_url: authUser?.user_metadata?.avatar_url || '',
          company: authUser?.user_metadata?.company || 'Vivexa HQ',
          role: (email === 'info.vivexa@gmail.com' || email === 'parasbishnoi012@gmail.com') ? 'Super Admin' : 'Analyst',
          country: 'India',
          language: 'en',
          timezone: 'Asia/Kolkata',
          theme_preference: 'dark',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        repairedProfiles++;
      }

      // Consolidate duplicate personal workspaces for the user
      // Detect duplicates, keep oldest, migrate assets, delete duplicates
      const userOwnedWorkspaces = (workspaces || []).filter(w => w.owner_id === uid && w.is_personal === true);
      let wsId: string | null = null;

      if (userOwnedWorkspaces.length > 0) {
        // Sort user workspaces by oldest (created_at)
        userOwnedWorkspaces.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const survivingWorkspace = userOwnedWorkspaces[0];
        wsId = survivingWorkspace.id;

        // If duplicate personal workspaces exist, consolidate them:
        if (userOwnedWorkspaces.length > 1) {
          const duplicateWorkspaces = userOwnedWorkspaces.slice(1);
          console.log(`[CONSOLIDATION] Consolidating ${duplicateWorkspaces.length} duplicate workspaces for user ${uid}`);

          for (const dup of duplicateWorkspaces) {
            // Move projects (and indirectly their datasets & reports) to surviving workspace
            await supabase
              .from('projects')
              .update({ workspace_id: survivingWorkspace.id })
              .eq('workspace_id', dup.id);

            // Move invitations to surviving workspace
            await supabase
              .from('workspace_invitations')
              .update({ workspace_id: survivingWorkspace.id })
              .eq('workspace_id', dup.id);

            // Move/merge members
            const { data: dupMembers } = await supabase
              .from('workspace_members')
              .select('*')
              .eq('workspace_id', dup.id);

            if (dupMembers && dupMembers.length > 0) {
              for (const dm of dupMembers) {
                if (dm.user_id !== uid) {
                  const hasMemberInSurvivor = (members || []).some(m => m.workspace_id === survivingWorkspace.id && m.user_id === dm.user_id);
                  if (!hasMemberInSurvivor) {
                    await supabase.from('workspace_members').insert({
                      workspace_id: survivingWorkspace.id,
                      user_id: dm.user_id,
                      role: dm.role,
                      status: dm.status
                    });
                  }
                }
              }
            }

            // Delete the duplicate workspace
            await supabase
              .from('workspaces')
              .delete()
              .eq('id', dup.id);

            repairedWorkspaces++; // count duplicate removal as a repair!
          }
        }
      } else {
        // Double check from database directly to prevent race conditions before creating one
        const { data: dbWs } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', uid)
          .eq('is_personal', true)
          .order('created_at', { ascending: true });

        if (dbWs && dbWs.length > 0) {
          wsId = dbWs[0].id;
        } else {
          const { data: newWs } = await supabase.from('workspaces').insert({
            name: `${fullName.split(' ')[0]}'s Workspace`,
            owner_id: uid,
            is_personal: true
          }).select('id').maybeSingle();
          if (newWs) wsId = newWs.id;
          repairedWorkspaces++;
        }
      }

      if (wsId) {
        const hasMember = (members || []).some(m => m.workspace_id === wsId && m.user_id === uid);
        if (!hasMember) {
          await supabase.from('workspace_members').insert({
            workspace_id: wsId,
            user_id: uid,
            role: (email === 'info.vivexa@gmail.com' || email === 'parasbishnoi012@gmail.com') ? 'owner' : 'member',
            status: 'active'
          });
          repairedMemberships++;
        }
      }

      const hasSub = (subscriptions || []).some(s => s.user_id === uid);
      if (!hasSub) {
        await supabase.from('subscriptions').insert({
          user_id: uid,
          plan_id: (email === 'info.vivexa@gmail.com' || email === 'parasbishnoi012@gmail.com') ? 'enterprise' : 'free',
          status: 'active',
          renews_at: new Date(Date.now() + 365*24*60*60*1000).toISOString()
        });
        repairedSubscriptions++;
      }

      const hasSettings = (settings || []).some(st => st.user_id === uid);
      if (!hasSettings) {
        await supabase.from('settings').insert({
          user_id: uid,
          preferences: {
            theme: "dark",
            email_notifications: true,
            auto_save: true,
            language: "en",
            timezone: "Asia/Kolkata"
          }
        });
        repairedSettings++;
      }

      // Sync Notifications welcome record
      const { data: existingNotifs } = await supabase.from('notifications').select('id').eq('user_id', uid).limit(1);
      if (!existingNotifs || existingNotifs.length === 0) {
        await supabase.from('notifications').insert({
          user_id: uid,
          type: 'success',
          title: 'Welcome to Vivexa Enterprise!',
          message: `Hello ${fullName}, your identity has been synchronized in the security directory.`,
          is_read: false
        });
        repairedNotifications++;
      }

      // Sync Audit Logs welcome record
      const { data: existingAudit } = await supabase.from('audit_logs').select('id').eq('user_id', uid).limit(1);
      if (!existingAudit || existingAudit.length === 0) {
        await supabase.from('audit_logs').insert({
          user_id: uid,
          action: 'user_registered',
          resource_type: 'users',
          resource_id: uid,
          payload: { source: 'auto_sync' }
        });
        repairedAuditLogs++;
      }

      // Sync Usage Logs Welcome/Initialization record
      const { data: existingUsage } = await supabase.from('usage_logs').select('id').eq('user_id', uid).limit(1);
      if (!existingUsage || existingUsage.length === 0) {
        await supabase.from('usage_logs').insert({
          user_id: uid,
          resource: 'compute_hours',
          amount: 5,
          metadata: { initial_allotment: true }
        });
        repairedUsageLogs++;
      }
    }

    try {
      await supabase.from('audit_logs').insert({
        action: 'Directory Synchronized',
        user_id: adminUser.id,
        resource_type: 'users',
        payload: {
          scanned: userIds.size,
          repaired_users: repairedUsers,
          repaired_profiles: repairedProfiles
        }
      });
    } catch (_) {}

    return res.json(successResponse({
      total_users: userIds.size,
      repaired_users: repairedUsers,
      repaired_profiles: repairedProfiles,
      repaired_workspaces: repairedWorkspaces,
      repaired_memberships: repairedMemberships,
      repaired_subscriptions: repairedSubscriptions,
      repaired_settings: repairedSettings,
      repaired_notifications: repairedNotifications,
      repaired_audit_logs: repairedAuditLogs,
      repaired_usage_logs: repairedUsageLogs,
      timestamp: new Date().toISOString()
    }));
  } catch (err: any) {
    console.error("Sync directory error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 11. GET /api/v1/admin/stats - Global Enterprise Command Center Statistics
adminUsersRouter.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser || !isUserAdminRole(adminUser)) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden: Requires Super Administrator privileges.' }));
    }

    // Helper to safely execute any Supabase or PromiseLike query without type errors or crashing
    const safeQuery = async (queryPromise: any) => {
      try {
        const result = await queryPromise;
        return { data: result.data || null, count: result.count !== undefined ? result.count : null, error: result.error || null };
      } catch (err) {
        return { data: null, count: null, error: err };
      }
    };

    // Run queries in parallel with individual error catch guards
    const [
      totalUsersRes,
      activeUsersRes,
      workspaceInvitationsRes,
      organizationsRes,
      workspacesRes,
      projectsRes,
      datasetsRes,
      datasetsSizeRes,
      aiConversationsRes,
      apiKeysRes,
      reportsRes
    ] = await Promise.all([
      safeQuery(supabase.from('profiles').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('profiles').select('status, updated_at, role')),
      safeQuery(supabase.from('workspace_invitations').select('id, status')),
      safeQuery(supabase.from('organizations').select('id')),
      safeQuery(supabase.from('workspaces').select('id')),
      safeQuery(supabase.from('projects').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('datasets').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('datasets').select('size_bytes')),
      safeQuery(supabase.from('ai_conversations').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('api_keys').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('reports').select('*', { count: 'exact', head: true }))
    ]);

    // Compute metrics with robust fallbacks
    const activeUsersData = activeUsersRes.data;
    const totalUsers = totalUsersRes.count || activeUsersData?.length || 0;
    
    const activeUsersCount = activeUsersData 
      ? activeUsersData.filter((p: any) => p.status === 'active').length 
      : 0;
    const activeUsers = activeUsersCount;

    const monthlyActiveUsersCount = activeUsersData
      ? activeUsersData.filter((p: any) => {
          const limitDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return new Date(p.updated_at) >= limitDate;
        }).length
      : 0;
    const monthlyActiveUsers = monthlyActiveUsersCount;

    // Dynamic Invitation Service Detection
    let pendingInvitations: any = 0;
    if (workspaceInvitationsRes.error) {
      const errCode = workspaceInvitationsRes.error.code;
      const errMsg = workspaceInvitationsRes.error.message || "";
      if (errCode === 'PGRST205' || errMsg.includes('relation') || errMsg.includes('does not exist')) {
        pendingInvitations = "Invitation service not configured";
      } else {
        pendingInvitations = "Unavailable";
      }
    } else if (Array.isArray(workspaceInvitationsRes.data)) {
      pendingInvitations = workspaceInvitationsRes.data.filter((i: any) => i.status === 'Pending').length;
    } else {
      pendingInvitations = "Invitation service not configured";
    }

    const organizations = organizationsRes.data?.length || 0;
    const workspaces = workspacesRes.data?.length || 0;

    const adminAccountsCount = activeUsersData
      ? activeUsersData.filter((p: any) => p.role === 'Super Admin' || p.role === 'Admin' || p.role === 'CTO').length
      : 0;
    const adminAccounts = adminAccountsCount;

    const datasetsSizeData = datasetsSizeRes.data;
    const totalStorageBytes = datasetsSizeData
      ? datasetsSizeData.reduce((acc: number, d: any) => acc + (d.size_bytes || 0), 0)
      : 0;
    const storageUsageGB = totalStorageBytes / (1024 * 1024 * 1024);

    const aiUsage = aiConversationsRes.count || 0;
    const apiUsage = apiKeysRes.count || 0;
    const reports = reportsRes.count || 0;
    const projects = projectsRes.count || 0;
    const datasets = datasetsRes.count || 0;

    const stats = {
      totalUsers,
      activeUsers,
      monthlyActiveUsers,
      pendingInvitations,
      organizations,
      workspaces,
      adminAccounts,
      storageUsageGB,
      aiUsage,
      apiUsage,
      reports,
      projects,
      datasets
    };

    return res.json(successResponse(stats));
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});
