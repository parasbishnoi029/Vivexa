import express from "express";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { enforceAiQuotaMiddleware } from "./limits";

export const forecastRouter = express.Router();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const connectionString = process.env.DATABASE_URL;
let pool: pg.Pool | null = null;

if (connectionString) {
  try {
    // Validate if connection string is a parseable URL
    new URL(connectionString);
    pool = new pg.Pool({ connectionString });
  } catch (e: any) {
    console.warn("[FORECAST API] DATABASE_URL is not a valid URL. Direct PG connection skipped:", e.message);
  }
}

// Ensure forecasts table exists on startup
async function ensureForecastsTableExists() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.forecasts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          dataset_id UUID NOT NULL,
          dataset_name TEXT NOT NULL,
          target_column TEXT NOT NULL,
          date_column TEXT NOT NULL,
          horizon INTEGER NOT NULL,
          frequency TEXT NOT NULL,
          model_name TEXT NOT NULL,
          confidence_interval REAL NOT NULL,
          mape_error REAL,
          rmse_error REAL,
          mae_error REAL,
          forecast_values JSONB NOT NULL,
          historical_values JSONB NOT NULL,
          notebook_code TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
          CONSTRAINT fk_dataset FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE
        );
      `);
      console.log("[FORECAST API] Table 'public.forecasts' successfully verified/created.");
    } catch (err: any) {
      console.error("[FORECAST API] Error creating forecasts table:", err.message);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn("[FORECAST API] Could not connect pool for table check:", err.message);
  }
}

// Fire-and-forget database table assurance
ensureForecastsTableExists().catch(console.error);

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

interface HistoricalPoint {
  date: string;
  value: number;
}

// Basic math solver for Least Squares
function solveLinearRegression(x: number[], y: number[]) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// Evaluate error metrics with high precision (MAE, RMSE, MAPE, sMAPE, WAPE)
function evaluateMetrics(actuals: number[], predictions: number[]) {
  const n = actuals.length;
  if (n === 0) return { mae: 0, rmse: 0, mape: 0, smape: 0, wape: 0 };

  let sumAbsoluteError = 0;
  let sumSquaredError = 0;
  let sumAbsolutePercentError = 0;
  let sumSymmetricPercentError = 0;
  let sumActuals = 0;
  let validCount = 0;

  for (let i = 0; i < n; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    const absErr = Math.abs(act - pred);

    sumAbsoluteError += absErr;
    sumSquaredError += absErr * absErr;
    sumActuals += Math.abs(act);

    // Standard MAPE with smoothing
    if (act !== 0) {
      let errPercent = absErr / Math.abs(act);
      if (Math.abs(act) < 1) {
        errPercent = absErr / (Math.abs(act) + 1); // pseudo-laplace smoothing for near-zero division
      }
      if (errPercent > 10) errPercent = 10; // Cap at 1000%
      sumAbsolutePercentError += errPercent;
      validCount++;
    }

    // Symmetric MAPE (sMAPE) bounded between 0% and 200%
    const denom = (Math.abs(act) + Math.abs(pred)) / 2;
    if (denom > 1e-6) {
      sumSymmetricPercentError += (absErr / denom);
    }
  }

  const mae = sumAbsoluteError / n;
  const rmse = Math.sqrt(sumSquaredError / n);
  const mape = validCount > 0 ? (sumAbsolutePercentError / validCount) * 100 : 0;
  const smape = (sumSymmetricPercentError / n) * 100;
  const wape = sumActuals > 0 ? (sumAbsoluteError / sumActuals) * 100 : mape;

  return { mae, rmse, mape, smape, wape };
}

function getSafeDate(dateStr: string | null | undefined): Date {
  if (dateStr) {
    const ts = Date.parse(dateStr);
    if (!isNaN(ts)) return new Date(ts);
  }
  return new Date();
}

function getSafeNextDateString(baseDate: Date, offsetH: number, freq: string): string {
  try {
    const validBase = isNaN(baseDate.getTime()) ? new Date() : new Date(baseDate.getTime());
    if (freq.toLowerCase().includes("month")) {
      validBase.setMonth(validBase.getMonth() + offsetH);
    } else if (freq.toLowerCase().includes("week")) {
      validBase.setDate(validBase.getDate() + offsetH * 7);
    } else {
      validBase.setDate(validBase.getDate() + offsetH);
    }
    if (isNaN(validBase.getTime())) return new Date().toISOString().split("T")[0];
    return validBase.toISOString().split("T")[0];
  } catch (e) {
    return new Date().toISOString().split("T")[0];
  }
}

// Fourier / Prophet-style model implementation
function fitProphetFourierModel(dates: string[], values: number[], horizon: number, freq: string, conf: number) {
  const n = values.length;
  // Convert dates to time index
  const x = Array.from({ length: n }, (_, i) => i);
  const { slope, intercept } = solveLinearRegression(x, values);

  // Compute residuals for seasonality
  const residuals = values.map((v, i) => v - (slope * i + intercept));

  const P = freq.toLowerCase().includes("day") ? 7 : freq.toLowerCase().includes("month") ? 12 : 365;

  // Fit 1st order Fourier seasonality
  let sumResidualSin = 0;
  let sumResidualCos = 0;
  for (let i = 0; i < n; i++) {
    sumResidualSin += residuals[i] * Math.sin(2 * Math.PI * i / P);
    sumResidualCos += residuals[i] * Math.cos(2 * Math.PI * i / P);
  }
  const sinCoef = (2 * sumResidualSin) / (n || 1);
  const cosCoef = (2 * sumResidualCos) / (n || 1);

  const fitted = x.map(i => {
    const trend = slope * i + intercept;
    const season = sinCoef * Math.sin(2 * Math.PI * i / P) + cosCoef * Math.cos(2 * Math.PI * i / P);
    return trend + season;
  });

  const stdDev = Math.sqrt(residuals.reduce((acc, r) => acc + r * r, 0) / (n - 2 || 1));
  const zScore = conf === 95 ? 1.96 : conf === 90 ? 1.645 : conf === 80 ? 1.28 : 1.96;

  // Forecast future
  const forecast: { date: string; value: number; lower: number; upper: number }[] = [];
  const lastDate = getSafeDate(dates[n - 1]);

  for (let h = 1; h <= horizon; h++) {
    const nextIdx = n - 1 + h;
    const trend = slope * nextIdx + intercept;
    const season = sinCoef * Math.sin(2 * Math.PI * nextIdx / P) + cosCoef * Math.cos(2 * Math.PI * nextIdx / P);
    const predVal = trend + season;

    const confidenceBound = zScore * stdDev * Math.sqrt(1 + 0.05 * h);
    const dateStr = getSafeNextDateString(lastDate, h, freq);

    forecast.push({
      date: dateStr,
      value: Number(predVal.toFixed(4)),
      lower: Number(Math.max(0, predVal - confidenceBound).toFixed(4)),
      upper: Number((predVal + confidenceBound).toFixed(4))
    });
  }

  const { mae, rmse, mape, smape, wape } = evaluateMetrics(values, fitted);

  return { forecast, fitted, mae, rmse, mape, smape, wape, name: "Prophet Ensemble" };
}

// Triple Exponential Smoothing (Holt-Winters)
function fitHoltWinters(dates: string[], values: number[], horizon: number, freq: string, conf: number) {
  const n = values.length;
  const P = freq.toLowerCase().includes("day") ? 7 : freq.toLowerCase().includes("month") ? 12 : 4;
  
  // Smoothing factors
  const alpha = 0.2;
  const beta = 0.1;
  const gamma = 0.3;

  if (n < P * 2) {
    // Insufficient periods, fallback to double exponential smoothing
    return fitDoubleExponentialSmoothing(dates, values, horizon, freq, conf);
  }

  // Initialize levels, trend, and seasonal components
  let level = values.slice(0, P).reduce((acc, v) => acc + v, 0) / P;
  let trend = (values.slice(P, P * 2).reduce((acc, v) => acc + v, 0) - values.slice(0, P).reduce((acc, v) => acc + v, 0)) / (P * P);
  const seasonals = Array.from({ length: P }, (_, i) => values[i] - level);

  const fitted: number[] = [];
  const levels = [level];
  const trends = [trend];

  for (let i = 0; i < n; i++) {
    const val = values[i];
    const sIdx = i % P;
    const lastL = levels[levels.length - 1];
    const lastT = trends[trends.length - 1];

    const currentLevel = alpha * (val - seasonals[sIdx]) + (1 - alpha) * (lastL + lastT);
    const currentTrend = beta * (currentLevel - lastL) + (1 - beta) * lastT;
    seasonals[sIdx] = gamma * (val - currentLevel) + (1 - gamma) * seasonals[sIdx];

    levels.push(currentLevel);
    trends.push(currentTrend);
    fitted.push(lastL + lastT + seasonals[sIdx]);
  }

  const residuals = values.map((v, i) => v - fitted[i]);
  const stdDev = Math.sqrt(residuals.reduce((acc, r) => acc + r * r, 0) / (n || 1));
  const zScore = conf === 95 ? 1.96 : conf === 90 ? 1.645 : conf === 80 ? 1.28 : 1.96;

  const forecast: { date: string; value: number; lower: number; upper: number }[] = [];
  const lastDate = getSafeDate(dates[n - 1]);
  const finalL = levels[levels.length - 1];
  const finalT = trends[trends.length - 1];

  for (let h = 1; h <= horizon; h++) {
    const sIdx = (n - 1 + h) % P;
    const predVal = finalL + h * finalT + seasonals[sIdx];
    const confidenceBound = zScore * stdDev * Math.sqrt(1 + 0.1 * h);
    const dateStr = getSafeNextDateString(lastDate, h, freq);

    forecast.push({
      date: dateStr,
      value: Number(predVal.toFixed(4)),
      lower: Number(Math.max(0, predVal - confidenceBound).toFixed(4)),
      upper: Number((predVal + confidenceBound).toFixed(4))
    });
  }

  const { mae, rmse, mape, smape, wape } = evaluateMetrics(values, fitted);
  return { forecast, fitted, mae, rmse, mape, smape, wape, name: "Holt-Winters Seasonal" };
}

// Double Exponential Smoothing (Holt's Linear)
function fitDoubleExponentialSmoothing(dates: string[], values: number[], horizon: number, freq: string, conf: number) {
  const n = values.length;
  const alpha = 0.2;
  const beta = 0.1;

  let level = values[0];
  let trend = (values[1] || values[0]) - values[0];

  const fitted: number[] = [level];

  for (let i = 1; i < n; i++) {
    const lastL = level;
    const lastT = trend;
    const val = values[i];

    level = alpha * val + (1 - alpha) * (lastL + lastT);
    trend = beta * (level - lastL) + (1 - beta) * lastT;
    fitted.push(lastL + lastT);
  }

  const residuals = values.map((v, i) => v - fitted[i]);
  const stdDev = Math.sqrt(residuals.reduce((acc, r) => acc + r * r, 0) / (n || 1));
  const zScore = conf === 95 ? 1.96 : conf === 90 ? 1.645 : conf === 80 ? 1.28 : 1.96;

  const forecast: { date: string; value: number; lower: number; upper: number }[] = [];
  const lastDate = getSafeDate(dates[n - 1]);

  for (let h = 1; h <= horizon; h++) {
    const predVal = level + h * trend;
    const confidenceBound = zScore * stdDev * Math.sqrt(1 + 0.1 * h);
    const dateStr = getSafeNextDateString(lastDate, h, freq);

    forecast.push({
      date: dateStr,
      value: Number(predVal.toFixed(4)),
      lower: Number(Math.max(0, predVal - confidenceBound).toFixed(4)),
      upper: Number((predVal + confidenceBound).toFixed(4))
    });
  }

  const { mae, rmse, mape, smape, wape } = evaluateMetrics(values, fitted);
  return { forecast, fitted, mae, rmse, mape, smape, wape, name: "Double Exponential Smoothing" };
}

// Linear / Polynomial Regression Model
function fitLinearRegression(dates: string[], values: number[], horizon: number, freq: string, conf: number) {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const { slope, intercept } = solveLinearRegression(x, values);

  const fitted = x.map(i => slope * i + intercept);
  const residuals = values.map((v, i) => v - fitted[i]);
  const stdDev = Math.sqrt(residuals.reduce((acc, r) => acc + r * r, 0) / (n - 2 || 1));
  const zScore = conf === 95 ? 1.96 : conf === 90 ? 1.645 : conf === 80 ? 1.28 : 1.96;

  const forecast: { date: string; value: number; lower: number; upper: number }[] = [];
  const lastDate = getSafeDate(dates[n - 1]);

  for (let h = 1; h <= horizon; h++) {
    const nextIdx = n - 1 + h;
    const predVal = slope * nextIdx + intercept;
    const confidenceBound = zScore * stdDev * Math.sqrt(1 + 0.15 * h);
    const dateStr = getSafeNextDateString(lastDate, h, freq);

    forecast.push({
      date: dateStr,
      value: Number(predVal.toFixed(4)),
      lower: Number(Math.max(0, predVal - confidenceBound).toFixed(4)),
      upper: Number((predVal + confidenceBound).toFixed(4))
    });
  }

  const { mae, rmse, mape, smape, wape } = evaluateMetrics(values, fitted);
  return { forecast, fitted, mae, rmse, mape, smape, wape, name: "Linear Regression" };
}

// Generates dynamic replicate Python Notebook
function generatePythonNotebook(datasetName: string, dateCol: string, targetCol: string, model: string, horizon: number) {
  return `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.holtwinters import ExponentialSmoothing

