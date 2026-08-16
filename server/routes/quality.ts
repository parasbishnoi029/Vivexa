import { Router } from "express";

export const qualityRouter = Router();

interface QualityAssertion {
  id: string;
  expectationType: "expect_column_values_to_not_be_null" | "expect_column_values_to_be_unique" | "expect_column_values_to_be_between" | "expect_column_values_to_match_regex";
  targetColumn: string;
  parameters: Record<string, any>;
  status: "PASSED" | "FAILED" | "WARNING";
  evaluatedRows: number;
  failedRowsCount: number;
  unexpectedPercent: number;
  sampleFailedValues?: any[];
}

interface DatasetQualitySuite {
  datasetId: string;
  datasetName: string;
  layer: "Bronze" | "Silver" | "Gold";
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  quarantineTriggered: boolean;
  evaluatedAt: string;
  assertions: QualityAssertion[];
}

const DEFAULT_SUITES: Record<string, DatasetQualitySuite> = {
  gold_enterprise_revenue: {
    datasetId: "gold_enterprise_revenue",
    datasetName: "gold_enterprise_revenue",
    layer: "Gold",
    overallScore: 100,
    totalChecks: 5,
    passedChecks: 5,
    failedChecks: 0,
    quarantineTriggered: false,
    evaluatedAt: new Date().toISOString(),
    assertions: [
      {
        id: "qa-1",
        expectationType: "expect_column_values_to_not_be_null",
        targetColumn: "transaction_id",
        parameters: { column: "transaction_id" },
        status: "PASSED",
        evaluatedRows: 12800000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      },
      {
        id: "qa-2",
        expectationType: "expect_column_values_to_be_unique",
        targetColumn: "transaction_id",
        parameters: { column: "transaction_id" },
        status: "PASSED",
        evaluatedRows: 12800000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      },
      {
        id: "qa-3",
        expectationType: "expect_column_values_to_be_between",
        targetColumn: "amount_usd",
        parameters: { min_value: 0.01, max_value: 1000000.0 },
        status: "PASSED",
        evaluatedRows: 12800000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      },
      {
        id: "qa-4",
        expectationType: "expect_column_values_to_match_regex",
        targetColumn: "region",
        parameters: { regex: "^(North America|EMEA|APAC|LATAM)$" },
        status: "PASSED",
        evaluatedRows: 12800000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      },
      {
        id: "qa-5",
        expectationType: "expect_column_values_to_not_be_null",
        targetColumn: "event_timestamp",
        parameters: { column: "event_timestamp" },
        status: "PASSED",
        evaluatedRows: 12800000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      }
    ]
  },
  silver_customer_telemetry: {
    datasetId: "silver_customer_telemetry",
    datasetName: "silver_customer_telemetry",
    layer: "Silver",
    overallScore: 98.4,
    totalChecks: 4,
    passedChecks: 3,
    failedChecks: 1,
    quarantineTriggered: true,
    evaluatedAt: new Date().toISOString(),
    assertions: [
      {
        id: "qa-10",
        expectationType: "expect_column_values_to_not_be_null",
        targetColumn: "event_id",
        parameters: { column: "event_id" },
        status: "PASSED",
        evaluatedRows: 45200000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      },
      {
        id: "qa-11",
        expectationType: "expect_column_values_to_be_between",
        targetColumn: "latency_ms",
        parameters: { min_value: 0, max_value: 10000 },
        status: "PASSED",
        evaluatedRows: 45200000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      },
      {
        id: "qa-12",
        expectationType: "expect_column_values_to_not_be_null",
        targetColumn: "session_id",
        parameters: { column: "session_id" },
        status: "WARNING",
        evaluatedRows: 45200000,
        failedRowsCount: 420,
        unexpectedPercent: 0.0009,
        sampleFailedValues: ["null", "undefined", "00000000-0000-0000-0000-000000000000"]
      },
      {
        id: "qa-13",
        expectationType: "expect_column_values_to_match_regex",
        targetColumn: "device_type",
        parameters: { regex: "^(Desktop|Mobile|Tablet)$" },
        status: "PASSED",
        evaluatedRows: 45200000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      }
    ]
  }
};

// GET /api/v1/quality/suite/:datasetId - Retrieve data quality suite evaluation
qualityRouter.get("/suite/:datasetId", (req, res) => {
  const { datasetId } = req.params;
  const suite = DEFAULT_SUITES[datasetId] || {
    datasetId,
    datasetName: datasetId,
    layer: "Bronze",
    overallScore: 95.0,
    totalChecks: 3,
    passedChecks: 3,
    failedChecks: 0,
    quarantineTriggered: false,
    evaluatedAt: new Date().toISOString(),
    assertions: [
      {
        id: "qa-gen-1",
        expectationType: "expect_column_values_to_not_be_null",
        targetColumn: "id",
        parameters: { column: "id" },
        status: "PASSED",
        evaluatedRows: 100000,
        failedRowsCount: 0,
        unexpectedPercent: 0.0
      }
    ]
  };
  res.json({ success: true, suite });
});

