import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface ProjectSparklineProps {
  /** Array of 30 historical numbers or auto-generated seeded trend */
  data?: number[];
  /** Seed key to generate deterministic 30-day trend if data is not provided */
  seedKey?: string;
  /** Primary KPI name to display (e.g. "Throughput", "DQI Score", "Queries/Day") */
  kpiLabel?: string;
  /** Current KPI value formatted */
  currentValue?: string | number;
  /** Color theme for the sparkline stroke and gradient */
  color?: "indigo" | "cyan" | "emerald" | "amber" | "purple" | "rose" | "blue";
  /** Height in pixels */
  height?: number;
  /** Width css or number */
  width?: string | number;
  /** Whether to show the trend percentage pill (+14.2%) */
  showTrend?: boolean;
  /** Show subtle 30D label */
  showDaysLabel?: boolean;
  /** Custom class styling */
  className?: string;
}

// Generate realistic deterministic 30-day KPI historical trend seeded by string
function generateDeterministic30DayTrend(seed: string, baseValue = 100, variance = 15): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const seededRandom = (index: number) => {
    const x = Math.sin(hash + index * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const points: number[] = [];
  let current = baseValue;
  
  // Trend direction tendency based on seed
  const drift = (seededRandom(99) - 0.42) * (variance * 0.15);

  for (let d = 0; d < 30; d++) {
    const noise = (seededRandom(d) - 0.48) * (variance * 0.8);
    current = Math.max(10, current + drift + noise);
    points.push(Math.round(current * 10) / 10);
  }

  return points;
}

const ProjectSparklineComponent: React.FC<ProjectSparklineProps> = ({
  data,
  seedKey = "project-kpi-trend",
  kpiLabel,
  currentValue,
  color = "indigo",
  height = 36,
  width = "100%",
  showTrend = true,
  showDaysLabel = true,
  className = ""
}) => {
  // Resolve or generate 30 days of data
  const trendData = useMemo(() => {
    if (data && data.length >= 2) {
      // Ensure exactly 30 or reasonable points
      return data;
    }
    return generateDeterministic30DayTrend(seedKey);
  }, [data, seedKey]);

  // Calculate 30-day percentage trend
  const trendPercent = useMemo(() => {
    if (trendData.length < 2) return 0;
    const startSample = trendData.slice(0, Math.min(5, trendData.length));
    const endSample = trendData.slice(-Math.min(5, trendData.length));
    
    const startAvg = startSample.reduce((a, b) => a + b, 0) / startSample.length;
    const endAvg = endSample.reduce((a, b) => a + b, 0) / endSample.length;
    
    if (startAvg === 0) return 0;
    const pct = ((endAvg - startAvg) / startAvg) * 100;
    return Math.round(pct * 10) / 10;
  }, [trendData]);

  // Color config map
  const colorMap = useMemo(() => {
    switch (color) {
      case "cyan":
        return {
          stroke: "#06b6d4",
          fillGradStart: "rgba(6, 182, 212, 0.35)",
          fillGradStop: "rgba(6, 182, 212, 0.0)",
          text: "text-cyan-400",
          pillBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
        };
      case "emerald":
        return {
          stroke: "#10b981",
          fillGradStart: "rgba(16, 185, 129, 0.35)",
          fillGradStop: "rgba(16, 185, 129, 0.0)",
          text: "text-emerald-400",
          pillBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        };
      case "amber":
        return {
          stroke: "#f59e0b",
          fillGradStart: "rgba(245, 158, 11, 0.35)",
          fillGradStop: "rgba(245, 158, 11, 0.0)",
          text: "text-amber-400",
          pillBg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
        };
      case "purple":
        return {
          stroke: "#a855f7",
          fillGradStart: "rgba(168, 85, 247, 0.35)",
          fillGradStop: "rgba(168, 85, 247, 0.0)",
          text: "text-purple-400",
          pillBg: "bg-purple-500/10 text-purple-400 border-purple-500/20"
        };
      case "rose":
        return {
          stroke: "#f43f5e",
          fillGradStart: "rgba(244, 63, 94, 0.35)",
          fillGradStop: "rgba(244, 63, 94, 0.0)",
          text: "text-rose-400",
          pillBg: "bg-rose-500/10 text-rose-400 border-rose-500/20"
        };
      case "blue":
        return {
          stroke: "#3b82f6",
          fillGradStart: "rgba(59, 130, 246, 0.35)",
          fillGradStop: "rgba(59, 130, 246, 0.0)",
          text: "text-blue-400",
          pillBg: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        };
      case "indigo":
      default:
        return {
          stroke: "#6366f1",
          fillGradStart: "rgba(99, 102, 241, 0.35)",
          fillGradStop: "rgba(99, 102, 241, 0.0)",
          text: "text-indigo-400",
          pillBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
        };
    }
  }, [color]);

  // Compute SVG viewBox coordinates (120 x 40 canvas)
  const { linePath, areaPath, lastPoint } = useMemo(() => {
    const viewBoxWidth = 120;
    const viewBoxHeight = 40;
    const padding = 4;

    const min = Math.min(...trendData);
    const max = Math.max(...trendData);
    const range = max - min === 0 ? 1 : max - min;

    const points = trendData.map((val, idx) => {
      const x = padding + (idx / (trendData.length - 1)) * (viewBoxWidth - padding * 2);
      const normalized = (val - min) / range;
      const y = viewBoxHeight - padding - normalized * (viewBoxHeight - padding * 2);
      return { x, y };
    });

    if (points.length === 0) return { linePath: "", areaPath: "", lastPoint: { x: 0, y: 0 } };

    // Build smooth bezier curve
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = ((p0.x + p1.x) / 2).toFixed(1);
      d += ` C ${cpX} ${p0.y.toFixed(1)}, ${cpX} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const last = points[points.length - 1];
    const area = `${d} L ${last.x.toFixed(1)} ${viewBoxHeight} L ${points[0].x.toFixed(1)} ${viewBoxHeight} Z`;

    return { linePath: d, areaPath: area, lastPoint: last };
  }, [trendData]);

  const gradientId = useMemo(() => `sparkline-grad-${seedKey.replace(/[^a-zA-Z0-9]/g, "")}`, [seedKey]);

  const isPositive = trendPercent > 0;
  const isNeutral = trendPercent === 0;

  return (
    <div className={`space-y-1 select-none pointer-events-none ${className}`}>
      {/* Top Header metadata */}
      {(kpiLabel || showTrend || currentValue) && (
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 truncate">
            {kpiLabel && (
              <span className="text-slate-400 truncate uppercase font-bold text-[9px] tracking-wider">
                {kpiLabel}
              </span>
            )}
            {currentValue !== undefined && (
              <span className="text-white font-bold tracking-tight">
                {currentValue}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {showDaysLabel && (
              <span className="text-[9px] text-slate-500 font-mono">30D</span>
            )}
            {showTrend && (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                  isNeutral
                    ? "bg-slate-800 text-slate-400 border-slate-700"
                    : isPositive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {isNeutral ? (
                  <Minus className="h-2.5 w-2.5" />
                ) : isPositive ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                <span>{isPositive ? `+${trendPercent}%` : `${trendPercent}%`}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Non-interactive Sparkline SVG canvas */}
      <div style={{ height: `${height}px`, width }} className="relative overflow-hidden">
        <svg
          viewBox="0 0 120 40"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorMap.stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colorMap.stroke} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Shaded Area fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Smooth Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke={colorMap.stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glow Pulse at latest data point */}
          {lastPoint.x > 0 && (
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={2.5}
              fill={colorMap.stroke}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export const ProjectSparkline = React.memo(ProjectSparklineComponent);
