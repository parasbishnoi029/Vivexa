import React from "react";
import { useNotebookModalStore } from "@/stores/notebookModalStore";
import { SIEMForwarderModal } from "./SIEMForwarderModal";
import { SemanticMemoryRAGModal } from "./SemanticMemoryRAGModal";
import { EnterpriseGovernanceModal } from "./EnterpriseGovernanceModal";
import { CollaborativeCRDTStudio } from "./CollaborativeCRDTStudio";
import { CRDTTimeTravelModal } from "./CRDTTimeTravelModal";
import { MicroVMPodManagerModal } from "./MicroVMPodManagerModal";
import { HybridExecutionGatewayModal, ExecutionEngineType } from "./HybridExecutionGatewayModal";
import { NotebookReactiveDAGModal } from "./NotebookReactiveDAGModal";
import { NotebookCodeDoctorDrawer } from "./NotebookCodeDoctorDrawer";
import { NotebookShortcutsModal } from "./NotebookShortcutsModal";
import { NotebookSnippetsDrawer } from "./NotebookSnippetsDrawer";
import { NotebookVariableInspectorModal } from "./NotebookVariableInspectorModal";
import { Cell } from "@/stores/workspaceStore";
import { toast } from "sonner";
import { ShieldCheck, Lock, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotebookModalsProviderProps {
  activeNbId: string;
  cells: Cell[];
  selectedDataset: any;
  kernelVariables: Record<string, any>;
  activeFocusedCellId: string | null;
  hybridComputeEngine: ExecutionEngineType;
  setHybridComputeEngine: (engine: ExecutionEngineType) => void;
  updateCellCode: (cellId: string, code: string) => void;
  updateCellType: (cellId: string, type: "python" | "sql" | "markdown") => void;
  executeCell: (cellId: string) => Promise<void>;
  updateNotebooksWithUndo: (newNbs: any[]) => void;
  notebooks: any[];
}

export function NotebookModalsProvider({
  activeNbId,
  cells,
  selectedDataset,
  kernelVariables,
  activeFocusedCellId,
  hybridComputeEngine,
  setHybridComputeEngine,
  updateCellCode,
  updateCellType,
  executeCell,
  updateNotebooksWithUndo,
  notebooks,
}: NotebookModalsProviderProps) {
  const modalStore = useNotebookModalStore();

  return (
    <>
      {/* Keyboard Shortcuts Modal */}
      <NotebookShortcutsModal
        isOpen={modalStore.showKeyboardShortcuts}
        onClose={() => modalStore.closeModal("showKeyboardShortcuts")}
      />

      {/* WASM Zero-Trust Policy Modal */}
      {modalStore.showSandboxPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative space-y-5 text-left">
            <button
              onClick={() => modalStore.closeModal("showSandboxPolicyModal")}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pyodide WASM Zero-Trust Execution Sandbox</h3>
                <p className="text-xs text-slate-400 font-mono">Isolated WebAssembly Runtime Security Policy</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 font-mono leading-relaxed">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Blocked: Network sockets (`socket`, `urllib`), subprocess spawns, and filesystem write access.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Allowed: Vectorized NumPy, Pandas, SciPy, Matplotlib, and DuckDB in-memory aggregations.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => modalStore.closeModal("showSandboxPolicyModal")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                Acknowledge Security Policy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CRDT Collaborative Studio */}
      <CollaborativeCRDTStudio
        isOpen={modalStore.showCRDTStudioModal}
        onClose={() => modalStore.closeModal("showCRDTStudioModal")}
        notebookTitle={activeNbId}
        cells={cells}
      />

      {/* CRDT Write-Ahead Log Time Travel Modal */}
      <CRDTTimeTravelModal
        isOpen={modalStore.showTimeTravelModal}
        onClose={() => modalStore.closeModal("showTimeTravelModal")}
        docId={`notebook-${activeNbId}`}
        onRollback={(restoredState) => {
          if (restoredState && restoredState.cells) {
            updateNotebooksWithUndo(
              notebooks.map((nb) => (nb.id === activeNbId ? { ...nb, cells: restoredState.cells } : nb))
            );
            toast.success("Successfully rolled back notebook state from CRDT Write-Ahead Log!");
          }
        }}
      />

      {/* MicroVM Pod Manager Modal */}
      <MicroVMPodManagerModal
        isOpen={modalStore.showMicroVMModal}
        onClose={() => modalStore.closeModal("showMicroVMModal")}
      />

      {/* Data Science Recipes / Snippets Drawer */}
      <NotebookSnippetsDrawer
        isOpen={modalStore.showSnippetsDrawer}
        onClose={() => modalStore.closeModal("showSnippetsDrawer")}
        onInjectSnippet={(code, type) => {
          if (activeFocusedCellId) {
            updateCellCode(activeFocusedCellId, code);
            updateCellType(activeFocusedCellId, type);
          } else if (cells.length > 0) {
            updateCellCode(cells[0].id, code);
            updateCellType(cells[0].id, type);
          }
        }}
        onAddSnippetAsCell={(code, type) => {
          if (activeFocusedCellId) {
            updateCellCode(activeFocusedCellId, code);
            updateCellType(activeFocusedCellId, type);
          } else if (cells.length > 0) {
            updateCellCode(cells[0].id, code);
            updateCellType(cells[0].id, type);
          }
        }}
      />

      {/* Kernel Variable Inspector */}
      <NotebookVariableInspectorModal
        isOpen={modalStore.showVariableInspectorModal}
        onClose={() => modalStore.closeModal("showVariableInspectorModal")}
        variables={kernelVariables}
        selectedDataset={selectedDataset}
      />

      {/* Hybrid Execution Gateway Modal */}
      <HybridExecutionGatewayModal
        isOpen={modalStore.showHybridComputeModal}
        onClose={() => modalStore.closeModal("showHybridComputeModal")}
        currentEngine={hybridComputeEngine}
        onSelectEngine={(engine) => {
          setHybridComputeEngine(engine);
          toast.success(`Active compute route switched to ${engine.toUpperCase()}`);
        }}
        datasetSizeMb={(selectedDataset as any)?.size_bytes ? (selectedDataset as any).size_bytes / (1024 * 1024) : 142.5}
        activeDatasetName={selectedDataset?.name || "Active In-Memory DataFrame"}
      />

      {/* Reactive DAG Lineage Modal */}
      <NotebookReactiveDAGModal
        isOpen={modalStore.showReactiveDAGModal}
        onClose={() => modalStore.closeModal("showReactiveDAGModal")}
        cells={cells}
        onExecuteCell={(cellId) => {
          executeCell(cellId);
        }}
        onCascadeRun={(cellIds) => {
          (async () => {
            for (const cId of cellIds) {
              await executeCell(cId);
            }
          })();
        }}
      />

      {/* Enterprise Governance & RBAC Modal */}
      <EnterpriseGovernanceModal
        isOpen={modalStore.showEnterpriseGovernanceModal}
        onClose={() => modalStore.closeModal("showEnterpriseGovernanceModal")}
        userRole="Lead Data Scientist"
        onOpenSiem={() => {
          modalStore.closeModal("showEnterpriseGovernanceModal");
          modalStore.openModal("showSIEMModal");
        }}
        activeDatasetColumns={
          (selectedDataset as any)?.columns?.map((c: any) => (typeof c === "string" ? c : c.name)) || [
            "user_id",
            "full_name",
            "email_address",
            "credit_card_hash",
            "salary_usd",
            "revenue_q3",
            "country_code",
          ]
        }
      />

      {/* SIEM Forwarder Modal */}
      <SIEMForwarderModal
        isOpen={modalStore.showSIEMModal}
        onClose={() => modalStore.closeModal("showSIEMModal")}
      />

      {/* Semantic Memory & Organizational RAG Modal */}
      <SemanticMemoryRAGModal
        isOpen={modalStore.showSemanticRAGModal}
        onClose={() => modalStore.closeModal("showSemanticRAGModal")}
        onInsertSqlToActiveCell={(sql) => {
          if (modalStore.targetCellId) {
            updateCellCode(modalStore.targetCellId, sql);
            updateCellType(modalStore.targetCellId, "sql");
          } else if (cells.length > 0) {
            updateCellCode(cells[0].id, sql);
            updateCellType(cells[0].id, "sql");
          }
        }}
      />

      {/* Self-Healing Code Doctor Drawer */}
      {modalStore.doctorErrorDetails && (
        <NotebookCodeDoctorDrawer
          isOpen={modalStore.showCodeDoctorDrawer}
          onClose={() => modalStore.closeModal("showCodeDoctorDrawer")}
          cellId={modalStore.doctorErrorDetails.cellId}
          errorTraceback={modalStore.doctorErrorDetails.traceback || modalStore.doctorErrorDetails.message}
          currentCode={modalStore.doctorErrorDetails.code}
          onApplyFixAndRerun={(cellId, patchedCode) => {
            updateCellCode(cellId, patchedCode);
            executeCell(cellId);
            toast.success("Applied doctor remediation & re-executed cell!");
          }}
        />
      )}
    </>
  );
}
