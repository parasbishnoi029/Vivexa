import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Layers, Clock, ExternalLink, Bot, MoreVertical, 
  Star, Pin, PinOff, ArrowUpRight, Sparkles, ChevronRight, Activity
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectAnomalyBadge } from "./ProjectAnomalyBadge";
import { ProjectSparkline } from "./ProjectSparkline";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ContextMenuTarget } from "./DashboardContextMenu";

export interface ProjectSummaryCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    industry?: string;
    color?: string;
    status?: string;
    is_favorite?: boolean;
    updated_at?: string;
    created_at?: string;
    data_quality_score?: number;
    anomaly_count?: number;
    anomaly_issues?: string[];
    primary_kpi_name?: string;
    primary_kpi_value?: string | number;
    kpi_trend_data?: number[];
  };
  onContextMenuRequest?: (e: React.MouseEvent, target: ContextMenuTarget) => void;
  onAskAI?: (project: any) => void;
}

const ProjectSummaryCardComponent: React.FC<ProjectSummaryCardProps> = ({
  project,
  onContextMenuRequest,
  onAskAI
}) => {
  const navigate = useNavigate();
  const { pinnedItems = [], togglePinItem } = useWorkspaceStore();

  const isPinned = pinnedItems.some(p => p.id === project.id);
  const color = (project.color || "indigo") as any;

  // Auto calculate quality & anomalies if not explicitly passed
  const qualityScore = project.data_quality_score !== undefined ? project.data_quality_score : 94;
  const anomalyCount = project.anomaly_count !== undefined ? project.anomaly_count : 0;
  const kpiLabel = project.primary_kpi_name || "Pipeline Velocity";
  const kpiValue = project.primary_kpi_value || `${Math.round(85 + (project.name.length * 3) % 40)} MB/s`;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenuRequest) {
      onContextMenuRequest(e, {
        id: project.id,
        type: "project",
        title: project.name,
        description: project.description,
        path: `/workspace/projects/${project.id}`,
        qualityScore,
        hasAnomaly: anomalyCount > 0 || qualityScore < 90
      });
    }
  }, [project, onContextMenuRequest, qualityScore, anomalyCount]);

  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinItem({
      id: project.id,
      title: project.name,
      type: "project",
      path: `/workspace/projects/${project.id}`,
      pinnedAt: new Date().toISOString()
    });
  }, [project.id, project.name, togglePinItem]);

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ layout: { type: "spring", stiffness: 350, damping: 25 }, type: "spring", stiffness: 400, damping: 25 }}
      onContextMenu={handleContextMenu}
      className="h-full"
    >
      <Card className="h-full bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/50 transition-all rounded-3xl p-5 space-y-4 backdrop-blur-xl group flex flex-col justify-between relative shadow-xl hover:shadow-indigo-500/10">
        
        {/* Top Header Row */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            {/* Project Icon */}
            <div className={`p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform shadow-inner`}>
              <Layers className="h-5 w-5" />
            </div>

            {/* Subtle Pulsing Anomaly & Quality Indicator Badge */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <ProjectAnomalyBadge
                anomalyCount={anomalyCount}
                qualityScore={qualityScore}
                issues={project.anomaly_issues}
                pulse={true}
              />

              {/* Pin Quick Toggle */}
              <button
                type="button"
                onClick={handleTogglePin}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isPinned 
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400" 
                    : "bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                }`}
                title={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
              >
                <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-amber-400" : ""}`} />
              </button>

              {/* Context Menu Trigger icon */}
              <button
                type="button"
                onClick={handleContextMenu}
                className="p-1.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                title="Right-click or click for actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Project Title & Industry */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400/90 font-bold">
                {project.industry || "Enterprise Analytics"}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                {project.status || "Active"}
              </span>
            </div>

            <Link to={`/workspace/projects/${project.id}`} className="block group/title">
              <h4 className="text-base font-bold text-white group-hover/title:text-indigo-300 transition-colors line-clamp-1">
                {project.name}
              </h4>
            </Link>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
              {project.description || "Analytical workspace for predictive pipelines and hypothesis tests."}
            </p>
          </div>
        </div>

        {/* 30-Day Primary KPI Sparkline Chart */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1.5">
          <ProjectSparkline
            seedKey={project.id || project.name}
            data={project.kpi_trend_data}
            kpiLabel={kpiLabel}
            currentValue={kpiValue}
            color="indigo"
            height={32}
            showTrend={true}
            showDaysLabel={true}
          />
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
          <Button
            onClick={() => navigate(`/workspace/projects/${project.id}`)}
            size="sm"
            className="flex-1 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:text-white text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
          >
            <ExternalLink className="mr-1.5 h-3 w-3 text-indigo-400" />
            Open Studio
          </Button>

          <Button
            onClick={() => {
              if (onAskAI) {
                onAskAI(project);
              } else {
                navigate(`/workspace/ai/chat?q=Perform an automated diagnostic audit for project "${encodeURIComponent(project.name)}"`);
              }
            }}
            size="sm"
            className="flex-1 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-[11px] font-bold text-indigo-300 transition-all cursor-pointer"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Insights
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export const ProjectSummaryCard = React.memo(ProjectSummaryCardComponent);

