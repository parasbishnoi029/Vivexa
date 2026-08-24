import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return createClient(url || "", key || "");
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export const projectsRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// 1. GET /api/v1/projects - Fetch all projects for authenticated user
projectsRouter.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();
    const { data: projects, error } = await adminClient
      .from('projects')
      .select('*')
      .or(`owner_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse(projects || []));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 2. POST /api/v1/projects - Create a new project with workspace fallback and initial milestones
projectsRouter.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const {
      name,
      description,
      industry = 'finance',
      goal = 'growth',
      currency = 'USD',
      units = 'metric',
      theme = 'indigo',
      privacy = 'private',
      workspace_id
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(successResponse(null, { error: 'Project name is required.' }));
    }

    const adminClient = getAdminClient();

    // 1. Find or create default workspace for user if workspace_id not provided
    let targetWorkspaceId = workspace_id;
    if (!targetWorkspaceId || targetWorkspaceId === 'all') {
      const { data: wsList } = await adminClient
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (wsList && wsList.length > 0) {
        targetWorkspaceId = wsList[0].id;
      } else {
        // Create a default workspace for user
        const { data: newWs } = await adminClient
          .from('workspaces')
          .insert({
            name: `${user.email?.split('@')[0] || 'My'}'s Workspace`,
            owner_id: user.id,
            plan: 'Pro',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (newWs) targetWorkspaceId = newWs.id;
      }
    }

    // 2. Insert new project
    const newProjectPayload = {
      name: name.trim(),
      description: description || '',
      industry,
      color: theme,
      owner_id: user.id,
      workspace_id: targetWorkspaceId || null,
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newProject, error: pErr } = await adminClient
      .from('projects')
      .insert(newProjectPayload)
      .select()
      .single();

    if (pErr) {
      console.error("Failed to insert project:", pErr);
      return res.status(500).json(successResponse(null, { error: pErr.message }));
    }

    // 3. Create default milestones
    const defaultMilestones = [
      { project_id: newProject.id, user_id: user.id, label: 'Define Investigation Scope', is_checked: true },
      { project_id: newProject.id, user_id: user.id, label: 'Link & Clean Datasets', is_checked: false },
      { project_id: newProject.id, user_id: user.id, label: 'Conduct AI Statistical Audit', is_checked: false },
      { project_id: newProject.id, user_id: user.id, label: 'Train Forecasting Models', is_checked: false }
    ];
    await adminClient.from('project_milestones').insert(defaultMilestones);

    // 4. Log initial activity
    await adminClient.from('project_activity').insert({
      project_id: newProject.id,
      user_id: user.id,
      action: `Created project "${newProject.name}"`,
      created_at: new Date().toISOString()
    });

    // 5. Log to audit trail
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: `Created Project: ${newProject.name}`,
      resource_type: 'projects',
      resource_id: newProject.id,
      created_at: new Date().toISOString()
    });

    return res.json(successResponse(newProject));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 3. GET /api/v1/projects/:id - Get single project details
projectsRouter.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();
    const { data: project, error } = await adminClient
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json(successResponse(null, { error: 'Project not found.' }));
    }

    return res.json(successResponse(project));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 4. PUT /api/v1/projects/:id - Update & Refine project metadata
projectsRouter.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { name, description, industry, status, color, goal } = req.body;
    const adminClient = getAdminClient();

    const updates: any = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (industry !== undefined) updates.industry = industry;
    if (status !== undefined) updates.status = status;
    if (color !== undefined) updates.color = color;

    const { data: updatedProject, error } = await adminClient
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    // Log activity
    await adminClient.from('project_activity').insert({
      project_id: id,
      user_id: user.id,
      action: `Updated & refined project details`,
      created_at: new Date().toISOString()
    });

    return res.json(successResponse(updatedProject));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 5. POST /api/v1/projects/:id/refine-ai - AI-powered project refinement
