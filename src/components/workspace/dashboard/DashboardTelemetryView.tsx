import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Lightbulb, TrendingUp, AlertTriangle, 
  ShieldCheck, ArrowRight, Download, ChevronRight 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TelemetryPoint } from "@/pages/workspace/Dashboard";

interface DashboardTelemetryViewProps {
  analyticsData: TelemetryPoint[];
  chartMetric: "throughput" | "queries" | "inferenceMs" | "accuracy";
  timeRange: "24H" | "7D" | "30D";
  isStreaming: boolean;
  latencyCheck: number;
  stats: any;
  realAnomalies: any[];
  onMetricChange: (metric: "throughput" | "queries" | "inferenceMs" | "accuracy") => void;
  onTimeRangeChange: (t: "24H" | "7D" | "30D") => void;
  onToggleStreaming: () => void;
  onExportCsv: () => void;
  onNavigate: (path: string) => void;
}

const DashboardTelemetryViewComponent: React.FC<DashboardTelemetryViewProps> = ({
  analyticsData,
  chartMetric,
  timeRange,
  isStreaming,
  latencyCheck,
  stats,
  realAnomalies,
  onMetricChange,
  onTimeRangeChange,
  onToggleStreaming,
  onExportCsv,
  onNavigate
}) => {
  const metricColor = 
    chartMetric === "throughput" ? "#6366f1" :
    chartMetric === "queries" ? "#06b6d4" :
    chartMetric === "inferenceMs" ? "#a855f7" : "#10b981";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Real-time Telemetry & Execution Analytics */}
      <Card className="lg:col-span-8 bg-slate-900/50 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Data Engine Telemetry</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">Pipeline Performance & Latency</h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onToggleStreaming}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isStreaming 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-950 border-slate-800 text-slate-500"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isStreaming ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
              {isStreaming ? "Live Polling" : "Static"}
            </button>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
              {(["24H", "7D", "30D"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onTimeRangeChange(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeRange === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button
              onClick={onExportCsv}
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-xl bg-slate-950 border-slate-800 text-slate-300 text-xs"
              title="Export series to CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Metric Switcher Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { 
              key: "throughput", 
              label: "Throughput", 
              val: `${analyticsData[analyticsData.length - 1]?.throughput || 0} MB/s`, 
            },
            { 
              key: "queries", 
              label: "Logged Queries", 
              val: `${analyticsData[analyticsData.length - 1]?.queries || 0} ops`, 
            },
            { 
              key: "inferenceMs", 
              label: "Latency", 
              val: `${latencyCheck} ms`, 
            },
            { 
              key: "accuracy", 
              label: "Quality Score", 
              val: `${stats.avgQuality}%`, 
            },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => onMetricChange(m.key as any)}
              className={`p-3 rounded-2xl text-left border transition-all ${
                chartMetric === m.key 
                  ? "bg-slate-950 border-indigo-500/60 shadow-lg shadow-indigo-500/10" 
                  : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-950"
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</div>
              <div className="text-lg font-black text-white mt-1 tracking-tight">{m.val}</div>
            </button>
          ))}
        </div>

        {/* Recharts Area Visualization */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={metricColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
              />
              <Area 
                type="monotone" 
                dataKey={chartMetric} 
                stroke={metricColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#metricGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* AI Autonomous Anomaly Feed */}
      <Card className="lg:col-span-4 bg-slate-900/50 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Anomaly Scanner</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              LIVE SENSORS
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {realAnomalies.length > 0 ? (
              realAnomalies.map((insight, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {insight.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      {insight.type === 'opportunity' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      {insight.type === 'info' && <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                      <span className="line-clamp-1">{insight.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">{insight.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{insight.desc}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {insight.confidence}
                    </span>
                    <button 
                      onClick={() => onNavigate(`/workspace/ai/chat?q=${encodeURIComponent(insight.title)}`)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
                    >
                      Investigate <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-2">
                <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">All pipelines within nominal range.</p>
                <p className="text-[10px] text-slate-500">Autonomous sensor continuous monitoring is active.</p>
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={() => onNavigate('/workspace/reports')}
          variant="outline"
          className="w-full h-10 rounded-2xl bg-slate-950 border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider"
        >
          View Full Reports <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </Card>
    </div>
  );
};

export const DashboardTelemetryView = React.memo(DashboardTelemetryViewComponent);
