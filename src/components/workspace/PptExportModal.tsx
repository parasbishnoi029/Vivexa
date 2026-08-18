import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Presentation, Download, X, Sparkles, Check, CheckCircle2,
  Layers, BarChart3, PieChart, ShieldCheck, AlertOctagon, TrendingUp,
  Award, Sliders, Palette, FileText, ArrowRight, Eye, Activity, CheckSquare, Square,
  GitFork, Target, Briefcase, FileBarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportReportToPPT, PptExportOptions } from "@/lib/pptExporter";
import { toast } from "sonner";

interface PptExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export interface SlideLayoutItem {
  id: string;
  num: number;
  title: string;
  desc: string;
  category: "Executive" | "Analytics" | "Causal" | "Governance";
  icon: any;
  badge: string;
  badgeColor: string;
}

export function PptExportModal({ isOpen, onClose, report }: PptExportModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "indigo" | "light" | "emerald">("dark");
  const [activePreset, setActivePreset] = useState<"custom" | "exec_boardroom" | "trend_analysis" | "causal_insight" | "risk_governance" | "comprehensive">("comprehensive");
  const [presenterName, setPresenterName] = useState("Senior Data Scientist & Executive AI Architect");
  const [companyName, setCompanyName] = useState("Vivexa Enterprise AI");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");

  const allSlideLayouts: SlideLayoutItem[] = [
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
    { id: "closing_governance", num: 13, title: "Board Advisory Governance & Legal", desc: "Institutional confidentiality notice, audit disclaimers, and official contact channels", category: "Governance", icon: CheckCircle2, badge: "Governance", badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/20" }
  ];

  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(allSlideLayouts.map(s => s.id));

  if (!isOpen || !report || typeof document === "undefined" || !document.body) return null;

  const safeParse = (content: any) => {
    if (!content) return {};
    if (typeof content === "object") return content;
    try {
      return JSON.parse(content);
    } catch {
      return { executive_summary: String(content) };
    }
  };

  const parsedContent = safeParse(report.content);
  const title = report.title || parsedContent.title || "Senior Data Scientist Executive Briefing";
  const datasetName = parsedContent.dataset_name || report.dataset_name || "Enterprise Dataset";

  const layoutPresets = [
    {
      id: "comprehensive" as const,
      name: "Master Comprehensive Deck",
      desc: "Full 13-slide institutional suite with all charts, audits, and roadmaps.",
      icon: Briefcase,
      slideIds: allSlideLayouts.map(s => s.id)
    },
    {
      id: "exec_boardroom" as const,
      name: "Executive Summary & Boardroom",
      desc: "Streamlined 7-slide briefing focused on C-suite KPIs, takeaways, and strategic ROI.",
      icon: FileBarChart2,
      slideIds: ["cover", "exec_summary", "kpi_scorecard", "deep_insights", "action_roadmap", "multi_agent", "closing_governance"]
    },
    {
      id: "trend_analysis" as const,
      name: "Trend Analysis & Statistical Rigor",
      desc: "Data-heavy 8-slide deck highlighting 95% Bootstrap CI, trend variance, and ML signals.",
      icon: BarChart3,
      slideIds: ["cover", "exec_summary", "kpi_scorecard", "trend_analysis", "data_quality", "ml_matrix", "action_roadmap", "closing_governance"]
    },
    {
      id: "causal_insight" as const,
      name: "Causal Insight & Deep Root-Cause",
      desc: "Causal inference 8-slide deck focusing on driver weights, confounding variables, and treatments.",
      icon: Target,
      slideIds: ["cover", "exec_summary", "causal_insight", "causal_root_cause", "deep_insights", "action_roadmap", "multi_agent", "closing_governance"]
    },
    {
      id: "risk_governance" as const,
      name: "Risk, Data Quality & Governance",
      desc: "Compliance 8-slide deck for auditors featuring Z-score anomalies, data health, and sign-offs.",
      icon: ShieldCheck,
      slideIds: ["cover", "exec_summary", "kpi_scorecard", "data_quality", "anomaly_audit", "deep_insights", "multi_agent", "closing_governance"]
    }
  ];

  const handleSelectPreset = (presetId: "comprehensive" | "exec_boardroom" | "trend_analysis" | "causal_insight" | "risk_governance") => {
    setActivePreset(presetId);
    const preset = layoutPresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedLayouts(preset.slideIds);
    }
  };

  const handleToggleSlide = (slideId: string) => {
    setActivePreset("custom");
    if (selectedLayouts.includes(slideId)) {
      if (selectedLayouts.length === 1) {
        toast.warning("At least one slide layout must remain selected.");
        return;
      }
      setSelectedLayouts(selectedLayouts.filter(id => id !== slideId));
    } else {
      setSelectedLayouts([...selectedLayouts, slideId]);
    }
  };

  const handleSelectAll = () => {
    setActivePreset("comprehensive");
    setSelectedLayouts(allSlideLayouts.map(s => s.id));
  };

  const handleClearOptional = () => {
    setActivePreset("custom");
    setSelectedLayouts(["cover", "exec_summary", "kpi_scorecard", "closing_governance"]);
  };

  const themes = [
    {
      id: "dark" as const,
      name: "Executive Midnight",
      sub: "Slate dark & purple neon accents",
      bgClass: "bg-slate-950 border-violet-500/40 text-slate-100",
      accent: "bg-violet-600"
    },
    {
      id: "indigo" as const,
      name: "Cyber Indigo",
      sub: "Deep navy, indigo & cyan highlights",
      bgClass: "bg-[#0F172A] border-indigo-500/40 text-indigo-100",
      accent: "bg-indigo-600"
    },
    {
      id: "light" as const,
      name: "Clean Corporate",
      sub: "Crisp white, high-contrast light mode",
      bgClass: "bg-white border-slate-300 text-slate-900",
      accent: "bg-indigo-600"
    },
    {
      id: "emerald" as const,
      name: "ESG Emerald",
      sub: "Forest green & gold luxury tone",
      bgClass: "bg-[#061A14] border-emerald-500/40 text-emerald-100",
      accent: "bg-emerald-600"
    }
  ];

  const handleGenerate = async () => {
    if (selectedLayouts.length === 0) {
      toast.error("Please select at least one slide layout.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStep("Initializing 16:9 Presentation Vector Engine...");

    try {
      await new Promise(r => setTimeout(r, 350));
      setGenerationProgress(35);
      setGenerationStep(`Rendering ${selectedLayouts.length} Selected Slide Layouts...`);

      await new Promise(r => setTimeout(r, 450));
      setGenerationProgress(70);
      setGenerationStep("Synthesizing Native PowerPoint Charts & Audit Matrices...");

      await new Promise(r => setTimeout(r, 400));
      setGenerationProgress(92);
      setGenerationStep("Applying Corporate Vector Palettes & Watermarks...");

      const options: PptExportOptions = {
        theme: selectedTheme,
        selectedSlideLayouts: selectedLayouts,
        presenterName: presenterName.trim(),
        companyName: companyName.trim()
      };

      const fileName = await exportReportToPPT(report, options);

      setGenerationProgress(100);
      setGenerationStep("PowerPoint Deck Generated Successfully!");
      await new Promise(r => setTimeout(r, 300));

      toast.success("Industry-Grade PowerPoint (.pptx) downloaded successfully!", {
        description: `Exported ${selectedLayouts.length} configured slide layouts for ${title}.`
      });
      setIsGenerating(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PPT deck. Please try again.");
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative my-6 text-slate-100 space-y-5 max-h-[92vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Presentation className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-extrabold text-white">PowerPoint Slide Layout Configurator</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                16:9 Widescreen .PPTX
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedLayouts.length} of {allSlideLayouts.length} Slides Selected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select dedicated presentation layouts (Executive Summary, Trend Analysis, Causal Insight, Risk Governance) and themes before generating your industry-ready deck.
            </p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* Target Report Overview Card */}
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">Target Executive Report</span>
              <h4 className="text-xs font-bold text-white truncate">{title}</h4>
              <p className="text-[11px] text-slate-400">Target Dataset: <strong className="text-slate-200">{datasetName}</strong></p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {selectedLayouts.length} Active Slides
              </span>
            </div>
          </div>

          {/* Preset Slide Layout Archetypes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="h-3.5 w-3.5 text-amber-400" /> Choose Slide Layout Archetype
              </label>
              <span className="text-[11px] text-slate-400">Click any preset to auto-select matching slides</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {layoutPresets.map((preset) => {
                const isSelected = activePreset === preset.id;
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-600/10 ring-1 ring-amber-500/40"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-white leading-tight">{preset.name}</span>
                        </div>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">{preset.desc}</p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-mono">{preset.slideIds.length} Slides</span>
                      <span className={`font-semibold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                        {isSelected ? 'Active Preset' : 'Apply Preset'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Slide Layout Toggles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-violet-400" /> Modular Slide Layout Selection ({selectedLayouts.length}/{allSlideLayouts.length})
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearOptional}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] transition-colors"
                >
                  Executive Only (4)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
              {allSlideLayouts.map((slide) => {
                const isSelected = selectedLayouts.includes(slide.id);
                const Icon = slide.icon;
                return (
                  <div
                    key={slide.id}
                    onClick={() => handleToggleSlide(slide.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? "border-violet-500/60 bg-violet-950/20"
                        : "border-slate-800/80 bg-slate-900/40 opacity-60 hover:opacity-100 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button className="mt-0.5 text-violet-400 shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-200 truncate">{slide.title}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{slide.desc}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-semibold border shrink-0 ${slide.badgeColor}`}>
                      {slide.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Presentation Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="h-3.5 w-3.5 text-violet-400" /> Visual Color Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {themes.map((t) => {
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? "border-violet-500 bg-violet-950/30 shadow-lg shadow-violet-600/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${t.accent}`} />
                      <span className="text-xs font-bold text-white">{t.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{t.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata Inputs */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Presenter Title / Role
              </label>
              <input
                type="text"
                value={presenterName}
                onChange={(e) => setPresenterName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                placeholder="e.g. Senior Data Scientist"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Organization / Enterprise Brand
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                placeholder="e.g. Vivexa Enterprise AI"
              />
            </div>
          </div>
        </div>

        {/* Generation Progress Indicator */}
        {isGenerating && (
          <div className="space-y-2 pt-1 shrink-0">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 animate-spin text-amber-400 shrink-0" />
                <span className="font-mono">{generationStep}</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{generationProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${generationProgress}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-violet-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3 shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-400 hover:text-white text-xs"
          >
            Cancel
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-amber-600 via-amber-500 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 gap-2 h-10 px-5"
          >
            {isGenerating ? (
              <>
                <Activity className="h-4 w-4 animate-spin" /> Generating {selectedLayouts.length} Slide Deck...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download PowerPoint Deck ({selectedLayouts.length} Slides)
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
