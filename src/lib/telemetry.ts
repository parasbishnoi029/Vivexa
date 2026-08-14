// Telemetry & Usage Limits Manager (Account & User Level Aware)
import { useAuthStore } from "@/stores/authStore";

export function getQuotaLimit(userPlan?: string): number {
  const plan = userPlan || useAuthStore.getState().user?.app_metadata?.plan || useAuthStore.getState().user?.user_metadata?.plan || "free";
  const pLower = String(plan).toLowerCase();
  if (pLower.includes("enterprise")) return 125000;
  if (pLower.includes("pro")) return 12500;
  if (pLower.includes("student")) return 1250;
  return 250; // Free / Standard Plan limit (25% of 1,000)
}

export function getAiUsageCount(userId?: string): number {
  if (typeof window === "undefined") return 0;
  const uid = userId || useAuthStore.getState().user?.id || "default";
  const saved = localStorage.getItem(`vivexa_ai_calls_count_${uid}`) || localStorage.getItem("vivexa_ai_calls_count");
  return saved ? parseInt(saved, 10) : 0;
}

export function setAiUsageCount(count: number, userId?: string): number {
  if (typeof window === "undefined") return count;
  const uid = userId || useAuthStore.getState().user?.id || "default";
  localStorage.setItem(`vivexa_ai_calls_count_${uid}`, count.toString());
  localStorage.setItem("vivexa_ai_calls_count", count.toString());
  window.dispatchEvent(new Event("vivexa_usage_updated"));
  return count;
}

export function checkQuotaStatus(userId?: string, userPlan?: string): { isExceeded: boolean; used: number; limit: number; remaining: number; percentage: number } {
  const uid = userId || useAuthStore.getState().user?.id || "default";
  const used = getAiUsageCount(uid);
  const limit = getQuotaLimit(userPlan);
  const remaining = Math.max(0, limit - used);
  const percentage = Math.min(100, Math.round((used / limit) * 100));

  return {
    isExceeded: used >= limit,
    used,
    limit,
    remaining,
    percentage
  };
}

export function checkAndConsumeQuota(count: number = 1, userId?: string): { allowed: boolean; current: number; limit: number; remaining: number } {
  const uid = userId || useAuthStore.getState().user?.id || "default";
  const current = getAiUsageCount(uid);
  const limit = getQuotaLimit();

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      remaining: 0
    };
  }

  const newCount = current + count;
  setAiUsageCount(newCount, uid);
  return {
    allowed: true,
    current: newCount,
    limit,
    remaining: Math.max(0, limit - newCount)
  };
}

export function incrementAiUsage(count: number = 1, userId?: string): number {
  const res = checkAndConsumeQuota(count, userId);
  return res.current;
}
