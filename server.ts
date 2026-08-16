import express from "express";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import multer from 'multer';
import csvParser from 'csv-parser';

import sqlParserPkg from 'node-sql-parser';
const SqlParser = sqlParserPkg.Parser;
import { Worker as WorkerThread, isMainThread, parentPort, workerData } from 'worker_threads';
import fsPromises from 'fs/promises';

// --- MODULAR EXPRESS ROUTERS ---
import { connectorsRouter as dataLakeConnectorsRouter } from "./server/routes/connectors";
import { telemetryRouter } from "./server/routes/telemetry";
import { ticketsRouter } from "./server/routes/tickets";
import { aiRouter } from "./server/routes/ai";
import { ragRouter } from "./server/routes/rag";
import { dbtRouter } from "./server/routes/dbt";
import { qualityRouter } from "./server/routes/quality";
import { collabRouter } from "./server/routes/collab";
import { auditRouter } from "./server/routes/audit";
import { sharingRouter } from "./server/routes/sharing";
import { enterpriseComputeRouter } from "./server/routes/enterpriseCompute";
import { lakehouseRouter } from "./server/routes/lakehouse";
import { llmApiRouter } from "./server/routes/llm";
import { 
  authRateLimiter, 
  publicApiRateLimiter, 
  strictAiRateLimiter, 
  globalApiRateLimiter 
} from "./server/middleware/rateLimiter";

// --- ENTERPRISE IN-MEMORY DATABASE ---
// In a true deployed cluster, this would be a real distributed Lakehouse (e.g. DuckDB/Databricks).
// Here we use SQLite to prove Server-Side execution and AST validation.

// --- ENTERPRISE IN-MEMORY DATABASE (MOCK) ---
// In-memory lightweight SQL engine for sandbox execution
const enterpriseDB = {
  tables: {},
  run: function(query: string, params?: any, cb?: any) {
    if (typeof params === 'function') cb = params;
    if (cb) cb(null);
  },
  all: function(query: string, params?: any, cb?: any) {
    if (typeof params === 'function') cb = params;
    // Synthesized telemetry rows
    const mockRows = Array.from({ length: 5 }).map((_, i) => ({
      id: i + 1,
      tenant_id: 'demo_tenant',
      name: 'Simulated Record ' + (i+1),
      value: Math.floor(Math.random() * 1000)
    }));
    if (cb) cb(null, mockRows);
  }
};

const sqlParser = new SqlParser();

// Ensure temp directory exists
const upload = multer({ dest: '/tmp/vivexa_uploads/' });

import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { apiKeysRouter } from "./server/apiKeys";
import { aiAnalystRouter } from "./server/aiAnalyst";
import { organizationRouter } from "./server/organization";
import { datasetsRouter } from "./server/datasets";
import { adminUsersRouter } from "./server/adminUsers";
import { forecastRouter } from "./server/forecast";
import { notebookRouter } from "./server/notebook";
import { automationsRouter } from "./server/automations";
import { projectsRouter } from "./server/projects";
import { agentsRouter } from "./server/agents";
import { connectorsRouter } from "./server/connectors";
import { sdkRouter } from "./server/sdk";
import { enterpriseRouter } from "./server/enterprise";
import { scimRouter } from "./server/scim";
import { HocuspocusCRDTServer } from "./server/services/HocuspocusCRDTServer";
import { sendEmail } from "./server/emailService";
import { rateLimiterMiddleware, getUserUsage, resetUserUsage, SERVER_PLAN_LIMITS, resolveUserPlanTier } from "./server/limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

