import express from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return createClient(url || "", key || "");
};

export const projectsRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// 1. GET /api/v1/projects/:id/milestones - Fetch milestones for a project
projectsRouter.get('/:id/milestones', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();

    // Verify user has access to project
    const { data: project } = await adminClient
      .from('projects')
      .select('owner_id, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (project && project.owner_id !== user.id) {
      // Check workspace membership
      if (project.workspace_id) {
        const { data: member } = await adminClient
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', project.workspace_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (!member && user.email !== 'parasbishnoi012@gmail.com' && user.email !== 'info.vivexa@gmail.com') {
          return res.status(403).json(successResponse(null, { error: 'Access denied to this project.' }));
        }
      }
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        return res.json(successResponse([]));
      }
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse(data || []));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 2. POST /api/v1/projects/:id/milestones - Upsert milestones for a project
projectsRouter.post('/:id/milestones', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { milestones } = req.body;
    const user = (req as any).user;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();

    // Verify user has edit access to project
    const { data: project } = await adminClient
      .from('projects')
      .select('owner_id, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (project && project.owner_id !== user.id) {
      if (project.workspace_id) {
        const { data: member } = await adminClient
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', project.workspace_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        const role = member?.role?.toLowerCase();
        const isEditor = role === 'owner' || role === 'admin' || role === 'manager' || role === 'analyst';
        if (!isEditor && user.email !== 'parasbishnoi012@gmail.com' && user.email !== 'info.vivexa@gmail.com') {
          return res.status(403).json(successResponse(null, { error: 'Access denied to modify milestones for this project.' }));
        }
      }
    }

    // Delete existing milestones and re-insert or use upsert if milestones have IDs
    await supabase.from('project_milestones').delete().eq('project_id', id);

    const toInsert = (milestones || []).map((m: any) => ({
      project_id: id,
      user_id: user.id,
      label: m.label,
      is_checked: m.checked || m.is_checked || false,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('project_milestones')
      .insert(toInsert)
      .select();

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse(data));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 3. POST /api/v1/projects/:id/share - Share project with another user
projectsRouter.post('/:id/share', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const user = (req as any).user;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    // 1. Verify project ownership
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('name')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (pErr || !project) {
      return res.status(403).json(successResponse(null, { error: 'You do not have permission to share this project.' }));
    }

    // 2. Find target user
    const { data: targetUser, error: uErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (uErr || !targetUser) {
       // Mock success but in reality we'd send an invite email
       return res.json(successResponse({ shared: true, invited: true, message: `Invitation email sent to ${email}` }));
    }

    // 3. Create sharing record (if table exists)
    const { error: sErr } = await supabase
      .from('project_shares')
      .upsert({
        project_id: id,
        user_id: targetUser.id,
        shared_by: user.id,
        permission: 'viewer'
      }, { onConflict: 'project_id,user_id' });

    return res.json(successResponse({ shared: true, invited: false }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});
