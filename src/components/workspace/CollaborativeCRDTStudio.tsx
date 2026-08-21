import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, GitCommit, FileText, Download, Copy, Check, Sparkles,
  History, Clock, CheckCircle2, X, RefreshCw, Layers, ShieldCheck,
  ChevronRight, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CollaborativeCRDTStudioProps {
  isOpen: boolean;
  onClose: () => void;
  notebookTitle?: string;
  cells: Array<{
    id: string;
    type: "python" | "sql" | "markdown";
    code: string;
    output?: any;
  }>;
}

export const CollaborativeCRDTStudio: React.FC<CollaborativeCRDTStudioProps> = ({
  isOpen,
  onClose,
  notebookTitle = "Revenue Forecast & Anomaly Detection",
  cells = [],
}) => {
  const [activeTab, setActiveTab] = useState<"crdt_presence" | "git_markdown" | "time_travel">("git_markdown");
  const [copiedMd, setCopiedMd] = useState(false);
  const [timelineStep, setTimelineStep] = useState(3);

  // Active simulated peers
  const peers = [
    { name: "You (Host)", role: "Data Engineer", color: "bg-indigo-500", activeCell: "Cell #2" },
    { name: "Sarah Chen", role: "VP of Analytics", color: "bg-emerald-500", activeCell: "Cell #4" },
    { name: "Alex Rivera", role: "ML Engineer", color: "bg-amber-500", activeCell: "Cell #1" },
  ];

  // Serializes notebook state into clean Jupytext/Vivexa Git-Native Markdown (.vivexa.md)
  const vivexaMarkdown = useMemo(() => {
    let md = `---
title: "${notebookTitle}"
version: "2.4.0-vivexa"
engine: "hybrid-wasm-cloud"
kernel: "python3.11-duckdb"
created_at: "${new Date().toISOString()}"
author: "Vivexa Collaborative Studio"
---

# ${notebookTitle}
*Deterministic, clean Git diff format avoiding JSON conflict noise.*\n\n`;

    cells.forEach((cell, idx) => {
      if (cell.type === "markdown") {
        md += `<!-- cell:markdown id="${cell.id}" -->\n${cell.code}\n\n`;
      } else {
        md += `\`\`\`${cell.type} [cell_id="${cell.id}"]\n${cell.code}\n\`\`\`\n\n`;
      }
    });

    return md;
  }, [notebookTitle, cells]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(vivexaMarkdown);
    setCopiedMd(true);
    toast.success("Copied Git-Native .vivexa.md to clipboard!");
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([vivexaMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${notebookTitle.toLowerCase().replace(/\s+/g, "_")}.vivexa.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded .vivexa.md file!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Multi-User CRDT & Git-Native Diffing Studio
                </h2>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px]">
                  Yjs Character-Level Sync
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Full concurrent multi-cursor editing, Git-clean .vivexa.md serialization, and execution state time travel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("git_markdown")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "git_markdown" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" /> Git-Native Serialization (.vivexa.md)
          </button>
          <button
            onClick={() => setActiveTab("crdt_presence")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "crdt_presence" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" /> Live CRDT Peer Presence
          </button>
          <button
            onClick={() => setActiveTab("time_travel")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "time_travel" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" /> Execution Time Travel
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === "git_markdown" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-emerald-400" />
                    Clean Git Pull Request Diffing
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Unlike standard .ipynb JSON files, .vivexa.md produces human-readable Git diffs without cell metadata noise.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyMarkdown}
                    className="text-xs border-slate-700 hover:bg-slate-800 gap-1.5 h-8"
                  >
                    {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMd ? "Copied!" : "Copy Diff"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadMarkdown}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 h-8 font-medium shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" /> Export .vivexa.md
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Live Serialized Stream:</div>
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[350px] leading-relaxed custom-scrollbar">
                  {vivexaMarkdown}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "crdt_presence" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Active Real-Time Collaborators (3 Online)</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
                    WebRTC Mesh Active
                  </Badge>
                </div>

                <div className="space-y-2">
                  {peers.map((peer, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${peer.color} ring-4 ring-slate-800`}></div>
                        <div>
                          <div className="text-xs font-bold text-white">{peer.name}</div>
                          <div className="text-[11px] text-slate-400">{peer.role}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300 text-[10px]">
                        Focusing {peer.activeCell}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "time_travel" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Kernel Execution Timeline (Step {timelineStep} of 4)
                  </div>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">
                    Deterministic Snapshots
                  </Badge>
                </div>

                <input
                  type="range"
                  min={1}
                  max={4}
                  value={timelineStep}
                  onChange={(e) => {
                    setTimelineStep(parseInt(e.target.value));
                    toast.info(`Scrubbed to Execution Checkpoint t${e.target.value}`);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>t0: Ingestion</span>
                  <span>t1: Cleaning</span>
                  <span>t2: Groupby</span>
                  <span className="text-purple-400 font-bold">t3: Visual Model (Active)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Variable State at Checkpoint t{timelineStep}:</div>
                <div className="font-mono text-xs text-slate-400 bg-black/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <div>df.shape = (12400, 18)</div>
                  <div>sales_df["Month"].count() = 12</div>
                  <div>mean_growth_pct = +14.2%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">Collaborative state sync powered by distributed Yjs document channels.</span>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
export default CollaborativeCRDTStudio;
