import React, { useState } from "react";
import { motion } from "motion/react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Lock,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Building2,
  HelpCircle,
  ArrowRight,
  Download,
  Mail,
  Layers,
  Cpu
} from "lucide-react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>("sec-1");

  const sections = [
    { id: "sec-1", title: "1. Acceptance & Authorization" },
    { id: "sec-2", title: "2. Customer Data & IP Rights" },
    { id: "sec-3", title: "3. Acceptable Use Policy" },
    { id: "sec-4", title: "4. AI Models & Confidence Bounds" },
    { id: "sec-5", title: "5. Service Level Agreement (SLA)" },
    { id: "sec-6", title: "6. Billing & Subscription Terms" },
    { id: "sec-7", title: "7. Limitation of Liability" },
    { id: "sec-8", title: "8. Dispute Resolution & Governing Law" },
    { id: "sec-9", title: "9. Modifications & Termination" },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30">
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Hero Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Scale className="h-4 w-4 text-indigo-400" /> Terms of Service
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Vivexa Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Master Services Agreement</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              These Terms of Service govern your access to and use of Vivexa's AI Analytics Operating System, decision intelligence APIs, and multi-agent workflows.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 font-mono">
              <span>Effective Date: August 12, 2026</span>
              <span>•</span>
              <span>Version: 3.2.0-Enterprise</span>
            </div>
          </div>

          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <ShieldCheck className="h-4 w-4" /> 100% Data Ownership
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You retain complete, unencumbered ownership of all datasets, queries, models, and decision reports generated on Vivexa.
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Lock className="h-4 w-4" /> Zero Third-Party Model Training
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your proprietary data is strictly isolated within your workspace and is never utilized to train external or public AI models.
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Cpu className="h-4 w-4" /> 99.99% Enterprise SLA
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guaranteed high-availability compute with financial remedies for downtime exceeding committed SLAs.
              </p>
            </div>
          </div>

          {/* Content Layout with Sticky Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-28 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 border-b border-slate-800/80 mb-2">
                  Table of Contents
                </div>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeSection === sec.id
                        ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
                <div className="pt-4 border-t border-slate-800/80 mt-4 px-3 space-y-2">
                  <span className="text-[10px] text-slate-500 block font-mono">Need custom enterprise terms?</span>
                  <a
                    href="mailto:legal@vivexa.ai"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    <Mail className="h-3.5 w-3.5" /> Contact Legal Team
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Legal Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Section 1 */}
              <section id="sec-1" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">01</div>
                  <h2 className="text-xl font-bold text-white">Acceptance of Terms & Account Authorization</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    By creating an account, registering an organization workspace, executing an Order Form, or accessing the Vivexa Decision Intelligence Platform ("Services"), you ("Customer" or "User") agree to be bound by these Terms of Service ("Terms") and our Privacy Policy.
                  </p>
                  <p>
                    If you are entering into these Terms on behalf of a company, corporation, or other legal entity, you represent and warrant that you have the full legal authority to bind such entity to these Terms.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li><strong className="text-white">Account Responsibility:</strong> You are strictly responsible for maintaining the confidentiality of your workspace API keys, OAuth tokens, and user credentials.</li>
                    <li><strong className="text-white">Minimum Age & Eligibility:</strong> You must be at least 18 years of age or the legal age of majority in your jurisdiction to use Vivexa Services.</li>
                    <li><strong className="text-white">Enterprise Workspace Provisioning:</strong> Each organization workspace is governed by a dedicated Tenant ID and single-tenant or isolated multi-tenant compute boundary.</li>
                  </ul>
                </div>
              </section>

              {/* Section 2 */}
              <section id="sec-2" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">02</div>
                  <h2 className="text-xl font-bold text-white">Customer Data Ownership & Intellectual Property</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Vivexa recognizes that your data is your most critical enterprise asset. We explicitly guarantee the following intellectual property rights:
                  </p>
                  <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" /> Full Ownership Guarantee
                    </div>
                    <p className="text-xs text-slate-300">
                      Customer retains 100% ownership, title, and intellectual property rights in and to all uploaded raw datasets, schema definitions, custom SQL queries, Python notebooks, and AI-generated decision outputs ("Customer Content").
                    </p>
                  </div>
                  <p>
                    Vivexa owns all rights, title, and interest in and to the platform infrastructure, proprietary multi-agent framework, decision engine algorithms, and general software improvements that do not contain Customer Content.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="sec-3" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">03</div>
                  <h2 className="text-xl font-bold text-white">Acceptable Use Policy & AI Ethics Guardrails</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    When using Vivexa, you agree to adhere strictly to our Enterprise Acceptable Use Policy. You shall not:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>Reverse-engineer, decompile, or attempt to extract source code from Vivexa's proprietary agent runtimes or decision engine binaries.</li>
                    <li>Use Vivexa to generate, process, or disseminate unlawful, fraudulent, or malicious content, including malware propagation or automated spamming.</li>
                    <li>Attempt to bypass rate limits, access control lists (ACLs), or security sandboxes isolating workspace tenant environments.</li>
                    <li>Input un-sanitized Protected Health Information (PHI) or Personally Identifiable Information (PII) unless you have executed an active Business Associate Agreement (BAA) with Vivexa.</li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="sec-4" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">04</div>
                  <h2 className="text-xl font-bold text-white">AI Model Outputs, Confidence Bounds & Verification</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Vivexa incorporates multi-pass statistical verification, deterministic SQL execution, and confidence scoring engines to maximize accuracy. However, AI decision intelligence relies in part on statistical models:
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200/90 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="h-4 w-4" /> Human-in-the-Loop Recommendation
                    </span>
                    <p>
                      Outputs provided by AI agents (including automated forecasts, decision intelligence reports, and anomaly flags) are provided with transparent statistical assumptions and confidence scores. Customer remains responsible for reviewing critical operational or financial actions before final execution.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="sec-5" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">05</div>
                  <h2 className="text-xl font-bold text-white">Service Level Agreement (SLA) & Uptime Commitments</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    For Enterprise subscription plans, Vivexa commits to maintaining an Annual System Uptime SLA of <strong>99.99%</strong>, excluding scheduled maintenance windows announced at least 48 hours in advance.
                  </p>
                  <p>
                    In the event that monthly system availability falls below 99.99%, Enterprise customers are eligible for Service Credits calculated as a percentage of their monthly invoice fee:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5 border-b border-slate-800">Monthly Uptime Percentage</th>
                          <th className="px-4 py-2.5 border-b border-slate-800">Service Credit Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr>
                          <td className="px-4 py-2">99.0% - 99.98%</td>
                          <td className="px-4 py-2 font-bold text-amber-400">10% Credit</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">95.0% - 98.99%</td>
                          <td className="px-4 py-2 font-bold text-amber-400">25% Credit</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">&lt; 95.0%</td>
                          <td className="px-4 py-2 font-bold text-rose-400">50% Credit</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="sec-6" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">06</div>
                  <h2 className="text-xl font-bold text-white">Subscription, Billing & Auto-Renewal</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Subscriptions are billed in advance on a monthly or annual basis depending on your selected billing frequency. Fees are based on seat allocations and compute unit consumption.
                  </p>
                  <p>
                    Upon subscription cancellation, Customer will retain full platform access until the end of the current billing cycle. Following account closure, Customer will have a 30-day grace period to download all workspace datasets, reports, and notebooks.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="sec-7" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">07</div>
                  <h2 className="text-xl font-bold text-white">Limitation of Liability & Indemnification</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    To the maximum extent permitted by applicable law, neither Vivexa nor its affiliates shall be liable for indirect, incidental, special, consequential, or punitive damages (including loss of profits, revenues, or operational downtime).
                  </p>
                  <p>
                    Vivexa agrees to indemnify, defend, and hold harmless Enterprise Customers against third-party claims alleging that the Vivexa Platform infringes any registered intellectual property right.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="sec-8" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">08</div>
                  <h2 className="text-xl font-bold text-white">Dispute Resolution & Governing Law</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without giving effect to any principles of conflicts of law.
                  </p>
                  <p>
                    Any dispute arising under or relating to these Terms shall be settled by confidential binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="sec-9" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold text-sm">09</div>
                  <h2 className="text-xl font-bold text-white">Modifications to Terms & Legal Contact</h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
                  <p>
                    Vivexa reserves the right to update or modify these Terms from time to time. Material changes will be communicated via email or in-app notification at least 30 days prior to taking effect.
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Vivexa Legal & Compliance Office</span>
                      <span className="text-xs text-slate-400 font-mono">legal@vivexa.ai • 100 Enterprise Way, San Francisco, CA 94105</span>
                    </div>
                    <Link
                      to="/privacy"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      View Privacy Policy <ArrowRight className="h-3.5 w-3.5" />
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
