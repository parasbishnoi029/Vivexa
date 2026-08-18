import { useState } from "react";
import {
  AlertOctagon, TrendingUp, TrendingDown, ShieldAlert, ArrowUpRight, ArrowDownRight,
  Filter, Search, Sliders, CheckCircle2, ShieldCheck, Zap, AlertTriangle, Sparkles,
  RotateCcw, Layers, BarChart3, Activity, Eye, Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, Scatter, Legend
} from "recharts";
import { toast } from "sonner";

export interface AnomalyItem {
  id: string;
  metric: string;
  type: "Spike" | "Drop";
  badge: string;
  badgeType: "critical_spike" | "moderate_spike" | "critical_drop" | "moderate_drop";
  z_score: string;
  deviation_pct: string;
  timestamp_or_slice: string;
  observed_value: string;
  expected_range: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  root_cause: string;
  remediation: string;
  status?: "Flagged" | "Winsorized" | "Imputed" | "Whitelisted" | "Remediated";
}

interface AnomalousSpikesAndDropsModuleProps {
  datasetName: string;
  rawAnomaliesData?: any;
  onNavigateToTab?: (tab: string) => void;
}

export const DEFAULT_ANOMALIES: AnomalyItem[] = [
  {
    id: "anom-1",
    metric: "Primary Transaction Velocity / Revenue Volume",
    type: "Spike",
    badge: "Critical Surge (+382.4%)",
    badgeType: "critical_spike",
    z_score: "+4.82σ",
    deviation_pct: "+382.4%",
    timestamp_or_slice: "Batch Ingestion Segment #142 (Q3 Peak)",
    observed_value: "$4,820,400",
    expected_range: "$850,000 - $1,250,000",
    severity: "Critical",
    root_cause: "High concurrency flash promotion coupled with multi-threaded webhook deduplication lag.",
    remediation: "Apply adaptive dynamic rate-limiting and Winsorize top 0.5% tail before cross-validation.",
    status: "Flagged"
  },
  {
    id: "anom-2",
    metric: "Active User Session Concurrency",
    type: "Drop",
    badge: "Severe Drop (-84.2%)",
    badgeType: "critical_drop",
    z_score: "-3.91σ",
    deviation_pct: "-84.2%",
    timestamp_or_slice: "Partition 08-14 03:00 - 05:30 UTC",
    observed_value: "1,240 Active Sessions",
    expected_range: "7,800 - 9,500 Sessions",
    severity: "Critical",
    root_cause: "Upstream CDN edge gateway SSL certificate rotation timeout caused transient connection dropouts.",
    remediation: "Configure dual-redundant Anycast CDN routing and automated synthetic uptime probes.",
    status: "Remediated"
  },
  {
    id: "anom-3",
    metric: "API Processing Latency (P99)",
    type: "Spike",
    badge: "High Latency Spike (+241.0%)",
    badgeType: "moderate_spike",
    z_score: "+3.65σ",
    deviation_pct: "+241.0%",
    timestamp_or_slice: "Partition 08-12 14:00 UTC",
    observed_value: "842 ms",
    expected_range: "120 - 240 ms",
    severity: "High",
    root_cause: "Database connection pool starvation triggered by unindexed full-table scan on foreign key join.",
    remediation: "Deploy composite B-Tree index on customer_id foreign key and optimize pool limits.",
    status: "Remediated"
  },
  {
    id: "anom-4",
    metric: "Conversion Rate (%)",
    type: "Drop",
    badge: "Conversion Plunge (-42.6%)",
    badgeType: "moderate_drop",
    z_score: "-3.18σ",
    deviation_pct: "-42.6%",
    timestamp_or_slice: "Segment: Mobile WebKit Checkout",
    observed_value: "1.42%",
    expected_range: "2.40% - 3.10%",
    severity: "Moderate",
    root_cause: "Client-side Javascript viewport render regression in WebKit checkout button wrapper.",
    remediation: "Deploy hotfix patch for WebKit touch event listener and run browser regression tests.",
    status: "Flagged"
  },
  {
    id: "anom-5",
    metric: "Discount Rate Outlier Dispersion",
    type: "Spike",
    badge: "Margin Outlier (+3.24σ)",
    badgeType: "moderate_spike",
    z_score: "+3.24σ",
    deviation_pct: "+165.0%",
    timestamp_or_slice: "Region: EMEA Enterprise Tier",
    observed_value: "68.5% Discount",
    expected_range: "10.0% - 25.0%",
    severity: "Moderate",
    root_cause: "Manual discount override permitted by legacy CRM sales workflow without dual executive approval.",
    remediation: "Enforce automated CRM approval gate for discount overrides exceeding 30%.",
    status: "Flagged"
  },
  {
    id: "anom-6",
    metric: "Data Ingestion Null-Drop Blackout",
    type: "Drop",
    badge: "Zero-Fill Gap (-96.0%)",
    badgeType: "critical_drop",
    z_score: "-4.12σ",
    deviation_pct: "-96.0%",
    timestamp_or_slice: "Sensor Feed Kafka Topic 4",
    observed_value: "12 Records / min",
    expected_range: "450 - 600 Records / min",
    severity: "Critical",
    root_cause: "Kafka broker partition rebalance deadlock following node reboot.",
    remediation: "Upgrade Kafka consumer group protocol to cooperative sticky assignor.",
    status: "Flagged"
  }
];

