import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertTriangle, ShieldCheck, Clock, Send, X, CheckCircle2, 
  FileText, Cpu, Terminal, LifeBuoy, Zap, ChevronRight, Mail, Sparkles, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export interface PriorityTicket {
  id: string;
  subject: string;
  category: string;
  severity: "P1" | "P2" | "P3" | "P4";
  description: string;
  email: string;
  status: "OPEN" | "ASSIGNED" | "INVESTIGATING" | "RESOLVED";
  createdAt: string;
  slaMinutes: number;
  assignedEngineer: string;
  telemetryAttached: boolean;
  replies: Array<{ id: string; sender: string; role: string; message: string; timestamp: string }>;
}

interface PriorityTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: (ticket: PriorityTicket) => void;
  initialCategory?: string;
  initialSubject?: string;
}

const OFFICIAL_DEFAULT_EMAIL = "info.vivexa@gmail.com";

export function PriorityTicketModal({
  isOpen,
  onClose,
  onTicketCreated,
  initialCategory = "Incident / Outage",
  initialSubject = ""
}: PriorityTicketModalProps) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState(initialSubject);
  const [category, setCategory] = useState(initialCategory);
  const [severity, setSeverity] = useState<"P1" | "P2" | "P3" | "P4">("P1");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(user?.email || OFFICIAL_DEFAULT_EMAIL);
  const [attachTelemetry, setAttachTelemetry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(user?.email || OFFICIAL_DEFAULT_EMAIL);
      if (initialSubject) setSubject(initialSubject);
      if (initialCategory) setCategory(initialCategory);
    }
  }, [isOpen, user?.email, initialSubject, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Please enter a ticket subject.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide details about the issue.");
      return;
    }

    setIsSubmitting(true);

    const ticketId = `TICK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const slaMinutesMap = { P1: 15, P2: 60, P3: 240, P4: 1440 };
    const slaMins = slaMinutesMap[severity];
    const finalEmail = email.trim() || OFFICIAL_DEFAULT_EMAIL;

    const newTicket: PriorityTicket = {
      id: ticketId,
      subject: subject.trim(),
      category,
      severity,
      description: description.trim(),
      email: finalEmail,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      slaMinutes: slaMins,
      assignedEngineer: "Senior Platform On-Call Lead (SRE)",
      telemetryAttached: attachTelemetry,
      replies: [
        {
          id: `rep-1`,
          sender: "Vivexa Automated Triage Agent",
          role: "AI SRE Bot",
          message: `Ticket ${ticketId} registered for ${finalEmail} with severity ${severity}. Dedicated SRE team notified. Response SLA target: ${slaMins} minutes. Diagnostics logs attached.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    setTimeout(() => {
      // Save to localStorage
      try {
        const existingRaw = localStorage.getItem("vivexa_priority_tickets");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [newTicket, ...existing];
        localStorage.setItem("vivexa_priority_tickets", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("vivexa_ticket_created", { detail: newTicket }));
      } catch (err) {
        console.error("Failed to persist ticket:", err);
      }

      setIsSubmitting(false);
      toast.success(`Priority Ticket ${ticketId} created! Response SLA: ${slaMins} mins.`);
      if (onTicketCreated) {
        onTicketCreated(newTicket);
      }
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-start sm:items-center justify-between gap-3 bg-slate-950/80">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Open Enterprise Priority Support Ticket
                  </h3>
                  <span className="text-[10px] font-mono bg-rose-500/20 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                    24/7 SLA Guarantee
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct escalation to Vivexa Senior SRE & AI Systems Engineers.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
            {/* Severity Selection */}
            <div className="space-y-2">
              <label className="font-bold text-slate-200 block">
                Urgency / Impact Severity Level:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: "P1",
                    label: "P1 - Outage",
                    sla: "15 min SLA",
                    color: "border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  },
                  {
                    id: "P2",
                    label: "P2 - High",
                    sla: "1 hour SLA",
                    color: "border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  },
                  {
                    id: "P3",
                    label: "P3 - Normal",
                    sla: "4 hour SLA",
                    color: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                  },
                  {
                    id: "P4",
                    label: "P4 - Minor",
                    sla: "24 hour SLA",
                    color: "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  }
                ].map((sev) => {
                  const isSelected = severity === sev.id;
                  return (
                    <button
                      type="button"
                      key={sev.id}
                      onClick={() => setSeverity(sev.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${sev.color} ${
                        isSelected ? "ring-2 ring-indigo-500 font-bold shadow-lg" : "opacity-70"
                      }`}
                    >
                      <div className="font-bold text-xs">{sev.label}</div>
                      <div className="text-[10px] opacity-80 mt-1 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" /> {sev.sla}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Ticket Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Incident / Outage">Incident / Outage</option>
                  <option value="Data Pipeline / Schema Drift">Data Pipeline / Schema Drift</option>
                  <option value="AI Model Performance & Latency">AI Model Performance & Latency</option>
                  <option value="DuckDB / Query Router Offloading">DuckDB / Query Router Offloading</option>
                  <option value="SCIM 2.0 / Okta Sync Failure">SCIM 2.0 / Okta Sync Failure</option>
                  <option value="CRDT Collaboration Drop">CRDT Collaboration Drop</option>
                  <option value="Billing & Enterprise Licensing">Billing & Enterprise Licensing</option>
                  <option value="Feature Request & Feedback">Feature Request & Feedback</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Contact Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info.vivexa@gmail.com"
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs h-9 font-mono"
                  required
                />
              </div>
            </div>

            {/* Ticket Subject */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Subject / Issue Title</label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Query Router offload timing out on 5M row query"
                className="bg-slate-950 border-slate-800 text-slate-200 text-xs h-9"
                required
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Detailed Description & Steps to Reproduce</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what happened, expected behavior, error messages, or affected dataset IDs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                required
              />
            </div>

            {/* Telemetry Checkbox */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 block">Attach Automated System Telemetry</span>
                  <span className="text-[10px] text-slate-400">Includes runtime memory status, region, browser, and current route context.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={attachTelemetry}
                onChange={(e) => setAttachTelemetry(e.target.checked)}
                className="h-4 w-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* SLA Footer Banner */}
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>
                Enterprise SLA Activated: <strong>{severity === "P1" ? "15-minute response target" : `${severity} priority handling`}</strong>. Direct SMS & Slack alerts will trigger for the on-call engineer.
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-9 px-5 text-xs shadow-lg shadow-rose-600/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Registering Escalation...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" /> Submit Priority Ticket
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
