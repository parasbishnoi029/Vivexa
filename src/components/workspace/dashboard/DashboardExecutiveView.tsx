import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wand2, Search, ArrowRight, FolderKanban, Plus, Database, 
  Upload, Eye, Bot, FileText, ChevronRight, Filter, Download
} from "lucide-react";
import { InsightsOfTheDayCard } from "@/components/workspace/InsightsOfTheDayCard";
import { ProjectSummaryCard } from "@/components/workspace/ProjectSummaryCard";
import { ProjectAnomalyBadge } from "@/components/workspace/ProjectAnomalyBadge";
import { ProjectSparkline } from "@/components/workspace/ProjectSparkline";
import { ContextMenuTarget } from "@/components/workspace/DashboardContextMenu";
import { DashboardDisplayPreferences } from "./types";
import { Link } from "react-router-dom";

const QUICK_PROMPTS = [
  { label: "Forecast Q4 Revenue", query: "Forecast Q4 revenue trends and highlight key variance drivers across datasets." },
  { label: "Data Quality & Drift Audit", query: "Perform a comprehensive data quality, missingness, and null drift audit on all active tables." },
  { label: "Detect Anomaly Outliers", query: "Identify multi-dimensional statistical outliers and high Z-score anomalies in connected datasets." },
  { label: "Executive Briefing Deck", query: "Synthesize an executive C-suite presentation deck summarizing operational and financial KPIs." },
];

