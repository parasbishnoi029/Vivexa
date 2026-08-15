const fs = require('fs');
const file = 'src/workers/dataProcessor.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('PROFILE_ONLY')) {
  code = code.replace(
    "if (type === 'PROCESS_DATASET') {",
    `if (type === 'PROFILE_ONLY') {
    try {
      const { rows, datasetName, fileSize } = payload;
      const profileResult = profileDataset(rows, datasetName, { fileSize });
      self.postMessage({
        type: 'PROFILE_SUCCESS',
        jobId,
        payload: { profileResult }
      });
    } catch (error: any) {
      self.postMessage({
        type: 'PROCESS_ERROR',
        jobId,
        error: error.message || String(error)
      });
    }
  } else if (type === 'PROCESS_DATASET') {`
  );
  fs.writeFileSync(file, code);
}
