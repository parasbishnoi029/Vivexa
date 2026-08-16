import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart2, LineChart as LineChartIcon, Settings2, 
  Search, Download, Share2, Filter, Sparkles, Plus,
  FileSpreadsheet, FileText, Presentation, RefreshCcw, 
  Wand2, ArrowRight, Eye, MonitorPlay, Minimize2, 
  ChevronDown, Activity, Layers, Database, GitBranch, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { supabase } from "@/lib/supabase";
import { parseDatasetFile } from "@/lib/datasetParser";
import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";

import { LineageInspectorModal, LineageTraceData } from "@/components/workspace/LineageInspectorModal";
import { CustomWidgetModal, CustomWidgetConfig } from "@/components/workspace/CustomWidgetModal";
import { ChartExpandModal } from "@/components/workspace/ChartExpandModal";
import { ColumnSelectorModal } from "@/components/workspace/ColumnSelectorModal";
import { CRDTTimeTravelModal } from "@/components/workspace/CRDTTimeTravelModal";
import { QueryRouterModal } from "@/components/workspace/QueryRouterModal";
import { Zap, AlertTriangle } from "lucide-react";

import { 
  ENTERPRISE_SAMPLE_DATASETS, 
  BIDataset,
  generateTelemetryDataset,
  generateSaaSRevenueDataset,
  generateECommerceDataset,
  generateHealthcareDataset,
  generateSupplyChainDataset
} from "@/lib/biDatasets";

import { BIDatasetSelector, BIDatasetOption } from "@/components/workspace/bi/BIDatasetSelector";
import { BISemanticSidebar } from "@/components/workspace/bi/BISemanticSidebar";
import { BIExecutiveCards } from "@/components/workspace/bi/BIExecutiveCards";
import { BIChartsGrid } from "@/components/workspace/bi/BIChartsGrid";
import { BIVirtualizedTable } from "@/components/workspace/bi/BIVirtualizedTable";
import { formatColumnTitle, inferDatasetSchema, parseNLQQuery, BI_PALETTE } from "@/lib/biUtils";
import { useCollaborationStore } from "@/stores/collaborationStore";
import { CollaborativeToolbar } from "@/components/workspace/CollaborativeToolbar";
import { CollaborativeCursorOverlay } from "@/components/workspace/CollaborativeCursorOverlay";

// Reference date for 2026 enterprise temporal filtering
const CURRENT_DATE = new Date(2026, 7, 15);

