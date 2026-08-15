import { useState } from "react";
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
  Workflow, AlertCircle, Building2, Globe, Sparkles
} from "lucide-react";

type RoleType = "SuperAdmin" | "DataAnalyst" | "ComplianceAuditor" | "ExecutiveViewer";

export default function EnterprisePage() {
  // SSO Simulator States
  const [ssoDomain, setSsoDomain] = useState("");
  const [ssoStatus, setSsoStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [ssoDetails, setSsoDetails] = useState<any>(null);

  // RBAC Simulator States
  const [selectedRole, setSelectedRole] = useState<RoleType>("DataAnalyst");

  // Selected Compliance Tab
  const [complianceTab, setComplianceTab] = useState<"soc2" | "gdpr" | "iso">("soc2");

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
        { name: "Provision & Setup Identity SSO Providers", category: "System Control", allowed: true },
        { name: "Rotate AES-256 KMS Encryption Keys", category: "Security Control", allowed: true },
        { name: "Review Full SOC2 Audit System Logs", category: "Compliance Monitoring", allowed: true },
        { name: "Execute Permanent Account Teardown", category: "Critical Operations", allowed: true },
      ]
    },
    DataAnalyst: {
      title: "Senior Data Scientist / Analyst",
      desc: "Execute complex predictions, SQL queries, and build models on authorized data streams.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: true },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: true },
        { name: "Provision & Setup Identity SSO Providers", category: "System Control", allowed: false },
        { name: "Rotate AES-256 KMS Encryption Keys", category: "Security Control", allowed: false },
        { name: "Review Full SOC2 Audit System Logs", category: "Compliance Monitoring", allowed: false },
        { name: "Execute Permanent Account Teardown", category: "Critical Operations", allowed: false },
      ]
    },
    ComplianceAuditor: {
      title: "ISO/SOC2 Compliance Auditor",
      desc: "Read-only access to all tracking metrics, logs, access telemetry, and compliance controls.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: false },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: false },
        { name: "Provision & Setup Identity SSO Providers", category: "System Control", allowed: false },
        { name: "Rotate AES-256 KMS Encryption Keys", category: "Security Control", allowed: false },
        { name: "Review Full SOC2 Audit System Logs", category: "Compliance Monitoring", allowed: true },
        { name: "Execute Permanent Account Teardown", category: "Critical Operations", allowed: false },
      ]
    },
    ExecutiveViewer: {
      title: "Executive Decision-Maker",
      desc: "High-level aggregate reporting charts, prediction logs, and dashboard summaries.",
      permissions: [
        { name: "Execute Custom SQL Queries", category: "Data Operations", allowed: false },
        { name: "Export Confidential Datasets", category: "Data Operations", allowed: false },
        { name: "Provision & Setup Identity SSO Providers", category: "System Control", allowed: false },
        { name: "Rotate AES-256 KMS Encryption Keys", category: "Security Control", allowed: false },
        { name: "Review Full SOC2 Audit System Logs", category: "Compliance Monitoring", allowed: false },
        { name: "Execute Permanent Account Teardown", category: "Critical Operations", allowed: false },
      ]
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-rose-500/20">
      <SEOHead
        title="Enterprise Security, Compliance & SSO | Vivexa AI"
        description="Bank-grade zero-trust architecture. SOC 2 Type II, GDPR, HIPAA BAA compliance, SAML 2.0 / OIDC Single Sign-On (SSO), RBAC access controls, and BYOK encryption."
        keywords={[
          "Enterprise AI Security",
          "SOC 2 Type II AI Platform",
          "GDPR Compliant Analytics",
          "SAML 2.0 SSO Enterprise",
          "RBAC Access Control",
          "Air-Gapped Data Science",
          "BYOK Encryption"
        ]}
        ogType="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Enterprise Security, Compliance & SSO | Vivexa AI",
          "description": "Bank-grade zero-trust architecture. SOC 2 Type II, GDPR, HIPAA BAA compliance.",
          "publisher": {
            "@type": "Organization",
            "name": "Vivexa AI"
          }
        }}
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-24 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold"
            >
              <ShieldCheck className="h-4 w-4 text-rose-400" />
              <span>Zero-Trust Enterprise Compliance Architecture</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-4xl sm:text-6xl font-black tracking-tight leading-none"
            >
              Enterprise Security <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-indigo-400 to-cyan-400">
                Audited & Bulletproof
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed"
            >
              Designed for regulated enterprise networks requiring complete data sovereignty, customized single sign-on federation, granular access controls, and real-time security logs.
            </motion.p>
          </div>

          {/* SECTION 1: SOC2 & GDPR COMPLIANCE HUB (UPGRADED) */}
          <section className="grid lg:grid-cols-12 gap-12 items-start" id="compliance">
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">Continuous Compliance</span>
                <h2 className="text-3xl font-black text-white">SOC2 & GDPR Auditing</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Vivexa enforces comprehensive bank-grade policies, continuous infrastructure threat analysis, and programmatic data subject request deletion tools to satisfy stringent legal rules.
                </p>
              </div>

              {/* Interactive Tabs inside Compliance */}
              <div className="flex gap-2 p-1 bg-slate-950 border border-slate-900 rounded-xl">
                {(["soc2", "gdpr", "iso"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setComplianceTab(tab)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      complianceTab === tab
                        ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab === "soc2" ? "SOC 2 Type II" : tab === "gdpr" ? "GDPR & CCPA" : "ISO 27001"}
                  </button>
                ))}
              </div>

              {/* Compliance tab detailed cards */}
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-md">
                {complianceTab === "soc2" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs font-mono">
                      <Lock className="h-4 w-4" /> Real-Time SOC 2 Policy Controls
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Every operation, notebook query, and API call is cryptographically signed, timestamped, and streamed to your corporate security monitoring pipeline (SIEM) with zero possibility of log tamper.
                    </p>
                    <ul className="space-y-2 text-[11px] text-slate-300">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-rose-400" /> Complete multi-region data isolations</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-rose-400" /> Quarterly external penetration testing</li>
                    </ul>
                  </div>
                )}

                {complianceTab === "gdpr" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-mono">
                      <Globe className="h-4 w-4" /> GDPR / CCPA Right to Erasure
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      We automate GDPR Article 17 compliancy. With our structured schema mappings, users can request complete data extraction or permanent erasure, resolving across all index tables in under 120 seconds.
                    </p>
                    <ul className="space-y-2 text-[11px] text-slate-300">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Programmatic Data Subject Access Requests</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 100% data sovereignty hosted inside EU boundaries</li>
                    </ul>
                  </div>
                )}

                {complianceTab === "iso" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-300 font-bold text-xs font-mono">
                      <CheckCircle2 className="h-4 w-4" /> ISO/IEC 27001 Certified Pipelines
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Built upon ISO 27001 information security guidelines. Physical access is restricted, staff undergo background screens, and data backup routines are tested continuously.
                    </p>
                    <ul className="space-y-2 text-[11px] text-slate-300">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-400" /> AES-256 static database layer protection</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-400" /> Continuous asset inventory & audit logs</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Right Side Panel: Live Threat Audit Visual Console */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">SIEM Compliance Logging Terminal</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">Audit State: Healthy</span>
                </div>

                <div className="space-y-3 font-mono text-[10px] text-slate-400 leading-relaxed">
                  <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                    <span className="text-rose-500 font-bold shrink-0">[SOC2_ALERT]</span>
                    <div>
                      <span className="text-slate-300">SYSTEM STATE:</span> Successfully verified zero telemetry policies in air-gapped VPC deployment cluster.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                    <span className="text-emerald-500 font-bold shrink-0">[GDPR_LOGS]</span>
                    <div>
                      <span className="text-slate-300">USER_DSR_COMPLIANCE:</span> Successfully localized client data streams inside selected EU AWS region (Frankfurt).
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                    <span className="text-blue-500 font-bold shrink-0">[KEY_ROTATION]</span>
                    <div>
                      <span className="text-slate-300">KMS_ENCRYPTION:</span> Dynamic envelope keys rotated safely under customer-managed HSM key pair.
                    </div>
                  </div>
                </div>

                {/* Simulated Audit Report Score */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl text-center border border-slate-900">
                    <div className="text-lg font-black text-emerald-400">100%</div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">GDPR SLA Met</div>
                  </div>
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl text-center border border-slate-900">
                    <div className="text-lg font-black text-rose-400">Zero</div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Policy Breaches</div>
                  </div>
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl text-center border border-slate-900">
                    <div className="text-lg font-black text-indigo-400">256-bit</div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Static Crypto</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-slate-500" />
                    <span>Download SOC 2 Type II summary instantly.</span>
                  </span>
                  <a href="#demo-section" className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase tracking-widest hover:text-rose-300">
                    <span>Download Audit Report</span>
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: SINGLE SIGN-ON (SSO) INTERACTIVE SANDBOX */}
          <section className="grid lg:grid-cols-12 gap-12 items-center" id="sso">
            {/* Interactive SSO Sandbox Panel */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden order-last lg:order-first">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px]" />
              
              <div className="space-y-2">
                <div className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Fingerprint className="h-4 w-4" />
                  <span>SAML 2.0 / OIDC Identity Sandbox</span>
                </div>
                <h3 className="text-lg font-black text-white">Test Your SSO Federation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Input your corporate email domain to simulate identity authentication handshakes and security payload validation live.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={triggerSsoSimulation} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., acme.com or iitj.ac.in"
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={ssoStatus === "verifying"}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all"
                >
                  {ssoStatus === "verifying" ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <span>Test Handshake</span>
                  )}
                </button>
              </form>

              {/* Interactive Sandbox Result Area */}
              <div className="min-h-[140px] border border-slate-900 bg-slate-900/20 rounded-2xl p-4 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {ssoStatus === "idle" && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-2"
                    >
                      <Terminal className="h-8 w-8 text-slate-700 mx-auto" />
                      <div className="text-[11px] text-slate-500 font-mono">Terminal Awaiting Domain Handshake Request...</div>
                    </motion.div>
                  )}

                  {ssoStatus === "verifying" && (
                    <motion.div
                      key="verifying"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-2 font-mono"
                    >
                      <RefreshCw className="h-8 w-8 text-indigo-400 mx-auto animate-spin" />
                      <div className="text-[11px] text-indigo-300">Resolving DNS Security SRV records for {ssoDomain}...</div>
                    </motion.div>
                  )}

                  {ssoStatus === "success" && ssoDetails && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 font-mono text-[10px]"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-slate-900 pb-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>SSO Identity Connection Established Successfully!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-400">
                        <div><span className="text-slate-500 font-bold">IDENTITY PROV:</span> {ssoDetails.provider}</div>
                        <div><span className="text-slate-500 font-bold">PROTOCOL:</span> {ssoDetails.protocol}</div>
                        <div><span className="text-slate-500 font-bold">CLIENT TENANT:</span> {ssoDetails.tenantId}</div>
                        <div><span className="text-slate-500 font-bold">ENCRYPTION:</span> {ssoDetails.encryption}</div>
                        <div className="col-span-2 truncate"><span className="text-slate-500 font-bold">ASSERT ENDPOINT:</span> {ssoDetails.endpoint}</div>
                      </div>
                    </motion.div>
                  )}

                  {ssoStatus === "error" && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-2 text-rose-400"
                    >
                      <ShieldAlert className="h-8 w-8 mx-auto" />
                      <div className="text-xs font-bold font-mono">Verification Failure</div>
                      <div className="text-[10px] text-slate-500 max-w-sm mx-auto font-mono">
                        No active SAML 2.0 Identity Provider DNS records resolved for "{ssoDomain}". Enter a valid corporate URL to test federation.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Federated Identity</span>
                <h2 className="text-3xl font-black text-white">Seamless Identity (SSO)</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Delegate login permissions securely to your existing directory management providers. We support frictionless SAML 2.0 and OIDC configurations with auto-provisioning rules.
                </p>
              </div>

              {/* Supported IdP Logo Badges */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Okta Enterprise", active: true },
                  { name: "Microsoft Entra ID", active: true },
                  { name: "Google Workspace", active: true },
                  { name: "Ping Identity", active: true }
                ].map((idp, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/30 border border-slate-800/80 rounded-xl">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-300">{idp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: ROLE-BASED ACCESS CONTROL (RBAC) POLICY BUILDER */}
          <section className="grid lg:grid-cols-12 gap-12 items-start" id="rbac">
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Authorization Guardrails</span>
                <h2 className="text-3xl font-black text-white">Granular Role RBAC</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Enforce principal access security controls. Setup custom roles, map precise permissions, and configure automatic workspace routing schemas based on LDAP/SSO group membership.
                </p>
              </div>

              {/* Selection Tabs for RBAC */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Select Workspace Persona</span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(rbacMatrix) as RoleType[]).map(roleKey => (
                    <button
                      key={roleKey}
                      onClick={() => setSelectedRole(roleKey)}
                      className={`px-4 py-3 text-left rounded-xl border transition-all ${
                        selectedRole === roleKey
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200"
                          : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-xs font-bold">{rbacMatrix[roleKey].title}</div>
                      <div className="text-[9px] text-slate-500 font-mono truncate">{roleKey}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RBAC Visual Matrix Card */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500" />
              
              <div className="space-y-4">
                <div className="border-b border-slate-900 pb-4">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Active RBAC Security Matrix</div>
                  <h4 className="text-md font-bold text-white pt-1">{rbacMatrix[selectedRole].title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1 font-sans">{rbacMatrix[selectedRole].desc}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Granted Security Privileges</span>
                  
                  <div className="divide-y divide-slate-900/60">
                    {rbacMatrix[selectedRole].permissions.map((p, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded mr-2">
                            {p.category}
                          </span>
                          <span className="text-slate-300 font-medium">{p.name}</span>
                        </div>

                        {p.allowed ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check className="h-3 w-3" /> ALLOWED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <X className="h-3 w-3" /> DENIED
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: DEPLOYMENT MODELS */}
          <div className="bg-slate-900/15 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">Global Ingress Routing</span>
              <h2 className="text-2xl font-black text-white flex items-center gap-2 pt-1">
                <Server className="h-6 w-6 text-rose-400 animate-pulse" />
                <span>Flexible Deployment Topology</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1 max-w-3xl">
                Run Vivexa natively where your databases live. We support air-gapped on-premise clusters or localized VPC instances.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Secure Multi-Tenant Cloud",
                  desc: "Completely isolated logical containers hosted inside our hardened AWS/GCP nodes with SOC2 audited firewalls.",
                  details: "AWS KMS • Logical Isolation • Zero Shared Storage"
                },
                {
                  name: "Private Single-Tenant VPC",
                  desc: "Deploy directly into your private virtual clouds (AWS VPC, GCP Cloud, or Azure VPC) for total system isolation.",
                  details: "Terraform Modules • VPN Ingress • Direct Peering"
                },
                {
                  name: "Air-Gapped On-Premise",
                  desc: "Run self-hosted Kubernetes clusters completely offline with localized model nodes and zero external network pings.",
                  details: "K8s Helm Charts • Local Inference • Strict Data Lockdown"
                }
              ].map((d, i) => (
                <div key={i} className="p-6 bg-slate-950 rounded-2xl border border-slate-900 hover:border-rose-500/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-white">{d.name}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{d.desc}</div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 font-bold border-t border-slate-900 pt-3">
                    {d.details}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
