import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database, Play, Zap, Cpu, HardDrive, Download, FileText,
  Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, Table as TableIcon,
  Search, Filter, Code2, Sparkles, Terminal, ArrowUpRight, Eye, ShieldCheck,
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Sliders,
  UploadCloud, FileSpreadsheet, Plus, Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { duckdbEngine, DuckDBQueryResult, DuckDBTableInfo } from "@/lib/duckdbEngine";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

interface PrebuiltQuery {
  id: string;
  name: string;
  category: "Aggregations" | "Window Functions" | "Anomaly Detection" | "Retention";
  sql: string;
  description: string;
}

const PREBUILT_QUERIES: PrebuiltQuery[] = [
  {
    id: "pq-1",
    name: "Revenue by Segment with Percent of Total",
    category: "Window Functions",
    description: "Calculates rolling aggregations and windowed percent of total across customer tiers.",
    sql: `SELECT 
  segment,
  COUNT(*) as customer_count,
  ROUND(SUM(revenue), 2) as total_revenue,
  ROUND(AVG(revenue), 2) as avg_revenue,
  ROUND(SUM(revenue) * 100.0 / SUM(SUM(revenue)) OVER(), 2) as revenue_share_pct
FROM client_analytics_demo
GROUP BY segment
ORDER BY total_revenue DESC;`
  },
  {
    id: "pq-2",
    name: "Z-Score Statistical Anomaly Detection",
    category: "Anomaly Detection",
    description: "Detects outlier transactions exceeding 2 standard deviations in real-time.",
    sql: `WITH stats AS (
  SELECT 
    AVG(revenue) as mean_val, 
    STDDEV_SAMP(revenue) as std_val
  FROM client_analytics_demo
)
SELECT 
  id, 
  user_name, 
  segment, 
  revenue,
  ROUND((revenue - stats.mean_val) / NULLIF(stats.std_val, 0), 2) as z_score,
  CASE 
    WHEN ABS((revenue - stats.mean_val) / NULLIF(stats.std_val, 0)) > 2.0 THEN 'CRITICAL_OUTLIER'
    WHEN ABS((revenue - stats.mean_val) / NULLIF(stats.std_val, 0)) > 1.5 THEN 'MODERATE_SPIKE'
    ELSE 'NORMAL'
  END as anomaly_flag
FROM client_analytics_demo, stats
WHERE ABS((revenue - stats.mean_val) / NULLIF(stats.std_val, 0)) > 1.5
ORDER BY ABS(z_score) DESC;`
  },
  {
    id: "pq-3",
    name: "Decile Rank & Cumulative Distribution",
    category: "Aggregations",
    description: "Computes percentile distribution and ranking partitions using vectorized DuckDB kernels.",
    sql: `SELECT 
  id, 
  user_name, 
  segment, 
  revenue,
  NTILE(10) OVER (ORDER BY revenue DESC) as revenue_decile,
  ROUND(CUME_DIST() OVER (ORDER BY revenue), 4) as cumulative_distribution
FROM client_analytics_demo
LIMIT 25;`
  },
  {
    id: "pq-4",
    name: "Multi-Dimensional Drilldown with ROLLUP",
    category: "Retention",
    description: "Generates multi-level subtotals and grand totals in a single vectorized pass.",
    sql: `SELECT 
  COALESCE(segment, 'ALL SEGMENTS') as segment,
  COALESCE(region, 'ALL REGIONS') as region,
  COUNT(*) as total_records,
  ROUND(SUM(revenue), 2) as total_revenue,
  ROUND(AVG(quality_score), 1) as avg_quality
FROM client_analytics_demo
GROUP BY ROLLUP(segment, region)
ORDER BY segment, region;`
  }
];

const CHART_PALETTE = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6'];

