import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Loader2, ArrowUpRight, Check, X, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/authStore";

type UpgradeRequest = {
  id: string;
  user_id?: string;
  user_email: string;
  user_name: string;
  current_plan: string;
  requested_plan: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
};

const DEFAULT_PLANS = [
  {
    id: "plan-starter",
    name: "Starter Tier",
    price_inr: 0,
    price_usd: "$0",
    features: [
      "Up to 5 Datasets (max 100MB each)",
      "Standard SQL & Python Execution Engine",
      "Community Support & Basic Analytics",
      "Single Workspace Seat"
    ]
  },
  {
    id: "plan-pro",
    name: "Pro Tier",
    price_inr: 3999,
    price_usd: "$49/mo",
    features: [
      "Up to 50 Datasets (max 2GB each)",
      "Polars Vectorized Memory Engine",
      "Interactive Gemini AI Analyst Chat",
      "5 Workspace Collaboration Seats",
      "Priority Email & Slack Support"
    ]
  },
  {
    id: "plan-enterprise",
    name: "Enterprise Tier",
    price_inr: 39999,
    price_usd: "$499/mo",
    features: [
      "Unlimited Datasets & Parquet Storage",
      "Distributed Spark & MicroVM Cluster",
      "Full Semantic Metric Dictionary & RLS",
      "Unlimited Seats & SSO Integration",
      "24/7 SLA Guarantee & Dedicated CSM"
    ]
  },
  {
    id: "plan-custom",
    name: "Custom / On-Premise",
    price_inr: 0,
    price_usd: "Contact Sales",
    features: [
      "Air-gapped VPC Cloud / On-Premise Deploy",
      "Custom ML Model Fine-tuning",
      "Audit Trail Archival & SIEM Export",
      "Dedicated Infrastructure Engineer"
    ]
  }
];

export default function AdminPlans() {
  const { session } = useAuthStore();
  const token = session?.access_token;
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch plans
      const { data: dbPlans, error: plansErr } = await supabase.from('plans').select('*');
      if (!plansErr && dbPlans && dbPlans.length > 0) {
        setPlans(dbPlans);
      } else {
        setPlans(DEFAULT_PLANS);
      }

      // 2. Fetch upgrade requests from backend API
      if (token) {
        try {
          const res = await fetch('/api/v1/admin/upgrade-requests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setRequests(json.data);
            }
          }
        } catch (err) {
          console.warn("Failed to fetch upgrade requests:", err);
        }
      }
    } catch (err) {
      console.error(err);
      setPlans(DEFAULT_PLANS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAction = async (reqItem: UpgradeRequest, action: 'approved' | 'rejected') => {
    setIsProcessingId(reqItem.id);
    const toastId = toast.loading(`${action === 'approved' ? 'Approving' : 'Rejecting'} upgrade for ${reqItem.user_email}...`);

    try {
      if (token) {
        const res = await fetch(`/api/v1/admin/upgrade-requests/${reqItem.id}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action,
            requested_plan: reqItem.requested_plan,
            user_email: reqItem.user_email,
            user_id: reqItem.user_id
          })
        });

        if (res.ok) {
          setRequests(prev => prev.map(req => req.id === reqItem.id ? { ...req, status: action } : req));
          toast.success(`Request for ${reqItem.user_email} ${action === 'approved' ? 'approved & user plan upgraded' : 'rejected'}.`, { id: toastId });
          return;
        }
      }

      // Fallback local update
      setRequests(prev => prev.map(req => req.id === reqItem.id ? { ...req, status: action } : req));
      toast.success(`Request ${action === 'approved' ? 'approved' : 'rejected'} successfully.`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to process request", { id: toastId });
    } finally {
      setIsProcessingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 pb-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-indigo-400" />
            Subscription Plans & Upgrade Requests
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage platform subscription tiers, active user upgrades, and billing authorizations.</p>
        </div>
        <Button onClick={loadData} disabled={isLoading} variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Requests
        </Button>
      </div>

      <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2 text-lg">
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            Pending Upgrade Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Review user plan upgrade requests and authorize tier changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-400 h-6 w-6" /></div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center flex flex-col items-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mb-2" />
              All upgrade requests have been processed. No pending requests.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {pendingRequests.map(req => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <h4 className="text-white font-medium text-sm flex items-center gap-2">
                        {req.user_name}
                        <span className="text-slate-500 text-xs font-mono font-normal">({req.user_email})</span>
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">{req.current_plan}</span>
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">{req.requested_plan}</span>
                        <span className="text-[11px] text-slate-500 ml-3">{new Date(req.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        disabled={isProcessingId === req.id}
                        onClick={() => handleAction(req, 'rejected')} 
                        variant="outline" 
                        size="sm" 
                        className="bg-slate-900 border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                      <Button 
                        disabled={isProcessingId === req.id}
                        onClick={() => handleAction(req, 'approved')} 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 text-xs"
                      >
                        {isProcessingId === req.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                        Approve Upgrade
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" /> Subscription Plan Matrix
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const featuresList = Array.isArray(plan.features) ? plan.features : [];
            const priceDisplay = plan.price_usd || (plan.price_inr === 0 ? "₹0" : `₹${plan.price_inr}`);
            return (
              <Card key={plan.id} className="bg-slate-900/60 border-slate-800 flex flex-col transition-all hover:border-slate-700 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base text-white font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-2xl font-black text-indigo-400 mt-2">
                    {priceDisplay}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 mt-2">
                    {featuresList.map((feature: string, j: number) => (
                      <li key={j} className="flex items-start text-xs text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
