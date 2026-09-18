import React from "react";
import { Terminal, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cell } from "@/stores/workspaceStore";
import { NotebookCodeCell } from "./NotebookCodeCell";
import { NotebookMarkdownCell } from "./NotebookMarkdownCell";

export interface NotebookCellListProps {
  filteredCells: Cell[];
  notebookMode: "command" | "edit";
  activeFocusedCellId: string | null;
  cellExecutionMeta: Record<string, { durationMs: number; timestamp: string }>;
  activeLocks: Record<string, string>;
  collaborators: any[];
  currentUserId?: string;
  cellRuntimes: Record<string, "wasm" | "microvm">;
  setCellRuntimes: React.Dispatch<React.SetStateAction<Record<string, "wasm" | "microvm">>>;
  insertCellAt: (index: number, type: "python" | "sql" | "markdown") => void;
  executeCell: (cellId: string) => void;
  runAndAdvanceCell: (cellId: string) => void;
  runInPlaceCell: (cellId: string) => void;
  runAndInsertBelow: (cellId: string) => void;
  setNotebookMode: (mode: "command" | "edit") => void;
  setActiveFocusedCellId: (cellId: string | null) => void;
  cancelCellExecution: (cellId: string) => void;
  runCellsAbove: (cellId: string) => void;
  runCellsBelow: (cellId: string) => void;
  updateCellCode: (cellId: string, code: string) => void;
  updateCellType: (cellId: string, type: "python" | "sql" | "markdown") => void;
  duplicateCell: (cellId: string) => void;
  deleteCell: (cellId: string) => void;
  moveCell: (cellId: string, direction: "up" | "down") => void;
  setTargetCellId: (cellId: string) => void;
  setCopilotOpen: (open: boolean) => void;
  handleQuickAiAction: (cellId: string, action: "explain" | "optimize" | "visualize" | "fix" | "docstring") => void;
  focusCell: (cellId: string | null) => void;
  setTyping: (typing: boolean) => void;
  clearOutput: (cellId: string) => void;
  codeSnippets: { label: string; code: string; type: string }[];
  injectSnippet: (cellId: string, snippetCode: string) => void;
  addCell: (type: "python" | "sql" | "markdown") => void;
  onFixWithCopilot?: (cellId: string, errorText: string) => void;
}

