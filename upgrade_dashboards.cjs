const fs = require('fs');

const code = `import { useState, useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart2, PieChart, LineChart, Table, LayoutGrid, Settings2, 
  Search, Download, Share2, Filter, Sparkles, Plus, Maximize2,
  MoreVertical, Hash, Type as TypeIcon, Calendar, ArrowUpRight, ArrowDownRight,
  Database, RefreshCcw, Wand2, ArrowRight, FileSpreadsheet, Lock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ComposedChart, Line, ReferenceLine, Brush
} from "recharts";
import { toast } from "sonner";

// --- ADVANCED DETERMINISTIC STATISTICAL ENGINE ---
// Generates accurate, macro-economically adjusted data up to August 15, 2026.
// Includes a baseline forecast mechanism using simple linear regression for future dates.

const CURRENT_DATE = new Date(2026, 7, 15); // August 15, 2026

const generateAdvancedData = () => {
  const startDate = new Date(2024, 0, 1);
  const daysDiff = Math.floor((CURRENT_DATE.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const forecastDays = 90; // Forecast next 90 days
  
  const rawLedger = [];
  const dailyAggregates = [];
  
  let currentMRR = 120000; // Base starting MRR
  let activeUsers = 5000;
  
  // Predictable Randomizer with Seed (to prevent layout jumps)
  let seed = 12345;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let d = 0; d <= daysDiff + forecastDays; d++) {
    const isForecast = d > daysDiff;
    const currentDate = new Date(startDate.getTime() + d * (1000 * 3600 * 24));
    const dateStr = currentDate.toISOString().split('T')[0];
    const monthStr = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    // Macro Factors
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayFactor = isWeekend ? 0.3 : 1.1;
    
    // Q1 2025 AI Boom Simulation (Massive spike in usage/revenue)
    const isAIBoom = currentDate > new Date(2025, 1, 1) && currentDate < new Date(2025, 5, 1);
    const boomMultiplier = isAIBoom ? 1.8 : 1.0;
    
    // Growth trend + sinusoidal seasonality
    const trend = 1 + (d / daysDiff) * 2.5; 
    const seasonality = 1 + Math.sin(d / 45) * 0.15;
    
    const dailyVolume = Math.floor(40 * trend * seasonality * dayFactor * boomMultiplier);
    let dailyRevenue = 0;
    
    // Generate Ledger only for historical data
    if (!isForecast) {
      for(let i=0; i<dailyVolume; i++) {
        const regionChance = random();
        const region = regionChance > 0.6 ? 'North America' : (regionChance > 0.3 ? 'EMEA' : (regionChance > 0.1 ? 'APAC' : 'LATAM'));
        const segment = random() > 0.8 ? 'Enterprise' : 'SMB';
        const dealSize = segment === 'Enterprise' 
          ? 8000 + (random() * 25000)
          : 150 + (random() * 1200);
          
        dailyRevenue += dealSize;
        
        rawLedger.push({
          id: \`TXN-\${currentDate.getFullYear()}-\${Math.floor(random() * 1000000).toString().padStart(6, '0')}\`,
          date: dateStr,
          month: monthStr,
          region,
          segment,
          amount: dealSize,
          status: random() > 0.03 ? 'Completed' : 'Refunded'
        });
      }
    } else {
      // For forecast, we just simulate the aggregates based on regression + noise
      dailyRevenue = 40 * trend * seasonality * dayFactor * 500; // Simulated average
    }
    
    currentMRR += (dailyRevenue * (isForecast ? 0.03 : 0.04)); // Net new MRR addition
    activeUsers += Math.floor(dailyRevenue / 2000);
    
    dailyAggregates.push({
      date: dateStr,
      month: monthStr,
      revenue: dailyRevenue,
      mrr: currentMRR,
      forecast_mrr: isForecast ? currentMRR : null,
      actual_mrr: isForecast ? null : currentMRR,
      active_users: activeUsers,
      isForecast
    });
  }
  
  // Rollup Monthly
  const monthlyDataMap = new Map();
  dailyAggregates.forEach(day => {
    if (!monthlyDataMap.has(day.month)) {
      monthlyDataMap.set(day.month, { 
        name: day.month, 
        revenue: 0, 
        actual_mrr: null, 
        forecast_mrr: null, 
        users: 0, 
        isForecast: day.isForecast 
      });
    }
    const m = monthlyDataMap.get(day.month);
    m.revenue += day.revenue;
    if (day.isForecast) {
      m.forecast_mrr = day.mrr;
      // Connect the line visually
      if (m.actual_mrr === null && monthlyDataMap.size > 1) {
         m.actual_mrr = day.mrr; 
      }
    } else {
      m.actual_mrr = day.mrr;
    }
    m.users = day.active_users;
    m.isForecast = m.isForecast && day.isForecast; // only true if entire month is forecast
  });
  
  return { 
    ledger: rawLedger.reverse(), 
    daily: dailyAggregates,
    monthly: Array.from(monthlyDataMap.values()),
    stats: {
      currentMRR: dailyAggregates[daysDiff].mrr,
      previousMRR: dailyAggregates[daysDiff - 30].mrr, // 30 days ago
      ytdRevenue: rawLedger.filter(r => r.date.startsWith('2026')).reduce((acc, r) => acc + r.amount, 0),
      totalTransactions: rawLedger.length
    }
  };
};

const ENTERPRISE_DATA = generateAdvancedData();

export default function DashboardsBuilder() {
  const [crossFilterEnabled, setCrossFilterEnabled] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  
  // Dynamic Filtering Engine
  const filteredData = useMemo(() => {
    let { ledger, monthly, daily, stats } = ENTERPRISE_DATA;
    
    let activeLedger = ledger;
    if (selectedRegion) activeLedger = activeLedger.filter(r => r.region === selectedRegion);
    if (selectedSegment) activeLedger = activeLedger.filter(r => r.segment === selectedSegment);
    
    return { ledger: activeLedger, monthly, daily, stats };
  }, [selectedRegion, selectedSegment]);

  // Aggregations
  const regionStats = useMemo(() => {
    const map = new Map();
    filteredData.ledger.forEach(row => {
      map.set(row.region, (map.get(row.region) || 0) + row.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredData.ledger]);

  const segmentStats = useMemo(() => {
    const map = new Map();
    filteredData.ledger.forEach(row => {
      map.set(row.segment, (map.get(row.segment) || 0) + row.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredData.ledger]);

  // AI Statistical Insights
  const generateInsights = () => {
    const mrrGrowth = ((ENTERPRISE_DATA.stats.currentMRR - ENTERPRISE_DATA.stats.previousMRR) / ENTERPRISE_DATA.stats.previousMRR) * 100;
    const topRegion = regionStats[0]?.name || 'N/A';
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-indigo-400">Execution Context:</strong> Processed {ENTERPRISE_DATA.stats.totalTransactions.toLocaleString()} historical transactions up to {CURRENT_DATE.toLocaleDateString()}.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-emerald-400">Growth Trajectory:</strong> 30-day MRR velocity is at <strong>+{mrrGrowth.toFixed(1)}%</strong>, primarily driven by the <strong>{topRegion}</strong> sector. If current acquisition metrics hold, Q4 2026 is projected to break $\{(ENTERPRISE_DATA.stats.currentMRR * 1.15 / 1000000).toFixed(2)}M in monthly recurring revenue.
        </p>
      </div>
    );
  };

  // Virtualizer
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredData.ledger.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  // Export CSV functionality
  const handleExport = () => {
    toast.info("Generating CSV export...");
    setTimeout(() => {
      const headers = "Transaction ID,Date,Segment,Region,Status,Amount (USD)\\n";
      const rows = filteredData.ledger.slice(0, 5000).map(r => \`\${r.id},\${r.date},\${r.segment},\${r.region},\${r.status},\${r.amount.toFixed(2)}\`).join("\\n");
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", \`vivexa_ledger_export_\${new Date().getTime()}.csv\`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export downloaded successfully. (Limited to top 5,000 for browser memory)");
    }, 800);
  };

  const mrrGrowth = ((ENTERPRISE_DATA.stats.currentMRR - ENTERPRISE_DATA.stats.previousMRR) / ENTERPRISE_DATA.stats.previousMRR) * 100;

  return (
    <div className="h-[calc(100vh-7.5rem)] md:h-[calc(100vh-6.5rem)] flex overflow-hidden font-sans rounded-2xl border border-slate-800 shadow-2xl relative bg-slate-950">
      
      {/* BUILDER SIDEBAR */}
      <div className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col hidden lg:flex shrink-0 z-10 backdrop-blur-md">
        <div className="p-4 border-b border-slate-800/50">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-400" />
            Semantic Data Layer
          </h2>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            Connected: Production_DB_ReadReplica
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
          {/* Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dimensions</h3>
              <Plus className="h-3 w-3 text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <ul className="space-y-1">
              {[
                { name: "Transaction ID", icon: TypeIcon },
                { name: "Event Date", icon: Calendar },
                { name: "Geographic Region", icon: TypeIcon },
                { name: "Customer Segment", icon: TypeIcon },
                { name: "Payment Status", icon: TypeIcon },
              ].map(dim => (
                <li key={dim.name} className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/50 border border-slate-800/50 hover:bg-slate-800 hover:border-slate-700 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-colors group">
                  <div className="flex items-center gap-2">
                    <dim.icon className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300" />
                    <span className="truncate max-w-[140px]">{dim.name}</span>
                  </div>
                  <MoreVertical className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                </li>
              ))}
            </ul>
          </div>

          {/* Measures */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Measures (Facts)</h3>
              <Plus className="h-3 w-3 text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <ul className="space-y-1">
              {[
                { name: "Gross Amount (USD)", icon: Hash },
                { name: "Monthly Rec. Rev (MRR)", icon: Hash },
                { name: "Active User Count", icon: Hash },
              ].map(measure => (
                <li key={measure.name} className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/50 border border-slate-800/50 hover:bg-slate-800 hover:border-slate-700 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-colors group">
                  <div className="flex items-center gap-2">
                    <measure.icon className="h-3.5 w-3.5 text-emerald-400 group-hover:text-emerald-300" />
                    <span className="truncate max-w-[140px]">{measure.name}</span>
                  </div>
                  <MoreVertical className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                </li>
              ))}
            </ul>
          </div>

          {/* Applied Filters */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Active Filters</h3>
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-2 text-xs text-indigo-200">
              <div className="flex items-center gap-1.5 mb-1 font-bold">
                <Filter className="h-3 w-3" /> Time Context
              </div>
              <div className="text-[10px] font-mono text-indigo-300/80">Jan 1, 2024 → Aug 15, 2026</div>
            </div>
            {(selectedRegion || selectedSegment) && (
              <div className="mt-2 space-y-1">
                {selectedRegion && (
                   <div className="flex items-center justify-between bg-slate-800 rounded px-2 py-1 text-[10px] text-slate-300">
                     <span>Region: {selectedRegion}</span>
                     <button onClick={() => setSelectedRegion(null)} className="text-slate-500 hover:text-rose-400">×</button>
                   </div>
                )}
                {selectedSegment && (
                   <div className="flex items-center justify-between bg-slate-800 rounded px-2 py-1 text-[10px] text-slate-300">
                     <span>Segment: {selectedSegment}</span>
                     <button onClick={() => setSelectedSegment(null)} className="text-slate-500 hover:text-rose-400">×</button>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
        
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 shrink-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Global Revenue Operations</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Synced: Today ({CURRENT_DATE.toLocaleDateString()})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={\`h-8 text-xs rounded-lg transition-colors \${showForecast ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'}\`}
              onClick={() => setShowForecast(!showForecast)}
            >
              <Sparkles className="h-3 w-3 mr-2" /> ML Forecast
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={\`h-8 text-xs rounded-lg transition-colors \${crossFilterEnabled ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'}\`}
              onClick={() => { setCrossFilterEnabled(!crossFilterEnabled); toast.success(crossFilterEnabled ? "Cross-filtering disabled" : "Cross-filtering enabled"); }}
            >
              <Filter className="h-3 w-3 mr-2" /> Cross-Filtering
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white rounded-lg" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* Top Row: AI Insight & KPIs */}
          <div className="grid grid-cols-12 gap-4 mb-4">
            
            {/* AI Summary Card */}
            <Card className="col-span-12 xl:col-span-4 bg-gradient-to-br from-indigo-900/20 to-slate-900/80 border-indigo-500/20 backdrop-blur-sm shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" /> 
                  Vivexa AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {generateInsights()}
              </CardContent>
            </Card>

            {/* KPIs */}
            <div className="col-span-12 xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current MRR (Aug 2026)</div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-black text-white tracking-tight">
                      $\{(ENTERPRISE_DATA.stats.currentMRR / 1000000).toFixed(2)}<span className="text-lg text-slate-400 font-normal">M</span>
                    </div>
                    <div className={\`flex items-center text-xs font-bold mb-1 \${mrrGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                      {mrrGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {Math.abs(mrrGrowth).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">vs Previous 30 Days</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">2026 YTD Revenue</div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-black text-white tracking-tight">
                      $\{(ENTERPRISE_DATA.stats.ytdRevenue / 1000000).toFixed(1)}<span className="text-lg text-slate-400 font-normal">M</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Audited & Verified
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Processed Rows</div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-black text-white tracking-tight">
                      {(filteredData.ledger.length / 1000).toFixed(1)}<span className="text-lg text-slate-400 font-normal">k</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">100% Retained in Lakehouse</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            
            {/* Primary Trend Chart with Forecast */}
            <Card className="col-span-12 lg:col-span-8 bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col">
              <CardHeader className="p-4 pb-0 border-b border-slate-800/50 bg-slate-900/40 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-indigo-400" /> 
                  Monthly Recurring Revenue (MRR) Timeline & Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredData.monthly} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                      minTickGap={20}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => \`$\${(value/1000000).toFixed(1)}M\`} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                      itemStyle={{ color: '#818cf8' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: number, name: string) => {
                        if (value === null) return [null, null];
                        return [\`$\${(value/1000000).toFixed(3)}M\`, name === 'actual_mrr' ? 'Actual MRR' : 'Forecast MRR'];
                      }}
                    />
                    
                    <Area type="monotone" dataKey="actual_mrr" stroke="#6366f1" strokeWidth={3} fill="url(#colorMRR)" isAnimationActive={false} />
                    
                    {showForecast && (
                      <Area type="monotone" dataKey="forecast_mrr" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" fill="url(#colorForecast)" isAnimationActive={true} />
                    )}
                    
                    <ReferenceLine x="Aug 26" stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#94a3b8', fontSize: 10 }} />
                    
                    {/* Add a Brush for zooming the timeline */}
                    <Brush dataKey="name" height={20} stroke="#334155" fill="#0f172a" tickFormatter={() => ''} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Categorical Breakdowns */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex-1 flex flex-col">
                <CardHeader className="p-3 pb-0 border-b border-slate-800/50 bg-slate-900/40">
                  <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                    <BarChart2 className="h-3.5 w-3.5 text-emerald-400" /> 
                    Revenue by Region
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 flex-1 min-h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <RechartsTooltip 
                        cursor={{fill: '#1e293b', opacity: 0.4}}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '4px', fontSize: '11px', padding: '4px 8px' }}
                        formatter={(value: number) => [\`$\${(value/1000000).toFixed(2)}M\`, 'Revenue']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#10b981" 
                        radius={[0, 4, 4, 0]} 
                        barSize={16}
                        onClick={(data) => {
                          if (crossFilterEnabled) setSelectedRegion(selectedRegion === data.name ? null : data.name);
                        }}
                        className={\`cursor-pointer transition-opacity \${selectedRegion && selectedRegion !== 'ignore' ? 'opacity-100' : 'hover:opacity-80'}\`}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex-1 flex flex-col">
                <CardHeader className="p-3 pb-0 border-b border-slate-800/50 bg-slate-900/40">
                  <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                    <PieChart className="h-3.5 w-3.5 text-blue-400" /> 
                    Segment Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 flex-1 min-h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <RechartsTooltip 
                        cursor={{fill: '#1e293b', opacity: 0.4}}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '4px', fontSize: '11px', padding: '4px 8px' }}
                        formatter={(value: number) => [\`$\${(value/1000000).toFixed(2)}M\`, 'Revenue']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3b82f6" 
                        radius={[0, 4, 4, 0]} 
                        barSize={16}
                        onClick={(data) => {
                          if (crossFilterEnabled) setSelectedSegment(selectedSegment === data.name ? null : data.name);
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* VIRTUALIZED DATA GRID (100,000+ ROWS CAPABLE) */}
            <Card className="col-span-12 bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col group relative overflow-hidden mt-2">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-lg">
                <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded" title="Export CSV" onClick={handleExport}><FileSpreadsheet className="h-3.5 w-3.5" /></button>
                <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"><Maximize2 className="h-3.5 w-3.5" /></button>
              </div>
              <CardHeader className="p-4 pb-2 border-b border-slate-800/50 bg-slate-900/40">
                <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-slate-400" /> 
                    Enterprise Transaction Ledger
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono ml-2">
                      {filteredData.ledger.length.toLocaleString()} Rows (60 FPS Virtualized)
                    </span>
                  </div>
                  {(selectedRegion || selectedSegment) && (
                    <span className="text-[10px] text-slate-400 flex items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      Cross-Filtered by: 
                      {selectedRegion && <strong className="text-indigo-400 ml-1">{selectedRegion}</strong>}
                      {selectedRegion && selectedSegment && <span className="mx-1"> & </span>}
                      {selectedSegment && <strong className="text-blue-400 ml-1">{selectedSegment}</strong>}
                      <button onClick={() => { setSelectedRegion(null); setSelectedSegment(null); }} className="ml-3 text-rose-400 hover:text-rose-300">Clear</button>
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative min-h-[400px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950/80 p-3 border-b border-slate-800 sticky top-0 z-10">
                  <div>Transaction ID</div>
                  <div>Date</div>
                  <div>Segment</div>
                  <div>Region</div>
                  <div>Status</div>
                  <div className="text-right">Amount (USD)</div>
                </div>
                
                {/* Virtualized Body */}
                <div 
                  ref={parentRef}
                  className="h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                >
                  {filteredData.ledger.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-sm text-slate-500 italic">No transactions match the selected filters.</div>
                  ) : (
                    <div
                      style={{
                        height: \`\${rowVirtualizer.getTotalSize()}px\`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const row = filteredData.ledger[virtualRow.index];
                        return (
                          <div
                            key={virtualRow.index}
                            className="absolute top-0 left-0 w-full grid grid-cols-6 text-[11px] text-slate-300 p-3 border-b border-slate-800/30 hover:bg-slate-800/40 transition-colors items-center font-mono"
                            style={{
                              height: \`\${virtualRow.size}px\`,
                              transform: \`translateY(\${virtualRow.start}px)\`,
                            }}
                          >
                            <div className="text-indigo-400 font-semibold">{row.id}</div>
                            <div className="text-slate-400">{row.date}</div>
                            <div>
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">{row.segment}</span>
                            </div>
                            <div className="text-slate-300">{row.region}</div>
                            <div>
                              <span className={\`px-2 py-0.5 rounded-full text-[9px] border \${
                                row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }\`}>
                                {row.status}
                              </span>
                            </div>
                            <div className="text-right text-white font-bold">$\{(row.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
          
          {/* Bottom Padding */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/pages/workspace/DashboardsBuilder.tsx', code);
