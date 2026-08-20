import React, { useState, useEffect } from "react";
import {
  AlertOctagon, Play, Pause, ChevronLeft, ChevronRight, Zap,
  Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ReferenceDot
} from "recharts";
import {
  StatisticalDiagnosticService,
  StatisticalScanResult,
  AnomalyBadgeInfo
} from "@/services/StatisticalDiagnosticService";

export interface TimelineScrubberPoint {
  period: string;
  timestamp: string;
  value: number;
  expected: number;
  metric: string;
}

const DEFAULT_TIMELINE_SERIES: TimelineScrubberPoint[] = [
  { period: "Day 1 (08:00)", timestamp: "2026-08-10 08:00 UTC", value: 98, expected: 100, metric: "Transaction Velocity" },
  { period: "Day 2 (12:00)", timestamp: "2026-08-11 12:00 UTC", value: 106, expected: 102, metric: "Transaction Velocity" },
  { period: "Day 3 (16:00)", timestamp: "2026-08-12 16:00 UTC", value: 104, expected: 101, metric: "Transaction Velocity" },
  { period: "Day 4 (Spike ▲)", timestamp: "2026-08-13 14:30 UTC", value: 186, expected: 104, metric: "Transaction Velocity" },
  { period: "Day 5 (10:00)", timestamp: "2026-08-14 10:00 UTC", value: 108, expected: 105, metric: "Transaction Velocity" },
  { period: "Day 6 (Drop ▼)", timestamp: "2026-08-15 04:15 UTC", value: 24, expected: 106, metric: "Transaction Velocity" },
  { period: "Day 7 (18:00)", timestamp: "2026-08-16 18:00 UTC", value: 102, expected: 107, metric: "Transaction Velocity" },
  { period: "Day 8 (Spike ▲)", timestamp: "2026-08-17 19:45 UTC", value: 168, expected: 109, metric: "Transaction Velocity" },
  { period: "Day 9 (14:00)", timestamp: "2026-08-18 14:00 UTC", value: 112, expected: 110, metric: "Transaction Velocity" },
  { period: "Day 10 (Drop ▼)", timestamp: "2026-08-19 02:20 UTC", value: 42, expected: 112, metric: "Transaction Velocity" },
  { period: "Day 11 (Now)", timestamp: "2026-08-19 22:00 UTC", value: 116, expected: 114, metric: "Transaction Velocity" },
];

interface AnomalyTimelineScrubberProps {
  dataSeries?: TimelineScrubberPoint[];
  datasetName?: string;
  onInjectIntoReport?: (scanResult: StatisticalScanResult) => void;
  onSelectTimestamp?: (point: TimelineScrubberPoint, anomaly?: AnomalyBadgeInfo) => void;
}

