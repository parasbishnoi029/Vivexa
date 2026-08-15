const fs = require('fs');
const file = 'src/pages/workspace/DatasetDetail.tsx';
let code = fs.readFileSync(file, 'utf8');

// import worker
if (!code.includes('DataProcessorWorker')) {
  code = code.replace(
    'import DataCleaningStudio from "@/components/workspace/DataCleaningStudio";',
    'import DataProcessorWorker from "@/workers/dataProcessor?worker";\nimport DataCleaningStudio from "@/components/workspace/DataCleaningStudio";'
  );
}

// update the profileDataset call
const newProfileCode = `
              const profile = await new Promise<DatasetProfile>((resolve, reject) => {
                const worker = new DataProcessorWorker();
                worker.onmessage = (e) => {
                  if (e.data.type === 'PROFILE_SUCCESS') {
                    worker.terminate();
                    resolve(e.data.payload.profileResult);
                  } else if (e.data.type === 'PROCESS_ERROR') {
                    worker.terminate();
                    reject(new Error(e.data.error));
                  }
                };
                worker.postMessage({
                  type: 'PROFILE_ONLY',
                  jobId: Date.now(),
                  payload: { rows: parsed.rows, datasetName: data.name, fileSize: data.size_bytes }
                });
              });
              setProfile(profile);`;

code = code.replace(
  /const computed = profileDataset\(parsed\.rows, data\.name, \{ fileSize: data\.size_bytes \}\);\n\s*setProfile\(computed\);/,
  newProfileCode
);

fs.writeFileSync(file, code);
