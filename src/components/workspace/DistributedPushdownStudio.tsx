import React, { useState, useEffect } from "react";
import { 
  Database, Cpu, Layers, Play, Zap, ArrowRight, CheckCircle2, 
  RefreshCw, Terminal, Download, ShieldCheck, BarChart3, AlertCircle,
  FileCode, Sparkles, Filter, Copy, Code2, Server, Boxes
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type LakehouseEngineType = 'SNOWFLAKE' | 'BIGQUERY' | 'DATABRICKS_UNITY' | 'CLICKHOUSE' | 'DUCKDB_WASM';

interface DistributedPushdownStudioProps {
  selectedAsset?: any;
}

export default function DistributedPushdownStudio({ selectedAsset }: DistributedPushdownStudioProps) {
  const [targetEngine, setTargetEngine] = useState<LakehouseEngineType>("SNOWFLAKE");
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pushdownPlan, setPushdownPlan] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [activePreset, setActivePreset] = useState<string>("agg_revenue_by_region");

  const tableName = selectedAsset?.name || "gold_enterprise_revenue";

  const PRESETS = [
    {
      id: "agg_revenue_by_region",
      label: "📊 Distributed Aggregation (Region & Segment)",
      sql: `SELECT \n  region,\n  channel,\n  COUNT(*) AS total_transactions,\n  ROUND(SUM(amount_usd), 2) AS total_gross_revenue,\n  ROUND(AVG(amount_usd), 2) AS avg_deal_size,\n  ROUND(AVG(discount_rate), 3) AS avg_discount\nFROM ${tableName}\nWHERE event_timestamp >= '2026-01-01'\nGROUP BY region, channel\nORDER BY total_gross_revenue DESC;`
    },
    {
      id: "window_ranking",
      label: "📈 Distributed Window Partitioning (LTV Rank)",
      sql: `SELECT \n  customer_id,\n  region,\n  amount_usd,\n  is_recurring,\n  RANK() OVER (PARTITION BY region ORDER BY amount_usd DESC) as regional_rank,\n  SUM(amount_usd) OVER (PARTITION BY region) as region_total_volume\nFROM ${tableName}\nWHERE amount_usd > 1000\nLIMIT 50;`
    },
    {
      id: "predicate_pruning",
      label: "⚡ Deep Partition Pruning (> $3,000 High Margin)",
      sql: `SELECT \n  transaction_id,\n  customer_id,\n  amount_usd,\n  region,\n  event_timestamp\nFROM ${tableName}\nWHERE amount_usd >= 3000 AND is_recurring = TRUE\nORDER BY amount_usd DESC\nLIMIT 30;`
    },
    {
      id: "multi_dim_rollup",
      label: "🧩 Multi-Dimensional Rollup & Anomaly Scan",
      sql: `SELECT \n  region,\n  is_recurring,\n  COUNT(*) AS volume,\n  ROUND(SUM(amount_usd), 2) AS recognized_arr,\n  ROUND(STDDEV(amount_usd), 2) AS revenue_stddev\nFROM ${tableName}\nGROUP BY region, is_recurring\nHAVING COUNT(*) > 10\nORDER BY recognized_arr DESC;`
    }
  ];

  useEffect(() => {
    const currentPreset = PRESETS.find(p => p.id === activePreset) || PRESETS[0];
    setSqlQuery(currentPreset.sql);
    handleGeneratePlan(currentPreset.sql, targetEngine);
  }, [selectedAsset, targetEngine]);

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setSqlQuery(preset.sql);
    handleGeneratePlan(preset.sql, targetEngine);
  };

  const handleGeneratePlan = async (queryText?: string, engine?: LakehouseEngineType) => {
    const sql = (queryText || sqlQuery).trim();
    const currentEngine = engine || targetEngine;
    if (!sql) return;

    setIsAnalyzingPlan(true);
    try {
      const res = await fetch("/api/v1/lakehouse/pushdown-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: currentEngine, sql })
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPushdownPlan(data.plan);
      }
    } catch (err: any) {
      console.error("Plan generation error:", err);
    } finally {
      setIsAnalyzingPlan(false);
    }
  };

  const handleExecutePushdownQuery = async () => {
    const sql = sqlQuery.trim();
    if (!sql) {
      toast.error("Please enter a SQL query to push down.");
      return;
    }

    setIsExecuting(true);
    setQueryResult(null);
    try {
      const connectionConfig = {
        type: targetEngine,
        database: "ANALYTICS_PROD",
        schema: "PUBLIC",
        warehouse: "COMPUTE_WH_XS"
      };

      const res = await fetch("/api/v1/lakehouse/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: connectionConfig, sql })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setQueryResult(data.result);
        if (data.result.pushdownPlan) {
          setPushdownPlan(data.result.pushdownPlan);
        }
        toast.success(
          `Distributed pushdown executed on ${targetEngine} in ${data.result.execution_ms}ms (${data.result.rowCount} rows). Zero in-memory Node overhead!`
        );
      } else {
        toast.error(`Pushdown execution failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Query pushdown failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportCsv = () => {
    if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) {
      toast.error("No query results to export.");
      return;
    }
    const cols = queryResult.columns.map((c: any) => c.name);
    const headerLine = cols.join(",");
    const rowsLines = queryResult.rows.map((r: any) => 
      cols.map((col: string) => {
        const val = r[col];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const csvContent = [headerLine, ...rowsLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pushdown_${targetEngine.toLowerCase()}_results_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Pushdown result set exported as CSV.");
  };

  return (
    <div className="space-y-6 text-left">
      {/* Engine Pushdown Banner */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  Distributed Query Pushdown (Lakehouse Layer)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Zero Node.js Memory Overhead
                  </span>
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Pushes SQL transformations, predicate filters, and aggregations directly to cloud data warehouses (Snowflake, BigQuery, ClickHouse, Databricks, or DuckDB WASM). Eliminates server in-memory buffer bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[9px] uppercase font-mono text-slate-500 block">Catalog Table Target</span>
              <span className="text-xs font-bold text-indigo-400 font-mono">{tableName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Warehouse Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Select Target Pushdown Engine:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: "SNOWFLAKE", name: "Snowflake Warehouse", badge: "Micro-Partitions", color: "text-cyan-400" },
            { id: "BIGQUERY", name: "Google BigQuery", badge: "Dynamic Slots", color: "text-blue-400" },
            { id: "DATABRICKS_UNITY", name: "Databricks Photon", badge: "Delta Vectorized", color: "text-amber-400" },
            { id: "CLICKHOUSE", name: "ClickHouse OLAP", badge: "Columnar SIMD", color: "text-emerald-400" },
            { id: "DUCKDB_WASM", name: "DuckDB WASM (Browser)", badge: "Local Vectorized", color: "text-indigo-400" }
          ].map((engine) => (
            <button
              key={engine.id}
              onClick={() => {
                setTargetEngine(engine.id as LakehouseEngineType);
                handleGeneratePlan(sqlQuery, engine.id as LakehouseEngineType);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                targetEngine === engine.id
                  ? "bg-cyan-950/30 border-cyan-500/60 shadow-lg text-white"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black">{engine.name}</span>
                {targetEngine === engine.id && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
              </div>
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                {engine.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Query Presets Toolbar */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Analytical Pushdown Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                activePreset === preset.id
                  ? "bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* SQL Editor Box */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-xl">
        <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Distributed SQL Pushdown Console ({targetEngine})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGeneratePlan()}
              disabled={isAnalyzingPlan}
              className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            >
              <Code2 className="h-3 w-3 mr-1" /> Re-Analyze AST
            </Button>
            <Button
              size="sm"
              onClick={handleExecutePushdownQuery}
              disabled={isExecuting}
              className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1.5"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" /> Offloading to {targetEngine}...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-white" /> Pushdown to {targetEngine}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-slate-950">
          <textarea
            rows={6}
            value={sqlQuery}
            onChange={(e) => {
              setSqlQuery(e.target.value);
              handleGeneratePlan(e.target.value);
            }}
            className="w-full bg-slate-950 text-cyan-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
            placeholder="Write analytical SQL query to pushdown to target warehouse..."
          />
        </div>
      </div>

      {/* Visual Execution Plan & Pushdown Optimization Stages */}
      {pushdownPlan && (
        <Card className="bg-slate-950 border-slate-800 rounded-2xl shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Pushdown Optimization Execution Plan ({targetEngine})
              </CardTitle>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Pruning: {pushdownPlan.partitionPruningRate}
                </span>
                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Compute: {pushdownPlan.warehouseComputeUnits}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pushdownPlan.stages?.map((stage: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] truncate">{stage.stage}</span>
                    {stage.pushdownApplied ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        PUSHED DOWN
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        SKIPPED
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{stage.details}</p>
                  <div className="text-[10px] font-mono text-cyan-300">
                    Saved: ~{(stage.estimatedBytesSaved / (1024 * 1024)).toFixed(0)} MB Network I/O
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Results Data Table */}
      {queryResult && (
        <Card className="bg-slate-950 border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <CardHeader className="py-3 px-4 bg-slate-900/80 border-b border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-white uppercase">
                Pushdown Query Results ({queryResult.rowCount} rows)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Executed in {queryResult.execution_ms} ms
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-h-[380px]">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-center text-slate-600 w-10 border-r border-slate-800">#</th>
                  {queryResult.columns?.map((col: any, i: number) => (
                    <th key={i} className="px-4 py-2 font-bold text-white border-r border-slate-800">
                      {col.name} <span className="text-[9px] text-slate-500 font-normal">({col.type})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {queryResult.rows?.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-3 py-1.5 text-center text-slate-500 border-r border-slate-800/40">
                      {rIdx + 1}
                    </td>
                    {queryResult.columns?.map((col: any, cIdx: number) => (
                      <td key={cIdx} className="px-4 py-1.5 text-slate-300 border-r border-slate-800/20 truncate max-w-[240px]">
                        {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : <span className="text-slate-600 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
