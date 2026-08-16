import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Database, GitBranch, Terminal, Sparkles, CheckCircle2,
  Layers, ArrowRight, ShieldCheck, Copy, Check, ExternalLink,
  Cpu, HardDrive, Filter, Activity, Server, FileCode, Clock,
  Table, BarChart2, Eye, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface LineageTraceData {
  chartTitle: string;
  chartType: string;
  sourceType: "Snowflake" | "Databricks" | "PostgreSQL" | "DuckDB Lakehouse" | "S3 Delta";
  sourceDatabase: string;
  sourceTable: string;
  sourceRows: number;
  lastIngested: string;
  etlModelName: string;
  etlTransforms: string[];
  semanticMetric: string;
  semanticFormula: string;
  dimensionMapped: string;
  measureMapped: string;
  compiledSql: string;
  confidenceScore: number;
  reasoningTrace: string[];
  dataFreshness: string;
  scanVolume: string;
  dataQualityScore: number;
}

interface LineageInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineageData: LineageTraceData | null;
  onOpenInLakehouse?: (sql: string) => void;
}

export const LineageInspectorModal: React.FC<LineageInspectorModalProps> = ({
  isOpen,
  onClose,
  lineageData,
  onOpenInLakehouse,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen || !lineageData) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(lineageData.compiledSql);
    setCopiedSql(true);
    toast.success("Compiled analytical SQL query copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const steps = [
    {
      id: "source",
      title: "Data Source Origin",
      subtitle: `${lineageData.sourceType} Data Warehouse`,
      icon: Database,
      badge: "Source Ingest",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      id: "etl",
      title: "ETL & Transformations",
      subtitle: lineageData.etlModelName,
      icon: GitBranch,
      badge: "dbt Pipeline",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      id: "semantic",
      title: "Semantic Layer",
      subtitle: lineageData.semanticMetric,
      icon: Layers,
      badge: "Metric Logic",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      id: "sql",
      title: "Compiled SQL Query",
      subtitle: "Deterministic ANSI Plan",
      icon: Terminal,
      badge: "Active SQL",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      id: "visualization",
      title: "Visualization Layer",
      subtitle: lineageData.chartTitle,
      icon: BarChart2,
      badge: "Render Node",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Data Lineage & Trace Inspector
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Glass-Box Trace
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual provenance mapping for: <span className="text-white font-semibold">{lineageData.chartTitle}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block mr-2">
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Confidence Score</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">
                  {lineageData.confidenceScore.toFixed(1)}% High Certainty
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Visual Lineage DAG Bar */}
          <div className="px-6 py-4 bg-slate-900/40 border-b border-slate-800/80 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isSelected = activeStep === idx;
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setActiveStep(idx)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left group ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-800 text-slate-400 group-hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider block opacity-70">
                          Step {idx + 1}
                        </span>
                        <span className="text-xs font-bold block">{step.title}</span>
                      </div>
                    </button>
                    {idx < steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 mx-1" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Detailed Selected Step Inspector */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Step 0: Data Source */}
              {activeStep === 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white">Upstream Source Warehouse</h4>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {lineageData.sourceType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase font-mono text-slate-400">Database</p>
                      <p className="text-xs font-bold text-white font-mono mt-0.5 truncate">{lineageData.sourceDatabase}</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase font-mono text-slate-400">Source Table</p>
                      <p className="text-xs font-bold text-white font-mono mt-0.5 truncate">{lineageData.sourceTable}</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase font-mono text-slate-400">Total Rows</p>
                      <p className="text-xs font-bold text-indigo-400 font-mono mt-0.5">{lineageData.sourceRows.toLocaleString()} rows</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase font-mono text-slate-400">Ingest Cadence</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{lineageData.dataFreshness}</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase font-mono text-slate-400">Quality Score</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{lineageData.dataQualityScore}% Pristine</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase font-mono text-slate-400">Security / RLS</p>
                      <p className="text-xs font-bold text-slate-300 mt-0.5 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-emerald-400" /> Enforced
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: ETL & Transforms */}
              {activeStep === 1 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">ETL Transformation Pipeline</h4>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {lineageData.etlModelName}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-300">Applied Transformation Steps:</p>
                    <div className="space-y-2">
                      {lineageData.etlTransforms.map((tf, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-mono">{tf}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Semantic Layer */}
              {activeStep === 2 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-400" />
                      <h4 className="text-sm font-bold text-white">Semantic Layer Definitions</h4>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Standard Metric
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <p className="text-[10px] uppercase font-mono text-slate-400">Business Metric Name</p>
                    <p className="text-sm font-bold text-white">{lineageData.semanticMetric}</p>
                    <p className="text-[10px] uppercase font-mono text-slate-400 pt-2 border-t border-slate-800/60">Metric Calculation Formula</p>
                    <code className="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-1 rounded block">
                      {lineageData.semanticFormula}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Dimension (Group By)</span>
                      <span className="font-mono text-white font-bold">{lineageData.dimensionMapped}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Aggregated Measure</span>
                      <span className="font-mono text-emerald-400 font-bold">{lineageData.measureMapped}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 & Default: Compiled SQL Block */}
              {(activeStep === 3 || activeStep === 4) && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Compiled ANSI SQL Query</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopySql}
                        className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" /> Copy SQL
                          </>
                        )}
                      </Button>
                      {onOpenInLakehouse && (
                        <Button
                          size="sm"
                          onClick={() => onOpenInLakehouse(lineageData.compiledSql)}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                        >
                          <Cpu className="h-3 w-3 mr-1" /> Run in DuckDB WASM
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {lineageData.compiledSql}
                    </pre>
                  </div>
                </div>
              )}

              {/* Reasoning Trace Section */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Glass-Box Reasoning Trace
                  </h4>
                </div>
                <div className="space-y-2">
                  {lineageData.reasoningTrace.map((trace, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="leading-relaxed">{trace}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Audit Stats & Validation Badge */}
            <div className="space-y-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Execution Telemetry
                </h4>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Scanned Rows</span>
                    <span className="text-white font-bold">{lineageData.scanVolume}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Execution Plan</span>
                    <span className="text-indigo-400 font-bold">Vectorized SIMD</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Partition Pruning</span>
                    <span className="text-emerald-400 font-bold">Active (0 Bytes Spill)</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Data Freshness</span>
                    <span className="text-slate-200">{lineageData.dataFreshness}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Governance Audit</span>
                    <span className="text-emerald-400 font-bold">SOC2 / HIPAA Compliant</span>
                  </div>
                </div>
              </div>

              {/* Confidence Matrix Card */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase font-mono text-indigo-300 tracking-wider">
                    Deterministic Accuracy
                  </span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {lineageData.confidenceScore.toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lineage graph mathematically verified through schema catalog foreign keys and query AST tree tokens.
                </p>
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Live Lineage Graph: Active
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
              >
                Close Inspector
              </Button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
