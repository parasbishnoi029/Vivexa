import { useSearchParams, Link } from "react-router-dom";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import {
  Building2, HeartPulse, ShoppingBag, Factory, ShieldAlert, LandPlot,
  ArrowRight, CheckCircle2, TrendingUp, DollarSign, Activity, FileSpreadsheet
} from "lucide-react";

export default function SolutionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCat = searchParams.get("cat") || "finance";

  const solutions = [
    {
      id: "finance",
      title: "Financial Decision Intelligence",
      icon: DollarSign,
      roi: "Saved $3.2M in annual cash flow forecasting variance",
      desc: "Automate revenue prediction, expense anomaly detection, and quarterly audit report generation.",
      useCases: ["Liquidity stress testing", "Churn & LTV forecasting", "Automated SOX compliance audits", "Portfolio risk modeling"]
    },
    {
      id: "healthcare",
      title: "Healthcare & Clinical Analytics",
      icon: HeartPulse,
      roi: "Reduced patient readmission risk by 22%",
      desc: "HIPAA-compliant telemetry analytics enabling clinical decision support and hospital bed utilization forecasting.",
      useCases: ["Patient length-of-stay prediction", "Clinical resource allocation", "Medical claim fraud detection", "Drug trial analytics"]
    },
    {
      id: "retail",
      title: "Retail & E-commerce Intelligence",
      icon: ShoppingBag,
      roi: "18% increase in gross profit margins",
      desc: "Dynamic price elasticity modeling, inventory demand forecasting, and automated customer segmentation.",
      useCases: ["Stockout prevention", "Basket affinity analysis", "Personalized promotional targeting", "Return rate reduction"]
    },
    {
      id: "manufacturing",
      title: "Manufacturing & Supply Chain",
      icon: Factory,
      roi: "Prevented 140+ hours of factory downtime",
      desc: "IoT sensor telemetry stream analysis for predictive equipment maintenance and global supply chain routing.",
      useCases: ["Predictive equipment maintenance", "Vendor lead-time optimization", "Defect rate anomaly alerts", "Supply chain bottleneck modeling"]
    },
    {
      id: "fraud",
      title: "Fraud & Risk Detection",
      icon: ShieldAlert,
      roi: "Blocked $12M in fraudulent transaction attempts",
      desc: "Sub-second transaction risk scoring, identity anomaly flagging, and automated regulatory reporting.",
      useCases: ["Real-time transaction scoring", "Synthetic identity detection", "Anti-money laundering (AML) tracking", "Account takeover prevention"]
    },
    {
      id: "government",
      title: "Public Sector & Defense",
      icon: LandPlot,
      roi: "Air-gapped deployment with 100% data sovereignty",
      desc: "FedRAMP and DoD compliant air-gapped AI decision support for agency budget allocations and public safety logistics.",
      useCases: ["Budget transparency reporting", "Disaster response logistics", "Infrastructure maintenance prioritization", "Public health telemetry"]
    }
  ];

  const currentSol = solutions.find((s) => s.id === selectedCat) || solutions[0];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <TrendingUp className="h-4 w-4" /> Tailored Industry Solutions
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Industry Solutions</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Discover how leading companies in your domain use Vivexa to make faster, higher-margin decisions.
            </p>
          </div>

          {/* Industry Grid Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {solutions.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedCat === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSearchParams({ cat: s.id })}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                  <div className="text-xs font-bold leading-tight">{s.title.split(" ")[0]}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Industry Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{currentSol.title}</h2>
                <p className="text-slate-300 text-sm max-w-2xl">{currentSol.desc}</p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-3 shrink-0">
                <Activity className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="text-[10px] uppercase text-emerald-500 font-extrabold">Measured Business Impact</div>
                  <div>{currentSol.roi}</div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Core Operational Use Cases</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentSol.useCases.map((uc, i) => (
                  <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                    <div className="text-xs font-bold text-white">{uc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Link to="/book-demo" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                Request Industry Case Study <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
