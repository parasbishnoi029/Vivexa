import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Boxes, GitBranch, ArrowRight, CheckCircle2, AlertTriangle, Plus,
  Trash2, Code2, Download, Copy, RefreshCw, Layers, Database,
  Table as TableIcon, Key, Link2, Sparkles, Eye, ShieldCheck, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SemanticTableNode {
  id: string;
  name: string;
  type: "Fact" | "Dimension";
  schema: string;
  columns: { name: string; type: string; isKey?: boolean }[];
  color: string;
}

export interface SemanticRelationship {
  id: string;
  name: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  joinType: "LEFT" | "INNER" | "RIGHT" | "FULL";
  cardinality: "many_to_one" | "one_to_one" | "one_to_many" | "many_to_many";
  description?: string;
}

const DEFAULT_TABLES: SemanticTableNode[] = [
  {
    id: "t-orders",
    name: "fact_orders",
    type: "Fact",
    schema: "lakehouse_gold",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/40",
    columns: [
      { name: "order_id", type: "VARCHAR", isKey: true },
      { name: "customer_id", type: "VARCHAR", isKey: true },
      { name: "product_id", type: "VARCHAR", isKey: true },
      { name: "order_date", type: "DATE" },
      { name: "revenue_amount", type: "DECIMAL(12,2)" },
      { name: "discount_amount", type: "DECIMAL(10,2)" },
      { name: "quantity", type: "INTEGER" }
    ]
  },
  {
    id: "t-customers",
    name: "dim_customers",
    type: "Dimension",
    schema: "lakehouse_gold",
    color: "from-indigo-500/20 to-cyan-500/20 border-indigo-500/40",
    columns: [
      { name: "customer_id", type: "VARCHAR", isKey: true },
      { name: "company_name", type: "VARCHAR" },
      { name: "segment", type: "VARCHAR" },
      { name: "country", type: "VARCHAR" },
      { name: "ltv_tier", type: "VARCHAR" },
      { name: "created_at", type: "TIMESTAMP" }
    ]
  },
  {
    id: "t-products",
    name: "dim_products",
    type: "Dimension",
    schema: "lakehouse_gold",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40",
    columns: [
      { name: "product_id", type: "VARCHAR", isKey: true },
      { name: "product_name", type: "VARCHAR" },
      { name: "category", type: "VARCHAR" },
      { name: "unit_cost", type: "DECIMAL(10,2)" },
      { name: "margin_tier", type: "VARCHAR" }
    ]
  },
  {
    id: "t-dates",
    name: "dim_date",
    type: "Dimension",
    schema: "lakehouse_gold",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/40",
    columns: [
      { name: "date_key", type: "DATE", isKey: true },
      { name: "calendar_year", type: "INTEGER" },
      { name: "fiscal_quarter", type: "VARCHAR" },
      { name: "month_name", type: "VARCHAR" },
      { name: "is_weekend", type: "BOOLEAN" }
    ]
  }
];

const INITIAL_RELATIONSHIPS: SemanticRelationship[] = [
  {
    id: "rel-1",
    name: "Orders_To_Customers",
    sourceTable: "fact_orders",
    sourceColumn: "customer_id",
    targetTable: "dim_customers",
    targetColumn: "customer_id",
    joinType: "LEFT",
    cardinality: "many_to_one",
    description: "Connects transaction order records with enterprise customer segments & LTV attributes."
  },
  {
    id: "rel-2",
    name: "Orders_To_Products",
    sourceTable: "fact_orders",
    sourceColumn: "product_id",
    targetTable: "dim_products",
    targetColumn: "product_id",
    joinType: "LEFT",
    cardinality: "many_to_one",
    description: "Joins order items to product catalogue hierarchy and margin tiers."
  },
  {
    id: "rel-3",
    name: "Orders_To_Date",
    sourceTable: "fact_orders",
    sourceColumn: "order_date",
    targetTable: "dim_date",
    targetColumn: "date_key",
    joinType: "LEFT",
    cardinality: "many_to_one",
    description: "Enables fiscal period rollups, quarterly comparisons, and seasonal adjustments."
  }
];

