// Enterprise Limit & Quota Enforcement Engine
import { useAuthStore } from "@/stores/authStore";
import { createNotification } from "@/lib/notifications";

export type PlanTier = "free" | "student" | "pro" | "enterprise";

export interface PlanLimits {
  name: string;
  badge: string;
  aiCallsLimit: number;
  maxDatasets: number;
  maxFileSizeMB: number;
  maxTotalStorageMB: number;
  maxProjects: number;
  maxWorkspaces: number;
  maxSeats: number;
  maxConcurrentNotebookRuns: number;
  rateLimitPerMin: number;
  canExportPDF: boolean;
  canUseCustomModels: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS_CONFIG: Record<PlanTier, PlanLimits> = {
  free: {
    name: "Starter / Free",
    badge: "Free Tier",
    aiCallsLimit: 375, // Capped monthly quota
    maxDatasets: 5,
    maxFileSizeMB: 50,
    maxTotalStorageMB: 250,
    maxProjects: 3,
    maxWorkspaces: 1,
    maxSeats: 3,
    maxConcurrentNotebookRuns: 1,
    rateLimitPerMin: 15,
    canExportPDF: true,
    canUseCustomModels: false,
    prioritySupport: false
  },
  student: {
    name: "Academic / Student",
    badge: "Student Tier",
    aiCallsLimit: 1875,
    maxDatasets: 15,
    maxFileSizeMB: 100,
    maxTotalStorageMB: 1500,
    maxProjects: 10,
    maxWorkspaces: 2,
    maxSeats: 5,
    maxConcurrentNotebookRuns: 3,
    rateLimitPerMin: 30,
    canExportPDF: true,
    canUseCustomModels: false,
    prioritySupport: false
  },
  pro: {
    name: "Professional",
    badge: "Pro Plan",
    aiCallsLimit: 18750,
    maxDatasets: 50,
    maxFileSizeMB: 500,
    maxTotalStorageMB: 10000,
    maxProjects: 25,
    maxWorkspaces: 5,
    maxSeats: 15,
    maxConcurrentNotebookRuns: 10,
    rateLimitPerMin: 120,
    canExportPDF: true,
    canUseCustomModels: true,
    prioritySupport: true
  },
  enterprise: {
    name: "Enterprise Global",
    badge: "Enterprise Tier",
    aiCallsLimit: 187500,
    maxDatasets: 500,
    maxFileSizeMB: 2048,
    maxTotalStorageMB: 102400,
    maxProjects: 250,
    maxWorkspaces: 50,
    maxSeats: 100,
    maxConcurrentNotebookRuns: 25,
    rateLimitPerMin: 500,
    canExportPDF: true,
    canUseCustomModels: true,
    prioritySupport: true
  }
};

export function resolveUserPlan(userPlan?: string): PlanTier {
  const plan = (userPlan || useAuthStore.getState().user?.app_metadata?.plan || useAuthStore.getState().user?.user_metadata?.plan || "free").toLowerCase();
  if (plan.includes("enterprise")) return "enterprise";
  if (plan.includes("pro")) return "pro";
  if (plan.includes("student") || plan.includes("academic")) return "student";
  return "free";
}

export function getPlanLimits(userPlan?: string): PlanLimits {
  const tier = resolveUserPlan(userPlan);
  return PLAN_LIMITS_CONFIG[tier];
}

export interface LimitViolation {
  isExceeded: boolean;
  resource: "ai_calls" | "datasets_count" | "file_size" | "storage_capacity" | "projects_count" | "workspaces_count" | "seats_capacity" | "rate_limit";
  current: number;
  limit: number;
  unit: string;
  title: string;
  message: string;
  recommendedPlan: PlanTier;
}

export type LimitEventType = 
  | "ai_calls" 
  | "datasets_count" 
  | "file_size" 
  | "storage_capacity" 
  | "projects_count" 
  | "workspaces_count" 
  | "seats_capacity";

export interface TriggerLimitModalPayload {
  resource: LimitEventType;
  current: number;
  limit: number;
  unit?: string;
  title?: string;
  message?: string;
}

export function triggerLimitModal(payload?: Partial<TriggerLimitModalPayload>) {
  if (typeof window !== "undefined") {
    const detail: TriggerLimitModalPayload = {
      resource: payload?.resource || "ai_calls",
      current: payload?.current ?? 0,
      limit: payload?.limit ?? 0,
      unit: payload?.unit || "calls",
      title: payload?.title || "Plan Allocation Limit Reached",
      message: payload?.message || "You have reached the maximum entitlement for your current tier."
    };

    window.dispatchEvent(new CustomEvent("vivexa_show_limit_modal", { detail }));
    window.dispatchEvent(new Event("vivexa_show_quota_modal")); // Backward compatibility

    createNotification({
      title: detail.title,
      message: detail.message,
      type: "warning",
      priority: "urgent",
      actionUrl: "/workspace/billing"
    });
  }
}

// ----------------------------------------------------
// AI Calls / Token Telemetry Control
// ----------------------------------------------------
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

export function checkQuotaStatus(userId?: string, userPlan?: string) {
  const uid = userId || useAuthStore.getState().user?.id || "default";
  const used = getAiUsageCount(uid);
  const limits = getPlanLimits(userPlan);
  const limit = limits.aiCallsLimit;
  const remaining = Math.max(0, limit - used);
  const percentage = Math.min(100, Math.round((used / limit) * 100));

  return {
    isExceeded: used >= limit,
    used,
    limit,
    remaining,
    percentage,
    plan: limits.name,
    badge: limits.badge
  };
}

export function checkAndConsumeQuota(count: number = 1, userId?: string, userPlan?: string): { allowed: boolean; current: number; limit: number; remaining: number } {
  const uid = userId || useAuthStore.getState().user?.id || "default";
  const current = getAiUsageCount(uid);
  const limits = getPlanLimits(userPlan);
  const limit = limits.aiCallsLimit;

  if (current >= limit) {
    triggerLimitModal({
      resource: "ai_calls",
      current,
      limit,
      unit: "calls",
      title: "AI API Quota Limit Reached",
      message: `Your account has exhausted its monthly allowance of ${limit.toLocaleString()} AI API calls. Please upgrade to continue analyzing, forecasting, and executing autonomous agents.`
    });
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

// ----------------------------------------------------
// Dataset Count & File Size Validation
// ----------------------------------------------------
export function validateDatasetUpload(
  currentDatasetCount: number,
  fileSizeBytes: number,
  userPlan?: string
): { allowed: boolean; error?: string; violation?: LimitViolation } {
  const limits = getPlanLimits(userPlan);
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (currentDatasetCount >= limits.maxDatasets) {
    const violation: LimitViolation = {
      isExceeded: true,
      resource: "datasets_count",
      current: currentDatasetCount,
      limit: limits.maxDatasets,
      unit: "datasets",
      title: "Dataset Limit Reached",
      message: `You have reached the maximum limit of ${limits.maxDatasets} datasets on your ${limits.name} plan. Delete existing datasets or upgrade your plan.`,
      recommendedPlan: resolveUserPlan(userPlan) === "free" ? "pro" : "enterprise"
    };
    return { allowed: false, error: violation.message, violation };
  }

  if (fileSizeMB > limits.maxFileSizeMB) {
    const violation: LimitViolation = {
      isExceeded: true,
      resource: "file_size",
      current: Math.round(fileSizeMB),
      limit: limits.maxFileSizeMB,
      unit: "MB",
      title: "File Size Limit Exceeded",
      message: `The uploaded file (${fileSizeMB.toFixed(1)} MB) exceeds the maximum allowed file size of ${limits.maxFileSizeMB} MB for the ${limits.name} plan.`,
      recommendedPlan: fileSizeMB > 500 ? "enterprise" : "pro"
    };
    return { allowed: false, error: violation.message, violation };
  }

  return { allowed: true };
}

// ----------------------------------------------------
// Project Creation Validation
// ----------------------------------------------------
export function validateProjectCreation(
  currentProjectCount: number,
  userPlan?: string
): { allowed: boolean; error?: string; violation?: LimitViolation } {
  const limits = getPlanLimits(userPlan);

  if (currentProjectCount >= limits.maxProjects) {
    const violation: LimitViolation = {
      isExceeded: true,
      resource: "projects_count",
      current: currentProjectCount,
      limit: limits.maxProjects,
      unit: "projects",
      title: "Project Allocation Limit Reached",
      message: `You have reached the limit of ${limits.maxProjects} projects on the ${limits.name} plan. Upgrade to unlock more projects.`,
      recommendedPlan: resolveUserPlan(userPlan) === "free" ? "pro" : "enterprise"
    };
    return { allowed: false, error: violation.message, violation };
  }

  return { allowed: true };
}

// ----------------------------------------------------
// Workspace Creation Validation
// ----------------------------------------------------
export function validateWorkspaceCreation(
  currentWorkspaceCount: number,
  userPlan?: string
): { allowed: boolean; error?: string; violation?: LimitViolation } {
  const limits = getPlanLimits(userPlan);

  if (currentWorkspaceCount >= limits.maxWorkspaces) {
    const violation: LimitViolation = {
      isExceeded: true,
      resource: "workspaces_count",
      current: currentWorkspaceCount,
      limit: limits.maxWorkspaces,
      unit: "workspaces",
      title: "Workspace Limit Reached",
      message: `Your ${limits.name} plan allows up to ${limits.maxWorkspaces} analytical workspace(s). Upgrade to Pro or Enterprise for additional isolated tenant workspaces.`,
      recommendedPlan: "pro"
    };
    return { allowed: false, error: violation.message, violation };
  }

  return { allowed: true };
}

// ----------------------------------------------------
// Team Seats Validation
// ----------------------------------------------------
export function validateSeatInvitation(
  activeSeats: number,
  pendingInvites: number,
  userPlan?: string
): { allowed: boolean; error?: string; violation?: LimitViolation } {
  const limits = getPlanLimits(userPlan);
  const totalOccupied = activeSeats + pendingInvites;

  if (totalOccupied >= limits.maxSeats) {
    const violation: LimitViolation = {
      isExceeded: true,
      resource: "seats_capacity",
      current: totalOccupied,
      limit: limits.maxSeats,
      unit: "seats",
      title: "Team Seat Allocation Reached",
      message: `All ${limits.maxSeats} seats on your ${limits.name} plan are occupied (${activeSeats} active, ${pendingInvites} pending). Upgrade your plan to invite more team members.`,
      recommendedPlan: "pro"
    };
    return { allowed: false, error: violation.message, violation };
  }

  return { allowed: true };
}
