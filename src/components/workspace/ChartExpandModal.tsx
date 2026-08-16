import React, { useState } from "react";
import { X, Download, Table, BarChart2, Maximize2, ShieldCheck, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, Brush 
} from "recharts";
import { toast } from "sonner";

interface ChartExpandModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  chartType: string;
  data: any[];
  dimensionKey?: string;
  measureKey?: string;
  color?: string;
  onOpenLineage?: () => void;
}

const PALETTE = [
  "#6366f1", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", 
  "#8b5cf6", "#06b6d4", "#14b8a6", "#f97316", "#a855f7"
];

export function ChartExpandModal({
  isOpen,
  onClose,
  title,
  chartType,
  data,
  dimensionKey = "name",
  measureKey = "val",
  color = "#6366f1",
  onOpenLineage
}: ChartExpandModalProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [currentChartType, setCurrentChartType] = useState<string>(chartType || "bar");

  if (!isOpen) return null;

  const handleExportData = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_data.csv`;
    a.click();
    toast.success("Chart slice exported to CSV!");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Full-Fidelity Drill-Down Canvas ({data.length.toLocaleString()} Aggregated Segments)
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("chart")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  viewMode === "chart" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  viewMode === "table" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Table View
              </button>
            </div>

            {/* Lineage Button */}
            {onOpenLineage && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenLineage}
                className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
              >
                <GitBranch className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                Lineage Trace
              </Button>
            )}

            {/* Export Slice CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Export Slice
            </Button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Canvas Body */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col bg-[#020617]">
          {viewMode === "chart" ? (
            <div className="flex-1 flex flex-col min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                {currentChartType === "pie" ? (
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey={measureKey}
                      nameKey={dimensionKey}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={160}
                      paddingAngle={3}
                      label={(entry) => `${entry[dimensionKey]}: $${Number(entry[measureKey] || 0).toLocaleString()}`}
                    >
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Value"]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  </PieChart>
                ) : currentChartType === "line" ? (
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey={dimensionKey} stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Metric Value"]}
                    />
                    <Line type="monotone" dataKey={measureKey} stroke={color} strokeWidth={3} dot={{ r: 4 }} />
                    <Brush dataKey={dimensionKey} height={25} stroke="#475569" fill="#0f172a" />
                  </LineChart>
                ) : currentChartType === "area" ? (
                  <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey={dimensionKey} stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Metric Value"]}
                    />
                    <Area type="monotone" dataKey={measureKey} stroke={color} strokeWidth={3} fill="url(#modalGrad)" />
                    <Brush dataKey={dimensionKey} height={25} stroke="#475569" fill="#0f172a" />
                  </AreaChart>
                ) : (
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey={dimensionKey} stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Metric Value"]}
                    />
                    <Bar dataKey={measureKey} fill={color} radius={[6, 6, 0, 0]} />
                    <Brush dataKey={dimensionKey} height={25} stroke="#475569" fill="#0f172a" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 overflow-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).map((h) => (
                      <th key={h} className="p-3 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-3">
                          {typeof val === "number" ? `$${Number(val).toLocaleString()}` : String(val ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 border-t border-slate-800 px-6 flex items-center justify-between bg-slate-950 text-[11px] text-slate-500 font-mono shrink-0">
          <span>Deterministic In-Memory AST Compute</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> High-Performance SIMD Vectorized
          </span>
        </div>

      </div>
    </div>
  );
}