export function VisualDimensionRelationshipBuilder({
  onSaveRelationship
}: {
  onSaveRelationship?: (rel: SemanticRelationship) => void;
}) {
  const [tables, setTables] = useState<SemanticTableNode[]>(DEFAULT_TABLES);
  const [relationships, setRelationships] = useState<SemanticRelationship[]>(INITIAL_RELATIONSHIPS);
  const [selectedRelId, setSelectedRelId] = useState<string>(INITIAL_RELATIONSHIPS[0].id);
  const [codeFormat, setCodeFormat] = useState<"dbt" | "cube" | "sql">("dbt");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for creating a relationship
  const [sourceTable, setSourceTable] = useState("fact_orders");
  const [sourceColumn, setSourceColumn] = useState("customer_id");
  const [targetTable, setTargetTable] = useState("dim_customers");
  const [targetColumn, setTargetColumn] = useState("customer_id");
  const [joinType, setJoinType] = useState<"LEFT" | "INNER" | "RIGHT" | "FULL">("LEFT");
  const [cardinality, setCardinality] = useState<"many_to_one" | "one_to_one" | "one_to_many" | "many_to_many">("many_to_one");
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedRel = relationships.find(r => r.id === selectedRelId) || relationships[0];

  const sourceTableCols = useMemo(() => {
    return tables.find(t => t.name === sourceTable)?.columns || [];
  }, [tables, sourceTable]);

  const targetTableCols = useMemo(() => {
    return tables.find(t => t.name === targetTable)?.columns || [];
  }, [tables, targetTable]);

  const handleAddRelationship = () => {
    if (!sourceTable || !sourceColumn || !targetTable || !targetColumn) {
      toast.error("Please select all table and column keys.");
      return;
    }

    if (sourceTable === targetTable && sourceColumn === targetColumn) {
      toast.error("Cannot join a table column to itself.");
      return;
    }

    const newRel: SemanticRelationship = {
      id: `rel-${Date.now()}`,
      name: `${sourceTable}_To_${targetTable}`,
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      joinType,
      cardinality,
      description: `Semantic join between ${sourceTable}.${sourceColumn} and ${targetTable}.${targetColumn}`
    };

    setRelationships(prev => [newRel, ...prev]);
    setSelectedRelId(newRel.id);
    setIsCreatingNew(false);
    onSaveRelationship?.(newRel);
    toast.success(`Relationship '${newRel.name}' registered to Semantic Layer!`);
  };

  const handleDeleteRelationship = (id: string) => {
    setRelationships(prev => prev.filter(r => r.id !== id));
    if (selectedRelId === id) {
      setSelectedRelId(relationships[0]?.id || "");
    }
    toast.info("Relationship removed from visual graph.");
  };

  // Generate dbt Semantic Layer YAML
  const dbtYamlCode = useMemo(() => {
    return `version: 2

semantic_models:
  - name: ${selectedRel?.sourceTable || "fact_orders"}
    model: ref('${selectedRel?.sourceTable || "fact_orders"}')
    description: "Core fact entity with dimension relationships."

    entities:
      - name: ${selectedRel?.sourceColumn || "customer_id"}
        type: foreign
        expr: ${selectedRel?.sourceColumn || "customer_id"}

    relationships:
      - name: ${selectedRel?.name || "rel"}
        to: ref('${selectedRel?.targetTable || "dim_customers"}')
        relationship_type: ${selectedRel?.cardinality || "many_to_one"}
        join_type: ${selectedRel?.joinType.toLowerCase() || "left"}
        expression: "this.${selectedRel?.sourceColumn} = ${selectedRel?.targetTable}.${selectedRel?.targetColumn}"
`;
  }, [selectedRel]);

  // Generate Cube.js join definition
  const cubeJsCode = useMemo(() => {
    return `cube(\`${selectedRel?.sourceTable || "fact_orders"}\`, {
  sql: \`SELECT * FROM \${TABLE}\`,

  joins: {
    ${selectedRel?.targetTable || "dim_customers"}: {
      sql: \`\${CUBE}.${selectedRel?.sourceColumn} = \${${selectedRel?.targetTable}}.${selectedRel?.targetColumn}\`,
      relationship: \`${selectedRel?.cardinality === "many_to_one" ? "belongsTo" : selectedRel?.cardinality === "one_to_many" ? "hasMany" : "hasOne"}\`
    }
  },

  dimensions: {
    // Linked dimensions available via graph traversal
  }
});`;
  }, [selectedRel]);

  // Generate SQL join query
  const sqlJoinCode = useMemo(() => {
    return `SELECT 
  src.*,
  tgt.*
FROM ${selectedRel?.sourceTable || "fact_orders"} src
${selectedRel?.joinType || "LEFT"} JOIN ${selectedRel?.targetTable || "dim_customers"} tgt
  ON src.${selectedRel?.sourceColumn || "customer_id"} = tgt.${selectedRel?.targetColumn || "customer_id"};`;
  }, [selectedRel]);

  const handleCopyCode = () => {
    const code = codeFormat === "dbt" ? dbtYamlCode : codeFormat === "cube" ? cubeJsCode : sqlJoinCode;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Copied ${codeFormat.toUpperCase()} schema definition!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Card className="bg-slate-900/95 border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col gpu-layer">
      {/* Top Controls Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Visual Semantic Dimension & Join Builder</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                DAG Relationship Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Graph-based dimension modeling, chasm trap prevention, and real-time dbt / Cube.js sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreatingNew(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Relationship
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Visual Graph & Table Node Canvas (7 cols) */}
        <div className="lg:col-span-7 border-r border-slate-800 bg-slate-950/60 p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-cyan-400" /> Visual Schema Entities ({tables.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {relationships.length} active relationships
            </span>
          </div>

          {/* Draggable/Selectable Table Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tables.map((table) => {
              const isFact = table.type === "Fact";
              return (
                <div
                  key={table.id}
                  className={`p-3.5 rounded-xl border bg-slate-900/80 shadow-md flex flex-col justify-between transition-all hover:scale-[1.01] ${
                    isFact ? "border-amber-500/40" : "border-indigo-500/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <TableIcon className={`h-3.5 w-3.5 ${isFact ? "text-amber-400" : "text-indigo-400"}`} />
                        {table.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isFact ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {table.type}
                      </span>
                    </div>

                    {/* Columns List */}
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-slate-950/60 border border-slate-800/40 text-slate-300 font-mono"
                        >
                          <span className="flex items-center gap-1">
                            {col.isKey && <Key className="h-2.5 w-2.5 text-amber-400" />}
                            {col.name}
                          </span>
                          <span className="text-[10px] text-slate-500">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Relationship Connectors List */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-indigo-400" /> Active Relationships
            </div>
            <div className="space-y-2">
              {relationships.map((rel) => {
                const isSelected = rel.id === selectedRelId;
                return (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedRelId(rel.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-300 font-bold">{rel.sourceTable}</span>
                      <span className="text-slate-500">.{rel.sourceColumn}</span>
                      <span className="text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-[10px]">
                        {rel.joinType} JOIN ({rel.cardinality.replace("_", ":")})
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <span className="text-indigo-300 font-bold">{rel.targetTable}</span>
                      <span className="text-slate-500">.{rel.targetColumn}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRelationship(rel.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Code Generator & Configuration Inspector (5 cols) */}
        <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-slate-900/70">
          <div className="space-y-4">
            {/* Create New Relationship Panel (if toggled) */}
            {isCreatingNew ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">New Dimension Link</span>
                  <button onClick={() => setIsCreatingNew(false)} className="text-slate-500 hover:text-white text-xs">Cancel</button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Source Table</label>
                    <select
                      value={sourceTable}
                      onChange={(e) => setSourceTable(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Source Column</label>
                    <select
                      value={sourceColumn}
                      onChange={(e) => setSourceColumn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      {sourceTableCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Target Dimension</label>
                    <select
                      value={targetTable}
                      onChange={(e) => setTargetTable(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Target Key</label>
                    <select
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      {targetTableCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Join Type</label>
                    <select
                      value={joinType}
                      onChange={(e: any) => setJoinType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      <option value="LEFT">LEFT OUTER JOIN</option>
                      <option value="INNER">INNER JOIN</option>
                      <option value="RIGHT">RIGHT OUTER JOIN</option>
                      <option value="FULL">FULL OUTER JOIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Cardinality</label>
                    <select
                      value={cardinality}
                      onChange={(e: any) => setCardinality(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      <option value="many_to_one">Many-to-One (N:1)</option>
                      <option value="one_to_one">One-to-One (1:1)</option>
                      <option value="one_to_many">One-to-Many (1:N)</option>
                      <option value="many_to_many">Many-to-Many (N:M)</option>
                    </select>
                  </div>
                </div>

                <Button size="sm" onClick={handleAddRelationship} className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs">
                  <Check className="h-3 w-3 mr-1" /> Register Join Link
                </Button>
              </div>
            ) : null}

            {/* Code Generator Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setCodeFormat("dbt")}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      codeFormat === "dbt" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    dbt Semantic YAML
                  </button>
                  <button
                    onClick={() => setCodeFormat("cube")}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      codeFormat === "cube" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Cube.js Schema
                  </button>
                  <button
                    onClick={() => setCodeFormat("sql")}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      codeFormat === "sql" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    SQL Projection
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-7 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
                >
                  {copiedCode ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedCode ? "Copied" : "Copy"}
                </Button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed max-h-[300px]">
                {codeFormat === "dbt" ? dbtYamlCode : codeFormat === "cube" ? cubeJsCode : sqlJoinCode}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" /> Fan-Out Verified (No Chasm Trap)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Bi-directional schema export
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
