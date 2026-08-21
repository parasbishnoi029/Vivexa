import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Play, Plus, Trash2, Copy, CopyPlus, ChevronUp, ChevronDown, Bot,
  Sparkles, Clock, Ban, Eye, EyeOff, Lock, Code, Check, RefreshCw,
  Wand2, AlignLeft, Shield, Cpu, ChevronRight, CornerDownRight, FileText,
  MoreHorizontal, Terminal, ArrowUp, ArrowDown, Scissors, CheckCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Cell } from "@/stores/workspaceStore";
import Markdown from "react-markdown";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { WebrtcProvider } from "y-webrtc";
import {
  createLSPLinter,
  createLSPHoverTooltip,
  createLSPAutocomplete,
} from "./codemirrorLspExtension";

interface NotebookCellEditorProps {
  cell: Cell;
  index: number;
  isActive: boolean;
  notebookMode?: "command" | "edit";
  isLockedByPeer?: { name: string; role: string; color: string; isTyping: boolean } | null;
  executionMeta?: { durationMs: number; timestamp: string };
  runtime: "wasm" | "microvm";
  onRuntimeChange: (runtime: "wasm" | "microvm") => void;
  onExecute: () => void;
  onRunAndAdvance?: () => void;
  onRunInPlace?: () => void;
  onRunAndInsertBelow?: () => void;
  onEnterCommandMode?: () => void;
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
  children?: React.ReactNode;
}

