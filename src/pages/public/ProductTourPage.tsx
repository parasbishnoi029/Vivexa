import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  LayoutDashboard, Sparkles, MessageSquare, Terminal, BarChart3, FileText,
  ArrowRight, Play, CheckCircle2
} from "lucide-react";

export default function ProductTourPage() {
  const [activeScreen, setActiveScreen] = useState<string>("dashboard");

  const screens = [
    { id: "dashboard", name: "Workspace Dashboard", icon: LayoutDashboard, desc: "Real-time key metrics, recent projects, dataset status, and rapid query triggers." },
    { id: "ai", name: "AI Analyst Studio", icon: Sparkles, desc: "Autonomous data science engine writing SQL, running regressions, and generating charts." },
    { id: "chat", name: "AI Natural Chat", icon: MessageSquare, desc: "Conversational analytics assistant explaining complex datasets in plain English." },
    { id: "notebooks", name: "Notebook Canvas", icon: Terminal, desc: "Interactive Python/SQL computational notebook with instant GPU execution." },
    { id: "forecasting", name: "Predictive Forecasting", icon: BarChart3, desc: "Prophet & neural time-series trend forecasting with scenario bounds." },
    { id: "reports", name: "Executive Reports", icon: FileText, desc: "Automated executive summary briefs formatted for board presentations." }
  ];

  const currentScreen = screens.find((s) => s.id === activeScreen) || screens[0];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <SEOHead
        title="Interactive Product Tour | Vivexa Decision Intelligence"
        description="Experience Vivexa's AI decision intelligence platform in action. Explore AI analyst studios, predictive forecasting, collaborative notebooks, and automated executive reports."
        keywords={[
          "Vivexa Product Tour",
          "AI Analytics Demo",
          "Autonomous Data Science Tour",
          "Interactive BI Showcase"
        ]}
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Play className="h-4 w-4" /> Live Interactive Product Tour
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Vivexa Live</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Preview the workspace modules without creating an account or logging in.
            </p>
          </div>

          {/* Module Selector Bar */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-800 pb-4">
            {screens.map((sc) => {
              const Icon = sc.icon;
              const isActive = activeScreen === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScreen(sc.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {sc.name}
                </button>
              );
            })}
          </div>

          {/* Screen Showcase */}
          <div className="enterprise-card rounded-3xl p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentScreen.name}</h2>
                <p className="text-xs text-slate-400 mt-1">{currentScreen.desc}</p>
              </div>
              <Link to="/register" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors">
                Launch Full Workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between font-mono text-xs text-slate-300 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-500 font-bold">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  VIVEXA ENGINE PREVIEW // {currentScreen.id.toUpperCase()}
                </span>
                <span className="text-indigo-400">STATUS: READY</span>
              </div>

              <div className="py-8 space-y-4 max-w-2xl">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-indigo-400 font-bold"># Active Environment Context</div>
                  <div className="text-slate-300">&gt; Loaded Schema: enterprise_analytics_v3</div>
                  <div className="text-slate-300">&gt; Query Engine: In-Memory DuckDB + Gemini Causal Kernel</div>
                  <div className="text-emerald-400 font-bold">&gt; Ready for natural language query execution</div>
                </div>

                <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-white font-sans">Prompt Example:</div>
                  <div className="text-slate-300 italic font-sans text-xs">
                    "Identify underperforming regional product segments and forecast impact of 5% price reduction."
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-slate-500 text-[11px]">
                <span>GPU Acceleration: Enabled</span>
                <span>Latency: 12ms</span>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