export const DEFAULT_TIME_SERIES_ANOMALY_DATA = [
  { period: "T-10", baseline: 100, actual: 98, ucl: 135, lcl: 65, isAnomaly: false, label: "T-10" },
  { period: "T-9", baseline: 102, actual: 105, ucl: 135, lcl: 65, isAnomaly: false, label: "T-9" },
  { period: "T-8", baseline: 101, actual: 99, ucl: 135, lcl: 65, isAnomaly: false, label: "T-8" },
  { period: "T-7 (Spike)", baseline: 103, actual: 172, ucl: 135, lcl: 65, isAnomaly: true, anomalyType: "Spike", delta: "+67%", z: "+4.2σ", label: "T-7 (Spike)" },
  { period: "T-6", baseline: 104, actual: 108, ucl: 135, lcl: 65, isAnomaly: false, label: "T-6" },
  { period: "T-5", baseline: 105, actual: 102, ucl: 135, lcl: 65, isAnomaly: false, label: "T-5" },
  { period: "T-4 (Drop)", baseline: 106, actual: 28, ucl: 135, lcl: 65, isAnomaly: true, anomalyType: "Drop", delta: "-73%", z: "-3.8σ", label: "T-4 (Drop)" },
  { period: "T-3", baseline: 107, actual: 106, ucl: 135, lcl: 65, isAnomaly: false, label: "T-3" },
  { period: "T-2", baseline: 108, actual: 112, ucl: 135, lcl: 65, isAnomaly: false, label: "T-2" },
  { period: "T-1 (Spike)", baseline: 110, actual: 184, ucl: 135, lcl: 65, isAnomaly: true, anomalyType: "Spike", delta: "+67%", z: "+4.8σ", label: "T-1 (Spike)" },
  { period: "T-0 (Now)", baseline: 112, actual: 115, ucl: 135, lcl: 65, isAnomaly: false, label: "T-0" }
];

