import React, { useState } from "react";
import { 
  X, Database, Layers, ArrowRight, Check, Copy, 
  Download, RefreshCw, FileCode, CheckCircle2, Sparkles,
  GitBranch, Code2, Shield, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { DbtCubeParser, ParsedSemanticMetric } from "@/lib/dbtCubeParser";
import { toast } from "sonner";

interface DbtCubeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMetrics: (metrics: ParsedSemanticMetric[]) => void;
  currentMetrics: any[];
}

const SAMPLE_DBT_MANIFEST = JSON.stringify({
  metrics: {
    "metric.enterprise_dw.mrr_growth_rate": {
      name: "mrr_growth_rate",
      label: "MRR Growth Rate (%)",
      description: "Month-over-month recurring revenue percentage increase.",
      type: "ratio",
      calculation_method: "(current_mrr - previous_mrr) / previous_mrr * 100",
      sql: "SELECT ((current_mrr - previous_mrr) / previous_mrr) * 100 FROM fct_monthly_revenue",
      model: "fct_monthly_revenue",
      meta: { owner: "Enterprise Finance dbt Team" },
      depends_on: { nodes: ["model.enterprise_dw.fct_monthly_revenue", "model.enterprise_dw.dim_accounts"] }
    },
    "metric.enterprise_dw.net_dollar_retention": {
      name: "net_dollar_retention",
      label: "Net Dollar Retention (NDR)",
      description: "Annualized expansion minus contraction and churn.",
      type: "simple",
      calculation_method: "sum(retained_revenue) / sum(cohort_starting_revenue) * 100",
      sql: "SELECT (SUM(retained_revenue) / SUM(starting_revenue)) * 100 FROM fct_cohort_retention",
      model: "fct_cohort_retention",
      meta: { owner: "RevOps Engineering" },
      depends_on: { nodes: ["model.enterprise_dw.fct_cohort_retention"] }
    },
    "metric.enterprise_dw.platform_dau": {
      name: "platform_dau",
      label: "Platform Daily Active Users (DAU)",
      description: "Count of distinct authenticated users executing queries in 24 hours.",
      type: "count_distinct",
      calculation_method: "count(distinct user_id)",
      sql: "SELECT COUNT(DISTINCT user_id) FROM fct_user_sessions WHERE session_date = CURRENT_DATE",
      model: "fct_user_sessions",
      meta: { owner: "Core Product Team" }
    }
  }
}, null, 2);

const SAMPLE_CUBE_SCHEMA = `cube(\`RevenueAnalytics\`, {
  sql: \`SELECT * FROM gold.fct_revenue_daily\`,

  measures: {
    grossRevenue: {
      type: \`sum\`,
      sql: \`gross_amount_usd\`,
      title: \`Gross Revenue (USD)\`,
      description: \`Total billed transactional volume before deductions\`
    },
    churnedAccountsCount: {
      type: \`countDistinct\`,
      sql: \`customer_account_id\`,
      title: \`Churned Accounts\`,
      description: \`Distinct count of lost customer accounts in period\`
    },
    averageOrderValue: {
      type: \`avg\`,
      sql: \`invoice_amount\`,
      title: \`Average Order Value (AOV)\`,
      description: \`Mean invoice amount per commercial transaction\`
    }
  },

  dimensions: {
    region: {
      sql: \`customer_region\`,
      type: \`string\`
    }
  }
});`;

