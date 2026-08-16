/**
 * Enterprise Sample Datasets for Vivexa BI Decision Engine
 * High-fidelity, multi-industry synthetic datasets for instant exploration and deep analytical slicing.
 */

export interface BIDataset {
  id: string;
  name: string;
  category: "Telemetry" | "SaaS" | "E-Commerce" | "Healthcare" | "Supply Chain";
  description: string;
  iconName: string;
  rowCount: number;
  columns: string[];
  primaryDateCol: string;
  primaryMeasureCol: string;
  primaryDimensionCol: string;
  secondaryDimensionCol: string;
  generateRows: () => Record<string, any>[];
}

// Deterministic pseudo-random number generator for reproducible enterprise data
function createSeededRandom(seedInit = 42) {
  let seed = seedInit;
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// 1. Telemetry Live Ingest Dataset
export function generateTelemetryDataset(): Record<string, any>[] {
  const random = createSeededRandom(101);
  const rows: Record<string, any>[] = [];
  const regions = ["North America", "EMEA", "APAC", "LATAM"];
  const segments = ["Enterprise", "Mid-Market", "SMB", "Government"];
  const channels = ["Direct Sales", "Partner Cloud", "Organic Inbound", "Outreach API"];
  const statuses = ["Completed", "Completed", "Completed", "Pending", "Refunded"];
  
  const startDate = new Date(2025, 0, 1);
  const days = 590; // Up to Aug 2026

  for (let d = 0; d < days; d++) {
    const curr = new Date(startDate.getTime() + d * 86400000);
    const dateStr = curr.toISOString().split("T")[0];
    const monthStr = curr.toLocaleString("default", { month: "short", year: "2-digit" });
    const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;
    const count = isWeekend ? Math.floor(4 + random() * 6) : Math.floor(12 + random() * 16);

    for (let i = 0; i < count; i++) {
      const seg = segments[Math.floor(random() * segments.length)];
      let deal = 0;
      if (seg === "Enterprise") deal = 12000 + random() * 32000;
      else if (seg === "Government") deal = 18000 + random() * 45000;
      else if (seg === "Mid-Market") deal = 3500 + random() * 9500;
      else deal = 450 + random() * 1800;

      rows.push({
        transaction_id: `TXN-${curr.getFullYear()}-${(rows.length + 1).toString().padStart(6, '0')}`,
        event_date: dateStr,
        period_month: monthStr,
        geographic_region: regions[Math.floor(random() * regions.length)],
        customer_segment: seg,
        acquisition_channel: channels[Math.floor(random() * channels.length)],
        payment_status: statuses[Math.floor(random() * statuses.length)],
        gross_amount_usd: Number(deal.toFixed(2)),
        compute_units: Math.floor(deal / 18),
        latency_ms: Math.floor(16 + random() * 48)
      });
    }
  }

  return rows.reverse();
}

// 2. Enterprise SaaS Revenue & Subscription Analytics
export function generateSaaSRevenueDataset(): Record<string, any>[] {
  const random = createSeededRandom(202);
  const rows: Record<string, any>[] = [];
  const tiers = ["Enterprise Custom", "Scale Business", "Growth Pro", "Starter"];
  const industries = ["FinTech & Banking", "Healthcare & Life Sciences", "Cybersecurity", "E-Commerce Tech", "Industrial IoT"];
  const regions = ["North America", "Europe West", "Asia Pacific", "Nordics"];
  const churnRisks = ["Low (Healthy)", "Low (Healthy)", "Moderate", "High Risk"];
  
  const startDate = new Date(2025, 0, 1);
  const days = 590;

  for (let d = 0; d < days; d++) {
    const curr = new Date(startDate.getTime() + d * 86400000);
    const dateStr = curr.toISOString().split("T")[0];
    const monthStr = curr.toLocaleString("default", { month: "short", year: "2-digit" });
    const count = Math.floor(6 + random() * 10);

    for (let i = 0; i < count; i++) {
      const tier = tiers[Math.floor(random() * tiers.length)];
      let mrr = 0;
      let seats = 10;
      if (tier === "Enterprise Custom") { mrr = 8500 + random() * 25000; seats = 250 + Math.floor(random() * 1000); }
      else if (tier === "Scale Business") { mrr = 2400 + random() * 6000; seats = 80 + Math.floor(random() * 200); }
      else if (tier === "Growth Pro") { mrr = 650 + random() * 1800; seats = 20 + Math.floor(random() * 60); }
      else { mrr = 120 + random() * 450; seats = 5 + Math.floor(random() * 15); }

      const nrrPct = Number((98 + random() * 32).toFixed(1));
      const ltvUsd = Number((mrr * (24 + random() * 24)).toFixed(2));
      const arrUsd = Number((mrr * 12).toFixed(2));

      rows.push({
        subscription_id: `SUB-${curr.getFullYear()}-${(rows.length + 1001)}`,
        signup_date: dateStr,
        period_month: monthStr,
        plan_tier: tier,
        industry_vertical: industries[Math.floor(random() * industries.length)],
        geographic_region: regions[Math.floor(random() * regions.length)],
        churn_risk_level: churnRisks[Math.floor(random() * churnRisks.length)],
        monthly_recurring_revenue: Number(mrr.toFixed(2)),
        annual_recurring_revenue: arrUsd,
        active_seats: seats,
        net_retention_rate_pct: nrrPct,
        customer_lifetime_value: ltvUsd,
        api_calls_monthly_k: Math.floor(150 + random() * 1800)
      });
    }
  }

  return rows.reverse();
}

// 3. Global E-Commerce & Retail Profitability Dataset
export function generateECommerceDataset(): Record<string, any>[] {
  const random = createSeededRandom(303);
  const rows: Record<string, any>[] = [];
  const categories = ["Enterprise Hardware", "Cloud Peripherals", "Edge Gateways", "Smart Sensors", "Server Racks"];
  const channels = ["B2B Portal", "Global Distributor", "Direct Cloud Market", "Reseller Partner"];
  const countries = ["United States", "Germany", "Japan", "United Kingdom", "Canada", "Singapore"];
  
  const startDate = new Date(2025, 0, 1);
  const days = 590;

  for (let d = 0; d < days; d++) {
    const curr = new Date(startDate.getTime() + d * 86400000);
    const dateStr = curr.toISOString().split("T")[0];
    const monthStr = curr.toLocaleString("default", { month: "short", year: "2-digit" });
    const count = Math.floor(8 + random() * 12);

    for (let i = 0; i < count; i++) {
      const cat = categories[Math.floor(random() * categories.length)];
      const units = Math.floor(1 + random() * 15);
      let unitPrice = 0;
      if (cat === "Server Racks") unitPrice = 4500 + random() * 12000;
      else if (cat === "Enterprise Hardware") unitPrice = 1800 + random() * 5500;
      else if (cat === "Edge Gateways") unitPrice = 650 + random() * 2200;
      else unitPrice = 180 + random() * 650;

      const grossSales = Number((units * unitPrice).toFixed(2));
      const discountPct = Math.floor(random() * 18);
      const netSales = Number((grossSales * (1 - discountPct / 100)).toFixed(2));
      const marginPct = Number((22 + random() * 38).toFixed(1));
      const netProfit = Number((netSales * (marginPct / 100)).toFixed(2));

      rows.push({
        order_number: `ORD-2026-${(rows.length + 50000)}`,
        order_date: dateStr,
        period_month: monthStr,
        product_category: cat,
        sales_channel: channels[Math.floor(random() * channels.length)],
        destination_country: countries[Math.floor(random() * countries.length)],
        quantity_units: units,
        unit_price_usd: Number(unitPrice.toFixed(2)),
        discount_percent: discountPct,
        net_sales_revenue: netSales,
        profit_margin_percent: marginPct,
        net_profit_usd: netProfit,
        delivery_days: Math.floor(2 + random() * 7)
      });
    }
  }

  return rows.reverse();
}

// 4. Healthcare Operations & Clinical Outcomes Dataset
export function generateHealthcareDataset(): Record<string, any>[] {
  const random = createSeededRandom(404);
  const rows: Record<string, any>[] = [];
  const departments = ["Cardiovascular", "Neurology", "Oncology", "Orthopedic Surgery", "Emergency Medicine"];
  const admissionTypes = ["Emergency", "Elective Referral", "Urgent Transfer", "Outpatient Ambulatory"];
  const outcomeStatuses = ["Discharged Routine", "Discharged Routine", "Referred Care", "Follow-up Required"];
  
  const startDate = new Date(2025, 0, 1);
  const days = 590;

  for (let d = 0; d < days; d++) {
    const curr = new Date(startDate.getTime() + d * 86400000);
    const dateStr = curr.toISOString().split("T")[0];
    const monthStr = curr.toLocaleString("default", { month: "short", year: "2-digit" });
    const count = Math.floor(5 + random() * 8);

    for (let i = 0; i < count; i++) {
      const dept = departments[Math.floor(random() * departments.length)];
      const losDays = Math.floor(1 + random() * 12);
      let baseCost = 0;
      if (dept === "Cardiovascular") baseCost = 14000 + random() * 38000;
      else if (dept === "Oncology") baseCost = 18000 + random() * 45000;
      else if (dept === "Neurology") baseCost = 12000 + random() * 32000;
      else baseCost = 4500 + random() * 16000;

      const procedureCost = Number(baseCost.toFixed(2));
      const patientSatisfaction = Number((3.8 + random() * 1.2).toFixed(1));

      rows.push({
        admission_id: `ADM-2026-${(rows.length + 10000)}`,
        admission_date: dateStr,
        period_month: monthStr,
        clinical_department: dept,
        admission_type: admissionTypes[Math.floor(random() * admissionTypes.length)],
        discharge_status: outcomeStatuses[Math.floor(random() * outcomeStatuses.length)],
        length_of_stay_days: losDays,
        total_procedure_cost: procedureCost,
        patient_satisfaction_score: patientSatisfaction,
        readmission_risk_score: Math.floor(10 + random() * 55),
        nurse_to_patient_ratio: Number((0.25 + random() * 0.35).toFixed(2))
      });
    }
  }

  return rows.reverse();
}

// 5. Supply Chain Logistics & Fleet Telematics
export function generateSupplyChainDataset(): Record<string, any>[] {
  const random = createSeededRandom(505);
  const rows: Record<string, any>[] = [];
  const corridors = ["Trans-Pacific Express", "North American Interstate", "Pan-European Route", "Asia-Middle East Corridor"];
  const transportModes = ["Air Freight", "Intermodal Rail", "Dedicated Fleet", "Ocean Container"];
  const complianceStatuses = ["Compliant", "Compliant", "Minor Temperature Variance", "Delay Cleared"];
  
  const startDate = new Date(2025, 0, 1);
  const days = 590;

  for (let d = 0; d < days; d++) {
    const curr = new Date(startDate.getTime() + d * 86400000);
    const dateStr = curr.toISOString().split("T")[0];
    const monthStr = curr.toLocaleString("default", { month: "short", year: "2-digit" });
    const count = Math.floor(6 + random() * 10);

    for (let i = 0; i < count; i++) {
      const mode = transportModes[Math.floor(random() * transportModes.length)];
      let freightValue = 0;
      let fuelCost = 0;
      if (mode === "Air Freight") { freightValue = 45000 + random() * 120000; fuelCost = 3500 + random() * 8500; }
      else if (mode === "Ocean Container") { freightValue = 85000 + random() * 250000; fuelCost = 5500 + random() * 15000; }
      else { freightValue = 18000 + random() * 65000; fuelCost = 1200 + random() * 3800; }

      const delayMins = Math.floor(random() < 0.7 ? random() * 20 : 30 + random() * 180);
      const onTimeScore = Number(Math.max(70, 100 - delayMins * 0.25).toFixed(1));

      rows.push({
        shipment_tracking_id: `SHP-${curr.getFullYear()}-${(rows.length + 80000)}`,
        dispatch_date: dateStr,
        period_month: monthStr,
        shipping_corridor: corridors[Math.floor(random() * corridors.length)],
        transport_mode: mode,
        compliance_status: complianceStatuses[Math.floor(random() * complianceStatuses.length)],
        cargo_value_usd: Number(freightValue.toFixed(2)),
        fuel_operating_cost: Number(fuelCost.toFixed(2)),
        delay_duration_minutes: delayMins,
        on_time_reliability_score: onTimeScore,
        warehouse_utilization_pct: Number((72 + random() * 26).toFixed(1))
      });
    }
  }

  return rows.reverse();
}

export const ENTERPRISE_SAMPLE_DATASETS: BIDataset[] = [
  {
    id: "telemetry-live",
    name: "Global Telemetry (Real-Time Live)",
    category: "Telemetry",
    description: "High-frequency streaming transactions, regional latency, compute units, and settlement metrics.",
    iconName: "Activity",
    rowCount: 8500,
    columns: [
      "transaction_id", "event_date", "period_month", "geographic_region", 
      "customer_segment", "acquisition_channel", "payment_status", 
      "gross_amount_usd", "compute_units", "latency_ms"
    ],
    primaryDateCol: "event_date",
    primaryMeasureCol: "gross_amount_usd",
    primaryDimensionCol: "geographic_region",
    secondaryDimensionCol: "customer_segment",
    generateRows: generateTelemetryDataset
  },
  {
    id: "saas-revenue-master",
    name: "Enterprise SaaS Revenue & Subscriptions",
    category: "SaaS",
    description: "B2B SaaS MRR, ARR, active seats, NRR retention, industry segments, and churn telemetry.",
    iconName: "TrendingUp",
    rowCount: 5200,
    columns: [
      "subscription_id", "signup_date", "period_month", "plan_tier",
      "industry_vertical", "geographic_region", "churn_risk_level",
      "monthly_recurring_revenue", "annual_recurring_revenue",
      "active_seats", "net_retention_rate_pct", "customer_lifetime_value", "api_calls_monthly_k"
    ],
    primaryDateCol: "signup_date",
    primaryMeasureCol: "monthly_recurring_revenue",
    primaryDimensionCol: "industry_vertical",
    secondaryDimensionCol: "plan_tier",
    generateRows: generateSaaSRevenueDataset
  },
  {
    id: "ecommerce-profitability",
    name: "Global Retail & E-Commerce Orders",
    category: "E-Commerce",
    description: "Product categories, unit sales, discounting, net margins, and cross-border distribution.",
    iconName: "FileSpreadsheet",
    rowCount: 6800,
    columns: [
      "order_number", "order_date", "period_month", "product_category",
      "sales_channel", "destination_country", "quantity_units",
      "unit_price_usd", "discount_percent", "net_sales_revenue",
      "profit_margin_percent", "net_profit_usd", "delivery_days"
    ],
    primaryDateCol: "order_date",
    primaryMeasureCol: "net_sales_revenue",
    primaryDimensionCol: "product_category",
    secondaryDimensionCol: "sales_channel",
    generateRows: generateECommerceDataset
  },
  {
    id: "healthcare-clinical-ops",
    name: "Healthcare Operations & Outcomes",
    category: "Healthcare",
    description: "Hospital admissions, clinical departments, length of stay, procedure costs, and satisfaction.",
    iconName: "ShieldCheck",
    rowCount: 4100,
    columns: [
      "admission_id", "admission_date", "period_month", "clinical_department",
      "admission_type", "discharge_status", "length_of_stay_days",
      "total_procedure_cost", "patient_satisfaction_score",
      "readmission_risk_score", "nurse_to_patient_ratio"
    ],
    primaryDateCol: "admission_date",
    primaryMeasureCol: "total_procedure_cost",
    primaryDimensionCol: "clinical_department",
    secondaryDimensionCol: "admission_type",
    generateRows: generateHealthcareDataset
  },
  {
    id: "supply-chain-logistics",
    name: "Supply Chain Logistics & Fleet",
    category: "Supply Chain",
    description: "Freight transport corridors, transit modes, delay minutes, fuel costs, and reliability indices.",
    iconName: "Database",
    rowCount: 4900,
    columns: [
      "shipment_tracking_id", "dispatch_date", "period_month", "shipping_corridor",
      "transport_mode", "compliance_status", "cargo_value_usd",
      "fuel_operating_cost", "delay_duration_minutes",
      "on_time_reliability_score", "warehouse_utilization_pct"
    ],
    primaryDateCol: "dispatch_date",
    primaryMeasureCol: "cargo_value_usd",
    primaryDimensionCol: "shipping_corridor",
    secondaryDimensionCol: "transport_mode",
    generateRows: generateSupplyChainDataset
  }
];
