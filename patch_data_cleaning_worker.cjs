const fs = require('fs');
const file = 'src/components/workspace/DataCleaningStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add DatasetProfile to imports
code = code.replace(
  "CleanedDatasetResult\n} from '@/lib/dataCleaning';",
  "CleanedDatasetResult\n} from '@/lib/dataCleaning';\nimport { DatasetProfile } from '@/lib/dataEngine';\nimport DataProcessorWorker from '@/workers/dataProcessor?worker';"
);

// Update Props interface
code = code.replace(
  "onDatasetCleaned?: (result: CleanedDatasetResult) => void;",
  "onDatasetCleaned?: (result: CleanedDatasetResult, profile: DatasetProfile) => void;\n  datasetSize?: number;"
);

// Update component signature
code = code.replace(
  "export default function DataCleaningStudio({ rows, datasetName = \"Dataset\", onDatasetCleaned }: Props) {",
  "export default function DataCleaningStudio({ rows, datasetName = \"Dataset\", onDatasetCleaned, datasetSize = 0 }: Props) {"
);

// Update handleRunCleaning body
code = code.replace(
  /const handleRunCleaning = \(\) => \{[\s\S]*?\}, 1700\);\n  \};/,
`const handleRunCleaning = () => {
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
          message: \`Data cleaning pipeline executed for "\${datasetName}". Quality score improved from \${cleanResult.auditLog.qualityScoreBefore}% to \${cleanResult.auditLog.qualityScoreAfter}%.\`,
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
  };`
);

fs.writeFileSync(file, code);
