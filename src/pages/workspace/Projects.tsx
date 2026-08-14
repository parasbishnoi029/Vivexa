import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Plus, Search, Filter, FolderKanban, Star, Clock, MoreVertical, 
  Archive, Trash2, Copy, Layers, Activity, Share2,
  CheckSquare, Square, ChevronDown, ChevronUp, ListTodo
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectWizard } from "@/components/ui/project-wizard";
import { motion, AnimatePresence } from "motion/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { syncUserAndWorkspace } from "@/lib/syncUser";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { createNotification } from "@/lib/notifications";
import { Skeleton } from "@/components/ui/skeleton";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

function ProjectRoadmapMilestones({ projectId }: { projectId: string }) {
  const { session } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [milestones, setMilestones] = useState<{ id?: string; label: string; checked: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/milestones`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const json = await response.json();
      if (json.success && json.data && json.data.length > 0) {
        setMilestones(json.data.map((m: any) => ({
          id: m.id,
          label: m.label,
          checked: m.is_checked
        })));
      } else {
        initializeDefault();
      }
    } catch (e) {
      initializeDefault();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMilestones();
    }
  }, [projectId, session]);

  const saveMilestones = async (updated: any[]) => {
    try {
      await fetch(`/api/v1/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ milestones: updated })
      });
    } catch (e) {
      console.error("Failed to save milestones", e);
    }
  };

  const initializeDefault = () => {
    const defaults = [
      { label: "Define Investigation Scope", checked: false },
      { label: "Link & Clean Datasets", checked: false },
      { label: "Conduct AI Statistical Audit", checked: false },
      { label: "Train Forecasting Models", checked: false },
    ];
    setMilestones(defaults);
    // Don't auto-save defaults unless user interacts
  };

  const toggleMilestone = (label: string) => {
    const updated = milestones.map((m) =>
      m.label === label ? { ...m, checked: !m.checked } : m
    );
    setMilestones(updated);
    saveMilestones(updated);
    
    // Check if fully complete to offer praise toast
    const totalChecked = updated.filter(m => m.checked).length;
    if (totalChecked === updated.length) {
      toast.success("Outstanding! All investigation milestones checked for this project! 🎉");
    }
  };

  const completedCount = milestones.filter((m) => m.checked).length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="mt-4 bg-slate-950/40 rounded-xl border border-slate-800 p-3 space-y-2.5">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer group/header"
      >
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 group-hover/header:text-white transition-colors">
            Roadmap Milestones
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${progressPercent === 100 ? "bg-emerald-500/15 text-emerald-400" : "bg-indigo-500/10 text-indigo-300"}`}>
            {progressPercent}% Done
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-2 space-y-2 border-t border-slate-800/40 mt-2"
          >
            {milestones.map((m, idx) => (
              <div
                key={m.id || `m-${idx}`}
                onClick={() => toggleMilestone(m.label)}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-slate-900/30 cursor-pointer text-xs group"
              >
                {m.checked ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 group-hover:text-slate-400 shrink-0" />
                )}
                <span className={`transition-colors ${m.checked ? "text-slate-400 line-through" : "text-slate-300 group-hover:text-white"}`}>
                  {m.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (searchParams.get("newProject") === "true") {
      setIsWizardOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const selectedWorkspaceId = useWorkspaceStore(state => state.selectedWorkspaceId);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('projects').select('*');
      if (selectedWorkspaceId && selectedWorkspaceId !== "all") {
        query = query.eq('workspace_id', selectedWorkspaceId);
      } else {
        query = query.eq('owner_id', user?.id);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
        
      if (error) {
        setProjects([]);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, selectedWorkspaceId]);

  
  const toggleFavorite = async (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      const newFav = !proj.is_favorite;
      setProjects(projects.map(p => p.id === id ? { ...p, is_favorite: newFav } : p));
      await supabase.from('projects').update({ is_favorite: newFav }).eq('id', id);
    }
  };

  const deleteProject = async (id: string) => {
    const targetProject = projects.find(p => p.id === id);
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
      await supabase.from('projects').delete().eq('id', id);
      createNotification({
        title: "Project Deleted",
        message: `Project "${targetProject?.name || 'Untitled'}" was deleted from your workspace.`,
        type: "project_deleted",
        priority: "medium",
        actionUrl: "/workspace/projects"
      });
    }
  };

  const toggleArchive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Archived' ? 'Active' : 'Archived';
    setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus, is_archived: newStatus === 'Archived' } : p));
    await supabase.from('projects').update({ status: newStatus, is_archived: newStatus === 'Archived' }).eq('id', id);
  };

  const renameProject = async (id: string, currentName: string) => {
    const newName = prompt('Enter new project name:', currentName);
    if (newName && newName !== currentName) {
      setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
      await supabase.from('projects').update({ name: newName }).eq('id', id);
    }
  };

  const shareProject = async (id: string, currentName: string) => {
    setShareTitle(`Project: ${currentName}`);
    setShareUrl(`${window.location.origin}/workspace/projects/${id}`);
    setIsShareDialogOpen(true);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || 
                           (filter === "Favorites" && p.is_favorite) || 
                           (filter === "Active" && p.status?.toLowerCase() === "active" && !p.is_archived) ||
                           (filter === "Archived" && (p.is_archived || p.status === 'Archived'));
      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  return (
    <div className="space-y-6 relative z-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <FolderKanban className="h-6 w-6 text-indigo-400" />
            </div>
            Projects
          </h1>
          <p className="text-sm text-slate-400">Manage your analytical workspaces and investigations.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => setIsWizardOpen(true)}
            className="w-full sm:w-auto group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/20 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 backdrop-blur-xl shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", "Favorites", "Active", "Archived"].map(f => (
            <Button 
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={`
                ${filter === f 
                  ? 'bg-slate-700 text-white shadow-inner border-transparent' 
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                rounded-xl transition-all
              `}
            >
              {f === "Favorites" && <Star className="h-3.5 w-3.5 mr-2" />}
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-[380px] bg-slate-900/40 border-slate-800/50 backdrop-blur-xl flex flex-col p-6 space-y-6">
              <div className="flex justify-between items-start">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="mt-auto pt-4 flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center space-y-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <FolderKanban className="h-12 w-12 text-slate-500 opacity-50" />
          <h2 className="text-xl font-bold text-slate-300">No projects found</h2>
          <p className="text-slate-400 max-w-sm text-center">Create a new project to start organizing your datasets and analyses.</p>
          <Button onClick={() => setIsWizardOpen(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">Create Project</Button>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div key={project.id} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.9 }}>
                <Card className="h-full bg-slate-900/40 border-slate-800/50 backdrop-blur-xl flex flex-col group overflow-hidden relative shadow-xl hover:shadow-2xl hover:border-slate-700/50 transition-all duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${project.color || 'indigo'}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-xl bg-${project.color || 'indigo'}-500/10 border border-${project.color || 'indigo'}-500/20 shadow-[0_0_15px_rgba(var(--${project.color || 'indigo'}-500),0.1)] group-hover:scale-110 transition-transform`}>
                        <Layers className={`h-5 w-5 text-${project.color || 'indigo'}-400`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.preventDefault(); toggleFavorite(project.id); }}
                          className={`h-8 w-8 rounded-full ${project.is_favorite ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'} transition-colors`}
                        >
                          <Star className={`h-4 w-4 ${project.is_favorite ? 'fill-amber-400' : ''}`} />
                        </Button>
                        
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={(e) => { e.preventDefault(); shareProject(project.id, project.name); }}
                           className="h-8 w-8 rounded-full text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                           title="Share Project"
                         >
                           <Share2 className="h-3.5 w-3.5" />
                         </Button>
                         
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={(e) => { e.preventDefault(); renameProject(project.id, project.name); }}
      className="h-8 w-8 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
      title="Rename Project"
    >
      <Search className="h-3.5 w-3.5 hidden" />
      <span className="text-[10px] font-medium leading-none">Edit</span>
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={(e) => { e.preventDefault(); toggleArchive(project.id, project.status); }}
      className="h-8 w-8 rounded-full text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
      title="Archive/Restore Project"
    >
      <Archive className="h-3.5 w-3.5" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
      className="h-8 w-8 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
      title="Delete Project"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  
                      </div>
                    </div>
                    <Link to={`/workspace/projects/${project.id}`}>
                      <h3 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1">{project.name}</h3>
                    </Link>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col relative z-10">
                    <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-2">{project.description || 'No description provided.'}</p>
                    
                    <ProjectRoadmapMilestones projectId={project.id} />

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/60 mt-4">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(project.updated_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'} font-medium`}>
                          {project.status || 'Active'}
                        </span>
                        <Link to={`/workspace/projects/${project.id}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 ml-2">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {isWizardOpen && (
        <ProjectWizard 
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)} 
          onComplete={async (newProject) => {
            if (user) {
               await syncUserAndWorkspace(user);
               let workspaceIdToInsert = selectedWorkspaceId;
               if (!workspaceIdToInsert || workspaceIdToInsert === "all") {
                 const { data: wsList } = await supabase
                   .from('workspaces')
                   .select('id')
                   .eq('owner_id', user.id)
                   .order('created_at', { ascending: true })
                   .limit(1);
                 if (wsList && wsList.length > 0) {
                   workspaceIdToInsert = wsList[0].id;
                 }
               }
               const { data, error } = await supabase.from('projects').insert({
                 name: newProject.name,
                 description: newProject.description,
                 industry: newProject.industry,
                 color: newProject.theme || 'indigo',
                 owner_id: user.id,
                 workspace_id: workspaceIdToInsert || undefined,
                 status: 'Active'
               }).select();
               if (error) {
                 throw new Error(error.message || 'Failed to create project');
               }
               toast.success("Project created successfully");
               createNotification({
                 title: "Project Created",
                 message: `New project "${newProject.name}" was successfully created.`,
                 type: "project_created",
                 priority: "medium",
                 actionUrl: data && data[0] ? `/workspace/projects/${data[0].id}` : "/workspace/projects"
               });
               loadProjects();
            }
            setIsWizardOpen(false);
          }}
        />
      )}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title={shareTitle}
        shareUrl={shareUrl}
      />
    </div>
  );
}
