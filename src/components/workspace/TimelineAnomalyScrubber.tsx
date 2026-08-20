import { useState, useMemo, useEffect } from "react";
import {
  AlertOctagon, TrendingUp, TrendingDown, Play, Pause, RotateCcw,
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Sliders,
  ChevronLeft, ChevronRight, Filter, Info, Eye, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ReferenceDot, Scatter
} from "recharts";

export interface TimelineDataPoint {
  id: string;
  period: string;
  timestamp: string;
  baseline: number;
  actual: number;
  ucl: number; // Upper Control Limit (+3σ)
  lcl: number; // Lower Control Limit (-3σ)
  isAnomaly: boolean;
  anomalyType?: "Spike" | "Drop" | "Normal";
  deltaPct?: string;
  zScore?: string;
  metric: string;
  unit: string;
  severity?: "Critical" | "High" | "Moderate" | "Normal";
  rootCause?: string;
  remediation?: string;
  badge?: string;
}

export const DEFAULT_TIMELINE_POINTS: TimelineDataPoint[] = [
  {
    id: "tp-1",
    period: "Day 1 (08:00)",
    timestamp: "2026-08-10 08:00 UTC",
    baseline: 100,
    actual: 98,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  },
  {
    id: "tp-2",
    period: "Day 2 (12:00)",
    timestamp: "2026-08-11 12:00 UTC",
    baseline: 102,
    actual: 106,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  },
  {
    id: "tp-3",
    period: "Day 3 (16:00)",
    timestamp: "2026-08-12 16:00 UTC",
    baseline: 101,
    actual: 104,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  },
  {
    id: "tp-4",
    period: "Day 4 (Spike ▲)",
    timestamp: "2026-08-13 14:30 UTC",
    baseline: 104,
    actual: 186,
    ucl: 135,
    lcl: 65,
    isAnomaly: true,
    anomalyType: "Spike",
    deltaPct: "+78.8%",
    zScore: "+4.82σ",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Critical",
    badge: "Critical Surge (+78.8%)",
    rootCause: "High-volume flash campaign triggered multi-threaded ingest queue congestion.",
    remediation: "Deploy dynamic backpressure throttling and Winsorize top 0.5% tail values."
  },
  {
    id: "tp-5",
    period: "Day 5 (10:00)",
    timestamp: "2026-08-14 10:00 UTC",
    baseline: 105,
    actual: 108,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  },
  {
    id: "tp-6",
    period: "Day 6 (Drop ▼)",
    timestamp: "2026-08-15 04:15 UTC",
    baseline: 106,
    actual: 24,
    ucl: 135,
    lcl: 65,
    isAnomaly: true,
    anomalyType: "Drop",
    deltaPct: "-77.4%",
    zScore: "-4.12σ",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Critical",
    badge: "Zero-Fill Blackout (-77.4%)",
    rootCause: "Kafka broker partition rebalance deadlock during edge node auto-scaling.",
    remediation: "Upgrade consumer group protocol to cooperative sticky assignor and enable multi-AZ replication."
  },
  {
    id: "tp-7",
    period: "Day 7 (18:00)",
    timestamp: "2026-08-16 18:00 UTC",
    baseline: 107,
    actual: 102,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  },
  {
    id: "tp-8",
    period: "Day 8 (Spike ▲)",
    timestamp: "2026-08-17 19:45 UTC",
    baseline: 109,
    actual: 168,
    ucl: 135,
    lcl: 65,
    isAnomaly: true,
    anomalyType: "Spike",
    deltaPct: "+54.1%",
    zScore: "+3.65σ",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "High",
    badge: "Latency Variance Spike (+54.1%)",
    rootCause: "Unindexed full-table scan on foreign key join during batch analytics query.",
    remediation: "Enforce composite B-tree indexing on foreign key columns and set query execution timeouts."
  },
  {
    id: "tp-9",
    period: "Day 9 (14:00)",
    timestamp: "2026-08-18 14:00 UTC",
    baseline: 110,
    actual: 112,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  },
  {
    id: "tp-10",
    period: "Day 10 (Drop ▼)",
    timestamp: "2026-08-19 02:20 UTC",
    baseline: 112,
    actual: 42,
    ucl: 135,
    lcl: 65,
    isAnomaly: true,
    anomalyType: "Drop",
    deltaPct: "-62.5%",
    zScore: "-3.24σ",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Moderate",
    badge: "Ingestion Dip (-62.5%)",
    rootCause: "Transient SSL certificate renewal failure on third-party payment gateway webhook.",
    remediation: "Configure dual-redundant Anycast routing and automated certificate renewal probes."
  },
  {
    id: "tp-11",
    period: "Day 11 (Now)",
    timestamp: "2026-08-19 22:00 UTC",
    baseline: 114,
    actual: 116,
    ucl: 135,
    lcl: 65,
    isAnomaly: false,
    anomalyType: "Normal",
    metric: "Transaction Velocity & Pipeline Flow",
    unit: "k ops/sec",
    severity: "Normal"
  }
];

