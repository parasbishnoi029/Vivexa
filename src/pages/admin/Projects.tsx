
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HardDrive, Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }
      setIsLoading(false);
    }
    loadProjects();
  }, []);

  const filtered = projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-cyan-400" />
          Global Projects Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">Monitor and manage user projects across all workspaces.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 text-center text-slate-500">
            No projects found.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/30 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Project Name</th>
                  <th className="px-6 py-4 font-semibold">Owner ID</th>
                  <th className="px-6 py-4 font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-200">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{p.owner_id}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(p.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}</td>
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

