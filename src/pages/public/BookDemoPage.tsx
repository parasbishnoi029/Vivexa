import { useState } from "react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { AppBackground } from "@/components/layout/AppBackground";
import { Calendar, Clock, CheckCircle2, Building2, User, Mail, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    companyName: "",
    jobTitle: "CTO / CIO / Head of Data",
    companySize: "100-500",
    preferredDate: "2026-08-15",
    preferredTime: "10:00 AM EST",
    deploymentNeed: "VPC Cloud"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.workEmail) {
      toast.error("Please fill in your name and work email.");
      return;
    }
    
    const toastId = toast.loading("Processing your demo request...");
    try {
      const res = await fetch("/api/v1/book-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success("Executive Demo Scheduled! Our founders will reach out shortly.", { id: toastId });
      } else {
        toast.error(data.error || data.meta?.error || "Failed to schedule demo.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Failed to book demo:", err);
      toast.error("An unexpected network error occurred while booking.", { id: toastId });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      <AppBackground centered={false}>
        <PublicNavbar />

        <main className="pt-28 pb-20 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Calendar className="h-4 w-4" /> Executive Walkthrough
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Book a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">1-on-1 Demo</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Schedule a personalized technical walkthrough with Paras (CEO) or Karunya Sharma (CTO).
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
            {/* Form */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="h-16 w-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Demo Scheduled!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Thank you, {formData.fullName}. A calendar invitation has been dispatched to <span className="text-indigo-400 font-bold">{formData.workEmail}</span> for {formData.preferredDate} at {formData.preferredTime}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Paras Bishnoi"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="paras@company.com"
                        value={formData.workEmail}
                        onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">Company Name</label>
                      <input
                        type="text"
                        placeholder="Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">Role / Title</label>
                      <select
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option>CTO / CIO / Head of Data</option>
                        <option>Data Scientist / Engineer</option>
                        <option>CEO / Founder / Executive</option>
                        <option>Product / Analytics Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">Preferred Date</label>
                      <input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">Deployment Architecture</label>
                      <select
                        value={formData.deploymentNeed}
                        onChange={(e) => setFormData({ ...formData, deploymentNeed: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option>Multi-Tenant SaaS Cloud</option>
                        <option>Dedicated Private VPC</option>
                        <option>Air-Gapped On-Premise Kubernetes</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all pt-3"
                  >
                    Confirm Demo Booking <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            {/* What to Expect Side Panel */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" /> What to Expect in Your Session
                </h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>30-minute tailored architecture review with our core founders</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Live query benchmarking against your sample dataset schemas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Custom security, SOC2, and zero-retention SLA verification</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-2 text-center">
                <ShieldCheck className="h-8 w-8 text-rose-400 mx-auto" />
                <div className="text-xs font-bold text-white">Zero Pressure Guarantee</div>
                <div className="text-[11px] text-slate-400">No pushy sales reps. You speak directly with our engineering founders.</div>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </AppBackground>
    </div>
  );
}
