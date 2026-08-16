const fs = require('fs');

let code = fs.readFileSync('src/pages/workspace/SemanticLayer.tsx', 'utf8');

const replacement = `const INITIAL_ENTERPRISE_METRICS: SemanticMetric[] = [
  {
    id: "m-mrr-01",
    name: "Monthly Recurring Revenue (MRR)",
    description: "Normalized monthly subscription revenue excluding one-time professional services.",
    expression: "SUM(monthly_subscription_amount) - SUM(discounts)",
    sql: "SELECT SUM(amount) FROM subscriptions WHERE status = 'active' AND type = 'recurring'",
    type: "Sum",
    category: "Revenue",
    status: "Verified",
    owner: "Finance Data Team",
    lineage: ["Stripe.Invoices", "Salesforce.Contracts", "Lakehouse.Fact_Revenue"]
  },
  {
    id: "m-churn-02",
    name: "Logo Churn Rate",
    description: "Percentage of unique active customer accounts cancelled in the trailing 30 days.",
    expression: "(Cancelled_Customers_30d / Total_Active_Customers_Start_30d) * 100",
    sql: "SELECT (COUNT(CASE WHEN churned_at > CURRENT_DATE - 30 THEN 1 END) / COUNT(CASE WHEN created_at < CURRENT_DATE - 30 THEN 1 END)) * 100 FROM customers",
    type: "Ratio",
    category: "Risk",
    status: "Verified",
    owner: "Customer Success",
    lineage: ["Zendesk.Accounts", "Lakehouse.Dim_Customer"]
  },
  {
    id: "m-cac-03",
    name: "Customer Acquisition Cost (CAC)",
    description: "Fully burdened marketing and sales spend divided by net new logos.",
    expression: "Total_S&M_Spend / Net_New_Logos",
    sql: "SELECT SUM(spend) / COUNT(DISTINCT new_customer_id) FROM marketing_attribution",
    type: "Average",
    category: "Operational",
    status: "Draft",
    owner: "Marketing Analytics",
    lineage: ["GoogleAds.Spend", "LinkedIn.Spend", "HubSpot.Deals"]
  },
  {
    id: "m-nrr-04",
    name: "Net Retention Rate (NRR)",
    description: "Revenue retained from existing customers including expansions, minus downgrades and churn.",
    expression: "(Starting_MRR + Expansion_MRR - Downgrade_MRR - Churn_MRR) / Starting_MRR",
    sql: "SELECT ((sum(start_mrr) + sum(expansion) - sum(downgrade) - sum(churn)) / sum(start_mrr)) * 100 FROM mrr_waterfall",
    type: "Ratio",
    category: "Revenue",
    status: "Verified",
    owner: "Finance Data Team",
    lineage: ["Lakehouse.Fact_MRR_Waterfall"]
  },
  {
    id: "m-dau-05",
    name: "Daily Active Users (DAU)",
    description: "Unique authenticated user sessions performing a core platform action.",
    expression: "COUNT(DISTINCT user_id) WHERE action_type IN ('query', 'view', 'edit')",
    sql: "SELECT COUNT(DISTINCT user_id) FROM events_log WHERE timestamp >= CURRENT_DATE - 1",
    type: "Distinct",
    category: "User Growth",
    status: "Verified",
    owner: "Product Data",
    lineage: ["Mixpanel.Events", "Lakehouse.Fact_Session"]
  }
];

export default function SemanticLayer() {
  const [metrics, setMetrics] = useState<SemanticMetric[]>(() => {
    try {
      const saved = localStorage.getItem('vivexa_semantic_metrics');
      return saved ? JSON.parse(saved) : INITIAL_ENTERPRISE_METRICS;
    } catch {
      return INITIAL_ENTERPRISE_METRICS;
    }
  });

  // Auto-persist changes
  useMemo(() => {
    localStorage.setItem('vivexa_semantic_metrics', JSON.stringify(metrics));
  }, [metrics]);`;

code = code.replace(
  /const DEFAULT_METRICS: SemanticMetric\[\] = \[\];\n\nexport default function SemanticLayer\(\) \{\n  const \[metrics, setMetrics\] = useState<SemanticMetric\[\]>\(DEFAULT_METRICS\);/,
  replacement
);

fs.writeFileSync('src/pages/workspace/SemanticLayer.tsx', code);
