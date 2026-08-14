import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Cell {
  id: string;
  type: "python" | "sql" | "markdown";
  code: string;
  output?: {
    type: "table" | "chart" | "text" | "markdown" | "error";
    data?: any;
    text?: string;
    images?: string[]; // Array of base64 PNG strings
    error?: {
      error_class: string;
      message: string;
      line_number: number | null;
      suggested_fix: string;
      traceback?: string;
    };
  };
  isExecuting?: boolean;
  collapsed?: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  cells: Cell[];
  updatedAt: string;
}

export interface VariableInfo {
  type: string;
  summary: string;
}

interface WorkspaceState {
  selectedWorkspaceId: string;
  selectedProjectId: string;
  selectedDatasetId: string;
  selectedDataset: any | null;
  datasetProfile: any | null;
  activeDatasetRows: any[];
  
  // Notebooks
  notebooks: Notebook[];
  activeNbId: string;
  kernelVariables: Record<string, VariableInfo>;
  kernelStatus: "Idle" | "Busy";
  
  // Actions
  setSelectedWorkspaceId: (id: string) => void;
  setSelectedProjectId: (id: string) => void;
  setSelectedDatasetId: (id: string) => void;
  setSelectedDataset: (dataset: any | null) => void;
  setDatasetProfile: (profile: any | null) => void;
  setActiveDatasetRows: (rows: any[]) => void;
  
  setNotebooks: (notebooks: Notebook[] | ((prev: Notebook[]) => Notebook[])) => void;
  setActiveNbId: (id: string) => void;
  setKernelVariables: (vars: Record<string, VariableInfo>) => void;
  setKernelStatus: (status: "Idle" | "Busy") => void;
}

const DEFAULT_NOTEBOOKS: Notebook[] = [
  {
    id: "nb-1",
    name: "Customer Revenue & Churn Analysis",
    updatedAt: "Just now",
    cells: [
      {
        id: "c-1",
        type: "markdown",
        code: "# Executive Revenue & Cohort Analysis\n*Analyzes quarterly recurring revenue (ARR), subscriber churn, and customer lifetime value (LTV) using workspace datasets.*"
      },
      {
        id: "c-2",
        type: "python",
        code: `import pandas as pd
import numpy as np

# Load dataset automatically exposed by kernel
if df is not None:
    print(f"Loaded DataFrame: {df.shape[0]} rows, {df.shape[1]} columns")
    print("Columns available:", list(df.columns))
    print(df.head())
else:
    print("No dataset is currently selected.")`
      },
      {
        id: "c-3",
        type: "sql",
        code: `SELECT Segment, COUNT(*) as Count, AVG(Sales) as Avg_Sales \nFROM dataset \nGROUP BY Segment;`
      }
    ]
  }
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedWorkspaceId: "all",
      selectedProjectId: "all",
      selectedDatasetId: "",
      selectedDataset: null,
      datasetProfile: null,
      activeDatasetRows: [],
      
      notebooks: DEFAULT_NOTEBOOKS,
      activeNbId: DEFAULT_NOTEBOOKS[0]?.id || "nb-1",
      kernelVariables: {
        "df": { type: "DataFrame", summary: "Loaded Dataset Frame" },
        "metadata": { type: "dict", summary: "Dataset Metadata" },
        "schema": { type: "dict", summary: "Schema Definition" },
        "summary": { type: "dict", summary: "Statistical Summary" },
        "column_info": { type: "dict", summary: "Detailed Column Meta" }
      },
      kernelStatus: "Idle",

      setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
      setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),
      setDatasetProfile: (profile) => set({ datasetProfile: profile }),
      setActiveDatasetRows: (rows) => set({ activeDatasetRows: rows }),

      setNotebooks: (notebooksUpdate) => set((state) => {
        const updated = typeof notebooksUpdate === "function" ? notebooksUpdate(state.notebooks) : notebooksUpdate;
        return { notebooks: updated };
      }),
      setActiveNbId: (id) => set({ activeNbId: id }),
      setKernelVariables: (vars) => set({ kernelVariables: vars }),
      setKernelStatus: (status) => set({ kernelStatus: status })
    }),
    {
      name: "vivexa-workspace-storage",
      partialize: (state) => ({
        selectedWorkspaceId: state.selectedWorkspaceId,
        selectedProjectId: state.selectedProjectId,
        selectedDatasetId: state.selectedDatasetId,
        notebooks: state.notebooks,
        activeNbId: state.activeNbId,
      }), // Persist notebooks and IDs
    }
  )
);