export function AnomalyTimelineScrubber({
  dataSeries = DEFAULT_TIMELINE_SERIES,
  datasetName = "Enterprise Partition",
  onInjectIntoReport,
  onSelectTimestamp
}: AnomalyTimelineScrubberProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(3); // Default to spike
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zThreshold, setZThreshold] = useState<number>(2.5);

  // Compute statistical diagnostics using StatisticalDiagnosticService
  const scanResult: StatisticalScanResult = React.useMemo(() => {
    return StatisticalDiagnosticService.scanTimeSeries(
      dataSeries.map((d) => ({ period: d.period, timestamp: d.timestamp, value: d.value, metric: d.metric })),
      zThreshold
    );
  }, [dataSeries, zThreshold]);

  const activePoint = dataSeries[selectedIndex] || dataSeries[0];
  const activeAnomaly = scanResult.anomalies.find((a) => a.index === selectedIndex);

  // Autoplay playback loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedIndex((prev) => (prev + 1) % dataSeries.length);
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, dataSeries.length]);

  const handleSliderChange = (idx: number) => {
    setSelectedIndex(idx);
    const pt = dataSeries[idx];
    const anom = scanResult.anomalies.find((a) => a.index === idx);
    if (onSelectTimestamp) onSelectTimestamp(pt, anom);
  };

  const jumpToNextAnomaly = () => {
    const nextIdx = scanResult.anomalies.find((a) => a.index > selectedIndex)?.index;
    if (nextIdx !== undefined) {
      handleSliderChange(nextIdx);
    } else if (scanResult.anomalies.length > 0) {
      handleSliderChange(scanResult.anomalies[0].index);
    }
  };

  const chartData = dataSeries.map((pt, i) => {
    const anom = scanResult.anomalies.find((a) => a.index === i);
    return {
      period: pt.period,
      timestamp: pt.timestamp,
      actual: pt.value,
      mean: scanResult.mean,
      ucl: Math.round((scanResult.mean + zThreshold * scanResult.standardDeviation) * 10) / 10,
      lcl: Math.max(0, Math.round((scanResult.mean - zThreshold * scanResult.standardDeviation) * 10) / 10),
      isAnomaly: !!anom,
      anomalyType: anom?.type || 'Normal',
      severity: anom?.severity || 'Normal',
    };
  });

  return (
    <Card className="bg-slate-900/75 border-slate-800 backdrop-blur-xl p-5 rounded-2xl shadow-xl space-y-4 relative overflow-hidden" id="anomaly-timeline-scrubber">
      <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600/30 to-amber-600/30 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Anomaly Timeline Scrubber</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {scanResult.anomalies.length} Flagged Points
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive temporal scrubber highlighting statistical parametric spikes (▲) and dropouts (▼) in <strong className="text-slate-300">{datasetName}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={jumpToNextAnomaly}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl h-8"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> Next Anomaly
          </Button>

          {onInjectIntoReport && (
            <Button
              size="sm"
              onClick={() => onInjectIntoReport(scanResult)}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl h-8 shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Inject Warnings into Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Chart with UCL/LCL control bands */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scrubberActualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 220]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "11px" }}
            />
            <Line type="monotone" dataKey="ucl" stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Upper Control Limit (+Zσ)" />
            <Line type="monotone" dataKey="lcl" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Lower Control Limit (-Zσ)" />
            <Line type="monotone" dataKey="mean" stroke="#64748b" strokeWidth={1.5} dot={false} name="Expected Baseline (Mean)" />
            <Area type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#scrubberActualGrad)" name="Observed Value" />
            <ReferenceLine x={activePoint.period} stroke="#38bdf8" strokeWidth={2} label={{ value: "Scrubber Cursor", fill: "#38bdf8", fontSize: 10, position: "top" }} />

            {chartData.map((pt, idx) => {
              if (!pt.isAnomaly) return null;
              const isSpike = pt.anomalyType === "Spike";
              return (
                <ReferenceDot
                  key={`dot-${idx}`}
                  x={pt.period}
                  y={pt.actual}
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

      {/* Interactive Range Input Slider */}
      <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center justify-center h-7 w-7"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => handleSliderChange((selectedIndex - 1 + dataSeries.length) % dataSeries.length)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors h-7 w-7 flex items-center justify-center"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleSliderChange((selectedIndex + 1) % dataSeries.length)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors h-7 w-7 flex items-center justify-center"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-slate-200 font-bold ml-1">{activePoint.period}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">Timestamp: <strong className="text-slate-200">{activePoint.timestamp}</strong></span>
            <span className="text-slate-400">Point: <strong className="text-violet-400">{selectedIndex + 1}/{dataSeries.length}</strong></span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative pt-2 pb-1">
          <input
            type="range"
            min={0}
            max={dataSeries.length - 1}
            value={selectedIndex}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
            id="anomaly-range-slider"
          />

          {/* Anomaly Badges on slider track */}
          <div className="relative w-full h-4 mt-1">
            {chartData.map((p, idx) => {
              if (!p.isAnomaly) return null;
              const leftPct = (idx / (dataSeries.length - 1)) * 100;
              const isSelected = selectedIndex === idx;
              const isSpike = p.anomalyType === "Spike";
              return (
                <button
                  key={`badge-${idx}`}
                  onClick={() => handleSliderChange(idx)}
                  style={{ left: `${leftPct}%` }}
                  className={`absolute -top-1 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    isSelected
                      ? (isSpike ? "bg-rose-600 text-white border-rose-400 scale-110 shadow-lg z-20" : "bg-amber-600 text-white border-amber-400 scale-110 shadow-lg z-20")
                      : (isSpike ? "bg-rose-950 text-rose-300 border-rose-500/40 hover:scale-105" : "bg-amber-950 text-amber-300 border-amber-500/40 hover:scale-105")
                  }`}
                >
                  {isSpike ? <ArrowUpRight className="h-2.5 w-2.5 text-rose-400" /> : <ArrowDownRight className="h-2.5 w-2.5 text-amber-400" />}
                  <span>{isSpike ? "Spike Detected" : "Drop Detected"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Point Diagnostic Card */}
      <div className={`p-4 rounded-xl border transition-all ${
        activeAnomaly
          ? (activeAnomaly.type === "Spike" ? "bg-rose-950/40 border-rose-500/40" : "bg-amber-950/40 border-amber-500/40")
          : "bg-slate-950/60 border-slate-800"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                activeAnomaly
                  ? (activeAnomaly.type === "Spike" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30")
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {activeAnomaly ? activeAnomaly.badgeLabel : "Stable Parametric Point"}
              </span>

              {activeAnomaly && (
                <span className="text-xs font-mono font-bold text-amber-300">
                  Z-Score: {activeAnomaly.zScore > 0 ? `+${activeAnomaly.zScore}σ` : `${activeAnomaly.zScore}σ`}
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
                activeAnomaly
                  ? (activeAnomaly.type === "Spike" ? "text-rose-400" : "text-amber-400")
                  : "text-emerald-400"
              }`}>
                {activePoint.value} k ops/sec
              </span>
            </div>

            <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Expected Mean</span>
              <span className="text-base font-black text-slate-300">
                {scanResult.mean} k ops/sec
              </span>
            </div>
          </div>
        </div>

        {activeAnomaly && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Root Cause Diagnosis:
              </span>
              <p className="text-slate-300 leading-relaxed">{activeAnomaly.explanation}</p>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Prescriptive Mitigation:
              </span>
              <p className="text-slate-300 leading-relaxed">{activeAnomaly.remediation}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
