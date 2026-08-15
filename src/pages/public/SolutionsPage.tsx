import { useSearchParams, Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Building2, HeartPulse, ShoppingBag, Factory, ShieldAlert, LandPlot,
  ArrowRight, CheckCircle2, DollarSign
} from "lucide-react";

export default function SolutionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCat = searchParams.get("cat") || "finance";

  const solutions = [
    {
      id: "finance",
      title: "Financial Decision Intelligence",
      icon: DollarSign,
      desc: "Automate revenue prediction, expense anomaly detection, and quarterly audit report generation.",
      useCases: ["Liquidity stress testing", "Churn & LTV forecasting", "Automated SOX compliance audits", "Portfolio risk modeling"]
    },
    {
      id: "healthcare",
      title: "Healthcare & Clinical Analytics",
      icon: HeartPulse,
      desc: "HIPAA-compliant telemetry analytics enabling clinical decision support and hospital bed utilization forecasting.",
      useCases: ["Patient length-of-stay prediction", "Clinical resource allocation", "Medical claim fraud detection", "Drug trial analytics"]
    },
    {
      id: "retail",
      title: "Retail & E-commerce Intelligence",
      icon: ShoppingBag,
      desc: "Dynamic price elasticity modeling, inventory demand forecasting, and automated customer segmentation.",
      useCases: ["Stockout prevention", "Basket affinity analysis", "Personalized promotional targeting", "Return rate reduction"]
    },
    {
      id: "manufacturing",
      title: "Manufacturing & Supply Chain",
      icon: Factory,
      desc: "IoT sensor telemetry stream analysis for predictive equipment maintenance and global supply chain routing.",
      useCases: ["Predictive equipment maintenance", "Vendor lead-time optimization", "Defect rate anomaly alerts", "Supply chain bottleneck modeling"]
    },
    {
      id: "fraud",
      title: "Fraud & Risk Detection",
      icon: ShieldAlert,
      desc: "Real-time anomaly scoring, graph fraud clustering, and regulatory anti-money laundering (AML) detection.",
      useCases: ["Account takeover prevention", "AML pattern discovery", "Credit default estimation", "Synthetic identity scoring"]
    },
    {
      id: "government",
      title: "Public Sector & Sovereign AI",
      icon: LandPlot,
      desc: "Air-gapped on-premise execution for municipal planning, tax revenue forecasting, and infrastructure budget optimization.",
      useCases: ["Municipal revenue forecasting", "Infrastructure resilience modeling", "Benefit distribution auditing", "Emergency response telemetry"]
    }
  ];

  const currentSolution = solutions.find((s) => s.id === selectedCat) || solutions[0];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <SEOHead
        title={`${currentSolution.title} | Vivexa Industry Solutions`}
        description={currentSolution.desc}
        keywords={[
          currentSolution.title,
          "Enterprise Industry Analytics",
          "AI Financial Modeling",
          "Healthcare Decision Intelligence",
          "Retail Demand Forecasting",
          "Fraud Detection AI"
        ]}
        ogType="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `${currentSolution.title} | Vivexa AI Solutions`,
          "description": currentSolution.desc,
          "publisher": {
            "@type": "Organization",
            "name": "Vivexa AI"
          }
        }}
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Building2 className="h-4 w-4" /> Enterprise Industry Solutions
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Tailored for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">High-Stakes Decisions</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Discover how leading organizations across finance, healthcare, and retail leverage Vivexa's autonomous intelligence.
            </p>
          </div>

          {/* Solutions Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-800 pb-4">
            {solutions.map((s) => {
              const Icon = s.icon;
              const isActive = selectedCat === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSearchParams({ cat: s.id })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {s.title.split(" ")[0]}
                </button>
              );
            })}
          </div>

          {/* Solution Detail */}
          <div className="enterprise-card rounded-3xl p-8 grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-white pt-2">{currentSolution.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{currentSolution.desc}</p>

              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Use Cases:</div>
                {currentSolution.useCases.map((uc, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{uc}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Link to="/book-demo" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors">
                  Request Solution Brief <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/product-tour" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors">
                  Explore Interactive Tour
                </Link>
              </div>
            </div>

            {/* Visual Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs text-slate-300 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-[11px] text-slate-500 font-bold">
                <span>SECTOR: {currentSolution.id.toUpperCase()}</span>
                <span className="text-emerald-400">STATUS: AUDITED</span>
              </div>

              <div className="space-y-3 text-slate-400">
                <div className="text-indigo-400"># Autonomous Pipeline Output</div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white">Target Metric: Variance Reduction</div>
                  <div className="text-emerald-400 font-bold">Optimized for Enterprise Scale</div>
                  <div className="text-[11px] text-slate-400">Confidence Bounds: [95% CI: ±1.2%]</div>
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
