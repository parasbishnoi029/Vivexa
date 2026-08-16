import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";

/**
 * Format raw column identifiers into polished enterprise titles
 */
export function formatColumnTitle(colName: string): string {
  if (!colName) return "Metric";
  const specialMappings: Record<string, string> = {
    gross_amount_usd: "Gross Revenue (USD)",
    monthly_recurring_revenue: "Monthly Recurring Revenue (MRR)",
    annual_recurring_revenue: "Annual Recurring Revenue (ARR)",
    net_sales_revenue: "Net Sales Revenue",
    total_procedure_cost: "Total Procedure Cost",
    cargo_value_usd: "Total Cargo Value",
    fuel_operating_cost: "Fuel Operating Cost",
    compute_units: "Compute Units (CU)",
    latency_ms: "Latency (ms)",
    customer_lifetime_value: "Customer Lifetime Value (LTV)",
    net_retention_rate_pct: "Net Retention Rate (%)",
    profit_margin_percent: "Profit Margin (%)",
    discount_percent: "Discount (%)",
    quantity_units: "Quantity Units",
    unit_price_usd: "Unit Price (USD)",
    delivery_days: "Delivery Days",
    readmission_risk_score: "Readmission Risk Score",
    patient_satisfaction_score: "Patient Satisfaction Score",
    length_of_stay_days: "Length of Stay (Days)",
    delay_duration_minutes: "Delay Duration (Min)",
    on_time_reliability_score: "On-Time Reliability Score",
    warehouse_utilization_pct: "Warehouse Utilization (%)",
    product_category: "Product Category",
    sales_channel: "Sales Channel",
    destination_country: "Destination Country",
    shipping_corridor: "Shipping Corridor",
    transport_mode: "Transport Mode",
    clinical_department: "Clinical Department",
    admission_type: "Admission Type",
    discharge_status: "Discharge Status",
    plan_tier: "Subscription Plan Tier",
    industry_vertical: "Industry Vertical",
    geographic_region: "Geographic Region",
    customer_segment: "Customer Segment",
    acquisition_channel: "Acquisition Channel",
    payment_status: "Payment Status",
    event_date: "Event Date",
    order_date: "Order Date",
    signup_date: "Signup Date",
    admission_date: "Admission Date",
    dispatch_date: "Dispatch Date",
    period_month: "Period Month",
    transaction_id: "Transaction ID",
    order_number: "Order Number",
    admission_id: "Admission ID",
    subscription_id: "Subscription ID",
    shipment_tracking_id: "Tracking ID"
  };

  if (specialMappings[colName.toLowerCase()]) {
    return specialMappings[colName.toLowerCase()];
  }

  return colName
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Intelligent Schema & Dimension Inferrer
 */
export function inferDatasetSchema(rows: Record<string, any>[], columns: string[], datasetMeta?: any) {
  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    return {
      dimensions: [],
      measures: [],
      primaryDateCol: null,
      primaryMeasureCol: null,
      primaryDimCol: "Category",
      secondaryDimCol: "Segment"
    };
  }

  const dims: string[] = [];
  const meas: string[] = [];
  let pDate: string | null = datasetMeta?.primaryDateCol || null;
  let pMeas: string | null = datasetMeta?.primaryMeasureCol || null;
  let pDim: string | null = datasetMeta?.primaryDimensionCol || null;
  let sDim: string | null = datasetMeta?.secondaryDimensionCol || null;

  const sample = rows[0] || {};
  columns.forEach(col => {
    const val = sample[col];
    const lower = col.toLowerCase();

    if (
      lower.includes("date") || 
      lower.includes("time") || 
      lower.includes("period") || 
      lower.includes("year") || 
      lower.includes("month") || 
      lower.includes("day")
    ) {
      if (!pDate) pDate = col;
      dims.push(col);
    } else if (
      typeof val === "number" || 
      (!isNaN(Number(val)) && val !== "" && val !== null && typeof val !== "boolean")
    ) {
      meas.push(col);
      if (!pMeas && (
        lower.includes("revenue") || lower.includes("amount") || lower.includes("sales") || 
        lower.includes("cost") || lower.includes("profit") || lower.includes("price") || 
        lower.includes("total") || lower.includes("mrr") || lower.includes("arr") || lower.includes("val")
      )) {
        pMeas = col;
      }
    } else {
      dims.push(col);
    }
  });

  if (!pMeas && meas.length > 0) pMeas = meas[0];
  if (!pDate && dims.length > 0) {
    pDate = dims.find(d => d.toLowerCase().includes("date") || d.toLowerCase().includes("month")) || dims[0];
  }

  if (!pDim) {
    pDim = dims.find(d => 
      !d.toLowerCase().includes("id") && 
      !d.toLowerCase().includes("date") && 
      !d.toLowerCase().includes("month") &&
      !d.toLowerCase().includes("number")
    ) || dims[0] || "Category";
  }

  if (!sDim) {
    sDim = dims.find(d => 
      d !== pDim && 
      !d.toLowerCase().includes("id") && 
      !d.toLowerCase().includes("date") && 
      !d.toLowerCase().includes("month") &&
      !d.toLowerCase().includes("number")
    ) || dims[1] || dims[0] || "Segment";
  }

  return {
    dimensions: dims,
    measures: meas,
    primaryDateCol: pDate,
    primaryMeasureCol: pMeas,
    primaryDimCol: pDim,
    secondaryDimCol: sDim
  };
}