function formatCompact(num: number): string {
  if (!num || num === 0) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

interface DashboardExecutiveViewProps {
  stats: any;
  recentProjects: any[];
  recentDatasets: any[];
  realAnomalies: any[];
  userName: string;
  chatQuery: string;
  latencyCheck: number;
  preferences: DashboardDisplayPreferences;
  onChatQueryChange: (q: string) => void;
  onGenerateInsight: (query?: string) => void;
  onNavigate: (path: string) => void;
  onOpenWizard: () => void;
  onContextMenu: (e: React.MouseEvent, target: ContextMenuTarget) => void;
  onExportDatasetsCsv: () => void;
}

export const DashboardExecutiveView: React.FC<DashboardExecutiveViewProps> = ({
  stats,
  recentProjects,
  recentDatasets,
  realAnomalies,
  userName,
  chatQuery,
  latencyCheck,
  preferences,
  onChatQueryChange,
  onGenerateInsight,
  onNavigate,
  onOpenWizard,
  onContextMenu,
  onExportDatasetsCsv,
}) => {
  const [projectSearch, setProjectSearch] = useState("");
  const [datasetSearch, setDatasetSearch] = useState("");

  const filteredProjects = recentProjects.filter(p => 
    !projectSearch || 
    (p.name && p.name.toLowerCase().includes(projectSearch.toLowerCase())) ||
    (p.industry && p.industry.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  const filteredDatasets = recentDatasets.filter(d => 
    !datasetSearch || 
    (d.name && d.name.toLowerCase().includes(datasetSearch.toLowerCase())) ||
    (d.file_type && d.file_type.toLowerCase().includes(datasetSearch.toLowerCase()))
  );

  return (
    <div className="space-y-7">
      {/* 1. Daily AI Intelligence Briefing Card */}
      {preferences.showInsightsCard && (
        <InsightsOfTheDayCard
          stats={stats}
          recentDatasets={recentDatasets}
          recentProjects={recentProjects}
          anomalies={realAnomalies}
          userName={userName}
          onAskAnalyst={(query) => onGenerateInsight(query)}
          onNavigate={(path) => onNavigate(path)}
        />
      )}

      {/* 2. Natural Language AI Copilot Bar */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition-opacity" />
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Wand2 className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Vivexa AI Copilot</h3>
                <p className="text-[11px] text-slate-400">Ask statistical questions, generate forecasts, or run data quality checks in plain English.</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ONLINE • {latencyCheck}ms</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input 
                type="text" 
                value={chatQuery}
                onChange={(e) => onChatQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onGenerateInsight()}
                placeholder="e.g. 'Identify revenue outliers and perform correlation analysis on active tables'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm font-medium transition-all"
              />
            </div>
            <Button 
              onClick={() => onGenerateInsight()}
              className="w-full sm:w-auto h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              Analyze <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {preferences.showQuickPrompts && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Suggested Prompts:</span>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onGenerateInsight(prompt.query)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white transition-all group/btn"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Active Workspace Initiatives */}
      {preferences.showRecentProjects && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Active Initiatives</h3>
              <span className="text-xs font-mono text-slate-500">({recentProjects.length})</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Filter initiatives..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
                />
              </div>

              <Button 
                onClick={onOpenWizard}
                size="sm"
                className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="mr-1 h-3 w-3" /> New
              </Button>

              <Link to="/workspace/projects" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 ml-1">
                All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.slice(0, 6).map((project, idx) => {
                const projectAnomalies = realAnomalies.filter((a: any) => 
                  (a.source && a.source === project.name) || 
                  a.title.toLowerCase().includes((project.name || '').toLowerCase())
                );
                const hasAnomaly = projectAnomalies.length > 0 || (idx === 1 && realAnomalies.length > 0);
                const anomalyCount = hasAnomaly ? Math.max(1, projectAnomalies.length) : 0;
                const qualityScore = typeof project.quality === 'number' 
                  ? project.quality 
                  : typeof project.data_quality_score === 'number' 
                  ? project.data_quality_score 
                  : stats.avgQuality;

                return (
                  <ProjectSummaryCard
                    key={project.id || idx}
                    project={{
                      id: project.id,
                      name: project.name || `Initiative ${idx + 1}`,
                      description: project.description || `Autonomous workspace investigation into ${project.industry || 'enterprise'} patterns.`,
                      industry: project.industry,
                      status: project.status || 'Active',
                      color: project.color || 'indigo',
                      updated_at: project.updated_at || project.created_at || new Date().toISOString(),
                      data_quality_score: qualityScore,
                      anomaly_count: anomalyCount
                    }}
                    onContextMenuRequest={onContextMenu}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: "proj-pipeline-alpha",
                  name: "Pipeline Ingestion & Drift Monitor",
                  description: "Real-time stream monitoring across all connected cloud data connectors and lakehouse tables.",
                  industry: "Data Engineering",
                  status: "Active",
                  color: "indigo",
                  data_quality_score: 98,
                  anomaly_count: realAnomalies.length > 0 ? realAnomalies.length : 0
                },
                {
                  id: "proj-revenue-forecasting",
                  name: "ARR & Churn Predictive Hub",
                  description: "Prophet and LightGBM models running automated variance checks.",
                  industry: "Finance & Strategy",
                  status: "Active",
                  color: "emerald",
                  data_quality_score: 94,
                  anomaly_count: 0
                },
                {
                  id: "proj-customer-segmentation",
                  name: "Customer Behavioral Embeddings",
                  description: "Unsupervised cluster segmentation powered by vector memory.",
                  industry: "E-Commerce",
                  status: "Active",
                  color: "purple",
                  data_quality_score: 96,
                  anomaly_count: 0
                }
              ].map((proj) => (
                <ProjectSummaryCard
                  key={proj.id}
                  project={{
                    ...proj,
                    updated_at: new Date().toISOString()
                  }}
                  onContextMenuRequest={onContextMenu}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Connected Datasets Inventory */}
      {preferences.showRecentDatasets && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Connected Datasets</h3>
              <span className="text-xs font-mono text-slate-500">({recentDatasets.length})</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Filter datasets..."
                  value={datasetSearch}
                  onChange={(e) => setDatasetSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
                />
              </div>

              {recentDatasets.length > 0 && (
                <Button 
                  onClick={onExportDatasetsCsv}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs"
                  title="Export connected datasets inventory as CSV"
                >
                  <Download className="mr-1 h-3 w-3 text-cyan-400" /> CSV
                </Button>
              )}

              <Link to="/workspace/datasets" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 ml-1">
                All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {filteredDatasets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredDatasets.slice(0, 8).map((ds, i) => {
                const rowCount = Number(ds.row_count || ds.rows || 0);
                const colCount = Number(ds.column_count || ds.cols || 0);
                const qualityScore = typeof ds.quality === 'number' 
                  ? ds.quality 
                  : typeof ds.data_quality_score === 'number' 
                  ? ds.data_quality_score 
                  : 100;
                const hasAnomaly = qualityScore < 92;

                return (
                  <Card 
                    key={ds.id || i}
                    onContextMenu={(e) => onContextMenu(e, {
                      id: ds.id || `ds-${i}`,
                      type: 'dataset',
                      title: ds.name || "Dataset",
                      description: `${formatCompact(rowCount)} rows, ${colCount} columns`,
                      path: '/workspace/datasets',
                      qualityScore: qualityScore,
                      hasAnomaly: hasAnomaly
                    })}
                    className="bg-slate-900/50 border-slate-800/80 hover:border-cyan-500/50 transition-all rounded-2xl p-4 sm:p-5 space-y-3.5 backdrop-blur-xl group flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <ProjectAnomalyBadge 
                            anomalyCount={hasAnomaly ? 1 : 0}
                            qualityScore={qualityScore}
                            compact
                          />
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase">
                            {ds.file_type || "Table"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                          {ds.name || "Untitled Dataset"}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                          {ds.description || "Connected enterprise data source."}
                        </p>
                      </div>

                      {preferences.showSparklines && (
                        <div className="pt-0.5">
                          <ProjectSparkline 
                            seedKey={`ds-trend-${ds.id || i}`} 
                            kpiLabel="Query Traffic" 
                            color="cyan" 
                            height={20} 
                            showDaysLabel={false} 
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>Rows: {formatCompact(rowCount)}</span>
                        <span>Cols: {colCount}</span>
                        <span className="text-emerald-400">DQI: {qualityScore}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button 
                        onClick={() => onNavigate('/workspace/datasets')}
                        size="sm"
                        className="w-full h-7.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        <Eye className="mr-1 h-3 w-3 text-cyan-400" /> View
                      </Button>
                      <Button 
                        onClick={() => onNavigate(`/workspace/ai/chat?q=Perform in-depth statistical analysis on dataset ${encodeURIComponent(ds.name || 'Dataset')}`)}
                        size="sm"
                        className="w-full h-7.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-[10px] font-bold text-indigo-300"
                      >
                        <Bot className="mr-1 h-3 w-3" /> Ask AI
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-slate-900/30 border-dashed border-slate-800 p-7 rounded-2xl text-center space-y-3">
              <div className="p-3.5 bg-slate-900 rounded-full w-fit mx-auto border border-slate-800 text-slate-500">
                <Database className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Datasets Connected Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Upload CSV, Excel, JSON or Parquet files to activate multi-pass data quality profiling and autonomous anomaly detection.
                </p>
              </div>
              <div className="pt-1">
                <Button 
                  onClick={() => onNavigate('/workspace/datasets')}
                  size="sm"
                  className="h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Dataset
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
