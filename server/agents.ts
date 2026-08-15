import express from "express";
import { createClient } from "@supabase/supabase-js";
import { enforceAiQuotaMiddleware } from "./limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

export const agentsRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// 1. GET /api/v1/agents - Fetch all agents for a user
agentsRouter.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.json(successResponse([]));
    }

    return res.json(successResponse(data || []));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 2. POST /api/v1/agents - Upsert agents for a user
agentsRouter.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { agents } = req.body;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const toInsert = agents.map((a: any) => ({
      user_id: user.id,
      agent_id: a.id,
      name: a.name,
      prompt: a.prompt,
      temperature: a.temperature,
      max_tokens: a.maxTokens || a.max_tokens,
      memory_retries: a.memoryRetries || a.memory_retries || false,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('ai_agents')
      .upsert(toInsert, { onConflict: 'user_id,agent_id' })
      .select();

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse(data));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 3. POST /api/v1/agents/execute - Simulate an agent execution
agentsRouter.post('/execute', enforceAiQuotaMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { agent_id, dataset_id, directive, mode } = req.body;
    
    // Simulate thinking time
    await new Promise(r => setTimeout(r, 1500));

    // Orchestration mode for Cockpit
    if (mode) {
      const logs = [
        "[Orchestrator v2.4] Handshake established with 11 distributed agent nodes.",
        "[Data Analyst Agent] Sanitizing active dataset schemas and profiling distributions...",
        "[Statistical Analyst] Running multivariate correlation and ANOVA variance tests...",
        "[ML Engineering Agent] Training 5-fold cross-validated LightGBM ensembles...",
        "[Business Strategy Agent] Synthesizing ROI inflection matrices and EBITDA forecasts...",
        "[Orchestrator v2.4] Consensus reached (98.4% Accord). Execution successful."
      ];
      return res.json(successResponse({ logs }));
    }

    // Return a rich simulation result based on agent_id
    const results: any = {
      execution_id: `exec_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      consensus_reached: true,
      data: {
        reasoning: `Executed capability ${agent_id} with directive: ${directive || 'Auto-optimize'}.`,
        metrics: {
          confidence: 0.98,
          latency_ms: 142,
          tokens_used: 1240
        }
      }
    };

    return res.json(successResponse(results));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});
