import React, { useState, useEffect } from "react";
import { X, Sparkles, BarChart2, Plus, Edit3, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CustomWidgetConfig {
  id: string;
  title: string;
  type: "column" | "bar" | "line" | "area" | "pie" | "metric" | "scatter";
  dimension: string;
  measure: string;
  aggregation: "SUM" | "AVG" | "MIN" | "MAX" | "COUNT" | "MEDIAN";
  span: number; // 3, 4, 6, 8, 12
  color: string;
}

interface CustomWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidgetConfig) => void;
  editingWidget?: CustomWidgetConfig | null;
  dimensions: string[];
  measures: string[];
}

const COLOR_OPTIONS = [
  { label: "Indigo Modern", value: "#6366f1" },
  { label: "Emerald Growth", value: "#10b981" },
  { label: "Cyan Precision", value: "#06b6d4" },
  { label: "Blue Sapphire", value: "#3b82f6" },
  { label: "Amber Warning", value: "#f59e0b" },
  { label: "Rose Highlight", value: "#ec4899" },
  { label: "Purple Horizon", value: "#8b5cf6" },
  { label: "Teal Matrix", value: "#14b8a6" }
];

export function CustomWidgetModal({
  isOpen,
  onClose,
  onSave,
  editingWidget,
  dimensions,
  measures
}: CustomWidgetModalProps) {
  const [title, setTitle] = useState("Custom Dimension Metric");
  const [type, setType] = useState<CustomWidgetConfig["type"]>("column");
  const [dimension, setDimension] = useState("");
  const [measure, setMeasure] = useState("");
  const [aggregation, setAggregation] = useState<CustomWidgetConfig["aggregation"]>("SUM");
  const [span, setSpan] = useState<number>(6);
  const [color, setColor] = useState("#6366f1");

  useEffect(() => {
    if (editingWidget) {
      setTitle(editingWidget.title);
      setType(editingWidget.type);
      setDimension(editingWidget.dimension);
      setMeasure(editingWidget.measure);
      setAggregation(editingWidget.aggregation);
      setSpan(editingWidget.span || 6);
      setColor(editingWidget.color || "#6366f1");
    } else {
      const defaultDim = dimensions[0] || "";
      const defaultMeas = measures[0] || "";
      setTitle(defaultDim && defaultMeas ? `${defaultDim} vs ${defaultMeas}` : "Custom Chart");
      setType("column");
      setDimension(defaultDim);
      setMeasure(defaultMeas);
      setAggregation("SUM");
      setSpan(6);
      setColor("#6366f1");
    }
  }, [editingWidget, isOpen, dimensions, measures]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: editingWidget?.id || `widget-${Date.now()}`,
      title,
      type,
      dimension: dimension || (dimensions[0] || "dimension"),
      measure: measure || (measures[0] || "value"),
      aggregation,
      span,
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {editingWidget ? (
              <Edit3 className="h-4 w-4 text-indigo-400" />
            ) : (
              <Plus className="h-4 w-4 text-indigo-400" />
            )}
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingWidget ? "Edit BI Visualization" : "Build Custom BI Visualization"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
              Visualization Title
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              placeholder="e.g. Sales Volume by Channel"
              required
            />
          </div>

          {/* Chart Type & Span Width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                Chart Type
              </label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="column">Column Chart (Vertical)</option>
                <option value="bar">Bar Chart (Horizontal)</option>
                <option value="line">Line Trend Chart</option>
                <option value="area">Area Volume Chart</option>
                <option value="pie">Donut / Pie Composition</option>
                <option value="metric">Single-Value KPI Metric</option>
                <option value="scatter">Bivariate Scatter</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                Grid Width (Columns)
              </label>
              <select 
                value={span}
                onChange={(e) => setSpan(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                <option value={3}>3 Cols (1/4 Width)</option>
                <option value={4}>4 Cols (1/3 Width)</option>
                <option value={6}>6 Cols (1/2 Width)</option>
                <option value={8}>8 Cols (2/3 Width)</option>
                <option value={12}>12 Cols (Full Width)</option>
              </select>
            </div>
          </div>

          {/* Dimension (X-Axis) & Measure (Y-Axis) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                Dimension (Group By)
              </label>
              <select 
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              >
                {dimensions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                Measure (Metric Fact)
              </label>
              <select 
                value={measure}
                onChange={(e) => setMeasure(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              >
                {measures.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Aggregation & Palette */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                Aggregation Math
              </label>
              <select 
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                <option value="SUM">SUM (Total Value)</option>
                <option value="AVG">AVG (Arithmetic Mean)</option>
                <option value="COUNT">COUNT (Event Frequencies)</option>
                <option value="MAX">MAX (Peak Value)</option>
                <option value="MIN">MIN (Minimum Baseline)</option>
                <option value="MEDIAN">MEDIAN (50th Percentile)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                Accent Palette
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-6 h-6 rounded-lg transition-transform ${
                      color === c.value ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onClose} 
              className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4"
            >
              {editingWidget ? "Update Visualization" : "Add to Canvas"}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
