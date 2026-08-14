import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import {
  LayoutDashboard, Sparkles, MessageSquare, Terminal, BarChart3, FileText, Settings,
  ArrowRight, Play, CheckCircle2, RefreshCw
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

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
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

          {/* Interactive Screen Preview Container */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  https://app.vivexa.ai/workspace/{activeScreen}
                </span>
              </div>

              <Link to="/register" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                Launch Live Session <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Simulated Live Interface */}
            <div className="min-h-[420px] bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    Preview: {screens.find((s) => s.id === activeScreen)?.name}
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                    LIVE DEMO ENVIRONMENT
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {screens.find((s) => s.id === activeScreen)?.desc}
                </p>

                {/* Simulated Content Based on Selection */}
                {activeScreen === "dashboard" && (
                  <div className="grid sm:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">Total Datasets Ingested</div>
                      <div className="text-2xl font-bold text-white mt-1">142 Tables</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">Monthly Query Latency</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">14.2 ms</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">Active AI Agents</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">8 Running</div>
                    </div>
                  </div>
                )}

                {activeScreen === "ai" && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                    <div className="text-indigo-400">&gt; User Prompt: "Analyze customer churn drivers in Q2"</div>
                    <div className="text-slate-400">&gt; Synthesizing SQL join across `users` and `subscriptions`...</div>
                    <div className="text-emerald-400">&gt; Result: Churn is 3.4x higher for users without SSO enabled.</div>
                  </div>
                )}

                {activeScreen === "forecasting" && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Q3 Revenue Prophet Projection</div>
                    <div className="h-24 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center text-xs text-slate-500 font-mono">
                      [ Interactive Recharts Trend Line with Upper Bound $4.2M & Lower Bound $3.8M ]
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Want full read/write access to your own databases?</span>
                <Link to="/register" className="text-indigo-400 font-bold hover:underline">
                  Create Free Account Now &rarr;
                </Link>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
