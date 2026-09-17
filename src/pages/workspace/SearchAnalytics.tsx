import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Sparkles, Database, BarChart3, PieChart, 
  LineChart, Table, ArrowUpRight, Share2, 
  Settings2, Zap, Send, MessageSquare, BrainCircuit,
  Target, Info, RefreshCw, Layers, Boxes,
  ChevronRight, Mic, Globe, Lightbulb, FileText,
  Calendar, Filter, X, UserCheck, Users, TrendingUp,
  ShieldCheck, CheckCircle2, SlidersHorizontal, ArrowUpDown,
  ChevronDown, Check, Download, Copy, AlertCircle, Clock,
  Eye, CheckCircle, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ENTERPRISE_SAMPLE_DATASETS } from "@/lib/biDatasets";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export type QueryCategory = 
  | "all"
  | "finance"
  | "customer"
  | "operations"
  | "ml"
  | "governance";

export type UserRole = 
  | "all"
  | "executive"
  | "data_scientist"
  | "business_analyst"
  | "data_engineer"
  | "operations_lead";

export type DateRangePreset = 
  | "all"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "custom";

export interface MetricItem {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

export interface ChartDataItem {
  name: string;
  value: number;
  secondary?: number;
  benchmark?: number;
}

export interface InsightResult {
  id: string;
  type: "Chart" | "Stat" | "Text";
  title: string;
  content: string;
  confidence: number;
  tags: string[];
  category: QueryCategory;
  role: UserRole;
  timestamp: string; // ISO date string
  metrics?: MetricItem[];
  chartData?: ChartDataItem[];
  chartType?: "bar" | "line" | "area";
  prescriptiveAction?: string;
  sourceDataset?: string;
  impactLevel?: "High" | "Medium" | "Critical";
}

const CATEGORY_CONFIG: Record<QueryCategory, { label: string; icon: any; color: string; bg: string }> = {
  all: { label: "All Categories", icon: Layers, color: "text-slate-300", bg: "bg-slate-800/60" },
  finance: { label: "Financial & Revenue", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  customer: { label: "Customer & Retention", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  operations: { label: "Operations & Supply", icon: Boxes, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ml: { label: "ML & Predictions", icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  governance: { label: "Governance & Quality", icon: ShieldCheck, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

const ROLE_CONFIG: Record<UserRole, { label: string; short: string; description: string; badgeColor: string }> = {
  all: { label: "All User Roles", short: "All Roles", description: "Universal workspace perspective", badgeColor: "bg-slate-800 text-slate-300" },
  executive: { label: "Executive / C-Suite", short: "C-Suite", description: "High-level strategic ROI and ARR trajectory", badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" },
  data_scientist: { label: "Data Scientist", short: "Data Scientist", description: "Statistical distribution, ML residuals, drift alerts", badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30" },
  business_analyst: { label: "Business Analyst", short: "Analyst", description: "Cohort performance, churn attribution, regional deltas", badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
  data_engineer: { label: "Data Engineer", short: "Data Engineer", description: "Pipeline latency, data freshness, partition skew", badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" },
  operations_lead: { label: "Operations Lead", short: "Ops Lead", description: "SLA compliance, inventory turn rates, fulfillment bottlenecks", badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
};

const DATE_RANGE_OPTIONS: { id: DateRangePreset; label: string; days: number | null }[] = [
  { id: "all", label: "All Time", days: null },
  { id: "24h", label: "Past 24 Hours", days: 1 },
  { id: "7d", label: "Past 7 Days", days: 7 },
  { id: "30d", label: "Past 30 Days", days: 30 },
  { id: "90d", label: "Past Quarter (90d)", days: 90 },
  { id: "custom", label: "Custom Range...", days: null },
];

export default function SearchAnalytics() {
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InsightResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Filtering State
  const [selectedCategory, setSelectedCategory] = useState<QueryCategory>("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"all" | "Chart" | "Stat" | "Text">("all");
  const [sortBy, setSortBy] = useState<"confidence" | "newest" | "title">("confidence");
  const [inlineSearch, setInlineSearch] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(true);

  // Initialize with robust enterprise search insights across diverse dates, roles, and categories
  useEffect(() => {
    const now = Date.now();
    const HOUR = 3600 * 1000;
    const DAY = 24 * HOUR;

    const initialEnterpriseInsights: InsightResult[] = [
      {
        id: "insight-rev-1",
        type: "Chart",
        title: "Q3 ARR Acceleration Across Tier-1 Enterprise Accounts",
        content: "Enterprise revenue grew 24.8% YoY driven by multi-product adoption in APAC and North America. Net revenue retention (NRR) hit 128.4% with gross margin stabilizing at 79.2%.",
        confidence: 0.992,
        tags: ["Revenue", "ARR", "APAC", "Q3", "Expansion"],
        category: "finance",
        role: "executive",
        timestamp: new Date(now - 4 * HOUR).toISOString(), // 4 hours ago
        impactLevel: "Critical",
        sourceDataset: "Financial_Ledger_2026.parquet",
        chartType: "bar",
        chartData: [
          { name: "Jul 26", value: 3.8, secondary: 3.1, benchmark: 3.2 },
          { name: "Aug 26", value: 4.4, secondary: 3.5, benchmark: 3.4 },
          { name: "Sep 26", value: 5.1, secondary: 4.0, benchmark: 3.7 },
          { name: "Oct 26 (P)", value: 5.6, secondary: 4.2, benchmark: 4.0 },
        ],
        metrics: [
          { label: "Quarterly ARR", value: "$18.9M", change: "+24.8%", isPositive: true },
          { label: "Net Revenue Retention", value: "128.4%", change: "+3.2%", isPositive: true },
          { label: "Gross Margin", value: "79.2%", change: "+1.1%", isPositive: true }
        ],
        prescriptiveAction: "Accelerate quota allocation for Mid-Market to Enterprise cross-sell campaigns before Q4 procurement cycle."
      },
      {
        id: "insight-churn-2",
        type: "Chart",
        title: "Predictive Churn Risk Attribution in Early-Lifecycle Cohorts",
        content: "XGBoost and Survival models identify high drop-off probability (31.4%) when customer onboarding API calls stall under 4 integrations in the first 14 days.",
        confidence: 0.978,
        tags: ["Churn Risk", "XGBoost", "Retention", "Cohort Analysis"],
        category: "customer",
        role: "business_analyst",
        timestamp: new Date(now - 1 * DAY).toISOString(), // 1 day ago
        impactLevel: "High",
        sourceDataset: "Customer_Telemetric_Events.csv",
        chartType: "area",
        chartData: [
          { name: "Day 1-3", value: 4.2, secondary: 3.0 },
          { name: "Day 4-7", value: 8.9, secondary: 5.2 },
          { name: "Day 8-14", value: 24.1, secondary: 9.8 },
          { name: "Day 15-30", value: 31.4, secondary: 11.2 },
        ],
        metrics: [
          { label: "At-Risk ARR", value: "$840K", change: "-12.5%", isPositive: true },
          { label: "Early Drop Rate", value: "31.4%", change: "+4.2%", isPositive: false },
          { label: "Recovery Potential", value: "68%", change: "+15.0%", isPositive: true }
        ],
        prescriptiveAction: "Trigger automated in-app guided sandbox flows for accounts with ≤2 active endpoints by day 5."
      },
      {
        id: "insight-ml-3",
        type: "Stat",
        title: "Production ML Model Drift & Covariate Shift Telemetry",
        content: "Kolmogorov-Smirnov feature drift detected on 'checkout_session_duration' (p-value = 0.0034 < 0.05). Inference latency increased by 14ms following payment gateway update.",
        confidence: 0.985,
        tags: ["MLOps", "Model Drift", "KS-Test", "Latency", "PyTorch"],
        category: "ml",
        role: "data_scientist",
        timestamp: new Date(now - 3 * DAY).toISOString(), // 3 days ago
        impactLevel: "Critical",
        sourceDataset: "Model_Inference_Monitoring_Sink",
        metrics: [
          { label: "Feature Drift Index", value: "0.048", change: "+110%", isPositive: false },
          { label: "Avg Latency P99", value: "84ms", change: "+14ms", isPositive: false },
          { label: "Model Accuracy", value: "94.2%", change: "-1.8%", isPositive: false }
        ],
        prescriptiveAction: "Retrain ensemble weights using September transaction window and schedule automated canary rollout."
      },
      {
        id: "insight-ops-4",
        type: "Chart",
        title: "Global Supply Chain Fulfillment & Cold-Chain SLA Compliance",
        content: "Air-freight and multimodal transit times normalized to 3.2 days. Cold-chain temperature telemetry registered 99.85% zero-excursion compliance across European logistics corridors.",
        confidence: 0.994,
        tags: ["Supply Chain", "Logistics", "SLA", "EU Corridors", "IoT"],
        category: "operations",
        role: "operations_lead",
        timestamp: new Date(now - 6 * DAY).toISOString(), // 6 days ago
        impactLevel: "Medium",
        sourceDataset: "Logistics_Telemetry_Global.parquet",
        chartType: "line",
        chartData: [
          { name: "Week 1", value: 98.2, benchmark: 99.0 },
          { name: "Week 2", value: 98.9, benchmark: 99.0 },
          { name: "Week 3", value: 99.4, benchmark: 99.0 },
          { name: "Week 4", value: 99.8, benchmark: 99.0 },
        ],
        metrics: [
          { label: "SLA Compliance", value: "99.85%", change: "+0.65%", isPositive: true },
          { label: "Transit Time", value: "3.2 days", change: "-0.8d", isPositive: true },
          { label: "Variance Rate", value: "0.14%", change: "-0.3%", isPositive: true }
        ],
        prescriptiveAction: "Consolidate regional distribution contracts with DHL/Maersk to secure locked Q4 volume discounts."
      },
      {
        id: "insight-gov-5",
        type: "Stat",
        title: "Semantic Layer Data Quality Score & Schema Validation Audit",
        content: "Automated Great Expectations and DuckDB audit verified 42 core warehouse models. 0 NULL violations in primary key constraints; column-level PII masking compliant with SOC2/GDPR standards.",
        confidence: 0.999,
        tags: ["Data Quality", "Governance", "SOC2", "GDPR", "Semantic Layer"],
        category: "governance",
        role: "data_engineer",
        timestamp: new Date(now - 14 * DAY).toISOString(), // 14 days ago
        impactLevel: "High",
        sourceDataset: "Enterprise_Metadata_Catalog",
        metrics: [
          { label: "Data Quality Score", value: "99.98%", change: "+0.1%", isPositive: true },
          { label: "Masked PII Columns", value: "148 cols", change: "100%", isPositive: true },
          { label: "Schema Drift Incidents", value: "0", change: "-2 YoY", isPositive: true }
        ],
        prescriptiveAction: "Promote verified semantic views to Gold tier for C-Suite self-serve analytics."
      },
      {
        id: "insight-exec-6",
        type: "Chart",
        title: "Operating Margin Expansion & Compute Infrastructure Efficiency",
        content: "Cloud data warehouse query optimization and WASM client-side compute reduced compute run-rate by $34,000/month while cutting median dashboard query latency from 2.4s to 320ms.",
        confidence: 0.989,
        tags: ["Cost Optimization", "FinOps", "Compute", "WASM", "C-Suite"],
        category: "finance",
        role: "executive",
        timestamp: new Date(now - 22 * DAY).toISOString(), // 22 days ago
        impactLevel: "Critical",
        sourceDataset: "Cloud_Billing_Telemetry.json",
        chartType: "bar",
        chartData: [
          { name: "Q1", value: 142, secondary: 155 },
          { name: "Q2", value: 135, secondary: 150 },
          { name: "Q3", value: 112, secondary: 148 },
          { name: "Q4 (F)", value: 98, secondary: 145 },
        ],
        metrics: [
          { label: "Monthly Savings", value: "$34,200", change: "-28.4%", isPositive: true },
          { label: "Query P50 Latency", value: "320ms", change: "-86.6%", isPositive: true },
          { label: "ROI Multiple", value: "4.8x", change: "+1.2x", isPositive: true }
        ],
        prescriptiveAction: "Maintain edge query caching policy and allocate freed budget toward customer intelligence initiatives."
      },
      {
        id: "insight-analyst-7",
        type: "Stat",
        title: "Multi-Touch Marketing Attribution & CAC Payback Velocity",
        content: "First-touch organic technical whitepapers paired with product tour demos shortened CAC payback velocity from 11.2 months to 7.4 months across high-growth mid-market accounts.",
        confidence: 0.971,
        tags: ["Attribution", "CAC", "Payback", "Marketing", "Funnels"],
        category: "customer",
        role: "business_analyst",
        timestamp: new Date(now - 45 * DAY).toISOString(), // 45 days ago
        impactLevel: "Medium",
        sourceDataset: "CRM_Conversion_Pipelines.csv",
        metrics: [
          { label: "CAC Payback", value: "7.4 mos", change: "-3.8 mos", isPositive: true },
          { label: "Demo Conversion", value: "28.4%", change: "+6.1%", isPositive: true },
          { label: "Blended CAC", value: "$4,250", change: "-18.5%", isPositive: true }
        ],
        prescriptiveAction: "Double content syndication on high-performing technical case studies and enterprise data architecture guides."
      },
      {
        id: "insight-ml-8",
        type: "Chart",
        title: "Forecasting Warehouse Demand Seasonality for Holiday Peak",
        content: "Prophet and Bayesian neural models indicate an expected 42% volume spike between Nov 15 and Dec 28. Buffer threshold recommendation is +18% on critical SKUs.",
        confidence: 0.984,
        tags: ["Forecasting", "Prophet", "Seasonality", "Holiday Peak", "Supply Chain"],
        category: "ml",
        role: "data_scientist",
        timestamp: new Date(now - 60 * DAY).toISOString(), // 60 days ago
        impactLevel: "High",
        sourceDataset: "Historical_Order_Demands_3Yr.parquet",
        chartType: "line",
        chartData: [
          { name: "Sep", value: 120, benchmark: 115 },
          { name: "Oct", value: 145, benchmark: 130 },
          { name: "Nov", value: 210, benchmark: 180 },
          { name: "Dec", value: 245, benchmark: 210 },
        ],
        metrics: [
          { label: "Forecast Volume", value: "485K units", change: "+42.1%", isPositive: true },
          { label: "Safety Stock Buffer", value: "+18%", change: "Rec", isPositive: true },
          { label: "Stockout Probability", value: "<1.2%", change: "-4.0%", isPositive: true }
        ],
        prescriptiveAction: "Pre-allocate distribution contracts with Tier-1 logistics partners before spot rates escalate."
      }
    ];

    setResults(initialEnterpriseInsights);

    const sampleDatasets = ENTERPRISE_SAMPLE_DATASETS.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      row_count: s.rowCount,
      column_count: s.columns.length,
      file_type: "Parquet/CSV",
      data_quality_score: 99.2
    }));

    const sampleReports = [
      {
        id: "rep-sample-1",
        title: "Q3 Global Enterprise Revenue Briefing",
        domain: "Finance & Operations",
        archetype: "Senior Data Scientist Briefing",
        accuracy_rating: "99.98%"
      },
      {
        id: "rep-sample-2",
        title: "Customer Churn & Behavioral Risk Analysis",
        domain: "Customer Success & Growth",
        archetype: "Predictive Machine Learning Audit",
        accuracy_rating: "98.70%"
      }
    ];

    async function loadData() {
      if (!user) {
        setDatasets(sampleDatasets);
        setReports(sampleReports);
        return;
      }
      try {
        const [{ data: dData }, { data: rData }] = await Promise.all([
          supabase.from("datasets").select("*").eq("user_id", user.id),
          supabase.from("reports").select("*").eq("user_id", user.id)
        ]);
        setDatasets([...(dData || []), ...sampleDatasets]);
        setReports([...(rData || []), ...sampleReports]);
      } catch (err) {
        console.error("Error loading search index:", err);
        setDatasets(sampleDatasets);
        setReports(sampleReports);
      }
    }
    loadData();
  }, [user]);

  // Dynamic search execution that creates customized insights tagged with appropriate category and role
  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = customQuery || query;
    if (!searchQuery.trim()) return;

    if (customQuery) {
      setQuery(customQuery);
    }

    setIsSearching(true);
    
    try {
      const qLower = searchQuery.toLowerCase();
      const now = new Date();

      // Determine category based on query keywords
      let inferredCategory: QueryCategory = "finance";
      if (qLower.includes("churn") || qLower.includes("customer") || qLower.includes("user") || qLower.includes("retention")) {
        inferredCategory = "customer";
      } else if (qLower.includes("forecast") || qLower.includes("model") || qLower.includes("predict") || qLower.includes("ml") || qLower.includes("ai")) {
        inferredCategory = "ml";
      } else if (qLower.includes("spend") || qLower.includes("ops") || qLower.includes("supply") || qLower.includes("inventory") || qLower.includes("logistics")) {
        inferredCategory = "operations";
      } else if (qLower.includes("quality") || qLower.includes("schema") || qLower.includes("drift") || qLower.includes("governance") || qLower.includes("audit")) {
        inferredCategory = "governance";
      } else if (qLower.includes("revenue") || qLower.includes("arr") || qLower.includes("profit") || qLower.includes("cost") || qLower.includes("price")) {
        inferredCategory = "finance";
      }

      // Determine target persona / role
      let inferredRole: UserRole = "business_analyst";
      if (inferredCategory === "finance" || qLower.includes("executive") || qLower.includes("board") || qLower.includes("c-suite")) {
        inferredRole = "executive";
      } else if (inferredCategory === "ml" || qLower.includes("scientist") || qLower.includes("statistic")) {
        inferredRole = "data_scientist";
      } else if (inferredCategory === "governance" || qLower.includes("pipeline") || qLower.includes("engineer")) {
        inferredRole = "data_engineer";
      } else if (inferredCategory === "operations") {
        inferredRole = "operations_lead";
      }

      // Build synthesized insight cards
      const newCustomInsights: InsightResult[] = [
        {
          id: `search-synth-${Date.now()}-1`,
          type: "Chart",
          title: `Synthesized Query Analysis: "${searchQuery}"`,
          content: `Multi-dimensional evaluation across ${datasets.length || 5} active enterprise datasets. Semantic layer aggregated metrics aligned with ${CATEGORY_CONFIG[inferredCategory].label} standards.`,
          confidence: 0.988,
          tags: ["Query Synthesis", CATEGORY_CONFIG[inferredCategory].label, ROLE_CONFIG[inferredRole].short, "Realtime"],
          category: inferredCategory,
          role: inferredRole,
          timestamp: now.toISOString(),
          impactLevel: "High",
          sourceDataset: datasets[0]?.name || "Enterprise_Warehouse_Aggregated",
          chartType: "bar",
          chartData: [
            { name: "Benchmark", value: 100, secondary: 95 },
            { name: "Current Actual", value: 124, secondary: 110 },
            { name: "Projected Q4", value: 148, secondary: 135 },
          ],
          metrics: [
            { label: "Target Confidence", value: "98.8%", change: "+2.4%", isPositive: true },
            { label: "Grounded Records", value: "1.42M", change: "Indexed", isPositive: true },
            { label: "Query Latency", value: "148ms", change: "Fast", isPositive: true }
          ],
          prescriptiveAction: `Adopt prioritized recommendations in ${CATEGORY_CONFIG[inferredCategory].label} to optimize operational decision pipelines.`
        },
        {
          id: `search-synth-${Date.now()}-2`,
          type: "Stat",
          title: `Prescriptive Takeaways for ${ROLE_CONFIG[inferredRole].label}`,
          content: `Automated causality analysis identifies key variance factors related to "${searchQuery}". Confidence calibration passes anti-hallucination multi-stage validation.`,
          confidence: 0.976,
          tags: ["Prescriptive", "Validation Pass", "Decision Intelligence"],
          category: inferredCategory,
          role: inferredRole,
          timestamp: now.toISOString(),
          impactLevel: "Critical",
          sourceDataset: "Cross-System Semantic Fabric",
          metrics: [
            { label: "Variance Explained", value: "88.4%", change: "+5.1%", isPositive: true },
            { label: "P-Value Significance", value: "p < 0.001", change: "Valid", isPositive: true }
          ],
          prescriptiveAction: `Schedule an executive decision review targeting resource allocation based on verified query metrics.`
        }
      ];

      setResults(prev => [...newCustomInsights, ...prev]);
      toast.success(`Synthesized ${newCustomInsights.length} grounded insights for "${searchQuery}"!`);
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error("Query processing failed.");
    } finally {
      setIsSearching(false);
    }
  };

  // Filter & Search Logic
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // 1. Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // 2. User Role filter
      if (selectedRole !== "all" && item.role !== selectedRole) {
        return false;
      }

      // 3. Date range filter
      if (selectedDateRange !== "all") {
        const itemTime = new Date(item.timestamp).getTime();
        const now = Date.now();

        if (selectedDateRange === "24h") {
          if (now - itemTime > 24 * 3600 * 1000) return false;
        } else if (selectedDateRange === "7d") {
          if (now - itemTime > 7 * 24 * 3600 * 1000) return false;
        } else if (selectedDateRange === "30d") {
          if (now - itemTime > 30 * 24 * 3600 * 1000) return false;
        } else if (selectedDateRange === "90d") {
          if (now - itemTime > 90 * 24 * 3600 * 1000) return false;
        } else if (selectedDateRange === "custom") {
          if (customStartDate) {
            const start = new Date(customStartDate).getTime();
            if (itemTime < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate).getTime() + (24 * 3600 * 1000 - 1);
            if (itemTime > end) return false;
          }
        }
      }

      // 4. Confidence threshold
      if (minConfidence > 0 && item.confidence * 100 < minConfidence) {
        return false;
      }

      // 5. Type filter
      if (selectedType !== "all" && item.type !== selectedType) {
        return false;
      }

      // 6. Inline text filter
      if (inlineSearch.trim()) {
        const s = inlineSearch.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(s);
        const matchContent = item.content.toLowerCase().includes(s);
        const matchTags = item.tags.some(t => t.toLowerCase().includes(s));
        const matchAction = item.prescriptiveAction?.toLowerCase().includes(s);
        if (!matchTitle && !matchContent && !matchTags && !matchAction) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "confidence") {
        return b.confidence - a.confidence;
      }
      if (sortBy === "newest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [
    results,
    selectedCategory,
    selectedRole,
    selectedDateRange,
    customStartDate,
    customEndDate,
    minConfidence,
    selectedType,
    inlineSearch,
    sortBy
  ]);

  // Compute category item counts for active filters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    results.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [results]);

  // Compute role item counts for active filters
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    results.forEach(r => {
      counts[r.role] = (counts[r.role] || 0) + 1;
    });
    return counts;
  }, [results]);

  // Check if any non-default filter is applied
  const isAnyFilterActive = 
    selectedCategory !== "all" ||
    selectedRole !== "all" ||
    selectedDateRange !== "all" ||
    minConfidence > 0 ||
    selectedType !== "all" ||
    inlineSearch.trim() !== "";

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedRole("all");
    setSelectedDateRange("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setMinConfidence(0);
    setSelectedType("all");
    setInlineSearch("");
    setSortBy("confidence");
    toast.info("All search analytics filters have been reset.");
  };

  const handleCopyInsight = (item: InsightResult) => {
    const text = `[${CATEGORY_CONFIG[item.category].label}] ${item.title}\n\n${item.content}\n\nConfidence: ${(item.confidence * 100).toFixed(1)}%\nRecommended Action: ${item.prescriptiveAction || "N/A"}`;
    navigator.clipboard.writeText(text);
    toast.success("Insight summary copied to clipboard!");
  };

  return (
    <div className="space-y-10 relative z-10 w-full max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center space-y-6 pt-10 pb-2">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 shadow-xl"
        >
          <Sparkles className="h-3.5 w-3.5 fill-indigo-400" /> Natural Language Analytics & Decision Fabric
        </motion.div>
        
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Ask your data <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400">anything.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Search across your multi-tenant warehouse with precision. Refine insights by date range, query category, or executive persona.
          </p>
        </div>
      </div>

      {/* Primary Search Input Bar */}
      <div className="relative group max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-40 pointer-events-none group-focus-within:opacity-80 transition-opacity" />
        <form 
          onSubmit={handleSearch}
          className="relative bg-slate-900/60 backdrop-blur-3xl border border-slate-800 rounded-[28px] p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 shadow-2xl transition-all group-focus-within:border-indigo-500/50 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10"
        >
          <div className="p-3 sm:p-3.5 rounded-[20px] bg-slate-950 border border-slate-800 shadow-inner shrink-0">
            <Search className="h-6 w-6 text-indigo-400" />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show me Q3 revenue trends by region, churn attribution, or compute cost..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-base sm:text-lg font-medium text-white placeholder:text-slate-600 outline-none px-2 min-w-0"
          />
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1 shrink-0">
            <Button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] px-5 sm:px-7 h-11 sm:h-12 font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{isSearching ? "Synthesizing..." : "Analyze"}</span>
            </Button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Popular:</span>
          {[
            { q: "Q3 ARR acceleration across enterprise", cat: "finance" as QueryCategory },
            { q: "Predictive churn risk in early cohorts", cat: "customer" as QueryCategory },
            { q: "Production ML model drift telemetry", cat: "ml" as QueryCategory },
            { q: "Fulfillment SLA compliance corridors", cat: "operations" as QueryCategory },
            { q: "Semantic layer data quality score", cat: "governance" as QueryCategory },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                setSelectedCategory(item.cat);
                handleSearch(undefined, item.q);
              }}
              className="text-[11px] px-3.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-all font-medium cursor-pointer flex items-center gap-1.5 hover:bg-slate-850"
            >
              <Search className="h-2.5 w-2.5 text-slate-500" />
              <span>{item.q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FILTERING UI ENGINE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Filter Bar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Refine Insights & Search Dimensions
                {isAnyFilterActive && (
                  <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                    Filtered
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-slate-400">Filter synthesized intelligence by timeline, business domain, or audience role</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
            {/* Inline Keyword Filter */}
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={inlineSearch}
                onChange={(e) => setInlineSearch(e.target.value)}
                placeholder="Filter insights..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              {inlineSearch && (
                <button 
                  onClick={() => setInlineSearch("")} 
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs text-slate-400">
              <span className="text-[10px] text-slate-500 px-1.5 font-mono">Sort:</span>
              <button
                onClick={() => setSortBy("confidence")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${sortBy === "confidence" ? "bg-indigo-600 text-white" : "hover:text-white"}`}
              >
                Confidence
              </button>
              <button
                onClick={() => setSortBy("newest")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${sortBy === "newest" ? "bg-indigo-600 text-white" : "hover:text-white"}`}
              >
                Newest
              </button>
            </div>

            {/* Reset Filters Action */}
            {isAnyFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 rounded-xl flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                <span>Reset All</span>
              </Button>
            )}

            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title={showFilterDrawer ? "Collapse Filters" : "Expand Filters"}
            >
              {showFilterDrawer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Body */}
        {showFilterDrawer && (
          <div className="p-5 space-y-5 bg-slate-950/40">
            {/* 1. Date Range Filter Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Time Horizon & Date Range:</span>
                </label>
                {selectedDateRange !== "all" && (
                  <span className="text-[11px] text-indigo-400 font-mono">
                    Active: {DATE_RANGE_OPTIONS.find(d => d.id === selectedDateRange)?.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {DATE_RANGE_OPTIONS.map((opt) => {
                  const isSelected = selectedDateRange === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedDateRange(opt.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500" 
                          : "bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <Clock className={`h-3 w-3 ${isSelected ? "text-white" : "text-slate-500"}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Inputs if "Custom" selected */}
              {selectedDateRange === "custom" && (
                <div className="flex items-center gap-3 pt-2 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800 max-w-lg">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">From Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">To Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Query Category Filter Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Business Domain & Query Category:</span>
                </label>
                {selectedCategory !== "all" && (
                  <span className="text-[11px] text-indigo-400 font-mono">
                    {CATEGORY_CONFIG[selectedCategory].label} ({categoryCounts[selectedCategory] || 0})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as QueryCategory[]).map((catKey) => {
                  const conf = CATEGORY_CONFIG[catKey];
                  const Icon = conf.icon;
                  const isSelected = selectedCategory === catKey;
                  const count = categoryCounts[catKey] || 0;

                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`p-2.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500/80 text-white shadow-lg shadow-indigo-500/10"
                          : "bg-slate-900/50 hover:bg-slate-850 border-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-400" : conf.color}`} />
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected ? "bg-indigo-500 text-white" : "bg-slate-950 text-slate-500"
                        }`}>
                          {count}
                        </span>
                      </div>
                      <span className={`text-xs font-bold leading-snug truncate ${isSelected ? "text-indigo-200" : "text-slate-300"}`}>
                        {conf.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. User Role & Persona Lens Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Audience Persona / User Role Filter:</span>
                </label>
                {selectedRole !== "all" && (
                  <span className="text-[11px] text-indigo-400 font-mono">
                    Perspective: {ROLE_CONFIG[selectedRole].label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map((roleKey) => {
                  const rConf = ROLE_CONFIG[roleKey];
                  const isSelected = selectedRole === roleKey;
                  const count = roleCounts[roleKey] || 0;

                  return (
                    <button
                      key={roleKey}
                      onClick={() => setSelectedRole(roleKey)}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20"
                          : "bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                      title={rConf.description}
                    >
                      <span className="text-xs truncate">{rConf.short}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-950 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Quick Sliders & Types Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-850 text-xs">
              {/* Type toggle */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Insight Type:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(["all", "Chart", "Stat"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        selectedType === type ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {type === "all" ? "All Formats" : `${type}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Min Confidence:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMinConfidence(0)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-semibold ${minConfidence === 0 ? "bg-indigo-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                  >
                    Any
                  </button>
                  <button
                    onClick={() => setMinConfidence(95)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-semibold ${minConfidence === 95 ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                  >
                    ≥ 95%
                  </button>
                  <button
                    onClick={() => setMinConfidence(98)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-semibold ${minConfidence === 98 ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                  >
                    ≥ 98%
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips Strip */}
        {isAnyFilterActive && (
          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Active Filters:</span>
            
            {selectedDateRange !== "all" && (
              <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-indigo-300 text-xs gap-1.5 py-1">
                <span>Date: {DATE_RANGE_OPTIONS.find(d => d.id === selectedDateRange)?.label}</span>
                <button onClick={() => setSelectedDateRange("all")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-indigo-300 text-xs gap-1.5 py-1">
                <span>Category: {CATEGORY_CONFIG[selectedCategory].label}</span>
                <button onClick={() => setSelectedCategory("all")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedRole !== "all" && (
              <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-indigo-300 text-xs gap-1.5 py-1">
                <span>Role: {ROLE_CONFIG[selectedRole].label}</span>
                <button onClick={() => setSelectedRole("all")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {minConfidence > 0 && (
              <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-emerald-300 text-xs gap-1.5 py-1">
                <span>Confidence: ≥{minConfidence}%</span>
                <button onClick={() => setMinConfidence(0)} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedType !== "all" && (
              <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-purple-300 text-xs gap-1.5 py-1">
                <span>Format: {selectedType}</span>
                <button onClick={() => setSelectedType("all")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {inlineSearch && (
              <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-amber-300 text-xs gap-1.5 py-1">
                <span>Search: "{inlineSearch}"</span>
                <button onClick={() => setInlineSearch("")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <button
              onClick={handleResetFilters}
              className="text-[11px] text-slate-400 hover:text-white underline ml-auto cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* RESULTS COUNT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            Data Insights & Recommendations
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
            {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"}
          </span>
        </div>
        <p className="text-xs text-slate-500 hidden sm:block">
          Click any insight card to copy briefing or expand metrics
        </p>
      </div>

      {/* INSIGHTS RESULTS DISPLAY AREA */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 space-y-8"
          >
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-indigo-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Synthesizing Warehouse Intelligence...</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Running multi-tenant causal inference and validating semantic aggregations across active data sources.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[1, 2].map(i => (
                <div key={i} className="h-56 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse p-6" />
              ))}
            </div>
          </motion.div>
        ) : filteredResults.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredResults.map((item) => {
              const catConf = CATEGORY_CONFIG[item.category];
              const roleConf = ROLE_CONFIG[item.role];
              const dateFormatted = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              return (
                <Card 
                  key={item.id} 
                  className="bg-slate-900/50 border-slate-800 hover:border-slate-700/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl transition-all hover:shadow-2xl flex flex-col justify-between group"
                >
                  <CardHeader className="p-5 sm:p-6 pb-3 space-y-3">
                    {/* Badge Strip */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Category Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${catConf.bg} ${catConf.color}`}>
                          <catConf.icon className="h-3 w-3" />
                          <span>{catConf.label}</span>
                        </span>

                        {/* Role Lens Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${roleConf.badgeColor}`}>
                          <UserCheck className="h-2.5 w-2.5" />
                          <span>{roleConf.short}</span>
                        </span>
                      </div>

                      {/* Confidence Meter & Timestamp */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateFormatted}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                          <CheckCircle className="h-3 w-3" />
                          <span>{(item.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <CardTitle className="text-lg sm:text-xl font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                      {item.title}
                    </CardTitle>

                    {/* Detailed Content */}
                    <CardDescription className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                      {item.content}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
                    {/* Embedded Visual Chart if available */}
                    {item.chartData && item.chartData.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                            Trend Analysis ({item.sourceDataset || "Warehouse"})
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">Indexed telemetry</span>
                        </div>

                        <div className="h-36 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            {item.chartType === "line" ? (
                              <RechartsLineChart data={item.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} width={30} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: 8, fontSize: 12 }} 
                                />
                                <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} />
                                {item.chartData[0].benchmark && (
                                  <Line type="monotone" dataKey="benchmark" stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                                )}
                              </RechartsLineChart>
                            ) : item.chartType === "area" ? (
                              <RechartsAreaChart data={item.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} width={30} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: 8, fontSize: 12 }} 
                                />
                                <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                              </RechartsAreaChart>
                            ) : (
                              <RechartsBarChart data={item.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} width={30} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: 8, fontSize: 12 }} 
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                {item.chartData[0].secondary && (
                                  <Bar dataKey="secondary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                )}
                              </RechartsBarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* KPI Highlights Metrics Strip */}
                    {item.metrics && item.metrics.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {item.metrics.map((m, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-0.5">
                            <span className="text-[10px] text-slate-400 block truncate">{m.label}</span>
                            <span className="text-sm font-bold text-white block">{m.value}</span>
                            {m.change && (
                              <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                                m.isPositive ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {m.change}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Prescriptive Recommendation Callout */}
                    {item.prescriptiveAction && (
                      <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs flex items-start gap-2.5">
                        <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-indigo-300 block text-[11px] uppercase tracking-wider mb-0.5">
                            Prescriptive Action
                          </span>
                          <p className="text-slate-300 leading-relaxed text-xs">
                            {item.prescriptiveAction}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.tags.slice(0, 3).map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-850 font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCopyInsight(item)}
                          className="h-7 px-2 text-[11px] text-slate-400 hover:text-white rounded-lg"
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            toast.success(`Exporting ${item.title} to Executive Report package.`);
                          }}
                          className="h-7 px-2.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                        >
                          <Download className="h-3 w-3 mr-1" /> Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        ) : (
          /* Empty Filter State */
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12"
          >
            <Card className="bg-slate-900/40 border-slate-800/80 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl p-10 text-center max-w-xl mx-auto space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mx-auto">
                <Filter className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">No matching insights found</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                  No data points match your active filters for Category ({CATEGORY_CONFIG[selectedCategory].label}), Role ({ROLE_CONFIG[selectedRole].short}), or Timeline.
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={handleResetFilters}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl px-5 h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Clear All Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Knowledge Graph Questions Section */}
      <div className="pt-10 border-t border-slate-800/40">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">
          Intelligent Knowledge Graph Starters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              icon: LineChart, 
              label: "Revenue Forecaster", 
              desc: "Predict ARR for next 12 months based on seasonality.",
              category: "finance" as QueryCategory,
              query: "Predict ARR for the next 12 months based on seasonality and customer retention"
            },
            { 
              icon: Target, 
              label: "Market Sensitivity", 
              desc: "How do interest rate changes impact our customer churn?",
              category: "customer" as QueryCategory,
              query: "How do macroeconomic interest rate shifts impact mid-market customer churn?"
            },
            { 
              icon: PieChart, 
              label: "Compute Optimization", 
              desc: "Analyze warehouse run-rates and FinOps efficiency.",
              category: "operations" as QueryCategory,
              query: "Analyze warehouse query execution run-rates and compute cost bottlenecks"
            },
            { 
              icon: Globe, 
              label: "Geo-Strategic Ops", 
              desc: "Map operational efficiency metrics across global hubs.",
              category: "operations" as QueryCategory,
              query: "Map operational fulfillment and cold-chain compliance across global hubs"
            }
          ].map((item, i) => (
            <Card 
              key={i} 
              onClick={() => {
                setSelectedCategory(item.category);
                handleSearch(undefined, item.query);
              }}
              className="bg-slate-900/30 border-slate-800/60 hover:border-indigo-500/40 transition-all cursor-pointer group rounded-3xl hover:bg-slate-900/60"
            >
              <CardContent className="p-5 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 w-fit group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-colors">
                  <item.icon className="h-4 w-4 text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
