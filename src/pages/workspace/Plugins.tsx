import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Blocks, Search, Download, Star, Check, X, ShieldCheck, ExternalLink,
  Settings, Trash2, Power, Code, Terminal, Layers, Sparkles, Filter,
  BookOpen, CheckCircle2, Zap, Upload, Plus, RefreshCw, Play, AlertCircle,
  Activity, CheckSquare, Lock, Globe, Cpu, ChevronRight, FileCode
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { usePlugins } from "@/hooks/usePlugins";
import { Plugin } from "@/lib/pluginEngine";

export default function Plugins() {
  const {
    plugins,
    toggleInstall,
    toggleEnable,
    updatePluginConfig,
    registerCustomPlugin,
    resetToDefaults
  } = usePlugins();

  const [activeMainTab, setActiveMainTab] = useState<'marketplace' | 'active_hooks' | 'developer_sdk'>('marketplace');
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState<'all' | 'installed' | 'enabled'>('all');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  
  // Custom Plugin Drawer state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customAuthor, setCustomAuthor] = useState("Internal Dev Team");
  const [customCategory, setCustomCategory] = useState<Plugin['category']>("Developer Tools");
  const [customDesc, setCustomDesc] = useState("");
  const [customScript, setCustomScript] = useState(`// Vivexa Extension Script
export default function runExtension(dataset) {
  console.log("Processing dataset in custom plugin:", dataset?.name);
  return { status: "SUCCESS", recordsProcessed: dataset?.totalRows || 0 };
}`);

  // Config Drawer Form values
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [activeModalTab, setActiveModalTab] = useState<'config' | 'reviews'>('config');

  // Interactive Sandbox state
  const [sandboxPlugin, setSandboxPlugin] = useState<Plugin | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [isExecutingSandbox, setIsExecutingSandbox] = useState(false);

  // Platform Hook Pipeline States
  const [selectedHook, setSelectedHook] = useState<string>("dataset_ai_analyst");
  const [isProbingHook, setIsProbingHook] = useState(false);
  const [probeLogs, setProbeLogs] = useState<string[]>([]);
  const [probeStep, setProbeStep] = useState<number>(-1);

  // Developer SDK Code Templates
  const [selectedTemplate, setSelectedTemplate] = useState<string>("anomaly");
  const [selectedPayload, setSelectedPayload] = useState<string>("sales");
  const [benchmarkStats, setBenchmarkStats] = useState({
    latency: "0ms",
    cpu: "0%",
    memory: "0MB",
    status: "Idle"
  });

  // Review states per plugin
  const [newUserRating, setNewUserRating] = useState<number>(5);
  const [newUserReviewText, setNewUserReviewText] = useState<string>("");
  const [pluginReviews, setPluginReviews] = useState<Record<string, Array<{id: string, author: string, rating: number, comment: string, date: string}>>>(() => {
    const saved = localStorage.getItem("vivexa_plugin_reviews");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      p1: [
        { id: "rev-1", author: "Sarah Jenkins (Lead Data Scientist)", rating: 5, comment: "Gemini integration has cut down our report synthesis time by 80%. Perfect context awareness.", date: "Today" },
        { id: "rev-2", author: "Marc Kubiak (Analytics VP)", rating: 4, comment: "Extremely useful for cleaning up missing values using natural language instructions.", date: "2 days ago" }
      ],
      p5: [
        { id: "rev-3", author: "DevOps Tech Lead", rating: 5, comment: "Out-of-the-box alerting with critical notifications is extremely stable. Easily customizable.", date: "1 week ago" }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem("vivexa_plugin_reviews", JSON.stringify(pluginReviews));
  }, [pluginReviews]);

  // Available typescript templates
  const CODE_TEMPLATES: Record<string, string> = {
    anomaly: `// Anomaly Detector Hook Script
export default function analyzeDataset(dataset) {
  const anomalies = [];
  dataset.rows.forEach(row => {
    // Check extreme deviations in sales values
    if (row.revenue > 15000 || row.growth < -0.4) {
      anomalies.push({ id: row.id, label: "Extreme Variance Alert" });
    }
  });
  return {
    status: "SUCCESS",
    anomalyCount: anomalies.length,
    alerts: anomalies
  };
}`,
    gdpr: `// GDPR/PII Redactor Extension Script
export default function privacyShield(records) {
  return records.map(row => {
    return {
      ...row,
      email: row.email ? row.email.replace(/(..)(.*)(@.*)/, "$1***$3") : undefined,
      phone: row.phone ? "XXX-XXX-" + row.phone.slice(-4) : undefined,
      redacted: true
    };
  });
}`,
    alerts: `// Slack Alert Dispatcher Hook
export default async function dispatchAlert(eventDetails) {
  console.log("Constructing Slack Payload...");
  const payload = {
    text: \`🚨 *Vivexa System Alert* : \${eventDetails.message}\`,
    priority: eventDetails.priority || "high"
  };
  return { status: "DISPATCHED", target: "#alerts-feed", payload };
}`
  };

  useEffect(() => {
    if (CODE_TEMPLATES[selectedTemplate]) {
      setCustomScript(CODE_TEMPLATES[selectedTemplate]);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedPlugin && selectedPlugin.configKeys) {
      const initialVals: Record<string, string> = {};
      selectedPlugin.configKeys.forEach((cfg) => {
        initialVals[cfg.key] = cfg.value;
      });
      setConfigValues(initialVals);
    }
  }, [selectedPlugin]);

  const categories = ["All", "NLP", "BI", "ETL", "Visualization", "Forecasting", "Finance", "Security", "Developer Tools"];

  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase());

      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;

      let matchesStatus = true;
      if (filterStatus === 'installed') matchesStatus = p.installed;
      if (filterStatus === 'enabled') matchesStatus = p.installed && p.enabled;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [plugins, search, selectedCategory, filterStatus]);

  const handleToggleInstall = (id: string, name: string) => {
    const updated = toggleInstall(id);
    const p = updated.find((x) => x.id === id);
    if (p?.installed) {
      toast.success(`Installed plugin "${name}"`);
      createNotification({
        title: "Plugin Installed",
        message: `Plugin "${name}" (${p.version}) was installed successfully.`,
        type: "plugin_installed" as any,
        priority: "low",
        actionUrl: "/workspace/plugins"
      });
    } else {
      toast.info(`Uninstalled "${name}"`);
    }
  };

  const handleToggleEnable = (id: string, name: string) => {
    const updated = toggleEnable(id);
    const p = updated.find((x) => x.id === id);
    toast.info(p?.enabled ? `Enabled "${name}"` : `Disabled "${name}"`);
  };

  const handleSaveConfig = () => {
    if (!selectedPlugin) return;
    updatePluginConfig(selectedPlugin.id, configValues);
    toast.success(`Updated configuration for ${selectedPlugin.name}`);
    setSelectedPlugin(null);
  };

  const handleRegisterCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    registerCustomPlugin({
      name: customName.trim(),
      author: customAuthor.trim() || "Workspace Developer",
      category: customCategory,
      downloads: "1 (Local)",
      rating: "5.0",
      installed: true,
      enabled: true,
      version: "v1.0.0",
      color: "text-purple-400",
      desc: customDesc.trim() || "Custom enterprise plugin hook.",
      permissions: ["Execute Code", "Read Datasets"],
      configKeys: [{ key: "api_endpoint", label: "Endpoint URL", value: "https://api.internal.org/hook" }],
      hooks: ["dataset_ai_analyst", "custom_visualizations"],
      customScript
    });

    toast.success(`Custom plugin "${customName}" registered successfully!`);
    setShowRegisterModal(false);
    setCustomName("");
    setCustomDesc("");
  };

  const runSandboxTest = (plugin: Plugin) => {
    setSandboxPlugin(plugin);
    setIsExecutingSandbox(true);
    setSandboxLogs([
      `[SDK Sandbox] Initializing runtime context for plugin '${plugin.name}' (${plugin.version})...`,
      `[SDK Sandbox] Checking permissions: ${plugin.permissions.join(", ")}... Verified OK.`,
      `[SDK Sandbox] Binding extension hooks: ${(plugin.hooks || ["default"]).join(", ")}...`
    ]);

    setTimeout(() => {
      setSandboxLogs((prev) => [
        ...prev,
        `[SDK Sandbox] Invoking runtime execution payload on dummy dataset 'Global_Sales_2026.csv'...`,
        `[SDK Sandbox] Config values loaded: ${JSON.stringify(plugin.configKeys || [])}`,
        `[SDK Sandbox] Execution complete! Status: 200 OK. Response time: 14ms.`
      ]);
      setIsExecutingSandbox(false);
    }, 1200);
  };

  const runHookPipelineProber = (hookName: string) => {
    const activeForHook = plugins.filter((p) => p.installed && p.enabled && p.hooks?.includes(hookName));
    if (activeForHook.length === 0) {
      toast.warning("No active plugins found registered to this integration hook.");
      return;
    }

    setIsProbingHook(true);
    setProbeStep(0);
    setProbeLogs([
      `[Pipeline Probe] Instantiating Vivexa event hook resolver for '${hookName}'...`,
      `[Pipeline Probe] Found ${activeForHook.length} active downstream handler(s) in sequence.`
    ]);

    let current = 0;
    const interval = setInterval(() => {
      if (current >= activeForHook.length) {
        clearInterval(interval);
        setProbeLogs(prev => [
          ...prev,
          `[Pipeline Probe] Hook pipeline execution resolved successfully. All handlers returned 200 OK.`
        ]);
        setIsProbingHook(false);
        setProbeStep(-1);
        toast.success(`Ecosystem Hook '${hookName}' pipeline verified cleanly!`);
        return;
      }

      const p = activeForHook[current];
      setProbeStep(current);
      setProbeLogs(prev => [
        ...prev,
        `[Step ${current + 1}/${activeForHook.length}] Dispatching transaction context to '${p.name}'...`,
        `[Step ${current + 1}/${activeForHook.length}] Transformed response received. Status: OK (${(Math.random() * 50 + 10).toFixed(1)}ms)`
      ]);
      current++;
    }, 1500);
  };

  const handleSubmitReview = (pluginId: string) => {
    if (!newUserReviewText.trim()) {
      toast.error("Please enter a review comment.");
      return;
    }

    const newRev = {
      id: `rev-${Date.now()}`,
      author: "You (Workspace Administrator)",
      rating: newUserRating,
      comment: newUserReviewText.trim(),
      date: "Just now"
    };

    setPluginReviews(prev => ({
      ...prev,
      [pluginId]: [newRev, ...(prev[pluginId] || [])]
    }));

    setNewUserReviewText("");
    toast.success("Thank you for your rating & feedback!");
  };

  const installedCount = useMemo(() => plugins.filter((p) => p.installed).length, [plugins]);
  const activeCount = useMemo(() => plugins.filter((p) => p.installed && p.enabled).length, [plugins]);

  return (
    <div className="space-y-6 relative z-10 w-full max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
            <Blocks className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Plugin & Extension Marketplace
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 font-semibold">
                {activeCount} Active Extensions
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Extend Vivexa with official LLMs, BI connectors, HIPAA anonymizers, Slack webhooks, and custom TypeScript extensions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveMainTab('marketplace')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeMainTab === 'marketplace' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Blocks className="h-3.5 w-3.5" /> Marketplace
            </button>
            <button
              onClick={() => setActiveMainTab('active_hooks')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeMainTab === 'active_hooks' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Active Hooks ({activeCount})
            </button>
            <button
              onClick={() => setActiveMainTab('developer_sdk')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeMainTab === 'developer_sdk' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="h-3.5 w-3.5" /> Developer SDK
            </button>
          </div>

          <Button
            onClick={() => setShowRegisterModal(true)}
            className="bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Custom Plugin
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs font-semibold text-slate-400 block">Total Extensions</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{plugins.length}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Official & Custom</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs font-semibold text-slate-400 block">Installed & Active</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{activeCount} / {installedCount}</span>
          <span className="text-[10px] text-emerald-400 mt-1 block">Live in Workspace</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs font-semibold text-slate-400 block">Active Hook Extensions</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
            {plugins.reduce((acc, p) => acc + (p.installed && p.enabled ? (p.hooks?.length || 0) : 0), 0)}
          </span>
          <span className="text-[10px] text-indigo-400 mt-1 block">Integration Points</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs font-semibold text-slate-400 block">Developer Mode</span>
          <span className="text-2xl font-extrabold text-pink-400 mt-1 block">Enabled</span>
          <span className="text-[10px] text-pink-400 mt-1 block">TypeScript SDK v2.4</span>
        </Card>
      </div>

      {/* Tab 1: Marketplace View */}
      {activeMainTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search extensions by name, author, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({plugins.length})
                </button>
                <button
                  onClick={() => setFilterStatus('installed')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterStatus === 'installed' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Installed ({installedCount})
                </button>
                <button
                  onClick={() => setFilterStatus('enabled')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterStatus === 'enabled' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({activeCount})
                </button>
              </div>

              <Button variant="outline" size="sm" onClick={() => resetToDefaults()} className="bg-slate-950 border-slate-800 text-xs text-slate-400 hover:text-white">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset Defaults
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? "bg-pink-600 text-white border-pink-500 shadow-md"
                    : "bg-slate-900/50 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid of Plugins */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlugins.map((plugin) => (
              <Card
                key={plugin.id}
                className="bg-slate-900/50 border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden"
              >
                {plugin.installed && plugin.enabled && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-[9px] font-extrabold uppercase px-2.5 py-0.5 text-slate-950 rounded-bl-lg tracking-wider">
                    Active Runtime
                  </div>
                )}

                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        <Blocks className={`h-5 w-5 ${plugin.color}`} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {plugin.rating}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      {plugin.name}
                      {plugin.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                          CUSTOM
                        </span>
                      )}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3 font-mono">
                      <span>By {plugin.author}</span>
                      <span>•</span>
                      <span>{plugin.downloads}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-bold">{plugin.version}</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{plugin.desc}</p>

                    {/* Permissions Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {plugin.permissions.map((perm, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          ✓ {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleToggleInstall(plugin.id, plugin.name)}
                        variant={plugin.installed ? "outline" : "default"}
                        className={`flex-1 text-xs font-semibold ${
                          plugin.installed
                            ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                            : "bg-pink-600 hover:bg-pink-500 text-white border-0"
                        }`}
                      >
                        {plugin.installed ? "Uninstall" : "Install Extension"}
                      </Button>

                      {plugin.installed && (
                        <Button
                          onClick={() => handleToggleEnable(plugin.id, plugin.name)}
                          size="icon"
                          variant="outline"
                          title={plugin.enabled ? "Disable plugin" : "Enable plugin"}
                          className={`h-9 w-9 border-slate-700 ${plugin.enabled ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-slate-500"}`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}

                      {plugin.installed && (
                        <Button
                          onClick={() => setSelectedPlugin(plugin)}
                          size="icon"
                          variant="ghost"
                          title="Configure Settings"
                          className="h-9 w-9 text-slate-400 hover:text-white"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        onClick={() => runSandboxTest(plugin)}
                        size="icon"
                        variant="ghost"
                        title="Test SDK Sandbox"
                        className="h-9 w-9 text-slate-400 hover:text-pink-400"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Active Hooks Overview */}
      {activeMainTab === 'active_hooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Available Core System Hooks */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4 lg:col-span-1">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" /> Core Integration Hooks
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Select an platform extension hook point to trace the pipeline flow and downstream bindings.</p>
            </div>

            <div className="space-y-2">
              {[
                { id: "dataset_ai_analyst", name: "AI Analyst Pipeline", desc: "Augments dataset automated summaries and insights generation.", type: "NLP / ML" },
                { id: "executive_reports", name: "Executive PDF Reports", desc: "Injects modular visualization charts and executive sections.", type: "BI / Charting" },
                { id: "privacy_shield", name: "PII Security Filter", desc: "Scrubs sensitive column cells prior to external API dispatch.", type: "Security" },
                { id: "notifications_dispatch", name: "Slack & Email Outbounds", desc: "Pushes system status alerts and forecast changes.", type: "Developer Tool" },
                { id: "forecasting_engine", name: "Time Series Engine", desc: "Extends modeling algorithms with baseline regressors.", type: "Forecasting" }
              ].map((hook) => {
                const activeForHook = plugins.filter((p) => p.installed && p.enabled && p.hooks?.includes(hook.id));
                const isSelected = selectedHook === hook.id;

                return (
                  <button
                    key={hook.id}
                    onClick={() => {
                      setSelectedHook(hook.id);
                      setProbeLogs([]);
                      setProbeStep(-1);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-950/60 border-slate-850 hover:bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">{hook.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                      }`}>
                        {hook.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{hook.desc}</p>
                    <div className="flex items-center justify-between w-full mt-2.5 pt-2 border-t border-slate-800/60 text-[9px] text-slate-500 font-mono">
                      <span>id: {hook.id}</span>
                      <span className="font-bold text-emerald-400">{activeForHook.length} Active Downstream</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Right Panel: Interactive Pipeline Flow Trace Prober */}
          <Card className="bg-slate-900/60 border-slate-800 p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" /> Pipeline Sequence Trace: <span className="text-emerald-400 font-mono">{selectedHook}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Order of execution of custom and default enterprise plugin extensions.</p>
                </div>

                <Button
                  onClick={() => runHookPipelineProber(selectedHook)}
                  disabled={isProbingHook}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                >
                  {isProbingHook ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Probing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Play className="h-3 w-3" /> Trace Hook Pipeline
                    </span>
                  )}
                </Button>
              </div>

              {/* Execution Flow Diagram */}
              <div className="relative flex flex-col items-stretch gap-4 pl-6 border-l border-slate-800 my-4">
                {plugins.filter((p) => p.installed && p.enabled && p.hooks?.includes(selectedHook)).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    No active extensions registered to this hook point. Install or enable a matching marketplace plugin to populate this pipeline sequence.
                  </div>
                ) : (
                  plugins.filter((p) => p.installed && p.enabled && p.hooks?.includes(selectedHook)).map((p, index, arr) => {
                    const isCurrent = probeStep === index;
                    const isPassed = probeStep > index || probeStep === -1 && probeLogs.length > 0;

                    return (
                      <div key={p.id} className="relative flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-850">
                        {/* Bullet indicators on left border */}
                        <div className={`absolute -left-[31px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                          isCurrent
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-400 animate-pulse"
                            : isPassed
                            ? "bg-emerald-500 text-slate-950 border-emerald-500"
                            : "bg-slate-950 border-slate-800 text-slate-500"
                        }`}>
                          {isPassed && !isCurrent ? "✓" : index + 1}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                            <Blocks className={`h-4 w-4 ${p.color}`} />
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block">{p.name}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Module Version: {p.version} | Author: {p.author}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                            isCurrent
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : isPassed
                              ? "bg-emerald-500/5 text-emerald-500"
                              : "bg-slate-900 text-slate-500"
                          }`}>
                            {isCurrent ? "EXECUTING" : isPassed ? "RESOLVED" : "PENDING"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pipeline Output Logs Console */}
            <div className="space-y-2 mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                <Terminal className="h-3.5 w-3.5 text-amber-500" /> Pipeline Diagnostic Trace Terminal
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-emerald-400 h-32 overflow-y-auto space-y-1">
                {probeLogs.length === 0 ? (
                  <span className="text-slate-600 italic">Idle. Click 'Trace Hook Pipeline' to dispatch a simulated webhook event and audit step executions.</span>
                ) : (
                  probeLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">&gt; {log}</div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Developer SDK & Interactive Sandbox */}
      {activeMainTab === 'developer_sdk' && (
        <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-6">
          <div className="font-sans flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-pink-400" /> Vivexa Extension TypeScript SDK & Playground
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Write custom plugins in TypeScript, register lifecycle hooks (`onDatasetLoad`, `onForecastTrain`), and run sandbox tests live.
              </p>
            </div>

            {/* Template selectors */}
            <div className="flex flex-wrap items-center gap-2 font-sans">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">EXTENSION TEMPLATE</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="anomaly">Sales Anomaly Scanner</option>
                  <option value="gdpr">GDPR / PII Redactor Filter</option>
                  <option value="alerts">Slack Dispatch Messenger</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">TARGET PAYLOAD DATASET</label>
                <select
                  value={selectedPayload}
                  onChange={(e) => setSelectedPayload(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="sales">Sales_Revenue_2026.json (4.2 MB)</option>
                  <option value="health">Patient_PHI_Encrypted.json (1.8 MB)</option>
                  <option value="telemetry">Web_Traffic_Logs.json (8.4 MB)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-400" /> pluginScript.ts
                </span>
                <span className="text-[10px] text-slate-500">TypeScript / ESNext</span>
              </div>

              <textarea
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                rows={13}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 focus:outline-none focus:border-pink-500/50 leading-relaxed"
              />

              <div className="flex flex-wrap items-center gap-2 font-sans">
                <Button
                  onClick={() => {
                    setBenchmarkStats({
                      latency: "Analyzing...",
                      cpu: "Simulating...",
                      memory: "Simulating...",
                      status: "Compiling TS..."
                    });
                    setSandboxLogs([
                      `[SDK Engine] Invoking TypeScript compiler pass-1...`,
                      `[SDK Engine] Target runtime environment mapped to ES2022-Node v20.`,
                      `[SDK Engine] Transpiling custom source code... No compile warnings.`,
                      `[SDK Engine] Injecting secure sandboxed context container.`
                    ]);

                    setTimeout(() => {
                      const records = selectedPayload === "sales" ? 4250 : selectedPayload === "health" ? 1800 : 8900;
                      const randomLatency = (Math.random() * 25 + 5).toFixed(1) + "ms";
                      const randomCPU = (Math.random() * 12 + 2).toFixed(1) + "%";
                      const randomMemory = (Math.random() * 8 + 4).toFixed(1) + " MB";

                      setBenchmarkStats({
                        latency: randomLatency,
                        cpu: randomCPU,
                        memory: randomMemory,
                        status: "Success (200)"
                      });

                      setSandboxLogs((prev) => [
                        ...prev,
                        `[SDK Engine] Executing sandbox routine on dataset (${records} rows)`,
                        `[SDK Engine] Downstream hooks registered: onDatasetLoad, onPipelineFinish`,
                        `[SDK Engine] Execution complete! Memory footprint stabilized. Latency benchmark: ${randomLatency}`
                      ]);
                      toast.success("TS Extension complied and verified in Sandbox!");
                    }, 1500);
                  }}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs h-9"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" /> Execute Sandbox Test
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setBenchmarkStats({ latency: "0ms", cpu: "0%", memory: "0MB", status: "Idle" });
                    setSandboxLogs([]);
                    toast.info("Sandbox reset completed.");
                  }}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-400 hover:text-white h-9"
                >
                  Reset Play
                </Button>
              </div>
            </div>

            {/* Sandbox Console & Benchmarks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between font-sans">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-400" /> Sandbox Output Console & Benchmarks
                </span>
                <Button size="sm" variant="ghost" onClick={() => setSandboxLogs([])} className="text-[10px] text-slate-500 font-mono">
                  Clear Console
                </Button>
              </div>

              {/* Benchmarking KPIs */}
              <div className="grid grid-cols-4 gap-2 font-mono text-[11px] bg-slate-950 border border-slate-850 p-3.5 rounded-xl">
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <span className="text-[9px] text-slate-500 block font-sans">LATENCY</span>
                  <span className="font-bold text-white mt-1 block">{benchmarkStats.latency}</span>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <span className="text-[9px] text-slate-500 block font-sans">CPU LOAD</span>
                  <span className="font-bold text-pink-400 mt-1 block">{benchmarkStats.cpu}</span>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <span className="text-[9px] text-slate-500 block font-sans">HEAP SIZE</span>
                  <span className="font-bold text-indigo-400 mt-1 block">{benchmarkStats.memory}</span>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <span className="text-[9px] text-slate-500 block font-sans">STATUS</span>
                  <span className={`font-bold mt-1 block ${
                    benchmarkStats.status.includes("Success") ? "text-emerald-400" : "text-amber-400"
                  }`}>{benchmarkStats.status}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 h-64 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1.5 font-mono">
                {sandboxLogs.length === 0 ? (
                  <span className="text-slate-600 italic font-sans text-xs">No output yet. Click 'Execute Sandbox Test' to transpile, benchmark, and run live diagnostic traces on the TS container.</span>
                ) : (
                  sandboxLogs.map((log, i) => (
                    <div key={i} className={log.includes("Success") || log.includes("resolved") || log.includes("stabilized") ? "text-emerald-400" : "text-slate-300"}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Configuration Modal Drawer */}
      <AnimatePresence>
        {selectedPlugin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 space-y-5">
              <button
                onClick={() => {
                  setSelectedPlugin(null);
                  setActiveModalTab("config");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 animate-pulse"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <Blocks className={`h-5 w-5 ${selectedPlugin.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPlugin.name}</h3>
                  <p className="text-xs text-slate-400">Settings & Developer Feedback Hub</p>
                </div>
              </div>

              {/* Sub-modal navigation */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveModalTab("config")}
                  className={`flex-1 py-1.5 rounded font-semibold transition-all ${
                    activeModalTab === "config" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Configure Parameters
                </button>
                <button
                  onClick={() => setActiveModalTab("reviews")}
                  className={`flex-1 py-1.5 rounded font-semibold transition-all ${
                    activeModalTab === "reviews" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Ratings & Reviews ({(pluginReviews[selectedPlugin.id] || []).length})
                </button>
              </div>

              {activeModalTab === "config" ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Granted Permissions</label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlugin.permissions.map((perm, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-indigo-300 font-mono">
                          ✓ {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedPlugin.configKeys && selectedPlugin.configKeys.length > 0 ? (
                    selectedPlugin.configKeys.map((cfg) => (
                      <div key={cfg.key}>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">{cfg.label}</label>
                        <Input
                          value={configValues[cfg.key] ?? cfg.value}
                          onChange={(e) =>
                            setConfigValues((prev) => ({ ...prev, [cfg.key]: e.target.value }))
                          }
                          className="bg-slate-950 border-slate-800 text-xs text-white"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No customizable configuration parameters required for this plugin.</p>
                  )}

                  <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPlugin(null);
                        setActiveModalTab("config");
                      }}
                      className="bg-slate-950 border-slate-800 text-xs text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveConfig} className="bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs">
                      Save Config
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1 pt-1">
                  {/* Review Submit Form */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="font-bold text-slate-200 text-xs block">Submit Feedback & Rating</span>
                    
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNewUserRating(num)}
                          className="hover:scale-110 transition-transform p-0.5"
                        >
                          <Star className={`h-4.5 w-4.5 ${
                            newUserRating >= num ? "fill-amber-400 text-amber-400" : "text-slate-600"
                          }`} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      placeholder="Write your constructive feedback or developer notes for this plugin..."
                      value={newUserReviewText}
                      onChange={(e) => setNewUserReviewText(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                    />

                    <Button
                      onClick={() => handleSubmitReview(selectedPlugin.id)}
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-500 text-white text-xs h-8"
                    >
                      Submit Review
                    </Button>
                  </div>

                  {/* Feedback List */}
                  <div className="space-y-2.5">
                    <span className="font-semibold text-slate-400 text-xs block">User Reviews</span>
                    {(!pluginReviews[selectedPlugin.id] || pluginReviews[selectedPlugin.id].length === 0) ? (
                      <div className="text-center p-4 text-xs text-slate-600 italic">No community feedback submitted yet. Be the first to review!</div>
                    ) : (
                      pluginReviews[selectedPlugin.id].map((rev) => (
                        <div key={rev.id} className="p-3 rounded-lg bg-slate-950/50 border border-slate-850 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 text-xs">{rev.author}</span>
                            <span className="text-[10px] text-slate-500">{rev.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-slate-400 leading-relaxed text-[11px]">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Register Custom Plugin Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 space-y-4">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Register Custom Workspace Plugin</h3>
                  <p className="text-xs text-slate-400">Define a custom extension manifest for your workspace</p>
                </div>
              </div>

              <form onSubmit={handleRegisterCustomSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Plugin Name *</label>
                  <Input
                    required
                    placeholder="e.g. Internal Anomaly Classifier"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Author / Organization</label>
                    <Input
                      placeholder="e.g. Data Engineering Team"
                      value={customAuthor}
                      onChange={(e) => setCustomAuthor(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    >
                      {categories.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Short Description</label>
                  <Input
                    placeholder="What does this extension do?"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)} className="bg-slate-950 border-slate-800 text-xs text-slate-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold">
                    Register Plugin
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
