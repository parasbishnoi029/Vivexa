import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, Cloud, HardDrive, FileSpreadsheet, CheckCircle2,
  Search, Play, Lock, Clock, Activity, Shield, AlertCircle, Plus, Eye,
  Server, Table, Layers, ArrowUpRight, Zap, Check, FileText,
  Workflow, GitBranch, Box, Boxes, Share2, MoreVertical, Settings2,
  Trash2, RefreshCw, BarChart3, PieChart, LineChart, Cpu, 
  Network, Key, Globe, FileJson, Filter, Sparkles, ChevronRight,
  GitMerge, BookOpen, Fingerprint, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";

interface LakehouseAsset {
  id: string;
  name: string;
  type: "Table" | "View" | "Stream" | "Volume";
  source: "S3" | "BigQuery" | "Snowflake" | "Local";
  format: "Parquet" | "Delta" | "CSV" | "JSON";
  size: string;
  rows: string;
  lastUpdated: string;
  status: "Healthy" | "Stale" | "Error";
  owner: string;
  tags: string[];
}

const DEFAULT_ASSETS: LakehouseAsset[] = [
  {
    id: "a1",
    name: "fact_global_sales_v2",
    type: "Table",
    source: "S3",
    format: "Delta",
    size: "1.2 TB",
    rows: "8.4B",
    lastUpdated: "4m ago",
    status: "Healthy",
    owner: "Revenue Ops",
    tags: ["PII", "Production", "Revenue"]
  },
  {
    id: "a2",
    name: "user_behavior_stream",
    type: "Stream",
    source: "Snowflake",
    format: "JSON",
    size: "840 GB",
    rows: "1.2B/day",
    lastUpdated: "Just now",
    status: "Healthy",
    owner: "Growth Team",
    tags: ["Raw", "Streaming"]
  },
  {
    id: "a3",
    name: "executive_summary_view",
    type: "View",
    source: "BigQuery",
    format: "Delta",
    size: "140 MB",
    rows: "12k",
    lastUpdated: "12h ago",
    status: "Stale",
    owner: "Analytics",
    tags: ["Executive", "Certified"]
  }
];