export function EmbeddedDuckDBWorkbench({ 
  onClose,
  initialSql,
  initialQuery,
  datasetSource,
  datasetName
}: { 
  onClose?: () => void;
  initialSql?: string;
  initialQuery?: string;
  datasetSource?: any;
  datasetName?: string;
}) {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sqlQuery, setSqlQuery] = useState<string>(
    initialSql || initialQuery || PREBUILT_QUERIES[0].sql
  );
  const [activeTables, setActiveTables] = useState<DuckDBTableInfo[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>("client_analytics_demo");
  const [queryResult, setQueryResult] = useState<DuckDBQueryResult | null>(null);
  const [queryPlan, setQueryPlan] = useState<string | null>(null);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"results" | "chart" | "pivot" | "plan">("results");
  const [searchFilter, setSearchFilter] = useState("");
  const [history, setHistory] = useState<{ sql: string; time: string; rows: number; duration: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pivot Builder State
  const [pivotGroupBy, setPivotGroupBy] = useState<string>("");
  const [pivotMetric, setPivotMetric] = useState<string>("");
  const [pivotAgg, setPivotAgg] = useState<string>("SUM");
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "pie">("bar");

  // Initialize DuckDB WASM Engine & Seed sample table if empty
  useEffect(() => {
    let mounted = true;
    const initEngine = async () => {
      try {
        setIsInitializing(true);
        const ready = await duckdbEngine.init();
        if (!mounted) return;
        setIsEngineReady(ready);

        // Seed demo vectorized data if no tables
        const tables = await duckdbEngine.getRegisteredTables();
        if (tables.length === 0) {
          const sampleRows = Array.from({ length: 2500 }, (_, i) => {
            const segments = ["Enterprise", "Mid-Market", "SMB", "Strategic", "Government"];
            const regions = ["US-East", "US-West", "EU-Central", "APAC-South", "LATAM"];
            const seg = segments[i % segments.length];
            const reg = regions[(i * 3) % regions.length];
            const baseRev = seg === "Enterprise" ? 12000 : seg === "Strategic" ? 24000 : seg === "Mid-Market" ? 4500 : 850;
            const variance = Math.sin(i) * (baseRev * 0.45) + (i % 37 === 0 ? baseRev * 2.8 : 0);
            return {
              id: `TXN-${10000 + i}`,
              user_name: `Client_${100 + (i % 250)}`,
              segment: seg,
              region: reg,
              revenue: Math.max(120, Math.round((baseRev + variance) * 100) / 100),
              orders_count: (i % 14) + 1,
              quality_score: Math.min(100, Math.max(65, Math.round(88 + Math.cos(i) * 10))),
              created_at: new Date(Date.now() - (i * 3600 * 1000 * 2)).toISOString().split("T")[0]
            };
          });

          await duckdbEngine.registerTableFromJson("client_analytics_demo", sampleRows);
        }

        // If datasetSource is provided, register it too
        if (datasetSource && datasetSource.rows && datasetSource.rows.length > 0) {
          const cleanName = (datasetSource.name || "workspace_dataset").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
          await duckdbEngine.registerTableFromJson(cleanName, datasetSource.rows);
          setSelectedTableName(cleanName);
        }

        const currentTables = await duckdbEngine.getRegisteredTables();
        if (mounted) {
          setActiveTables(currentTables);
          if (currentTables.length > 0 && !datasetSource) {
            setSelectedTableName(currentTables[0].name);
          }
          // Run initial query
          runQuery(initialSql || PREBUILT_QUERIES[0].sql);
        }
      } catch (err) {
        console.error("DuckDB initialization failed:", err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    initEngine();
    return () => { mounted = false; };
  }, [datasetSource]);

  const runQuery = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    if (!q.trim()) return;

    try {
      setIsRunningQuery(true);
      const res = await duckdbEngine.query(q);
      setQueryResult(res);

      try {
        const plan = await duckdbEngine.explain(q);
        setQueryPlan(plan);
      } catch {
        setQueryPlan(null);
      }

      setHistory(prev => [
        { sql: q, time: new Date().toLocaleTimeString(), rows: res.rowCount, duration: res.executionTimeMs },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      console.error("DuckDB query execution error:", err);
      toast.error(`Query Error: ${err.message || "Syntax error in SQL"}`);
    } finally {
      setIsRunningQuery(false);
    }
  };

  const processFileIngestion = async (file: File) => {
    try {
      toast.loading(`Ingesting ${file.name} directly into In-Browser WASM memory...`, { id: "duckdb-upload" });
      const text = await file.text();
      const tableName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      
      let rows: any[] = [];
      if (file.name.endsWith(".json")) {
        rows = JSON.parse(text);
      } else {
        const Papa = (await import("papaparse")).default;
        const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
        rows = parsed.data;
      }

      if (!rows || rows.length === 0) {
        throw new Error("No data rows found in uploaded file.");
      }

      await duckdbEngine.registerTableFromJson(tableName, rows);
      const tables = await duckdbEngine.getRegisteredTables();
      setActiveTables(tables);
      setSelectedTableName(tableName);
      
      const newQuery = `SELECT * FROM ${tableName} LIMIT 50;`;
      setSqlQuery(newQuery);
      await runQuery(newQuery);

      toast.success(`Ingested ${rows.length.toLocaleString()} rows into table '${tableName}' (Zero Cloud Egress!)`, { id: "duckdb-upload" });
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`, { id: "duckdb-upload" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileIngestion(file);
  };

  const handleApplyPivot = () => {
    if (!selectedTableName) {
      toast.error("Please select an active table.");
      return;
    }
    const groupCol = pivotGroupBy || "segment";
    const metricCol = pivotMetric || "revenue";
    const agg = pivotAgg || "SUM";

    const generated = `SELECT \n  ${groupCol},\n  COUNT(*) as record_count,\n  ROUND(${agg}(${metricCol}), 2) as ${agg.toLowerCase()}_${metricCol}\nFROM ${selectedTableName}\nGROUP BY ${groupCol}\nORDER BY 3 DESC;`;
    
    setSqlQuery(generated);
    runQuery(generated);
    setSelectedTab("results");
    toast.success("Generated vectorized aggregation query!");
  };

  const handleExportCSV = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const headers = queryResult.columns.join(",");
    const csvContent = [
      headers,
      ...queryResult.rows.map(row => 
        queryResult.columns.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return "";
          if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `duckdb_wasm_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Query results exported to CSV");
  };

  const filteredRows = useMemo(() => {
    if (!queryResult || !queryResult.rows) return [];
    if (!searchFilter.trim()) return queryResult.rows;
    const s = searchFilter.toLowerCase();
    return queryResult.rows.filter(r => 
      Object.values(r).some(v => String(v).toLowerCase().includes(s))
    );
  }, [queryResult, searchFilter]);

  // Chart data extraction
  const chartData = useMemo(() => {
    if (!queryResult || queryResult.rows.length === 0) return [];
    const firstCol = queryResult.columns[0];
    const numericCols = queryResult.columns.filter(c => 
      queryResult.rows.some(r => typeof r[c] === 'number')
    );
    const metricCol = numericCols[0] || queryResult.columns[1];

    return queryResult.rows.slice(0, 20).map((r, i) => ({
      name: String(r[firstCol] ?? `Row ${i+1}`),
      value: Number(r[metricCol] ?? 0),
      raw: r
    }));
  }, [queryResult]);

  return (
    <Card className="bg-slate-900/95 border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-full gpu-layer">
      {/* Top Banner / Engine Status Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Embedded In-Browser DuckDB-Wasm Engine</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Zero Cloud Egress
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Cpu className="h-3 w-3" /> SIMD Vectorized
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-egress ANSI SQL aggregations executed locally in WebAssembly memory buffers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv,.json,.parquet" 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/40 text-xs text-amber-300 font-semibold"
          >
            <HardDrive className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> Ingest CSV / JSON
          </Button>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden">
        {/* Left Sidebar: Tables & Prebuilt SQL Templates (3 cols) */}
        <div className="lg:col-span-3 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-4 overflow-y-auto max-h-[680px]">
          {/* Tables Ingested */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-amber-400" /> In-Memory Tables ({activeTables.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Ready</span>
            </div>
            <div className="space-y-1.5">
              {activeTables.map((tbl) => (
                <div 
                  key={tbl.name}
                  onClick={() => {
                    setSelectedTableName(tbl.name);
                    const q = `SELECT * FROM ${tbl.name} LIMIT 50;`;
                    setSqlQuery(q);
                    runQuery(q);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedTableName === tbl.name
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-mono truncate">
                      {tbl.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {tbl.rowCount.toLocaleString()} rows
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{tbl.columnCount} cols</span>
                    <span>{tbl.sizeEstimate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) await processFileIngestion(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragging ? "border-amber-400 bg-amber-500/10" : "border-slate-800 hover:border-slate-700 bg-slate-900/30"
            }`}
          >
            <UploadCloud className="h-5 w-5 mx-auto text-amber-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-300 block">Drag & Drop CSV / JSON here</span>
            <span className="text-[9px] text-slate-500">Processed 100% in browser WebAssembly</span>
          </div>

          {/* Prebuilt High-Leverage Templates */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> High-Performance Templates
            </div>
            <div className="space-y-2">
              {PREBUILT_QUERIES.map((pq) => (
                <button
                  key={pq.id}
                  onClick={() => {
                    setSqlQuery(pq.sql);
                    runQuery(pq.sql);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all text-xs"
                >
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span>{pq.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {pq.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {pq.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right: SQL Editor + Query Output (9 cols) */}
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden bg-slate-900/50">
          {/* SQL Editor Toolbar */}
          <div className="p-4 border-b border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Vectorized SQL Query Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => runQuery()}
                  disabled={isRunningQuery || isInitializing}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {isRunningQuery ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Executing WASM...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Run Vectorized SQL
                    </>
                  )}
                </Button>
              </div>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={4}
              placeholder="SELECT * FROM table_name WHERE..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Execution Metrics & Tabs Bar */}
          {queryResult && (
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                  <Clock className="h-3.5 w-3.5" /> {queryResult.executionTimeMs.toFixed(2)} ms
                </span>
                <span className="text-slate-400 font-mono">
                  {queryResult.rowCount.toLocaleString()} rows
                </span>
                <span className="text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  {queryResult.engine}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
                  <button
                    onClick={() => setSelectedTab("results")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedTab === "results" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <TableIcon className="h-3 w-3 inline mr-1" /> Grid ({queryResult.rowCount})
                  </button>
                  <button
                    onClick={() => setSelectedTab("chart")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedTab === "chart" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="h-3 w-3 inline mr-1" /> Visual Chart
                  </button>
                  <button
                    onClick={() => setSelectedTab("pivot")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedTab === "pivot" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sliders className="h-3 w-3 inline mr-1" /> Pivot Builder
                  </button>
                  <button
                    onClick={() => setSelectedTab("plan")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedTab === "plan" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    EXPLAIN Plan
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-7 text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </div>
            </div>
          )}

          {/* Results Views */}
          <div className="flex-1 overflow-auto p-4 max-h-[420px]">
            {selectedTab === "results" && queryResult && (
              <div>
                {/* Search in Result */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="relative w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter returned rows..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Showing {filteredRows.length} of {queryResult.rowCount} rows
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold">
                        <th className="py-2.5 px-3 w-12 text-slate-600 text-center">#</th>
                        {queryResult.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 text-slate-300 font-bold border-r border-slate-800/40 last:border-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredRows.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 text-slate-600 text-center select-none text-[11px]">{idx + 1}</td>
                          {queryResult.columns.map((col) => (
                            <td key={col} className="py-2 px-3 text-slate-200 border-r border-slate-800/30 last:border-0 truncate max-w-[200px]">
                              {row[col] === null ? (
                                <span className="text-slate-600 italic">null</span>
                              ) : typeof row[col] === "number" ? (
                                <span className="text-cyan-300 font-semibold">{row[col].toLocaleString()}</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === "chart" && (
              <div className="h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Chart Archetype:</span>
                    <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
                      <button
                        onClick={() => setChartType("bar")}
                        className={`px-2 py-1 text-xs rounded font-medium ${chartType === "bar" ? "bg-amber-500/20 text-amber-300" : "text-slate-400"}`}
                      >
                        Bar
                      </button>
                      <button
                        onClick={() => setChartType("line")}
                        className={`px-2 py-1 text-xs rounded font-medium ${chartType === "line" ? "bg-amber-500/20 text-amber-300" : "text-slate-400"}`}
                      >
                        Line
                      </button>
                      <button
                        onClick={() => setChartType("area")}
                        className={`px-2 py-1 text-xs rounded font-medium ${chartType === "area" ? "bg-amber-500/20 text-amber-300" : "text-slate-400"}`}
                      >
                        Area
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Rendered client-side directly from DuckDB WASM memory</span>
                </div>

                <div className="h-[300px] w-full bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {selectedTab === "pivot" && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Sliders className="h-4 w-4" /> Visual Aggregation & Pivot Builder
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1.5">Group By Dimension</label>
                    <select
                      value={pivotGroupBy}
                      onChange={(e) => setPivotGroupBy(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500"
                    >
                      <option value="segment">segment</option>
                      <option value="region">region</option>
                      <option value="user_name">user_name</option>
                      <option value="created_at">created_at</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1.5">Aggregation Function</label>
                    <select
                      value={pivotAgg}
                      onChange={(e) => setPivotAgg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500"
                    >
                      <option value="SUM">SUM (Total)</option>
                      <option value="AVG">AVG (Mean)</option>
                      <option value="COUNT">COUNT (Frequency)</option>
                      <option value="MIN">MIN (Minimum)</option>
                      <option value="MAX">MAX (Maximum)</option>
                      <option value="MEDIAN">MEDIAN (50th Percentile)</option>
                      <option value="STDDEV_SAMP">STDDEV (Standard Dev)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1.5">Target Metric Column</label>
                    <select
                      value={pivotMetric}
                      onChange={(e) => setPivotMetric(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500"
                    >
                      <option value="revenue">revenue</option>
                      <option value="orders_count">orders_count</option>
                      <option value="quality_score">quality_score</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleApplyPivot}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1 text-slate-950" /> Generate & Execute in DuckDB
                  </Button>
                </div>
              </div>
            )}

            {selectedTab === "plan" && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed">
                {queryPlan || "No EXPLAIN plan available for this query statement."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
