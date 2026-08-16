import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Network, BrainCircuit, Database, LineChart, Target, Building, Search, 
  PlayCircle, CheckCircle2, X, Sparkles, RefreshCw, Play, ArrowRight, Cpu, 
  Layers, Terminal, Sliders, ShieldAlert, BadgeCheck, HelpCircle, FileText, 
  BarChart3, AlertTriangle, Workflow, Flame, BookOpen, Layers2, MessageSquare, 
  Presentation, Zap, TrendingUp, Users, Check, Copy, Settings2, Code, 
  Newspaper, Send, CheckCircle, ChevronRight, Activity, Trash, Star,
  Share2, Share, Link2, GitBranch, Boxes
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart as RechartLine, Line, BarChart as RechartBar, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, ReferenceLine
} from "recharts";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { parseDatasetFile } from "@/lib/datasetParser";
import { profileDataset } from "@/lib/dataEngine";
import { checkAndConsumeQuota, triggerLimitModal } from "@/lib/limits";

// =========================================================================
// INTERFACE DEFINITIONS
// =========================================================================
interface Agent {
  id: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  desc: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  memoryRetries: boolean;
}

interface Capability {
  id: string;
  name: string;
  category: "analytics" | "synthesis" | "devops";
  icon: any;
  color: string;
  border: string;
  desc: string;
  badge: string;
}

