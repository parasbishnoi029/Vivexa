import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, Cloud, HardDrive, FileSpreadsheet, CheckCircle2,
  Search, Play, Lock, Clock, Activity, Shield, AlertCircle, Plus, Eye,
  Server, Table, Layers, ArrowUpRight, Zap, Check, FileText,
  Workflow, GitBranch, Box, Boxes, Share2, MoreVertical, Settings2,
  Trash2, RefreshCw, BarChart3, PieChart, LineChart, Cpu, 
  Network, Key, Globe, FileJson, Filter, Sparkles, ChevronRight,
  GitMerge, BookOpen, Fingerprint, X, Terminal, AlertTriangle, ArrowRight,
  ShieldCheck, HelpCircle, FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";

interface AssetColumn {
  name: string;
  type: string;
  null: string;
  desc: string;
  completeness: number;
  distinct: string;
  isPii: boolean;
  alert: string | null;
}

interface CommitVersion {
  version: number;
  timestamp: string;
  author: string;
  operation: string;
  details: string;
  size: string;
  rows: string;
}

interface LakehouseAsset {
  id: string;
  name: string;
  type: "Table" | "View" | "Stream" | "Volume";
  source: "S3" | "BigQuery" | "Snowflake" | "Local";
  format: "Parquet" | "Delta" | "CSV" | "JSON";
  size: string;
  rows: string;
  lastUpdated: string;
  status: "Healthy" | "Stale" | "Error";
  owner: string;
  tags: string[];
  columns: AssetColumn[];
  history: CommitVersion[];
  aiInsights: string[];
}

interface SampleQuery {
  question: string;
  sql: string;
  headers: string[];
  rows: string[][];
  confidence: number;
  explanation: string;
  assumptions: string;
  risks: string;
}

const SAMPLE_QUERIES: Record<string, SampleQuery[]> = {
  "fact_global_sales_v2": [
    {
      question: "Query gross sales metrics by region sorted descending",
      sql: "SELECT geo_region, SUM(amount_usd) as revenue_usd, COUNT(*) as tx_count\nFROM delta.fact_global_sales_v2\nGROUP BY geo_region\nORDER BY revenue_usd DESC;",
      headers: ["geo_region", "revenue_usd", "tx_count"],
      rows: [
        ["us-east-1", "$3,528,400.00", "2,410,000"],
        ["eu-west-1", "$2,109,240.00", "1,390,000"],
        ["ap-south-1", "$1,489,120.00", "984,000"],
        ["sa-east-1", "$810,400.00", "510,000"]
      ],
      confidence: 98,
      explanation: "Aggregates gross ledger volumes across four geo clusters using Snappy-compressed Parquet blocks. Optimizes performance via region-based partition skipping.",
      assumptions: "Excludes active refunds and temporary void transactions from the live Delta log state.",
      risks: "Region labels mapped through the secondary looker-region metadata sync; inconsistencies can trigger temporary grouping splits."
    },
    {
      question: "Check GDPR compliance / PII mask status",
      sql: "SELECT customer_fingerprint, COUNT(*) as session_hits\nFROM delta.fact_global_sales_v2\nWHERE is_pii_masked(customer_fingerprint) = FALSE\nGROUP BY customer_fingerprint\nLIMIT 3;",
      headers: ["customer_fingerprint", "session_hits", "vulnerability_status"],
      rows: [
        ["user_94f83a8b (unmasked)", "12,480", "High Risk (Legacy EU block)"],
        ["user_11bc90a2 (unmasked)", "9,102", "High Risk (Legacy EU block)"],
        ["user_ef89c322 (unmasked)", "4,110", "High Risk (Legacy EU block)"]
      ],
      confidence: 95,
      explanation: "Analyzes early-epoch transaction snapshots where client masking failed to run. Identifies exact row indexes that require manual GDPR purge.",
      assumptions: "Assumes non-SHA-256 strings of length < 64 indicate unmasked or incomplete cryptographic hashing.",
      risks: "Directly reads from the raw S3 bucket state. Requires high-level governance clearance."
    }
  ],
  "user_behavior_stream": [
    {
      question: "Calculate rolling session hits per event type",
      sql: "SELECT event_type, COUNT(*) as hit_count, ROUND(AVG(LENGTH(session_id)), 1) as avg_session_len\nFROM delta.user_behavior_stream\nGROUP BY event_type\nORDER BY hit_count DESC;",
      headers: ["event_type", "hit_count", "avg_session_len"],
      rows: [
        ["page_view", "450,230,000", "36.0"],
        ["click_event", "320,120,000", "36.0"],
        ["cart_add", "48,910,000", "36.0"],
        ["checkout_begin", "12,450,000", "36.0"]
      ],
      confidence: 97,
      explanation: "Performs low-latency stream analysis on active session clicks to map standard conversion funnel rates.",
      assumptions: "Assumes active sessions expire dynamically after 30 minutes of client inactivity.",
      risks: "Network delays in mobile user agents may delay events, triggering temporary windowing late arrivals."
    }
  ],
  "executive_summary_view": [
    {
      question: "Inspect aggregate operating margin trend",
      sql: "SELECT fiscal_quarter, gross_margin_pct, total_opex, active_headcount\nFROM delta.executive_summary_view\nORDER BY fiscal_quarter DESC;",
      headers: ["fiscal_quarter", "gross_margin_pct", "total_opex", "active_headcount"],
      rows: [
        ["2026-Q3", "64.2%", "$12,400,000.00", "1,240"],
        ["2026-Q2", "62.1%", "$13,100,000.00", "1,280"],
        ["2026-Q1", "59.8%", "$14,000,000.00", "1,310"]
      ],
      confidence: 99,
      explanation: "Exposes quarterly financial metrics verified through the formal ledger consensus mechanism.",
      assumptions: "Operating expenses are pre-adjusted for exchange rate fluctuations.",
      risks: "Subject to post-audit adjustment before annual SEC Form 10-K filing completion."
    }
  ]
};

