import { useState } from "react";
import { Search, Sparkles, BookOpen, FileText, Database, Shield, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RagMatch {
  id: string;
  title: string;
  category: string;
  source: string;
  content: string;
  tags: string[];
  similarityScore: number;
}

interface RagSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RagSearchDialog({ isOpen, onClose }: RagSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [matches, setMatches] = useState<RagMatch[]>([]);
  const [isSyncingStore, setIsSyncingStore] = useState(false);

  if (!isOpen) return null;

  const handleSyncVectorStore = async () => {
    setIsSyncingStore(true);
    try {
      const res = await fetch("/api/v1/rag/sync-vector-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetProvider: "Supabase pgvector",
          tableName: "public.vector_knowledge_base"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Persistent Vector Sync: ${data.message} (${data.syncDetails.documentsSynced} docs, ${data.syncDetails.vectorDimensions}d HNSW index)`);
      } else {
        toast.error("Vector sync failed: " + data.error);
      }
    } catch (err: any) {
      toast.error("Vector store error: " + err.message);
    } finally {
      setIsSyncingStore(false);
    }
  };


  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/v1/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          topK: 4,
          category: categoryFilter
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnswer(data.synthesizedAnswer);
        setMatches(data.matches || []);
      } else {
        toast.error("Semantic search failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("RAG engine connection error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Semantic Vector RAG Search
              </h3>
              <p className="text-xs text-slate-400">
                pgvector cosine similarity search over PDFs, schemas, business glossary, & governance policy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSyncVectorStore}
              disabled={isSyncingStore}
              className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl h-8 px-3 gap-1.5"
            >
              <Database className="h-3.5 w-3.5" />
              {isSyncingStore ? "Syncing pgvector..." : "Sync to Supabase pgvector"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {["ALL", "Schema Metadata", "Governance Policy", "Documentation", "Business Glossary", "PDF Report"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. What is the revenue discount policy for enterprise customers?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 rounded-2xl h-11 gap-2"
          >
            {isSearching ? <Sparkles className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isSearching ? "Searching..." : "Vector Search"}
          </Button>
        </form>

        {/* Synthesized RAG Grounded Answer */}
        {answer && (
          <div className="p-5 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Grounded RAG Synthesis
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">{answer}</p>
          </div>
        )}

        {/* Top Matches Documents */}
        {matches.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Top Vector Matches ({matches.length})
            </h4>
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">
                        {m.category}
                      </span>
                      <h5 className="text-xs font-bold text-white">{m.title}</h5>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                      {m.similarityScore}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Source: {m.source}</span>
                    <div className="flex gap-1">
                      {m.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
