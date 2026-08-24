import React, { useState } from "react";
import { 
  Terminal, Sparkles, Code2, Zap, CheckCircle2, 
  Copy, Play, ArrowRight, Shield, Layers, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const SemanticQuerySandbox: React.FC = () => {
  const [queryInput, setQueryInput] = useState("Show me MRR, Logo Churn Rate, and CAC by quarter");
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  const handleTestQuery = async () => {
    if (!queryInput.trim()) return;

    setIsExecuting(true);
    try {
      const response = await fetch("/api/v1/semantic/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryInput.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setQueryResult(data);
        toast.success(`Evaluated query across ${data.matchedMetricsCount} semantic metric definitions!`);
      } else {
        toast.error(data.error || "Failed to evaluate query");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run semantic query tester");
    } finally {
      setIsExecuting(false);
    }
  };

  const copySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast.success("Recommended SQL copied to clipboard!");
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <CardHeader className="border-b border-slate-800/80 bg-slate-950/40 p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" /> Interactive Semantic Query Sandbox
          </CardTitle>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
            Live Intelligence Router
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Natural Language Query or Business Intent</span>
            <span className="text-[10px] text-slate-500 font-normal">Resolves against active Semantic Layer</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g., Calculate NRR and Daily Active Users for active customers"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Button
              onClick={handleTestQuery}
              disabled={isExecuting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs px-5 gap-2"
            >
              {isExecuting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Evaluate Query
            </Button>
          </div>
        </div>

        {/* Preset query chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sample queries:</span>
          {[
            "Calculate MRR and Logo Churn Rate",
            "Show Customer Acquisition Cost (CAC) vs LTV",
            "Evaluate Net Retention Rate (NRR) and DAU"
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setQueryInput(preset); }}
              className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 font-medium transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Results output */}
        {queryResult && (
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Matched Metrics</span>
                <p className="text-lg font-bold text-indigo-400">{queryResult.matchedMetricsCount} Definitions</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Canonicalized Intent</span>
                <p className="text-xs font-mono text-slate-300 truncate">{queryResult.canonicalizedQuery}</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Smart Semantic Cache</span>
                <p className="text-xs font-bold text-emerald-400">
                  {queryResult.isCached ? "Cache Hit (0ms)" : "Fresh Synthesis"}
                </p>
              </div>
            </div>

            {queryResult.matchedMetrics && queryResult.matchedMetrics.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Matched Metric Definitions & Logic
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {queryResult.matchedMetrics.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-indigo-300">{m.name}</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                          {m.metricId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{m.description}</p>
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                        {m.sqlFormula || m.expression}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Synthesized SQL Projection
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copySql(queryResult.recommendedSql)}
                  className="h-6 text-[10px] text-slate-400 hover:text-white gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy SQL
                </Button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 leading-relaxed overflow-x-auto">
                {queryResult.recommendedSql}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