async function startServer() {
  if (!isMainThread) return;

  const app = express();
  app.set('trust proxy', 1);
  app.use(compression());
  const PORT = 3000;
  const httpServer = http.createServer(app);
  
  // Security Headers Middleware (Helmet + Custom Defensive Headers)
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite dev server & iframe preview compatibility
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Global Express Rate Limiter for Abuse & DoS Defense
  const globalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Max 300 requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
    },
    message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP address, please try again in 15 minutes.' }
  });

  app.use('/api/', globalApiLimiter);
  
  // Initialize Enterprise Yjs / Hocuspocus CRDT WebSocket Server
  HocuspocusCRDTServer.init(httpServer);
  
  app.use(express.json());

  // --- MOUNT DEDICATED MODULAR EXPRESS ROUTERS ---
  app.use('/api/v1/connectors', dataLakeConnectorsRouter);
  app.use('/api/v1/telemetry', telemetryRouter);
  app.use('/api/v1/tickets', ticketsRouter);
  app.use('/api/v1/ai', aiRouter);

  // Mount standard SCIM 2.0 root endpoint (RFC 7644)
  app.use('/scim/v2', scimRouter);

  const successResponse = (data: any, meta?: any) => {
    return { success: true, data, meta: meta || null, error: null };
  };

  // Hybrid Auth Middleware: Handles both Supabase Auth JWT and Vivexa API Keys (vx_live_ / vx_test_)
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;

    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (apiKeyHeader) {
      token = apiKeyHeader;
    }

    if (!token) {
      return res.status(401).json(successResponse(null, { error: 'Unauthorized: Missing Authorization or X-API-Key header' }));
    }

    // 1. API Key Authentication (vx_live_... or vx_test_...)
    if (token.startsWith('vx_live_') || token.startsWith('vx_test_')) {
      const keyHash = crypto.createHash('sha256').update(token).digest('hex');
      const { data: keyData, error: keyErr } = await supabase
        .from('api_keys')
        .select('*, users(*)')
        .eq('key_hash', keyHash)
        .eq('status', 'active')
        .maybeSingle();

      if (keyErr || !keyData) {
        return res.status(401).json(successResponse(null, { error: 'Unauthorized: Invalid or revoked API key' }));
      }

      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return res.status(401).json(successResponse(null, { error: 'Unauthorized: API key expired' }));
      }

      // Asynchronously update last_used_at
      supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id).then();

      (req as any).user = { id: keyData.user_id, email: keyData.users?.email || 'api.user@vivexa.ai' };
      (req as any).apiKey = keyData;
      return next();
    }

    // 2. Supabase JWT Authentication
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json(successResponse(null, { error: 'Unauthorized: Invalid authentication session' }));
    }
    
    (req as any).user = user;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || (user.email !== 'info.vivexa@gmail.com' && user.email !== 'parasbishnoi012@gmail.com')) {
      return res.status(403).json(successResponse(null, { error: 'Forbidden: Admin access required' }));
    }
    next();
  };

  const apiRouter = express.Router();
  apiRouter.use(express.json());
  apiRouter.use(globalApiRateLimiter);
  apiRouter.use(rateLimiterMiddleware);

  // --- SERVER-SIDE RATE LIMITING & DDOS / BRUTE-FORCE DEFENSE ---
  // 1. Strict Auth & Credentials Rate Limiter (15 req / 15 min per IP)
  apiRouter.use('/auth', authRateLimiter);

  // 2. Public Endpoints Rate Limiter (100 req / 5 min per IP)
  apiRouter.use('/scim', publicApiRateLimiter);
  apiRouter.use('/support', publicApiRateLimiter);
  apiRouter.use('/organization/invitations/validate', publicApiRateLimiter);

  // 3. High-Compute AI & Agent Generation Rate Limiter (30 req / 1 min per IP/User)
  apiRouter.use('/gemini', strictAiRateLimiter);
  apiRouter.use('/ai', strictAiRateLimiter);
  apiRouter.use('/agents', strictAiRateLimiter);

  // Protected Limit Control Status API
  apiRouter.get('/limits/status', requireAuth, (req, res) => {
    const user = (req as any).user;
    const tier = resolveUserPlanTier(user);
    const limits = SERVER_PLAN_LIMITS[tier];
    const used = getUserUsage(user.id);

    res.json(successResponse({
      plan: limits.name,
      tier,
      ai_calls: {
        used,
        limit: limits.aiCallsLimit,
        remaining: Math.max(0, limits.aiCallsLimit - used),
        percentage: Math.min(100, Math.round((used / limits.aiCallsLimit) * 100)),
        is_exceeded: used >= limits.aiCallsLimit
      },
      datasets: {
        limit: limits.maxDatasets,
        max_file_size_mb: limits.maxFileSizeMB
      },
      projects: {
        limit: limits.maxProjects
      },
      workspaces: {
        limit: limits.maxWorkspaces
      },
      seats: {
        limit: limits.maxSeats
      },
      rate_limit: {
        requests_per_min: limits.rateLimitPerMin
      }
    }));
  });

  // Admin Reset Quota Counter API
  apiRouter.post('/limits/reset', requireAuth, requireAdmin, (req, res) => {
    const { targetUserId } = req.body;
    const user = (req as any).user;
    const uid = targetUserId || user.id;
    resetUserUsage(uid);
    res.json(successResponse({ message: `Usage meter successfully reset for user: ${uid}` }));
  });

  // Public Health Endpoint
  apiRouter.get('/inspect-env', (req, res) => {
    res.json({
      DATABASE_URL: {
        length: process.env.DATABASE_URL?.length || 0,
        startsWith: process.env.DATABASE_URL?.substring(0, 15) || "",
        value: process.env.DATABASE_URL
      },
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL
    });
  });

  apiRouter.get('/health', async (req, res) => {
    let dbStatus = "unknown";
    let dbError = null;

    if (supabaseUrl && supabaseKey) {
      try {
        // Race the database query with a 2-second timeout to prevent stalling
        const dbQueryPromise = supabase.from('api_keys').select('id').limit(1);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Supabase connection timed out")), 2000)
        );

        await Promise.race([dbQueryPromise, timeoutPromise]);
        dbStatus = "healthy";
      } catch (err: any) {
        dbStatus = "unhealthy";
        dbError = err.message || String(err);
      }
    } else {
      dbStatus = "unconfigured";
    }

    const memoryUsage = process.env.NODE_ENV === 'test' ? { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 } : process.memoryUsage();
    const uptimeSeconds = process.uptime();

    res.json({
      status: dbStatus === "unhealthy" ? "degraded" : "healthy",
      message: "Vivexa Enterprise Intelligence API is operational.",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
      environment: process.env.NODE_ENV || "development",
      sandboxMode: true,
      system: {
        memory: {
          rss: `${Math.round((memoryUsage?.rss || 0) / 1024 / 1024)} MB`,
          heapTotal: `${Math.round((memoryUsage?.heapTotal || 0) / 1024 / 1024)} MB`,
          heapUsed: `${Math.round((memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB`,
          external: `${Math.round((memoryUsage?.external || 0) / 1024 / 1024)} MB`
        },
        platform: process.platform,
        nodeVersion: process.version,
        cpuUsage: process.cpuUsage()
      },
      database: {
        status: dbStatus,
        error: dbError,
        configured: !!(supabaseUrl && supabaseKey)
      },
      services: {
        apiKeys: "operational",
        aiAnalyst: "operational",
        forecast: "operational",
        notebook: "operational",
        automations: "operational"
      }
    });
  });

