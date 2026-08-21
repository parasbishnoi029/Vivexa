import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, FolderKanban, Database, Bot, MessageSquare,
  Cpu, LineChart, Bookmark, FileText, ScrollText, Network,
  Layers, Boxes, Users, CreditCard, Key, Cable, TerminalSquare,
  Workflow, Blocks, ActivitySquare, ShieldCheck, Globe, HelpCircle,
  BookOpen, Bell, Activity, Search, Sparkles, SlidersHorizontal,
  ArrowUpRight, Star, ExternalLink, Filter, CheckCircle2, Zap,
  TrendingUp, Shield, Lock, HardDrive, Terminal, Play, BookmarkCheck,
  Compass, Eye
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface PlatformFeature {
  id: string;
  title: string;
  category: "Core Operations" | "AI Intelligence" | "Predictions & ML" | "Organisation" | "Platform Ecosystem" | "Help & Resources";
  description: string;
  path: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  highlight?: string;
  capabilities: string[];
  roleRequired?: string;
  isPopular?: boolean;
}

export const ALL_PLATFORM_FEATURES: PlatformFeature[] = [
  // 1. Core Operations (6)
  {
    id: "dashboard",
    title: "System Telemetry & Dashboard",
    category: "Core Operations",
    description: "Live cluster health, throughput bandwidth, and query telemetry indicators.",
    path: "/workspace",
    icon: LayoutDashboard,
    badge: "Telemetry",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Real-time query metrics & telemetry streams",
    capabilities: ["Live cluster metrics", "Audit activity stream", "Quota meters", "Dataset health profiles"],
    isPopular: true
  },
  {
    id: "dashboards-bi",
    title: "BI Dashboards & Canvas Studio",
    category: "Core Operations",
    description: "Self-service business intelligence canvas with custom widgets and virtualized tables.",
    path: "/workspace/dashboards",
    icon: LayoutDashboard,
    badge: "BI Studio",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    highlight: "Natural language queries & live drilldown charts",
    capabilities: ["Interactive cross-filtering", "Formula expressions", "Excel / PPTX / PDF exports", "Custom widgets"],
    isPopular: true
  },
  {
    id: "all-features",
    title: "All Features Directory Hub",
    category: "Core Operations",
    description: "Comprehensive capability directory, search index, and rapid navigation matrix.",
    path: "/workspace/all",
    icon: Compass,
    badge: "All",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Universal platform feature explorer & directory",
    capabilities: ["Categorized capability matrix", "Instant keyword search", "Quick-launch bookmarks", "Deep link index"],
    isPopular: true
  },
  {
    id: "projects",
    title: "Analytical Initiatives & Projects",
    category: "Core Operations",
    description: "Multi-tenant project workspaces, collaborative research logs, and milestone trackers.",
    path: "/workspace/projects",
    icon: FolderKanban,
    badge: "Workspaces",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    highlight: "Collaborative project environments & scoping",
    capabilities: ["Multi-user workspaces", "Project wizard", "Asset linking", "Milestone checkpoints"],
    isPopular: true
  },
  {
    id: "datasets",
    title: "Data Studio & Curation",
    category: "Core Operations",
    description: "Upload, clean, profile, and transform structured tabular and time-series datasets.",
    path: "/workspace/datasets",
    icon: Database,
    badge: "Live",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    highlight: "Statistical data profiler & quality imputation",
    capabilities: ["Automatic schema inference", "Null imputation", "Z-score outlier capping", "Data cleaning recipes"],
    isPopular: true
  },
  {
    id: "lakehouse",
    title: "Vivexa Lakehouse Federation",
    category: "Core Operations",
    description: "Zero-copy query federation across cloud object stores, Delta tables, and Parquet files.",
    path: "/workspace/lakehouse",
    icon: Network,
    badge: "Delta",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    highlight: "Zero-copy distributed query acceleration",
    capabilities: ["Columnar query engine", "Cross-database joins", "Partition pruning", "Schema federation"],
    isPopular: true
  },

  // 2. AI Intelligence (4)
  {
    id: "ai-analyst",
    title: "AI Analyst Studio",
    category: "AI Intelligence",
    description: "Autonomous data scientist agent that generates root-cause analyses and insights.",
    path: "/workspace/ai",
    icon: Bot,
    badge: "AutoML",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    highlight: "Autonomous statistical diagnosis & synthesis",
    capabilities: ["Multi-variate root cause", "Hypothesis testing", "Statistical drift alerts", "Auto-generated summaries"],
    isPopular: true
  },
  {
    id: "ai-chat",
    title: "Conversational Data Chat",
    category: "AI Intelligence",
    description: "Natural language query interface for asking complex analytical questions over your data.",
    path: "/workspace/ai/chat",
    icon: MessageSquare,
    badge: "LLM Agent",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    highlight: "Context-aware dataset interrogation",
    capabilities: ["DuckDB SQL compilation", "Automatic code generation", "Chart generation", "Context memory"],
    isPopular: true
  },
  {
    id: "ai-agents",
    title: "AI Agents Cockpit",
    category: "AI Intelligence",
    description: "Orchestrate multi-agent autonomous analytical pipelines and background monitoring agents.",
    path: "/workspace/agents",
    icon: Cpu,
    badge: "Autonomous",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    highlight: "Autonomous agentic reasoning & execution",
    capabilities: ["Background research agents", "Data reconciliation bots", "Scheduled telemetry monitors", "Execution logs"]
  },
  {
    id: "search-analytics",
    title: "Search Analytics & Vector Logs",
    category: "AI Intelligence",
    description: "Semantic query evaluation, vector embeddings latency, and search quality metrics.",
    path: "/workspace/search",
    icon: Search,
    badge: "Vector Logs",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    highlight: "Search retrieval & index telemetry",
    capabilities: ["Query volume tracking", "Hit-rate evaluation", "Zero-result diagnostics", "Embedding latency"]
  },

  // 3. Predictions & ML (6)
  {
    id: "predictions",
    title: "Supervised ML & Predictions",
    category: "Predictions & ML",
    description: "Train, evaluate, and deploy classification and regression models (XGBoost, Random Forest).",
    path: "/workspace/predictions",
    icon: Activity,
    badge: "XGBoost",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    highlight: "Automated feature engineering & hyperparameter tuning",
    capabilities: ["Feature importance ranking", "ROC-AUC curves", "Confusion matrices", "Batch scoring endpoints"],
    isPopular: true
  },
  {
    id: "forecasting",
    title: "Time-Series Forecasting",
    category: "Predictions & ML",
    description: "Multi-horizon temporal trend projections with seasonality and holiday adjustments.",
    path: "/workspace/forecasting",
    icon: LineChart,
    badge: "Prophet",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    highlight: "Prophet & Neural trajectory models",
    capabilities: ["Confidence bounds (80% / 95%)", "Seasonality decomposition", "Change-point detection", "Export forecasts"],
    isPopular: true
  },
  {
    id: "recommendations",
    title: "Prescriptive Recommendations",
    category: "Predictions & ML",
    description: "AI-generated business action items based on real-time statistical deviations.",
    path: "/workspace/recommendations",
    icon: Bookmark,
    badge: "Insights",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    highlight: "Actionable revenue & operational prescriptions",
    capabilities: ["Impact vs. effort scoring", "One-click execution", "KPI attribution", "Variance warnings"]
  },
  {
    id: "executive-reports",
    title: "Executive Strategic Reports",
    category: "Predictions & ML",
    description: "Generate C-suite ready PowerPoint decks and boardroom PDF documents.",
    path: "/workspace/reports",
    icon: FileText,
    badge: "PPT/PDF",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    highlight: "One-click automated presentation compiler",
    capabilities: ["Custom branding templates", "Slide deck generator", "Chart embeds", "Executive narrative summaries"],
    isPopular: true
  },
  {
    id: "saved-models",
    title: "Model Registry & Endpoints",
    category: "Predictions & ML",
    description: "Manage ML model versions, binary artifact storage, and real-time inference endpoints.",
    path: "/workspace/models",
    icon: Database,
    badge: "MLOps",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Versioned model lifecycle & performance logs",
    capabilities: ["Model versioning", "Latency benchmarking", "Drift detection", "Inference REST API"]
  },
  {
    id: "project-memory",
    title: "Project Memory & Context",
    category: "Predictions & ML",
    description: "Long-term institutional knowledge base and domain business rules for AI models.",
    path: "/workspace/memory",
    icon: ScrollText,
    badge: "Context RAG",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    highlight: "Persistent business logic & glossary",
    capabilities: ["Domain rule definition", "RAG embedding store", "KPI calculation formulas", "Project glossary"]
  },

  // 4. Organisation (6)
  {
    id: "global-search",
    title: "Universal Global Search",
    category: "Organisation",
    description: "Deep index search across all tables, projects, notebooks, reports, and team members.",
    path: "/workspace/global-search",
    icon: Search,
    badge: "Cmd+K",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    highlight: "Universal workspace index & action runner",
    capabilities: ["Instant fuzzy matching", "Type-ahead previews", "Deep metadata indexing", "Keyboard shortcuts"]
  },
  {
    id: "ontology",
    title: "Enterprise Ontology Graph",
    category: "Organisation",
    description: "Interactive knowledge graph connecting entities, datasets, customers, and operations.",
    path: "/workspace/ontology",
    icon: Boxes,
    badge: "Knowledge Graph",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    highlight: "Object-oriented relational knowledge map",
    capabilities: ["Entity-relationship visualizer", "Cross-entity traversal", "Action triggers", "Semantic graph search"]
  },
  {
    id: "semantic-layer",
    title: "Semantic Layer & Metrics",
    category: "Organisation",
    description: "Centralized metric definitions, calculated columns, and governance policies.",
    path: "/workspace/semantic",
    icon: Layers,
    badge: "dbt / Cube",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Standardized metric governance",
    capabilities: ["Single source of truth metrics", "Dimensions mapping", "Time-grain aggregation", "Access control"]
  },
  {
    id: "organization",
    title: "Team & Member Governance",
    category: "Organisation",
    description: "Manage workspace team members, RBAC access roles, and invite enterprise collaborators.",
    path: "/workspace/organization",
    icon: Users,
    badge: "RBAC",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Fine-grained role-based access control",
    capabilities: ["Role assignments", "Invite management", "Division structures", "Active sessions"]
  },
  {
    id: "billing",
    title: "Billing & Compute Quotas",
    category: "Organisation",
    description: "Monitor monthly API call consumption, compute minutes, storage tiers, and invoices.",
    path: "/workspace/billing",
    icon: CreditCard,
    badge: "Usage Meter",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    highlight: "Transparent cost & consumption breakdown",
    capabilities: ["Tier upgrades", "Invoice downloads", "Real-time usage caps", "Payment methods"]
  },
  {
    id: "apikeys",
    title: "API Keys & Service Credentials",
    category: "Organisation",
    description: "Generate and revoke developer bearer tokens and webhook signing secrets.",
    path: "/workspace/apikeys",
    icon: Key,
    badge: "Security",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    highlight: "Cryptographically secure bearer token vault",
    capabilities: ["Token generation", "Scope restrictions", "Expiration timers", "Revocation controls"]
  },

  // 5. Platform Ecosystem (9)
  {
    id: "connectors",
    title: "Data Connectors & Integrations",
    category: "Platform Ecosystem",
    description: "Native connections to PostgreSQL, Snowflake, BigQuery, AWS S3, and Salesforce.",
    path: "/workspace/connectors",
    icon: Cable,
    badge: "30+ Drivers",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    highlight: "Pre-built connectors with scheduled syncs",
    capabilities: ["CDC change-data capture", "Incremental sync", "SSL encryption", "Schema introspection"]
  },
  {
    id: "notebooks",
    title: "Interactive Python Notebooks",
    category: "Platform Ecosystem",
    description: "Zero-trust WebAssembly Python & pandas sandbox with Jupyter keyboard shortcuts.",
    path: "/workspace/notebooks",
    icon: TerminalSquare,
    badge: "Python",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    highlight: "Client-side Python execution & Jupyter chords",
    capabilities: ["pandas & numpy & scipy", "Jupyter shortcut engine", "DuckDB SQL cells", "Real-time AI Copilot"],
    isPopular: true
  },
  {
    id: "dashboards-ecosystem",
    title: "Dashboards (BI)",
    category: "Platform Ecosystem",
    description: "Interactive analytics dashboards, drag-and-drop report layout builder and charts.",
    path: "/workspace/dashboards",
    icon: LayoutDashboard,
    badge: "Canvas",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Visual report canvas & automated refresh",
    capabilities: ["Custom widgets", "Drill-down filters", "Scheduled delivery", "Export to PowerPoint"]
  },
  {
    id: "automations",
    title: "Workflow Automations & ETL",
    category: "Platform Ecosystem",
    description: "Visual workflow builder for event-driven pipelines, webhooks, and recurring ETL tasks.",
    path: "/workspace/automations",
    icon: Workflow,
    badge: "Event-Driven",
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    highlight: "No-code workflow orchestration",
    capabilities: ["Cron schedule triggers", "Webhook dispatchers", "Data transform pipelines", "Slack / Email alerts"]
  },
  {
    id: "plugins",
    title: "Workspace Plugins",
    category: "Platform Ecosystem",
    description: "Extend platform features with custom analytics algorithms and visualization extensions.",
    path: "/workspace/plugins",
    icon: Blocks,
    badge: "Extensible",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    highlight: "Modular algorithm extensions",
    capabilities: ["Custom chart renderers", "Custom ML algorithms", "Webhook triggers", "Community plugins"]
  },
  {
    id: "observability",
    title: "Cluster Observability & Telemetry",
    category: "Platform Ecosystem",
    description: "Detailed system audit logs, API latency percentiles (p50/p95/p99), and error rates.",
    path: "/workspace/observability",
    icon: ActivitySquare,
    badge: "Telemetry",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    highlight: "Performance metrics & health checks",
    capabilities: ["Latency distribution charts", "Error trace inspector", "Throughput monitors", "Resource allocation"]
  },
  {
    id: "data-quality",
    title: "Data Quality Sentinel",
    category: "Platform Ecosystem",
    description: "Automated schema validation, missingness detection, and statistical distribution drift.",
    path: "/workspace/quality",
    icon: ShieldCheck,
    badge: "Sentinel",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    highlight: "Automated schema validation & drift detection",
    capabilities: ["Null drift alarms", "Type violation checks", "Custom constraint rules", "Data health scorecards"]
  },
  {
    id: "marketplace",
    title: "Marketplace & Blueprints",
    category: "Platform Ecosystem",
    description: "Browse verified industry analytics templates, pre-trained models, and community plugins.",
    path: "/workspace/marketplace",
    icon: Globe,
    badge: "Hub",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    highlight: "One-click starter templates & models",
    capabilities: ["SaaS metric packs", "Healthcare schemas", "E-commerce templates", "Supply chain models"]
  },
  {
    id: "developer-sdk",
    title: "Intelligence Developer SDK",
    category: "Platform Ecosystem",
    description: "Official Python and TypeScript client libraries with documentation and REST specs.",
    path: "/workspace/sdk",
    icon: Terminal,
    badge: "SDK & API",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Code snippets in Python, cURL & TypeScript",
    capabilities: ["Python package (pip)", "Node/TS SDK", "Bearer token auth", "Interactive API explorer"]
  },

  // 6. Help & Resources (5)
  {
    id: "help-center",
    title: "Help Centre & Enterprise Support",
    category: "Help & Resources",
    description: "Frequently asked questions, troubleshooting articles, and priority support tickets.",
    path: "/workspace/help",
    icon: HelpCircle,
    badge: "24/7 Support",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    highlight: "Direct access to engineering specialists",
    capabilities: ["Priority ticket portal", "Interactive FAQ", "Status uptime checker", "Video tutorials"]
  },
  {
    id: "user-manual",
    title: "User Manual & Reference Guide",
    category: "Help & Resources",
    description: "Complete guide covering data transformations, model training, and SQL reference.",
    path: "/workspace/manual",
    icon: BookOpen,
    badge: "Docs",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    highlight: "Comprehensive step-by-step guides",
    capabilities: ["DuckDB SQL reference", "Python WASM guide", "ML evaluation benchmarks", "ETL best practices"]
  },
  {
    id: "notifications",
    title: "Notifications & Alerts Inbox",
    category: "Help & Resources",
    description: "Unified notification center for system health alerts, model completion pings, and invites.",
    path: "/workspace/notifications",
    icon: Bell,
    badge: "Inbox",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    highlight: "Real-time trigger alerts & system pings",
    capabilities: ["Mark as read / unread", "Severity filtering", "Clear completed", "Push notification settings"]
  },
  {
    id: "activity-log",
    title: "Workspace Activity & Audit Logs",
    category: "Help & Resources",
    description: "Real-time audit log of dataset uploads, model trainings, exports, and team actions.",
    path: "/workspace/activity",
    icon: Activity,
    badge: "Audit Log",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    highlight: "Immutable audit trail of all workspace events",
    capabilities: ["User action tracking", "Export audit logs", "Severity filtering", "Timestamp markers"]
  },
  {
    id: "changelog",
    title: "Platform Release Changelog",
    category: "Help & Resources",
    description: "Chronological release notes, performance updates, and new capability announcements.",
    path: "/workspace/changelog",
    icon: ScrollText,
    badge: "v2.8",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlight: "Continuous platform updates & roadmap",
    capabilities: ["Version history", "Feature highlights", "Bug fixes", "Upcoming roadmap"]
  }
];