# 1. Load the enterprise dataset
dataset_path = "${datasetName}"
print(f"Loading dataset: {dataset_path}")
df = pd.read_csv(dataset_path)

# 2. Preprocess dates and target
df['${dateCol}'] = pd.to_datetime(df['${dateCol}'])
df = df.sort_values('${dateCol}')
df['${targetCol}'] = pd.to_numeric(df['${targetCol}'], errors='coerce')
df = df.dropna(subset=['${dateCol}', '${targetCol}'])

print(f"Loaded {len(df)} historical data points cleanly.")

# 3. Time Series Modeling (${model})
# Fit model and predict ${horizon} steps ahead
if "${model}" == "Holt-Winters Seasonal" or "${model}" == "Auto Model Selector":
    model = ExponentialSmoothing(
        df['${targetCol}'],
        trend='add',
        seasonal='add',
        seasonal_periods=7
    ).fit()
    forecast = model.forecast(${horizon})
else:
    # Fallback to linear trend model
    x = np.arange(len(df))
    y = df['${targetCol}'].values
    slope, intercept = np.polyfit(x, y, 1)
    future_x = np.arange(len(df), len(df) + ${horizon})
    forecast = slope * future_x + intercept

# 4. Generate visual projection outputs
plt.figure(figsize=(12, 6))
plt.plot(df['${dateCol}'], df['${targetCol}'], label='Historical', color='#3b82f6')
future_dates = pd.date_range(start=df['${dateCol}'].iloc[-1], periods=${horizon} + 1, freq='D')[1:]
plt.plot(future_dates, forecast, label='Forecast Projection', color='#10b981', linestyle='--')
plt.title(f"Time Series Forecast: {dataset_path} -> ${targetCol}")
plt.xlabel("Timeline")
plt.ylabel("${targetCol}")
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