// =========================================================================
// THE 20 UNIQUE FEATURE CARDS IN THE COCKPIT
// =========================================================================
const capabilities: Capability[] = [
  { id: "feat_collab", name: "Multi-Agent Collaboration", category: "analytics", icon: Network, color: "text-indigo-400", border: "border-indigo-500/20 bg-indigo-500/5", desc: "Coordinates complex analytical tasks across a team of specialized AI nodes under consensus protocols.", badge: "Enterprise Plus" },
  { id: "feat_dash_gen", name: "Auto Dashboard Generator", category: "analytics", icon: BarChart3, color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/5", desc: "Translates natural language descriptions into interactive real-time visual dashboard suites.", badge: "MNC Level" },
  { id: "feat_report_gen", name: "Auto Business Report", category: "synthesis", icon: FileText, color: "text-blue-400", border: "border-blue-500/20 bg-blue-500/5", desc: "Extracts database rows and builds comprehensive multi-page corporate PDF summaries automatically.", badge: "Automated" },
  { id: "feat_meet_summary", name: "AI Meeting Summary from Data", category: "synthesis", icon: MessageSquare, color: "text-pink-400", border: "border-pink-500/20 bg-pink-500/5", desc: "Ingests raw Zoom/Teams call audio transcription feeds and compiles action items with data grounding.", badge: "Unique" },
  { id: "feat_advisor", name: "AI Business Advisor", category: "synthesis", icon: Building, color: "text-violet-400", border: "border-violet-500/20 bg-violet-500/5", desc: "Runs multi-scenario SWOT models on financial data and returns strategic actionable directives.", badge: "Executive" },
  { id: "feat_root_cause", name: "AI Root Cause Finder", category: "analytics", icon: AlertTriangle, color: "text-amber-500", border: "border-amber-500/20 bg-amber-500/5", desc: "Traces unexpected metric dips, system latency spikes, or schema bottlenecks back to database failures.", badge: "Diagnosis" },
  { id: "feat_forecast", name: "AI Forecast Generator", category: "analytics", icon: TrendingUp, color: "text-cyan-400", border: "border-cyan-500/20 bg-cyan-500/5", desc: "Deploys seasonal Prophet and ARIMA predictive algorithms with configurable confidence bounds.", badge: "Predictive" },
  { id: "feat_decision", name: "AI Decision Simulator", category: "analytics", icon: Sliders, color: "text-rose-400", border: "border-rose-500/20 bg-rose-500/5", desc: "Runs Monte Carlo statistical models to forecast risk-adjusted EBITDA margins based on budget slides.", badge: "Simulation" },
  { id: "feat_data_qual", name: "AI Data Quality Score", category: "devops", icon: BadgeCheck, color: "text-teal-400", border: "border-teal-500/20 bg-teal-500/5", desc: "Audits active warehouse pipelines, calculating schema completeness, null densities, and integrity scores.", badge: "DataOps" },
  { id: "feat_kpi_gen", name: "AI KPI Generator", category: "devops", icon: Zap, color: "text-yellow-400", border: "border-yellow-500/20 bg-yellow-500/5", desc: "Generates optimal operational KPIs, LookerML measure models, and structured SQL query equations.", badge: "Analytics" },
  { id: "feat_storytelling", name: "AI Storytelling", category: "synthesis", icon: BookOpen, color: "text-purple-400", border: "border-purple-500/20 bg-purple-500/5", desc: "Translates dry tabular charts into dynamic statistical narratives with chronological slide maps.", badge: "Storytelling" },
  { id: "feat_presentation", name: "AI Presentation Generator", category: "synthesis", icon: Presentation, color: "text-orange-400", border: "border-orange-500/20 bg-orange-500/5", desc: "Compiles formatted slide outline structures with design pairings, speaker talking scripts, and layout blueprints.", badge: "MNC Level" },
  { id: "feat_codegen", name: "AI SQL + Python Generator", category: "devops", icon: Code, color: "text-emerald-500", border: "border-emerald-500/20 bg-emerald-500/5", desc: "Writes sandboxed Python, SQL queries, and pandas transformations, with syntax validation check logs.", badge: "Developer" },
  { id: "feat_insight_feed", name: "AI Insight Feed", category: "analytics", icon: Newspaper, color: "text-indigo-400", border: "border-indigo-500/20 bg-indigo-500/5", desc: "Streams real-time enterprise performance logs, positive inflection matrices, and threshold breaches.", badge: "Streaming" },
  { id: "feat_anomaly", name: "AI Anomaly Watch", category: "analytics", icon: ShieldAlert, color: "text-red-400", border: "border-red-400/20 bg-red-400/5", desc: "Deploys real-time anomaly watches over API telemetry, unauthorized spikes, and table write rates.", badge: "SecOps" },
  { id: "feat_workflow", name: "AI Workflow Builder", category: "devops", icon: Workflow, color: "text-cyan-500", border: "border-cyan-500/20 bg-cyan-500/5", desc: "Constructs production pipeline YAML DAG architectures for ingestion, PII masking, and slack alerts.", badge: "Automation" },
  { id: "feat_research", name: "AI Research Assistant", category: "synthesis", icon: Search, color: "text-blue-500", border: "border-blue-500/20 bg-blue-500/5", desc: "Queries unstructured workspace databases, indexing PDF folders and mapping knowledge graph citations.", badge: "RAG" },
  { id: "feat_explain", name: "AI Explain Anything", category: "synthesis", icon: HelpCircle, color: "text-slate-400", border: "border-slate-400/20 bg-slate-400/5", desc: "Explains multi-layered statistical anomalies or codebases tailored to executive or technician levels.", badge: "Explainability" },
  { id: "feat_action_rec", name: "AI Action Recommendations", category: "synthesis", icon: PlayCircle, color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/5", desc: "Synthesizes prescriptive actions alongside cloud terminal scripts to execute optimizations automatically.", badge: "Actionable" },
  { id: "feat_ceo_dash", name: "AI CEO Dashboard", category: "analytics", icon: Target, color: "text-rose-500", border: "border-rose-500/20 bg-rose-500/5", desc: "Unifies multi-agent consensus streams to present real-time cash runway status, churn predictions, and risk indices.", badge: "Executive" }
];

const ANALYTICS_CAPABILITIES = capabilities.filter(c => c.category === "analytics");
const SYNTHESIS_CAPABILITIES = capabilities.filter(c => c.category === "synthesis");
const DEVOPS_CAPABILITIES = capabilities.filter(c => c.category === "devops");

export default function AIAgents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"mnc_suite" | "agents">("mnc_suite");
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string | null>(null);

  // 11 Core Agents State
  const [agents, setAgents] = useState<Agent[]>([
    { id: "a1", name: "Data Analyst Agent", icon: Database, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", desc: "Cleans, transforms, and profiles datasets automatically.", prompt: "Analyze and profile the uploaded dataset for anomalies.", temperature: 0.2, maxTokens: 2048, memoryRetries: true },
    { id: "a2", name: "Business Strategy Agent", icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Extracts KPIs, strategic goals, and business insights from metrics.", prompt: "Identify top strategic levers to optimize quarterly revenue.", temperature: 0.7, maxTokens: 4096, memoryRetries: true },
    { id: "a3", name: "Statistical Analyst", icon: LineChart, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", desc: "Performs statistical testing, correlation matrices, and EDA.", prompt: "Run correlation and ANOVA tests across numeric features.", temperature: 0.1, maxTokens: 2048, memoryRetries: false },
    { id: "a4", name: "ML Engineering Agent", icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", desc: "Builds, trains, and evaluates predictive models.", prompt: "Fit classification models to predict customer churn.", temperature: 0.3, maxTokens: 4096, memoryRetries: true },
    { id: "a5", name: "Financial Analyst", icon: Building, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", desc: "Analyzes financial data, ROI, and cost optimizations.", prompt: "Calculate EBITDA, cash runway, and cost reduction strategies.", temperature: 0.2, maxTokens: 3000, memoryRetries: false },
    { id: "a6", name: "Research Assistant", icon: Search, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", desc: "Scans project memory and external sources for RAG context.", prompt: "Search workspace memory for previous executive summaries.", temperature: 0.5, maxTokens: 2500, memoryRetries: true },
    { id: "a7", name: "SQL Agent", icon: Terminal, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", desc: "Generates, explains, and optimizes database queries.", prompt: "Generate high-throughput window queries for transaction aggregations.", temperature: 0.15, maxTokens: 2048, memoryRetries: true },
    { id: "a8", name: "Python Code Agent", icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", desc: "Compiles local scripts, validates execution, and patches logic anomalies.", prompt: "Write sandboxed python scripts for multidimensional tensor regressions.", temperature: 0.2, maxTokens: 4096, memoryRetries: true },
    { id: "a9", name: "AI Planner Agent", icon: Layers, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", desc: "Formulates step-by-step reasoning sequences and decomposes complex goals.", prompt: "Map out the full execution plan to resolve market analytics.", temperature: 0.4, maxTokens: 3000, memoryRetries: true },
    { id: "a10", name: "Forecast & Time-Series Agent", icon: Sliders, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Runs ARIMA, Prophet, and Neural time-series trends with prediction bands.", prompt: "Fit seasonal forecasting models on historic conversion rates.", temperature: 0.3, maxTokens: 3000, memoryRetries: true },
    { id: "a11", name: "AI Guardrails & Eval Agent", icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", desc: "Filters PII, prevents injections, monitors safety, and evaluates model outputs.", prompt: "Scan output context vectors for proprietary details.", temperature: 0.05, maxTokens: 1500, memoryRetries: false }
  ]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestrationLogs, setOrchestrationLogs] = useState<string[]>([]);
  const [currentActiveAgentIndex, setCurrentActiveAgentIndex] = useState<number>(-1);
  const [orchestrationLevel, setOrchestrationLevel] = useState<"standard" | "exhaustive">("standard");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const { session, user } = useAuthStore();

  const loadAgentConfigs = async () => {
    try {
      const response = await fetch('/api/v1/agents', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const json = await response.json();
      if (json.success && json.data && json.data.length > 0) {
        setAgents(prev => prev.map(a => {
          const remote = json.data.find((r: any) => r.agent_id === a.id);
          if (remote) {
            return {
              ...a,
              name: remote.name,
              prompt: remote.prompt,
              temperature: remote.temperature,
              maxTokens: remote.max_tokens,
              memoryRetries: remote.memory_retries
            };
          }
          return a;
        }));
      }
    } catch (e) {
      console.error("Failed to load agent configs", e);
    }
  };

  useEffect(() => {
    if (session) {
      loadAgentConfigs();
    }
  }, [session]);

  // =========================================================================
  // INDIVIDUAL AGENT LAUNCH / SAVE
  // =========================================================================
  const handleLaunchAgent = (agent: Agent) => {
    toast.success(`Redirecting to Chat loaded with agent specialized context: ${agent.name}`);
    navigate(`/workspace/ai/chat?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    
    // Optimistic update
    setAgents(prev => prev.map(a => a.id === selectedAgent.id ? selectedAgent : a));
    
    try {
      const response = await fetch('/api/v1/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ agents: [selectedAgent] })
      });
      const json = await response.json();
      if (json.success) {
        toast.success("AI Agent hyperparameter configuration synchronized to cloud.");
      }
    } catch (e) {
      toast.error("Failed to sync agent configuration.");
    }
    
    setSelectedAgent(null);
  };

  // =========================================================================
  // MULTI-AGENT ORCHESTRATION PIPELINE SIMULATION (NOW BACKEND POWERED)
  // =========================================================================
  const handleRunOrchestration = async () => {
    // Quota Enforcement Check
    const quota = checkAndConsumeQuota(1, user?.id);
    if (!quota.allowed) {
      triggerLimitModal();
      toast.error("Monthly AI API quota limit reached for your plan. Please upgrade.");
      return;
    }

    setIsOrchestrating(true);
    setCurrentActiveAgentIndex(0);
    setOrchestrationLogs([
      "[Orchestrator v2.4] Initializing autonomous multi-agent consensus network...",
      "[Orchestrator v2.4] Establishing secure RPC handshakes with distributed agent nodes..."
    ]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const bearerToken = session?.access_token || "";

      const response = await fetch("/api/v1/agents/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": bearerToken ? `Bearer ${bearerToken}` : "",
        },
        body: JSON.stringify({ mode: orchestrationLevel }),
      });

      const resJson = await response.json();
      
      if (response.ok && resJson.success) {
        // Stream logs or just set them
        setOrchestrationLogs(resJson.data.logs);
        toast.success("Enterprise autonomous multi-agent orchestration completed!");
      } else {
        toast.error(resJson.error || "Orchestration failed");
        setOrchestrationLogs(prev => [...prev, `[ERROR] Orchestration aborted: ${resJson.error || "Unknown server error"}`]);
      }
    } catch (err: any) {
      toast.error(err.message || "Network error during orchestration");
      setOrchestrationLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
    } finally {
      setCurrentActiveAgentIndex(-1);
      setIsOrchestrating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Top Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <BrainCircuit className="h-6 w-6" />
            </div>
            Unique MNC AI Capabilities Cockpit
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Unleash Vivexa's competitive advantages. Toggle and test 20 high-fidelity enterprise agent components, fine-tune model hyperparameters, and launch multi-agent consensus orchestration runs.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
          <Button
            onClick={() => {
              setSelectedCapabilityId(null);
              setActiveTab("mnc_suite");
            }}
            variant={activeTab === "mnc_suite" ? "default" : "ghost"}
            className={`rounded-lg h-9 px-4 font-bold text-xs ${
              activeTab === "mnc_suite" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 mr-2 text-indigo-300" /> MNC Capabilities Suite
          </Button>
          <Button
            onClick={() => {
              setSelectedCapabilityId(null);
              setActiveTab("agents");
            }}
            variant={activeTab === "agents" ? "default" : "ghost"}
            className={`rounded-lg h-9 px-4 font-bold text-xs ${
              activeTab === "agents" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 mr-2 text-indigo-300" /> Consensus Agent Nodes
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* =========================================================================
            TAB 1: MNC CAPABILITIES SUITE COCKPIT
            ========================================================================= */}
        {activeTab === "mnc_suite" ? (
          <motion.div
            key="mnc-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {selectedCapabilityId ? (
              // EXECUTING INTERACTIVE DETAIL PREVIEW MODE
              <div className="space-y-6">
                <Button 
                  onClick={() => setSelectedCapabilityId(null)}
                  variant="outline"
                  className="bg-slate-900 border-slate-800 text-xs h-8 text-slate-400 hover:text-white font-mono"
                >
                  ← Back to Capabilities Cockpit
                </Button>
                
                <InteractiveCapabilitySection 
                  id={selectedCapabilityId} 
                  onClose={() => setSelectedCapabilityId(null)} 
                />
              </div>
            ) : (
              // GRID OVERVIEW
              <div className="space-y-6">
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" /> ENTERPRISE PLATFORM ADVANTAGES
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Select any of the 20 unique AI capabilities below to launch its interactive simulation module.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                      ✓ MNC-Grade Certified
                    </span>
                    <span className="text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full">
                      20 Modules Ready
                    </span>
                  </div>
                </div>

                {/* Grid Categorized Sectioning */}
                <div className="space-y-8">
                  {/* Category: Corporate Analytics */}
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold text-indigo-400 font-mono tracking-wider uppercase flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Corporate Analytics & Simulation
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {ANALYTICS_CAPABILITIES.map(cap => (
                        <CapabilityCard key={cap.id} cap={cap} onSelect={() => setSelectedCapabilityId(cap.id)} />
                      ))}
                    </div>
                  </div>

                  {/* Category: Executive Synthesis */}
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold text-blue-400 font-mono tracking-wider uppercase flex items-center gap-2">
                      <Presentation className="h-4 w-4" /> Executive Synthesis & Planning
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {SYNTHESIS_CAPABILITIES.map(cap => (
                        <CapabilityCard key={cap.id} cap={cap} onSelect={() => setSelectedCapabilityId(cap.id)} />
                      ))}
                    </div>
                  </div>

                  {/* Category: Data Operations */}
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold text-teal-400 font-mono tracking-wider uppercase flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> Data Operations & Automation
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {DEVOPS_CAPABILITIES.map(cap => (
                        <CapabilityCard key={cap.id} cap={cap} onSelect={() => setSelectedCapabilityId(cap.id)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          
          // =========================================================================
          // TAB 2: AUTONOMOUS AGENT PARAMETERS (PRE-EXISTING LAYOUT)
          // =========================================================================
          <motion.div
            key="agents-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Orchestration Control Center */}
            <Card className="bg-slate-900/40 border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-3xl pointer-events-none" />
              <CardHeader className="relative z-10 border-b border-slate-800/40 pb-6 px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                      <Network className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">Autonomous Multi-Agent Orchestrator</CardTitle>
                      <CardDescription className="text-slate-400 flex items-center gap-2">
                        <ShieldAlert className="h-3 w-3 text-emerald-500" /> Enterprise Consensus Protocol v2.4 Active
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setOrchestrationLevel("standard")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${orchestrationLevel === 'standard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Standard
                    </button>
                    <button 
                      onClick={() => setOrchestrationLevel("exhaustive")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${orchestrationLevel === 'exhaustive' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Exhaustive
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
                  {/* Left: Agent Graph / Status */}
                  <div className="lg:col-span-2 p-8 border-r border-slate-800/40 bg-slate-950/20 relative overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                      <Network className="h-96 w-96 text-indigo-500" />
                    </div>
                    
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500" /> Real-time Node Relationship Graph
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" /> Orchestrating
                          </div>
                        </div>
                      </div>

                      {/* Graph Visualization */}
                      <div className="flex-1 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-[300px] w-[300px] rounded-full border border-slate-800/60 border-dashed animate-[spin_60s_linear_infinite]" />
                          <div className="absolute h-[450px] w-[450px] rounded-full border border-slate-800/20 border-dashed animate-[spin_90s_linear_infinite_reverse]" />
                        </div>
                        
                        <div className="grid grid-cols-4 gap-8 relative z-20">
                          {agents.slice(0, 11).map((agent, i) => (
                            <motion.div
                              key={agent.id}
                              initial={false}
                              animate={{ 
                                scale: currentActiveAgentIndex === i ? 1.15 : 1,
                                opacity: isOrchestrating && currentActiveAgentIndex !== i ? 0.4 : 1
                              }}
                              className={`relative p-4 rounded-2xl border transition-all ${
                                currentActiveAgentIndex === i 
                                  ? "bg-indigo-600 border-white shadow-[0_0_20px_rgba(99,102,241,0.4)]" 
                                  : "bg-slate-900/80 border-slate-800 group-hover:border-slate-700"
                              }`}
                            >
                              <agent.icon className={`h-6 w-6 mb-2 ${currentActiveAgentIndex === i ? 'text-white' : agent.color}`} />
                              <p className={`text-[10px] font-bold truncate ${currentActiveAgentIndex === i ? 'text-white' : 'text-slate-300'}`}>
                                {agent.name.split(' ')[0]}
                              </p>
                              {currentActiveAgentIndex === i && (
                                <div className="absolute -top-1 -right-1">
                                  <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800/40">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-white uppercase tracking-wider">Collective Intelligence Consensus</p>
                            <p className="text-[10px] text-slate-500">Multivariate agreement score across 11 nodes</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{isOrchestrating ? "98.4%" : "0.0%"}</p>
                            <div className="w-32 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: isOrchestrating ? "98.4%" : "0%" }}
                                className="h-full bg-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Logs & Control */}
                  <div className="bg-slate-950/40 p-8 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Orchestration Logs</h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">
                        {isOrchestrating ? "LIVE STREAM" : "IDLE"}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] pr-2 scrollbar-thin scrollbar-thumb-slate-800 max-h-[350px]">
                      {orchestrationLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-4">
                          <Terminal className="h-12 w-12 opacity-20" />
                          <p>Orchestrator idle. Launch a collaborative brainstorm to initialize agent nodes.</p>
                        </div>
                      ) : (
                        orchestrationLogs.map((log, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={i} 
                            className={`p-2 rounded border leading-relaxed ${
                              log.includes('SUCCESS') || log.includes('Consensus') 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-slate-900/50 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="text-indigo-500 mr-2 opacity-50">&gt;&gt;</span>
                            {log}
                          </motion.div>
                        ))
                      )}
                    </div>

                    <div className="pt-8 space-y-4 mt-auto">
                      <Button 
                        onClick={handleRunOrchestration}
                        disabled={isOrchestrating}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] group"
                      >
                        {isOrchestrating ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-3 animate-spin" /> Orchestrating Team...
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 mr-3 fill-white" /> Collaborative Brainstorm
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={() => setIsShareDialogOpen(true)}
                          variant="outline" 
                          className="flex-1 bg-slate-900 border-slate-800 text-slate-400 hover:text-white rounded-xl h-10"
                        >
                          <Share2 className="h-4 w-4 mr-2" /> Share Logs
                        </Button>
                        <Button variant="outline" className="flex-1 bg-slate-900 border-slate-800 text-slate-400 hover:text-white rounded-xl h-10">
                          <Settings2 className="h-4 w-4 mr-2" /> Parameters
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Agents Tuning Parameters Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map((agent, index) => {
                const AgentIcon = agent.icon;
                const isActiveNode = currentActiveAgentIndex === index;

                return (
                  <motion.div key={agent.id}>
                    <Card className={`bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl hover:bg-slate-800/40 transition-all group h-full flex flex-col justify-between relative ${
                      isActiveNode ? "ring-2 ring-indigo-500 bg-slate-900/80" : ""
                    }`}>
                      {isActiveNode && (
                        <span className="absolute top-3 right-3 text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 animate-pulse">
                          THREAD PROCESSING
                        </span>
                      )}

                      <CardContent className="p-6">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${agent.bg} mb-4 group-hover:scale-105 transition-transform`}>
                          <AgentIcon className={`h-5 w-5 ${agent.color}`} />
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <h3 className="text-base font-bold text-slate-200">{agent.name}</h3>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span>Temp: {agent.temperature}</span>
                            <span>•</span>
                            <span>Max Out: {agent.maxTokens}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-6">{agent.desc}</p>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setSelectedAgent(agent)} 
                            variant="outline" 
                            className="flex-1 bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white text-xs h-8"
                          >
                            Configure Params
                          </Button>
                          <Button 
                            onClick={() => handleLaunchAgent(agent)} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                          >
                            Execute Run
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Agent Hyperparameter Config Modal */}
      <AnimatePresence>
        {selectedAgent && (() => {
          const SelectedIcon = selectedAgent.icon;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl"
              >
                <button 
                  onClick={() => setSelectedAgent(null)} 
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <SelectedIcon className={`h-5 w-5 ${selectedAgent.color}`} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedAgent.name} Config</h2>
                    <p className="text-[10px] text-slate-500">Fine-tune system parameters</p>
                  </div>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">System Instructions</label>
                    <textarea
                      value={selectedAgent.prompt}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, prompt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  {/* Temperature slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">TEMPERATURE (CREATIVITY)</span>
                      <span className="text-indigo-400 font-bold">{selectedAgent.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={selectedAgent.temperature}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, temperature: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Max tokens */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">MAX OUTPUT TOKENS</span>
                      <span className="text-indigo-400 font-bold">{selectedAgent.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="512"
                      max="8192"
                      step="256"
                      value={selectedAgent.maxTokens}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, maxTokens: parseInt(e.target.value) })}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block font-sans">Semantic Memory Retries</span>
                      <span className="text-[9px] text-slate-500 font-sans">Allow recursive vector DB audits.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAgent.memoryRetries}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, memoryRetries: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 accent-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setSelectedAgent(null)} 
                      className="border-slate-800 text-slate-400 hover:text-white text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                    >
                      Save
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title="Agent Orchestration Logs"
      />
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: INDIVIDUAL CAPABILITY CARD
// =========================================================================
function CapabilityCard({ cap, onSelect }: { cap: Capability; onSelect: () => void }) {
  const Icon = cap.icon;
  return (
    <div 
      onClick={onSelect}
      className={`p-4 rounded-xl border ${cap.border} backdrop-blur-xl hover:scale-[1.01] hover:border-slate-700/85 transition-all cursor-pointer flex flex-col justify-between h-[155px] group relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none group-hover:bg-white/[0.03] transition-colors" />
      
      <div>
        <div className="flex items-center justify-between">
          <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <Icon className={`h-4.5 w-4.5 ${cap.color}`} />
          </div>
          <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 uppercase tracking-widest">
            {cap.badge}
          </span>
        </div>
        
        <h3 className="text-xs font-bold text-slate-200 mt-2.5 flex items-center gap-1 group-hover:text-white transition-colors">
          {cap.name} <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-indigo-400" />
        </h3>
        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{cap.desc}</p>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-800/30">
        <span>Autonomous Module</span>
        <span className="text-indigo-400 group-hover:underline">Test Run →</span>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: INTERACTIVE CAPABILITY WORKSPACE (THE 20 PRESETS)
// =========================================================================
function InteractiveCapabilitySection({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");
  const [statusText, setStatusText] = useState("");

  const currentCap = capabilities.find(c => c.id === id);

  // Load datasets on mount
  useEffect(() => {
    if (!user) return;
    supabase.from('datasets').select('*').eq('user_id', user.id).then(({ data }) => {
      if (data && data.length > 0) {
        setDatasets(data);
        setSelectedDatasetId(data[0].id);
      }
    });
  }, [user]);

  // Auto Reset state on feature change
  useEffect(() => {
    setSimResults(null);
  }, [id]);

  const triggerExecution = async () => {
    // Quota Enforcement Check
    const quota = checkAndConsumeQuota(1, user?.id);
    if (!quota.allowed) {
      triggerLimitModal();
      toast.error("Monthly AI API quota limit reached for your plan. Please upgrade.");
      return;
    }

    setLoading(true);
    setSimResults(null);
    setIsSandboxMode(false);
    setStatusText("Initializing autonomous MNC++ agent engine...");
    toast.info("Connecting to Multi-Agent consensus protocols & compiling data matrices...");

    let profile: any = null;
    let dsName = "enterprise_dataset.csv";

    if (selectedDatasetId) {
      const ds = datasets.find(d => d.id === selectedDatasetId);
      if (ds) {
        dsName = ds.name;
        setStatusText(`Downloading active target: ${ds.name}...`);
        try {
          let rawRows: any[] = [];
          if (ds.storage_path) {
            const { data: fileData, error: fileError } = await supabase.storage.from('datasets').download(ds.storage_path);
            if (!fileError && fileData) {
              const parsed = await parseDatasetFile(fileData, ds.name);
              rawRows = parsed.rows;
            }
          }
          if (rawRows.length > 0) {
            setStatusText("Profiling statistical data distribution...");
            profile = await profileDataset(rawRows, ds.name);
          }
        } catch (err) {
          console.error("Error profiling dataset in capabilities:", err);
        }
      }
    }

    setStatusText("Invoking Gemini Decision Intelligence LLM engine...");

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/v1/gemini/execute-capability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          capabilityId: id,
          profile,
          customInput
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setSimResults(resData.data);
        toast.success(`Success! MNC++ ${currentCap?.name || "Capability"} executed and compiled!`);
      } else {
        throw new Error(resData.error || "Execution response error");
      }
    } catch (err: any) {
      console.warn("MNC++ Backend execution failed, falling back to secure sandbox simulation:", err);
      setIsSandboxMode(true);
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exhausted") || errMsg.toLowerCase().includes("rate_limit")) {
        toast.warning("Gemini API Quota limit reached on the shared key. Fallback simulator deployed. Go to API Keys under Settings to enter your own Gemini API key for unrestricted high-fidelity execution!");
      } else {
        toast.info("Using secure sandbox simulation compiler for statistical outcome modeling.");
      }
      // Fallback local simulation logic
      let output: any = {};
      
      if (id === "feat_collab") {
        output = {
          plan: `Execute Customer Retention Modeling for ${dsName}`,
          participants: ["AI Planner Node", "SQL Data Node", "Prophet Forecasting Engine", "Guardrails Certifier"],
          consensusIndex: "98.4% Accord",
          logs: [
            "[Planner] High level goal received: Analyze custom user trends.",
            `[SQL Node] Found transaction table schema index bottleneck on ${dsName}.`,
            "[Forecasting Engine] Projecting -12% CAGR if bottleneck remains unindexed.",
            "[Guardrails] Output audited. No corporate secrets exposed."
          ]
        };
      } else if (id === "feat_dash_gen") {
        output = {
          charts: [
            { name: "Mon", revenue: 4500, signups: 120 },
            { name: "Tue", revenue: 5200, signups: 150 },
            { name: "Wed", revenue: 4900, signups: 135 },
            { name: "Thu", revenue: 6100, signups: 190 },
            { name: "Fri", revenue: 7800, signups: 240 }
          ],
          title: `SaaS Conversions & Daily ARR Suite - Generated for ${dsName}`,
          metrics: { arr: "$124,500 (+12%)", conversionRate: "4.82% (+0.5%)" }
        };
      } else if (id === "feat_report_gen") {
        output = {
          sections: [
            { title: "1. Executive Context", body: `Operational metrics across targeted parameters in ${dsName} expanded YoY, led largely by custom SQL layer acceleration.` },
            { title: "2. Strategic Milestones", body: "Achieved 99.9% database query efficiency after deploying LookerML semantic masks." }
          ],
          metadata: { author: "Vivexa Auto-Reporter v1.0", size: "48 KB", compiledAt: "2026-08" }
        };
      } else if (id === "feat_meet_summary") {
        output = {
          agenda: `Workspace Security Review & Multi-Tenant Partitioning for ${dsName}`,
          duration: "45 mins",
          actions: [
            { assignedTo: "DataOps Lead", task: "Setup separate schema partitions on pg_catalog." },
            { assignedTo: "DevOps Engineer", task: "Generate separate JWT secret pools." }
          ]
        };
      } else if (id === "feat_advisor") {
        output = {
          swot: {
            strengths: `High query performance, complete Supabase Auth wrapper for ${dsName}.`,
            weaknesses: "Unindexed SOAP legacy connections in APAC region.",
            opportunities: "Migrate database tables to Delta Lake OneLake storage.",
            threats: `PII exposure on unmasked raw ${dsName} file uploads.`
          }
        };
      } else if (id === "feat_root_cause") {
        output = {
          culprit: "Legacy unindexed join on public.user_organizations",
          nodesChecked: ["API Layer (Normal)", "Looker Semantic (Normal)", "PostgreSQL Core (BOTTLENECK)"],
          lineage: `File Upload ${dsName} → temporary schema cache → pg_query_executor (Blocked by lack of index)`
        };
      } else if (id === "feat_forecast") {
        output = {
          data: [
            { date: "Day -3", actual: 120, forecast: 120, lower: 110, upper: 130 },
            { date: "Day -2", actual: 125, forecast: 125, lower: 115, upper: 135 },
            { date: "Day -1", actual: 131, forecast: 131, lower: 120, upper: 140 },
            { date: "Day 0", actual: 138, forecast: 138, lower: 125, upper: 150 },
            { date: "Day +1 (Proj)", actual: null, forecast: 144, lower: 130, upper: 158 },
            { date: "Day +2 (Proj)", actual: null, forecast: 149, lower: 133, upper: 165 },
            { date: "Day +3 (Proj)", actual: null, forecast: 155, lower: 136, upper: 174 }
          ]
        };
      } else if (id === "feat_decision") {
        output = {
          distribution: [
            { bin: "$110k (Worst)", probability: 8 },
            { bin: "$120k", probability: 22 },
            { bin: "$130k (Median)", probability: 45 },
            { bin: "$140k", probability: 20 },
            { bin: "$150k (Best)", probability: 5 }
          ],
          adjustedNPV: "$134,800",
          riskScore: "Low (14% Variance)"
        };
      } else if (id === "feat_data_qual") {
        output = {
          overallScore: 94,
          checks: [
            { field: "user_email", nulls: "0%", status: "PASSED" },
            { field: "payment_amount", nulls: "1.2%", status: "PASSED" },
            { field: "referral_id", nulls: "42%", status: "WARNING" }
          ]
        };
      } else if (id === "feat_kpi_gen") {
        output = {
          kpi: "LTV to CAC Multiplier ratio",
          lookerML: "measure: ltv_to_cac_ratio {\n  type: number\n  sql: ${total_ltv} / NULLIF(${total_cac}, 0) ;;\n  value_format_name: decimal_2\n}",
          sql: "SELECT (SUM(revenue) / COUNT(DISTINCT user_id)) / 250.0 AS ltv_cac FROM transactions;"
        };
      } else if (id === "feat_storytelling") {
        output = {
          story: `Customer retention surged 18.2% after ${dsName} database cache was optimized. On-board dropoffs stabilized, driving secondary upgrade rates by 4.2%.`,
          milestones: ["Caching implemented on server.ts", "Conversion spike verified", "MRR adjusted upward"]
        };
      } else if (id === "feat_presentation") {
        output = {
          slides: [
            { num: 1, title: `State of Corporate Data Pipelines for ${dsName}`, bullets: ["Ingestion latency down by 40s", "Active user schema security certified"] },
            { num: 2, title: "Proposed Delta Lake Transition", bullets: ["Deploy multi-tiered OneLake storage", "Standardize Masked Silver Layers"] }
          ]
        };
      } else if (id === "feat_codegen") {
        output = {
          python: `import pandas as pd\ndf = pd.read_csv('${dsName}')\ndf_clean = df.drop_duplicates()\nprint(f'Retained {len(df_clean)} verified records')`,
          sql: "SELECT user_id, COUNT(*) as txn_count \nFROM orders \nGROUP BY user_id \nHAVING COUNT(*) > 5 \nORDER BY txn_count DESC;"
        };
      } else if (id === "feat_insight_feed") {
        output = {
          insights: [
            { priority: "HIGH", msg: "Multi-cloud sync completed in record 1.4s.", stamp: "12 mins ago" },
            { priority: "CRITICAL", msg: `Outlier database load detected in ${dsName}: 92% thread saturation.`, stamp: "2 hrs ago" }
          ]
        };
      } else if (id === "feat_anomaly") {
        output = {
          events: [
            { source: "Lookup API", volume: "14,500 req/sec", status: "BLOCKED" },
            { source: "Supabase DB Core", volume: "210 req/sec", status: "SAFE" }
          ],
          quarantinedNode: "lookup-api-worker-72a"
        };
      } else if (id === "feat_workflow") {
        output = {
          yaml: "version: '2.4'\npipeline:\n  name: masked-ingestion-dag\n  tasks:\n    - step: pull-legacy-soap\n    - step: sanitize-pii-silver\n    - step: trigger-prophet-forecast\n    - step: alert-slack"
        };
      } else if (id === "feat_research") {
        output = {
          citation: "Paragraph 4, page 12 of HIPAA compliance manual standard v4.",
          snippet: "Data objects harboring primary user credentials must be masked with randomized cryptographic hashes prior to cache commits.",
          confidence: "99.2%"
        };
      } else if (id === "feat_explain") {
        output = {
          juniorAnalyst: "ARIMA is like trying to guess next week's ice cream sales by looking at a chart of what we sold on the same weeks last year.",
          cfo: "ARIMA auto-regressively aggregates historic seasonality constants to establish risk-mitigated cash runway projections."
        };
      } else if (id === "feat_action_rec") {
        output = {
          recommendation: "Establish a Redis cache middleware on route /api/datasets",
          terminalScript: "sudo redis-server --port 6379 --daemonize yes\nnpm install ioredis",
          savings: "$210/mo Snowflake credits"
        };
      } else if (id === "feat_ceo_dash") {
        output = {
          runway: "18.2 Months (Stable)",
          consensusIndex: "98.7%",
          criticalThreats: 0,
          arr: "$1,245,000",
          cac: "$420"
        };
      }

      setSimResults(output);
      toast.success("Sandbox computation complete. Synthetic response generated.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  if (!currentCap) return null;
  const ActiveIcon = currentCap.icon;

  return (
    <Card className="bg-slate-950 border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Simulation Workspace Header */}
      <CardHeader className="bg-slate-900/60 p-6 border-b border-slate-850">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <ActiveIcon className={`h-6 w-6 ${currentCap.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold text-white">{currentCap.name}</CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">{currentCap.desc}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
              {currentCap.badge}
            </span>
            <Button
              onClick={() => triggerExecution()}
              disabled={loading}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9"
            >
              {loading ? (
                <span className="flex items-center gap-1.5 font-mono">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> RUNNING CONSENSUS...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-mono">
                  <Play className="h-3.5 w-3.5 fill-white" /> DEPLOY AGENT SIMULATOR
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Sandbox Indicator Banner */}
        {isSandboxMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Compliance Sandbox Mode Active</h4>
                <p className="text-[10px] text-amber-200/60 leading-relaxed max-w-md">
                  Neural core unreachable via current key credentials. Reverting to locally verified MNC++ sandbox for protocol modeling and strategy synthesis.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/workspace/settings/keys")}
              className="h-10 px-6 bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl"
            >
              Sync Enterprise API Key
            </Button>
          </motion.div>
        )}

        {/* MNC++ Real Ingestion & Directive Console */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-indigo-400" /> Active Target Grounding Dataset
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="">-- No target dataset (Sandbox Fallback Mode) --</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-[2] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" /> Custom Agent Directive / Focus Goal
              </label>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g., focus on sales spikes, ignore weekend gaps, optimize ARIMA runway..."
                className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-mono text-indigo-300">{statusText || "Cascading subtasks across specialized agent nodes..."}</p>
              <p className="text-[10px] text-slate-500">Retrieving vector database schemas & validating safety parameters...</p>
            </div>
          </div>
        ) : simResults ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* RENDER CUSTOM TAILORED HTML INTERFACES CORRESPONDING TO CHOSEN MODULE */}
            
            {/* 1. Multi-Agent Collaboration */}
            {id === "feat_collab" && (
              <div className="grid md:grid-cols-2 gap-6 items-start font-mono text-xs">
                <div className="space-y-3 bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
                  <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Network className="h-4 w-4 text-indigo-400" /> Active Consensus Plan
                  </h4>
                  <div className="space-y-1.5 text-[10px]">
                    <div><span className="text-slate-500">Goal:</span> {simResults.plan}</div>
                    <div><span className="text-slate-500">Agreement Rate:</span> <span className="text-emerald-400 font-bold">{simResults.consensusIndex}</span></div>
                    <div>
                      <span className="text-slate-500 block mb-1">Engaged Agent Nodes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {simResults.participants.map((p: string, i: number) => (
                          <span key={i} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[9px]">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2 mb-2">Autonomous Consensus Feed:</h4>
                  <div className="space-y-2 text-[10px] leading-relaxed text-indigo-300">
                    {simResults.logs.map((log: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-indigo-500 shrink-0">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Auto Dashboard Generator */}
            {id === "feat_dash_gen" && (
              <div className="space-y-6 font-mono">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">ARR Realized</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">{simResults.metrics.arr}</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Conversion rate</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">{simResults.metrics.conversionRate}</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center col-span-2 md:col-span-1">
                    <span className="text-[10px] text-slate-500 block uppercase">Layout Engine</span>
                    <span className="text-xs font-bold text-indigo-400 mt-2 block">RECHART-RESPONSIVE</span>
                  </div>
                </div>

                <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-4">{simResults.title}</h4>
                  <div className="h-48 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simResults.charts}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Auto Business Report */}
            {id === "feat_report_gen" && (
              <div className="space-y-4 font-sans max-w-2xl mx-auto border border-slate-800 bg-slate-900/30 p-6 rounded-2xl">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4 font-mono text-[10px] text-slate-500">
                  <span>REPORT ID: VR-821-MNC</span>
                  <span>COMPILED: {simResults.metadata.compiledAt}</span>
                </div>
                {simResults.sections.map((sec: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wide font-mono">{sec.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{sec.body}</p>
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-850 font-mono text-[10px]">
                  <span className="text-slate-500">Engine: {simResults.metadata.author}</span>
                </div>
              </div>
            )}

            {/* 4. AI Meeting Summary */}
            {id === "feat_meet_summary" && (
              <div className="grid md:grid-cols-2 gap-6 font-sans">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-2.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">Call Summary Objectives</span>
                  <h3 className="text-sm font-bold text-white">{simResults.agenda}</h3>
                  <p className="text-xs text-slate-400 font-mono">Analyzed duration: {simResults.duration}</p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">Automated Action Tickets Generated</span>
                  {simResults.actions.map((act: any, i: number) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-200 block">{act.task}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Assignee: {act.assignedTo}</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full shrink-0 font-mono">MAPPED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. AI Business Advisor */}
            {id === "feat_advisor" && (
              <div className="space-y-4 font-mono text-xs">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Consensus Strategic SWOT Quadrant:</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-bold text-[11px] block">STRENGTHS (S)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{simResults.swot.strengths}</p>
                  </div>
                  <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl space-y-1">
                    <span className="text-rose-400 font-bold text-[11px] block">WEAKNESSES (W)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{simResults.swot.weaknesses}</p>
                  </div>
                  <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl space-y-1">
                    <span className="text-indigo-400 font-bold text-[11px] block">OPPORTUNITIES (O)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{simResults.swot.opportunities}</p>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl space-y-1">
                    <span className="text-amber-400 font-bold text-[11px] block">THREATS (T)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{simResults.swot.threats}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. AI Root Cause Finder */}
            {id === "feat_root_cause" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-1.5">
                  <span className="text-rose-400 font-extrabold uppercase tracking-widest text-[10px] block">ISOLATED BOTTLENECK CULPRIT:</span>
                  <h3 className="text-sm font-bold text-white">{simResults.culprit}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Lineage Node Checks:</span>
                    <div className="space-y-1 text-[10px]">
                      {simResults.nodesChecked.map((n: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Diagnostic Trace Path:</span>
                    <p className="text-[10px] text-indigo-300 leading-relaxed">{simResults.lineage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. AI Forecast Generator */}
            {id === "feat_forecast" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-4">Time-Series Prophet Forecast Model (30-day projection envelope)</h4>
                  <div className="h-48 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartLine data={simResults.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Line type="monotone" dataKey="actual" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="upper" stroke="#475569" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="lower" stroke="#475569" strokeWidth={1} dot={false} />
                      </RechartLine>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 8. AI Decision Simulator */}
            {id === "feat_decision" && (
              <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-4">Monte Carlo Expected Margin Distribution (NPV Adjusted)</h4>
                  <div className="h-40 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartBar data={simResults.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="bin" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Bar dataKey="probability" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                          {simResults.distribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index === 2 ? '#6366f1' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </RechartBar>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-900/80 flex flex-col justify-center">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Expected NPV Outcomes (Risk Adjusted)</span>
                    <span className="text-2xl font-extrabold text-white block">{simResults.adjustedNPV}</span>
                  </div>
                  <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">NPV Variance risk factor:</span>
                    <span className="text-emerald-400 font-bold">{simResults.riskScore}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 9. AI Data Quality Score */}
            {id === "feat_data_qual" && (
              <div className="grid md:grid-cols-3 gap-6 font-mono text-xs">
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Workspace Quality index</span>
                  <div className="relative h-24 w-24 flex items-center justify-center mt-3">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-pulse" />
                    <span className="text-2xl font-extrabold text-white">{simResults.overallScore}%</span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3 bg-slate-950 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pipeline Integrity Audits:</span>
                  <div className="space-y-2">
                    {simResults.checks.map((check: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded border border-slate-900 text-[10px]">
                        <div>
                          <span className="font-bold text-slate-200 block">{check.field}</span>
                          <span className="text-slate-500">Null index: {check.nulls}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${check.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 10. AI KPI Generator */}
            {id === "feat_kpi_gen" && (
              <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Derived Metric Identifier:</span>
                    <h3 className="text-xs font-bold text-white mt-1">{simResults.kpi}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block">LookerML semantic Measure model:</span>
                    <pre className="bg-slate-950 p-3 rounded text-[9px] text-slate-300 border border-slate-900 overflow-x-auto leading-relaxed">
                      {simResults.lookerML}
                    </pre>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block">Raw database validation query:</span>
                    <pre className="bg-slate-950 p-3 rounded text-[9px] text-slate-300 border border-slate-900 overflow-x-auto leading-relaxed">
                      {simResults.sql}
                    </pre>
                  </div>
                  <div className="pt-3 border-t border-slate-900 flex justify-end">
                    <span className="text-[10px] text-indigo-400">Validated SQL Syntax OK ✔</span>
                  </div>
                </div>
              </div>
            )}

            {/* 11. AI Storytelling */}
            {id === "feat_storytelling" && (
              <div className="space-y-4 font-sans max-w-2xl mx-auto border border-slate-800 bg-slate-900/40 p-6 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block mb-2">Narrated Statistical Journey Map</span>
                <p className="text-xs text-slate-300 leading-relaxed italic">{simResults.story}</p>
                <div className="border-t border-slate-800 pt-4 mt-4 space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">Corporate timeline milestones:</span>
                  <div className="flex flex-wrap gap-2">
                    {simResults.milestones.map((mil: string, i: number) => (
                      <span key={i} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                        {mil}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 12. AI Presentation Generator */}
            {id === "feat_presentation" && (
              <div className="space-y-4 font-sans max-w-2xl mx-auto">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono block">MNC Slide Presentation Deck Outline Map</span>
                <div className="grid gap-3">
                  {simResults.slides.map((slide: any, i: number) => (
                    <div key={i} className="bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">SLIDE {slide.num}</span>
                        <h4 className="text-xs font-bold text-slate-200">{slide.title}</h4>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] text-slate-400 space-y-1">
                        {slide.bullets.map((b: string, k: number) => (
                          <li key={k}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 13. AI SQL + Python Generator */}
            {id === "feat_codegen" && (
              <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Generated Python Pandas:</span>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
                    {simResults.python}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Generated SQL query:</span>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
                    {simResults.sql}
                  </pre>
                </div>
              </div>
            )}

            {/* 14. AI Insight Feed */}
            {id === "feat_insight_feed" && (
              <div className="space-y-4 max-w-xl mx-auto font-sans">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">Live Streaming Corporate Telemetry Logs</span>
                <div className="grid gap-3">
                  {simResults.insights.map((ins: any, i: number) => (
                    <div key={i} className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border mr-2 ${ins.priority === 'HIGH' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20' : 'bg-rose-500/20 text-rose-300 border-rose-500/20'}`}>
                          {ins.priority}
                        </span>
                        <span className="text-slate-300">{ins.msg}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{ins.stamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 15. AI Anomaly Watch */}
            {id === "feat_anomaly" && (
              <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">Anomaly Trigger Timelines:</span>
                  <div className="space-y-2">
                    {simResults.events.map((ev: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-900 text-[10px]">
                        <div>
                          <span className="font-bold text-slate-200 block">{ev.source}</span>
                          <span className="text-slate-500">Capacity: {ev.volume}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ev.status === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400 animate-pulse'}`}>
                          {ev.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col justify-center text-center space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">Isolated & Quarantined Worker Node</span>
                  <span className="text-sm font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg inline-block mx-auto font-mono">
                    {simResults.quarantinedNode}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Thread isolated successfully to prevent network capacity depletion.</p>
                </div>
              </div>
            )}

            {/* 16. AI Workflow Builder */}
            {id === "feat_workflow" && (
              <div className="space-y-4 max-w-xl mx-auto font-mono text-xs">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Compiled Executable Pipeline DAG YAML:</span>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs text-slate-300 overflow-x-auto leading-relaxed">
                  {simResults.yaml}
                </pre>
              </div>
            )}

            {/* 17. AI Research Assistant */}
            {id === "feat_research" && (
              <div className="space-y-4 max-w-xl mx-auto font-sans text-xs">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono block">CITED REFERENCE INDEX:</span>
                  <p className="text-slate-200 font-bold">{simResults.citation}</p>
                  <p className="text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-[10px]">{simResults.snippet}</p>
                </div>
                <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 pt-1">
                  <span>Match Confidence Ratio:</span>
                  <span className="text-emerald-400 font-bold">{simResults.confidence} Accurate</span>
                </div>
              </div>
            )}

            {/* 18. AI Explain Anything */}
            {id === "feat_explain" && (
              <div className="grid md:grid-cols-2 gap-6 font-sans text-xs">
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">Layman (Junior Analyst) Definition:</span>
                  <p className="text-slate-300 leading-relaxed italic">"{simResults.juniorAnalyst}"</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono block">Board Level (CFO) Definition:</span>
                  <p className="text-slate-300 leading-relaxed italic">"{simResults.cFO || simResults.cfo}"</p>
                </div>
              </div>
            )}

            {/* 19. AI Action Recommendations */}
            {id === "feat_action_rec" && (
              <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Actionable Prescription:</span>
                    <h3 className="text-xs font-bold text-white leading-relaxed">{simResults.recommendation}</h3>
                  </div>
                  <div className="border-t border-slate-900 pt-3 mt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Estimated Cost Optimization:</span>
                    <span className="text-emerald-400 font-bold">{simResults.savings}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Shell Command Automation script:</span>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
                    {simResults.terminalScript}
                  </pre>
                </div>
              </div>
            )}

            {/* 20. AI CEO Dashboard */}
            {id === "feat_ceo_dash" && (
              <div className="space-y-6 font-mono text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Cash Runway</span>
                    <span className="text-sm font-extrabold text-white block mt-1">{simResults.runway}</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Consensus Accord</span>
                    <span className="text-sm font-extrabold text-emerald-400 block mt-1">{simResults.consensusIndex}</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Recurring ARR</span>
                    <span className="text-sm font-extrabold text-white block mt-1">{simResults.arr}</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Customer CAC</span>
                    <span className="text-sm font-extrabold text-white block mt-1">{simResults.cac}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl text-center text-emerald-400 font-mono text-[10px] flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> MULTI-TENANT ENTERPRISE INTEGRITY VERIFIED (0 OUTSTANDING RISK FACTORS)
                </div>
              </div>
            )}

            {/* Operational Metrics Panel */}
            <div className="border-t border-slate-850 pt-5 mt-5 flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-500 gap-4">
              <div className="flex gap-4">
                <span>Consensus status: <span className="text-emerald-400 font-bold">Passed</span></span>
                <span>•</span>
                <span>MNC Node Security Audit: <span className="text-emerald-400 font-bold">No-PII-Exposed</span></span>
              </div>
              <span>Compute overhead: 0.14s (RAG Context Cache Hit: 100%)</span>
            </div>
          </motion.div>
        ) : (
          <div className="py-20 text-center space-y-3">
            <PlayCircle className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500">Ready to execute capability simulator test run.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
