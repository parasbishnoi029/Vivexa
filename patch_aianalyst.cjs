const fs = require('fs');
const file = 'src/pages/workspace/AIAnalyst.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('DataProcessorWorker')) {
  code = code.replace(
    "import { AnalysisValidatorCard }",
    "import DataProcessorWorker from '@/workers/dataProcessor?worker';\nimport { AnalysisValidatorCard }"
  );
}

// 1. Add datasetCache state inside the component
if (!code.includes('datasetCache')) {
  code = code.replace(
    "const [enterpriseIntelligence, setEnterpriseIntelligence] = useState<any>(null);",
    "const [enterpriseIntelligence, setEnterpriseIntelligence] = useState<any>(null);\n  const [datasetCache, setDatasetCache] = useState<Record<string, any[]>>({});"
  );
}

// 2. Rewrite runSeniorDataScientistAnalysis to use caching, worker, and batch API call
const newRunMethod = `const runSeniorDataScientistAnalysis = async () => {
    if (!selectedDatasetId) return;

    try {
      setIsAnalyzing(true);
      setStatusText("Initializing Vivexa Causal Kernel & preparing memory...");
      setAnalysisResult(null);
      setEnterpriseIntelligence(null);

      const ds = datasets.find(d => d.id === selectedDatasetId);
      if (!ds) throw new Error("Dataset not found.");

      let rawRows: any[] = [];

      // MOCK DATA OR REAL FETCH WITH CACHE
      if (ds.metadata?.is_mock) {
        if (datasetCache[ds.id]) {
          rawRows = datasetCache[ds.id];
        } else {
          setStatusText(\`Generating mock simulation buffers for \${ds.name}...\`);
          const { generateMockDataset } = await import('@/lib/datasetParser');
          rawRows = generateMockDataset(ds.name, 3500);
          setDatasetCache(prev => ({ ...prev, [ds.id]: rawRows }));
        }
      } else if (ds.storage_path) {
        if (datasetCache[ds.id]) {
          rawRows = datasetCache[ds.id];
        } else {
          setStatusText(\`Downloading dataset buffer \${ds.storage_path}...\`);
          const { data: fileData, error: fileError } = await supabase.storage.from('datasets').download(ds.storage_path);
          if (!fileError && fileData) {
            try {
              const parsed = await parseDatasetFile(fileData, ds.name);
              rawRows = parsed.rows;
              setDatasetCache(prev => ({ ...prev, [ds.id]: rawRows }));
            } catch (pErr) {
              console.error("Failed to parse dataset in AIAnalyst:", pErr);
            }
          }
        }
      }

      if (rawRows.length === 0) {
        setIsAnalyzing(false);
        setStatusText("");
        setEnterpriseIntelligence(null);
        alert(\`Failed to load or parse dataset: \${ds.name}. Please ensure the dataset file is valid and accessible.\`);
        return;
      }

      setStatusText("Calculating multivariate statistics & quality scores via Web Worker...");
      
      const profile = await new Promise<DatasetProfile>((resolve, reject) => {
        const worker = new DataProcessorWorker();
        worker.onmessage = (e) => {
          const { type, payload, error } = e.data;
          if (type === 'PROFILE_SUCCESS') {
            worker.terminate();
            resolve(payload.profileResult);
          } else if (type === 'PROCESS_ERROR') {
            worker.terminate();
            reject(new Error(error));
          }
        };
        worker.postMessage({
          type: 'PROFILE_ONLY',
          jobId: Date.now(),
          payload: {
            rows: rawRows,
            datasetName: ds.name,
            fileSize: ds.size_bytes
          }
        });
      });

      setComputedProfile(profile);

      // Check for data entry errors and severe Z-score outliers
      const entryCheck = AnalysisValidator.checkDataEntryErrorsAndOutliers(profile, rawRows);
      setDataEntryCheck(entryCheck);

      if (profile.numericColumns.length > 0 && !selectedFeatureCol) {
        setSelectedFeatureCol(profile.numericColumns[0]);
      }

      setStatusText("Consulting Senior Data Scientist Decision Model & Playbooks (Batch LLM Request)...");
      const res = await fetch('/api/v1/gemini/batch-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${session?.access_token}\`
        },
        body: JSON.stringify({
          profile,
          dataset_name: ds.name,
          rows: profile.totalRows,
          cols: profile.totalCols,
          model: 'gemini-3.1-pro-preview'
        })
      });

      const json = await res.json();
      if (res.status === 429 || json.error === "AI_QUOTA_EXCEEDED" || json.code === "LIMIT_CONTROL_BLOCKED") {
        triggerQuotaModal();
        toast.error(json.message || "Monthly AI API quota reached for your plan. Please upgrade.");
        setIsAnalyzing(false);
        return;
      }

      if (json.success && json.data) {
        if (json.data.analyze) {
          setAnalysisResult(json.data.analyze);
          // Run Pass 3 Anti-Hallucination validation against generated AI summary
          const updatedReport = AnalysisValidator.runFullMultiPassValidation(profile, rawRows, json.data.analyze.summary);
          profile.validationReport = updatedReport;
          setComputedProfile({ ...profile });
        }
        if (json.data.enterprise) {
          setEnterpriseIntelligence(json.data.enterprise);
        }
      }

      await checkAndConsumeQuota(1);
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      toast.error(err.message || "An unexpected error occurred running AI analysis.");
    } finally {
      setIsAnalyzing(false);
      setStatusText("");
    }
  };`;

// Replace the old function. We'll use regex to match from `const runSeniorDataScientistAnalysis = async () => {` to the end of the function block.
code = code.replace(/const runSeniorDataScientistAnalysis = async \(\) => \{[\s\S]*?finally \{\s*setIsAnalyzing\(false\);\s*setStatusText\(""\);\s*\}\s*\};/, newRunMethod);

fs.writeFileSync(file, code);
