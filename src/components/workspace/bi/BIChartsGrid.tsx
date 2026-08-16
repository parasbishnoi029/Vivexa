import React from "react";
import { 
  LineChart as LineChartIcon, BarChart2, PieChart as PieChartIcon, 
  GitBranch, Maximize2, Edit3, Trash2, TrendingUp, Sparkles 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  ComposedChart, Line, LineChart, PieChart, Pie, Cell, Brush 
} from "recharts";
import { CustomWidgetConfig } from "@/components/workspace/CustomWidgetModal";
import { formatColumnTitle, BI_PALETTE } from "@/lib/biUtils";

interface BIChartsGridProps {
  primaryDateCol: string | null;
  primaryMeasureCol: string | null;
  primaryDimCol: string;
  secondaryDimCol: string;
  timeSeriesData: any[];
  primaryDimBreakdown: { name: string; value: number }[];
  secondaryDimBreakdown: { name: string; value: number }[];
  customWidgets: CustomWidgetConfig[];
  filteredRows: Record<string, any>[];
  showForecast: boolean;
  onOpenLineage: (title: string, chartType: string, dimension?: string, measure?: string, aggregation?: string) => void;
  onExpandChart: (title: string, chartType: string, data: any[], dimensionKey?: string, measureKey?: string, color?: string) => void;
  onToggleDimensionFilter: (dim: string, val: string) => void;
  onEditWidget: (widget: CustomWidgetConfig) => void;
  onDeleteWidget: (id: string) => void;
}

