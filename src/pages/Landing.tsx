import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, BarChart3, Brain, Database, Shield, Zap, CheckCircle2,
  Sparkles, Terminal, Workflow, Activity, Globe, Lock, Play, Cpu, Users,
  ChevronRight, RefreshCw, Layers, Sliders, Check, FileText, CheckCheck,
  TrendingUp, AlertCircle, Eye, ShieldCheck, Server, Code, FileCheck,
  Building, HardDrive, LineChart
} from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { Founders } from "@/components/landing/Founders";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDemoTab, setActiveDemoTab] = useState<'profile' | 'forecast' | 'security' | 'brief'>('forecast');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = (tab: 'profile' | 'forecast' | 'security' | 'brief') => {
    setIsSimulating(true);
    setActiveDemoTab(tab);
    setTimeout(() => {
      setIsSimulating(false);
    }, 300);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen selection:bg-indigo-500/30">
      <SEOHead 
        title="Vivexa | AI-Native Enterprise Analytics & Decision Intelligence" 
        description="The Autonomous Data Science Engine for Enterprise Decisions. Multi-agent AI swarms, in-browser DuckDB-WASM, secure MicroVM Python sandboxes, and predictive forecasting."
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-24">
          
          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-28">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />
            
            {/* Elegant Background Grid Accents */}
            <div className="absolute inset-y-0 right-0 left-0 -z-10 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
              
              {/* Startup Version Badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-semibold text-indigo-300 backdrop-blur-md shadow-lg shadow-indigo-500/10"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                <span>Vivexa 4.2 • Asynchronous Worker Pools • 250MB WASM Safety • Token Budgeting</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
                className="max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-slate-100"
              >
                The Autonomous Data Science <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
                  Engine for Enterprise Decisions
                </span>
              </motion.h1>

              {/* Subheadline Context */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                className="mt-6 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-400 font-normal"
              >
                Coordinate specialized AI agent swarms, process zero-copy queries with 250MB WASM memory safety guardrails, offload heavy compute to asynchronous background worker threads, collaborate in real time with Yjs CRDTs, and enforce granular workspace token budgets.
              </motion.p>

              {/* Core CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
                className="mt-8 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  to="/register"
                  id="hero-start-trial-btn"
                  className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-xs font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  Start Building Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/book-demo"
                  id="hero-book-demo-btn"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-8 text-xs font-bold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                >
                  Book 1-on-1 Demo
                </Link>

                <Link
                  to="/product-tour"
                  id="hero-product-tour-btn"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-6 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-500/15"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Interactive Product Tour
                </Link>
              </motion.div>

              {/* LIVE INTERACTIVE AGENT SWARM PREVIEW WIDGET */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-14 w-full max-w-5xl rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl text-left relative overflow-hidden"
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Widget Header & Tab Selectors */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5 ml-2">
                      <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                      vivexa-swarm-orchestrator // dataset: ARR_Revenue_Q3_Q4.parquet
                    </span>
                  </div>

                  {/* Agent Tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => handleSimulate('profile')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDemoTab === 'profile'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Database className="h-3 w-3" />
                      1. Data Profiler
                    </button>
                    <button
                      onClick={() => handleSimulate('forecast')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDemoTab === 'forecast'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Brain className="h-3 w-3" />
                      2. ML Forecast
                    </button>
                    <button
                      onClick={() => handleSimulate('security')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDemoTab === 'security'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      3. Security Certifier
                    </button>
                    <button
                      onClick={() => handleSimulate('brief')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDemoTab === 'brief'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="h-3 w-3" />
                      4. Executive Brief
                    </button>
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="py-5">
                  <AnimatePresence mode="wait">
                    {activeDemoTab === 'profile' && (
                      <motion.div
                        key="tab-profile"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Total Ingested Rows</span>
                            <div className="text-xl font-black text-white">1,482,900</div>
                            <span className="text-[11px] text-emerald-400 font-medium">✓ 100% Parsed in 8.4ms (DuckDB-WASM)</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Data Quality Score</span>
                            <div className="text-xl font-black text-indigo-400">99.82%</div>
                            <span className="text-[11px] text-slate-400">0 critical nulls • 14 auto-imputed values</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Inferred Schema Format</span>
                            <div className="text-xl font-black text-cyan-300">18 Dimensions</div>
                            <span className="text-[11px] text-slate-400">Temporal series, ARR, Tier, ChurnRisk</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
                          <div className="text-indigo-400 font-bold flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" /> Data Profiler Agent Output:
                          </div>
                          <p className="text-slate-400 leading-relaxed text-[11px]">
                            Auto-detected high-cardinality foreign keys (`account_uuid`), normalized ISO-8601 timestamps, and created index vectors for instant zero-copy aggregations. Ready for Bayesian auto-regression.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {activeDemoTab === 'forecast' && (
                      <motion.div
                        key="tab-forecast"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Model Architecture</span>
                            <div className="text-sm font-extrabold text-white mt-1">Prophet + Auto-ARIMA</div>
                            <span className="text-[10px] text-emerald-400 font-mono">Bayesian Parameterized</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Predicted Q4 ARR</span>
                            <div className="text-sm font-extrabold text-indigo-400 mt-1">$14.82M ± 4.2%</div>
                            <span className="text-[10px] text-slate-400 font-mono">95% Confidence Interval</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Statistical Error (MAPE)</span>
                            <div className="text-sm font-extrabold text-cyan-300 mt-1">1.84% Error</div>
                            <span className="text-[10px] text-slate-400 font-mono">Convergence in 1.2s</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Seasonality Weights</span>
                            <div className="text-sm font-extrabold text-emerald-400 mt-1">Q4 Surge (+28.4%)</div>
                            <span className="text-[10px] text-slate-400 font-mono">Macro Adjusted</span>
                          </div>
                        </div>

                        {/* Interactive Visual Graph Preview */}
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-indigo-400 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">Forward Projections with Statistical Bands</div>
                              <div className="text-[11px] text-slate-400">Continuous regression pipeline projecting 12 months forward with dynamic upper and lower sigma boundaries.</div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold whitespace-nowrap">
                            Confidence: High (p &lt; 0.001)
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {activeDemoTab === 'security' && (
                      <motion.div
                        key="tab-security"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Row-Level Security (RLS)</span>
                            <div className="text-sm font-extrabold text-emerald-400 mt-1">Verified & Active</div>
                            <span className="text-[10px] text-slate-400">Strict tenant isolation bounds</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">PII Redaction Engine</span>
                            <div className="text-sm font-extrabold text-indigo-400 mt-1">Automatic Masking</div>
                            <span className="text-[10px] text-slate-400">Zero sensitive columns exposed</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Compliance Attestation</span>
                            <div className="text-sm font-extrabold text-cyan-300 mt-1">SOC2 Type II + HIPAA</div>
                            <span className="text-[10px] text-slate-400">Cryptographic audit ledger</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-400">
                            <Lock className="h-3.5 w-3.5 text-indigo-400" />
                            Proof-of-Execution Hash:
                            <span className="text-slate-200">0x7f4e92a1c849bf00...</span>
                          </span>
                          <span className="text-emerald-400 font-bold">100% Tamper-Evident</span>
                        </div>
                      </motion.div>
                    )}

                    {activeDemoTab === 'brief' && (
                      <motion.div
                        key="tab-brief"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-indigo-500/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              Automated Executive Board Brief
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">Synthesized in 1.4s</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                            "Q3-Q4 Expansion Velocity exceeds the base case by <strong className="text-emerald-400">+14.2%</strong>. Customer acquisition costs decreased by <strong className="text-indigo-400">18.6%</strong> following enterprise self-serve rollout. Primary bottleneck identified in Mid-Market renewal friction."
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-300">
                              Action 1: Allocate 2 AE seats to Enterprise Upsell
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300">
                              Action 2: Automate Day-45 Churn Interventions
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Metrics */}
                <div className="pt-4 border-t border-slate-850 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Swarm Consensus: 4/4 Nodes
                    </span>
                    <span>Compute: DuckDB WASM + E2B MicroVM</span>
                  </div>
                  <div className="text-indigo-400 font-bold">
                    Zero Hallucination SLA Guarantee
                  </div>
                </div>
              </motion.div>

              {/* Data Ingestion Platform Logos */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-14 w-full max-w-5xl pt-8 border-t border-slate-900"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                      Universal Data Integrations
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Stream query vectors directly from your modern data lakehouse with zero data replication.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Snowflake", "BigQuery", "PostgreSQL", "Databricks", "Redshift", "ClickHouse", "Supabase", "Apache Iceberg"].map((db) => (
                      <span
                        key={db}
                        className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px] font-mono font-medium text-slate-300"
                      >
                        {db}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* BENTO GRID: ARCHITECTURAL PILLARS */}
          <section className="py-24 relative z-10 border-t border-slate-900">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
                  Autonomous Core Architecture
                </span>
                <p className="text-3xl sm:text-5xl font-black text-slate-100 leading-tight tracking-tight">
                  Engineered for High Mathematical Fidelity,<br />
                  Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">Enterprise Regulated Standards</span>
                </p>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                  Every feature has been optimized to ensure sub-10ms query execution, zero persistent data leakage, multi-agent consensus, and automated executive reporting.
                </p>
              </div>

              {/* Advanced Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Bento Card 1: Security & Governance */}
                <div className="md:col-span-2 p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between space-y-8 hover:border-indigo-500/30 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-100">Bank-Grade Compliance & Zero-Trust Governance</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                      SSO SAML 2.0 corporate directories, SCIM 2.0 user provisioning, SOC2 Type II compliance audit loops, and strict row-level access control (RBAC) ensure sensitive columns never leak outside authorized roles.
                    </p>
                  </div>
                  
                  {/* Visual trust block */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-900 text-left">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Retention</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">Zero Persistent Logs</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Authentication</div>
                      <div className="text-sm font-extrabold text-indigo-400 mt-0.5">SSO SAML 2.0 + SCIM</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Security SLA</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">SOC2 & HIPAA Ready</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Encryption</div>
                      <div className="text-sm font-extrabold text-indigo-400 mt-0.5">AES-256-GCM Envelope</div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Automated Alerts */}
                <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/30 transition-all">
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
                    <span className="text-indigo-400 font-bold">Slack + Custom SMTP</span>
                  </div>
                </div>

                {/* Bento Card 3: Dual Engine Compute */}
                <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Dual-Engine WASM + MicroVM</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Execute sub-10ms analytical queries right in the browser with DuckDB-WASM, or launch isolated E2B MicroVM containers for heavy Python, pandas, and scikit-learn models.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Query Latency</span>
                    <span className="text-emerald-400 font-bold">&lt;10ms Local WASM</span>
                  </div>
                </div>

                {/* Bento Card 4: Predictive Modeling */}
                <div className="md:col-span-2 p-8 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between space-y-8 hover:border-indigo-500/30 transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Brain className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-100">Predictive Modeling & Bayesian Trend Forecasting</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                      Generate robust auto-regressive projections with upper and lower error bounds. Vivexa handles holiday cycles, seasonal variations, and external macroeconomic trend variables with strict mathematical consistency.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-900 text-left">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold font-mono">Error bound</div>
                      <div className="text-xs font-bold text-white mt-1">Symmetrical 95% CI</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold font-mono">Model Base</div>
                      <div className="text-xs font-bold text-indigo-400 mt-1">Prophet + Auto-ARIMA</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold font-mono">Convergence</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">&lt;1.2 seconds</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* ALL COMPREHENSIVE PLATFORM FEATURES DIRECTORY */}
          <section className="py-24 relative z-10 border-t border-slate-900 bg-[#060b19]/30">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">Platform Capabilities</span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
                  Comprehensive Platform Features & Enterprise Modules
                </h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                  Vivexa fuses multi-agent cooperation, mathematical forecasting engines, and secure browser runtimes into a unified dashboard.
                </p>
              </div>

              {/* Complete Features Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">250MB WASM Memory Safety Guardrails</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Protects client browser stability with a 250MB WASM threshold. Large datasets automatically failover to server-side pushdown engines seamlessly.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Server className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Decoupled Background Workers</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    High-compute MicroVM pod provisioning and AI code execution offloaded to worker threads, ensuring zero event-loop blocking on main API routes.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Workspace Token Budgeting & Limits</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Granular per-tenant daily AI token caps and query execution timeouts (30s–180s) to prevent unexpected API costs and runaway agent loops.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Code className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Automated E2E Test Suite & AST Security</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Self-healing AST security guards block destructive SQL/code injection, verified against automated Yjs CRDT and worker integration tests.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Yjs Real-Time Collaboration</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Multi-cursor live co-authoring for notebooks and dashboards with Hocuspocus WebSocket sync and Write-Ahead Log (WAL) auditability.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">E2B MicroVM Sandboxed Python</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Secure MicroVM kernel pods for executing Python scripts, pandas dataframes, and ML pipelines with memory limits and zero host exposure.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Root Cause Analyzer</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Isolate pipeline lag, query friction, outliers, or column drift using our automated trace lineages and query bottleneck profiles.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/30 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">CEO Business Cockpit</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unified high-level dashboard summarizing cash runway indicators, EBITDA multipliers, risk heatmaps, and target goals.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* VALUE PILLARS */}
          <section className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">Value Proposition</span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
                  Why Choose Vivexa?
                </h2>
                <p className="text-slate-400 text-sm max-w-xl mx-auto">
                  By automating statistical workloads and streaming multi-agent consensus, Vivexa cuts typical analytics timelines from weeks to seconds.
                </p>
              </div>

              {/* Three Value Pillars Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/10 hover:bg-slate-900/20 transition-all space-y-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">1. Instantaneous Ingestion-to-Insight</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stop writing repetitive Python scripts and SQL boilerplates. Vivexa’s autonomous analyzer interprets, cleans, profiles, and visualizes raw CSV sheets or database tables instantly upon upload. What used to require a team of junior analysts is delivered under 3 seconds.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/10 hover:bg-slate-900/20 transition-all space-y-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">2. Fully Audited, Safe Execution</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Unlike standard black-box AI tools, Vivexa includes an in-browser WebAssembly python compiler and a specialized "Guardrails Certifier Agent Node". Every query result is cross-validated against raw statistical profiles, preventing hallucinations and ensuring compliance.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/10 hover:bg-slate-900/20 transition-all space-y-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">3. Absolute C-Suite Alignment</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bridge the divide between technical details and operational goals. Vivexa generates rich business reports, slides, and SWOT assessments targeted directly to high-level stakeholders, keeping engineering teams and executive boards completely in sync.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* MARKET COMPARISON MATRIX */}
          <section className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">Market Comparison</span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
                  Why Vivexa Outperforms the Industry
                </h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                  Compare Vivexa with standard BI suites and typical drag-and-drop auto-ML pipelines.
                </p>
              </div>

              {/* Competitive Comparison Matrix Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-950 shadow-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
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
                        <Check className="h-4 w-4 inline mr-2" /> WebAssembly DuckDB + E2B MicroVM
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
                        <Check className="h-4 w-4 inline mr-2" /> Zero Persistent logs + SCIM + SOC2 SLA
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
            <div className="mx-auto max-w-5xl bg-gradient-to-r from-indigo-950/30 via-slate-900 to-purple-950/30 rounded-3xl p-10 sm:p-14 border border-indigo-500/20 text-center space-y-6 shadow-2xl">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">Join the Future of Decision Intelligence</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Automate your enterprise data operations today</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Empower your executive leadership, operations, and engineering teams with verified, autonomous predictive capabilities.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link to="/register" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
                  Start Free Trial Now
                </Link>
                <Link to="/book-demo" className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl transition-all">
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
