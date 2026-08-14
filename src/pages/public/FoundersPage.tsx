import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import {
  Github, Linkedin, ExternalLink, Code2, Brain, Sparkles, Rocket,
  Award, BookOpen, Layers, CheckCircle2, ArrowRight, ShieldCheck,
  Cpu, Terminal, Zap, Target, Compass, Briefcase, GraduationCap, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

export default function FoundersPage() {
  const [hoveredFounder, setHoveredFounder] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<Record<string, number>>({
    "Paras": 0,
    "Karunya Sharma": 0
  });

  const founders = [
    {
      name: "Paras",
      role: "Founder & CEO",
      institution: "Applied AI & Data Science @ IIT Jodhpur",
      image: "https://github.com/parasbishnoi029.png",
      about: "Applied AI & Data Science specialist at IIT Jodhpur focused on scalable generative AI architectures, distributed ML data pipelines, and decision intelligence systems. Paras leads executive product strategy, investor relations, and core AI model alignment at Vivexa.",
      skills: ["Executive Strategy", "Applied AI", "PyTorch & Transformers", "Full-Stack Architecture", "MLOps & Cloud"],
      github: "https://github.com/parasbishnoi029",
      linkedin: "https://www.linkedin.com/in/paras029",
      portfolio: "https://parasfolio.qd.je/",
      icon: Code2,
      responsibilities: [
        "Product Direction & Vision Roadmap",
        "Generative AI Causal Inference Design",
        "Enterprise Sales & Investor Relations",
        "Developer Community Leadership"
      ],
      projects: [
        {
          title: "CodeBridge VS Code Extension",
          desc: "A developer productivity extension facilitating real-time context-aware code translation and syntax prediction using locally-optimized transformer models.",
          tags: ["TypeScript", "Transformers", "VS Code API"]
        },
        {
          title: "Neural Network From Scratch",
          desc: "Pure Python & NumPy implementation of multi-layer neural network with backpropagation, custom activation functions, and modular gradient checks.",
          tags: ["Python", "NumPy", "Deep Learning"]
        }
      ]
    },
    {
      name: "Karunya Sharma",
      role: "Co-Founder & CTO",
      institution: "Applied AI & Data Science @ IIT Jodhpur",
      image: "https://github.com/karunyasharma.png",
      about: "Co-Founder & CTO at Vivexa. Passionate about AI research, predictive time-series models, and high-throughput real-time database integrations. Karunya architected Vivexa's high-performance query execution kernel and automated LLM agent pipeline.",
      skills: ["CTO Leadership", "Machine Learning", "Generative AI", "Distributed Systems", "Python & Rust Kernel"],
      github: "https://github.com/karunyasharma",
      linkedin: "https://www.linkedin.com/in/karunyasharma",
      portfolio: "https://karunyasharma.github.io/Karunyafolio/",
      icon: Brain,
      responsibilities: [
        "Core Technical Architecture & Engine",
        "LLM Fine-Testing & Prompt Guardrails",
        "Cluster Performance & Observability",
        "Security, Encryption & Compliance"
      ],
      projects: [
        {
          title: "Karunyafolio Agent Architecture",
          desc: "An intelligent personal agent framework coordinating multiple sub-agents to parse complex markdown files and generate conversational statistics.",
          tags: ["Agentic AI", "NLP", "Python"]
        },
        {
          title: "Time-Series Forecasting Engine",
          desc: "An automated time-series model utilizing Prophet and custom neural regressors to forecast seasonal enterprise metrics with under 5% MAPE error.",
          tags: ["PyTorch", "Prophet", "Time-Series"]
        }
      ]
    }
  ];

  const timeline = [
    { year: "2026 (Q1)", title: "Idea Inception at IIT Jodhpur", desc: "Paras & Karunya identified massive friction in enterprise decision-making: business leaders waited weeks for data teams to run simple SQL queries." },
    { year: "2026 (Q2)", title: "Vivexa Engine Kernel v1.0", desc: "Engineered automated data cleaning, schema inference, and LLM-assisted SQL synthesis, winning top university tech honors." },
    { year: "2026 (Q3)", title: "Enterprise Platform v3.0 Launch", desc: "Expanded into full decision intelligence with automated forecasting, notebooks, Slack alerts, and enterprise security." }
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-24 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold"
            >
              <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>Academic Innovators & Founders</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight leading-tight"
            >
              The Minds Behind <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                Vivexa's Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed"
            >
              Vivexa was founded by pioneering AI researchers and systems developers from **IIT Jodhpur**. We are obsessed with replacing complex business bottlenecks with audited, secure, and blazing-fast autonomous agents.
            </motion.p>
          </div>

          {/* Founders Profiles Cards */}
          <div className="grid md:grid-cols-2 gap-12">
            {founders.map((founder, idx) => {
              const Icon = founder.icon;
              const activeProjIdx = activeProjectTab[founder.name] || 0;
              const currentProject = founder.projects[activeProjIdx];

              return (
                <motion.div
                  key={founder.name}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  onMouseEnter={() => setHoveredFounder(founder.name)}
                  onMouseLeave={() => setHoveredFounder(null)}
                  className={`bg-slate-900/30 border rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                    hoveredFounder === founder.name
                      ? "border-indigo-500/30 shadow-indigo-500/10"
                      : "border-slate-800/80"
                  }`}
                >
                  {/* Decorative background glow */}
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 ${
                    hoveredFounder === founder.name ? "bg-indigo-500/10 opacity-100" : "bg-indigo-500/0 opacity-0"
                  }`} />

                  <div className="space-y-6 relative z-10">
                    
                    {/* Header: Photo and Credentials */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                      <div className="relative shrink-0 group">
                        {/* Interactive gradient border ring around photo */}
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 blur opacity-40 group-hover:opacity-100 transition-opacity" />
                        <div className="relative h-28 w-28 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                          <img
                            src={founder.image}
                            alt={founder.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              // Standard professional avatar fallback if portfolio is temporarily unreachable
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=0D1117&color=818CF8&size=256&bold=true`;
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-100">{founder.name}</h2>
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{founder.role}</div>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 pt-1">
                          <GraduationCap className="h-4 w-4 text-slate-500" />
                          <span>{founder.institution}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-300 leading-relaxed pt-2">
                      {founder.about}
                    </p>

                    {/* Responsibilities Grid */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>Core Directives</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {founder.responsibilities.map((resp, i) => (
                          <div key={i} className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 text-[11px] text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{resp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Portfolio Projects section (Added from portfolios) */}
                    <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Portfolio Highlights</span>
                        <div className="flex gap-1">
                          {founder.projects.map((_, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => setActiveProjectTab(prev => ({ ...prev, [founder.name]: pIdx }))}
                              className={`h-1.5 w-4 rounded-full transition-all ${
                                activeProjIdx === pIdx ? "bg-indigo-500" : "bg-slate-800 hover:bg-slate-700"
                              }`}
                              title={`Project ${pIdx + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeProjIdx}
                          initial={{ opacity: 0, x: 5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-1.5"
                        >
                          <div className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                            <span>{currentProject.title}</span>
                            <ArrowRight className="h-3 w-3 opacity-60" />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {currentProject.desc}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {currentProject.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-indigo-500/10 text-[9px] text-indigo-300 font-mono rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Skill Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {founder.skills.map((sk) => (
                        <span key={sk} className="px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-medium text-slate-400">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Social & Portfolio Links */}
                  <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between gap-3 relative z-10 bg-transparent">
                    <a
                      href={founder.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 px-4 py-2 rounded-xl transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Visit Full Portfolio
                    </a>

                    <div className="flex items-center gap-2">
                      <a
                        href={founder.github}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                        title="GitHub Profile"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                        title="LinkedIn Network"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Academic Inception & Mission details */}
          <div className="bg-slate-900/15 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="max-w-3xl space-y-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Compass className="h-6 w-6 text-indigo-400 animate-pulse" />
                <span>The Research Genesis</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                While researching deep learning mechanisms and relational databases at IIT Jodhpur, we noticed a critical flaw in modern corporate architectures: enterprise operations possess vast data lakes but suffer from long BI queues and slow SQL hand-coding. Vivexa bridges this gap by embedding a fully automated, SOC2-compliant, virtual Senior Data Scientist directly into Slack, email, and corporate workflows.
              </p>
            </div>

            {/* Timeline */}
            <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/60">
              {timeline.map((item, i) => (
                <div key={i} className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-1 hover:border-indigo-500/20 transition-colors">
                  <div className="text-xs font-mono font-bold text-indigo-400">{item.year}</div>
                  <div className="text-sm font-bold text-slate-100">{item.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed pt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-indigo-950/20 via-slate-900 to-purple-950/20 p-10 rounded-3xl border border-indigo-500/20 text-center space-y-6">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Ready to Begin?</span>
            <h3 className="text-3xl font-black text-white max-w-xl mx-auto leading-tight">Automate your enterprise analytics live</h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">Explore Vivexa with a sandboxed playground or schedule a 1-on-1 walkthrough with Paras and Karunya today.</p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/register" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition-transform hover:scale-[1.02]">
                Start Free Trial
              </Link>
              <Link to="/book-demo" className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs transition-all">
                Schedule Demo
              </Link>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