export function AnomalousSpikesAndDropsModule({
  datasetName,
  rawAnomaliesData,
  onNavigateToTab
}: AnomalousSpikesAndDropsModuleProps) {
  const [filterType, setFilterType] = useState<"all" | "spikes" | "drops" | "critical">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(3.0);
  const [anomalyStatuses, setAnomalyStatuses] = useState<Record<string, string>>({});

  const anomalies: AnomalyItem[] = rawAnomaliesData?.anomalies && rawAnomaliesData.anomalies.length > 0
    ? rawAnomaliesData.anomalies
    : DEFAULT_ANOMALIES;

  const chartData = rawAnomaliesData?.time_series_anomaly_data && rawAnomaliesData.time_series_anomaly_data.length > 0
    ? rawAnomaliesData.time_series_anomaly_data
    : DEFAULT_TIME_SERIES_ANOMALY_DATA;

  // Filter anomalies based on active controls
  const filteredAnomalies = anomalies.filter(item => {
    // Filter by type
    if (filterType === "spikes" && item.type !== "Spike") return false;
    if (filterType === "drops" && item.type !== "Drop") return false;
    if (filterType === "critical" && item.severity !== "Critical") return false;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = item.metric.toLowerCase().includes(q) ||
                    item.root_cause.toLowerCase().includes(q) ||
                    item.timestamp_or_slice.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filter by numeric Z-Score magnitude
    const parsedZ = Math.abs(parseFloat(item.z_score.replace(/[^\d.-]/g, '')) || 0);
    if (parsedZ < zScoreThreshold) return false;

    return true;
  });

  const totalSpikes = anomalies.filter(a => a.type === "Spike").length;
  const totalDrops = anomalies.filter(a => a.type === "Drop").length;
  const criticalCount = anomalies.filter(a => a.severity === "Critical").length;

  const handleRemediationAction = (id: string, action: string) => {
    setAnomalyStatuses(prev => ({ ...prev, [id]: action }));
    toast.success(`Action applied: ${action} on anomaly ${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <Card className="bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 border-rose-500/30 p-6 rounded-2xl relative overflow-hidden shadow-xl print-card">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-rose-600/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-rose-400 uppercase tracking-widest">
            <AlertOctagon className="h-4 w-4" /> Real-Time Parametric Outlier & Sudden Drift Detection
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            Anomalous Spikes & Sudden Drops Intelligence Studio
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
            Automated parametric Z-score, Tukey IQR, and rolling variance audit identifying sudden upward surges (flash spikes) and downward plunges (zero-fills / blackouts) across <span className="text-white font-semibold">{datasetName}</span>. Visual badges tag deviation severity, root cause diagnostics, and prescriptive mitigations.
          </p>
        </div>
      </Card>

      {/* 5 Summary KPI Scorecards with Visual Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-slate-950/60 border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition-colors print-card">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Flagged</span>
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{anomalies.length} Events</div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {criticalCount} Critical
            </span>
          </div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition-colors print-card">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Spike Surges (▲)</span>
            <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{totalSpikes} Detected</div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400">Max Z-Score: <strong>+4.82σ</strong></span>
          </div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition-colors print-card">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Severe Drops (▼)</span>
            <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalDrops} Detected</div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400">Min Z-Score: <strong>-4.12σ</strong></span>
          </div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition-colors print-card">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Signal Cleanliness</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">99.82%</div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400">&lt;0.2% Total Outlier Noise</span>
          </div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition-colors print-card">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Auto-Mitigation</span>
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">Ready</div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400">Winsorization & KNN</span>
          </div>
        </Card>
      </div>

      {/* Interactive Anomaly Time-Series & Statistical Control Limits Chart */}
      <Card className="bg-slate-950/60 border-slate-800 p-6 rounded-2xl space-y-4 print-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-400" />
              Statistical Process Control (SPC) Chart: Upper & Lower Control Limits (±3.0σ)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sequential time-series monitoring with Upper Control Limit (UCL +3σ), Lower Control Limit (LCL -3σ), and highlighted spike/drop inflection points.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              🔺 Spike Limit: +3σ
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🔻 Drop Limit: -3σ
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 210]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px"
                }}
                formatter={(val: any, name: string) => {
                  if (name === "Observed Actual") return [`${val} units`, name];
                  if (name === "Rolling Baseline Mean") return [`${val} units`, name];
                  return [val, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#cbd5e1" }} />

              {/* Upper & Lower Control Limit Lines */}
              <ReferenceLine y={135} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "UCL (+3.0σ Spike Threshold)", fill: "#f43f5e", fontSize: 10, position: "insideTopRight" }} />
              <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "LCL (-3.0σ Drop Threshold)", fill: "#f59e0b", fontSize: 10, position: "insideBottomRight" }} />
              <ReferenceLine y={105} stroke="#818cf8" strokeDasharray="2 2" strokeWidth={1} />

              <Area type="monotone" dataKey="baseline" name="Rolling Baseline Mean" fill="#6366f1" fillOpacity={0.15} stroke="#818cf8" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Observed Actual"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isAnomaly) {
                    const isSpike = payload.anomalyType === "Spike";
                    return (
                      <circle
                        key={`dot-${payload.period}`}
                        cx={cx}
                        cy={cy}
                        r={7}
                        fill={isSpike ? "#f43f5e" : "#f59e0b"}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return (
                    <circle
                      key={`dot-${payload.period}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill="#38bdf8"
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Interactive Filter & Search Bar */}
      <Card className="bg-slate-950/60 border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 print-card">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => setFilterType("all")}
            variant={filterType === "all" ? "default" : "outline"}
            className={`rounded-lg text-xs font-bold h-8 ${filterType === "all" ? "bg-violet-600 text-white" : "border-slate-800 text-slate-300"}`}
          >
            All Events ({anomalies.length})
          </Button>

          <Button
            size="sm"
            onClick={() => setFilterType("spikes")}
            variant={filterType === "spikes" ? "default" : "outline"}
            className={`rounded-lg text-xs font-bold h-8 gap-1 ${filterType === "spikes" ? "bg-rose-600 text-white" : "border-slate-800 text-rose-300 hover:bg-rose-500/10"}`}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Spikes Only ({totalSpikes})
          </Button>

          <Button
            size="sm"
            onClick={() => setFilterType("drops")}
            variant={filterType === "drops" ? "default" : "outline"}
            className={`rounded-lg text-xs font-bold h-8 gap-1 ${filterType === "drops" ? "bg-amber-600 text-white" : "border-slate-800 text-amber-300 hover:bg-amber-500/10"}`}
          >
            <TrendingDown className="h-3.5 w-3.5" /> Drops Only ({totalDrops})
          </Button>

          <Button
            size="sm"
            onClick={() => setFilterType("critical")}
            variant={filterType === "critical" ? "default" : "outline"}
            className={`rounded-lg text-xs font-bold h-8 gap-1 ${filterType === "critical" ? "bg-red-600 text-white" : "border-slate-800 text-red-300 hover:bg-red-500/10"}`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Critical ({criticalCount})
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Z-Score Sensitivity Slider */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
            <Sliders className="h-3.5 w-3.5 text-violet-400" />
            <span>Sensitivity:</span>
            <select
              value={zScoreThreshold}
              onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg text-xs px-2 py-1 focus:outline-none focus:border-violet-500"
            >
              <option value={2.0}>≥ 2.0σ (Sensitive)</option>
              <option value={2.5}>≥ 2.5σ (Standard)</option>
              <option value={3.0}>≥ 3.0σ (Conservative)</option>
              <option value={3.5}>≥ 3.5σ (Extreme Only)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search feature or metric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </Card>

      {/* Anomaly Grid: Individual Anomalous Spikes & Drops Cards */}
      <div className="grid gap-4">
        {filteredAnomalies.length === 0 ? (
          <Card className="bg-slate-950/40 border-slate-800 p-8 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">No Anomalies Matching Filters</h4>
            <p className="text-xs text-slate-400">All evaluated feature metrics sit safely within the {zScoreThreshold}σ parametric bounds.</p>
          </Card>
        ) : (
          filteredAnomalies.map((item) => {
            const currentStatus = anomalyStatuses[item.id] || item.status || "Flagged";
            const isSpike = item.type === "Spike";

            return (
              <Card
                key={item.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 print-card ${
                  isSpike
                    ? "bg-slate-950/70 border-rose-500/30 hover:border-rose-500/50"
                    : "bg-slate-950/70 border-amber-500/30 hover:border-amber-500/50"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSpike
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}>
                      {isSpike ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-white tracking-tight">{item.metric}</h4>
                        
                        {/* High-Visibility Visual Badges */}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 border shadow-sm ${
                          isSpike
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}>
                          {isSpike ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {item.badge}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          item.severity === "Critical"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : item.severity === "High"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                        }`}>
                          {item.severity} Severity
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">
                        Slice / Partition: <span className="text-slate-200 font-mono font-medium">{item.timestamp_or_slice}</span>
                      </p>
                    </div>
                  </div>

                  {/* Quantitative Deviation Block */}
                  <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Z-Score Deviation</span>
                      <span className={`text-sm font-black ${isSpike ? "text-rose-400" : "text-amber-400"}`}>
                        {item.z_score}
                      </span>
                    </div>

                    <div className="h-7 w-px bg-slate-800" />

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Observed vs Baseline</span>
                      <span className="text-xs font-bold text-slate-200">
                        {item.observed_value} <span className="text-slate-500 font-normal">({item.expected_range})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Diagnostic Details Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-violet-400" /> Root Cause Statistical Diagnostic
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.root_cause}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/20 space-y-1">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Senior Data Scientist Remediation
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.remediation}</p>
                  </div>
                </div>

                {/* Remediation & Audit Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentStatus === "Winsorized" || currentStatus === "Remediated"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : currentStatus === "Imputed"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {currentStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRemediationAction(item.id, isSpike ? "Winsorized" : "Imputed")}
                      variant="outline"
                      className="border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-bold h-7 px-2.5"
                    >
                      {isSpike ? "Auto-Winsorize" : "Impute Baseline"}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleRemediationAction(item.id, "Whitelisted")}
                      variant="outline"
                      className="border-slate-800 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-medium h-7 px-2"
                    >
                      Whitelist
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
