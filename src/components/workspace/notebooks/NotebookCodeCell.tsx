import React from "react";
import {
  Copy, RefreshCw, Ban, AlertCircle, Bot, Sparkle, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cell } from "@/stores/workspaceStore";
import { NotebookCellEditor } from "@/components/workspace/NotebookCellEditor";
import { NotebookTableOutput } from "@/components/workspace/NotebookTableOutput";
import { AdaptiveQueryRouter } from "@/lib/adaptiveQueryRouter";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell as RechartsCell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6'];

export interface NotebookCodeCellProps {
  cell: Cell;
  index: number;
  isActive: boolean;
  notebookMode: "command" | "edit";
  lockingPeer: {
    name: string;
    role?: string;
    color: string;
    isTyping: boolean;
  } | null;
  execMeta?: {
    durationMs: number;
    timestamp: string;
  };
  runtime: "wasm" | "microvm";
  onRuntimeChange: (rt: "wasm" | "microvm") => void;
  onExecute: () => void;
  onRunAndAdvance: () => void;
  onRunInPlace: () => void;
  onRunAndInsertBelow: () => void;
  onEnterCommandMode: () => void;
  onCancel: () => void;
  onRunAbove: () => void;
  onRunBelow: () => void;
  onUpdateCode: (code: string) => void;
  onUpdateType: (type: "python" | "sql" | "markdown") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTriggerCopilot: () => void;
  onQuickAiAction: (action: "explain" | "optimize" | "visualize" | "fix" | "docstring") => void;
  onFocus: () => void;
  onBlur: () => void;
  onClearOutput: () => void;
  codeSnippets: { label: string; code: string; type: string }[];
  onInjectSnippet: (code: string) => void;
  onFixWithCopilot?: (cellId: string, errorText: string) => void;
}

