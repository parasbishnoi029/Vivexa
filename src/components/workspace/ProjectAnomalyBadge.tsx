import React, { useState } from "react";
import { AlertTriangle, AlertCircle, TrendingUp, ShieldCheck, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type AnomalySeverity = "critical" | "warning" | "opportunity" | "quality_issue" | "healthy";

export interface ProjectAnomalyBadgeProps {
  /** Number of anomalies detected or boolean indicator */
  anomalyCount?: number;
  /** Calculated Data Quality Index (0-100) */
  qualityScore?: number;
  /** Explicit severity or auto-calculated from qualityScore / count */
  severity?: AnomalySeverity;
  /** Custom warning or alert message description */
  message?: string;
  /** List of detected anomaly issues */
  issues?: string[];
  /** Compact pill or icon-only mode */
  compact?: boolean;
  /** Pulsing indicator intensity */
  pulse?: boolean;
  /** Additional custom class styling */
  className?: string;
}

const ProjectAnomalyBadgeComponent: React.FC<ProjectAnomalyBadgeProps> = ({
  anomalyCount = 0,
  qualityScore,
  severity,
  message,
  issues = [],
  compact = false,
  pulse = true,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Auto-determine severity if not explicitly provided
  const resolvedSeverity: AnomalySeverity = React.useMemo(() => {
    if (severity) return severity;
    if (qualityScore !== undefined) {
      if (qualityScore < 75) return "critical";
      if (qualityScore < 90) return "quality_issue";
      if (qualityScore < 95) return "warning";
      return "healthy";
    }
    if (anomalyCount > 3) return "critical";
    if (anomalyCount > 0) return "warning";
    return "healthy";
  }, [severity, qualityScore, anomalyCount]);

  // Determine styling based on severity
  const config = React.useMemo(() => {
    switch (resolvedSeverity) {
      case "critical":
        return {
          icon: AlertCircle,
          label: anomalyCount > 0 ? `${anomalyCount} Critical Anomalies` : "Critical Drift",
          textColor: "text-rose-400",
          bgColor: "bg-rose-500/10",
          borderColor: "border-rose-500/30 hover:border-rose-500/60",
          pingColor: "bg-rose-400",
          dotColor: "bg-rose-500",
          shadowColor: "shadow-rose-500/20",
          defaultMsg: "Severe statistical drift or integrity violation detected in pipeline data."
        };
      case "quality_issue":
        return {
          icon: AlertTriangle,
          label: qualityScore !== undefined ? `DQI ${qualityScore}% (Quality Issue)` : "Quality Degradation",
          textColor: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30 hover:border-amber-500/60",
          pingColor: "bg-amber-400",
          dotColor: "bg-amber-500",
          shadowColor: "shadow-amber-500/20",
          defaultMsg: "Data quality score below target threshold (null values / schema drift)."
        };
      case "warning":
        return {
          icon: AlertTriangle,
          label: anomalyCount > 0 ? `${anomalyCount} Drift Alert${anomalyCount > 1 ? "s" : ""}` : "Anomaly Flagged",
          textColor: "text-amber-300",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30 hover:border-amber-500/60",
          pingColor: "bg-amber-400",
          dotColor: "bg-amber-400",
          shadowColor: "shadow-amber-500/15",
          defaultMsg: "Statistical variance outside standard deviation bounds."
        };
      case "opportunity":
        return {
          icon: TrendingUp,
          label: "Growth Velocity Spike",
          textColor: "text-cyan-300",
          bgColor: "bg-cyan-500/10",
          borderColor: "border-cyan-500/30 hover:border-cyan-500/60",
          pingColor: "bg-cyan-400",
          dotColor: "bg-cyan-400",
          shadowColor: "shadow-cyan-500/20",
          defaultMsg: "Significant positive trend acceleration detected."
        };
      case "healthy":
      default:
        return {
          icon: ShieldCheck,
          label: qualityScore !== undefined ? `Grade A (${qualityScore}% DQI)` : "Telemetry Clean",
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
          pingColor: "bg-emerald-400",
          dotColor: "bg-emerald-500",
          shadowColor: "shadow-emerald-500/10",
          defaultMsg: "All telemetry parameters and data quality thresholds optimal."
        };
    }
  }, [resolvedSeverity, anomalyCount, qualityScore]);

  const IconComponent = config.icon;
  const isAlertState = resolvedSeverity !== "healthy";

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 backdrop-blur-md cursor-default select-none shadow-sm ${config.bgColor} ${config.borderColor} ${config.textColor} ${config.shadowColor} ${className}`}
      >
        {/* Real-time pulsing anomaly indicator dot */}
        {pulse && (
          <span className="relative flex h-2 w-2 items-center justify-center">
            {isAlertState && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`}
                style={{ animationDuration: resolvedSeverity === "critical" ? "1.2s" : "2s" }}
              />
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotColor}`} />
          </span>
        )}

        <IconComponent className="h-3 w-3 shrink-0" />

        {!compact && (
          <span className="tracking-tight whitespace-nowrap font-mono">{config.label}</span>
        )}
      </div>

      {/* Floating Insight Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-64 p-3 rounded-xl bg-slate-950/95 border border-slate-800 text-slate-200 text-xs shadow-2xl backdrop-blur-2xl z-50 pointer-events-none space-y-2"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className={`font-bold flex items-center gap-1.5 ${config.textColor}`}>
                <IconComponent className="h-3.5 w-3.5" />
                {resolvedSeverity === "healthy" ? "Pipeline Status" : "Real-time Anomaly Signal"}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Live Sensor</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              {message || config.defaultMsg}
            </p>

            {issues.length > 0 && (
              <div className="pt-1 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Detected Anomalies:
                </span>
                <ul className="space-y-1">
                  {issues.map((issue, idx) => (
                    <li key={idx} className="text-[10px] text-slate-400 flex items-start gap-1">
                      <span className="text-amber-400">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {qualityScore !== undefined && (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Data Quality Score (DQI):</span>
                <span className={`font-bold ${qualityScore >= 90 ? 'text-emerald-400' : qualityScore >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {qualityScore}%
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ProjectAnomalyBadge = React.memo(ProjectAnomalyBadgeComponent);