const DEFAULT_ASSETS: LakehouseAsset[] = [
  {
    id: "a1",
    name: "fact_global_sales_v2",
    type: "Table",
    source: "S3",
    format: "Delta",
    size: "1.2 TB",
    rows: "8.4B",
    lastUpdated: "4m ago",
    status: "Healthy",
    owner: "Revenue Ops",
    tags: ["PII", "Production", "Revenue"],
    columns: [
      { name: 'transaction_id', type: 'UUID', null: 'No', desc: 'Primary unique identifier', completeness: 100, distinct: '8.4B', isPii: false, alert: null },
      { name: 'amount_usd', type: 'DECIMAL(18,2)', null: 'No', desc: 'Normalized gross revenue', completeness: 100, distinct: '412M', isPii: false, alert: null },
      { name: 'customer_fingerprint', type: 'STRING', null: 'Yes', desc: 'Hashed PII identifier', completeness: 98.4, distinct: '1.8B', isPii: true, alert: "Contains unmasked patterns in EU partitions" },
      { name: 'geo_region', type: 'STRING', null: 'No', desc: 'Looker-mapped region ID', completeness: 100, distinct: '24', isPii: false, alert: null },
      { name: 'event_timestamp', type: 'TIMESTAMP', null: 'No', desc: 'Delta-log partition key', completeness: 100, distinct: 'Continuous', isPii: false, alert: null }
    ],
    history: [
      { version: 4, timestamp: '2026-08-14 09:38', author: 'System Admin', operation: 'OPTIMIZE', details: 'Z-Order geo_region (compacted 24 Parquet files to 1, optimized query latency by 45%)', size: '1.2 TB', rows: '8.4B' },
      { version: 3, timestamp: '2026-08-14 04:12', author: 'Revenue Ops', operation: 'MERGE INTO', details: 'Upserted 1,200,000 sales transactions from streaming SQS pipe', size: '1.2 TB', rows: '8.4B' },
      { version: 2, timestamp: '2026-08-13 14:02', author: 'Analytics', operation: 'UPDATE', details: 'Masked customer_fingerprint column with SHA-256 for PII / GDPR compliance', size: '1.18 TB', rows: '8.38B' },
      { version: 1, timestamp: '2026-08-11 08:00', author: 'Revenue Ops', operation: 'CREATE TABLE', details: 'Initialized delta table manifest and defined bucket partitioning', size: '940 GB', rows: '6.1B' }
    ],
    aiInsights: [
      "Geographic concentration: us-east-1 accounts for 42% of aggregate sales amount, creating single-region performance dependency.",
      "Anomalous spike: Geo region 'eu-central-1' experienced a 340% increase in transaction velocity on 2026-08-12 14:00.",
      "PII alert: customer_fingerprint column contains 1.6% unmasked records in early legacy EU partitions. Recommendation: Execute deep column hashing."
    ]
  },
  {
    id: "a2",
    name: "user_behavior_stream",
    type: "Stream",
    source: "Snowflake",
    format: "JSON",
    size: "840 GB",
    rows: "1.2B/day",
    lastUpdated: "Just now",
    status: "Healthy",
    owner: "Growth Team",
    tags: ["Raw", "Streaming"],
    columns: [
      { name: 'session_id', type: 'STRING', null: 'No', desc: 'Active browser session context', completeness: 100, distinct: '1.2B', isPii: false, alert: null },
      { name: 'event_type', type: 'STRING', null: 'No', desc: 'Page view, click, checkout trigger', completeness: 100, distinct: '12', isPii: false, alert: null },
      { name: 'user_agent', type: 'STRING', null: 'Yes', desc: 'Raw browser client user agent', completeness: 99.1, distinct: '450k', isPii: false, alert: null },
      { name: 'ip_address', type: 'STRING', null: 'No', desc: 'IPv4/IPv6 client address for geo-IP lookup', completeness: 100, distinct: '84M', isPii: true, alert: "Masking policy active" },
      { name: 'timestamp', type: 'TIMESTAMP', null: 'No', desc: 'Ingestion clock timestamp', completeness: 100, distinct: 'Continuous', isPii: false, alert: null }
    ],
    history: [
      { version: 3, timestamp: '2026-08-14 09:42', author: 'Growth Team', operation: 'OPTIMIZE', details: 'Garbage collect expired sessions older than 24h', size: '840 GB', rows: '1.2B/day' },
      { version: 2, timestamp: '2026-08-14 01:30', author: 'System Admin', operation: 'ALTER TABLE', details: 'Add IP masking rules to streaming ingest pipe', size: '835 GB', rows: '1.18B/day' },
      { version: 1, timestamp: '2026-08-12 12:00', author: 'Growth Team', operation: 'CREATE STREAM', details: 'Provisioned Kafka consumer endpoint to stream Delta table', size: '400 GB', rows: '600M/day' }
    ],
    aiInsights: [
      "High entropy detected in user_agent field, with 12% of traffic originating from scrapers or unclassified headless browsers.",
      "Session lifecycle anomaly: session duration spikes to 48+ hours for 0.4% of users in Asia-Pacific region, suggesting automated keeping-alive activity."
    ]
  },
  {
    id: "a3",
    name: "executive_summary_view",
    type: "View",
    source: "BigQuery",
    format: "Delta",
    size: "140 MB",
    rows: "12k",
    lastUpdated: "12h ago",
    status: "Stale",
    owner: "Analytics",
    tags: ["Executive", "Certified"],
    columns: [
      { name: 'fiscal_quarter', type: 'STRING', null: 'No', desc: 'Active financial quarter representation', completeness: 100, distinct: '16', isPii: false, alert: null },
      { name: 'gross_margin_pct', type: 'DECIMAL(5,4)', null: 'No', desc: 'Quarterly calculated margin ratio', completeness: 100, distinct: '16', isPii: false, alert: null },
      { name: 'total_opex', type: 'DECIMAL(18,2)', null: 'No', desc: 'Quarterly total operating expenses', completeness: 100, distinct: '16', isPii: false, alert: null },
      { name: 'active_headcount', type: 'INTEGER', null: 'No', desc: 'Full-time employee directory sync count', completeness: 100, distinct: '8', isPii: false, alert: null }
    ],
    history: [
      { version: 2, timestamp: '2026-08-13 22:00', author: 'Analytics', operation: 'REFRESH VIEW', details: 'Full recalculation of Q3 fiscal parameters following SEC filing lock', size: '140 MB', rows: '12k' },
      { version: 1, timestamp: '2026-08-10 10:00', author: 'Analytics', operation: 'CREATE VIEW', details: 'Aggregated view mapping HR directory stats to finance ledger', size: '135 MB', rows: '11.5k' }
    ],
    aiInsights: [
      "Certified data consistency: 100% completeness verified across all fiscal quarter aggregations.",
      "Operating margin trend: gross_margin_pct has expanded by +2.1% quarter-over-quarter due to headcount reduction optimization."
    ]
  }
];

