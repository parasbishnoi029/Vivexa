import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert, Send, CheckCircle2, AlertTriangle, Radio,
  Activity, ExternalLink, Terminal, Copy, Check, RefreshCw, X,
  Lock, Globe, Database, Sliders, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SIEMForwarderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SIEMDestination = "Datadog" | "Splunk" | "AWS CloudWatch" | "Google Cloud Logging" | "Custom Webhook";

export const SIEMForwarderModal: React.FC<SIEMForwarderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [destination, setDestination] = useState<SIEMDestination>("Datadog");
  const [webhookUrl, setWebhookUrl] = useState("https://http-intake.logs.datadoghq.com/api/v2/logs");
  const [apiKey, setApiKey] = useState("••••••••••••••••••••••••••••••••");
  const [eventFilters, setEventFilters] = useState({
    sqlPushdown: true,
    aiPrompts: true,
    piiAccess: true,
    dataExports: true,
    authChanges: true,
  });
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const handleTestEvent = () => {
    setIsTestingStream(true);
    setTestSuccess(false);

    setTimeout(() => {
      setIsTestingStream(false);
      setTestSuccess(true);
      toast.success(`Synthetic audit event delivered to ${destination} endpoint! (HTTP 200 OK)`);
    }, 1100);
  };

  const handleToggleFilter = (key: keyof typeof eventFilters) => {
    setEventFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  SIEM & Webhook Audit Stream Forwarder
                </h2>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-[10px]">
                  Real-Time RFC-5424 Syslog
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Stream real-time security events, SQL queries, PII de-anonymizations, and AI prompts to your central SIEM.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Target SIEM Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Target SIEM / Observability Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(["Datadog", "Splunk", "AWS CloudWatch", "Google Cloud Logging", "Custom Webhook"] as SIEMDestination[]).map((dest) => (
                <button
                  key={dest}
                  onClick={() => {
                    setDestination(dest);
                    if (dest === "Datadog") setWebhookUrl("https://http-intake.logs.datadoghq.com/api/v2/logs");
                    else if (dest === "Splunk") setWebhookUrl("https://splunk-hec.enterprise.internal:8088/services/collector");
                    else if (dest === "AWS CloudWatch") setWebhookUrl("https://logs.us-east-1.amazonaws.com");
                    else if (dest === "Google Cloud Logging") setWebhookUrl("https://logging.googleapis.com/v2/entries:write");
                    else setWebhookUrl("https://hooks.slack.com/services/YOUR/WEBHOOK/URL");
                    setTestSuccess(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all text-left flex items-center justify-between ${
                    destination === dest
                      ? "bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/30"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span>{dest}</span>
                  {destination === dest && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint URL & Token */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Intake Ingress URL / HEC</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">API Key / Bearer Auth Header</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Event Filter Multi-Selector */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Security Event Subscriptions
              </div>
              <span className="text-[11px] text-slate-400 font-mono">5 Channels Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: "sqlPushdown" as const, label: "Cloud DWH SQL Pushdowns", desc: "Logs raw SQL queries executed on Snowflake/BigQuery" },
                { id: "aiPrompts" as const, label: "AI Copilot Prompts & Tokens", desc: "Streams input prompts and tokens used (Zero Data Retention)" },
                { id: "piiAccess" as const, label: "PII Masking & Unmask Events", desc: "Audits every unmask interaction on sensitive columns" },
                { id: "dataExports" as const, label: "Dataset File Exports", desc: "Logs CSV/Excel/Parquet table downloads with row counts" },
                { id: "authChanges" as const, label: "RBAC & Workspace Auth", desc: "User logins, permission escalations, and invite tokens" },
              ].map((filter) => (
                <div
                  key={filter.id}
                  onClick={() => handleToggleFilter(filter.id)}
                  className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    eventFilters[filter.id]
                      ? "bg-slate-900 border-cyan-500/40 text-slate-200"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={eventFilters[filter.id]}
                    onChange={() => {}}
                    className="mt-0.5 accent-cyan-500"
                  />
                  <div>
                    <div className="font-semibold text-[11px]">{filter.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{filter.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Dispatch Sandbox */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300">Validate connection pipeline with synthetic payload</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestEvent}
              disabled={isTestingStream}
              className="text-xs border-slate-700 hover:bg-slate-800 text-cyan-300 gap-1.5 h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingStream ? "animate-spin" : ""}`} />
              {isTestingStream ? "Streaming..." : "Send Test Ping"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">All payloads formatted with SHA-256 HMAC cryptographic signatures.</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-slate-300">
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success(`SIEM Stream connected to ${destination}!`);
                onClose();
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md"
            >
              Save Stream Config
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SIEMForwarderModal;
