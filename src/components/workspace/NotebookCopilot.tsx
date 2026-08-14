import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, Bot, AlertTriangle, CheckCircle2, Play, Plus, RefreshCw,
  Key, Settings, Terminal, Code, FileCode, Check, Copy, ArrowRight,
  ShieldAlert, Wrench, X, ExternalLink, HelpCircle, Lightbulb, Zap,
  MessageSquare, Cpu, ArrowUpRight, RotateCcw, Database, Layers,
  ChevronDown, ChevronRight, Wand2, BarChart2, Split, Eye, EyeOff,
  Sliders, Activity, CheckCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Cell, Notebook } from "@/stores/workspaceStore";
import Markdown from "react-markdown";

interface NotebookCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  activeNotebook: Notebook;
  selectedDataset: any;
  activeCellId: string | null;
  onUpdateCellCode: (cellId: string, newCode: string, newType?: "python" | "sql" | "markdown") => void;
  onAddCell: (type: "python" | "sql" | "markdown", initialCode?: string) => void;
  onExecuteCell: (cellId: string) => Promise<void>;
  onInstallPackage: (packageName: string) => Promise<void>;
  sessionToken?: string;
}

export default function NotebookCopilot({
  isOpen,
  onClose,
  activeNotebook,
  selectedDataset,
  activeCellId,
  onUpdateCellCode,
  onAddCell,
  onExecuteCell,
  onInstallPackage,
  sessionToken
}: NotebookCopilotProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "cell_work" | "error_doctor" | "settings">("chat");

  const copyToClipboard = async (text: string, label: string = "Copied to clipboard!") => {
    if (!text) {
      toast.error("Nothing to copy!");
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(label);
        return;
      }
    } catch (e) {
      console.warn("Clipboard API failed, using fallback:", e);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        toast.success(label);
      } else {
        toast.error("Failed to copy to clipboard.");
      }
    } catch (err) {
      toast.error("Could not copy content.");
    }
  };

  // API Key State: Default Server Key vs Custom User Key
  const [useCustomKey, setUseCustomKey] = useState<boolean>(() => {
    return localStorage.getItem("vivexa_use_custom_ai_key") === "true";
  });
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("vivexa_custom_ai_key") || "";
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [preferredModel, setPreferredModel] = useState<string>(() => {
    return localStorage.getItem("vivexa_preferred_model") || "gemini-3.1-flash-lite";
  });
  const [testingKey, setTestingKey] = useState(false);

  // Chat Tab state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: "user" | "copilot";
    text: string;
    codeSnippet?: string;
    snippetType?: "python" | "sql" | "markdown";
    suggestedActions?: string[];
    timestamp: string;
    modelUsed?: string;
  }>>([
    {
      id: "msg-welcome",
      sender: "copilot",
      text: `Hello! I am your **Notebook AI Copilot**. I can assist you with interactive data science code generation, line-by-line cell refactoring, SQL-to-Pandas transformations, and 1-click execution error debugging.`,
      suggestedActions: [
        "Summarize dataset columns & nulls",
        "Generate sales distribution chart",
        "Write SQL grouping query",
        "Scan notebook for execution errors"
      ],
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Cell Work Assistant State
  const [targetCellId, setTargetCellId] = useState<string>(activeCellId || activeNotebook.cells[0]?.id || "");
  const [cellPrompt, setCellPrompt] = useState("");
  const [cellWorkLoading, setCellWorkLoading] = useState(false);
  const [cellExplanation, setCellExplanation] = useState("");
  const [showCodePreview, setShowCodePreview] = useState(true);

  // Error Doctor State
  const [fixingCellId, setFixingCellId] = useState<string | null>(null);
  const [errorAnalysis, setErrorAnalysis] = useState<Record<string, any>>({});
  const [appliedPatches, setAppliedPatches] = useState<Record<string, boolean>>({});
  const [showRepairedCode, setShowRepairedCode] = useState<Record<string, boolean>>({});

  // Sync activeCellId when changed
  useEffect(() => {
    if (activeCellId) {
      setTargetCellId(activeCellId);
    } else if (activeNotebook.cells.length > 0 && !targetCellId) {
      setTargetCellId(activeNotebook.cells[0].id);
    }
  }, [activeCellId, activeNotebook.cells]);

  // Find target cell object
  const targetCell = activeNotebook.cells.find(c => c.id === targetCellId) || activeNotebook.cells[0];

  // Find cells with execution errors
  const failingCells = activeNotebook.cells.filter(c => c.output?.type === "error");

  // Save Settings
  const handleSaveSettings = () => {
    localStorage.setItem("vivexa_use_custom_ai_key", String(useCustomKey));
    localStorage.setItem("vivexa_custom_ai_key", customApiKey.trim());
    localStorage.setItem("vivexa_preferred_model", preferredModel);
    toast.success("Copilot API Configuration updated successfully.");
  };

  // Test API Key
  const handleTestApiKey = async () => {
    setTestingKey(true);
    toast.info("Testing Gemini API connection...");
    try {
      const response = await fetch('/api/v1/notebook/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'x-custom-ai-key': useCustomKey ? customApiKey.trim() : ""
        },
        body: JSON.stringify({
          mode: 'chat',
          prompt: 'Hello Test Key Connection',
          customApiKey: useCustomKey ? customApiKey.trim() : "",
          preferredModel
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        toast.success(`API Key connection verified! Active model: ${result.data.usedModel}`);
      } else {
        throw new Error(result.error || "Connection test failed.");
      }
    } catch (err: any) {
      toast.error(`Key Test Failed: ${err.message}`);
    } finally {
      setTestingKey(false);
    }
  };

  // Send Chat Message
  const handleSendChat = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || inputPrompt.trim();
    if (!promptToSend) return;

    const userMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: "user" as const,
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setInputPrompt("");
    setLoadingAi(true);

    try {
      const response = await fetch('/api/v1/notebook/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'x-custom-ai-key': useCustomKey ? customApiKey.trim() : ""
        },
        body: JSON.stringify({
          mode: 'chat',
          prompt: promptToSend,
          allCells: activeNotebook.cells,
          datasetMeta: selectedDataset ? {
            name: selectedDataset.name,
            columns: selectedDataset.columns,
            rows: selectedDataset.row_count
          } : null,
          customApiKey: useCustomKey ? customApiKey.trim() : "",
          preferredModel
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const botMsg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-bot`,
          sender: "copilot" as const,
          text: data.text || "I have analyzed your request.",
          codeSnippet: data.code_snippet,
          snippetType: data.snippet_type || "python",
          suggestedActions: data.suggested_actions || [],
          timestamp: new Date().toLocaleTimeString(),
          modelUsed: data.usedModel
        };
        setChatMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(result.error || "Copilot response generation failed.");
      }
    } catch (err: any) {
      toast.error(`Copilot Error: ${err.message}`);
      setChatMessages(prev => [...prev, {
        id: `msg-err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: "copilot",
        text: `⚠️ **Copilot Error**: ${err.message}\n\nPlease check your API key settings or switch to default server key in the Settings tab.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoadingAi(false);
    }
  };

  // Do Work in Cell (Generate, Refactor, Comment, Explain, Convert)
  const handleCellWork = async (mode: "generate_cell" | "refactor_cell" | "explain_cell" | "comment_code" | "convert_code", customInstruction?: string) => {
    const currentTarget = activeNotebook.cells.find(c => c.id === targetCellId);
    if (!currentTarget && mode !== "generate_cell") {
      toast.error("Please select a valid cell to operate on.");
      return;
    }

    const instructionPrompt = customInstruction || cellPrompt.trim();

    setCellWorkLoading(true);
    toast.info(`Copilot processing cell action: ${mode.replace("_", " ").toUpperCase()}...`);

    try {
      const response = await fetch('/api/v1/notebook/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'x-custom-ai-key': useCustomKey ? customApiKey.trim() : ""
        },
        body: JSON.stringify({
          mode,
          prompt: instructionPrompt,
          cellCode: currentTarget?.code || "",
          cellType: currentTarget?.type || "python",
          allCells: activeNotebook.cells,
          datasetMeta: selectedDataset ? {
            name: selectedDataset.name,
            columns: selectedDataset.columns,
            rows: selectedDataset.row_count
          } : null,
          customApiKey: useCustomKey ? customApiKey.trim() : "",
          preferredModel
        })
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Copilot cell operation failed.");
      }

      const data = result.data;

      if (mode === "explain_cell") {
        setCellExplanation(data.explanation || "No explanation provided.");
        toast.success("Cell explanation generated!");
      } else if (mode === "generate_cell") {
        const newCode = data.code || "";
        const newType = (data.cell_type as any) || "python";
        if (currentTarget) {
          onUpdateCellCode(currentTarget.id, newCode, newType);
          toast.success(`Updated Cell #${activeNotebook.cells.findIndex(c => c.id === currentTarget.id) + 1} with generated code!`);
        } else {
          onAddCell(newType, newCode);
          toast.success("Added new cell with generated AI code!");
        }
        setCellPrompt("");
      } else {
        // refactor_cell, comment_code, convert_code
        const newCode = data.new_code || currentTarget?.code || "";
        const newType = (data.target_type as any) || currentTarget?.type || "python";
        if (currentTarget) {
          onUpdateCellCode(currentTarget.id, newCode, newType);
          toast.success(`Cell code updated successfully (${mode})!`);
        }
        if (data.explanation) {
          setCellExplanation(data.explanation);
        }
      }

    } catch (err: any) {
      toast.error(`Cell Action Error: ${err.message}`);
    } finally {
      setCellWorkLoading(false);
    }
  };

  // Auto-Fix Error in Cell
  const handleAutoFixError = async (cellId: string) => {
    const errCell = activeNotebook.cells.find(c => c.id === cellId);
    if (!errCell || errCell.output?.type !== "error") return;

    setFixingCellId(cellId);
    toast.info("Copilot analyzing crash exception and generating fix patch...");

    try {
      const response = await fetch('/api/v1/notebook/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'x-custom-ai-key': useCustomKey ? customApiKey.trim() : ""
        },
        body: JSON.stringify({
          mode: 'fix_error',
          cellCode: errCell.code,
          cellType: errCell.type,
          cellError: errCell.output.error,
          allCells: activeNotebook.cells,
          datasetMeta: selectedDataset ? {
            name: selectedDataset.name,
            columns: selectedDataset.columns,
            rows: selectedDataset.row_count
          } : null,
          customApiKey: useCustomKey ? customApiKey.trim() : "",
          preferredModel
        })
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Auto-fix analysis failed.");
      }

      const fixData = result.data;
      setErrorAnalysis(prev => ({ ...prev, [cellId]: fixData }));
      setShowRepairedCode(prev => ({ ...prev, [cellId]: true }));

      // If a package install is required, prompt install or execute package install
      if (fixData.requires_package_install && fixData.package_name) {
        toast.info(`Missing Python library detected: Installing '${fixData.package_name}'...`);
        await onInstallPackage(fixData.package_name);
      }

      // Update cell code with repaired code
      if (fixData.repaired_code) {
        onUpdateCellCode(cellId, fixData.repaired_code, fixData.target_type || errCell.type);
        setAppliedPatches(prev => ({ ...prev, [cellId]: true }));
        toast.success("AI Copilot applied repair patch! Re-executing cell now...");
        await onExecuteCell(cellId);
      }

    } catch (err: any) {
      toast.error(`Auto-Fix Failed: ${err.message}`);
    } finally {
      setFixingCellId(null);
    }
  };

  // Manual Apply Patch
  const handleApplyPatch = async (cellId: string, repairedCode: string, targetType?: "python" | "sql" | "markdown") => {
    onUpdateCellCode(cellId, repairedCode, targetType);
    setAppliedPatches(prev => ({ ...prev, [cellId]: true }));
    toast.success("Applied repair code to cell. Re-executing cell...");
    await onExecuteCell(cellId);
  };

  // Batch Fix All Notebook Errors
  const handleFixAllErrors = async () => {
    if (failingCells.length === 0) {
      toast.info("No failing cells found in current notebook.");
      return;
    }
    toast.info(`Repairing ${failingCells.length} failing cells sequentially...`);
    for (const cell of failingCells) {
      await handleAutoFixError(cell.id);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end font-sans">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Copilot Drawer Panel */}
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="relative z-[101] w-full sm:w-[540px] md:w-[580px] h-full bg-slate-950/98 border-l border-indigo-500/30 backdrop-blur-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden"
        >
          {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 text-indigo-400 border border-indigo-500/40 shadow-inner shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white tracking-wide truncate">Notebook AI Copilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {useCustomKey ? "Custom Key" : "Enterprise"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                <Cpu className="h-3 w-3 text-indigo-400 shrink-0" />
                Active Model: <span className="text-slate-200 font-mono font-medium truncate">{preferredModel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {failingCells.length > 0 && (
              <button
                onClick={() => setActiveTab("error_doctor")}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                {failingCells.length} Error{failingCells.length > 1 ? 's' : ''}
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notebook Context Status Strip */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex items-center gap-1 text-slate-300 truncate font-medium">
              <Database className="h-3 w-3 text-cyan-400" />
              {selectedDataset?.name || "Active Dataset"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Layers className="h-3 w-3 text-indigo-400" />
              {activeNotebook.cells.length} Cells
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-0.5" />
              Kernel Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 text-xs">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
              activeTab === "chat"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
            Copilot Chat
          </button>
          <button
            onClick={() => setActiveTab("cell_work")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
              activeTab === "cell_work"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Cell Actions
          </button>
          <button
            onClick={() => setActiveTab("error_doctor")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors relative ${
              activeTab === "error_doctor"
                ? "border-rose-500 text-rose-300 bg-rose-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="h-3.5 w-3.5 text-rose-400" />
            Error Fix
            {failingCells.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                {failingCells.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2.5 px-3 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            title="Copilot API & Key Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: COPILOT CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-xs shadow-lg shadow-indigo-950/40"
                          : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-xs shadow-md"
                      }`}
                    >
                      <div className="markdown-body text-slate-200">
                        <Markdown>{msg.text}</Markdown>
                      </div>

                      {/* Code Snippet Box */}
                      {msg.codeSnippet && (
                        <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-slate-200 shadow-inner">
                          <div className="px-3 py-1.5 bg-slate-900/90 text-[10px] font-mono text-slate-400 flex items-center justify-between border-b border-slate-800">
                            <span className="font-semibold text-indigo-400 flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              {msg.snippetType?.toUpperCase() || 'PYTHON'} CODE
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  onAddCell(msg.snippetType || "python", msg.codeSnippet);
                                  toast.success("Injected code into new notebook cell!");
                                }}
                                className="hover:text-indigo-300 text-slate-300 flex items-center gap-1 text-[10px] font-medium bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30"
                              >
                                <Plus className="h-3 w-3 text-indigo-400" /> Insert Cell
                              </button>
                              <button
                                onClick={() => {
                                  if (targetCell) {
                                    onUpdateCellCode(targetCell.id, msg.codeSnippet || "", msg.snippetType || "python");
                                    toast.success(`Replaced Cell #${activeNotebook.cells.findIndex(c => c.id === targetCell.id) + 1} code!`);
                                  }
                                }}
                                className="hover:text-emerald-300 text-slate-400 flex items-center gap-1 text-[10px]"
                                title="Replace selected target cell code"
                              >
                                <Wand2 className="h-3 w-3" /> Replace Cell
                              </button>
                              <button
                                onClick={() => copyToClipboard(msg.codeSnippet || "", "Copied code snippet to clipboard!")}
                                className="hover:text-white text-slate-400"
                                title="Copy code snippet"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <pre className="p-3 text-[11px] font-mono overflow-x-auto text-emerald-300 leading-normal bg-slate-950/80">
                            {msg.codeSnippet}
                          </pre>
                        </div>
                      )}

                      {/* Suggested Action Chips */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {msg.suggestedActions.map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChat(act)}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 transition-all flex items-center gap-1 font-medium"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                              {act}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-[9px] text-slate-500 flex items-center justify-between border-t border-slate-800/50 pt-1">
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          {msg.sender === "copilot" && (
                            <button
                              onClick={() => copyToClipboard(msg.text, "Copied AI Response to clipboard!")}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-all"
                              title="Copy AI Response"
                            >
                              <Copy className="h-2.5 w-2.5" /> Copy Response
                            </button>
                          )}
                        </div>
                        {msg.modelUsed && <span className="font-mono">Model: {msg.modelUsed}</span>}
                      </div>
                    </div>
                  </div>
                ))}

                {loadingAi && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-slate-900/80 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 animate-pulse shadow-md">
                    <Bot className="h-4 w-4 text-indigo-400 animate-spin" />
                    Copilot generating intelligence using {preferredModel}...
                  </div>
                )}
              </div>

              {/* Quick Action Chips Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <button
                    onClick={() => handleSendChat("Summarize dataset columns, types, and missing values")}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 flex items-center gap-1"
                  >
                    <BarChart2 className="h-3 w-3 text-cyan-400" />
                    Dataset EDA
                  </button>
                  <button
                    onClick={() => handleSendChat("Write Python code to find outliers and drop null rows")}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3 text-emerald-400" />
                    Clean Data
                  </button>
                  <button
                    onClick={() => handleSendChat("Generate Seaborn correlation matrix heatmap plot")}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    Plot Heatmap
                  </button>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                    placeholder="Ask Copilot to analyze data, write Python/SQL, or explain cells..."
                    className="bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 rounded-xl"
                  />
                  <Button
                    onClick={() => handleSendChat()}
                    disabled={loadingAi || !inputPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 rounded-xl shadow-md"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CELL WORK ASSISTANT */}
          {activeTab === "cell_work" && (
            <div className="space-y-4 text-xs">
              {/* Target Cell Selector Header */}
              <Card className="bg-slate-900/90 border-slate-800 text-slate-100 overflow-hidden">
                <CardHeader className="p-3.5 pb-2 bg-slate-900/50 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      Target Cell Assistant
                    </CardTitle>
                    <button
                      onClick={() => setShowCodePreview(!showCodePreview)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showCodePreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showCodePreview ? "Hide Preview" : "Show Preview"}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Active Target Notebook Cell:
                    </label>
                    <select
                      value={targetCellId}
                      onChange={(e) => setTargetCellId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      {activeNotebook.cells.map((c, i) => (
                        <option key={c.id} value={c.id}>
                          Cell #{i + 1} [{c.type.toUpperCase()}] - {c.code.slice(0, 40) || "(Empty Cell)"}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Cell Code Preview Box */}
                  {showCodePreview && targetCell && (
                    <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-slate-200">
                      <div className="px-3 py-1.5 bg-slate-900/80 text-[10px] font-mono text-slate-400 flex items-center justify-between border-b border-slate-800">
                        <span>CURRENT CODE PREVIEW</span>
                        <span className="text-indigo-400 font-bold">{targetCell.type.toUpperCase()}</span>
                      </div>
                      <pre className="p-3 text-[11px] font-mono overflow-x-auto text-slate-300 max-h-36 leading-normal">
                        {targetCell.code || "# Empty cell. Enter prompt below to generate code."}
                      </pre>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Custom Instruction / Prompt:
                    </label>
                    <Input
                      value={cellPrompt}
                      onChange={(e) => setCellPrompt(e.target.value)}
                      placeholder="e.g. Calculate 3-month moving average and plot trendline"
                      className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
                    />
                  </div>

                  {/* Preset Action Grid */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick AI Transformations:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCellWork("generate_cell")}
                        disabled={cellWorkLoading || !cellPrompt.trim()}
                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] justify-start rounded-xl h-9"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400 shrink-0" />
                        Generate Code
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleCellWork("refactor_cell", "Refactor code for performance, vectorization, and best practices")}
                        disabled={cellWorkLoading || !targetCellId}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] justify-start rounded-xl h-9"
                      >
                        <Code className="h-3.5 w-3.5 mr-1.5 text-emerald-400 shrink-0" />
                        Refactor & Speedup
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleCellWork("comment_code", "Add detailed line-by-line comments explaining data science steps")}
                        disabled={cellWorkLoading || !targetCellId}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] justify-start rounded-xl h-9"
                      >
                        <FileCode className="h-3.5 w-3.5 mr-1.5 text-amber-400 shrink-0" />
                        Add Docstrings
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleCellWork("explain_cell")}
                        disabled={cellWorkLoading || !targetCellId}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] justify-start rounded-xl h-9"
                      >
                        <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-cyan-400 shrink-0" />
                        Explain Logic
                      </Button>
                    </div>
                  </div>

                  {/* Run Target Cell Button */}
                  {targetCellId && (
                    <Button
                      size="sm"
                      onClick={() => onExecuteCell(targetCellId)}
                      className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs mt-2 rounded-xl py-2"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      Execute Cell #{activeNotebook.cells.findIndex(c => c.id === targetCellId) + 1}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Cell Explanation Result Panel */}
              {cellExplanation && (
                <Card className="bg-slate-900/95 border-indigo-500/40 text-slate-200 rounded-2xl shadow-lg">
                  <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between border-b border-slate-800">
                    <CardTitle className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      AI Code Insights & Explanation
                    </CardTitle>
                    <button
                      onClick={() => setCellExplanation("")}
                      className="text-slate-400 hover:text-white text-xs font-medium"
                    >
                      Dismiss
                    </button>
                  </CardHeader>
                  <CardContent className="p-3.5 text-xs leading-relaxed markdown-body">
                    <Markdown>{cellExplanation}</Markdown>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB 3: ERROR DOCTOR & AUTO-FIX */}
          {activeTab === "error_doctor" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-md">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    Notebook Error Doctor
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {failingCells.length === 0
                      ? "All cells executed cleanly without errors!"
                      : `Detected ${failingCells.length} crashing cell execution exception(s).`}
                  </p>
                </div>

                {failingCells.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleFixAllErrors}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs shadow-lg shadow-rose-950/40 rounded-xl"
                  >
                    <Wrench className="h-3.5 w-3.5 mr-1.5" />
                    Repair All Errors
                  </Button>
                )}
              </div>

              {/* Failing Cells List */}
              {failingCells.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <h5 className="font-semibold text-white">Notebook Kernel Healthy</h5>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto">
                    No exceptions or tracebacks detected in any cells. You can run cells freely or use Copilot for code optimization.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {failingCells.map((cell) => {
                    const cellIndex = activeNotebook.cells.findIndex(c => c.id === cell.id) + 1;
                    const err = cell.output?.error;
                    const analysis = errorAnalysis[cell.id];
                    const isApplied = appliedPatches[cell.id];
                    const isRepairedVisible = showRepairedCode[cell.id];

                    return (
                      <Card key={cell.id} className="bg-slate-900/95 border-rose-500/40 text-slate-200 overflow-hidden rounded-2xl shadow-lg">
                        <CardHeader className="p-3 bg-rose-950/30 border-b border-rose-500/20 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                              Cell #{cellIndex}
                            </span>
                            <span className="font-mono text-xs text-rose-400 font-bold">
                              {err?.error_class || "Execution Exception"}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleAutoFixError(cell.id)}
                            disabled={fixingCellId === cell.id}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] h-7 px-3 rounded-lg font-bold shadow-md"
                          >
                            {fixingCellId === cell.id ? (
                              <Bot className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Wrench className="h-3.5 w-3.5 mr-1" />
                            )}
                            1-Click Auto-Fix
                          </Button>
                        </CardHeader>

                        <CardContent className="p-3.5 space-y-3">
                          {/* Crashing Message Box */}
                          <div>
                            <div className="text-[10px] text-slate-400 font-mono mb-1 flex items-center justify-between">
                              <span>CRASHING EXCEPTION:</span>
                              {err?.line_number && <span>Line {err.line_number}</span>}
                            </div>
                            <pre className="p-2.5 bg-slate-950 rounded-xl border border-rose-900/40 text-[11px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap leading-normal">
                              {err?.message || "Unknown execution error."}
                            </pre>
                          </div>

                          {/* Kernel Suggestion */}
                          {err?.suggested_fix && (
                            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <strong>Kernel Suggestion:</strong> {err.suggested_fix}
                              </div>
                            </div>
                          )}

                          {/* AI Diagnosis Breakdown & Repaired Code Patch */}
                          {analysis && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-slate-200 text-[11px] space-y-2.5">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4" />
                                  AI Diagnosis & Repair Patch
                                </div>
                                {isApplied && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                    Patch Applied ✓
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-300 leading-relaxed">{analysis.root_cause}</p>

                              {analysis.suggested_fix_summary && (
                                <p className="text-slate-400 italic">Summary: {analysis.suggested_fix_summary}</p>
                              )}

                              {/* Repaired Code Box */}
                              {analysis.repaired_code && (
                                <div className="mt-2 space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span>REPAIRED CODE PATCH:</span>
                                    <button
                                      onClick={() => setShowRepairedCode(prev => ({ ...prev, [cell.id]: !prev[cell.id] }))}
                                      className="text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                      {isRepairedVisible ? "Hide Code" : "View Code"}
                                    </button>
                                  </div>

                                  {isRepairedVisible && (
                                    <pre className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-normal">
                                      {analysis.repaired_code}
                                    </pre>
                                  )}

                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApplyPatch(cell.id, analysis.repaired_code, analysis.target_type)}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl h-8"
                                    >
                                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                      Apply & Re-Run Cell
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        copyToClipboard(analysis.repaired_code, "Copied repaired code to clipboard!");
                                      }}
                                      className="border-slate-800 text-slate-300 hover:bg-slate-800 text-[11px] rounded-xl h-8 px-2.5"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COPILOT SETTINGS & API KEYS */}
          {activeTab === "settings" && (
            <div className="space-y-4 text-xs">
              <Card className="bg-slate-900/90 border-slate-800 text-slate-100 rounded-2xl shadow-lg">
                <CardHeader className="p-3.5 pb-2 border-b border-slate-800">
                  <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                    <Key className="h-4 w-4 text-indigo-400" />
                    AI Provider & API Key Settings
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-400">
                    Switch between default enterprise server Gemini key or your own custom Gemini API Key.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3.5 space-y-4">
                  {/* API Key Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-slate-300 block">
                      API Key Engine Provider:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setUseCustomKey(false)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          !useCustomKey
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-950/50"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                          Enterprise Key
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                          Built-in server key with automatic multi-model fallback chain.
                        </span>
                      </button>

                      <button
                        onClick={() => setUseCustomKey(true)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          useCustomKey
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-950/50"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-amber-400" />
                          Custom Key
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                          Supply your own Google AI Studio Gemini API Key.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Custom API Key Input field */}
                  {useCustomKey && (
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
                      <label className="text-[11px] font-medium text-amber-300 block">
                        Your Custom Gemini API Key:
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={customApiKey}
                          onChange={(e) => setCustomApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="bg-slate-900 border-slate-800 text-xs font-mono text-white placeholder:text-slate-600 rounded-xl"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="border-slate-800 text-slate-300 text-xs px-3 rounded-xl"
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Key is stored in your browser's private local storage.
                      </p>
                    </div>
                  )}

                  {/* Preferred Model */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Preferred Primary Candidate Model:
                    </label>
                    <select
                      value={preferredModel}
                      onChange={(e) => setPreferredModel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast & Lightweight)</option>
                      <option value="gemini-flash-latest font-bold">gemini-flash-latest (High Quota Standard)</option>
                      <option value="gemini-3.6-flash">gemini-3.6-flash (Advanced Reasoning)</option>
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Science Pro)</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveSettings}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-bold py-2 shadow-md"
                    >
                      Save Configuration
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleTestApiKey}
                      disabled={testingKey}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs rounded-xl px-3"
                    >
                      {testingKey ? <Bot className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1 text-amber-400" />}
                      Test Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  </AnimatePresence>,
  document.body
);
}

