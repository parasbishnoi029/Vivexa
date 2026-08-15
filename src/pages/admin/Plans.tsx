import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Loader2, ArrowUpRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type UpgradeRequest = {
  id: string;
  user_email: string;
  user_name: string;
  current_plan: string;
  requested_plan: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
};

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);

  useEffect(() => {
    async function loadPlans() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('plans').select('*');
        if (error) {
          console.error("Failed to load plans:", error);
        } else {
          setPlans(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
    toast.success(`Request ${action === 'approved' ? 'approved' : 'rejected'} successfully.`);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-indigo-400" />
          Subscription Plans & Upgrade Requests
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage platform subscription tiers and user upgrade requests.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            Pending Upgrade Requests
          </CardTitle>
          <CardDescription>Review and manage users requesting plan upgrades.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center flex flex-col items-center">
              <CheckCircle2 className="h-10 w-10 text-slate-700 mb-2" />
              No pending upgrade requests.
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800 gap-4"
                  >
                    <div>
                      <h4 className="text-white font-medium">{req.user_name} <span className="text-slate-500 text-xs font-normal ml-2">{req.user_email}</span></h4>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-slate-400">{req.current_plan}</span>
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span className="font-bold text-emerald-400">{req.requested_plan}</span>
                        <span className="text-xs text-slate-600 ml-4">{new Date(req.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAction(req.id, 'rejected')} variant="outline" size="sm" className="bg-slate-900 border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30">
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button onClick={() => handleAction(req.id, 'approved')} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        <Check className="h-4 w-4 mr-1" /> Approve
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
        <h2 className="text-lg font-semibold text-white mb-4">Available Subscription Plans</h2>
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-500" /></div>
        ) : plans.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center text-slate-400">
              No subscription plans found in the database.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const featuresList = Array.isArray(plan.features) ? plan.features : [];
              const priceDisplay = plan.price_inr === 0 ? "₹0" : `₹${plan.price_inr}`;
              return (
                <Card key={plan.id} className="bg-slate-900 border-slate-800 flex flex-col transition-all hover:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-slate-200 mt-2">
                      {priceDisplay}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2 mt-4">
                      {featuresList.map((feature: string, j: number) => (
                        <li key={j} className="flex items-start text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