export function BIChartsGrid({
  primaryDateCol,
  primaryMeasureCol,
  primaryDimCol,
  secondaryDimCol,
  timeSeriesData,
  primaryDimBreakdown,
  secondaryDimBreakdown,
  customWidgets,
  filteredRows,
  showForecast,
  onOpenLineage,
  onExpandChart,
  onToggleDimensionFilter,
  onEditWidget,
  onDeleteWidget
}: BIChartsGridProps) {
  return (
    <div className="space-y-4">
      {/* 1. Middle Row: Primary Timeline with ML Forecast + Categorical Distributions */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Primary Time Series with ML Forecast (8 cols) */}
        <Card className="col-span-12 lg:col-span-8 bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col">
          <CardHeader className="p-4 pb-2 border-b border-slate-800/60 bg-slate-900/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-indigo-400" />
              Timeline Dynamics & Predictive ML Forecast
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenLineage(
                  "Timeline Dynamics & ML Forecast",
                  "Composed Time-Series Area Chart",
                  primaryDateCol || "event_date",
                  primaryMeasureCol || "gross_amount_usd",
                  "SUM"
                )}
                className="h-6 text-[10px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white px-2 rounded-lg"
                title="Inspect Data Lineage & SQL Query"
              >
                <GitBranch className="h-3 w-3 mr-1 text-indigo-400" />
                Lineage
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExpandChart(
                  "Timeline Dynamics & Predictive ML Forecast",
                  "area",
                  timeSeriesData,
                  "name",
                  "actual",
                  "#6366f1"
                )}
                className="h-6 text-[10px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white px-2 rounded-lg"
                title="Expand Fullscreen"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 flex-1">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any, name: string) => [
                      val ? `$${Number(val).toLocaleString()}` : "N/A", 
                      name === "actual" ? "Historical Actual" : name === "forecast" ? "ML Predicted" : name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    name="Historical Actual"
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#actualGrad)" 
                  />
                  {showForecast && (
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      name="ML Forecast Envelope"
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#forecastGrad)" 
                    />
                  )}
                  <Brush dataKey="name" height={20} stroke="#475569" fill="#0f172a" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categorical Breakdowns (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Breakdown 1: Primary Dimension Bar Chart */}
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex-1 flex flex-col">
            <CardHeader className="p-3 pb-1 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
                {formatColumnTitle(primaryDimCol)}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenLineage(
                    `${formatColumnTitle(primaryDimCol)} Slices`,
                    "Horizontal Bar Chart",
                    primaryDimCol,
                    primaryMeasureCol || "gross_amount_usd",
                    "SUM"
                  )}
                  className="h-5 text-[9px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white px-1.5 rounded"
                  title="Inspect Data Lineage"
                >
                  <GitBranch className="h-2.5 w-2.5 mr-1 text-emerald-400" />
                  Lineage
                </Button>
                <button
                  onClick={() => onExpandChart(
                    `${formatColumnTitle(primaryDimCol)} Slices`,
                    "bar",
                    primaryDimBreakdown,
                    "name",
                    "value",
                    "#10b981"
                  )}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Expand"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={primaryDimBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={85} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(val: number) => [`$${(val/1000).toFixed(1)}k`, 'Volume']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      radius={[0, 4, 4, 0]} 
                      barSize={14}
                      onClick={(data) => {
                        if (primaryDimCol && data.name) {
                          onToggleDimensionFilter(primaryDimCol, data.name);
                        }
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown 2: Donut / Segment Composition */}
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex-1 flex flex-col">
            <CardHeader className="p-3 pb-1 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="h-3.5 w-3.5 text-blue-400" />
                {formatColumnTitle(secondaryDimCol)}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenLineage(
                    `${formatColumnTitle(secondaryDimCol)} Composition`,
                    "Proportional Donut Chart",
                    secondaryDimCol,
                    primaryMeasureCol || "gross_amount_usd",
                    "SUM"
                  )}
                  className="h-5 text-[9px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white px-1.5 rounded"
                  title="Inspect Data Lineage"
                >
                  <GitBranch className="h-2.5 w-2.5 mr-1 text-blue-400" />
                  Lineage
                </Button>
                <button
                  onClick={() => onExpandChart(
                    `${formatColumnTitle(secondaryDimCol)} Composition`,
                    "pie",
                    secondaryDimBreakdown,
                    "name",
                    "value"
                  )}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Expand"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={secondaryDimBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                      onClick={(data) => {
                        if (secondaryDimCol && data.name) {
                          onToggleDimensionFilter(secondaryDimCol, data.name);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {secondaryDimBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BI_PALETTE[index % BI_PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(val: number) => [`$${(val/1000).toFixed(1)}k`, 'Volume']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 2. User-Created Custom Widgets Grid */}
      {customWidgets.length > 0 && (
        <div className="grid grid-cols-12 gap-4">
          {customWidgets.map((widget) => {
            // Compute aggregated data for this custom widget
            const groupMap = new Map<string, { sum: number; count: number; min: number; max: number; values: number[] }>();
            
            filteredRows.forEach(r => {
              const dim = String(r[widget.dimension] || "Unknown");
              const meas = Number(r[widget.measure]) || 0;
              if (!groupMap.has(dim)) {
                groupMap.set(dim, { sum: 0, count: 0, min: Infinity, max: -Infinity, values: [] });
              }
              const g = groupMap.get(dim)!;
              g.sum += meas;
              g.count += 1;
              if (meas < g.min) g.min = meas;
              if (meas > g.max) g.max = meas;
              g.values.push(meas);
            });

            const wData = Array.from(groupMap.entries())
              .map(([name, g]) => {
                let val = g.sum;
                if (widget.aggregation === "AVG") val = g.count > 0 ? g.sum / g.count : 0;
                else if (widget.aggregation === "COUNT") val = g.count;
                else if (widget.aggregation === "MIN") val = g.min === Infinity ? 0 : g.min;
                else if (widget.aggregation === "MAX") val = g.max === -Infinity ? 0 : g.max;
                else if (widget.aggregation === "MEDIAN") {
                  g.values.sort((a, b) => a - b);
                  val = g.values.length > 0 ? g.values[Math.floor(g.values.length / 2)] : 0;
                }
                return { name, val: Number(val.toFixed(2)) };
              })
              .slice(0, 10);

            const colSpanClass = 
              widget.span === 3 ? "lg:col-span-3" :
              widget.span === 4 ? "lg:col-span-4" :
              widget.span === 8 ? "lg:col-span-8" :
              widget.span === 12 ? "lg:col-span-12" : "lg:col-span-6";

            return (
              <Card 
                key={widget.id} 
                className={`col-span-12 ${colSpanClass} bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col relative group`}
              >
                <CardHeader className="p-3 pb-1 border-b border-slate-800/60 bg-slate-900/40 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>{widget.title}</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                      {widget.aggregation}
                    </span>
                  </CardTitle>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenLineage(
                        widget.title,
                        `${widget.type.toUpperCase()} Visualization`,
                        widget.dimension,
                        widget.measure,
                        widget.aggregation
                      )}
                      className="h-5 text-[9px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white px-1.5 rounded"
                      title="Inspect Data Lineage"
                    >
                      <GitBranch className="h-2.5 w-2.5 mr-1 text-purple-400" />
                      Lineage
                    </Button>
                    <button 
                      onClick={() => onExpandChart(
                        widget.title,
                        widget.type,
                        wData,
                        "name",
                        "val",
                        widget.color
                      )}
                      className="text-slate-400 hover:text-white p-1"
                      title="Expand"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => onEditWidget(widget)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition-opacity p-1"
                      title="Edit Widget"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => onDeleteWidget(widget.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                      title="Delete Widget"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-3 flex-1 flex flex-col justify-center">
                  <div className="h-[200px] w-full flex items-center justify-center">
                    {widget.type === "metric" ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-xs text-slate-400 uppercase font-mono font-bold mb-1">
                          {widget.aggregation} of {formatColumnTitle(widget.measure)}
                        </span>
                        <div className="text-4xl font-black text-white tracking-tight" style={{ color: widget.color }}>
                          ${wData.reduce((acc, curr) => acc + curr.val, 0).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-2">
                          Computed across {filteredRows.length.toLocaleString()} active records
                        </span>
                      </div>
                    ) : widget.type === "pie" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={wData}
                            dataKey="val"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={65}
                            paddingAngle={3}
                            onClick={(d) => onToggleDimensionFilter(widget.dimension, d.name)}
                            className="cursor-pointer"
                          >
                            {wData.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={BI_PALETTE[i % BI_PALETTE.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : widget.type === "line" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={wData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                          <Line type="monotone" dataKey="val" stroke={widget.color} strokeWidth={2.5} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : widget.type === "area" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={wData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                          <Area type="monotone" dataKey="val" stroke={widget.color} fill={widget.color} fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : widget.type === "column" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                          <Bar 
                            dataKey="val" 
                            fill={widget.color} 
                            radius={[4, 4, 0, 0]} 
                            onClick={(d) => onToggleDimensionFilter(widget.dimension, d.name)}
                            className="cursor-pointer hover:opacity-80"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                          <XAxis type="number" stroke="#64748b" fontSize={10} />
                          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                          <Bar 
                            dataKey="val" 
                            fill={widget.color} 
                            radius={[0, 4, 4, 0]} 
                            onClick={(d) => onToggleDimensionFilter(widget.dimension, d.name)}
                            className="cursor-pointer hover:opacity-80"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
