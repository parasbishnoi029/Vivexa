import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Presentation, Layout, Sparkles, Check, CheckCircle2,
  FileText, TrendingUp, Cpu, ShieldAlert, Sliders, Download,
  Layers, Palette, BarChart3, AlertTriangle, ArrowRight,
  PieChart, GitFork, Target, ShieldCheck, AlertOctagon,
  Award, Clock, CheckSquare, Square, Eye, Zap, Filter,
  Upload, Image as ImageIcon, Trash2, Type, Building2, ChevronDown,
  Compass, Lightbulb
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

export interface ThemePresetOption {
  id: string;
  name: string;
  brandColor: string;
  fontFace: string;
  theme: "emerald" | "dark" | "indigo" | "light" | "crimson" | "cyberpunk";
  tag: string;
  description: string;
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: "executive_gold",
    name: "Executive Navy & Gold",
    brandColor: "#F59E0B",
    fontFace: "Calibri",
    theme: "dark",
    tag: "Boardroom",
    description: "Midnight slate background with warm gold & amber accents paired with clean Calibri display type."
  },
  {
    id: "corporate_indigo",
    name: "Corporate Indigo & Slate",
    brandColor: "#6366F1",
    fontFace: "Segoe UI",
    theme: "indigo",
    tag: "Enterprise",
    description: "Deep indigo canvas with electric purple highlights and crisp Segoe UI enterprise typography."
  },
  {
    id: "esg_emerald",
    name: "ESG Forest & Emerald",
    brandColor: "#10B981",
    fontFace: "Georgia",
    theme: "emerald",
    tag: "Sustainability",
    description: "Earthy dark emerald palette paired with authoritative Georgia serif headings."
  },
  {
    id: "modern_crimson",
    name: "Modern Crimson & Ruby",
    brandColor: "#F43F5E",
    fontFace: "Helvetica",
    theme: "crimson",
    tag: "High-Impact",
    description: "Striking ruby crimson accents with precision Helvetica headers for high-contrast executive briefings."
  },
  {
    id: "cyberpunk_neon",
    name: "Cyberpunk Cyan & Neon",
    brandColor: "#06B6D4",
    fontFace: "Trebuchet MS",
    theme: "cyberpunk",
    tag: "Deep Tech",
    description: "Ultra-dark terminal with vivid cyan telemetry highlights and modern Trebuchet MS geometry."
  },
  {
    id: "crisp_minimal",
    name: "Crisp Minimalist Paper",
    brandColor: "#2563EB",
    fontFace: "Arial",
    theme: "light",
    tag: "Editorial",
    description: "High-contrast clean white paper theme with cobalt blue branding and versatile Arial type."
  },
  {
    id: "editorial_times",
    name: "Financial Times Editorial",
    brandColor: "#D97706",
    fontFace: "Times New Roman",
    theme: "light",
    tag: "Institutional",
    description: "Light institutional styling with warm ochre accents and classical Times New Roman typography."
  },
  {
    id: "luxury_garamond",
    name: "Boardroom Luxury Serif",
    brandColor: "#B45309",
    fontFace: "Garamond",
    theme: "dark",
    tag: "C-Level M&A",
    description: "Refined dark slate with deep bronze accents and prestigious Garamond executive headings."
  }
];