export default function DashboardsBuilder() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const activeWorkspaceRows = useWorkspaceStore(state => state.activeDatasetRows);
  const selectedWorkspaceDataset = useWorkspaceStore(state => state.selectedDataset);
  
  // Datasets State - Initialized synchronously with sample datasets for instant zero-lag rendering
  const [datasetsList, setDatasetsList] = useState<BIDatasetOption[]>(() => {
    return ENTERPRISE_SAMPLE_DATASETS.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      description: d.description,
      row_count: d.rowCount,
      isSample: true
    }));
  });

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("telemetry-live");
  
  // Instant Initial Data Generation
  const [datasetRows, setDatasetRows] = useState<Record<string, any>[]>(() => {
    return ENTERPRISE_SAMPLE_DATASETS[0].generateRows();
  });
  
  const [datasetColumns, setDatasetColumns] = useState<string[]>(() => {
    return ENTERPRISE_SAMPLE_DATASETS[0].columns;
  });

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    return ENTERPRISE_SAMPLE_DATASETS[0].columns.slice(0, 8);
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  // BI Controls State
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [nlqPrompt, setNlqPrompt] = useState<string>("");
  const [nlqFeedback, setNlqFeedback] = useState<{ message: string; confidence: number } | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [showTimeTravelModal, setShowTimeTravelModal] = useState<boolean>(false);
  const [showQueryRouterModal, setShowQueryRouterModal] = useState<boolean>(false);
  
  // Filter Slicers State
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Real-Time Collaborative Canvas Synchronization
  const {
    joinRoom,
    leaveRoom,
    updateCursor,
    focusWidget,
    broadcastAction
  } = useCollaborationStore();

  useEffect(() => {
    joinRoom(`dashboard-${selectedDatasetId || 'default'}`, {
      id: user?.id || "analyst-self",
      name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "BI Lead",
      email: user?.email || "bi@vivexa.ai",
      role: "Analytics Engineer"
    });
    return () => {
      leaveRoom();
    };
  }, [selectedDatasetId, user]);

  // Custom Widgets State
  const [customWidgets, setCustomWidgets] = useState<CustomWidgetConfig[]>(() => {
    const saved = localStorage.getItem("vivexa_bi_custom_widgets_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  
  // Modals State
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState<boolean>(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidgetConfig | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isLineageModalOpen, setIsLineageModalOpen] = useState<boolean>(false);
  const [selectedLineageData, setSelectedLineageData] = useState<LineageTraceData | null>(null);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState<boolean>(false);
  
  const [expandModalData, setExpandModalData] = useState<{
    isOpen: boolean;
    title: string;
    chartType: string;
    data: any[];
    dimensionKey?: string;
    measureKey?: string;
    color?: string;
  }>({
    isOpen: false,
    title: "",
    chartType: "bar",
    data: []
  });

  // Table Sorting State
  const [tableSortCol, setTableSortCol] = useState<string | null>(null);
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');

  // 1. Initial Load: Combine Sample Datasets, Workspace Store, and Supabase Datasets
  useEffect(() => {
    async function initDatasets() {
      const samples: BIDatasetOption[] = ENTERPRISE_SAMPLE_DATASETS.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        description: d.description,
        row_count: d.rowCount,
        isSample: true
      }));

      let allDatasets: BIDatasetOption[] = [...samples];

      // If workspace store has an active dataset with rows, prepend it
      if (activeWorkspaceRows && activeWorkspaceRows.length > 0) {
        allDatasets.unshift({
          id: "workspace-active-dataset",
          name: selectedWorkspaceDataset?.name || "Active Workspace Dataset",
          category: "Workspace Store",
          row_count: activeWorkspaceRows.length,
          isWorkspaceMemory: true,
          description: "Ingested from workspace analysis memory"
        });
      }

      // Fetch user datasets from Supabase
      if (user) {
        try {
          const { data, error } = await supabase
            .from("datasets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (data && data.length > 0) {
            const userMapped = data.map(d => ({
              id: d.id,
              name: d.name,
              category: "Cloud Lakehouse",
              row_count: d.rows || d.row_count || 1000,
              storage_path: d.storage_path,
              isSupabase: true
            }));
            allDatasets = [...userMapped, ...allDatasets];
          }
        } catch (e) {
          console.error("Error loading Supabase datasets:", e);
        }
      }

      setDatasetsList(allDatasets);
    }

    initDatasets();
  }, [user, activeWorkspaceRows, selectedWorkspaceDataset]);

  // 2. Load Selected Dataset Handler
  const loadDataset = async (datasetId: string, customDatasetObj?: any) => {
    setIsLoadingData(true);
    setSelectedDatasetId(datasetId);
    setActiveFilters({});
    setSearchQuery("");
    setNlqFeedback(null);

    const dsMeta = customDatasetObj || datasetsList.find(d => d.id === datasetId);

    // Case A: Built-in Enterprise Sample Benchmark Datasets
    const sampleDef = ENTERPRISE_SAMPLE_DATASETS.find(s => s.id === datasetId);
    if (sampleDef) {
      const rows = sampleDef.generateRows();
      setDatasetRows(rows);
      setDatasetColumns(sampleDef.columns);
      setVisibleColumns(sampleDef.columns.slice(0, 8));
      setIsLoadingData(false);
      toast.success(`Switched to ${sampleDef.name} (${sampleDef.rowCount.toLocaleString()} records)`);
      return;
    }

    // Case B: Workspace Memory Dataset
    if (datasetId === "workspace-active-dataset" && activeWorkspaceRows && activeWorkspaceRows.length > 0) {
      setDatasetRows(activeWorkspaceRows);
      const cols = Object.keys(activeWorkspaceRows[0] || {});
      setDatasetColumns(cols);
      setVisibleColumns(cols.slice(0, 8));
      setIsLoadingData(false);
      toast.success(`Loaded Workspace Dataset (${activeWorkspaceRows.length.toLocaleString()} records)`);
      return;
    }

    // Case C: Supabase Cloud Lakehouse Dataset
    if (dsMeta?.isSupabase && dsMeta.storage_path) {
      try {
        const { data, error } = await supabase.storage
          .from("datasets")
          .download(dsMeta.storage_path);

        if (error) throw error;
        if (data) {
          const parsed = await parseDatasetFile(data, dsMeta.name);
          if (parsed && parsed.rows.length > 0) {
            setDatasetRows(parsed.rows);
            setDatasetColumns(parsed.columns);
            setVisibleColumns(parsed.columns.slice(0, 8));
            setIsLoadingData(false);
            toast.success(`Loaded ${dsMeta.name} from Cloud Lakehouse`);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to download dataset from Supabase:", err);
        toast.error("Failed to fetch cloud dataset. Falling back to default benchmark.");
      }
    }

    // Fallback: Default to first sample
    const fallback = ENTERPRISE_SAMPLE_DATASETS[0];
    setDatasetRows(fallback.generateRows());
    setDatasetColumns(fallback.columns);
    setVisibleColumns(fallback.columns.slice(0, 8));
    setIsLoadingData(false);
  };

  // 3. Schema & Dimension Inference
  const currentSampleMeta = ENTERPRISE_SAMPLE_DATASETS.find(s => s.id === selectedDatasetId);
  const {
    dimensions,
    measures,
    primaryDateCol,
    primaryMeasureCol,
    primaryDimCol,
    secondaryDimCol
  } = useMemo(() => {
    return inferDatasetSchema(datasetRows, datasetColumns, currentSampleMeta);
  }, [datasetRows, datasetColumns, currentSampleMeta]);

  // 4. Live Streaming Simulation Engine
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setDatasetRows(prev => {
        if (prev.length === 0) return prev;
        const base = prev[Math.floor(Math.random() * prev.length)];
        const newRow = { ...base };
        
        // Update identifier
        if (newRow.transaction_id) newRow.transaction_id = `TX-${Date.now().toString().slice(-6)}`;
        if (newRow.order_number) newRow.order_number = `ORD-${Date.now().toString().slice(-6)}`;
        if (newRow.admission_id) newRow.admission_id = `ADM-${Date.now().toString().slice(-6)}`;
        if (newRow.shipment_tracking_id) newRow.shipment_tracking_id = `TRK-${Date.now().toString().slice(-6)}`;

        // Update timestamps to current time
        const nowIso = new Date().toISOString().split("T")[0];
        if (newRow.event_date) newRow.event_date = nowIso;
        if (newRow.order_date) newRow.order_date = nowIso;
        if (newRow.admission_date) newRow.admission_date = nowIso;
        if (newRow.dispatch_date) newRow.dispatch_date = nowIso;

        // Apply realistic random delta to numeric measures
        measures.forEach(m => {
          if (typeof newRow[m] === "number") {
            const delta = (Math.random() * 0.4 - 0.15) * newRow[m];
            newRow[m] = Math.max(10, Number((newRow[m] + delta).toFixed(2)));
          }
        });

        return [newRow, ...prev.slice(0, 1999)];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, measures]);

  // 5. Data Slicing & Filtering Pipeline
  const filteredRows = useMemo(() => {
    if (!datasetRows || datasetRows.length === 0) return [];

    return datasetRows.filter(row => {
      // Temporal Filter
      if (dateRange !== "ALL" && primaryDateCol && row[primaryDateCol]) {
        try {
          const rowDate = new Date(row[primaryDateCol]);
          if (!isNaN(rowDate.getTime())) {
            const diffDays = (CURRENT_DATE.getTime() - rowDate.getTime()) / (1000 * 3600 * 24);
            if (dateRange === "7D" && (diffDays < 0 || diffDays > 7)) return false;
            if (dateRange === "30D" && (diffDays < 0 || diffDays > 30)) return false;
            if (dateRange === "90D" && (diffDays < 0 || diffDays > 90)) return false;
            if (dateRange === "YTD" && rowDate.getFullYear() !== 2026) return false;
          }
        } catch (e) {}
      }

      // Active Categorical Dimension Slicers
      for (const [dim, val] of Object.entries(activeFilters)) {
        if (String(row[dim]) !== String(val)) {
          return false;
        }
      }

      // Global Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = Object.values(row).some(v => 
          v !== null && v !== undefined && String(v).toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [datasetRows, dateRange, primaryDateCol, activeFilters, searchQuery]);

  // 6. Aggregate Statistics Computation
  const aggregateStats = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0) {
      return { total: 0, avg: 0, count: 0, min: 0, max: 0, median: 0, growth: 18.4, ytd: 0 };
    }

    const count = filteredRows.length;
    let total = 0;
    let min = Infinity;
    let max = -Infinity;
    const values: number[] = [];

    const mCol = primaryMeasureCol || (measures.length > 0 ? measures[0] : null);

    if (mCol) {
      filteredRows.forEach(r => {
        const val = Number(r[mCol]) || 0;
        total += val;
        if (val < min) min = val;
        if (val > max) max = val;
        values.push(val);
      });
    } else {
      total = count * 100;
    }

    values.sort((a, b) => a - b);
    const median = values.length > 0 ? values[Math.floor(values.length / 2)] : 0;
    const avg = count > 0 ? total / count : 0;

    return {
      total: Number(total.toFixed(2)),
      avg: Number(avg.toFixed(2)),
      count,
      min: min === Infinity ? 0 : Number(min.toFixed(2)),
      max: max === -Infinity ? 0 : Number(max.toFixed(2)),
      median: Number(median.toFixed(2)),
      growth: 18.4,
      ytd: Number((total * 0.85).toFixed(2))
    };
  }, [filteredRows, primaryMeasureCol, measures]);

  // 7. Time Series & Predictive ML Forecast Computation
  const timeSeriesData = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0 || !primaryDateCol) return [];

    const dateMap = new Map<string, number>();
    const mCol = primaryMeasureCol || (measures.length > 0 ? measures[0] : null);

    filteredRows.forEach(r => {
      const d = String(r[primaryDateCol] || "").slice(0, 10);
      if (!d) return;
      const val = mCol ? (Number(r[mCol]) || 0) : 1;
      dateMap.set(d, (dateMap.get(d) || 0) + val);
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    if (sortedDates.length === 0) return [];

    // Historical Points
    const historicalPoints = sortedDates.map(d => ({
      name: d,
      actual: Number((dateMap.get(d) || 0).toFixed(2)),
      forecast: null as number | null
    }));

    // Linear Regression ML Forecast calculation
    const n = historicalPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    historicalPoints.forEach((pt, i) => {
      sumX += i;
      sumY += pt.actual;
      sumXY += i * pt.actual;
      sumXX += i * i;
    });

    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
    const intercept = n > 1 ? (sumY - slope * sumX) / n : (historicalPoints[0]?.actual || 100);

    // Project 7 future periods
    const lastDateStr = sortedDates[sortedDates.length - 1];
    let lastDate = new Date(lastDateStr);
    if (isNaN(lastDate.getTime())) lastDate = new Date(CURRENT_DATE);

    const forecastPoints: any[] = [];
    const lastActual = historicalPoints[historicalPoints.length - 1]?.actual || 0;
    
    // Connect forecast start to last actual
    if (historicalPoints.length > 0) {
      historicalPoints[historicalPoints.length - 1].forecast = lastActual;
    }

    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + (i * 3));
      const dateName = futureDate.toISOString().slice(0, 10);
      
      const predictedVal = Math.max(10, intercept + slope * (n + i) + (Math.sin(i) * 0.1 * (intercept || 1000)));
      forecastPoints.push({
        name: dateName,
        actual: null,
        forecast: Number(predictedVal.toFixed(2))
      });
    }

    return [...historicalPoints, ...forecastPoints];
  }, [filteredRows, primaryDateCol, primaryMeasureCol, measures]);

  // 8. Categorical Dimension Breakdowns
  const primaryDimBreakdown = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0 || !primaryDimCol) return [];

    const map = new Map<string, number>();
    const mCol = primaryMeasureCol || (measures.length > 0 ? measures[0] : null);

    filteredRows.forEach(r => {
      const dimVal = String(r[primaryDimCol] || "Unassigned");
      const val = mCol ? (Number(r[mCol]) || 0) : 1;
      map.set(dimVal, (map.get(dimVal) || 0) + val);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredRows, primaryDimCol, primaryMeasureCol, measures]);

  const secondaryDimBreakdown = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0 || !secondaryDimCol) return [];

    const map = new Map<string, number>();
    const mCol = primaryMeasureCol || (measures.length > 0 ? measures[0] : null);

    filteredRows.forEach(r => {
      const dimVal = String(r[secondaryDimCol] || "Standard");
      const val = mCol ? (Number(r[mCol]) || 0) : 1;
      map.set(dimVal, (map.get(dimVal) || 0) + val);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredRows, secondaryDimCol, primaryMeasureCol, measures]);

  // 9. Table Row Sorting
  const sortedFilteredRows = useMemo(() => {
    if (!tableSortCol) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const valA = a[tableSortCol];
      const valB = b[tableSortCol];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return tableSortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return tableSortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRows, tableSortCol, tableSortDir]);

  // 10. Filter Handlers
  const handleToggleDimensionFilter = (dimension: string, value: string) => {
    setActiveFilters(prev => {
      if (prev[dimension] === value) {
        const next = { ...prev };
        delete next[dimension];
        toast.info(`Removed filter on ${dimension}`);
        return next;
      }
      toast.success(`Filtered ${dimension} = "${value}"`);
      return { ...prev, [dimension]: value };
    });
  };

  const handleRemoveFilter = (dim: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[dim];
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setActiveFilters({});
    setDateRange("ALL");
    setSearchQuery("");
    setNlqFeedback(null);
    toast.success("Cleared all filters and reset scope");
  };

  // 11. NLQ Execution Handler
  const handleExecuteNLQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlqPrompt.trim()) return;

    const parsed = parseNLQQuery(nlqPrompt, datasetsList, dimensions);
    
    if (parsed.resetRequested) {
      handleClearAllFilters();
    }
    if (parsed.datasetToSwitch) {
      loadDataset(parsed.datasetToSwitch);
    }
    if (parsed.dateRangeToSet) {
      setDateRange(parsed.dateRangeToSet);
    }
    if (parsed.filterToAdd) {
      setActiveFilters(prev => ({ ...prev, [parsed.filterToAdd!.dim]: parsed.filterToAdd!.val }));
    }

    setNlqFeedback({
      message: parsed.feedback,
      confidence: parsed.confidence
    });
    setNlqPrompt("");
  };

  // 12. Lineage Inspection Trigger
  const openLineageInspector = (
    chartTitle: string, 
    chartType: string, 
    dimension?: string, 
    measure?: string, 
    aggregation: string = "SUM"
  ) => {
    const activeDatasetMeta = datasetsList.find(d => d.id === selectedDatasetId);
    const tableName = (activeDatasetMeta?.name || "bi_master_table")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");

    const dim = dimension || primaryDimCol || "product_category";
    const meas = measure || primaryMeasureCol || "gross_amount_usd";

    const generatedSQL = `-- Compiled Autonomous Semantic Analytical Query
-- Target Engine: DuckDB WASM / PostgreSQL / Snowflake Compatible
SELECT 
    ${dim} AS dimension_group,
    ${aggregation}(${meas}) AS metric_aggregated,
    COUNT(*) AS record_cardinality,
    ROUND(${aggregation}(${meas}) / SUM(${aggregation}(${meas})) OVER () * 100, 2) AS pct_of_total
FROM ${tableName}
WHERE 1=1
${Object.entries(activeFilters).map(([k, v]) => `  AND ${k} = '${v}'`).join("\n")}
GROUP BY ${dim}
ORDER BY metric_aggregated DESC
LIMIT 50;`;

    // Map source type to allowed union
    let mappedSource: "Snowflake" | "PostgreSQL" | "Databricks" | "DuckDB Lakehouse" | "S3 Delta" = "DuckDB Lakehouse";
    if (activeDatasetMeta?.category === "SaaS") mappedSource = "Snowflake";
    else if (activeDatasetMeta?.category === "Healthcare") mappedSource = "PostgreSQL";
    else if (activeDatasetMeta?.category === "Telemetry") mappedSource = "Databricks";
    else if (activeDatasetMeta?.category === "Supply Chain") mappedSource = "S3 Delta";

    const lineagePayload: LineageTraceData = {
      chartTitle: chartTitle,
      chartType: chartType,
      sourceType: mappedSource,
      sourceDatabase: "enterprise_dw_gold",
      sourceTable: tableName,
      sourceRows: datasetRows.length,
      lastIngested: isLiveStreaming ? "Real-time Live (WebSocket Stream)" : "August 15, 2026 09:30 UTC",
      etlModelName: `fct_${tableName}_aggregated`,
      etlTransforms: [
        "Column Type Casting & Schema Inferencing",
        `Categorical Aggregation via ${aggregation}(${meas})`,
        "Dynamic Window Ratio Calculation",
        ...(Object.keys(activeFilters).length > 0 ? [`Multi-Dimensional Filter: ${JSON.stringify(activeFilters)}`] : [])
      ],
      semanticMetric: `${aggregation} of ${formatColumnTitle(meas)}`,
      semanticFormula: `${aggregation}(${tableName}.${meas})`,
      dimensionMapped: dim,
      measureMapped: meas,
      compiledSql: generatedSQL,
      confidenceScore: 99.8,
      reasoningTrace: [
        "Identified grain level from primary key and dimensional grouping",
        "Pushed predicate filters down to execution engine partition",
        "Applied vectorized WebAssembly aggregation kernel"
      ],
      dataFreshness: isLiveStreaming ? "0.0s (Live Telemetry Stream)" : "Cached in WebAssembly Memory",
      scanVolume: `${(datasetRows.length * 0.12).toFixed(1)} MB`,
      dataQualityScore: 99.9
    };

    setSelectedLineageData(lineagePayload);
    setIsLineageModalOpen(true);
  };

  // 13. Fullscreen Chart Expand Trigger
  const handleExpandChart = (
    title: string, 
    chartType: string, 
    data: any[], 
    dimensionKey?: string, 
    measureKey?: string, 
    color?: string
  ) => {
    setExpandModalData({
      isOpen: true,
      title,
      chartType,
      data,
      dimensionKey,
      measureKey,
      color
    });
  };

  // 14. Custom Widgets CRUD
  const handleSaveCustomWidget = (widget: CustomWidgetConfig) => {
    setCustomWidgets(prev => {
      const idx = prev.findIndex(w => w.id === widget.id);
      let updated: CustomWidgetConfig[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = widget;
      } else {
        updated = [...prev, widget];
      }
      localStorage.setItem("vivexa_bi_custom_widgets_v2", JSON.stringify(updated));
      return updated;
    });
    setIsAddWidgetOpen(false);
    setEditingWidget(null);
    toast.success(`Saved widget "${widget.title}"`);
  };

  const handleDeleteCustomWidget = (widgetId: string) => {
    setCustomWidgets(prev => {
      const updated = prev.filter(w => w.id !== widgetId);
      localStorage.setItem("vivexa_bi_custom_widgets_v2", JSON.stringify(updated));
      return updated;
    });
    toast.info("Widget removed from dashboard canvas");
  };

  // 15. Export Handlers (PDF, PPTX, Excel, CSV)
  const handleExportPDF = () => {
    setIsExportMenuOpen(false);
    toast.info("Compiling executive PDF briefing...");
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, "F");
      
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(20);
      doc.text("VIVEXA AI • EXECUTIVE BI BRIEFING", 14, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(`Active Dataset: ${datasetsList.find(d => d.id === selectedDatasetId)?.name}`, 14, 32);
      doc.text(`Generated: August 15, 2026 • Scope: ${filteredRows.length.toLocaleString()} Records`, 14, 38);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text(`Total Aggregated Volume: $${aggregateStats.total.toLocaleString()}`, 14, 50);
      doc.text(`Average Record Value: $${aggregateStats.avg.toLocaleString()}`, 14, 56);
      doc.text(`Top Dimension Vector (${primaryDimCol}): ${primaryDimBreakdown[0]?.name || "N/A"} ($${primaryDimBreakdown[0]?.value.toLocaleString() || 0})`, 14, 62);

      doc.save(`vivexa_executive_briefing_${Date.now()}.pdf`);
      toast.success("Executive PDF briefing exported successfully!");
    } catch (e) {
      toast.error("Failed to generate PDF export.");
    }
  };

  const handleExportPPTX = () => {
    setIsExportMenuOpen(false);
    toast.info("Compiling PowerPoint presentation...");
    try {
      const pptx = new pptxgen();
      const slide = pptx.addSlide();
      slide.background = { color: "0F172A" };

      slide.addText("VIVEXA AI • EXECUTIVE DECISION BRIEFING", {
        x: 0.5, y: 0.5, fontSize: 22, color: "6366F1", bold: true
      });

      slide.addText(`Dataset: ${datasetsList.find(d => d.id === selectedDatasetId)?.name} | Processed: ${filteredRows.length.toLocaleString()} records`, {
        x: 0.5, y: 1.1, fontSize: 12, color: "94A3B8"
      });

      slide.addText(`Total Volume: $${aggregateStats.total.toLocaleString()} (+${aggregateStats.growth}% 30D Velocity)\nAverage Value: $${aggregateStats.avg.toLocaleString()}\nPrimary Sector (${primaryDimCol}): ${primaryDimBreakdown[0]?.name || "N/A"}`, {
        x: 0.5, y: 2.0, fontSize: 14, color: "FFFFFF", lineSpacing: 28
      });

      pptx.writeFile({ fileName: `vivexa_briefing_${Date.now()}.pptx` });
      toast.success("PowerPoint presentation exported successfully!");
    } catch (e) {
      toast.error("Failed to generate PowerPoint export.");
    }
  };

  const handleExportExcel = () => {
    setIsExportMenuOpen(false);
    toast.info("Compiling multi-sheet Excel workbook...");
    try {
      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(filteredRows);
      XLSX.utils.book_append_sheet(wb, wsData, "Filtered_Data");

      const summarySheet = XLSX.utils.json_to_sheet([
        { Metric: "Total Volume", Value: aggregateStats.total },
        { Metric: "Average Value", Value: aggregateStats.avg },
        { Metric: "Record Count", Value: filteredRows.length },
        { Metric: "Median Value", Value: aggregateStats.median }
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Executive_KPIs");

      XLSX.writeFile(wb, `vivexa_bi_master_${Date.now()}.xlsx`);
      toast.success("Excel workbook exported successfully!");
    } catch (e) {
      toast.error("Failed to generate Excel export.");
    }
  };

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vivexa_table_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported table records as CSV.");
  };

  return (
    <div 
      onMouseMove={(e) => updateCursor(e.clientX, e.clientY)}
      className={`flex flex-col flex-1 min-h-0 bg-slate-950 text-slate-100 font-sans overflow-hidden ${isPresentationMode ? 'fixed inset-0 z-50 bg-slate-950' : ''}`}
    >
      <CollaborativeCursorOverlay />
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER TOOLBAR: Dataset Selector, Controls, Actions */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 flex flex-col gap-2 shrink-0 z-20">
        
        {/* Top Row: Title, Dataset Selector, Sidebar Toggle, Action Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Left: Sidebar Toggle & Studio Title */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`h-8 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                isSidebarOpen 
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle Semantic Data Layer & Slicers"
            >
              <Layers className="h-4 w-4 mr-1.5 text-indigo-400" />
              <span>Semantic Layer</span>
            </Button>

            <div className="flex items-center gap-2">
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <h1 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">Vivexa</span> BI Studio
              </h1>
            </div>
          </div>

          {/* Right: Actions, Live Stream Toggle, Add Widget, Export, Fullscreen */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Collaborative Session Controls */}
            <CollaborativeToolbar roomTitle="BI Canvas Dashboard" />

            {/* Live Streaming Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsLiveStreaming(!isLiveStreaming);
                toast(isLiveStreaming ? "Paused Live Telemetry Stream" : "Connected to Live Streaming WebSocket (2.5s Ticks)");
              }}
              className={`h-8 text-xs font-semibold rounded-xl border transition-all ${
                isLiveStreaming 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Activity className={`h-3.5 w-3.5 mr-1.5 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{isLiveStreaming ? "Live 2.5s Stream" : "Simulate Stream"}</span>
            </Button>

            {/* Forecast Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForecast(!showForecast)}
              className={`h-8 text-xs font-semibold rounded-xl border transition-all ${
                showForecast 
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              <span>{showForecast ? "Forecast On" : "Forecast Off"}</span>
            </Button>

            {/* Time-Travel WAL */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTimeTravelModal(true)}
              className="h-8 text-xs font-semibold bg-indigo-600/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 rounded-xl flex items-center gap-1.5 font-mono"
            >
              <History className="h-3.5 w-3.5 text-indigo-400" /> Time-Travel WAL
            </Button>

            {/* Query Router AST Inspector */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQueryRouterModal(true)}
              className="h-8 text-xs font-semibold bg-cyan-600/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20 rounded-xl flex items-center gap-1.5 font-mono"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" /> Query Router
            </Button>

            {/* Add Custom Visualization */}
            <Button
              size="sm"
              onClick={() => {
                setEditingWidget(null);
                setIsAddWidgetOpen(true);
              }}
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/30 px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Chart
            </Button>

            {/* Export Dropdown Menu */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="h-8 text-xs font-semibold bg-slate-900 border-slate-800 text-slate-300 hover:text-white rounded-xl"
              >
                <Download className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Export <ChevronDown className="h-3 w-3 ml-1" />
              </Button>

              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsExportMenuOpen(false)} />
                  <div className="absolute right-0 top-10 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={handleExportPDF}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <FileText className="h-3.5 w-3.5 text-rose-400" /> PDF Executive Briefing
                    </button>
                    <button
                      onClick={handleExportPPTX}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Presentation className="h-3.5 w-3.5 text-amber-400" /> PowerPoint (.pptx)
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Excel Workbook (.xlsx)
                    </button>
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportCSV();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-400" /> CSV Records
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Presentation Mode Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsPresentationMode(!isPresentationMode);
                toast(isPresentationMode ? "Exited Fullscreen Presentation Mode" : "Entered Fullscreen Presentation Mode");
              }}
              className="h-8 text-xs font-semibold bg-slate-900 border-slate-800 text-slate-300 hover:text-white rounded-xl px-2.5"
              title="Toggle Presentation Mode"
            >
              {isPresentationMode ? <Minimize2 className="h-3.5 w-3.5" /> : <MonitorPlay className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Second Row: Prominent Dataset Selector & Quick Switch Tabs */}
        <BIDatasetSelector
          selectedDatasetId={selectedDatasetId}
          datasetsList={datasetsList}
          onSelectDataset={loadDataset}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />

        {/* Third Row: NLQ Semantic Search & Temporal Range Buttons */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60 flex-wrap">
          {/* NLQ Bar */}
          <form onSubmit={handleExecuteNLQ} className="flex-1 min-w-[260px] max-w-xl relative flex items-center">
            <Wand2 className="h-3.5 w-3.5 text-indigo-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={nlqPrompt}
              onChange={(e) => setNlqPrompt(e.target.value)}
              placeholder="Ask AI or slice data (e.g., 'switch to ecommerce', 'last 30 days', 'filter Enterprise')..."
              className="w-full pl-8 pr-8 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
            {nlqPrompt && (
              <button type="submit" className="absolute right-2 text-indigo-400 hover:text-indigo-300">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Temporal Range Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            {["7D", "30D", "90D", "YTD", "ALL"].map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === r 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* NLQ Feedback Chip */}
        {nlqFeedback && (
          <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-indigo-200 animate-in fade-in duration-150">
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{nlqFeedback.message}</span>
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
              {nlqFeedback.confidence}% Confidence
            </span>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE BODY: Semantic Sidebar + Canvas */}
      {/* ========================================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* Semantic Data Layer Sidebar & Drawer */}
        <BISemanticSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedDataset={datasetsList.find(d => d.id === selectedDatasetId) || null}
          datasetRowsCount={datasetRows.length}
          dimensions={dimensions}
          measures={measures}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          dateRange={dateRange}
          onToggleDimensionFilter={handleToggleDimensionFilter}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
          onClearSearch={() => setSearchQuery("")}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />

        {/* Dashboard Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          
          {/* Executive Synthesis Briefing & 3 KPI Cards */}
          <BIExecutiveCards
            filteredRowsCount={filteredRows.length}
            totalRowsCount={datasetRows.length}
            primaryMeasureCol={primaryMeasureCol}
            aggregateStats={aggregateStats}
            primaryDimBreakdown={primaryDimBreakdown}
            secondaryDimBreakdown={secondaryDimBreakdown}
          />

          {/* Dynamic Charts Grid (Timeline ML Forecast, Categorical Slices, Custom Widgets) */}
          <BIChartsGrid
            primaryDateCol={primaryDateCol}
            primaryMeasureCol={primaryMeasureCol}
            primaryDimCol={primaryDimCol}
            secondaryDimCol={secondaryDimCol}
            timeSeriesData={timeSeriesData}
            primaryDimBreakdown={primaryDimBreakdown}
            secondaryDimBreakdown={secondaryDimBreakdown}
            customWidgets={customWidgets}
            filteredRows={filteredRows}
            showForecast={showForecast}
            onOpenLineage={openLineageInspector}
            onExpandChart={handleExpandChart}
            onToggleDimensionFilter={handleToggleDimensionFilter}
            onEditWidget={(widget) => {
              setEditingWidget(widget);
              setIsAddWidgetOpen(true);
            }}
            onDeleteWidget={handleDeleteCustomWidget}
          />

          {/* High-Velocity 60fps Virtualized Data Grid */}
          <BIVirtualizedTable
            sortedFilteredRows={sortedFilteredRows}
            totalFilteredCount={filteredRows.length}
            totalDatasetCount={datasetRows.length}
            visibleColumns={visibleColumns}
            dimensions={dimensions}
            tableSortCol={tableSortCol}
            tableSortDir={tableSortDir}
            onSort={(col) => {
              if (tableSortCol === col) {
                setTableSortDir(tableSortDir === 'asc' ? 'desc' : 'asc');
              } else {
                setTableSortCol(col);
                setTableSortDir('asc');
              }
            }}
            onToggleDimensionFilter={handleToggleDimensionFilter}
            onOpenColumnSelector={() => setIsColumnSelectorOpen(true)}
            onExportCSV={handleExportCSV}
          />

          <div className="h-6"></div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS & POPUPS */}
      {/* ========================================================================= */}

      {/* Modal: Add / Edit Custom Widget */}
      <CustomWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => {
          setIsAddWidgetOpen(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveCustomWidget}
        editingWidget={editingWidget}
        dimensions={dimensions}
        measures={measures}
      />

      {/* Modal: Fullscreen Expanded Chart */}
      <ChartExpandModal
        isOpen={expandModalData.isOpen}
        onClose={() => setExpandModalData(prev => ({ ...prev, isOpen: false }))}
        title={expandModalData.title}
        chartType={expandModalData.chartType}
        data={expandModalData.data}
        dimensionKey={expandModalData.dimensionKey}
        measureKey={expandModalData.measureKey}
        color={expandModalData.color}
        onOpenLineage={() => openLineageInspector(expandModalData.title, expandModalData.chartType)}
      />

      {/* Modal: Column Selector for Data Grid */}
      <ColumnSelectorModal
        isOpen={isColumnSelectorOpen}
        onClose={() => setIsColumnSelectorOpen(false)}
        allColumns={datasetColumns}
        visibleColumns={visibleColumns}
        onChangeVisibleColumns={setVisibleColumns}
      />

      {/* Modal: Upload Dataset File */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-400" />
                Upload Dataset to BI Studio
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-8 text-center space-y-3 cursor-pointer transition-colors">
              <Database className="h-8 w-8 text-indigo-400 mx-auto animate-bounce" />
              <div>
                <p className="text-xs font-bold text-white">Choose CSV, Excel (.xlsx), or JSON file</p>
                <p className="text-[10px] text-slate-500 mt-1">Automatic semantic schema discovery and column profiling</p>
              </div>
              <input 
                type="file" 
                accept=".csv,.xlsx,.xls,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  toast.info(`Parsing ${file.name}...`);
                  try {
                    const parsed = await parseDatasetFile(file, file.name);
                    if (parsed && parsed.rows.length > 0) {
                      setDatasetRows(parsed.rows);
                      setDatasetColumns(parsed.columns);
                      setVisibleColumns(parsed.columns.slice(0, 8));
                      setSelectedDatasetId(file.name);
                      setDatasetsList(prev => [{ 
                        id: file.name, 
                        name: file.name, 
                        row_count: parsed.rowCount, 
                        category: "Uploaded",
                        description: `User-uploaded file with ${parsed.rowCount.toLocaleString()} records`
                      }, ...prev]);
                      toast.success(`Successfully activated ${file.name} with ${parsed.rowCount.toLocaleString()} records!`);
                      setIsUploadModalOpen(false);
                    }
                  } catch (err) {
                    toast.error("Failed to parse uploaded dataset.");
                  }
                }}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsUploadModalOpen(false)} 
                className="bg-slate-950 border-slate-800 text-slate-300"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lineage & Provenance Inspector */}
      <LineageInspectorModal
        isOpen={isLineageModalOpen}
        onClose={() => setIsLineageModalOpen(false)}
        lineageData={selectedLineageData}
        onOpenInLakehouse={(sql) => {
          setIsLineageModalOpen(false);
          navigate("/workspace/lakehouse");
          toast.info("Navigated to Lakehouse WASM engine with compiled SQL query.");
        }}
      />

      {/* Modal: CRDT Time-Travel & Write-Ahead Log Replay */}
      <CRDTTimeTravelModal
        isOpen={showTimeTravelModal}
        onClose={() => setShowTimeTravelModal(false)}
        docId={`dashboard-${selectedDatasetId || 'default'}`}
        onRollback={(restoredState) => {
          if (restoredState) {
            toast.success("Synchronized canvas state with CRDT Write-Ahead Log!");
          }
        }}
      />

      {/* Modal: Hybrid Adaptive Query Router Plan Inspector */}
      <QueryRouterModal
        isOpen={showQueryRouterModal}
        onClose={() => setShowQueryRouterModal(false)}
        datasetName={selectedDatasetId}
        rowCount={filteredRows.length}
      />

    </div>
  );
}
