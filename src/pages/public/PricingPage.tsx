import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { Check, Zap, Shield, Sparkles, HelpCircle, ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [teamSize, setTeamSize] = useState(10);

  const plans = [
    {
      name: "Starter",
      desc: "For small teams & startups exploring automated decision analytics.",
      priceMonthly: "$49",
      priceAnnual: "$39",
      features: [
        "Up to 5 User Seats",
        "2,500 AI Analyst Queries / mo",
        "5 Connected SQL Databases",
        "Standard Forecasting Models",
        "Community Support & Manual"
      ],
      cta: "Start 14-Day Free Trial",
      highlight: false
    },
    {
      name: "Pro Enterprise",
      desc: "For growing organizations scaling AI analytics across departments.",
      priceMonthly: "$199",
      priceAnnual: "$159",
      features: [
        "Up to 25 User Seats",
        "25,000 AI Analyst Queries / mo",
        "Unlimited Database Connectors",
        "Advanced Neural Time-Series Models",
        "Automated Slack & Email Alerts",
        "Notebook & Python Execution Canvas",
        "Priority 24/7 Support SLA"
      ],
      cta: "Start Pro Trial",
      highlight: true
    },
    {
      name: "Custom Sovereign",
      desc: "For Fortune 500, Healthcare & Defense requiring air-gapped VPCs.",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      features: [
        "Unlimited User Seats & Datasets",
        "Dedicated Air-Gapped VPC / On-Prem",
        "SOC2, GDPR, HIPAA BAA Agreements",
        "Bring Your Own Key (BYOK) Encryption",
        "Dedicated Solutions Engineer & TAM",
        "Custom LLM Fine-Tuning & Connectors"
      ],
      cta: "Contact Enterprise Sales",
      highlight: false
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Zap className="h-4 w-4" /> Transparent Enterprise Pricing
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Predictable Plans for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Every Scale</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              No hidden query fees. Unlimited datasets. Cancel or upgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-bold ${!annual ? "text-white" : "text-slate-400"}`}>Monthly Billing</span>
              <button
                onClick={() => setAnnual(!annual)}
                className="w-12 h-6 bg-indigo-600 rounded-full p-1 transition-colors relative"
              >
                <div className={`h-4 w-4 bg-white rounded-full transition-transform ${annual ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-xs font-bold ${annual ? "text-white" : "text-slate-400"} flex items-center gap-1.5`}>
                Annual Billing <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">Save 20%</span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between relative transition-all ${
                  p.highlight
                    ? "bg-gradient-to-b from-indigo-900/60 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105"
                    : "bg-slate-900/50 border border-slate-800"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      {annual ? p.priceAnnual : p.priceMonthly}
                    </span>
                    {p.priceMonthly !== "Custom" && (
                      <span className="text-xs text-slate-400 font-medium">/ user / month</span>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    {p.features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs text-slate-200">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    to={p.priceMonthly === "Custom" ? "/book-demo" : "/register"}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      p.highlight
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                  >
                    {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ROI Calculator Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Interactive Enterprise ROI Estimator</h3>
                <p className="text-xs text-slate-400">Estimate time and salary savings for your organization.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center pt-2">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Number of Analysts / Executives</span>
                    <span className="text-indigo-400">{teamSize} users</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-950 h-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400 uppercase font-bold">Estimated Annual Savings</div>
                <div className="text-4xl font-black text-emerald-400">
                  ${(teamSize * 18500).toLocaleString()} / yr
                </div>
                <div className="text-[11px] text-slate-500">Based on ~12 hours saved per analyst weekly</div>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
