import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Plus, Upload, RefreshCw, LayoutDashboard, 
  Compass, Download, Share2, SlidersHorizontal, Eye, BarChart3, Terminal, Layers
} from "lucide-react";
import { DashboardViewMode } from "./types";

interface DashboardHeaderProps {
  welcomeGreeting: string;
  userName: string;
  isLive: boolean;
  lastSyncedAt: Date | null;
  activeViewMode: DashboardViewMode;
  onViewModeChange: (mode: DashboardViewMode) => void;
  onOpenWizard: () => void;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
}

const DashboardHeaderComponent: React.FC<DashboardHeaderProps> = ({
  welcomeGreeting,
  userName,
  isLive,
  lastSyncedAt,
  activeViewMode,
  onViewModeChange,
  onOpenWizard,
  onNavigate,
  onRefresh,
  onExportCsv,
  onOpenShare,
  onOpenSettings,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            <Sparkles className="h-3 w-3" /> Intelligence OS
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isLive ? "Live Telemetry" : "Synced"}
          </span>
          {lastSyncedAt && (
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              ({lastSyncedAt.toLocaleTimeString()})
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {welcomeGreeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">{userName}</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
          Unified workspace for data quality audits, predictive analytics, and executive intelligence briefings.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* View Mode Segmented Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onViewModeChange('executive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeViewMode === 'executive'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Simplified executive view with core metrics & intelligence"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Executive</span>
          </button>

          <button
            onClick={() => onViewModeChange('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeViewMode === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Real-time performance telemetry & anomaly detector"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Telemetry</span>
          </button>

          <button
            onClick={() => onViewModeChange('operations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeViewMode === 'operations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Cluster health, diagnostic logs, and platform tools"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Operations</span>
          </button>

          <button
            onClick={() => onViewModeChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeViewMode === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Full comprehensive view with all panels"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenSettings}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
            title="Customize Dashboard Layout & Density"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-slate-400" />
            <span className="hidden sm:inline">Customize</span>
          </Button>

          <Button
            onClick={() => onNavigate('/workspace/datasets')}
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-xl bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            <span>Upload Data</span>
          </Button>

          <Button
            onClick={onOpenWizard}
            size="sm"
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>New Project</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DashboardHeader = React.memo(DashboardHeaderComponent);
