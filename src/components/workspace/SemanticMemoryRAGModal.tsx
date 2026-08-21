import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, Search, Sparkles, CheckCircle2, Copy, Check,
  BookOpen, ArrowRight, Zap, Database, ExternalLink, ShieldCheck, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ORGANIZATIONAL_METRICS_STORE, querySemanticMemory, SemanticMetricDefinition } from "@/lib/semanticMemoryRAG";

interface SemanticMemoryRAGModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSqlToActiveCell?: (sql: string) => void;
}

export const SemanticMemoryRAGModal: React.FC<SemanticMemoryRAGModalProps> = ({
  isOpen,
  onClose,
  onInsertSqlToActiveCell,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<SemanticMetricDefinition>(ORGANIZATIONAL_METRICS_STORE[0]);
  const [copied, setCopied] = useState(false);

  const searchResult = querySemanticMemory(searchQuery);
  const displayMetrics = searchQuery.trim().length > 0 
    ? (searchResult.matchedMetric ? [searchResult.matchedMetric, ...ORGANIZATIONAL_METRICS_STORE.filter(m => m.id !== searchResult.matchedMetric?.id)] : ORGANIZATIONAL_METRICS_STORE)
    : ORGANIZATIONAL_METRICS_STORE;

  const handleCopy = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success("Copied verified formula SQL to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Organizational Query Memory & Semantic RAG
                </h2>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px]">
                  HNSW Vector Index
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Ground AI copilots on peer-verified business metrics, vetted SQL formulas, and enterprise dictionary definitions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Search & Metric Catalog */}
          <div className="w-full md:w-5/12 border-r border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ask in natural language (e.g. NRR, Churn, P99)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Verified Enterprise Knowledge ({displayMetrics.length})
              </span>
              {displayMetrics.map((metric) => (
                <div
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedMetric.id === metric.id
                      ? "bg-indigo-950/40 border-indigo-500 text-white shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200">{metric.name}</span>
                    <Badge variant="outline" className="text-[9px] bg-slate-800 text-slate-300 border-slate-700">
                      {metric.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Grounded Formula & SQL Preview */}
          <div className="w-full md:w-7/12 p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-slate-950/40">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedMetric.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-300 font-medium">{selectedMetric.verifiedBy}</span>
                    <span className="text-[10px] text-slate-500">• Confidence: {(selectedMetric.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(selectedMetric.formulaSql)}
                  className="h-8 text-xs border-slate-700 hover:bg-slate-800 text-slate-300 gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy SQL"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400">Natural Language Intent Trigger</span>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-indigo-300 italic font-mono">
                  "{selectedMetric.naturalLanguageQuery}"
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400">Canonical Grounded SQL Definition</span>
                <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {selectedMetric.formulaSql}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Semantic Guardrail Activated
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When team members prompt the Copilot for "{selectedMetric.name}", the generator automatically injects this verified calculation instead of hallucinating raw table columns.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-slate-300">
                Close
              </Button>
              {onInsertSqlToActiveCell && (
                <Button
                  size="sm"
                  onClick={() => {
                    onInsertSqlToActiveCell(selectedMetric.formulaSql);
                    toast.success(`Inserted ${selectedMetric.name} into active notebook cell!`);
                    onClose();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Insert into Cell
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SemanticMemoryRAGModal;