const NotebookCellEditorComponent: React.FC<NotebookCellEditorProps> = ({
  cell,
  index,
  isActive,
  notebookMode = "edit",
  isLockedByPeer,
  executionMeta,
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
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMdEditing, setIsMdEditing] = useState(cell.type === "markdown" && !cell.output);
  const [showAiQuickMenu, setShowAiQuickMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Yjs CRDT binding setup
  const [yCollabExtension, setYCollabExtension] = useState<any>(null);

  useEffect(() => {
    // Isolated Yjs document for this specific cell's CRDT
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText(cell.id);
    
    // Seed initial content if empty
    if (ytext.toString() === "") {
      ytext.insert(0, cell.code);
    }

    const provider = new WebrtcProvider(`vivexa-cell-${cell.id}`, ydoc, {
      signaling: ["wss://signaling.yjs.dev"]
    });

    const userColor = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][Math.floor(Math.random() * 4)];
    provider.awareness.setLocalStateField("user", {
      name: "Anonymous Pilot",
      color: userColor,
      colorLight: userColor + "33"
    });

    setYCollabExtension(yCollab(ytext, provider.awareness));

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [cell.id]);

  // Line numbers memoized calculation
  const lineCount = useMemo(() => {
    const lines = (cell.code || "").split("\n");
    return Math.max(1, lines.length);
  }, [cell.code]);

  // Format Code Helper
  const formatCellCode = useCallback(() => {
    if (cell.type === "sql") {
      const sqlKeywords = [
        "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT",
        "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "ON", "AND", "OR",
        "AS", "COUNT", "SUM", "AVG", "MIN", "MAX", "DISTINCT", "CASE", "WHEN",
        "THEN", "ELSE", "END", "OVER", "PARTITION BY", "WITH"
      ];
      let formatted = cell.code;
      sqlKeywords.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, "gi");
        formatted = formatted.replace(regex, kw);
      });
      onUpdateCode(formatted);
      toast.success("Standardized SQL syntax keywords");
    } else if (cell.type === "python") {
      const cleanLines = cell.code.split("\n").map((l) => l.trimEnd());
      onUpdateCode(cleanLines.join("\n"));
      toast.success("Formatted Python code layout");
    }
  }, [cell.code, cell.type, onUpdateCode]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(cell.code);
    setCopiedCode(true);
    toast.success("Copied cell code to clipboard");
    setTimeout(() => setCopiedCode(false), 1500);
  }, [cell.code]);

  // Keyboard handling inside textarea (Shift+Enter, Ctrl+Enter, Alt+Enter, Esc, Tab)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Shift+Enter: Run and Advance
    if (e.key === "Enter" && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      if (onRunAndAdvance) {
        onRunAndAdvance();
      } else {
        onExecute();
      }
      return;
    }

    // 2. Ctrl+Enter or Cmd+Enter: Run in Place
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      if (onRunInPlace) {
        onRunInPlace();
      } else {
        onExecute();
      }
      return;
    }

    // 3. Alt+Enter / Option+Enter: Run and Insert Below
    if (e.key === "Enter" && (e.altKey || (e.shiftKey && e.altKey))) {
      e.preventDefault();
      if (onRunAndInsertBelow) {
        onRunAndInsertBelow();
      } else {
        onExecute();
      }
      return;
    }

    // 4. Escape: Exit Edit Mode to Command Mode
    if (e.key === "Escape") {
      e.preventDefault();
      if (onEnterCommandMode) {
        onEnterCommandMode();
      } else {
        textareaRef.current?.blur();
      }
      return;
    }

    // 5. Ctrl+M: Jupyter Chord / Exit Edit Mode
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
      e.preventDefault();
      if (onEnterCommandMode) {
        onEnterCommandMode();
      } else {
        textareaRef.current?.blur();
      }
      return;
    }

    // 6. Tab indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const val = target.value;
      const newVal = val.substring(0, start) + "    " + val.substring(end);
      onUpdateCode(newVal);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  }, [onRunAndAdvance, onExecute, onRunInPlace, onRunAndInsertBelow, onEnterCommandMode, onUpdateCode]);

  const badgeStyles = useMemo(() => {
    switch (cell.type) {
      case "python":
        return "bg-blue-500/10 text-blue-300 border-blue-500/25";
      case "sql":
        return "bg-amber-500/10 text-amber-300 border-amber-500/25";
      case "markdown":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/25";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  }, [cell.type]);

  return (
    <Card
      id={cell.id}
      onClick={onFocus}
      className={`group relative bg-slate-900/50 border transition-all duration-200 rounded-2xl overflow-visible backdrop-blur-md ${
        isActive
          ? notebookMode === "edit"
            ? "border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/30"
            : "border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.08)] ring-1 ring-indigo-500/30"
          : "border-slate-800/80 hover:border-slate-750 hover:bg-slate-900/70"
      }`}
    >
      {/* Lateral Focus Active Indicator Line */}
      <div
        className={`absolute -left-[1px] top-3 bottom-3 w-1 rounded-r-full transition-all duration-200 ${
          isActive
            ? notebookMode === "edit"
              ? "bg-emerald-500 opacity-100"
              : "bg-indigo-500 opacity-100"
            : "opacity-0 group-hover:opacity-40 bg-slate-600"
        }`}
      />

      {/* Clean Distraction-Free Header Bar */}
      <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 rounded-t-2xl select-none">
        {/* Left Status & Type Indicator */}
        <div className="flex items-center gap-2">
          {/* Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800/50 transition-colors"
            title={isCollapsed ? "Expand cell" : "Collapse cell"}
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isCollapsed ? "" : "rotate-90"
              }`}
            />
          </button>

          {/* Execution Counter Badge */}
          <div className="flex items-center gap-1.5 font-mono">
            <span
              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] tracking-wide border flex items-center gap-1.5 ${badgeStyles}`}
            >
              {cell.isExecuting ? (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                  <span>[*] {cell.type}</span>
                </span>
              ) : (
                <span>
                  [{index + 1}] {cell.type}
                </span>
              )}
            </span>
          </div>

          {/* Runtime Switcher Pill (Python only) */}
          {cell.type === "python" && (
            <div className="flex items-center bg-slate-950/80 border border-slate-800/80 rounded-lg p-0.5 text-[9px] font-mono shadow-inner">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRuntimeChange("wasm");
                }}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  runtime === "wasm"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="Execute locally in client-side Pyodide WASM sandbox"
              >
                WASM
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRuntimeChange("microvm");
                }}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  runtime === "microvm"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="Execute in isolated MicroVM Pod fleet"
              >
                MicroVM
              </button>
            </div>
          )}

          {/* Active Mode Indicator Badge */}
          {isActive && (
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase transition-all tracking-wider ${
                notebookMode === "edit"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
              }`}
            >
              {notebookMode === "edit" ? "EDIT" : "CMD"}
            </span>
          )}

          {/* Execution Time Benchmark */}
          {executionMeta && (
            <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1 font-mono pl-1">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>{executionMeta.durationMs}ms</span>
            </span>
          )}
        </div>

        {/* Right Subtle Hover-Reveal Action Controls */}
        <div
          className={`flex items-center gap-1 transition-all duration-200 ${
            isActive || showAiQuickMenu || showMoreMenu
              ? "opacity-100"
              : "opacity-40 group-hover:opacity-100"
          }`}
        >
          {/* Primary Execute Action */}
          {cell.isExecuting ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px] bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25 rounded-lg flex items-center gap-1 font-semibold transition-all"
            >
              <Ban className="h-3 w-3" />
              <span>Cancel</span>
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              size="sm"
              className="h-6 px-2.5 text-[11px] bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg flex items-center gap-1 font-semibold transition-all shadow-xs"
              title="Execute cell (Shift+Enter)"
            >
              <Play className="h-2.5 w-2.5 fill-current" />
              <span>
                {cell.type === "markdown" ? (isMdEditing ? "Render" : "Edit") : "Run"}
              </span>
            </Button>
          )}

          {/* Run Relative Group (Hover Only) */}
          {cell.type !== "markdown" && (
            <div className="hidden md:flex items-center gap-0.5 pl-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunAbove();
                }}
                className="h-6 px-1.5 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
                title="Run all cells above"
              >
                ↑ Above
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunBelow();
                }}
                className="h-6 px-1.5 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
                title="Run all cells below"
              >
                ↓ Below
              </button>
            </div>
          )}

          <div className="h-3.5 w-[1px] bg-slate-800 mx-0.5 hidden sm:block"></div>

          {/* AI Quick Actions Dropdown */}
          <div className="relative">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowAiQuickMenu(!showAiQuickMenu);
                setShowMoreMenu(false);
              }}
              size="sm"
              variant="ghost"
              className={`h-6 px-2 text-[11px] rounded-lg font-semibold flex items-center gap-1 transition-all ${
                showAiQuickMenu
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/15"
              }`}
              title="AI Assistant Actions"
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span className="hidden sm:inline">AI Actions</span>
            </Button>

            {showAiQuickMenu && (
              <div className="absolute right-0 top-7 z-40 w-52 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-0.5 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAiAction("explain");
                    setShowAiQuickMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span>Explain Cell Logic</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAiAction("optimize");
                    setShowAiQuickMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
                >
                  <Wand2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Optimize & Vectorize</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAiAction("visualize");
                    setShowAiQuickMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Auto-Generate Plot</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAiAction("docstring");
                    setShowAiQuickMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
                >
                  <AlignLeft className="h-3.5 w-3.5 text-purple-400" />
                  <span>Add Markdown Summary</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Copilot Trigger */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onTriggerCopilot();
            }}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/15 rounded-lg"
            title="Open AI Copilot for this cell"
          >
            <Bot className="h-3.5 w-3.5" />
          </Button>

          {/* Prettify Code */}
          {cell.type !== "markdown" && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                formatCellCode();
              }}
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg hidden sm:inline-flex"
              title="Prettify / Format Code"
            >
              <Code className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Copy Code */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode();
            }}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg"
            title="Copy Code"
          >
            {copiedCode ? (
              <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Reordering Up / Down */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg hidden sm:inline-flex"
            title="Move Up (Shift+K)"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg hidden sm:inline-flex"
            title="Move Down (Shift+J)"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
                setShowAiQuickMenu(false);
              }}
              size="icon"
              variant="ghost"
              className={`h-6 w-6 rounded-lg transition-colors ${
                showMoreMenu
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="More Cell Operations"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>

            {showMoreMenu && (
              <div className="absolute right-0 top-7 z-40 w-44 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-0.5 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 font-sans">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
                >
                  <CopyPlus className="h-3.5 w-3.5 text-slate-400" />
                  <span>Duplicate Cell</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateType(cell.type === "python" ? "sql" : cell.type === "sql" ? "markdown" : "python");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
                >
                  <Terminal className="h-3.5 w-3.5 text-slate-400" />
                  <span>Cycle Cell Type</span>
                </button>
                <div className="h-[1px] bg-slate-800 my-1"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Cell (D D)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      {!isCollapsed && (
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Lock Banner if peer is typing */}
          {isLockedByPeer && (
            <div
              className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{
                backgroundColor: `${isLockedByPeer.color}15`,
                borderColor: `${isLockedByPeer.color}40`,
                color: isLockedByPeer.color,
              }}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Locked by {isLockedByPeer.name} ({isLockedByPeer.role})
                </span>
              </div>
              <span className="text-[10px] opacity-80 font-mono">
                {isLockedByPeer.isTyping ? "Typing..." : "CRDT Active"}
              </span>
            </div>
          )}

          {/* Markdown Rendered vs Edit View */}
          {cell.type === "markdown" && !isMdEditing && cell.output?.type === "markdown" ? (
            <div
              onClick={() => setIsMdEditing(true)}
              className="prose prose-invert prose-sm text-slate-200 bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 cursor-pointer hover:border-emerald-500/40 transition-all max-w-none shadow-inner leading-relaxed"
              title="Click to edit Markdown text"
            >
              <Markdown>{cell.code}</Markdown>
              <span className="text-[10px] text-slate-500 block text-right mt-2 font-mono">
                Double-click or press Enter to edit
              </span>
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-800/90 bg-slate-950/90 overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 shadow-inner transition-all w-full min-h-[80px]">
              <CodeMirror
                value={cell.code}
                theme={oneDark}
                extensions={[
                  cell.type === "sql" ? sql() : cell.type === "python" ? python() : markdown(),
                  createLSPLinter(cell.type),
                  createLSPHoverTooltip(cell.type),
                  createLSPAutocomplete(cell.type),
                  ...(yCollabExtension ? [yCollabExtension] : []),
                ]}
                onChange={(val) => onUpdateCode(val)}
                onKeyDown={(e) => {
                  // Re-use our existing shortcut logic via the original DOM event wrapper
                  handleKeyDown(e as any);
                }}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  highlightActiveLine: true,
                }}
                className="text-[13px] font-mono w-full h-full"
                placeholder={
                  cell.type === "markdown"
                    ? "## Section Header\nExplain findings and insights..."
                    : "# Write executable Python or SQL code..."
                }
              />
            </div>
          )}

          {/* Render Any Injected Outputs / Diagnostics */}
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export const NotebookCellEditor = React.memo(NotebookCellEditorComponent);
export default NotebookCellEditor;
