import React, { useState, useMemo } from "react";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Activity, BarChart2,
  Sliders, Search, Filter, Copy, Check, ChevronLeft, ChevronRight,
  HelpCircle, Info, Calculator, Cpu, ArrowUpRight, ArrowDownRight,
  RefreshCw, Sparkles, AlertCircle, FileSpreadsheet, Eye, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { DatasetProfile, ColumnProfile } from "@/lib/dataEngine";
import { AnalysisValidator, DataEntryErrorCheckResult } from "@/lib/analysisValidator";
import { toast } from "sonner";

interface StatisticalDiagnosticsViewProps {
  profile: DatasetProfile | null;
  rows: any[];
  datasetName: string;
  onNavigateToCleaning?: () => void;
  onNavigateToPreview?: () => void;
}

export interface DetailedZScoreAnomaly {
  rowIndex: number;
  columnName: string;
  rawValue: any;
  numericValue: number;
  zScore: number;
  absZScore: number;
  mean: number;
  stdDev: number;
  deviationFromMean: number;
  percentDeviation: number;
  isExtreme: boolean;
  thresholdUsed: number;
  lowerBound: number;
  upperBound: number;
  violationType: 'HIGH_OUTLIER' | 'LOW_OUTLIER';
  justification: string;
}

export default function StatisticalDiagnosticsView({
  profile,
  rows,
  datasetName,
  onNavigateToCleaning,
  onNavigateToPreview
}: StatisticalDiagnosticsViewProps) {
  // State
  const [selectedCol, setSelectedCol] = useState<string>("ALL");
  const [zThreshold, setZThreshold] = useState<number>(3.0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'EXTREME' | 'MODERATE'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'anomalies' | 'metadata' | 'chart'>('anomalies');

  const numericCols = useMemo(() => {
    return profile?.numericColumns || [];
  }, [profile]);

  // Selected column for deep dive charts and specific metadata
  const activeChartCol = useMemo(() => {
    if (selectedCol !== "ALL" && numericCols.includes(selectedCol)) {
      return selectedCol;
    }
    return numericCols[0] || "";
  }, [selectedCol, numericCols]);

  // AnalysisValidator Data Entry check
  const dataEntryCheck: DataEntryErrorCheckResult | null = useMemo(() => {
    if (!profile) return null;
    return AnalysisValidator.checkDataEntryErrorsAndOutliers(profile, rows, zThreshold);
  }, [profile, rows, zThreshold]);

  // Compute Z-Score anomalies for each numerical column
  const allAnomalies: DetailedZScoreAnomaly[] = useMemo(() => {
    if (!profile || !rows || rows.length === 0 || numericCols.length === 0) return [];

    const anomaliesList: DetailedZScoreAnomaly[] = [];

    for (const colName of numericCols) {
      const colProfile = profile.columns.find(c => c.name === colName);
      if (!colProfile || !colProfile.numericStats) continue;

      const { mean, std } = colProfile.numericStats;
      if (std === 0 || isNaN(std)) continue;

      const lowerBound = mean - zThreshold * std;
      const upperBound = mean + zThreshold * std;

      rows.forEach((row, idx) => {
        const rawVal = row[colName];
        if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
          const numVal = Number(String(rawVal).replace(/[\$,€,£,₹,¥\s,]/g, ''));
          if (!isNaN(numVal)) {
            const z = (numVal - mean) / std;
            const absZ = Math.abs(z);

            if (absZ >= zThreshold) {
              const isExtreme = absZ >= 3.5;
              const deviation = numVal - mean;
              const pctDev = (deviation / (Math.abs(mean) || 1)) * 100;
              const isHigh = numVal > upperBound;

              const justification = isHigh
                ? `Value (${numVal.toLocaleString()}) is +${z.toFixed(4)} SDs above mean (${mean.toFixed(4)}). Exceeds upper limit (${upperBound.toFixed(4)}).`
                : `Value (${numVal.toLocaleString()}) is ${z.toFixed(4)} SDs below mean (${mean.toFixed(4)}). Drops below lower limit (${lowerBound.toFixed(4)}).`;

              anomaliesList.push({
                rowIndex: idx + 1,
                columnName: colName,
                rawValue: rawVal,
                numericValue: numVal,
                zScore: parseFloat(z.toFixed(4)),
                absZScore: parseFloat(absZ.toFixed(4)),
                mean: parseFloat(mean.toFixed(4)),
                stdDev: parseFloat(std.toFixed(4)),
                deviationFromMean: parseFloat(deviation.toFixed(4)),
                percentDeviation: parseFloat(pctDev.toFixed(4)),
                isExtreme,
                thresholdUsed: zThreshold,
                lowerBound: parseFloat(lowerBound.toFixed(4)),
                upperBound: parseFloat(upperBound.toFixed(4)),
                violationType: isHigh ? 'HIGH_OUTLIER' : 'LOW_OUTLIER',
                justification
              });
            }
          }
        }
      });
    }

    // Sort anomalies by highest absolute Z-score
    return anomaliesList.sort((a, b) => b.absZScore - a.absZScore);
  }, [profile, rows, numericCols, zThreshold]);

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    let list = [...allAnomalies];

    if (selectedCol !== "ALL") {
      list = list.filter(a => a.columnName === selectedCol);
    }

    if (severityFilter === "EXTREME") {
      list = list.filter(a => a.isExtreme);
    } else if (severityFilter === "MODERATE") {
      list = list.filter(a => !a.isExtreme);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.columnName.toLowerCase().includes(q) ||
        String(a.rowIndex).includes(q) ||
        String(a.rawValue).toLowerCase().includes(q) ||
        String(a.zScore).includes(q) ||
        a.justification.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allAnomalies, selectedCol, severityFilter, searchQuery]);

  // Paginated Anomalies
  const totalPages = Math.ceil(filteredAnomalies.length / pageSize) || 1;
  const paginatedAnomalies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnomalies.slice(start, start + pageSize);
  }, [filteredAnomalies, currentPage, pageSize]);

  // Chart Data for Active Chart Column
  const chartData = useMemo(() => {
    if (!rows || rows.length === 0 || !activeChartCol || !profile) return [];

    const colProfile = profile.columns.find(c => c.name === activeChartCol);
    if (!colProfile || !colProfile.numericStats) return [];

    const { mean, std } = colProfile.numericStats;
    if (std === 0 || isNaN(std)) return [];

    // Take a sample of up to 200 rows evenly distributed across dataset
    const step = Math.max(1, Math.floor(rows.length / 200));
    const sample: any[] = [];

    for (let i = 0; i < rows.length; i += step) {
      const rawVal = rows[i][activeChartCol];
      if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
        const numVal = Number(String(rawVal).replace(/[\$,€,£,₹,¥\s,]/g, ''));
        if (!isNaN(numVal)) {
          const z = (numVal - mean) / std;
          const isOutlier = Math.abs(z) >= zThreshold;
          sample.push({
            rowIdx: i + 1,
            value: numVal,
            zScore: parseFloat(z.toFixed(4)),
            isOutlier,
            isExtreme: Math.abs(z) >= 3.5,
            rawValue: rawVal
          });
        }
      }
    }

    return sample;
  }, [rows, activeChartCol, profile, zThreshold]);

  // Chart Active Column Stats
  const activeColStats = useMemo(() => {
    if (!profile || !activeChartCol) return null;
    return profile.columns.find(c => c.name === activeChartCol)?.numericStats || null;
  }, [profile, activeChartCol]);

  // Copy Markdown Report
  const handleCopyReport = () => {
    if (!profile) return;

    let text = `# Statistical Z-Score Diagnostics Report - ${datasetName}\n`;
    text += `*Generated by AnalysisValidator Engine*\n\n`;
    text += `- **Target Dataset**: ${datasetName}\n`;
    text += `- **Analyzed Rows**: ${profile.totalRows.toLocaleString()}\n`;
    text += `- **Numerical Columns**: ${numericCols.length} (${numericCols.join(', ')})\n`;
    text += `- **Active Z-Threshold**: ±${zThreshold} Standard Deviations\n`;
    text += `- **Total Flagged Outliers**: ${allAnomalies.length}\n`;
    text += `- **Extreme Outliers (|Z| >= 3.5)**: ${allAnomalies.filter(a => a.isExtreme).length}\n\n`;

    text += `## Column Statistical Metadata Summary\n\n`;
    text += `| Column | Mean (μ) | StdDev (σ) | Min / Max | Z-Threshold Bounds | Outliers Count |\n`;
    text += `|---|---|---|---|---|---|\n`;

    numericCols.forEach(colName => {
      const colProf = profile.columns.find(c => c.name === colName);
      if (colProf && colProf.numericStats) {
        const { mean, std, min, max } = colProf.numericStats;
        const low = mean - zThreshold * std;
        const high = mean + zThreshold * std;
        const count = allAnomalies.filter(a => a.columnName === colName).length;
        text += `| ${colName} | ${mean.toFixed(4)} | ${std.toFixed(4)} | ${min} / ${max} | [${low.toFixed(4)}, ${high.toFixed(4)}] | ${count} |\n`;
      }
    });

    text += `\n## Flagged Z-Score Anomalies Sample (Top 20)\n\n`;
    text += `| Row # | Column | Value | Calculated Z-Score | Deviation from Mean | AnalysisValidator Reason |\n`;
    text += `|---|---|---|---|---|---|\n`;

    allAnomalies.slice(0, 20).forEach(a => {
      text += `| ${a.rowIndex} | ${a.columnName} | ${a.numericValue} | ${a.zScore > 0 ? '+' : ''}${a.zScore} | ${a.deviationFromMean > 0 ? '+' : ''}${a.deviationFromMean} | ${a.justification} |\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    toast.success("Diagnostic report copied to clipboard!");
    setTimeout(() => setCopiedReport(false), 3000);
  };

  if (!profile || numericCols.length === 0) {
    return (
      <Card className="bg-slate-900/40 border-slate-800 p-8 text-center text-slate-400 space-y-4">
        <Activity className="h-10 w-10 mx-auto text-amber-500/60" />
        <h3 className="text-lg font-bold text-white">No Numerical Columns Detected</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Z-score outlier verification requires continuous or discrete numerical feature columns. This dataset contains categorical or string columns only.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner & Threshold Controls */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  Statistical Diagnostics & Z-Score Anomaly Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                  AnalysisValidator Pass 1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Inspect raw mathematical parameters (<span className="text-indigo-300 font-mono">μ, σ, Q₁, Q₃, Skewness, Kurtosis</span>) and verify exactly why data points were flagged as statistical outliers by the AnalysisValidator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs"
            >
              {copiedReport ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />}
              {copiedReport ? "Report Copied" : "Copy Audit Report"}
            </Button>
            {onNavigateToCleaning && (
              <Button
                size="sm"
                onClick={onNavigateToCleaning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-md"
              >
                <Sliders className="h-3.5 w-3.5 mr-1.5" />
                Sanitize in Cleaning Studio
              </Button>
            )}
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-950/60 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Analyzed Features</span>
            <div className="text-lg font-bold font-mono text-white flex items-center justify-between">
              <span>{numericCols.length} columns</span>
              <Cpu className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-400">Continuous numerical series</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Flagged Outliers</span>
            <div className="text-lg font-bold font-mono text-amber-400 flex items-center justify-between">
              <span>{allAnomalies.length} rows</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400">At |Z| ≥ {zThreshold} SDs threshold</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Extreme Anomalies</span>
            <div className="text-lg font-bold font-mono text-rose-400 flex items-center justify-between">
              <span>{allAnomalies.filter(a => a.isExtreme).length} rows</span>
              <XCircle className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-[10px] text-slate-400">At |Z| ≥ 3.5 SDs threshold</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Data Entry Confidence</span>
            <div className="text-lg font-bold font-mono text-indigo-300 flex items-center justify-between">
              <span className="capitalize">{dataEntryCheck?.confidenceStatus || 'High'}</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400">Confidence score: {dataEntryCheck?.confidenceScore ?? 95}%</p>
          </div>
        </div>

        {/* Interactive Sensitivity Controls */}
        <div className="p-5 bg-slate-900/40 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                Sensitivity Z-Score Cutoff Threshold (|Z| ≥ {zThreshold.toFixed(1)})
              </label>
              <p className="text-[11px] text-slate-400">
                Adjust standard deviation boundary to re-evaluate outlier detection thresholds across all columns.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[2.0, 2.5, 3.0, 3.5, 4.0].map((val) => (
                <button
                  key={val}
                  onClick={() => { setZThreshold(val); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    zThreshold === val
                      ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/30'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  ±{val.toFixed(1)} σ {val === 3.0 ? '(Standard)' : val === 3.5 ? '(Extreme)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-400 shrink-0">Fine-tune Cutoff:</span>
            <input
              type="range"
              min="1.5"
              max="5.0"
              step="0.1"
              value={zThreshold}
              onChange={(e) => { setZThreshold(parseFloat(e.target.value)); setCurrentPage(1); }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono font-bold text-indigo-400 shrink-0 w-12 text-right">
              ±{zThreshold.toFixed(1)} σ
            </span>
          </div>
        </div>
      </Card>

      {/* AnalysisValidator Flagged Entry Errors Banner if detected */}
      {dataEntryCheck && dataEntryCheck.flaggedColumns.length > 0 && (
        <Card className="bg-amber-950/20 border-amber-500/30 backdrop-blur-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                AnalysisValidator Data Entry & Outlier Alert
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{dataEntryCheck.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {dataEntryCheck.flaggedColumns.map((col, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">{col.columnName}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    col.anomalyType === 'POTENTIAL_DATA_ENTRY_ERROR' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    col.anomalyType === 'EXTREME_OUTLIER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {col.anomalyType.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{col.reason}</p>
                <p className="text-[11px] text-indigo-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span>{col.suggestedAction}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Section Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={activeTabSection === 'anomalies' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTabSection('anomalies')}
            className={`rounded-xl text-xs font-semibold ${
              activeTabSection === 'anomalies'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
            Flagged Z-Score Outliers ({filteredAnomalies.length})
          </Button>

          <Button
            variant={activeTabSection === 'metadata' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTabSection('metadata')}
            className={`rounded-xl text-xs font-semibold ${
              activeTabSection === 'metadata'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
            Raw Statistical Metadata ({numericCols.length} Columns)
          </Button>

          <Button
            variant={activeTabSection === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTabSection('chart')}
            className={`rounded-xl text-xs font-semibold ${
              activeTabSection === 'chart'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            Visual Scatter & Boundary Plot
          </Button>
        </div>

        {/* Column Filter Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Column:</span>
          <select
            value={selectedCol}
            onChange={(e) => { setSelectedCol(e.target.value); setCurrentPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Numerical Columns ({numericCols.length})</option>
            {numericCols.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: FLAGGED ANOMALIES TABLE & FORMULA INSPECTOR */}
      {activeTabSection === 'anomalies' && (
        <div className="space-y-6">
          {/* Exact Z-Score Formula Explanation Card */}
          <Card className="bg-slate-950/80 border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="h-4 w-4 text-indigo-400" />
                Z-Score Mathematical Formula & Boundary Verification
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                AnalysisValidator Standard Deviation Model
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Mathematical Definition</span>
                <div className="text-indigo-300 font-bold text-sm">
                  Z = (x - μ) / σ
                </div>
                <p className="text-[10px] text-slate-400 font-sans">
                  Measures exact number of standard deviations (<span className="text-indigo-400 font-bold">σ</span>) value <span className="text-white font-bold">x</span> lies from mean <span className="text-indigo-400 font-bold">μ</span>.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Selected Column Parameters ({activeChartCol})</span>
                <div className="text-slate-200">
                  μ = {activeColStats && !isNaN(activeColStats.mean) ? activeColStats.mean.toFixed(4) : 'N/A'} | σ = {activeColStats && !isNaN(activeColStats.std) ? activeColStats.std.toFixed(4) : 'N/A'}
                </div>
                <p className="text-[10px] text-slate-400 font-sans">
                  Normal Range: [<span className="text-emerald-400 font-bold">{((activeColStats?.mean ?? 0) - zThreshold * (activeColStats?.std ?? 0)).toFixed(4)}</span>, <span className="text-emerald-400 font-bold">{((activeColStats?.mean ?? 0) + zThreshold * (activeColStats?.std ?? 0)).toFixed(4)}</span>]
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Flagging Criteria</span>
                <div className="text-amber-400 font-bold">
                  |Z| ≥ {zThreshold.toFixed(1)} (Moderate) | |Z| ≥ 3.5 (Extreme)
                </div>
                <p className="text-[10px] text-slate-400 font-sans">
                  Values outside boundary interval triggers Pass 1 statistical anomaly warning.
                </p>
              </div>
            </div>
          </Card>

          {/* Anomalies Data Grid Card */}
          <Card className="bg-slate-900/40 border-slate-800 overflow-hidden flex flex-col">
            <CardHeader className="border-b border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Flagged Outlier Observations ({filteredAnomalies.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Individual raw data observations exceeding standard deviation threshold |Z| ≥ {zThreshold}.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Severity Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setSeverityFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${severityFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      All ({allAnomalies.length})
                    </button>
                    <button
                      onClick={() => setSeverityFilter('EXTREME')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${severityFilter === 'EXTREME' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Extreme ({allAnomalies.filter(a => a.isExtreme).length})
                    </button>
                    <button
                      onClick={() => setSeverityFilter('MODERATE')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${severityFilter === 'MODERATE' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Moderate ({allAnomalies.filter(a => !a.isExtreme).length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Search & Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search row #, value, column or Z-score..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white">✕</button>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="h-8 w-8 p-0 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-slate-300 font-mono px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="h-8 w-8 p-0 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {paginatedAnomalies.length > 0 ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 w-16 text-center text-slate-500 font-mono">Row #</th>
                      <th className="px-4 py-3">Column Name</th>
                      <th className="px-4 py-3">Raw Value (x)</th>
                      <th className="px-4 py-3">Calculated Z-Score</th>
                      <th className="px-4 py-3">Deviation from Mean</th>
                      <th className="px-4 py-3">Boundary Limits [Min, Max]</th>
                      <th className="px-4 py-3">AnalysisValidator Verification & Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    {paginatedAnomalies.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2.5 text-center text-slate-400 font-bold bg-slate-950/40">
                          #{item.rowIndex}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-white">
                          {item.columnName}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-amber-300 bg-amber-500/5">
                          {item.numericValue.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            item.isExtreme
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {item.zScore > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            Z = {item.zScore > 0 ? `+${item.zScore}` : item.zScore}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          <span className={item.deviationFromMean > 0 ? 'text-rose-400' : 'text-cyan-400'}>
                            {item.deviationFromMean > 0 ? `+${item.deviationFromMean.toLocaleString()}` : item.deviationFromMean.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                            ({item.percentDeviation > 0 ? `+${item.percentDeviation}%` : `${item.percentDeviation}%`})
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                          [{item.lowerBound.toLocaleString()}, {item.upperBound.toLocaleString()}]
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 font-sans text-[11px] max-w-sm">
                          <p className="line-clamp-2">{item.justification}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400/80" />
                  <h4 className="text-sm font-bold text-slate-300">No Z-Score Outliers Flagged</h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    No data points exceed the active standard deviation threshold (|Z| ≥ {zThreshold.toFixed(1)}). Try lowering the sensitivity cutoff threshold.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 2: RAW STATISTICAL METADATA BREAKDOWN */}
      {activeTabSection === 'metadata' && (
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-400" />
              Raw Statistical Metadata Matrix
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Complete raw moments, quartiles, skewness, kurtosis, and boundary intervals for all numerical columns.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-white">Column</th>
                  <th className="px-4 py-3">Mean (μ) / Trimmed (10%)</th>
                  <th className="px-4 py-3">Std Dev (σ) / Std Error</th>
                  <th className="px-4 py-3">95% Confidence Interval</th>
                  <th className="px-4 py-3">Min / Max</th>
                  <th className="px-4 py-3">Median (Q₂) / IQR</th>
                  <th className="px-4 py-3">Skewness / Normality p-Val</th>
                  <th className="px-4 py-3">VIF (Multicollinearity)</th>
                  <th className="px-4 py-3">Z = ±{zThreshold} Boundary</th>
                  <th className="px-4 py-3">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {numericCols.map((colName, idx) => {
                  const colProf = profile.columns.find(c => c.name === colName);
                  if (!colProf || !colProf.numericStats) return null;

                  const s = colProf.numericStats;
                  const low = s.mean - zThreshold * s.std;
                  const high = s.mean + zThreshold * s.std;
                  const colOutliers = allAnomalies.filter(a => a.columnName === colName);
                  const vif = profile.vifScores ? profile.vifScores[colName] : 1.0;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-indigo-300 font-sans">
                        {colName}
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">
                        {s.mean.toLocaleString()}
                        {s.trimmedMean10 !== undefined && (
                          <div className="text-[10px] text-cyan-400 font-normal">
                            Trim: {s.trimmedMean10.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {s.std.toLocaleString()}
                        {s.standardError !== undefined && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            SE: {s.standardError.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-emerald-300 font-semibold text-[11px]">
                        {s.ciLower95 !== undefined && s.ciUpper95 !== undefined
                          ? `[${s.ciLower95.toLocaleString()}, ${s.ciUpper95.toLocaleString()}]`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{s.min.toLocaleString()} / {s.max.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {s.median.toLocaleString()}
                        <div className="text-[10px] text-slate-500 font-normal">
                          IQR: {s.iqr.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className={Math.abs(s.skewness) > 1.5 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {s.skewness.toFixed(4)}
                        </span>
                        {s.normalityPValue !== undefined && (
                          <div className={`text-[10px] font-normal ${s.normalityPValue < 0.05 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            p = {s.normalityPValue.toFixed(4)} ({s.normalityPValue >= 0.05 ? 'Normal' : 'Non-Normal'})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          vif > 10 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          vif > 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          VIF = {vif.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cyan-400 font-semibold text-[11px]">
                        [{low.toFixed(4)}, {high.toFixed(4)}]
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          colOutliers.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {colOutliers.length} rows
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: VISUAL SCATTER & BOUNDARY PLOT */}
      {activeTabSection === 'chart' && (
        <Card className="bg-slate-900/40 border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-cyan-400" />
                Scatter & Boundary Visualizer ({activeChartCol})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual distribution of values against mean (<span className="text-indigo-400 font-bold">μ</span>) and cutoff bounds (<span className="text-amber-400 font-bold">±{zThreshold} σ</span>).
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Normal Values</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-400 font-bold">Z-Score Outliers</span>
              </div>
            </div>
          </div>

          {activeColStats && chartData.length > 0 ? (
            <div className="h-[380px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="rowIdx" stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: 'Row Index (#)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: `${activeChartCol} Value`, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1 font-mono">
                            <div className="font-bold text-white font-sans">Row #{data.rowIdx}</div>
                            <div className="text-indigo-300">Value: {data.value.toLocaleString()}</div>
                            <div className={`font-bold ${data.isOutlier ? 'text-amber-400' : 'text-slate-400'}`}>
                              Z-Score: {data.zScore > 0 ? `+${data.zScore}` : data.zScore}
                            </div>
                            {data.isOutlier && (
                              <div className="text-[10px] text-rose-400 font-bold font-sans uppercase">
                                Flagged Z-Score Outlier
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Mean Line */}
                  <ReferenceLine
                    y={activeColStats.mean}
                    stroke="#6366f1"
                    strokeWidth={2}
                    label={{ value: `Mean μ = ${activeColStats.mean.toFixed(4)}`, fill: '#818cf8', fontSize: 10, position: 'top' }}
                  />

                  {/* Upper Bound Line */}
                  <ReferenceLine
                    y={activeColStats.mean + zThreshold * activeColStats.std}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `Upper Limit (+${zThreshold}σ): ${(activeColStats.mean + zThreshold * activeColStats.std).toFixed(4)}`, fill: '#f59e0b', fontSize: 10, position: 'top' }}
                  />

                  {/* Lower Bound Line */}
                  <ReferenceLine
                    y={activeColStats.mean - zThreshold * activeColStats.std}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `Lower Limit (-${zThreshold}σ): ${(activeColStats.mean - zThreshold * activeColStats.std).toFixed(4)}`, fill: '#f59e0b', fontSize: 10, position: 'bottom' }}
                  />

                  <Scatter dataKey="value" name="Observations">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isOutlier ? '#f43f5e' : '#6366f1'}
                        r={entry.isOutlier ? 6 : 3}
                      />
                    ))}
                  </Scatter>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No chart points available for selected column.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
