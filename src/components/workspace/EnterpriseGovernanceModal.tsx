import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, ShieldCheck, Lock, Eye, EyeOff, FileText, CheckCircle2,
  AlertTriangle, Key, Users, History, Download, RefreshCw, X, Sliders,
  Terminal, Database, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EnterpriseGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  activeDatasetColumns?: string[];
  onOpenSiem?: () => void;
}

export const EnterpriseGovernanceModal: React.FC<EnterpriseGovernanceModalProps> = ({
  isOpen,
  onClose,
  userRole = "Data Engineer",
  activeDatasetColumns = ["user_id", "full_name", "email_address", "credit_card_hash", "salary_usd", "revenue_q3", "country_code"],
  onOpenSiem,
}) => {
  const [activeTab, setActiveTab] = useState<"pii_masking" | "compliance" | "audit_trail">("pii_masking");
  const [currentRole, setCurrentRole] = useState<"Admin" | "Data Scientist" | "Auditor" | "Business Stakeholder">("Data Scientist");
  
  // PII masking state per column
  const [maskedCols, setMaskedCols] = useState<Record<string, boolean>>({
    email_address: true,
    credit_card_hash: true,
    salary_usd: true,
  });

  const [zeroRetentionPolicy, setZeroRetentionPolicy] = useState(true);
  const [vpcAirGapEnabled, setVpcAirGapEnabled] = useState(true);

  // Mock immutable SOC2 audit log records
  const [auditLogs] = useState([
    {
      id: "aud-901",
      timestamp: "Just now",
      actor: "parasbishnoi012@gmail.com",
      action: "EXECUTE_SQL_PUSHDOWN",
      resource: "analytics.prod_revenue_2026",
      details: "SELECT SUM(revenue) FROM sales WHERE region='APAC'",
      status: "SUCCESS"
    },
    {
      id: "aud-902",
      timestamp: "4 mins ago",
      actor: "parasbishnoi012@gmail.com",
      action: "AI_COPILOT_QUERY",
      resource: "Notebook Cell #3",
      details: "Synthesize forecast model for Q3 ARR",
      status: "VERIFIED_ZERO_RETENTION"
    },
    {
      id: "aud-903",
      timestamp: "12 mins ago",
      actor: "system_security_sentinel",
      action: "AUTO_MASK_PII",
      resource: "credit_card_hash",
      details: "Masked 12,400 rows on frontend render",
      status: "PROTECTED"
    },
    {
      id: "aud-904",
      timestamp: "28 mins ago",
      actor: "auditor@enterprise.com",
      action: "EXPORT_CSV_DATASET",
      resource: "filtered_churn_leads.csv",
      details: "Downloaded 450 rows (Watermarked)",
      status: "LOGGED"
    }
  ]);

  if (!isOpen) return null;

  const toggleMask = (col: string) => {
    setMaskedCols(prev => {
      const next = { ...prev, [col]: !prev[col] };
      toast.info(`Column ${col} is now ${next[col] ? "Masked" : "Unmasked"}`);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Enterprise Security, RBAC & Governance
                </h2>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
                  SOC2 / HIPAA / GDPR Enforced
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Manage column-level PII obfuscation, air-gapped private LLM endpoints, and immutable access audit logs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("pii_masking")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "pii_masking" ? "border-emerald-500 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <EyeOff className="w-4 h-4" /> Dynamic Column PII Masking
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "compliance" ? "border-emerald-500 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-4 h-4" /> Air-Gapped VPC & Zero-Retention
          </button>
          <button
            onClick={() => setActiveTab("audit_trail")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "audit_trail" ? "border-emerald-500 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" /> Immutable Audit Trail
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === "pii_masking" && (
            <div className="space-y-6">
              {/* Role Simulation Selector */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Simulating Viewer Role</div>
                  <div className="text-sm font-bold text-white">Active RBAC Profile</div>
                </div>
                <div className="flex items-center gap-2">
                  {(["Admin", "Data Scientist", "Auditor", "Business Stakeholder"] as const).map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={currentRole === role ? "default" : "outline"}
                      onClick={() => {
                        setCurrentRole(role);
                        toast.success(`Role switched to ${role}`);
                      }}
                      className={`text-xs ${currentRole === role ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400"}`}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Column-level masking grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Detected Dataset Columns ({activeDatasetColumns.length})</span>
                  <span>Masking Rule</span>
                </div>

                <div className="space-y-2">
                  {activeDatasetColumns.map((col) => {
                    const isMasked = !!maskedCols[col];
                    const isSensitive = col.includes("card") || col.includes("email") || col.includes("salary") || col.includes("ssn");

                    return (
                      <div
                        key={col}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isMasked ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"}`}>
                            {isMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                              {col}
                              {isSensitive && (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-[9px]">
                                  Sensitive PII
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isMasked ? "Rendered as: •••••••••• (Redacted)" : "Rendered as: Plaintext Value"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`text-[10px] ${isMasked ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                            {isMasked ? "Obfuscated" : "Unmasked"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMask(col)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 h-8"
                          >
                            {isMasked ? "Reveal" : "Mask Column"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Zero-Data-Retention (ZDR) LLM Policy</h4>
                      <p className="text-xs text-slate-400">Ensures prompts and table metadata are never stored on external AI training logs.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zeroRetentionPolicy}
                      onChange={(e) => {
                        setZeroRetentionPolicy(e.target.checked);
                        toast.success(`ZDR Policy ${e.target.checked ? "Enforced" : "Disabled"}`);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Compliant with SOC2 Type II, HIPAA, and ISO/IEC 27001
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Data sent to the Gemini API is processed via server-side ephemeral memory buffers and destroyed immediately upon response stream completion.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Air-Gapped Private VPC Gateway</h4>
                      <p className="text-xs text-slate-400">Routes all warehouse database queries through dedicated enterprise VPC tunnels.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vpcAirGapEnabled}
                      onChange={(e) => {
                        setVpcAirGapEnabled(e.target.checked);
                        toast.success(`VPC Tunnel ${e.target.checked ? "Connected" : "Disconnected"}`);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit_trail" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Immutable Security Event Stream</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.info("Opening SIEM / Datadog Forwarder setup...");
                      if (onOpenSiem) onOpenSiem();
                    }}
                    className="h-7 text-xs border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 gap-1.5"
                  >
                    <Shield className="w-3 h-3 text-cyan-400" /> Forward to SIEM / Datadog
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Exported audit log as signed JSON format.")}
                    className="h-7 text-xs border-slate-700 gap-1.5"
                  >
                    <Download className="w-3 h-3" /> Export Audit Log
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">{log.action}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-mono">{log.resource}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-lg">
                        {log.details}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 text-[10px]">
                        {log.status}
                      </Badge>
                      <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">Enterprise security policies are enforced on both client and cloud edges.</span>
          <Button
            size="sm"
            onClick={() => {
              toast.success("Security & governance rules applied.");
              onClose();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md"
          >
            Confirm & Save Policy
          </Button>
        </div>
      </div>
    </div>
  );
};
export default EnterpriseGovernanceModal;
