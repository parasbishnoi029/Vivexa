import { supabase } from "@/lib/supabase";
import { useState, useMemo, useEffect, useCallback } from "react";
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
  ShieldCheck, HelpCircle, FileCheck, Download, Code2, Copy, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { RagSearchDialog } from "@/components/RagSearchDialog";
import { CollabHeaderPresence } from "@/components/CollabHeaderPresence";
import { duckdbEngine, DuckDBQueryResult, DuckDBTableInfo } from "@/lib/duckdbEngine";

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

const DEFAULT_ASSETS: LakehouseAsset[] = [
  {
    id: "a1",
    name: "gold_enterprise_revenue",
    type: "Table",
    source: "S3",
    format: "Delta",
    size: "4.2 TB",
    rows: "12.8M",
    lastUpdated: "5 mins ago",
    status: "Healthy",
    owner: "Finance Analytics Engineering",
    tags: ["Gold Layer", "Production", "Financial", "Z-Ordered"],
    columns: [
      { name: "transaction_id", type: "VARCHAR(64)", null: "NO", desc: "Global immutable transaction identifier", completeness: 100, distinct: "12.8M", isPii: false, alert: null },
      { name: "customer_id", type: "VARCHAR(32)", null: "NO", desc: "Enterprise account master ID", completeness: 100, distinct: "450K", isPii: false, alert: null },
      { name: "customer_email", type: "VARCHAR(128)", null: "YES", desc: "Customer email address", completeness: 99.8, distinct: "442K", isPii: true, alert: "SHA-256 Masking Active" },
      { name: "amount_usd", type: "DECIMAL(18,2)", null: "NO", desc: "Gross transaction amount in USD", completeness: 100, distinct: "85K", isPii: false, alert: null },
      { name: "discount_pct", type: "DECIMAL(5,4)", null: "NO", desc: "Contracted tier discount rate", completeness: 100, distinct: "120", isPii: false, alert: null },
      { name: "region", type: "VARCHAR(32)", null: "NO", desc: "Geographic sales territory", completeness: 100, distinct: "4", isPii: false, alert: null },
      { name: "segment", type: "VARCHAR(32)", null: "NO", desc: "Account classification (Enterprise/Mid-Market/SMB)", completeness: 100, distinct: "3", isPii: false, alert: null },
      { name: "plan_tier", type: "VARCHAR(32)", null: "NO", desc: "Subscription product tier", completeness: 100, distinct: "4", isPii: false, alert: null },
      { name: "status", type: "VARCHAR(20)", null: "NO", desc: "Settlement status (Completed/Settled/Pending)", completeness: 100, distinct: "3", isPii: false, alert: null },
      { name: "event_timestamp", type: "TIMESTAMP_NTZ", null: "NO", desc: "UTC transaction event time", completeness: 100, distinct: "Continuous", isPii: false, alert: null }
    ],
    history: [
      { version: 4, timestamp: "2026-08-16 01:15:20 UTC", author: "Automated Compaction Engine", operation: "OPTIMIZE ZORDER", details: "Z-Order compaction applied on (region, event_timestamp). Reduced 420 parquet files into 18 consolidated files.", size: "4.2 TB", rows: "12.8M" },
      { version: 3, timestamp: "2026-08-15 18:30:10 UTC", author: "ETL Pipeline (Airflow)", operation: "MERGE INTO", details: "Merged 145,200 updated transaction records from Silver telemetry stream into Gold revenue ledger.", size: "4.1 TB", rows: "12.8M" },
      { version: 2, timestamp: "2026-08-14 12:00:00 UTC", author: "Finance Admin", operation: "UPDATE SCHEMA", details: "Added 'plan_tier' column with default value 'Standard Pro'. Backfilled historical rows.", size: "3.9 TB", rows: "12.4M" },
      { version: 1, timestamp: "2026-08-10 08:00:00 UTC", author: "Lead Data Architect", operation: "CREATE TABLE", details: "Initialized Delta table with multi-region partition structure and SHA-256 PII encryption rules.", size: "3.5 TB", rows: "11.2M" }
    ],
    aiInsights: [
      "Partition Optimization: High query selectivity on 'region' and 'event_timestamp'. Z-Ordering boosted query scan efficiency by 84%.",
      "PII Governance: 'customer_email' detected as sensitive PII. Column-level cryptographic masking policy successfully enforced for non-admin roles.",
      "Cost Allocation: Data compaction reduced S3 GET API requests by 72% during peak BI dashboard refreshes."
    ]
  },
  {
    id: "a2",
    name: "silver_customer_telemetry",
    type: "Stream",
    source: "BigQuery",
    format: "Parquet",
    size: "850 GB",
    rows: "45.2M",
    lastUpdated: "1 min ago",
    status: "Healthy",
    owner: "Growth & Product Analytics",
    tags: ["Silver Layer", "Streaming", "Product Events", "Realtime"],
    columns: [
      { name: "event_id", type: "UUID", null: "NO", desc: "Unique streaming message ID", completeness: 100, distinct: "45.2M", isPii: false, alert: null },
      { name: "user_pseudonym", type: "VARCHAR(64)", null: "NO", desc: "Anonymized user tracking token", completeness: 100, distinct: "1.8M", isPii: false, alert: null },
      { name: "session_id", type: "VARCHAR(64)", null: "NO", desc: "Active browser session ID", completeness: 100, distinct: "8.4M", isPii: false, alert: null },
      { name: "event_name", type: "VARCHAR(64)", null: "NO", desc: "Telemetry action (e.g. query_run, dashboard_export)", completeness: 100, distinct: "28", isPii: false, alert: null },
      { name: "latency_ms", type: "INTEGER", null: "NO", desc: "Client side interaction execution latency in ms", completeness: 100, distinct: "1.2K", isPii: false, alert: null },
      { name: "user_ip_address", type: "VARCHAR(45)", null: "YES", desc: "Masked client IP address", completeness: 98.5, distinct: "620K", isPii: true, alert: "IP Masking Active" },
      { name: "device_type", type: "VARCHAR(20)", null: "NO", desc: "Desktop / Mobile / Tablet classification", completeness: 100, distinct: "3", isPii: false, alert: null },
      { name: "created_at", type: "TIMESTAMP", null: "NO", desc: "Event ingestion timestamp", completeness: 100, distinct: "Continuous", isPii: false, alert: null }
    ],
    history: [
      { version: 3, timestamp: "2026-08-16 01:50:00 UTC", author: "Flink Streaming Engine", operation: "STREAM WRITE", details: "Ingested 128,400 streaming event micro-batches into Parquet partitions.", size: "850 GB", rows: "45.2M" },
      { version: 2, timestamp: "2026-08-15 22:10:00 UTC", author: "Data Quality Engine", operation: "FILTER BAD ROWS", details: "Quarantined 420 malformed JSON events with missing session_id into dead-letter bucket.", size: "842 GB", rows: "44.9M" },
      { version: 1, timestamp: "2026-08-12 00:00:00 UTC", author: "Data Platform Team", operation: "CREATE STREAM", details: "Created Apache Flink stream source connector feeding BigQuery storage layer.", size: "720 GB", rows: "38.1M" }
    ],
    aiInsights: [
      "Latency Spike Detection: 0.4% of 'dashboard_export' events exhibited > 1200ms latency during EMEA business hours.",
      "Dead Letter Queue: 0.001% quarantine rate indicates high stream quality and robust client-side validation."
    ]
  },
  {
    id: "a3",
    name: "bronze_raw_events_ingress",
    type: "Table",
    source: "Snowflake",
    format: "CSV",
    size: "1.8 TB",
    rows: "120M",
    lastUpdated: "12 mins ago",
    status: "Healthy",
    owner: "Data Platform Team",
    tags: ["Bronze Layer", "Raw Ingest", "Unstructured", "High Throughput"],
    columns: [
      { name: "ingest_id", type: "BIGINT", null: "NO", desc: "Auto-incrementing raw ingestion log ID", completeness: 100, distinct: "120M", isPii: false, alert: null },
      { name: "raw_payload", type: "VARIANT / JSONB", null: "NO", desc: "Unstructured JSON payload document block", completeness: 100, distinct: "118M", isPii: false, alert: null },
      { name: "source_topic", type: "VARCHAR(64)", null: "NO", desc: "Kafka message topic name", completeness: 100, distinct: "12", isPii: false, alert: null },
      { name: "ingest_timestamp", type: "TIMESTAMP", null: "NO", desc: "Ingestion timestamp in UTC", completeness: 100, distinct: "Continuous", isPii: false, alert: null }
    ],
    history: [
      { version: 2, timestamp: "2026-08-16 01:40:00 UTC", author: "Kafka Connect S3 Sink", operation: "BULK APPEND", details: "Appended 2.4M raw event payloads to S3 Landing Zone.", size: "1.8 TB", rows: "120M" },
      { version: 1, timestamp: "2026-08-01 00:00:00 UTC", author: "System Architect", operation: "INIT LANDING ZONE", details: "Initialized Bronze raw landing zone with automatic JSON validation schemas.", size: "1.2 TB", rows: "80M" }
    ],
    aiInsights: [
      "Schema Evolution Warning: 2 new keys ('client_build_id', 'feature_flag_set') detected in raw_payload JSON documents.",
      "Flattening Recommendation: Flattening raw JSON fields into Parquet columns will speed up Silver transformation runs by 4.2x."
    ]
  },
  {
    id: "a4",
    name: "gold_executive_kpi_mart",
    type: "View",
    source: "Local",
    format: "Delta",
    size: "120 MB",
    rows: "85K",
    lastUpdated: "Just now",
    status: "Healthy",
    owner: "BI & Executive Reporting",
    tags: ["Gold Layer", "Executive Dashboard", "Materialized View", "High Priority"],
    columns: [
      { name: "fiscal_quarter", type: "VARCHAR(10)", null: "NO", desc: "Fiscal quarter identifier (e.g. Q3-2026)", completeness: 100, distinct: "12", isPii: false, alert: null },
      { name: "region", type: "VARCHAR(32)", null: "NO", desc: "Sales region", completeness: 100, distinct: "4", isPii: false, alert: null },
      { name: "total_mrr_usd", type: "DECIMAL(18,2)", null: "NO", desc: "Monthly Recurring Revenue in USD", completeness: 100, distinct: "4.8K", isPii: false, alert: null },
      { name: "arr_runrate_usd", type: "DECIMAL(18,2)", null: "NO", desc: "Annualized Run Rate in USD", completeness: 100, distinct: "4.8K", isPii: false, alert: null },
      { name: "net_expansion_rate_pct", type: "DECIMAL(5,2)", null: "NO", desc: "Net Revenue Retention Percentage", completeness: 100, distinct: "180", isPii: false, alert: null },
      { name: "churn_rate_pct", type: "DECIMAL(5,2)", null: "NO", desc: "Monthly Account Churn Rate", completeness: 100, distinct: "90", isPii: false, alert: null }
    ],
    history: [
      { version: 2, timestamp: "2026-08-16 01:00:00 UTC", author: "Materialized View Scheduler", operation: "REFRESH VIEW", details: "Recompiled materialized aggregate view across trailing 12 quarters.", size: "120 MB", rows: "85K" },
      { version: 1, timestamp: "2026-08-05 10:00:00 UTC", author: "CFO Analytics Lead", operation: "CREATE MATERIALIZED VIEW", details: "Built C-Suite Executive KPI view combining Gold Revenue and Silver Churn ledgers.", size: "100 MB", rows: "72K" }
    ],
    aiInsights: [
      "Executive NRR Trend: Net Revenue Retention reached 124.8% in North America, driven by Enterprise Plus tier upgrades.",
      "Churn Alert: SMB tier churn in LATAM increased by 0.3% year-over-year. Recommendation: Review localized pricing structures."
    ]
  }
];

