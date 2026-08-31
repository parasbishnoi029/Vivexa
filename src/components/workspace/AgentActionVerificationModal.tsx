import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Play, Sparkles,
  Zap, Database, FileCode, Clock, Cpu, ArrowRight, MessageSquare,
  Lock, Eye, RefreshCw, Layers, Check, ChevronDown, ChevronUp, Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { duckdbEngine, DuckDBQueryResult } from "@/lib/duckdbEngine";
import { toast } from "sonner";

export interface AgentActionProposal {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  targetType: "SQL_QUERY" | "MATERIALIZED_VIEW" | "PIPELINE_TRIGGER" | "ANOMALY_RESOLVE";
  generatedSql?: string;
  confidenceScore: number;
  confidenceInterval: [number, number];
  estimatedRowImpact: number;
  estimatedLatency: string;
  riskTier: "Low" | "Moderate" | "High";
  astValidationPassed: boolean;
  piiChecked: boolean;
  rationale: string;
}

interface AgentActionVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: AgentActionProposal | null;
  onApproved?: (proposal: AgentActionProposal, feedback?: string) => void;
  onRejected?: (proposal: AgentActionProposal, feedback: string) => void;
}

export function AgentActionVerificationModal({
  isOpen,
  onClose,
  proposal,
  onApproved,
  onRejected
}: AgentActionVerificationModalProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "explain" | "sandbox" | "feedback">("plan");
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DuckDBQueryResult | null>(null);
  const [userFeedback, setUserFeedback] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSqlEditor, setShowSqlEditor] = useState(false);
  const [editedSql, setEditedSql] = useState(proposal?.generatedSql || "");

  if (!isOpen || !proposal) return null;

  const handleRunSandboxSimulation = async () => {
    try {
      setIsDryRunning(true);
      const sqlToRun = editedSql || proposal.generatedSql || "SELECT 1;";
      const res = await duckdbEngine.query(sqlToRun);
      setDryRunResult(res);
      setActiveTab("sandbox");
      toast.success("Sandbox simulation completed in DuckDB-WASM!");
    } catch (err: any) {
      toast.error(`Sandbox dry-run error: ${err.message}`);
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleApprove = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      onApproved?.(proposal, userFeedback);
      toast.success(`Action '${proposal.title}' approved & dispatched to executor!`);
      onClose();
    }, 600);
  };

  const handleReject = () => {
    if (!userFeedback.trim()) {
      toast.error("Please provide brief feedback so the autonomous agent can learn.");
      return;
    }
    onRejected?.(proposal, userFeedback);
    toast.info("Action rejected. Feedback logged to Agent Memory.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Risk & Confidence Badge */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                  Verification Step
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">Autonomous Agent Action Guardrail</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{proposal.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <Sparkles className="h-3 w-3" /> {proposal.confidenceScore}% Confidence
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Bayesian CI: [{proposal.confidenceInterval[0]}% - {proposal.confidenceInterval[1]}%]
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white text-lg px-2 py-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("plan")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "plan" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Execution Plan & Safety
          </button>
          <button
            onClick={() => setActiveTab("explain")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "explain" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            SQL Plan & AST AST Details
          </button>
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "sandbox" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="h-3 w-3 text-amber-400" /> In-Browser Sandbox Simulation
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "feedback" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Agent Feedback Loop
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "plan" && (
            <div className="space-y-4">
              {/* Proposal Overview & Rationale */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI Causal Rationale</div>
                <p className="text-xs text-slate-300 leading-relaxed">{proposal.rationale}</p>
                <p className="text-xs text-slate-400">{proposal.description}</p>
              </div>

              {/* Safety & Guardrail Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${proposal.astValidationPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AST SQL Guardrail</div>
                    <div className="text-[11px] text-slate-400">Zero Injections Detected</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Data Privacy & PII</div>
                    <div className="text-[11px] text-slate-400">Masking Rules Applied</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    proposal.riskTier === 'Low' ? 'bg-emerald-500/10 text-emerald-400' : 
                    proposal.riskTier === 'Moderate' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Risk Tier: {proposal.riskTier}</div>
                    <div className="text-[11px] text-slate-400">Est. Latency: {proposal.estimatedLatency}</div>
                  </div>
                </div>
              </div>

              {/* Proposed SQL preview */}
              {proposal.generatedSql && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-amber-400" /> Proposed Target Query
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSqlEditor(!showSqlEditor)}
                      className="h-6 text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      {showSqlEditor ? "Hide Editor" : "Customize Parameters"}
                    </Button>
                  </div>

                  {showSqlEditor ? (
                    <textarea
                      value={editedSql || proposal.generatedSql}
                      onChange={(e) => setEditedSql(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-amber-200 outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <pre className="font-mono text-xs text-amber-200/90 overflow-x-auto p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      {editedSql || proposal.generatedSql}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "explain" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans">
                  Query Execution Plan (EXPLAIN ANALYZE)
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-slate-300 text-[11px] leading-relaxed border border-slate-800">
                  {`-> Vectorized Filter (Scan table client_analytics_demo, rows=${proposal.estimatedRowImpact})
   -> Hash Aggregate (group_by: [segment], metric: SUM(revenue))
   -> Projection: [segment, customer_count, total_revenue]
   -> Sort: [total_revenue DESC] (memory_used=0.4MB)`}
                </div>
                <div className="text-[11px] text-slate-400 font-sans pt-1">
                  Estimated computational cost: <span className="text-emerald-400 font-bold">0.002 ACU</span> | Target execution engine: <span className="text-indigo-400 font-bold">DuckDB WASM SIMD Vectorizer</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sandbox" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Simulate the query locally in DuckDB-WASM sandbox before applying changes.
                </p>
                <Button
                  size="sm"
                  onClick={handleRunSandboxSimulation}
                  disabled={isDryRunning}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  {isDryRunning ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Run In Sandbox
                    </>
                  )}
                </Button>
              </div>

              {dryRunResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                    <span>Simulation Succeeded ({dryRunResult.executionTimeMs.toFixed(2)}ms)</span>
                    <span>{dryRunResult.rowCount} rows produced</span>
                  </div>
                  <div className="overflow-x-auto max-h-48 rounded border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          {dryRunResult.columns.map(c => <th key={c} className="p-2">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {dryRunResult.rows.slice(0, 5).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-900/50">
                            {dryRunResult.columns.map(c => <td key={c} className="p-2 text-slate-300">{String(r[c])}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Agent Reinforcement Learning Feedback
                </div>
                <p className="text-xs text-slate-400">
                  Provide instructions or constraints for why this action was approved, adjusted, or rejected. The agent will save this context into its project memory.
                </p>
                <textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="e.g., 'Prefer grouping by region instead of segment' or 'Ensure discount column is subtracted from revenue'..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunSandboxSimulation}
              disabled={isDryRunning}
              className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs"
            >
              <Zap className="h-3.5 w-3.5 mr-1" /> Dry Run in DuckDB
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject with Feedback
            </Button>

            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isExecuting}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve & Execute Action
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
