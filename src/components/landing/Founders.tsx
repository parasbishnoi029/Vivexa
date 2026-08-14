import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Github, Linkedin, ExternalLink, Code2, Brain, CheckCircle2, ArrowRight } from "lucide-react";

const founders = [
  {
    name: "Paras",
    role: "Founder & CEO",
    tagline: "Applied AI & Data Science @ IIT Jodhpur",
    image: "https://github.com/parasbishnoi029.png",
    about: "Applied AI & Data Science specialist at IIT Jodhpur focusing on deep learning architectures, scalable ML data pipelines, and decision intelligence. Paras leads executive product strategy, investor relations, and core AI model alignment.",
    skills: ["Executive Strategy", "Applied AI", "PyTorch", "Full-Stack", "MLOps"],
    github: "https://github.com/parasbishnoi029",
    linkedin: "https://www.linkedin.com/in/paras029",
    portfolio: "https://parasfolio.qd.je/",
    icon: Code2,
    projects: [
      {
        title: "CodeBridge Extension",
        desc: "Developer productivity extension facilitating context-aware code translation and syntax prediction."
      },
      {
        title: "Neural Network Scratch",
        desc: "Pure Python & NumPy implementation of multi-layer neural network with gradient checks."
      }
    ]
  },
  {
    name: "Karunya Sharma",
    role: "Co-Founder & CTO",
    tagline: "Applied AI & Data Science @ IIT Jodhpur",
    image: "https://github.com/karunyasharma.png",
    about: "Co-Founder & CTO at Vivexa. Passionate about AI research, predictive models, and real-time database integrations. Karunya architected Vivexa's high-performance query execution kernel and LLM pipeline.",
    skills: ["CTO Leadership", "Machine Learning", "Generative AI", "Rust Kernel", "Systems"],
    github: "https://github.com/karunyasharma",
    linkedin: "https://www.linkedin.com/in/karunyasharma",
    portfolio: "https://karunyasharma.github.io/Karunyafolio/",
    icon: Brain,
    projects: [
      {
        title: "Agent Architecture",
        desc: "Intelligent agent framework coordinating multiple sub-agents to parse complex schema statistics."
      },
      {
        title: "Forecasting Engine",
        desc: "Automated time-series model utilizing Prophet to forecast enterprise metrics with high confidence."
      }
    ]
  }
];

export function Founders() {
  const [hoveredFounder, setHoveredFounder] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<Record<string, number>>({
    "Paras": 0,
    "Karunya Sharma": 0
  });

  return (
    <section className="relative z-10 py-24 sm:py-32 overflow-hidden bg-slate-950/80 backdrop-blur-3xl" id="founders">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        
        <div className="mx-auto max-w-2xl text-center mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold leading-7 text-indigo-400 uppercase tracking-widest">
              The Visionaries
            </h2>
            <p className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Meet the Founders
            </p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
              Built by Applied AI and Systems engineers from IIT Jodhpur obsessed with eliminating raw data constraints.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {founders.map((founder, index) => {
            const FounderIcon = founder.icon;
            const activeProjIdx = activeProjectTab[founder.name] || 0;
            const currentProject = founder.projects[activeProjIdx];

            return (
              <motion.div
                key={founder.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                onMouseEnter={() => setHoveredFounder(founder.name)}
                onMouseLeave={() => setHoveredFounder(null)}
                className={`group relative rounded-3xl border p-8 sm:p-10 transition-all duration-300 backdrop-blur-xl flex flex-col h-full ${
                  hoveredFounder === founder.name
                    ? "border-indigo-500/30 bg-slate-900/60 shadow-2xl shadow-indigo-500/5"
                    : "border-slate-800/60 bg-slate-900/40"
                }`}
              >
                <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                  
                  {/* Founder photo */}
                  <div className="relative shrink-0 group/img mx-auto sm:mx-0">
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 blur opacity-20 group-hover/img:opacity-100 transition-opacity" />
                    <div className="h-28 w-28 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={founder.image}
                        alt={founder.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=0D1117&color=818CF8&size=256&font-size=0.33&bold=true`;
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-lg group-hover:scale-110 transition-transform">
                      <FounderIcon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 className="text-2xl font-black text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {founder.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-1 text-xs">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider">{founder.role}</span>
                      <span className="text-slate-700 hidden sm:inline">•</span>
                      <span className="text-slate-400">{founder.tagline}</span>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {founder.about}
                    </p>
                  </div>
                </div>

                {/* Interactive Projects tab from their portfolio */}
                <div className="relative z-10 bg-slate-950/60 rounded-2xl border border-slate-900 p-4 mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Portfolio Highlights</span>
                    <div className="flex gap-1">
                      {founder.projects.map((_, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => setActiveProjectTab(prev => ({ ...prev, [founder.name]: pIdx }))}
                          className={`h-1 w-3 rounded-full transition-all ${
                            activeProjIdx === pIdx ? "bg-indigo-500" : "bg-slate-800 hover:bg-slate-700"
                          }`}
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
                      className="space-y-1"
                    >
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                        <span>{currentProject.title}</span>
                        <ArrowRight className="h-3 w-3 opacity-60" />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {currentProject.desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/60 flex-1 flex flex-col justify-end">
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {founder.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-lg bg-slate-800/20 px-2.5 py-1 text-[10px] font-medium text-slate-400 border border-slate-800/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <a
                      href={founder.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 px-4 py-2 text-xs font-bold text-white transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Full Portfolio
                    </a>
                    <div className="flex items-center gap-2">
                      <a
                        href={founder.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 transition-all hover:text-white"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 transition-all hover:text-white"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
