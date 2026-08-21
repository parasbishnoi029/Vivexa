import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu, Server, Database, Zap, HardDrive, ShieldCheck, ArrowRight,
  Activity, CheckCircle2, RefreshCw, BarChart2, Radio, Sliders,
  Gauge, AlertTriangle, Layers, DownloadCloud, Sparkles, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export type ExecutionEngineType = "wasm" | "container" | "cloud_warehouse";

interface HybridExecutionGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEngine: ExecutionEngineType;
  onSelectEngine: (engine: ExecutionEngineType) => void;
  datasetSizeMb?: number;
  activeDatasetName?: string;
  totalMemoryAllocatedMb?: number;
}

export const HybridExecutionGatewayModal: React.FC<HybridExecutionGatewayModalProps> = ({
  isOpen,
  onClose,
  currentEngine,
  onSelectEngine,
  datasetSizeMb = 142.5,
  activeDatasetName = "Production Enterprise Data Lake",
  totalMemoryAllocatedMb = 2048,
}) => {
  const [arrowFlightEnabled, setArrowFlightEnabled] = useState(true);
  const [opfsPersistence, setOpfsPersistence] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<"Snowflake" | "BigQuery" | "ClickHouse" | "MotherDuck">("Snowflake");
  const [isSimulatingBenchmark, setIsSimulatingBenchmark] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    throughput: string;
    speedup: string;
    latencyMs: number;
  } | null>(null);

  // Recommendation engine based on dataset size
  const recommendedEngine: ExecutionEngineType = useMemo(() => {
    if (datasetSizeMb < 200) return "wasm";
    if (datasetSizeMb <= 5000) return "container";
    return "cloud_warehouse";
  }, [datasetSizeMb]);

  const engines = [
    {
      id: "wasm" as ExecutionEngineType,
      title: "In-Browser Edge (DuckDB WASM + Pyodide)",
      badge: "Zero-Latency ($0 Compute)",
      capacity: "< 200 MB Datasets",
      desc: "Executes directly inside your browser WebWorker sandbox. Ideal for instantaneous exploration, localized transformations, and sensitive zero-egress workloads.",
      icon: Zap,
      accentColor: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      specs: [
        { label: "Execution Latency", value: "< 2ms (In-Memory)" },
        { label: "Compute Billing", value: "$0.00 / hour" },
        { label: "Data Egress", value: "Zero (100% Client-Side)" },
        { label: "Max Heap Limit", value: "2.0 - 4.0 GB WASM" }
      ]
    },
    {
      id: "container" as ExecutionEngineType,
      title: "Dedicated Node / MicroVM Container",
      badge: "Balanced High-Throughput",
      capacity: "200 MB – 5.0 GB Datasets",
      desc: "Offloads cell execution to ephemeral serverless containers running Apache Arrow memory layouts with multi-threaded vector extensions.",
      icon: Server,
      accentColor: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
      badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      specs: [
        { label: "Execution Latency", value: "18ms - 45ms" },
        { label: "Compute Billing", value: "$0.04 / compute-hour" },
        { label: "Arrow Flight Streaming", value: "Up to 1.8 GB/s" },
        { label: "Memory Isolation", value: "16 GB High-Mem Pod" }
      ]
    },
    {
      id: "cloud_warehouse" as ExecutionEngineType,
      title: "Direct Cloud Pushdown (Enterprise DWH)",
      badge: "Infinite Petabyte Scale",
      capacity: "> 5.0 GB to Multi-Terabyte",
      desc: "Direct pushdown compiler translating SQL & PySpark logic directly into Snowflake, Google BigQuery, ClickHouse, or MotherDuck queries.",
      icon: Database,
      accentColor: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      specs: [
        { label: "Target Warehouse", value: selectedWarehouse },
        { label: "Query Execution", value: "Pushdown Query Plan" },
        { label: "Max Dataset Size", value: "Unlimited / Petabytes" },
        { label: "Partition Pruning", value: "Autonomous Dynamic" }
      ]
    }
  ];

  const handleRunBenchmark = () => {
    setIsSimulatingBenchmark(true);
    setBenchmarkResult(null);
    setTimeout(() => {
      setIsSimulatingBenchmark(false);
      setBenchmarkResult({
        throughput: arrowFlightEnabled ? "742.8 MB/s" : "48.2 MB/s",
        speedup: arrowFlightEnabled ? "15.4x (Zero-Copy Arrow Flight)" : "1.0x (Standard JSON)",
        latencyMs: arrowFlightEnabled ? 12 : 185
      });
      toast.success("Arrow Flight benchmark complete!");
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Adaptive Compute & Execution Routing Gateway
                </h2>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px]">
                  Hybrid WASM ↔ Cloud
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Seamlessly routes Python and SQL operations between local client WASM and distributed cloud clusters.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Active Dataset & Telemetry Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Active Working Dataset</div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {activeDatasetName}
                  <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                    {datasetSizeMb.toFixed(1)} MB
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-400">Recommended Route:</span>{" "}
                <span className="font-bold text-indigo-400 uppercase">
                  {recommendedEngine === "wasm" ? "Local WASM" : recommendedEngine === "container" ? "Container Pod" : "Cloud Pushdown"}
                </span>
              </div>
              <div className="text-right pl-4 border-l border-slate-800">
                <span className="text-slate-400">Heap Memory:</span>{" "}
                <span className="font-bold text-emerald-400">{totalMemoryAllocatedMb} MB Max</span>
              </div>
            </div>
          </div>

          {/* Engine Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {engines.map((eng) => {
              const isSelected = currentEngine === eng.id;
              const isRecommended = recommendedEngine === eng.id;
              const Icon = eng.icon;

              return (
                <div
                  key={eng.id}
                  onClick={() => onSelectEngine(eng.id)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative ${
                    isSelected
                      ? `bg-slate-800/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg`
                      : `bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40`
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-2.5 right-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider shadow-md">
                        Auto Recommended
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${eng.accentColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className={eng.badgeColor}>
                        {eng.capacity}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {eng.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                        {eng.desc}
                      </p>
                    </div>

                    {/* Specs Table */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                      {eng.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-center text-slate-400">
                          <span>{spec.label}:</span>
                          <span className="font-mono text-slate-200 font-medium">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    {eng.id === "cloud_warehouse" && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">Target DWH Engine</label>
                        <select
                          value={selectedWarehouse}
                          onChange={(e) => setSelectedWarehouse(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Snowflake">Snowflake Data Cloud</option>
                          <option value="BigQuery">Google BigQuery</option>
                          <option value="ClickHouse">ClickHouse Cloud</option>
                          <option value="MotherDuck">MotherDuck Serverless</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      {isSelected ? "Active Route" : "Select Route"}
                    </span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? "bg-indigo-500 border-indigo-400 text-white" : "border-slate-700"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advanced Compute Features: Arrow Flight & OPFS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arrow Flight Streaming Panel */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Apache Arrow Flight Protocol</h4>
                    <p className="text-[11px] text-slate-400">Zero-copy binary streaming between server & frontend</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={arrowFlightEnabled}
                    onChange={(e) => {
                      setArrowFlightEnabled(e.target.checked);
                      toast.info(`Apache Arrow Flight ${e.target.checked ? "Activated" : "Deactivated"}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Serialization Overhead:</span>
                  <span className="text-emerald-400 font-mono font-bold">{arrowFlightEnabled ? "0% (Zero-Copy Buffer)" : "High (JSON Parsing)"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transfer Compression:</span>
                  <span className="text-slate-200 font-mono">{arrowFlightEnabled ? "ZSTD / LZ4 Frame" : "Gzip"}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRunBenchmark}
                  disabled={isSimulatingBenchmark}
                  className="text-xs border-slate-700 hover:bg-slate-800 gap-1.5 h-7"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulatingBenchmark ? "animate-spin" : ""}`} />
                  {isSimulatingBenchmark ? "Benchmarking..." : "Run Flight Benchmark"}
                </Button>
                {benchmarkResult && (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {benchmarkResult.throughput} ({benchmarkResult.speedup})
                  </span>
                )}
              </div>
            </div>

            {/* OPFS Virtual File System */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">OPFS State Persistence</h4>
                    <p className="text-[11px] text-slate-400">Origin Private File System survives tab reloads</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opfsPersistence}
                    onChange={(e) => {
                      setOpfsPersistence(e.target.checked);
                      toast.info(`OPFS persistence ${e.target.checked ? "Enabled" : "Disabled"}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Persisted Parquet Tables:</span>
                  <span className="text-purple-400 font-mono font-bold">{opfsPersistence ? "4 DataFrames cached" : "Ephemeral RAM"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Quota Used:</span>
                  <span className="text-slate-200 font-mono">186.4 MB / 10 GB</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400">Auto-cleans stale temporary views after 48 hours</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.success("OPFS cache synchronized.")}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 h-7 px-2"
                >
                  Flush Cache
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autonomous memory limits prevent browser tabs from running Out of Memory (OOM).</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-slate-300">
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success(`Routing configured to ${currentEngine.toUpperCase()}`);
                onClose();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md"
            >
              Apply Gateway Policy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HybridExecutionGatewayModal;