export const NotebookCodeCell: React.FC<NotebookCodeCellProps> = ({
  cell,
  index,
  isActive,
  notebookMode,
  lockingPeer,
  execMeta,
  runtime,
  onRuntimeChange,
  onExecute,
  onRunAndAdvance,
  onRunInPlace,
  onRunAndInsertBelow,
  onEnterCommandMode,
  onCancel,
  onRunAbove,
  onRunBelow,
  onUpdateCode,
  onUpdateType,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTriggerCopilot,
  onQuickAiAction,
  onFocus,
  onBlur,
  onClearOutput,
  codeSnippets,
  onInjectSnippet,
  onFixWithCopilot,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <NotebookCellEditor
      cell={cell}
      index={index}
      isActive={isActive}
      notebookMode={notebookMode}
      isLockedByPeer={lockingPeer ? {
        name: lockingPeer.name,
        role: lockingPeer.role || "Collaborator",
        color: lockingPeer.color,
        isTyping: Boolean(lockingPeer.isTyping),
      } : null}
      executionMeta={execMeta}
      runtime={runtime}
      onRuntimeChange={onRuntimeChange}
      onExecute={onExecute}
      onRunAndAdvance={onRunAndAdvance}
      onRunInPlace={onRunInPlace}
      onRunAndInsertBelow={onRunAndInsertBelow}
      onEnterCommandMode={onEnterCommandMode}
      onCancel={onCancel}
      onRunAbove={onRunAbove}
      onRunBelow={onRunBelow}
      onUpdateCode={onUpdateCode}
      onUpdateType={onUpdateType}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onTriggerCopilot={onTriggerCopilot}
      onQuickAiAction={onQuickAiAction}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* Quick Snippets Inserter Strip */}
      {/* Real-time Query Cost Forecaster for SQL Cells */}
      {cell.type === "sql" && cell.code && cell.code.trim().length > 5 && (() => {
        const forecast = AdaptiveQueryRouter.forecastCost(cell.code);
        return (
          <div className="flex flex-wrap items-center gap-2 py-1 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-indigo-400 font-semibold">
              <DollarSign className="h-3 w-3" /> Cost Forecaster:
            </span>
            <span>Scans ~{forecast.estimatedDataScannedFormatted}</span>
            <span className="text-slate-700">•</span>
            <span className="text-rose-400/90 line-through">${forecast.cloudWarehouseEstimatedCostUsd.toFixed(4)} Cloud</span>
            <span className="text-emerald-400 font-semibold">$0.00 DuckDB Edge (Saved 100%)</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">{forecast.carbonGramsEstimate}g CO2e</span>
          </div>
        );
      })()}

      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-0.5 pb-1 text-[10px] opacity-70 hover:opacity-100 transition-opacity">
        <span className="text-slate-500 font-mono shrink-0 select-none">Snippets:</span>
        {codeSnippets
          .filter((s) => s.type === cell.type)
          .map((s, i) => (
            <button
              key={i}
              onClick={() => onInjectSnippet(s.code)}
              className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800/80 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 hover:bg-slate-900 shrink-0 font-mono transition-all"
            >
              + {s.label}
            </button>
          ))}
      </div>

      {/* Cell Output Display Panel */}
      {cell.isExecuting ? (
        <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-300 font-mono shadow-inner">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
            <span className="text-slate-400">Kernel executing cell logic...</span>
          </div>
          <Button
            onClick={onCancel}
            size="sm"
            variant="outline"
            className="bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs h-6 px-2.5 rounded-lg flex items-center gap-1 font-sans transition-all"
          >
            <Ban className="h-3 w-3" /> Cancel Execution
          </Button>
        </div>
      ) : cell.output ? (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800/90 overflow-hidden text-xs font-mono shadow-inner">
          <div className="bg-slate-900/60 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Output
            </span>
            <Button
              onClick={onClearOutput}
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded"
            >
              Clear Output
            </Button>
          </div>

          <div className="p-3.5 overflow-x-auto">
            {/* Text / stdout Output */}
            {cell.output.type === "text" && (
              <div className="space-y-2">
                <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 text-xs font-mono select-text">
                  {cell.output.text}
                </pre>
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => copyToClipboard(cell.output?.text || "")}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-slate-400 hover:text-white p-1 flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy Output
                  </Button>
                </div>
              </div>
            )}

            {/* Error Diagnostic Output Panel */}
            {cell.output.type === "error" && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-3 font-sans text-slate-300">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-red-400">
                      {cell.output.error?.error_class || "ExecutionException"}: {cell.output.error?.message}
                    </h4>
                    {cell.output.error?.line_number && (
                      <div className="text-xs text-red-500 font-mono">Line: {cell.output.error.line_number}</div>
                    )}
                  </div>
                </div>

                {cell.output.error?.suggested_fix && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                      <Sparkle className="h-3.5 w-3.5" /> Suggested Remediation:
                    </span>
                    <p className="text-slate-400">{cell.output.error.suggested_fix}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => {
                      if (onFixWithCopilot) {
                        onFixWithCopilot(cell.id, cell.output?.error?.message || "");
                      } else {
                        onTriggerCopilot();
                      }
                    }}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 rounded-lg flex items-center gap-1.5"
                  >
                    <Bot className="h-3.5 w-3.5" /> Fix with AI Copilot
                  </Button>
                  <Button
                    onClick={() => onQuickAiAction("fix")}
                    variant="outline"
                    size="sm"
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs h-7 rounded-lg"
                  >
                    Auto-Repair Syntax
                  </Button>
                </div>
              </div>
            )}

            {/* Table Output */}
            {cell.output.type === "table" && (
              <NotebookTableOutput
                data={cell.output.data || []}
              />
            )}

            {/* Chart Output */}
            {cell.output.type === "chart" && (
              <div className="space-y-4">
                {cell.output.images && cell.output.images.length > 0 && (
                  <div className="space-y-4 pt-1">
                    {cell.output.images.map((imgB64: string, i: number) => (
                      <div key={i} className="rounded-xl border border-slate-800 overflow-hidden bg-white p-3 max-w-xl mx-auto flex flex-col items-center shadow-lg relative group">
                        <img
                          loading="lazy"
                          src={`data:image/png;base64,${imgB64}`}
                          referrerPolicy="no-referrer"
                          alt={`Captured Notebook Plot ${i + 1}`}
                          className="w-full h-auto object-contain"
                        />
                        <a
                          href={`data:image/png;base64,${imgB64}`}
                          download={`plot_${i + 1}.png`}
                          className="absolute bottom-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1"
                        >
                          Save Image
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                {cell.output.text && (
                  <pre className="whitespace-pre-wrap leading-relaxed text-slate-400 text-xs font-mono border-t border-slate-850 pt-3 mt-2">{cell.output.text}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </NotebookCellEditor>
  );
};