export const NotebookCellList: React.FC<NotebookCellListProps> = ({
  filteredCells,
  notebookMode,
  activeFocusedCellId,
  cellExecutionMeta,
  activeLocks,
  collaborators,
  currentUserId,
  cellRuntimes,
  setCellRuntimes,
  insertCellAt,
  executeCell,
  runAndAdvanceCell,
  runInPlaceCell,
  runAndInsertBelow,
  setNotebookMode,
  setActiveFocusedCellId,
  cancelCellExecution,
  runCellsAbove,
  runCellsBelow,
  updateCellCode,
  updateCellType,
  duplicateCell,
  deleteCell,
  moveCell,
  setTargetCellId,
  setCopilotOpen,
  handleQuickAiAction,
  focusCell,
  setTyping,
  clearOutput,
  codeSnippets,
  injectSnippet,
  addCell,
  onFixWithCopilot,
}) => {
  if (filteredCells.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/20 border border-slate-850 rounded-2xl">
        <Terminal className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-300">No matching cells</h3>
        <p className="text-xs text-slate-500 mb-4">Create a cell below or clear your search query.</p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => addCell("python")} size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs">
            + Code Cell
          </Button>
          <Button onClick={() => addCell("sql")} size="sm" className="bg-amber-600 hover:bg-amber-500 text-xs">
            + SQL Cell
          </Button>
          <Button onClick={() => addCell("markdown")} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs">
            + Markdown Cell
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredCells.map((cell, idx) => {
        const execMeta = cellExecutionMeta[cell.id];
        const lockingUserId = activeLocks[cell.id];
        const lockingPeer =
          lockingUserId && lockingUserId !== currentUserId
            ? collaborators.find((c) => c.id === lockingUserId)
            : null;

        return (
          <React.Fragment key={cell.id}>
            {/* Floating In-Between Add Cell Divider */}
            <div className="group/divider relative py-1.5 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/60 group-hover/divider:border-indigo-500/30 transition-colors"></div>
              </div>
              <div className="relative z-10 flex items-center gap-1.5 bg-slate-900/95 px-3 py-1 rounded-full border border-slate-800 shadow-xl text-[10px] scale-95 group-hover/divider:scale-100 transition-all backdrop-blur-md">
                <span className="text-slate-400 font-mono pr-0.5">+ Insert:</span>
                <button
                  onClick={() => insertCellAt(idx, "python")}
                  className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 font-mono font-medium transition-all"
                >
                  Code
                </button>
                <button
                  onClick={() => insertCellAt(idx, "sql")}
                  className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-mono font-medium transition-all"
                >
                  SQL
                </button>
                <button
                  onClick={() => insertCellAt(idx, "markdown")}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-mono font-medium transition-all"
                >
                  Markdown
                </button>
              </div>
            </div>

            {cell.type === "markdown" ? (
              <NotebookMarkdownCell
                cell={cell}
                index={idx}
                isActive={activeFocusedCellId === cell.id}
                notebookMode={notebookMode}
                onUpdateCode={(code) => {
                  updateCellCode(cell.id, code);
                  setTyping(true);
                }}
                onUpdateType={(type) => updateCellType(cell.id, type)}
                onDelete={() => deleteCell(cell.id)}
                onDuplicate={() => duplicateCell(cell.id)}
                onMoveUp={() => moveCell(cell.id, "up")}
                onMoveDown={() => moveCell(cell.id, "down")}
                onFocus={() => {
                  setActiveFocusedCellId(cell.id);
                  focusCell(cell.id);
                }}
                onBlur={() => {
                  focusCell(null);
                  setTyping(false);
                }}
              />
            ) : (
              <NotebookCodeCell
                cell={cell}
                index={idx}
                isActive={activeFocusedCellId === cell.id}
                notebookMode={notebookMode}
                lockingPeer={
                  lockingPeer
                    ? {
                        name: lockingPeer.name,
                        role: lockingPeer.role,
                        color: lockingPeer.color,
                        isTyping: Boolean(lockingPeer.isTyping),
                      }
                    : null
                }
                execMeta={
                  execMeta
                    ? {
                        durationMs: execMeta.durationMs,
                        timestamp: execMeta.timestamp,
                      }
                    : undefined
                }
                runtime={cellRuntimes[cell.id] || "wasm"}
                onRuntimeChange={(rt) => setCellRuntimes((prev) => ({ ...prev, [cell.id]: rt }))}
                onExecute={() => executeCell(cell.id)}
                onRunAndAdvance={() => runAndAdvanceCell(cell.id)}
                onRunInPlace={() => runInPlaceCell(cell.id)}
                onRunAndInsertBelow={() => runAndInsertBelow(cell.id)}
                onEnterCommandMode={() => {
                  setNotebookMode("command");
                  setActiveFocusedCellId(cell.id);
                }}
                onCancel={() => cancelCellExecution(cell.id)}
                onRunAbove={() => runCellsAbove(cell.id)}
                onRunBelow={() => runCellsBelow(cell.id)}
                onUpdateCode={(code) => {
                  updateCellCode(cell.id, code);
                  setTyping(true);
                }}
                onUpdateType={(type) => updateCellType(cell.id, type)}
                onDuplicate={() => duplicateCell(cell.id)}
                onDelete={() => deleteCell(cell.id)}
                onMoveUp={() => moveCell(cell.id, "up")}
                onMoveDown={() => moveCell(cell.id, "down")}
                onTriggerCopilot={() => {
                  setTargetCellId(cell.id);
                  setCopilotOpen(true);
                }}
                onQuickAiAction={(action) => handleQuickAiAction(cell.id, action)}
                onFocus={() => {
                  setActiveFocusedCellId(cell.id);
                  setNotebookMode("edit");
                  focusCell(cell.id);
                  setTyping(true);
                }}
                onBlur={() => {
                  focusCell(null);
                  setTyping(false);
                }}
                onClearOutput={() => clearOutput(cell.id)}
                codeSnippets={codeSnippets}
                onInjectSnippet={(snippetCode) => injectSnippet(cell.id, snippetCode)}
                onFixWithCopilot={onFixWithCopilot}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Bottom Add Cell Action Bar */}
      <div className="flex items-center justify-center gap-3 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
        <Button
          onClick={() => addCell("python")}
          size="sm"
          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs h-8 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Python Code Cell
        </Button>
        <Button
          onClick={() => addCell("sql")}
          size="sm"
          className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs h-8 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> SQL Query Cell
        </Button>
        <Button
          onClick={() => addCell("markdown")}
          size="sm"
          className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs h-8 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Markdown Cell
        </Button>
      </div>
    </div>
  );
};
