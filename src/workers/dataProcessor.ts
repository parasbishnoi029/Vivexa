import { cleanDataset, CleaningOptions } from "../lib/dataCleaning";
import { profileDataset } from "../lib/dataEngine";

self.onmessage = (e: MessageEvent) => {
  const { type, payload, jobId } = e.data;

  if (type === 'PROFILE_ONLY') {
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
  } else if (type === 'PROCESS_DATASET') {
    try {
      const { rows, options, datasetName, fileSize } = payload;
      
      // 1. Clean Data
      const cleanResult = cleanDataset(rows, options);
      
      // 2. Profile Data
      const profileResult = profileDataset(cleanResult.cleanedRows, datasetName, { fileSize });

      self.postMessage({
        type: 'PROCESS_SUCCESS',
        jobId,
        payload: {
          cleanResult,
          profileResult
        }
      });
    } catch (error: any) {
      self.postMessage({
        type: 'PROCESS_ERROR',
        jobId,
        error: error.message || String(error)
      });
    }
  }
};
