import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, Compass, 
  Database, Bot, LineChart, Command, Layers, ChevronRight,
  ShieldCheck, Zap, Play, HelpCircle, ExternalLink, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface TourStep {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  icon: any;
  targetRoute: string;
  actionLabel: string;
  highlights: string[];
  tips: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "step-dashboard",
    title: "Executive Intelligence & Insights of the Day",
    badge: "STEP 1 OF 5",
    subtitle: "Real-time Telemetry & Autonomous Anomaly Detection",
    description: "Welcome to Vivexa! Your dashboard aggregates live data pipeline metrics, tenant storage, automated Data Quality Indexing (DQI), and the proactive 'Insights of the Day' anomaly sentinel.",
    icon: Sparkles,
    targetRoute: "/workspace",
    actionLabel: "Explore Dashboard",
    highlights: [
      "Live throughput, query latency & DQI health monitors",
      "AI-driven 'Insights of the Day' summarizing recent activity and anomalies",
      "One-click workspace health diagnostics and telemetry CSV exports"
    ],
    tips: "Pro-tip: Check the 'Insights of the Day' card every morning for automated anomaly triage."
  },
  {
    id: "step-lakehouse",
    title: "Vivexa Lakehouse & Datasets",
    badge: "STEP 2 OF 5",
    subtitle: "In-Memory DuckDB Engine & Zero-Copy Virtualization",
    description: "Ingest CSV, Parquet, JSON, or SQL tables with automatic schema validation, missing-value imputation, and multi-tier (Bronze, Silver, Gold) Lakehouse management.",
    icon: Database,
    targetRoute: "/workspace/lakehouse",
    actionLabel: "View Lakehouse",
    highlights: [
      "Sub-millisecond analytical SQL queries powered by embedded DuckDB",
      "One-click automated data cleaning studio with outlier capping",
      "Instant schema conformance scoring and column distribution profiling"
    ],
    tips: "You can drag-and-drop any CSV or Excel file directly into the Datasets tab for instant profiling."
  },
  {
    id: "step-ai-analyst",
    title: "AI Analyst & Multi-Agent Cockpit",
    badge: "STEP 3 OF 5",
    subtitle: "Autonomous Conversational Data Scientist",
    description: "Ask complex strategic or statistical questions in natural language. Vivexa writes analytical SQL, calculates correlations, identifies causal drivers, and generates interactive chart visualizations.",
    icon: Bot,
    targetRoute: "/workspace/ai",
    actionLabel: "Try AI Analyst",
    highlights: [
      "Natural language queries translated to deterministic SQL & Python execution",
      "Multi-agent reasoning with statistical hypotheses validation",
      "Context preservation with Long-Term Project Memory anchors"
    ],
    tips: "Try asking: 'What are the top 3 drivers of customer churn in our latest dataset?'"
  },
  {
    id: "step-predictions",
    title: "Predictions, Forecasting & ML Registry",
    badge: "STEP 4 OF 5",
    subtitle: "Enterprise Time-Series & Inference Serving",
    description: "Forecast multi-quarter revenue with scenario multipliers (ARIMA, Neural, Prophet), and manage deployed classification & regression models with real-time inference testing and SDK code generators.",
    icon: LineChart,
    targetRoute: "/workspace/forecasting",
    actionLabel: "Explore Predictions",
    highlights: [
      "Multi-model trajectory forecasting with confidence bounds & scenario sliders",
      "Interactive Model Registry with sub-50ms inference console and feature attribution",
      "Automated cURL, Python, and TypeScript SDK snippet generation"
    ],
    tips: "Deploy trained models directly to live production endpoints with API key security."
  },
  {
    id: "step-command-palette",
    title: "Global Command Palette & Semantic Layer",
    badge: "STEP 5 OF 5",
    subtitle: "Instant ⌘K Search, Ontology & Metric Contracts",
    description: "Navigate everywhere at the speed of thought using the global Command Palette (Cmd/Ctrl + K). Define centralized business metrics and explore your enterprise digital twin ontology.",
    icon: Command,
    targetRoute: "/workspace/semantic",
    actionLabel: "View Semantic Layer",
    highlights: [
      "Press Cmd+K / Ctrl+K anywhere to search pages, projects, datasets, and quick actions",
      "Centralized metric contracts (MRR, CAC, NRR) synchronized with dbt and Cube",
      "Enterprise digital twin mapping physical tables to semantic business concepts"
    ],
    tips: "Press ⌘K or Ctrl+K anytime to quickly jump between projects, datasets, or trigger common actions."
  }
];

