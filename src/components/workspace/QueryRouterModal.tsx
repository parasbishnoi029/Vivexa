import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Database, Cpu, ShieldCheck, DollarSign, Clock, Layers, 
  ArrowRight, CheckCircle2, Play, Activity, Sparkles, RefreshCw, X
} from "lucide-react";
import { toast } from "sonner";

interface QueryRouterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlQuery?: string;
  datasetName?: string;
  rowCount?: number;
}

export function QueryRouterModal({
  isOpen,
  onClose,
  sqlQuery = "SELECT region, product_category, SUM(revenue) AS total_revenue, AVG(margin) AS avg_margin FROM sales_data WHERE status = 'COMPLETED' GROUP BY region, product_category ORDER BY total_revenue DESC LIMIT 50;",
  datasetName = "sales_data",
  rowCount = 45000
}: QueryRouterModalProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"query_plan" | "rewritten_sql" | "original_sql">("query_plan");

  const analyzeQuery = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/enterprise/query-router/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: sqlQuery,
          datasetProfile: {
            name: datasetName,
            rowCount: rowCount,
            sizeBytes: Math.round(rowCount * 120),
            isClientCached: true
          },
          userContext: { role: "Analyst", tenantId: "enterprise_corp" }
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch (err: any) {
      toast.error("Failed to analyze SQL routing plan");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      analyzeQuery();
    }
  }, [isOpen, sqlQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 p-0 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Hybrid Adaptive Query Router
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 font-mono text-[10px]">
                    Autonomous AST Routing
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directs simple analytical queries to DuckDB-WASM and offloads heavy queries to Snowflake / Databricks.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={analyzeQuery}
                disabled={loading}
                className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-xs h-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Re-analyze
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Target Routing Decision Banner */}
            {analysis && (
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Engine</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono text-xs px-2.5 py-0.5">
                      {analysis.targetEngine === "DUCKDB_WASM_LOCAL" ? "⚡ DuckDB-WASM Vectorized (Local)" : "☁️ Cloud Warehouse Pushdown"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Saved: ${analysis.estimatedCloudCostSavedUsd?.toFixed(3)} USD
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{analysis.estimatedDurationMs}ms
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {analysis.routingReason}
                </p>
              </div>
            )}

            {/* Core Metrics Grid */}
            {analysis && (
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Complexity Score
                  </span>
                  <div className="text-base font-bold font-mono text-white">
                    {analysis.complexityScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Estimated RAM
                  </span>
                  <div className="text-base font-bold font-mono text-white">
                    {analysis.estimatedMemoryMb} MB
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Scanned Rows
                  </span>
                  <div className="text-base font-bold font-mono text-white">
                    {rowCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Security Governance
                  </span>
                  <div className="text-xs font-semibold text-emerald-400 mt-1">
                    RLS + CLS Active
                  </div>
                </div>
              </div>
            )}

            {/* Tabs: Plan & Rewritten SQL */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("query_plan")}
                  className={`flex-1 text-xs py-1 px-3 rounded-md font-medium transition-all ${activeTab === "query_plan" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Execution Flow
                </button>
                <button
                  onClick={() => setActiveTab("rewritten_sql")}
                  className={`flex-1 text-xs py-1 px-3 rounded-md font-medium transition-all ${activeTab === "rewritten_sql" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Rewritten Query (Secured)
                </button>
                <button
                  onClick={() => setActiveTab("original_sql")}
                  className={`flex-1 text-xs py-1 px-3 rounded-md font-medium transition-all ${activeTab === "original_sql" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Original SQL
                </button>
              </div>

              {activeTab === "query_plan" && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Stage 1: Lexical & AST Token Scan (Aggregations, Group-By, Predicates)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Stage 2: Dynamic Row-Level Security (tenant_id = 'enterprise_corp') Enforced</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Stage 3: Vectorized In-Memory Execution via DuckDB-WASM Arrow Stream</span>
                  </div>
                </div>
              )}

              {activeTab === "rewritten_sql" && (
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {analysis?.rewrittenQuery || sqlQuery}
                </pre>
              )}

              {activeTab === "original_sql" && (
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  {sqlQuery}
                </pre>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