projectsRouter.post('/:id/refine-ai', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();
    const { data: project } = await adminClient.from('projects').select('*').eq('id', id).single();
    if (!project) return res.status(404).json(successResponse(null, { error: 'Project not found' }));

    const gemini = getGeminiClient();
    let aiRefinement = {
      refinedDescription: project.description || "Comprehensive empirical investigation into operational metrics.",
      suggestedMilestones: [
        "Audit Missing Values & Normalization Pipeline",
        "Run Causal Factor Analysis & Variance Test",
        "Generate Automated Executive Briefing PDF"
      ],
      recommendedHypothesis: "Key driver of metric variance stems from recent cohort distribution shifts."
    };

    if (gemini) {
      try {
        const prompt = `You are a Principal Data Scientist refining a project titled "${project.name}".
Current Description: "${project.description || 'None'}"
Industry: "${project.industry || 'General'}"

Please produce a JSON response with:
1. "refinedDescription": An enhanced, professional executive project summary (2-3 sentences).
2. "suggestedMilestones": An array of 3 specific, high-value data science investigation milestones.
3. "recommendedHypothesis": A testable statistical hypothesis for this investigation.
Respond strictly in valid JSON format.`;

        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });

        const rawText = response.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiRefinement = { ...aiRefinement, ...parsed };
        }
      } catch (aiErr) {
        console.warn("Gemini project refinement fallback:", aiErr);
      }
    }

    // Apply refined description to project
    await adminClient
      .from('projects')
      .update({
        description: aiRefinement.refinedDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Insert new AI milestones
    if (aiRefinement.suggestedMilestones && aiRefinement.suggestedMilestones.length > 0) {
      const newMs = aiRefinement.suggestedMilestones.map(label => ({
        project_id: id,
        user_id: user.id,
        label,
        is_checked: false
      }));
      await adminClient.from('project_milestones').insert(newMs);
    }

    // Log activity
    await adminClient.from('project_activity').insert({
      project_id: id,
      user_id: user.id,
      action: `AI Refinement applied: Enhanced scope & added milestones`,
      created_at: new Date().toISOString()
    });

    return res.json(successResponse(aiRefinement));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 6. POST /api/v1/projects/:id/upgrade - Upgrade project compute tier / request plan upgrade
projectsRouter.post('/:id/upgrade', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { requested_tier = 'Pro' } = req.body;
    const adminClient = getAdminClient();

    // 1. Update project compute tier status
    const { data: updatedProject, error } = await adminClient
      .from('projects')
      .update({
        status: `${requested_tier} Tier`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    // 2. Submit formal upgrade request into database table
    await adminClient.from('upgrade_requests').insert({
      user_id: user.id,
      user_email: user.email,
      user_name: user.email?.split('@')[0] || 'User',
      current_plan: 'Pro',
      requested_plan: `${requested_tier} Tier`,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // 3. Log activity
    await adminClient.from('project_activity').insert({
      project_id: id,
      user_id: user.id,
      action: `Requested project compute upgrade to ${requested_tier} Tier`,
      created_at: new Date().toISOString()
    });

    return res.json(successResponse({
      upgraded: true,
      project: updatedProject,
      message: `Project upgraded to ${requested_tier} compute tier.`
    }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 7. GET /api/v1/projects/:id/milestones - Fetch milestones
projectsRouter.get('/:id/milestones', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();

    const { data, error } = await adminClient
      .from('project_milestones')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.json(successResponse([]));
    }

    return res.json(successResponse(data || []));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 8. POST /api/v1/projects/:id/milestones - Upsert milestones
projectsRouter.post('/:id/milestones', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { milestones } = req.body;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();

    // Delete existing milestones and re-insert
    await adminClient.from('project_milestones').delete().eq('project_id', id);

    const toInsert = (milestones || []).map((m: any) => ({
      project_id: id,
      user_id: user.id,
      label: m.label,
      is_checked: m.checked || m.is_checked || false,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await adminClient
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

// 9. POST /api/v1/projects/:id/share - Share project
projectsRouter.post('/:id/share', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();
    const { data: targetUser } = await adminClient.from('users').select('id').eq('email', email).maybeSingle();

    if (targetUser) {
      await adminClient.from('project_shares').upsert({
        project_id: id,
        user_id: targetUser.id,
        shared_by: user.id,
        permission: 'viewer'
      }, { onConflict: 'project_id,user_id' });
    }

    return res.json(successResponse({ shared: true, message: `Project shared with ${email}` }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 10. DELETE /api/v1/projects/:id - Delete project
projectsRouter.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const adminClient = getAdminClient();
    const { error } = await adminClient.from('projects').delete().eq('id', id);

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse({ deleted: true }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});
