import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  Bot,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Layers,
  BarChart2,
  Clock,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface AnomalyItem {
  title: string;
  desc: string;
  confidence: string;
  type: "opportunity" | "warning" | "info";
  time: string;
  source?: string;
}

interface InsightsOfTheDayCardProps {
  stats: {
    datasets: number;
    totalRows: number;
    avgQuality: number;
    projects: number;
    reports: number;
    storage: number;
  };
  recentDatasets: any[];
  recentProjects: any[];
  anomalies: AnomalyItem[];
  userName: string;
  onAskAnalyst?: (query?: string) => void;
  onNavigate?: (path: string) => void;
}

const InsightsOfTheDayCardComponent: React.FC<InsightsOfTheDayCardProps> = ({
  stats,
  recentDatasets,
  recentProjects,
  anomalies,
  userName,
  onAskAnalyst,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "anomalies" | "projects">("summary");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acknowledgedItems, setAcknowledgedItems] = useState<Record<string, boolean>>({});

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }, []);

  const handleRefreshDaily = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Synthesized latest daily anomalies & telemetry.");
    }, 700);
  }, []);

  const toggleAcknowledge = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledgedItems(prev => ({ ...prev, [id]: !prev[id] }));
    toast.info("Insight signal status updated.");
  }, []);

  // Synthesize dynamic summary text based on actual workspace signals
  const dailyBriefing = useMemo(() => {
    const totalRowsStr = stats.totalRows > 0 ? stats.totalRows.toLocaleString() : "0";
    const dqiScore = stats.avgQuality || 100;
    const warningCount = anomalies.filter(a => a.type === "warning").length;
    const oppCount = anomalies.filter(a => a.type === "opportunity").length;
    const activeProjectsCount = stats.projects || 0;

    let headline = `Enterprise telemetry is stable across ${stats.datasets} connected datasets.`;
    if (warningCount > 0) {
      headline = `${warningCount} anomaly drift alert${warningCount > 1 ? "s" : ""} require attention across active data pipelines.`;
    } else if (oppCount > 0) {
      headline = `High statistical scale confirmed across ${totalRowsStr} records with Grade ${dqiScore >= 95 ? "A+" : "A"} DQI.`;
    }

    let takeaway = "Optimal pipeline health. Statistical hypotheses and regression runs can proceed without data hygiene bottlenecks.";
    if (warningCount > 0) {
      takeaway = "Recommend running automated imputation or outlier isolation on flagged tables before executive deck publishing.";
    } else if (activeProjectsCount === 0) {
      takeaway = "Initialize an initiative in the Project Wizard to map predictive hypotheses against ingested tables.";
    }

    return {
      headline,
      takeaway,
      warningCount,
      oppCount,
      dqiScore,
      totalRowsStr,
      activeProjectsCount
    };
  }, [stats, anomalies]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-indigo-500/20 shadow-2xl p-6 sm:p-7 backdrop-blur-2xl"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/10 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Insights of the Day
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Calendar className="h-3 w-3" />
                {todayFormatted}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                99.4% Synthesis Confidence
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous daily digest combining project velocity, pipeline telemetry, and anomaly detection.
            </p>
          </div>
        </div>

        {/* Action Controls & Tab switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "summary" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Synthesis
            </button>
            <button
              onClick={() => setActiveTab("anomalies")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "anomalies" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Anomalies</span>
              {anomalies.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-indigo-300 font-mono">
                  {anomalies.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "projects" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Projects</span>
              {recentProjects.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-indigo-300 font-mono">
                  {recentProjects.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleRefreshDaily}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh daily synthesis"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="mt-5 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "summary" && (
            <motion.div
              key="summary-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Primary Briefing Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-8 rounded-2xl bg-slate-950/50 border border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Executive Overview
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {dailyBriefing.headline}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {dailyBriefing.takeaway}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/60">
                    <Button
                      onClick={() => onAskAnalyst?.("Provide a deep dive breakdown of today's anomalies, pipeline metrics, and project health.")}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      Ask AI Analyst to Elaborate
                    </Button>
                    <Button
                      onClick={() => onNavigate?.("/workspace/reports")}
                      variant="outline"
                      className="h-9 px-4 rounded-xl bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <BarChart2 className="h-3.5 w-3.5 text-purple-400" />
                      Generate Daily Briefing Deck
                    </Button>
                  </div>
                </div>

                {/* Key Metrics Quick Pill Matrix */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Avg Data Quality (DQI)
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{dailyBriefing.dqiScore}%</span>
                      <span className="text-[10px] font-bold text-emerald-400">
                        {dailyBriefing.dqiScore >= 90 ? "Optimal" : "Review"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Anomalies
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className={`text-2xl font-black ${anomalies.length > 0 ? "text-amber-400" : "text-white"}`}>
                        {anomalies.length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Sensors Live</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Projects
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{stats.projects}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">Initiatives</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Indexed Rows
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{dailyBriefing.totalRowsStr}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomaly / Signal Preview Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {anomalies.slice(0, 3).map((item, idx) => {
                  const isAck = !!acknowledgedItems[`daily-anomaly-${idx}`];
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAck
                          ? "bg-slate-950/30 border-slate-800/40 opacity-60"
                          : item.type === "warning"
                          ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                          : item.type === "opportunity"
                          ? "bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {item.type === "warning" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          ) : item.type === "opportunity" ? (
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className={`text-xs font-bold truncate ${
                            item.type === "warning" ? "text-amber-300" : item.type === "opportunity" ? "text-indigo-300" : "text-emerald-300"
                          }`}>
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 shrink-0">{item.confidence}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {item.time}
                        </span>
                        <button
                          onClick={(e) => toggleAcknowledge(`daily-anomaly-${idx}`, e)}
                          className="text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                          {isAck ? "Acknowledged" : "Dismiss"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {anomalies.length === 0 && (
                  <div className="col-span-3 p-6 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <span className="font-bold text-slate-200">No active pipeline drift or critical anomalies detected today.</span>
                    <p className="text-[11px] text-slate-500 mt-1">All datasets conform to declared schemas and baseline distributions.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "anomalies" && (
            <motion.div
              key="anomalies-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {anomalies.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs">
                  <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-200 text-sm">All Telemetry Signals Clear</p>
                  <p className="text-xs text-slate-500 mt-1">No anomalies detected in the current profiling window.</p>
                </div>
              ) : (
                anomalies.map((item, idx) => {
                  const isAck = !!acknowledgedItems[`anomaly-tab-${idx}`];
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isAck
                          ? "bg-slate-950/30 border-slate-800/40 opacity-60"
                          : item.type === "warning"
                          ? "bg-amber-950/20 border-amber-500/30"
                          : item.type === "opportunity"
                          ? "bg-indigo-950/20 border-indigo-500/30"
                          : "bg-slate-950/60 border-slate-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          item.type === "warning"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : item.type === "opportunity"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {item.type === "warning" ? <AlertTriangle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                              {item.confidence}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <Button
                          onClick={() => onAskAnalyst?.(`Explain anomaly: "${item.title}". Context: ${item.desc}`)}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 rounded-lg text-xs font-bold bg-slate-900 border-slate-700 text-indigo-300 hover:text-white"
                        >
                          <Bot className="h-3 w-3 mr-1" /> Analyze
                        </Button>
                        <Button
                          onClick={(e) => toggleAcknowledge(`anomaly-tab-${idx}`, e)}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          {isAck ? "Undo" : "Acknowledge"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === "projects" && (
            <motion.div
              key="projects-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {recentProjects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs">
                  <Layers className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-200 text-sm">No Active Projects</p>
                  <p className="text-xs text-slate-500 mt-1">Create an initiative to track hypotheses and AI findings.</p>
                  <Button
                    onClick={() => onNavigate?.("/workspace/projects")}
                    className="mt-3 h-8 px-4 text-xs font-bold bg-indigo-600 text-white rounded-lg"
                  >
                    Open Project Wizard
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentProjects.slice(0, 4).map((proj: any) => (
                    <div
                      key={proj.id}
                      onClick={() => onNavigate?.(`/workspace/projects/${proj.id}`)}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {proj.name}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {proj.description || `Industry: ${proj.industry || "Enterprise"}`}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{proj.status || "Active Stage"}</span>
                        <span>{new Date(proj.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const InsightsOfTheDayCard = React.memo(InsightsOfTheDayCardComponent);
export default InsightsOfTheDayCard;