export default function AllFeatures() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vivexa_bookmarked_features");
      return saved ? JSON.parse(saved) : ["dashboards-bi", "ai-analyst", "notebooks", "datasets"];
    } catch (e) {
      return ["dashboards-bi", "ai-analyst", "notebooks", "datasets"];
    }
  });

  const categories = [
    "All",
    "Core Operations",
    "AI Intelligence",
    "Predictions & ML",
    "Organisation",
    "Platform Ecosystem",
    "Help & Resources",
    "Favorites"
  ];

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem("vivexa_bookmarked_features", JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const filteredFeatures = useMemo(() => {
    return ALL_PLATFORM_FEATURES.filter(feat => {
      if (selectedCategory === "Favorites") {
        if (!bookmarkedIds.includes(feat.id)) return false;
      } else if (selectedCategory !== "All" && feat.category !== selectedCategory) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        feat.title.toLowerCase().includes(q) ||
        feat.description.toLowerCase().includes(q) ||
        feat.category.toLowerCase().includes(q) ||
        (feat.highlight && feat.highlight.toLowerCase().includes(q)) ||
        feat.capabilities.some(cap => cap.toLowerCase().includes(q)) ||
        (feat.badge && feat.badge.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, bookmarkedIds]);

  const stats = useMemo(() => {
    return {
      total: ALL_PLATFORM_FEATURES.length,
      ai: ALL_PLATFORM_FEATURES.filter(f => f.category === "AI Intelligence" || f.category === "Predictions & ML").length,
      ecosystem: ALL_PLATFORM_FEATURES.filter(f => f.category === "Platform Ecosystem").length,
      favorites: bookmarkedIds.length
    };
  }, [bookmarkedIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
              <Compass className="h-3.5 w-3.5 text-indigo-400" />
              <span>Universal Capability Explorer & Directory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              All Features & Intelligence Capabilities
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore the complete Vivexa AI enterprise intelligence platform. Discover self-service BI dashboards, autonomous AutoML agents, zero-trust Python notebooks, and lakehouse federation in one unified catalog.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl font-bold text-white font-mono">{stats.total}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Total Tools</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl font-bold text-purple-400 font-mono">{stats.ai}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">AI & ML</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl font-bold text-emerald-400 font-mono">{stats.ecosystem}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Ecosystem</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl font-bold text-amber-400 font-mono">{stats.favorites}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Starred</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features by name, keyword, capability, or tech (e.g. 'dashboards', 'DuckDB', 'XGBoost', 'Jupyter', 'ETL')..."
              className="pl-10 h-10 rounded-xl bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/workspace/dashboards")}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Launch BI Dashboards</span>
            </Button>
            <Button
              onClick={() => navigate("/workspace/global-search")}
              variant="outline"
              className="h-10 px-3 rounded-xl bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Deep Search (Cmd+K)</span>
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-850"
              }`}
            >
              {cat === "Favorites" && <Star className={`h-3 w-3 ${selectedCategory === cat ? "fill-white" : "text-amber-400 fill-amber-400"}`} />}
              <span>{cat}</span>
              {cat === "Favorites" ? (
                <span className="text-[10px] px-1 rounded bg-black/30 font-mono">{bookmarkedIds.length}</span>
              ) : cat === "All" ? (
                <span className="text-[10px] px-1 rounded bg-black/30 font-mono">{ALL_PLATFORM_FEATURES.length}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Features */}
      {filteredFeatures.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800 p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 w-12 h-12 mx-auto flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No platform features found</h3>
            <p className="text-xs text-slate-400">
              No capabilities matched your filter query &quot;{searchQuery}&quot;. Try adjusting your search keywords or switching category filters.
            </p>
            <Button
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              variant="outline"
              className="mt-2 text-xs bg-slate-800 border-slate-700 text-white rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredFeatures.map((feat) => {
              const Icon = feat.icon;
              const isBookmarked = bookmarkedIds.includes(feat.id);

              return (
                <motion.div
                  key={feat.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card className="group relative bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-indigo-500/40 transition-all duration-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/5 flex flex-col h-full">
                    {/* Header */}
                    <div className="p-5 pb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                            {feat.title}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {feat.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {feat.badge && (
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${feat.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                            {feat.badge}
                          </span>
                        )}
                        <button
                          onClick={(e) => toggleBookmark(feat.id, e)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          title={isBookmarked ? "Remove from starred" : "Star feature"}
                        >
                          <Star className={`h-4 w-4 ${isBookmarked ? "text-amber-400 fill-amber-400" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-2 flex-1 space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {feat.description}
                      </p>

                      {feat.highlight && (
                        <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-850 text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{feat.highlight}</span>
                        </div>
                      )}

                      {/* Capabilities Tag Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {feat.capabilities.map((cap, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800/80 text-slate-400"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="p-4 pt-3 border-t border-slate-800/60 bg-slate-950/30 flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-mono text-slate-500">
                        {feat.path}
                      </span>
                      <Button
                        onClick={() => navigate(feat.path)}
                        size="sm"
                        className="h-7 px-3 text-xs rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <span>Open Feature</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
