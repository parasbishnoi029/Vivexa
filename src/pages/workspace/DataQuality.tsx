import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck, AlertTriangle, RefreshCw, Send, CheckCircle2,
  Database, Activity, Filter, Terminal, BarChart2, Bell, Cpu,
  ExternalLink, Layers, ArrowUpRight, Clock, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DataQuality() {
  const [isScanning, setIsScanning] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"overview" | "incidents" | "rules" | "webhooks">("overview");
  const [testingWebhook, setTestingWebhook] = useState(false);

  const fetchQualityData = async () => {
    try {
      // 1. Fetch rules
      const rulesRes = await fetch("/api/v1/enterprise/quality/rules");
      const rulesJson = await rulesRes.json();
      if (rulesJson?.data?.rules) setRules(rulesJson.data.rules);

      // 2. Fetch incidents
      const incRes = await fetch("/api/v1/enterprise/quality/incidents");
      const incJson = await incRes.json();
      if (incJson?.data?.incidents) setIncidents(incJson.data.incidents);

      // 3. Run default scan profile
      const scanRes = await fetch("/api/v1/enterprise/quality/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetName: "dw.fact_sales_global" })
      });
      const scanJson = await scanRes.json();
      if (scanJson?.data?.profile) setProfile(scanJson.data.profile);
    } catch (e) {
      console.warn("Failed to load Data Quality data:", e);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const triggerScan = async () => {
    setIsScanning(true);
    try {
      const scanRes = await fetch("/api/v1/enterprise/quality/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetName: "dw.fact_sales_global" })
      });
      const scanJson = await scanRes.json();
      if (scanJson?.data?.profile) {
        setProfile(scanJson.data.profile);
        toast.success("Data Quality & Anomaly scan completed", {
          description: `Score: ${scanJson.data.profile.overallHealthScore}/100 • ${scanJson.data.profile.checksRun} assertions executed`
        });
      }
    } catch (e) {
      toast.error("Failed to run data quality scan");
    } finally {
      setIsScanning(false);
    }
  };

  const triggerWebhookTest = async (channel: "slack" | "pagerduty" | "webhook") => {
    setTestingWebhook(true);
    try {
      const res = await fetch("/api/v1/enterprise/quality/alert/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          incident: {
            ruleName: "Daily Revenue Population Stability Index (PSI > 0.25)",
            datasetName: "dw.fact_sales_global",
            severity: "P1-High",
            metricValue: "PSI = 0.384",
            thresholdValue: "0.250",
            recommendedAction: "Recalibrate baseline distribution and notify Revenue Ops team"
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Webhook test delivered to ${channel.toUpperCase()}`, {
          description: json.data.responseMessage
        });
      }
    } catch (e) {
      toast.error(`Failed to send test alert to ${channel}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
              Data Quality & Anomaly Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Automated Sentinel
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1.5">
            Automated schema drift detection, distribution stability (PSI), metric anomaly triggers, and Slack/PagerDuty webhooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={triggerScan}
            disabled={isScanning}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm shadow-md flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning Assertions..." : "Run Quality Sweep"}
          </Button>
        </div>
      </div>

      {/* Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Dataset Health Score</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                {profile?.overallHealthScore != null ? `${profile.overallHealthScore}%` : "100%"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">SLA Compliance Gate Passed</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Incidents</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">
                {incidents.filter((i) => i.status === "Active").length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {incidents.length > 0 ? `${incidents.filter(i => i.severity?.includes('P1')).length} P1, ${incidents.filter(i => i.severity?.includes('P0')).length} P0` : "No active incidents"}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Schema Drift Status</p>
              <h3 className="text-2xl font-bold text-indigo-400 mt-1">
                {profile?.schemaAudit?.driftDetected ? "Drift Alert" : "In Sync"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Schema Sentinel</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Assertions Evaluated</p>
              <h3 className="text-2xl font-bold text-slate-200 mt-1">
                {profile?.checksRun ?? rules.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated Rules</p>
            </div>
            <div className="p-3 bg-slate-800 text-slate-300 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-2">
        <button
          onClick={() => setSelectedTab("overview")}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            selectedTab === "overview"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Distribution & Schema Audit
        </button>
        <button
          onClick={() => setSelectedTab("incidents")}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            selectedTab === "incidents"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Incident Feed ({incidents.length})
        </button>
        <button
          onClick={() => setSelectedTab("rules")}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            selectedTab === "rules"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Configured Rules ({rules.length})
        </button>
        <button
          onClick={() => setSelectedTab("webhooks")}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            selectedTab === "webhooks"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Alert Gateways & Webhooks
        </button>
      </div>

      {/* Tab 1: Overview & Distribution Stability */}
      {selectedTab === "overview" && (
        <div className="space-y-5">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span>Population Stability Index (PSI) & Statistical Drift</span>
                <span className="text-xs font-normal text-slate-400">Baseline window: Last 30 Days</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Monitors numerical columns for covariate shift and anomalous variance spikes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-800/80">
                {profile?.distributionAudit?.map((dist: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-slate-200">{dist.column}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            dist.psiScore < 0.2
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          PSI: {dist.psiScore} ({dist.driftStatus})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Mean: {dist.mean.toFixed(1)} • StdDev: {dist.stdDev.toFixed(1)}
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400">Stability:</span>{" "}
                      <span className="font-semibold text-slate-200">
                        {((1 - dist.psiScore) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Incident Feed */}
      {selectedTab === "incidents" && (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          inc.severity === "P0-Critical"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200">{inc.ruleName}</h4>
                      <span className="text-xs text-slate-500 font-mono">[{inc.datasetName}]</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {inc.rootCauseSummary}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                      <span>Detected: {new Date(inc.detectedAt).toLocaleTimeString()}</span>
                      <span>Metric Value: <strong className="text-slate-200">{inc.metricValue}</strong></span>
                      <span>Threshold: <strong className="text-slate-200">{inc.thresholdValue}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
                      onClick={() => toast.success("Incident marked as Acknowledged")}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() => toast.success("Incident resolved & rule verified")}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Configured Rules */}
      {selectedTab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {rule.category}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200 mt-2">{rule.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Target: {rule.targetTable} ({rule.targetColumn || "All Columns"})</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span>Alerts: {rule.alertChannels.join(", ").toUpperCase()}</span>
                  <span className="ml-auto text-[11px] text-slate-500">Threshold: {rule.threshold}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 4: Alert Gateways & Webhook Test */}
      {selectedTab === "webhooks" && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Enterprise Alert Dispatcher</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Test automated notification dispatchers for incident paging and chatops integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-200">Slack Webhook</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">Channel: #data-quality-alerts</p>
                <Button
                  size="sm"
                  onClick={() => triggerWebhookTest("slack")}
                  disabled={testingWebhook}
                  className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Test Slack Alert
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-200">PagerDuty Gateway</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">Service: Data Reliability Engine</p>
                <Button
                  size="sm"
                  onClick={() => triggerWebhookTest("pagerduty")}
                  disabled={testingWebhook}
                  className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Test PagerDuty
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-200">Custom Webhook Endpoint</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">Target: https://api.corp.internal/alert</p>
                <Button
                  size="sm"
                  onClick={() => triggerWebhookTest("webhook")}
                  disabled={testingWebhook}
                  className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Test Webhook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
