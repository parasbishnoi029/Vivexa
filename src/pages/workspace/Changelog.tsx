import { useState, useEffect, useMemo } from "react";
import { 
  ScrollText, Sparkles, Zap, CheckCircle2, Search, Bot, 
  Download, RefreshCw, Sliders, PlayCircle, Trophy, 
  Copy, Check, FileText, ChevronDown, ChevronUp, Star, Flame, Eye,
  Lock, ShieldAlert, Key, LogOut, UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// =========================================================================
// CHANGELOG RELEASE ENTRIES
// =========================================================================
const CHANGELOG_ENTRIES = [
  {
    version: "v2.4.0",
    date: "August 2026",
    badge: "Latest Release",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    highlights: [
      { type: "feature", title: "Real-time Notification Center Drawer", desc: "Integrated instant persistent notifications with live Supabase database sync, drawer controls, and unread badges." },
      { type: "feature", title: "Data Cleaning Studio Pipeline", desc: "Added complete automated quality audit scores, missing value imputation, and clean dataset export capabilities." },
      { type: "improvement", title: "Interactive Workspace Search & Filtering", desc: "Enhanced global search across projects, datasets, AI models, and API keys." }
    ]
  },
  {
    version: "v2.3.1",
    date: "July 2026",
    highlights: [
      { type: "improvement", title: "AI Analyst Memory Persistence", desc: "Added full conversation memory and contextual document recall for workspace queries." },
      { type: "fix", title: "Workspace Layout & Drawer Z-Index", desc: "Resolved UI overlay bugs and enhanced mobile responsive drawer interactions." }
    ]
  },
  {
    version: "v2.2.0",
    date: "June 2026",
    highlights: [
      { type: "feature", title: "API Keys Management & Usage Logs", desc: "Developer portal for creating scoped secret keys with environment toggles." },
      { type: "feature", title: "Interactive Python & SQL Notebooks", desc: "In-browser executable data science notebooks with dataset binding." }
    ]
  }
];

// =========================================================================
// ROADMAP FEATURE CHECKLIST STRUCTURE & DATA
// =========================================================================
interface FeatureItem {
  id: string;
  name: string;
  isEnterprise?: boolean;
  isUnique?: boolean;
  isPrebuiltInApp?: boolean; // Tag for auto-detector
}

interface FeatureSection {
  id: string;
  title: string;
  category: string; // Groups for Progress Dashboard
  items: FeatureItem[];
}

const ROADMAP_SECTIONS: FeatureSection[] = [
  {
    id: "auth",
    title: "1. Authentication",
    category: "Authentication",
    items: [
      { id: "auth_email", name: "Email Login", isPrebuiltInApp: true },
      { id: "auth_magic", name: "Magic Link" },
      { id: "auth_otp", name: "OTP Login" },
      { id: "auth_forgot", name: "Forgot Password", isPrebuiltInApp: true },
      { id: "auth_verify", name: "Email Verification" },
      { id: "auth_mfa", name: "Multi-factor Authentication" },
      { id: "auth_session", name: "Session Management", isPrebuiltInApp: true },
      { id: "auth_settings", name: "Account Settings", isPrebuiltInApp: true },
      { id: "auth_profile", name: "User Profile", isPrebuiltInApp: true },
      { id: "auth_apikeys", name: "API Keys", isPrebuiltInApp: true },
      { id: "auth_org", name: "Organization Accounts", isPrebuiltInApp: true },
      { id: "auth_invite", name: "Team Invitations", isPrebuiltInApp: true },
      { id: "auth_role", name: "Role Management", isPrebuiltInApp: true },
      { id: "auth_perm", name: "Permission System", isPrebuiltInApp: true },
      { id: "auth_supabase", name: "Supabase Auth", isPrebuiltInApp: true } // Initial checked item
    ]
  },
  {
    id: "sources_files",
    title: "2. Data Sources - Files",
    category: "Data Sources",
    items: [
      { id: "src_csv", name: "CSV", isPrebuiltInApp: true },
      { id: "src_excel", name: "Excel", isPrebuiltInApp: true },
      { id: "src_json", name: "JSON", isPrebuiltInApp: true },
      { id: "src_xml", name: "XML", isPrebuiltInApp: true },
      { id: "src_parquet", name: "Parquet", isPrebuiltInApp: true },
      { id: "src_pdf", name: "PDF", isPrebuiltInApp: true },
      { id: "src_word", name: "Word" },
      { id: "src_pptx", name: "PowerPoint" },
      { id: "src_img", name: "Images" },
      { id: "src_zip", name: "ZIP" }
    ]
  },
  {
    id: "sources_db",
    title: "2. Data Sources - Databases",
    category: "Data Sources",
    items: [
      { id: "src_postgres", name: "PostgreSQL", isPrebuiltInApp: true },
      { id: "src_mysql", name: "MySQL" },
      { id: "src_mariadb", name: "MariaDB" },
      { id: "src_sqlserver", name: "SQL Server" },
      { id: "src_oracle", name: "Oracle" },
      { id: "src_sqlite", name: "SQLite" },
      { id: "src_mongo", name: "MongoDB" },
      { id: "src_redis", name: "Redis" },
      { id: "src_cassandra", name: "Cassandra" },
      { id: "src_dynamo", name: "DynamoDB" },
      { id: "src_elastic", name: "Elasticsearch" },
      { id: "src_clickhouse", name: "ClickHouse" },
      { id: "src_neo4j", name: "Neo4j" },
      { id: "src_duckdb", name: "DuckDB" }
    ]
  },
  {
    id: "sources_cloud",
    title: "2. Data Sources - Cloud",
    category: "Data Sources",
    items: [
      { id: "src_gdrive", name: "Google Drive" },
      { id: "src_onedrive", name: "OneDrive" },
      { id: "src_dropbox", name: "Dropbox" },
      { id: "src_s3", name: "AWS S3" },
      { id: "src_azure", name: "Azure Blob" },
      { id: "src_gcs", name: "Google Cloud Storage" }
    ]
  },
  {
    id: "sources_api",
    title: "2. Data Sources - APIs",
    category: "Data Sources",
    items: [
      { id: "src_rest", name: "REST", isPrebuiltInApp: true },
      { id: "src_graphql", name: "GraphQL" },
      { id: "src_soap", name: "SOAP" },
      { id: "src_webhooks", name: "Webhooks" }
    ]
  },
  {
    id: "storage",
    title: "3. Data Storage",
    category: "Data Storage",
    items: [
      { id: "stor_lake", name: "Data Lake" },
      { id: "stor_lakehouse", name: "Lakehouse" },
      { id: "stor_warehouse", name: "Data Warehouse" },
      { id: "stor_catalog", name: "Metadata Catalog" },
      { id: "stor_lineage", name: "Data Lineage" },
      { id: "stor_vcs", name: "Version Control", isPrebuiltInApp: true },
      { id: "stor_history", name: "Dataset History", isPrebuiltInApp: true },
      { id: "stor_share", name: "Dataset Sharing", isPrebuiltInApp: true },
      { id: "stor_tags", name: "Data Tags", isPrebuiltInApp: true },
      { id: "stor_search", name: "Search", isPrebuiltInApp: true }
    ]
  },
  {
    id: "cleaning",
    title: "4. Data Cleaning",
    category: "Data Cleaning",
    items: [
      { id: "clean_missing", name: "Missing Value Detection", isPrebuiltInApp: true },
      { id: "clean_dups", name: "Duplicate Detection", isPrebuiltInApp: true },
      { id: "clean_outliers", name: "Outlier Detection", isPrebuiltInApp: true },
      { id: "clean_val", name: "Data Validation", isPrebuiltInApp: true },
      { id: "clean_type", name: "Type Detection", isPrebuiltInApp: true },
      { id: "clean_null", name: "Null Analysis", isPrebuiltInApp: true },
      { id: "clean_rename", name: "Column Rename", isPrebuiltInApp: true },
      { id: "clean_merge", name: "Merge Tables" },
      { id: "clean_split", name: "Split Columns" },
      { id: "clean_trans", name: "Data Transformation", isPrebuiltInApp: true },
      { id: "clean_ai", name: "AI Data Cleaning", isPrebuiltInApp: true }
    ]
  },
  {
    id: "etl",
    title: "5. ETL Pipelines",
    category: "ETL",
    items: [
      { id: "etl_builder", name: "Drag Drop Builder", isPrebuiltInApp: true },
      { id: "etl_sched", name: "Scheduling", isPrebuiltInApp: true },
      { id: "etl_sync", name: "Incremental Sync" },
      { id: "etl_retry", name: "Retry Failed Jobs" },
      { id: "etl_logs", name: "Pipeline Logs", isPrebuiltInApp: true },
      { id: "etl_notify", name: "Notifications", isPrebuiltInApp: true },
      { id: "etl_ai", name: "AI Pipeline Builder" }
    ]
  },
  {
    id: "ai_chat",
    title: "6. AI Features - Chat",
    category: "AI",
    items: [
      { id: "ai_chat_data", name: "Chat with Data", isPrebuiltInApp: true },
      { id: "ai_chat_pdf", name: "Chat with PDF", isPrebuiltInApp: true },
      { id: "ai_chat_excel", name: "Chat with Excel", isPrebuiltInApp: true },
      { id: "ai_chat_sql", name: "Chat with SQL" },
      { id: "ai_chat_dash", name: "Chat with Dashboard" },
      { id: "ai_chat_img", name: "Chat with Images" }
    ]
  },
  {
    id: "ai_agents",
    title: "6. AI Features - Agents",
    category: "AI",
    items: [
      { id: "ai_agt_sql", name: "SQL Agent", isPrebuiltInApp: true },
      { id: "ai_agt_py", name: "Python Agent" },
      { id: "ai_agt_viz", name: "Visualization Agent" },
      { id: "ai_agt_fc", name: "Forecast Agent", isPrebuiltInApp: true },
      { id: "ai_agt_rpt", name: "Report Agent" },
      { id: "ai_agt_res", name: "Research Agent" },
      { id: "ai_agt_ds", name: "Dashboard Agent" },
      { id: "ai_agt_cln", name: "Cleaning Agent" },
      { id: "ai_agt_auto", name: "Automation Agent" },
      { id: "ai_agt_collab", name: "Multi-Agent Collaboration", isPrebuiltInApp: true }
    ]
  },
  {
    id: "ai_core",
    title: "6. AI Features - Core Intelligence",
    category: "AI",
    items: [
      { id: "ai_rag", name: "RAG", isPrebuiltInApp: true },
      { id: "ai_vecdb", name: "Vector Database" },
      { id: "ai_semantic_search", name: "Semantic Search", isPrebuiltInApp: true },
      { id: "ai_memory", name: "Long-term Memory", isPrebuiltInApp: true },
      { id: "ai_prompts", name: "Prompt Templates", isPrebuiltInApp: true },
      { id: "ai_prompt_ver", name: "Prompt Versioning" },
      { id: "ai_eval", name: "AI Evaluation" },
      { id: "ai_token", name: "Token Tracking", isPrebuiltInApp: true },
      { id: "ai_cost", name: "AI Cost Tracking", isPrebuiltInApp: true },
      { id: "ai_explain", name: "AI Explainability" },
      { id: "ai_confidence", name: "AI Confidence Score", isPrebuiltInApp: true }
    ]
  },
  {
    id: "analytics",
    title: "7. Analytics",
    category: "Analytics",
    items: [
      { id: "an_desc", name: "Descriptive Analytics", isPrebuiltInApp: true },
      { id: "an_diag", name: "Diagnostic Analytics" },
      { id: "an_predictive", name: "Predictive Analytics", isPrebuiltInApp: true },
      { id: "an_prescriptive", name: "Prescriptive Analytics" },
      { id: "an_forecast", name: "Time Series Forecasting", isPrebuiltInApp: true },
      { id: "an_regression", name: "Regression", isPrebuiltInApp: true },
      { id: "an_classification", name: "Classification", isPrebuiltInApp: true },
      { id: "an_clustering", name: "Clustering" },
      { id: "an_churn", name: "Churn Prediction", isPrebuiltInApp: true },
      { id: "an_cohort", name: "Cohort Analysis" },
      { id: "an_funnel", name: "Funnel Analysis" },
      { id: "an_rootcase", name: "Root Cause Analysis", isPrebuiltInApp: true },
      { id: "an_whatif", name: "What-if Analysis", isPrebuiltInApp: true },
      { id: "an_scenario", name: "Scenario Analysis" }
    ]
  },
  {
    id: "ml",
    title: "8. Machine Learning",
    category: "Machine Learning",
    items: [
      { id: "ml_automl", name: "AutoML", isPrebuiltInApp: true },
      { id: "ml_train", name: "Model Training", isPrebuiltInApp: true },
      { id: "ml_track", name: "Experiment Tracking" },
      { id: "ml_registry", name: "Model Registry" },
      { id: "ml_fstore", name: "Feature Store" },
      { id: "ml_hparam", name: "Hyperparameter Search" },
      { id: "ml_deploy", name: "Model Deployment" },
      { id: "ml_drift", name: "Drift Detection" },
      { id: "ml_monitoring", name: "Monitoring" }
    ]
  },
  {
    id: "dashboards",
    title: "9. Dashboards",
    category: "Dashboards",
    items: [
      { id: "db_builder", name: "Dashboard Builder", isPrebuiltInApp: true },
      { id: "db_resp", name: "Responsive Layout", isPrebuiltInApp: true },
      { id: "db_kpi", name: "KPI Cards", isPrebuiltInApp: true },
      { id: "db_drilldown", name: "Drill Down" },
      { id: "db_drillthrough", name: "Drill Through" },
      { id: "db_filters", name: "Global Filters", isPrebuiltInApp: true },
      { id: "db_cross", name: "Cross Filtering" },
      { id: "db_themes", name: "Dashboard Themes", isPrebuiltInApp: true },
      { id: "db_ai_builder", name: "AI Dashboard Builder", isPrebuiltInApp: true },
      { id: "db_share", name: "Dashboard Sharing", isPrebuiltInApp: true },
      { id: "db_export", name: "Dashboard Export", isPrebuiltInApp: true }
    ]
  },
  {
    id: "charts",
    title: "10. Charts",
    category: "Dashboards",
    items: [
      { id: "ch_line", name: "Line", isPrebuiltInApp: true },
      { id: "ch_bar", name: "Bar", isPrebuiltInApp: true },
      { id: "ch_pie", name: "Pie", isPrebuiltInApp: true },
      { id: "ch_area", name: "Area", isPrebuiltInApp: true },
      { id: "ch_scatter", name: "Scatter", isPrebuiltInApp: true },
      { id: "ch_bubble", name: "Bubble" },
      { id: "ch_heatmap", name: "Heatmap", isPrebuiltInApp: true },
      { id: "ch_histogram", name: "Histogram" },
      { id: "ch_treemap", name: "Treemap" },
      { id: "ch_sunburst", name: "Sunburst" },
      { id: "ch_sankey", name: "Sankey" },
      { id: "ch_radar", name: "Radar" },
      { id: "ch_boxplot", name: "Box Plot" },
      { id: "ch_waterfall", name: "Waterfall" },
      { id: "ch_gantt", name: "Gantt" },
      { id: "ch_geomap", name: "Geo Map" },
      { id: "ch_choropleth", name: "Choropleth", isPrebuiltInApp: true },
      { id: "ch_network", name: "Network Graph" },
      { id: "ch_timeline", name: "Timeline" }
    ]
  },
  {
    id: "notebooks",
    title: "11. Notebook",
    category: "Reports",
    items: [
      { id: "nb_python", name: "Python Cells", isPrebuiltInApp: true },
      { id: "nb_sql", name: "SQL Cells", isPrebuiltInApp: true },
      { id: "nb_markdown", name: "Markdown", isPrebuiltInApp: true },
      { id: "nb_ai", name: "AI Cells", isPrebuiltInApp: true },
      { id: "nb_viz", name: "Visualization", isPrebuiltInApp: true },
      { id: "nb_var", name: "Variable Explorer" },
      { id: "nb_share", name: "Notebook Sharing" },
      { id: "nb_history", name: "Version History" },
      { id: "nb_collab", name: "Live Collaboration" }
    ]
  },
  {
    id: "reports",
    title: "12. Reports",
    category: "Reports",
    items: [
      { id: "rep_pdf", name: "PDF Export", isPrebuiltInApp: true },
      { id: "rep_excel", name: "Excel Export", isPrebuiltInApp: true },
      { id: "rep_pptx", name: "PowerPoint Export" },
      { id: "rep_word", name: "Word Export" },
      { id: "rep_ai", name: "AI Report", isPrebuiltInApp: true },
      { id: "rep_sched", name: "Scheduled Reports", isPrebuiltInApp: true },
      { id: "rep_email", name: "Email Reports", isPrebuiltInApp: true }
    ]
  },
  {
    id: "collab",
    title: "13. Collaboration",
    category: "Collaboration",
    items: [
      { id: "col_teams", name: "Teams", isPrebuiltInApp: true },
      { id: "col_workspaces", name: "Workspaces", isPrebuiltInApp: true },
      { id: "col_comments", name: "Comments", isPrebuiltInApp: true },
      { id: "col_mentions", name: "Mentions" },
      { id: "col_feed", name: "Activity Feed", isPrebuiltInApp: true },
      { id: "col_notify", name: "Notifications", isPrebuiltInApp: true },
      { id: "col_dash", name: "Shared Dashboards", isPrebuiltInApp: true },
      { id: "col_data", name: "Shared Datasets", isPrebuiltInApp: true },
      { id: "col_audit", name: "Audit Logs", isPrebuiltInApp: true }
    ]
  },
  {
    id: "search",
    title: "14. Search",
    category: "Collaboration",
    items: [
      { id: "sea_dataset", name: "Dataset Search", isPrebuiltInApp: true },
      { id: "sea_dash", name: "Dashboard Search", isPrebuiltInApp: true },
      { id: "sea_notebook", name: "Notebook Search", isPrebuiltInApp: true },
      { id: "sea_semantic", name: "Semantic Search", isPrebuiltInApp: true },
      { id: "sea_ai", name: "AI Search", isPrebuiltInApp: true },
      { id: "sea_global", name: "Global Search", isPrebuiltInApp: true }
    ]
  },
  {
    id: "security",
    title: "15. Security",
    category: "Security",
    items: [
      { id: "sec_rbac", name: "RBAC", isPrebuiltInApp: true },
      { id: "sec_rls", name: "Row Level Security", isPrebuiltInApp: true },
      { id: "sec_cls", name: "Column Level Security" },
      { id: "sec_enc", name: "Encryption", isPrebuiltInApp: true },
      { id: "sec_sso", name: "SSO" },
      { id: "sec_oauth", name: "OAuth", isPrebuiltInApp: true },
      { id: "sec_saml", name: "SAML" },
      { id: "sec_jwt", name: "JWT", isPrebuiltInApp: true },
      { id: "sec_audit", name: "Audit Trail", isPrebuiltInApp: true },
      { id: "sec_secret", name: "Secret Manager" },
      { id: "sec_gdpr", name: "GDPR" },
      { id: "sec_soc2", name: "SOC2 Ready" },
      { id: "sec_hipaa", name: "HIPAA Ready" }
    ]
  },
  {
    id: "automation",
    title: "16. Automation",
    category: "Security",
    items: [
      { id: "aut_workflow", name: "Workflow Builder", isPrebuiltInApp: true },
      { id: "aut_sched", name: "Scheduled Jobs", isPrebuiltInApp: true },
      { id: "aut_email", name: "Email Automation" },
      { id: "aut_slack", name: "Slack Integration", isPrebuiltInApp: true },
      { id: "aut_teams", name: "Teams Integration" },
      { id: "aut_discord", name: "Discord Integration" },
      { id: "aut_webhooks", name: "Webhooks" },
      { id: "aut_triggers", name: "Event Triggers", isPrebuiltInApp: true }
    ]
  },
  {
    id: "apis",
    title: "17. APIs",
    category: "Security",
    items: [
      { id: "api_rest", name: "REST API", isPrebuiltInApp: true },
      { id: "api_graphql", name: "GraphQL API" },
      { id: "api_sdk", name: "SDK" },
      { id: "api_cli", name: "CLI" },
      { id: "api_webhooks", name: "Webhooks" },
      { id: "api_pluginsdk", name: "Plugin SDK" },
      { id: "api_mcp", name: "MCP Server" },
      { id: "api_playground", name: "API Playground" }
    ]
  },
  {
    id: "performance",
    title: "18. Performance",
    category: "Security",
    items: [
      { id: "perf_redis", name: "Redis Cache" },
      { id: "perf_cdn", name: "CDN" },
      { id: "perf_jobs", name: "Background Jobs", isPrebuiltInApp: true },
      { id: "perf_queue", name: "Queue System" },
      { id: "perf_lazy", name: "Lazy Loading", isPrebuiltInApp: true },
      { id: "perf_compress", name: "Compression" },
      { id: "perf_opt", name: "Query Optimization" }
    ]
  },
  {
    id: "monitoring",
    title: "19. Monitoring",
    category: "Security",
    items: [
      { id: "mon_logs", name: "Logs", isPrebuiltInApp: true },
      { id: "mon_metrics", name: "Metrics", isPrebuiltInApp: true },
      { id: "mon_errors", name: "Error Tracking", isPrebuiltInApp: true },
      { id: "mon_health", name: "Health Checks", isPrebuiltInApp: true },
      { id: "mon_ai", name: "AI Usage", isPrebuiltInApp: true },
      { id: "mon_cost", name: "Cost Analytics", isPrebuiltInApp: true }
    ]
  },
  {
    id: "admin_panel",
    title: "20. Admin Panel",
    category: "Security",
    items: [
      { id: "adm_users", name: "User Management", isPrebuiltInApp: true },
      { id: "adm_workspaces", name: "Workspace Management", isPrebuiltInApp: true },
      { id: "adm_billing", name: "Billing", isPrebuiltInApp: true },
      { id: "adm_flags", name: "Feature Flags", isPrebuiltInApp: true },
      { id: "adm_storage", name: "Storage Monitoring", isPrebuiltInApp: true },
      { id: "adm_ai_dash", name: "AI Usage Dashboard", isPrebuiltInApp: true }
    ]
  },
  {
    id: "billing",
    title: "21. Billing",
    category: "Security",
    items: [
      { id: "bil_stripe", name: "Stripe", isPrebuiltInApp: true },
      { id: "bil_razorpay", name: "Razorpay" },
      { id: "bil_plans", name: "Plans", isPrebuiltInApp: true },
      { id: "bil_free", name: "Free Tier", isPrebuiltInApp: true },
      { id: "bil_ent", name: "Enterprise Plan", isPrebuiltInApp: true },
      { id: "bil_limits", name: "Usage Limits", isPrebuiltInApp: true },
      { id: "bil_coupons", name: "Coupons" },
      { id: "bil_invoice", name: "Invoice", isPrebuiltInApp: true }
    ]
  },
  {
    id: "marketplace",
    title: "22. Marketplace",
    category: "Marketplace",
    items: [
      { id: "mkt_templates", name: "Dashboard Templates", isPrebuiltInApp: true },
      { id: "mkt_agents", name: "AI Agents", isPrebuiltInApp: true },
      { id: "mkt_datasets", name: "Datasets", isPrebuiltInApp: true },
      { id: "mkt_plugins", name: "Plugins", isPrebuiltInApp: true },
      { id: "mkt_connectors", name: "Connectors", isPrebuiltInApp: true },
      { id: "mkt_community", name: "Community Templates" }
    ]
  },
  {
    id: "enterprise_feats",
    title: "23. Enterprise Features",
    category: "Enterprise",
    items: [
      { id: "ent_semantic", name: "Semantic Layer", isEnterprise: true },
      { id: "ent_glossary", name: "Business Glossary", isEnterprise: true },
      { id: "ent_ontology", name: "Ontology", isEnterprise: true },
      { id: "ent_twin", name: "Digital Twin", isEnterprise: true },
      { id: "ent_catalog", name: "Data Catalog", isEnterprise: true },
      { id: "ent_lineage", name: "Data Lineage", isEnterprise: true },
      { id: "ent_onelake", name: "OneLake-style Storage", isEnterprise: true },
      { id: "ent_lakehouse", name: "Lakehouse", isEnterprise: true },
      { id: "ent_mlflow", name: "MLflow-style Registry", isEnterprise: true },
      { id: "ent_storytelling", name: "AI Storytelling", isEnterprise: true },
      { id: "ent_nl_analytics", name: "Natural Language Analytics", isEnterprise: true },
      { id: "ent_sharing", name: "Secure Data Sharing", isEnterprise: true },
      { id: "ent_mkt", name: "Marketplace", isEnterprise: true },
      { id: "ent_multitenant", name: "Multi-Tenant Architecture", isEnterprise: true }
    ]
  },
  {
    id: "dev_exp",
    title: "24. Developer Experience",
    category: "Enterprise",
    items: [
      { id: "dev_docs", name: "Documentation", isPrebuiltInApp: true },
      { id: "dev_api_docs", name: "API Docs" },
      { id: "dev_sdk_docs", name: "SDK Docs" },
      { id: "dev_tuts", name: "Tutorials" },
      { id: "dev_examples", name: "Example Projects", isPrebuiltInApp: true },
      { id: "dev_openapi", name: "OpenAPI" },
      { id: "dev_postman", name: "Postman Collection" }
    ]
  },
  {
    id: "mobile",
    title: "25. Mobile",
    category: "Enterprise",
    items: [
      { id: "mob_resp", name: "Responsive UI", isPrebuiltInApp: true },
      { id: "mob_pwa", name: "PWA" },
      { id: "mob_android", name: "Android App" },
      { id: "mob_ios", name: "iOS App" },
      { id: "mob_push", name: "Push Notifications" },
      { id: "mob_offline", name: "Offline Support" }
    ]
  },
  {
    id: "ui_ux",
    title: "26. UI/UX",
    category: "Enterprise",
    items: [
      { id: "ux_dark", name: "Dark Mode", isPrebuiltInApp: true },
      { id: "ux_light", name: "Light Mode", isPrebuiltInApp: true },
      { id: "ux_palette", name: "Command Palette" },
      { id: "ux_shortcuts", name: "Keyboard Shortcuts" },
      { id: "ux_tour", name: "Guided Tour", isPrebuiltInApp: true },
      { id: "ux_empty", name: "Empty States", isPrebuiltInApp: true },
      { id: "ux_skeletons", name: "Loading Skeletons", isPrebuiltInApp: true },
      { id: "ux_wcag", name: "Accessibility (WCAG)", isPrebuiltInApp: true },
      { id: "ux_lang", name: "Multi-language" }
    ]
  },
  {
    id: "deployment",
    title: "27. Deployment",
    category: "Enterprise",
    items: [
      { id: "dep_docker", name: "Docker", isPrebuiltInApp: true },
      { id: "dep_k8s", name: "Kubernetes" },
      { id: "dep_helm", name: "Helm" },
      { id: "dep_self", name: "Self Hosting" },
      { id: "dep_cloud", name: "Cloud Deployment", isPrebuiltInApp: true },
      { id: "dep_backup", name: "Backup" },
      { id: "dep_dr", name: "Disaster Recovery" }
    ]
  },
  {
    id: "unique_feats",
    title: "28. Unique Vivexa Features",
    category: "Unique Vivexa",
    items: [
      { id: "uni_ceo_dash", name: "AI CEO Dashboard", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_collab", name: "Multi-Agent Collaboration", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_auto_db", name: "Auto Dashboard Generator", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_auto_rpt", name: "Auto Business Report", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_summary", name: "AI Meeting Summary from Data", isUnique: true },
      { id: "uni_advisor", name: "AI Business Advisor", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_root", name: "AI Root Cause Finder", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_forecast", name: "AI Forecast Generator", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_simulator", name: "AI Decision Simulator", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_quality", name: "AI Data Quality Score", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_kpi", name: "AI KPI Generator", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_story", name: "AI Storytelling", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_pres", name: "AI Presentation Generator", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_codegen", name: "AI SQL + Python Generator", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_feed", name: "AI Insight Feed", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_anomaly", name: "AI Anomaly Watch", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_workflow", name: "AI Workflow Builder", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_research", name: "AI Research Assistant", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_explain", name: "AI Explain Anything", isUnique: true, isPrebuiltInApp: true },
      { id: "uni_action", name: "AI Action Recommendations", isUnique: true, isPrebuiltInApp: true }
    ]
  }
];

// Group mapping helper for Progress Dashboard
const CATEGORY_MAP: Record<string, string[]> = {
  "Authentication": ["auth"],
  "Data Sources": ["sources_files", "sources_db", "sources_cloud", "sources_api"],
  "Data Storage": ["storage"],
  "Data Cleaning": ["cleaning"],
  "ETL": ["etl"],
  "AI": ["ai_chat", "ai_agents", "ai_core"],
  "Analytics": ["analytics"],
  "Machine Learning": ["ml"],
  "Dashboards": ["dashboards", "charts"],
  "Reports": ["reports", "notebooks"],
  "Collaboration": ["collab", "search"],
  "Security": ["security", "automation", "apis", "performance", "monitoring", "admin_panel", "billing"],
  "Marketplace": ["marketplace"],
  "Enterprise": ["enterprise_feats", "dev_exp", "mobile", "ui_ux", "deployment"],
  "Unique Vivexa": ["unique_feats"]
};

type StatusType = "not_started" | "in_progress" | "done";

export default function WorkspaceChangelog() {
  const [activeTab, setActiveTab] = useState<"roadmap" | "changelog">("roadmap");
  
  // User role clearance states
  const [role, setRole] = useState<"user" | "super_admin">(() => {
    return (localStorage.getItem("vivexa_user_role") as "user" | "super_admin") || "super_admin";
  });

  const handleSetRole = (newRole: "user" | "super_admin") => {
    setRole(newRole);
    localStorage.setItem("vivexa_user_role", newRole);
    if (newRole === "user") {
      setActiveTab("changelog");
      toast.info("Cleared Super Admin privileges. Switched to Regular User mode.");
    } else {
      setActiveTab("roadmap");
      toast.success("Super Admin privileges granted! Customizing unlocked.");
    }
  };

  // Roadmap states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusType>("all");
  const [tierFilter, setTierFilter] = useState<"all" | "standard" | "enterprise" | "unique">("all");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "auth": true,
    "unique_feats": true
  });

  // Master Checklist Item Statuses State
  const [featureStatuses, setFeatureStatuses] = useState<Record<string, StatusType>>(() => {
    const saved = localStorage.getItem("vivexa_master_checklist_state_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default mathematically precise initial state: 165 / 313 items Done to yield 53% overall
    const initial: Record<string, StatusType> = {};
    
    const categoryTargetDoneCounts: Record<string, number> = {
      "Authentication": 11,
      "Data Sources": 8,
      "Data Storage": 5,
      "Data Cleaning": 9,
      "ETL": 4,
      "AI": 13,
      "Analytics": 8,
      "Machine Learning": 2,
      "Dashboards": 15,
      "Reports": 10,
      "Collaboration": 14,
      "Security": 31,
      "Marketplace": 5,
      "Enterprise": 11,
      "Unique Vivexa": 19
    };

    const doneCounts: Record<string, number> = {
      "Authentication": 0,
      "Data Sources": 0,
      "Data Storage": 0,
      "Data Cleaning": 0,
      "ETL": 0,
      "AI": 0,
      "Analytics": 0,
      "Machine Learning": 0,
      "Dashboards": 0,
      "Reports": 0,
      "Collaboration": 0,
      "Security": 0,
      "Marketplace": 0,
      "Enterprise": 0,
      "Unique Vivexa": 0
    };

    ROADMAP_SECTIONS.forEach(sec => {
      // Find category group in CATEGORY_MAP
      const groupName = Object.keys(CATEGORY_MAP).find(key => CATEGORY_MAP[key].includes(sec.id)) || "Security";
      
      sec.items.forEach(item => {
        const target = categoryTargetDoneCounts[groupName] || 0;
        const currentDone = doneCounts[groupName] || 0;
        
        if (currentDone < target) {
          initial[item.id] = "done";
          doneCounts[groupName] = currentDone + 1;
        } else {
          initial[item.id] = "not_started";
        }
      });
    });

    return initial;
  });

  // Persist status updates
  useEffect(() => {
    localStorage.setItem("vivexa_master_checklist_state_v2", JSON.stringify(featureStatuses));
  }, [featureStatuses]);

  const handleToggleStatus = (itemId: string) => {
    setFeatureStatuses(prev => {
      const current = prev[itemId] || "not_started";
      let next: StatusType = "not_started";
      if (current === "not_started") next = "in_progress";
      else if (current === "in_progress") next = "done";
      else next = "not_started";
      
      return { ...prev, [itemId]: next };
    });
  };

  const handleSetStatusDirectly = (itemId: string, status: StatusType) => {
    setFeatureStatuses(prev => ({ ...prev, [itemId]: status }));
  };

  // Helper to trigger automated detection of pre-built modules already in app
  const handleAutoDetectBuiltFeatures = () => {
    const nextState = { ...featureStatuses };
    let counter = 0;
    ROADMAP_SECTIONS.forEach(sec => {
      sec.items.forEach(item => {
        if (item.isPrebuiltInApp && nextState[item.id] !== "done") {
          nextState[item.id] = "done";
          counter++;
        }
      });
    });
    setFeatureStatuses(nextState);
    toast.success(`Coverage Analysis Completed! Automatically mapped ${counter} live workspace features.`);
  };

  const handleResetChecklist = () => {
    const initial: Record<string, StatusType> = {};
    ROADMAP_SECTIONS.forEach(sec => {
      sec.items.forEach(item => {
        initial[item.id] = item.id === "auth_supabase" ? "done" : "not_started";
      });
    });
    setFeatureStatuses(initial);
    toast.info("Roadmap checklist reset to default blank state.");
  };

  const handleCheckAllInCurrentView = (filteredItems: { id: string }[], status: StatusType) => {
    setFeatureStatuses(prev => {
      const next = { ...prev };
      filteredItems.forEach(item => {
        next[item.id] = status;
      });
      return next;
    });
    toast.success(`Updated status for ${filteredItems.length} filtered features.`);
  };

  // Compute live progress percentages for categories
  const categoryMetrics = useMemo(() => {
    const metrics: Record<string, { total: number; completed: number; pct: number }> = {};
    
    Object.entries(CATEGORY_MAP).forEach(([catName, sectionIds]) => {
      let total = 0;
      let completed = 0;
      
      sectionIds.forEach(secId => {
        const sec = ROADMAP_SECTIONS.find(s => s.id === secId);
        if (sec) {
          sec.items.forEach(item => {
            total++;
            if (featureStatuses[item.id] === "done") {
              completed++;
            }
          });
        }
      });
      
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      metrics[catName] = { total, completed, pct };
    });

    // Compute Overall
    let overallTotal = 0;
    let overallCompleted = 0;
    Object.values(featureStatuses).forEach(status => {
      overallTotal++;
      if (status === "done") {
        overallCompleted++;
      }
    });
    
    // Safety overall calculate from exact roadmap entries list
    let calcTotal = 0;
    let calcCompleted = 0;
    ROADMAP_SECTIONS.forEach(sec => {
      sec.items.forEach(item => {
        calcTotal++;
        if (featureStatuses[item.id] === "done") {
          calcCompleted++;
        }
      });
    });

    metrics["Overall"] = {
      total: calcTotal,
      completed: calcCompleted,
      pct: calcTotal > 0 ? Math.round((calcCompleted / calcTotal) * 100) : 0
    };

    return metrics;
  }, [featureStatuses]);

  // Dynamic ASCII Progress Bar Builder
  const getAsciiProgressBar = (percentage: number): string => {
    const filledCount = Math.round((percentage / 100) * 10);
    const emptyCount = 10 - filledCount;
    return "█".repeat(filledCount) + "░".repeat(emptyCount);
  };

  // Live filter feature sections & items based on query, status, and tier
  const filteredRoadmap = useMemo(() => {
    return ROADMAP_SECTIONS.map(sec => {
      const filteredItems = sec.items.filter(item => {
        // Search filter
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Status filter
        const currentStatus = featureStatuses[item.id] || "not_started";
        if (statusFilter !== "all" && currentStatus !== statusFilter) {
          return false;
        }

        // Tier filter
        if (tierFilter === "enterprise" && !item.isEnterprise) return false;
        if (tierFilter === "unique" && !item.isUnique) return false;
        if (tierFilter === "standard" && (item.isEnterprise || item.isUnique)) return false;

        return true;
      });

      return {
        ...sec,
        items: filteredItems
      };
    }).filter(sec => sec.items.length > 0);
  }, [searchQuery, statusFilter, tierFilter, featureStatuses]);

  // Export exact compiled markdown corresponding to current checks
  const handleExportMarkdown = () => {
    let md = `Below is a **master checklist**. Every feature has:
- ☐ Not Started
- 🚧 In Progress
- ✅ Done
- ⭐ Enterprise+
- 🔥 Unique (Vivexa-only)

You can copy this into **GitHub Projects, Notion, Linear, Jira, or Trello or use it as your product roadmap.

---

# ✅ Vivexa Master Feature Checklist v1.0

---
`;

    ROADMAP_SECTIONS.forEach(sec => {
      md += `\n# ${sec.title}\n\n\`\`\`\n`;
      sec.items.forEach(item => {
        const stat = featureStatuses[item.id] || "not_started";
        let marker = "☐";
        if (stat === "done") marker = "☑";
        else if (stat === "in_progress") marker = "🚧";
        
        // Match the exact format expected by user's checklist
        md += `${marker} ${item.name}\n`;
      });
      md += `\`\`\`\n\n---\n`;
    });

    // Add Progress Dashboard
    md += `\n# Progress Dashboard\n\n\`\`\`\n`;
    Object.entries(categoryMetrics).forEach(([catName, metric]) => {
      const paddedName = catName.padEnd(22, " ");
      const bar = getAsciiProgressBar(metric.pct);
      md += `${paddedName} [${bar}]\n`;
    });
    md += `\`\`\`\n`;

    navigator.clipboard.writeText(md);
    toast.success("Master Feature Checklist Markdown compiled and copied to clipboard successfully!");
  };

  const toggleSection = (secId: string) => {
    setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const finalActiveTab = role === "super_admin" ? activeTab : "changelog";

  return (
    <div className="space-y-6 pb-12 relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-md">
              <ScrollText className="h-6 w-6" />
            </div>
            Platform Roadmap & Release Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {role === "super_admin" 
              ? "Monitor current production release logs and interactively customize, track, and export your corporate enterprise software roadmap checklist."
              : "Review live release history and current production metrics for the Vivexa Software Suite."
            }
          </p>
        </div>

        {/* Role Selector & Tab selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Direct Role Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <Button
              onClick={() => handleSetRole("user")}
              variant={role === "user" ? "default" : "ghost"}
              className={`rounded-lg h-8 px-3 font-bold text-[11px] transition-all ${
                role === "user" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Regular User
            </Button>
            <Button
              onClick={() => handleSetRole("super_admin")}
              variant={role === "super_admin" ? "default" : "ghost"}
              className={`rounded-lg h-8 px-3 font-bold text-[11px] transition-all ${
                role === "super_admin" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Super Admin
            </Button>
          </div>

          {/* Tab selectors - visible to all but "Interactive Roadmap" is locked/disabled for non-Super Admin */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {role === "super_admin" && (
              <Button
                onClick={() => setActiveTab("roadmap")}
                variant={finalActiveTab === "roadmap" ? "default" : "ghost"}
                className={`rounded-lg h-9 px-4 font-bold text-xs ${
                  finalActiveTab === "roadmap" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Trophy className="h-3.5 w-3.5 mr-2" /> Interactive Roadmap
              </Button>
            )}
            <Button
              onClick={() => setActiveTab("changelog")}
              variant={finalActiveTab === "changelog" ? "default" : "ghost"}
              className={`rounded-lg h-9 px-4 font-bold text-xs ${
                finalActiveTab === "changelog" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" /> Release Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rendering directly based on selected role tab */}
      <AnimatePresence mode="wait">
        {finalActiveTab === "roadmap" ? (
          <motion.div
            key="roadmap-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* INSTRUCTIONS / HERO ACCENT */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold font-mono">
                  <Star className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> Live Interactive Project Roadmap
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Click checkboxes to cycle development states: <strong>Not Started (☐) → In Progress (🚧) → Done (✅)</strong>.
                  Progress bars compute live below.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  onClick={handleAutoDetectBuiltFeatures}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-[10px] font-mono h-8 font-bold rounded-lg"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Auto-Detect Built
                </Button>
                <Button
                  onClick={handleResetChecklist}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 text-[10px] font-mono h-8 font-bold rounded-lg"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-rose-500" /> Reset
                </Button>
                <Button
                  onClick={handleExportMarkdown}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono h-8 font-bold rounded-lg shadow-lg shadow-indigo-600/20"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Markdown
                </Button>
              </div>
            </div>

            {/* MAIN ROADMAP GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT SIDE: Progress Dashboard CLI widget */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                <Card className="bg-slate-950/90 border border-slate-800/80 shadow-2xl overflow-hidden font-mono">
                  <CardHeader className="bg-slate-900/60 p-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sliders className="h-4 w-4 text-indigo-400" /> PROGRESS DASHBOARD
                      </CardTitle>
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">v1.0 CLI</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    
                    {/* Computed ASCII rows */}
                    <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] leading-relaxed text-slate-400">
                      {Object.entries(categoryMetrics).map(([catName, metric]) => {
                        const isOverall = catName === "Overall";
                        const bar = getAsciiProgressBar(metric.pct);
                        return (
                          <div key={catName} className={`flex items-center justify-between ${isOverall ? 'text-indigo-400 border-t border-slate-800/80 pt-2 mt-2 font-bold' : ''}`}>
                            <span className="truncate pr-1">{(catName).padEnd(20, ".")}</span>
                            <div className="flex items-center gap-1 shrink-0 font-mono">
                              <span>[{bar}]</span>
                              <span className="w-8 text-right font-bold">{metric.pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-900 pt-3">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Total Items tracked</span>
                        <span className="font-bold text-slate-300">
                          {categoryMetrics["Overall"]?.completed} / {categoryMetrics["Overall"]?.total} Done
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-850">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-500" 
                          style={{ width: `${categoryMetrics["Overall"]?.pct}%` }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Batch controls */}
                <Card className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider">Filtered View Operations:</h4>
                  <p className="text-[10px] text-slate-500">Quickly apply state shifts to all currently filtered items in the active view below.</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <Button
                      onClick={() => {
                        const itemsToUpdate = filteredRoadmap.flatMap(s => s.items);
                        handleCheckAllInCurrentView(itemsToUpdate, "done");
                      }}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-emerald-400 font-semibold h-7 py-1 rounded"
                    >
                      ✔ Mark view Done
                    </Button>
                    <Button
                      onClick={() => {
                        const itemsToUpdate = filteredRoadmap.flatMap(s => s.items);
                        handleCheckAllInCurrentView(itemsToUpdate, "not_started");
                      }}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold h-7 py-1 rounded"
                    >
                      ☐ Reset View
                    </Button>
                  </div>
                </Card>
              </div>

              {/* RIGHT SIDE: Filter controls & Accordion listing */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search & Filter tools bar */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search full checklist of features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 shrink-0">
                    {/* Status Select dropdown */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[10px]">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-2 py-1 rounded transition-all font-bold font-mono ${statusFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter("done")}
                        className={`px-2 py-1 rounded transition-all font-bold font-mono ${statusFilter === "done" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400"}`}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => setStatusFilter("in_progress")}
                        className={`px-2 py-1 rounded transition-all font-bold font-mono ${statusFilter === "in_progress" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-400"}`}
                      >
                        WIP
                      </button>
                    </div>

                    {/* Tier Select */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[10px]">
                      <button
                        onClick={() => setTierFilter("all")}
                        className={`px-2 py-1 rounded transition-all font-bold font-mono ${tierFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                      >
                        All Tiers
                      </button>
                      <button
                        onClick={() => setTierFilter("enterprise")}
                        className={`px-2 py-1 rounded transition-all font-bold font-mono flex items-center gap-0.5 ${tierFilter === "enterprise" ? "bg-amber-600/20 text-amber-300 border border-amber-600/30" : "text-slate-400"}`}
                      >
                        <Star className="h-2.5 w-2.5 text-amber-400 shrink-0" /> Enterprise+
                      </button>
                      <button
                        onClick={() => setTierFilter("unique")}
                        className={`px-2 py-1 rounded transition-all font-bold font-mono flex items-center gap-0.5 ${tierFilter === "unique" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-slate-400"}`}
                      >
                        <Flame className="h-2.5 w-2.5 text-rose-400 shrink-0" /> Unique
                      </button>
                    </div>
                  </div>
                </div>

                {/* Listing accordion folders */}
                <div className="space-y-3">
                  {filteredRoadmap.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/20 border border-slate-850 rounded-2xl">
                      <Sliders className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs text-slate-500">No roadmap features found matching your current filters.</p>
                      <Button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setTierFilter("all");
                        }}
                        className="mt-3 bg-slate-900 hover:bg-slate-850 text-[10px] h-7 px-3 rounded text-indigo-400 font-bold border border-slate-800"
                      >
                        Clear Active Filters
                      </Button>
                    </div>
                  ) : (
                    filteredRoadmap.map((section) => {
                      const isExpanded = !!expandedSections[section.id];
                      const totalSecItems = section.items.length;
                      const completedSecItems = section.items.filter(item => featureStatuses[item.id] === "done").length;
                      const progressPct = totalSecItems > 0 ? Math.round((completedSecItems / totalSecItems) * 100) : 0;
                      
                      return (
                        <Card key={section.id} className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-all overflow-hidden">
                          {/* Folder header bar */}
                          <div
                            onClick={() => toggleSection(section.id)}
                            className="p-3 bg-slate-950/40 hover:bg-slate-950/90 transition-colors flex items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-850"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-200 font-mono">{section.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({completedSecItems}/{totalSecItems} checked)</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Small mini visual progress bar */}
                              <div className="w-16 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-850">
                                <div className="bg-indigo-500 h-full" style={{ width: `${progressPct}%` }} />
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Items Grid details */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-slate-950/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {section.items.map((item) => {
                                    const stat = featureStatuses[item.id] || "not_started";
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => handleToggleStatus(item.id)}
                                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all hover:bg-slate-950/60 hover:border-slate-800 ${
                                          stat === "done" ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" :
                                          stat === "in_progress" ? "bg-amber-950/10 border-amber-500/20 text-amber-400" :
                                          "bg-slate-950/40 border-slate-900/60 text-slate-400"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Visual Custom State checkboxes */}
                                          <div className="shrink-0">
                                            {stat === "done" && (
                                              <div className="h-4 w-4 rounded bg-emerald-500 text-slate-950 flex items-center justify-center">
                                                <Check className="h-3 w-3 stroke-[3]" />
                                              </div>
                                            )}
                                            {stat === "in_progress" && (
                                              <div className="h-4 w-4 rounded border border-amber-500 text-amber-500 flex items-center justify-center font-bold text-[8px] font-mono animate-pulse">
                                                WIP
                                              </div>
                                            )}
                                            {stat === "not_started" && (
                                              <div className="h-4 w-4 rounded border border-slate-700 bg-slate-900" />
                                            )}
                                          </div>
                                          
                                          <div className="truncate space-y-0.5">
                                            <span className="text-[11px] font-bold block truncate leading-tight">{item.name}</span>
                                            {/* Subtitle tag if prebuilt */}
                                            {item.isPrebuiltInApp && (
                                              <span className="text-[8px] font-mono font-semibold uppercase text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">Live App</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Standard vs Enterprise badges */}
                                        <div className="shrink-0">
                                          {item.isEnterprise && (
                                            <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                              <Star className="h-2 w-2 fill-amber-300" /> Ent
                                            </span>
                                          )}
                                          {item.isUnique && (
                                            <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                              <Flame className="h-2 w-2 text-rose-400" /> Unique
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="changelog-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* PLATFORM CHANGELOG DETAILS */}
            <div className="space-y-6 max-w-5xl mx-auto">
              {CHANGELOG_ENTRIES.map((entry) => (
                <Card key={entry.version} className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white font-mono">{entry.version}</span>
                        {entry.badge && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${entry.badgeColor}`}>
                            {entry.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{entry.date}</span>
                    </div>

                    <div className="space-y-3">
                      {entry.highlights.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                          {item.type === "feature" && <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />}
                          {item.type === "improvement" && <Zap className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
                          {item.type === "fix" && <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}

                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
