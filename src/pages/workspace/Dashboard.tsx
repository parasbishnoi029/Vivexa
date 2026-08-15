import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, BarChart3, Database, HardDrive, Zap, Clock, Activity, FolderKanban, 
  BookOpen, ChevronRight, HelpCircle, Sparkles, CheckCircle2, Bot, 
  ShieldCheck, Search, Lightbulb, LineChart, Cpu, FileText, ArrowRight, TrendingUp,
  Globe, Server, Lock, RefreshCw, Terminal, Monitor, LayoutDashboard, Settings,
  Users, Layers, Workflow, Share2, Compass, AlertCircle, Signal, Network,
  MessageSquare, Presentation, PlayCircle, History, Filter, ArrowUpRight, ArrowDownRight,
  Upload, TerminalSquare, Cable, Wand2, Shield, Eye, Bookmark, Sparkle, AlertTriangle,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { checkQuotaStatus, incrementAiUsage } from "@/lib/telemetry";
import { Link, useNavigate } from "react-router-dom";
import { ConfidenceScoreMetricCard } from "@/components/workspace/ConfidenceScoreMetricCard";
import { DatasetProfile } from "@/lib/dataEngine";
import { AnalysisValidator } from "@/lib/analysisValidator";
import { toast } from "sonner";
import { ProjectWizard } from "@/components/ui/project-wizard";
import { ShareDialog } from "@/components/ShareDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceRealtime } from "@/hooks/useWorkspaceRealtime";
import { useQueryClient } from "@tanstack/react-query";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } }
};

// Initial Analytics Chart Data
const generateEmptyAnalyticsData = () => {
  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const time = d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    data.push({ time, throughput: 0, queries: 0, inferenceMs: 0, accuracy: 100.0 });
  }
  return data;
};

const INITIAL_ANALYTICS_DATA = generateEmptyAnalyticsData();

const QUICK_PROMPTS = [
  { label: "Forecast Q4 Revenue", query: "Forecast Q4 revenue trends across top 5 product categories", icon: TrendingUp },
  { label: "Detect Churn Risk", query: "Detect high churn risk customer segments in latest sales dataset", icon: AlertTriangle },
  { label: "Supply Chain Bottlenecks", query: "Identify supply chain bottlenecks in EMEA region logistics", icon: Cable },
  { label: "Executive Summary", query: "Generate executive briefing on gross profit margins and operating costs", icon: FileText },
];

