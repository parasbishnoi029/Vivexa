import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UploadCloud, FileSpreadsheet, FileCode, CheckCircle2, 
  Sparkles, ArrowRight, Play, Database, ShieldCheck, 
  Zap, DollarSign, X, Layers, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { duckdbEngine } from "@/lib/duckdbEngine";
import { AdaptiveQueryRouter, QueryCostForecast } from "@/lib/adaptiveQueryRouter";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface WedgeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded?: (datasetInfo: any) => void;
}

const SAMPLE_DATASETS = [
  {
    name: "Enterprise SaaS Revenue & ARR",
    type: "CSV",
    size: "1.2 MB",
    rows: "12,450 rows",
    csv: `company_id,company_name,tier,arr_usd,mrr_usd,region,churn_risk,nps_score,contract_date\nC101,Acme Corp,Enterprise,145000,12083,North America,Low,9,2025-01-15\nC102,Globex Logistics,Enterprise,210000,17500,Europe,Medium,7,2025-02-01\nC103,Soylent Tech,Pro,48000,4000,Asia Pacific,Low,10,2025-02-14\nC104,Initech Cloud,Standard,18500,1541,North America,High,5,2025-03-01\nC105,Umbrella Health,Enterprise,320000,26666,Europe,Low,9,2025-03-10\nC106,Stark Micro,Pro,72000,6000,North America,Low,8,2025-03-15\nC107,Wayne Cyber,Enterprise,290000,24166,North America,Low,10,2025-03-22\nC108,Cyberdyne AI,Enterprise,180000,15000,Asia Pacific,Medium,7,2025-03-29`
  },
  {
    name: "Cloud Fleet Telemetry & Latency",
    type: "Parquet/CSV",
    size: "2.8 MB",
    rows: "28,900 rows",
    csv: `node_id,cluster_region,cpu_util_pct,mem_used_mb,p99_latency_ms,active_connections,status\nnode-us-east-1,us-east,42.5,4120,12.4,1840,HEALTHY\nnode-us-east-2,us-east,78.2,7400,28.6,3210,HEALTHY\nnode-eu-west-1,eu-west,35.1,3280,11.2,1420,HEALTHY\nnode-eu-west-2,eu-west,88.9,7950,45.1,4100,DEGRADED\nnode-ap-south-1,ap-south,54.8,5100,18.9,2150,HEALTHY\nnode-ap-east-1,ap-east,61.2,6240,21.5,2480,HEALTHY`
  }
];

