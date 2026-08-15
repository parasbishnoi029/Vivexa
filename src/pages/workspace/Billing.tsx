import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Mail, BarChart2, ShieldAlert, Zap, RefreshCw, Plus, ShieldCheck, Lock, CreditCard, Calculator, DollarSign, X } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "@/stores/authStore";
import { checkQuotaStatus, setAiUsageCount, checkAndConsumeQuota } from "@/lib/telemetry";
import { triggerQuotaModal } from "@/components/workspace/QuotaLimitModal";
import { isAdminRole } from "@/lib/rbac";
import { toast } from "sonner";

export default function WorkspaceBilling() {
  const { user } = useAuthStore();
  const [quotaInfo, setQuotaInfo] = useState(() => checkQuotaStatus(user?.id));

  const [calcModels, setCalcModels] = useState(3);
  const [calcRuns, setCalcRuns] = useState(500);
  const [calcSeats, setCalcSeats] = useState(2);

  const isAdmin = isAdminRole(user?.app_metadata?.role || user?.user_metadata?.role, user?.email);

  const refreshQuota = () => {
    setQuotaInfo(checkQuotaStatus(user?.id));
  };

  useEffect(() => {
    refreshQuota();
    const handleUsageUpdate = () => refreshQuota();
    window.addEventListener("vivexa_usage_updated", handleUsageUpdate);
    return () => window.removeEventListener("vivexa_usage_updated", handleUsageUpdate);
  }, [user]);

  const handleSimulateUsage = (amount: number) => {
    if (!isAdmin) {
      toast.error("Permission Denied: Only Workspace Administrators can simulate telemetry.");
      return;
    }
    checkAndConsumeQuota(amount, user?.id);
    refreshQuota();
    toast.success(`Added +${amount} simulated AI API calls`);
  };

  const handleSimulateExceeded = () => {
    if (!isAdmin) {
      toast.error("Permission Denied: Only Workspace Administrators can simulate telemetry.");
      return;
    }
    setAiUsageCount(quotaInfo.limit, user?.id);
    refreshQuota();
    triggerQuotaModal();
  };

  const handleResetUsage = () => {
    if (!isAdmin) {
      toast.error("Permission Denied: Only Workspace Administrators can reset telemetry counters.");
      return;
    }
    setAiUsageCount(0, user?.id);
    refreshQuota();
    toast.success("Usage meter reset to 0 by Administrator!");
  };

  return (
    <div className="space-y-8 pb-12 relative z-10 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Zap className="h-3.5 w-3.5" /> Telemetry & Account Entitlements
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Plans & Billing Quotas</h1>
          <p className="text-slate-400 text-xs">Monitor live AI API usage, manage account quotas, and select your workspace plan tier.</p>
        </div>
      </div>

      {/* Live Quota & Telemetry Meter Card */}
      <Card className="bg-slate-900/80 border-slate-700/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <BarChart2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  Monthly AI API Usage Telemetry
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Active Account
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time consumed requests against plan allocation (Quota capped at 25% standard limit)
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetUsage}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs rounded-xl"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-indigo-400" /> Reset Counter (Admin)
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  Admin Reset Only
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-medium">Consumed Calls</div>
              <div className="text-2xl font-black text-white mt-1">{quotaInfo.used.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Calls executed this cycle</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-medium">Plan Allocation Limit</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{quotaInfo.limit.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Monthly allocation cap (25%)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-medium">Remaining Capacity</div>
              <div className={`text-2xl font-black mt-1 ${quotaInfo.isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                {quotaInfo.remaining.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{quotaInfo.isExceeded ? 'Quota exhausted' : 'Calls available'}</div>
            </div>
          </div>

          {/* Usage Meter Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Quota Consumption Ratio</span>
              <span className={quotaInfo.percentage >= 90 ? "text-rose-400 font-bold" : quotaInfo.percentage >= 75 ? "text-amber-400 font-bold" : "text-indigo-400 font-bold"}>
                {quotaInfo.percentage}% Used
              </span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden p-1 border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, quotaInfo.percentage)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  quotaInfo.percentage >= 90
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : quotaInfo.percentage >= 75
                    ? 'bg-gradient-to-r from-indigo-500 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Admin Testing Utility Controls */}
          {isAdmin ? (
            <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Quota Enforcement Mode: Active (Admin Debug Tools)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateUsage(10)}
                  className="h-8 bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 text-[11px]"
                >
                  <Plus className="h-3 w-3 mr-1 text-indigo-400" /> +10 Calls
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateUsage(100)}
                  className="h-8 bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 text-[11px]"
                >
                  <Plus className="h-3 w-3 mr-1 text-indigo-400" /> +100 Calls
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulateExceeded}
                  className="h-8 bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50 text-[11px]"
                >
                  <ShieldAlert className="h-3 w-3 mr-1 text-rose-400" /> Simulate Quota Over Limit
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Protected Account Telemetry Capped at 25% Allocation
              </span>
              <span className="text-slate-500 italic">Quota resets automatically on 1st of next month</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Free Plan */}
        <Card className="bg-slate-900/60 border-indigo-500/30 backdrop-blur-xl relative overflow-hidden flex flex-col rounded-2xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader>
            <CardTitle className="text-xl text-white">Free</CardTitle>
            <CardDescription>Perfect for individuals starting out.</CardDescription>
            <div className="mt-4 text-3xl font-bold text-white">₹0<span className="text-sm font-normal text-slate-400">/mo</span></div>
            <div className="text-xs text-indigo-400 font-semibold mt-1">50 AI API Calls / mo</div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 1 Workspace</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Up to 3 Datasets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Basic AI Analyst</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Community Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl" disabled>Current Plan</Button>
          </CardFooter>
        </Card>

        {/* Student Plan */}
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl flex flex-col opacity-80 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Student</CardTitle>
            <CardDescription>For verified students and educators.</CardDescription>
            <div className="mt-4 text-3xl font-bold text-white">Free</div>
            <div className="text-xs text-indigo-400 font-semibold mt-1">250 AI API Calls / mo</div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-500" /> 2 Workspaces</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-500" /> Up to 10 Datasets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-500" /> Pro AI Analyst</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-500" /> Educational Resources</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-slate-700 text-slate-400 rounded-xl" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl flex flex-col rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Pro</CardTitle>
            <CardDescription>For professional data analysts.</CardDescription>
            <div className="mt-4 text-3xl font-bold text-white">Custom</div>
            <div className="text-xs text-indigo-400 font-semibold mt-1">2,500 AI API Calls / mo</div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Up to 5 Workspaces</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Up to 50 Datasets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Priority Processing</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Email Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              onClick={() => window.location.href = `mailto:${import.meta.env.VITE_BILLING_EMAIL || 'info.vivexa@gmail.com'}?subject=Pro%20Plan%20Inquiry`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Admin
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl flex flex-col rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Enterprise</CardTitle>
            <CardDescription>Custom solutions for large teams.</CardDescription>
            <div className="mt-4 text-3xl font-bold text-white">Custom</div>
            <div className="text-xs text-indigo-400 font-semibold mt-1">25,000 AI API Calls / mo</div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Dedicated Instances</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Custom Integrations</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> SSO / SAML</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 24/7 Phone Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 rounded-xl"
              onClick={() => window.location.href = `mailto:${import.meta.env.VITE_BILLING_EMAIL || 'info.vivexa@gmail.com'}?subject=Enterprise%20Plan%20Inquiry`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Admin
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Interactive Custom Plan Cost Estimator */}
      <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-2xl rounded-2xl overflow-hidden p-6 relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Dynamic Cost Projection Estimator</h3>
            <p className="text-xs text-slate-400">Estimate standard or scale enterprise quota costs dynamically based on target telemetry slots.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Sliders */}
          <div className="md:col-span-2 space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Custom Active Models</span>
                <span className="text-indigo-400 font-bold font-mono">{calcModels} Models</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={calcModels}
                onChange={(e) => setCalcModels(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">Fine-tuned active models hosted simultaneously.</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Target Monthly API Calls</span>
                <span className="text-indigo-400 font-bold font-mono">{calcRuns.toLocaleString()} Calls</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={calcRuns}
                onChange={(e) => setCalcRuns(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">Monthly standard API ingestion query budget.</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Workspace Seating slots</span>
                <span className="text-indigo-400 font-bold font-mono">{calcSeats} Users</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={calcSeats}
                onChange={(e) => setCalcSeats(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">Dedicated seats for workspace managers & analysts.</span>
            </div>
          </div>

          {/* Pricing Quote Summary */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between text-center md:text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Dynamic Estimated Quota Fee</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 flex items-center justify-center md:justify-start gap-1">
                <span className="text-slate-400 text-lg">₹</span>
                {(calcModels * 250 + Math.floor(calcRuns * 0.15) + calcSeats * 450).toLocaleString()}
                <span className="text-xs text-slate-500 font-normal">/ mo</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1 block">Includes SLA Guarantee</div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900 space-y-2 text-[11px] text-slate-400 leading-normal">
              <div className="flex justify-between">
                <span>Model Overhead:</span>
                <span className="font-mono text-slate-300">₹{calcModels * 250}</span>
              </div>
              <div className="flex justify-between">
                <span>Ingestion Overhead:</span>
                <span className="font-mono text-slate-300">₹{Math.floor(calcRuns * 0.15)}</span>
              </div>
              <div className="flex justify-between">
                <span>Seat Overhead:</span>
                <span className="font-mono text-slate-300">₹{calcSeats * 450}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
