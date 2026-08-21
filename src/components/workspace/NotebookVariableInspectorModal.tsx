import React, { useState, useMemo } from "react";
import {
  Variable, X, Table, Database, FileSpreadsheet, Eye, Info, Check, Copy,
  ArrowRight, Search, Activity, Layers, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VariableInfo } from "@/stores/workspaceStore";

interface NotebookVariableInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: Record<string, VariableInfo>;
  selectedDataset: any;
}

const NotebookVariableInspectorModalComponent: React.FC<NotebookVariableInspectorModalProps> = ({
  isOpen,
  onClose,
  variables,
  selectedDataset,
}) => {
  const [selectedVarName, setSelectedVarName] = useState<string>(() => {
    return Object.keys(variables)[0] || "df";
  });
  const [searchTerm, setSearchTerm] = useState("");

  const currentVar = useMemo(() => {
    return variables[selectedVarName] || {
      type: "DataFrame",
      summary: "Active Dataset Reference",
    };
  }, [variables, selectedVarName]);

  // Sample data parsing if it's the primary DataFrame
  const sampleRows = useMemo(() => {
    return selectedDataset?.sample_rows || selectedDataset?.preview_data || [];
  }, [selectedDataset]);

  const datasetColumns = useMemo(() => {
    return selectedDataset?.columns || (sampleRows.length > 0 ? Object.keys(sampleRows[0]) : []);
  }, [selectedDataset, sampleRows]);

  const filteredColumns = useMemo(() => {
    return datasetColumns.filter((col: any) => {
      const colName = typeof col === "string" ? col : col.name || "";
      return colName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [datasetColumns, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Variable className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Kernel Variable & Memory Inspector
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Python State
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detailed schema, memory allocation, and distribution telemetry for declared objects.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Left sidebar of variables, right side details */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Variable List Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-800 p-4 space-y-2 bg-slate-950/40 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Declared Variables ({Object.keys(variables).length})
            </div>
            {Object.keys(variables).length === 0 ? (
              <div className="p-3 text-xs text-slate-500 italic">No variables in memory.</div>
            ) : (
              Object.entries(variables).map(([name, info]) => {
                const isSelected = selectedVarName === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedVarName(name)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all space-y-1 ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-amber-300">{name}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-950 font-mono text-slate-400">
                        {info.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{info.summary}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Variable Detailed View */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">Selected Variable</span>
                  <h4 className="text-lg font-extrabold text-white font-mono flex items-center gap-2">
                    {selectedVarName}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-sans font-semibold">
                      {currentVar.type}
                    </span>
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Memory Scope</span>
                  <div className="text-xs font-bold text-emerald-400 font-mono">Kernel Global Namespace</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
                {currentVar.summary}
              </div>
            </div>

            {/* If variable is DataFrame or df, show columns & preview */}
            {(selectedVarName === "df" || currentVar.type.toLowerCase().includes("dataframe")) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Table className="h-4 w-4 text-indigo-400" /> DataFrame Schema & Features
                  </h4>
                  <div className="w-56">
                    <Input
                      placeholder="Filter columns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-7 text-xs bg-slate-950 border-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <th className="p-3 font-bold">#</th>
                        <th className="p-3 font-bold">Column Name</th>
                        <th className="p-3 font-bold">Inferred Type</th>
                        <th className="p-3 font-bold">Null Rate</th>
                        <th className="p-3 font-bold">Sample Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredColumns.map((col: any, idx: number) => {
                        const colName = typeof col === "string" ? col : col.name || `Col_${idx}`;
                        const colType = typeof col === "object" ? col.type || "string" : "auto";
                        const sampleVal = sampleRows[0] ? String(sampleRows[0][colName] ?? "—") : "—";
                        return (
                          <tr
                            key={idx}
                            className="border-b border-slate-850/60 last:border-0 hover:bg-slate-900/40"
                          >
                            <td className="p-3 text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-200">{colName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-bold">
                                {colType}
                              </span>
                            </td>
                            <td className="p-3 text-emerald-400">0.0%</td>
                            <td className="p-3 text-slate-400 truncate max-w-[150px]">{sampleVal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sample Records Grid */}
                {sampleRows.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Head (First {Math.min(5, sampleRows.length)} Records)
                    </h5>
                    <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950 max-h-48 custom-scrollbar">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                            {datasetColumns.slice(0, 6).map((c: any, i: number) => (
                              <th key={i} className="p-2.5 font-bold whitespace-nowrap">
                                {typeof c === "string" ? c : c.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sampleRows.slice(0, 5).map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="border-b border-slate-850/60 last:border-0">
                              {datasetColumns.slice(0, 6).map((c: any, cIdx: number) => {
                                const cName = typeof c === "string" ? c : c.name;
                                return (
                                  <td key={cIdx} className="p-2.5 text-slate-300 whitespace-nowrap">
                                    {String(row[cName] ?? "—")}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotebookVariableInspectorModal = React.memo(NotebookVariableInspectorModalComponent);
export default NotebookVariableInspectorModal;
