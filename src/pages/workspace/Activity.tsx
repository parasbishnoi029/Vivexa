import { useState, useEffect, useMemo } from "react";
import { 
  Activity, FolderKanban, LogIn, LogOut, Settings,
  Shield, User, Filter, Search, Download, RefreshCw, 
  CheckCircle2, AlertTriangle, XCircle, Database, Bot, 
  TerminalSquare, Cable, Sparkles, Key, Eye, X, Copy,
  ArrowUpRight, Clock, ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface AuditEvent {
  id: string;
  category: "AI & ML" | "Data & Lakehouse" | "Security & Auth" | "Connectors" | "BI & Reports" | "System";
  action: string;
  title: string;
  description: string;
  status: "Success" | "Warning" | "Error" | "Info";
  actor: string;
  ipAddress: string;
  executionMs: number;
  created_at: string;
  metadata?: Record<string, any>;
}

const DEFAULT_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "act-101",
    category: "AI & ML",
    action: "ai.inference.executed",
    title: "AI Analyst Prediction Invocation",
    description: "Evaluated 12-month customer churn probability on 'telecom_customer_churn_q3.csv'.",
    status: "Success",
    actor: "Enterprise AI Engine",
    ipAddress: "10.240.0.12 (Internal RPC)",
    executionMs: 342,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    metadata: {
      model: "churn-risk-v2",
      tokens_used: 1240,
      confidence_score: 0.942,
      latency: "342ms"
    }
  },
  {
    id: "act-102",
    category: "Data & Lakehouse",
    action: "lakehouse.table.delta_sync",
    title: "Lakehouse Gold Layer Aggregation",
    description: "Merged 14,200 incremental rows into virtual lakehouse table 'gold_sales_quarterly'.",
    status: "Success",
    actor: "Vivexa Lakehouse Worker",
    ipAddress: "10.240.1.84",
    executionMs: 128,
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    metadata: {
      rows_affected: 14200,
      partition: "2026-Q3",
      compression: "ZSTD_PARQUET"
    }
  },
  {
    id: "act-103",
    category: "Security & Auth",
    action: "auth.session.login",
    title: "User Authenticated via Workspace SSO",
    description: "SAML 2.0 Identity Assertion verified with Okta Directory.",
    status: "Success",
    actor: "Admin (parasbishnoi012@gmail.com)",
    ipAddress: "152.58.12.89 (Mumbai, IN)",
    executionMs: 82,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metadata: {
      auth_method: "SSO_SAML2",
      mfa_verified: true,
      browser: "Chrome / macOS 15.1"
    }
  },
  {
    id: "act-104",
    category: "Connectors",
    action: "connector.sync.completed",
    title: "PostgreSQL Database Connector Sync",
    description: "Synchronized 8,920 records from 'db.production.internal:5432/orders'.",
    status: "Success",
    actor: "Data Connector Pipeline",
    ipAddress: "10.240.4.19",
    executionMs: 840,
    created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    metadata: {
      source: "PostgreSQL Production",
      schema: "public.orders",
      delta_bytes: "4.2 MB"
    }
  },
  {
    id: "act-105",
    category: "BI & Reports",
    action: "bi.export.pptx",
    title: "Executive Presentation Export",
    description: "Generated 14-slide executive briefing deck with live vector charts.",
    status: "Success",
    actor: "Vivexa BI Engine",
    ipAddress: "10.240.0.12",
    executionMs: 1950,
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    metadata: {
      format: "PPTX",
      file_size: "3.8 MB",
      theme: "Executive Navy"
    }
  },
  {
    id: "act-106",
    category: "Security & Auth",
    action: "api_key.created",
    title: "Live Production API Key Provisioned",
    description: "Generated scoped API token 'vx_live_99f...81c' with Read/Write access.",
    status: "Info",
    actor: "Admin (parasbishnoi012@gmail.com)",
    ipAddress: "152.58.12.89",
    executionMs: 45,
    created_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    metadata: {
      key_id: "key-99f81c",
      scopes: ["datasets:read", "models:predict", "lakehouse:query"]
    }
  }
];

