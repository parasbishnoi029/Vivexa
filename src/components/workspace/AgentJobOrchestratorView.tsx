import { useState, useEffect } from "react";
import { 
  Play, Pause, RefreshCw, CheckCircle2, Clock, AlertCircle, 
  Trash2, Sparkles, Terminal, Activity, Layers, ArrowRight, 
  Flame, ShieldCheck, FileText, BarChart3, Database, Zap,
  XCircle, Filter, Send
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface JobStep {
  id: string;
  name: string;
  description: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progressPct: number;
  logs: string[];
  startedAt?: number;
  completedAt?: number;
}

interface AgentJob {
  id: string;
  userId: string;
  agentId: string;
  agentName: string;
  datasetName: string;
  directive: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
  currentStepIndex: number;
  steps: JobStep[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  executionDurationMs?: number;
  resultSummary?: any;
  error?: string;
}

export function AgentJobOrchestratorView() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Job Form State
  const [directive, setDirective] = useState("");
  const [agentName, setAgentName] = useState("Statistical Sentinel & Anomaly Agent");
  const [datasetName, setDatasetName] = useState("dw.fact_enterprise_sales.delta");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "CRITICAL">("HIGH");

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0] || null;

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/agents/jobs");
      const json = await res.json();
      if (json.success && json.data?.jobs) {
        setJobs(json.data.jobs);
        if (!activeJobId && json.data.jobs.length > 0) {
          setActiveJobId(json.data.jobs[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load jobs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Subscribe to live SSE stream for the active running job
  useEffect(() => {
    if (!activeJob || (activeJob.status !== "RUNNING" && activeJob.status !== "QUEUED")) {
      return;
    }

    const eventSource = new EventSource(`/api/v1/agents/jobs/${activeJob.id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const updatedJob: AgentJob = JSON.parse(event.data);
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        if (updatedJob.status === "COMPLETED" || updatedJob.status === "FAILED" || updatedJob.status === "CANCELLED") {
          eventSource.close();
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeJob?.id, activeJob?.status]);

  // Submit Job
  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directive.trim()) {
      toast.error("Please provide a task directive prompt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/agents/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentName.toLowerCase().replace(/\s+/g, '-'),
          agentName,
          datasetName,
          directive,
          priority
        })
      });
      const json = await res.json();
      if (json.success && json.data?.job) {
        toast.success(`Job dispatched to worker queue (${priority} Priority)`);
        setJobs(prev => [json.data.job, ...prev]);
        setActiveJobId(json.data.job.id);
        setDirective("");
      } else {
        toast.error(json.error || "Failed to submit job");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Job
  const handleCancelJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/v1/agents/jobs/${jobId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.info("Job cancellation requested");
        fetchJobs();
      }
    } catch (err) {
      toast.error("Failed to cancel job");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "CRITICAL": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "HIGH": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "NORMAL": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
      default: return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "COMPLETED": return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
      case "RUNNING": return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"><Activity className="h-3 w-3 animate-spin" /> In Progress</span>;
      case "QUEUED": return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"><Clock className="h-3 w-3" /> Queued</span>;
      case "CANCELLED": return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"><XCircle className="h-3 w-3" /> Cancelled</span>;
      default: return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><AlertCircle className="h-3 w-3" /> Failed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Worker Concurrency</p>
            <p className="text-xl font-extrabold text-white mt-1">4 / 4 Active Pods</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Queue Status</p>
            <p className="text-xl font-extrabold text-white mt-1">
              {jobs.filter(j => j.status === "RUNNING").length} Running • {jobs.filter(j => j.status === "QUEUED").length} Queued
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Jobs</p>
            <p className="text-xl font-extrabold text-white mt-1">{jobs.filter(j => j.status === "COMPLETED").length} Successful</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streaming Protocol</p>
            <p className="text-xl font-extrabold text-white mt-1">Server-Sent Events</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Terminal className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dispatch Form & Job History List */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dispatch Card */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> Dispatch Asynchronous Agent Job
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Submit long-running batch intelligence pipelines with multi-step DAG execution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitJob} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Agent Cluster Node
                  </label>
                  <select 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Statistical Sentinel & Anomaly Agent">Statistical Sentinel & Anomaly Agent</option>
                    <option value="Executive Briefing & PPT Exporter">Executive Briefing & PPT Exporter</option>
                    <option value="Predictive Churn & ML Ensemble">Predictive Churn & ML Ensemble</option>
                    <option value="Multi-Agent Consensus Orchestrator">Multi-Agent Consensus Orchestrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Target Dataset / Lakehouse Delta Table
                  </label>
                  <input 
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Priority Level
                    </label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="LOW">LOW</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Execution Timeout
                    </label>
                    <input 
                      type="text"
                      disabled
                      value="600s (10m Limit)"
                      className="w-full bg-slate-950/50 border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Task Directive & Synthesis Instructions
                  </label>
                  <textarea 
                    value={directive}
                    onChange={(e) => setDirective(e.target.value)}
                    placeholder="e.g., Scan high-cardinality financial partitions, isolate 3.5σ outliers, and synthesize 10-slide PPT briefing."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? "Enqueuing Pipeline..." : "Queue Asynchronous Agent Task"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Job Queue List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job History & Queue</h3>
              <Button variant="ghost" size="sm" onClick={fetchJobs} className="h-7 text-xs text-slate-400 hover:text-white">
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setActiveJobId(job.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeJob?.id === job.id
                      ? "bg-indigo-600/10 border-indigo-500/50 shadow-inner"
                      : "bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                      <p className="text-xs font-bold text-white truncate">{job.agentName}</p>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-1.5">{job.directive}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
                    <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                    <div className="flex items-center gap-2">
                      <span>{job.progress}%</span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${job.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active Job Inspector & Live DAG Terminal */}
        <div className="lg:col-span-7 space-y-6">
          {activeJob ? (
            <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{activeJob.agentName}</h2>
                      {getStatusBadge(activeJob.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Job ID: <span className="font-mono text-indigo-400">{activeJob.id}</span> • Table: <span className="font-mono text-slate-300">{activeJob.datasetName}</span>
                    </p>
                  </div>

                  {activeJob.status === "RUNNING" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelJob(activeJob.id)}
                      className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-8"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Abort Task
                    </Button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Overall Pipeline Execution</span>
                    <span className="font-bold text-white">{activeJob.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      className={`h-full ${activeJob.status === 'COMPLETED' ? 'bg-emerald-500' : activeJob.status === 'CANCELLED' ? 'bg-slate-600' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${activeJob.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                
                {/* Multi-Step Execution DAG */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" /> Pipeline Execution DAG Stages
                  </h3>

                  <div className="space-y-2">
                    {activeJob.steps.map((step, idx) => (
                      <div 
                        key={step.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          step.status === "RUNNING"
                            ? "bg-indigo-950/20 border-indigo-500/40"
                            : step.status === "COMPLETED"
                            ? "bg-slate-950/40 border-slate-800"
                            : "bg-slate-950/20 border-slate-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold font-mono text-slate-500">0{idx + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-white">{step.name}</p>
                              <p className="text-[11px] text-slate-400">{step.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {step.status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                            {step.status === "RUNNING" && <Activity className="h-4 w-4 text-indigo-400 animate-spin" />}
                            {step.status === "PENDING" && <Clock className="h-4 w-4 text-slate-600" />}
                            <span className="text-xs font-mono text-slate-300">{step.progressPct}%</span>
                          </div>
                        </div>

                        {/* Logs for step */}
                        {step.logs && step.logs.length > 0 && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 bg-slate-950/80 rounded-lg p-2 font-mono text-[10px] text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                            {step.logs.map((log, lIdx) => (
                              <p key={lIdx} className="text-slate-400">
                                <span className="text-indigo-400">&gt;</span> {log}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Job Artifacts */}
                {activeJob.resultSummary && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" /> Orchestration Synthesis Result Artifacts
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Multi-Agent Consensus</span>
                        <span className="font-bold text-white">{activeJob.resultSummary.consensusRating || "99.8%"}</span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Statistical Metrics</span>
                        <span className="font-bold text-white">{activeJob.resultSummary.metricsComputed || 24} Computed</span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Execution Time</span>
                        <span className="font-bold text-white">{(activeJob.executionDurationMs ? (activeJob.executionDurationMs / 1000).toFixed(1) : 4.8)}s</span>
                      </div>
                    </div>

                    {activeJob.resultSummary.recommendations && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-slate-300">Strategic Levers Synthesized:</p>
                        {activeJob.resultSummary.recommendations.map((rec: string, rIdx: number) => (
                          <p key={rIdx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span> {rec}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs space-y-2">
              <Clock className="h-8 w-8 text-slate-600" />
              <p>Select a job from the queue to inspect live progress and step artifacts.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
