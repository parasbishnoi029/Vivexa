import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History, Clock, RotateCcw, X, CheckCircle2, ChevronRight,
  Database, GitCommit, Check, AlertCircle, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { crdtEngine } from "@/lib/crdtSync";
import { toast } from "sonner";

interface CRDTTimeTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId?: string;
  onRollback?: (restoredState: any) => void;
}

export function CRDTTimeTravelModal({ isOpen, onClose, docId, onRollback }: CRDTTimeTravelModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [previewState, setPreviewState] = useState<Record<string, any>>({});
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const items = await crdtEngine.fetchWALHistory();
      if (items.length > 0) {
        setHistory(items);
        setSelectedRevision(items[0]);
        loadStatePreview(items[0].timestamp);
      }
    } catch (e) {
      console.warn("Failed to load WAL history:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadStatePreview = async (timestamp: number) => {
    const state = await crdtEngine.timeTravelTo(timestamp);
    setPreviewState(state);
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleSelectRevision = (rev: any) => {
    setSelectedRevision(rev);
    loadStatePreview(rev.timestamp);
  };

  const handleRollback = async () => {
    if (!selectedRevision) return;
    setIsRollingBack(true);
    try {
      const success = await crdtEngine.rollbackTo(selectedRevision.timestamp);
      if (success) {
        if (onRollback) {
          onRollback(previewState);
        }
        toast.success(`Restored canvas state to Revision #${selectedRevision.sequenceNumber}`);
        onClose();
      } else {
        toast.error("Rollback failed");
      }
    } catch (e) {
      toast.error("Error executing state rollback");
    } finally {
      setIsRollingBack(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>CRDT Write-Ahead Log (WAL) Time Travel</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Deterministic Replay
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Scrub across immutable mutation history, inspect point-in-time diffs, and restore previous states.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Two Column Revision List & Snapshot Inspector */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Left: Revisions Timeline */}
            <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mutation Stream ({history.length})
                </span>
                <button
                  onClick={fetchHistory}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" /> Refresh
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No previous CRDT revisions recorded in current session.
                </div>
              ) : (
                history.map((rev) => {
                  const isSelected = selectedRevision?.sequenceNumber === rev.sequenceNumber;
                  return (
                    <div
                      key={rev.sequenceNumber}
                      onClick={() => handleSelectRevision(rev)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                        isSelected
                          ? "bg-indigo-600/15 border-indigo-500/50 text-indigo-200"
                          : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                          Seq #{rev.sequenceNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(rev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{rev.summary}</p>
                      <div className="text-[10px] text-slate-500 font-mono">Author: {rev.clientId}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Point-in-Time State Preview */}
            <div className="p-4 overflow-y-auto max-h-[55vh] flex flex-col justify-between space-y-4 bg-slate-950/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Reconstructed State Snapshot
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {Object.keys(previewState).length} Keys Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-300 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(previewState, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Target Timestamp:{" "}
                  <strong className="text-slate-200">
                    {selectedRevision ? new Date(selectedRevision.timestamp).toLocaleString() : "Latest"}
                  </strong>
                </span>
                <Button
                  onClick={handleRollback}
                  disabled={isRollingBack || !selectedRevision}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? "animate-spin" : ""}`} />
                  {isRollingBack ? "Rolling Back..." : "Restore This Version"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
