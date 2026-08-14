import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  FolderKanban, Database, BarChart3, Activity, 
  ArrowLeft, Clock, MoreVertical, Edit2, Trash2,
  FileText, Zap, LayoutDashboard, Share2, MessageSquare, ListTodo, Plus, Info, TrendingUp, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: datasets, isLoading: isDatasetsLoading } = useQuery({
    queryKey: ['project-datasets', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  const { data: reports, isLoading: isReportsLoading } = useQuery({
    queryKey: ['project-reports', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['project-activity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_activity')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });
  
  const { data: aiConversations } = useQuery({
    queryKey: ['project-ai', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!id
  });

  const chartData = useMemo(() => {
    const jsDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = jsDays[d.getDay()];
      data.push({ name: dayName, dateStr, events: 0 });
    }
    
    if (activities) {
      activities.forEach(act => {
        const dateStr = new Date(act.created_at).toISOString().split('T')[0];
        const dayObj = data.find(d => d.dateStr === dateStr);
        if (dayObj) dayObj.events += 1;
      });
    }
    return data;
  }, [activities]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Project deleted successfully');
      navigate('/workspace/projects');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isProjectLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-md flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/40 border-slate-800/60 p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/60 p-6 space-y-4 md:col-span-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </Card>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <FolderKanban className="h-16 w-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Project not found</h2>
        <p className="text-slate-400">This project may have been deleted or you don't have access.</p>
        <Button onClick={() => navigate('/workspace/projects')} variant="outline" className="mt-4">
          Return to Projects
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/workspace/projects')}
            className="mt-1 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">{project.name}</h1>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                {project.status || 'Active'}
              </Badge>
            </div>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              {project.description || "No description provided."}
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Updated {new Date(project.updated_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> ID: {project.id.split('-')[0]}...</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
            <Edit2 className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 border border-rose-600/30">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl"><Database className="h-5 w-5 text-indigo-400" /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Datasets</p>
              <p className="text-2xl font-bold text-white">{datasets?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl"><BarChart3 className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reports</p>
              <p className="text-2xl font-bold text-white">{reports?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl"><MessageSquare className="h-5 w-5 text-amber-400" /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Chats</p>
              <p className="text-2xl font-bold text-white">{aiConversations?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl"><RefreshCw className="h-5 w-5 text-cyan-400" /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sync Events</p>
              <p className="text-2xl font-bold text-white">{activities?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Analytics Chart */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" /> Project Analytics
              </CardTitle>
              <CardDescription>Activity volume over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="events" 
                      name="Activities" 
                      stroke="#818cf8" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorEvents)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Datasets */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400" /> Datasets
                </CardTitle>
                <CardDescription>Data sources connected to this project</CardDescription>
              </div>
              <Button onClick={() => navigate('/workspace/datasets')} size="sm" className="bg-indigo-600 hover:bg-indigo-500"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent>
              {isDatasetsLoading ? (
                <div className="text-slate-500 text-sm p-4">Loading datasets...</div>
              ) : datasets?.length === 0 ? (
                <div className="text-slate-500 text-sm p-8 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                  No datasets found. <span onClick={() => navigate('/workspace/datasets')} className="text-indigo-400 underline cursor-pointer">Add a dataset</span> to start analysis.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {datasets?.map(ds => (
                    <Link key={ds.id} to={`/workspace/datasets/${ds.id}`}>
                      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors group cursor-pointer h-full">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
                              <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white truncate max-w-[120px]" title={ds.name}>{ds.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{ds.type?.toUpperCase() || 'CSV'} • {(ds.size_bytes / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reports */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" /> Reports
                </CardTitle>
                <CardDescription>Generated executive summaries</CardDescription>
              </div>
              <Button onClick={() => navigate('/workspace/reports')} size="sm" className="bg-emerald-600 hover:bg-emerald-500"><Plus className="h-4 w-4 mr-1" /> New</Button>
            </CardHeader>
            <CardContent>
              {isReportsLoading ? (
                <div className="text-slate-500 text-sm p-4">Loading reports...</div>
              ) : reports?.length === 0 ? (
                <div className="text-slate-500 text-sm p-8 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                  No reports generated yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {reports?.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-200">{report.title || 'Untitled Report'}</p>
                          <p className="text-[10px] text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-white">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" /> Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isActivitiesLoading ? (
                <div className="text-slate-500 text-sm">Loading activity...</div>
              ) : activities?.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-4">No recent activity</div>
              ) : (
                <div className="relative border-l border-slate-800 ml-3 space-y-6">
                  {activities?.map((act, i) => (
                    <div key={act.id || i} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-slate-900 border-2 border-cyan-500 rounded-full -left-[1.5px] top-1.5" />
                      <p className="text-sm text-slate-300">{act.action}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(act.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => navigate('/workspace/reports')} variant="outline" className="w-full justify-start text-slate-300 hover:text-white border-slate-700 bg-slate-950/50">
                <BarChart3 className="h-4 w-4 mr-2 text-emerald-400" /> Generate Report
              </Button>
              <Button onClick={() => navigate('/workspace/ai/chat')} variant="outline" className="w-full justify-start text-slate-300 hover:text-white border-slate-700 bg-slate-950/50">
                <MessageSquare className="h-4 w-4 mr-2 text-amber-400" /> AI Analyst Chat
              </Button>
              <Button onClick={() => navigate('/workspace/datasets')} variant="outline" className="w-full justify-start text-slate-300 hover:text-white border-slate-700 bg-slate-950/50">
                <Database className="h-4 w-4 mr-2 text-indigo-400" /> Import Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
