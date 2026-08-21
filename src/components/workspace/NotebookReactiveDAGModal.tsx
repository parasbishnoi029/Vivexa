import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitBranch, Play, RefreshCw, Layers, CheckCircle2, AlertTriangle,
  ArrowRight, Database, Code, Terminal, Clock, Sparkles, X, ChevronRight,
  Cpu, FileCode, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface DAGNode {
  cellId: string;
  cellIndex: number;
  cellType: "python" | "sql" | "markdown";
  definedVariables: string[];
  referencedVariables: string[];
  status: "clean" | "stale" | "running" | "error";
  executionDurationMs?: number;
  upstreamNodeIds: string[];
  downstreamNodeIds: string[];
  snippet: string;
}

interface NotebookReactiveDAGModalProps {
  isOpen: boolean;
  onClose: () => void;
  cells: Array<{
    id: string;
    type: "python" | "sql" | "markdown";
    code: string;
    isExecuting?: boolean;
    output?: any;
  }>;
  onExecuteCell: (cellId: string) => void;
  onCascadeRun: (cellIds: string[]) => void;
}

export const NotebookReactiveDAGModal: React.FC<NotebookReactiveDAGModalProps> = ({
  isOpen,
  onClose,
  cells,
  onExecuteCell,
  onCascadeRun,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // AST / Variable Extraction
  const dagNodes: DAGNode[] = useMemo(() => {
    const definedMap = new Map<string, string>(); // variableName -> cellId that defines it
    const nodes: DAGNode[] = [];

    cells.forEach((cell, idx) => {
      if (cell.type === "markdown") {
        nodes.push({
          cellId: cell.id,
          cellIndex: idx + 1,
          cellType: "markdown",
          definedVariables: [],
          referencedVariables: [],
          status: "clean",
          upstreamNodeIds: [],
          downstreamNodeIds: [],
          snippet: cell.code.slice(0, 80)
        });
        return;
      }

      const defined: string[] = [];
      const referenced: string[] = [];

      // Extract assignments like `df = ...`, `sales_df = ...`, `model = ...`
      const assignMatches = cell.code.matchAll(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm);
      for (const m of assignMatches) {
        if (m[1] && !defined.includes(m[1])) {
          defined.push(m[1]);
        }
      }

      // Check referenced variables
      const tokenMatches = cell.code.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      tokenMatches.forEach((token) => {
        if (definedMap.has(token) && !defined.includes(token) && !referenced.includes(token)) {
          referenced.push(token);
        }
      });

      // Update map for downstream cells
      defined.forEach((d) => definedMap.set(d, cell.id));

      const isError = cell.output && cell.output.type === "error";
      const isExecuting = !!cell.isExecuting;

      nodes.push({
        cellId: cell.id,
        cellIndex: idx + 1,
        cellType: cell.type,
        definedVariables: defined,
        referencedVariables: referenced,
        status: isExecuting ? "running" : isError ? "error" : "clean",
        upstreamNodeIds: [],
        downstreamNodeIds: [],
        snippet: cell.code.trim().split("\n")[0] || "# Empty cell"
      });
    });

    // Build directed edges
    nodes.forEach((node) => {
      node.referencedVariables.forEach((refVar) => {
        const parentCellId = definedMap.get(refVar);
        if (parentCellId && parentCellId !== node.cellId) {
          if (!node.upstreamNodeIds.includes(parentCellId)) {
            node.upstreamNodeIds.push(parentCellId);
          }
          const parentNode = nodes.find((n) => n.cellId === parentCellId);
          if (parentNode && !parentNode.downstreamNodeIds.includes(node.cellId)) {
            parentNode.downstreamNodeIds.push(node.cellId);
          }
        }
      });
    });

    return nodes;
  }, [cells]);

  const activeSelectedNode = useMemo(() => {
    return dagNodes.find((n) => n.cellId === selectedNodeId) || dagNodes[0] || null;
  }, [dagNodes, selectedNodeId]);

  // Find all downstream cells that depend on a selected node
  const downstreamCascadeList = useMemo(() => {
    if (!activeSelectedNode) return [];
    const list: string[] = [];
    const queue = [...activeSelectedNode.downstreamNodeIds];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!list.includes(currentId)) {
        list.push(currentId);
        const node = dagNodes.find((n) => n.cellId === currentId);
        if (node) {
          queue.push(...node.downstreamNodeIds);
        }
      }
    }
    return list;
  }, [activeSelectedNode, dagNodes]);

  const handleTriggerCascade = () => {
    if (!activeSelectedNode) return;
    const runSequence = [activeSelectedNode.cellId, ...downstreamCascadeList];
    onCascadeRun(runSequence);
    toast.success(`Triggered Cascade Reactive Run across ${runSequence.length} cells.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AST Reactive Data Lineage & Dependency DAG
                </h2>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">
                  Reactive Observable Kernel
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Live AST dependency graph detecting cross-cell variable inputs, outputs, and stale downstream branches.
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

        {/* Content Body: Split Graph View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Canvas: Node Hierarchy Flow */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-slate-800 space-y-4 custom-scrollbar bg-slate-950/40">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Directed Cell Flow ({dagNodes.length} Nodes)</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Synced</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Stale/Downstream</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Executing</span>
              </div>
            </div>

            <div className="space-y-3">
              {dagNodes.map((node) => {
                const isSelected = (activeSelectedNode?.cellId === node.cellId);
                const hasDownstream = node.downstreamNodeIds.length > 0;
                const hasUpstream = node.upstreamNodeIds.length > 0;

                return (
                  <div
                    key={node.cellId}
                    onClick={() => setSelectedNodeId(node.cellId)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-slate-800 border-purple-500 shadow-lg ring-2 ring-purple-500/20"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-950 font-mono text-[10px] text-slate-300 border-slate-700">
                          Cell #{node.cellIndex}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                          node.cellType === "python" ? "text-blue-300 border-blue-500/30 bg-blue-500/10" : "text-amber-300 border-amber-500/30 bg-amber-500/10"
                        }`}>
                          {node.cellType}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {node.status === "running" && (
                          <Badge className="bg-blue-500 text-white text-[10px] animate-pulse">Running</Badge>
                        )}
                        {node.status === "error" && (
                          <Badge className="bg-rose-500 text-white text-[10px]">Error Trace</Badge>
                        )}
                        {node.status === "clean" && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Up to date
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Snippet Header */}
                    <div className="text-xs font-mono text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 truncate">
                      {node.snippet}
                    </div>

                    {/* AST Variables summary */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                      {node.definedVariables.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span className="text-slate-500">Defines:</span>
                          {node.definedVariables.map((v) => (
                            <span key={v} className="bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}

                      {node.referencedVariables.length > 0 && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <span className="text-slate-500">Reads:</span>
                          {node.referencedVariables.map((v) => (
                            <span key={v} className="bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Node Inspector & Cascade Actions */}
          <div className="w-full md:w-80 p-6 bg-slate-900 flex flex-col justify-between space-y-6">
            {activeSelectedNode ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400">Inspecting Node</div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Cell #{activeSelectedNode.cellIndex} ({activeSelectedNode.cellType.toUpperCase()})
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-300">Upstream Dependencies ({activeSelectedNode.upstreamNodeIds.length})</div>
                  {activeSelectedNode.upstreamNodeIds.length === 0 ? (
                    <div className="text-slate-500 text-[11px]">Root cell (no upstream dependencies)</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {activeSelectedNode.upstreamNodeIds.map((uId) => {
                        const uNode = dagNodes.find((n) => n.cellId === uId);
                        return (
                          <Badge key={uId} variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 text-[10px]">
                            Cell #{uNode?.cellIndex || uId}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-300">Downstream Consumers ({downstreamCascadeList.length})</div>
                  {downstreamCascadeList.length === 0 ? (
                    <div className="text-slate-500 text-[11px]">Terminal cell (no downstream dependents)</div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-400">
                        Modifying this cell invalidates variable state in {downstreamCascadeList.length} subsequent cells.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {downstreamCascadeList.map((dId) => {
                          const dNode = dagNodes.find((n) => n.cellId === dId);
                          return (
                            <Badge key={dId} className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
                              Cell #{dNode?.cellIndex || dId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => {
                      onExecuteCell(activeSelectedNode.cellId);
                      toast.success(`Executed Cell #${activeSelectedNode.cellIndex}`);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs gap-2"
                  >
                    <Play className="w-3.5 h-3.5" /> Execute This Cell Only
                  </Button>

                  <Button
                    onClick={handleTriggerCascade}
                    disabled={downstreamCascadeList.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs gap-2 shadow-lg shadow-purple-900/30"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Cascade Reactive Run ({1 + downstreamCascadeList.length} Cells)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-12">
                Select a node to inspect its AST lineage.
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">Reactive Purity:</span> Marimo-style pure variable updates eliminate hidden notebook state bugs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NotebookReactiveDAGModal;
