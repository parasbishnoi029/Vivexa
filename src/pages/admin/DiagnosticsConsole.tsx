import { useState, useMemo, useEffect } from "react";
import { 
  AlertTriangle, Server, Database, CloudOff, FileWarning, ShieldAlert,
  Search, Filter, Check, CheckCircle2, Trash2, Eye, RefreshCw, 
  Copy, PlusCircle, X, ExternalLink, HelpCircle, UserCheck, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SystemException {
  id: string;
  errorClass: string;
  message: string;
  category: "backend" | "frontend" | "uploads" | "api" | "auth" | "database";
  severity: "critical" | "error" | "warning";
  timestamp: string;
  stackTrace: string;
  requestUrl?: string;
  httpMethod?: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  status: "active" | "resolved" | "ignored";
  assignedTo?: string;
}

export default function AdminDiagnosticsConsole() {
  const [exceptions, setExceptions] = useState<SystemException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "error" | "warning">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "backend" | "frontend" | "uploads" | "api" | "auth" | "database">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "resolved" | "ignored" | "all">("active");
  const [selectedException, setSelectedException] = useState<SystemException | null>(null);

  const fetchRealDiagnostics = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch error or exception logs from audit_logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .or('action.ilike.%error%,action.ilike.%fail%,action.ilike.%exception%')
        .order('created_at', { ascending: false })
        .limit(50);

      // 2. Fetch server telemetry logs
      let telemetryLogs: any[] = [];
      try {
        const res = await fetch('/api/v1/telemetry/logs');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.logs) {
            telemetryLogs = json.logs.filter((l: any) => l.level === 'ERROR' || l.level === 'WARN');
          }
        }
      } catch (err) {
        console.warn("Telemetry logs query note:", err);
      }

      const mappedExceptions: SystemException[] = [];

      if (telemetryLogs && telemetryLogs.length > 0) {
        telemetryLogs.forEach((l, idx) => {
          mappedExceptions.push({
            id: l.id || `LOG-${idx}`,
            errorClass: l.service ? `${l.service.toUpperCase()}_LOG` : "RuntimeLogEntry",
            message: l.message || "Server event captured in telemetry stream",
            category: (l.service === 'auth' || l.service === 'database' || l.service === 'api' || l.service === 'uploads') ? l.service : "backend",
            severity: l.level === 'ERROR' ? 'critical' : 'warning',
            timestamp: l.timestamp || new Date().toISOString(),
            stackTrace: `Service: ${l.service || 'backend'}\nLatency: ${l.latencyMs || 0}ms\nCPU: ${l.cpuUsagePct || 0}%\nMemory: ${l.memoryUsageMb || 0}MB`,
            status: "active"
          });
        });
      }

      if (auditData && auditData.length > 0) {
        auditData.forEach(a => {
          mappedExceptions.push({
            id: `ERR-${a.id.slice(0, 8)}`,
            errorClass: a.resource_type ? `${a.resource_type.toUpperCase()}_EVENT` : "AuditEvent",
            message: a.action || "Audit error condition logged",
            category: a.resource_type === 'auth' ? 'auth' : a.resource_type === 'api' ? 'api' : 'backend',
            severity: "error",
            timestamp: a.created_at || new Date().toISOString(),
            stackTrace: `Audit ID: ${a.id}\nUser: ${a.user_email || a.user_id || 'System'}\nIP: ${a.ip_address || '127.0.0.1'}`,
            ipAddress: a.ip_address || '127.0.0.1',
            userId: a.user_email || a.user_id,
            status: "active"
          });
        });
      }

      setExceptions(mappedExceptions);
    } catch (err) {
      console.warn("Diagnostics fetch note:", err);
      setExceptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealDiagnostics();
  }, []);

  // Derive counts dynamically for active errors
  const activeStats = useMemo(() => {
    const active = exceptions.filter(e => e.status === "active");
    return {
      backend: active.filter(e => e.category === "backend" || e.category === "database").length,
      frontend: active.filter(e => e.category === "frontend").length,
      uploads: active.filter(e => e.category === "uploads").length,
      api: active.filter(e => e.category === "api").length,
      auth: active.filter(e => e.category === "auth").length,
      database: active.filter(e => e.category === "database").length
    };
  }, [exceptions]);

  // Filter Exceptions List
  const filteredExceptions = useMemo(() => {
    return exceptions.filter(e => {
      const matchesSearch = !search || 
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        e.errorClass.toLowerCase().includes(search.toLowerCase()) ||
        e.message.toLowerCase().includes(search.toLowerCase()) ||
        e.stackTrace.toLowerCase().includes(search.toLowerCase());

      const matchesSeverity = severityFilter === "all" || e.severity === severityFilter;
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [exceptions, search, severityFilter, categoryFilter, statusFilter]);

  // Actions
  const handleResolve = (id: string) => {
    setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: "resolved" } : e));
    if (selectedException?.id === id) {
      setSelectedException(curr => curr ? { ...curr, status: "resolved" } : null);
    }
    toast.success(`Exception ${id} marked as Resolved.`);
  };

  const handleIgnore = (id: string) => {
    setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: "ignored" } : e));
    if (selectedException?.id === id) {
      setSelectedException(curr => curr ? { ...curr, status: "ignored" } : null);
    }
    toast.info(`Exception ${id} has been ignored/muted.`);
  };

  const handleResolveAll = () => {
    const activeCount = filteredExceptions.filter(e => e.status === "active").length;
    if (activeCount === 0) {
      toast.info("No active exceptions in current filter context.");
      return;
    }
    setExceptions(prev => prev.map(e => {
      const isMatched = filteredExceptions.some(fe => fe.id === e.id);
      return isMatched && e.status === "active" ? { ...e, status: "resolved" } : e;
    }));
    if (selectedException && selectedException.status === "active") {
      setSelectedException(curr => curr ? { ...curr, status: "resolved" } : null);
    }
    toast.success(`Successfully resolved ${activeCount} active exceptions.`);
  };

  const handleAssignToMe = (id: string) => {
    const developer = "info.vivexa@gmail.com";
    setExceptions(prev => prev.map(e => e.id === id ? { ...e, assignedTo: developer } : e));
    if (selectedException?.id === id) {
      setSelectedException(curr => curr ? { ...curr, assignedTo: developer } : null);
    }
    toast.success(`Assigned exception ${id} to ${developer}`);
  };

  const handleCopyStack = (stack: string) => {
    navigator.clipboard.writeText(stack);
    toast.success("Stack trace copied to clipboard.");
  };

  const handleRefreshDiagnostics = () => {
    fetchRealDiagnostics();
    toast.success("Diagnostics telemetry stream re-synchronized.");
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-indigo-400" />
            Platform Exceptions Sentry V1.2
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time telemetry, crash reporter, and exception tracking dashboard.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            onClick={handleRefreshDiagnostics}
            variant="outline" 
            className="bg-slate-900 border-indigo-500/20 hover:bg-slate-800 text-indigo-300 text-xs font-bold gap-1.5 h-9"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Telemetry Stream
          </Button>
          <Button 
            onClick={handleResolveAll}
            variant="outline" 
            className="bg-indigo-600/10 border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold gap-1.5 h-9"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resolve Filtered
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {[
          { title: "Database Errors", value: activeStats.database, icon: Database, color: "text-rose-400", bg: "bg-rose-500/5", border: "border-l-rose-500" },
          { title: "Backend Systems", value: activeStats.backend, icon: Server, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-l-amber-500" },
          { title: "Frontend Errors", value: activeStats.frontend, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-l-yellow-500" },
          { title: "Failed API Calls", value: activeStats.api, icon: CloudOff, color: "text-indigo-400", bg: "bg-indigo-500/5", border: "border-l-indigo-500" },
          { title: "IAM & Auth", value: activeStats.auth, icon: ShieldAlert, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-l-emerald-500" },
          { title: "Failed Uploads", value: activeStats.uploads, icon: FileWarning, color: "text-purple-400", bg: "bg-purple-500/5", border: "border-l-purple-500" }
        ].map((stat, i) => (
          <Card key={i} className={`bg-slate-900/60 border-slate-800/80 p-4 border-l-4 ${stat.border} ${stat.bg} hover:bg-slate-800/40 transition-all`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{stat.title}</span>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color} shrink-0`} />
            </div>
            <span className="text-2xl font-black mt-2 block text-white">{stat.value}</span>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search exceptions by class, message, ID or stack trace..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: "active", label: "Active" },
              { id: "resolved", label: "Resolved" },
              { id: "ignored", label: "Ignored" },
              { id: "all", label: "All" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  statusFilter === tab.id 
                    ? "bg-slate-900 text-indigo-400 border border-slate-800 shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Severity selector */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="error">Error Only</option>
            <option value="warning">Warning Only</option>
          </select>

          {/* Category selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="all">All Categories</option>
            <option value="database">Database</option>
            <option value="api">APIs</option>
            <option value="auth">Auth & Session</option>
            <option value="uploads">Upload streams</option>
            <option value="frontend">Client Frontend</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Exceptions table + detail panel */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Table List Column */}
        <div className={`space-y-4 ${selectedException ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <Card className="bg-slate-900/60 border-slate-800 overflow-hidden rounded-2xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/50 border-b border-slate-800">
                  <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-5 py-4">Exception class & ID</th>
                    <th className="px-5 py-4">Trigger Event & Context</th>
                    <th className="px-5 py-4">Severity</th>
                    <th className="px-5 py-4">Occurrence</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredExceptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        No platform exceptions match your filter criteria. All clear!
                      </td>
                    </tr>
                  ) : (
                    filteredExceptions.map((ex) => (
                      <tr 
                        key={ex.id} 
                        onClick={() => setSelectedException(ex)}
                        className={`hover:bg-slate-800/20 transition-colors cursor-pointer ${
                          selectedException?.id === ex.id ? "bg-indigo-500/5 border-l-2 border-l-indigo-500" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              ex.severity === "critical"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : ex.severity === "error"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block font-mono leading-none">{ex.errorClass}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-1 block">{ex.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <span className="text-xs text-slate-300 block truncate font-sans font-medium" title={ex.message}>
                            {ex.message}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 block font-mono truncate">
                            {ex.httpMethod || "HTTP"} {ex.requestUrl || "Platform Context"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                            ex.severity === "critical"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : ex.severity === "error"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }`}>
                            {ex.severity}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">
                          {new Date(ex.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              onClick={() => setSelectedException(ex)} 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Inspect Exception Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {ex.status === "active" && (
                              <>
                                <Button 
                                  onClick={() => handleResolve(ex.id)} 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0 hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20"
                                  title="Mark as Resolved"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  onClick={() => handleIgnore(ex.id)} 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0 hover:bg-slate-800 text-slate-500 hover:text-slate-400"
                                  title="Ignore Exception"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Selected Exception Details Sentry Inspector */}
        {selectedException && (
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              
              <CardHeader className="p-6 border-b border-slate-800/80 bg-slate-950/20 flex flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{selectedException.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                      selectedException.status === "active"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        : selectedException.status === "resolved"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {selectedException.status}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-white font-mono mt-1">{selectedException.errorClass}</CardTitle>
                </div>
                <Button 
                  onClick={() => setSelectedException(null)}
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Exception Message Banner */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider mb-1">Exception Message</span>
                  <p className="text-sm text-rose-400 font-medium leading-relaxed font-sans">{selectedException.message}</p>
                </div>

                {/* Exception Metadata Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Severity Level</span>
                    <span className="text-xs text-slate-200 mt-1 block font-semibold font-mono capitalize">{selectedException.severity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Telemetry Category</span>
                    <span className="text-xs text-slate-200 mt-1 block font-semibold font-mono capitalize">{selectedException.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">HTTP Method</span>
                    <span className="text-xs text-slate-200 mt-1 block font-semibold font-mono">{selectedException.httpMethod || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">User Context ID</span>
                    <span className="text-xs text-slate-200 mt-1 block font-semibold font-mono">{selectedException.userId || "System User"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Request URI Link</span>
                    <span className="text-xs text-indigo-400 mt-1 block font-mono truncate">{selectedException.requestUrl || "System context / local process"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Client User Agent</span>
                    <span className="text-xs text-slate-300 mt-1 block truncate leading-snug font-sans">{selectedException.userAgent || "Internal Agent Runtime Context"}</span>
                  </div>
                </div>

                {/* Stack Trace Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Full Trace Log</span>
                    <Button 
                      onClick={() => handleCopyStack(selectedException.stackTrace)}
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 gap-1 font-mono"
                    >
                      <Copy className="h-3 w-3" /> Copy Log
                    </Button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[10px] text-slate-400 font-mono leading-normal overflow-x-auto whitespace-pre max-h-56 scrollbar-thin">
                    {selectedException.stackTrace}
                  </pre>
                </div>

                {/* Context Assignee info */}
                {selectedException.assignedTo && (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold leading-none">Assigned Developer</span>
                      <span className="text-xs text-indigo-300 font-mono font-bold mt-1 block">{selectedException.assignedTo}</span>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                {selectedException.status === "active" && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                    <Button 
                      onClick={() => handleResolve(selectedException.id)}
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Resolve
                    </Button>
                    <Button 
                      onClick={() => handleAssignToMe(selectedException.id)}
                      size="sm" 
                      variant="outline"
                      className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Assign Me
                    </Button>
                    <Button 
                      onClick={() => handleIgnore(selectedException.id)}
                      size="sm" 
                      variant="outline"
                      className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Mute
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>

    </div>
  );
}
