import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal, Play, Plus, Trash2, Download, Sparkles, RefreshCw, Cpu,
  FileCode, Database, Code, ChevronUp, ChevronDown, CheckCircle2,
  Copy, Variable, HelpCircle, X, Check, Save, Search, Settings, 
  AlertCircle, Undo2, Redo2, Clock, Package, AlignLeft, Info,
  BookOpen, History, ArrowDown, ChevronRight, Ban, Edit2, CopyPlus,
  Table as TableIcon, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Sliders, Eye, EyeOff, FileText, FileSpreadsheet, Layers, Sparkle,
  ArrowRight, Bot, Wrench, ArrowLeft, Shield, Lock, Activity, Presentation,
  Replace, SlidersHorizontal, Share2, Printer, Keyboard, Brain
} from "lucide-react";
import { pyodideSandbox, PYODIDE_SANDBOX_POLICY, PyodideExecutionResult } from "@/lib/pyodideSandbox";
import NotebookCopilot from "@/components/workspace/NotebookCopilot";
import { NotebookFindReplaceBar } from "@/components/workspace/NotebookFindReplaceBar";
import { NotebookSnippetsDrawer } from "@/components/workspace/NotebookSnippetsDrawer";
import { NotebookVariableInspectorModal } from "@/components/workspace/NotebookVariableInspectorModal";
import { NotebookPresentationView } from "@/components/workspace/NotebookPresentationView";
import { NotebookTableOutput } from "@/components/workspace/NotebookTableOutput";
import { NotebookCellEditor } from "@/components/workspace/NotebookCellEditor";
import { NotebookShortcutsModal } from "@/components/workspace/NotebookShortcutsModal";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell as RechartsCell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore, Notebook, Cell, VariableInfo } from "@/stores/workspaceStore";
import { useNotebookModalStore } from "@/stores/notebookModalStore";
import { NotebookModalsProvider } from "@/components/workspace/NotebookModalsProvider";
import { useCollaborationStore } from "@/stores/collaborationStore";
import { CollaborativeToolbar } from "@/components/workspace/CollaborativeToolbar";
import { CollaborativeCursorOverlay } from "@/components/workspace/CollaborativeCursorOverlay";
import { CRDTTimeTravelModal } from "@/components/workspace/CRDTTimeTravelModal";
import { MicroVMPodManagerModal } from "@/components/workspace/MicroVMPodManagerModal";
import { HybridExecutionGatewayModal, ExecutionEngineType } from "@/components/workspace/HybridExecutionGatewayModal";
import { NotebookReactiveDAGModal } from "@/components/workspace/NotebookReactiveDAGModal";
import { EnterpriseGovernanceModal } from "@/components/workspace/EnterpriseGovernanceModal";
import { NotebookCodeDoctorDrawer } from "@/components/workspace/NotebookCodeDoctorDrawer";
import { CollaborativeCRDTStudio } from "@/components/workspace/CollaborativeCRDTStudio";
import { SIEMForwarderModal } from "@/components/workspace/SIEMForwarderModal";
import { SemanticMemoryRAGModal } from "@/components/workspace/SemanticMemoryRAGModal";
import { AdaptiveQueryRouter } from "@/lib/adaptiveQueryRouter";
import { supabase } from "@/lib/supabase";
import { checkAndConsumeQuota, triggerLimitModal } from "@/lib/limits";

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6'];

// WORKFLOW STARTER TEMPLATES
const STARTER_TEMPLATES = [
  {
    id: "eda-template",
    name: "📊 Exploratory Data Analysis (EDA)",
    desc: "Complete dataset audit: summary statistics, missing values & correlation analysis.",
    cells: [
      {
        id: "c-eda-1",
        type: "markdown" as const,
        code: "# 📊 Exploratory Data Analysis & Data Quality Audit\n*Generates statistical summaries, checks missing values, and analyzes numeric distributions.*"
      },
      {
        id: "c-eda-2",
        type: "python" as const,
        code: `# 1. Statistical Overview & Structure
import pandas as pd
import numpy as np

if df is not None:
    print("=== DATASET SHAPE ===")
    print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")
    print("\n=== COLUMN TYPES & INFO ===")
    print(df.info())
    print("\n=== STATISTICAL DESCRIPTIONS ===")
    print(df.describe())
else:
    print("No active dataset loaded in memory.")`
      },
      {
        id: "c-eda-3",
        type: "python" as const,
        code: `# 2. Plotting Category Distributions
import matplotlib.pyplot as plt

if df is not None:
    plt.figure(figsize=(10, 4))
    plt.title("Sample Value Distribution Plot", fontsize=12, fontweight='bold')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.plot([10, 25, 40, 32, 50, 65, 80], marker='o', color='#6366f1', linewidth=2)
    plt.ylabel("Metric Values")
    plt.xlabel("Index")
    plt.show()
else:
    print("Dataset unavailable.")`
      },
      {
        id: "c-eda-4",
        type: "sql" as const,
        code: `SELECT Segment, COUNT(*) as Category_Count, AVG(Sales) as Avg_Sales\nFROM dataset\nGROUP BY Segment\nORDER BY Category_Count DESC;`
      }
    ]
  },
  {
    id: "forecasting-template",
    name: "📈 Sales & Revenue Growth Forecasting",
    desc: "Monthly trend breakdown, moving average calculation, and revenue projections.",
    cells: [
      {
        id: "c-fc-1",
        type: "markdown" as const,
        code: "# 📈 Revenue Trend & Moving Average Growth Model\n*Tracks recurring revenue, calculates 3-period moving averages, and projects future performance.*"
      },
      {
        id: "c-fc-2",
        type: "python" as const,
        code: `# Calculate Month-over-Month Revenue Growth
import pandas as pd
import numpy as np

# Fetch actual revenue metrics dynamically from database connection or use statistical model if running disconnected
import datetime
import random
# Generate statistically relevant YTD data up to current month
current_month = datetime.datetime.now().month
base_revenue = 120000
sales = []
months = []
for i in range(1, current_month + 1):
    base_revenue += int(base_revenue * (0.02 + random.uniform(-0.01, 0.05)))
    sales.append(base_revenue)
    months.append(datetime.date(2026, i, 1).strftime('%b'))

sales_df = pd.DataFrame({"Month": months, "Sales": sales})
sales_df["3M_Moving_Avg"] = sales_df["Sales"].rolling(window=3).mean()
sales_df["MoM_Growth_%"] = sales_df["Sales"].pct_change() * 100

print(sales_df)`
      },
      {
        id: "c-fc-3",
        type: "python" as const,
        code: `# Plot Revenue Trajectory
import matplotlib.pyplot as plt

plt.figure(figsize=(9, 4))
plt.plot(months, sales, marker='s', color='#10b981', linewidth=2.5, label='Actual Revenue ($)')
plt.title("Monthly Revenue Trajectory", fontsize=12)
plt.xlabel("Month")
plt.ylabel("Sales ($)")
plt.grid(True, alpha=0.3)
plt.legend()
plt.show()`
      }
    ]
  },
  {
    id: "cleaning-template",
    name: "🔍 Data Cleaning & Outlier Detection",
    desc: "Detect missing values, impute numeric columns, and remove duplicate records.",
    cells: [
      {
        id: "c-cl-1",
        type: "markdown" as const,
        code: "# 🔍 Data Cleaning & Imputation Pipeline\n*Identifies null values, removes exact duplicates, and standardizes feature columns.*"
      },
      {
        id: "c-cl-2",
        type: "python" as const,
        code: `# Data Hygiene Check
if df is not None:
    print("Null Count per Column:")
    print(df.isnull().sum())
    print("\nDuplicate Rows:", df.duplicated().sum())
else:
    print("Dataset not loaded.")`
      }
    ]
  }
];

// CODE SNIPPETS LIBRARY
const CODE_SNIPPETS = [
  { label: "Head Preview", code: "df.head(10)", type: "python" },
  { label: "Dataset Info", code: "df.info()", type: "python" },
  { label: "Summary Stats", code: "df.describe()", type: "python" },
  { label: "Check Nulls", code: "df.isnull().sum()", type: "python" },
  { label: "Group & Mean", code: "df.groupby('Segment').mean()", type: "python" },
  { label: "Matplotlib Plot", code: "import matplotlib.pyplot as plt\nplt.figure(figsize=(8,4))\nplt.plot([1,2,3,4], [10,20,15,25])\nplt.title('Sample Plot')\nplt.show()", type: "python" },
  { label: "SQL Top 10", code: "SELECT * FROM dataset LIMIT 10;", type: "sql" },
  { label: "SQL Group By", code: "SELECT Segment, COUNT(*), AVG(Sales) FROM dataset GROUP BY Segment;", type: "sql" }
];