export const FONT_STYLE_OPTIONS = [
  { id: "Calibri", label: "Calibri (Modern Executive)" },
  { id: "Segoe UI", label: "Segoe UI (Corporate Fluent)" },
  { id: "Arial", label: "Arial (Clean Geometric)" },
  { id: "Helvetica", label: "Helvetica (High-Precision Swiss)" },
  { id: "Georgia", label: "Georgia (Authoritative Editorial)" },
  { id: "Times New Roman", label: "Times New Roman (Institutional Serif)" },
  { id: "Garamond", label: "Garamond (Luxury Heritage)" },
  { id: "Trebuchet MS", label: "Trebuchet MS (Tech Forward)" },
  { id: "Verdana", label: "Verdana (Ultra Legible)" }
];

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
  const [selectedPresetId, setSelectedPresetId] = useState<string>("executive_gold");
  const [selectedTheme, setSelectedTheme] = useState<"emerald" | "dark" | "indigo" | "light" | "crimson" | "cyberpunk">("dark");
  const [customBrandColor, setCustomBrandColor] = useState<string>("#F59E0B");
  const [titleFontStyle, setTitleFontStyle] = useState<string>("Calibri");
  const [customProjectTitle, setCustomProjectTitle] = useState<string>("");
  const [customCompanyName, setCustomCompanyName] = useState<string>("");
  const [companyLogoData, setCompanyLogoData] = useState<string>(() => {
    try {
      return localStorage.getItem("vivexa_custom_ppt_logo") || "";
    } catch {
      return "";
    }
  });
  const [logoFileName, setLogoFileName] = useState<string>(() => {
    try {
      return localStorage.getItem("vivexa_custom_ppt_logo_name") || "";
    } catch {
      return "";
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle Theme Preset change
  const handleThemePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCustomBrandColor(preset.brandColor);
      setTitleFontStyle(preset.fontFace);
      setSelectedTheme(preset.theme);
      toast.info(`Theme Preset Applied: '${preset.name}' (Brand Color: ${preset.brandColor}, Font: ${preset.fontFace})`);
    }
  };

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file exceeds 5MB size limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCompanyLogoData(dataUrl);
        setLogoFileName(file.name);
        try {
          localStorage.setItem("vivexa_custom_ppt_logo", dataUrl);
          localStorage.setItem("vivexa_custom_ppt_logo_name", file.name);
        } catch (err) {
          console.warn("Could not save logo to localStorage", err);
        }
        toast.success(`Company logo '${file.name}' loaded & stored.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogoData("");
    setLogoFileName("");
    try {
      localStorage.removeItem("vivexa_custom_ppt_logo");
      localStorage.removeItem("vivexa_custom_ppt_logo_name");
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Company logo removed.");
  };

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
        customProjectTitle: customProjectTitle.trim() || undefined,
        customBrandColor: customBrandColor.trim() || undefined,
        customCompanyName: customCompanyName.trim() || undefined,
        logoDataUrl: companyLogoData || undefined,
        titleFontFace: titleFontStyle,
        deckType: selectedSlideIds.length >= 13 ? "comprehensive" : "custom",
        selectedSlideLayouts: selectedSlideIds,
        includeCharts: true,
        includeAnomalies: includeBadges,
        includeRoadmap: true,
        includeBootstrapCI: true,
        companyName: customCompanyName.trim() || undefined
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
              <motion.div
                key={opt.id}
                layout
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectTemplate(opt)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    handleSelectTemplate(opt);
                  }
                }}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? "bg-slate-800/95 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/50"
                    : "bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/70"
                }`}
              >
                {/* Active Template Sliding Glow Background */}
                {isSelected && (
                  <motion.div
                    layoutId="active-template-glow"
                    className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-indigo-500/10 pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <div className="relative z-10">
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
                      {isSelected && (
                        <motion.div
                          layoutId="active-template-dot"
                          className="h-1.5 w-1.5 rounded-full bg-slate-950"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
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
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between relative z-10">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    {opt.badge}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/80">
                    {opt.slideCount} Slides
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Animated Active Template Blueprint Pipeline */}
        <AnimatePresence mode="wait">
          {(() => {
            const currentTemplate = TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate) || {
              id: "Custom Bespoke",
              title: "Custom Bespoke Slide Deck",
              badge: "Custom Deck",
              description: `User-curated deck featuring ${selectedSlideIds.length} tailor-selected slide layouts.`,
              slideCount: selectedSlideIds.length,
              slideIds: selectedSlideIds,
              icon: Sliders,
              highlights: ["Custom Configuration", `${selectedSlideIds.length} Slides`, "Granular Tailoring"],
              color: "from-amber-600 to-indigo-600",
              wireframeType: "comprehensive"
            };

            const Icon = currentTemplate.icon;
            const currentSlides = ALL_AVAILABLE_SLIDES.filter(s => selectedSlideIds.includes(s.id));

            return (
              <motion.div
                key={selectedTemplate}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 bg-slate-950/85 rounded-xl border border-amber-500/30 space-y-3 shadow-lg shadow-amber-500/5 relative overflow-hidden"
              >
                {/* Background ambient gradient flare */}
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-r ${currentTemplate.color} text-white shrink-0 shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white tracking-wide">
                          Active Structure: <span className="text-amber-400">{currentTemplate.title}</span>
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {currentTemplate.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {currentTemplate.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                      <Layers className="h-3 w-3 text-indigo-400" />
                      <span>{currentSlides.length} Sequenced Slides</span>
                    </div>
                  </div>
                </div>

                {/* Sequenced Interactive Slide Pipeline Flow */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1">
                      <Compass className="h-3 w-3 text-amber-400" />
                      Sequenced Slide Pipeline Flow
                    </span>
                    <span className="font-mono text-amber-400">
                      16:9 Presentation Blueprint
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                    {currentSlides.map((slide, idx) => {
                      const SlideIcon = slide.icon;
                      return (
                        <React.Fragment key={slide.id}>
                          <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.25, delay: idx * 0.03 }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800/90 text-slate-200 shrink-0 hover:border-slate-700 transition-colors shadow-sm"
                          >
                            <span className="h-4 w-4 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-[9px] font-mono font-bold text-amber-400">
                              {idx + 1}
                            </span>
                            <SlideIcon className="h-3 w-3 text-indigo-400" />
                            <span className="text-[11px] font-medium whitespace-nowrap">{slide.title}</span>
                          </motion.div>

                          {idx < currentSlides.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Template Key Focus Highlights */}
                {currentTemplate.highlights && currentTemplate.highlights.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400">Core Blueprint Focus:</span>
                    {currentTemplate.highlights.map((highlight, hIdx) => (
                      <motion.span
                        key={highlight}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + hIdx * 0.05 }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        {highlight}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
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
        <AnimatePresence>
          {showSlidePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-3 border-t border-slate-800/80 space-y-3 overflow-hidden"
            >
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

              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredSlides.map((slide) => {
                  const isSelected = selectedSlideIds.includes(slide.id);
                  const Icon = slide.icon;

                  return (
                    <motion.div
                      key={slide.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
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
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme Presets & Auto-Populator */}
      <div className="p-4 bg-slate-950/85 rounded-xl border border-indigo-900/40 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Theme Preset & Typography Auto-Populator
            </label>
            <p className="text-[11px] text-slate-400">
              Select an enterprise style preset to instantly configure brand colors, typography font families, and palette styling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">Active Preset:</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
              {THEME_PRESETS.find(p => p.id === selectedPresetId)?.name || "Custom Bespoke"}
            </span>
          </div>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {THEME_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <motion.button
                key={preset.id}
                type="button"
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleThemePresetChange(preset.id)}
                className={`p-2.5 rounded-xl border text-left transition-all relative select-none ${
                  isSelected
                    ? "bg-slate-900 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/60"
                    : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: preset.brandColor }}
                    />
                    <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-amber-300 shrink-0">
                    {preset.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Font: <strong className="text-slate-300">{preset.fontFace}</strong></span>
                  <span className="font-mono text-slate-400 uppercase">{preset.brandColor}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Branding & Corporate Identity Section */}
      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            Custom Corporate Branding & Header Identity
          </label>
          <span className="text-[10px] text-slate-400">
            Injected dynamically into Slide 1 Cover, Presentation Headers, and Footer Disclaimers
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Logo Upload Placeholder & Dropzone (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <ImageIcon className="h-3 w-3 text-cyan-400" />
                Company Logo Asset
              </label>
              {companyLogoData && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="h-2.5 w-2.5" /> Remove
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={handleLogoFileChange}
              className="hidden"
              id="company-logo-upload-input"
            />

            {/* Dropzone / Preview Area */}
            {companyLogoData ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group p-3 rounded-lg bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 flex items-center gap-3 cursor-pointer transition-all"
              >
                <div className="h-12 w-16 rounded bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-1">
                  <img
                    src={companyLogoData}
                    alt="Company Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="h-3 w-3" /> Logo Stored
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">{logoFileName || "custom_logo.png"}</p>
                  <p className="text-[9px] text-slate-500">Click to change asset</p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-lg bg-slate-950/70 border-2 border-dashed border-slate-700/80 hover:border-amber-400/80 hover:bg-slate-950 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <Upload className="h-5 w-5 text-slate-400 group-hover:text-amber-400 mb-1 transition-colors" />
                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">
                  Upload Company Logo
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">
                  PNG, JPG, SVG or WebP (Max 5MB)
                </span>
              </div>
            )}

            <p className="text-[9px] text-slate-500 leading-tight">
              Logo is injected at 16:9 aspect ratio into slide headers & cover page.
            </p>
          </div>

          {/* Text & Color Branding Fields (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Project-Specific Title */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <FileText className="h-3 w-3 text-amber-400" />
                Project-Specific Deck Title (Override)
              </label>
              <input
                type="text"
                placeholder={report?.title || "e.g. Q3 Strategic Data Lakehouse Briefing & ROI Roadmap"}
                value={customProjectTitle}
                onChange={(e) => setCustomProjectTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                id="input-custom-project-title"
              />
            </div>

            {/* Organization / Company Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-cyan-400" />
                Company / Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Enterprise AI"
                value={customCompanyName}
                onChange={(e) => setCustomCompanyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                id="input-custom-company-name"
              />
            </div>

            {/* Title Font Style Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Type className="h-3 w-3 text-violet-400" />
                Title Font Style
              </label>
              <select
                value={titleFontStyle}
                onChange={(e) => setTitleFontStyle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                id="select-title-font-style"
              >
                {FONT_STYLE_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Accent Color Picker */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Palette className="h-3 w-3 text-rose-400" />
                  Brand Accent Hex Color
                </label>
                <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">{customBrandColor}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="color"
                  value={customBrandColor}
                  onChange={(e) => setCustomBrandColor(e.target.value)}
                  className="h-8 w-10 rounded border border-slate-700 bg-slate-900 cursor-pointer p-0.5 shrink-0"
                  id="input-custom-brand-color-wheel"
                />
                <input
                  type="text"
                  value={customBrandColor}
                  onChange={(e) => setCustomBrandColor(e.target.value)}
                  placeholder="#F59E0B"
                  className="w-28 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400 transition-colors"
                  id="input-custom-brand-color-hex"
                />
                <div className="flex items-center gap-1.5">
                  {[
                    { color: "#F59E0B", name: "Amber Gold" },
                    { color: "#10B981", name: "ESG Emerald" },
                    { color: "#6366F1", name: "Indigo Slate" },
                    { color: "#F43F5E", name: "Ruby Crimson" },
                    { color: "#06B6D4", name: "Cyan Tech" },
                    { color: "#8B5CF6", name: "Electric Violet" }
                  ].map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => setCustomBrandColor(swatch.color)}
                      style={{ backgroundColor: swatch.color }}
                      className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 shrink-0 ${
                        customBrandColor.toUpperCase() === swatch.color.toUpperCase()
                          ? "ring-2 ring-white border-transparent"
                          : "border-slate-700"
                      }`}
                      title={`Select ${swatch.name} (${swatch.color})`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Themes & Design Styles (6 Theme Palettes) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-violet-400" />
          Base Visual Theme & Background Palette (6 Options)
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
