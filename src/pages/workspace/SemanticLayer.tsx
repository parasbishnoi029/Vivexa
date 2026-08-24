import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, Layers, Target, Shield, Activity, 
  Plus, Search, Filter, MoreVertical, Settings2,
  Code2, Share2, Info, ChevronRight, BarChart3,
  Terminal, Zap, Boxes, GitBranch, RefreshCw, Download, Copy, Play, Trash2, Edit3, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { DbtCubeSyncModal } from "@/components/workspace/DbtCubeSyncModal";
import { CreateEditMetricModal, SemanticMetricItem } from "@/components/workspace/CreateEditMetricModal";
import { TestSqlModal } from "@/components/workspace/TestSqlModal";
import { LineageMapModal } from "@/components/workspace/LineageMapModal";
import { ParsedSemanticMetric } from "@/lib/dbtCubeParser";

const INITIAL_ENTERPRISE_METRICS: SemanticMetricItem[] = [
  {
    id: "m-mrr-01",
    name: "Monthly Recurring Revenue (MRR)",
    description: "Normalized monthly subscription revenue excluding one-time professional services.",
    expression: "SUM(monthly_subscription_amount) - SUM(discounts)",
    sql: "SELECT SUM(amount) FROM subscriptions WHERE status = 'active' AND type = 'recurring'",
    type: "Sum",
    category: "Revenue",
    status: "Verified",
    owner: "Finance Data Team",
    lineage: ["Stripe.Invoices", "Salesforce.Contracts", "Lakehouse.Fact_Revenue"]
  },
  {
    id: "m-churn-02",
    name: "Logo Churn Rate",
    description: "Percentage of unique active customer accounts cancelled in the trailing 30 days.",
    expression: "(Cancelled_Customers_30d / Total_Active_Customers_Start_30d) * 100",
    sql: "SELECT (COUNT(CASE WHEN churned_at > CURRENT_DATE - 30 THEN 1 END) / COUNT(CASE WHEN created_at < CURRENT_DATE - 30 THEN 1 END)) * 100 FROM customers",
    type: "Ratio",
    category: "Risk",
    status: "Verified",
    owner: "Customer Success",
    lineage: ["Zendesk.Accounts", "Lakehouse.Dim_Customer"]
  },
  {
    id: "m-cac-03",
    name: "Customer Acquisition Cost (CAC)",
    description: "Fully burdened marketing and sales spend divided by net new logos.",
    expression: "Total_S&M_Spend / Net_New_Logos",
    sql: "SELECT SUM(spend) / COUNT(DISTINCT new_customer_id) FROM marketing_attribution",
    type: "Average",
    category: "Operational",
    status: "Draft",
    owner: "Marketing Analytics",
    lineage: ["GoogleAds.Spend", "LinkedIn.Spend", "HubSpot.Deals"]
  },
  {
    id: "m-nrr-04",
    name: "Net Retention Rate (NRR)",
    description: "Revenue retained from existing customers including expansions, minus downgrades and churn.",
    expression: "(Starting_MRR + Expansion_MRR - Downgrade_MRR - Churn_MRR) / Starting_MRR",
    sql: "SELECT ((sum(start_mrr) + sum(expansion) - sum(downgrade) - sum(churn)) / sum(start_mrr)) * 100 FROM mrr_waterfall",
    type: "Ratio",
    category: "Revenue",
    status: "Verified",
    owner: "Finance Data Team",
    lineage: ["Lakehouse.Fact_MRR_Waterfall"]
  },
  {
    id: "m-dau-05",
    name: "Daily Active Users (DAU)",
    description: "Unique authenticated user sessions performing a core platform action.",
    expression: "COUNT(DISTINCT user_id) WHERE action_type IN ('query', 'view', 'edit')",
    sql: "SELECT COUNT(DISTINCT user_id) FROM events_log WHERE timestamp >= CURRENT_DATE - 1",
    type: "Distinct",
    category: "User Growth",
    status: "Verified",
    owner: "Product Data",
    lineage: ["Mixpanel.Events", "Lakehouse.Fact_Session"]
  }
];

