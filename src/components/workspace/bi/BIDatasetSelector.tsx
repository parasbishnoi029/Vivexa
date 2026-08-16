import React, { useState } from "react";
import { 
  Database, Activity, Layers, ShoppingCart, HeartPulse, Truck, 
  Upload, ChevronDown, Check, FolderOpen, Plus, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BIDatasetOption {
  id: string;
  name: string;
  category: string;
  row_count?: number;
  isSample?: boolean;
  isWorkspaceMemory?: boolean;
  isSupabase?: boolean;
  description?: string;
}

interface BIDatasetSelectorProps {
  selectedDatasetId: string;
  datasetsList: BIDatasetOption[];
  onSelectDataset: (id: string) => void;
  onOpenUploadModal: () => void;
}

export function BIDatasetSelector({
  selectedDatasetId,
  datasetsList,
  onSelectDataset,
  onOpenUploadModal
}: BIDatasetSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getCategoryIcon = (category: string, id: string) => {
    if (id === "telemetry-live" || category === "Telemetry") return <Activity className="h-3.5 w-3.5 text-cyan-400" />;
    if (id === "saas-revenue" || category === "SaaS") return <Layers className="h-3.5 w-3.5 text-indigo-400" />;
    if (id === "ecommerce-profitability" || category === "E-Commerce") return <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />;
    if (id === "healthcare-clinical-ops" || category === "Healthcare") return <HeartPulse className="h-3.5 w-3.5 text-rose-400" />;
    if (id === "supply-chain-logistics" || category === "Supply Chain") return <Truck className="h-3.5 w-3.5 text-amber-400" />;
    if (category === "Workspace Store") return <FolderOpen className="h-3.5 w-3.5 text-purple-400" />;
    return <Database className="h-3.5 w-3.5 text-blue-400" />;
  };

  const selectedDataset = datasetsList.find(d => d.id === selectedDatasetId) || datasetsList[0];

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* 1. Header Toolbar Dataset Dropdown Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/60 rounded-xl px-3 py-1.5 text-xs text-white font-medium transition-all shadow-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            title="Click to switch active dataset"
          >
            <div className="p-1 bg-slate-950 rounded-lg border border-slate-800">
              {selectedDataset ? getCategoryIcon(selectedDataset.category, selectedDataset.id) : <Database className="h-3.5 w-3.5 text-indigo-400" />}
            </div>
            
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-[240px]">
                  {selectedDataset?.name || "Select Dataset"}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedDataset?.category || "Dataset"}
                </span>
              </div>
              {selectedDataset?.row_count && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedDataset.row_count.toLocaleString()} rows • Live Active
                </span>
              )}
            </div>

            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 ml-1 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown List */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute left-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-[420px] overflow-y-auto">
                <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Available BI Datasets
                  </span>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenUploadModal();
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Upload File
                  </button>
                </div>

                <div className="space-y-1">
                  {datasetsList.map(ds => {
                    const isSelected = ds.id === selectedDatasetId;
                    return (
                      <div
                        key={ds.id}
                        onClick={() => {
                          onSelectDataset(ds.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-indigo-600/20 border border-indigo-500/50 text-white" 
                            : "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                          {getCategoryIcon(ds.category, ds.id)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate text-white">{ds.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>{ds.category}</span>
                            {ds.row_count && <span>• {ds.row_count.toLocaleString()} rows</span>}
                          </div>
                          {ds.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{ds.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenUploadModal();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-xs text-indigo-300 font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" /> Import CSV / Excel / JSON
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2. Quick Dataset Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          {datasetsList.slice(0, 5).map(ds => {
            const isSelected = ds.id === selectedDatasetId;
            return (
              <button
                key={ds.id}
                onClick={() => onSelectDataset(ds.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold scale-[1.02]"
                    : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80"
                }`}
              >
                {getCategoryIcon(ds.category, ds.id)}
                <span>{ds.name.split(" ")[0]} {ds.name.split(" ")[1] || ""}</span>
              </button>
            );
          })}

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenUploadModal}
            className="h-7 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 rounded-lg whitespace-nowrap px-2"
          >
            <Upload className="h-3 w-3 mr-1 text-indigo-400" /> + Add Dataset
          </Button>
        </div>
      </div>
    </div>
  );
}
