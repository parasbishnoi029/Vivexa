import React, { useState } from "react";
import { motion } from "motion/react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  Database,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Key,
  Globe2,
  Server,
  UserCheck,
  Mail,
  ArrowRight,
  Sparkles
} from "lucide-react";

import { SEOHead } from "@/components/seo/SEOHead";

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState<string>("sec-1");

  const sections = [
    { id: "sec-1", title: "1. Information We Collect" },
    { id: "sec-2", title: "2. Zero Third-Party Model Training" },
    { id: "sec-3", title: "3. How We Use Data" },
    { id: "sec-4", title: "4. Data Isolation & Security" },
    { id: "sec-5", title: "5. Data Retention & Purging" },
    { id: "sec-6", title: "6. GDPR, CCPA & Privacy Rights" },
    { id: "sec-[#7]", title: "7. Cookies & Local Storage" },
    { id: "sec-8", title: "8. Subprocessors & Infrastructure" },
    { id: "sec-9", title: "9. Incident Response & DPO Contact" },
  ];

  const scrollTo = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30">
      <SEOHead
        title="Privacy Policy & Security | Vivexa AI"
        description="Review Vivexa's comprehensive privacy policy and enterprise security architecture. Read about our zero-training SLA, SOC 2 compliance, and zero data retention models."
        keywords={[
          "Vivexa Privacy Policy",
          "Enterprise AI Security",
          "Zero Training SLA",
          "AI Data Privacy"
        ]}
      />
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Hero Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
              <Shield className="h-4 w-4 text-emerald-400" /> Privacy Policy & Trust Center
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Enterprise Data Privacy & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Zero Retention Guarantees</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Vivexa is built from the ground up to protect customer confidentiality. Your datasets, schema metadata, and AI decision outputs are strictly isolated and never sold or used to train foundational AI models.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 font-mono">
              <span>Last Updated: August 12, 2026</span>
              <span>•</span>
              <span>SOC 2 Type II & GDPR Verified</span>
            </div>
          </div>

          {/* Compliance Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center space-y-1">
              <div className="flex justify-center text-emerald-400 pb-1"><Shield className="h-5 w-5" /></div>
              <div className="text-sm font-bold text-white">SOC 2 Type II</div>
              <div className="text-[11px] text-slate-400">Audited Security & Availability</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center space-y-1">
              <div className="flex justify-center text-indigo-400 pb-1"><Lock className="h-5 w-5" /></div>
              <div className="text-sm font-bold text-white">ISO 27001 Certified</div>
              <div className="text-[11px] text-slate-400">Information Security Management</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center space-y-1">
              <div className="flex justify-center text-cyan-400 pb-1"><Globe2 className="h-5 w-5" /></div>
              <div className="text-sm font-bold text-white">GDPR & CCPA Compliant</div>
              <div className="text-[11px] text-slate-400">Full Subject Access & Deletion Rights</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center space-y-1">
              <div className="flex justify-center text-amber-400 pb-1"><Key className="h-5 w-5" /></div>
              <div className="text-sm font-bold text-white">AES-256 / TLS 1.3</div>
              <div className="text-[11px] text-slate-400">End-to-End Encryption Standard</div>
            </div>
          </div>

          {/* Main Layout with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-28 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 border-b border-slate-800/80 mb-2">
                  Privacy Policy Navigation
                </div>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === sec.id
                        ? "bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
                <div className="pt-4 border-t border-slate-800/80 mt-4 px-3 space-y-2">
                  <span className="text-[10px] text-slate-500 block font-mono">Data Protection Officer</span>
                  <a
                    href="mailto:privacy@vivexa.ai"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    <Mail className="h-3.5 w-3.5" /> privacy@vivexa.ai
                  </a>
                </div>
              </div>
            </aside>

            {/* Privacy Policy Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Section 1 */}
              <section id="sec-1" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">01</div>
                  <h2 className="text-xl font-bold text-white">Information We Collect</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Vivexa collects only the data necessary to provide our AI Decision Intelligence Platform services. We classify collected information into three primary categories:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-emerald-400 block">A. Customer Uploaded Datasets & Metadata</span>
                      <p className="text-xs text-slate-400">
                        Raw tabular files (CSV, Parquet, Excel, JSON), schema definitions, SQL queries, column distribution profiles, and notebook execution code uploaded directly by users.
                      </p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-indigo-400 block">B. Account & Identity Metadata</span>
                      <p className="text-xs text-slate-400">
                        User email addresses, full names, corporate domain names, OAuth tokens, role-based access permissions, and single sign-on (SSO) authentication identifiers.
                      </p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-cyan-400 block">C. System Telemetry & Audit Logs</span>
                      <p className="text-xs text-slate-400">
                        Agent execution latencies, API request volumes, error tracebacks, user action audit trails, and browser user-agent strings used for security monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="sec-2" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">02</div>
                  <h2 className="text-xl font-bold text-white">Zero Third-Party Model Training Guarantee</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-4 leading-relaxed font-sans">
                  <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Contractual Non-Training Commitment
                    </div>
                    <p className="text-xs text-emerald-100/90 leading-relaxed">
                      Vivexa explicitly contractually guarantees that your uploaded datasets, SQL scripts, domain context, and proprietary AI outputs are NEVER used to train, retrain, or fine-tune public or third-party foundational AI models (including Google Gemini, OpenAI, or public LLMs).
                    </p>
                  </div>
                  <p>
                    All AI interactions route through zero-data-retention enterprise endpoints where inputs are processed ephemerally solely for generating your real-time response.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="sec-3" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">03</div>
                  <h2 className="text-xl font-bold text-white">How We Use Your Information</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>We process customer information solely for legitimate enterprise operations, including:</p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>Executing automated statistical profiling, outlier detection, and anomaly screening on your datasets.</li>
                    <li>Generating deterministic SQL queries, Python forecasting code, and decision intelligence reports.</li>
                    <li>Maintaining security audit logs and tracking team collaboration activities within workspaces.</li>
                    <li>Delivering platform product updates, security advisories, and system health status alerts.</li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="sec-4" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">04</div>
                  <h2 className="text-xl font-bold text-white">Data Isolation, Encryption & Security Standards</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Every workspace environment is enforced with multi-layered tenant isolation and strict cryptographic protection:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-white block">Encryption at Rest</span>
                      <p className="text-xs text-slate-400">All data stored in Firestore, BigQuery, and Cloud Storage is encrypted using AES-256 keys managed via Google Cloud KMS.</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-white block">Encryption in Transit</span>
                      <p className="text-xs text-slate-400">All browser connections, API endpoints, and microservice RPCs enforce TLS 1.3 with Perfect Forward Secrecy (PFS).</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="sec-5" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">05</div>
                  <h2 className="text-xl font-bold text-white">Data Retention & One-Click Workspace Purging</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Vivexa provides full data lifecycle management tools directly within workspace settings. Workspace Administrators can configure automated data retention rules or trigger immediate dataset purging:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-rose-300 block">Complete Permanent Workspace Wipe</span>
                      <p className="text-xs text-slate-400">Executing a workspace purge immediately overwrites all associated datasets, vector embeddings, and cached report artifacts within 24 hours across primary and backup storage.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="sec-6" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">06</div>
                  <h2 className="text-xl font-bold text-white">GDPR, CCPA & International Privacy Rights</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Under applicable data privacy laws (including EU General Data Protection Regulation and California Consumer Privacy Act), you possess the following enforceable data subject rights:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li><strong className="text-white">Right to Access & Data Portability:</strong> Export all workspace data, reports, and notebooks in standard JSON, CSV, or Parquet formats at any time.</li>
                    <li><strong className="text-white">Right to Erasure ("Right to be Forgotten"):</strong> Request full account and workspace record deletion via the platform or by contacting our Data Protection Officer.</li>
                    <li><strong className="text-white">Right to Rectification:</strong> Modify or update account profile information directly via Settings.</li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="sec-[#7]" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">07</div>
                  <h2 className="text-xl font-bold text-white">Cookies & Local Storage Policy</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Vivexa uses strictly necessary cookies and local storage tokens to maintain authenticated sessions and remember user UI preferences (e.g., dark/light mode toggle).
                  </p>
                  <p className="text-emerald-400 font-bold">
                    We do NOT utilize third-party advertising cookies or cross-site tracking pixels.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="sec-8" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">08</div>
                  <h2 className="text-xl font-bold text-white">Vetted Infrastructure & Subprocessors</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>Vivexa utilizes trusted enterprise cloud infrastructure providers bound by strict Data Processing Agreements (DPAs):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5 border-b border-slate-800">Subprocessor</th>
                          <th className="px-4 py-2.5 border-b border-slate-800">Purpose</th>
                          <th className="px-4 py-2.5 border-b border-slate-800">Data Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr>
                          <td className="px-4 py-2 font-bold text-white">Google Cloud Platform (GCP)</td>
                          <td className="px-4 py-2">Primary Cloud Host, Firestore & Cloud Run Runtimes</td>
                          <td className="px-4 py-2 text-slate-400">United States / European Union (Configurable)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-bold text-white">Google Vertex AI / Gemini API</td>
                          <td className="px-4 py-2">Zero-Data-Retention Intelligence Generation</td>
                          <td className="px-4 py-2 text-slate-400">United States</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 9 */}
              <section id="sec-9" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">09</div>
                  <h2 className="text-xl font-bold text-white">Incident Response & DPO Contact</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    In the event of a verified security incident or unauthorized access to Customer Data, Vivexa will notify affected account administrators within <strong>72 hours</strong> of confirmation in compliance with GDPR regulations.
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Data Protection Officer (DPO)</span>
                      <span className="text-xs text-slate-400 font-mono">privacy@vivexa.ai • Attn: DPO Compliance Unit</span>
                    </div>
                    <Link
                      to="/terms"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      View Terms of Service <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
