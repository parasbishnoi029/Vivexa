import { supabase } from './supabase';

export interface DataStudioProcedureParams {
  datasetId: string;
  strategy?: string;
  cleanedRows?: Record<string, any>[];
  columns?: string[];
  qualityScore?: number;
  transformationsApplied?: any[];
  options?: Record<string, any>;
}

export interface DataStudioProcedureResult {
  success: boolean;
  method: string;
  data: any;
  error?: string;
}

/**
 * Robust interface linking UI-based Data Studio operations to Supabase backend stored procedures.
 * Sequentially attempts stored procedure RPC calls on Supabase (e.g. process_dataset_studio, update_dataset_stats)
 * and falls back seamlessly to Express backend API persistence and storage object sync.
 */
export async function executeDataStudioProcedure(params: DataStudioProcedureParams): Promise<DataStudioProcedureResult> {
  const { datasetId, strategy = 'auto', cleanedRows = [], columns = [], qualityScore = 98.5, transformationsApplied = [], options = {} } = params;

  let rpcSuccess = false;
  let rpcResultData: any = null;

  // 1. Attempt primary Supabase stored procedure: process_dataset_studio
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('process_dataset_studio', {
      p_dataset_id: datasetId,
      p_strategy: strategy,
      p_rows_count: cleanedRows.length,
      p_cols_count: columns.length || (cleanedRows[0] ? Object.keys(cleanedRows[0]).length : 0),
      p_quality_score: qualityScore,
      p_options: options
    });

    if (!rpcError && rpcData) {
      console.log('[DATA STUDIO SP] Executed process_dataset_studio stored procedure:', rpcData);
      rpcSuccess = true;
      rpcResultData = rpcData;
    }
  } catch (err) {
    console.warn('[DATA STUDIO SP] process_dataset_studio RPC unavailable or pending creation:', err);
  }

  // 2. Attempt secondary Supabase stored procedure: update_dataset_stats
  if (!rpcSuccess) {
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('update_dataset_stats', {
        p_dataset_id: datasetId,
        p_row_count: cleanedRows.length,
        p_col_count: columns.length || (cleanedRows[0] ? Object.keys(cleanedRows[0]).length : 0),
        p_quality: qualityScore
      });

      if (!statsError && statsData) {
        console.log('[DATA STUDIO SP] Executed update_dataset_stats stored procedure:', statsData);
        rpcSuccess = true;
        rpcResultData = statsData;
      }
    } catch (err) {
      console.warn('[DATA STUDIO SP] update_dataset_stats RPC unavailable:', err);
    }
  }

  // 3. Always invoke backend API endpoint to persist CSV object to Supabase storage & synchronize database metadata
  const { data: { session } } = await supabase.auth.getSession();
  const bearerToken = session?.access_token || "";

  const response = await fetch(`/api/v1/datasets/${datasetId}/save-cleaned`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": bearerToken ? `Bearer ${bearerToken}` : "",
    },
    body: JSON.stringify({
      cleanedRows,
      columns,
      qualityScore,
      transformationsApplied,
      strategy,
      rpcExecuted: rpcSuccess
    }),
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.success) {
    if (rpcSuccess && rpcResultData) {
      return {
        success: true,
        method: 'supabase_rpc_stored_procedure',
        data: rpcResultData
      };
    }
    throw new Error(resJson.error || 'Failed to save cleaned dataset to database');
  }

  // 4. Attempt audit log stored procedure
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase.rpc('log_dataset_audit', {
        p_user_id: user.id,
        p_action: 'DATASTUDIO_CLEAN_EXECUTED',
        p_dataset_id: datasetId,
        p_payload: {
          rows: cleanedRows.length,
          cols: columns.length,
          quality: qualityScore,
          transformations: transformationsApplied
        }
      });
    }
  } catch (auditErr) {
    // Non-blocking audit procedure
  }

  return {
    success: true,
    method: rpcSuccess ? 'supabase_rpc_and_storage_sync' : 'api_storage_and_database_sync',
    data: resJson.data
  };
}
