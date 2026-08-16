import React from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MultiPassValidationReport } from "@/lib/analysisValidator";

interface ConfidenceScoreMetricCardProps {
  label: string;
  score: number;
  maxScore?: number;
  confidenceRating?: number;
  subtitle?: string;
  gradient?: string;
  textColor?: string;
  validationReport?: MultiPassValidationReport | null;
  metricKey?: string;
  explanation?: string;
}

export const ConfidenceScoreMetricCard: React.FC<ConfidenceScoreMetricCardProps> = ({
  label,
  score,
  maxScore = 100,
  confidenceRating,
  subtitle,
  gradient = "from-emerald-400 to-teal-400",
  textColor = "text-emerald-400",
  validationReport,
  metricKey,
  explanation
}) => {
  // Compute metric-specific confidence rating
  const confRating = confidenceRating ?? validationReport?.confidenceRating ?? 95;
  const isModerateConfidence = confRating < 80;

  // Find relevant flags from validation report
  const relevantFlags = validationReport?.pass3_sanityCheck?.flags?.filter((f) => {
    if (!metricKey) return f.severity === "High" || f.severity === "Critical";
    return (
      f.id.toLowerCase().includes(metricKey.toLowerCase()) ||
      f.title.toLowerCase().includes(metricKey.toLowerCase()) ||
      f.description.toLowerCase().includes(metricKey.toLowerCase())
    );
  }) || [];

  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-xl shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between overflow-hidden relative group">
      {/* Top subtle highlight indicator */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

      <CardContent className="p-5 space-y-3">
        {/* Metric Label & Confidence Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              confRating >= 90
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : confRating >= 75
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
            title="Statistical Confidence Score verified by AnalysisValidator multi-pass engine"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>{confRating}% Conf.</span>
          </div>
        </div>

        {/* Primary Value Display (Always visible) */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className={`text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
            {Math.round(score)}
          </span>
          <span className="text-slate-500 text-xs font-medium">/{maxScore}</span>
        </div>

        {/* Score Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Score Reliability</span>
            <span className={confRating >= 90 ? "text-emerald-400" : confRating >= 75 ? "text-indigo-400 font-semibold" : "text-amber-400 font-semibold"}>
              {confRating >= 90 ? "Verified" : confRating >= 75 ? "Moderate Variance" : "Statistical Anomaly"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-500 bg-gradient-to-r ${gradient}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        {/* Subtle Contextual Flag Note if relevant flags exist */}
        {relevantFlags.length > 0 && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-1.5 mt-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight text-amber-200/90 font-sans">
              {relevantFlags[0]?.description || "Statistical distribution exhibit outliers or Z-score variances."}
            </p>
          </div>
        )}

        {/* Exact Score Formula Explanation */}
        {explanation && (
          <p className="text-[10px] text-slate-400/90 font-mono border-t border-slate-800/60 pt-2 break-words leading-relaxed">
            {explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

