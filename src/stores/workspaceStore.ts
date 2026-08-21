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

export interface PinnedItem {
  id: string;
  title: string;
  type: "project" | "dataset" | "report" | "kpi";
  path: string;
  pinnedAt: string;
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
  
  // Pinned Items
  pinnedItems: PinnedItem[];
  
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
  
  pinItem: (item: PinnedItem) => void;
  unpinItem: (id: string) => void;
  togglePinItem: (item: PinnedItem) => void;
  
  setNotebooks: (notebooks: Notebook[] | ((prev: Notebook[]) => Notebook[])) => void;
  setActiveNbId: (id: string) => void;
  setKernelVariables: (vars: Record<string, VariableInfo>) => void;
  setKernelStatus: (status: "Idle" | "Busy") => void;
}

const DEFAULT_NOTEBOOKS: Notebook[] = [];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedWorkspaceId: "all",
      selectedProjectId: "all",
      selectedDatasetId: "",
      selectedDataset: null,
      datasetProfile: null,
      activeDatasetRows: [],
      pinnedItems: [],
      
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

      pinItem: (item) => set((state) => {
        if (state.pinnedItems.some(p => p.id === item.id)) return state;
        return { pinnedItems: [item, ...state.pinnedItems] };
      }),
      unpinItem: (id) => set((state) => ({
        pinnedItems: state.pinnedItems.filter(p => p.id !== id)
      })),
      togglePinItem: (item) => set((state) => {
        const exists = state.pinnedItems.some(p => p.id === item.id);
        if (exists) {
          return { pinnedItems: state.pinnedItems.filter(p => p.id !== item.id) };
        }
        return { pinnedItems: [item, ...state.pinnedItems] };
      }),

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
        pinnedItems: state.pinnedItems,
        notebooks: state.notebooks,
        activeNbId: state.activeNbId,
      }), // Persist notebooks and IDs
    }
  )
);
