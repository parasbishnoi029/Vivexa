import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Search, Filter, Sparkles, MoreVertical, 
  Trash2, Copy, Layers, Activity, Share2,
  Package, Globe, Shield, Tag, Star, ChevronRight,
  Download, Zap, Boxes, Target, Cpu, LayoutDashboard,
  Code2, Terminal, Network, Database, CheckCircle2,
  X, ExternalLink, ArrowRight, Play, Eye, Upload,
  SlidersHorizontal, RefreshCw, FileText, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { useNavigate } from "react-router-dom";

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: "Dataset" | "Agent" | "Template" | "Workflow";
  author: string;
  rating: number;
  installs: string;
  price: string;
  tags: string[];
  version: string;
  updatedAt: string;
  targetRoute: string;
  isInstalled?: boolean;
  longDescription: string;
  codeSnippet?: string;
  verified: boolean;
}

const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "item1",
    name: "Global Financial Indicators 2026",
    description: "Curated financial dataset including EBITDA, churn, and ARR benchmarks for Fortune 500 enterprises.",
    longDescription: "The Global Financial Indicators dataset aggregates validated quarterly and annual balance sheets, income statements, and cash flow benchmarks across 500+ global enterprises. Includes standardized currency conversions, inflation indexing, and sector risk factors.",
    category: "Dataset",
    author: "Vivexa Research",
    rating: 4.9,
    installs: "14.2k",
    price: "Enterprise",
    tags: ["Financial", "Benchmarking", "Parquet", "CSV"],
    version: "v3.2.0",
    updatedAt: "2 days ago",
    targetRoute: "/workspace/datasets",
    isInstalled: false,
    verified: true,
    codeSnippet: `import { VivexaData } from '@vivexa/sdk';

const dataset = await VivexaData.load('global_financial_2026');
const ebitdaBySector = await dataset.query()
  .groupBy('sector')
  .avg('ebitda_margin')
  .execute();`
  },
  {
    id: "item2",
    name: "Executive Strategy AI Agent",
    description: "Autonomous agent node specialized in synthesizing board-ready strategy briefings and risk assessments.",
    longDescription: "Engineered on Gemini 2.5 Pro architecture, this agent monitors workspace data pipelines, detects macro margin shifts, and automatically compiles slide-ready executive briefing packages with confidence scoring.",
    category: "Agent",
    author: "AI Core Team",
    rating: 4.8,
    installs: "8.5k",
    price: "Included",
    tags: ["LLM", "Strategy", "Orchestration", "Gemini"],
    version: "v2.1.0",
    updatedAt: "Yesterday",
    targetRoute: "/workspace/agents",
    isInstalled: true,
    verified: true,
    codeSnippet: `const strategyAgent = new VivexaAgent({
  role: 'Executive Briefing Specialist',
  capabilities: ['financial_analysis', 'forecast_synthesis', 'pdf_export'],
  temperature: 0.2
});`
  },
  {
    id: "item3",
    name: "SaaS Operational Cockpit Template",
    description: "High-fidelity Tableau/Looker style executive dashboard template with pre-mapped semantic linkages.",
    longDescription: "Plug-and-play dashboard layout featuring net retention curves, CAC payback breakdown, cohort heatmaps, and churn risk indicators. Designed for executive team presentations.",
    category: "Template",
    author: "Design Studio",
    rating: 4.7,
    installs: "11.1k",
    price: "Free",
    tags: ["Visualization", "SaaS", "Looker", "Dashboard"],
    version: "v1.8.4",
    updatedAt: "3 days ago",
    targetRoute: "/workspace/reports",
    isInstalled: false,
    verified: true,
    codeSnippet: `<VivexaDashboard 
  template="saas_operational_cockpit" 
  dataSource="workspace_default" 
  refreshInterval="30s" 
/>`
  },
  {
    id: "item4",
    name: "Auto-Data Sanitization ETL Pipeline",
    description: "Palantir Foundry style automated data cleansing workflow for multi-source warehouse assets.",
    longDescription: "Automatically identifies missing values, removes duplicates, fixes schema drift, and normalizes date/currency fields across raw incoming streams before loading into Lakehouse delta tables.",
    category: "Workflow",
    author: "Data Engineering",
    rating: 4.9,
    installs: "6.4k",
    price: "Enterprise",
    tags: ["ETL", "Palantir", "Sanitization", "Spark"],
    version: "v4.0.1",
    updatedAt: "5 hours ago",
    targetRoute: "/workspace/automations",
    isInstalled: false,
    verified: true,
    codeSnippet: `export default defineWorkflow({
  name: 'auto_sanitize_warehouse',
  trigger: 'on_file_upload',
  steps: ['schema_validation', 'null_imputation', 'deduplication', 'lakehouse_write']
});`
  },
  {
    id: "item5",
    name: "Predictive Churn & LTV ML Model Pack",
    description: "Pre-trained AutoML model package for early customer churn detection and customer lifetime value estimation.",
    longDescription: "Includes XGBoost and Neural Net ensemble models fine-tuned on B2B SaaS usage behaviors. Outputs risk scores and recommended retention playbooks directly to your CRM.",
    category: "Agent",
    author: "ML Platform Team",
    rating: 4.9,
    installs: "5.1k",
    price: "Enterprise",
    tags: ["AutoML", "Predictive", "Churn", "Python"],
    version: "v1.4.0",
    updatedAt: "1 week ago",
    targetRoute: "/workspace/predictions",
    isInstalled: false,
    verified: true,
    codeSnippet: `from vivexa.ml import PredictiveModelPack

model = PredictiveModelPack.load('churn_ltv_v1')
predictions = model.predict(customer_features_df)`
  },
  {
    id: "item6",
    name: "Global ESG & Sustainability Benchmark",
    description: "Comprehensive ESG metrics covering carbon intensity, board diversity, and governance scores.",
    longDescription: "Third-party audited carbon footprint data, scope 1-3 emission estimates, and governance ratings for major global supply chain networks.",
    category: "Dataset",
    author: "Sustainability Alliance",
    rating: 4.6,
    installs: "3.8k",
    price: "Free",
    tags: ["ESG", "Sustainability", "Audit", "Global"],
    version: "v2.0.0",
    updatedAt: "4 days ago",
    targetRoute: "/workspace/datasets",
    isInstalled: false,
    verified: false,
    codeSnippet: `SELECT company_name, carbon_intensity_score, scope_3_emissions 
FROM esg_sustainability_2026 
WHERE rating >= 'AA';`
  },
  {
    id: "item7",
    name: "Snowflake to Vivexa Real-Time Bridge",
    description: "Zero-copy data sharing bridge syncing Snowflake tables into Vivexa Lakehouse with sub-second latency.",
    longDescription: "Establishes secure, bidirectional zero-copy data sharing between Snowflake warehouse accounts and Vivexa's high-speed columnar memory layer.",
    category: "Workflow",
    author: "Integrations Hub",
    rating: 4.8,
    installs: "9.2k",
    price: "Included",
    tags: ["Snowflake", "Zero-Copy", "Lakehouse", "Sync"],
    version: "v3.1.2",
    updatedAt: "6 days ago",
    targetRoute: "/workspace/connectors",
    isInstalled: true,
    verified: true,
    codeSnippet: `CALL VIVEXA_SYNC_SNOWFLAKE(
  ACCOUNT => 'org_us_east_1',
  DATABASE => 'ANALYTICS_PROD',
  MODE => 'ZERO_COPY_LIVE'
);`
  },
  {
    id: "item8",
    name: "Interactive Notebook Copilot Template",
    description: "Jupyter & Databricks style interactive python/SQL notebook pre-configured with statistical diagnostic tools.",
    longDescription: "Pre-built notebook environment containing statistical distribution calculators, outlier detectors, correlation matrices, and automated chart generation cells.",
    category: "Template",
    author: "Logic Studio",
    rating: 4.9,
    installs: "7.7k",
    price: "Free",
    tags: ["Notebook", "Python", "SQL", "Diagnostics"],
    version: "v1.2.0",
    updatedAt: "3 days ago",
    targetRoute: "/workspace/notebooks",
    isInstalled: false,
    verified: true,
    codeSnippet: `# %python
import vivexa.analytics as va
df = va.read_table('active_dataset')
va.plot_distribution_diagnostics(df, target_col='revenue')`
  }
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Installed" | "Available">("All");
  const [sortBy, setSortBy] = useState<"Popular" | "Rating" | "Newest">("Popular");

  // Modals
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<MarketplaceItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCleanRoomModalOpen, setIsCleanRoomModalOpen] = useState(false);

  // Publish Form State
  const [pubName, setPubName] = useState("");
  const [pubCategory, setPubCategory] = useState<"Dataset" | "Agent" | "Template" | "Workflow">("Dataset");
  const [pubDescription, setPubDescription] = useState("");
  const [pubPrice, setPubPrice] = useState("Free");
  const [pubTags, setPubTags] = useState("");

  // Clean Room Form State
  const [cleanRoomName, setCleanRoomName] = useState("Enterprise Security Clean Room 01");
  const [privacyEpsilon, setPrivacyEpsilon] = useState("0.1");

  // Toggle Install Handler
  const handleToggleInstall = (itemToToggle: MarketplaceItem) => {
    const updatedStatus = !itemToToggle.isInstalled;
    setItems(prev => prev.map(i => i.id === itemToToggle.id ? { ...i, isInstalled: updatedStatus } : i));
    
    if (detailModalItem && detailModalItem.id === itemToToggle.id) {
      setDetailModalItem(prev => prev ? { ...prev, isInstalled: updatedStatus } : null);
    }

    if (updatedStatus) {
      toast.success(`Asset '${itemToToggle.name}' successfully deployed to your workspace!`, {
        action: {
          label: "Launch Asset",
          onClick: () => navigate(itemToToggle.targetRoute)
        }
      });
    } else {
      toast.info(`Asset '${itemToToggle.name}' removed from active workspace.`);
    }
  };

  // Publish Handler
  const handlePublishAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubName.trim() || !pubDescription.trim()) {
      toast.error("Please fill in asset name and description.");
      return;
    }

    const newItem: MarketplaceItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: pubName.trim(),
      description: pubDescription.trim(),
      longDescription: pubDescription.trim() + " Published by enterprise organization member.",
      category: pubCategory,
      author: "Your Organization",
      rating: 5.0,
      installs: "1",
      price: pubPrice,
      tags: pubTags.split(',').map(t => t.trim()).filter(Boolean).concat(["Custom"]),
      version: "v1.0.0",
      updatedAt: "Just now",
      targetRoute: pubCategory === "Dataset" ? "/workspace/datasets" : pubCategory === "Agent" ? "/workspace/agents" : pubCategory === "Template" ? "/workspace/reports" : "/workspace/automations",
      isInstalled: true,
      verified: true,
      codeSnippet: `// Published Asset: ${pubName}\n// Category: ${pubCategory}\nconsole.log('Asset deployed successfully');`
    };

    setItems(prev => [newItem, ...prev]);
    setIsPublishModalOpen(false);
    setPubName("");
    setPubDescription("");
    setPubTags("");
    toast.success(`Asset '${newItem.name}' published to Enterprise Marketplace!`);
  };

  // Filter & Sort Logic
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = activeCategory === "All" || item.category === activeCategory;
    const matchesStatus = statusFilter === "All" || 
                          (statusFilter === "Installed" && item.isInstalled) ||
                          (statusFilter === "Available" && !item.isInstalled);
    return matchesSearch && matchesCat && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "Rating") return b.rating - a.rating;
    if (sortBy === "Newest") return a.updatedAt.localeCompare(b.updatedAt);
    // Default Popular
    const instA = parseFloat(a.installs.replace('k', '')) || 0;
    const instB = parseFloat(b.installs.replace('k', '')) || 0;
    return instB - instA;
  });

  return (
    <div className="space-y-8 relative z-10 w-full max-w-[1500px] mx-auto pb-16 px-4 sm:px-6">
      {/* Hero Banner */}
      <div className="relative rounded-[36px] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-12 lg:p-16 text-left">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900/50 to-emerald-600/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 opacity-10 pointer-events-none">
          <Globe className="h-[450px] w-[450px] text-indigo-400" />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-6 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400"
          >
            <Sparkles className="h-3 w-3 fill-indigo-400" /> Vivexa Enterprise Hub
          </motion.div>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">Data & Agent Marketplace</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
              Discover, deploy, and share verified datasets, autonomous agent blueprints, dashboard templates, and data pipelines across your enterprise organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="relative flex-1 min-w-[280px] max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search datasets, AI agents, workflows, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              onClick={() => setIsPublishModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 h-12 font-bold text-xs uppercase tracking-wider shadow-xl shadow-indigo-600/20 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Publish Custom Asset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">{items.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Listings</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">650 TB</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shared Volume</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">
                {items.filter(i => i.isInstalled).length}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active in Workspace</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {["All", "Dataset", "Agent", "Template", "Workflow"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeCategory === cat 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {cat === "All" && <Boxes className="h-4 w-4" />}
              {cat === "Dataset" && <Database className="h-4 w-4 text-emerald-400" />}
              {cat === "Agent" && <Cpu className="h-4 w-4 text-indigo-400" />}
              {cat === "Template" && <LayoutDashboard className="h-4 w-4 text-amber-400" />}
              {cat === "Workflow" && <Network className="h-4 w-4 text-violet-400" />}
              <span>{cat}s</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold">
            {(["All", "Available", "Installed"] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === status ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="Popular">Sort: Most Popular</option>
            <option value="Rating">Sort: Highest Rated</option>
            <option value="Newest">Sort: Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Snowflake-style Data Clean Rooms Banner */}
      <Card className="bg-emerald-950/20 border-emerald-500/20 rounded-3xl overflow-hidden backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Lock className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="flex-1 space-y-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Secure Enterprise Data Clean Rooms</h3>
              <span className="text-[10px] bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full font-black uppercase">
                Zero-Copy Security
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Collaborate on sensitive datasets across external partners without moving raw records. Differential privacy and secure multi-party computation built-in.
            </p>
          </div>
          <Button 
            onClick={() => setIsCleanRoomModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider h-11 px-6 shrink-0 shadow-lg shadow-emerald-600/20"
          >
            Create Clean Room
          </Button>
        </CardContent>
      </Card>

      {/* Marketplace Catalog Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/40 transition-all rounded-3xl overflow-hidden group flex flex-col justify-between h-full shadow-xl backdrop-blur-xl p-6 space-y-5">
                  <div className="space-y-4">
                    {/* Header bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.category}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{item.author}</span>
                        {item.verified && (
                          <Shield className="h-3 w-3 text-emerald-400 fill-emerald-400/20" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSelectedItem(item); setIsShareDialogOpen(true); }}
                          className="text-slate-500 hover:text-white p-1 transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" /> {item.rating}
                        </div>
                      </div>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 group-hover:scale-105 transition-transform shrink-0">
                        {item.category === "Dataset" && <Database className="h-6 w-6 text-emerald-400" />}
                        {item.category === "Agent" && <Cpu className="h-6 w-6 text-indigo-400" />}
                        {item.category === "Template" && <LayoutDashboard className="h-6 w-6 text-amber-400" />}
                        {item.category === "Workflow" && <Network className="h-6 w-6 text-violet-400" />}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors leading-snug">{item.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 uppercase font-mono font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Action Buttons */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Installs: {item.installs}</span>
                      <span>License: {item.price}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => setDetailModalItem(item)}
                        variant="outline"
                        className="w-1/2 h-9 rounded-xl bg-slate-950 border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-indigo-400" /> Inspect
                      </Button>

                      {item.isInstalled ? (
                        <Button 
                          onClick={() => navigate(item.targetRoute)}
                          className="w-1/2 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 text-[10px] font-bold uppercase tracking-wider"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Active • Open
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleToggleInstall(item)}
                          className="w-1/2 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md shadow-indigo-600/20"
                        >
                          Deploy Asset <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="bg-slate-900/30 border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-4">
          <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto border border-slate-800 text-slate-500">
            <Search className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">No Marketplace Assets Found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">No listings match your search query or filter settings.</p>
          </div>
          <Button 
            onClick={() => { setSearchQuery(""); setActiveCategory("All"); setStatusFilter("All"); }}
            className="h-9 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider"
          >
            Reset Filters
          </Button>
        </Card>
      )}

      {/* INSPECT DETAIL MODAL */}
      <AnimatePresence>
        {detailModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setDetailModalItem(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-950 border border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4 pr-12">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                  {detailModalItem.category === "Dataset" && <Database className="h-8 w-8 text-emerald-400" />}
                  {detailModalItem.category === "Agent" && <Cpu className="h-8 w-8 text-indigo-400" />}
                  {detailModalItem.category === "Template" && <LayoutDashboard className="h-8 w-8 text-amber-400" />}
                  {detailModalItem.category === "Workflow" && <Network className="h-8 w-8 text-violet-400" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{detailModalItem.category}</span>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">• {detailModalItem.author}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{detailModalItem.name}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Version {detailModalItem.version}</span>
                    <span>•</span>
                    <span>Updated {detailModalItem.updatedAt}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                  {detailModalItem.longDescription}
                </p>
              </div>

              {detailModalItem.codeSnippet && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Integration Blueprint</h4>
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl font-mono text-[11px] text-indigo-300 overflow-x-auto">
                    <pre>{detailModalItem.codeSnippet}</pre>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div className="text-xs font-mono text-slate-400">
                  License: <span className="text-white font-bold">{detailModalItem.price}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => setDetailModalItem(null)}
                    variant="outline"
                    className="h-10 rounded-xl bg-slate-950 border-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      handleToggleInstall(detailModalItem);
                      setDetailModalItem(null);
                    }}
                    className={`h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider ${
                      detailModalItem.isInstalled 
                        ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {detailModalItem.isInstalled ? "Uninstall from Workspace" : "Deploy to Workspace"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PUBLISH CUSTOM ASSET MODAL */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-400" /> Publish Custom Asset
                </h3>
                <button onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePublishAsset} className="space-y-4 text-xs font-medium">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Asset Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Q4 Regional Revenue Pipeline" 
                    value={pubName}
                    onChange={(e) => setPubName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Category</label>
                    <select 
                      value={pubCategory}
                      onChange={(e) => setPubCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="Dataset">Dataset</option>
                      <option value="Agent">AI Agent</option>
                      <option value="Template">Template</option>
                      <option value="Workflow">Workflow</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">License / Price</label>
                    <select 
                      value={pubPrice}
                      onChange={(e) => setPubPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="Free">Free</option>
                      <option value="Included">Included in Plan</option>
                      <option value="Enterprise">Enterprise License</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Brief description of what this asset provides..."
                    value={pubDescription}
                    onChange={(e) => setPubDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tags (Comma Separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Financial, Snowflake, Revenue" 
                    value={pubTags}
                    onChange={(e) => setPubTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <Button 
                    type="button" 
                    onClick={() => setIsPublishModalOpen(false)}
                    variant="outline"
                    className="h-10 rounded-xl bg-slate-950 border-slate-800 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider"
                  >
                    Publish Asset
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE CLEAN ROOM MODAL */}
      <AnimatePresence>
        {isCleanRoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-400" /> Create Secure Data Clean Room
                </h3>
                <button onClick={() => setIsCleanRoomModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Clean Room Name</label>
                  <input 
                    type="text" 
                    value={cleanRoomName}
                    onChange={(e) => setCleanRoomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Differential Privacy Threshold (Epsilon ε)</label>
                  <select 
                    value={privacyEpsilon}
                    onChange={(e) => setPrivacyEpsilon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="0.05">Strict (ε = 0.05) - Maximum Anonymization</option>
                    <option value="0.1">Balanced (ε = 0.1) - Enterprise Standard</option>
                    <option value="0.5">Permissive (ε = 0.5) - High Statistical Precision</option>
                  </select>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-[11px] leading-relaxed">
                  🔒 Zero-copy compute allows authorized external partner nodes to run aggregation queries without raw record exposure.
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <Button 
                    onClick={() => setIsCleanRoomModalOpen(false)}
                    variant="outline"
                    className="h-10 rounded-xl bg-slate-950 border-slate-800 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsCleanRoomModalOpen(false);
                      toast.success(`Clean Room '${cleanRoomName}' initialized successfully with ε = ${privacyEpsilon}!`);
                    }}
                    className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider"
                  >
                    Initialize Clean Room
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE DIALOG */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title={selectedItem ? `Listing: ${selectedItem.name}` : "Marketplace Asset"}
      />
    </div>
  );
}