/**
 * Palette of distinct enterprise colors
 */
export const BI_PALETTE = [
  "#6366f1", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", 
  "#8b5cf6", "#06b6d4", "#14b8a6", "#f97316", "#a855f7"
];

/**
 * Natural Language Query Parser for BI Dashboards
 */
export function parseNLQQuery(prompt: string, availableDatasets: any[], dimensions: string[]) {
  const query = prompt.toLowerCase().trim();
  let feedback = "Applied semantic filter.";
  let confidence = 94;
  let datasetToSwitch: string | null = null;
  let dateRangeToSet: string | null = null;
  let filterToAdd: { dim: string; val: string } | null = null;
  let resetRequested = false;

  if (query.includes("reset") || query.includes("clear") || query.includes("all data")) {
    resetRequested = true;
    feedback = "Cleared all categorical filters and reset view to full historical scope.";
    confidence = 99;
  } else if (query.includes("ecommerce") || query.includes("retail") || query.includes("order") || query.includes("cart")) {
    datasetToSwitch = "ecommerce-profitability";
    feedback = "Switched to Global Retail & E-Commerce Orders dataset.";
    confidence = 98;
  } else if (query.includes("saas") || query.includes("subscription") || query.includes("mrr") || query.includes("arr")) {
    datasetToSwitch = "saas-revenue";
    feedback = "Switched to Enterprise SaaS Revenue & Subscription Analytics dataset.";
    confidence = 98;
  } else if (query.includes("healthcare") || query.includes("clinical") || query.includes("hospital") || query.includes("patient")) {
    datasetToSwitch = "healthcare-clinical-ops";
    feedback = "Switched to Healthcare Operations & Clinical Outcomes dataset.";
    confidence = 98;
  } else if (query.includes("supply") || query.includes("chain") || query.includes("fleet") || query.includes("freight") || query.includes("logistics")) {
    datasetToSwitch = "supply-chain-logistics";
    feedback = "Switched to Supply Chain Logistics & Fleet Telematics dataset.";
    confidence = 98;
  } else if (query.includes("telemetry") || query.includes("stream") || query.includes("realtime") || query.includes("real-time")) {
    datasetToSwitch = "telemetry-live";
    feedback = "Switched to Real-Time Telemetry Stream dataset.";
    confidence = 98;
  } else if (query.includes("7 days") || query.includes("last week") || query.includes("past 7")) {
    dateRangeToSet = "7D";
    feedback = "Applied temporal filter: Last 7 Days.";
    confidence = 96;
  } else if (query.includes("30 days") || query.includes("last month") || query.includes("past month") || query.includes("past 30")) {
    dateRangeToSet = "30D";
    feedback = "Applied temporal filter: Last 30 Days.";
    confidence = 96;
  } else if (query.includes("90 days") || query.includes("quarter") || query.includes("past 90")) {
    dateRangeToSet = "90D";
    feedback = "Applied temporal filter: Last 90 Days.";
    confidence = 96;
  } else if (query.includes("ytd") || query.includes("this year") || query.includes("2026")) {
    dateRangeToSet = "YTD";
    feedback = "Applied temporal filter: 2026 Year-to-Date.";
    confidence = 96;
  } else if (query.includes("enterprise")) {
    const dim = dimensions.find(d => d.includes("segment") || d.includes("tier")) || dimensions[0];
    if (dim) filterToAdd = { dim, val: "Enterprise" };
    feedback = `Filtered by ${dim || 'Dimension'}: "Enterprise"`;
    confidence = 92;
  } else {
    feedback = `Executed keyword query: "${prompt}"`;
    confidence = 88;
  }

  return {
    feedback,
    confidence,
    datasetToSwitch,
    dateRangeToSet,
    filterToAdd,
    resetRequested
  };
}