const SAMPLE_QUERIES: Record<string, SampleQuery[]> = {
  gold_enterprise_revenue: [
    {
      question: "Top 5 Sales Regions by Gross Revenue and Average Deal Size",
      sql: "SELECT \n  region,\n  COUNT(*) AS transaction_count,\n  ROUND(SUM(amount_usd), 2) AS gross_revenue_usd,\n  ROUND(AVG(amount_usd), 2) AS avg_deal_size_usd\nFROM delta.gold_enterprise_revenue\nWHERE status = 'Completed'\nGROUP BY region\nORDER BY gross_revenue_usd DESC\nLIMIT 5;",
      headers: ["region", "transaction_count", "gross_revenue_usd", "avg_deal_size_usd"],
      rows: [
        ["North America", "4,820,120", "$48,920,400.00", "$10,149.20"],
        ["EMEA", "3,410,850", "$32,150,800.00", "$9,425.90"],
        ["APAC", "2,890,400", "$24,800,100.00", "$8,580.20"],
        ["LATAM", "1,678,630", "$12,420,300.00", "$7,399.10"]
      ],
      confidence: 98,
      explanation: "Aggregates settled revenue across regional sales territories, sorting by total gross USD volume.",
      assumptions: "Filters for completed transactions in trailing 90 days window.",
      risks: "Excludes pending wire settlements which average 2-3 business days to reconcile."
    },
    {
      question: "Enterprise vs SMB Segment Revenue Distribution & Discount Breakdown",
      sql: "SELECT \n  segment,\n  plan_tier,\n  COUNT(DISTINCT customer_id) AS total_accounts,\n  ROUND(SUM(amount_usd), 2) AS total_revenue_usd,\n  ROUND(AVG(discount_pct) * 100, 2) AS avg_discount_percentage\nFROM delta.gold_enterprise_revenue\nGROUP BY segment, plan_tier\nORDER BY total_revenue_usd DESC;",
      headers: ["segment", "plan_tier", "total_accounts", "total_revenue_usd", "avg_discount_percentage"],
      rows: [
        ["Enterprise", "Enterprise Plus", "1,240", "$52,400,000.00", "12.50%"],
        ["Enterprise", "Scale Tier", "3,850", "$31,200,000.00", "8.20%"],
        ["Mid-Market", "Standard Pro", "12,400", "$22,800,000.00", "4.50%"],
        ["SMB", "Starter", "48,200", "$11,900,000.00", "1.00%"]
      ],
      confidence: 96,
      explanation: "Evaluates contract discounting behavior across plan tiers to measure margin retention.",
      assumptions: "Considers active customer accounts with at least one transaction in 2026.",
      risks: "Custom enterprise contract overrides might not reflect standard tier baseline prices."
    }
  ],
  silver_customer_telemetry: [
    {
      question: "Average Action Latency and Daily Event Volume by Device Type",
      sql: "SELECT \n  device_type,\n  COUNT(*) AS total_events,\n  ROUND(AVG(latency_ms), 2) AS avg_latency_ms,\n  COUNT(DISTINCT user_pseudonym) AS unique_active_users\nFROM delta.silver_customer_telemetry\nGROUP BY device_type\nORDER BY total_events DESC;",
      headers: ["device_type", "total_events", "avg_latency_ms", "unique_active_users"],
      rows: [
        ["Desktop", "28,450,100", "18.2 ms", "1,240,500"],
        ["Mobile", "14,200,800", "42.8 ms", "520,300"],
        ["Tablet", "2,549,100", "28.4 ms", "98,400"]
      ],
      confidence: 97,
      explanation: "Measures client UI responsiveness across desktop and mobile devices from telemetry logs.",
      assumptions: "Events ingested from Flink streaming pipeline with sub-second SLA.",
      risks: "Mobile latencies include cellular network transmission overhead."
    }
  ]
};

