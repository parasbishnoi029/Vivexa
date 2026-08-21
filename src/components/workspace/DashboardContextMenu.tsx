import React, { useEffect, useRef, useState } from "react";
import { 
  ExternalLink, Pin, PinOff, FileText, Sparkles, Copy, 
  Share2, Download, RefreshCw, BarChart2, ShieldCheck, Eye, 
  Terminal, Trash2, ArrowUpRight, Wand2, Layers, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useWorkspaceStore, PinnedItem } from "@/stores/workspaceStore";

export interface ContextMenuTarget {
  id: string;
  type: "project" | "dataset" | "report" | "kpi";
  title: string;
  description?: string;
  path: string;
  kpiValue?: string | number;
  qualityScore?: number;
  hasAnomaly?: boolean;
}

export interface DashboardContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  target: ContextMenuTarget | null;
  onClose: () => void;
  onViewDataDetails?: (target: ContextMenuTarget) => void;
  onGenerateInsights?: (target: ContextMenuTarget) => void;
  onCustomAction?: (actionId: string, target: ContextMenuTarget) => void;
}

const DashboardContextMenuComponent: React.FC<DashboardContextMenuProps> = ({
  isOpen,
  position,
  target,
  onClose,
  onViewDataDetails,
  onGenerateInsights,
  onCustomAction
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { pinnedItems = [], togglePinItem } = useWorkspaceStore();
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });

  const isPinned = target ? pinnedItems.some(p => p.id === target.id) : false;

  // Viewport bounding calculation so context menu never overflows off-screen
  useEffect(() => {
    if (!isOpen) return;

    const menuWidth = 240;
    const menuHeight = 280;
    const padding = 12;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    setAdjustedPos({ x: Math.max(padding, x), y: Math.max(padding, y) });
  }, [isOpen, position]);

  // Click outside and keydown listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  // Action handlers
  const handleOpenInNewTab = () => {
    const fullUrl = `${window.location.origin}${target.path.startsWith('/') ? target.path : `/${target.path}`}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
    toast.success(`Opened "${target.title}" in new browser tab`);
    onClose();
  };

  const handleTogglePin = () => {
    const item: PinnedItem = {
      id: target.id,
      title: target.title,
      type: target.type,
      path: target.path,
      pinnedAt: new Date().toISOString()
    };
    togglePinItem(item);
    if (isPinned) {
      toast.info(`Unpinned "${target.title}" from sidebar`);
    } else {
      toast.success(`Pinned "${target.title}" to quick-access sidebar! 📌`);
    }
    onClose();
  };

  const handleViewDetails = () => {
    if (onViewDataDetails) {
      onViewDataDetails(target);
    } else {
      window.location.href = target.path;
    }
    onClose();
  };

  const handleGenerateInsightsAction = () => {
    if (onGenerateInsights) {
      onGenerateInsights(target);
    } else {
      toast.success(`Synthesizing predictive insights for "${target.title}"...`);
    }
    onClose();
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${target.path}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Direct link copied to clipboard");
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{ 
            left: `${adjustedPos.x}px`, 
            top: `${adjustedPos.y}px`,
            pointerEvents: 'auto'
          }}
          className="fixed w-60 rounded-2xl bg-slate-950/95 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-2xl p-1.5 z-[9999] divide-y divide-slate-800/60 select-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header preview info */}
          <div className="px-2.5 py-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                {target.type} Quick Actions
              </span>
              {target.hasAnomaly && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <AlertTriangle className="h-2.5 w-2.5" /> Anomaly
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-white truncate mt-0.5" title={target.title}>
              {target.title}
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="py-1 space-y-0.5">
            {/* 1. Open in New Tab */}
            <button
              onClick={handleOpenInNewTab}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span>Open in New Tab</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">⌘+Click</span>
            </button>

            {/* 2. Pin to Sidebar */}
            <button
              onClick={handleTogglePin}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isPinned ? (
                  <PinOff className="h-3.5 w-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                ) : (
                  <Pin className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                )}
                <span>{isPinned ? "Unpin from Sidebar" : "Pin to Sidebar"}</span>
              </div>
              {isPinned && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">Pinned</span>
              )}
            </button>

            {/* 3. View Data Details */}
            <button
              onClick={handleViewDetails}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span>View Data Details</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Inspect</span>
            </button>

            {/* 4. Generate Insights */}
            <button
              onClick={handleGenerateInsightsAction}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-600/20 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 group-hover:text-indigo-300 group-hover:rotate-12 transition-transform" />
                <span>Generate Insights</span>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">AI</span>
            </button>
          </div>

          {/* Secondary Utility Actions */}
          <div className="pt-1 space-y-0.5">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>Copy Link</span>
            </button>

            <button
              onClick={() => {
                toast.success(`Exporting summary metrics for "${target.title}"...`);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Metric Snapshot</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const DashboardContextMenu = React.memo(DashboardContextMenuComponent);

