import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Brain, Sparkles, Database, BarChart3, Terminal, Workflow,
  ShieldCheck, ArrowRight, CheckCircle2, Rocket, Code2, Zap, Layers, Activity
} from "lucide-react";

export default function PlatformPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "decision-intelligence";

  const modules = [
    {
      id: "decision-intelligence",
      name: "Decision Intelligence",
      icon: Brain,
      tag: "Core AI Engine",
      headline: "Autonomous Causal Reasoning & Automated Decisioning",
      description: "Vivexa analyzes complex multi-table relational schemas to infer underlying causal relationships, identify growth drivers, and quantify business risk.",
      features: [
        "Automated schema mapping & join inference",
        "Causal driver analysis with confidence scoring",
        "Natural language query synthesis into executable SQL",
        "Executive decision briefs generated in seconds"
      ]
    },
    {
      id: "ai-analyst",
      name: "AI Analyst",
      icon: Sparkles,
      tag: "Autonomous Agent",
      headline: "Your Senior Data Scientist Available 24/7",
      description: "Ask complex multi-step analytical questions in plain English. Vivexa writes Python/SQL code, executes statistical tests, and visualizes charts.",
      features: [
        "Natural language to SQL & Python synthesis",
        "Automated data cleaning & outlier detection",
        "Interactive chart & dashboard generation",
        "Export to PDF, PowerPoint & CSV reports"
      ]
    },
    {
      id: "forecasting",
      name: "Predictive Forecasting",
      icon: BarChart3,
      tag: "Machine Learning",
      headline: "Neural Time-Series & Prophet Trend Projections",
      description: "Deploy production-grade Machine Learning forecasting models without writing line of code. Predict revenue, churn, inventory, and demand.",
      features: [
        "Prophet & ARIMA automated model tuning",
        "Seasonality & holiday effect decomposition",
        "Upper/lower confidence interval boundaries",
        "Real-time scenario testing & what-if simulations"
      ]
    },
    {
      id: "notebooks",
      name: "Notebook Canvas",
      icon: Terminal,
      tag: "Developer Studio",
      headline: "Interactive Python, SQL & Markdown Computational Canvas",
      description: "Empower your technical data team with cloud-hosted notebooks with instant GPU acceleration, version control, and auto-complete.",
      features: [
        "In-browser Python, SQL & Pandas kernel execution",
        "Rich visual cell outputs (Recharts, Plotly, Seaborn)",
        "Version control & team collaborative comments",
        "One-click notebook to live dashboard deployment"
      ]
    },
    {
      id: "automations",
      name: "Automations & Alerts",
      icon: Workflow,
      tag: "Workflow Engine",
      headline: "Trigger-Driven Actions, Anomaly Alerts & Scheduled Digests",
      description: "Set threshold alerts for revenue dips, inventory shortages, or customer churn. Receive automated updates directly in Slack, Email, or Webhooks.",
      features: [
        "Event-driven anomaly detection triggers",
        "Slack, Microsoft Teams, Email & Webhook notifications",
        "Scheduled daily executive PDF report digests",
        "Automated dataset re-indexing pipelines"
      ]
    },
    {
      id: "data-connectors",
      name: "Data Connectors",
      icon: Database,
      tag: "Data Ingestion",
      headline: "50+ Enterprise Connectors with Zero ETL Configuration",
      description: "Connect Snowflake, BigQuery, PostgreSQL, MySQL, Salesforce, SAP, and AWS Redshift with enterprise encryption.",
      features: [
        "Read-only connection pooling with SSL/TLS 1.3",
        "Automatic schema discovery & metadata extraction",
        "Zero data retention mode for maximum privacy",
        "Incremental sync & streaming event listeners"
      ]
    }
  ];

  const currentModule = modules.find((m) => m.id === activeTab) || modules[0];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <SEOHead
        title={`${currentModule.name} | Vivexa Platform Architecture`}
        description={currentModule.description}
        keywords={[
          currentModule.name,
          "Vivexa Platform",
          "Enterprise AI Analytics",
          "Autonomous Decision Intelligence",
          "Data Lakehouse",
          "Python SQL Notebooks",
          "Time-Series Forecasting"
        ]}
        ogType="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Vivexa OS",
          "applicationCategory": "BusinessIntelligence",
          "operatingSystem": "Web",
          "description": "Enterprise decision intelligence and autonomous analytics platform.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }}
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Zap className="h-4 w-4" /> Enterprise Platform Architecture
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Vivexa <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Platform Suite</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Explore the core modules powering enterprise data intelligence across Fortune 500 organizations.
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-800 pb-4">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSearchParams({ tab: m.id })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {m.name}
                </button>
              );
            })}
          </div>

          {/* Selected Module Detail */}
          <div className="enterprise-card rounded-3xl p-8 grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold w-fit">
                {currentModule.tag}
              </div>

              <h2 className="text-3xl font-extrabold text-white">{currentModule.headline}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{currentModule.description}</p>

              <div className="space-y-2.5 pt-2">
                {currentModule.features.map((ft, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{ft}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Link to="/product-tour" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors">
                  Launch Product Tour <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors">
                  Try Live in Workspace
                </Link>
              </div>
            </div>

            {/* Visual Box */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-4 font-mono text-xs text-slate-300 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-[11px] text-slate-500 font-bold">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Kernel Execution Log: {currentModule.id}.py
                </span>
                <span>LATENCY: 18ms</span>
              </div>

              <div className="space-y-2 text-slate-400">
                <div className="text-indigo-400"># Initializing Vivexa Decision Kernel</div>
                <div>import vivexa as vx</div>
                <div>model = vx.load_model("{currentModule.id}")</div>
                <div className="text-emerald-400">&gt; Executing automated causal query...</div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-200">
                  <div className="text-xs font-bold text-white mb-1">Generated Output:</div>
                  <div>Confidence Score: 98.4%</div>
                  <div>Primary Driver: Revenue retention +14.2% YoY</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