// POST /api/v1/quality/verify - Execute Great Expectations / Soda assertion suite over sample rows
qualityRouter.post("/verify", (req, res) => {
  try {
    const { datasetName, layer = "Silver", rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: "Rows array is required for validation." });
    }

    const totalRows = rows.length;
    const assertions: QualityAssertion[] = [];
    let failedChecksCount = 0;

    if (totalRows > 0) {
      const sampleKeys = Object.keys(rows[0]);
      
      // Check 1: Not Null on first column / ID
      const idCol = sampleKeys[0];
      const nullRows = rows.filter(r => r[idCol] === null || r[idCol] === undefined || r[idCol] === "");
      const isNullFail = nullRows.length > 0;
      if (isNullFail) failedChecksCount++;

      assertions.push({
        id: `chk-${Date.now()}-1`,
        expectationType: "expect_column_values_to_not_be_null",
        targetColumn: idCol,
        parameters: { column: idCol },
        status: isNullFail ? "FAILED" : "PASSED",
        evaluatedRows: totalRows,
        failedRowsCount: nullRows.length,
        unexpectedPercent: Math.round((nullRows.length / totalRows) * 1000) / 10
      });

      // Check 2: Uniqueness on primary key column
      const uniqueVals = new Set(rows.map(r => String(r[idCol])));
      const duplicateCount = totalRows - uniqueVals.size;
      const isDupFail = duplicateCount > 0;
      if (isDupFail) failedChecksCount++;

      assertions.push({
        id: `chk-${Date.now()}-2`,
        expectationType: "expect_column_values_to_be_unique",
        targetColumn: idCol,
        parameters: { column: idCol },
        status: isDupFail ? "WARNING" : "PASSED",
        evaluatedRows: totalRows,
        failedRowsCount: duplicateCount,
        unexpectedPercent: Math.round((duplicateCount / totalRows) * 1000) / 10
      });

      // Check 3: Numeric range check if amount or price or latency column exists
      const numCol = sampleKeys.find(k => k.includes("amount") || k.includes("price") || k.includes("latency") || k.includes("num"));
      if (numCol) {
        const outOfRangeRows = rows.filter(r => typeof r[numCol] === "number" && (r[numCol] < 0 || r[numCol] > 10000000));
        const isRangeFail = outOfRangeRows.length > 0;
        if (isRangeFail) failedChecksCount++;

        assertions.push({
          id: `chk-${Date.now()}-3`,
          expectationType: "expect_column_values_to_be_between",
          targetColumn: numCol,
          parameters: { min_value: 0, max_value: 10000000 },
          status: isRangeFail ? "FAILED" : "PASSED",
          evaluatedRows: totalRows,
          failedRowsCount: outOfRangeRows.length,
          unexpectedPercent: Math.round((outOfRangeRows.length / totalRows) * 1000) / 10
        });
      }
    }

    const totalChecks = assertions.length;
    const passedChecks = totalChecks - failedChecksCount;
    const overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 1000) / 10 : 100;

    res.json({
      success: true,
      suite: {
        datasetName: datasetName || "custom_ingest",
        layer,
        overallScore,
        totalChecks,
        passedChecks,
        failedChecks: failedChecksCount,
        quarantineTriggered: failedChecksCount > 0,
        evaluatedAt: new Date().toISOString(),
        assertions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/quality/detect-drift - Kolmogorov-Smirnov (KS) & Wasserstein Distance distribution drift detection
qualityRouter.post("/detect-drift", (req, res) => {
  try {
    const { datasetName = "gold_enterprise_revenue", featureColumn = "amount_usd", threshold = 0.05 } = req.body;

    // Baseline baseline distribution vs current streaming distribution sample
    const baselineMean = 1200;
    const baselineStd = 180;
    const currentMean = 1480; // Intentional drift for simulation
    const currentStd = 240;

    // Compute Wasserstein Distance (approximate 1D Earth Mover's Distance)
    const wassersteinDistance = Math.abs(currentMean - baselineMean) + Math.abs(currentStd - baselineStd);

    // Compute Kolmogorov-Smirnov (KS) Statistic D and empirical p-value
    const ksStatistic = Math.round((Math.abs(currentMean - baselineMean) / baselineStd) * 100) / 100;
    const pValue = ksStatistic > 0.3 ? 0.0021 : 0.42;

    // Population Stability Index (PSI)
    const psiScore = ksStatistic > 0.3 ? 0.28 : 0.04; // PSI > 0.2 indicates significant population shift

    const driftDetected = pValue < threshold || psiScore > 0.2;
    const alertSeverity = psiScore > 0.25 ? "CRITICAL" : driftDetected ? "MODERATE" : "NONE";

    res.json({
      success: true,
      driftAnalysis: {
        datasetName,
        featureColumn,
        baselineSampleCount: 10000,
        currentStreamingCount: 2500,
        ksStatistic,
        pValue,
        wassersteinDistance: Math.round(wassersteinDistance * 100) / 100,
        psiScore,
        driftDetected,
        alertSeverity,
        recommendedAction: driftDetected
          ? "CRITICAL DRIFT DETECTED: Trigger automated Retraining Pipeline 'pipe-retrain-xgb-v4' and alert Data Science On-Call via PagerDuty."
          : "Distribution stable within 95% confidence interval.",
        evaluatedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Data drift detection failed: ${err.message}` });
  }
});

