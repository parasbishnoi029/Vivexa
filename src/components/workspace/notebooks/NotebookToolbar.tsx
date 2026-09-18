import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Terminal, Play, RefreshCw, Cpu, Variable, HelpCircle,
  Save, Search, Undo2, Redo2, BookOpen, History,
  Bot, ArrowLeft, Presentation, Replace, Share2, Check, Loader2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollaborativeToolbar } from "@/components/workspace/CollaborativeToolbar";
import { Notebook } from "@/stores/workspaceStore";

export interface NotebookToolbarProps {
  activeNb: Notebook;
  kernelStatus: "Idle" | "Busy" | "Error";
  selectedDatasetName?: string;
  isPresentationMode: boolean;
  setIsPresentationMode: (val: boolean) => void;
  setShowSnippetsDrawer: (val: boolean) => void;
  setShowVariableInspectorModal: (val: boolean) => void;
  setShowCRDTCollabStudio: (val: boolean) => void;
  setCopilotOpen: (val: boolean) => void;
  runAllCells: () => void;
  restartKernel: () => void;
  setShowTimeTravelModal: (val: boolean) => void;
  setShowMicroVMModal: (val: boolean) => void;
  clearAllOutputs: () => void;
  setShowKeyboardShortcuts: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  ctrlMChordActive: boolean;
  notebookMode: "command" | "edit";
  setNotebookMode: (mode: "command" | "edit") => void;
  activeFocusedCellId: string | null;
  focusCellInDOM: (cellId: string, editMode: boolean) => void;
  showFindReplace: boolean;
  setShowFindReplace: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleAutoSave: () => void;
  isAutosaving: boolean;
  lastAutosavedAt: Date | null;
  handleExport: (format: "ipynb" | "py" | "md" | "html") => void;
}

