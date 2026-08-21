import { create } from "zustand";

export interface DoctorErrorDetails {
  cellId: string;
  errorClass: string;
  message: string;
  line: number | null;
  code: string;
  traceback?: string;
  suggestedFix?: string;
}

interface NotebookModalState {
  showSandboxPolicyModal: boolean;
  showVariableExplorer: boolean;
  showPackageManager: boolean;
  showKeyboardShortcuts: boolean;
  showFindReplace: boolean;
  showSnippetsDrawer: boolean;
  showVariableInspectorModal: boolean;
  showTimeTravelModal: boolean;
  showMicroVMModal: boolean;
  showHybridComputeModal: boolean;
  showReactiveDAGModal: boolean;
  showEnterpriseGovernanceModal: boolean;
  showSIEMModal: boolean;
  showSemanticRAGModal: boolean;
  showCRDTStudioModal: boolean;
  showCodeDoctorDrawer: boolean;
  showDiagnosticsConsole: boolean;
  
  targetCellId: string | null;
  doctorErrorDetails: DoctorErrorDetails | null;

  // Actions
  openModal: (modalKey: keyof Omit<NotebookModalState, "targetCellId" | "doctorErrorDetails" | "openModal" | "closeModal" | "toggleModal" | "setTargetCellId" | "setDoctorErrorDetails">) => void;
  closeModal: (modalKey: keyof Omit<NotebookModalState, "targetCellId" | "doctorErrorDetails" | "openModal" | "closeModal" | "toggleModal" | "setTargetCellId" | "setDoctorErrorDetails">) => void;
  toggleModal: (modalKey: keyof Omit<NotebookModalState, "targetCellId" | "doctorErrorDetails" | "openModal" | "closeModal" | "toggleModal" | "setTargetCellId" | "setDoctorErrorDetails">) => void;
  setTargetCellId: (id: string | null) => void;
  setDoctorErrorDetails: (details: DoctorErrorDetails | null) => void;
}

export const useNotebookModalStore = create<NotebookModalState>((set) => ({
  showSandboxPolicyModal: false,
  showVariableExplorer: true,
  showPackageManager: false,
  showKeyboardShortcuts: false,
  showFindReplace: false,
  showSnippetsDrawer: false,
  showVariableInspectorModal: false,
  showTimeTravelModal: false,
  showMicroVMModal: false,
  showHybridComputeModal: false,
  showReactiveDAGModal: false,
  showEnterpriseGovernanceModal: false,
  showSIEMModal: false,
  showSemanticRAGModal: false,
  showCRDTStudioModal: false,
  showCodeDoctorDrawer: false,
  showDiagnosticsConsole: false,

  targetCellId: null,
  doctorErrorDetails: null,

  openModal: (modalKey) => set({ [modalKey]: true }),
  closeModal: (modalKey) => set({ [modalKey]: false }),
  toggleModal: (modalKey) => set((state) => ({ [modalKey]: !state[modalKey] })),
  setTargetCellId: (id) => set({ targetCellId: id }),
  setDoctorErrorDetails: (details) => set({ doctorErrorDetails: details }),
}));