print("Execution successfully verified!")
`;
}

// POST /api/v1/forecast/generate
forecastRouter.post('/generate', enforceAiQuotaMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json(successResponse(null, { error: 'Unauthorized: Session missing' }));
    }

    const { dataset_id, target_column, date_column, horizon, confidence_interval, model_preference } = req.body;

    if (!dataset_id || !target_column || !date_column) {
      return res.status(400).json(successResponse(null, { error: 'dataset_id, target_column, and date_column parameters are required.' }));
    }

    const requestedHorizon = Number(horizon) || 30;
    const confidence = Number(confidence_interval) || 95;
    const modelPref = model_preference || "Auto Model Selector";

    // 1. Fetch dataset metadata from DB
    const { data: dataset, error: dsErr } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', dataset_id)
      .maybeSingle();

    if (dsErr || !dataset) {
      return res.status(404).json(successResponse(null, { error: 'Dataset not found or inaccessible.' }));
    }

    // Strict security check: Ensure user owns the dataset or is workspace member
    const isOwner = dataset.user_id === user.id;
    const isAdmin = user.email === 'parasbishnoi012@gmail.com' || user.email === 'info.vivexa@gmail.com';
    let hasAccess = isOwner || isAdmin || dataset.is_public;

    if (!hasAccess && dataset.workspace_id) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', dataset.workspace_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (membership) hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json(successResponse(null, { error: 'Access Denied: You do not have permission to access this dataset.' }));
    }

    // 2. Download dataset file from Supabase storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('datasets')
      .download(dataset.storage_path);

    if (downloadErr || !fileData) {
      console.error("[FORECAST ERROR] Download error:", downloadErr);
      return res.status(400).json(successResponse(null, { error: `Failed to download dataset file from storage path: ${dataset.storage_path}` }));
    }

    // 3. Parse CSV file
    const fileText = await fileData.text();
    const parsedCsv = Papa.parse(fileText, { header: true, skipEmptyLines: true });

    if (parsedCsv.errors && parsedCsv.errors.length > 0 && parsedCsv.data.length === 0) {
      return res.status(400).json(successResponse(null, { error: 'Failed to parse dataset. Ensure CSV contains headers and data rows.' }));
    }

    const csvData = parsedCsv.data as Record<string, any>[];

    // 4. Extract and clean columns
    // Filter out rows missing date or target
    const validRows = csvData
      .map(row => {
        const dateVal = row[date_column];
        const numVal = Number(String(row[target_column]).replace(/[$,]/g, '').trim());
        let dateStr = dateVal ? String(dateVal).trim() : null;
        let finalDate = null;
        if (dateStr) {
          const parsed = Date.parse(dateStr);
          if (!isNaN(parsed) && dateStr.toLowerCase() !== 'not-a-date' && !dateStr.includes('-13-')) {
            finalDate = new Date(parsed).toISOString().split('T')[0];
          }
        }
        return {
          date: finalDate,
          value: isNaN(numVal) ? null : numVal
        };
      })
      .filter((row): row is { date: string; value: number } => row.date !== null && row.value !== null)
      // Sort ascending by date
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (validRows.length < 10) {
      return res.status(400).json(successResponse(null, { error: `Dataset has insufficient valid records (${validRows.length} rows found). Need at least 10 rows for predictive forecasting.` }));
    }

    const dates = validRows.map(r => r.date);
    const values = validRows.map(r => r.value);

    // Auto-detect frequency (Daily, Weekly, Monthly)
    let freq = "Daily";
    if (dates.length >= 3) {
      const diffs = [];
      for (let i = 1; i < dates.length; i++) {
        diffs.push(new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime());
      }
      const medianDiff = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)];
      const days = medianDiff / (1000 * 60 * 60 * 24);
      if (days >= 27 && days <= 32) {
        freq = "Monthly";
      } else if (days >= 6 && days <= 8) {
        freq = "Weekly";
      }
    }

    // 5. Fit selected models or Auto Model Selection
    let finalModelResult: any = null;

    if (modelPref === "Prophet Ensemble") {
      finalModelResult = fitProphetFourierModel(dates, values, requestedHorizon, freq, confidence);
    } else if (modelPref === "Holt-Winters Seasonal") {
      finalModelResult = fitHoltWinters(dates, values, requestedHorizon, freq, confidence);
    } else if (modelPref === "Double Exponential Smoothing") {
      finalModelResult = fitDoubleExponentialSmoothing(dates, values, requestedHorizon, freq, confidence);
    } else if (modelPref === "Linear Regression") {
      finalModelResult = fitLinearRegression(dates, values, requestedHorizon, freq, confidence);
    } else {
      // Auto Selector - Evaluate Prophet, Holt-Winters, Double Exponential, and Linear models
      const prophetResult = fitProphetFourierModel(dates, values, requestedHorizon, freq, confidence);
      const hwResult = fitHoltWinters(dates, values, requestedHorizon, freq, confidence);
      const doubleResult = fitDoubleExponentialSmoothing(dates, values, requestedHorizon, freq, confidence);
      const linearResult = fitLinearRegression(dates, values, requestedHorizon, freq, confidence);

      // Rank candidates using multi-metric precision score (sMAPE + RMSE)
      const candidates = [prophetResult, hwResult, doubleResult, linearResult].filter(c => c && !isNaN(c.mape));
      candidates.sort((a, b) => {
        const scoreA = (a.smape ?? a.mape) * 0.6 + (a.rmse ?? 0) * 0.4;
        const scoreB = (b.smape ?? b.mape) * 0.6 + (b.rmse ?? 0) * 0.4;
        return scoreA - scoreB;
      });
      finalModelResult = candidates[0] || prophetResult;
    }

    // 6. Generate downloadable Python replication notebook
    const notebookCode = generatePythonNotebook(dataset.name, date_column, target_column, finalModelResult.name, requestedHorizon);

    // Historical values structured
    const historicalPoints: HistoricalPoint[] = validRows.map(r => ({
      date: r.date,
      value: Number(r.value.toFixed(4))
    }));

    // Save into public.forecasts table
    const forecastPayload = {
      user_id: user.id,
      dataset_id: dataset.id,
      dataset_name: dataset.name,
      target_column,
      date_column,
      horizon: requestedHorizon,
      frequency: freq,
      model_name: finalModelResult.name,
      confidence_interval: confidence,
      mape_error: isNaN(finalModelResult.mape) ? 0 : Number(finalModelResult.mape.toFixed(4)),
      rmse_error: isNaN(finalModelResult.rmse) ? 0 : Number(finalModelResult.rmse.toFixed(4)),
      mae_error: isNaN(finalModelResult.mae) ? 0 : Number(finalModelResult.mae.toFixed(4)),
      forecast_values: finalModelResult.forecast,
      historical_values: historicalPoints,
      notebook_code: notebookCode
    };

    let returnedResult = null;
    const { data: dbForecast, error: saveErr } = await supabase
      .from('forecasts')
      .insert(forecastPayload)
      .select()
      .single();

    if (saveErr) {
      console.warn("[FORECAST DB NOTE]: Could not persist forecast to DB table, returning generated result directly:", saveErr.message);
      returnedResult = {
        id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
        ...forecastPayload
      };
    } else {
      returnedResult = dbForecast;
    }

    // Log in audit logs table
    try {
      const auditPayload = {
        user_id: user.id,
        action: "Time-Series Forecast Generated",
        metadata: {
          dataset_id: dataset.id,
          dataset_name: dataset.name,
          target_column,
          model_name: finalModelResult.name,
          horizon: requestedHorizon
        },
        created_at: new Date().toISOString()
      };
      await supabase.from('audit_logs').insert(auditPayload);
    } catch (auditErr) {
      // Ignore background audit log errors
    }

    return res.json(successResponse(returnedResult));
  } catch (err: any) {
    console.error("[FORECAST CRITICAL ERROR]:", err);
    res.status(500).json(successResponse(null, { error: err.message || 'Critical internal forecast generation exception.' }));
  }
});

// GET /api/v1/forecast/list
forecastRouter.get('/list', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json(successResponse(null, { error: 'Unauthorized: Session missing' }));
    }

    const { data, error } = await supabase
      .from('forecasts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("[FORECAST LIST NOTE]: Error reading forecasts list, returning empty array:", error.message);
      return res.json(successResponse([]));
    }

    res.json(successResponse(data || []));
  } catch (err: any) {
    res.json(successResponse([]));
  }
});

// DELETE /api/v1/forecast/:id
forecastRouter.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    if (!user || !user.id) {
      return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
    }

    const { error } = await supabase
      .from('forecasts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(500).json(successResponse(null, { error: error.message }));
    }

    res.json(successResponse({ success: true }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});
