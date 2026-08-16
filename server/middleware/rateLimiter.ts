import rateLimit, { Options } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Enterprise IP Extraction Helper
 * Extracts real client IP address behind Cloud Run, Nginx, or AWS ALB reverse proxies.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) return ips[0];
  } else if (Array.isArray(forwarded) && forwarded.length > 0 && forwarded[0]) {
    return forwarded[0];
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}

/**
 * 1. Authentication Rate Limiter
 * Strict rate limit to mitigate brute-force credential stuffing, password guessing,
 * and registration spam attacks.
 * Max 15 requests per 15-minute window per IP address.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Limit each IP to 15 requests per windowMs
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const clientIp = getClientIp(req);
    console.warn(`[SECURITY ALERT] Auth rate limit exceeded for IP: ${clientIp} on path: ${req.originalUrl}`);
    
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());
    
    return res.status(429).json({
      success: false,
      error: "AUTH_RATE_LIMIT_EXCEEDED",
      code: "BRUTE_FORCE_DEFENSE_TRIGGERED",
      message: "Too many authentication attempts from this IP address. Please wait 15 minutes before trying again.",
      retryAfterSeconds
    });
  }
});

/**
 * 2. Public Route Rate Limiter
 * Guards unauthenticated and public-facing endpoints (e.g. SCIM, registration, invitations, support)
 * against automated scraping, denial of service (DDoS), and endpoint abuse.
 * Max 100 requests per 5-minute window per IP address.
 */
export const publicApiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 100, // Limit each IP to 100 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const clientIp = getClientIp(req);
    console.warn(`[SECURITY NOTICE] Public API rate limit exceeded for IP: ${clientIp} on path: ${req.originalUrl}`);
    
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());

    return res.status(429).json({
      success: false,
      error: "PUBLIC_API_RATE_LIMIT_EXCEEDED",
      message: "Too many requests to public endpoints. Please slow down and try again shortly.",
      retryAfterSeconds
    });
  }
});

/**
 * 3. Strict AI & Computation Rate Limiter
 * Enforces strict request throttles on high-compute AI endpoints (Gemini, Copilot, MicroVM execution)
 * to prevent backend exhaustion and API quota depletion.
 * Max 30 requests per 1-minute window per IP address.
 */
export const strictAiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 30, // Max 30 AI generations per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user_${user.id}` : getClientIp(req);
  },
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const clientIp = getClientIp(req);
    console.warn(`[COMPUTE NOTICE] AI generation rate limit reached for IP/User: ${clientIp} on path: ${req.originalUrl}`);

    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());

    return res.status(429).json({
      success: false,
      error: "AI_RATE_LIMIT_EXCEEDED",
      message: "AI compute generation rate limit reached (30 calls/min). Please wait a moment before sending more prompts.",
      retryAfterSeconds
    });
  }
});

/**
 * 4. Global Baseline API Rate Limiter
 * Baseline defensive blanket applied across all /api/v1/* routes.
 * Max 200 requests per 1-minute window per IP address.
 */
export const globalApiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 200, // Max 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  // Skip healthcheck endpoint from rate limiting
  skip: (req: Request) => req.path === "/health",
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const clientIp = getClientIp(req);
    console.warn(`[GLOBAL RATE LIMIT] Global API rate limit exceeded for IP: ${clientIp} on path: ${req.originalUrl}`);

    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());

    return res.status(429).json({
      success: false,
      error: "GLOBAL_RATE_LIMIT_EXCEEDED",
      message: "Global API request threshold exceeded. Please throttle request rates.",
      retryAfterSeconds
    });
  }
});