export default function Lakehouse() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<LakehouseAsset[]>(DEFAULT_ASSETS);
  const [activeTab, setActiveTab] = useState<"catalog" | "lineage" | "storage" | "governance" | "medallion">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<LakehouseAsset | null>(DEFAULT_ASSETS[0]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<"Table" | "View" | "Stream">("Table");
  const [newTableSource, setNewTableSource] = useState<"S3" | "BigQuery" | "Snowflake" | "Local">("S3");
  const [entitlements, setEntitlements] = useState([
    { principal: 'Growth Data Scientist', role: 'READ_ONLY', status: 'Authorized' },
    { principal: 'Revenue Pipeline Service', role: 'READ_WRITE', status: 'Authorized' },
    { principal: 'Executive Dashboard App', role: 'READ_ONLY', status: 'Authorized' }
  ]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  const handleRegisterTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      toast.error("Please provide a valid table asset name");
      return;
    }
    const created: LakehouseAsset = {
      id: "asset_" + Date.now(),
      name: newTableName.toLowerCase().trim().replace(/\s+/g, '_'),
      type: newTableType,
      source: newTableSource,
      format: "Delta",
      size: "450 MB",
      rows: "1.5M",
      lastUpdated: "Just now",
      status: "Healthy",
      owner: "System Admin",
      tags: ["New", "UnityCatalog"]
    };
    setAssets(prev => [created, ...prev]);
    setSelectedAsset(created);
    setNewTableName("");
    setIsRegisterModalOpen(false);
    toast.success(`Successfully registered Unity Catalog asset: ${created.name}`);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* Left Sidebar: Catalog Explorer */}
      <aside className="w-80 flex flex-col gap-4 overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Boxes className="h-4 w-4 text-indigo-400" /> Catalog Fabric
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-slate-500 hover:text-white"
              onClick={() => setIsRegisterModalOpen(true)}
              title="Register New Table Asset"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-2">
          {filteredAssets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`w-full text-left p-3 rounded-xl border transition-all group ${
                selectedAsset?.id === asset.id 
                  ? 'bg-indigo-600/10 border-indigo-500/40' 
                  : 'bg-slate-900/20 border-transparent hover:bg-slate-900/40 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${
                  selectedAsset?.id === asset.id ? 'bg-indigo-600/20 border-indigo-500/40' : 'bg-slate-950 border-slate-800'
                }`}>
                  {asset.type === "Table" && <Table className="h-3.5 w-3.5 text-blue-400" />}
                  {asset.type === "Stream" && <Activity className="h-3.5 w-3.5 text-emerald-400" />}
                  {asset.type === "View" && <Eye className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-xs font-bold truncate transition-colors ${selectedAsset?.id === asset.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {asset.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">{asset.rows} rows • {asset.format}</p>
                </div>
                {asset.status === "Healthy" ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden bg-slate-900/20 border border-slate-800 rounded-[32px] relative shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />
        
        {selectedAsset ? (
          <div className="h-full flex flex-col">
            {/* Asset Header */}
            <header className="p-8 border-b border-slate-800/60 bg-slate-950/20 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-white tracking-tight leading-none">{selectedAsset.name}</h1>
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Production
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                    Owner: <span className="text-indigo-400 font-bold">{selectedAsset.owner}</span> • Last synchronized {selectedAsset.lastUpdated}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-white"
                    onClick={() => setIsShareDialogOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-white"
                    onClick={() => toast.success(`Synchronized metadata log for ${selectedAsset.name}`)}
                    title="Synchronize Metadata"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.info(`Launching Logic Studio for ${selectedAsset.name}`);
                      navigate('/workspace/notebooks');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 px-5 font-bold text-xs gap-2"
                  >
                    <Play className="h-3 w-3 fill-white" /> Query Studio
                  </Button>
                </div>
              </div>

              {/* Tabs Nav */}
              <div className="flex items-center gap-8 mt-8 border-t border-slate-800/40 pt-4">
                {[
                  { id: 'catalog', label: 'Schema', icon: Table },
                  { id: 'medallion', label: 'Medallion', icon: Box },
                  { id: 'lineage', label: 'Lineage', icon: GitBranch },
                  { id: 'governance', label: 'Governance', icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 pb-4 px-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-all relative ${
                      activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </header>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'catalog' && (
                  <motion.div 
                    key="catalog"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Volume', value: selectedAsset.size, icon: Database, color: 'text-blue-400' },
                        { label: 'Row Count', value: selectedAsset.rows, icon: Layers, color: 'text-indigo-400' },
                        { label: 'Data Format', value: selectedAsset.format, icon: FileJson, color: 'text-emerald-400' },
                        { label: 'Cloud Source', value: selectedAsset.source, icon: Cloud, color: 'text-amber-400' }
                      ].map((stat, i) => (
                        <Card key={i} className="bg-slate-950 border-slate-800 rounded-2xl shadow-xl">
                          <CardContent className="p-6 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                              <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <p className="text-xl font-black text-white">{stat.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-500" /> Physical Schema Projection
                      </h3>
                      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 border-b border-slate-800">
                            <tr>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Column</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Type</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Nullable</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {[
                              { name: 'transaction_id', type: 'UUID', null: 'No', desc: 'Primary unique identifier' },
                              { name: 'amount_usd', type: 'DECIMAL(18,2)', null: 'No', desc: 'Normalized gross revenue' },
                              { name: 'customer_fingerprint', type: 'STRING', null: 'Yes', desc: 'Hashed PII identifier' },
                              { name: 'geo_region', type: 'STRING', null: 'No', desc: 'Looker-mapped region ID' },
                              { name: 'event_timestamp', type: 'TIMESTAMP', null: 'No', desc: 'Delta-log partition key' }
                            ].map((col, i) => (
                              <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                                <td className="p-4 font-bold text-white">{col.name}</td>
                                <td className="p-4 font-mono text-indigo-400">{col.type}</td>
                                <td className="p-4 text-slate-400">{col.null}</td>
                                <td className="p-4 text-slate-500 italic">{col.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'lineage' && (
                  <motion.div 
                    key="lineage"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="h-[500px] rounded-3xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center space-y-8"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
                    
                    {/* Simplified Lineage Visualization */}
                    <div className="flex items-center gap-16 relative z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
                          <Cloud className="h-8 w-8 text-slate-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">S3 Raw Source</p>
                      </div>
                      
                      <div className="w-24 h-px bg-gradient-to-r from-slate-800 via-indigo-500 to-slate-800 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-1 rounded bg-indigo-500/20 border border-indigo-500/40">
                          <Zap className="h-3 w-3 text-indigo-400 animate-pulse" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                          <Table className="h-12 w-12 text-indigo-400" />
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">{selectedAsset.name}</p>
                      </div>

                      <div className="w-24 h-px bg-gradient-to-r from-slate-800 via-emerald-500 to-slate-800 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-1 rounded bg-emerald-500/20 border border-emerald-500/40">
                          <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
                          <PieChart className="h-8 w-8 text-emerald-400" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Analytics Dashboard</p>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-800" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Table</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Asset</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Downstream Logic</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'medallion' && (
                  <motion.div 
                    key="medallion"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {['Bronze', 'Silver', 'Gold'].map((stage) => (
                        <div key={stage} className={`p-8 rounded-[32px] border bg-slate-950/40 backdrop-blur-sm relative overflow-hidden group ${
                          stage === 'Gold' ? 'border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]' :
                          stage === 'Silver' ? 'border-slate-400/20' : 'border-rose-900/20'
                        }`}>
                          <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-20 ${
                            stage === 'Gold' ? 'bg-amber-500' :
                            stage === 'Silver' ? 'bg-slate-400' : 'bg-rose-900'
                          }`} />
                          
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-xl font-black tracking-tighter ${
                                stage === 'Gold' ? 'text-amber-400' :
                                stage === 'Silver' ? 'text-slate-300' : 'text-rose-400'
                              }`}>{stage} Stage</h4>
                              {stage === 'Gold' && <Sparkles className="h-5 w-5 text-amber-500" />}
                            </div>
                            
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {stage === 'Bronze' ? 'Raw data ingestion without transformations. Preserves fidelity.' :
                               stage === 'Silver' ? 'Cleaned, joined, and filtered datasets. Ready for broad analytics.' :
                               'Aggregated, high-performance data models for C-Suite dashboards.'}
                            </p>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                <span>Health Score</span>
                                <span>{stage === 'Gold' ? '99.9%' : stage === 'Silver' ? '98.4%' : '92.1%'}</span>
                              </div>
                              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  stage === 'Gold' ? 'bg-amber-500' :
                                  stage === 'Silver' ? 'bg-indigo-500' : 'bg-rose-500'
                                }`} style={{ width: stage === 'Gold' ? '99%' : stage === 'Silver' ? '85%' : '60%' }} />
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toast.info(`Manifest details for ${stage} stage: Parquet SNAPPY format, Delta transaction log v${stage === 'Gold' ? '3.2' : stage === 'Silver' ? '2.1' : '1.0'}.`)}
                              className="w-full bg-slate-950/40 border-slate-800 text-[10px] font-bold uppercase tracking-widest h-10 rounded-xl group-hover:bg-slate-800 transition-colors"
                            >
                              Inspect Manifest
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 rounded-[32px] border border-slate-800 bg-slate-950/20 flex items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          <Network className="h-8 w-8" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white tracking-tight">Multi-Region Replication</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-md">Delta Sharing protocol automatically synchronizes this asset across us-east-1 and ap-south-1 availability zones.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                              {i === 1 ? 'US' : i === 2 ? 'EU' : 'AP'}
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => toast.success("Multi-Region Replication sync active across US, EU, and AP zones.")}
                          className="text-indigo-400 font-bold text-xs hover:text-indigo-300"
                        >
                          Configure Regions
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'governance' && (
                  <motion.div 
                    key="governance"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <Card className="bg-slate-950 border-slate-800 rounded-3xl overflow-hidden">
                      <CardHeader className="bg-slate-900/50 p-6">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                          <Fingerprint className="h-4 w-4 text-indigo-400" /> Entitlement Registry
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900/20 border-b border-slate-800">
                            <tr>
                              <th className="p-4 font-bold text-slate-500 uppercase">Principal</th>
                              <th className="p-4 font-bold text-slate-500 uppercase">Role</th>
                              <th className="p-4 font-bold text-slate-500 uppercase">Status</th>
                              <th className="p-4 font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {entitlements.map((rule, i) => (
                              <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                                <td className="p-4 font-bold text-white">{rule.principal}</td>
                                <td className="p-4 font-mono text-indigo-400">{rule.role}</td>
                                <td className="p-4">
                                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <Check className="h-3 w-3" /> {rule.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      setEntitlements(prev => prev.filter((_, idx) => idx !== i));
                                      toast.success(`Revoked entitlement for ${rule.principal}`);
                                    }}
                                    className="h-8 text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  >
                                    Revoke
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>

                    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-6">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1 text-left">
                        <h4 className="text-sm font-bold text-white">Row-Level Security Enabled</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          Regional data scientists can only access records matching their assigned region ID. PII columns are automatically masked for all non-admin principals.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => toast.info("Managing Row-Level Security (RLS) & Column PII Masking policy.")}
                        className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-xl text-xs font-bold"
                      >
                        Manage Policy
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
              <div className="relative p-12 rounded-full bg-slate-950 border border-slate-800 shadow-2xl">
                <Network className="h-16 w-16 text-slate-700" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-black text-white">Select a Catalog Asset</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Choose an asset from the Unity Catalog sidebar to explore its schema, track multi-cloud lineage, and manage enterprise-grade governance.
              </p>
            </div>
            <Button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] px-8 h-12 font-bold shadow-xl shadow-indigo-500/20"
            >
              Register New Table
            </Button>
          </div>
        )}
      </main>
      {selectedAsset && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          title={`Lakehouse Asset: ${selectedAsset.name}`}
        />
      )}

      {/* Register New Table Modal */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-indigo-400" /> Register Unity Catalog Table
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleRegisterTable} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Table Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sales_transactions_2026"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
                    <select
                      value={newTableType}
                      onChange={(e) => setNewTableType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Table">Table</option>
                      <option value="View">View</option>
                      <option value="Stream">Stream</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source Provider</label>
                    <select
                      value={newTableSource}
                      onChange={(e) => setNewTableSource(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="S3">AWS S3</option>
                      <option value="BigQuery">Google BigQuery</option>
                      <option value="Snowflake">Snowflake</option>
                      <option value="Local">Local Storage</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-lg shadow-indigo-500/20"
                  >
                    Register Asset
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
