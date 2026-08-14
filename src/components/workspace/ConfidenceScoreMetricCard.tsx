import React from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Activity, Info, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MultiPassValidationReport, SanityCheckFlag } from "@/lib/analysisValidator";

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
  // Compute metric specific confidence from validation report or overall confidence
  const confRating = confidenceRating ?? validationReport?.confidenceRating ?? 95;
  const isLowConfidence = confRating < 80 || (validationReport && !validationReport.overallValidationPassed);

  // Find flags relevant to this metric or general high severity flags
  const relevantFlags = validationReport?.pass3_sanityCheck.flags.filter((f) => {
    if (!metricKey) return f.severity === "High" || f.severity === "Critical";
    return (
      f.id.toLowerCase().includes(metricKey.toLowerCase()) ||
      f.title.toLowerCase().includes(metricKey.toLowerCase()) ||
      f.description.toLowerCase().includes(metricKey.toLowerCase())
    );
  }) || [];

  const hasPerfectScoreCorrection = validationReport?.pass3_sanityCheck.flags.some((f) =>
    f.category === "PERFECT_SCORE_WARNING" && (!metricKey || f.id.toLowerCase().includes(metricKey.toLowerCase()))
  );

  const isFlaggedStatic100 = score === 100 && (isLowConfidence || relevantFlags.length > 0 || hasPerfectScoreCorrection);

  return (
    <Card className={`bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-slate-700/80 transition-all flex flex-col justify-between overflow-hidden relative group ${
      isLowConfidence ? "border-amber-500/40" : ""
    }`}>
      {/* Top subtle highlight indicator */}
      <div className={`h-1 w-full bg-gradient-to-r ${isLowConfidence ? "from-amber-500 to-rose-500" : gradient}`} />

      <CardContent className="p-5 space-y-3">
        {/* Metric Label & Confidence Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              confRating >= 90
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : confRating >= 80
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
            title="Statistical Confidence Score verified by AnalysisValidator multi-pass engine"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>{confRating}% Conf.</span>
          </div>
        </div>

        {/* Primary Value Display OR Low Confidence Flag Alert Component */}
        {isFlaggedStatic100 || isLowConfidence ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
                <span>{isFlaggedStatic100 ? "Unverified 100/100 Score Flagged" : "Low Statistical Confidence"}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded font-bold">
                {confRating}% Confidence
              </span>
            </div>

            <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
              {relevantFlags[0]?.description ||
                (hasPerfectScoreCorrection
                  ? "AnalysisValidator flagged a suspicious static 100/100 score. Empirical missing cells, Z-score outliers, or variance distortions detected."
                  : "Statistical confidence threshold fell below acceptable limits due to extreme Z-score outliers or data entry anomalies.")}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-amber-500/20 text-amber-300">
              <span>Audited Score Estimate:</span>
              <span className="font-bold text-amber-200">
                {hasPerfectScoreCorrection && relevantFlags[0]?.correctedValue
                  ? `${relevantFlags[0].correctedValue}/100`
                  : `${Math.round(score * (confRating / 100))}/100`}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
              {score}
            </span>
            <span className="text-slate-500 text-xs font-medium">/{maxScore}</span>
          </div>
        )}

        {/* Confidence Level Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Statistical Confidence</span>
            <span className={confRating >= 90 ? "text-emerald-400" : confRating >= 80 ? "text-amber-400" : "text-rose-400 font-bold"}>
              {confRating >= 90 ? "High Reliability" : confRating >= 80 ? "Moderate Variance" : "Low Confidence Alert"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-500 ${
                confRating >= 90 ? "bg-emerald-500" : confRating >= 80 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${confRating}%` }}
            />
          </div>
        </div>

        {/* Contextual Banner for moderate flags when value display is active */}
        {!isFlaggedStatic100 && !isLowConfidence && (relevantFlags.length > 0 || hasPerfectScoreCorrection) && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1 text-amber-300">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Statistical Audit Flag</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              {relevantFlags[0]?.description || "Dataset exhibits Z-score variances or outlier distributions."}
            </p>
          </div>
        )}

        {/* Score Explanation tooltip if provided */}
        {explanation && !isLowConfidence && !isFlaggedStatic100 && relevantFlags.length === 0 && (
          <p className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 line-clamp-2">
            {explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