interface TimelineAnomalyScrubberProps {
  dataPoints?: TimelineDataPoint[];
  datasetName?: string;
  onSelectPoint?: (point: TimelineDataPoint) => void;
  onInjectIntoReport?: (anomalies: TimelineDataPoint[]) => void;
}

export function TimelineAnomalyScrubber({
  dataPoints = DEFAULT_TIMELINE_POINTS,
  datasetName = "Enterprise Dataset",
  onSelectPoint,
  onInjectIntoReport
}: TimelineAnomalyScrubberProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(3); // Default to first critical spike
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<"all" | "anomalies_only" | "spikes" | "drops">("all");

  const activePoint = dataPoints[selectedIndex] || dataPoints[0];

  const anomaliesList = useMemo(() => {
    return dataPoints.filter(p => p.isAnomaly);
  }, [dataPoints]);

  const filteredPoints = useMemo(() => {
    if (filterMode === "anomalies_only") return dataPoints.filter(p => p.isAnomaly);
    if (filterMode === "spikes") return dataPoints.filter(p => p.anomalyType === "Spike");
    if (filterMode === "drops") return dataPoints.filter(p => p.anomalyType === "Drop");
    return dataPoints;
  }, [dataPoints, filterMode]);

  // Autoplay playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedIndex(prev => (prev + 1) % dataPoints.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, dataPoints.length]);

  const handleScrub = (newIndex: number) => {
    setSelectedIndex(newIndex);
    if (onSelectPoint) {
      onSelectPoint(dataPoints[newIndex]);
    }
  };

  const handleNext = () => {
    handleScrub((selectedIndex + 1) % dataPoints.length);
  };

  const handlePrev = () => {
    handleScrub((selectedIndex - 1 + dataPoints.length) % dataPoints.length);
  };

  const handleJumpToNextAnomaly = () => {
    const nextAnomalyIdx = dataPoints.findIndex((p, idx) => idx > selectedIndex && p.isAnomaly);
    if (nextAnomalyIdx !== -1) {
      handleScrub(nextAnomalyIdx);
    } else {
      const firstAnomalyIdx = dataPoints.findIndex(p => p.isAnomaly);
      if (firstAnomalyIdx !== -1) handleScrub(firstAnomalyIdx);
    }
  };

  return (
    <Card className="bg-slate-900/70 border-slate-800 backdrop-blur-xl p-5 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600/30 to-amber-600/30 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Statistical Timeline Scrubber</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {anomaliesList.length} Anomalies Flagged
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive temporal playback highlighting statistical parametric spikes (▲) and dropouts (▼) in <strong className="text-slate-300">{datasetName}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterMode === "all" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterMode("spikes")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterMode === "spikes" ? "bg-rose-600 text-white shadow-sm" : "text-rose-400 hover:text-rose-200"
              }`}
            >
              Spikes (▲)
            </button>
            <button
              onClick={() => setFilterMode("drops")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterMode === "drops" ? "bg-amber-600 text-white shadow-sm" : "text-amber-400 hover:text-amber-200"
              }`}
            >
              Drops (▼)
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleJumpToNextAnomaly}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl h-8"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> Next Anomaly
          </Button>

          {onInjectIntoReport && (
            <Button
              size="sm"
              onClick={() => onInjectIntoReport(anomaliesList)}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl h-8 shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Inject Warnings into Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Chart Area with Control Limits and Anomaly Markers */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataPoints} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 220]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "11px" }}
              formatter={(val: any, name: string) => [
                `${val} k ops/sec`,
                name === "actual" ? "Observed Value" :
                name === "baseline" ? "Expected Mean" :
                name === "ucl" ? "Upper Control Limit (+3σ)" : "Lower Control Limit (-3σ)"
              ]}
            />
            {/* Control Limits */}
            <Line type="monotone" dataKey="ucl" stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="ucl" />
            <Line type="monotone" dataKey="lcl" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="lcl" />
            <Line type="monotone" dataKey="baseline" stroke="#64748b" strokeWidth={1.5} dot={false} name="baseline" />

            {/* Actual Series */}
            <Area type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#actualGrad)" name="actual" />

            {/* Active scrub cursor vertical line */}
            <ReferenceLine x={activePoint.period} stroke="#38bdf8" strokeWidth={2} label={{ value: "Scrubber Position", fill: "#38bdf8", fontSize: 10, position: "top" }} />

            {/* Highlight Anomaly Dots */}
            {dataPoints.map((point) => {
              if (!point.isAnomaly) return null;
              const isSpike = point.anomalyType === "Spike";
              return (
                <ReferenceDot
                  key={point.id}
                  x={point.period}
                  y={point.actual}
                  r={6}
                  fill={isSpike ? "#f43f5e" : "#f59e0b"}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Timeline Scrubber Slider Bar */}
      <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center justify-center h-7 w-7"
              title={isPlaying ? "Pause Timeline Autoplay" : "Play Timeline Animation"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors h-7 w-7 flex items-center justify-center"
              title="Previous Time Horizon"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors h-7 w-7 flex items-center justify-center"
              title="Next Time Horizon"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-slate-300 text-xs font-bold ml-1">
              {activePoint.period}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">Timestamp: <strong className="text-slate-200">{activePoint.timestamp}</strong></span>
            <span className="text-slate-400">Step: <strong className="text-violet-400">{selectedIndex + 1}/{dataPoints.length}</strong></span>
          </div>
        </div>

        {/* Range slider track with visual anomaly ticks */}
        <div className="relative pt-2 pb-1">
          <input
            type="range"
            min={0}
            max={dataPoints.length - 1}
            value={selectedIndex}
            onChange={(e) => handleScrub(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
          />

          {/* Anomaly Badges on timeline slider track */}
          <div className="relative w-full h-4 mt-1">
            {dataPoints.map((p, idx) => {
              if (!p.isAnomaly) return null;
              const leftPct = (idx / (dataPoints.length - 1)) * 100;
              const isSelected = selectedIndex === idx;
              const isSpike = p.anomalyType === "Spike";
              return (
                <button
                  key={p.id}
                  onClick={() => handleScrub(idx)}
                  style={{ left: `${leftPct}%` }}
                  className={`absolute -top-1 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    isSelected
                      ? (isSpike ? "bg-rose-600 text-white border-rose-400 scale-110 shadow-lg z-20" : "bg-amber-600 text-white border-amber-400 scale-110 shadow-lg z-20")
                      : (isSpike ? "bg-rose-950 text-rose-300 border-rose-500/40 hover:scale-105" : "bg-amber-950 text-amber-300 border-amber-500/40 hover:scale-105")
                  }`}
                  title={`${p.period}: ${p.badge || 'Anomaly'}`}
                >
                  {isSpike ? <ArrowUpRight className="h-2.5 w-2.5 text-rose-400" /> : <ArrowDownRight className="h-2.5 w-2.5 text-amber-400" />}
                  <span>{isSpike ? "Spike" : "Drop"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Data Point Diagnostic Inspector Card */}
      <div className={`p-4 rounded-xl border transition-all ${
        activePoint.isAnomaly
          ? (activePoint.anomalyType === "Spike" ? "bg-rose-950/40 border-rose-500/40" : "bg-amber-950/40 border-amber-500/40")
          : "bg-slate-950/60 border-slate-800"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                activePoint.isAnomaly
                  ? (activePoint.anomalyType === "Spike" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30")
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {activePoint.isAnomaly ? `Statistical ${activePoint.anomalyType}` : "Stable Parametric Point"}
              </span>

              {activePoint.badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-slate-200 border border-slate-700">
                  {activePoint.badge}
                </span>
              )}

              {activePoint.zScore && (
                <span className="text-xs font-mono font-bold text-amber-300">
                  Z-Score: {activePoint.zScore}
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{activePoint.period}</span>
              <span className="text-xs text-slate-400 font-normal">({activePoint.timestamp})</span>
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Observed Value</span>
              <span className={`text-base font-black ${
                activePoint.isAnomaly
                  ? (activePoint.anomalyType === "Spike" ? "text-rose-400" : "text-amber-400")
                  : "text-emerald-400"
              }`}>
                {activePoint.actual} {activePoint.unit}
              </span>
            </div>

            <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Expected Mean</span>
              <span className="text-base font-black text-slate-300">
                {activePoint.baseline} {activePoint.unit}
              </span>
            </div>

            <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Safe ±3σ Bounds</span>
              <span className="text-xs font-bold text-slate-400">
                {activePoint.lcl} - {activePoint.ucl} {activePoint.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Root Cause & Remediation if Anomaly */}
        {activePoint.isAnomaly && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Root Cause Diagnosis:
              </span>
              <p className="text-slate-300 leading-relaxed">{activePoint.rootCause}</p>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Prescriptive Mitigation:
              </span>
              <p className="text-slate-300 leading-relaxed">{activePoint.remediation}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