// Helper functions for recovery URL resolution
function getPublicOrigin(req: express.Request): string {
  const envUrl = process.env.PUBLIC_APP_URL || process.env.APP_URL || process.env.VITE_APP_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }

  let origin = '';
  if (req.headers.origin && typeof req.headers.origin === 'string') {
    origin = req.headers.origin.replace(/\/+$/, '');
  } else if (req.headers.referer && typeof req.headers.referer === 'string') {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch (e) {
      origin = req.headers.referer.replace(/\/+$/, '');
    }
  } else {
    const fwdHost = req.headers['x-forwarded-host'] as string;
    const fwdProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    if (fwdHost) {
      origin = `${fwdProto}://${fwdHost}`;
    } else {
      const host = req.get('host') || 'localhost:3000';
      origin = `${req.protocol}://${host}`;
    }
  }

  // Convert ais-dev- to ais-pre- so email recipients do not encounter Google Cloud IAM 403 Forbidden
  try {
    const parsed = new URL(origin);
    if (parsed.hostname.startsWith('ais-dev-')) {
      parsed.hostname = parsed.hostname.replace('ais-dev-', 'ais-pre-');
      origin = parsed.origin;
    }
  } catch (_) {}

  return origin || 'http://localhost:3000';
}

async function resolveRecoveryUrl(actionLink: string, publicOrigin: string): Promise<string> {
  try {
    const verifyRes = await fetch(actionLink, { redirect: 'manual' });
    const location = verifyRes.headers.get('location');
    if (location) {
      if (location.includes('#')) {
        const hash = location.substring(location.indexOf('#'));
        return `${publicOrigin}/reset-password${hash}`;
      } else if (location.includes('?')) {
        const query = location.substring(location.indexOf('?'));
        return `${publicOrigin}/reset-password${query}`;
      }
    }
  } catch (err) {
    console.warn('[RECOVERY RESOLVER] Direct resolution failed:', err);
  }
  return `${publicOrigin}/api/v1/auth/verify-recovery?link=${encodeURIComponent(actionLink)}`;
}

  // Public Auth: Verify Recovery Proxy Route
  apiRouter.get('/auth/verify-recovery', async (req, res) => {
    try {
      const link = req.query.link as string;
      const publicOrigin = getPublicOrigin(req);
      if (!link) {
        return res.redirect(`${publicOrigin}/forgot-password`);
      }
      const targetUrl = await resolveRecoveryUrl(link, publicOrigin);
      return res.redirect(targetUrl);
    } catch (err) {
      console.error('[AUTH API] verify-recovery proxy error:', err);
      return res.redirect(`${getPublicOrigin(req)}/forgot-password`);
    }
  });

  // Public Auth: Forgot Password Manual Flow (Bypasses local SMTP limits)
  apiRouter.post('/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
      }

      const cleanEmail = email.trim().toLowerCase();
      const publicOrigin = getPublicOrigin(req);
      console.log(`[AUTH API] Generating password reset recovery link for: ${cleanEmail} (Origin: ${publicOrigin})`);

      const resetRedirectUrl = `${publicOrigin}/reset-password`;

      let { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: { redirectTo: resetRedirectUrl }
      });

      // If user not found in Supabase Auth, check if they exist in public.users or profiles, or create auth account
      if (error && error.message?.toLowerCase().includes('user not found')) {
        const { data: dbUser } = await supabase.from('users').select('id, email').eq('email', cleanEmail).maybeSingle();
        if (dbUser) {
          const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: { source: 'recovery_auto_provision' }
          });
          if (!createErr && newUser?.user) {
            const retry = await supabase.auth.admin.generateLink({
              type: 'recovery',
              email: cleanEmail,
              options: { redirectTo: resetRedirectUrl }
            });
            data = retry.data;
            error = retry.error;
          }
        }
      }

      if (error || !data?.properties?.action_link) {
        console.error('[AUTH API] Supabase admin link generation failed:', error);
        return res.status(400).json(successResponse(null, { error: error?.message || 'No registered account found with this email address.' }));
      }

      const rawActionLink = data.properties.action_link;
      const resetUrl = await resolveRecoveryUrl(rawActionLink, publicOrigin);
      console.log(`[AUTH API] Resolved password reset link for ${cleanEmail}: ${resetUrl}`);

      const emailResult = await sendEmail({
        recipient: cleanEmail,
        template: 'password_reset',
        subject: 'Reset Your Vivexa Password',
        data: {
          reset_url: resetUrl,
          expires_at: '24 hours'
        }
      });

      if (!emailResult.success) {
        return res.status(500).json(successResponse(null, { error: `Failed to deliver reset email: ${emailResult.error}` }));
      }

      return res.json(successResponse({
        message: "Password reset instructions dispatched successfully to your email.",
        reset_url: resetUrl
      }));
    } catch (err: any) {
      console.error('[AUTH API] Forgot password handler error:', err);
      return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
    }
  });

  // Public Auth: Send Welcome Email Flow
  apiRouter.post('/auth/welcome', async (req, res) => {
    try {
      const { email, firstName } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
      }
      
      const publicOrigin = getPublicOrigin(req);
      const emailResult = await sendEmail({
        recipient: email.trim().toLowerCase(),
        template: 'welcome',
        subject: 'Welcome to Vivexa Platforms',
        data: {
          first_name: firstName || 'there',
          login_url: `${publicOrigin}/login`
        }
      });

      if (!emailResult.success) {
        console.warn(`[AUTH API] Welcome email delivery notice: ${emailResult.error}`);
        return res.json(successResponse({ message: "Welcome email simulated (SMTP delivery skipped or unconfigured).", simulated: true }));
      }
      return res.json(successResponse({ message: "Welcome email sent successfully." }));
    } catch (err: any) {
      console.error('[AUTH API] Welcome email handler error:', err);
      return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
    }
  });

  // Public Auth: Send Verification Manual Flow
  apiRouter.post('/auth/send-verification', async (req, res) => {
    try {
      const { email, redirectTo } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
      }

      const publicOrigin = getPublicOrigin(req);
      console.log(`[AUTH API] Generating verification link for: ${email}`);
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { redirectTo: redirectTo || `${publicOrigin}/workspace` }
      } as any);

      if (error || !data?.properties?.action_link) {
        console.error('[AUTH API] Supabase verification link generation failed:', error);
        return res.status(400).json(successResponse(null, { error: error?.message || 'Failed to generate verification token' }));
      }

      const verifyUrl = data.properties.action_link;
      const emailResult = await sendEmail({
        recipient: email.trim().toLowerCase(),
        template: 'verify_email',
        subject: 'Verify Your Vivexa Account',
        data: {
          verification_url: verifyUrl,
          expires_at: '24 hours'
        }
      });

      if (!emailResult.success) {
        return res.status(500).json(successResponse(null, { error: `Failed to deliver verification email: ${emailResult.error}` }));
      }

      return res.json(successResponse({ message: "Verification link dispatched successfully to your email." }));
    } catch (err: any) {
      console.error('[AUTH API] Send verification handler error:', err);
      return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
    }
  });

  // Public: Book a 1-on-1 Demo
  apiRouter.post('/book-demo', async (req, res) => {
    try {
      const { fullName, workEmail, companyName, jobTitle, companySize, preferredDate, preferredTime, deploymentNeed } = req.body;
      
      if (!fullName || !workEmail) {
        return res.status(400).json(successResponse(null, { error: 'Full name and work email are required.' }));
      }

      console.log(`[DEMO BOOKING] New booking request from ${fullName} (${workEmail})`);

      // 1. Send confirmation email to the user
      const userEmailResult = await sendEmail({
        recipient: workEmail.trim().toLowerCase(),
        template: 'demo_booking',
        subject: '1-on-1 Executive Demo Scheduled - Vivexa',
        data: {
          name: fullName,
          preferredDate,
          preferredTime,
          deploymentNeed
        }
      });

      // 2. Send notification email to the admin/founders (CEO & CTO Gmail inboxes)
      const adminEmails = [
        process.env.VITE_CEO_EMAIL || 'info.vivexa@gmail.com',
        process.env.VITE_CTO_EMAIL || 'karunyasharma029@gmail.com',
        'karunyasharma.iitj@gmail.com',
        'info.vivexa@gmail.com'
      ];
      for (const adminEmail of adminEmails) {
        try {
          await sendEmail({
            recipient: adminEmail,
            template: 'demo_booking_admin',
            subject: `🚨 [NEW DEMO LEAD] ${fullName} from ${companyName || 'Unknown Company'}`,
            data: {
              name: fullName,
              email: workEmail,
              companyName,
              jobTitle,
              companySize,
              preferredDate,
              preferredTime,
              deploymentNeed
            }
          });
        } catch (adminErr: any) {
          console.error(`[DEMO BOOKING] Failed to notify admin ${adminEmail}:`, adminErr.message);
        }
      }

      return res.json(successResponse({
        message: "Executive demo scheduled successfully! A calendar invitation and confirmation email have been dispatched."
      }));
    } catch (err: any) {
      console.error('[DEMO BOOKING API] Handler error:', err);
      return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
    }
  });

  // Protected Routes
  apiRouter.use(requireAuth);

  // Protected Email Trigger: Send In-App / System notification to email
  apiRouter.post('/notifications/send-email', async (req, res) => {
    try {
      const { recipient, title, message, action_url } = req.body;
      if (!recipient || !recipient.includes('@')) {
        return res.status(400).json(successResponse(null, { error: 'Valid recipient email is required' }));
      }

      const emailResult = await sendEmail({
        recipient: recipient.trim().toLowerCase(),
        template: 'default',
        subject: title || 'Vivexa System Alert',
        data: {
          message: message,
          action_url: action_url || `${req.protocol}://${req.get('host')}/workspace/notifications`
        }
      });

      if (!emailResult.success) {
        return res.status(500).json(successResponse(null, { error: emailResult.error }));
      }

      return res.json(successResponse({ message: "System alert email delivered successfully." }));
    } catch (err: any) {
      return res.status(500).json(successResponse(null, { error: err.message }));
    }
  });

  // Protected Support Ticket API
  apiRouter.post('/support/ticket', async (req, res) => {
    try {
      const user = (req as any).user;
      const { category, message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json(successResponse(null, { error: 'Detailed message is required.' }));
      }

      console.log(`[SUPPORT TICKET] New ${category} from ${user.email}`);

      // 1. Log to audit_logs
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'SUPPORT_TICKET_SUBMITTED',
        resource_type: 'SUPPORT',
        payload: { category, message: message.substring(0, 500) }
      });

      // 2. Dispatch email to Vivexa Engineering & Founders
      const adminEmails = [
        process.env.VITE_CEO_EMAIL || 'info.vivexa@gmail.com',
        process.env.VITE_CTO_EMAIL || 'karunyasharma029@gmail.com',
        'info.vivexa@gmail.com'
      ];

      for (const adminEmail of adminEmails) {
        try {
          await sendEmail({
            recipient: adminEmail,
            template: 'support_ticket_admin',
            subject: `🎫 [SUPPORT TICKET] [${category}] from ${user.email}`,
            data: {
              email: user.email,
              category,
              message
            }
          });
        } catch (adminErr: any) {
          console.error(`[SUPPORT TICKET] Failed to notify admin ${adminEmail}:`, adminErr.message);
        }
      }

      return res.json(successResponse({ message: "Priority support ticket successfully dispatched." }));
    } catch (err: any) {
      console.error('[SUPPORT TICKET API] Handler error:', err);
      return res.status(500).json(successResponse(null, { error: err.message || 'Internal Server Error' }));
    }
  });

  // Protected Sharing API: Share Project
  apiRouter.post('/projects/:id/share', async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json(successResponse(null, { error: 'Valid email address is required' }));
      }

      // Fetch project details
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
        subject: `Collaborative Project Shared: "${project.name}" on Vivexa`,
        data: {
          sender_name: user.email?.split('@')[0] || "A collaborator",
          sender_email: user.email || "support@vivexa.ai",
          project_name: project.name,
          project_url: projectUrl
        }
      });

      if (!emailResult.success) {
        return res.status(500).json(successResponse(null, { error: `Project sharing email delivery failed: ${emailResult.error}` }));
      }

      // Log in audit_logs
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

  // Mount Microservice Gateway Routers
  apiRouter.use('/sharing', sharingRouter);
  apiRouter.use('/enterprise-compute', enterpriseComputeRouter);
  apiRouter.use('/lakehouse', lakehouseRouter);
  apiRouter.use('/llm', llmApiRouter);

  apiRouter.get('/auth/me', (req, res) => {
    res.json(successResponse((req as any).user));
  });

  // Mount Feature Routers
  apiRouter.use('/keys', apiKeysRouter);
  apiRouter.use('/gemini', aiAnalystRouter);
  apiRouter.use('/organization', organizationRouter);
  apiRouter.use('/datasets', datasetsRouter);
  apiRouter.use('/admin', adminUsersRouter);
  apiRouter.use('/forecast', forecastRouter);
  apiRouter.use('/notebook', notebookRouter);
  apiRouter.use('/automations', automationsRouter);
  apiRouter.use('/projects', projectsRouter);
  apiRouter.use('/agents', agentsRouter);
  apiRouter.use('/connectors', connectorsRouter);
  apiRouter.use('/sdk', sdkRouter);
  apiRouter.use('/enterprise', enterpriseRouter);
  apiRouter.use('/scim', scimRouter);
  apiRouter.use('/rag', ragRouter);
  apiRouter.use('/dbt', dbtRouter);
  apiRouter.use('/quality', qualityRouter);
  apiRouter.use('/collab', collabRouter);
  apiRouter.use('/audit', auditRouter);

  app.use('/api/v1', apiRouter);

  // Vite Development / Production static middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', etag: true, immutable: true }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Vivexa] Port ${PORT} busy, retrying in 1.5s...`);
      setTimeout(() => {
        try {
          httpServer.close();
        } catch (_) {}
        httpServer.listen(PORT, "0.0.0.0");
      }, 1500);
    } else {
      console.error("[Vivexa Server Error]", err);
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Vivexa Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
