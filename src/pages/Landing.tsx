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
  
  return (
    <div ref={containerRef} className="relative min-h-screen selection:bg-indigo-500/30">
      <SEOHead 
        title="Vivexa | AI-Native Enterprise Analytics" 
        description="The Autonomous Data Science Engine for Enterprise Decisions."
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
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">SCIM 2.0 Provisioning</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    RFC 7644 compliant endpoints for automated user lifecycle, Okta/Azure AD group synchronization, and SAML role management.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Hybrid AST Query Router</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Directs simple analytical workloads to local DuckDB-WASM for sub-10ms compute, automatically offloading heavy queries to Snowflake or Databricks.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Yjs CRDT Real-Time Collaboration</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Multi-cursor live co-authoring for notebooks and dashboards with Hocuspocus WebSocket sync and Write-Ahead Log (WAL) auditability.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:border-indigo-500/20 transition-all space-y-4">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">E2B MicroVM Sandboxed Python</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Secure MicroVM kernel pods for executing Python scripts, pandas dataframes, and ML pipelines with memory limits and zero host exposure.
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
