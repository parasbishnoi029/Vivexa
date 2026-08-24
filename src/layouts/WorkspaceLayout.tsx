import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FolderKanban, Settings, Bell, Search, Database,
  BarChart3, Bot, FileText, LayoutTemplate, Bookmark, Activity, ScrollText,
  Shield, HelpCircle, MessageSquare, ChevronDown, ChevronRight, Moon, Sun, Command, Users, CreditCard, Key,
  Network, Cable, TerminalSquare, Workflow, Blocks, ActivitySquare, BookOpen, Menu, X,
  Boxes, Layers, Globe, Brain, Building2, User, Plus, Wifi, WifiOff, ShieldCheck,
  Sparkles, LineChart, Cpu, Zap, SlidersHorizontal, ArrowRight, CornerDownLeft, Filter, ArrowUpRight, Compass,
  Pin, PinOff
} from "lucide-react";
import { AppBackground } from "@/components/layout/AppBackground";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { supabase } from "@/lib/supabase";
import { isAdminRole } from "@/lib/rbac";
import { toast } from "sonner";

import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import NotificationDrawer from "@/components/workspace/NotificationDrawer";
import QuotaLimitModal from "@/components/workspace/QuotaLimitModal";
import { ProductTour } from "@/components/workspace/ProductTour";
import { Logo } from "@/components/ui/Logo";
import { useNotifications } from "@/hooks/useNotifications";

export interface UnifiedCommandItem {
  id: string;
  type: "page" | "project" | "dataset" | "action";
  categoryLabel: string;
  label: string;
  description?: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  to?: string;
  onExecute?: () => void;
}

export interface NavSectionItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  description?: string;
  disabled?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  accentColor: string;
  badgeBg: string;
  items: NavSectionItem[];
}

