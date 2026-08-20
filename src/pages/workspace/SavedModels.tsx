import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, Download, Play, ShieldCheck, Plus, Trash2, X, Search, 
  Code2, Check, Copy, Activity, Zap, Cpu, Sparkles, SlidersHorizontal,
  RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface MLModel {
  id: string;
  name: string;
  framework: "XGBoost" | "PyTorch" | "Scikit-Learn" | "LightGBM" | "TensorFlow";
  accuracy: string;
  f1Score: string;
  rocAuc: string;
  latencyMs: number;
  requestsCount: number;
  dataset: string;
  version: string;
  status: "Active" | "Staged" | "Archived";
  endpoint: string;
  sampleInput: string;
  description: string;
}

const DEFAULT_MODELS: MLModel[] = [
  {
    id: "mod-xgb-churn-v2",
    name: "Customer Churn Risk Classifier",
    framework: "XGBoost",
    accuracy: "94.8%",
    f1Score: "0.932",
    rocAuc: "0.978",
    latencyMs: 14,
    requestsCount: 28420,
    dataset: "telecom_customer_churn_q3.csv",
    version: "v2.4.1",
    status: "Active",
    endpoint: "https://api.vivexa.ai/v1/models/churn-risk-v2/predict",
    sampleInput: JSON.stringify({ tenure_months: 14, monthly_bill: 84.50, support_tickets_30d: 4, payment_delays: 1, contract_type: "month-to-month" }, null, 2),
    description: "Gradient boosted ensemble calibrated for high-precision subscription cancellation detection with feature attribution."
  },
  {
    id: "mod-rf-ltv-v3",
    name: "Lifetime Value (LTV) Regressor",
    framework: "Scikit-Learn",
    accuracy: "91.2%",
    f1Score: "0.895",
    rocAuc: "0.941",
    latencyMs: 19,
    requestsCount: 14930,
    dataset: "ecommerce_transactions_2025.csv",
    version: "v3.0.0",
    status: "Active",
    endpoint: "https://api.vivexa.ai/v1/models/ltv-regressor-v3/predict",
    sampleInput: JSON.stringify({ first_order_val: 120.00, avg_cart_items: 3.5, organic_referral: true, days_between_visits: 6.2 }, null, 2),
    description: "Non-linear multi-target regression predicting 365-day cumulative customer gross margin."
  },
  {
    id: "mod-pt-fraud-v1",
    name: "Real-time Transaction Fraud Sentinel",
    framework: "PyTorch",
    accuracy: "99.1%",
    f1Score: "0.984",
    rocAuc: "0.996",
    latencyMs: 8,
    requestsCount: 89450,
    dataset: "banking_swift_transactions.parquet",
    version: "v1.8.2",
    status: "Active",
    endpoint: "https://api.vivexa.ai/v1/models/fraud-sentinel-v1/predict",
    sampleInput: JSON.stringify({ amount_usd: 4850.00, velocity_1h: 3, ip_risk_score: 0.12, is_international: true, merchant_category: "luxury_goods" }, null, 2),
    description: "Deep attention neural network analyzing transaction velocity, geo-anomalies, and merchant risk profiles."
  },
  {
    id: "mod-lgb-arr-v1",
    name: "B2B Expansion & ARR Forecast Regressor",
    framework: "LightGBM",
    accuracy: "89.6%",
    f1Score: "0.880",
    rocAuc: "0.925",
    latencyMs: 22,
    requestsCount: 6310,
    dataset: "saas_sales_pipeline_crm.csv",
    version: "v1.2.0",
    status: "Staged",
    endpoint: "https://api.vivexa.ai/v1/models/arr-forecast-v1/predict",
    sampleInput: JSON.stringify({ seats_licensed: 50, seat_utilization: 0.94, product_tier: "Enterprise", csm_health_score: 88 }, null, 2),
    description: "Tree-based regressor evaluating expansion likelihood and renewal contract sizing."
  }
];