export function ProductTour() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasPromptedNewUser, setHasPromptedNewUser] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // Check if tour was ever completed
  useEffect(() => {
    const isCompleted = localStorage.getItem("vivexa_product_tour_completed");
    const dismissed = sessionStorage.getItem("vivexa_product_tour_prompt_dismissed");
    
    if (!isCompleted && !dismissed) {
      // Show gentle welcome prompt for new users after 2 seconds
      const timer = setTimeout(() => {
        setShowWelcomeBanner(true);
        setHasPromptedNewUser(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for global custom event to trigger tour anytime
  useEffect(() => {
    const handleStartTour = (e?: any) => {
      const stepIdx = e?.detail?.stepIndex ?? 0;
      setCurrentStepIndex(stepIdx);
      setShowWelcomeBanner(false);
      setIsOpen(true);
    };

    window.addEventListener("vivexa_start_tour", handleStartTour);
    return () => window.removeEventListener("vivexa_start_tour", handleStartTour);
  }, []);

  const handleStartTour = (stepIndex = 0) => {
    setCurrentStepIndex(stepIndex);
    setShowWelcomeBanner(false);
    setIsOpen(true);
    const step = TOUR_STEPS[stepIndex];
    if (step && window.location.pathname !== step.targetRoute) {
      navigate(step.targetRoute);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = TOUR_STEPS[nextIdx];
      if (nextStep && window.location.pathname !== nextStep.targetRoute) {
        navigate(nextStep.targetRoute);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = TOUR_STEPS[prevIdx];
      if (prevStep && window.location.pathname !== prevStep.targetRoute) {
        navigate(prevStep.targetRoute);
      }
    }
  };

  const handleJumpToStep = (idx: number) => {
    setCurrentStepIndex(idx);
    const step = TOUR_STEPS[idx];
    if (step && window.location.pathname !== step.targetRoute) {
      navigate(step.targetRoute);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("vivexa_product_tour_prompt_dismissed", "true");
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem("vivexa_product_tour_completed", "true");
    toast.success("Tour complete! You're ready to unlock the full power of Vivexa AI.", {
      icon: <Sparkles className="h-4 w-4 text-indigo-400" />
    });
    // Ensure the user lands on a valid workspace route after completing the tour
    if (!window.location.pathname.startsWith("/workspace")) {
      navigate("/workspace");
    }
  };

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep?.icon || Sparkles;

  // Keyboard navigation inside tour
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  return (
    <>
      {/* Welcome Notification Banner for First-Time Users */}
      <AnimatePresence>
        {showWelcomeBanner && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-full p-5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl text-white"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Compass className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Welcome to Vivexa AI!</h4>
                  <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    60s TOUR
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Take a quick guided walkthrough to discover autonomous AI analysis, Lakehouse querying, and daily anomaly intelligence.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    onClick={() => handleStartTour(0)}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3.5 shadow-md shadow-indigo-600/30"
                  >
                    Start Guided Tour <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWelcomeBanner(false);
                      sessionStorage.setItem("vivexa_product_tour_prompt_dismissed", "true");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white text-xs h-8 px-2.5"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWelcomeBanner(false);
                  sessionStorage.setItem("vivexa_product_tour_prompt_dismissed", "true");
                }}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Guided Tour Modal / Overlay */}
      <AnimatePresence>
        {isOpen && currentStep && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            {/* Spotlight Accent Ring in Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <div className="w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-70 animate-pulse" />
            </div>

            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-2xl text-white overflow-hidden"
            >
              {/* Top Bar: Step indicator & Close button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {currentStep.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Vivexa Guided Tour
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleComplete}
                    className="text-xs text-slate-400 hover:text-white font-mono hover:underline"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Step Hero Section */}
              <div className="py-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10 shrink-0">
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs font-semibold text-indigo-300 font-mono">
                      {currentStep.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Key Capabilities Checklist */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Key Superpowers
                  </div>
                  <div className="space-y-2">
                    {currentStep.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro-Tip Box */}
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-[11px]">{currentStep.tips}</span>
                </div>
              </div>

              {/* Step Navigation Dots & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                {/* Step Dots */}
                <div className="flex items-center gap-2">
                  {TOUR_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => handleJumpToStep(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === currentStepIndex
                          ? "w-8 bg-indigo-500 shadow-sm shadow-indigo-500"
                          : "w-2.5 bg-slate-700 hover:bg-slate-600"
                      }`}
                      title={step.title}
                    />
                  ))}
                  <span className="text-[11px] font-mono text-slate-500 ml-2">
                    {currentStepIndex + 1}/{TOUR_STEPS.length}
                  </span>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {currentStepIndex > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="sm"
                      className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white text-xs h-9"
                    >
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Previous
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs h-9 px-5 shadow-lg shadow-indigo-500/25"
                  >
                    {currentStepIndex === TOUR_STEPS.length - 1 ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-300" /> Complete Tour
                      </>
                    ) : (
                      <>
                        Next Step <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