export const NotebookToolbar: React.FC<NotebookToolbarProps> = ({
  activeNb,
  kernelStatus,
  selectedDatasetName,
  setIsPresentationMode,
  setShowSnippetsDrawer,
  setShowVariableInspectorModal,
  setShowCRDTCollabStudio,
  setCopilotOpen,
  runAllCells,
  restartKernel,
  setShowTimeTravelModal,
  setShowMicroVMModal,
  clearAllOutputs,
  setShowKeyboardShortcuts,
  searchQuery,
  setSearchQuery,
  ctrlMChordActive,
  notebookMode,
  setNotebookMode,
  activeFocusedCellId,
  focusCellInDOM,
  showFindReplace,
  setShowFindReplace,
  handleUndo,
  handleRedo,
  handleAutoSave,
  isAutosaving,
  lastAutosavedAt,
  handleExport,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-extrabold tracking-tight text-white">{activeNb.name}</h1>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  kernelStatus === "Busy"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse"
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                }`}
              >
                Kernel: {kernelStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Dataset: <span className="text-amber-300 font-semibold">{selectedDatasetName || "sales_dataset.xlsx"}</span> • Compiled Execution Kernel
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <CollaborativeToolbar roomTitle={activeNb.name} />

          <Button
            onClick={() => setIsPresentationMode(true)}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs h-9 rounded-xl shadow-sm flex items-center gap-1.5"
            title="Toggle Executive Presentation & Report Mode"
          >
            <Presentation className="h-4 w-4 text-indigo-400" /> Presentation View
          </Button>

          <Button
            onClick={() => setShowSnippetsDrawer(true)}
            variant="outline"
            className="bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 font-semibold text-xs h-9 rounded-xl flex items-center gap-1.5"
            title="Open Data Science Recipe Library"
          >
            <BookOpen className="h-4 w-4 text-amber-400" /> DS Recipes
          </Button>

          <Button
            onClick={() => setShowVariableInspectorModal(true)}
            variant="outline"
            className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300 font-semibold text-xs h-9 rounded-xl flex items-center gap-1.5"
            title="Inspect Kernel Variables in Depth"
          >
            <Variable className="h-4 w-4 text-blue-400" /> Variables
          </Button>

          <Button
            onClick={() => setShowCRDTCollabStudio(true)}
            variant="outline"
            className="bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 text-blue-300 font-semibold text-xs h-9 rounded-xl flex items-center gap-1.5 shadow-sm"
            title="Real-Time Yjs CRDT Collaboration"
          >
            <Share2 className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden lg:inline">Collab</span>
          </Button>

          <Button
            onClick={() => setCopilotOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-indigo-900/30 border border-indigo-400/30 relative"
          >
            <Bot className="h-4 w-4 mr-1.5 text-indigo-300" />
            AI Copilot
            {activeNb.cells.some((c) => c.output?.type === "error") && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white rounded-full font-mono animate-pulse">
                {activeNb.cells.filter((c) => c.output?.type === "error").length} err
              </span>
            )}
          </Button>

          <Button onClick={runAllCells} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-amber-900/20">
            <Play className="h-3.5 w-3.5 mr-1.5" /> Run All
          </Button>

          <Button onClick={restartKernel} variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 text-xs h-9 rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Restart
          </Button>

          <Button
            onClick={() => setShowTimeTravelModal(true)}
            variant="outline"
            className="bg-indigo-600/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono"
          >
            <History className="h-3.5 w-3.5 text-indigo-400" /> WAL
          </Button>

          <Button
            onClick={() => setShowMicroVMModal(true)}
            variant="outline"
            className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono"
          >
            <Cpu className="h-3.5 w-3.5 text-amber-400" /> MicroVM
          </Button>

          <Button onClick={clearAllOutputs} variant="ghost" className="text-slate-400 hover:text-white text-xs h-9 rounded-xl">
            Clear
          </Button>

          <Button onClick={() => setShowKeyboardShortcuts(true)} variant="ghost" className="text-slate-400 hover:text-white h-9 w-9 p-0 rounded-xl" title="Shortcuts">
            <HelpCircle className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => navigate("/workspace")}
            variant="outline"
            className="bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 font-semibold text-xs h-9 rounded-xl flex items-center gap-1.5 shadow-sm"
            title="Back to Workspace"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400" /> Back
          </Button>
        </div>
      </div>

      {/* Search, Mode, Autosave & Export Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-850">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            placeholder="Search code content in notebook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs bg-slate-950 border-slate-850 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Jupyter Mode Pill Indicator */}
          {ctrlMChordActive ? (
            <div className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Ctrl+M Chord Active</span>
            </div>
          ) : notebookMode === "command" ? (
            <button
              onClick={() => {
                if (activeFocusedCellId) focusCellInDOM(activeFocusedCellId, true);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all shadow-sm"
              title="Click or press Enter to switch to Edit Mode in active cell"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>COMMAND MODE</span>
              <span className="text-[10px] font-normal text-slate-400 hidden xl:inline">[Enter: Edit]</span>
            </button>
          ) : (
            <button
              onClick={() => setNotebookMode("command")}
              className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm"
              title="Click or press Esc to exit to Command Mode"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>EDIT MODE</span>
              <span className="text-[10px] font-normal text-slate-400 hidden xl:inline">[Esc: Command]</span>
            </button>
          )}

          <Button
            onClick={() => setShowKeyboardShortcuts(true)}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs rounded-xl flex items-center gap-1.5 font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
            title="Open Jupyter Keyboard Shortcuts Cheat Sheet (H / ?)"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Shortcuts</span>
          </Button>

          <Button
            onClick={() => setShowFindReplace(!showFindReplace)}
            variant="outline"
            size="sm"
            className={`h-8 px-2.5 text-xs rounded-xl flex items-center gap-1.5 font-semibold transition-all ${
              showFindReplace
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Replace className="h-3.5 w-3.5 text-indigo-400" />
            <span>Find & Replace</span>
          </Button>

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5"></div>

          <Button onClick={handleUndo} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white" title="Undo (Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={handleRedo} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white" title="Redo">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <div className="h-4 w-[1px] bg-slate-800 mx-0.5"></div>
          <Button onClick={handleAutoSave} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white" title="Save Notebook (Ctrl+S)">
            <Save className="h-3.5 w-3.5" />
          </Button>

          {/* Autosave Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono">
            {isAutosaving ? (
              <>
                <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                <span className="text-amber-300">Autosaving...</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-slate-300">Autosaved</span>
                {lastAutosavedAt && (
                  <span className="text-slate-500 hidden sm:inline">
                    {lastAutosavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Export Dropdown representation */}
          <div className="flex items-center border border-slate-800 rounded-lg p-0.5 bg-slate-950">
            <span className="text-[10px] text-slate-500 px-1.5 font-mono">Export:</span>
            <button onClick={() => handleExport("ipynb")} className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold">.ipynb</button>
            <button onClick={() => handleExport("py")} className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold">.py</button>
            <button onClick={() => handleExport("md")} className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold">.md</button>
            <button onClick={() => handleExport("html")} className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold">.html</button>
          </div>
        </div>
      </div>
    </div>
  );
};
