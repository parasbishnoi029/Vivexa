
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HardDrive, Search, Loader2, Trash2, Download, RefreshCw, Eye, FolderKanban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createAuditLog } from "@/lib/auditLogs";
import { useAuthStore } from "@/stores/authStore";

export default function AdminProjects() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = async (proj: any) => {
    if (!confirm(`Are you sure you want to delete project "${proj.name}"? This action cannot be undone.`)) return;

    setDeletingId(proj.id);
    const toastId = toast.loading(`Deleting project "${proj.name}"...`);

    try {
      const { error } = await supabase.from('projects').delete().eq('id', proj.id);
      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== proj.id));
      await createAuditLog({
        action: `Admin Deleted Project: ${proj.name}`,
        resourceType: 'projects',
        resourceId: proj.id,
        userId: user?.id,
        payload: { deleted_project_name: proj.name, owner_id: proj.owner_id }
      });

      toast.success(`Project "${proj.name}" deleted successfully.`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = () => {
    if (projects.length === 0) return;
    const headers = "Project ID,Project Name,Owner ID,Description,Created At\n";
    const rows = projects.map(p => `"${p.id}","${p.name || ''}","${p.owner_id || ''}","${(p.description || '').replace(/"/g, '""')}","${p.created_at}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Vivexa_Projects_Directory_${Date.now()}.csv`;
    a.click();
    toast.success("Projects directory exported to CSV!");
  };

  const filtered = projects.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.owner_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-cyan-400" />
            Projects Directory & Global Asset Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1">Monitor, manage, and audit user analytical projects across all workspace environments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadProjects} disabled={isLoading} variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Projects
          </Button>
          <Button onClick={handleExportCsv} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Catalog CSV
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search projects by name, description, or owner ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md">
        {isLoading ? (
          <div className="p-12 flex justify-center text-slate-500"><Loader2 className="animate-spin h-6 w-6 text-indigo-400" /></div>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 text-center text-slate-500 text-xs">
            No projects matching search criteria found in database.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Project Name & Metadata</th>
                  <th className="px-6 py-3.5 font-semibold">Owner ID</th>
                  <th className="px-6 py-3.5 font-semibold">Created Date</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-start gap-3">
                        <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 mt-0.5">
                          <FolderKanban className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">{p.name}</span>
                          <span className="text-xs text-slate-400 line-clamp-1">{p.description || "No description provided."}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{p.owner_id || "System"}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        disabled={deletingId === p.id}
                        onClick={() => handleDeleteProject(p)}
                        variant="outline"
                        size="sm"
                        className="bg-slate-950 border-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-xs"
                      >
                        {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-rose-400" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

