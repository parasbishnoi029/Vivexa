import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";
import { Check, Zap, Shield, Sparkles, HelpCircle, ArrowRight, Calculator } from "lucide-react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [teamSize, setTeamSize] = useState(10);

  const plans = [
    {
      name: "Free Developer",
      desc: "For individual analysts and developers testing autonomous queries and datasets.",
      priceMonthly: "$0",
      priceAnnual: "$0",
      features: [
        "1 User Workspace Seat",
        "50 AI Queries / day",
        "Up to 3 Uploaded Datasets",
        "Standard SQL & Python Execution",
        "Community Discord & Documentation"
      ],
      cta: "Get Started Free",
      highlight: false
    },
    {
      name: "Pro Enterprise",
      desc: "For growing analytics teams scaling AI-native decision intelligence.",
      priceMonthly: "$199",
      priceAnnual: "$159",
      features: [
        "Up to 25 User Seats",
        "25,000 AI Analyst Queries / mo",
        "Unlimited Database Connectors",
        "Advanced Neural Time-Series Models",
        "Automated Slack & Email Digests",
        "Collaborative Python & SQL Notebooks",
        "Priority 24/7 Support SLA"
      ],
      cta: "Start Pro Trial",
      highlight: true
    },
    {
      name: "Custom Sovereign",
      desc: "For Fortune 500, Healthcare & Government requiring dedicated air-gapped VPCs.",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      features: [
        "Unlimited User Seats & Datasets",
        "Dedicated Air-Gapped VPC / On-Prem",
        "SOC2, GDPR, HIPAA BAA Agreements",
        "Bring Your Own Key (BYOK) KMS",
        "Dedicated Solutions Architect & TAM",
        "Custom LLM Fine-Tuning & Custom Connectors"
      ],
      cta: "Contact Enterprise Sales",
      highlight: false
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <SEOHead
        title="Predictable Enterprise Pricing | Vivexa AI"
        description="Explore transparent pricing plans for Vivexa's AI Decision Intelligence Operating System. From free developer tier to enterprise air-gapped deployments."
        keywords={[
          "Vivexa Pricing",
          "Enterprise AI Analytics Cost",
          "Business Intelligence Subscription",
          "AI Data Science Pricing",
          "Decision Intelligence Platform ROI"
        ]}
      />
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
              No hidden query fees. Unlimited datasets. Cancel or upgrade anytime with zero lock-in.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-bold ${!annual ? "text-white" : "text-slate-400"}`}>Monthly Billing</span>
              <button
                onClick={() => setAnnual(!annual)}
                aria-label="Toggle annual billing"
                className="w-12 h-6 bg-indigo-600 rounded-full p-1 transition-colors relative"
              >
                <div className={`h-4 w-4 bg-white rounded-full transition-transform duration-200 ${annual ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-xs font-bold ${annual ? "text-white" : "text-slate-400"} flex items-center gap-1.5`}>
                Annual Billing <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">Save 20%</span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-200 ${
                  p.highlight
                    ? "bg-gradient-to-b from-indigo-950/80 to-slate-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10"
                    : "enterprise-card"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
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
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                      p.highlight
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
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
          <div className="enterprise-card rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Interactive Enterprise ROI Estimator</h3>
                <p className="text-xs text-slate-400">Estimate annualized engineering and data science team productivity gains.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center pt-2">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Active Analysts / Decision-Makers</span>
                    <span className="text-indigo-400 font-mono">{teamSize} team members</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Estimated Annual Value</div>
                <div className="text-4xl font-black text-emerald-400 font-mono">
                  ${(teamSize * 18500).toLocaleString()} / yr
                </div>
                <div className="text-[11px] text-slate-500">Calculated on ~12.5 engineering hours saved per analyst weekly</div>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
