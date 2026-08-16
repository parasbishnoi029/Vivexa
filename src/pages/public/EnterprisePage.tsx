import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Lock, Key, FileCheck, Server, Cpu, CheckCircle2,
  ArrowRight, Users, Check, X, ShieldAlert, Terminal, RefreshCw,
  Search, Shield, Fingerprint, Eye, Database, HelpCircle, Download,
  Workflow, AlertCircle, Building2, Globe, Sparkles, Activity,
  Cloud, Code2
} from "lucide-react";

type RoleType = "SuperAdmin" | "DataAnalyst" | "ComplianceAuditor" | "ExecutiveViewer";

export default function EnterprisePage() {
  // SSO Simulator States
  const [ssoDomain, setSsoDomain] = useState("");
  const [ssoStatus, setSsoStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [ssoDetails, setSsoDetails] = useState<any>(null);

  // RBAC Simulator States
  const [selectedRole, setSelectedRole] = useState<RoleType>("DataAnalyst");

  // Simulation parameters for SSO
  const triggerSsoSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssoDomain.trim()) return;

    setSsoStatus("verifying");
    setSsoDetails(null);

    setTimeout(() => {
      const domain = ssoDomain.toLowerCase().trim();
      const isKnownGovOrBigTech = ["google.com", "microsoft.com", "amazon.com", "apple.com", "gov.in", "iitj.ac.in"].some(d => domain.endsWith(d));
      
      if (domain.includes(".") && domain.length > 4) {
        setSsoStatus("success");
        setSsoDetails({
          provider: isKnownGovOrBigTech ? "Microsoft Entra ID" : "Okta Enterprise Cloud",
          protocol: "SAML 2.0 (SHA-256)",
          endpoint: `https://sso.${domain}/v2/saml/sso`,
          tenantId: `tnt_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          encryption: "AES-GCM-256 Enabled",
          lastSync: "Just now"
        });
      } else {
        setSsoStatus("error");
      }
    }, 1200);
  };

  // RBAC permissions matrix mapping
  const rbacMatrix: Record<RoleType, {
    title: string;
    desc: string;
    permissions: { name: string; category: string; allowed: boolean }[];
  }> = {
    SuperAdmin: {
      title: "Super Administrator",
      desc: "Full administrative read, write, execution, billing, and system configuration authority.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: true },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: true },
        { name: "Provision & Setup Identity SSO", category: "System Control", allowed: true },
        { name: "Review Full SOC2 Audit Logs", category: "Compliance Monitoring", allowed: true },
      ]
    },
    DataAnalyst: {
      title: "Senior Data Scientist",
      desc: "Execute complex predictions, SQL queries, and build models on authorized data streams.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: true },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: true },
        { name: "Provision & Setup Identity SSO", category: "System Control", allowed: false },
        { name: "Review Full SOC2 Audit Logs", category: "Compliance Monitoring", allowed: false },
      ]
    },
    ComplianceAuditor: {
      title: "SOC2 Compliance Auditor",
      desc: "Read-only access to all tracking metrics, logs, access telemetry, and compliance controls.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: false },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: false },
        { name: "Provision & Setup Identity SSO", category: "System Control", allowed: false },
        { name: "Review Full SOC2 Audit Logs", category: "Compliance Monitoring", allowed: true },
      ]
    },
    ExecutiveViewer: {
      title: "Executive Decision-Maker",
      desc: "High-level aggregate reporting charts, prediction logs, and dashboard summaries.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: false },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: false },
        { name: "Provision & Setup Identity SSO", category: "System Control", allowed: false },
        { name: "Review Full SOC2 Audit Logs", category: "Compliance Monitoring", allowed: false },
      ]
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-rose-500/20">
      <SEOHead
        title="Enterprise Security & Architecture | Vivexa AI"
        description="Zero-Copy architecture, Glass-Box AI, VPC Deployments, and SAML SSO. Built for Fortune 500 security and compliance standards."
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-24 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-32">
          
          {/* HERO SECTION */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold"
            >
              <ShieldCheck className="h-4 w-4 text-rose-400" />
              <span>Built for the Fortune 500 Chief Data Officer</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-none"
            >
              Enterprise AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-indigo-400 to-cyan-400">
                Without the Compromise
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-slate-400 text-sm md:text-lg leading-relaxed max-w-3xl mx-auto"
            >
              Don't rip and replace your Databricks or Snowflake clusters. Don't trust black-box LLMs with your financials. 
              Vivexa is a zero-copy, glass-box intelligence layer deployed directly into your VPC.
            </motion.p>
          </div>

          {/* PILLAR 1: ZERO-COPY ARCHITECTURE */}
          <section className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Pillar 1: Data Sovereignty</span>
                <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">The Zero-Copy <br/>Intelligence Layer</h2>
                <p className="text-sm text-slate-400 leading-relaxed pt-2">
                  We don't want your data. We just want to make it smarter. Vivexa uses a **Federated Push-Down Architecture**. 
                  When our AI generates a SQL query, we push the compute down to your existing Snowflake or Databricks warehouse. 
                  Your raw PII data never leaves your infrastructure.
                </p>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-cyan-500/20 p-1 rounded"><Check className="h-4 w-4 text-cyan-400" /></div>
                  <div><strong className="text-white block">No Vendor Lock-in</strong> You keep your storage layer. We act exclusively as the AI compute plane.</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-cyan-500/20 p-1 rounded"><Check className="h-4 w-4 text-cyan-400" /></div>
                  <div><strong className="text-white block">15-Minute Deployment</strong> Because we don't ingest your petabytes of data, integration is instant.</div>
                </li>
              </ul>
            </div>
            
            {/* Architectural Diagram Mockup */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
              <div className="relative z-10 flex flex-col items-center gap-6">
                
                {/* Client Side */}
                <div className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg"><Database className="h-6 w-6 text-blue-400" /></div>
                    <div>
                      <div className="text-xs font-bold text-white">Your Snowflake / Databricks</div>
                      <div className="text-[10px] text-slate-400 font-mono">Petabyte Scale Storage</div>
                    </div>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>

                {/* Push-Down Arrow */}
                <div className="flex flex-col items-center text-cyan-400">
                  <div className="text-[10px] font-bold font-mono tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 mb-2">Push-Down Compute</div>
                  <div className="h-8 border-l-2 border-dashed border-cyan-500/50" />
                  <ArrowRight className="h-5 w-5 rotate-90 mt-1" />
                </div>

                {/* Vivexa Side */}
                <div className="w-full flex items-center justify-between bg-indigo-950 border border-indigo-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg"><Cpu className="h-6 w-6 text-indigo-400" /></div>
                    <div>
                      <div className="text-xs font-bold text-white">Vivexa AI Engine</div>
                      <div className="text-[10px] text-indigo-300 font-mono">Stateless Intelligence</div>
                    </div>
                  </div>
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>

              </div>
            </div>
          </section>

          {/* PILLAR 2: GLASS-BOX AI */}
          <section className="grid lg:grid-cols-2 gap-16 items-center">
             <div className="order-last lg:order-first relative bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px]" />
              
              <div className="relative z-10 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Recommendation</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> 99.4% Confidence
                    </span>
                  </div>
                  <p className="text-sm text-white">"Based on Q3 cohort trends, increasing marketing spend by 12% in EMEA will yield a 4.2x ROAS."</p>
                </div>

                {/* Glass-Box Verification Toggle */}
                <div className="border border-indigo-500/30 bg-indigo-950/20 rounded-xl overflow-hidden">
                  <div className="bg-indigo-900/40 px-4 py-2 border-b border-indigo-500/20 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-400" />
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Audit AI Reasoning</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Generated SQL Executed:</span>
                      <div className="bg-black/50 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 leading-relaxed">
                        <span className="text-rose-400">SELECT</span> region, <span className="text-blue-400">SUM</span>(marketing_spend), <span className="text-blue-400">SUM</span>(revenue) <br/>
                        <span className="text-rose-400">FROM</span> core_db.sales_metrics <br/>
                        <span className="text-rose-400">WHERE</span> quarter = <span className="text-emerald-400">'Q3'</span> <br/>
                        <span className="text-rose-400">GROUP BY</span> region;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">Pillar 2: Zero Hallucinations</span>
                <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">The Glass-Box <br/>Analytics Engine</h2>
                <p className="text-sm text-slate-400 leading-relaxed pt-2">
                  Trust in enterprise AI isn't about the model; it's about the audit trail. Vivexa enforces a strict Zero-Hallucination UI pattern. If the CFO wants to check the math, the exact SQL and Python used to generate the answer is always one click away.
                </p>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-rose-500/20 p-1 rounded"><Code2 className="h-4 w-4 text-rose-400" /></div>
                  <div><strong className="text-white block">Transparent Reasoning</strong> Every chart and forecast includes the underlying mathematical proof. No black boxes.</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-rose-500/20 p-1 rounded"><Activity className="h-4 w-4 text-rose-400" /></div>
                  <div><strong className="text-white block">Strict Confidence Scores</strong> Our multi-agent system grades its own work. If confidence is low, it refuses to answer.</div>
                </li>
              </ul>
            </div>
          </section>

          {/* PILLAR 3: VPC & ON-PREM */}
          <section className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Pillar 3: Absolute Security</span>
                <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">Stateless Edge <br/>VPC Deployment</h2>
                <p className="text-sm text-slate-400 leading-relaxed pt-2">
                  Turn our startup agility into your security advantage. Because of our push-down architecture, Vivexa’s edge nodes are fully stateless. We can deploy a dedicated, isolated instance directly inside your AWS, Azure, or GCP environment.
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex-1 text-center">
                  <Cloud className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-white">Private Cloud VPC</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex-1 text-center">
                  <Server className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-white">Air-Gapped On-Prem</div>
                </div>
              </div>
            </div>

            {/* Architecture VPC Diagram */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
               <div className="absolute inset-0 border-[4px] border-dashed border-indigo-500/20 m-4 rounded-2xl pointer-events-none" />
               <span className="absolute top-6 left-8 text-[10px] font-bold font-mono text-indigo-400 bg-slate-950 px-2">Customer AWS/Azure VPC Boundary</span>
               
               <div className="relative z-10 flex items-center justify-center h-48 mt-4">
                 <div className="bg-indigo-600/20 border border-indigo-500/30 p-6 rounded-2xl flex flex-col items-center text-center">
                   <Lock className="h-8 w-8 text-indigo-400 mb-2" />
                   <h4 className="text-sm font-bold text-white">Vivexa Dedicated Node</h4>
                   <p className="text-[10px] text-slate-400 font-mono mt-1">SOC 2 Type II Audited Container</p>
                 </div>
               </div>
            </div>
          </section>

          {/* PILLAR 4: SSO & RBAC (Interactive sandbox) */}
          <section className="space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Pillar 4: Identity & Compliance</span>
              <h2 className="text-3xl lg:text-4xl font-black text-white">Bring-Your-Own-Identity</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                We don't manage your passwords; you do. Seamlessly integrate your existing Okta or Microsoft Entra ID with our Granular RBAC matrix to ensure the right people see the right data.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Interactive SSO Sandbox Panel */}
              <div className="lg:col-span-6 bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px]" />
                
                <div className="space-y-2">
                  <div className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Fingerprint className="h-4 w-4" />
                    <span>SAML 2.0 / OIDC Identity Sandbox</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Test Your SSO Federation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Input your corporate email domain to simulate identity authentication handshakes securely.
                  </p>
                </div>

                <form onSubmit={triggerSsoSimulation} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., acme.com or iitj.ac.in"
                    value={ssoDomain}
                    onChange={(e) => setSsoDomain(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={ssoStatus === "verifying"}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    {ssoStatus === "verifying" ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <span>Test SSO</span>
                    )}
                  </button>
                </form>

                <div className="min-h-[140px] border border-slate-900 bg-slate-900/20 rounded-2xl p-4 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {ssoStatus === "idle" && (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-2">
                        <Terminal className="h-8 w-8 text-slate-700 mx-auto" />
                        <div className="text-[11px] text-slate-500 font-mono">Terminal Awaiting Domain Handshake Request...</div>
                      </motion.div>
                    )}
                    {ssoStatus === "verifying" && (
                      <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-2 font-mono">
                        <RefreshCw className="h-8 w-8 text-emerald-400 mx-auto animate-spin" />
                        <div className="text-[11px] text-emerald-300">Resolving DNS Security SRV records...</div>
                      </motion.div>
                    )}
                    {ssoStatus === "success" && ssoDetails && (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-slate-900 pb-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>SSO Connection Established</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-400">
                          <div><span className="text-slate-500 font-bold">PROVIDER:</span> {ssoDetails.provider}</div>
                          <div><span className="text-slate-500 font-bold">PROTOCOL:</span> {ssoDetails.protocol}</div>
                          <div className="col-span-2"><span className="text-slate-500 font-bold">ENCRYPTION:</span> {ssoDetails.encryption}</div>
                        </div>
                      </motion.div>
                    )}
                    {ssoStatus === "error" && (
                      <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-2 text-rose-400">
                        <ShieldAlert className="h-8 w-8 mx-auto" />
                        <div className="text-[10px] text-slate-500 max-w-sm mx-auto font-mono">No active SAML records found for "{ssoDomain}".</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RBAC Visual Matrix Card */}
              <div className="lg:col-span-6 bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="space-y-4">
                  <div className="border-b border-slate-900 pb-4">
                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Dynamic Role-Based Access Control</div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {(Object.keys(rbacMatrix) as RoleType[]).map(roleKey => (
                        <button
                          key={roleKey}
                          onClick={() => setSelectedRole(roleKey)}
                          className={`px-3 py-2 text-left rounded-xl border transition-all ${
                            selectedRole === roleKey
                              ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200"
                              : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                          }`}
                        >
                          <div className="text-xs font-bold">{rbacMatrix[roleKey].title}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-900/60 pt-2">
                    {rbacMatrix[selectedRole].permissions.map((p, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded mr-2">
                            {p.category}
                          </span>
                          <span className="text-slate-300 font-medium">{p.name}</span>
                        </div>
                        {p.allowed ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0">ALLOWED</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold shrink-0">DENIED</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT SECURITY TEAM CTA */}
          <div className="bg-gradient-to-r from-rose-950/20 via-slate-900 to-indigo-950/20 border border-rose-500/20 rounded-3xl p-10 text-center space-y-6" id="demo-section">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block font-mono">Executive Clearance Request</span>
            <h3 className="text-3xl font-black text-white max-w-xl mx-auto leading-tight">Request Audited Security Documents</h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
              We provide access to our complete SOC 2 Type II compliance audits, raw penetration testing documentation, and network vulnerability logs upon NDA validation.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/book-demo" className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition-transform hover:scale-[1.02]">
                Request Security Packet
              </Link>
              <Link to="/pricing" className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs transition-all">
                Compare Pricing Plans
              </Link>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