export default function SavedModels() {
  const navigate = useNavigate();
  const [models, setModels] = useState<MLModel[]>(() => {
    const saved = localStorage.getItem('vivexa_saved_models');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }
    return DEFAULT_MODELS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [activeTestModel, setActiveTestModel] = useState<MLModel | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<any | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);

  const [activeCodeModel, setActiveCodeModel] = useState<MLModel | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "python" | "typescript">("python");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    localStorage.setItem('vivexa_saved_models', JSON.stringify(models));
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchesSearch = !searchQuery.trim() || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.dataset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFramework = frameworkFilter === "All" || m.framework === frameworkFilter;
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;

      return matchesSearch && matchesFramework && matchesStatus;
    });
  }, [models, searchQuery, frameworkFilter, statusFilter]);

  const deleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    toast.info("Model removed from registry.");
  };

  const toggleModelStatus = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === "Active" ? "Staged" : m.status === "Staged" ? "Archived" : "Active";
        toast.success(`${m.name} status changed to ${nextStatus}`);
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const openTestModal = (model: MLModel) => {
    setActiveTestModel(model);
    setTestInput(model.sampleInput || "{}");
    setTestOutput(null);
  };

  const handleTest = () => {
    setIsExecutingTest(true);
    try {
      const parsed = JSON.parse(testInput);
      setTimeout(() => {
        setIsExecutingTest(false);
        const randConfidence = (0.88 + Math.random() * 0.11).toFixed(3);
        const latency = Math.floor(activeTestModel?.latencyMs ? activeTestModel.latencyMs * (0.9 + Math.random() * 0.2) : 16);

        if (activeTestModel?.name.toLowerCase().includes("churn")) {
          setTestOutput({
            status: "success",
            http_code: 200,
            prediction: "High Risk of Churn",
            churn_probability: parseFloat(randConfidence),
            top_drivers: [
              { feature: "support_tickets_30d", attribution: "+0.34", direction: "increases_risk" },
              { feature: "contract_type: month-to-month", attribution: "+0.28", direction: "increases_risk" },
              { feature: "tenure_months", attribution: "-0.15", direction: "decreases_risk" }
            ],
            inference_latency_ms: latency,
            model_version: activeTestModel?.version,
            timestamp: new Date().toISOString()
          });
        } else if (activeTestModel?.name.toLowerCase().includes("fraud")) {
          setTestOutput({
            status: "success",
            http_code: 200,
            prediction: "Legitimate Transaction",
            fraud_score: 0.024,
            confidence: parseFloat(randConfidence),
            risk_tier: "LOW",
            inference_latency_ms: latency,
            model_version: activeTestModel?.version,
            timestamp: new Date().toISOString()
          });
        } else {
          setTestOutput({
            status: "success",
            http_code: 200,
            prediction_output: "$1,840.50 (Est. 12-Month LTV)",
            confidence_interval: "[$1,620.00, $2,060.00]",
            confidence: parseFloat(randConfidence),
            inference_latency_ms: latency,
            model_version: activeTestModel?.version,
            timestamp: new Date().toISOString()
          });
        }
      }, 400);
    } catch (e: any) {
      setIsExecutingTest(false);
      setTestOutput({
        status: "error",
        http_code: 400,
        error_message: `JSON Syntax Error: ${e.message}`
      });
    }
  };

  const getSnippet = (model: MLModel, lang: "curl" | "python" | "typescript") => {
    if (lang === "curl") {
      return `curl -X POST "${model.endpoint}" \\
  -H "Authorization: Bearer vx_live_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '${model.sampleInput.replace(/\n\s*/g, " ")}'`;
    }
    if (lang === "python") {
      return `import requests

url = "${model.endpoint}"
headers = {
    "Authorization": "Bearer vx_live_secret_key",
    "Content-Type": "application/json"
}
payload = ${model.sampleInput}

response = requests.post(url, json=payload, headers=headers)
print("Inference Result:", response.json())`;
    }
    return `import { VivexaAI } from '@vivexa/sdk';

const client = new VivexaAI({ apiKey: process.env.VIVEXA_API_KEY });

const result = await client.models.predict({
  modelId: '${model.id}',
  payload: ${model.sampleInput}
});

console.log('Prediction:', result.data);`;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 relative z-10 w-full max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0">
            <Database className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Model Registry & Serving</h1>
              <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                LIVE PRODUCTION
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Deploy, test live inference, generate API SDK wrappers, and monitor ML performance.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              setModels(DEFAULT_MODELS);
              toast.success("Loaded pre-trained production template models.");
            }} 
            variant="outline" 
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reset Defaults
          </Button>
          <Button 
            onClick={() => navigate('/workspace/predictions')} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" /> Train New Model
          </Button>
        </div>
      </motion.div>

      {/* Aggregate Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Deployments</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">
            {models.filter(m => m.status === "Active").length} <span className="text-xs text-slate-500 font-sans font-normal">/ {models.length} total</span>
          </p>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Avg ROC-AUC</span>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">0.960</p>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Avg P95 Latency</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">15.7 ms</p>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Inferences</span>
            <Cpu className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">
            {(models.reduce((acc, m) => acc + (m.requestsCount || 0), 0) / 1000).toFixed(1)}k
          </p>
        </Card>
      </motion.div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search models, datasets, or metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-800 text-sm text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {["All", "XGBoost", "PyTorch", "Scikit-Learn", "LightGBM"].map(fw => (
              <button
                key={fw}
                onClick={() => setFrameworkFilter(fw)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  frameworkFilter === fw ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {fw}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {["All", "Active", "Staged", "Archived"].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === st ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Models List */}
      {filteredModels.length === 0 ? (
        <Card className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl p-12 text-center">
          <Database className="h-12 w-12 mx-auto mb-3 text-slate-600 opacity-50" />
          <p className="text-base font-bold text-slate-300">No models matching criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query or framework filters.</p>
          <Button onClick={() => { setSearchQuery(""); setFrameworkFilter("All"); setStatusFilter("All"); }} className="mt-4 bg-indigo-600 text-white text-xs">
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredModels.map((model) => (
            <motion.div key={model.id} variants={itemVariants}>
              <Card className="bg-slate-900/50 border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all">
                <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left info */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white tracking-tight">{model.name}</h3>
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                            {model.framework}
                          </span>
                          <button
                            onClick={() => toggleModelStatus(model.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                              model.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                : model.status === 'Staged'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                            title="Click to toggle status (Active -> Staged -> Archived)"
                          >
                            ● {model.status}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{model.description}</p>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Accuracy</span>
                        <span className="text-emerald-400 font-bold font-mono">{model.accuracy}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">F1 Score</span>
                        <span className="text-slate-200 font-bold font-mono">{model.f1Score}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">ROC-AUC</span>
                        <span className="text-indigo-400 font-bold font-mono">{model.rocAuc}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Latency</span>
                        <span className="text-amber-400 font-bold font-mono">~{model.latencyMs} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Dataset</span>
                        <span className="text-slate-300 font-mono truncate block max-w-[120px]">{model.dataset}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap lg:flex-nowrap border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/80">
                    <Button 
                      onClick={() => setActiveCodeModel(model)}
                      variant="outline" 
                      size="sm"
                      className="bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white"
                      title="Generate SDK Code Snippets"
                    >
                      <Code2 className="h-4 w-4 mr-1.5 text-indigo-400" /> Integrate
                    </Button>
                    <Button 
                      onClick={() => openTestModal(model)} 
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Test Live
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteModel(model.id)} 
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8"
                      title="Remove model"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Live Inference Testing Playground Modal */}
      <AnimatePresence>
        {activeTestModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-4 relative shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setActiveTestModel(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Play className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Inference Console: {activeTestModel.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Endpoint: {activeTestModel.endpoint} ({activeTestModel.version})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Column */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Request Payload (JSON)
                    </label>
                    <button
                      onClick={() => setTestInput(activeTestModel.sampleInput)}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Reset Preset
                    </button>
                  </div>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    rows={9}
                    className="w-full p-3 bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
                  />
                </div>

                {/* Output Column */}
                <div className="space-y-2 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Model Response & Diagnostics
                  </label>
                  <div className="flex-1 min-h-[190px] p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs overflow-y-auto">
                    {isExecutingTest ? (
                      <div className="h-full flex items-center justify-center text-slate-400 space-x-2 py-10">
                        <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                        <span>Evaluating inference vector...</span>
                      </div>
                    ) : testOutput ? (
                      <pre className={testOutput.status === 'error' ? 'text-rose-400' : 'text-indigo-300'}>
                        {JSON.stringify(testOutput, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-10">
                        <Play className="h-6 w-6 mb-2 opacity-40" />
                        <span>Click &quot;Execute Prediction&quot; to test.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="text-[11px] font-mono text-slate-500">
                  Target SLA: &lt;50ms | Real-time Scoring
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setActiveTestModel(null)} className="border-slate-800 text-slate-300">
                    Close
                  </Button>
                  <Button 
                    onClick={handleTest} 
                    disabled={isExecutingTest}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                  >
                    {isExecutingTest ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-1.5 fill-current" />}
                    Execute Prediction
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Code Integration Modal */}
      <AnimatePresence>
        {activeCodeModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-4 relative shadow-2xl"
            >
              <button 
                onClick={() => setActiveCodeModel(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Integrate {activeCodeModel.name}</h2>
                  <p className="text-xs text-slate-400">Drop this code directly into your production backend.</p>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                {[
                  { id: "python", label: "Python (requests)" },
                  { id: "typescript", label: "Node / TypeScript" },
                  { id: "curl", label: "cURL" }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setCodeLanguage(l.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      codeLanguage === l.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Code Display */}
              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[300px]">
                  {getSnippet(activeCodeModel, codeLanguage)}
                </pre>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(getSnippet(activeCodeModel, codeLanguage));
                    setCopiedCode(true);
                    toast.success("Code snippet copied to clipboard");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  size="sm"
                  variant="outline"
                  className="absolute top-2.5 right-2.5 bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white h-7 text-xs"
                >
                  {copiedCode ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setActiveCodeModel(null)} className="bg-indigo-600 text-white">
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