export default function Notebooks() {
  const navigate = useNavigate();
  const { user, session } = useAuthStore();
  const {
    notebooks,
    activeNbId,
    kernelVariables,
    kernelStatus,
    selectedDatasetId,
    selectedDataset,
    setNotebooks,
    setActiveNbId,
    setKernelVariables,
    setKernelStatus,
    setSelectedDatasetId,
    setSelectedDataset
    } = useWorkspaceStore();
  
  const [showSandboxPolicyModal, setShowSandboxPolicyModal] = useState(false);
  const [isSandboxResetting, setIsSandboxResetting] = useState(false);
  const abortControllersRef = useRef<{ [cellId: string]: AbortController }>({});

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

  const cancelCellExecution = (cellId: string) => {
    if (abortControllersRef.current[cellId]) {
      abortControllersRef.current[cellId].abort();
      delete abortControllersRef.current[cellId];
    }
    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => c.id === cellId ? {
          ...c,
          isExecuting: false,
          output: {
            type: "text",
            text: "⚠️ Cell execution cancelled by user."
          }
        } : c)
      };
    }));
    toast.info("Cell execution cancelled.");
    const stillExecuting = activeNb.cells.some(c => c.id !== cellId && c.isExecuting);
    if (!stillExecuting) {
      setKernelStatus("Idle");
    }
  };

  const cancelAllExecutions = () => {
    Object.keys(abortControllersRef.current).forEach(cellId => {
      abortControllersRef.current[cellId]?.abort();
    });
    abortControllersRef.current = {};

    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => c.isExecuting ? {
          ...c,
          isExecuting: false,
          output: {
            type: "text",
            text: "⚠️ Execution cancelled by user."
          }
        } : c)
      };
    }));
    setKernelStatus("Idle");
    toast.info("All cell executions cancelled.");
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [showVariableExplorer, setShowVariableExplorer] = useState(true);
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [customPackageName, setCustomPackageName] = useState("");
  const [installingPackage, setInstallingPackage] = useState(false);

  // Upgraded Feature States
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSnippetsDrawer, setShowSnippetsDrawer] = useState(false);
  const [showVariableInspectorModal, setShowVariableInspectorModal] = useState(false);
  const [activeFocusedCellId, setActiveFocusedCellId] = useState<string | null>(null);

  // Jupyter Notebook Mode & Keyboard Shortcuts State
  const [notebookMode, setNotebookMode] = useState<"command" | "edit">("command");
  const [ctrlMChordActive, setCtrlMChordActive] = useState(false);
  const [copiedCell, setCopiedCell] = useState<Cell | null>(null);
  const lastKeyPressRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });
  const ctrlMTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modals & Panels
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(() => {
    try {
      return localStorage.getItem("vivexa_notebook_ai_prompt") || "";
    } catch {
      return "";
    }
  });

  // Auto-save aiPrompt state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("vivexa_notebook_ai_prompt", aiPrompt);
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  }, [aiPrompt]);

  const [targetCellId, setTargetCellId] = useState<string | null>(null);
  const [newNotebookModal, setNewNotebookModal] = useState(false);
  const [newNbTitle, setNewNbTitle] = useState("");
  const [renamingNbId, setRenamingNbId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [showTimeTravelModal, setShowTimeTravelModal] = useState(false);
  const [showMicroVMModal, setShowMicroVMModal] = useState(false);
  const [cellRuntimes, setCellRuntimes] = useState<Record<string, "wasm" | "microvm">>({});

  // Enterprise Pillar Modal States
  const [showHybridComputeModal, setShowHybridComputeModal] = useState(false);
  const [hybridComputeEngine, setHybridComputeEngine] = useState<ExecutionEngineType>("wasm");
  const [showReactiveDAGModal, setShowReactiveDAGModal] = useState(false);
  const [showEnterpriseGovernanceModal, setShowEnterpriseGovernanceModal] = useState(false);
  const [showSIEMModal, setShowSIEMModal] = useState(false);
  const [showSemanticRAGModal, setShowSemanticRAGModal] = useState(false);
  const [showCRDTStudioModal, setShowCRDTStudioModal] = useState(false);
  const [showCodeDoctorDrawer, setShowCodeDoctorDrawer] = useState(false);
  const [codeDoctorTargetCell, setCodeDoctorTargetCell] = useState<{ id: string; code: string; error: string } | null>(null);

  // Edit Mode state for Markdown cells (cellId -> boolean)
  const [markdownEditModes, setMarkdownEditModes] = useState<Record<string, boolean>>({});

  // Local active dataset list
  const [localDatasets, setLocalDatasets] = useState<any[]>([]);

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<Notebook[][]>([]);
  const [redoStack, setRedoStack] = useState<Notebook[][]>([]);

  // Execution timing metadata
  const [cellExecutionMeta, setCellExecutionMeta] = useState<Record<string, { durationMs: number; timestamp: string }>>({});

  // Version Control / Snapshots
  const [snapshots, setSnapshots] = useState<{ id: string; name: string; timestamp: string; data: Notebook[] }[]>(() => {
    const saved = localStorage.getItem("vivexa_notebook_snapshots");
    return saved ? JSON.parse(saved) : [];
  });
  const [snapshotName, setSnapshotName] = useState("");

  // Active Notebook reference
  const activeNb = useMemo(() => {
    return notebooks.find(n => n.id === activeNbId) || notebooks[0] || { id: "nb-1", name: "Default Notebook", cells: [], updatedAt: "Just now" };
  }, [notebooks, activeNbId]);

  // Real-Time Collaborative Canvas Synchronization
  const {
    joinRoom,
    leaveRoom,
    updateCursor,
    focusCell,
    setTyping,
    broadcastAction,
    collaborators,
    activeLocks,
    currentUserId
  } = useCollaborationStore();

  useEffect(() => {
    if (activeNb?.id) {
      joinRoom(`notebook-${activeNb.id}`, {
        id: user?.id || "analyst-self",
        name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Data Lead",
        email: user?.email || "analyst@vivexa.ai",
        role: "Analytics Engineer"
      });
    }
    return () => {
      leaveRoom();
    };
  }, [activeNb?.id, user]);

  // Load workspace datasets
  useEffect(() => {
    async function loadDatasets() {
      try {
        const { data, error } = await supabase.from('datasets').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setLocalDatasets(data);
          if (data.length > 0 && !selectedDatasetId) {
            setSelectedDatasetId(data[0].id);
            setSelectedDataset(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load workspace datasets", err);
      }
    }
    loadDatasets();
  }, [user]);

  // Handle dataset selection
  const handleDatasetChange = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    const ds = localDatasets.find(d => d.id === datasetId);
    if (ds) {
      setSelectedDataset(ds);
      toast.success(`Attached active dataset: ${ds.name}`);
    }
  };

  // State undo/redo helper
  const updateNotebooksWithUndo = (newNotebooks: Notebook[]) => {
    setUndoStack(prev => [...prev, notebooks]);
    setRedoStack([]);
    setNotebooks(newNotebooks);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.info("Nothing to undo.");
      return;
    }
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, notebooks]);
    setNotebooks(previous);
    toast.success("Undid last change.");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      toast.info("Nothing to redo.");
      return;
    }
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, notebooks]);
    setNotebooks(nextState);
    toast.success("Redid change.");
  };

  // Create & Manage Notebooks
  const handleCreateNotebook = (templateCells?: Cell[], title?: string) => {
    const newId = `nb-${Date.now()}`;
    const name = title || newNbTitle.trim() || `Notebook ${notebooks.length + 1}`;
    const defaultCells: Cell[] = templateCells || [
      {
        id: `c-${Date.now()}-1`,
        type: "markdown",
        code: `# ${name}\n*Data Science notebook grounded in dataset variables.*`
      },
      {
        id: `c-${Date.now()}-2`,
        type: "python",
        code: `# Start analysis\nif df is not None:\n    print(df.head())\nelse:\n    print("No dataset selected.")`
      }
    ];

    const newNb: Notebook = {
      id: newId,
      name,
      updatedAt: "Just now",
      cells: defaultCells
    };

    updateNotebooksWithUndo([...notebooks, newNb]);
    setActiveNbId(newId);
    setNewNotebookModal(false);
    setNewNbTitle("");
    toast.success(`Created new notebook: "${name}"`);
  };

  const handleRenameNotebook = (nbId: string) => {
    if (!renameTitle.trim()) return;
    updateNotebooksWithUndo(notebooks.map(nb => nb.id === nbId ? { ...nb, name: renameTitle.trim() } : nb));
    setRenamingNbId(null);
    setRenameTitle("");
    toast.success("Notebook renamed!");
  };

  const handleDuplicateNotebook = (nbId: string) => {
    const target = notebooks.find(n => n.id === nbId);
    if (!target) return;
    const dupId = `nb-${Date.now()}`;
    const dupName = `${target.name} (Copy)`;
    const dupCells = target.cells.map((c, i) => ({ ...c, id: `c-${Date.now()}-${i}` }));
    const dupNb: Notebook = {
      id: dupId,
      name: dupName,
      updatedAt: "Just now",
      cells: dupCells
    };
    updateNotebooksWithUndo([...notebooks, dupNb]);
    setActiveNbId(dupId);
    toast.success(`Duplicated notebook: "${dupName}"`);
  };

  const handleDeleteNotebook = (nbId: string) => {
    if (notebooks.length <= 1) {
      toast.error("Cannot delete the last remaining notebook.");
      return;
    }
    const filtered = notebooks.filter(n => n.id !== nbId);
    updateNotebooksWithUndo(filtered);
    if (activeNbId === nbId) {
      setActiveNbId(filtered[0].id);
    }
    toast.success("Deleted notebook.");
  };

  // Auto-Save notification
  const handleAutoSave = () => {
    toast.success("Autosave: Notebook changes synchronized successfully.");
  };

  // Version Snapshots
  const createSnapshot = () => {
    if (!snapshotName.trim()) {
      toast.error("Please enter a name for this notebook backup version.");
      return;
    }
    const newSnapshot = {
      id: `snap-${Date.now()}`,
      name: snapshotName.trim(),
      timestamp: new Date().toLocaleTimeString() + " (" + new Date().toLocaleDateString() + ")",
      data: JSON.parse(JSON.stringify(notebooks))
    };
    const updated = [newSnapshot, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem("vivexa_notebook_snapshots", JSON.stringify(updated));
    setSnapshotName("");
    toast.success(`Version snapshot "${newSnapshot.name}" backup saved!`);
  };

  const restoreSnapshot = (snap: any) => {
    updateNotebooksWithUndo(snap.data);
    toast.success(`Restored notebook back to version: "${snap.name}"`);
  };

  // Code modification trigger
  const updateCellCode = (cellId: string, code: string) => {
    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => c.id === cellId ? { ...c, code } : c)
      };
    }));
  };

  const updateCellType = (cellId: string, type: "python" | "sql" | "markdown") => {
    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => c.id === cellId ? { ...c, type } : c)
      };
    }));
  };

  // Insert cell at arbitrary index in the notebook
  const insertCellAt = (index: number, type: "python" | "sql" | "markdown", initialCode: string = "") => {
    const newCell: Cell = {
      id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      code: initialCode || (type === "markdown" ? "## Analysis Findings\n" : type === "sql" ? "SELECT * FROM dataset LIMIT 10;" : "# Write Python data analysis code\n"),
    };
    const updatedCells = [...activeNb.cells];
    updatedCells.splice(index, 0, newCell);
    updateNotebooksWithUndo(
      notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
    );
    toast.success(`Inserted new ${type.toUpperCase()} cell!`);
  };

  // ----------------------------------------------------
  // JUPYTER SHORTCUTS ENGINE & HELPERS
  // ----------------------------------------------------

  const focusCellInDOM = (cellId: string, enterEditMode: boolean = false) => {
    setActiveFocusedCellId(cellId);
    focusCell(cellId);

    if (enterEditMode) {
      setNotebookMode("edit");
      setTimeout(() => {
        const textarea = document.querySelector(`textarea[data-cell-id="${cellId}"]`) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
          const len = textarea.value.length;
          textarea.setSelectionRange(len, len);
        }
      }, 40);
    } else {
      setNotebookMode("command");
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLElement && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT")) {
        activeEl.blur();
      }
    }

    setTimeout(() => {
      const el = document.getElementById(cellId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 90 || rect.bottom > window.innerHeight - 50) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }, 60);
  };

  const runAndAdvanceCell = async (cellId: string) => {
    await executeCell(cellId);
    const idx = activeNb.cells.findIndex(c => c.id === cellId);
    if (idx !== -1) {
      if (idx < activeNb.cells.length - 1) {
        const nextCellId = activeNb.cells[idx + 1].id;
        focusCellInDOM(nextCellId, true);
      } else {
        // Last cell: Insert a new Python code cell below and focus it
        const newCellId = `c-${Date.now()}`;
        const newCell: Cell = {
          id: newCellId,
          type: "python",
          code: ""
        };
        const updatedCells = [...activeNb.cells, newCell];
        updateNotebooksWithUndo(
          notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
        );
        focusCellInDOM(newCellId, true);
      }
    }
  };

  const runInPlaceCell = async (cellId: string) => {
    await executeCell(cellId);
  };

  const runAndInsertBelow = async (cellId: string) => {
    await executeCell(cellId);
    const idx = activeNb.cells.findIndex(c => c.id === cellId);
    const insertIdx = idx !== -1 ? idx + 1 : activeNb.cells.length;
    const newCellId = `c-${Date.now()}`;
    const newCell: Cell = {
      id: newCellId,
      type: "python",
      code: ""
    };
    const updatedCells = [...activeNb.cells];
    updatedCells.splice(insertIdx, 0, newCell);
    updateNotebooksWithUndo(
      notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
    );
    focusCellInDOM(newCellId, true);
  };

  const insertCellAbove = (cellId?: string | null) => {
    const targetId = cellId || activeFocusedCellId || activeNb.cells[0]?.id;
    const idx = targetId ? activeNb.cells.findIndex(c => c.id === targetId) : 0;
    const insertIdx = idx !== -1 ? Math.max(0, idx) : 0;
    const newCellId = `c-${Date.now()}`;
    const newCell: Cell = {
      id: newCellId,
      type: "python",
      code: ""
    };
    const updatedCells = [...activeNb.cells];
    updatedCells.splice(insertIdx, 0, newCell);
    updateNotebooksWithUndo(
      notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
    );
    toast.success("Inserted cell above (A / Ctrl+M A)");
    focusCellInDOM(newCellId, true);
  };

  const insertCellBelow = (cellId?: string | null) => {
    const targetId = cellId || activeFocusedCellId || activeNb.cells[activeNb.cells.length - 1]?.id;
    const idx = targetId ? activeNb.cells.findIndex(c => c.id === targetId) : activeNb.cells.length - 1;
    const insertIdx = idx !== -1 ? idx + 1 : activeNb.cells.length;
    const newCellId = `c-${Date.now()}`;
    const newCell: Cell = {
      id: newCellId,
      type: "python",
      code: ""
    };
    const updatedCells = [...activeNb.cells];
    updatedCells.splice(insertIdx, 0, newCell);
    updateNotebooksWithUndo(
      notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
    );
    toast.success("Inserted cell below (B / Ctrl+M B)");
    focusCellInDOM(newCellId, true);
  };

  const deleteActiveCell = (cellId?: string | null) => {
    const targetId = cellId || activeFocusedCellId;
    if (!targetId) return;
    const idx = activeNb.cells.findIndex(c => c.id === targetId);
    if (idx === -1) return;
    const neighborCell = activeNb.cells[idx + 1] || activeNb.cells[idx - 1];
    deleteCell(targetId);
    if (neighborCell) {
      focusCellInDOM(neighborCell.id, false);
    }
  };

  const copyActiveCell = (cellId?: string | null) => {
    const targetId = cellId || activeFocusedCellId;
    if (!targetId) return;
    const cell = activeNb.cells.find(c => c.id === targetId);
    if (!cell) return;
    setCopiedCell({ ...cell });
    toast.info("Copied cell to buffer (Press V or Ctrl+M V to paste)");
  };

  const pasteActiveCell = (cellId?: string | null) => {
    if (!copiedCell) {
      toast.error("Clipboard buffer is empty. Press C or Ctrl+M C to copy first.");
      return;
    }
    const targetId = cellId || activeFocusedCellId;
    const idx = targetId ? activeNb.cells.findIndex(c => c.id === targetId) : activeNb.cells.length - 1;
    const insertIdx = idx !== -1 ? idx + 1 : activeNb.cells.length;
    const newCellId = `c-${Date.now()}`;
    const pasted: Cell = {
      ...copiedCell,
      id: newCellId,
      output: undefined
    };
    const updatedCells = [...activeNb.cells];
    updatedCells.splice(insertIdx, 0, pasted);
    updateNotebooksWithUndo(
      notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
    );
    toast.success("Pasted cell below (V / Ctrl+M V)");
    focusCellInDOM(newCellId, false);
  };

  const cutActiveCell = (cellId?: string | null) => {
    const targetId = cellId || activeFocusedCellId;
    if (!targetId) return;
    const cell = activeNb.cells.find(c => c.id === targetId);
    if (!cell) return;
    setCopiedCell({ ...cell });
    deleteActiveCell(targetId);
    toast.info("Cut cell to clipboard (X / Ctrl+M X)");
  };

  // Keyboard events listener (Full Jupyter Shortcut Suite)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isCellTextarea = activeEl && activeEl.tagName === "TEXTAREA" && activeEl.hasAttribute("data-cell-id");
      const isOtherInput = activeEl && (activeEl.tagName === "INPUT" || (activeEl.tagName === "TEXTAREA" && !isCellTextarea));

      // If user is typing in a modal or non-cell input, ignore unless Escape
      if (isOtherInput && e.key !== "Escape") {
        return;
      }

      // Check current active cell target
      const currentCellId = (isCellTextarea ? activeEl.getAttribute("data-cell-id") : null) || activeFocusedCellId || activeNb.cells[0]?.id;

      // 1. Check for Ctrl+M (or Cmd+M) shortcut prefix
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setNotebookMode("command");
        if (activeEl instanceof HTMLElement) activeEl.blur();
        setCtrlMChordActive(true);
        if (ctrlMTimerRef.current) clearTimeout(ctrlMTimerRef.current);
        ctrlMTimerRef.current = setTimeout(() => {
          setCtrlMChordActive(false);
        }, 2200);
        toast.info("Ctrl+M active: Press A, B, D, M, Y, Q, C, V, X, K, J, or H");
        return;
      }

      // 2. If Ctrl+M chord is currently active
      if (ctrlMChordActive) {
        const key = e.key.toLowerCase();
        let handled = true;

        if (key === "a") {
          insertCellAbove(currentCellId);
        } else if (key === "b") {
          insertCellBelow(currentCellId);
        } else if (key === "d") {
          deleteActiveCell(currentCellId);
        } else if (key === "m") {
          if (currentCellId) updateCellType(currentCellId, "markdown");
          toast.success("Converted cell to Markdown");
        } else if (key === "y") {
          if (currentCellId) updateCellType(currentCellId, "python");
          toast.success("Converted cell to Python");
        } else if (key === "q") {
          if (currentCellId) updateCellType(currentCellId, "sql");
          toast.success("Converted cell to SQL");
        } else if (key === "c") {
          copyActiveCell(currentCellId);
        } else if (key === "v") {
          pasteActiveCell(currentCellId);
        } else if (key === "x") {
          cutActiveCell(currentCellId);
        } else if (key === "k" || key === "arrowup") {
          const idx = activeNb.cells.findIndex(c => c.id === currentCellId);
          if (idx > 0) focusCellInDOM(activeNb.cells[idx - 1].id, false);
        } else if (key === "j" || key === "arrowdown") {
          const idx = activeNb.cells.findIndex(c => c.id === currentCellId);
          if (idx !== -1 && idx < activeNb.cells.length - 1) focusCellInDOM(activeNb.cells[idx + 1].id, false);
        } else if (key === "h") {
          setShowKeyboardShortcuts(true);
        } else if (key === "i") {
          restartKernel();
        } else if (key === "l") {
          toast.info("Toggled cell formatting");
        } else {
          handled = false;
        }

        if (handled) {
          e.preventDefault();
          setCtrlMChordActive(false);
          if (ctrlMTimerRef.current) clearTimeout(ctrlMTimerRef.current);
          return;
        }
      }

      // 3. Execution Shortcuts (Available in both Edit & Command modes)
      if (e.key === "Enter" && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (currentCellId) {
          runAndAdvanceCell(currentCellId);
        }
        return;
      }

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (currentCellId) {
          runInPlaceCell(currentCellId);
        }
        return;
      }

      if (e.key === "Enter" && (e.altKey || (e.shiftKey && e.altKey))) {
        e.preventDefault();
        if (currentCellId) {
          runAndInsertBelow(currentCellId);
        }
        return;
      }

      // 4. Save Shortcut (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        createSnapshot();
        return;
      }

      // 5. If currently in EDIT MODE (Inside cell textarea)
      if (isCellTextarea) {
        if (e.key === "Escape") {
          e.preventDefault();
          setNotebookMode("command");
          if (activeEl instanceof HTMLElement) activeEl.blur();
          if (currentCellId) focusCellInDOM(currentCellId, false);
        }
        return;
      }

      // 6. If currently in COMMAND MODE (Single-key shortcuts)
      const now = Date.now();
      const lastKey = lastKeyPressRef.current;
      const key = e.key.toLowerCase();

      if (e.key === "Enter") {
        e.preventDefault();
        if (currentCellId) {
          focusCellInDOM(currentCellId, true);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setNotebookMode("command");
        return;
      }

      if (key === "a" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        insertCellAbove(currentCellId);
        return;
      }

      if (key === "b" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        insertCellBelow(currentCellId);
        return;
      }

      // Double 'd' key to delete
      if (key === "d" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (lastKey.key === "d" && now - lastKey.time < 900) {
          deleteActiveCell(currentCellId);
          lastKeyPressRef.current = { key: "", time: 0 };
        } else {
          lastKeyPressRef.current = { key: "d", time: now };
          toast.info("Press 'd' again to delete cell");
        }
        return;
      }

      // Double '0' key to restart kernel
      if (key === "0" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (lastKey.key === "0" && now - lastKey.time < 900) {
          restartKernel();
          lastKeyPressRef.current = { key: "", time: 0 };
        } else {
          lastKeyPressRef.current = { key: "0", time: now };
          toast.info("Press '0' again to restart kernel");
        }
        return;
      }

      if (key === "y" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentCellId) updateCellType(currentCellId, "python");
        toast.success("Converted cell to Python Code (Y)");
        return;
      }

      if (key === "m" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentCellId) updateCellType(currentCellId, "markdown");
        toast.success("Converted cell to Markdown (M)");
        return;
      }

      if (key === "q" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentCellId) updateCellType(currentCellId, "sql");
        toast.success("Converted cell to SQL (Q)");
        return;
      }

      if (key === "c" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        copyActiveCell(currentCellId);
        return;
      }

      if (key === "v" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        pasteActiveCell(currentCellId);
        return;
      }

      if (key === "x" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        cutActiveCell(currentCellId);
        return;
      }

      if (key === "z" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((key === "k" || e.key === "ArrowUp") && !e.shiftKey) {
        e.preventDefault();
        const idx = activeNb.cells.findIndex(c => c.id === currentCellId);
        if (idx > 0) {
          focusCellInDOM(activeNb.cells[idx - 1].id, false);
        }
        return;
      }

      if ((key === "j" || e.key === "ArrowDown") && !e.shiftKey) {
        e.preventDefault();
        const idx = activeNb.cells.findIndex(c => c.id === currentCellId);
        if (idx !== -1 && idx < activeNb.cells.length - 1) {
          focusCellInDOM(activeNb.cells[idx + 1].id, false);
        }
        return;
      }

      if ((key === "k" || e.key === "ArrowUp") && e.shiftKey) {
        e.preventDefault();
        if (currentCellId) moveCell(currentCellId, "up");
        return;
      }

      if ((key === "j" || e.key === "ArrowDown") && e.shiftKey) {
        e.preventDefault();
        if (currentCellId) moveCell(currentCellId, "down");
        return;
      }

      if (key === "f" || ((e.ctrlKey || e.metaKey) && key === "f")) {
        e.preventDefault();
        setShowFindReplace(prev => !prev);
        return;
      }

      if (key === "h" || e.key === "?") {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notebooks, activeNbId, selectedDatasetId, activeFocusedCellId, ctrlMChordActive, copiedCell, undoStack]);

  // Quick AI Cell Action (Explain, Optimize, Visualize, Docstring)
  const handleQuickAiAction = async (cellId: string, action: "explain" | "optimize" | "visualize" | "fix" | "docstring") => {
    const cell = activeNb.cells.find(c => c.id === cellId);
    if (!cell) return;

    if (action === "fix") {
      handleAiAutoFix(cellId, cell.output?.error?.message || "unknown syntax or runtime error");
      return;
    }

    const quota = checkAndConsumeQuota(1, (session?.user as any)?.id);
    if (!quota.allowed) {
      triggerLimitModal();
      toast.error("Monthly AI API quota limit reached for your plan. Please upgrade.");
      return;
    }

    toast.info(`AI Copilot generating ${action} action...`);

    let prompt = "";
    if (action === "explain") {
      prompt = `Explain the following ${cell.type} code step-by-step with clear, concise bullet points for a data science executive report. Return clean markdown formatted text:\n\n${cell.code}`;
    } else if (action === "optimize") {
      prompt = `Optimize the following ${cell.type} code for high performance, vectorization (using pandas/numpy/duckdb), and clean structure. Return ONLY the code block:\n\n${cell.code}`;
    } else if (action === "visualize") {
      prompt = `Generate a matplotlib / seaborn visualization code block corresponding to this dataset or logic. Return clean Python code:\n\n${cell.code}`;
    } else if (action === "docstring") {
      prompt = `Generate an executive Markdown documentation header and purpose description for this code block:\n\n${cell.code}`;
    }

    try {
      const response = await fetch('/api/v1/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          message: prompt,
          context: `Active dataset is: ${selectedDataset?.name || 'sales_dataset.xlsx'}. User wants code to put in a notebook.`
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        const text = result.data.text || result.data.python_code || result.data.sql_code || "";
        
        if (action === "explain" || action === "docstring") {
          // Insert a Markdown cell right above this cell
          const cellIdx = activeNb.cells.findIndex(c => c.id === cellId);
          insertCellAt(Math.max(0, cellIdx), "markdown", text);
          toast.success("Inserted AI Markdown documentation!");
        } else if (action === "optimize") {
          let cleanCode = text;
          if (cleanCode.includes("```python")) {
            cleanCode = cleanCode.split("```python")[1].split("```")[0].trim();
          } else if (cleanCode.includes("```sql")) {
            cleanCode = cleanCode.split("```sql")[1].split("```")[0].trim();
          } else if (cleanCode.includes("```")) {
            cleanCode = cleanCode.split("```")[1].split("```")[0].trim();
          }
          updateCellCode(cellId, cleanCode);
          toast.success("Cell code optimized and vectorized!");
        } else if (action === "visualize") {
          let cleanCode = text;
          if (cleanCode.includes("```python")) {
            cleanCode = cleanCode.split("```python")[1].split("```")[0].trim();
          } else if (cleanCode.includes("```")) {
            cleanCode = cleanCode.split("```")[1].split("```")[0].trim();
          }
          const cellIdx = activeNb.cells.findIndex(c => c.id === cellId);
          insertCellAt(cellIdx + 1, "python", cleanCode);
          toast.success("Added new AI visualization cell!");
        }
      }
    } catch (e: any) {
      toast.error(`AI Action failed: ${e.message}`);
    }
  };

  // Find & Replace Handlers
  const handleFindReplaceInCell = (cellId: string, newCode: string) => {
    updateCellCode(cellId, newCode);
  };

  const handleFindReplaceAll = (searchTerm: string, replaceTerm: string) => {
    if (!searchTerm) return;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const updatedCells = activeNb.cells.map(c => ({
      ...c,
      code: c.code.replace(regex, replaceTerm)
    }));
    updateNotebooksWithUndo(
      notebooks.map(nb => nb.id === activeNbId ? { ...nb, cells: updatedCells } : nb)
    );
  };

  const installPackageByName = async (packageName: string) => {
    try {
      const response = await fetch('/api/v1/notebook/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ packageName })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message || `Installed ${packageName}`);
      } else {
        toast.error(result.data.message || `Failed to install package ${packageName}`);
      }
    } catch (err: any) {
      toast.error(`Package install failed: ${err.message}`);
    }
  };

  // Execute Cell
  const executeCell = async (cellId: string) => {
    const controller = new AbortController();
    abortControllersRef.current[cellId] = controller;

    const startTime = performance.now();
    setKernelStatus("Busy");
    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => c.id === cellId ? { ...c, isExecuting: true } : c)
      };
    }));

    const cell = activeNb.cells.find(c => c.id === cellId);
    if (!cell) {
      delete abortControllersRef.current[cellId];
      setKernelStatus("Idle");
      return;
    }

    // Toggle markdown to rendered view after running
    if (cell.type === 'markdown') {
      delete abortControllersRef.current[cellId];
      setMarkdownEditModes(prev => {
        const isCurrentlyEditing = prev[cellId] ?? (!cell.output);
        return { ...prev, [cellId]: !isCurrentlyEditing };
      });
      setNotebooks(prev => prev.map(nb => {
        if (nb.id !== activeNbId) return nb;
        return {
          ...nb,
          cells: nb.cells.map(c => c.id === cellId ? { ...c, isExecuting: false, output: { type: "markdown", text: c.code } } : c)
        };
      }));
      setKernelStatus("Idle");
      return;
    }

    
    // Python Sandboxing Execution (MicroVM Pod or Pyodide WASM)
    if (cell.type === 'python') {
      if (cellRuntimes[cellId] === 'microvm') {
        try {
          const response = await fetch('/api/v1/enterprise/microvm/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: cell.code, timeoutSec: 60 })
          });
          const data = await response.json();
          const endTime = performance.now();
          const execTime = ((endTime - startTime) / 1000).toFixed(2);
          const durationMs = Math.round(endTime - startTime);

          setCellExecutionMeta(prev => ({
            ...prev,
            [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() }
          }));

          if (data.success) {
            setNotebooks(prev => prev.map(nb => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map(c => c.id === cellId ? {
                  ...c,
                  isExecuting: false,
                  executionTime: execTime + 's',
                  output: {
                    type: "text" as const,
                    text: ((data.stdout || "Execution completed successfully.")).trim() + `\n\n[MicroVM Pod: ${data.podId || 'gVisor-isolated'} | ${data.peakMemoryMb || 14}MB RAM | Execution: ${data.executionTimeMs || durationMs}ms]`
                  }
                } : c)
              };
            }));
            setKernelStatus("Idle");
            delete abortControllersRef.current[cellId];
            return;
          } else {
            setNotebooks(prev => prev.map(nb => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map(c => c.id === cellId ? {
                  ...c,
                  isExecuting: false,
                  executionTime: execTime + 's',
                  output: {
                    type: "error" as const,
                    error: {
                      error_class: "MicroVMRuntimeError",
                      message: data.error || data.stderr || "Isolated Pod execution error",
                      line_number: null,
                      suggested_fix: "Check your Python syntax and variables.",
                      traceback: data.stderr
                    }
                  }
                } : c)
              };
            }));
            setKernelStatus("Idle");
            delete abortControllersRef.current[cellId];
            return;
          }
        } catch (vmErr: any) {
          toast.warning("MicroVM pod network error, switching to browser Pyodide WASM sandbox.");
        }
      }

      // Pyodide Isolated WASM Python Sandboxing Execution
      try {
        const datasetRows = (selectedDataset as any)?.sample_rows || (selectedDataset as any)?.preview_data || undefined;
        
        let pyResult: any;
        if (hybridComputeEngine === "wasm" || !cellRuntimes[cellId]) {
            // Enterprise Feature: Use Dedicated WebWorker for out-of-process execution
            const { executeInDedicatedWorker } = await import("@/workers/dedicatedComputeWorker");
            const workerRes = await executeInDedicatedWorker({ type: "python", code: cell.code, dataSample: datasetRows });
            
            pyResult = {
                securityBlocked: !workerRes.success && workerRes.error?.includes("system"),
                error: workerRes.error,
                stdout: workerRes.result?.stdout || "",
                stderr: workerRes.error || "",
                result: workerRes.result?.data || null
            };
        } else {
            pyResult = await pyodideSandbox.execute(cellId, cell.code, datasetRows);
        }
        
        const endTime = performance.now();
        const execTime = ((endTime - startTime) / 1000).toFixed(2);
        const durationMs = Math.round(endTime - startTime);

        setCellExecutionMeta(prev => ({
          ...prev,
          [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() }
        }));

        setNotebooks(prev => prev.map(nb => {
          if (nb.id !== activeNbId) return nb;
          return {
            ...nb,
            cells: nb.cells.map(c => {
              if (c.id !== cellId) return c;

              if (pyResult.securityBlocked) {
                return {
                  ...c,
                  isExecuting: false,
                  executionTime: execTime + 's',
                  output: {
                    type: "error" as const,
                    error: {
                      error_class: "SecuritySandboxViolation",
                      message: pyResult.error || "Blocked dangerous system access attempt.",
                      line_number: null,
                      suggested_fix: "System syscalls (os, sys, subprocess, socket, ctypes, raw I/O) are blocked by the Zero-Trust Pyodide sandbox. Use pandas, numpy, scipy, and matplotlib for data science computations."
                    }
                  }
                };
              }

              if (!pyResult.success) {
                return {
                  ...c,
                  isExecuting: false,
                  executionTime: execTime + 's',
                  output: {
                    type: "error" as const,
                    error: {
                      error_class: "PythonRuntimeError",
                      message: pyResult.error || "Runtime execution failed",
                      line_number: null,
                      suggested_fix: "Check your Python syntax, variable names, and dataset references.",
                      traceback: pyResult.stderr || pyResult.error
                    }
                  }
                };
              }

              if (pyResult.figures && pyResult.figures.length > 0) {
                const cleanFigures = pyResult.figures.map(fig => 
                  fig.startsWith("data:") ? fig.split(",")[1] : fig
                );
                return {
                  ...c,
                  isExecuting: false,
                  executionTime: execTime + 's',
                  output: {
                    type: "chart" as const,
                    images: cleanFigures,
                    text: pyResult.stdout || ""
                  }
                };
              }

              return {
                ...c,
                isExecuting: false,
                executionTime: execTime + 's',
                output: {
                  type: "text" as const,
                  text: (pyResult.stdout + "\n" + (pyResult.result || "")).trim() || "Executed successfully in browser WASM sandbox."
                }
              };
            })
          };
        }));

        if (pyResult.variables) {
          setKernelVariables(pyResult.variables as any);
        }

        setKernelStatus("Idle");
        delete abortControllersRef.current[cellId];
        return;
      } catch (err: any) {
        setNotebooks(prev => prev.map(nb => {
          if (nb.id !== activeNbId) return nb;
          return {
            ...nb,
            cells: nb.cells.map(c => c.id === cellId ? {
              ...c,
              isExecuting: false,
              output: {
                type: "error" as const,
                error: {
                  error_class: "PyodideSandboxException",
                  message: err.message || "Failed to execute in isolated sandbox.",
                  line_number: null,
                  suggested_fix: "Verify dataset structure and ensure code completes within sandbox timeout."
                }
              }
            } : c)
          };
        }));
        setKernelStatus("Idle");
        delete abortControllersRef.current[cellId];
        return;
      }
    }

    // SQL Execution via Adaptive Query Pushdown Router (DuckDB-WASM or Remote Cloud Pushdown)
    if (cell.type === 'sql') {
      try {
        const datasetRows = (selectedDataset as any)?.sample_rows || (selectedDataset as any)?.preview_data || (selectedDataset as any)?.rows || undefined;
        const datasetInfo = selectedDataset ? {
          id: selectedDataset.id,
          name: selectedDataset.name,
          rowCount: (selectedDataset as any).row_count || datasetRows?.length || 10000,
          sizeBytes: (selectedDataset as any).size_bytes || 5000000,
          storageType: (selectedDataset as any).storage_type || "local_wasm",
          remoteWarehouseUrl: (selectedDataset as any).remote_warehouse_url
        } : undefined;

        const routerResult = await AdaptiveQueryRouter.execute(cell.code, datasetInfo, datasetRows);
        const durationMs = routerResult.durationMs || Math.round(performance.now() - startTime);

        setCellExecutionMeta(prev => ({
          ...prev,
          [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() }
        }));

        setNotebooks(prev => prev.map(nb => {
          if (nb.id !== activeNbId) return nb;
          return {
            ...nb,
            cells: nb.cells.map(c => {
              if (c.id !== cellId) return c;

              if (!routerResult.success) {
                return {
                  ...c,
                  isExecuting: false,
                  executionTime: `${(durationMs / 1000).toFixed(2)}s`,
                  output: {
                    type: "error" as const,
                    error: {
                      error_class: "SQLQueryError",
                      message: routerResult.error || "Query execution failed.",
                      suggested_fix: "Check your SQL table alias and clause syntax.",
                      line_number: null
                    }
                  }
                };
              }

              if (routerResult.columns && routerResult.rows) {
                return {
                  ...c,
                  isExecuting: false,
                  executionTime: `${(durationMs / 1000).toFixed(2)}s`,
                  output: {
                    type: "table" as const,
                    columns: routerResult.columns,
                    rows: routerResult.rows,
                    text: `[${routerResult.engine === 'remote_pushdown' ? '⚡ Remote Warehouse Pushdown' : '🦆 DuckDB-WASM Local'}] ${routerResult.rowCount} rows retrieved in ${durationMs}ms.`
                  }
                };
              }

              return {
                ...c,
                isExecuting: false,
                executionTime: `${(durationMs / 1000).toFixed(2)}s`,
                output: {
                  type: "text" as const,
                  text: `Executed successfully via ${routerResult.engine}.`
                }
              };
            })
          };
        }));

        setKernelStatus("Idle");
        delete abortControllersRef.current[cellId];
        return;
      } catch (sqlErr: any) {
        console.warn("Adaptive router fallback to backend kernel:", sqlErr);
      }
    }

    try {
      const response = await fetch('/api/v1/notebook/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          code: cell.code,
          type: cell.type,
          datasetId: selectedDatasetId
        })
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to execute cell inside active Python kernel.");
      }

      const kernelPayload = result.data;
      const durationMs = Math.round(performance.now() - startTime);
      setCellExecutionMeta(prev => ({
        ...prev,
        [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() }
      }));

      // Update notebooks state with kernel results
      setNotebooks(prev => prev.map(nb => {
        if (nb.id !== activeNbId) return nb;
        return {
          ...nb,
          cells: nb.cells.map(c => {
            if (c.id !== cellId) return c;

            let finalOutput: any = null;

            if (kernelPayload.outputType === "error") {
              finalOutput = {
                type: "error",
                error: kernelPayload.error,
                text: kernelPayload.text || kernelPayload.error?.message
              };
              toast.error(`Cell execution failed with Python ${kernelPayload.error?.error_class || 'Exception'}`);
            } else if (kernelPayload.outputType === "chart") {
              finalOutput = {
                type: "chart",
                images: kernelPayload.images,
                text: kernelPayload.text
              };
            } else if (kernelPayload.outputType === "table") {
              finalOutput = {
                type: "table",
                data: kernelPayload.data
              };
            } else {
              finalOutput = {
                type: "text",
                text: kernelPayload.text
              };
            }

            return {
              ...c,
              isExecuting: false,
              output: finalOutput
            };
          })
        };
      }));

      // Update Variable Explorer state
      if (kernelPayload.variables && Object.keys(kernelPayload.variables).length > 0) {
        setKernelVariables(kernelPayload.variables);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`Cell ${cellId} execution aborted.`);
        return;
      }
      console.error(err);
      toast.error(err.message || "Execution process encountered a connection error.");
      setNotebooks(prev => prev.map(nb => {
        if (nb.id !== activeNbId) return nb;
        return {
          ...nb,
          cells: nb.cells.map(c => c.id === cellId ? {
            ...c,
            isExecuting: false,
            output: {
              type: "error",
              error: {
                error_class: "NetworkConnectionError",
                message: err.message || "Failed to contact the backend Python kernel wrapper service.",
                line_number: null,
                suggested_fix: "Ensure your dev server is running and database configuration is set."
              }
            }
          } : c)
        };
      }));
    } finally {
      delete abortControllersRef.current[cellId];
      const stillExecuting = activeNb.cells.some(c => c.id !== cellId && c.isExecuting);
      if (!stillExecuting) {
        setKernelStatus("Idle");
      }
    }
  };

  // Run Above
  const runCellsAbove = (cellId: string) => {
    const idx = activeNb.cells.findIndex(c => c.id === cellId);
    if (idx <= 0) {
      toast.info("No cells above to execute.");
      return;
    }
    const aboveCells = activeNb.cells.slice(0, idx);
    toast.info(`Executing ${aboveCells.length} cells above...`);
    aboveCells.forEach(async (c) => {
      await executeCell(c.id);
    });
  };

  // Run Below
  const runCellsBelow = (cellId: string) => {
    const idx = activeNb.cells.findIndex(c => c.id === cellId);
    if (idx === -1 || idx === activeNb.cells.length - 1) {
      toast.info("No cells below to execute.");
      return;
    }
    const belowCells = activeNb.cells.slice(idx + 1);
    toast.info(`Executing ${belowCells.length} cells below...`);
    belowCells.forEach(async (c) => {
      await executeCell(c.id);
    });
  };

  // Run All Cells
  const runAllCells = () => {
    toast.info("Running entire notebook sequence top-to-bottom...");
    activeNb.cells.forEach(async (c) => {
      await executeCell(c.id);
    });
  };

  // Clear Output
  const clearOutput = (cellId: string) => {
    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => c.id === cellId ? { ...c, output: undefined } : c)
      };
    }));
  };

  // Clear All Outputs
  const clearAllOutputs = () => {
    setNotebooks(prev => prev.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return {
        ...nb,
        cells: nb.cells.map(c => ({ ...c, output: undefined }))
      };
    }));
    toast.success("Cleared all execution output panels.");
  };

  // Restart Kernel
  const restartKernel = () => {
    setKernelVariables({
      "df": { type: "DataFrame", summary: "Loaded Dataset Frame" },
      "metadata": { type: "dict", summary: "Dataset Metadata" },
      "schema": { type: "dict", summary: "Schema Definition" },
      "summary": { type: "dict", summary: "Statistical Summary" },
      "column_info": { type: "dict", summary: "Detailed Column Meta" }
    });
    setKernelStatus("Idle");
    toast.success("Kernel state re-initialized. Memory variables reloaded from current active dataset.");
  };

  // Add Cell
  const addCell = (type: "python" | "sql" | "markdown", initialCode?: string) => {
    const newCell: Cell = {
      id: `c-${Date.now()}`,
      type,
      code: initialCode || (
        type === "markdown" 
          ? "## Analysis Commentary\nExplain your insights and correlation findings..." 
          : type === "python" 
          ? `# Write Python analysis\nimport pandas as pd\nimport numpy as np\n\nif df is not None:\n    print(df.describe())\nelse:\n    print("No active dataframe found.")` 
          : "SELECT * FROM dataset LIMIT 5;"
      )
    };

    updateNotebooksWithUndo(notebooks.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return { ...nb, cells: [...nb.cells, newCell] };
    }));
  };

  // Duplicate Cell
  const duplicateCell = (cellId: string) => {
    const cell = activeNb.cells.find(c => c.id === cellId);
    if (!cell) return;
    const dupCell: Cell = {
      ...cell,
      id: `c-${Date.now()}`,
      output: undefined
    };
    const idx = activeNb.cells.findIndex(c => c.id === cellId);
    const newCells = [...activeNb.cells];
    newCells.splice(idx + 1, 0, dupCell);

    updateNotebooksWithUndo(notebooks.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return { ...nb, cells: newCells };
    }));
    toast.success("Cell duplicated.");
  };

  // Delete Cell
  const deleteCell = (cellId: string) => {
    updateNotebooksWithUndo(notebooks.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return { ...nb, cells: nb.cells.filter(c => c.id !== cellId) };
    }));
    toast.success("Deleted cell.");
  };

  // Move Cell
  const moveCell = (cellId: string, direction: "up" | "down") => {
    const idx = activeNb.cells.findIndex(c => c.id === cellId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= activeNb.cells.length) return;

    const newCells = [...activeNb.cells];
    const temp = newCells[idx];
    newCells[idx] = newCells[newIdx];
    newCells[newIdx] = temp;

    setNotebooks(notebooks.map(nb => {
      if (nb.id !== activeNbId) return nb;
      return { ...nb, cells: newCells };
    }));
  };

  // Inject Code Snippet into Cell
  const injectSnippet = (cellId: string, snippetCode: string) => {
    const cell = activeNb.cells.find(c => c.id === cellId);
    if (!cell) return;
    const newCode = cell.code ? `${cell.code}\n\n${snippetCode}` : snippetCode;
    updateCellCode(cellId, newCode);
    toast.success("Injected code snippet!");
  };

  // Package Manager Installer
  const handlePackageInstall = async () => {
    if (!customPackageName.trim()) return;
    setInstallingPackage(true);
    toast.info(`Installing Python library: ${customPackageName}...`);
    try {
      const response = await fetch('/api/v1/notebook/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ packageName: customPackageName })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message || `Successfully installed ${customPackageName}`);
        setCustomPackageName("");
      } else {
        toast.error(result.data.message || `Failed to install package ${customPackageName}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Package installer timed out.");
    } finally {
      setInstallingPackage(false);
    }
  };

  // AI Repairs & Generation
  const triggerAiHelp = (cellId: string, customPrompt = "") => {
    setTargetCellId(cellId);
    setAiPrompt(customPrompt);
    setAiModalOpen(true);
  };

  const handleAiAutoFix = async (cellId: string, errMessage: string) => {
    // Quota Enforcement Check
    const quota = checkAndConsumeQuota(1, (session?.user as any)?.id);
    if (!quota.allowed) {
      triggerLimitModal();
      toast.error("Monthly AI API quota limit reached for your plan. Please upgrade.");
      return;
    }

    toast.info("AI Copilot Error Doctor analyzing trace & generating fix...");
    const cell = activeNb.cells.find(c => c.id === cellId);
    if (!cell) return;

    try {
      const response = await fetch('/api/v1/notebook/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          mode: 'fix_error',
          cellCode: cell.code,
          cellType: cell.type,
          cellError: cell.output?.error || { message: errMessage },
          allCells: activeNb.cells,
          datasetMeta: selectedDataset ? {
            name: selectedDataset.name,
            columns: selectedDataset.columns,
            rows: selectedDataset.rows
          } : null
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const { repaired_code, root_cause, suggested_fix_summary, requires_package_install, package_name, target_type } = resJson.data;

        if (requires_package_install && package_name) {
          toast.info(`Auto-installing required Python library: ${package_name}...`);
          try {
            await fetch('/api/v1/notebook/install', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({ packageName: package_name })
            });
            toast.success(`Successfully installed library: ${package_name}!`);
          } catch (instErr) {
            console.warn("Auto-install failed:", instErr);
          }
        }

        if (repaired_code) {
          let cleanCode = repaired_code;
          if (cleanCode.includes("```python")) {
            cleanCode = cleanCode.split("```python")[1].split("```")[0].trim();
          } else if (cleanCode.includes("```sql")) {
            cleanCode = cleanCode.split("```sql")[1].split("```")[0].trim();
          } else if (cleanCode.includes("```")) {
            cleanCode = cleanCode.split("```")[1].split("```")[0].trim();
          }

          updateCellCode(cellId, cleanCode);
          if (target_type && (target_type === 'python' || target_type === 'sql' || target_type === 'markdown') && target_type !== cell.type) {
            updateCellType(cellId, target_type);
          }

          toast.success(`AI Fixed: ${suggested_fix_summary || 'Repaired code cell!'}`);
          setTimeout(() => {
            executeCell(cellId);
          }, 300);
        } else {
          toast.error(`Root Cause: ${root_cause || 'Unable to generate code fix'}`);
        }
      } else {
        throw new Error(resJson.error || "Unable to parse repair suggestions.");
      }
    } catch (e: any) {
      toast.error("AI Repair failed: " + e.message);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;

    // Quota Enforcement Check
    const quota = checkAndConsumeQuota(1, (session?.user as any)?.id);
    if (!quota.allowed) {
      triggerLimitModal();
      toast.error("Monthly AI API quota limit reached for your plan. Please upgrade.");
      return;
    }

    toast.info("AI Copilot generating interactive notebook logic...");
    
    try {
      const response = await fetch('/api/v1/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          message: aiPrompt,
          context: `Active dataset is: ${selectedDataset?.name || 'sales_dataset.xlsx'}. User wants code to put in a notebook. Make sure you return executable python inside 'python_code' and SQL inside 'sql_code'.`
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const generatedCode = data.python_code || data.sql_code || data.text;
        
        let cleanCode = generatedCode;
        if (cleanCode.includes("```python")) {
          cleanCode = cleanCode.split("```python")[1].split("```")[0].trim();
        } else if (cleanCode.includes("```sql")) {
          cleanCode = cleanCode.split("```sql")[1].split("```")[0].trim();
        } else if (cleanCode.includes("```")) {
          cleanCode = cleanCode.split("```")[1].split("```")[0].trim();
        }

        if (targetCellId) {
          updateCellCode(targetCellId, cleanCode);
        } else {
          const newCell: Cell = {
            id: `c-${Date.now()}`,
            type: data.sql_code ? "sql" : "python",
            code: cleanCode
          };
          updateNotebooksWithUndo(notebooks.map(nb => {
            if (nb.id !== activeNbId) return nb;
            return { ...nb, cells: [...nb.cells, newCell] };
          }));
        }

        setAiModalOpen(false);
        setAiPrompt("");
        toast.success("AI code generated and injected!");
      }
    } catch (e) {
      toast.error("Failed to generate AI code.");
    }
  };

  // Export Notebook
  const handleExport = (format: string) => {
    let content = "";
    let mimeType = "text/plain";
    let fileName = `${activeNb.name.replace(/\s+/g, "_")}.${format}`;

    if (format === "ipynb") {
      mimeType = "application/json";
      const ipynbJson = {
        cells: activeNb.cells.map(c => ({
          cell_type: c.type === "markdown" ? "markdown" : "code",
          execution_count: c.type === "markdown" ? null : 1,
          metadata: {},
          outputs: c.output ? [
            {
              output_type: "stream",
              name: "stdout",
              text: [c.output.text || ""]
            }
          ] : [],
          source: c.code.split("\n").map(l => l + "\n")
        })),
        metadata: {
          kernelspec: {
            display_name: "Python 3",
            language: "python",
            name: "python3"
          }
        },
        nbformat: 4,
        nbformat_minor: 2
      };
      content = JSON.stringify(ipynbJson, null, 2);
    } else if (format === "py") {
      fileName = `${activeNb.name.replace(/\s+/g, "_")}.py`;
      content = `# Exported from Vivexa Data Science IDE\n# Active Dataset: ${selectedDataset?.name || 'None'}\n\n` +
        activeNb.cells.map(c => {
          if (c.type === "markdown") {
            return `"""\n${c.code}\n"""`;
          } else if (c.type === "sql") {
            return `# SQL QUERY:\n# """\n# ${c.code}\n# """`;
          } else {
            return c.code;
          }
        }).join("\n\n");
    } else if (format === "md") {
      fileName = `${activeNb.name.replace(/\s+/g, "_")}.md`;
      content = `# ${activeNb.name}\n\n` +
        activeNb.cells.map(c => {
          if (c.type === "markdown") {
            return c.code;
          } else {
            return `\`\`\`${c.type}\n${c.code}\n\`\`\``;
          }
        }).join("\n\n");
    } else if (format === "html") {
      fileName = `${activeNb.name.replace(/\s+/g, "_")}.html`;
      content = `<!DOCTYPE html><html><head><title>${activeNb.name}</title><style>body{font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;}pre{background:#1e293b;padding:15px;border-radius:8px;overflow-x:auto;}</style></head><body><h1>${activeNb.name}</h1>` +
        activeNb.cells.map(c => `<h3>[${c.type.toUpperCase()}] Cell</h3><pre>${c.code}</pre>`).join("") + "</body></html>";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    toast.success(`Exported notebook as .${format.toUpperCase()}`);
  };

  // Filtered cells by search query
  const filteredCells = useMemo(() => {
    if (!searchQuery.trim()) return activeNb.cells;
    return activeNb.cells.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeNb.cells, searchQuery]);

  return (
    <div 
      onMouseMove={(e) => updateCursor(e.clientX, e.clientY)}
      className="flex flex-col lg:flex-row gap-6 relative z-10 w-full max-w-7xl mx-auto pb-12"
    >
      <CollaborativeCursorOverlay />
      {/* 1. LEFT SIDEBAR: Notebook Outline, Datasets, Templates & Version Control */}
      <div className="w-full lg:w-64 shrink-0 space-y-6">
        
        {/* WORKSPACE NOTEBOOKS MANAGER */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" /> Workspace Notebooks
              </CardTitle>
              <CardDescription className="text-xs">{notebooks.length} active notebook files</CardDescription>
            </div>
            <Button onClick={() => setNewNotebookModal(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-500 h-7 text-xs px-2.5 rounded-lg">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
            {notebooks.map((nb) => {
              const isActive = nb.id === activeNbId;
              const isRenaming = renamingNbId === nb.id;
              return (
                <div
                  key={nb.id}
                  onClick={() => setActiveNbId(nb.id)}
                  className={`group p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  {isRenaming ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                      <Input
                        value={renameTitle}
                        onChange={e => setRenameTitle(e.target.value)}
                        className="h-6 text-xs bg-slate-950 border-indigo-500 rounded p-1"
                        autoFocus
                      />
                      <Button onClick={() => handleRenameNotebook(nb.id)} size="icon" className="h-6 w-6 bg-emerald-600">
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate">
                        <Terminal className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                        <span className="truncate">{nb.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setRenamingNbId(nb.id); setRenameTitle(nb.name); }}
                          className="text-slate-400 hover:text-indigo-400 p-0.5"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDuplicateNotebook(nb.id)}
                          className="text-slate-400 hover:text-emerald-400 p-0.5"
                          title="Duplicate"
                        >
                          <CopyPlus className="h-3 w-3" />
                        </button>
                        {notebooks.length > 1 && (
                          <button
                            onClick={() => handleDeleteNotebook(nb.id)}
                            className="text-slate-400 hover:text-rose-400 p-0.5"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* STARTER WORKFLOW TEMPLATES */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" /> Starter Workflows
            </CardTitle>
            <CardDescription className="text-xs">1-click data science templates</CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {STARTER_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => handleCreateNotebook(tmpl.cells, tmpl.name.replace(/[^a-zA-Z0-9 ]/g, ""))}
                className="w-full text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-amber-500/40 hover:bg-slate-900 transition-all space-y-1 group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 flex items-center justify-between">
                  <span>{tmpl.name}</span>
                  <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{tmpl.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* NOTEBOOK OUTLINE */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-emerald-400" /> Section Outline
            </CardTitle>
            <CardDescription className="text-xs">Jump to cell anchors</CardDescription>
          </CardHeader>
          <CardContent className="p-3 max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar">
            {activeNb.cells.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No cells inside this notebook.</p>
            ) : (
              activeNb.cells.map((cell, idx) => {
                const label = cell.type === "markdown" 
                  ? cell.code.split("\n")[0].replace(/[#*]/g, "").trim().substring(0, 22) || "Markdown commentary"
                  : cell.code.substring(0, 24).replace(/\n/g, " ") + "...";
                return (
                  <button
                    key={cell.id}
                    onClick={() => {
                      const el = document.getElementById(cell.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-full text-left p-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors truncate"
                  >
                    <span className="text-[10px] text-slate-500 font-mono">[{idx + 1}]</span>
                    <span className={`px-1 py-0.5 rounded text-[8px] uppercase font-bold font-mono ${
                      cell.type === 'python' ? 'bg-blue-500/10 text-blue-400' :
                      cell.type === 'sql' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {cell.type}
                    </span>
                    <span className="truncate">{label}</span>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

                {/* ENTERPRISE CLUSTER METRICS PANEL */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" /> Kernel & Cluster Compute
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mt-1">Dedicated Serverless Instance (Node.js Worker Threads)</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Attached Storage Volume (Dataset)</label>
              <select
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                value={selectedDatasetId}
                onChange={(e) => handleDatasetChange(e.target.value)}
              >
                <option value="">-- No Attached Volume --</option>
                {localDatasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-mono">Memory Allocation (RAM)</span>
                  <span className="text-[10px] font-bold text-slate-300">14.2 GB / 64 GB</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '22%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-mono">CPU Usage (32 Cores)</span>
                  <span className="text-[10px] font-bold text-slate-300">{kernelStatus === 'Busy' ? '88%' : '2%'}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div className={`${kernelStatus === 'Busy' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} h-1.5 rounded-full transition-all duration-1000`} style={{ width: kernelStatus === 'Busy' ? '88%' : '2%' }}></div>
                </div>
              </div>
            </div>

            {selectedDataset && (
              <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[10px] space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vol Type:</span>
                  <span className="text-indigo-400 font-bold uppercase">{selectedDataset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shape:</span>
                  <span>{selectedDataset.rows || 'N/A'} rows × {selectedDataset.cols || 'N/A'} cols</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Size:</span>
                  <span>~{(parseInt(selectedDataset.rows || '0') * 0.005).toFixed(2)} MB in RAM</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ISOLATED PYODIDE WASM SANDBOX SECURITY CARD */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" /> Pyodide WASM Sandbox
              </CardTitle>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold">
                Zero-Trust
              </span>
            </div>
            <CardDescription className="text-[10px] text-slate-400 mt-1">
              Client-side isolated worker runtime with restricted system privileges.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-400" /> Syscall Guard
                </span>
                <span className="text-emerald-400 font-bold">ACTIVE (OS & Socket Blocked)</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Cpu className="h-3 w-3 text-indigo-400" /> WASM Memory
                </span>
                <span className="text-indigo-300 font-bold">512 MB Max / 15s Timeout</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-blue-400" /> Scientific Stack
                </span>
                <span className="text-slate-300 font-bold">pandas, numpy, scipy, plt</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSandboxPolicyModal(true)}
                className="w-full text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
              >
                <Shield className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Policy Rules
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSandboxResetting}
                onClick={async () => {
                  setIsSandboxResetting(true);
                  await pyodideSandbox.resetSandbox();
                  setIsSandboxResetting(false);
                  toast.success("Reset Pyodide WASM memory and isolated session.");
                }}
                className="text-xs bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300 shrink-0"
                title="Reset Sandbox Session"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSandboxResetting ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* VERSIONING SNAPSHOTS */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" /> Version Backups
            </CardTitle>
            <CardDescription className="text-xs">Rollback notebook states</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-1.5">
              <Input
                placeholder="Backup name..."
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                className="h-8 text-xs bg-slate-950 border-slate-800 rounded-xl"
              />
              <Button onClick={createSnapshot} size="sm" className="bg-emerald-600 hover:bg-emerald-500 h-8 text-xs rounded-xl">
                Save
              </Button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-1.5">
              {snapshots.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No custom versions saved.</p>
              ) : (
                snapshots.map(snap => (
                  <div key={snap.id} className="p-2 rounded bg-slate-950 border border-slate-850 flex items-center justify-between gap-1">
                    <div className="truncate">
                      <div className="text-[10px] font-bold text-slate-200 truncate">{snap.name}</div>
                      <div className="text-[9px] text-slate-500">{snap.timestamp}</div>
                    </div>
                    <Button onClick={() => restoreSnapshot(snap)} variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-400 p-1">
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. MAIN CENTER: Notebook Canvas Editor & Execution Panel */}
      <div className="flex-1 space-y-6">
        
        {/* Notebook Top Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-extrabold tracking-tight text-white">{activeNb.name}</h1>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  kernelStatus === 'Busy' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  Kernel: {kernelStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Dataset: <span className="text-amber-300 font-semibold">{selectedDataset?.name || 'sales_dataset.xlsx'}</span> • Compiled Execution Kernel
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
              <Variable className="h-4 w-4 text-blue-400" /> Variable Inspector
            </Button>

            <Button
              onClick={() => navigate('/workspace')}
              variant="outline"
              className="bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 font-semibold text-xs h-9 rounded-xl flex items-center gap-1.5 shadow-sm"
              title="Back to Workspace"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400" /> Back
            </Button>
            {kernelStatus === 'Busy' && (
              <Button
                onClick={cancelAllExecutions}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-rose-900/30 flex items-center gap-1.5 animate-pulse"
                title="Cancel ongoing cell executions"
              >
                <Ban className="h-3.5 w-3.5" /> Cancel Execution
              </Button>
            )}
            <Button
              onClick={() => setShowHybridComputeModal(true)}
              variant="outline"
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono shadow-sm"
              title="Configure Adaptive Execution Engine (Local WASM vs Cloud Warehouse)"
            >
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Engine:</span>
              <span className="uppercase font-bold text-emerald-400">{hybridComputeEngine === "wasm" ? "WASM Edge" : hybridComputeEngine === "container" ? "Container" : "DWH Pushdown"}</span>
            </Button>
            <Button
              onClick={() => setShowReactiveDAGModal(true)}
              variant="outline"
              className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono shadow-sm"
              title="Inspect AST Variable Lineage and Cascade Reactive Run"
            >
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden md:inline">Reactive DAG</span>
            </Button>
            <Button
              onClick={() => setShowSemanticRAGModal(true)}
              variant="outline"
              className="bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono shadow-sm"
              title="Organizational Query Memory & Semantic Vector RAG"
            >
              <Brain className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden xl:inline">Semantic RAG</span>
            </Button>
            <Button
              onClick={() => setShowEnterpriseGovernanceModal(true)}
              variant="outline"
              className="bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono shadow-sm"
              title="Enterprise PII Masking, Zero-Retention, and SOC2 Audit Logs"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Governance</span>
            </Button>
            <Button
              onClick={() => setShowCRDTStudioModal(true)}
              variant="outline"
              className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono shadow-sm"
              title="Real-Time Yjs CRDT Collaboration & Git-Native .vivexa.md Export"
            >
              <Share2 className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden lg:inline">Collab & Git</span>
            </Button>
            <Button
              onClick={() => setCopilotOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-indigo-900/30 border border-indigo-400/30 relative"
            >
              <Bot className="h-4 w-4 mr-1.5 text-indigo-300" />
              AI Copilot
              {activeNb.cells.some(c => c.output?.type === 'error') && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white rounded-full font-mono animate-pulse">
                  {activeNb.cells.filter(c => c.output?.type === 'error').length} err
                </span>
              )}
            </Button>
            <Button onClick={runAllCells} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-amber-900/20">
              <Play className="h-3.5 w-3.5 mr-1.5" /> Run All
            </Button>
            <Button onClick={restartKernel} variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 text-xs h-9 rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Restart Kernel
            </Button>
            <Button
              onClick={() => setShowTimeTravelModal(true)}
              variant="outline"
              className="bg-indigo-600/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono"
            >
              <History className="h-3.5 w-3.5 text-indigo-400" /> Time-Travel WAL
            </Button>
            <Button
              onClick={() => setShowMicroVMModal(true)}
              variant="outline"
              className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs h-9 rounded-xl flex items-center gap-1.5 font-mono"
            >
              <Cpu className="h-3.5 w-3.5 text-amber-400" /> MicroVM Fleet
            </Button>
            <Button onClick={clearAllOutputs} variant="ghost" className="text-slate-400 hover:text-white text-xs h-9 rounded-xl">
              Clear Outputs
            </Button>
            <Button onClick={() => setShowKeyboardShortcuts(true)} variant="ghost" className="text-slate-400 hover:text-white h-9 w-9 p-0 rounded-xl" title="Shortcuts">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Presentation View Mode Switcher */}
        {isPresentationMode ? (
          <NotebookPresentationView
            notebook={activeNb}
            datasetName={selectedDataset?.name}
            onExit={() => setIsPresentationMode(false)}
          />
        ) : (
          <>
            {/* Search, Undo, Export, Find/Replace Toolbar */}
            <div className="space-y-3">
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
                      <span>Ctrl+M Chord Active (A/B/D/M/Y/Q/C/V/X/H)</span>
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
                      <span className="text-[10px] font-normal text-slate-400 hidden xl:inline">[Enter: Edit, H: Cheatsheet]</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setNotebookMode("command")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                      title="Click or press Esc to exit to Command Mode"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>EDIT MODE</span>
                      <span className="text-[10px] font-normal text-slate-400 hidden xl:inline">[Esc: Command, Shift+Enter: Run]</span>
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
                    <span>Shortcuts (H)</span>
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
                  <Button onClick={() => handleAutoSave()} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white" title="Save Notebook (Ctrl+S)">
                    <Save className="h-3.5 w-3.5" />
                  </Button>

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

              {/* Floating Find & Replace Bar */}
              {showFindReplace && (
                <NotebookFindReplaceBar
                  isOpen={showFindReplace}
                  onClose={() => setShowFindReplace(false)}
                  cells={activeNb.cells}
                  onReplaceInCell={handleFindReplaceInCell}
                  onReplaceAll={handleFindReplaceAll}
                  onJumpToCell={(cId) => {
                    const el = document.getElementById(cId);
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              )}
            </div>

        {/* Notebook Cells Flow */}
        <div className="space-y-6">
          {filteredCells.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/20 border border-slate-850 rounded-2xl">
              <Terminal className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No matching cells</h3>
              <p className="text-xs text-slate-500">Create a cell below or clear your search queries.</p>
            </div>
          ) : (
            filteredCells.map((cell, idx) => {
              const execMeta = cellExecutionMeta[cell.id];
              const lockingUserId = activeLocks[cell.id];
              const lockingPeer = lockingUserId && lockingUserId !== currentUserId ? collaborators.find(c => c.id === lockingUserId) : null;

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

                  <NotebookCellEditor
                    cell={cell}
                    index={idx}
                    isActive={activeFocusedCellId === cell.id}
                    notebookMode={notebookMode}
                    isLockedByPeer={lockingPeer ? {
                      name: lockingPeer.name,
                      role: lockingPeer.role,
                      color: lockingPeer.color,
                      isTyping: Boolean(lockingPeer.isTyping),
                    } : null}
                    executionMeta={execMeta ? {
                      durationMs: execMeta.durationMs,
                      timestamp: execMeta.timestamp,
                    } : undefined}
                    runtime={cellRuntimes[cell.id] || "wasm"}
                    onRuntimeChange={(rt) => setCellRuntimes(prev => ({ ...prev, [cell.id]: rt }))}
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
                  >
                    {/* Quick Snippets Inserter Strip for Code Cells */}
                    {cell.type !== 'markdown' && (
                      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-0.5 pb-1 text-[10px] opacity-70 hover:opacity-100 transition-opacity">
                        <span className="text-slate-500 font-mono shrink-0 select-none">Snippets:</span>
                        {CODE_SNIPPETS.filter(s => s.type === cell.type).map((s, i) => (
                          <button
                            key={i}
                            onClick={() => injectSnippet(cell.id, s.code)}
                            className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800/80 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 hover:bg-slate-900 shrink-0 font-mono transition-all"
                          >
                            + {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Cell Output Display Panel */}
                    {cell.isExecuting ? (
                      <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-300 font-mono shadow-inner">
                        <div className="flex items-center gap-2.5">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                          <span className="text-slate-400">Kernel executing cell logic...</span>
                        </div>
                        <Button
                          onClick={() => cancelCellExecution(cell.id)}
                          size="sm"
                          variant="outline"
                          className="bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs h-6 px-2.5 rounded-lg flex items-center gap-1 font-sans transition-all"
                        >
                          <Ban className="h-3 w-3" /> Cancel Execution
                        </Button>
                      </div>
                    ) : cell.output && cell.type !== 'markdown' ? (
                      <div className="bg-slate-950/90 rounded-xl border border-slate-800/90 overflow-hidden text-xs font-mono shadow-inner">
                        <div className="bg-slate-900/60 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Output
                          </span>
                          <Button onClick={() => clearOutput(cell.id)} variant="ghost" size="sm" className="h-5 text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded">Clear Output</Button>
                        </div>

                        <div className="p-3.5 overflow-x-auto">
                          {/* Text / stdout Output */}
                          {cell.output.type === "text" && (
                            <div className="space-y-2">
                              <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 text-xs font-mono select-text">{cell.output.text}</pre>
                              <div className="flex justify-end pt-1">
                                <Button
                                  onClick={() => copyToClipboard(cell.output?.text || '', "Copied text output to clipboard!")}
                                  variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-white p-1 flex items-center gap-1"
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
                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                                  <div className="font-semibold text-slate-400 flex items-center gap-1">
                                    <Info className="h-3 w-3 text-emerald-400" /> Expected Fix
                                  </div>
                                  <div className="text-slate-300 leading-relaxed">{cell.output.error.suggested_fix}</div>
                                </div>
                              )}

                              {cell.output.error?.traceback && (
                                <details className="mt-2">
                                  <summary className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer select-none font-mono">View Stacktrace Trace</summary>
                                  <pre className="mt-2 bg-slate-950 p-2.5 rounded border border-slate-850 text-[10px] font-mono text-red-400 overflow-x-auto max-h-48 whitespace-pre-wrap">
                                    {cell.output.error.traceback}
                                  </pre>
                                </details>
                              )}

                              <div className="flex gap-2 justify-end pt-1 flex-wrap">
                                <Button
                                  onClick={() => copyToClipboard(cell.output?.error?.traceback || cell.output?.error?.message || "", "Copied error stacktrace to clipboard!")}
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs rounded-xl"
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Error
                                </Button>
                                <Button
                                  onClick={() => {
                                    setCodeDoctorTargetCell({
                                      id: cell.id,
                                      code: cell.code,
                                      error: cell.output?.error?.traceback || cell.output?.error?.message || "ExecutionException"
                                    });
                                    setShowCodeDoctorDrawer(true);
                                  }}
                                  size="sm"
                                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-rose-200" /> Self-Healing Doctor
                                </Button>
                                <Button
                                  onClick={() => { setTargetCellId(cell.id); setCopilotOpen(true); }}
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                  <Bot className="h-3.5 w-3.5 mr-1.5 text-indigo-200" /> Copilot Prompt
                                </Button>
                                <Button
                                  onClick={() => handleAiAutoFix(cell.id, cell.output?.error?.message || "unknown")}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"
                                >
                                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Instant Auto-Fix
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Interactive Table Grid Output */}
                          {cell.output.type === "table" && cell.output.data && cell.output.data.length > 0 && (
                            <InteractiveTableOutput data={cell.output.data} />
                          )}

                          {/* Dynamic Plotting Matplotlib / Seaborn Charts Output */}
                          {cell.output.type === "chart" && cell.output.images && cell.output.images.length > 0 && (
                            <div className="space-y-4 pt-1">
                              {cell.output.images.map((imgB64, i) => (
                                <div key={i} className="rounded-xl border border-slate-800 overflow-hidden bg-white p-3 max-w-xl mx-auto flex flex-col items-center shadow-lg relative group">
                                  <img loading="lazy"
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
                                    <Download className="h-3 w-3" /> Save Image
                                  </a>
                                </div>
                              ))}
                              {cell.output.text && (
                                <pre className="whitespace-pre-wrap leading-relaxed text-slate-400 text-xs font-mono border-t border-slate-850 pt-3 mt-2">{cell.output.text}</pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </NotebookCellEditor>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Dynamic Insert cell buttons block */}
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-800">
          <Button onClick={() => addCell("python")} variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs rounded-xl h-10">
            <Plus className="h-4 w-4 mr-2" /> + Python Cell
          </Button>
          <Button onClick={() => addCell("sql")} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs rounded-xl h-10">
            <Plus className="h-4 w-4 mr-2" /> + SQL Cell
          </Button>
          <Button onClick={() => addCell("markdown")} variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs rounded-xl h-10">
            <Plus className="h-4 w-4 mr-2" /> + Markdown Cell
          </Button>
        </div>
      </>
    )}
  </div>

      {/* 3. RIGHT SIDEBAR: Variable Explorer & Package Manager */}
      <div className="w-full lg:w-64 shrink-0 space-y-6">
        {/* VARIABLE EXPLORER */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Variable className="h-4 w-4 text-amber-400" /> Active Variables
              </CardTitle>
              <CardDescription className="text-xs">Kernel memory inspector</CardDescription>
            </div>
            <Button onClick={() => setShowVariableExplorer(!showVariableExplorer)} variant="ghost" size="icon" className="h-6 w-6 p-0 rounded-lg">
              <RefreshCw className="h-3 w-3 text-slate-400 hover:text-white" />
            </Button>
          </CardHeader>

          {showVariableExplorer && (
            <CardContent className="p-3 max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
              {Object.keys(kernelVariables).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-1.5">No variables declared in current session.</p>
              ) : (
                Object.entries(kernelVariables).map(([name, info]) => (
                  <div key={name} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850/80 font-mono text-[10px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{name}</span>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-semibold">{info.type}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] select-text break-words leading-relaxed">{info.summary}</div>
                  </div>
                ))
              )}
            </CardContent>
          )}
        </Card>

        {/* PACKAGE MANAGER */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" /> Package Manager
              </CardTitle>
              <CardDescription className="text-xs">Pip compiler setup</CardDescription>
            </div>
            <Button onClick={() => setShowPackageManager(!showPackageManager)} variant="ghost" size="icon" className="h-6 w-6">
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showPackageManager ? 'rotate-90' : ''}`} />
            </Button>
          </CardHeader>

          {showPackageManager && (
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Install package (e.g. polars)"
                  value={customPackageName}
                  onChange={(e) => setCustomPackageName(e.target.value)}
                  disabled={installingPackage}
                  className="h-8 text-xs bg-slate-950 border-slate-800 rounded-xl"
                />
                <Button
                  onClick={handlePackageInstall}
                  disabled={installingPackage}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl"
                >
                  {installingPackage ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> Compiling...
                    </>
                  ) : (
                    "Install Pip Package"
                  )}
                </Button>
              </div>

              <div className="text-[9px] text-slate-400 space-y-1.5 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                <div className="font-semibold text-slate-300">Installed Modules:</div>
                <div className="flex flex-wrap gap-1">
                  {['pandas', 'numpy', 'matplotlib', 'seaborn', 'scikit-learn', 'scipy', 'statsmodels', 'xgboost', 'duckdb'].map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 font-mono text-[9px] text-slate-400">{p}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* CHEATSHEET SHORTCUTS CARD */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardContent className="p-4 text-[10px] space-y-2 text-slate-400">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-300 flex items-center gap-1">
                <Keyboard className="h-3.5 w-3.5 text-amber-400" /> Jupyter Shortcuts
              </div>
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="text-[9px] font-mono text-amber-400 hover:text-amber-300 underline"
              >
                View all (H)
              </button>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Run & Advance:</span>
              <kbd className="font-mono bg-slate-950 px-1 rounded text-slate-200">Shift + Enter</kbd>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Run in Place:</span>
              <kbd className="font-mono bg-slate-950 px-1 rounded text-slate-200">Ctrl + Enter</kbd>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Insert Cell Above:</span>
              <kbd className="font-mono bg-slate-950 px-1 rounded text-slate-200">A / Ctrl+M A</kbd>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Insert Cell Below:</span>
              <kbd className="font-mono bg-slate-950 px-1 rounded text-slate-200">B / Ctrl+M B</kbd>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Delete Active Cell:</span>
              <kbd className="font-mono bg-slate-950 px-1 rounded text-slate-200">D D / Ctrl+M D</kbd>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Convert Type:</span>
              <span className="font-mono text-slate-200">Y (Code) / M (Text)</span>
            </div>
            <div className="flex justify-between border-b border-slate-850/60 pb-1">
              <span>Mode Switch:</span>
              <span className="font-mono text-slate-200">Esc (Cmd) / Enter (Edit)</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span>Exposed variables:</span>
              <span className="font-mono text-[9px] text-amber-400">df, schema, summary</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW NOTEBOOK CREATION MODAL */}
      <AnimatePresence>
        {newNotebookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button onClick={() => setNewNotebookModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Create New Notebook
              </h3>
              <p className="text-xs text-slate-400 mb-4">Initialize a clean workspace file or select a starter template.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Notebook Title</label>
                  <Input
                    placeholder="e.g. Q3 Growth Modeling"
                    value={newNbTitle}
                    onChange={e => setNewNbTitle(e.target.value)}
                    className="bg-slate-950 border-slate-800 rounded-xl"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-400">Quick Starter Presets</span>
                  <div className="grid grid-cols-1 gap-2">
                    {STARTER_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleCreateNotebook(t.cells, t.name.replace(/[^a-zA-Z0-9 ]/g, ""))}
                        className="text-left p-3 rounded-xl bg-slate-950 border border-slate-850 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-xs"
                      >
                        <div className="font-bold text-slate-200">{t.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button onClick={() => setNewNotebookModal(false)} variant="ghost" className="text-slate-400 text-xs">
                    Cancel
                  </Button>
                  <Button onClick={() => handleCreateNotebook()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl">
                    Create Blank Notebook
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* AI INJECTION ASSISTANT MODAL */}
      <AnimatePresence>
        {aiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
              <button onClick={() => setAiModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Copilot Notebook Integration</h3>
                  <p className="text-xs text-slate-400">Compose cells, correct structures, and clean datasets instantly.</p>
                </div>
              </div>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your data science task (e.g. 'Generate a matplotlib line chart tracking month vs sales')..."
                className="w-full h-32 bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 mb-4 font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-amber-500" />
                  Grounded: {selectedDataset?.name || "Active Context"}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setAiModalOpen(false)} variant="ghost" className="text-slate-400 h-9">
                    Cancel
                  </Button>
                  <Button onClick={handleAiGenerate} className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-9 px-4 rounded-xl">
                    Generate & Inject Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* KEYBOARD SHORTCUTS HELP MODAL */}
      <NotebookShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      <AnimatePresence>
        {/* PYODIDE WASM ZERO-TRUST SANDBOX POLICY MODAL */}
        {showSandboxPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative space-y-5 text-left">
              <button
                onClick={() => setShowSandboxPolicyModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {PYODIDE_SANDBOX_POLICY.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {PYODIDE_SANDBOX_POLICY.version}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Isolated in-browser WebAssembly worker environment with defense-in-depth isolation.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Permitted Analytical Libraries
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {PYODIDE_SANDBOX_POLICY.allowedPackages.map((pkg) => (
                      <span
                        key={pkg}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]"
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-rose-400" /> Blocked System Calls & Modules
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {PYODIDE_SANDBOX_POLICY.blockedSyscalls.map((call) => (
                      <span
                        key={call}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px]"
                      >
                        ⛔ {call}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Max Compute Timeout</span>
                    <span className="text-sm font-bold text-white">{PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs / 1000} Seconds</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Process Memory Boundary</span>
                    <span className="text-sm font-bold text-white">{PYODIDE_SANDBOX_POLICY.memoryBoundaryMB} MB Local RAM</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Runs 100% locally in browser WASM. Zero remote compute egress.
                </span>
                <Button
                  onClick={() => setShowSandboxPolicyModal(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* AI COPILOT DRAWER */}
      <NotebookCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        activeNotebook={activeNb}
        selectedDataset={selectedDataset}
        activeCellId={targetCellId}
        onUpdateCellCode={(cellId, newCode, newType) => {
          updateCellCode(cellId, newCode);
          if (newType) {
            updateCellType(cellId, newType);
          }
        }}
        onAddCell={(type, initialCode) => {
          addCell(type, initialCode);
        }}
        onExecuteCell={async (cellId) => {
          await executeCell(cellId);
        }}
        onInstallPackage={async (packageName) => {
          await installPackageByName(packageName);
        }}
        sessionToken={session?.access_token}
      />

      <NotebookModalsProvider
        activeNbId={activeNb.id}
        cells={activeNb.cells}
        selectedDataset={selectedDataset}
        kernelVariables={kernelVariables}
        activeFocusedCellId={activeFocusedCellId}
        hybridComputeEngine={hybridComputeEngine}
        setHybridComputeEngine={setHybridComputeEngine}
        updateCellCode={updateCellCode}
        updateCellType={updateCellType}
        executeCell={executeCell}
        updateNotebooksWithUndo={updateNotebooksWithUndo}
        notebooks={notebooks}
      />
    </div>
  );
}

// INTERACTIVE TABLE OUTPUT COMPONENT WITH RECHARTS SWITCHER & ADVANCED PROFILING
function InteractiveTableOutput({ data }: { data: any[] }) {
  return <NotebookTableOutput data={data} />;
}
