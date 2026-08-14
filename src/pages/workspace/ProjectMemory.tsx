import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ScrollText, Search, Clock, FileText, MessageSquare, Loader2, Plus, 
  Lightbulb, Tags, Sliders, Trash2, CheckCircle2, ChevronRight, Cpu
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface CustomMemory {
  id: string;
  type: string;
  title: string;
  desc: string;
  date: string;
  category: "Business Rule" | "Security Anchor" | "Modeling Pivot";
  priority: "High" | "Medium" | "Low";
}

export default function ProjectMemory() {
  const { user } = useAuthStore();
  const [memories, setMemories] = useState<any[]>([]);
  const [customMemories, setCustomMemories] = useState<CustomMemory[]>(() => {
    const saved = localStorage.getItem("vivexa_custom_memories_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "mem-c1",
        type: "Business Rule",
        title: "Growth Forecasting Guardrails",
        desc: "Cap statistical projections to 45% YoY in presentations unless baseline conversion crosses 12%.",
        date: "Today",
        category: "Business Rule",
        priority: "High"
      },
      {
        id: "mem-c2",
        type: "Security Anchor",
        title: "PII Scrubbing Columns Mapping",
        desc: "Ensure column names matching 'phone_num', 'patient_id', and 'ssn' undergo sha256 encryption.",
        date: "Yesterday",
        category: "Security Anchor",
        priority: "High"
      }
    ];
  });

  const [search, setSearch] = useState("");
  const [recallQuery, setRecallQuery] = useState("");
  const [recallResults, setRecallResults] = useState<Array<{ memory: any, score: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Memory Modal state
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"Business Rule" | "Security Anchor" | "Modeling Pivot">("Business Rule");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");

  useEffect(() => {
    localStorage.setItem("vivexa_custom_memories_v2", JSON.stringify(customMemories));
  }, [customMemories]);

  useEffect(() => {
    async function loadMemories() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [chatsRes, reportsRes] = await Promise.all([
          supabase.from('ai_conversations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        const chatMemories = (chatsRes.data || []).map(c => ({
          id: c.id,
          type: "AI Conversation",
          title: c.title || "Data Chat Session",
          desc: `Conversation created on ${new Date(c.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          date: new Date(c.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
          icon: MessageSquare,
          color: "text-purple-400",
          bg: "bg-purple-500/10 border-purple-500/20",
          category: "AI Conversation",
          priority: "Medium"
        }));

        const reportMemories = (reportsRes.data || []).map(r => ({
          id: r.id,
          type: "Generated Report",
          title: r.title || "Executive Analysis",
          desc: `Executive report generated in format ${r.format || 'PDF'}.`,
          date: new Date(r.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
          icon: FileText,
          color: "text-blue-400",
          bg: "bg-blue-500/10 border-blue-500/20",
          category: "Generated Report",
          priority: "Medium"
        }));

        setMemories([...chatMemories, ...reportMemories]);
      } catch (err) {
        console.error("Error loading project memory:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMemories();
  }, [user]);

  const handleAddCustomMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Please fill in both the title and context body.");
      return;
    }

    const newMem: CustomMemory = {
      id: `mem-${Date.now()}`,
      type: newCategory,
      title: newTitle.trim(),
      desc: newDesc.trim(),
      date: "Just now",
      category: newCategory,
      priority: newPriority
    };

    setCustomMemories([newMem, ...customMemories]);
    setNewTitle("");
    setNewDesc("");
    setIsAddingMemory(false);
    toast.success("Custom knowledge segment persisted to Project Memory!");
  };

  const handleDeleteMemory = (id: string) => {
    setCustomMemories(prev => prev.filter(m => m.id !== id));
    toast.info("Knowledge block removed from project context.");
  };

  // Live vector recall search simulator
  const handleTestRecall = () => {
    if (!recallQuery.trim()) {
      setRecallResults([]);
      return;
    }

    const query = recallQuery.toLowerCase();
    const allItems = [
      ...customMemories.map(m => ({ ...m, icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" })),
      ...memories
    ];

    // Simulate cosine similarity scores based on term matches
    const scored = allItems.map(m => {
      let score = 0.15;
      const titleMatches = m.title.toLowerCase().includes(query);
      const descMatches = m.desc.toLowerCase().includes(query);

      if (titleMatches) score += 0.55;
      if (descMatches) score += 0.25;
      if (m.priority === "High") score += 0.05;

      return {
        memory: m,
        score: Math.min(score, 0.98)
      };
    })
    .filter(res => res.score > 0.25)
    .sort((a, b) => b.score - a.score);

    setRecallResults(scored);
    if (scored.length > 0) {
      toast.success(`Semantic lookup parsed ${scored.length} active matching memories.`);
    } else {
      toast.warning("No high-confidence memory nodes retrieved.");
    }
  };

  const combinedSearchList = useMemo(() => [
    ...customMemories.map(m => ({
      ...m,
      icon: Lightbulb,
      color: m.priority === 'High' ? "text-amber-400" : "text-blue-400",
      bg: m.priority === 'High' ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"
    })),
    ...memories
  ], [customMemories, memories]);

  const filtered = useMemo(() => {
    return combinedSearchList.filter(m => 
      m.title.toLowerCase().includes(search.toLowerCase()) || 
      m.desc.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [combinedSearchList, search]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 relative z-10 w-full max-w-5xl mx-auto">
      {/* Search Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <ScrollText className="h-6 w-6 text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Project Memory <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">HYBRID RAG</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Inject custom business insights, audit chat logs, and map secure target rules.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Filter memory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 pl-10 pr-4 py-2 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          </div>

          <Button 
            onClick={() => setIsAddingMemory(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Persist Insight
          </Button>
        </div>
      </motion.div>

      {/* Vector Probe Semantic Console */}
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-950/80 border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" /> MEMORY RECALL COGNITIVE PROBER
              </h3>
              <p className="text-[10px] text-slate-400">Perform semantic search matches against workspace memories to preview exact system prompts.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type lookup keyword (e.g., 'growth', 'sales', 'PII')..."
              value={recallQuery}
              onChange={(e) => setRecallQuery(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs text-slate-200"
            />
            <Button 
              onClick={handleTestRecall}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9"
            >
              Recall Node
            </Button>
          </div>

          {recallResults.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {recallResults.map((res, index) => (
                <div key={index} className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400 font-mono">[{index + 1}]</span>
                    <div>
                      <span className="font-bold text-slate-200">{res.memory.title}</span>
                      <span className="text-[10px] text-slate-500 ml-2 block sm:inline font-mono">({res.memory.category})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <span className="text-emerald-400">Confidence: {(res.score * 100).toFixed(0)}%</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-500" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <ScrollText className="h-12 w-12 mb-4 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">No project memory nodes match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-800/80" />
          
          <div className="space-y-6">
            {filtered.map((memory) => {
              const MemoryIcon = memory.icon || Lightbulb;
              const isCustom = memory.id.startsWith("mem-");

              return (
                <motion.div key={memory.id} variants={itemVariants} className="relative pl-16">
                  <div className={`absolute left-[18px] top-4 h-3.5 w-3.5 rounded-full border-2 bg-slate-950 ${
                    memory.priority === 'High' ? 'border-amber-500' : 'border-indigo-500'
                  }`} />
                  
                  <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl hover:bg-slate-800/40 transition-colors">
                    <CardContent className="p-5 flex flex-col sm:flex-row gap-5 items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border ${memory.bg || "bg-indigo-500/10 border-indigo-500/20"}`}>
                          <MemoryIcon className={`h-5 w-5 ${memory.color || "text-indigo-400"}`} />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                              {memory.category}
                            </span>
                            {memory.priority && (
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                memory.priority === "High" ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" : "bg-slate-800 text-slate-400"
                              }`}>
                                PRIORITY: {memory.priority}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono ml-auto"><Clock className="h-3 w-3" /> {memory.date}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-200">{memory.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{memory.desc}</p>
                        </div>
                      </div>

                      {isCustom && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 h-8 p-1.5 shrink-0 ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Insight Modal */}
      <AnimatePresence>
        {isAddingMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl"
            >
              <button onClick={() => setIsAddingMemory(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
                <Trash2 className="h-5 w-5 rotate-45" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Persist Custom Insight</h2>
                  <p className="text-[10px] text-slate-500">Inject permanent context into Vivexa's RAG prompt stack</p>
                </div>
              </div>

              <form onSubmit={handleAddCustomMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 font-mono">Title / Anchor Name</label>
                  <Input
                    required
                    placeholder="e.g., Target Growth Ceilings"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 font-mono">Context Payload Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe specific rules, filters, metadata overrides, or logic rules..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Insight Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="Business Rule">Business Rule</option>
                      <option value="Security Anchor">Security Anchor</option>
                      <option value="Modeling Pivot">Modeling Pivot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">RAG Priority Level</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setIsAddingMemory(false)} 
                    className="border-slate-800 text-slate-400 hover:text-white text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                  >
                    Persist Insight Node
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
