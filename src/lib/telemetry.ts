// Telemetry & Usage Limits Re-exporter
import {
  PLAN_LIMITS_CONFIG,
  resolveUserPlan,
  getPlanLimits,
  getAiUsageCount,
  setAiUsageCount,
  checkQuotaStatus,
  checkAndConsumeQuota,
  incrementAiUsage,
  validateDatasetUpload,
  validateProjectCreation,
  validateWorkspaceCreation,
  validateSeatInvitation,
  triggerLimitModal,
  PlanTier,
  PlanLimits,
  LimitViolation
} from "@/lib/limits";

export {
  PLAN_LIMITS_CONFIG,
  resolveUserPlan,
  getPlanLimits,
  getAiUsageCount,
  setAiUsageCount,
  checkQuotaStatus,
  checkAndConsumeQuota,
  incrementAiUsage,
  validateDatasetUpload,
  validateProjectCreation,
  validateWorkspaceCreation,
  validateSeatInvitation,
  triggerLimitModal
};

export type { PlanTier, PlanLimits, LimitViolation };

export function getQuotaLimit(userPlan?: string): number {
  return getPlanLimits(userPlan).aiCallsLimit;
}