export const DbtCubeSyncModal: React.FC<DbtCubeSyncModalProps> = ({
  isOpen,
  onClose,
  onImportMetrics,
  currentMetrics
}) => {
  const [activeTab, setActiveTab] = useState<"dbt" | "cube" | "export">("dbt");
  const [inputContent, setInputContent] = useState(SAMPLE_DBT_MANIFEST);
  const [parsedPreview, setParsedPreview] = useState<ParsedSemanticMetric[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    try {
      let results: ParsedSemanticMetric[] = [];
      if (activeTab === "dbt") {
        results = DbtCubeParser.parseDbtManifest(inputContent);
      } else if (activeTab === "cube") {
        results = DbtCubeParser.parseCubeSchema(inputContent);
      }

      if (results.length === 0) {
        toast.error("No valid metrics found in provided payload. Check schema syntax.");
      } else {
        setParsedPreview(results);
        toast.success(`Successfully parsed ${results.length} semantic metrics!`);
      }
    } catch (e: any) {
      toast.error(`Parsing error: ${e.message}`);
    }
  };

  const handleCommitSync = () => {
    if (parsedPreview.length === 0) {
      toast.error("Please parse a valid manifest or schema first.");
      return;
    }
    onImportMetrics(parsedPreview);
    toast.success(`Synchronized ${parsedPreview.length} metrics into Vivexa Semantic Catalog!`);
    onClose();
  };

  const handleExportCopy = (format: "dbt" | "cube") => {
    let code = "";
    if (format === "dbt") {
      code = DbtCubeParser.exportToDbtYaml(currentMetrics);
    } else {
      code = DbtCubeParser.exportToCubeSchema(currentMetrics);
    }
    navigator.clipboard.writeText(code);
    setCopiedFormat(format);
    toast.success(`Exported ${currentMetrics.length} metrics to ${format === "dbt" ? "dbt schema.yml" : "Cube.js schema"} and copied!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                dbt-core & Cube.js Semantic Model Synchronization
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-mono font-medium">
                  Ecosystem v3.1
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Import, validate, and synchronize existing enterprise metric repositories directly into Vivexa.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-border bg-muted/10">
          <button
            onClick={() => {
              setActiveTab("dbt");
              setInputContent(SAMPLE_DBT_MANIFEST);
              setParsedPreview([]);
            }}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "dbt"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            dbt-core Manifest / YAML
          </button>

          <button
            onClick={() => {
              setActiveTab("cube");
              setInputContent(SAMPLE_CUBE_SCHEMA);
              setParsedPreview([]);
            }}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "cube"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Cube.js Data Model
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "export"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="w-4 h-4" />
            Export Vivexa Catalog
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "export" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-1">Export Active Semantic Metrics</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Export all {currentMetrics.length} Vivexa enterprise metrics into standardized dbt-core and Cube.js schema files.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* dbt Export Card */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-orange-500" />
                        dbt-core Schema (models/schema.yml)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportCopy("dbt")}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copiedFormat === "dbt" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedFormat === "dbt" ? "Copied" : "Copy YAML"}
                      </Button>
                    </div>
                    <pre className="p-3 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground max-h-48 overflow-y-auto">
                      {DbtCubeParser.exportToDbtYaml(currentMetrics)}
                    </pre>
                  </div>

                  {/* Cube.js Export Card */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-purple-500" />
                        Cube.js Schema (schema/EnterpriseMetrics.js)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportCopy("cube")}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copiedFormat === "cube" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedFormat === "cube" ? "Copied" : "Copy JS"}
                      </Button>
                    </div>
                    <pre className="p-3 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground max-h-48 overflow-y-auto">
                      {DbtCubeParser.exportToCubeSchema(currentMetrics)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Code Input */}
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    {activeTab === "dbt" ? "Paste manifest.json or schema.yml" : "Paste Cube.js schema code"}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputContent(activeTab === "dbt" ? SAMPLE_DBT_MANIFEST : SAMPLE_CUBE_SCHEMA);
                      setParsedPreview([]);
                    }}
                    className="h-6 text-[11px] text-muted-foreground"
                  >
                    Reset Sample
                  </Button>
                </div>
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={activeTab === "dbt" ? "Paste dbt manifest JSON or YAML..." : "Paste Cube.js JavaScript schema..."}
                  className="flex-1 min-h-[320px] w-full rounded-xl border border-border bg-muted/50 p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
                <Button onClick={handleParse} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Parse & Extract Semantic Definitions
                </Button>
              </div>

              {/* Parsed Preview */}
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Parsed Metrics ({parsedPreview.length})
                  </span>
                  {parsedPreview.length > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Validated AST
                    </span>
                  )}
                </div>

                <div className="flex-1 min-h-[320px] max-h-[360px] overflow-y-auto rounded-xl border border-border bg-card p-3 space-y-3">
                  {parsedPreview.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <Layers className="w-8 h-8 text-muted-foreground/40 mb-2" />
                      <p className="text-xs font-medium">No metrics parsed yet</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        Click "Parse & Extract Semantic Definitions" to inspect models and measures.
                      </p>
                    </div>
                  ) : (
                    parsedPreview.map((m) => (
                      <div key={m.id} className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1.5 hover:border-indigo-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">{m.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-mono">
                            {m.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{m.description}</p>
                        <div className="p-1.5 rounded bg-background/80 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                          {m.expression}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                          <span>Format: {m.sourceFormat}</span>
                          <span>•</span>
                          <span>Owner: {m.owner}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  disabled={parsedPreview.length === 0}
                  onClick={handleCommitSync}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Sync {parsedPreview.length} Metrics into Vivexa Catalog
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
