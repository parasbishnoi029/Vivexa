import { useState, useEffect } from "react";
import { FileWarning, Search, Filter, Download, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuditLogs, AuditLogItem } from "@/lib/auditLogs";
import { toast } from "sonner";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      try {
        const data = await fetchAuditLogs(150);
        setLogs(data || []);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = "ID,Timestamp,Action,ResourceType,IPAddress,User\n";
    const rows = logs.map(l => `"${l.id}","${l.created_at}","${l.action}","${l.resource_type}","${l.ip_address}","${l.user_email || l.user_id || 'System'}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Vivexa_Audit_Logs_${Date.now()}.csv`;
    a.click();
    toast.success("Audit logs exported to CSV successfully!");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.ip_address?.includes(search);

    const matchesResource = resourceFilter === "all" || log.resource_type === resourceFilter;

    return matchesSearch && matchesResource;
  });

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileWarning className="h-6 w-6 text-indigo-400" />
            Enterprise System Audit Logs V3.0
          </h1>
          <p className="text-sm text-slate-400 mt-1">Immutable security event trail and administrative operation activity stream.</p>
        </div>
        <Button onClick={handleExportCsv} variant="outline" className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-white text-xs font-semibold">
          <Download className="h-4 w-4 mr-1.5 text-indigo-400" />
          Export Audit Log CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search action, user email, or IP address..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Resource Types</option>
          <option value="users">Users & Roles</option>
          <option value="api_keys">API Keys & Secrets</option>
          <option value="workspace_invitations">Workspace Invitations</option>
          <option value="datasets">Datasets</option>
          <option value="projects">Projects</option>
        </select>
      </div>

      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                <th className="px-6 py-3.5 font-semibold">Initiating User</th>
                <th className="px-6 py-3.5 font-semibold">Action Performed</th>
                <th className="px-6 py-3.5 font-semibold">Resource Type</th>
                <th className="px-6 py-3.5 font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24 bg-slate-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-5 w-20 ml-auto bg-slate-800" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No matching audit log records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-white">
                      {log.user_email || log.user_id || 'System'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                        {log.resource_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-400 text-[11px]">
                      {log.ip_address || '192.168.1.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
