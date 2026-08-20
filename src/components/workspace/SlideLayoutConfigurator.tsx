import React, { useState, useMemo } from "react";
import {
  Presentation, Layout, Sparkles, Check, CheckCircle2,
  FileText, TrendingUp, Cpu, ShieldAlert, Sliders, Download,
  Layers, Palette, BarChart3, AlertTriangle, ArrowRight,
  PieChart, GitFork, Target, ShieldCheck, AlertOctagon,
  Award, Clock, CheckSquare, Square, Eye, Zap, Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportReportToPPT, PptExportOptions } from "@/lib/pptExporter";

export type SlideLayoutTemplate = 
  | "Executive Summary" 
  | "Trend Analysis" 
  | "Causal Insight" 
  | "Risk Governance"
  | "ML & Cloud Compute"
  | "Boardroom Strategic"
  | "Deep Statistical Audit"
  | "Master Comprehensive (15 Slides)"
  | "Custom Bespoke";

export interface SlideLayoutConfiguratorProps {
  report: any;
  onExportComplete?: () => void;
  className?: string;
}

export interface SlideDefinition {
  id: string;
  num: number;
  title: string;
  desc: string;
  category: "Executive" | "Analytics" | "Causal" | "Infrastructure" | "Governance";
  icon: any;
  badge: string;
  badgeColor: string;
}

