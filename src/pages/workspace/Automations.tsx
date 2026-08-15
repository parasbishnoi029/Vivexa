import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Workflow, Play, Plus, Trash2, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, Settings, ShieldAlert, Mail, Bell, ArrowRight, X, ChevronRight,
  Filter, Zap, Check, RotateCcw, GitBranch, Layers, Boxes, Database, Share2, History,
  Network, Cpu, Workflow as WorkflowIcon, Terminal, Activity, Sliders
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { createNotification } from "@/lib/notifications";
import { useAuthStore } from "@/stores/authStore";
import { safeFetchJson } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface WorkflowLog {
  id: string;
  timestamp: string;
  status: "Success" | "Failed";
  duration: string;
  triggerEvent: string;
  actionResult: string;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerType: "Schedule" | "Dataset Event" | "Report Event" | "Model Event" | "Webhook";
  triggerDetail: string;
  condition: string;
  actionType: "Email PDF Report" | "Slack Alert" | "Sync Dataset" | "Trigger Forecast" | "System Backup" | "Trigger Webhook";
  actionDetail: string;
  enabled: boolean;
  retryLogic: boolean;
  lastRun?: string;
  successRate: string;
  logs: WorkflowLog[];
  webhookUrl?: string;
  webhookEnabled?: boolean;
}

const DEFAULT_AUTOMATIONS: AutomationRule[] = [];