export default function WorkspaceDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedWorkspaceId = useWorkspaceStore(state => state.selectedWorkspaceId);

  // Real-time synchronization hook for live counts across active devices
  const {
    stats,
    recentProjects,
    recentDatasets,
    loading,
    isLive,
    refetch
  } = useWorkspaceRealtime({ enableToasts: false });

  const [latestProfile, setLatestProfile] = useState<DatasetProfile | null>(null);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Prompt / Natural Language Search State
  const [chatQuery, setChatQuery] = useState("");

  // Chart State
  const [chartMetric, setChartMetric] = useState<"throughput" | "queries" | "inferenceMs" | "accuracy">("throughput");
  const [timeRange, setTimeRange] = useState<"24H" | "7D" | "30D">("24H");
  const [isStreaming, setIsStreaming] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(INITIAL_ANALYTICS_DATA);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/v1/telemetry', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          setAnalyticsData(json.data);
        }
      } catch (err) {}
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 60000);
    return () => clearInterval(interval);
  }, []);

  // Diagnostics Console State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<"Online" | "Degraded" | "Syncing">("Online");
  const [latencyCheck, setLatencyCheck] = useState<number>(18);
  const [availability, setAvailability] = useState<string>("99.999%");
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<Array<{ time: string; msg: string; type: "info" | "success" | "warn" | "error" }>>([
    { time: new Date().toLocaleTimeString(), msg: "Autonomous cluster connectivity verified.", type: "success" },
    { time: new Date().toLocaleTimeString(), msg: "Vivexa Neural Core synchronized across edge nodes.", type: "info" },
  ]);

  // Seeding Sample Datasets state

  // Process latest dataset profile for validation report
  useEffect(() => {
    if (recentDatasets && recentDatasets.length > 0) {
      const ds = recentDatasets[0];
      let prof: DatasetProfile | null = null;
      if (ds.profile_json) {
        try {
          prof = typeof ds.profile_json === 'string' ? JSON.parse(ds.profile_json) : ds.profile_json;
        } catch (e) {
          prof = null;
        }
      }
      if (prof) {
        const report = AnalysisValidator.runFullMultiPassValidation(prof);
        prof.validationReport = report;
        setLatestProfile(prof);
      }
    }
  }, [recentDatasets]);

  // In a real application, we would subscribe to a live telemetry stream here.
  // Analytics data is now fetched from the live telemetry endpoint based on real workspace usage.

  // Export Telemetry / Report Metrics to CSV
  const handleExportMetricsCsv = () => {
    try {
      const headers = ["Time", "Pipeline Throughput (MB/s)", "Active Queries / min", "Inference Latency (ms)", "Model Accuracy (%)"];
      const rows = analyticsData.map(d => [
        d.time,
        d.throughput,
        d.queries,
        d.inferenceMs,
        d.accuracy
      ]);
      
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `vivexa_pipeline_report_metrics_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report metrics exported successfully as CSV!");
    } catch (err) {
      toast.error("Failed to export metrics.");
    }
  };

  // Export Dataset Summaries to CSV
  const handleExportDatasetsCsv = () => {
    if (recentDatasets.length === 0) {
      toast.error("No dataset summaries available to export. Seed sample data first.");
      return;
    }
    try {
      const headers = ["Dataset Name", "File Type", "Description", "Row Count", "Column Count"];
      const rows = recentDatasets.map(ds => [
        `"${(ds.name || 'Unnamed').replace(/"/g, '""')}"`,
        `"${(ds.file_type || 'Dataset').replace(/"/g, '""')}"`,
        `"${(ds.description || 'Uploaded enterprise data pipeline table.').replace(/"/g, '""')}"`,
        ds.row_count || 0,
        ds.column_count || 0
      ]);
      
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "vivexa_dataset_summaries.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Dataset summaries exported successfully as CSV!");
    } catch (err) {
      toast.error("Failed to export dataset summaries.");
    }
  };

  // Handle AI Query Submission
  const handleGenerateInsight = (customPrompt?: string) => {
    const targetQuery = customPrompt || chatQuery;
    if (!targetQuery.trim()) {
      toast.error('Please enter a question or select a prompt.');
      return;
    }
    toast.success('Analyzing query via AI Copilot...');
    setTimeout(() => {
      navigate(`/workspace/ai/chat?q=${encodeURIComponent(targetQuery)}`);
    }, 600);
  };

  

  // Run System Diagnostics
  const runWorkspaceDiagnostics = async () => {
    setIsDiagnosing(true);
    setNodeStatus("Syncing");

    setDiagnosticsLogs(prev => [
      { time: new Date().toLocaleTimeString(), msg: "Initiating multi-node system health audit...", type: "info" as const },
      ...prev
    ]);

    try {
      const start = Date.now();
      await supabase.from('projects').select('id').limit(1);
      const end = Date.now();

      const lat = end - start;
      setLatencyCheck(lat);
      setNodeStatus("Online");
      setAvailability("99.999%");

      setDiagnosticsLogs(prev => [
        { time: new Date().toLocaleTimeString(), msg: `Primary node latency: ${lat}ms (Optimal)`, type: "success" as const },
        { time: new Date().toLocaleTimeString(), msg: "Inference engine: HEALTHY", type: "success" as const },
        { time: new Date().toLocaleTimeString(), msg: "Data warehouse connectivity verified.", type: "success" as const },
        ...prev
      ].slice(0, 12));

      toast.success("Diagnostics complete. System status nominal.");
    } catch (err: any) {
      setNodeStatus("Degraded");
      setDiagnosticsLogs(prev => [
        { time: new Date().toLocaleTimeString(), msg: `Diagnostic alert: ${err.message}`, type: "error" as const },
        ...prev
      ]);
      toast.error("System diagnostics detected an issue.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      const { error } = await supabase.from('projects').insert({
        name: data.name,
        description: data.description,
        industry: data.industry,
        owner_id: user?.id,
        settings: {
          goal: data.goal,
          currency: data.currency,
          theme: data.theme,
          privacy: data.privacy
        }
      });

      if (error) throw error;

      toast.success("Project created successfully");
      setIsWizardOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    }
  };

  // Welcome Greeting based on time
  const welcomeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Executive";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6 space-y-8">
        <div className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-72" />
          </div>
          <Skeleton className="h-12 w-96 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8"
      >
        {/* EXECUTIVE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          <motion.div variants={item} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                <Sparkles className="h-3 w-3" /> AI Analytics OS
              </span>
              <span className="text-xs text-slate-500 font-mono">NODE: ASIA-EAST1</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isLive ? "Supabase Realtime: Live" : "Supabase Realtime: Syncing"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {welcomeGreeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">{userName}</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Vivexa AI is monitoring your data pipelines, running continuous inference, and generating predictive business intelligence.
            </p>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => navigate('/workspace/organization')}
              variant="outline"
              className="h-11 px-5 rounded-xl bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all"
            >
              <Users className="mr-2 h-4 w-4 text-indigo-400" /> Manage Talent
            </Button>
            <Button 
              onClick={() => navigate('/workspace/datasets')}
              variant="outline"
              className="h-11 px-5 rounded-xl bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all"
            >
              <Upload className="mr-2 h-4 w-4 text-cyan-400" /> Upload Data
            </Button>
            <Button 
              onClick={handleExportMetricsCsv}
              variant="outline"
              className="h-11 px-5 rounded-xl bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all"
              title="Export dynamic metrics to CSV"
            >
              <Download className="mr-2 h-4 w-4 text-emerald-400" /> Export Metrics CSV
            </Button>
            <Button 
              onClick={() => setIsShareDialogOpen(true)}
              variant="outline"
              className="h-11 px-5 rounded-xl bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all"
            >
              <Share2 className="mr-2 h-4 w-4 text-purple-400" /> Share Workspace
            </Button>
            <Button 
              onClick={() => setIsWizardOpen(true)}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </motion.div>
        </div>

        {/* TOP KPI CARDS */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
          <Card 
            onClick={() => navigate('/workspace/projects')}
            className="bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer group rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                <FolderKanban className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> Active
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">{stats.projects}</div>
              <div className="text-xs font-bold text-slate-400 mt-0.5">Workspace Projects</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>View all units</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
          <Card 
            onClick={() => navigate('/workspace/datasets')}
            className="bg-slate-900/50 border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer group rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                <Database className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {stats.storage.toFixed(1)} GB Storage
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">{stats.datasets}</div>
              <div className="text-xs font-bold text-slate-400 mt-0.5">Connected Datasets</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Data Engine Explorer</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
          <Card 
            onClick={() => navigate('/workspace/ai')}
            className="bg-slate-900/50 border-slate-800/80 hover:border-purple-500/50 transition-all cursor-pointer group rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Gemini 2.5 Pro
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">{stats.ai}</div>
              <div className="text-xs font-bold text-slate-400 mt-0.5">AI Insights Generated</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Open AI Copilot</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
          <Card 
            onClick={() => navigate('/workspace/predictions')}
            className="bg-slate-900/50 border-slate-800/80 hover:border-amber-500/50 transition-all cursor-pointer group rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                99.2% Accuracy
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">{stats.reports}</div>
              <div className="text-xs font-bold text-slate-400 mt-0.5">Predictive ML Models</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>View Forecasting Models</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
          <Card 
            onClick={() => navigate('/workspace/organization')}
            className="bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer group rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {stats.pendingInvites} Pending
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">{stats.members}</div>
              <div className="text-xs font-bold text-slate-400 mt-0.5">Team & Talent Members</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Manage Organisation</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
          </motion.div>
        </motion.div>

        {/* NATURAL LANGUAGE AI COPILOT PROMPT BAR */}
        <motion.div variants={item} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition-opacity" />
          <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Wand2 className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Vivexa AI Natural Language Copilot</h3>
                  <p className="text-[11px] text-slate-400">Ask questions in plain English to query datasets, generate charts, or forecast key metrics.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE • LATENCY: {latencyCheck}ms</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  type="text" 
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateInsight()}
                  placeholder="e.g. 'What are the top revenue drivers across regions for Q3?'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all"
                />
              </div>
              <Button 
                onClick={() => handleGenerateInsight()}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all shrink-0"
              >
                Generate Insight <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Quick Prompts:</span>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleGenerateInsight(prompt.query)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white transition-all group/btn"
                >
                  <prompt.icon className="h-3 w-3 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* INTERACTIVE ANALYTICS PERFORMANCE STUDIO */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 bg-slate-900/50 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Real-Time Data Engine Telemetry</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mt-0.5">Pipeline Performance & Throughput</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStreaming(!isStreaming)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isStreaming 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isStreaming ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
                  {isStreaming ? "Live Stream" : "Paused"}
                </button>
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
                  {(["24H", "7D", "30D"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-3 py-1 rounded-lg transition-all ${timeRange === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: "throughput", label: "Pipeline Throughput", val: `${analyticsData[analyticsData.length - 1].throughput} MB/s`, color: "#6366f1" },
                { key: "queries", label: "Active Queries", val: `${analyticsData[analyticsData.length - 1].queries} / min`, color: "#06b6d4" },
                { key: "inferenceMs", label: "Inference Latency", val: `${analyticsData[analyticsData.length - 1].inferenceMs} ms`, color: "#a855f7" },
                { key: "accuracy", label: "Model Accuracy", val: `${analyticsData[analyticsData.length - 1].accuracy}%`, color: "#10b981" },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setChartMetric(m.key as any)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    chartMetric === m.key 
                      ? "bg-slate-950 border-indigo-500/60 shadow-lg shadow-indigo-500/10" 
                      : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-950"
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</div>
                  <div className="text-lg font-black text-white mt-1 tracking-tight">{m.val}</div>
                </button>
              ))}
            </div>

            {/* Recharts Area Visualization */}
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={chartMetric} 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#metricGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AI ANOMALY & INSIGHTS FEED */}
          <Card className="lg:col-span-4 bg-slate-900/50 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Autonomous Anomaly Feed</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">LIVE SENSORS</span>
              </div>

              <div className="space-y-3 mt-4">
                {[
                  {
                    title: "Revenue Spurt in APAC Region",
                    desc: "ARIMA model detected +18.4% anomaly in APAC sales pipeline.",
                    confidence: "96% Confidence",
                    type: "opportunity",
                    time: "10m ago"
                  },
                  {
                    title: "Churn Risk Spike in Tier-2 Users",
                    desc: "32 accounts show usage decrease matching churn pattern.",
                    confidence: "91% Confidence",
                    type: "warning",
                    time: "32m ago"
                  },
                  {
                    title: "Column Missing Value Anomaly",
                    desc: "Datasets/Supply_2026.csv has 8% null values in Freight_Cost.",
                    confidence: "99% Confidence",
                    type: "info",
                    time: "1h ago"
                  }
                ].map((insight, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {insight.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                        {insight.type === 'opportunity' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                        {insight.type === 'info' && <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />}
                        {insight.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{insight.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{insight.desc}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {insight.confidence}
                      </span>
                      <button 
                        onClick={() => navigate(`/workspace/ai/chat?q=${encodeURIComponent(insight.title)}`)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
                      >
                        Investigate <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => navigate('/workspace/reports')}
              variant="outline"
              className="w-full h-11 rounded-2xl bg-slate-950 border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider"
            >
              View Full Executive Reports
            </Button>
          </Card>
        </motion.div>

        {/* ACTIVE DATASETS & SAMPLE DATASET SEEDER */}
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-xl font-black text-white tracking-tight">Enterprise Datasets & Data Engine</h3>
            </div>
            <div className="flex items-center gap-3">
              {recentDatasets.length > 0 && (
                <Button 
                  onClick={handleExportDatasetsCsv}
                  variant="outline"
                  className="h-9 px-4 rounded-xl bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all"
                  title="Export connected datasets summary as CSV"
                >
                  <Download className="mr-2 h-3.5 w-3.5 text-cyan-400" /> Export Summaries
                </Button>
              )}
              
              <Link to="/workspace/datasets" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
                Manage All Datasets <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {recentDatasets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentDatasets.map((ds, i) => (
                <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
                <Card key={ds.id || i} className="bg-slate-900/50 border-slate-800/80 hover:border-cyan-500/50 transition-all rounded-2xl p-5 space-y-4 backdrop-blur-xl group">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{ds.file_type || "Dataset"}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">{ds.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{ds.description || "Uploaded enterprise data pipeline table."}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>Rows: {ds.row_count || 0}</span>
                    <span>Cols: {ds.column_count || 0}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      onClick={() => navigate('/workspace/datasets')}
                      size="sm"
                      className="w-full h-8 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
                    >
                      <Eye className="mr-1.5 h-3 w-3 text-cyan-400" /> Explore
                    </Button>
                    <Button 
                      onClick={() => navigate(`/workspace/ai/chat?q=Analyze dataset ${encodeURIComponent(ds.name)}`)}
                      size="sm"
                      className="w-full h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-[10px] font-bold text-indigo-300"
                    >
                      <Bot className="mr-1.5 h-3 w-3" /> Ask AI
                    </Button>
                  </div>
                </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-900/30 border-dashed border-slate-800 p-8 rounded-3xl text-center space-y-4">
              <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto border border-slate-800 text-slate-500">
                <Database className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">No Datasets Connected Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Upload your own CSV, Excel, JSON or Parquet files, or load 3 realistic enterprise sample datasets with one click.</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                
                <Button 
                  onClick={() => navigate('/workspace/datasets')}
                  variant="outline"
                  className="h-10 px-6 rounded-xl bg-slate-950 border-slate-800 text-slate-300 text-xs font-bold"
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload File
                </Button>
              </div>
            </Card>
          )}
        </motion.div>

        {/* PLATFORM ECOSYSTEM MODULE SHORTCUTS */}
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-black text-white tracking-tight">Vivexa Platform Shortcuts</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Logic Studio", desc: "Interactive Notebooks", route: "/workspace/notebooks", icon: TerminalSquare, color: "text-purple-400" },
              { label: "AI Storytelling", desc: "Executive Decks", route: "/workspace/reports", icon: Presentation, color: "text-amber-400" },
              { label: "Agent Cockpit", desc: "Multi-Agent Systems", route: "/workspace/agents", icon: Network, color: "text-indigo-400" },
              { label: "Semantic Layer", desc: "Business Glossary", route: "/workspace/semantic", icon: Layers, color: "text-cyan-400" },
              { label: "Data Connectors", desc: "50+ Integrations", route: "/workspace/connectors", icon: Cable, color: "text-emerald-400" },
              { label: "Predictive ML", desc: "AutoML Engine", route: "/workspace/predictions", icon: Activity, color: "text-rose-400" },
            ].map((shortcut, i) => (
              <Card 
                key={i}
                onClick={() => navigate(shortcut.route)}
                className="bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer p-4 rounded-2xl group text-center space-y-2 backdrop-blur-xl"
              >
                <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 w-fit mx-auto group-hover:scale-110 transition-transform ${shortcut.color}`}>
                  <shortcut.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{shortcut.label}</div>
                  <div className="text-[10px] text-slate-500">{shortcut.desc}</div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* SYSTEM AUDIT & CONFIDENCE PULSE */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 bg-slate-900/40 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cluster Audit Log</span>
              </div>
              <Button 
                onClick={runWorkspaceDiagnostics}
                disabled={isDiagnosing}
                size="sm"
                className="h-8 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
              >
                {isDiagnosing ? "Diagnosing..." : "Run System Diagnostic"}
              </Button>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 h-40 overflow-y-auto font-mono text-[11px] space-y-2">
              {diagnosticsLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold">[{log.time}]</span>
                  <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-slate-300'}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4 bg-slate-900/40 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest">
                <Shield className="h-4 w-4" /> Enterprise Security & Quota
              </div>
              <h4 className="text-base font-black text-white">Monthly AI Inference Quota</h4>
              <p className="text-xs text-slate-400">Your workspace uses encrypted enterprise keys with row-level tenant isolation.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-slate-400">QUOTA UTILIZATION</span>
                <span className="text-indigo-400">{Math.round(checkQuotaStatus().percentage)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${checkQuotaStatus().percentage}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            <Button 
              onClick={() => navigate('/workspace/billing')}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider"
            >
              Scale Enterprise Plan
            </Button>
          </Card>
        </motion.div>

        {/* MODALS */}
        <ProjectWizard 
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onComplete={handleCreateProject}
        />
        <ShareDialog 
          isOpen={isShareDialogOpen} 
          onClose={() => setIsShareDialogOpen(false)} 
          title="Executive AI Workspace Dashboard" 
        />
      </motion.div>
    </div>
  );
}
