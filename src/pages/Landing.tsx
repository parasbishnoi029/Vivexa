import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, BarChart3, Brain, Database, Shield, Zap, CheckCircle2,
  Sparkles, Terminal, Workflow, Activity, Globe, Lock, Play, Cpu, Users,
  ChevronRight, RefreshCw, Layers, Sliders, Check, FileText
} from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { Founders } from "@/components/landing/Founders";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive Sandbox State
  const [activeTab, setActiveTab] = useState<"analyst" | "forecasting" | "notebook">("analyst");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [forecastHorizon, setForecastHorizon] = useState(6);

  const prompts = {
    analyst: [
      {
        q: "What is our customer lifetime value distribution by region?",
        sql: "SELECT region, AVG(clv) as avg_clv, COUNT(id) as user_count\nFROM enterprise_users\nGROUP BY region\nORDER BY avg_clv DESC;",
        result: {
          headers: ["Region", "Avg CLV", "User Count"],
          rows: [
            ["North America", "$18,450", "4,210"],
            ["Western Europe", "$16,200", "3,890"],
            ["Asia Pacific", "$12,850", "5,120"],
            ["Latin America", "$9,400", "1,850"]
          ]
        }
      },
      {
        q: "Find anomalous spikes in API request latency over 200ms",
        sql: "SELECT TIMESTAMP_TRUNC(created_at, HOUR) as hr, MAX(duration_ms) as peak_latency\nFROM api_logs\nWHERE duration_ms > 200\nGROUP BY hr\nORDER BY peak_latency DESC LIMIT 5;",
        result: {
          headers: ["Hour", "Peak Latency", "Trigger Event"],
          rows: [
            ["2026-08-11 04:00", "412ms", "Database Lock Conflict"],
            ["2026-08-10 18:00", "380ms", "Web Server Auto-scale"],
            ["2026-08-10 02:00", "295ms", "Batch Export Cron"],
            ["2026-08-09 11:00", "241ms", "Unindexed Query Join"]
          ]
        }
      }
    ],
    forecasting: [
      {
        q: "Generate 12-month recurring revenue projections (ARR)",
        metrics: { current: "$48.2M", projected: "$62.5M (+29.6%)", confidence: "96.4%" }
      }
    ],
    notebook: [
      {
        code: "import pandas as pd\nimport numpy as np\nfrom vivexa import predict_trends\n\ndf = pd.read_sql('SELECT * FROM global_demographics')\npredictions = predict_trends(df, target='clv', steps=10)\nprint(f'Trained Scikit model. R² Score: {predictions.r2_score:.4f}')",
        output: "Loading PyTorch environment...\nRunning 10-fold cross-validation...\n[SUCCESS] Model converged in 1.4s.\n>> Trained Scikit model. R² Score: 0.9842"
      }
    ]
  };

  // Run simulated compilation sequence on prompt change
  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          return 100;
        }
        return prev + 12;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [activeTab, selectedPrompt, forecastHorizon]);

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden selection:bg-indigo-500/30 text-white" ref={containerRef}>
      <SEOHead
        title="Vivexa | Enterprise AI Decision Intelligence & Autonomous Analytics Operating System"
        description="Transform multi-source databases into explainable, automated, and audited business decisions. Natural language SQL, neural time-series forecasting, collaborative notebooks, and multi-agent workflows."
        keywords={[
          "Enterprise AI Decision Intelligence",
          "Autonomous Data Science",
          "Enterprise Analytics Operating System",
          "Natural Language SQL Synthesis",
          "Predictive Time-Series Forecasting",
          "Unified Lakehouse Analytics",
          "Looker Databricks Alternative",
          "Zero Hallucination BI",
          "IIT Jodhpur AI",
          "Paras Bishnoi",
          "Karunya Sharma"
        ]}
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-24">
          
          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%)]" />
            
            {/* Elegant Background Grid Accents */}
            <div className="absolute inset-y-0 right-0 left-0 -z-10 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
              
              {/* Eye-catching Startup Version Badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[11px] font-semibold text-indigo-300 backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Enterprise Decision Intelligence Platform v3.5</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
                className="max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-slate-100"
              >
                The Autonomous Data Science <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
                  Engine for Enterprise Decisions
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                className="mt-6 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-400 font-normal"
              >
                Vivexa acts as an on-demand, secure AI Data Science Team—synthesizing raw queries, auditing relational models, and deploying automated predictive forecasts directly to executive decision boards.
              </motion.p>

              {/* Core CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
                className="mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  to="/register"
                  className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-xs font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  Start Building Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/book-demo"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-8 text-xs font-bold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                >
                  Book 1-on-1 Demo
                </Link>

                <Link
                  to="/product-tour"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-6 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-500/10"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Interactive Product Tour
                </Link>
              </motion.div>

              {/* Startup Infrastructure Showcase */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-16 w-full max-w-5xl pt-8 border-t border-slate-900"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Zero-Setup Data Integrations
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stream query vectors directly from your modern data lakehouse.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Snowflake", "BigQuery", "PostgreSQL", "Redshift", "Databricks", "Supabase"].map((db) => (
                      <span
                        key={db}
                        className="px-3 py-1 bg-slate-900/80 border border-slate-800/60 rounded-lg text-[11px] font-mono font-medium text-slate-300"
                      >
                        {db}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* INTERACTIVE DEMO PLAYGROUND SECTION (THE CORE PLATFORM EXPERIENCE) */}
          <section className="py-16 relative z-10 border-t border-slate-900 bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              
              <div className="flex flex-col lg:flex-row items-start gap-12">
                
                {/* Left Side: Playground Controller */}
                <div className="w-full lg:w-5/12 space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interactive Sandbox</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      Experience Vivexa Live
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Select one of the modules below to simulate real-time AI analytics, predictive forecasts, and sandboxed python execution right on our landing page.
                    </p>
                  </div>

                  {/* Tab Selectors */}
                  <div className="space-y-3">
                    <button
                      onClick={() => { setActiveTab("analyst"); setSelectedPrompt(0); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        activeTab === "analyst"
                          ? "border-indigo-500/30 bg-indigo-500/5 text-white"
                          : "border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${activeTab === "analyst" ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
                          <Brain className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold">AI Analyst Agent</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Natural language query to validated SQL</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>

                    <button
                      onClick={() => { setActiveTab("forecasting"); setSelectedPrompt(0); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        activeTab === "forecasting"
                          ? "border-indigo-500/30 bg-indigo-500/5 text-white"
                          : "border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${activeTab === "forecasting" ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold">Predictive Forecasting</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Prophet modeling with custom horizon controls</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>

                    <button
                      onClick={() => { setActiveTab("notebook"); setSelectedPrompt(0); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        activeTab === "notebook"
                          ? "border-indigo-500/30 bg-indigo-500/5 text-white"
                          : "border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${activeTab === "notebook" ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
                          <Terminal className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold">Sandbox Python Canvas</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">In-browser data cleansing & transformation</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>
                  </div>

                  {/* Context Control Panel */}
                  <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/10 space-y-4">
                    {activeTab === "analyst" && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Choose Question Prompt</span>
                        <div className="flex flex-col gap-2">
                          {prompts.analyst.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedPrompt(idx)}
                              className={`text-xs px-3 py-2 rounded-xl border text-left transition-all ${
                                selectedPrompt === idx
                                  ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-300 font-semibold"
                                  : "border-slate-800/60 bg-transparent text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              "{p.q}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "forecasting" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>Forecast Horizon</span>
                          <span className="text-indigo-400 font-mono">{forecastHorizon} Months</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="12"
                          step="3"
                          value={forecastHorizon}
                          onChange={(e) => setForecastHorizon(Number(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Q1 (3m)</span>
                          <span>Q2 (6m)</span>
                          <span>Q3 (9m)</span>
                          <span>Q4 (12m)</span>
                        </div>
                      </div>
                    )}

                    {activeTab === "notebook" && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">PyTorch Sandbox environment</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Securely pre-compiles locally within sandboxed WebAssembly context. Fully sandboxed execution, keeping your production schemas untouched.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Side: Visual Terminal Output */}
                <div className="w-full lg:w-7/12 relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/0 blur-xl opacity-80" />
                  
                  <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-1 shadow-2xl overflow-hidden">
                    {/* Console Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-900 px-4 py-3 bg-slate-950">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-slate-800" />
                        <div className="h-3 w-3 rounded-full bg-slate-800" />
                        <div className="h-3 w-3 rounded-full bg-slate-800" />
                        <span className="font-mono text-[10px] text-slate-400 ml-2">sandbox-env / {activeTab}-console</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPlaying ? (
                          <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        <span className="font-mono text-[9px] text-slate-500 tracking-wider">
                          {isPlaying ? "COMPILING MODEL..." : "IDLE / COMPILED"}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 font-mono text-[11px] text-slate-300 min-h-[340px] space-y-4">
                      
                      {/* Compilation Overlay state */}
                      {isPlaying && (
                        <div className="space-y-2 py-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                          <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mb-2" />
                          <div className="text-[10px] text-slate-400">Loading neural weights & analyzing query context...</div>
                          <div className="w-48 bg-slate-900 rounded-full h-1 overflow-hidden">
                            <div className="bg-indigo-500 h-1 transition-all duration-75" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* AI Analyst Output Tab */}
                      {!isPlaying && activeTab === "analyst" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div>
                            <div className="text-slate-500 mb-1">&gt;&gt; USER PROMPT:</div>
                            <div className="text-slate-100 font-bold">"{prompts.analyst[selectedPrompt].q}"</div>
                          </div>

                          <div>
                            <div className="text-slate-500 mb-1">&gt;&gt; EXPLAINED SQL:</div>
                            <pre className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-indigo-300 overflow-x-auto text-[10px] leading-relaxed">
                              {prompts.analyst[selectedPrompt].sql}
                            </pre>
                          </div>

                          <div>
                            <div className="text-slate-500 mb-2">&gt;&gt; PARSED RESULT:</div>
                            <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950">
                              <table className="w-full text-left text-[10px] border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400">
                                    {prompts.analyst[selectedPrompt].result.headers.map((h, i) => (
                                      <th key={i} className="p-2 font-bold">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {prompts.analyst[selectedPrompt].result.rows.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10">
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-2 font-medium text-slate-300">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Forecasting Output Tab */}
                      {!isPlaying && activeTab === "forecasting" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div>
                            <div className="text-slate-500 mb-1">&gt;&gt; PROPHET TARGET METRICS:</div>
                            <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-3 border border-slate-900 rounded-xl">
                              <div>
                                <div className="text-[9px] text-slate-500">CURRENT ARR</div>
                                <div className="text-xs font-bold text-white mt-0.5">{prompts.forecasting[0].metrics.current}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-500">PROJECTED ({forecastHorizon}m)</div>
                                <div className="text-xs font-bold text-indigo-400 mt-0.5">
                                  {forecastHorizon === 3 ? "$51.4M (+6.6%)" : forecastHorizon === 6 ? "$55.1M (+14.3%)" : forecastHorizon === 9 ? "$58.9M (+22.1%)" : "$62.5M (+29.6%)"}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-500">CONFIDENCE</div>
                                <div className="text-xs font-bold text-emerald-400 mt-0.5">{prompts.forecasting[0].metrics.confidence}</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-slate-500 mb-1">&gt;&gt; AUTO-REGRESSIVE TREND GRAPH:</div>
                            <div className="p-2 bg-slate-900/20 border border-slate-900 rounded-xl relative h-40">
                              
                              {/* Custom SVG Line Chart */}
                              <svg className="w-full h-full" viewBox="0 0 500 150">
                                {/* Grid lines */}
                                <line x1="0" y1="30" x2="500" y2="30" stroke="#111827" strokeDasharray="3,3" />
                                <line x1="0" y1="75" x2="500" y2="75" stroke="#111827" strokeDasharray="3,3" />
                                <line x1="0" y1="120" x2="500" y2="120" stroke="#111827" strokeDasharray="3,3" />

                                {/* Historical Data Curve */}
                                <path
                                  d="M 10,120 L 50,115 L 90,105 L 130,110 L 170,95 L 210,90 L 250,80"
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth="2.5"
                                />

                                {/* Projection Curve (Adjusts based on horizon slider) */}
                                <path
                                  d={
                                    forecastHorizon === 3
                                      ? "M 250,80 L 290,75 L 330,70 L 370,68"
                                      : forecastHorizon === 6
                                      ? "M 250,80 L 290,75 L 330,70 L 370,68 L 410,60"
                                      : forecastHorizon === 9
                                      ? "M 250,80 L 290,75 L 330,70 L 370,68 L 410,60 L 450,55"
                                      : "M 250,80 L 290,75 L 330,70 L 370,68 L 410,60 L 450,55 L 490,45"
                                  }
                                  fill="none"
                                  stroke="#a855f7"
                                  strokeWidth="2"
                                  strokeDasharray="4,4"
                                />

                                {/* Confidence Interval Band */}
                                <path
                                  d={
                                    forecastHorizon === 3
                                      ? "M 250,80 L 290,85 L 330,85 L 370,82 L 370,52 L 330,55 L 290,65 Z"
                                      : forecastHorizon === 6
                                      ? "M 250,80 L 290,85 L 330,85 L 370,82 L 410,75 L 410,45 L 370,52 L 330,55 L 290,65 Z"
                                      : forecastHorizon === 9
                                      ? "M 250,80 L 290,85 L 330,85 L 370,82 L 410,75 L 450,72 L 450,38 L 410,45 L 370,52 L 330,55 L 290,65 Z"
                                      : "M 250,80 L 290,85 L 330,85 L 370,82 L 410,75 L 450,72 L 490,62 L 490,28 L 450,38 L 410,45 L 370,52 L 330,55 L 290,65 Z"
                                  }
                                  fill="rgba(168, 85, 247, 0.08)"
                                />

                                {/* Highlight points */}
                                <circle cx="250" cy="80" r="4" fill="#6366f1" />
                                <text x="240" y="70" fill="#6366f1" fontSize="8" fontFamily="monospace">Present</text>

                                <circle
                                  cx={
                                    forecastHorizon === 3 ? "370" : forecastHorizon === 6 ? "410" : forecastHorizon === 9 ? "450" : "490"
                                  }
                                  cy={
                                    forecastHorizon === 3 ? "68" : forecastHorizon === 6 ? "60" : forecastHorizon === 9 ? "55" : "45"
                                  }
                                  r="4"
                                  fill="#a855f7"
                                />
                                <text
                                  x={
                                    forecastHorizon === 3 ? "330" : forecastHorizon === 6 ? "370" : forecastHorizon === 9 ? "410" : "440"
                                  }
                                  y={
                                    forecastHorizon === 3 ? "58" : forecastHorizon === 6 ? "50" : forecastHorizon === 9 ? "45" : "35"
                                  }
                                  fill="#a855f7"
                                  fontSize="8"
                                  fontFamily="monospace"
                                >
                                  {forecastHorizon}m Proj
                                </text>
                              </svg>

                              {/* Horizon Indicators */}
                              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] text-slate-500">
                                <span>Jan 2026 (Now)</span>
                                <span>May 2026</span>
                                <span>Sep 2026</span>
                                <span>Dec 2026</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Python Sandbox Tab */}
                      {!isPlaying && activeTab === "notebook" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div>
                            <div className="text-slate-500 mb-1">&gt;&gt; SOURCE CODE:</div>
                            <pre className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-teal-300 overflow-x-auto text-[10px] leading-relaxed">
                              {prompts.notebook[0].code}
                            </pre>
                          </div>

                          <div>
                            <div className="text-slate-500 mb-1">&gt;&gt; CONSOLE STDOUT:</div>
                            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-slate-400 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap font-mono">
                              {prompts.notebook[0].output}
                            </pre>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* HIGH CONVERTING BENTO GRID SECTION */}
          <section className="py-24 relative z-10 border-t border-slate-900">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Vivexa Suite Capabilities
                </span>
                <p className="text-3xl sm:text-5xl font-black text-slate-100 leading-tight">
                  Engineered for high fidelity,<br />
                  built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">regulatory standards</span>
                </p>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                  Every feature has been optimized to ensure sub-15ms data vector query dispatching, end-to-end auditability, and beautiful multi-modal reporting.
                </p>
              </div>

              {/* Advanced Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Bento Card 1: Large Feature (Security) */}
                <div className="md:col-span-2 p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between space-y-8 hover:border-indigo-500/20 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-100">Bank-Grade Compliance & Sandbox Isolation</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                      SSO SAML 2.0 corporate directories, SOC2 Type II compliance audit loops, and strict row-level access control (RBAC) ensure sensitive columns never leak outside authorized roles.
                    </p>
                  </div>
                  
                  {/* Visual trust block */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-900 text-left">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Retention</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">Zero Persistent Logs</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Authentication</div>
                      <div className="text-sm font-extrabold text-indigo-400 mt-0.5">SSO SAML 2.0</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Security SLA</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">SOC2 Compliant</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Databases</div>
                      <div className="text-sm font-extrabold text-indigo-400 mt-0.5">AES-256 Encrypted</div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Small Feature */}
                <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/20 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Automated Alert Triggers</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Establish recurring cron actions or event-driven anomalous latency loops. Get immediate insights dispatched directly to Slack or mailboxes.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Integration Channel</span>
                    <span className="text-indigo-400 font-bold">Slack + Email</span>
                  </div>
                </div>

                {/* Bento Card 3: Small Feature */}
                <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/20 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Data Cleansing Studio</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Detect, map, and impute missing values automatically. Standardize datetime anomalies and format nested columns in a single interactive view.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Cleaning Precision</span>
                    <span className="text-emerald-400 font-bold">Auto-Imputation</span>
                  </div>
                </div>

                {/* Bento Card 4: Large Feature */}
                <div className="md:col-span-2 p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between space-y-8 hover:border-indigo-500/20 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Brain className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-100">Predictive Modeling & Trend Extraction</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                      Generate robust auto-regressive projections with upper and lower error bounds. Vivexa handles holiday cycles, seasonal variations, and external macroeconomic trend variables with high mathematical consistency.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-900 text-left">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold font-mono">Error bound</div>
                      <div className="text-xs font-bold text-white mt-1">Symmetrical 95% CI</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold font-mono">Model Base</div>
                      <div className="text-xs font-bold text-indigo-400 mt-1">Time-Series Prophet</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold font-mono">Convergence</div>
                      <div className="text-xs font-bold text-white mt-1">&lt;1.8 seconds</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* NEW SECTION: ALL COMPREHENSIVE PLATFORM FEATURES DIRECTORY */}
          <section className="py-24 relative z-10 border-t border-slate-900 bg-[#060b19]/30">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">Platform Capabilities</span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
                  All Site Features & Core Services
                </h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                  Vivexa fuses multi-agent cooperation, mathematical forecasting engines, and secure browser runtimes into a unified dashboard.
                </p>
              </div>

              {/* Complete Features Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Brain className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">AI Data Analyst</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Convert normal English queries into perfectly formed, syntax-validated SQL statements optimized for your specific dialect schema.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Predictive Forecasting</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instantly deploy auto-regressive Prophet algorithms with upper/lower bounds, seasonal adjustments, and custom prediction intervals.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Multi-Agent Consensus</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Spawns autonomous planner, SQL, and certifier agent nodes that deliberate, audit results, and align outputs dynamically.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Python Sandbox Studio</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Execute code, perform data cleansing, impute missing values, and transform arrays directly in an isolated WebAssembly compiler.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Enterprise Schema Catalog</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Upload CSV or integrate databases, and view beautiful metadata profiling with automatically detected metrics and null ratios.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Root Cause Analyzer</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Isolate pipeline lag, query friction, outliers, or column drift using our automated trace lineages and query bottleneck profiles.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">CEO Business Cockpit</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unified high-level dashboard summarizing cash runway indicators, EBITDA multipliers, risk heatmaps, and target goals.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">KPI Metric Builder</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Formulate metrics, compile associated LookerML semantic declarations, and output highly compatible queries instantly.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* NEW SECTION: WHY YOU SHOULD USE OUR PLATFORM */}
          <section className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">Value Proposition</span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
                  Why Choose Vivexa?
                </h2>
                <p className="text-slate-400 text-sm max-w-xl mx-auto">
                  By automating statistical workloads and streamlining consensus, Vivexa cuts typical analytics timelines from weeks to seconds.
                </p>
              </div>

              {/* Three Value Pillars Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="p-8 rounded-2xl border border-slate-850 bg-slate-900/10 hover:bg-slate-900/20 transition-all space-y-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">1. Instantaneous Ingestion-to-Insight</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stop writing repetitive Python scripts and SQL boilerplates. Vivexa’s autonomous analyzer interprets, cleans, profiles, and visualizes raw CSV sheets or database tables instantly upon upload. What used to require a team of junior analysts is delivered under 3 seconds.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-slate-850 bg-slate-900/10 hover:bg-slate-900/20 transition-all space-y-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">2. Fully Audited, Safe Execution</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Unlike standard black-box AI tools, Vivexa includes an in-browser WebAssembly python compiler and a specialized "Guardrails Certifier Agent Node". Every query result is cross-validated against raw statistical profiles, preventing hallucinations and ensuring compliance.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-slate-850 bg-slate-900/10 hover:bg-slate-900/20 transition-all space-y-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">3. Absolute C-Suite Alignment</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bridge the divide between tech details and operational goals. Vivexa generates rich business reports, slides, and SWOT assessments targeted directly to high-level stakeholders, keeping engineering teams and executive boards completely in sync.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* NEW SECTION: WHY IS OUR PLATFORM THE BEST (COMPETITIVE ANALYSIS MATRIX) */}
          <section className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">Market Comparison</span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
                  Why Vivexa is the Absolute Best
                </h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                  Compare Vivexa with standard BI suites and typical drag-and-drop auto-ML pipelines.
                </p>
              </div>

              {/* Competitive Comparison Matrix Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-950 shadow-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-850 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-5 font-bold">Feature / Capability</th>
                      <th className="p-5 font-bold text-indigo-300 bg-indigo-500/5">Vivexa Enterprise</th>
                      <th className="p-5 font-bold">Legacy BI (e.g. Tableau)</th>
                      <th className="p-5 font-bold">Standard Auto-ML tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-normal">
                    
                    <tr className="hover:bg-slate-900/10">
                      <td className="p-5 font-bold text-slate-200">Natural Language Actionability</td>
                      <td className="p-5 bg-indigo-500/5 text-emerald-400 font-semibold flex items-center gap-2">
                        <Check className="h-4 w-4" /> Real-time compilation to SQL & Python
                      </td>
                      <td className="p-5 text-slate-400">Read-only text searches</td>
                      <td className="p-5 text-slate-400">Strictly block-based visual UI</td>
                    </tr>

                    <tr className="hover:bg-slate-900/10">
                      <td className="p-5 font-bold text-slate-200">Execution Sandbox</td>
                      <td className="p-5 bg-indigo-500/5 text-emerald-400 font-semibold">
                        <Check className="h-4 w-4 inline mr-2" /> WebAssembly safe in-browser isolation
                      </td>
                      <td className="p-5 text-slate-400">None. Limited client calculations</td>
                      <td className="p-5 text-slate-400">Requires expensive backend VM cluster</td>
                    </tr>

                    <tr className="hover:bg-slate-900/10">
                      <td className="p-5 font-bold text-slate-200">Consensus Audit Protocols</td>
                      <td className="p-5 bg-indigo-500/5 text-emerald-400 font-semibold">
                        <Check className="h-4 w-4 inline mr-2" /> Multi-Agent consensus deliberation loops
                      </td>
                      <td className="p-5 text-slate-400">None. User manually debugs syntax</td>
                      <td className="p-5 text-slate-400">None. Simple singular model scores</td>
                    </tr>

                    <tr className="hover:bg-slate-900/10">
                      <td className="p-5 font-bold text-slate-200">Ingestion Latency</td>
                      <td className="p-5 bg-indigo-500/5 text-emerald-400 font-semibold">
                        <Check className="h-4 w-4 inline mr-2" /> &lt;3 seconds (Full profile + forecast)
                      </td>
                      <td className="p-5 text-slate-400">Minutes or hours of ETL/Data Prep</td>
                      <td className="p-5 text-slate-400">Long queue-based training models</td>
                    </tr>

                    <tr className="hover:bg-slate-900/10">
                      <td className="p-5 font-bold text-slate-200">Compliance & Trust Security</td>
                      <td className="p-5 bg-indigo-500/5 text-emerald-400 font-semibold">
                        <Check className="h-4 w-4 inline mr-2" /> Zero Persistent logs + SOC2 SLA
                      </td>
                      <td className="p-5 text-slate-400">Vulnerable database user credential caching</td>
                      <td className="p-5 text-slate-400">Unfiltered model output exposure</td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          </section>

          {/* FOUNDERS SECTION */}
          <Founders />

          {/* HIGH-CONVERSION STARTUP CALL-TO-ACTION */}
          <section className="py-20 relative z-10 px-6 lg:px-8">
            <div className="mx-auto max-w-5xl bg-gradient-to-r from-indigo-950/20 via-slate-900 to-purple-950/20 rounded-3xl p-10 border border-indigo-500/20 text-center space-y-6 shadow-2xl">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Join the Future of Decision Intelligence</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Automate your complex data operations today</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Empower your leadership, sales operations, and data teams with audited, secure predictive capabilities.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link to="/register" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
                  Start Free Trial
                </Link>
                <Link to="/book-demo" className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl transition-all">
                  Schedule Executive Demo
                </Link>
              </div>
            </div>
          </section>

        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
