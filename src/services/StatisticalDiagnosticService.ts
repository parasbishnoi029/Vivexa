/**
 * StatisticalDiagnosticService
 * Scans tabular and time-series report data for parametric and non-parametric anomalies,
 * calculating Z-scores, IQR bounds, and rolling variance to detect spikes and drops.
 * Injects diagnostic warning badges and explanations directly into report content.
 */

export interface AnomalyBadgeInfo {
  id: string;
  type: 'Spike' | 'Drop' | 'VarianceShift' | 'Normal';
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  metric: string;
  observedValue: number;
  expectedValue: number;
  zScore: number;
  percentageDelta: number;
  badgeLabel: string;
  badgeColor: string;
  explanation: string;
  remediation: string;
  timestamp?: string;
  index: number;
}

export interface StatisticalScanResult {
  hasAnomalies: boolean;
  totalPointsScanned: number;
  spikeCount: number;
  dropCount: number;
  criticalCount: number;
  anomalies: AnomalyBadgeInfo[];
  summaryText: string;
  datasetVariance: number;
  standardDeviation: number;
  mean: number;
}

export class StatisticalDiagnosticService {
  /**
   * Scans an array of numeric numbers or time series data points.
   */
  public static scanTimeSeries(
    data: Array<{ period?: string; timestamp?: string; value: number; metric?: string }>,
    zThreshold: number = 2.5
  ): StatisticalScanResult {
    if (!data || data.length === 0) {
      return {
        hasAnomalies: false,
        totalPointsScanned: 0,
        spikeCount: 0,
        dropCount: 0,
        criticalCount: 0,
        anomalies: [],
        summaryText: "No data available for diagnostic scan.",
        datasetVariance: 0,
        standardDeviation: 0,
        mean: 0,
      };
    }

    const values = data.map((d) => d.value);
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    
    // Variance and StdDev
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance) || 1;

    // IQR Method for non-parametric confirmation
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const upperIqrBound = q3 + 1.5 * iqr;
    const lowerIqrBound = q1 - 1.5 * iqr;

    const anomalies: AnomalyBadgeInfo[] = [];

    data.forEach((point, idx) => {
      const val = point.value;
      const zScore = (val - mean) / stdDev;
      const pctDelta = mean !== 0 ? ((val - mean) / mean) * 100 : 0;
      
      const isZSpike = zScore > zThreshold;
      const isZDrop = zScore < -zThreshold;
      const isIqrOutlier = val > upperIqrBound || val < lowerIqrBound;

      if (isZSpike || (val > upperIqrBound && isIqrOutlier)) {
        const severity = zScore > 4.0 ? 'Critical' : zScore > 3.0 ? 'High' : 'Moderate';
        anomalies.push({
          id: `anomaly-spike-${idx}`,
          type: 'Spike',
          severity,
          metric: point.metric || 'Primary Ingest Flow',
          observedValue: val,
          expectedValue: Math.round(mean * 100) / 100,
          zScore: Math.round(zScore * 100) / 100,
          percentageDelta: Math.round(pctDelta * 10) / 10,
          badgeLabel: `⚠️ Spike Detected (+${Math.round(pctDelta)}%)`,
          badgeColor: severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          explanation: `Sudden upward surge of ${Math.round(pctDelta)}% (Z=${zScore.toFixed(2)}σ) exceeds upper control threshold. Likely caused by batch transaction bursting or unthrottled upstream job.`,
          remediation: `Implement partition-level rate limits and apply winsorization smoothing to tail distributions.`,
          timestamp: point.timestamp || point.period || `T+${idx}`,
          index: idx,
        });
      } else if (isZDrop || (val < lowerIqrBound && isIqrOutlier)) {
        const severity = zScore < -4.0 ? 'Critical' : zScore < -3.0 ? 'High' : 'Moderate';
        anomalies.push({
          id: `anomaly-drop-${idx}`,
          type: 'Drop',
          severity,
          metric: point.metric || 'Primary Ingest Flow',
          observedValue: val,
          expectedValue: Math.round(mean * 100) / 100,
          zScore: Math.round(zScore * 100) / 100,
          percentageDelta: Math.round(pctDelta * 10) / 10,
          badgeLabel: `🔻 Drop Detected (${Math.round(pctDelta)}%)`,
          badgeColor: severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          explanation: `Sudden downward plunge of ${Math.round(pctDelta)}% (Z=${zScore.toFixed(2)}σ) below lower control threshold. Indicates zero-fill gaps, connection timeouts, or ingest worker drops.`,
          remediation: `Audit webhook reconnect retry policies and inspect Kafka partition offset lag.`,
          timestamp: point.timestamp || point.period || `T+${idx}`,
          index: idx,
        });
      }
    });

    const spikeCount = anomalies.filter((a) => a.type === 'Spike').length;
    const dropCount = anomalies.filter((a) => a.type === 'Drop').length;
    const criticalCount = anomalies.filter((a) => a.severity === 'Critical').length;

    return {
      hasAnomalies: anomalies.length > 0,
      totalPointsScanned: n,
      spikeCount,
      dropCount,
      criticalCount,
      anomalies,
      summaryText: anomalies.length > 0
        ? `Statistical scan flagged ${anomalies.length} anomalous events (${spikeCount} spikes, ${dropCount} drops, ${criticalCount} critical) across ${n} time horizons.`
        : `Statistical scan verified data distribution stability across ${n} time horizons (0 anomalies detected, all within ±${zThreshold}σ).`,
      datasetVariance: Math.round(variance * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      mean: Math.round(mean * 100) / 100,
    };
  }

  /**
   * Injects warning badges and contextual diagnostic cards into report markdown or structured text.
   */
  public static injectAnomaliesIntoReport(
    reportText: string,
    scanResult: StatisticalScanResult
  ): string {
    if (!scanResult.hasAnomalies) return reportText;

    const badgesSection = [
      "\n\n### 🛡️ Automated Statistical Quality & Outlier Flags",
      `> **Diagnostic Scan Summary:** ${scanResult.summaryText}\n`,
      ...scanResult.anomalies.map(
        (a) =>
          `- **${a.badgeLabel}** at \`${a.timestamp}\`: ${a.explanation} *Prescriptive Action: ${a.remediation}*`
      ),
      "\n",
    ].join("\n");

    return reportText + badgesSection;
  }
}