export default function Lakehouse() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<LakehouseAsset[]>(DEFAULT_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<LakehouseAsset | null>(DEFAULT_ASSETS[0]);
  
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.access_token) {
          const res = await fetch('/api/v1/datasets', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped = json.data.map((ds: any) => ({
              id: ds.id,
              name: ds.name || "custom_dataset",
              type: "Table" as const,
              source: "Local" as const,
              format: "Delta" as const,
              size: `${((ds.size_bytes || 1024 * 1024 * 50) / 1024 / 1024).toFixed(2)} MB`,
              rows: ds.row_count ? String(ds.row_count) : "100K",
              lastUpdated: ds.created_at ? new Date(ds.created_at).toLocaleString() : "Just now",
              status: "Healthy" as const,
              owner: "Authenticated User",
              tags: ["Production"],
              columns: ds.schema?.columns || DEFAULT_ASSETS[0].columns,
              history: DEFAULT_ASSETS[0].history,
              aiInsights: DEFAULT_ASSETS[0].aiInsights
            }));
            setAssets([...mapped, ...DEFAULT_ASSETS]);
            setSelectedAsset(mapped[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch backend assets:", err);
      }
    };
    fetchAssets();
  }, []);
  const [activeTab, setActiveTab] = useState<"catalog" | "duckdb_wasm" | "lineage" | "storage" | "governance" | "medallion" | "history">("catalog");
  const [catalogSubTab, setCatalogSubTab] = useState<"schema" | "quality" | "governance" | "query" | "ai_insights">("schema");

  
  const [searchQuery, setSearchQuery] = useState("");
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
  
  // DuckDB WASM In-Browser SQL Engine State
  const [duckdbSql, setDuckdbSql] = useState<string>("");
  const [duckdbResult, setDuckdbResult] = useState<DuckDBQueryResult | null>(null);
  const [duckdbExplainPlan, setDuckdbExplainPlan] = useState<string | null>(null);
  const [isDuckdbExecuting, setIsDuckdbExecuting] = useState(false);
  const [isDuckdbReady, setIsDuckdbReady] = useState(false);
  const [duckdbTables, setDuckdbTables] = useState<DuckDBTableInfo[]>([]);
  const [duckdbPreset, setDuckdbPreset] = useState<string>("revenue_by_region");
  const [duckdbPage, setDuckdbPage] = useState<number>(0);
  const DUCKDB_PAGE_SIZE = 15;

  // Optimize Delta logs
  const [isOptimizing, setIsOptimizing] = useState(false);

  // RAG & Vector Search State
  const [isRagDialogOpen, setIsRagDialogOpen] = useState(false);

  // dbt Core DAG Nodes State
  const [dbtDagNodes, setDbtDagNodes] = useState<any[]>([]);
  const [isImportingDbt, setIsImportingDbt] = useState(false);

  // Great Expectations / Soda Data Quality State
  const [qualitySuiteData, setQualitySuiteData] = useState<any>(null);
  const [isRunningQualityChecks, setIsRunningQualityChecks] = useState(false);

  // dbt Cloud Webhook Trigger State
  const [isTriggeringDbtJob, setIsTriggeringDbtJob] = useState(false);
  const [dbtCloudRunData, setDbtCloudRunData] = useState<any>(null);

  // Data Drift Analytics State
  const [isDetectingDrift, setIsDetectingDrift] = useState(false);
  const [driftData, setDriftData] = useState<any>(null);

  // SIEM SOC2 Audit Export State
  const [isExportingSiem, setIsExportingSiem] = useState(false);

  // Trigger dbt Cloud Webhook Run
  const handleTriggerDbtJob = async () => {
    setIsTriggeringDbtJob(true);
    try {
      const res = await fetch("/api/v1/dbt/trigger-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: "acc_89201",
          jobId: "job_44120",
          cause: "Triggered via Vivexa Analytics UI Workspace",
          gitBranch: "main"
        })
      });
      const data = await res.json();
      if (data.success) {
        setDbtCloudRunData(data.dbtCloudRun);
        toast.success(data.message);
      } else {
        toast.error("dbt Cloud trigger failed: " + data.error);
      }
    } catch (err: any) {
      toast.error("dbt Cloud webhook error: " + err.message);
    } finally {
      setIsTriggeringDbtJob(false);
    }
  };

  // Run Kolmogorov-Smirnov & Wasserstein Statistical Drift Analytics
  const handleDetectDataDrift = async () => {
    setIsDetectingDrift(true);
    try {
      const res = await fetch("/api/v1/quality/detect-drift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetName: selectedAsset?.name || "gold_enterprise_revenue",
          featureColumn: "amount_usd",
          threshold: 0.05
        })
      });
      const data = await res.json();
      if (data.success) {
        setDriftData(data.driftAnalysis);
        toast.success(`Data Drift Analysis Complete! KS p-value: ${data.driftAnalysis.pValue}`);
      } else {
        toast.error("Drift analysis failed: " + data.error);
      }
    } catch (err: any) {
      toast.error("Drift engine error: " + err.message);
    } finally {
      setIsDetectingDrift(false);
    }
  };

  // Export Real-Time SOC2 Audit Stream to Splunk / Datadog SIEM
  const handleExportSiemAudit = async () => {
    setIsExportingSiem(true);
    try {
      const res = await fetch("/api/v1/audit/export-siem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siemProvider: "Splunk HEC & Datadog HTTP Logs",
          endpointUrl: "https://splunk-hec.enterprise.internal:8088/services/collector"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`SOC2 Audit Stream: Exported ${data.siemExport.exportedCount} compliance events to ${data.siemExport.siemProvider}!`);
      } else {
        toast.error("SIEM export failed: " + data.error);
      }
    } catch (err: any) {
      toast.error("SIEM stream error: " + err.message);
    } finally {
      setIsExportingSiem(false);
    }
  };


  // Load dbt DAG sample or custom schema.yml
  const handleLoadDbtDag = async () => {
    setIsImportingDbt(true);
    try {
      const res = await fetch("/api/v1/dbt/sample");
      const data = await res.json();
      if (data.success) {
        setDbtDagNodes(data.nodes || []);
        toast.success(`Imported dbt project '${data.projectName}' with ${data.nodes?.length || 0} DAG nodes`);
      }
    } catch (err) {
      toast.error("Failed to load dbt DAG");
    } finally {
      setIsImportingDbt(false);
    }
  };

  // Run Great Expectations / Soda Quality Assertion Suite
  const handleRunQualityChecks = async () => {
    if (!selectedAsset) return;
    setIsRunningQualityChecks(true);
    try {
      const sampleRows = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        transaction_id: `TX-${202600 + i}`,
        amount_usd: 120 + i * 15,
        region: ["North America", "EMEA", "APAC", "LATAM"][i % 4]
      }));

      const res = await fetch("/api/v1/quality/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetName: selectedAsset.name,
          layer: selectedAsset.tags.some(t => t.includes("Gold")) ? "Gold" : "Silver",
          rows: sampleRows
        })
      });
      const data = await res.json();
      if (data.success) {
        setQualitySuiteData(data.suite);
        toast.success(`Executed Great Expectations suite! Overall score: ${data.suite.overallScore}%`);
      }
    } catch (err) {
      toast.error("Quality assertion suite run failed");
    } finally {
      setIsRunningQualityChecks(false);
    }
  };

  const [entitlements, setEntitlements] = useState([
    { principal: 'Growth Data Scientist', role: 'READ_ONLY', status: 'Authorized' },
    { principal: 'Revenue Pipeline Service', role: 'READ_WRITE', status: 'Authorized' },
    { principal: 'Executive Dashboard App', role: 'READ_ONLY', status: 'Authorized' }
  ]);

  // Sync selected asset into DuckDB WASM memory
  const syncAssetToDuckDB = useCallback(async (asset: LakehouseAsset) => {
    try {
      const tableName = (asset.name || "lakehouse_table").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const mockRows = Array.from({ length: 400 }, (_, i) => ({
        id: `trx_${1000 + i}`,
        transaction_id: `TX-${2026000 + i}`,
        customer_id: `CUST-${(i % 60) + 1}`,
        region: ["North America", "EMEA", "APAC", "LATAM"][i % 4],
        segment: ["Enterprise", "Mid-Market", "SMB", "Public Sector"][i % 4],
        plan_tier: ["Enterprise Plus", "Scale Tier", "Starter", "Standard Pro"][i % 4],
        amount_usd: Math.round((1200 + (i * 47) % 8500) * 100) / 100,
        quantity: (i % 12) + 1,
        discount_pct: (i % 5) * 0.05,
        status: ["Completed", "Settled", "Pending", "Verified"][i % 4],
        latency_ms: Math.round(15 + (i * 13) % 180),
        event_timestamp: new Date(Date.now() - (i * 3600000 * 4)).toISOString().slice(0, 19).replace('T', ' '),
        created_at: new Date(Date.now() - (i * 3600000 * 8)).toISOString().slice(0, 19).replace('T', ' ')
      }));

      await duckdbEngine.registerTableFromJson(tableName, mockRows);
      const tables = await duckdbEngine.getRegisteredTables();
      setDuckdbTables(tables);
      setIsDuckdbReady(true);
      
      const defaultSql = `SELECT \n  region,\n  segment,\n  COUNT(*) AS transaction_count,\n  ROUND(SUM(amount_usd), 2) AS gross_revenue_usd,\n  ROUND(AVG(amount_usd), 2) AS avg_deal_size,\n  ROUND(AVG(latency_ms), 1) AS avg_latency_ms\nFROM ${tableName}\nGROUP BY region, segment\nORDER BY gross_revenue_usd DESC;`;
      setDuckdbSql(defaultSql);
    } catch (err: any) {
      console.error("DuckDB table registration error:", err);
    }
  }, []);

  // Reset states and sync DuckDB when changing asset
  useEffect(() => {
    setCatalogSubTab("schema");
    setSelectedQueryIndex(null);
    setActiveQueryResult(null);
    setCustomQueryPrompt("");
    setActiveQueryExplanation(false);
    setDuckdbResult(null);
    setDuckdbExplainPlan(null);
    if (selectedAsset) {
      syncAssetToDuckDB(selectedAsset);
    }
  }, [selectedAsset, syncAssetToDuckDB]);

  // Execute in DuckDB WASM
  const handleExecuteDuckDB = async (sqlToRun?: string) => {
    const query = (sqlToRun || duckdbSql).trim();
    if (!query) {
      toast.error("Please enter a SQL query to execute in DuckDB WASM.");
      return;
    }
    setIsDuckdbExecuting(true);
    setDuckdbExplainPlan(null);
    setDuckdbPage(0);
    try {
      const result = await duckdbEngine.query(query);
      setDuckdbResult(result);
      toast.success(`DuckDB WASM executed in ${result.executionTimeMs}ms (${result.rowCount} rows)`);
    } catch (err: any) {
      toast.error(`DuckDB execution failed: ${err.message}`);
    } finally {
      setIsDuckdbExecuting(false);
    }
  };

  // Run EXPLAIN Plan in DuckDB WASM
  const handleExplainDuckDB = async () => {
    const query = duckdbSql.trim();
    if (!query) {
      toast.error("Please enter a SQL query to explain.");
      return;
    }
    setIsDuckdbExecuting(true);
    try {
      const plan = await duckdbEngine.explain(query);
      setDuckdbExplainPlan(plan);
      toast.info("DuckDB Vectorized Execution Plan generated.");
    } catch (err: any) {
      toast.error(`Explain failed: ${err.message}`);
    } finally {
      setIsDuckdbExecuting(false);
    }
  };

  // Apply DuckDB Preset Queries
  const applyDuckDBPreset = (presetKey: string) => {
    if (!selectedAsset) return;
    const tableName = (selectedAsset.name || "lakehouse_table").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    setDuckdbPreset(presetKey);

    let query = "";
    if (presetKey === "revenue_by_region") {
      query = `SELECT \n  region,\n  segment,\n  COUNT(*) AS transaction_count,\n  ROUND(SUM(amount_usd), 2) AS gross_revenue_usd,\n  ROUND(AVG(amount_usd), 2) AS avg_deal_size\nFROM ${tableName}\nGROUP BY region, segment\nORDER BY gross_revenue_usd DESC;`;
    } else if (presetKey === "top_accounts") {
      query = `SELECT \n  customer_id,\n  region,\n  plan_tier,\n  COUNT(*) AS orders_placed,\n  ROUND(SUM(amount_usd), 2) AS account_ltv,\n  RANK() OVER (ORDER BY SUM(amount_usd) DESC) AS ltv_rank\nFROM ${tableName}\nGROUP BY customer_id, region, plan_tier\nORDER BY account_ltv DESC\nLIMIT 15;`;
    } else if (presetKey === "latency_telemetry") {
      query = `SELECT \n  status,\n  COUNT(*) AS volume,\n  ROUND(AVG(latency_ms), 2) AS avg_latency_ms,\n  MIN(latency_ms) AS min_latency_ms,\n  MAX(latency_ms) AS max_latency_ms\nFROM ${tableName}\nGROUP BY status\nORDER BY volume DESC;`;
    } else if (presetKey === "cumulative_window") {
      query = `SELECT \n  transaction_id,\n  region,\n  segment,\n  amount_usd,\n  ROUND(SUM(amount_usd) OVER (PARTITION BY region ORDER BY amount_usd DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS running_region_total\nFROM ${tableName}\nORDER BY region, amount_usd DESC\nLIMIT 30;`;
    } else if (presetKey === "filter_recent") {
      query = `SELECT *\nFROM ${tableName}\nWHERE amount_usd > 2500\nORDER BY amount_usd DESC\nLIMIT 25;`;
    }

    setDuckdbSql(query);
    handleExecuteDuckDB(query);
  };

  // Export DuckDB Result to CSV
  const handleExportDuckDBCsv = () => {
    if (!duckdbResult || duckdbResult.rows.length === 0) {
      toast.error("No DuckDB query results to export.");
      return;
    }
    const headerLine = duckdbResult.columns.join(",");
    const rowsLines = duckdbResult.rows.map(r => 
      duckdbResult.columns.map(col => {
        const val = r[col];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const csvContent = [headerLine, ...rowsLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `duckdb_query_${selectedAsset?.name || "results"}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("DuckDB WASM results exported as CSV!");
  };

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
    // Formulate a dynamic matching synthetic SQL or fall back gracefully
    const syntheticQuery: SampleQuery = {
      question: customQueryPrompt,
      sql: `SELECT \n  EXTRACT(HOUR FROM event_timestamp) as hour_of_day,\n  SUM(amount_usd) as aggregate_usd,\n  COUNT(*) as transaction_volume\nFROM delta.${selectedAsset?.name || "active_table"}\nWHERE event_timestamp >= CURRENT_DATE - INTERVAL '7 DAYS'\nGROUP BY 1\nORDER BY 2 DESC;`,
      headers: ["hour_of_day", "aggregate_usd", "transaction_volume"],
      rows: [],
      confidence: 0,
      explanation: "No actual data returned. Connect a real data warehouse to see live metrics.",
      assumptions: "Assumes current clock context corresponds to local Eastern Standard Timezone alignments.",
      risks: "Underlying stream contains late-arriving logs up to 15m. Real-time metrics might fluctuate dynamically."
    };
    handleRunQuery(syntheticQuery);
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
                <div className="flex items-center gap-3">
                  <CollabHeaderPresence roomId="lakehouse-prod-1" />
                  <Button
                    onClick={() => setIsRagDialogOpen(true)}
                    className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs gap-2 rounded-xl h-9 px-3"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Semantic Vector Search
                  </Button>
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
              <div className="flex items-center gap-8 mt-8 border-t border-slate-800/40 pt-4 overflow-x-auto no-scrollbar">
                {[
                  { id: 'duckdb_wasm', label: 'DuckDB WASM Engine', icon: Cpu, badge: 'Vectorized' },
                  { id: 'catalog', label: 'Schema Explorer', icon: Table },
                  { id: 'history', label: 'Delta Time Travel', icon: Clock },
                  { id: 'medallion', label: 'Medallion Stage', icon: Box },
                  { id: 'lineage', label: 'Lineage Graph', icon: GitBranch },
                  { id: 'governance', label: 'Governance & PII', icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 pb-4 px-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-all relative shrink-0 ${
                      activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {tab.badge}
                      </span>
                    )}
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
                {/* Major Tab: DuckDB WASM Engine */}
                {activeTab === 'duckdb_wasm' && (
                  <motion.div 
                    key="duckdb_wasm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-6"
                  >
                    {/* Top Telemetry Header */}
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="space-y-1 text-left relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <Cpu className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                              DuckDB WASM Vectorized Engine
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                In-Browser SIMD Active
                              </span>
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-1">
                          Executes ANSI SQL queries locally in the browser utilizing vectorized SIMD and Apache Arrow memory buffers without requiring backend compute round-trips.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 relative z-10 shrink-0">
                        <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                          <span className="text-[9px] uppercase font-mono text-slate-500 block">Memory Table</span>
                          <span className="text-xs font-bold text-indigo-400 font-mono">
                            {selectedAsset.name.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_")}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            syncAssetToDuckDB(selectedAsset);
                            toast.success(`Reloaded '${selectedAsset.name}' into DuckDB WASM memory buffer.`);
                          }}
                          className="bg-slate-900 border-slate-800 text-xs font-bold hover:bg-slate-800 text-slate-300 gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Reload Buffer
                        </Button>
                      </div>
                    </div>

                    {/* Query Presets Toolbar */}
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        Vectorized Analytical Query Presets:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "revenue_by_region", label: "📊 Revenue by Region & Segment" },
                          { id: "top_accounts", label: "👑 Top Accounts & LTV Rank" },
                          { id: "latency_telemetry", label: "⚡ Latency & Status Profiler" },
                          { id: "cumulative_window", label: "📈 Cumulative Running Window" },
                          { id: "filter_recent", label: "🔍 High Value Filter (> $2,500)" },
                        ].map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => applyDuckDBPreset(preset.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              duckdbPreset === preset.id
                                ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SQL Editor Box */}
                    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-xl">
                      <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-indigo-400" />
                          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                            DuckDB SQL Query Console
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            (ANSI SQL-92 / DuckDB Extensions)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExplainDuckDB}
                            disabled={isDuckdbExecuting}
                            className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                          >
                            <Code2 className="h-3 w-3 mr-1" /> EXPLAIN Plan
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleExecuteDuckDB()}
                            disabled={isDuckdbExecuting}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-1.5"
                          >
                            {isDuckdbExecuting ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" /> Executing SIMD...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 fill-white" /> Run in DuckDB WASM
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950">
                        <textarea
                          rows={6}
                          value={duckdbSql}
                          onChange={(e) => setDuckdbSql(e.target.value)}
                          placeholder="SELECT * FROM table_name LIMIT 20;"
                          className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500/60 leading-relaxed resize-y"
                        />
                      </div>
                    </div>

                    {/* EXPLAIN Plan Box if active */}
                    {duckdbExplainPlan && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-2xl border border-indigo-500/30 overflow-hidden bg-slate-950 p-4 space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-400" /> Vectorized Physical Plan Tree
                          </span>
                          <button
                            onClick={() => setDuckdbExplainPlan(null)}
                            className="text-xs text-slate-500 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <pre className="p-3 bg-slate-900/90 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
                          {duckdbExplainPlan}
                        </pre>
                      </motion.div>
                    )}

                    {/* Tabular Result Grid */}
                    {duckdbResult && (
                      <div className="space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              DuckDB Output Grid
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                              ⚡ {duckdbResult.executionTimeMs}ms • {duckdbResult.rowCount} rows • {duckdbResult.columns.length} columns
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleExportDuckDBCsv}
                              className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                            >
                              <Download className="h-3 w-3 mr-1" /> Export CSV
                            </Button>
                          </div>
                        </div>

                        {/* Result Table */}
                        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-900/80 border-b border-slate-800 font-mono text-slate-400 text-[11px]">
                                <tr>
                                  <th className="p-3 uppercase font-bold tracking-wider w-12 text-slate-600 text-center">#</th>
                                  {duckdbResult.columns.map((col, idx) => (
                                    <th key={idx} className="p-3 uppercase font-bold tracking-wider">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300 text-xs">
                                {duckdbResult.rows
                                  .slice(duckdbPage * DUCKDB_PAGE_SIZE, (duckdbPage + 1) * DUCKDB_PAGE_SIZE)
                                  .map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-900/30 transition-colors">
                                      <td className="p-3 text-slate-600 text-center text-[10px]">
                                        {duckdbPage * DUCKDB_PAGE_SIZE + rIdx + 1}
                                      </td>
                                      {duckdbResult.columns.map((col, cIdx) => (
                                        <td key={cIdx} className="p-3 whitespace-nowrap">
                                          {row[col] === null || row[col] === undefined
                                            ? <span className="text-slate-600 italic">NULL</span>
                                            : typeof row[col] === "number"
                                            ? <span className="text-emerald-400 font-semibold">{row[col].toLocaleString()}</span>
                                            : String(row[col])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Footer */}
                          {duckdbResult.rowCount > DUCKDB_PAGE_SIZE && (
                            <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                              <span>
                                Showing {duckdbPage * DUCKDB_PAGE_SIZE + 1} - {Math.min((duckdbPage + 1) * DUCKDB_PAGE_SIZE, duckdbResult.rowCount)} of {duckdbResult.rowCount} rows
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={duckdbPage === 0}
                                  onClick={() => setDuckdbPage(p => Math.max(0, p - 1))}
                                  className="h-7 px-2 text-xs"
                                >
                                  Prev
                                </Button>
                                <span className="px-2 font-bold text-white">
                                  {duckdbPage + 1} / {Math.ceil(duckdbResult.rowCount / DUCKDB_PAGE_SIZE)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={(duckdbPage + 1) * DUCKDB_PAGE_SIZE >= duckdbResult.rowCount}
                                  onClick={() => setDuckdbPage(p => p + 1)}
                                  className="h-7 px-2 text-xs"
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

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
                          { id: 'governance', label: 'SOC2 Governance & SIEM', icon: Shield },
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
                        {/* Automated Data Drift Detection Banner */}
                        <div className="flex items-center justify-between p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              <Activity className="h-4 w-4 text-amber-400" /> Automated Distribution Drift Detection (KS & Wasserstein Tests)
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Statistical feature distribution shift monitoring comparing baseline vs streaming window distributions.
                            </p>
                          </div>
                          <Button
                            onClick={handleDetectDataDrift}
                            disabled={isDetectingDrift}
                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs px-4 rounded-xl gap-2 h-9"
                          >
                            <Activity className="h-3.5 w-3.5" />
                            {isDetectingDrift ? "Calculating KS Drift..." : "Run Statistical Drift Analytics"}
                          </Button>
                        </div>

                        {driftData && (
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Distribution Drift Report: {driftData.datasetName} ({driftData.featureColumn})
                              </span>
                              <span className={`px-2.5 py-1 rounded text-xs font-black uppercase ${
                                driftData.alertSeverity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                Severity: {driftData.alertSeverity}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">KS Statistic (D)</span>
                                <p className="text-sm font-mono font-bold text-indigo-400">{driftData.ksStatistic}</p>
                              </div>
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">p-Value</span>
                                <p className="text-sm font-mono font-bold text-indigo-400">{driftData.pValue}</p>
                              </div>
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Wasserstein Distance</span>
                                <p className="text-sm font-mono font-bold text-indigo-400">{driftData.wassersteinDistance}</p>
                              </div>
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">PSI Score</span>
                                <p className="text-sm font-mono font-bold text-indigo-400">{driftData.psiScore}</p>
                              </div>
                            </div>
                            <p className="text-xs text-amber-300/90 font-medium bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl">
                              {driftData.recommendedAction}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-indigo-400" /> Great Expectations / Soda Data Quality Engine
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Automated assertion checks running on Bronze/Silver/Gold ingestion pipelines with quarantine alerts.
                            </p>
                          </div>
                          <Button
                            onClick={handleRunQualityChecks}
                            disabled={isRunningQualityChecks}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl gap-2 h-9"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {isRunningQualityChecks ? "Evaluating Suite..." : "Run Great Expectations Suite"}
                          </Button>
                        </div>


                        {qualitySuiteData && (
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Suite Results for {qualitySuiteData.datasetName} ({qualitySuiteData.layer} Layer)
                              </span>
                              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
                                Score: {qualitySuiteData.overallScore}% ({qualitySuiteData.passedChecks}/{qualitySuiteData.totalChecks} Passed)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {qualitySuiteData.assertions.map((a: any) => (
                                <div key={a.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-mono text-indigo-400 font-bold">{a.expectationType}</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                      a.status === "PASSED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                      {a.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300">Target Column: <span className="font-bold text-white">{a.targetColumn}</span></p>
                                  <p className="text-[10px] text-slate-500 font-mono">Evaluated Rows: {a.evaluatedRows.toLocaleString()} | Failed: {a.failedRowsCount} ({a.unexpectedPercent}%)</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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

                    {/* Sub Tab: SOC2 Governance & SIEM Audit Stream */}
                    {catalogSubTab === 'governance' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-indigo-400" /> Real-Time SOC2 / ISO 27001 SIEM Audit Stream
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Stream real-time compliance events, PII column encryption logs, and IAM escalation alerts directly into Splunk or Datadog.
                            </p>
                          </div>
                          <Button
                            onClick={handleExportSiemAudit}
                            disabled={isExportingSiem}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl gap-2 h-9"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {isExportingSiem ? "Streaming SIEM Logs..." : "Export SOC2 Audit to Splunk / Datadog"}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Live Audit Log Stream
                          </h4>
                          <div className="space-y-2">
                            {[
                              { id: "evt-9901", time: "2 mins ago", cat: "Data Encryption", actor: "system-auto-masker", action: "SHA-256 Column Encryption Applied to customer_email", status: "SUCCESS" },
                              { id: "evt-9902", time: "5 mins ago", cat: "Access Control", actor: "m.chen@vivexa.ai", action: "IAM Role Escalation Request Approved for Unity Catalog", status: "SUCCESS" },
                              { id: "evt-9903", time: "12 mins ago", cat: "Governance Policy", actor: "cfo-discount-engine", action: "Quarantine Alert: Transaction Discount > 15%", status: "FLAGGED" }
                            ].map((evt) => (
                              <div key={evt.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    evt.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {evt.cat}
                                  </span>
                                  <div>
                                    <p className="font-bold text-white">{evt.action}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">Actor: {evt.actor} • {evt.time}</p>
                                  </div>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500">{evt.id}</span>
                              </div>
                            ))}
                          </div>
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
                    className="rounded-3xl bg-slate-950 border border-slate-800 p-6 relative overflow-hidden space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Network className="h-4 w-4 text-indigo-400" /> Data Lineage & dbt Core DAG Visualizer
                        </h3>
                        <p className="text-xs text-slate-400">
                          End-to-end lineage mapping from raw S3 landing through dbt transformation models to Gold analytics.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleTriggerDbtJob}
                          disabled={isTriggeringDbtJob}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 rounded-xl h-9"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          {isTriggeringDbtJob ? "Triggering..." : "Trigger dbt Cloud Job"}
                        </Button>
                        <Button
                          onClick={handleLoadDbtDag}
                          disabled={isImportingDbt}
                          className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs gap-2 rounded-xl h-9"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isImportingDbt ? "Parsing dbt..." : dbtDagNodes.length > 0 ? "Re-sync dbt schema.yml" : "Import dbt schema.yml DAG"}
                        </Button>
                      </div>
                    </div>

                    {dbtCloudRunData && (
                      <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                              dbt Cloud Run #{dbtCloudRunData.runId}
                            </span>
                            <span className="text-xs font-bold text-white">{dbtCloudRunData.cause}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase animate-pulse">
                            Status: {dbtCloudRunData.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                          {dbtCloudRunData.steps.map((step: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                              <span className="text-slate-300">{step.name}</span>
                              <span className={`text-[9px] font-bold uppercase ${
                                step.status === 'PASSED' ? 'text-emerald-400' : step.status === 'RUNNING' ? 'text-indigo-400 animate-pulse' : 'text-slate-500'
                              }`}>
                                {step.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dbtDagNodes.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span>dbt Core DAG Nodes ({dbtDagNodes.length})</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">dbt v1.8</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {dbtDagNodes.map((node: any) => (
                            <div key={node.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 hover:border-indigo-500/50 transition-all">
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  node.resourceType === 'source' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  node.resourceType === 'test' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                  {node.resourceType}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{node.schema}</span>
                              </div>
                              <h4 className="text-xs font-bold text-white truncate">{node.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Materialization: <span className="text-indigo-400 font-bold">{node.materialization}</span>
                              </p>
                              {node.parents.length > 0 && (
                                <p className="text-[9px] text-slate-500 truncate">
                                  Parents: {node.parents.map((p: string) => p.split('.').pop()).join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[320px] flex flex-col items-center justify-center space-y-8 relative">
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
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Raw Source</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        <span className="font-bold text-indigo-400 uppercase tracking-widest">dbt Incremental Model</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="font-bold text-emerald-400 uppercase tracking-widest">Gold Analytical Mart</span>
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
                      <CardHeader className="bg-slate-900/50 p-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                          <Fingerprint className="h-4 w-4 text-indigo-400" /> Entitlement Registry
                        </CardTitle>
                        <Button
                          size="sm"
                          onClick={() => {
                            const name = prompt("Enter principal name (e.g. Security Audit Service):");
                            if (name && name.trim()) {
                              setEntitlements(prev => [
                                ...prev,
                                { principal: name.trim(), role: 'READ_ONLY', status: 'Authorized' }
                              ]);
                              toast.success(`Granted READ_ONLY access to ${name.trim()}`);
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-3.5 h-8 gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" /> Grant Entitlement
                        </Button>
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

      <RagSearchDialog isOpen={isRagDialogOpen} onClose={() => setIsRagDialogOpen(false)} />
    </div>
  );
}
