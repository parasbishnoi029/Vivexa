import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Layers, Database, GitBranch, ShieldCheck, Activity, X } from "lucide-react";
import { SemanticMetricItem } from "./CreateEditMetricModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metric: SemanticMetricItem | null;
}

export function LineageMapModal({ isOpen, onClose, metric }: Props) {
  if (!isOpen || !metric) return null;

  const lineageSources = metric.lineage || ["Stripe.Invoices", "Lakehouse.Fact_Revenue"];
  const downstreamTargets = [
    { name: "Executive CRM Dashboard", type: "Dashboard", status: "Synced" },
    { name: "AI Agent Intelligence Router", type: "Agent", status: "Active" },
    { name: "Q3 Strategy Financial Notebook", type: "Notebook", status: "Synced" },
    { name: "dbt Gold Layer Sync Pipeline", type: "dbt Model", status: "Synced" }
  ];

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh] relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitBranch className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Lineage Graph: {metric.name}
              </h2>
              <p className="text-xs text-slate-400">
                Full end-to-end trace from raw data lakehouse ingestion to downstream AI agents and dashboards.
              </p>
            </div>
          </div>

          <div className="space-y-6 mt-6">
            {/* Visual Graph Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Column 1: Source Data Assets */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Database className="h-4 w-4 text-blue-400" /> Source Data Ingestion
                </div>
                <div className="space-y-2">
                  {lineageSources.map((src, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors">
                      <p className="text-xs font-bold text-white font-mono">{src}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ingested via CDC Data Connector</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Semantic Metric Definition (Central Node) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Layers className="h-4 w-4 text-indigo-400" /> Semantic Core Node
                </div>
                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">{metric.name}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {metric.status}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Formula</span>
                    <code className="text-[11px] text-indigo-300 font-mono block mt-0.5">{metric.expression}</code>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Owner: <strong className="text-white">{metric.owner}</strong></span>
                    <span>Type: <strong className="text-white">{metric.type}</strong></span>
                  </div>
                </div>
              </div>

              {/* Column 3: Downstream Consumers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Activity className="h-4 w-4 text-emerald-400" /> Downstream Consumers
                </div>
                <div className="space-y-2">
                  {downstreamTargets.map((target, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">{target.name}</p>
                        <p className="text-[10px] text-slate-500">{target.type}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {target.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-white">Automatic Lineage Propagation Enabled</p>
                  <p className="text-[11px] text-slate-400">Formula changes automatically notify downstream agents and refresh pre-aggregated caches.</p>
                </div>
              </div>
              <Button onClick={onClose} variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs h-9">
                Close Graph
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
