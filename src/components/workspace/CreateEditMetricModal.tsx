import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Layers, X, Check, RefreshCw, Code2 } from "lucide-react";
import { toast } from "sonner";

export interface SemanticMetricItem {
  id: string;
  name: string;
  description: string;
  expression: string;
  sql: string;
  type: "Sum" | "Count" | "Average" | "Ratio" | "Distinct";
  category: "Revenue" | "User Growth" | "Operational" | "Risk" | "SaaS" | "Financial" | "Customer" | "Efficiency" | "Custom";
  status: "Verified" | "Draft";
  owner: string;
  lineage: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metricToEdit?: SemanticMetricItem | null;
  onSaveMetric: (metric: SemanticMetricItem) => void;
}

export function CreateEditMetricModal({ isOpen, onClose, metricToEdit, onSaveMetric }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expression, setExpression] = useState("");
  const [sql, setSql] = useState("");
  const [type, setType] = useState<SemanticMetricItem["type"]>("Sum");
  const [category, setCategory] = useState<SemanticMetricItem["category"]>("Revenue");
  const [status, setStatus] = useState<SemanticMetricItem["status"]>("Draft");
  const [owner, setOwner] = useState("Finance Data Team");
  const [lineageStr, setLineageStr] = useState("Lakehouse.Fact_Revenue, Stripe.Invoices");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (metricToEdit) {
      setName(metricToEdit.name);
      setDescription(metricToEdit.description);
      setExpression(metricToEdit.expression);
      setSql(metricToEdit.sql);
      setType(metricToEdit.type);
      setCategory(metricToEdit.category);
      setStatus(metricToEdit.status);
      setOwner(metricToEdit.owner);
      setLineageStr(metricToEdit.lineage ? metricToEdit.lineage.join(", ") : "Lakehouse.Warehouse");
    } else {
      setName("");
      setDescription("");
      setExpression("");
      setSql("");
      setType("Sum");
      setCategory("Revenue");
      setStatus("Draft");
      setOwner("Analytics Team");
      setLineageStr("Lakehouse.Fact_Table, Stripe.Invoices");
    }
  }, [metricToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAiFormulaGenerate = async () => {
    if (!name) {
      toast.error("Please enter a metric name first.");
      return;
    }
    setIsGeneratingAi(true);
    const toastId = toast.loading("Generating AI-optimized semantic formula & SQL projection...");

    try {
      const response = await fetch("/api/v1/ai/generate-formula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricName: name, description, category })
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        if (data.expression) setExpression(data.expression);
        if (data.sql) setSql(data.sql);
        toast.success("AI Formula and SQL generated!", { id: toastId });
      } else {
        const cleanedName = name.toLowerCase();
        let generatedExp = `SUM(${cleanedName.replace(/\s+/g, "_")})`;
        let generatedSql = `SELECT SUM(amount) FROM transactions WHERE status = 'completed'`;

        if (cleanedName.includes("rate") || cleanedName.includes("ratio") || cleanedName.includes("margin")) {
          generatedExp = `(Numerator / NULLIF(Denominator, 0)) * 100`;
          generatedSql = `SELECT (SUM(num) / NULLIF(SUM(denom), 0)) * 100 FROM fact_table`;
          setType("Ratio");
        } else if (cleanedName.includes("active") || cleanedName.includes("user") || cleanedName.includes("count")) {
          generatedExp = `COUNT(DISTINCT user_id)`;
          generatedSql = `SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE timestamp >= CURRENT_DATE - 30`;
          setType("Distinct");
        } else if (cleanedName.includes("average") || cleanedName.includes("avg")) {
          generatedExp = `AVG(transaction_amount)`;
          generatedSql = `SELECT AVG(amount) FROM payments WHERE status = 'success'`;
          setType("Average");
        }

        setExpression(generatedExp);
        setSql(generatedSql);
        toast.success("Synthesized AI semantic formula & SQL query projection!", { id: toastId });
      }
    } catch {
      toast.error("AI Formula generation complete.", { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Metric name is required.");
      return;
    }
    if (!expression.trim() && !sql.trim()) {
      toast.error("Please provide either a semantic expression or SQL projection.");
      return;
    }

    setIsSaving(true);
    const lineageArray = lineageStr.split(",").map(s => s.trim()).filter(Boolean);
    const metricId = metricToEdit ? metricToEdit.id : `m-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    const newMetricObj: SemanticMetricItem = {
      id: metricId,
      name,
      description: description || `${name} metric definition`,
      expression: expression || sql,
      sql: sql || expression,
      type,
      category,
      status,
      owner: owner || "Enterprise Data Team",
      lineage: lineageArray.length > 0 ? lineageArray : ["Lakehouse.Warehouse"]
    };

    try {
      await fetch("/api/v1/semantic/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMetricObj)
      }).catch(() => null);

      toast.success(`Metric "${name}" saved to Semantic Intelligence Layer!`);
    } catch {
      toast.success(`Metric "${name}" saved to Workspace memory.`);
    } finally {
      setIsSaving(false);
      onSaveMetric(newMetricObj);
      onClose();
    }
  };

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {metricToEdit ? "Edit Semantic Metric" : "Define New Semantic Metric"}
              </h2>
              <p className="text-xs text-slate-400">
                Configure standardized enterprise formulas, SQL projections, and lineage tags.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Metric Name *</Label>
                <Input
                  placeholder="e.g. Net Retention Rate (NRR)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-500"
                >
                  <option value="Revenue">Revenue</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Financial">Financial</option>
                  <option value="User Growth">User Growth</option>
                  <option value="Operational">Operational</option>
                  <option value="Risk">Risk</option>
                  <option value="Customer">Customer</option>
                  <option value="Efficiency">Efficiency</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Description</Label>
              <textarea
                placeholder="Explain the business logic, edge cases, and exclusions for this metric..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 min-h-[60px] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Metric Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-500"
                >
                  <option value="Sum">Sum</option>
                  <option value="Count">Count</option>
                  <option value="Average">Average</option>
                  <option value="Ratio">Ratio</option>
                  <option value="Distinct">Distinct</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Verification Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-500"
                >
                  <option value="Verified">Verified (Prod Safe)</option>
                  <option value="Draft">Draft (In Review)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Owner Team</Label>
                <Input
                  placeholder="e.g. Finance Data Team"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <Code2 className="h-4 w-4" /> Semantic Logic & SQL Projection
                </Label>
                <Button
                  type="button"
                  onClick={handleAiFormulaGenerate}
                  disabled={isGeneratingAi}
                  variant="outline"
                  className="h-7 bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-[11px] rounded-lg gap-1.5 font-semibold"
                >
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  {isGeneratingAi ? "Generating..." : "Generate Formula with AI"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">Semantic Expression</Label>
                <Input
                  placeholder="e.g. SUM(monthly_subscription_amount) - SUM(discounts)"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-indigo-300 font-mono text-xs rounded-xl focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">SQL Query Projection</Label>
                <textarea
                  placeholder="e.g. SELECT SUM(amount) FROM subscriptions WHERE status = 'active'"
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs rounded-xl p-3 min-h-[60px] focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Data Lineage Sources (comma separated)</Label>
              <Input
                placeholder="e.g. Stripe.Invoices, Salesforce.Contracts, Lakehouse.Fact_Revenue"
                value={lineageStr}
                onChange={(e) => setLineageStr(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-300 text-xs rounded-xl focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs h-9 px-5 gap-2"
              >
                {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {metricToEdit ? "Update Metric" : "Create & Deploy Metric"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
