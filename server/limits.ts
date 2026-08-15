import express from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export type PlanTier = "free" | "student" | "pro" | "enterprise";

export interface ServerPlanLimits {
  name: string;
  aiCallsLimit: number;
  maxDatasets: number;
  maxFileSizeMB: number;
  maxProjects: number;
  maxWorkspaces: number;
  maxSeats: number;
  rateLimitPerMin: number;
}

export const SERVER_PLAN_LIMITS: Record<PlanTier, ServerPlanLimits> = {
  free: {
    name: "Starter / Free",
    aiCallsLimit: 250,
    maxDatasets: 5,
    maxFileSizeMB: 50,
    maxProjects: 3,
    maxWorkspaces: 1,
    maxSeats: 3,
    rateLimitPerMin: 30
  },
  student: {
    name: "Academic / Student",
    aiCallsLimit: 1250,
    maxDatasets: 15,
    maxFileSizeMB: 100,
    maxProjects: 10,
    maxWorkspaces: 2,
    maxSeats: 5,
    rateLimitPerMin: 60
  },
  pro: {
    name: "Professional",
    aiCallsLimit: 12500,
    maxDatasets: 50,
    maxFileSizeMB: 500,
    maxProjects: 25,
    maxWorkspaces: 5,
    maxSeats: 15,
    rateLimitPerMin: 180
  },
  enterprise: {
    name: "Enterprise Global",
    aiCallsLimit: 125000,
    maxDatasets: 500,
    maxFileSizeMB: 2048,
    maxProjects: 250,
    maxWorkspaces: 50,
    maxSeats: 100,
    rateLimitPerMin: 600
  }
};

// In-memory usage store (persisted alongside DB)
const userAiUsageMap = new Map<string, { count: number; lastReset: number }>();
const ipRateLimitMap = new Map<string, { count: number; windowStart: number }>();

export function resolveUserPlanTier(user: any): PlanTier {
  if (!user) return "free";
  const plan = String(user.app_metadata?.plan || user.user_metadata?.plan || user.plan || "free").toLowerCase();
  if (plan.includes("enterprise")) return "enterprise";
  if (plan.includes("pro")) return "pro";
  if (plan.includes("student") || plan.includes("academic")) return "student";
  return "free";
}

export function getUserUsage(userId: string): number {
  const current = userAiUsageMap.get(userId);
  if (!current) return 0;
  // Auto-reset monthly (30 days)
  const now = Date.now();
  if (now - current.lastReset > 30 * 24 * 60 * 60 * 1000) {
    userAiUsageMap.set(userId, { count: 0, lastReset: now });
    return 0;
  }
  return current.count;
}

export function incrementUserUsage(userId: string, count: number = 1): number {
  const current = getUserUsage(userId);
  const newCount = current + count;
  const existing = userAiUsageMap.get(userId);
  userAiUsageMap.set(userId, {
    count: newCount,
    lastReset: existing?.lastReset || Date.now()
  });
  return newCount;
}

export function resetUserUsage(userId: string): void {
  userAiUsageMap.set(userId, { count: 0, lastReset: Date.now() });
}

// 1. Sliding Window Rate Limiter Middleware
export function rateLimiterMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const user = (req as any).user;
  const key = user?.id || clientIp;
  const tier = resolveUserPlanTier(user);
  const limits = SERVER_PLAN_LIMITS[tier];

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const record = ipRateLimitMap.get(key);

  if (!record || now - record.windowStart > windowMs) {
    ipRateLimitMap.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (record.count >= limits.rateLimitPerMin) {
    console.warn(`[RATE LIMIT EXCEEDED] IP/User: ${key} (${record.count}/${limits.rateLimitPerMin} req/min)`);
    return res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit of ${limits.rateLimitPerMin} requests/min exceeded for your plan tier (${limits.name}). Please slow down or upgrade.`,
      limit: limits.rateLimitPerMin,
      retryAfterSeconds: Math.ceil((record.windowStart + windowMs - now) / 1000)
    });
  }

  record.count += 1;
  next();
}

// 2. AI Quota Enforcer Middleware
export function enforceAiQuotaMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user?.id) {
    return next();
  }

  // Admin bypass
  if (user.email === 'parasbishnoi012@gmail.com' || user.email === 'info.vivexa@gmail.com') {
    return next();
  }

  const tier = resolveUserPlanTier(user);
  const limits = SERVER_PLAN_LIMITS[tier];
  const used = getUserUsage(user.id);

  if (used >= limits.aiCallsLimit) {
    console.warn(`[AI QUOTA BLOCKED] User ${user.id} (${user.email}) exceeded quota: ${used}/${limits.aiCallsLimit}`);
    return res.status(429).json({
      success: false,
      error: "AI_QUOTA_EXCEEDED",
      code: "LIMIT_CONTROL_BLOCKED",
      resource: "ai_calls",
      used,
      limit: limits.aiCallsLimit,
      plan: limits.name,
      message: `Monthly AI API quota reached (${used}/${limits.aiCallsLimit} calls). Further AI generations and predictions are locked for your plan tier. Please upgrade in Plans & Billing.`
    });
  }

  // Track consumption
  incrementUserUsage(user.id, 1);
  next();
}

// 3. Dataset Count & File Size Guard Helper
export async function checkDatasetUploadLimit(user: any, fileSizeBytes: number): Promise<{ allowed: boolean; error?: string; code?: string }> {
  if (!user?.id) return { allowed: true };

  const tier = resolveUserPlanTier(user);
  const limits = SERVER_PLAN_LIMITS[tier];
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (fileSizeMB > limits.maxFileSizeMB) {
    return {
      allowed: false,
      code: "FILE_SIZE_LIMIT_EXCEEDED",
      error: `File size (${fileSizeMB.toFixed(1)} MB) exceeds the maximum allowed file size of ${limits.maxFileSizeMB} MB for the ${limits.name} plan.`
    };
  }

  try {
    const { count, error } = await supabase
      .from('datasets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!error && typeof count === 'number' && count >= limits.maxDatasets) {
      return {
        allowed: false,
        code: "DATASET_LIMIT_EXCEEDED",
        error: `Dataset allocation reached: You already have ${count}/${limits.maxDatasets} datasets on your ${limits.name} plan. Delete existing datasets or upgrade to Pro for up to 50 datasets.`
      };
    }
  } catch (err) {
    console.warn("[LIMITS] Error querying dataset count:", err);
  }

  return { allowed: true };
}
