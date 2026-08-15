import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, Calendar, AlertCircle, AlertTriangle, Play, Loader2, Sparkles, 
  HelpCircle, Copy, Check, Download, History, ChevronRight, Trash2, 
  Layers, Settings, Eye, Info, Database, FileText, CheckCircle2,
  FolderKanban
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { parseDatasetFile } from "@/lib/datasetParser";
import { incrementAiUsage, checkAndConsumeQuota, triggerLimitModal } from "@/lib/limits";
import { 
  ResponsiveContainer, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, Legend, ComposedChart, Line 
} from "recharts";

const container: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Forecasting() {
  const { session, user } = useAuthStore();
  const token = session?.access_token;

  // Workspaces, Projects, and Filters
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isWorkspacesLoading, setIsWorkspacesLoading] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  // Datasets and Columns
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);

  const [columns, setColumns] = useState<string[]>([]);
  const [isColumnsLoading, setIsColumnsLoading] = useState(false);

  // Form selections
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [dateColumn, setDateColumn] = useState<string>("");
  const [horizon, setHorizon] = useState<number>(30);
  const [confidenceInterval, setConfidenceInterval] = useState<number>(95);
  const [modelPreference, setModelPreference] = useState<string>("Auto Model Selector");

  // Operational states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [copiedNotebook, setCopiedNotebook] = useState(false);

  const [showScenario, setShowScenario] = useState(false);
  const [scenarioMultiplier, setScenarioMultiplier] = useState<number>(1.1);
  const [scenarioDescription, setScenarioDescription] = useState<string>("Optimistic Scenario (+10%)");

  // History states
  const [forecastHistory, setForecastHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Load workspaces, projects, datasets, and history
  useEffect(() => {
    async function initPage() {
      await Promise.all([
        loadWorkspaces(),
        loadProjects(),
        loadDatasets(),
        loadForecastHistory()
      ]);
    }
    if (token) {
      initPage();
    }
  }, [token]);

  // Load columns when dataset selection changes
  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetColumns(selectedDatasetId);
    } else {
      setColumns([]);
      setTargetColumn("");
      setDateColumn("");
    }
  }, [selectedDatasetId]);

  async function loadWorkspaces() {
    setIsWorkspacesLoading(true);
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*");
      if (error) throw error;
      setWorkspaces(data || []);
    } catch (err: any) {
      console.error("Error loading workspaces:", err);
    } finally {
      setIsWorkspacesLoading(false);
    }
  }

  async function loadProjects() {
    setIsProjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*");
      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error("Error loading projects:", err);
    } finally {
      setIsProjectsLoading(false);
    }
  }

  async function loadDatasets() {
    setIsDatasetsLoading(true);
    try {
      const res = await fetch("/api/v1/datasets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDatasets(json.data);
      }
    } catch (err: any) {
      console.error("Error loading datasets:", err);
      toast.error("Failed to load your enterprise datasets.");
    } finally {
      setIsDatasetsLoading(false);
    }
  }

  // Filter projects by workspace
  const filteredProjects = useMemo(() => {
    if (selectedWorkspaceId === "all") return projects;
    return projects.filter(p => p.workspace_id === selectedWorkspaceId);
  }, [projects, selectedWorkspaceId]);

  // Filter datasets by workspace and project
  const filteredDatasets = useMemo(() => {
    return datasets.filter(d => {
      // 1. Workspace filter
      if (selectedWorkspaceId !== "all") {
        if (!d.project_id) {
          // Unassigned/global datasets belong to personal/default workspace.
          // Let's assume personal workspaces have owner_id matching the dataset user_id
          const currentPersonalWs = workspaces.find(w => w.is_personal && w.owner_id === d.user_id);
          if (currentPersonalWs && currentPersonalWs.id !== selectedWorkspaceId) {
            return false;
          }
        } else {
          const proj = projects.find(p => p.id === d.project_id);
          if (proj?.workspace_id !== selectedWorkspaceId) return false;
        }
      }

      // 2. Project filter
      if (selectedProjectId !== "all") {
        if (selectedProjectId === "unassigned") {
          if (d.project_id) return false;
        } else {
          if (d.project_id !== selectedProjectId) return false;
        }
      }

      return true;
    });
  }, [datasets, projects, workspaces, selectedWorkspaceId, selectedProjectId]);

  // Auto-select first filtered dataset on filter change
  useEffect(() => {
    if (filteredDatasets.length > 0) {
      const exists = filteredDatasets.some(d => d.id === selectedDatasetId);
      if (!exists) {
        setSelectedDatasetId(filteredDatasets[0].id);
      }
    } else {
      setSelectedDatasetId("");
    }
  }, [filteredDatasets, selectedDatasetId]);

  // Diagnostics for Empty States
  const emptyStateDiagnostic = useMemo(() => {
    if (isDatasetsLoading) return null;
    if (datasets.length === 0) {
      return {
        message: "No datasets found in this workspace.",
        cause: "Please upload a dataset in the Datasets panel first."
      };
    }

    const afterWorkspaceFilter = datasets.filter(d => {
      if (selectedWorkspaceId === "all") return true;
      if (!d.project_id) {
        const currentPersonalWs = workspaces.find(w => w.is_personal && w.owner_id === d.user_id);
        return currentPersonalWs?.id === selectedWorkspaceId;
      }
      const proj = projects.find(p => p.id === d.project_id);
      return proj?.workspace_id === selectedWorkspaceId;
    });

    if (afterWorkspaceFilter.length === 0) {
      return {
        message: "No datasets found in this workspace.",
        cause: `We found ${datasets.length} datasets elsewhere, but none are associated with the selected workspace.`
      };
    }

    const afterProjectFilter = afterWorkspaceFilter.filter(d => {
      if (selectedProjectId === "all") return true;
      if (selectedProjectId === "unassigned") return !d.project_id;
      return d.project_id === selectedProjectId;
    });

    if (afterProjectFilter.length === 0) {
      return {
        message: "No datasets are attached to the selected project.",
        cause: `We found ${afterWorkspaceFilter.length} datasets in this workspace, but none are attached to the selected project.`
      };
    }

    const afterStatusFilter = afterProjectFilter.filter(d => d.status === "ready");
    if (afterStatusFilter.length === 0) {
      return {
        message: "Dataset loading failed.",
        cause: "Your matching datasets are still processing or returned an error status."
      };
    }

    return null;
  }, [datasets, projects, workspaces, selectedWorkspaceId, selectedProjectId, isDatasetsLoading]);

  async function loadForecastHistory() {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/v1/forecast/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setForecastHistory(json.data);
      }
    } catch (err: any) {
      console.error("Error loading forecast history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function loadDatasetColumns(datasetId: string) {
    setIsColumnsLoading(true);
    try {
      let data = datasets.find(d => d.id === datasetId);
      if (!data) {
        const { data: dbData, error } = await supabase.from("datasets").select("*").eq("id", datasetId).single();
        if (error) throw error;
        data = dbData;
      }

      if (data && data.storage_path) {
        const { data: fileData, error: fileError } = await supabase.storage.from("datasets").download(data.storage_path);
        if (fileError) throw fileError;

        const parsed = await parseDatasetFile(fileData, data.name);
        setColumns(parsed.columns);

        // Smart column guesses
        const colTypes = parsed.columnTypes || {};
        const numericCols = Object.keys(colTypes).filter(k => colTypes[k] === "numeric");
        const dateCols = Object.keys(colTypes).filter(k => colTypes[k] === "datetime" || k.toLowerCase().includes("date") || k.toLowerCase().includes("time"));

        if (numericCols.length > 0) {
          setTargetColumn(numericCols[0]);
        } else if (parsed.columns.length > 0) {
          setTargetColumn(parsed.columns[parsed.columns.length - 1]);
        }

        if (dateCols.length > 0) {
          setDateColumn(dateCols[0]);
        } else if (parsed.columns.length > 0) {
          setDateColumn(parsed.columns[0]);
        }
      }
    } catch (err: any) {
      console.error("Error detecting columns:", err);
      toast.error("Failed to auto-discover dataset schema.");
    } finally {
      setIsColumnsLoading(false);
    }
  }

  async function handleGenerateForecast() {
    if (!selectedDatasetId || !targetColumn || !dateColumn) {
      toast.error("Please configure all target, date, and dataset fields.");
      return;
    }

    // Quota Enforcement Check
    const quota = checkAndConsumeQuota(1, user?.id);
    if (!quota.allowed) {
      triggerLimitModal();
      toast.error("Monthly AI API quota limit reached for your plan. Please upgrade.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress("Downloading dataset from secure vault...");
    setForecastResult(null);

    try {
      setTimeout(() => setGenerationProgress("Parsing time-series metadata & checking density..."), 800);
      setTimeout(() => setGenerationProgress("Running advanced anomaly & outlier thresholding..."), 1500);
      setTimeout(() => setGenerationProgress("Training mathematical prediction models (XGBoost/Prophet/Holt-Winters)..."), 2200);
      setTimeout(() => setGenerationProgress("Calculating statistical bounds & error splits..."), 2900);

      const res = await fetch("/api/v1/forecast/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          dataset_id: selectedDatasetId,
          target_column: targetColumn,
          date_column: dateColumn,
          horizon,
          confidence_interval: confidenceInterval,
          model_preference: modelPreference
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setForecastResult(json.data);
        incrementAiUsage(1);
        toast.success(`Success! Generated forecast using ${json.data.model_name}`);
        loadForecastHistory();
      } else {
        throw new Error(json.error || "Failed to generate prediction curves.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Prediction error occurred.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  }

  async function handleDeleteHistory(historyId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/forecast/${historyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Forecast record deleted.");
        setForecastHistory(prev => prev.filter(h => h.id !== historyId));
        if (forecastResult?.id === historyId) {
          setForecastResult(null);
        }
      }
    } catch (err: any) {
      toast.error("Failed to delete history record.");
    }
  }

  const chartData = useMemo(() => {
    if (!forecastResult) return [];

    const hist = forecastResult.historical_values || [];
    const fc = forecastResult.forecast_values || [];

    // Combine history and forecast seamlessly
    const combined = hist.map((h: any) => ({
      date: h.date,
      historical: h.value,
      forecast: null,
      lower: null,
      upper: null
    }));

    // Add forecast starting from the last date
    fc.forEach((f: any) => {
      combined.push({
        date: f.date,
        historical: null,
        forecast: f.value,
        scenarioValue: showScenario ? f.value * scenarioMultiplier : null,
        lower: f.lower,
        upper: f.upper
      });
    });

    // To prevent a visual gap, make the last historical point the first forecast point
    if (hist.length > 0 && fc.length > 0) {
      const lastHist = hist[hist.length - 1];
      const match = combined.find(c => c.date === lastHist.date);
      if (match) {
        match.forecast = lastHist.value;
        match.scenarioValue = showScenario ? lastHist.value : null;
        match.lower = lastHist.value;
        match.upper = lastHist.value;
      }
    }

    // Sort all combined values by date
    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [forecastResult, showScenario, scenarioMultiplier]);

  function handleCopyNotebook() {
    if (!forecastResult?.notebook_code) return;
    navigator.clipboard.writeText(forecastResult.notebook_code);
    setCopiedNotebook(true);
    toast.success("Python replication script copied to clipboard!");
    setTimeout(() => setCopiedNotebook(false), 2000);
  }

  function handleDownloadCSV() {
    if (!forecastResult) return;
    const headers = ["Date", "Type", "Predicted Value", "Lower Limit", "Upper Limit", "Scenario Value"];
    const rows = (forecastResult.forecast_values || []).map((f: any) => {
      const chartPoint = chartData.find(d => d.date === f.date);
      return [
        f.date,
        "Forecast",
        f.value,
        f.lower,
        f.upper,
        chartPoint?.scenarioValue || ""
      ];
    });
    const histRows = (forecastResult.historical_values || []).map((h: any) => [
      h.date,
      "Historical",
      h.value,
      "",
      "",
      ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...histRows.map(e => e.join(",")), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_${forecastResult.dataset_name}_${forecastResult.target_column}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const selectedDatasetName = datasets.find(d => d.id === selectedDatasetId)?.name || "";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 relative z-10 w-full max-w-7xl mx-auto pb-12 text-slate-100">
      
      {/* Dynamic Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Time Series Forecasting Engine
              <span className="text-[10px] font-mono tracking-widest uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Enterprise v3.0
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Deploy mathematical regressions and triple exponential smoothing to historical parameters.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Configurations Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-400" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Workspace Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Workspace Scope
                </label>
                {isWorkspacesLoading ? (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-slate-850 bg-slate-950/40">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <select
                    className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    value={selectedWorkspaceId}
                    onChange={(e) => {
                      setSelectedWorkspaceId(e.target.value);
                      setSelectedProjectId("all"); // Reset project filter when workspace changes
                    }}
                  >
                    <option value="all">All Workspaces</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Project Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                  Project Attachment
                </label>
                {isProjectsLoading ? (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-slate-850 bg-slate-950/40">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <select
                    className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="all">All Projects</option>
                    <option value="unassigned">Unassigned (Global Uploads)</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dataset Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-slate-400" />
                  Source Dataset
                </label>
                {isDatasetsLoading ? (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-slate-850 bg-slate-950/40">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  </div>
                ) : filteredDatasets.length === 0 ? (
                  <div className="text-xs p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-1">
                    <div className="font-semibold text-yellow-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                      {emptyStateDiagnostic?.message || "No datasets found."}
                    </div>
                    <div className="text-slate-400 text-[10px] leading-relaxed">
                      {emptyStateDiagnostic?.cause || "No matching datasets."}
                    </div>
                  </div>
                ) : (
                  <select
                    className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                  >
                    {filteredDatasets.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target Metric Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Target Variable (Value)
                </label>
                {isColumnsLoading ? (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-slate-850 bg-slate-950/40">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <select
                    className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                  >
                    <option value="">-- Choose Column --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Timeline Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date / Timeline Column
                </label>
                {isColumnsLoading ? (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-slate-850 bg-slate-950/40">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <select
                    className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                  >
                    <option value="">-- Choose Column --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Prediction Horizon */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Horizon (Steps Ahead)</span>
                  <span className="text-slate-500 font-mono text-[11px]">{horizon} periods</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                  className="bg-slate-950/60 border-slate-800 h-10 rounded-xl focus-visible:ring-emerald-500/20"
                />
              </div>

              {/* Confidence interval */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confidence Band Width</label>
                <select
                  className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  value={confidenceInterval}
                  onChange={(e) => setConfidenceInterval(Number(e.target.value))}
                >
                  <option value={95}>95% Confidence Bounds</option>
                  <option value={90}>90% Confidence Bounds</option>
                  <option value={80}>80% Confidence Bounds</option>
                </select>
              </div>

              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Algorithm Class</label>
                <select
                  className="w-full h-10 px-3 py-1.5 text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  value={modelPreference}
                  onChange={(e) => setModelPreference(e.target.value)}
                >
                  <option value="Auto Model Selector">Auto Selector (MAPE Evaluation)</option>
                  <option value="Prophet Ensemble">Prophet Fourier Multi-Seasonal</option>
                  <option value="Holt-Winters Seasonal">Holt-Winters Triple Smoothing</option>
                  <option value="Double Exponential Smoothing">Double Smoothing (Holt's Trend)</option>
                  <option value="Linear Regression">Linear Least Squares Trend</option>
                </select>
              </div>

              {/* Trigger Button */}
              <Button 
                onClick={handleGenerateForecast}
                disabled={isGenerating || !selectedDatasetId || !targetColumn || !dateColumn}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white border-0 shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-xl font-semibold mt-4 gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Generate Forecast
                  </>
                )}
              </Button>

              {/* Scenario Analysis Section */}
              <div className="pt-4 mt-2 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Scenario Analysis
                  </label>
                  <button
                    onClick={() => setShowScenario(!showScenario)}
                    className={`h-5 w-9 rounded-full transition-colors relative border ${
                      showScenario ? "bg-emerald-600 border-emerald-500" : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <div className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
                      showScenario ? "left-5" : "left-0.5"
                    }`} />
                  </button>
                </div>

                {showScenario && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Impact Multiplier</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={scenarioMultiplier}
                          onChange={(e) => setScenarioMultiplier(Number(e.target.value))}
                          className="bg-slate-950/60 border-slate-800 h-9 rounded-xl text-xs focus-visible:ring-emerald-500/20"
                        />
                        <span className="text-[10px] font-mono text-emerald-400 whitespace-nowrap">
                          {((scenarioMultiplier - 1) * 100).toFixed(2)}% Shift
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Scenario Context</label>
                      <Input
                        value={scenarioDescription}
                        onChange={(e) => setScenarioDescription(e.target.value)}
                        className="bg-slate-950/60 border-slate-800 h-9 rounded-xl text-xs focus-visible:ring-emerald-500/20"
                        placeholder="e.g. Optimistic Expansion"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      This simulates the impact of specific business events on your baseline prediction curve.
                    </p>
                  </motion.div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Forecast Run History */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="h-4 w-4 text-slate-400" />
                Saved Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-1.5 pb-4 max-h-[280px] overflow-y-auto space-y-1.5">
              {isHistoryLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                </div>
              ) : forecastHistory.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">No previously saved predictions.</p>
              ) : (
                forecastHistory.map((hist) => (
                  <div
                    key={hist.id}
                    onClick={() => setForecastResult(hist)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      forecastResult?.id === hist.id
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-slate-950/20 border-slate-800/50 hover:border-slate-700/60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-slate-200">{hist.target_column}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{hist.dataset_name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {hist.model_name?.split(' ')[0] || "Model"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteHistory(hist.id, e)}
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Dashboard Area */}
        <div className="lg:col-span-3 space-y-6">

          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center backdrop-blur-xl h-[480px] space-y-5"
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Synthesizing Machine Learning Engine</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm">{generationProgress}</p>
                </div>
              </motion.div>
            )}

            {!isGenerating && !forecastResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/30 border border-slate-800/60 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center backdrop-blur-xl h-[480px] text-slate-500"
              >
                <TrendingUp className="h-14 w-14 mb-4 text-slate-600 opacity-40 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-300">Predictive Canvas Ready</h3>
                <p className="text-sm text-slate-400 max-w-md mt-2">
                  Configure your target metric parameters and press <strong className="text-emerald-400">Generate Forecast</strong> to plot trend regressions.
                </p>
              </motion.div>
            )}

            {!isGenerating && forecastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
                    <CardHeader className="py-3">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mathematical Model</CardDescription>
                    </CardHeader>
                    <CardContent className="-mt-1">
                      <div className="text-base font-extrabold text-emerald-400 truncate">{forecastResult.model_name}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
                    <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Abs % Error (MAPE)</CardDescription>
                      <span title="Average absolute percent deviation from actuals" className="cursor-help text-slate-500 hover:text-slate-400">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
                    </CardHeader>
                    <CardContent className="-mt-1">
                      <div className="text-2xl font-black text-white tracking-tight">
                        {forecastResult.mape_error ? `${forecastResult.mape_error}%` : "0.00%"}
                      </div>
                      {forecastResult.mape_error > 50 && (
                        <div className="text-[10px] text-amber-500 mt-1 flex items-center gap-1 font-medium">
                           <AlertTriangle className="h-3 w-3" /> High Error (Data sparse or near zero)
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
                    <CardHeader className="py-3">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Root Mean Squared Error (RMSE)</CardDescription>
                    </CardHeader>
                    <CardContent className="-mt-1">
                      <div className="text-2xl font-black text-white tracking-tight">
                        {forecastResult.rmse_error ? Number(forecastResult.rmse_error).toFixed(4) : "0.00"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
                    <CardHeader className="py-3">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Absolute Error (MAE)</CardDescription>
                    </CardHeader>
                    <CardContent className="-mt-1">
                      <div className="text-2xl font-black text-white tracking-tight">
                        {forecastResult.mae_error ? Number(forecastResult.mae_error).toFixed(4) : "0.00"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Graph Card */}
                <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl overflow-hidden shadow-xl">
                  <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/50">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        Time Series Projection
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                          {forecastResult.horizon} period forecast ({forecastResult.frequency || "Daily"})
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400 mt-1">
                        Historical data vs simulated trend curves with {forecastResult.confidence_interval}% confidence bounds (calculated via normally distributed residual standard errors).
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCSV}
                        className="h-9 border-slate-800 bg-slate-950/40 hover:bg-slate-900 text-xs rounded-xl"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> CSV Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            dx={-10}
                          />
                          <ChartTooltip
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", fontSize: "12px" }}
                            labelClassName="font-bold text-white mb-1"
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                          
                          {/* Confidence Intervals */}
                          <Area
                            name="Confidence Interval"
                            type="monotone"
                            dataKey="upper"
                            stroke="none"
                            fill="url(#colorConfidence)"
                            connectNulls
                          />
                          <Area
                            name="Confidence Limit Lower"
                            type="monotone"
                            dataKey="lower"
                            stroke="none"
                            fill="url(#colorConfidence)"
                            legendType="none"
                            connectNulls
                          />

                          {/* Historical curve */}
                          <Line
                            name="Historical"
                            type="monotone"
                            dataKey="historical"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />

                          {/* Predicted curve */}
                          <Line
                            name="Baseline Forecast"
                            type="monotone"
                            dataKey="forecast"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            connectNulls
                          />

                          {/* Scenario curve */}
                          {showScenario && (
                            <Line
                              name={`Scenario: ${scenarioDescription}`}
                              type="monotone"
                              dataKey="scenarioValue"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              strokeDasharray="2 2"
                              dot={false}
                              connectNulls
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Replication Notebook & Export options */}
                <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-800/50">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-emerald-400" />
                        Replication Code & Model Metadata
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">Export this forecast as a Python Pandas & Statsmodels replication Notebook.</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyNotebook}
                      className="h-9 hover:bg-slate-800 gap-1.5 text-xs text-slate-300 rounded-xl"
                    >
                      {copiedNotebook ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" /> Copy Python Code
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <pre className="text-xs font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-850 overflow-x-auto max-h-[220px] text-slate-300 leading-relaxed scrollbar-thin">
                      {forecastResult.notebook_code || "# No notebook code available"}
                    </pre>
                  </CardContent>
                </Card>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </motion.div>
  );
}