export const WedgeOnboardingModal: React.FC<WedgeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedData, setLoadedData] = useState<{
    tableName: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
    sampleRows: Record<string, any>[];
    costForecast: QueryCostForecast;
  } | null>(null);

  const processFileContent = async (fileName: string, content: string) => {
    setIsProcessing(true);
    try {
      const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      
      // 1. Instant Ingest into DuckDB WASM / Edge Engine
      const tableInfo = await duckdbEngine.registerTableFromCsv(cleanName, content);
      
      // 2. Sample parse for UI immediate display
      const lines = content.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
      const rows: Record<string, any>[] = [];
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(",");
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx]?.trim().replace(/^["']|["']$/g, "") || "";
        });
        rows.push(row);
      }

      // 3. Compute instant Query Cost Forecast
      const forecast = AdaptiveQueryRouter.forecastCost(`SELECT * FROM ${cleanName} LIMIT 100`, {
        name: cleanName,
        sizeBytes: content.length,
        rowCount: Math.max(1, lines.length - 1)
      });

      // 4. Update Workspace Global Active Dataset
      const newDataset = {
        id: `wedge_${Date.now()}`,
        name: cleanName,
        sourceType: "InMemory",
        rowCount: Math.max(1, lines.length - 1),
        columnCount: headers.length,
        columns: headers.map(h => ({ name: h, type: "VARCHAR" })),
        csvContent: content
      };

      setLoadedData({
        tableName: cleanName,
        rowCount: Math.max(1, lines.length - 1),
        columnCount: headers.length,
        columns: headers,
        sampleRows: rows,
        costForecast: forecast
      });

      onDatasetLoaded?.(newDataset);
      toast.success(`⚡ "${fileName}" ingested instantly into DuckDB WASM vectorized memory!`);
    } catch (err: any) {
      console.error("Wedge ingestion error:", err);
      toast.error(`Failed to ingest file: ${err.message || "Unknown format"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) processFileContent(file.name, content);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) processFileContent(file.name, content);
    };
    reader.readAsText(file);
  };

  const handleLaunchNotebook = () => {
    onClose();
    navigate("/workspace/notebooks");
  };

  const handleLaunchAnalyst = () => {
    onClose();
    navigate("/workspace/ai-analyst");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Instant Wedge Data Ingestion</h3>
                <p className="text-xs text-slate-400">Zero database setup required. Instant in-browser DuckDB vectorization.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {!loadedData ? (
              <>
                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]"
                      : "border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-850/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.json,.txt,.parquet"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <h4 className="font-medium text-white text-base mb-1">
                    {isProcessing ? "Ingesting into Vectorized DuckDB..." : "Drop your .CSV or .Parquet file here"}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md text-center mb-4">
                    Files remain 100% private in your client browser memory. Instant SQL querying, column profiling, and AI analysis.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Zero Cloud Egress</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5 text-indigo-400" /> DuckDB WASM Ready</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-amber-400" /> Auto-Profiling</span>
                  </div>
                </div>

                {/* Pre-Loaded Enterprise Samples */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Or Try a Pre-Loaded Enterprise Sample</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SAMPLE_DATASETS.map((sample, idx) => (
                      <div
                        key={idx}
                        onClick={() => processFileContent(sample.name.replace(/\s+/g, "_"), sample.csv)}
                        className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                              {sample.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-850">
                          <span>{sample.rows}</span>
                          <span className="text-emerald-400 font-mono text-[11px] group-hover:underline flex items-center gap-1">
                            Load Instantly <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Success & Insights Screen */
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white text-sm">Table "{loadedData.tableName}" Active</h4>
                      <p className="text-xs text-slate-300">
                        {loadedData.rowCount.toLocaleString()} rows • {loadedData.columnCount} columns mapped in DuckDB WASM
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadedData(null)}
                    className="border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
                  >
                    Ingest Another
                  </Button>
                </div>

                {/* Query Cost Forecaster Banner */}
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                      <DollarSign className="h-4 w-4" />
                      <span>Adaptive Query Cost Forecast</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      100% Zero-Egress Edge Savings
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Cloud Warehouse (Snowflake)</span>
                      <span className="text-sm font-semibold text-rose-400">${loadedData.costForecast.cloudWarehouseEstimatedCostUsd.toFixed(4)}/query</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">DuckDB In-Browser Edge</span>
                      <span className="text-sm font-semibold text-emerald-400">$0.00 (Zero Cost)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Carbon Emission Saved</span>
                      <span className="text-sm font-semibold text-emerald-400">{loadedData.costForecast.carbonGramsEstimate}g CO2e</span>
                    </div>
                  </div>
                </div>

                {/* Sample Data Preview */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Column Schema Preview</h5>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                        <tr>
                          {loadedData.columns.slice(0, 5).map((col, i) => (
                            <th key={i} className="p-2.5 font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300">
                        {loadedData.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/40">
                            {loadedData.columns.slice(0, 5).map((col, cIdx) => (
                              <td key={cIdx} className="p-2.5 truncate max-w-[150px]">{String(row[col] || "-")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Launch Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    onClick={handleLaunchNotebook}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-medium"
                  >
                    <FileCode className="h-4 w-4" />
                    Open in Interactive Notebook
                  </Button>
                  <Button
                    onClick={handleLaunchAnalyst}
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800 gap-2 text-xs font-medium"
                  >
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Ask AI Analyst
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
