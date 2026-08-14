import express from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const automationsRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// GET /api/v1/automations
automationsRouter.get('/', async (req, res) => {
  const user = (req as any).user;
  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json(successResponse(null, { error: error.message }));
  }

  res.json(successResponse(data || []));
});

// POST /api/v1/automations
automationsRouter.post('/', async (req, res) => {
  const user = (req as any).user;
  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  const { name, trigger_type, trigger_detail, condition, action_type, action_detail, enabled = true, webhook_url, webhook_enabled = false } = req.body;

  if (!name) {
    return res.status(400).json(successResponse(null, { error: 'Name is required' }));
  }

  const { data, error } = await supabase
    .from('automations')
    .insert({
      user_id: user.id,
      name,
      trigger_type,
      trigger_detail,
      condition,
      action_type,
      action_detail,
      enabled,
      webhook_url,
      webhook_enabled,
      success_rate: '100%'
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json(successResponse(null, { error: error.message }));
  }

  res.json(successResponse(data));
});

// PATCH /api/v1/automations/:id
automationsRouter.patch('/:id', async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  const updates = req.body;

  const { data, error } = await supabase
    .from('automations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json(successResponse(null, { error: error.message }));
  }

  res.json(successResponse(data));
});

// DELETE /api/v1/automations/:id
automationsRouter.delete('/:id', async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return res.status(500).json(successResponse(null, { error: error.message }));
  }

  res.json(successResponse({ success: true }));
});

// POST /api/v1/automations/:id/execute
automationsRouter.post('/:id/execute', async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  const { data: wf, error: fetchErr } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !wf) {
    return res.status(404).json(successResponse(null, { error: 'Workflow not found' }));
  }

  // Simulate execution
  const startTime = Date.now();
  let actionResult = `Executed action: ${wf.action_detail}`;
  let status: 'Success' | 'Failed' = 'Success';

  // Trigger webhook if enabled
  if (wf.webhook_enabled && wf.webhook_url) {
    try {
      const response = await fetch(wf.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'automation.workflow.triggered',
          workflow: wf,
          timestamp: new Date().toISOString()
        })
      });
      actionResult += ` | Webhook POSTed to ${wf.webhook_url} [HTTP ${response.status}]`;
    } catch (err: any) {
      actionResult += ` | Webhook failed: ${err.message}`;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

  // Insert log
  const { data: log, error: logErr } = await supabase
    .from('automation_logs')
    .insert({
      automation_id: id,
      status,
      duration,
      trigger_event: 'Manual Trigger',
      action_result: actionResult,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  // Update last run
  await supabase.from('automations').update({ last_run: new Date().toISOString() }).eq('id', id);

  res.json(successResponse({ log, status, duration }));
});
