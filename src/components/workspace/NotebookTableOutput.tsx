import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table as TableIcon, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Search, Copy, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  ArrowUp, ArrowDown, FileSpreadsheet, Layers, Filter, Sparkles,
  Info, SlidersHorizontal
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell as RechartsCell,
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, ZAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4",
  "#3b82f6", "#14b8a6", "#f97316", "#a855f7"
];

interface NotebookTableOutputProps {
  data: any[];
}

const NotebookTableOutputComponent: React.FC<NotebookTableOutputProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<"table" | "chart" | "profiler">("table");
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "pie" | "scatter">("bar");
  const [xAxisKey, setXAxisKey] = useState<string>("");
  const [yAxisKey, setYAxisKey] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  useEffect(() => {
    if (columns.length > 0) {
      if (!xAxisKey) setXAxisKey(columns[0]);
      if (!yAxisKey) {
        const numCol = columns.find((c) => typeof data[0][c] === "number") || columns[1] || columns[0];
        setYAxisKey(numCol);
      }
    }
  }, [columns, data]);

  // Column Profiler & Statistics
  const columnStats = useMemo(() => {
    if (!data || data.length === 0) return {};
    const stats: Record<
      string,
      { type: "number" | "string" | "boolean" | "date"; nulls: number; distinct: number; min?: number; max?: number; avg?: number }
    > = {};

    columns.forEach((col) => {
      const values = data.map((d) => d[col]);
      const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== "");
      const nullsCount = values.length - nonNulls.length;
      const distinctCount = new Set(nonNulls).size;

      const isNumeric = nonNulls.every((v) => typeof v === "number" || (!isNaN(Number(v)) && v !== ""));
      const isBool = nonNulls.every((v) => typeof v === "boolean" || v === "true" || v === "false");

      if (isNumeric && nonNulls.length > 0) {
        const numVals = nonNulls.map((v) => Number(v));
        const minVal = Math.min(...numVals);
        const maxVal = Math.max(...numVals);
        const avgVal = numVals.reduce((a, b) => a + b, 0) / numVals.length;
        stats[col] = {
          type: "number",
          nulls: nullsCount,
          distinct: distinctCount,
          min: minVal,
          max: maxVal,
          avg: Math.round(avgVal * 100) / 100,
        };
      } else if (isBool) {
        stats[col] = { type: "boolean", nulls: nullsCount, distinct: distinctCount };
      } else {
        stats[col] = { type: "string", nulls: nullsCount, distinct: distinctCount };
      }
    });

    return stats;
  }, [data, columns]);

  // Filtered & Sorted Rows
  const processedData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(term))
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Paginated Rows
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = useCallback((col: string) => {
    setSortColumn((prevCol) => {
      if (prevCol === col) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevCol;
      } else {
        setSortDirection("asc");
        return col;
      }
    });
  }, []);

  const chartData = useMemo(() => {
    return processedData.slice(0, 100).map((row, idx) => ({
      ...row,
      xVal: String(row[xAxisKey] ?? `Row ${idx + 1}`),
      yVal: Number(row[yAxisKey]) || 0,
    }));
  }, [processedData, xAxisKey, yAxisKey]);

  const copyAsCsv = useCallback(() => {
    if (!data || data.length === 0) return;
    const headers = columns.join(",");
    const rows = data.map((r) =>
      columns.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    navigator.clipboard.writeText(csvContent).then(() => {
      toast.success(`Copied ${data.length} rows as CSV!`);
    });
  }, [data, columns]);

  const copyAsJson = useCallback(() => {
    if (!data || data.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      toast.success(`Copied ${data.length} rows as JSON!`);
    });
  }, [data]);

  const copyAsMarkdown = useCallback(() => {
    if (!data || data.length === 0) return;
    const headerRow = `| ${columns.join(" | ")} |`;
    const separatorRow = `| ${columns.map(() => "---").join(" | ")} |`;
    const bodyRows = data.slice(0, 50).map((r) => `| ${columns.map((c) => String(r[c] ?? "—")).join(" | ")} |`);
    const md = [headerRow, separatorRow, ...bodyRows].join("\n");
    navigator.clipboard.writeText(md).then(() => {
      toast.success("Copied table as Markdown table!");
    });
  }, [data, columns]);

  return (
    <div className="space-y-3 font-sans">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "table" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Interactive Grid
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "chart" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Recharts Studio
          </button>
          <button
            onClick={() => setViewMode("profiler")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "profiler" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Data Profiler
          </button>
        </div>

        {viewMode === "table" ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search rows..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-7.5 text-xs pl-8 w-36 sm:w-48 bg-slate-950 border-slate-800 rounded-lg text-slate-200"
              />
            </div>

            <div className="flex items-center border border-slate-800 rounded-lg bg-slate-950 p-0.5 text-xs">
              <button
                onClick={copyAsCsv}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-semibold transition-colors"
                title="Copy as CSV"
              >
                CSV
              </button>
              <button
                onClick={copyAsJson}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-semibold transition-colors"
                title="Copy as JSON"
              >
                JSON
              </button>
              <button
                onClick={copyAsMarkdown}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-semibold transition-colors"
                title="Copy as Markdown table"
              >
                MD Table
              </button>
            </div>
          </div>
        ) : viewMode === "chart" ? (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Chart:</span>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Trend</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">X:</span>
              <select
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs max-w-[120px] truncate"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Y:</span>
              <select
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs max-w-[120px] truncate"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="space-y-2">
          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950 max-h-96 custom-scrollbar select-text shadow-inner">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                  <th className="p-3 font-bold border-r border-slate-800 w-12 text-slate-500 text-center">#</th>
                  {columns.map((col) => {
                    const stats = columnStats[col];
                    const isSorted = sortColumn === col;
                    return (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="p-3 font-bold border-r border-slate-800 last:border-r-0 whitespace-nowrap cursor-pointer hover:text-white hover:bg-slate-850/50 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span>{col}</span>
                            {stats && (
                              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-950 font-mono text-slate-500 group-hover:text-amber-400">
                                {stats.type === "number" ? "NUM" : stats.type === "boolean" ? "BOOL" : "STR"}
                              </span>
                            )}
                          </div>
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-amber-400" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-amber-400" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 text-xs">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row: any, r: number) => {
                    const globalIdx = (currentPage - 1) * pageSize + r + 1;
                    return (
                      <tr key={r} className="border-b border-slate-850/60 last:border-0 hover:bg-slate-900/40">
                        <td className="p-3 text-slate-600 border-r border-slate-850/60 text-center font-mono">
                          {globalIdx}
                        </td>
                        {columns.map((col: string, c: number) => {
                          const val = row[col];
                          const isNull = val === null || val === undefined;
                          return (
                            <td key={c} className="p-3 text-slate-200 border-r border-slate-850/60 last:border-r-0 whitespace-nowrap">
                              {isNull ? (
                                <span className="text-slate-600 italic">None</span>
                              ) : typeof val === "number" ? (
                                <span className="text-amber-300 font-semibold">{val.toLocaleString()}</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="font-mono text-slate-500">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processedData.length)} of{" "}
                {processedData.length} records
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 bg-slate-950 border-slate-800 text-slate-300 rounded-lg disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-mono text-xs px-2 text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 bg-slate-950 border-slate-800 text-slate-300 rounded-lg disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CHART VIEW */}
      {viewMode === "chart" && (
        <div className="w-full h-[280px] min-h-[280px] bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
          <ResponsiveContainer width="100%" height={260}>
            {chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="xVal" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }} />
                <Line type="monotone" dataKey="yVal" name={yAxisKey} stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="xVal" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }} />
                <Area type="monotone" dataKey="yVal" name={yAxisKey} stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              </AreaChart>
            ) : chartType === "pie" ? (
              <PieChart>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }} />
                <Pie data={chartData} dataKey="yVal" nameKey="xVal" cx="50%" cy="50%" outerRadius={85} label={(e: any) => e.xVal}>
                  {chartData.map((_, index) => (
                    <RechartsCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : chartType === "scatter" ? (
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="xVal" name={xAxisKey} stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="yVal" name={yAxisKey} stroke="#94a3b8" fontSize={11} />
                <ZAxis range={[60, 60]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }} />
                <Scatter name="Data Points" data={chartData} fill="#ec4899" />
              </ScatterChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="xVal" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }} />
                <Bar dataKey="yVal" name={yAxisKey} fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* PROFILER VIEW */}
      {viewMode === "profiler" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {columns.map((col) => {
            const st = columnStats[col];
            if (!st) return null;
            return (
              <div key={col} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono text-xs">{col}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    {st.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-600 block text-[10px]">Distinct Values</span>
                    <span className="text-slate-200 font-bold">{st.distinct}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">Null Count</span>
                    <span className={st.nulls > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {st.nulls} ({((st.nulls / data.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  {st.type === "number" && (
                    <>
                      <div>
                        <span className="text-slate-600 block text-[10px]">Min / Max</span>
                        <span className="text-slate-200 font-bold">
                          {st.min} / {st.max}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">Mean / Average</span>
                        <span className="text-amber-400 font-bold">{st.avg}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const NotebookTableOutput = React.memo(NotebookTableOutputComponent);
export default NotebookTableOutput;
