import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, Layers, Target, Shield, Activity, 
  Plus, Search, Filter, MoreVertical, Settings2,
  Code2, Share2, Info, ChevronRight, BarChart3,
  Terminal, Zap, Boxes
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";

interface SemanticMetric {
  id: string;
  name: string;
  description: string;
  expression: string;
  sql: string;
  type: "Sum" | "Count" | "Average" | "Ratio" | "Distinct";
  category: "Revenue" | "User Growth" | "Operational" | "Risk";
  status: "Verified" | "Draft";
  owner: string;
  lineage: string[];
}

const DEFAULT_METRICS: SemanticMetric[] = [
  {
    id: "m1",
    name: "EBITDA Margin",
    description: "Earnings before interest, taxes, depreciation, and amortization relative to total revenue.",
    expression: "sum(ebitda) / sum(revenue)",
    sql: "SELECT SUM(ebitda) / NULLIF(SUM(revenue), 0) FROM enterprise_finance",
    type: "Ratio",
    category: "Revenue",
    status: "Verified",
    owner: "Finance Team",
    lineage: ["p_finance_raw", "v_ebitda_calc"]
  },
  {
    id: "m2",
    name: "Active Retention Rate (ARR)",
    description: "Percentage of unique users who perform a core action at least 3 times in a 30-day window.",
    expression: "count(distinct users) filter (actions >= 3) / total_active_users",
    sql: "SELECT COUNT(DISTINCT user_id) FILTER (WHERE actions >= 3) / total_users FROM app_engagement",
    type: "Ratio",
    category: "User Growth",
    status: "Verified",
    owner: "Growth Dept",
    lineage: ["p_events_raw", "v_user_sessions"]
  },
  {
    id: "m3",
    name: "Customer Acquisition Cost (CAC)",
    description: "Total marketing and sales expenses divided by the number of new customers acquired.",
    expression: "sum(marketing_spend + sales_spend) / count(new_customers)",
    sql: "SELECT (SUM(marketing) + SUM(sales)) / COUNT(customer_id) FROM marketing_crm",
    type: "Average",
    category: "Revenue",
    status: "Verified",
    owner: "Marketing AI",
    lineage: ["p_ads_spend", "p_crm_leads"]
  }
];

export default function SemanticLayer() {
  const [metrics, setMetrics] = useState<SemanticMetric[]>(DEFAULT_METRICS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === "All" || m.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [metrics, searchQuery, activeCategory]);

  const [selectedMetric, setSelectedMetric] = useState<SemanticMetric | null>(DEFAULT_METRICS[0]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

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
            <p className="text-sm text-slate-400 mt-0.5">The source of truth for business logic. Define once, deploy everywhere.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white rounded-xl">
            <Shield className="h-4 w-4 mr-2" /> Governance
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6">
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
              {["All", "Revenue", "User Growth", "Operational", "Risk"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
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
                          {metric.status === 'Verified' && <Shield className="h-3.5 w-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{metric.description}</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Expression:</span>
                            <code className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">{metric.expression}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Owner:</span>
                            <span className="text-[10px] text-slate-400 font-bold">{metric.owner}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                        <Code2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); setIsShareDialogOpen(true); }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
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
            <CardHeader className="border-b border-slate-800/40 p-5 bg-slate-950/20">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-400" /> Intelligence Studio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {selectedMetric ? (
                <div className="space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">{selectedMetric.name}</h2>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{selectedMetric.description}</p>
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
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-500 hover:text-white p-0">Copy SQL</Button>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed break-all">
                        {selectedMetric.sql}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Lineage Map</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedMetric.lineage.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400 font-mono">{l}</span>
                          {i < selectedMetric.lineage.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Governance & Health</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs text-slate-300">Logic Verification</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PASSED</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs text-slate-300">Downstream Usage</span>
                        </div>
                        <span className="text-xs font-bold text-white">42 Consumers</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/40 grid grid-cols-2 gap-3">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold h-10">
                      <Zap className="h-3.5 w-3.5 mr-2" /> Push to Prod
                    </Button>
                    <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs h-10">
                      <Settings2 className="h-3.5 w-3.5 mr-2" /> Fine-tune
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

          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Intelligence Governance
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              All metrics marked as <span className="text-emerald-400 font-bold">Verified</span> have passed autonomous SQL integrity audits and are safe for multi-agent use.
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
                <Zap className="h-3 w-3 fill-indigo-400" /> Semantic Linkage
              </div>
              <h3 className="text-2xl font-bold text-white">Universal Metric Distribution</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Vivexa automatically maps your semantic definitions to downstream assets. Changes to <strong>CAC</strong> logic will propagate to 12 active Dashboards, 4 AI Agents, and 8 Scheduled Reports instantly.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">842</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lineage Nodes</span>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">12s</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Propagation</span>
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
              <Button variant="link" className="w-full text-indigo-400 text-xs mt-2">View Full Lineage Map</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title={selectedMetric ? `Metric: ${selectedMetric.name}` : "Semantic Layer"}
      />
    </motion.div>
  );
}