export default function Automations() {
  const [workflows, setWorkflows] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedWf, setSelectedWf] = useState<AutomationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecutingId, setIsExecutingId] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // New Workflow Form State
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<any>("Schedule");
  const [triggerDetail, setTriggerDetail] = useState("Every Day at 09:00 AM");
  const [condition, setCondition] = useState("Always run");
  const [actionType, setActionType] = useState<any>("Email PDF Report");
  const [actionDetail, setActionDetail] = useState("Send to team@vivexa.io");
  const [wfWebhookUrl, setWfWebhookUrl] = useState("");
  const [wfWebhookEnabled, setWfWebhookEnabled] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(false);
    setWorkflows(DEFAULT_AUTOMATIONS);
  };

  const toggleEnable = async (wf: AutomationRule) => {
    const newEnabled = !wf.enabled;
    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${wf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({ enabled: newEnabled })
    });
    const res = await safeFetchJson(req);
    if (res.success) {
      setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, enabled: newEnabled } : w));
      toast.info(`Automation ${newEnabled ? 'enabled' : 'paused'}`);
    } else {
      toast.error(res.error || "Failed to update workflow");
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation workflow?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.access_token}` }
    });
    const res = await safeFetchJson(req);
    if (res.success) {
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast.success("Workflow removed");
    } else {
      toast.error(res.error || "Failed to delete workflow");
    }
  };

  const executeNow = async (wf: AutomationRule) => {
    setIsExecutingId(wf.id);
    toast.info(`Executing automation workflow "${wf.name}"...`);
    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${wf.id}/execute`, { 
      method: "POST",
      headers: { "Authorization": `Bearer ${session?.access_token}` }
    });
    const res = await safeFetchJson(req);
    setIsExecutingId(null);
    if (res.success) {
      toast.success(`Workflow "${wf.name}" completed successfully!`);
      loadWorkflows(); // Refresh logs
    } else {
      toast.error(res.error || "Failed to execute workflow");
    }
  };

  const handleShareWorkflow = (wf: AutomationRule) => {
    setShareTitle(`Automation: ${wf.name}`);
    setShareUrl(`${window.location.origin}/workspace/automations?id=${wf.id}`);
    setIsShareDialogOpen(true);
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsCreating(true); // Can use for loading state
    const payload = {
      name,
      trigger_type: triggerType,
      trigger_detail: triggerDetail,
      condition,
      action_type: actionType,
      action_detail: actionDetail,
      enabled: true,
      webhook_url: wfWebhookUrl,
      webhook_enabled: wfWebhookEnabled
    };

    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch("/api/v1/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify(payload)
    });
    const res = await safeFetchJson(req);

    if (res.success) {
      const newWf = res.data;
      setWorkflows([{ 
        ...newWf, 
        triggerType: newWf.trigger_type, 
        triggerDetail: newWf.trigger_detail, 
        actionType: newWf.action_type, 
        actionDetail: newWf.action_detail, 
        webhookUrl: newWf.webhook_url, 
        webhookEnabled: newWf.webhook_enabled,
        lastRun: newWf.last_run,
        successRate: newWf.success_rate
      }, ...workflows]);
      setIsCreating(false);
      setName("");
      toast.success("Workflow created!");
    } else {
      toast.error(res.error || "Failed to create workflow");
      setIsCreating(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "Email PDF Report": return Mail;
      case "Slack Alert": return Bell;
      case "Sync Dataset": return RefreshCw;
      case "Trigger Forecast": return Zap;
      case "System Backup": return ShieldAlert;
      case "Trigger Webhook": return Share2;
      default: return Workflow;
    }
  };

  return (
    <div className="space-y-6 relative z-10 w-full max-w-7xl mx-auto pb-12 text-left">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 -z-10 opacity-10 pointer-events-none">
        <Network className="h-[600px] w-[600px] text-indigo-500" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-8 rounded-[40px] border border-slate-800 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <WorkflowIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
              Pipeline Fabric
              <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-widest">
                {workflows.filter(w => w.enabled).length} ACTIVE NODES
              </span>
            </h1>
            <p className="text-slate-400 mt-1 max-w-xl leading-relaxed">
              Palantir-style DAG orchestration. Construct multi-stage, event-driven data flows with automated error recovery and semantic lineage tracking.
            </p>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <Button variant="outline" className="bg-slate-900/50 border-slate-800 text-slate-300 hover:text-white rounded-2xl h-12 px-6 font-bold">
            <Activity className="h-4 w-4 mr-2" /> Global Health
          </Button>
          <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl h-12 px-8 shadow-xl shadow-indigo-500/20">
            <Plus className="h-4 w-4 mr-2" /> New Pipeline Node
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Executions Today", value: "1,284", trend: "+12%", icon: Zap, color: "text-amber-400" },
          { label: "Success Rate", value: "99.8%", trend: "Stable", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Active Connections", value: "42", trend: "+2", icon: Network, color: "text-indigo-400" },
          { label: "Avg Latency", value: "124ms", trend: "-5ms", icon: Activity, color: "text-cyan-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-900/40 border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-bold ${stat.trend.includes('+') ? 'text-emerald-400' : stat.trend === 'Stable' ? 'text-slate-500' : 'text-rose-400'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Workflow List */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {workflows.map((wf) => {
              const ActionIcon = getActionIcon(wf.actionType);
              return (
                <motion.div
                  key={wf.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card 
                    className={`bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60 transition-all overflow-hidden group cursor-pointer ${selectedWf?.id === wf.id ? 'ring-2 ring-indigo-500 bg-slate-900/80 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : ''}`}
                    onClick={() => setSelectedWf(wf)}
                  >
                    <CardContent className="p-0">
                      <div className="p-5 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${wf.enabled ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-800 border border-slate-700 opacity-50'}`}>
                            <ActionIcon className={`h-6 w-6 ${wf.enabled ? 'text-indigo-400' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{wf.name}</h3>
                              {!wf.enabled && <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Paused</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              <span className="text-indigo-400 font-bold font-mono">WHEN</span> {wf.triggerDetail} 
                              <span className="mx-2 text-slate-600 opacity-50">|</span>
                              <span className="text-indigo-400 font-bold font-mono">THEN</span> {wf.actionType}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <Clock className="h-3 w-3" /> Last run: {wf.lastRun || "Never"}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                                <CheckCircle2 className="h-3 w-3" /> {wf.successRate} Success
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            onClick={(e) => { e.stopPropagation(); executeNow(wf); }} 
                            disabled={isExecutingId === wf.id} 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Play className={`h-4 w-4 ${isExecutingId === wf.id ? "animate-spin" : ""}`} />
                          </Button>
                          <Button 
                            onClick={(e) => { e.stopPropagation(); toggleEnable(wf); }} 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-400 hover:text-white"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={(e) => { e.stopPropagation(); handleShareWorkflow(wf); }} 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }} 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right: Workflow Fabric Visualization */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800/60 rounded-3xl overflow-hidden sticky top-24 shadow-2xl">
            <CardHeader className="border-b border-slate-800/40 pb-4 bg-slate-950/20">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-indigo-400" /> Decision Fabric Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {selectedWf ? (() => {
                const ActionIcon = getActionIcon(selectedWf.actionType);
                return (
                  <div className="space-y-8">
                    {/* Visual Flow */}
                    <div className="relative flex flex-col items-center">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col items-center text-center"
                      >
                        <Zap className="h-5 w-5 text-yellow-400 mb-2" />
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Trigger Source</p>
                        <p className="text-xs text-white font-bold mt-1">{selectedWf.triggerType}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{selectedWf.triggerDetail}</p>
                      </motion.div>

                      <div className="h-10 w-px bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-slate-800" />

                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative z-10 w-4/5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3"
                      >
                        <Filter className="h-4 w-4 text-slate-500" />
                        <div className="text-left">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Logic Filter</p>
                          <p className="text-[10px] text-slate-300 font-bold">{selectedWf.condition}</p>
                        </div>
                      </motion.div>

                      <div className="h-10 w-px bg-gradient-to-b from-slate-800 via-indigo-500/20 to-indigo-500/50" />

                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 w-full p-5 rounded-2xl bg-indigo-600 border border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)] flex flex-col items-center text-center group"
                      >
                        <ActionIcon className="h-6 w-6 text-white mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Prescriptive Action</p>
                        <p className="text-xs text-white font-bold mt-1">{selectedWf.actionType}</p>
                        <p className="text-[10px] text-indigo-200 mt-1 line-clamp-2 px-2">{selectedWf.actionDetail}</p>
                      </motion.div>
                    </div>

                    <div className="pt-6 border-t border-slate-800/60 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Enterprise Governance</span>
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                            <ShieldAlert className="h-3 w-3" /> RBAC PROTECTED
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button 
                          onClick={() => executeNow(selectedWf)}
                          disabled={isExecutingId === selectedWf.id}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold h-10"
                        >
                          <Play className="h-3.5 w-3.5 mr-2" /> Test Fabric
                        </Button>
                        <Button 
                          variant="outline"
                          className="bg-slate-900 border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs h-10"
                        >
                          <History className="h-3.5 w-3.5 mr-2" /> Trace Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-700">
                    <GitBranch className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400">Select a workflow</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
              <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-white mb-4">Create New Automation Workflow</h3>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Workflow Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Daily Churn Anomaly Email"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" onClick={() => setIsCreating(false)} variant="ghost" className="text-slate-400">Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">Save Automation</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title={shareTitle}
        shareUrl={shareUrl}
      />
    </div>
  );
}
