import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, ChevronDown, Sparkles, Database, BarChart3, ShieldCheck,
  Terminal, Workflow, Blocks, FileCode, Layers, Shield, Users, Building2,
  FileText, Rocket, Lock, ArrowRight, Search, Menu, X, Check, ExternalLink,
  Code2, HelpCircle, Zap, Globe, Cpu, ChevronRight, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    setSearchOpen(false);
    setSearchQuery("");

    if (query.includes("founder") || query.includes("paras") || query.includes("karunya")) {
      navigate("/founders");
    } else if (query.includes("price") || query.includes("plan")) {
      navigate("/pricing");
    } else if (query.includes("demo") || query.includes("book")) {
      navigate("/book-demo");
    } else if (query.includes("tour") || query.includes("preview")) {
      navigate("/product-tour");
    } else if (query.includes("security") || query.includes("sso") || query.includes("soc2")) {
      navigate("/enterprise");
    } else if (query.includes("doc") || query.includes("api") || query.includes("manual")) {
      navigate("/resources");
    } else if (query.includes("solution") || query.includes("finance") || query.includes("health")) {
      navigate("/solutions");
    } else {
      navigate("/platform");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-2xl shadow-2xl py-3"
            : "bg-transparent py-5 border-b border-white/5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-300">
            {/* PLATFORM MEGA MENU */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("platform")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900/60 transition-all">
                Platform <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeMenu === "platform" ? "rotate-180 text-indigo-400" : ""}`} />
              </button>

              <AnimatePresence>
                {activeMenu === "platform" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full -left-20 w-[680px] pt-2"
                  >
                    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-2xl grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Core AI Engine</div>
                        <Link to="/platform?tab=decision-intelligence" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <Brain className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-indigo-300">Decision Intelligence</div>
                            <div className="text-slate-400 text-[11px]">Automated reasoning & causal inference engine</div>
                          </div>
                        </Link>
                        <Link to="/platform?tab=ai-analyst" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-purple-300">AI Analyst</div>
                            <div className="text-slate-400 text-[11px]">Autonomous data science querying & modeling</div>
                          </div>
                        </Link>
                        <Link to="/platform?tab=forecasting" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <BarChart3 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-cyan-300">Predictive Forecasting</div>
                            <div className="text-slate-400 text-[11px]">Prophet & neural time-series projection models</div>
                          </div>
                        </Link>
                        <Link to="/platform?tab=notebooks" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <Terminal className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-amber-300">Notebook Canvas</div>
                            <div className="text-slate-400 text-[11px]">Interactive Python & SQL analytical execution</div>
                          </div>
                        </Link>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Enterprise Infra</div>
                        <Link to="/platform?tab=data-connectors" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <Database className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-emerald-300">Data Connectors</div>
                            <div className="text-slate-400 text-[11px]">Snowflake, BigQuery, PostgreSQL & SAP</div>
                          </div>
                        </Link>
                        <Link to="/platform?tab=automation" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <Workflow className="h-5 w-5 text-pink-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-pink-300">Automations</div>
                            <div className="text-slate-400 text-[11px]">Event-driven triggers, alerts & PDF digests</div>
                          </div>
                        </Link>
                        <Link to="/enterprise?tab=security" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-all group">
                          <ShieldCheck className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-rose-300">Enterprise Security</div>
                            <div className="text-slate-400 text-[11px]">SOC2, GDPR, SSO, RBAC & End-to-End Encryption</div>
                          </div>
                        </Link>
                        <Link to="/product-tour" className="flex items-start gap-3 p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all group">
                          <Rocket className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-indigo-300 font-bold text-xs">Interactive Product Tour</div>
                            <div className="text-slate-400 text-[11px]">Experience Vivexa live without signing up</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SOLUTIONS MEGA MENU */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("solutions")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900/60 transition-all">
                Solutions <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeMenu === "solutions" ? "rotate-180 text-indigo-400" : ""}`} />
              </button>

              <AnimatePresence>
                {activeMenu === "solutions" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full -left-12 w-[600px] pt-2"
                  >
                    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-2xl grid grid-cols-2 gap-3 text-xs">
                      <Link to="/solutions?cat=finance" className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">Financial Decisioning</div>
                          <div className="text-slate-400 text-[11px]">Revenue prediction & expense optimization</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </Link>
                      <Link to="/solutions?cat=healthcare" className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">Healthcare & Clinical AI</div>
                          <div className="text-slate-400 text-[11px]">HIPAA compliant patient telemetry analytics</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </Link>
                      <Link to="/solutions?cat=retail" className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">Retail & E-commerce</div>
                          <div className="text-slate-400 text-[11px]">Demand forecasting & dynamic pricing</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </Link>
                      <Link to="/solutions?cat=manufacturing" className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">Manufacturing & IoT</div>
                          <div className="text-slate-400 text-[11px]">Predictive maintenance & supply chain</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </Link>
                      <Link to="/solutions?cat=fraud" className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">Fraud & Risk Intelligence</div>
                          <div className="text-slate-400 text-[11px]">Real-time anomaly detection models</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </Link>
                      <Link to="/solutions?cat=government" className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">Government & Public Sector</div>
                          <div className="text-slate-400 text-[11px]">Air-gapped on-premise AI deployments</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ENTERPRISE LINK */}
            <Link to="/enterprise" className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900/60 transition-all">
              Enterprise
            </Link>

            {/* RESOURCES MENU */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("resources")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900/60 transition-all">
                Resources <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeMenu === "resources" ? "rotate-180 text-indigo-400" : ""}`} />
              </button>

              <AnimatePresence>
                {activeMenu === "resources" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full -left-12 w-[340px] pt-2"
                  >
                    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl space-y-1 text-xs">
                      <Link to="/resources?tab=docs" className="p-2.5 rounded-xl hover:bg-slate-800/80 transition-all flex items-center gap-3">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        <div>
                          <div className="text-white font-bold">Documentation & Manual</div>
                          <div className="text-slate-400 text-[11px]">Complete user & API references</div>
                        </div>
                      </Link>
                      <Link to="/resources?tab=developer" className="p-2.5 rounded-xl hover:bg-slate-800/80 transition-all flex items-center gap-3">
                        <Code2 className="h-4 w-4 text-purple-400" />
                        <div>
                          <div className="text-white font-bold">Developer SDK & API</div>
                          <div className="text-slate-400 text-[11px]">Python & REST SDK endpoints</div>
                        </div>
                      </Link>
                      <Link to="/workspace/changelog" className="p-2.5 rounded-xl hover:bg-slate-800/80 transition-all flex items-center gap-3">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        <div>
                          <div className="text-white font-bold">Release Notes & Changelog</div>
                          <div className="text-slate-400 text-[11px]">Latest platform updates & models</div>
                        </div>
                      </Link>
                      <Link to="/resources?tab=faq" className="p-2.5 rounded-xl hover:bg-slate-800/80 transition-all flex items-center gap-3">
                        <HelpCircle className="h-4 w-4 text-amber-400" />
                        <div>
                          <div className="text-white font-bold">FAQ & Community</div>
                          <div className="text-slate-400 text-[11px]">Frequently asked questions</div>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ABOUT */}
            <Link to="/about" className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900/60 transition-all">
              About
            </Link>

            {/* FOUNDERS */}
            <Link to="/founders" className="px-3 py-2 rounded-xl text-indigo-300 font-bold hover:text-white hover:bg-indigo-600/20 transition-all border border-indigo-500/20">
              Founders
            </Link>

            {/* PRICING */}
            <Link to="/pricing" className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900/60 transition-all">
              Pricing
            </Link>
          </nav>

          {/* Action CTAs & Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all border border-transparent hover:border-slate-800"
              title="Search Vivexa (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link to="/login" className="hidden sm:inline-flex text-xs font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors">
              Log in
            </Link>

            <Link to="/book-demo" className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-all">
              Book Demo
            </Link>

            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-20 left-0 w-full z-40 bg-slate-950/98 border-b border-slate-800 p-6 lg:hidden backdrop-blur-2xl max-h-[85vh] overflow-y-auto space-y-4 text-sm font-semibold text-slate-300"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/platform" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">Platform Overview</Link>
              <Link to="/solutions" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">Solutions</Link>
              <Link to="/enterprise" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">Enterprise Security</Link>
              <Link to="/resources" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">Documentation</Link>
              <Link to="/about" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">About Us</Link>
              <Link to="/founders" className="p-3 bg-indigo-950/60 rounded-xl border border-indigo-500/30 text-indigo-300 font-bold">Founders Page</Link>
              <Link to="/pricing" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">Pricing</Link>
              <Link to="/product-tour" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-bold">Product Tour</Link>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2.5 rounded-xl border border-slate-800 text-white">Log in</Link>
              <Link to="/book-demo" className="w-full text-center py-2.5 rounded-xl bg-slate-800 text-white font-bold">Book a Demo</Link>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white font-bold">Start Free Trial</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK SEARCH MODAL */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 shadow-2xl relative"
            >
              <button onClick={() => setSearchOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>

              <form onSubmit={handleSearchSubmit} className="relative mb-3">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search pages (Founders, Pricing, Demo, Security, Docs)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </form>

              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Shortcuts</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button onClick={() => { setSearchOpen(false); navigate('/founders'); }} className="p-2 bg-slate-950 rounded-lg text-left hover:bg-slate-800 text-slate-300">
                  👨‍💻 Meet Founders (Paras & Karunya)
                </button>
                <button onClick={() => { setSearchOpen(false); navigate('/product-tour'); }} className="p-2 bg-slate-950 rounded-lg text-left hover:bg-slate-800 text-slate-300">
                  🚀 Interactive Product Tour
                </button>
                <button onClick={() => { setSearchOpen(false); navigate('/pricing'); }} className="p-2 bg-slate-950 rounded-lg text-left hover:bg-slate-800 text-slate-300">
                  💎 Enterprise Pricing Tiers
                </button>
                <button onClick={() => { setSearchOpen(false); navigate('/book-demo'); }} className="p-2 bg-slate-950 rounded-lg text-left hover:bg-slate-800 text-slate-300">
                  📅 Schedule Executive Demo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
