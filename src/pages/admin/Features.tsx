import { useState, useEffect } from "react";
import { ToggleLeft, Search, Plus, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export default function AdminFeatures() {
  const [features, setFeatures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadFeatures() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('feature_flags').select('*');
        if (error) {
           console.error("Supabase features fetch error:", error);
           setFeatures([]);
        } else {
           setFeatures(data || []);
        }
      } catch (err) {
        console.error("Failed to load features", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFeatures();
  }, []);

  const filteredFeatures = features.filter(f => 
    f.name?.toLowerCase().includes(search.toLowerCase()) || 
    f.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ToggleLeft className="h-6 w-6 text-indigo-400" />
            Feature Flags
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage global feature rollouts and experiments.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Flag
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search features..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
        />
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <Card key={idx} className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/4 bg-slate-800/50 mb-2" />
                <Skeleton className="h-4 w-1/2 bg-slate-800/50" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full bg-slate-800/50" />
              </CardContent>
            </Card>
          ))
        ) : filteredFeatures.length === 0 ? (
           <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <CardContent className="py-12 text-center text-slate-400">
                No feature flags found.
              </CardContent>
           </Card>
        ) : (
          filteredFeatures.map((flag: any) => (
            <Card key={flag.id} className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-200">{flag.name}</CardTitle>
                  <CardDescription className="text-slate-400 mt-1">{flag.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${flag.status === 'enabled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {flag.status === 'enabled' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-800/60 mt-4">
                  <div className="flex gap-4">
                    <span>Rollout: <strong className="text-slate-200">{flag.rollout || '0'}%</strong></span>
                    <span>Env: <strong className="text-slate-200">{flag.environment || 'Production'}</strong></span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                    <Save className="h-4 w-4 mr-2" /> Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
