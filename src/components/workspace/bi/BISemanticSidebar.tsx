import React from "react";
import { 
  Database, Calendar, Type as TypeIcon, Hash, Filter, Upload, 
  X, Sparkles, CheckCircle2, ShieldCheck, ChevronRight
} from "lucide-react";
import { BIDatasetOption } from "./BIDatasetSelector";

interface BISemanticSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDataset: BIDatasetOption | null;
  datasetRowsCount: number;
  dimensions: string[];
  measures: string[];
  activeFilters: Record<string, string>;
  searchQuery: string;
  dateRange: string;
  onToggleDimensionFilter: (dimension: string, value: string) => void;
  onRemoveFilter: (dim: string) => void;
  onClearAllFilters: () => void;
  onClearSearch: () => void;
  onOpenUploadModal: () => void;
}

export function BISemanticSidebar({
  isOpen,
  onClose,
  selectedDataset,
  datasetRowsCount,
  dimensions,
  measures,
  activeFilters,
  searchQuery,
  dateRange,
  onToggleDimensionFilter,
  onRemoveFilter,
  onClearAllFilters,
  onClearSearch,
  onOpenUploadModal
}: BISemanticSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 z-40 lg:static lg:z-auto w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 backdrop-blur-md shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-200">
        
        {/* Source Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Semantic Data Layer
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {selectedDataset?.name || "Active Dataset"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={onOpenUploadModal}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Upload New Dataset"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dataset Summary Pill */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>{datasetRowsCount.toLocaleString()} Active Records</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Schema Inferred
          </span>
        </div>

        {/* Scrollable Column Catalog */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
          
          {/* Active Slicing & Cross Filters */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-indigo-400" />
                Active Slicers
              </h3>
              {(Object.keys(activeFilters).length > 0 || searchQuery || dateRange !== "ALL") && (
                <button 
                  onClick={onClearAllFilters}
                  className="text-[10px] font-bold text-rose-400 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {/* Date Scope */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 text-xs text-indigo-200">
                <div className="flex items-center gap-1.5 mb-0.5 font-bold text-[11px]">
                  <Calendar className="h-3 w-3 text-indigo-400" /> Time Scope
                </div>
                <div className="text-[10px] font-mono text-indigo-300/80">
                  {dateRange === "ALL" ? "Full Historical Timeline" : `Active Range: ${dateRange}`}
                </div>
              </div>

              {/* Active Dimension Chips */}
              {Object.entries(activeFilters).map(([dim, val]) => (
                <div key={dim} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200">
                  <span className="truncate">{dim}: <strong className="text-emerald-400">{val}</strong></span>
                  <button 
                    onClick={() => onRemoveFilter(dim)} 
                    className="text-slate-400 hover:text-rose-400 ml-2 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}

              {searchQuery && (
                <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200">
                  <span className="truncate">Search: <strong className="text-amber-400">{searchQuery}</strong></span>
                  <button onClick={onClearSearch} className="text-slate-400 hover:text-rose-400 ml-2 font-bold">×</button>
                </div>
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Dimensions ({dimensions.length})
              </h3>
            </div>
            <ul className="space-y-1">
              {dimensions.map(dim => {
                const isDate = dim.toLowerCase().includes("date") || dim.toLowerCase().includes("month") || dim.toLowerCase().includes("time");
                const isActiveSlicer = !!activeFilters[dim];
                return (
                  <li 
                    key={dim}
                    onClick={() => {
                      // Prompt or slice
                    }}
                    className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group ${
                      isActiveSlicer 
                        ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-200" 
                        : "bg-slate-950/60 border border-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isDate ? (
                        <Calendar className="h-3.5 w-3.5 text-cyan-400 group-hover:text-cyan-300" />
                      ) : (
                        <TypeIcon className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300" />
                      )}
                      <span className="truncate max-w-[140px] font-mono text-[11px]">{dim}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase">{isDate ? "DATE" : "STR"}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Measures */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Measures (Facts) ({measures.length})
              </h3>
            </div>
            <ul className="space-y-1">
              {measures.map(measure => (
                <li 
                  key={measure}
                  className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 border border-slate-800/60 hover:bg-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-emerald-400 group-hover:text-emerald-300" />
                    <span className="truncate max-w-[140px] font-mono text-[11px]">{measure}</span>
                  </div>
                  <span className="text-[9px] text-emerald-500/80 font-mono">NUM</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Semantic Engine
          </span>
          <span className="text-slate-500">Aug 2026</span>
        </div>
      </div>
    </>
  );
}
