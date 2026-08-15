import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings2, ShieldCheck, Activity, RefreshCw, Download, 
  Trash2, Sparkles, AlertTriangle, CheckCircle2, FileSpreadsheet,
  Layers, ArrowRight, Check, Sliders
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { createNotification } from '@/lib/notifications';
import { 
  detectCleaningIssues, 
  cleanDataset, 
  CleaningOptions, 
  CleaningIssue, 
  CleanedDatasetResult 
} from '@/lib/dataCleaning';

interface Props {
  rows: Record<string, any>[];
  datasetName?: string;
  onDatasetCleaned?: (result: CleanedDatasetResult, profile: DatasetProfile) => void;
  datasetSize?: number;
}

export default function DataCleaningStudio({ rows, datasetName = "Dataset", onDatasetCleaned, datasetSize = 0 }: Props) {
  const [missingStrategy, setMissingStrategy] = useState<CleaningOptions['missingValueStrategy']>('auto');
  const [outlierMethod, setOutlierMethod] = useState<CleaningOptions['outlierMethod']>('iqr');
  const [outlierTreatment, setOutlierTreatment] = useState<CleaningOptions['outlierTreatment']>('cap');
  const [scalingStrategy, setScalingStrategy] = useState<CleaningOptions['scalingStrategy']>('none');
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [cleanColNames, setCleanColNames] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [standardizeDates, setStandardizeDates] = useState(true);
  const [parseCurrencies, setParseCurrencies] = useState(true);
  const [removeConstantCols, setRemoveConstantCols] = useState(true);

  const [cleanedResult, setCleanedResult] = useState<CleanedDatasetResult | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningStep, setCleaningStep] = useState<string>("");
  const [cleaningProgress, setCleaningProgress] = useState(0);

  // Detect initial issues
  const initialIssues = useMemo(() => {
    return detectCleaningIssues(rows);
  }, [rows]);

  const handleRunCleaning = () => {
    setIsCleaning(true);
    setCleaningStep("Initializing batch processing worker...");
    setCleaningProgress(0);

    const steps = [
      { msg: "Profiling dataset distributions...", delay: 200 },
      { msg: "Applying missing value imputations...", delay: 500 },
      { msg: "Mitigating statistical outliers...", delay: 800 },
      { msg: "Standardizing encodings & features...", delay: 1100 },
      { msg: "Finalizing quality audit...", delay: 1400 },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setCleaningStep(step.msg);
        setCleaningProgress(((idx + 1) / steps.length) * 100);
      }, step.delay);
    });

    const worker = new DataProcessorWorker();
    
    worker.onmessage = (e) => {
      const { type, payload, error } = e.data;
      if (type === 'PROCESS_SUCCESS') {
        const { cleanResult, profileResult } = payload;
        
        // Optimistic UI updates
        setCleanedResult(cleanResult);
        if (onDatasetCleaned) onDatasetCleaned(cleanResult, profileResult);
        
        toast.success("Data cleaning & profiling engine executed successfully via worker!");
        createNotification({
          title: "Dataset Cleaned",
          message: `Data cleaning pipeline executed for "${datasetName}". Quality score improved from ${cleanResult.auditLog.qualityScoreBefore}% to ${cleanResult.auditLog.qualityScoreAfter}%.`,
          type: "dataset_cleaned",
          priority: "medium"
        });
        
        setTimeout(() => {
          setIsCleaning(false);
          setCleaningStep("");
          setCleaningProgress(0);
          worker.terminate();
        }, 300); // Small delay to let progress bar reach 100%
      } else if (type === 'PROCESS_ERROR') {
        toast.error(error || "Failed to execute cleaning");
        setIsCleaning(false);
        setCleaningStep("");
        setCleaningProgress(0);
        worker.terminate();
      }
    };

    worker.postMessage({
      type: 'PROCESS_DATASET',
      jobId: Date.now(),
      payload: {
        rows,
        datasetName,
        fileSize: datasetSize,
        options: {
          missingValueStrategy: missingStrategy,
          outlierMethod,
          outlierTreatment,
          scalingStrategy,
          removeDuplicates,
          cleanColumnNames: cleanColNames,
          trimWhitespace,
          standardizeDates,
          parseCurrencies,
          removeConstantCols
        }
      }
    });
  };

  const handleDownloadCleanedCSV = () => {
    if (!cleanedResult) return;
    const ws = XLSX.utils.json_to_sheet(cleanedResult.cleanedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CleanedData");
    XLSX.writeFile(wb, `${datasetName}_cleaned.csv`);
    toast.success("Downloaded cleaned CSV dataset");
  };

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {isCleaning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center"
            >
              <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Processing Data</h3>
              <p className="text-sm text-slate-400 mb-6 min-h-[20px]">{cleaningStep}</p>
              <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <motion.div
                  className="bg-indigo-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${cleaningProgress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.3 }}
                />
              </div>
              <div className="w-full text-right">
                <span className="text-xs font-mono text-indigo-300">{Math.round(cleaningProgress)}%</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detected Issues</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{initialIssues.length}</div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Rows</span>
              <div className="text-2xl font-black text-white mt-1">{rows.length.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quality Score Before</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {cleanedResult ? `${cleanedResult.auditLog.qualityScoreBefore}%` : 'Evaluating...'}
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quality Score After</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {cleanedResult ? `${cleanedResult.auditLog.qualityScoreAfter}%` : 'N/A'}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence-based detected issues breakdown */}
      {initialIssues.length > 0 && (
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Evidence-Based Data Health Issues Detected ({initialIssues.length})
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Algorithmic scanning detected the following data anomalies from actual row observations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialIssues.map((issue, idx) => (
              <div key={idx} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase">{issue.type.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      issue.severity === 'high' || issue.severity === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {issue.severity} severity
                    </span>
                    {issue.column && (
                      <span className="text-slate-500 text-[10px]">Column: <code className="text-indigo-400">{issue.column}</code></span>
                    )}
                  </div>
                  <p className="text-slate-400">{issue.description}</p>
                  <p className="text-emerald-400/90 font-mono text-[11px]"><strong className="text-slate-300">Recommendation:</strong> {issue.suggestedAction}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] text-slate-500 block">Affected Observations</span>
                  <span className="text-sm font-bold text-indigo-300 font-mono">{issue.count.toLocaleString()} rows ({issue.percentage}%)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cleaning Configurations */}
      <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-400" /> Automated Data Cleaning Rules
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Configure imputation, outlier treatment, and formatting rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Missing Value Imputation Strategy</label>
              <select
                value={missingStrategy}
                onChange={e => setMissingStrategy(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="auto">Auto (Mean for Numeric, Mode for Categorical)</option>
                <option value="mean">Mean Imputation</option>
                <option value="median">Median Imputation</option>
                <option value="mode">Mode Imputation</option>
                <option value="interpolate">Linear Interpolation</option>
                <option value="ffill">Forward Fill (ffill)</option>
                <option value="bfill">Backward Fill (bfill)</option>
                <option value="drop_rows">Drop Rows with Missing Values</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Outlier Detection Method</label>
              <select
                value={outlierMethod}
                onChange={e => setOutlierMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="iqr">IQR (1.5x Interquartile Range)</option>
                <option value="zscore">Z-Score (|z| &gt; 3.0)</option>
                <option value="modified_zscore">Modified Z-Score (MAD)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Outlier Treatment Option</label>
              <select
                value={outlierTreatment}
                onChange={e => setOutlierTreatment(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="cap">Cap to IQR Fences</option>
                <option value="winsorize">Winsorize (5th/95th Percentiles)</option>
                <option value="remove">Remove Outlier Rows</option>
                <option value="flag">Flag as Outlier Binary Column</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Feature Scaling Strategy</label>
              <select
                value={scalingStrategy}
                onChange={e => setScalingStrategy(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="none">None (Preserve Original Scale)</option>
                <option value="standard">Standardization (Z-Score, mean=0, std=1)</option>
                <option value="minmax">MinMax Scaling ([0, 1])</option>
                <option value="robust">Robust Scaling (Median & IQR)</option>
                <option value="log">Log Transformation (log1p)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={removeDuplicates} onChange={e => setRemoveDuplicates(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
              <span>Deduplicate</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={cleanColNames} onChange={e => setCleanColNames(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
              <span>Clean Col Names</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={trimWhitespace} onChange={e => setTrimWhitespace(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
              <span>Trim Spaces</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={standardizeDates} onChange={e => setStandardizeDates(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
              <span>Standardize Dates</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={parseCurrencies} onChange={e => setParseCurrencies(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
              <span>Parse Currencies</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={removeConstantCols} onChange={e => setRemoveConstantCols(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
              <span>Drop Constant</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={handleRunCleaning}
              disabled={isCleaning}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Run Automatic Data Cleaning
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log / Cleaned Output */}
      {cleanedResult && (
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Cleaning Audit Log & Output
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">
                Final dataset size: {cleanedResult.cleanedRows.length} rows × {cleanedResult.columns.length} columns.
              </CardDescription>
            </div>
            <Button onClick={handleDownloadCleanedCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white mt-3 sm:mt-0">
              <Download className="h-4 w-4 mr-2" /> Download Cleaned CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Transformations Applied ({cleanedResult.auditLog.transformationsApplied.length})</span>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {cleanedResult.auditLog.transformationsApplied.map((trans, i) => (
                  <li key={i}>{trans}</li>
                ))}
              </ul>
            </div>

            {/* Preview of Cleaned Data */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-300 uppercase">
                  <tr>
                    {cleanedResult.columns.map((c, i) => (
                      <th key={i} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleanedResult.cleanedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      {cleanedResult.columns.map((c, j) => (
                        <td key={j} className="px-3 py-2 text-slate-300 truncate max-w-[150px]">{String(row[c] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