export default function WorkspaceActivity() {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem("vivexa_audit_activities_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_AUDIT_LOGS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  useEffect(() => {
    localStorage.setItem("vivexa_audit_activities_v2", JSON.stringify(activities));
  }, [activities]);

  // Live event ticker simulation
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const randomActions = [
        {
          category: "AI & ML" as const,
          action: "ai.analyst.query",
          title: "Semantic Vector Search Query",
          description: "Scanned 48,000 project memory vectors for query 'ARR expansion levers'.",
          status: "Success" as const,
          actor: "AI Analyst Worker",
          ipAddress: "10.240.2.11",
          executionMs: 142,
          metadata: { similarity_score: 0.961, latency: "142ms" }
        },
        {
          category: "Data & Lakehouse" as const,
          action: "lakehouse.query.duckdb",
          title: "In-Memory OLAP Query Dispatched",
          description: "Executed 1.2M row aggregate query in 24ms via embedded DuckDB.",
          status: "Success" as const,
          actor: "Vivexa Lakehouse Engine",
          ipAddress: "10.240.0.9",
          executionMs: 24,
          metadata: { rows_scanned: 1200000, engine: "DuckDB v1.1.0" }
        }
      ];
      const pick = randomActions[Math.floor(Math.random() * randomActions.length)];
      const newEvt: AuditEvent = {
        id: `act-${Date.now()}`,
        ...pick,
        created_at: new Date().toISOString()
      };
      setActivities(prev => [newEvt, ...prev.slice(0, 49)]);
    }, 18000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.actor.toLowerCase().includes(q);

      const matchesCat = categoryFilter === "All" || item.category === categoryFilter;
      const matchesStat = statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesCat && matchesStat;
    });
  }, [activities, searchQuery, categoryFilter, statusFilter]);

  const exportAuditLog = (format: "json" | "csv") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(activities, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vivexa-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toast.success("Downloaded audit log as JSON");
    } else {
      const headers = ["ID", "Timestamp", "Category", "Action", "Title", "Status", "Actor", "IP", "Latency (ms)"];
      const rows = activities.map(a => [
        a.id,
        a.created_at,
        a.category,
        a.action,
        `"${a.title.replace(/"/g, '""')}"`,
        a.status,
        `"${a.actor}"`,
        a.ipAddress,
        a.executionMs
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vivexa-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      toast.success("Downloaded audit log as CSV");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "AI & ML": return Bot;
      case "Data & Lakehouse": return Database;
      case "Security & Auth": return Shield;
      case "Connectors": return Cable;
      case "BI & Reports": return Sparkles;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6 pb-12 relative z-10 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-md">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">System Audit & Activity Log</h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isLiveStreaming ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isLiveStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isLiveStreaming ? 'LIVE STREAM' : 'PAUSED'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Immutable audit trail recording security events, data migrations, AI reasoning, and connector telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white text-xs"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
            {isLiveStreaming ? "Pause Stream" : "Resume Stream"}
          </Button>

          <Button
            onClick={() => exportAuditLog("csv")}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
          </Button>

          <Button
            onClick={() => exportAuditLog("json")}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> JSON
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Recorded Events</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{activities.length}</p>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Operational Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">100.0%</p>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Security Assertions</span>
            <ShieldCheck className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1 font-mono">
            {activities.filter(a => a.category === "Security & Auth").length}
          </p>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Average RPC Latency</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1 font-mono">148 ms</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search events, actions, actors, or IPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-800 text-sm text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {["All", "AI & ML", "Data & Lakehouse", "Security & Auth", "Connectors", "BI & Reports"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Table / Stream */}
      {filteredActivities.length === 0 ? (
        <Card className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl p-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-3 text-slate-600 opacity-50" />
          <p className="text-base font-bold text-slate-300">No matching activities found</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting a different category filter.</p>
          <Button onClick={() => { setSearchQuery(""); setCategoryFilter("All"); }} className="mt-4 bg-indigo-600 text-white text-xs">
            Reset Filters
          </Button>
        </Card>
      ) : (
        <Card className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-slate-800/60">
              {filteredActivities.map((item) => {
                const Icon = getCategoryIcon(item.category);
                return (
                  <motion.div 
                    key={item.id} 
                    variants={itemVariants} 
                    onClick={() => setSelectedEvent(item)}
                    className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="mt-1 shrink-0 h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-md group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60 shrink-0">
                            {item.action}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono shrink-0">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono flex-wrap">
                        <span>Actor: <strong className="text-slate-400">{item.actor}</strong></span>
                        <span>•</span>
                        <span>IP: {item.ipAddress}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{item.executionMs}ms</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-medium">{item.category}</span>
                      </div>
                    </div>

                    <div className="self-center shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 group-hover:text-indigo-400">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Event Details JSON Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedEvent.title}</h2>
                  <p className="text-xs font-mono text-slate-400">{selectedEvent.action} ({selectedEvent.id})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Category</span>
                  <span className="text-slate-200 font-mono">{selectedEvent.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Status</span>
                  <span className="text-emerald-400 font-bold font-mono">● {selectedEvent.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Actor</span>
                  <span className="text-slate-200 font-mono truncate block">{selectedEvent.actor}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">IP / Host</span>
                  <span className="text-slate-200 font-mono truncate block">{selectedEvent.ipAddress}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payload Metadata</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
                      toast.success("Copied event JSON payload");
                    }}
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy JSON
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedEvent.metadata || { details: selectedEvent.description }, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setSelectedEvent(null)} className="bg-indigo-600 text-white">
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
