import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  History, X, Search, Bookmark, BookmarkCheck, ArrowLeftRight, Eye,
  FileDown, Trash2, Download, Presentation, FileText, Database, Layers, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutiveReportHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  reports: any[];
  pinnedReportIds: string[];
  compareReportIds: string[];
  onTogglePin: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onDeleteReport: (id: string, e?: React.MouseEvent) => void;
  onViewReport: (report: any) => void;
  onExportPDF: (report: any) => void;
  onExportPPT: (report: any) => void;
  onExportHTML: (report: any) => void;
}

export function ExecutiveReportHistorySidebar({
  isOpen,
  onClose,
  reports,
  pinnedReportIds,
  compareReportIds,
  onTogglePin,
  onToggleCompare,
  onDeleteReport,
  onViewReport,
  onExportPDF,
  onExportPPT,
  onExportHTML
}: ExecutiveReportHistorySidebarProps) {
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "custom_db" | "lakehouse" | "pinned" | "deck" | "strategy">("all");

  if (!isOpen || typeof document === "undefined" || !document.body) return null;

  const filteredReports = reports.filter(rep => {
    const parsed = typeof rep.content === "string" ? (() => { try { return JSON.parse(rep.content); } catch { return {}; } })() : (rep.content || {});
    const dsName = (parsed.dataset_name || rep.dataset_name || "").toLowerCase();
    const title = (rep.title || "").toLowerCase();
    const format = (rep.format || "").toLowerCase();

    const matchesSearch = !historySearchQuery ||
      title.includes(historySearchQuery.toLowerCase()) ||
      format.includes(historySearchQuery.toLowerCase()) ||
      dsName.includes(historySearchQuery.toLowerCase());

    const isCustomDb = dsName.includes("postgres") || dsName.includes("snowflake") || dsName.includes("bigquery") || dsName.includes("clickhouse") || dsName.includes("mysql") || dsName.includes("sql") || dsName.includes("duckdb");
    const isLakehouse = !isCustomDb;

    const matchesFilter =
      historyFilter === "all" ||
      (historyFilter === "pinned" && pinnedReportIds.includes(rep.id)) ||
      (historyFilter === "custom_db" && isCustomDb) ||
      (historyFilter === "lakehouse" && isLakehouse) ||
      (historyFilter === "deck" && format.includes("deck")) ||
      (historyFilter === "strategy" && !format.includes("deck"));

    return matchesSearch && matchesFilter;
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Version History</h3>
              <p className="text-[11px] text-slate-400">{reports.length} total versions & dossiers logged</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Pills */}
        <div className="pt-3 pb-2 space-y-2 shrink-0 border-b border-slate-800/80">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Search reports by database, title, format..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => setHistoryFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                historyFilter === "all" ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setHistoryFilter("custom_db")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                historyFilter === "custom_db" ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Custom DB
            </button>
            <button
              onClick={() => setHistoryFilter("lakehouse")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                historyFilter === "lakehouse" ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Lakehouse
            </button>
            <button
              onClick={() => setHistoryFilter("pinned")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                historyFilter === "pinned" ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Pinned ({pinnedReportIds.length})
            </button>
            <button
              onClick={() => setHistoryFilter("deck")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                historyFilter === "deck" ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Decks
            </button>
          </div>
        </div>

        {/* List of Report Versions */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching report versions found in history.
            </div>
          ) : (
            filteredReports.map((rep) => {
              const isPinned = pinnedReportIds.includes(rep.id);
              const isSelected = compareReportIds.includes(rep.id);
              const parsedRep = typeof rep.content === "string" ? (() => { try { return JSON.parse(rep.content); } catch { return {}; } })() : (rep.content || {});
              const isCustomDb = (parsedRep.dataset_name || "").includes("://") || (parsedRep.dataset_name || "").includes("SQL") || (parsedRep.dataset_name || "").includes("db_");

              return (
                <div
                  key={rep.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected ? "bg-violet-950/40 border-violet-500 shadow-md" : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isCustomDb
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        }`}>
                          {isCustomDb ? "Custom DB" : "Lakehouse"}
                        </span>
                        {isPinned && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pinned
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">{rep.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onTogglePin(rep.id)}
                        className={`p-1 rounded text-slate-400 hover:text-amber-400 ${isPinned ? "text-amber-400" : ""}`}
                        title={isPinned ? "Unpin" : "Pin"}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => onDeleteReport(rep.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                        title="Delete Version"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 flex-wrap">
                    <span className="text-violet-400 font-medium">{rep.format || "Executive Briefing"}</span>
                    <span>•</span>
                    <span>{new Date(rep.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800/60 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onToggleCompare(rep.id)}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                          isSelected ? "bg-violet-600 border-violet-500 text-white" : "border-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        {isSelected ? "Selected" : "Compare"}
                      </button>
                      <button
                        onClick={() => onExportPDF(rep)}
                        className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold px-1.5 py-0.5"
                        title="Export PDF"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => onExportPPT(rep)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-1.5 py-0.5"
                        title="Export PPT"
                      >
                        PPT
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onViewReport(rep);
                        onClose();
                      }}
                      className="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-500 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
