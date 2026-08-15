import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  ArrowRight,
  ShieldAlert,
  X,
  RefreshCw,
  Lock,
  Database,
  FolderKanban,
  Building2,
  Users,
  HardDrive,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  checkQuotaStatus,
  setAiUsageCount,
  getPlanLimits,
  resolveUserPlan,
  TriggerLimitModalPayload
} from "@/lib/limits";
import { useAuthStore } from "@/stores/authStore";
import { isAdminRole } from "@/lib/rbac";
import { toast } from "sonner";

export { triggerLimitModal as triggerQuotaModal } from "@/lib/limits";

export default function QuotaLimitModal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState<TriggerLimitModalPayload>({
    resource: "ai_calls",
    current: 0,
    limit: 250,
    unit: "calls",
    title: "AI API Quota Limit Reached",
    message: "Monthly AI API call limit exhausted. Please upgrade your plan or contact your administrator."
  });

  const [quotaInfo, setQuotaInfo] = useState(() => checkQuotaStatus(user?.id));
  const planLimits = getPlanLimits(user?.app_metadata?.plan || user?.user_metadata?.plan);
  const userPlanTier = resolveUserPlan(user?.app_metadata?.plan || user?.user_metadata?.plan);

  const isAdmin = isAdminRole(user?.app_metadata?.role || user?.user_metadata?.role, user?.email);

  useEffect(() => {
    const handleShowModal = (e: any) => {
      const detail = e.detail as TriggerLimitModalPayload | undefined;
      const status = checkQuotaStatus(user?.id);
      setQuotaInfo(status);

      if (detail && detail.resource) {
        setModalDetails(detail);
      } else {
        setModalDetails({
          resource: "ai_calls",
          current: status.used,
          limit: status.limit,
          unit: "calls",
          title: "AI API Quota Limit Reached",
          message: `Your account has reached ${status.used.toLocaleString()} of ${status.limit.toLocaleString()} allocated AI API calls for this billing cycle.`
        });
      }
      setIsOpen(true);
    };

    const handleLegacyModal = () => {
      const status = checkQuotaStatus(user?.id);
      setQuotaInfo(status);
      setModalDetails({
        resource: "ai_calls",
        current: status.used,
        limit: status.limit,
        unit: "calls",
        title: "AI API Quota Limit Reached",
        message: `Your account has reached ${status.used.toLocaleString()} of ${status.limit.toLocaleString()} allocated AI API calls for this billing cycle.`
      });
      setIsOpen(true);
    };

    const handleUsageUpdated = () => {
      setQuotaInfo(checkQuotaStatus(user?.id));
    };

    window.addEventListener("vivexa_show_limit_modal", handleShowModal as EventListener);
    window.addEventListener("vivexa_show_quota_modal", handleLegacyModal);
    window.addEventListener("vivexa_usage_updated", handleUsageUpdated);

    return () => {
      window.removeEventListener("vivexa_show_limit_modal", handleShowModal as EventListener);
      window.removeEventListener("vivexa_show_quota_modal", handleLegacyModal);
      window.removeEventListener("vivexa_usage_updated", handleUsageUpdated);
    };
  }, [user]);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setIsOpen(false);
    navigate("/workspace/billing");
  };

  const handleResetForTesting = () => {
    if (!isAdmin) {
      toast.error("Permission Denied: Only Workspace Administrators can reset quota limits.");
      return;
    }
    setAiUsageCount(0, user?.id);
    toast.success("Usage meter reset to 0 by Administrator!");
    setIsOpen(false);
  };

  const getResourceIcon = () => {
    switch (modalDetails.resource) {
      case "datasets_count":
        return <Database className="h-7 w-7 text-amber-400" />;
      case "file_size":
      case "storage_capacity":
        return <HardDrive className="h-7 w-7 text-amber-400" />;
      case "projects_count":
        return <FolderKanban className="h-7 w-7 text-purple-400" />;
      case "workspaces_count":
        return <Building2 className="h-7 w-7 text-indigo-400" />;
      case "seats_capacity":
        return <Users className="h-7 w-7 text-blue-400" />;
      default:
        return <ShieldAlert className="h-7 w-7 text-rose-400 animate-pulse" />;
    }
  };

  const calculatePercentage = () => {
    if (modalDetails.limit <= 0) return 100;
    return Math.min(100, Math.round((modalDetails.current / modalDetails.limit) * 100));
  };

  const percentage = calculatePercentage();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-rose-500/30 p-6 sm:p-8 shadow-2xl shadow-rose-950/30"
        >
          {/* Top Banner Gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 mb-5">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 shrink-0 shadow-lg shadow-rose-500/5">
              {getResourceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {planLimits.badge} Limit
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Tier: {planLimits.name}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {modalDetails.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            {modalDetails.message}
          </p>

          {/* Usage Meter Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Resource Allocation Status</span>
              <span className="text-rose-400 font-bold">
                {percentage}% Capacity Used
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500 shadow-sm"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Used: {modalDetails.current.toLocaleString()} {modalDetails.unit}</span>
              <span>Max: {modalDetails.limit.toLocaleString()} {modalDetails.unit}</span>
            </div>
          </div>

          {/* Plan Comparison Summary */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-medium">
              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>
                {userPlanTier === "free"
                  ? "Upgrade to Pro for 50x AI capacity & 50 datasets"
                  : userPlanTier === "student"
                  ? "Upgrade to Pro for enterprise models & 12,500 calls"
                  : "Enterprise plan provides 125,000 calls & dedicated SLAs"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              Upgrade Plan in Billing
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>

            <div className="flex items-center justify-between gap-3 pt-2">
              {isAdmin ? (
                <Button
                  variant="outline"
                  onClick={handleResetForTesting}
                  className="flex-1 bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                  Reset Telemetry (Admin Only)
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  <Lock className="h-3.5 w-3.5 text-amber-500/80" />
                  Plan Upgrade Required
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="px-4 text-slate-400 hover:text-slate-200 text-xs rounded-xl"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
