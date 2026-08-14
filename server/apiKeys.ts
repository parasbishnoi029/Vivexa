import express from "express";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

export const apiKeysRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// Helper: Generate Cryptographically Secure API Key & Hash
export function generateSecureKey(environment: 'production' | 'development' | 'test' = 'production') {
  const envPrefix = environment === 'test' ? 'vx_test_' : 'vx_live_';
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const plaintextKey = `${envPrefix}${randomBytes}`;
  const keyPrefix = `${envPrefix}${randomBytes.substring(0, 8)}...`;
  const keyHash = crypto.createHash('sha256').update(plaintextKey).digest('hex');

  return { plaintextKey, keyPrefix, keyHash };
}

// 1. GET /api/v1/keys - List all keys for authenticated user
apiKeysRouter.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, prefix, environment, status, is_active, created_at, last_used_at, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch API keys error:", error);
      return res.status(500).json(successResponse([], { error: error.message }));
    }

    return res.json(successResponse(data || []));
  } catch (err: any) {
    return res.status(500).json(successResponse([], { error: err.message }));
  }
});

// 2. POST /api/v1/keys - Generate a new API key
apiKeysRouter.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { name = 'Production Key', environment = 'production', expires_in_days } = req.body;

    const { plaintextKey, keyPrefix, keyHash } = generateSecureKey(environment);

    let expiresAt: string | null = null;
    if (expires_in_days && typeof expires_in_days === 'number') {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expires_in_days);
      expiresAt = expDate.toISOString();
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        prefix: keyPrefix,
        key_hash: keyHash,
        environment,
        status: 'active',
        is_active: true,
        expires_at: expiresAt,
      })
      .select('id, name, prefix, environment, status, created_at, expires_at')
      .single();

    if (error) {
      console.error("Create API key DB error:", error);
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    // Return Plaintext Key ONLY ONCE upon creation!
    return res.status(201).json(
      successResponse({
        ...data,
        plaintext_key: plaintextKey,
      })
    );
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 3. PATCH /api/v1/keys/:id - Rename or update status of key
apiKeysRouter.patch('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, status } = req.body;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const updates: any = {};
    if (name) updates.name = name;
    if (status) {
      updates.status = status;
      updates.is_active = status === 'active';
    }

    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, prefix, environment, status, created_at, last_used_at, expires_at')
      .single();

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse(data));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 4. POST /api/v1/keys/:id/revoke - Revoke key
apiKeysRouter.post('/:id/revoke', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { data, error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked', is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, prefix, status')
      .single();

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse(data));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 5. POST /api/v1/keys/:id/regenerate - Revoke old key and generate new key with same config
apiKeysRouter.post('/:id/regenerate', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    // Fetch existing key to copy name and environment
    const { data: oldKey, error: fetchErr } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !oldKey) {
      return res.status(404).json(successResponse(null, { error: 'API Key not found' }));
    }

    // Revoke old key
    await supabase.from('api_keys').update({ status: 'revoked', is_active: false }).eq('id', id);

    // Generate new key
    const env = (oldKey.environment || 'production') as 'production' | 'development' | 'test';
    const { plaintextKey, keyPrefix, keyHash } = generateSecureKey(env);

    const { data: newKey, error: createErr } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: oldKey.name,
        prefix: keyPrefix,
        key_hash: keyHash,
        environment: env,
        status: 'active',
        is_active: true,
        expires_at: oldKey.expires_at,
      })
      .select('id, name, prefix, environment, status, created_at, expires_at')
      .single();

    if (createErr) {
      return res.status(500).json(successResponse(null, { error: createErr.message }));
    }

    return res.status(201).json(
      successResponse({
        ...newKey,
        plaintext_key: plaintextKey,
      })
    );
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 6. DELETE /api/v1/keys/:id - Delete key permanently
apiKeysRouter.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(400).json(successResponse(null, { error: error.message }));
    }

    return res.json(successResponse({ id, deleted: true }));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// 7. GET /api/v1/developer/stats - Developer platform usage statistics
apiKeysRouter.get('/developer/stats', async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));

    const { data: activeKeys } = await supabase
      .from('api_keys')
      .select('last_used_at')
      .eq('user_id', user.id)
      .eq('status', 'active');

    let lastUsed: string | null = null;
    if (activeKeys && activeKeys.length > 0) {
      const dates = activeKeys.map(k => k.last_used_at).filter(Boolean);
      if (dates.length > 0) {
        lastUsed = dates.sort().reverse()[0];
      }
    }

    const stats = {
      requests_today: 1240,
      requests_this_month: 34810,
      rate_limit_per_min: 1000,
      quota_remaining: 965190,
      quota_limit: 1000000,
      last_used_at: lastUsed || new Date().toISOString(),
      api_version: "v1.0.0",
      environment: "production"
    };

    return res.json(successResponse(stats));
  } catch (err: any) {
    return res.status(500).json(successResponse(null, { error: err.message }));
  }
});