export default function Lakehouse() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<LakehouseAsset[]>(DEFAULT_ASSETS);
  const [activeTab, setActiveTab] = useState<"catalog" | "lineage" | "storage" | "governance" | "medallion" | "history">("catalog");
  const [catalogSubTab, setCatalogSubTab] = useState<"schema" | "quality" | "query" | "ai_insights">("schema");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<LakehouseAsset | null>(DEFAULT_ASSETS[0]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<"Table" | "View" | "Stream">("Table");
  const [newTableSource, setNewTableSource] = useState<"S3" | "BigQuery" | "Snowflake" | "Local">("S3");
  
  // Interactive Time-Travel state
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  
  // Interactive SQL state
  const [selectedQueryIndex, setSelectedQueryIndex] = useState<number | null>(null);
  const [customQueryPrompt, setCustomQueryPrompt] = useState("");
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [queryProgressLogs, setQueryProgressLogs] = useState<string[]>([]);
  const [activeQueryResult, setActiveQueryResult] = useState<SampleQuery | null>(null);
  const [activeQueryExplanation, setActiveQueryExplanation] = useState<boolean>(false);
  
  // Optimize Delta logs
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [entitlements, setEntitlements] = useState([
    { principal: 'Growth Data Scientist', role: 'READ_ONLY', status: 'Authorized' },
    { principal: 'Revenue Pipeline Service', role: 'READ_WRITE', status: 'Authorized' },
    { principal: 'Executive Dashboard App', role: 'READ_ONLY', status: 'Authorized' }
  ]);

  // Reset states when changing asset
  useEffect(() => {
    setCatalogSubTab("schema");
    setSelectedQueryIndex(null);
    setActiveQueryResult(null);
    setCustomQueryPrompt("");
    setActiveQueryExplanation(false);
  }, [selectedAsset]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  const handleRegisterTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      toast.error("Please provide a valid table asset name");
      return;
    }
    const created: LakehouseAsset = {
      id: "asset_" + Date.now(),
      name: newTableName.toLowerCase().trim().replace(/\s+/g, '_'),
      type: newTableType,
      source: newTableSource,
      format: "Delta",
      size: "450 MB",
      rows: "1.5M",
      lastUpdated: "Just now",
      status: "Healthy",
      owner: "System Admin",
      tags: ["New", "UnityCatalog"],
      columns: [
        { name: 'id', type: 'UUID', null: 'No', desc: 'Unique auto-ID', completeness: 100, distinct: '1.5M', isPii: false, alert: null },
        { name: 'payload_data', type: 'JSONB', null: 'Yes', desc: 'Raw ingest document block', completeness: 99.8, distinct: '1.2M', isPii: false, alert: null },
        { name: 'created_at', type: 'TIMESTAMP', null: 'No', desc: 'Creation baseline partition log', completeness: 100, distinct: 'Continuous', isPii: false, alert: null }
      ],
      history: [
        { version: 1, timestamp: '2026-08-14 10:00', author: 'System Admin', operation: 'CREATE TABLE', details: 'Initialized custom catalog registration schema', size: '450 MB', rows: '1.5M' }
      ],
      aiInsights: [
        "Unpartitioned catalog asset: Recommended to enable range-based date partitions to avoid full S3 scans.",
        "Payload analysis: JSONB data format detected. Consider flattening nested keys to speed up column vectorized reads by 3x."
      ]
    };
    setAssets(prev => [created, ...prev]);
    setSelectedAsset(created);
    setNewTableName("");
    setIsRegisterModalOpen(false);
    toast.success(`Successfully registered Unity Catalog asset: ${created.name}`);
  };

  // Time travel execution trigger
  const triggerTimeTravel = (versionObj: CommitVersion) => {
    setIsRollingBack(true);
    setRollbackVersion(versionObj.version);

    // Dynamic execution simulation
    setTimeout(() => {
      if (selectedAsset) {
        // Clone and apply metrics
        const updatedAsset = {
          ...selectedAsset,
          size: versionObj.size,
          rows: versionObj.rows,
          lastUpdated: `Just now (Restored to v${versionObj.version})`
        };
        setSelectedAsset(updatedAsset);
        setAssets(prev => prev.map(a => a.id === selectedAsset.id ? updatedAsset : a));
      }
      setIsRollingBack(false);
      toast.success(`Delta Time Travel successful! Restored database view to Version ${versionObj.version}`);
    }, 1800);
  };

  // Query Execution Simulator
  const handleRunQuery = (queryObj: SampleQuery) => {
    setIsExecutingQuery(true);
    setQueryProgressLogs([]);
    setActiveQueryResult(null);

    const logs = [
      "Compiling Natural Language statement into ANSI SQL...",
      "Resolving metadata catalog structures through Unity Catalog...",
      "Executing Catalyst Optimizer plan (pruning partitions, caching hot files)...",
      "Scanning Parquet blocks across multi-cloud availability zones...",
      "Formatting tabular metrics, generating confidence matrix...",
      "Execution complete."
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setQueryProgressLogs(prev => [...prev, logs[logIdx]]);
        logIdx++;
      } else {
        clearInterval(interval);
        setActiveQueryResult(queryObj);
        setIsExecutingQuery(false);
        toast.success("Query compiled and executed successfully!");
      }
    }, 350);
  };

  // Run Custom AI Query Generator
  const handleCustomQuery = () => {
    if (!customQueryPrompt.trim()) {
      toast.error("Please provide a prompt to compile.");
      return;
    }
    // Formulate a dynamic matching mock SQL or fall back gracefully
    const mockQuery: SampleQuery = {
      question: customQueryPrompt,
      sql: `SELECT \n  EXTRACT(HOUR FROM event_timestamp) as hour_of_day,\n  SUM(amount_usd) as aggregate_usd,\n  COUNT(*) as transaction_volume\nFROM delta.${selectedAsset?.name || "active_table"}\nWHERE event_timestamp >= CURRENT_DATE - INTERVAL '7 DAYS'\nGROUP BY 1\nORDER BY 2 DESC;`,
      headers: ["hour_of_day", "aggregate_usd", "transaction_volume"],
      rows: [
        ["14:00 (Peak Ingest)", "$1,894,000.00", "842,000"],
        ["15:00", "$1,450,230.00", "643,000"],
        ["11:00", "$920,410.00", "410,000"]
      ],
      confidence: 94,
      explanation: "Synthesized dynamic hourly aggregations over the trailing week partition boundary. Implements parallelized scan-sharing.",
      assumptions: "Assumes current clock context corresponds to local Eastern Standard Timezone alignments.",
      risks: "Underlying stream contains late-arriving logs up to 15m. Real-time metrics might fluctuate dynamically."
    };
    handleRunQuery(mockQuery);
  };

  // Run Delta optimization
  const runOptimizeDelta = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      if (selectedAsset) {
        const optimized = {
          ...selectedAsset,
          size: selectedAsset.id === "a1" ? "1.1 TB" : selectedAsset.size,
          lastUpdated: "Just now (Z-Ordered & Optimized)"
        };
        setSelectedAsset(optimized);
        setAssets(prev => prev.map(a => a.id === selectedAsset.id ? optimized : a));
      }
      setIsOptimizing(false);
      toast.success("Delta layout optimization (Z-Order Compaction & Vacuum) completed. Unused parquet shards purged.");
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* Time travel rollback full screen screen */}
      {isRollingBack && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white">
          <div className="max-w-md w-full p-8 text-center space-y-6">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30 rounded-full animate-spin">
              <RefreshCw className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Delta Engine Time-Travel</h3>
              <p className="text-xs text-slate-400">Restoring <span className="font-mono text-slate-200">{selectedAsset?.name}</span> to snapshot version <span className="font-bold text-white">v{rollbackVersion}</span>...</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-1.5 font-mono text-[10px] text-slate-500 max-h-40 overflow-y-auto no-scrollbar">
              <p className="text-indigo-400 font-bold">&gt; Initializing Delta transaction rollback request</p>
              <p className="text-slate-400">&gt; Scanning logs for commit file: transaction_log_v{rollbackVersion}.json</p>
              <p className="text-slate-400">&gt; Reverting partition block index states...</p>
              <p className="text-emerald-400 font-bold">&gt; Cryptographic integrity check complete. SHA-256 matched.</p>
              <p className="text-slate-400">&gt; Updating Unity Catalog pointer references to target version snapshot</p>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar: Catalog Explorer */}
      <aside className="w-80 flex flex-col gap-4 overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Boxes className="h-4 w-4 text-indigo-400" /> Catalog Fabric
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-slate-500 hover:text-white"
              onClick={() => setIsRegisterModalOpen(true)}
              title="Register New Table Asset"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-2">
          {filteredAssets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all group ${
                selectedAsset?.id === asset.id 
                  ? 'bg-indigo-600/10 border-indigo-500/40 shadow-inner' 
                  : 'bg-slate-900/20 border-transparent hover:bg-slate-900/40 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${
                  selectedAsset?.id === asset.id ? 'bg-indigo-600/20 border-indigo-500/40' : 'bg-slate-950 border-slate-800'
                }`}>
                  {asset.type === "Table" && <Table className="h-3.5 w-3.5 text-blue-400" />}
                  {asset.type === "Stream" && <Activity className="h-3.5 w-3.5 text-emerald-400" />}
                  {asset.type === "View" && <Eye className="h-3.5 w-3.5 text-amber-400" />}
                  {asset.type === "Volume" && <HardDrive className="h-3.5 w-3.5 text-indigo-400" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-xs font-bold truncate transition-colors ${selectedAsset?.id === asset.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {asset.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">{asset.rows} rows • {asset.format}</p>
                </div>
                {asset.status === "Healthy" ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden bg-slate-900/20 border border-slate-800 rounded-[32px] relative shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />
        
        {selectedAsset ? (
          <div className="h-full flex flex-col">
            {/* Asset Header */}
            <header className="p-8 border-b border-slate-800/60 bg-slate-950/20 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-white tracking-tight leading-none">{selectedAsset.name}</h1>
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      {selectedAsset.status === "Healthy" ? "Production" : "Stale Snapshot"}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                    Owner: <span className="text-indigo-400 font-bold">{selectedAsset.owner}</span> • Sync: {selectedAsset.lastUpdated}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50"
                    onClick={() => setIsShareDialogOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50"
                    onClick={runOptimizeDelta}
                    disabled={isOptimizing}
                    title="Run Compaction & Vacuum (Z-Order Optimization)"
                  >
                    <RefreshCw className={`h-4 w-4 ${isOptimizing ? 'animate-spin text-indigo-400' : ''}`} />
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.info(`Launching Logic Studio for ${selectedAsset.name}`);
                      navigate('/workspace/notebooks');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 px-5 font-bold text-xs gap-2"
                  >
                    <Play className="h-3 w-3 fill-white" /> Query Studio
                  </Button>
                </div>
              </div>

              {/* Tabs Nav */}
              <div className="flex items-center gap-8 mt-8 border-t border-slate-800/40 pt-4">
                {[
                  { id: 'catalog', label: 'Schema Explorer', icon: Table },
                  { id: 'history', label: 'Delta Time Travel', icon: Clock },
                  { id: 'medallion', label: 'Medallion Stage', icon: Box },
                  { id: 'lineage', label: 'Lineage Graph', icon: GitBranch },
                  { id: 'governance', label: 'Governance & PII', icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 pb-4 px-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-all relative ${
                      activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </header>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'catalog' && (
                  <motion.div 
                    key="catalog"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-8"
                  >
                    {/* Basic Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Volume', value: selectedAsset.size, icon: Database, color: 'text-blue-400' },
                        { label: 'Row Count', value: selectedAsset.rows, icon: Layers, color: 'text-indigo-400' },
                        { label: 'Data Format', value: selectedAsset.format, icon: FileJson, color: 'text-emerald-400' },
                        { label: 'Cloud Source', value: selectedAsset.source, icon: Cloud, color: 'text-amber-400' }
                      ].map((stat, i) => (
                        <Card key={i} className="bg-slate-950 border-slate-800 rounded-2xl shadow-xl">
                          <CardContent className="p-6 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                              <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <p className="text-xl font-black text-white">{stat.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Sub Tab Navigation inside Schema explorer */}
                    <div className="border-b border-slate-800/60 flex items-center justify-between">
                      <div className="flex gap-6">
                        {[
                          { id: 'schema', label: 'Schema Columns', icon: Table },
                          { id: 'quality', label: 'Data Quality Profiler', icon: CheckCircle2 },
                          { id: 'query', label: 'AI SQL Query Console', icon: Terminal },
                          { id: 'ai_insights', label: 'AI Schema Analyst', icon: Sparkles }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setCatalogSubTab(sub.id as any)}
                            className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all border-b-2 ${
                              catalogSubTab === sub.id 
                                ? 'border-indigo-500 text-indigo-400' 
                                : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                          >
                            <sub.icon className="h-3.5 w-3.5" />
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      {catalogSubTab === 'schema' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={runOptimizeDelta}
                          className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:bg-slate-800 h-7"
                        >
                          <Zap className="h-3 w-3 mr-1" /> Optimize Delta Layout
                        </Button>
                      )}
                    </div>

                    {/* Sub Tab: Schema Columns */}
                    {catalogSubTab === 'schema' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 border-b border-slate-800">
                              <tr>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Column</th>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Nullable</th>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Description</th>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-widest">Metadata</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {selectedAsset.columns.map((col, i) => (
                                <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="p-4 font-bold text-white flex items-center gap-2">
                                    {col.name}
                                    {col.isPii && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-400 uppercase tracking-wider">
                                        PII
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 font-mono text-indigo-400">{col.type}</td>
                                  <td className="p-4 text-slate-400">{col.null}</td>
                                  <td className="p-4 text-slate-500 italic">{col.desc}</td>
                                  <td className="p-4 text-slate-400 font-medium">
                                    {col.distinct !== "Continuous" ? `${col.distinct} distinct` : "Continuous series"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Sub Tab: Data Quality Profiler */}
                    {catalogSubTab === 'quality' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="bg-slate-950/40 border-slate-800 rounded-2xl">
                            <CardHeader>
                              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completeness Metric
                              </CardTitle>
                              <CardDescription className="text-[11px] text-slate-500">Percentage of non-null records loaded in the current Delta partition.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {selectedAsset.columns.map((col, i) => (
                                <div key={i} className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className="font-mono text-slate-300">{col.name}</span>
                                    <span className={col.completeness === 100 ? 'text-emerald-400' : 'text-amber-400 font-bold'}>{col.completeness}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${col.completeness === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                      style={{ width: `${col.completeness}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <Card className="bg-slate-950/40 border-slate-800 rounded-2xl">
                            <CardHeader>
                              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-indigo-400" /> Data Validation Assertions
                              </CardTitle>
                              <CardDescription className="text-[11px] text-slate-500">Live checks running on direct ingestion filters.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3.5">
                              {[
                                { title: "UUID Format Integrity", status: "PASSED", detail: "Complies with RFC-4122 spec limits", color: "text-emerald-400 bg-emerald-500/10" },
                                { title: "Non-Negative Gross Range", status: "PASSED", detail: "Validated gross amount >= 0.00", color: "text-emerald-400 bg-emerald-500/10" },
                                { title: "PII Hashing Compliance", status: "WARNING", detail: "1.6% anomalies found in customer_fingerprint", color: "text-amber-400 bg-amber-500/10" },
                                { title: "UTC Ingestion Chronology", status: "PASSED", detail: "Timestamp partition falls in trailing 30 days boundary", color: "text-emerald-400 bg-emerald-500/10" }
                              ].map((rule, i) => (
                                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-4">
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-white">{rule.title}</p>
                                    <p className="text-[10px] text-slate-500">{rule.detail}</p>
                                  </div>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${rule.color}`}>
                                    {rule.status}
                                  </span>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Sub Tab: AI SQL Query Console */}
                    {catalogSubTab === 'query' && (
                      <div className="space-y-6">
                        {/* Sample templates */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-indigo-400" /> Select AI-Generated Query Template
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(SAMPLE_QUERIES[selectedAsset.name] || []).map((q, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedQueryIndex(i);
                                  handleRunQuery(q);
                                }}
                                className={`text-left p-3.5 rounded-xl border transition-all text-xs flex justify-between items-center ${
                                  selectedQueryIndex === i 
                                    ? 'bg-indigo-600/10 border-indigo-500/50' 
                                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/40'
                                }`}
                              >
                                <div>
                                  <p className="font-bold text-white">{q.question}</p>
                                  <p className="font-mono text-[9px] text-indigo-400 mt-1 truncate max-w-sm">{q.sql.split('\n')[0]}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Query Prompt input */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/40">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            Or compile Natural Language prompt to SQL with AI
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                              <input 
                                type="text"
                                placeholder="e.g. Calculate hourly sales volumes where gross amount > 500"
                                value={customQueryPrompt}
                                onChange={(e) => setCustomQueryPrompt(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all outline-none"
                              />
                            </div>
                            <Button
                              onClick={handleCustomQuery}
                              disabled={isExecutingQuery}
                              className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs px-5 rounded-xl gap-1.5"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Compile with AI
                            </Button>
                          </div>
                        </div>

                        {/* SQL Compiler logs screen */}
                        {isExecutingQuery && (
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[10px] text-slate-400 space-y-1 animate-pulse">
                            <p className="text-indigo-400 font-bold">&gt; VIVEXA COMPILER STARTING</p>
                            {queryProgressLogs.map((log, i) => (
                              <p key={i}>&gt; {log}</p>
                            ))}
                          </div>
                        )}

                        {/* Query Result Grid & AI Explanation */}
                        {activeQueryResult && !isExecutingQuery && (
                          <div className="space-y-6">
                            {/* SQL Box */}
                            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                              <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Generated SQL Code block</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Confidence {activeQueryResult.confidence}%
                                </span>
                              </div>
                              <pre className="p-4 font-mono text-xs text-indigo-400 overflow-x-auto bg-slate-950/80 leading-relaxed">
                                {activeQueryResult.sql}
                              </pre>
                            </div>

                            {/* Tabular data result */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                                <FileCheck className="h-4 w-4 text-indigo-400" /> Compiled query output dataset
                              </h4>
                              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-900/60 border-b border-slate-800 font-mono text-slate-500">
                                    <tr>
                                      {activeQueryResult.headers.map((h, idx) => (
                                        <th key={idx} className="p-3.5 uppercase font-bold tracking-wider">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300">
                                    {activeQueryResult.rows.map((row, rIdx) => (
                                      <tr key={rIdx} className="hover:bg-slate-900/20 transition-colors">
                                        {row.map((val, cIdx) => (
                                          <td key={cIdx} className="p-3.5">{val}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Standard AI Explanation & Trust Panel */}
                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-[24px] space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Insight & Explanation</h4>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveQueryExplanation(!activeQueryExplanation)}
                                  className="text-[10px] uppercase font-bold tracking-widest text-slate-400"
                                >
                                  {activeQueryExplanation ? "Hide parameters" : "Show assumptions & parameters"}
                                </Button>
                              </div>
                              
                              <p className="text-xs text-slate-400 leading-relaxed">{activeQueryResult.explanation}</p>

                              {activeQueryExplanation && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/40 text-[11px]">
                                  <div className="space-y-1">
                                    <span className="font-bold text-white uppercase tracking-widest text-[9px] text-slate-500">Core Assumptions</span>
                                    <p className="text-slate-400 italic">{activeQueryResult.assumptions}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-white uppercase tracking-widest text-[9px] text-slate-500">Risks & Limitations</span>
                                    <p className="text-slate-400 italic">{activeQueryResult.risks}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub Tab: AI Schema Analyst */}
                    {catalogSubTab === 'ai_insights' && (
                      <div className="space-y-6">
                        <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-[24px] flex items-start gap-4">
                          <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <h4 className="text-sm font-bold text-white">AI Schema Analyst & Recommendation Engine</h4>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                              Scans physical delta log metadata and catalog structure to uncover partitioning flaws, query performance blockages, and GDPR compliance vulnerabilities.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Table Recommendations</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedAsset.aiInsights.map((insight, i) => (
                              <div key={i} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Recommendation #{i + 1}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono">Confidence 96%</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Major Tab: Delta Time Travel & Commit Log history */}
                {activeTab === 'history' && (
                  <motion.div 
                    key="history"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-6"
                  >
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-[24px] flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Clock className="h-4.5 w-4.5 text-indigo-400" /> Delta ACID Log Time Travel
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          Every write, merge, optimize, and update inside Vivexa Delta is fully versioned. You can query any historical state or restore the catalog instantly.
                        </p>
                      </div>
                    </div>

                    <div className="relative pl-6 border-l border-slate-800 space-y-8">
                      {selectedAsset.history.map((commit, i) => (
                        <div key={i} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-slate-950 flex items-center justify-center ${
                            i === 0 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
                          }`} />

                          <div className="bg-slate-950 border border-slate-800/80 hover:border-slate-800 rounded-3xl p-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    VERSION {commit.version}
                                  </span>
                                  <span className="text-xs font-black text-white uppercase tracking-wider">{commit.operation}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold">{commit.timestamp} • Executed by {commit.author}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right text-[10px] text-slate-500 font-semibold">
                                  <p>{commit.rows} rows</p>
                                  <p>{commit.size}</p>
                                </div>
                                {i === 0 ? (
                                  <span className="px-3 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                    <Check className="h-3 w-3" /> Current State
                                  </span>
                                ) : (
                                  <Button
                                    onClick={() => triggerTimeTravel(commit)}
                                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-[10px] uppercase font-bold tracking-wider px-3 h-8 gap-1"
                                  >
                                    <Clock className="h-3 w-3" /> Time-Travel View
                                  </Button>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 leading-relaxed">
                              {commit.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Major Tab: Medallion Architecture Stage */}
                {activeTab === 'medallion' && (
                  <motion.div 
                    key="medallion"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {['Bronze', 'Silver', 'Gold'].map((stage) => (
                        <div key={stage} className={`p-8 rounded-[32px] border bg-slate-950/40 backdrop-blur-sm relative overflow-hidden group ${
                          stage === 'Gold' ? 'border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]' :
                          stage === 'Silver' ? 'border-slate-400/20' : 'border-rose-900/20'
                        }`}>
                          <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-20 ${
                            stage === 'Gold' ? 'bg-amber-500' :
                            stage === 'Silver' ? 'bg-slate-400' : 'bg-rose-900'
                          }`} />
                          
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-xl font-black tracking-tighter ${
                                stage === 'Gold' ? 'text-amber-400' :
                                stage === 'Silver' ? 'text-slate-300' : 'text-rose-400'
                              }`}>{stage} Stage</h4>
                              {stage === 'Gold' && <Sparkles className="h-5 w-5 text-amber-500" />}
                            </div>
                            
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {stage === 'Bronze' ? 'Raw data ingestion without transformations. Preserves fidelity.' :
                               stage === 'Silver' ? 'Cleaned, joined, and filtered datasets. Ready for broad analytics.' :
                               'Aggregated, high-performance data models for C-Suite dashboards.'}
                            </p>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                <span>Health Score</span>
                                <span>{stage === 'Gold' ? '99.9%' : stage === 'Silver' ? '98.4%' : '92.1%'}</span>
                              </div>
                              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  stage === 'Gold' ? 'bg-amber-500' :
                                  stage === 'Silver' ? 'bg-indigo-500' : 'bg-rose-500'
                                }`} style={{ width: stage === 'Gold' ? '99%' : stage === 'Silver' ? '85%' : '60%' }} />
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toast.info(`Manifest details for ${stage} stage: Parquet SNAPPY format, Delta transaction log v${stage === 'Gold' ? '3.2' : stage === 'Silver' ? '2.1' : '1.0'}.`)}
                              className="w-full bg-slate-950/40 border-slate-800 text-[10px] font-bold uppercase tracking-widest h-10 rounded-xl group-hover:bg-slate-800 transition-colors"
                            >
                              Inspect Manifest
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 rounded-[32px] border border-slate-800 bg-slate-950/20 flex items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          <Network className="h-8 w-8" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white tracking-tight">Multi-Region Replication</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-md">Delta Sharing protocol automatically synchronizes this asset across us-east-1 and ap-south-1 availability zones.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                              {i === 1 ? 'US' : i === 2 ? 'EU' : 'AP'}
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => toast.success("Multi-Region Replication sync active across US, EU, and AP zones.")}
                          className="text-indigo-400 font-bold text-xs hover:text-indigo-300"
                        >
                          Configure Regions
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Major Tab: Lineage graph representation */}
                {activeTab === 'lineage' && (
                  <motion.div 
                    key="lineage"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="h-[500px] rounded-3xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center space-y-8"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
                    
                    {/* Simplified Lineage Visualization */}
                    <div className="flex items-center gap-16 relative z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
                          <Cloud className="h-8 w-8 text-slate-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">S3 Raw Source</p>
                      </div>
                      
                      <div className="w-24 h-px bg-gradient-to-r from-slate-800 via-indigo-500 to-slate-800 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-1 rounded bg-indigo-500/20 border border-indigo-500/40">
                          <Zap className="h-3 w-3 text-indigo-400 animate-pulse" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                          <Table className="h-12 w-12 text-indigo-400" />
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">{selectedAsset.name}</p>
                      </div>

                      <div className="w-24 h-px bg-gradient-to-r from-slate-800 via-emerald-500 to-slate-800 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-1 rounded bg-emerald-500/20 border border-emerald-500/40">
                          <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
                          <PieChart className="h-8 w-8 text-emerald-400" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Analytics Dashboard</p>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-800" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Table</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Asset</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Downstream Logic</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Major Tab: Governance and RLS masks */}
                {activeTab === 'governance' && (
                  <motion.div 
                    key="governance"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <Card className="bg-slate-950 border-slate-800 rounded-3xl overflow-hidden">
                      <CardHeader className="bg-slate-900/50 p-6">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                          <Fingerprint className="h-4 w-4 text-indigo-400" /> Entitlement Registry
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900/20 border-b border-slate-800">
                            <tr>
                              <th className="p-4 font-bold text-slate-500 uppercase">Principal</th>
                              <th className="p-4 font-bold text-slate-500 uppercase">Role</th>
                              <th className="p-4 font-bold text-slate-500 uppercase">Status</th>
                              <th className="p-4 font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {entitlements.map((rule, i) => (
                              <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                                <td className="p-4 font-bold text-white">{rule.principal}</td>
                                <td className="p-4 font-mono text-indigo-400">{rule.role}</td>
                                <td className="p-4">
                                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <Check className="h-3 w-3" /> {rule.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      setEntitlements(prev => prev.filter((_, idx) => idx !== i));
                                      toast.success(`Revoked entitlement for ${rule.principal}`);
                                    }}
                                    className="h-8 text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  >
                                    Revoke
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>

                    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-6">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1 text-left">
                        <h4 className="text-sm font-bold text-white">Row-Level Security Enabled</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          Regional data scientists can only access records matching their assigned region ID. PII columns are automatically masked for all non-admin principals.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => toast.info("Managing Row-Level Security (RLS) & Column PII Masking policy.")}
                        className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-xl text-xs font-bold"
                      >
                        Manage Policy
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
              <div className="relative p-12 rounded-full bg-slate-950 border border-slate-800 shadow-2xl">
                <Network className="h-16 w-16 text-slate-700" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-black text-white">Select a Catalog Asset</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Choose an asset from the Unity Catalog sidebar to explore its schema, track multi-cloud lineage, and manage enterprise-grade governance.
              </p>
            </div>
            <Button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] px-8 h-12 font-bold shadow-xl shadow-indigo-500/20"
            >
              Register New Table
            </Button>
          </div>
        )}
      </main>
      {selectedAsset && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          title={`Lakehouse Asset: ${selectedAsset.name}`}
        />
      )}

      {/* Register New Table Modal */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-indigo-400" /> Register Unity Catalog Table
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleRegisterTable} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Table Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sales_transactions_2026"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
                    <select
                      value={newTableType}
                      onChange={(e) => setNewTableType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Table">Table</option>
                      <option value="View">View</option>
                      <option value="Stream">Stream</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source Provider</label>
                    <select
                      value={newTableSource}
                      onChange={(e) => setNewTableSource(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="S3">AWS S3</option>
                      <option value="BigQuery">Google BigQuery</option>
                      <option value="Snowflake">Snowflake</option>
                      <option value="Local">Local Storage</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-lg shadow-indigo-500/20"
                  >
                    Register Asset
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