export const ALL_AVAILABLE_SLIDES: SlideDefinition[] = [
  { id: "cover", num: 1, title: "Executive Cover Slide", desc: "Title, Verified Precision Badge, Dataset Metadata & Author Info", category: "Executive", icon: Presentation, badge: "16:9 Cover", badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { id: "exec_summary", num: 2, title: "Executive Summary & Highlight Pods", desc: "C-Suite Narrative, Core Strategic Takeaway, Revenue ROI, & Governance Verdict", category: "Executive", icon: FileText, badge: "C-Suite Pods", badgeColor: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  { id: "kpi_scorecard", num: 3, title: "C-Suite KPI Scorecard Matrix", desc: "6 Executive Metric Cards (DQI, Bootstrap Confidence, ML Readiness, Outliers)", category: "Executive", icon: ShieldCheck, badge: "6 KPI Cards", badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { id: "trend_analysis", num: 4, title: "Trend Analysis & 95% Bootstrap CI", desc: "Native Clustered Bar Chart plotting point estimates against 95% confidence intervals", category: "Analytics", icon: BarChart3, badge: "Native Chart", badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { id: "causal_insight", num: 5, title: "Causal Insight & Signal Drivers", desc: "Native Horizontal Bar Chart quantifying causal predictor weights and SHAP concentration", category: "Causal", icon: GitFork, badge: "Causal Chart", badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  { id: "data_quality", num: 6, title: "Data Quality Health Allocation", desc: "Native Doughnut Chart detailing Completeness, Consistency, Validity, & Integrity weights", category: "Analytics", icon: PieChart, badge: "Doughnut Chart", badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  { id: "anomaly_audit", num: 7, title: "Anomalous Spikes & Volatility Audit", desc: "Structured outlier matrix with Z-scores, spike causes, and automated mitigations", category: "Governance", icon: AlertOctagon, badge: "Audit Table", badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  { id: "deep_insights", num: 8, title: "Senior Data Scientist Deep Insights", desc: "2-Column comparative analysis of validated advantages (Pros) vs critical risks (Cons)", category: "Executive", icon: Sparkles, badge: "Pros & Cons", badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { id: "causal_root_cause", num: 9, title: "Causal Root-Cause & Countermeasures", desc: "Directional causality matrix linking observed metrics to confounding variables & treatments", category: "Causal", icon: Target, badge: "Root-Cause Matrix", badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
  { id: "ml_matrix", num: 10, title: "Algorithmic ML Production Readiness", desc: "Suitability percentages, target benchmark metrics, and sub-15ms inference latencies", category: "Analytics", icon: Layers, badge: "ML Matrix", badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { id: "action_roadmap", num: 11, title: "Strategic Action Roadmap & ROI Table", desc: "Prioritized corporate roadmap with execution timelines, priority badges, and expected ROI", category: "Executive", icon: TrendingUp, badge: "ROI Roadmap", badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { id: "multi_agent", num: 12, title: "Multi-Agent Consensus & Sign-Off", desc: "4 AI Specialist Auditor certifications & SOC2 enterprise governance sign-offs", category: "Governance", icon: Award, badge: "4 Sign-Offs", badgeColor: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
  { id: "compute_optimization", num: 13, title: "Compute Efficiency & Workload Optimization", desc: "Cloud pushdown execution, memory saturation metrics, and container cost optimization", category: "Infrastructure", icon: Cpu, badge: "Infrastructure", badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/20" },
  { id: "collinearity_matrix", num: 14, title: "Feature Collinearity & VIF Diagnostics", desc: "Pearson r cross-correlations, Variance Inflation Factors (VIF), and dimensionality advice", category: "Causal", icon: Sliders, badge: "VIF Matrix", badgeColor: "bg-pink-500/10 text-pink-300 border-pink-500/20" },
  { id: "closing_governance", num: 15, title: "Board Advisory Governance & Legal", desc: "Institutional confidentiality notice, audit disclaimers, and official contact channels", category: "Governance", icon: CheckCircle2, badge: "Governance", badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/20" }
];

interface TemplateOption {
  id: SlideLayoutTemplate;
  title: string;
  badge: string;
  description: string;
  slideCount: number;
  slideIds: string[];
  icon: any;
  highlights: string[];
  color: string;
  wireframeType: "exec_summary" | "trend_analysis" | "causal_insight" | "risk_gov" | "ml_comp" | "board_strat" | "deep_stat" | "comprehensive";
}

// Visual Wireframe Mini-Renderer for 16:9 Slide Representations
function SlideWireframePreview({ type, isSelected }: { type: string; isSelected: boolean }) {
  return (
    <div className={`w-full aspect-[16/9] rounded-lg p-2 flex flex-col justify-between transition-all border ${
      isSelected 
        ? "bg-slate-950/90 border-amber-500/40 shadow-inner" 
        : "bg-slate-950/60 border-slate-800/80 group-hover:border-slate-700"
    }`}>
      {/* Slide Top Header Bar */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-800/60 pb-1">
        <div className="flex items-center gap-1">
          <div className={`h-1.5 w-12 rounded-sm ${isSelected ? 'bg-amber-400' : 'bg-slate-500'}`} />
          <div className="h-1.5 w-6 rounded-sm bg-slate-700" />
        </div>
        <div className="h-1.5 w-8 rounded-full bg-slate-800" />
      </div>

      {/* Wireframe Body Content based on template type */}
      {type === "exec_summary" && (
        <div className="grid grid-cols-3 gap-1.5 py-1 flex-1">
          <div className="col-span-2 flex flex-col justify-between py-0.5">
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-700/80 rounded" />
              <div className="h-1.5 w-4/5 bg-slate-800 rounded" />
              <div className="h-1.5 w-3/5 bg-slate-800 rounded" />
            </div>
            <div className="flex gap-1 pt-1">
              <div className="h-3.5 flex-1 bg-violet-950/60 border border-violet-700/40 rounded flex items-center justify-center">
                <div className="h-1 w-6 bg-violet-400 rounded-sm" />
              </div>
              <div className="h-3.5 flex-1 bg-emerald-950/60 border border-emerald-700/40 rounded flex items-center justify-center">
                <div className="h-1 w-6 bg-emerald-400 rounded-sm" />
              </div>
            </div>
          </div>
          <div className="col-span-1 bg-slate-900 border border-slate-800 rounded p-1 flex flex-col justify-between">
            <div className="h-1.5 w-6 bg-amber-400/80 rounded" />
            <div className="h-3 w-8 bg-amber-500/20 border border-amber-500/40 rounded mx-auto" />
            <div className="h-1 w-full bg-slate-800 rounded" />
          </div>
        </div>
      )}

      {type === "trend_analysis" && (
        <div className="flex flex-col justify-between py-1 flex-1">
          <div className="flex items-end justify-between gap-1 h-7 px-1 pt-1 border-b border-slate-800">
            <div className="w-2.5 h-3 bg-blue-500/40 rounded-t-sm" />
            <div className="w-2.5 h-4.5 bg-blue-500/60 rounded-t-sm" />
            <div className="w-2.5 h-6 bg-blue-500/90 rounded-t-sm" />
            <div className="w-2.5 h-5 bg-teal-500/80 rounded-t-sm" />
            <div className="w-2.5 h-6.5 bg-emerald-400 rounded-t-sm" />
          </div>
          <div className="flex items-center justify-between text-[6px] font-mono text-slate-500 pt-0.5">
            <span>±3σ Band</span>
            <span className="text-emerald-400">CI 95%</span>
          </div>
        </div>
      )}

      {type === "causal_insight" && (
        <div className="grid grid-cols-2 gap-1.5 py-1 flex-1 items-center">
          {/* Causal DAG Graph Tree */}
          <div className="flex items-center justify-center gap-1 border-r border-slate-800/80 pr-1">
            <div className="h-3 w-3 rounded-full bg-purple-500/30 border border-purple-400 flex items-center justify-center text-[5px]">A</div>
            <span className="text-[6px] text-purple-400">➔</span>
            <div className="h-3 w-3 rounded-full bg-violet-500/30 border border-violet-400 flex items-center justify-center text-[5px]">B</div>
          </div>
          {/* Horizontal SHAP Bars */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-purple-500/70 rounded" />
            <div className="h-1.5 w-3/4 bg-violet-500/60 rounded" />
            <div className="h-1.5 w-1/2 bg-slate-700 rounded" />
          </div>
        </div>
      )}

      {type === "risk_gov" && (
        <div className="grid grid-cols-2 gap-1 py-1 flex-1">
          <div className="p-1 rounded bg-rose-950/40 border border-rose-800/40 flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <div className="h-1 w-6 bg-rose-300 rounded" />
            </div>
            <div className="h-1 w-full bg-slate-800 rounded" />
          </div>
          <div className="p-1 rounded bg-emerald-950/40 border border-emerald-800/40 flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <div className="h-1 w-6 bg-emerald-300 rounded" />
            </div>
            <div className="h-1 w-full bg-slate-800 rounded" />
          </div>
        </div>
      )}

      {type === "ml_comp" && (
        <div className="grid grid-cols-3 gap-1 py-1 flex-1 items-center">
          <div className="col-span-1 h-full bg-sky-950/40 border border-sky-800/40 rounded flex flex-col items-center justify-center">
            <div className="h-2 w-2 rounded-full border-2 border-sky-400" />
            <span className="text-[5px] font-mono text-sky-300">&lt;15ms</span>
          </div>
          <div className="col-span-2 space-y-1">
            <div className="h-1.5 w-full bg-slate-700 rounded" />
            <div className="h-1.5 w-4/5 bg-sky-500/60 rounded" />
            <div className="h-1.5 w-2/3 bg-blue-500/40 rounded" />
          </div>
        </div>
      )}

      {type === "board_strat" && (
        <div className="space-y-1 py-1 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="h-2 flex-1 bg-amber-500/40 rounded-sm" />
            <div className="h-2 flex-1 bg-amber-500/70 rounded-sm" />
            <div className="h-2 flex-1 bg-orange-500 rounded-sm" />
          </div>
          <div className="grid grid-cols-2 gap-1 pt-0.5">
            <div className="h-2.5 bg-slate-900 border border-slate-800 rounded" />
            <div className="h-2.5 bg-slate-900 border border-slate-800 rounded" />
          </div>
        </div>
      )}

      {type === "deep_stat" && (
        <div className="flex flex-col justify-between py-1 flex-1">
          <div className="flex items-center justify-center gap-0.5 h-6 px-1">
            <div className="w-1.5 h-1.5 bg-teal-500/30 rounded-t-sm" />
            <div className="w-1.5 h-3 bg-teal-500/60 rounded-t-sm" />
            <div className="w-2 h-5 bg-teal-400 rounded-t-sm" />
            <div className="w-1.5 h-3 bg-teal-500/60 rounded-t-sm" />
            <div className="w-1.5 h-1.5 bg-teal-500/30 rounded-t-sm" />
          </div>
          <div className="h-1 w-full bg-slate-800 rounded" />
        </div>
      )}

      {type === "comprehensive" && (
        <div className="relative flex items-center justify-center py-1 flex-1">
          <div className="absolute top-1 left-2 w-16 h-5 rounded bg-slate-800/40 border border-slate-700/40 rotate-[-4deg]" />
          <div className="absolute top-1.5 left-4 w-16 h-5 rounded bg-slate-800/70 border border-slate-700/60 rotate-[-1deg]" />
          <div className="relative z-10 w-18 h-6 rounded bg-gradient-to-r from-fuchsia-950 to-slate-900 border border-fuchsia-500/60 flex items-center justify-center shadow-lg">
            <span className="text-[7px] font-bold text-fuchsia-300 font-mono">15 SLIDES</span>
          </div>
        </div>
      )}

      {/* Slide Bottom Footer Line */}
      <div className="flex items-center justify-between pt-0.5 border-t border-slate-800/60 text-[5px] text-slate-500">
        <span>VIVEXA AI</span>
        <span>CONFIDENTIAL</span>
      </div>
    </div>
  );
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "Executive Summary",
    title: "Executive Summary",
    badge: "Board & C-Suite",
    description: "High-density brief emphasizing bottom-line KPIs, strategic risks, and immediate 30-day prescriptive action items.",
    slideCount: 5,
    slideIds: ["cover", "exec_summary", "kpi_scorecard", "action_roadmap", "closing_governance"],
    icon: Presentation,
    color: "from-blue-600 to-indigo-600",
    wireframeType: "exec_summary",
    highlights: ["Headline KPIs & Delta Trajectory", "Executive Summary Briefing", "Strategic Recommendations & Milestones"]
  },
  {
    id: "Trend Analysis",
    title: "Trend Analysis",
    badge: "Analytics & FP&A",
    description: "Deep statistical dive focusing on historical time series, seasonal decomposition, parametric control limits, and forecasted trajectories.",
    slideCount: 6,
    slideIds: ["cover", "exec_summary", "kpi_scorecard", "trend_analysis", "data_quality", "closing_governance"],
    icon: TrendingUp,
    color: "from-emerald-600 to-teal-600",
    wireframeType: "trend_analysis",
    highlights: ["Time-Series Metric Scorecards", "Parametric Control Bands (±3σ)", "Seasonal & Cyclical Decomposition"]
  },
  {
    id: "Causal Insight",
    title: "Causal Insight",
    badge: "Data Science & Eng",
    description: "Root-cause breakdown, parametric outlier detection (spikes & dropouts), attribution matrix, and automated mitigation steps.",
    slideCount: 6,
    slideIds: ["cover", "exec_summary", "causal_insight", "causal_root_cause", "collinearity_matrix", "closing_governance"],
    icon: GitFork,
    color: "from-violet-600 to-purple-600",
    wireframeType: "causal_insight",
    highlights: ["Root Cause Attribution Matrix", "Anomalous Spikes & Drops Diagnostic", "Prescriptive Mitigation Steps"]
  },
  {
    id: "Risk Governance",
    title: "Risk & Anomaly Governance",
    badge: "SOC2 / Audit",
    description: "Rigorous compliance audit detailing Z-score anomaly outliers, data health breakdown, and multi-agent auditor signatures.",
    slideCount: 7,
    slideIds: ["cover", "exec_summary", "kpi_scorecard", "data_quality", "anomaly_audit", "multi_agent", "closing_governance"],
    icon: ShieldCheck,
    color: "from-rose-600 to-amber-600",
    wireframeType: "risk_gov",
    highlights: ["Z-Score Outlier Audit", "Multi-Agent Consensus Signatures", "Data Quality Distribution"]
  },
  {
    id: "ML & Cloud Compute",
    title: "ML & Compute Architecture",
    badge: "ML Systems",
    description: "Production algorithm readiness, low-latency microVM inference benchmarks, and query pushdown optimization metrics.",
    slideCount: 8,
    slideIds: ["cover", "exec_summary", "kpi_scorecard", "ml_matrix", "compute_optimization", "collinearity_matrix", "action_roadmap", "closing_governance"],
    icon: Cpu,
    color: "from-cyan-600 to-blue-600",
    wireframeType: "ml_comp",
    highlights: ["Sub-15ms Latency Benchmarks", "Query Pushdown Resource TCO", "Feature Collinearity Matrix"]
  },
  {
    id: "Boardroom Strategic",
    title: "Boardroom Strategic Investment",
    badge: "Investor / M&A",
    description: "Comprehensive 10-slide deck delivering strategic ROI roadmaps, Deep Pros vs Cons insights, and audited consensus.",
    slideCount: 10,
    slideIds: ["cover", "exec_summary", "kpi_scorecard", "trend_analysis", "data_quality", "deep_insights", "action_roadmap", "multi_agent", "compute_optimization", "closing_governance"],
    icon: Target,
    color: "from-amber-600 to-orange-600",
    wireframeType: "board_strat",
    highlights: ["ROI Roadmap Milestones", "Senior Scientist Pros & Cons", "Full Board Governance"]
  },
  {
    id: "Deep Statistical Audit",
    title: "Deep Statistical & Empirical Audit",
    badge: "Empirical Rigor",
    description: "12-slide comprehensive scientific dossier with 95% Bootstrap CI charts, VIF collinearity, and root-cause analysis.",
    slideCount: 12,
    slideIds: ["cover", "exec_summary", "kpi_scorecard", "trend_analysis", "causal_insight", "data_quality", "anomaly_audit", "collinearity_matrix", "ml_matrix", "action_roadmap", "multi_agent", "closing_governance"],
    icon: BarChart3,
    color: "from-teal-600 to-emerald-600",
    wireframeType: "deep_stat",
    highlights: ["10,000 Bootstrap Resamples", "VIF & Correlation Diagnostics", "Complete Outlier Remediation"]
  },
  {
    id: "Master Comprehensive (15 Slides)",
    title: "Master Comprehensive Suite",
    badge: "Full 15-Slide Suite",
    description: "Every single layout concatenated into a definitive, 15-slide institutional PowerPoint presentation deck.",
    slideCount: 15,
    slideIds: ALL_AVAILABLE_SLIDES.map(s => s.id),
    icon: Layers,
    color: "from-fuchsia-600 to-rose-600",
    wireframeType: "comprehensive",
    highlights: ["All 15 Native Slide Layouts", "Full Native Charts & Tables", "End-to-End Enterprise Governance"]
  }
];

export function SlideLayoutConfigurator({
  report,
  onExportComplete,
  className = ""
}: SlideLayoutConfiguratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SlideLayoutTemplate>("Executive Summary");
  const [selectedTheme, setSelectedTheme] = useState<"emerald" | "dark" | "indigo" | "light" | "crimson" | "cyberpunk">("emerald");
  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>(
    TEMPLATE_OPTIONS[0].slideIds
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [includeProvenance, setIncludeProvenance] = useState<boolean>(true);
  const [includeBadges, setIncludeBadges] = useState<boolean>(true);
  const [showSlidePicker, setShowSlidePicker] = useState<boolean>(false);

  // Filter slides based on active category
  const filteredSlides = useMemo(() => {
    if (activeCategoryFilter === "All") return ALL_AVAILABLE_SLIDES;
    return ALL_AVAILABLE_SLIDES.filter(s => s.category === activeCategoryFilter);
  }, [activeCategoryFilter]);

  // Handle template selection
  const handleSelectTemplate = (template: TemplateOption) => {
    setSelectedTemplate(template.id);
    setSelectedSlideIds(template.slideIds);
  };

  // Handle slide count slider adjustment (1 to 15)
  const handleSlideCountSlider = (count: number) => {
    setSelectedTemplate("Custom Bespoke");
    const sliced = ALL_AVAILABLE_SLIDES.slice(0, count).map(s => s.id);
    // Ensure cover and closing are included if count > 1
    if (count > 1 && !sliced.includes("closing_governance")) {
      sliced[sliced.length - 1] = "closing_governance";
    }
    setSelectedSlideIds(sliced);
  };

  // Toggle individual slide layout
  const handleToggleSlide = (id: string) => {
    setSelectedTemplate("Custom Bespoke");
    if (selectedSlideIds.includes(id)) {
      if (selectedSlideIds.length <= 1) {
        toast.warning("At least one slide layout must remain selected.");
        return;
      }
      setSelectedSlideIds(selectedSlideIds.filter(s => s !== id));
    } else {
      setSelectedSlideIds([...selectedSlideIds, id]);
    }
  };

  const handleGeneratePpt = async () => {
    if (!report) {
      toast.error("No report data loaded for PowerPoint generation.");
      return;
    }

    if (selectedSlideIds.length === 0) {
      toast.error("Please select at least one slide layout.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(`Generating ${selectedSlideIds.length}-slide PowerPoint deck [${selectedTheme.toUpperCase()}]...`);

    try {
      const options: PptExportOptions = {
        theme: selectedTheme,
        deckType: selectedSlideIds.length >= 13 ? "comprehensive" : "custom",
        selectedSlideLayouts: selectedSlideIds,
        includeCharts: true,
        includeAnomalies: includeBadges,
        includeRoadmap: true,
        includeBootstrapCI: true
      };

      await exportReportToPPT(report, options);
      toast.success(`PowerPoint presentation (${selectedSlideIds.length} slides) exported successfully!`, { id: toastId });
      if (onExportComplete) onExportComplete();
    } catch (err: any) {
      console.error("PPT Generation error:", err);
      toast.error(err?.message || "Failed to generate PowerPoint deck.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const estimatedMinutes = Math.max(3, Math.round(selectedSlideIds.length * 1.5));

  return (
    <Card className={`bg-slate-900/80 border-slate-800 backdrop-blur-xl p-5 rounded-2xl shadow-xl space-y-6 ${className}`} id="slide-layout-configurator">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-violet-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layout className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Slide Layout Configurator & Visual Studio</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                15 Layout Presets
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visual radio-group selector with 16:9 layout wireframes for Executive Summary, Trend Analysis, Causal Insight, and beyond.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400 font-mono">Est. Run:</span>
            <strong className="text-white font-mono">~{estimatedMinutes} min</strong>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
            {selectedSlideIds.length} / 15 Slides
          </span>
        </div>
      </div>

      {/* Visual Radio-Group Slide Deck Archetypes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            Select Slide Layout Template (Visual Radio Group)
          </label>
          <span className="text-[11px] text-slate-400">
            Click any wireframe card to preview and apply structure
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" role="radiogroup" aria-label="Slide Layout Templates">
          {TEMPLATE_OPTIONS.map((opt) => {
            const isSelected = selectedTemplate === opt.id;
            const Icon = opt.icon;

            return (
              <div
                key={opt.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleSelectTemplate(opt)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    handleSelectTemplate(opt);
                  }
                }}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-800/95 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/50"
                    : "bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/70"
                }`}
              >
                <div>
                  {/* Card Title & Radio Pill Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${opt.color} text-white shrink-0 shadow-md`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-extrabold text-white truncate">{opt.title}</span>
                    </div>

                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "border-amber-400 bg-amber-500" : "border-slate-700 bg-slate-900"
                    }`}>
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>

                  {/* Visual 16:9 Slide Wireframe Diagram */}
                  <div className="my-2.5">
                    <SlideWireframePreview type={opt.wireframeType} isSelected={isSelected} />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {opt.description}
                  </p>
                </div>

                {/* Footer Pill */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    {opt.badge}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/80">
                    {opt.slideCount} Slides
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide Count Range Slider & Granular Customizer */}
      <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Slide Count & Range Scrubber: <span className="text-amber-400 font-mono font-extrabold">{selectedSlideIds.length} Slides</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Drag slider to automatically scale the deck size from a 3-slide quick briefing up to the full 15-slide master suite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSlidePicker(!showSlidePicker)}
              className="h-7 text-xs bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              <Eye className="h-3 w-3 mr-1.5 text-cyan-400" />
              {showSlidePicker ? "Hide Individual Slides" : "Customize Slide Layouts (15)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTemplate("Master Comprehensive (15 Slides)");
                setSelectedSlideIds(ALL_AVAILABLE_SLIDES.map(s => s.id));
              }}
              className="h-7 text-xs bg-indigo-950/40 border-indigo-800/60 hover:bg-indigo-900/60 text-indigo-300"
            >
              <Zap className="h-3 w-3 mr-1 text-amber-400" /> Select All 15
            </Button>
          </div>
        </div>

        {/* Range Slider for Slide Count */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>3 Slides (Briefing)</span>
            <span>6 Slides (Standard)</span>
            <span>9 Slides (Deep Dive)</span>
            <span>12 Slides (Audit)</span>
            <span className="text-amber-400 font-bold">15 Slides (Master Suite)</span>
          </div>
          <input
            type="range"
            min={3}
            max={15}
            step={1}
            value={selectedSlideIds.length}
            onChange={(e) => handleSlideCountSlider(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            id="slide-count-range-slider"
          />
        </div>

        {/* Individual Slide Layout Pickers (Toggleable) */}
        {showSlidePicker && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">Individual Slide Layout Selection:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["All", "Executive", "Analytics", "Causal", "Infrastructure", "Governance"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      activeCategoryFilter === cat
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredSlides.map((slide) => {
                const isSelected = selectedSlideIds.includes(slide.id);
                const Icon = slide.icon;

                return (
                  <div
                    key={slide.id}
                    onClick={() => handleToggleSlide(slide.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 select-none ${
                      isSelected
                        ? "bg-slate-900/90 border-indigo-500/60 shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5 text-indigo-400 shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="text-xs font-bold text-white truncate">{slide.num}. {slide.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{slide.desc}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border shrink-0 ${slide.badgeColor}`}>
                      {slide.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Visual Themes & Design Styles (6 Theme Palettes) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-violet-400" />
          Choose Visual Theme & Design Palette (6 Options)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { id: "emerald", label: "ESG Emerald", desc: "Forest green & gold", color: "from-emerald-600 to-teal-500", border: "border-emerald-500" },
            { id: "dark", label: "Midnight Dark", desc: "Slate & neon purple", color: "from-violet-600 to-indigo-500", border: "border-violet-500" },
            { id: "indigo", label: "Clean Indigo", desc: "Navy & cyan accents", color: "from-blue-600 to-indigo-500", border: "border-blue-500" },
            { id: "light", label: "Crisp Minimal", desc: "High-contrast paper", color: "from-slate-100 to-slate-300 text-slate-900", border: "border-slate-300" },
            { id: "crimson", label: "Crimson Executive", desc: "Ruby slate & amber", color: "from-rose-600 to-pink-500", border: "border-rose-500" },
            { id: "cyberpunk", label: "Cyberpunk Tech", desc: "Cyan & magenta telemetry", color: "from-cyan-500 to-fuchsia-500", border: "border-cyan-500" }
          ].map((th) => {
            const isSelected = selectedTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setSelectedTheme(th.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? "bg-slate-800/90 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${th.color}`} />
                  <span className="text-xs font-bold text-white truncate">{th.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{th.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta Options & Audit Provenance Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={includeProvenance}
            onChange={(e) => setIncludeProvenance(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
          />
          <div>
            <span className="font-semibold text-slate-200">Include Audit Provenance & Watermarks</span>
            <p className="text-[10px] text-slate-400">Injects SOC2 signatures and multi-agent audit notes into footer</p>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={includeBadges}
            onChange={(e) => setIncludeBadges(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
          />
          <div>
            <span className="font-semibold text-slate-200">Inject Statistical Anomaly Badges</span>
            <p className="text-[10px] text-slate-400">Highlights ±3σ outlier spikes, volatility, and causal signals</p>
          </div>
        </label>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="text-xs text-slate-400">
          Selected: <strong className="text-amber-400 font-mono font-bold">{selectedSlideIds.length} Slides</strong> ({selectedTemplate}) • Theme: <strong className="text-white capitalize">{selectedTheme}</strong>
        </div>

        <Button
          onClick={handleGeneratePpt}
          disabled={isExporting}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 hover:from-amber-400 hover:via-rose-400 hover:to-violet-500 text-slate-950 font-extrabold text-xs h-10 px-6 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          id="btn-generate-ppt-configured"
        >
          <Presentation className="h-4 w-4 mr-2" />
          {isExporting ? `Exporting ${selectedSlideIds.length} Slides...` : `Generate ${selectedSlideIds.length}-Slide Presentation (.pptx)`}
        </Button>
      </div>
    </Card>
  );
}