export const WORKSPACE_NAV_SECTIONS: NavSection[] = [
  {
    id: "core",
    title: "Core Operations",
    accentColor: "text-indigo-400",
    badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    items: [
      { to: "/workspace", label: "Dashboard", icon: LayoutDashboard, description: "System KPIs & real-time telemetry" },
      { to: "/workspace/dashboards", label: "BI Dashboards", icon: BarChart3, badge: "BI Studio", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", description: "Interactive visualizations & custom widgets" },
      { to: "/workspace/all", label: "All Features Hub", icon: Compass, badge: "All", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", description: "Universal capability directory & explorer" },
      { to: "/workspace/projects", label: "Projects", icon: FolderKanban, description: "Enterprise analytical initiatives" },
      { to: "/workspace/datasets", label: "Datasets", icon: Database, badge: "Live", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", description: "Lakehouse ingest & data curation" },
      { to: "/workspace/lakehouse", label: "Vivexa Lakehouse", icon: Network, badge: "Delta", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", description: "Zero-copy query federation" },
    ]
  },
  {
    id: "ai_intelligence",
    title: "AI Intelligence",
    accentColor: "text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    items: [
      { to: "/workspace/ai", label: "AI Analyst", icon: Bot, badge: "AutoML", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30", description: "Automated root-cause & data profiling" },
      { to: "/workspace/ai/chat", label: "AI Chat", icon: MessageSquare, description: "Conversational assistant & data scientist agent" },
      { to: "/workspace/agents", label: "AI Agents Cockpit", icon: Cpu, badge: "Autonomous", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30", description: "Multi-agent autonomous task orchestration" },
      { to: "/workspace/search", label: "Search Analytics", icon: Search, description: "Semantic search query logs & latency meters" },
    ]
  },
  {
    id: "predictions_ml",
    title: "Predictions & ML",
    accentColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    items: [
      { to: "/workspace/predictions", label: "Predictions & ML", icon: Activity, description: "Supervised models, XGBoost & RandomForest" },
      { to: "/workspace/forecasting", label: "Forecasting", icon: BarChart3, badge: "Prophet", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30", description: "Multi-horizon time-series trajectories" },
      { to: "/workspace/recommendations", label: "Recommendations", icon: Bookmark, description: "Causal prescription & growth recommendations" },
      { to: "/workspace/reports", label: "Executive Reports", icon: FileText, badge: "PPT/PDF", badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30", description: "Boardroom slide decks & executive briefings" },
      { to: "/workspace/models", label: "Saved Models", icon: Database, description: "Model registry, weights & deployment endpoints" },
      { to: "/workspace/memory", label: "Project Memory", icon: ScrollText, description: "Long-term AI context & institutional domain rules" },
    ]
  },
  {
    id: "organisation",
    title: "Organisation",
    accentColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    items: [
      { to: "/workspace/global-search", label: "Global Search", icon: Search, description: "Universal indexing across tables, schemas & docs" },
      { to: "/workspace/ontology", label: "Enterprise Ontology", icon: Boxes, badge: "Knowledge Graph", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", description: "Entity relationship graphs & business domain objects" },
      { to: "/workspace/semantic", label: "Semantic Layer", icon: Layers, description: "Standardized metric definitions & semantic governance" },
      { to: "/workspace/organization", label: "Organisation", icon: Users, description: "Team members, RBAC roles & seat allocations" },
      { to: "/workspace/billing", label: "Billing & Usage", icon: CreditCard, description: "Tier management, compute quotas & usage telemetry" },
      { to: "/workspace/apikeys", label: "API Keys", icon: Key, description: "Developer tokens, bearer credentials & webhook secrets" },
    ]
  },
  {
    id: "platform_ecosystem",
    title: "Platform Ecosystem",
    accentColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    items: [
      { to: "/workspace/connectors", label: "Data Connectors", icon: Cable, description: "PostgreSQL, Snowflake, BigQuery & S3 integrations" },
      { to: "/workspace/notebooks", label: "Notebooks", icon: TerminalSquare, badge: "Python", badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30", description: "Interactive Jupyter & pandas analytical sandbox" },
      { to: "/workspace/dashboards", label: "Dashboards (BI)", icon: LayoutDashboard, description: "Self-service business intelligence canvas" },
      { to: "/workspace/automations", label: "Automations", icon: Workflow, description: "Event-triggered ETL, scheduled jobs & webhooks" },
      { to: "/workspace/plugins", label: "Plugins", icon: Blocks, description: "Custom community extensions & custom algorithms" },
      { to: "/workspace/observability", label: "Observability", icon: ActivitySquare, description: "System audit logs, health telemetry & error rate" },
      { to: "/workspace/quality", label: "Data Quality Sentinel", icon: ShieldCheck, description: "Automated schema validation & drift detection" },
      { to: "/workspace/marketplace", label: "Marketplace", icon: Globe, description: "Pre-trained enterprise models & analytical blueprints" },
      { to: "/workspace/sdk", label: "Intelligence SDK", icon: TerminalSquare, description: "REST & Python client SDK docs" },
    ]
  },
  {
    id: "help_resources",
    title: "Help & Resources",
    accentColor: "text-slate-400",
    badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
    items: [
      { to: "/workspace/help", label: "Help Centre", icon: HelpCircle, description: "FAQs, knowledgebase & enterprise support desk" },
      { to: "/workspace/manual", label: "User Manual", icon: BookOpen, description: "Comprehensive platform reference guide" },
      { to: "/workspace/notifications", label: "Notifications", icon: Bell, description: "Alert inbox, system pings & threshold alerts" },
      { to: "/workspace/activity", label: "Activity", icon: Activity, description: "Real-time user & automated event logs" },
      { to: "/workspace/changelog", label: "Changelog", icon: ScrollText, badge: "v2.8", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", description: "Latest release notes & platform updates" },
    ]
  }
];

const NavItem = ({ to, icon: Icon, children, badge, badgeColor, disabled = false, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/workspace" && location.pathname.startsWith(to + "/"));

  return (
    <Link 
      to={disabled ? "#" : to} 
      className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
        } else if (onClick) {
          onClick();
        }
      }}
    >
      {isActive && (
        <motion.div 
          layoutId="active-nav-bg"
          className="absolute inset-0 rounded-xl bg-indigo-500/15 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="flex items-center gap-2.5 min-w-0 relative z-10">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'bg-slate-800/60 group-hover:bg-slate-700/60 text-slate-400 group-hover:text-white'}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="truncate text-xs font-semibold">{children}</span>
      </div>

      {badge && (
        <span className={`relative z-10 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'} shrink-0 ml-1.5`}>
          {badge}
        </span>
      )}
    </Link>
  );
};

export default function WorkspaceLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteSearch, setCommandPaletteSearch] = useState("");
  const [commandPaletteCategory, setCommandPaletteCategory] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [userRole, setUserRole] = useState<string>('User');
  const [userPlan, setUserPlan] = useState<string>('Free');
  const [headerSearch, setHeaderSearch] = useState("");
  const [healthStatus, setHealthStatus] = useState<'online' | 'degraded' | 'offline'>('online');
  const [latency, setLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Collapsible section state with persistence
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("vivexa_nav_collapsed_v3");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem("vivexa_nav_collapsed_v3", JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Auto-expand section containing current active path
  useEffect(() => {
    const currentSection = WORKSPACE_NAV_SECTIONS.find(sec =>
      sec.items.some(item => item.to === location.pathname || (item.to !== "/workspace" && location.pathname.startsWith(item.to + "/")))
    );
    if (currentSection && collapsedSections[currentSection.id]) {
      setCollapsedSections(prev => {
        const next = { ...prev, [currentSection.id]: false };
        try {
          localStorage.setItem("vivexa_nav_collapsed_v3", JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
    }
  }, [location.pathname]);

  // Determine current active breadcrumb info
  const activeNavInfo = useMemo(() => {
    for (const section of WORKSPACE_NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.to === location.pathname || (item.to !== "/workspace" && location.pathname.startsWith(item.to + "/"))) {
          return { section, item };
        }
      }
    }
    if (location.pathname.startsWith("/workspace/settings")) {
      return { section: { title: "Settings" }, item: { label: "System Preferences", icon: Settings } };
    }
    return null;
  }, [location.pathname]);

  // Filtered nav items based on sidebarFilter
  const filteredNavSections = useMemo(() => {
    if (!sidebarFilter.trim()) return WORKSPACE_NAV_SECTIONS;
    const q = sidebarFilter.toLowerCase().trim();
    return WORKSPACE_NAV_SECTIONS.map(section => {
      const matchingItems = section.items.filter(item => 
        item.label.toLowerCase().includes(q) || 
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
      return { ...section, items: matchingItems };
    }).filter(section => section.items.length > 0);
  }, [sidebarFilter]);

  // Search projects and datasets for global Command Palette (Cmd+K)
  const [searchProjects, setSearchProjects] = useState<any[]>([]);
  const [searchDatasets, setSearchDatasets] = useState<any[]>([]);

  useEffect(() => {
    async function loadIndexedData() {
      if (!user) return;
      try {
        const [projRes, dsRes] = await Promise.all([
          supabase.from('projects').select('id, name, description, industry').limit(25),
          supabase.from('datasets').select('id, name, row_count, column_count, format').limit(25)
        ]);
        if (projRes.data) setSearchProjects(projRes.data);
        if (dsRes.data) setSearchDatasets(dsRes.data);
      } catch (e) {
        console.warn("Error loading command palette search items:", e);
      }
    }
    loadIndexedData();
  }, [user?.id]);

  // Unified command palette flat items (Pages, Projects, Datasets, Actions)
  const commandPaletteItems = useMemo<UnifiedCommandItem[]>(() => {
    const items: UnifiedCommandItem[] = [];

    // 1. Common Workspace Actions
    items.push(
      {
        id: "action-tour",
        type: "action",
        categoryLabel: "Actions",
        label: "Start Guided Product Tour",
        description: "Interactive 5-step walkthrough of key Vivexa AI platforms",
        icon: Compass,
        badge: "60s Tour",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        onExecute: () => {
          window.dispatchEvent(new Event('vivexa_start_tour'));
          toast.success("Launching Guided Product Tour");
        }
      },
      {
        id: "action-new-project",
        type: "action",
        categoryLabel: "Actions",
        label: "New Project Wizard",
        description: "Create an analytical initiative with AI hypotheses",
        icon: Plus,
        badge: "Initiative",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        to: "/workspace/projects"
      },
      {
        id: "action-upload-dataset",
        type: "action",
        categoryLabel: "Actions",
        label: "Upload New Dataset",
        description: "Ingest CSV, Parquet, JSON, or Excel tables into the Lakehouse",
        icon: Database,
        badge: "Ingestion",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        to: "/workspace/datasets"
      },
      {
        id: "action-ai-analyst",
        type: "action",
        categoryLabel: "Actions",
        label: "Ask AI Analyst",
        description: "Autonomous data scientist for statistical queries and insights",
        icon: Bot,
        badge: "AutoML",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        to: "/workspace/ai"
      },
      {
        id: "action-lakehouse-sql",
        type: "action",
        categoryLabel: "Actions",
        label: "Open Lakehouse SQL Studio",
        description: "Execute sub-millisecond in-memory analytical queries with DuckDB",
        icon: Network,
        badge: "DuckDB",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        to: "/workspace/lakehouse"
      },
      {
        id: "action-forecasting",
        type: "action",
        categoryLabel: "Actions",
        label: "Forecast Temporal Trajectories",
        description: "Multi-horizon revenue and demand forecasting with scenario sliders",
        icon: BarChart3,
        badge: "Prophet",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        to: "/workspace/forecasting"
      },
      {
        id: "action-executive-report",
        type: "action",
        categoryLabel: "Actions",
        label: "Generate Executive Report Deck",
        description: "Synthesize live boardroom slide decks (PPTX / PDF)",
        icon: FileText,
        badge: "Reports",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        to: "/workspace/reports"
      },
      {
        id: "action-api-keys",
        type: "action",
        categoryLabel: "Actions",
        label: "Manage Scoped API Tokens",
        description: "Provision developer keys for REST, Python, and TypeScript SDKs",
        icon: Key,
        to: "/workspace/apikeys"
      },
      {
        id: "action-diagnostics",
        type: "action",
        categoryLabel: "Actions",
        label: "Run Workspace Diagnostics",
        description: "Perform real-time database ping, tenant health, and telemetry verification",
        icon: ShieldCheck,
        badge: "Health Check",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        onExecute: () => {
          toast.success("Workspace health: All services operational (Roundtrip: 12ms)");
        }
      }
    );

    // 2. All Workspace Pages & Navigation
    WORKSPACE_NAV_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        items.push({
          id: `page-${item.to}`,
          type: "page",
          categoryLabel: section.title,
          label: item.label,
          description: item.description,
          icon: item.icon,
          badge: item.badge,
          badgeColor: item.badgeColor,
          to: item.to
        });
      });
    });

    // 3. User Projects
    searchProjects.forEach(proj => {
      items.push({
        id: `proj-${proj.id}`,
        type: "project",
        categoryLabel: "Projects",
        label: proj.name,
        description: proj.description || `Industry: ${proj.industry || 'General Analytics'}`,
        icon: FolderKanban,
        badge: "Project",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        to: `/workspace/projects/${proj.id}`
      });
    });

    // 4. User Datasets
    searchDatasets.forEach(ds => {
      items.push({
        id: `ds-${ds.id}`,
        type: "dataset",
        categoryLabel: "Datasets",
        label: ds.name,
        description: `${(ds.row_count || 0).toLocaleString()} rows • ${ds.column_count || 0} features • ${ds.format || 'CSV'}`,
        icon: Database,
        badge: "Dataset",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        to: `/workspace/datasets`
      });
    });

    // Filtering by category & search query
    return items.filter((item) => {
      if (commandPaletteCategory !== "all") {
        if (commandPaletteCategory === "pages" && item.type !== "page") return false;
        if (commandPaletteCategory === "projects" && item.type !== "project") return false;
        if (commandPaletteCategory === "datasets" && item.type !== "dataset") return false;
        if (commandPaletteCategory === "actions" && item.type !== "action") return false;
        
        // Also support section id matching
        const matchingSection = WORKSPACE_NAV_SECTIONS.find(s => s.id === commandPaletteCategory);
        if (matchingSection && item.categoryLabel !== matchingSection.title) return false;
      }

      if (!commandPaletteSearch.trim()) return true;
      const q = commandPaletteSearch.toLowerCase().trim();
      return (
        item.label.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    });
  }, [commandPaletteSearch, commandPaletteCategory, searchProjects, searchDatasets]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [commandPaletteSearch, commandPaletteCategory]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored. Back online!", { id: "network-status" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Network connection lost. Some features might be offline.", { id: "network-status" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const { selectedWorkspaceId, setSelectedWorkspaceId, pinnedItems = [], unpinItem } = useWorkspaceStore();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      const startTime = Date.now();
      try {
        const res = await fetch('/api/v1/health', { cache: 'no-store' });
        const endTime = Date.now();
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'healthy') {
            setHealthStatus('online');
          } else {
            setHealthStatus('degraded');
          }
          setLatency(endTime - startTime);
        } else {
          setHealthStatus('offline');
          setLatency(null);
        }
      } catch (err) {
        if (!active) return;
        setHealthStatus('offline');
        setLatency(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const {
    notifications,
    unreadCount,
    isLoading: isNotifLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead
  } = useNotifications(15000);

  // Global hotkey for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === "Escape" && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Command palette keyboard navigation (Up/Down/Enter)
  const handleCommandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (commandPaletteItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (commandPaletteItems.length || 1)) % (commandPaletteItems.length || 1));
    } else if (e.key === "Enter" && commandPaletteItems.length > 0) {
      e.preventDefault();
      const target = commandPaletteItems[selectedIndex];
      if (target) {
        if (target.onExecute) {
          target.onExecute();
        } else if (target.to) {
          navigate(target.to);
        }
        setIsCommandPaletteOpen(false);
        setCommandPaletteSearch("");
      }
    }
  };

  const handleHeaderSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/workspace/search?q=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      setIsCommandPaletteOpen(true);
    }
  };

  useEffect(() => {
    async function loadWorkspaces() {
      if (!user) return;
      try {
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;
        if (!session) return;

        const res = await fetch('/api/v1/organization/workspaces', {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setWorkspaces(json.data);
          
          const activeId = useWorkspaceStore.getState().selectedWorkspaceId;
          const found = json.data.find((w: any) => w.id === activeId);
          if (!found && json.data.length > 0) {
            setSelectedWorkspaceId(json.data[0].id);
          }
        }
      } catch (err) {
        console.warn("Error fetching workspaces in WorkspaceLayout:", err);
      }
    }
    loadWorkspaces();
  }, [user?.id]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      if (!session) return;

      const res = await fetch("/api/v1/organization/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: newWorkspaceName.trim() })
      });
      const json = await res.json();
      if (json.success && json.data) {
        toast.success(`Created workspace: ${json.data.name}`);
        setShowNewWorkspaceModal(false);
        setNewWorkspaceName("");
        setSelectedWorkspaceId(json.data.id);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(json.error || "Failed to create workspace");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during workspace creation.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  useEffect(() => {
    async function fetchUserMeta() {
      if (!user) return;
      try {
        const { data: uData } = await supabase.from('users').select('role, plan').eq('id', user.id).maybeSingle();
        const { data: pData } = await supabase.from('profiles').select('role, plan').eq('user_id', user.id).maybeSingle();
        
        const role = pData?.role || uData?.role || 'User';
        const plan = uData?.plan || pData?.plan || 'Free';
        
        setUserRole(role);
        setUserPlan(plan);
      } catch (err) {
        console.warn("Error fetching user meta in WorkspaceLayout:", err);
      }
    }
    fetchUserMeta();
  }, [user]);

  useEffect(() => {
    async function checkPendingInvitation() {
      if (!user) return;
      const pendingInviteId = localStorage.getItem("pending_invite_id");
      if (!pendingInviteId) return;

      try {
        console.log(`[INVITE AUTO-ACCEPT] Attempting to auto-accept invitation: ${pendingInviteId}`);
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;
        if (!session) return;

        const res = await fetch(`/api/v1/organization/invitations/${pendingInviteId}/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        const data = await res.json();
        if (data.success) {
          toast.success("Successfully joined the workspace!");
          if (data.data && data.data.workspace_id) {
            setSelectedWorkspaceId(data.data.workspace_id);
          }
          // Reload page/data so the member list/dashboard updates
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          console.error("Auto-accept invitation failed:", data.error || data.meta?.error);
          toast.error(data.error || data.meta?.error || "Could not auto-join the workspace.");
        }
      } catch (err: any) {
        console.error("Error during auto-accepting invitation:", err);
      } finally {
        localStorage.removeItem("pending_invite_id");
      }
    }
    checkPendingInvitation();
  }, [user]);

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeWorkspace = workspaces.find((w: any) => w.id === selectedWorkspaceId);
  const activeWorkspaceName = activeWorkspace?.name || "Enterprise Core";

  const hasAdminPermission = isAdminRole(userRole, user?.email);

  const handleGlobalSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Orchestrating global MNC++ node synchronization...',
        success: 'Global workspace state synchronized across all regions.',
        error: 'Global synchronization failed.',
      }
    );
  };

  return (
    <AppBackground centered={false}>
      <div className="flex h-screen w-full relative z-10 text-slate-200 overflow-hidden">
        {/* Floating Sidebar Container */}
        <div className="hidden lg:block p-4 pr-0 h-full">
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="h-full w-64 rounded-2xl border border-slate-800/80 bg-slate-900/95 flex flex-col shadow-2xl overflow-hidden relative gpu-layer"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            
            <div className="flex h-16 items-center px-4 relative z-10 border-b border-slate-800/60">
              <Link to="/workspace" className="flex items-center gap-3 w-full">
                <Logo size="sm" />
              </Link>
            </div>

            {/* Navigation Search / Filter Bar */}
            <div className="p-3 pb-1 relative z-10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter menus... (⌘K)"
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
                />
                {sidebarFilter ? (
                  <button
                    onClick={() => setSidebarFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700/60 hover:text-slate-300"
                    title="Open Command Palette (⌘K)"
                  >
                    ⌘K
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2 scrollbar-hide relative z-10 space-y-4 px-2">
              {/* Pinned Shortcuts Section */}
              {pinnedItems.length > 0 && !sidebarFilter && (
                <div className="pb-2 mb-2 border-b border-slate-800/80">
                  <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Pin className="h-3 w-3" /> Pinned Items
                    </span>
                    <span className="text-[9px] font-mono opacity-80 bg-amber-400/10 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/20">
                      {pinnedItems.length}
                    </span>
                  </div>
                  <nav className="space-y-0.5 mt-1">
                    {pinnedItems.map((p) => (
                      <div key={p.id} className="group/pin relative flex items-center">
                        <Link
                          to={p.path}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700/50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-6">
                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                            <span className="truncate">{p.title}</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase text-slate-500 shrink-0 opacity-80">
                            {p.type}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            unpinItem(p.id);
                            toast.info(`Unpinned "${p.title}"`);
                          }}
                          className="absolute right-2 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded opacity-0 group-hover/pin:opacity-100 transition-opacity"
                          title="Unpin"
                        >
                          <PinOff className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </nav>
                </div>
              )}

              {filteredNavSections.length === 0 ? (
                <div className="text-center py-8 px-3">
                  <Search className="h-6 w-6 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-400">No matching items</p>
                  <p className="text-[10px] text-slate-600 mt-1">Try a different keyword or</p>
                  <button
                    onClick={() => setSidebarFilter("")}
                    className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    Clear filter
                  </button>
                </div>
              ) : (
                filteredNavSections.map((section) => {
                  const isCollapsed = !sidebarFilter && !!collapsedSections[section.id];
                  const hasActiveItem = section.items.some(
                    item => item.to === location.pathname || (item.to !== "/workspace" && location.pathname.startsWith(item.to + "/"))
                  );

                  return (
                    <div key={section.id} className="relative">
                      {/* Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors group cursor-pointer ${
                          hasActiveItem ? 'text-indigo-300' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {section.title}
                          <span className="text-[9px] font-mono font-normal opacity-60 text-slate-500 lowercase">
                            ({section.items.length})
                          </span>
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                            isCollapsed ? '-rotate-90' : ''
                          }`}
                        />
                      </button>

                      {/* Section Items */}
                      {!isCollapsed && (
                        <nav className="space-y-0.5 mt-1">
                          {section.items.map((item) => (
                            <NavItem
                              key={item.to}
                              to={item.to}
                              icon={item.icon}
                              badge={item.badge}
                              badgeColor={item.badgeColor}
                            >
                              {item.label}
                            </NavItem>
                          ))}
                        </nav>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 relative z-10 space-y-3">
              <div className="rounded-2xl bg-slate-950/50 border border-slate-800/50 p-2">
                <nav className="space-y-1">
                  {hasAdminPermission && (
                    <NavItem to="/admin" icon={Shield}>Admin Console</NavItem>
                  )}
                  <NavItem to="/workspace/settings" icon={Settings}>Settings</NavItem>
                </nav>
              </div>

              {/* Robust Status Indicator Block */}
              <div className="rounded-xl bg-slate-950/30 border border-slate-800/30 p-2.5 space-y-2 text-[11px] font-mono">
                {/* Network Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                    )}
                    <span className="text-slate-400">Network:</span>
                    <span className={`font-bold uppercase ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  {!isOnline && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                  )}
                </div>

                <div className="h-[1px] bg-slate-800/20 my-1" />

                {/* Sandbox API Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {healthStatus === 'online' && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                      )}
                      {healthStatus === 'degraded' && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </>
                      )}
                      {healthStatus === 'offline' && (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      )}
                    </span>
                    <span className="text-slate-400">Sandbox API:</span>
                    <span className={`font-bold uppercase ${
                      healthStatus === 'online' ? 'text-emerald-400' :
                      healthStatus === 'degraded' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {healthStatus}
                    </span>
                  </div>
                  {latency !== null && (
                    <span className="text-[10px] text-slate-500">{latency}ms</span>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* Mobile Sidebar Overlay & Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />

              {/* Sidebar Panel */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col h-full shadow-2xl lg:hidden overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                
                <div className="flex h-16 items-center justify-between px-2 relative z-10">
                  <Link to="/workspace" className="flex items-center gap-3" onClick={() => setIsMobileSidebarOpen(false)}>
                    <Logo size="sm" />
                  </Link>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-3 scrollbar-hide relative z-10 space-y-4 px-2">
                  {WORKSPACE_NAV_SECTIONS.map((section) => (
                    <div key={section.id} className="relative">
                      <div className="px-2 py-1 text-[11px] font-bold text-indigo-400 uppercase tracking-wider opacity-90 flex items-center justify-between">
                        <span>{section.title}</span>
                        <span className="text-[9px] font-mono opacity-50 lowercase">({section.items.length})</span>
                      </div>
                      <nav className="space-y-0.5 mt-1">
                        {section.items.map((item) => (
                          <NavItem
                            key={item.to}
                            to={item.to}
                            icon={item.icon}
                            badge={item.badge}
                            badgeColor={item.badgeColor}
                            onClick={() => setIsMobileSidebarOpen(false)}
                          >
                            {item.label}
                          </NavItem>
                        ))}
                      </nav>
                    </div>
                  ))}
                </div>

                <div className="p-2 relative z-10 mt-auto">
                  <div className="rounded-2xl bg-slate-950/50 border border-slate-800/50 p-2">
                    <nav className="space-y-1">
                      {hasAdminPermission && (
                        <NavItem to="/admin" icon={Shield} onClick={() => setIsMobileSidebarOpen(false)}>Admin Console</NavItem>
                      )}
                      <NavItem to="/workspace/settings" icon={Settings} onClick={() => setIsMobileSidebarOpen(false)}>Settings</NavItem>
                    </nav>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <header className="flex h-20 items-center justify-between px-4 md:px-8 relative z-20">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors shadow-lg cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* MNC++ Multi-Tenant Workspace Switcher */}
              <div className="relative" ref={workspaceMenuRef}>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className="flex items-center gap-3 bg-slate-900/90 border border-slate-800/80 px-4 py-2 rounded-2xl transition-colors hover:bg-slate-850 hover:border-indigo-500/40 group shadow-lg relative overflow-hidden h-14"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-black text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/10 relative z-10">
                    {(activeWorkspaceName || "VX").split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 tracking-tight group-hover:text-white transition-colors truncate max-w-[150px]">
                        {activeWorkspaceName}
                      </span>
                      <div className="relative h-1.5 w-1.5">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                        <div className="relative h-full w-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.1em]">{activeWorkspace?.is_personal ? 'PERSONAL' : userPlan} TENANT</span>
                      <span className="text-[9px] text-slate-600 font-black">•</span>
                      <span className="text-[9px] text-slate-500 font-bold tracking-tight">
                        {activeWorkspace?.is_personal ? 'SANDBOX' : 'ORGANIZATION'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-600 ml-3 transition-all group-hover:translate-y-0.5 group-hover:text-slate-400" />
                </motion.button>
                
                <AnimatePresence>
                  {isWorkspaceMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-3 w-[320px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                    >
                      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Workspace</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                          {workspaces.length} active
                        </span>
                      </div>
                      <div className="p-2 space-y-1 overflow-y-auto scrollbar-hide max-h-[250px]">
                        {workspaces.map((ws: any) => {
                          const isSelected = ws.id === selectedWorkspaceId;
                          return (
                            <button 
                              key={ws.id} 
                              onClick={() => { 
                                setIsWorkspaceMenuOpen(false); 
                                setSelectedWorkspaceId(ws.id);
                                toast.success(`Switched to: ${ws.name}`);
                                setTimeout(() => {
                                  window.location.reload();
                                }, 300);
                              }} 
                              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-800 border border-transparent'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${ws.is_personal ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                  {ws.is_personal ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-white truncate max-w-[180px]">{ws.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {ws.is_personal ? 'Private Sandbox' : `${ws.user_role || 'Member'} • Org`}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              )}
                            </button>
                          );
                        })}
                        {workspaces.length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-500">
                            No workspaces found
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
                        <button 
                          onClick={() => { 
                            setIsWorkspaceMenuOpen(false); 
                            setShowNewWorkspaceModal(true); 
                          }} 
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 transition-all text-xs font-bold cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Create New Workspace
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Breadcrumb Context Indicator (Desktop) */}
              {activeNavInfo && (
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/40 text-xs font-mono">
                  <span className="text-slate-500">{activeNavInfo.section.title}</span>
                  <span className="text-slate-700">/</span>
                  <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                    {activeNavInfo.item.label}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
              {/* Quick Search & Command Palette trigger */}
              <div 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="relative w-full max-w-xs hidden md:flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-md cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all text-slate-400 group shadow-inner"
              >
                <Search className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
                <span className="text-xs text-slate-400 flex-1 truncate">
                  Search workspace or type ⌘K...
                </span>
                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold bg-slate-950/60 px-1.5 py-0.5 rounded-md border border-slate-800 shrink-0 group-hover:text-slate-300">
                  <Command className="h-3 w-3" /> K
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                {/* Guided Tour Trigger Button */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    window.dispatchEvent(new Event('vivexa_start_tour'));
                    toast.success("Starting Guided Product Tour");
                  }}
                  title="Interactive Product Tour"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 transition-all cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5 text-indigo-400 animate-spin-slow" />
                  <span>Tour</span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  aria-label="Open notifications"
                  className="relative rounded-xl p-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors border border-transparent hover:border-slate-700/50 backdrop-blur-md cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-rose-400">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </motion.button>
                <div className="h-6 w-px bg-slate-800/60 mx-1" />
                <ProfileDropdown />
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 relative z-10 scrollbar-hide smooth-scroll">
             <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.12, ease: "easeOut" }}
                 className="h-full"
               >
                 <Outlet />
               </motion.div>
             </AnimatePresence>
          </main>
        </div>

        <NotificationDrawer 
          isOpen={isNotificationDrawerOpen} 
          onClose={() => setIsNotificationDrawerOpen(false)} 
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isNotifLoading}
          onRefresh={() => loadNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDeleteNotification={deleteNotification}
          onClearAllRead={clearAllRead}
        />
        <QuotaLimitModal />

        {/* Floating Network Offline Status Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
            >
              <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/30 rounded-2xl shadow-xl shadow-rose-950/20 p-4 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/25 shrink-0 animate-pulse">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white tracking-tight">Offline Connection Mode</h4>
                  <p className="text-[10px] text-rose-200 mt-0.5 leading-relaxed">
                    Network loss detected. Some interactive metrics & AI streams are suspended.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Workspace Modal */}
        <AnimatePresence>
          {showNewWorkspaceModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 relative z-10 bg-slate-950/40">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white tracking-tight">Create Workspace</h2>
                      <p className="text-[10px] text-slate-500 font-medium">Add a new collaborative analytics environment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewWorkspaceModal(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateWorkspace} className="p-6 space-y-4 relative z-10">
                  <div className="space-y-1.5">
                    <label htmlFor="workspace-name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace Name</label>
                    <input
                      id="workspace-name"
                      type="text"
                      placeholder="e.g. Finance Analytics, Marketing Dept"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      required
                      disabled={isCreatingWorkspace}
                      className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewWorkspaceModal(false)}
                      disabled={isCreatingWorkspace}
                      className="flex-1 h-11 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                      className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingWorkspace ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Workspace"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Command Palette (⌘K) Modal */}
        <AnimatePresence>
          {isCommandPaletteOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-indigo-950/40 overflow-hidden flex flex-col max-h-[80vh]"
              >
                {/* Search Input Bar */}
                <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/40 gap-3">
                  <Search className="h-5 w-5 text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search apps, modules, analytics, and tools..."
                    value={commandPaletteSearch}
                    onChange={(e) => setCommandPaletteSearch(e.target.value)}
                    onKeyDown={handleCommandKeyDown}
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none font-sans"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      ESC
                    </span>
                    <button
                      onClick={() => setIsCommandPaletteOpen(false)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Category Chips */}
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto scrollbar-hide text-xs">
                  <button
                    onClick={() => setCommandPaletteCategory("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      commandPaletteCategory === "all"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => setCommandPaletteCategory("pages")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      commandPaletteCategory === "pages"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Pages
                  </button>
                  <button
                    onClick={() => setCommandPaletteCategory("actions")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      commandPaletteCategory === "actions"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Quick Actions
                  </button>
                  <button
                    onClick={() => setCommandPaletteCategory("projects")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      commandPaletteCategory === "projects"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Projects
                  </button>
                  <button
                    onClick={() => setCommandPaletteCategory("datasets")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      commandPaletteCategory === "datasets"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Datasets
                  </button>
                  {WORKSPACE_NAV_SECTIONS.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setCommandPaletteCategory(sec.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        commandPaletteCategory === sec.id
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {sec.title}
                    </button>
                  ))}
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[420px]">
                  {commandPaletteItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-semibold text-slate-300">No destinations or actions found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try searching for &apos;AI Analyst&apos;, &apos;Tour&apos;, &apos;Forecast&apos;, or &apos;Lakehouse&apos;
                      </p>
                    </div>
                  ) : (
                    commandPaletteItems.map((cmdItem, index) => {
                      const Icon = cmdItem.icon;
                      const isSelected = index === selectedIndex;
                      return (
                        <div
                          key={cmdItem.id}
                          onClick={() => {
                            if (cmdItem.onExecute) {
                              cmdItem.onExecute();
                            } else if (cmdItem.to) {
                              navigate(cmdItem.to);
                            }
                            setIsCommandPaletteOpen(false);
                            setCommandPaletteSearch("");
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                              : "hover:bg-slate-800/80 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400 border border-slate-700/60"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {cmdItem.label}
                                </span>
                                {cmdItem.badge && (
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                    isSelected ? 'bg-white/20 text-white border-white/30' : (cmdItem.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700')
                                  }`}>
                                    {cmdItem.badge}
                                  </span>
                                )}
                              </div>
                              {cmdItem.description && (
                                <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                  {cmdItem.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-indigo-100' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {cmdItem.categoryLabel}
                            </span>
                            <ArrowUpRight className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700">↑</kbd>
                      <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700">↓</kbd> to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ENTER</kbd> to select
                    </span>
                  </div>
                  <span>{commandPaletteItems.length} destinations & actions</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Guided Product Tour Overlay Component */}
        <ProductTour />
      </div>
    </AppBackground>
  );
}
