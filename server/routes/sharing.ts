import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../emailService';

export const sharingRouter = express.Router();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

function successResponse(data: any, error: any = null) {
  if (error) {
    return { success: false, error: typeof error === 'string' ? error : error.message || 'Error occurred' };
  }
  return { success: true, data };
}

// Share Project Route
sharingRouter.post('/projects/:id/share', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
    }

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (pErr || !project) {
      return res.status(404).json(successResponse(null, { error: 'Project not found' }));
    }

    const origin = req.headers.referer || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const projectUrl = `${cleanOrigin}/workspace/projects/${project.id}`;

    const emailResult = await sendEmail({
      recipient: email.trim().toLowerCase(),
      template: 'project_shared',
      subject: `Project Access Shared: "${project.name}" on Vivexa`,
      data: {
        project_name: project.name,
        project_url: projectUrl
      }
    });

    if (!emailResult.success) {
      return res.status(500).json(successResponse(null, { error: `Email delivery failed: ${emailResult.error}` }));
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'PROJECT_SHARED',
      resource_type: 'PROJECT',
      resource_id: id,
      payload: { shared_with: email }
    });

    return res.json(successResponse({ message: `Project successfully shared with ${email}.` }));
  } catch (err: any) {
    console.error('[PROJECTS API] Share project error:', err);
    return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
  }
});

// Share Dataset Route
sharingRouter.post('/datasets/:id/share', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
    }

    const { data: dataset, error: dErr } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dErr || !dataset) {
      return res.status(404).json(successResponse(null, { error: 'Dataset not found' }));
    }

    const origin = req.headers.referer || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const datasetUrl = `${cleanOrigin}/workspace/datasets/${dataset.id}`;

    const emailResult = await sendEmail({
      recipient: email.trim().toLowerCase(),
      template: 'dataset_shared',
      subject: `Dataset Access Shared: "${dataset.name}" on Vivexa`,
      data: {
        dataset_name: dataset.name,
        dataset_type: dataset.type?.toUpperCase() || 'CSV',
        dataset_url: datasetUrl
      }
    });

    if (!emailResult.success) {
      return res.status(500).json(successResponse(null, { error: `Dataset sharing email delivery failed: ${emailResult.error}` }));
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'DATASET_SHARED',
      resource_type: 'DATASET',
      resource_id: id,
      payload: { shared_with: email }
    });

    return res.json(successResponse({ message: `Dataset successfully shared with ${email}.` }));
  } catch (err: any) {
    console.error('[DATASETS API] Share dataset error:', err);
    return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
  }
});
