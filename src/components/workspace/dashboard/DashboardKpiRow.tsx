import React from "react";
import { Card } from "@/components/ui/card";
import { Database, ShieldCheck, Presentation, FolderKanban, Users, ChevronRight, ArrowUpRight } from "lucide-react";
import { ProjectSparkline } from "@/components/workspace/ProjectSparkline";
import { ContextMenuTarget } from "@/components/workspace/DashboardContextMenu";

interface DashboardKpiRowProps {
  stats: {
    datasets: number;
    totalRows: number;
    totalSizeBytes?: number;
    avgQuality: number;
    projects: number;
    reports: number;
    storage: number;
    members: number;
    pendingInvites: number;
  };
  showSparklines: boolean;
  density: 'comfortable' | 'compact';
  onNavigate: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, target: ContextMenuTarget) => void;
}

function formatCompact(num: number): string {
  if (!num || num === 0) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export const DashboardKpiRow: React.FC<DashboardKpiRowProps> = ({
  stats,
  showSparklines,
  density,
  onNavigate,
  onContextMenu
}) => {
  const isCompact = density === 'compact';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 ${isCompact ? 'text-xs' : ''}`}>
      {/* 1. Records & Datasets */}
      <Card
        onClick={() => onNavigate('/workspace/datasets')}
        onContextMenu={(e) => onContextMenu(e, {
          id: 'kpi-records',
          type: 'kpi',
          title: 'Data Engine Records',
          description: `${formatCompact(stats.totalRows)} rows across ${stats.datasets} datasets`,
          path: '/workspace/datasets',
          kpiValue: formatCompact(stats.totalRows),
          qualityScore: stats.avgQuality
        })}
        className="bg-slate-900/90 border-slate-800/80 hover:border-cyan-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
              <Database className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              {stats.storage > 0 ? `${stats.storage} GB` : `${((stats.totalSizeBytes || 0) / (1024 * 1024)).toFixed(1)} MB`}
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCompact(stats.totalRows)}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">
              Records in {stats.datasets} {stats.datasets === 1 ? 'Dataset' : 'Datasets'}
            </div>
          </div>

          {showSparklines && !isCompact && (
            <div className="mt-2.5 pt-1.5">
              <ProjectSparkline seedKey="records-30d" kpiLabel="30D Ingestion Trend" color="cyan" height={22} showDaysLabel={false} />
            </div>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Datasets & Warehouses</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>

      {/* 2. Data Quality Index */}
      <Card
        onClick={() => onNavigate('/workspace/datasets')}
        onContextMenu={(e) => onContextMenu(e, {
          id: 'kpi-dqi',
          type: 'kpi',
          title: 'Data Quality Index (DQI)',
          description: `Current workspace hygiene rating: ${stats.avgQuality}%`,
          path: '/workspace/datasets',
          kpiValue: `${stats.avgQuality}%`,
          qualityScore: stats.avgQuality
        })}
        className="bg-slate-900/90 border-slate-800/80 hover:border-emerald-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Grade {stats.avgQuality >= 95 ? 'A+' : stats.avgQuality >= 90 ? 'A' : 'B+'}
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.avgQuality}%
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">Average Quality Index (DQI)</div>
          </div>

          {showSparklines && !isCompact && (
            <div className="mt-2.5 pt-1.5">
              <ProjectSparkline seedKey="dqi-30d" kpiLabel="30D Quality Score" color="emerald" height={22} showDaysLabel={false} />
            </div>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Schema Validation</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>

      {/* 3. Executive Reports */}
      <Card
        onClick={() => onNavigate('/workspace/reports')}
        onContextMenu={(e) => onContextMenu(e, {
          id: 'kpi-reports',
          type: 'kpi',
          title: 'Executive Intelligence Reports',
          description: `${stats.reports} generated reports & slide decks`,
          path: '/workspace/reports',
          kpiValue: `${stats.reports}`
        })}
        className="bg-slate-900/90 border-slate-800/80 hover:border-amber-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
              <Presentation className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              C-Suite Decks
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.reports}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">Executive Story Decks</div>
          </div>

          {showSparklines && !isCompact && (
            <div className="mt-2.5 pt-1.5">
              <ProjectSparkline seedKey="reports-30d" kpiLabel="30D Reports" color="amber" height={22} showDaysLabel={false} />
            </div>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Executive Studio</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>

      {/* 4. Active Projects */}
      <Card
        onClick={() => onNavigate('/workspace/projects')}
        onContextMenu={(e) => onContextMenu(e, {
          id: 'kpi-projects',
          type: 'kpi',
          title: 'Workspace Initiatives',
          description: `${stats.projects} active projects in flight`,
          path: '/workspace/projects',
          kpiValue: `${stats.projects}`
        })}
        className="bg-slate-900/90 border-slate-800/80 hover:border-indigo-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
              <FolderKanban className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> Active
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.projects}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">Active Initiatives</div>
          </div>

          {showSparklines && !isCompact && (
            <div className="mt-2.5 pt-1.5">
              <ProjectSparkline seedKey="projects-30d" kpiLabel="30D Activity" color="indigo" height={22} showDaysLabel={false} />
            </div>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Project Hub</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>

      {/* 5. Organization & Team */}
      <Card
        onClick={() => onNavigate('/workspace/organization')}
        onContextMenu={(e) => onContextMenu(e, {
          id: 'kpi-team',
          type: 'kpi',
          title: 'Team & Organization',
          description: `${stats.members} team members, ${stats.pendingInvites} pending`,
          path: '/workspace/organization',
          kpiValue: `${stats.members}`
        })}
        className="bg-slate-900/90 border-slate-800/80 hover:border-purple-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <Users className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              {stats.pendingInvites} Invites
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.members}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">Workspace Members</div>
          </div>

          {showSparklines && !isCompact && (
            <div className="mt-2.5 pt-1.5">
              <ProjectSparkline seedKey="team-30d" kpiLabel="30D Collab" color="purple" height={22} showDaysLabel={false} />
            </div>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Organization Access</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </div>
  );
};
