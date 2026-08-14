import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ArrowRight, ShieldAlert, X, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkQuotaStatus, setAiUsageCount } from "@/lib/telemetry";
import { createNotification } from "@/lib/notifications";
import { useAuthStore } from "@/stores/authStore";
import { isAdminRole } from "@/lib/rbac";
import { toast } from "sonner";

export function triggerQuotaModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("vivexa_show_quota_modal"));
    createNotification({
      title: "AI API Quota Limit Reached",
      message: "Monthly AI API call limit exhausted. Please upgrade your plan or contact your administrator.",
      type: "warning",
      priority: "urgent",
      actionUrl: "/workspace/billing"
    });
  }
}

export default function QuotaLimitModal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(() => checkQuotaStatus());

  const isAdmin = isAdminRole(user?.app_metadata?.role || user?.user_metadata?.role, user?.email);

  useEffect(() => {
    const handleShowModal = () => {
      setQuotaInfo(checkQuotaStatus());
      setIsOpen(true);
    };

    const handleUsageUpdated = () => {
      setQuotaInfo(checkQuotaStatus());
    };

    window.addEventListener("vivexa_show_quota_modal", handleShowModal);
    window.addEventListener("vivexa_usage_updated", handleUsageUpdated);
    return () => {
      window.removeEventListener("vivexa_show_quota_modal", handleShowModal);
      window.removeEventListener("vivexa_usage_updated", handleUsageUpdated);
    };
  }, []);

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
    setAiUsageCount(0);
    toast.success("Usage reset to 0 by Administrator!");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-rose-500/30 p-6 sm:p-8 shadow-2xl shadow-rose-950/20"
        >
          {/* Top Banner Gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 shadow-lg shadow-rose-500/5">
              <ShieldAlert className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Account Quota Limit
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                AI API Usage Limit Reached
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Your workspace has reached <span className="font-bold text-white">{quotaInfo.used.toLocaleString()} / {quotaInfo.limit.toLocaleString()}</span> monthly AI API calls ({quotaInfo.percentage}%). Further AI analysis, predictions, and report generations are currently blocked for your plan.
          </p>

          {/* Usage Meter Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Monthly Allocation Meter</span>
              <span className="text-rose-400 font-bold">{quotaInfo.percentage}% Used</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, quotaInfo.percentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>0 calls</span>
              <span>Limit: {quotaInfo.limit.toLocaleString()} calls</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
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
                  Reset Counter (Admin Only)
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  <Lock className="h-3.5 w-3.5 text-amber-500/80" />
                  Admin Reset Required
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="px-4 text-slate-400 hover:text-slate-200 text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