export default function SemanticLayer() {
  const [metrics, setMetrics] = useState<SemanticMetricItem[]>(() => {
    try {
      const saved = localStorage.getItem('vivexa_semantic_metrics');
      return saved ? JSON.parse(saved) : INITIAL_ENTERPRISE_METRICS;
    } catch {
      return INITIAL_ENTERPRISE_METRICS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync with backend API on mount
  useEffect(() => {
    const fetchServerMetrics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/semantic/metrics");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.metrics && data.metrics.length > 0) {
            const mapped: SemanticMetricItem[] = data.metrics.map((m: any) => ({
              id: m.metricId || m.id,
              name: m.name,
              description: m.description,
              expression: m.expression || m.pythonFormula || m.sqlFormula,
              sql: m.sqlFormula || m.sql || m.expression,
              type: m.type || "Sum",
              category: m.category || "Revenue",
              status: m.status || "Verified",
              owner: m.owner || "Enterprise Data Team",
              lineage: m.lineage || ["Lakehouse.Warehouse"]
            }));

            // Merge with local state
            setMetrics(prev => {
              const prevMap = new Map(prev.map(p => [p.id, p]));
              mapped.forEach(m => prevMap.set(m.id, m));
              return Array.from(prevMap.values());
            });
          }
        }
      } catch (err) {
        // Silent fallback to local storage
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerMetrics();
  }, []);

  // Auto-persist local changes
  useEffect(() => {
    localStorage.setItem('vivexa_semantic_metrics', JSON.stringify(metrics));
  }, [metrics]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.expression.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === "All" || m.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [metrics, searchQuery, activeCategory]);

  const [selectedMetric, setSelectedMetric] = useState<SemanticMetricItem | null>(() => metrics[0] || INITIAL_ENTERPRISE_METRICS[0]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDbtSyncOpen, setIsDbtSyncOpen] = useState(false);
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [metricToEdit, setMetricToEdit] = useState<SemanticMetricItem | null>(null);
  const [isTestSqlOpen, setIsTestSqlOpen] = useState(false);
  const [isLineageOpen, setIsLineageOpen] = useState(false);

  // Keep selectedMetric updated if metrics list changes
  useEffect(() => {
    if (selectedMetric) {
      const updated = metrics.find(m => m.id === selectedMetric.id);
      if (updated) setSelectedMetric(updated);
    } else if (metrics.length > 0) {
      setSelectedMetric(metrics[0]);
    }
  }, [metrics]);

  const handleImportMetrics = (newMetrics: ParsedSemanticMetric[]) => {
    const formatted: SemanticMetricItem[] = newMetrics.map(nm => ({
      id: nm.id,
      name: nm.name,
      description: nm.description,
      expression: nm.expression,
      sql: nm.sql,
      type: nm.type,
      category: nm.category as any,
      status: nm.status,
      owner: nm.owner,
      lineage: nm.lineage
    }));

    setMetrics(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const filteredNew = formatted.filter(m => !existingIds.has(m.id));
      return [...filteredNew, ...prev];
    });
    toast.success(`Imported ${newMetrics.length} semantic definitions!`);
  };

  const handleSaveMetric = (savedMetric: SemanticMetricItem) => {
    setMetrics(prev => {
      const exists = prev.some(m => m.id === savedMetric.id);
      if (exists) {
        return prev.map(m => m.id === savedMetric.id ? savedMetric : m);
      } else {
        return [savedMetric, ...prev];
      }
    });
    setSelectedMetric(savedMetric);
  };

  const handleDeleteMetric = (metricId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = metrics.find(m => m.id === metricId);
    if (!target) return;

    if (confirm(`Are you sure you want to remove metric "${target.name}"?`)) {
      setMetrics(prev => prev.filter(m => m.id !== metricId));
      if (selectedMetric?.id === metricId) {
        const remaining = metrics.filter(m => m.id !== metricId);
        setSelectedMetric(remaining.length > 0 ? remaining[0] : null);
      }
      toast.success(`Metric "${target.name}" deleted.`);

      // Sync backend
      fetch(`/api/v1/semantic/metrics/${metricId}`, { method: "DELETE" }).catch(() => {});
    }
  };

  const handlePromotedMetric = (metricId: string) => {
    setMetrics(prev => prev.map(m => m.id === metricId ? { ...m, status: "Verified" } : m));
    if (selectedMetric?.id === metricId) {
      setSelectedMetric(prev => prev ? { ...prev, status: "Verified" } : null);
    }
  };

  const handleExport = async (format: "dbt-yaml" | "cube-schema" | "json") => {
    const toastId = toast.loading(`Generating ${format} manifest...`);
    try {
      const res = await fetch("/api/v1/semantic/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${data.filename}!`, { id: toastId });
      } else {
        toast.error("Export failed.", { id: toastId });
      }
    } catch {
      toast.error("Export failed.", { id: toastId });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 w-full max-w-7xl mx-auto pb-12"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Semantic Intelligence Layer
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                {metrics.length} Definitions
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">The enterprise source of truth for business logic. Define once, deploy everywhere.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            onClick={() => handleExport("dbt-yaml")}
            variant="outline"
            className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" /> Export dbt
          </Button>

          <Button 
            onClick={() => setIsDbtSyncOpen(true)}
            variant="outline" 
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs gap-2"
          >
            <GitBranch className="h-4 w-4 text-orange-400" />
            dbt & Cube.js Sync
          </Button>

          <Button 
            onClick={() => {
              setMetricToEdit(null);
              setIsCreateEditOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5 text-xs shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Metric
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metrics Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search metrics, expressions, or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800/60">
              {["All", "Revenue", "SaaS", "Financial", "User Growth", "Operational", "Risk", "Customer"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredMetrics.map(metric => (
                <motion.div
                  key={metric.id}
                  layout
                  onClick={() => setSelectedMetric(metric)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
                    selectedMetric?.id === metric.id 
                      ? 'bg-slate-900/80 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${metric.status === 'Verified' ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-800 border border-slate-700'}`}>
                        <Target className={`h-6 w-6 ${metric.status === 'Verified' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{metric.name}</h3>
                          {metric.status === 'Verified' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Shield className="h-3 w-3" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{metric.description}</p>
                        
                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Expression:</span>
                            <code className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-indigo-300 border border-slate-800 font-mono">{metric.expression}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Owner:</span>
                            <span className="text-[10px] text-slate-400 font-bold">{metric.owner}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Test SQL Execution"
                        className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMetric(metric);
                          setIsTestSqlOpen(true);
                        }}
                      >
                        <Terminal className="h-4 w-4 text-emerald-400" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Edit Metric"
                        className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMetricToEdit(metric);
                          setIsCreateEditOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Delete Metric"
                        className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                        onClick={(e) => handleDeleteMetric(metric.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Metric Definition Studio */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800/60 rounded-3xl overflow-hidden sticky top-24 shadow-2xl">
            <CardHeader className="border-b border-slate-800/40 p-5 bg-slate-950/20 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-400" /> Intelligence Studio
              </CardTitle>
              {selectedMetric && (
                <span className="text-[10px] font-bold font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {selectedMetric.category}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {selectedMetric ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">{selectedMetric.name}</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-white"
                        onClick={() => {
                          setMetricToEdit(selectedMetric);
                          setIsCreateEditOpen(true);
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{selectedMetric.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Semantic Expression</span>
                        <span className="text-[10px] font-bold text-indigo-400 font-mono">LMR v1.0</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 leading-relaxed">
                        {selectedMetric.expression}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">SQL Projection</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-slate-400 hover:text-white p-0 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMetric.sql || selectedMetric.expression);
                            toast.success("SQL copied to clipboard!");
                          }}
                        >
                          <Copy className="h-3 w-3" /> Copy SQL
                        </Button>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed break-all">
                        {selectedMetric.sql}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Lineage Map</h3>
                      <Button
                        variant="link"
                        onClick={() => setIsLineageOpen(true)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 p-0 h-auto"
                      >
                        Full Graph
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedMetric.lineage.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300 font-mono">{l}</span>
                          {i < selectedMetric.lineage.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Health Validation</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs text-slate-300">Logic Integrity</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          selectedMetric.status === 'Verified' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {selectedMetric.status === 'Verified' ? 'PASSED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs text-slate-300">Active Downstream Consumers</span>
                        </div>
                        <span className="text-xs font-bold text-white">42 Nodes</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/40 grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setIsTestSqlOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold h-10 shadow-lg shadow-indigo-600/20 gap-1.5"
                    >
                      <Terminal className="h-3.5 w-3.5" /> Test SQL & Push
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setMetricToEdit(selectedMetric);
                        setIsCreateEditOpen(true);
                      }}
                      className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs h-10 gap-1.5"
                    >
                      <Settings2 className="h-3.5 w-3.5" /> Fine-tune
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-700">
                    <Layers className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400">Select a metric</p>
                    <p className="text-[11px] text-slate-600 max-w-[200px] mt-1">Audit the semantic lineage and SQL projection models.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-3">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Intelligence Health Validation
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              All metrics marked as <span className="text-emerald-400 font-bold">Verified</span> automatically update AI Agent prompts and Smart Semantic Query Caches instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Ontology Preview Section */}
      <Card className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase text-indigo-400">
                <Zap className="h-3 w-3 fill-indigo-400" /> Universal Semantic Linkage
              </div>
              <h3 className="text-2xl font-bold text-white">Universal Metric Distribution</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Vivexa automatically maps your semantic definitions to downstream assets. Formula changes propagate to 12 active Dashboards, 4 AI Agents, and 8 Scheduled Reports instantly.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">842</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lineage Nodes</span>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">&lt; 10ms</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Cache Latency</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/3 bg-slate-950/50 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardTitle className="text-sm font-bold text-slate-300">Active Propagations</CardTitle>
              {[
                { name: "Executive CRM Dashboard", status: "Synced" },
                { name: "Growth Agent Node #4", status: "Updating" },
                { name: "Q3 Strategy Notebook", status: "Synced" }
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/40 text-[11px]">
                  <span className="text-slate-300">{p.name}</span>
                  <span className={`font-bold ${p.status === "Synced" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
              <Button 
                variant="link" 
                onClick={() => setIsLineageOpen(true)}
                className="w-full text-indigo-400 text-xs mt-2"
              >
                View Full Lineage Map
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title={selectedMetric ? `Metric: ${selectedMetric.name}` : "Semantic Layer"}
      />
      
      <DbtCubeSyncModal
        isOpen={isDbtSyncOpen}
        onClose={() => setIsDbtSyncOpen(false)}
        onImportMetrics={handleImportMetrics}
        currentMetrics={metrics as any}
      />

      <CreateEditMetricModal
        isOpen={isCreateEditOpen}
        onClose={() => setIsCreateEditOpen(false)}
        metricToEdit={metricToEdit}
        onSaveMetric={handleSaveMetric}
      />

      <TestSqlModal
        isOpen={isTestSqlOpen}
        onClose={() => setIsTestSqlOpen(false)}
        metric={selectedMetric}
        onPromoted={handlePromotedMetric}
      />

      <LineageMapModal
        isOpen={isLineageOpen}
        onClose={() => setIsLineageOpen(false)}
        metric={selectedMetric}
      />
    </motion.div>
  );
}
