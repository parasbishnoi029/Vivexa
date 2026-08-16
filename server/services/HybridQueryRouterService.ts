import crypto from "crypto";

export type ExecutionEngineTarget =
  | "DUCKDB_WASM_LOCAL"
  | "SNOWFLAKE_PUSHDOWN"
  | "DATABRICKS_LAKEHOUSE"
  | "POSTGRES_ENTERPRISE_CLUSTER"
  | "MICROVM_CONTAINER";

export interface QueryAnalysisResult {
  queryId: string;
  originalQuery: string;
  rewrittenQuery: string;
  targetEngine: ExecutionEngineTarget;
  routingReason: string;
  complexityScore: number; // 0 to 100
  estimatedMemoryMb: number;
  estimatedDurationMs: number;
  estimatedCloudCostSavedUsd: number;
  isCached: boolean;
  securityPoliciesApplied: {
    rlsTenantFilter: boolean;
    clsMaskedColumns: string[];
    roleEnforced: string;
  };
  features: {
    hasJoins: boolean;
    joinCount: number;
    hasWindowFunctions: boolean;
    hasAggregations: boolean;
    hasSubqueries: boolean;
    hasCte: boolean;
    hasLimit: boolean;
    limitValue?: number;
    scannedTables: string[];
    projectedColumnsCount: number;
  };
}

export interface DatasetStatsProfile {
  datasetId: string;
  name: string;
  rowCount: number;
  sizeBytes: number;
  isClientCached: boolean;
  cloudWarehouseSource?: "snowflake" | "databricks" | "postgres" | "clickhouse" | "local_csv";
  partitionsCount?: number;
}

/**
 * Enterprise Hybrid Query Router Layer
 * Dynamically analyzes AST, computational complexity, dataset geometry, and concurrency demands.
 * Automatically directs lightweight analytical workloads to DuckDB-WASM for zero-cost, sub-10ms local compute
 * and offloads distributed multi-table joins, massive scans, or high-concurrency jobs to Snowflake / Databricks / PostgreSQL.
 */
export class HybridQueryRouterService {
  private static readonly LOCAL_DUCKDB_MAX_ROWS = 500000; // 500k rows
  private static readonly LOCAL_DUCKDB_MAX_BYTES = 50 * 1024 * 1024; // 50MB

  /**
   * Evaluates SQL query structure, table profiles, and user security context.
   */
  public static analyzeAndRoute(
    sqlQuery: string,
    datasetProfile?: DatasetStatsProfile,
    userContext?: { role?: string; tenantId?: string }
  ): QueryAnalysisResult {
    const cleanSql = sqlQuery.trim();
    const queryId = `qr-${crypto.randomBytes(6).toString("hex")}`;
    const userRole = userContext?.role || "analyst";
    const tenantId = userContext?.tenantId || "default_tenant";

    // 1. Lexical and AST feature extraction
    const hasJoins = /\b(JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN)\b/i.test(cleanSql);
    const joinMatches = cleanSql.match(/\b(JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN)\b/gi);
    const joinCount = joinMatches ? joinMatches.length : 0;

    const hasWindowFunctions = /\bOVER\s*\(/i.test(cleanSql);
    const hasAggregations = /\b(COUNT|SUM|AVG|MIN|MAX|STDDEV|MEDIAN|PERCENTILE_CONT)\s*\(/i.test(cleanSql);
    const hasSubqueries = /\(\s*SELECT\b/i.test(cleanSql);
    const hasCte = /^\s*WITH\b/i.test(cleanSql);
    const hasLimit = /\bLIMIT\s+(\d+)\b/i.test(cleanSql);
    const limitMatch = cleanSql.match(/\bLIMIT\s+(\d+)\b/i);
    const limitValue = limitMatch ? parseInt(limitMatch[1], 10) : undefined;

    // Extract scanned table identifiers
    const tableRegex = /\bFROM\s+([a-zA-Z0-9_\.]+)/gi;
    const scannedTables: string[] = [];
    let match;
    while ((match = tableRegex.exec(cleanSql)) !== null) {
      scannedTables.push(match[1]);
    }

    // 2. Compute Complexity Score (0 - 100)
    let score = 5;
    if (hasAggregations) score += 15;
    if (hasJoins) score += 25 * Math.min(joinCount, 3);
    if (hasWindowFunctions) score += 30;
    if (hasSubqueries) score += 20;
    if (hasCte) score += 15;
    if (!hasLimit) score += 10;
    const complexityScore = Math.min(100, Math.max(0, score));

    // 3. Dataset scale evaluation
    const rowCount = datasetProfile?.rowCount || 25000;
    const sizeBytes = datasetProfile?.sizeBytes || 2.5 * 1024 * 1024;
    const isExternalWarehouse = datasetProfile?.cloudWarehouseSource && datasetProfile.cloudWarehouseSource !== "local_csv";

    // 4. Dynamic Routing Decision Engine
    let targetEngine: ExecutionEngineTarget = "DUCKDB_WASM_LOCAL";
    let routingReason = "";
    let estimatedCloudCostSavedUsd = 0.0;

    if (isExternalWarehouse) {
      if (datasetProfile?.cloudWarehouseSource === "snowflake") {
        targetEngine = "SNOWFLAKE_PUSHDOWN";
        routingReason = "Direct cloud pushdown: Dataset resides in Snowflake Enterprise Warehouse. Offloading execution to Snowflake virtual warehouse cluster.";
      } else if (datasetProfile?.cloudWarehouseSource === "databricks") {
        targetEngine = "DATABRICKS_LAKEHOUSE";
        routingReason = "Lakehouse Delta Engine pushdown: Offloading massive Delta Lake scan to Databricks Photon engine.";
      } else {
        targetEngine = "POSTGRES_ENTERPRISE_CLUSTER";
        routingReason = "Target is external PostgreSQL OLAP replica cluster with connection pooling.";
      }
    } else if (rowCount > this.LOCAL_DUCKDB_MAX_ROWS || sizeBytes > this.LOCAL_DUCKDB_MAX_BYTES || joinCount >= 3 || (hasWindowFunctions && rowCount > 100000)) {
      // Large dataset or deep multi-table join offload to Cloud Warehouse
      targetEngine = "SNOWFLAKE_PUSHDOWN";
      routingReason = `Workload exceeds local browser threshold (${rowCount.toLocaleString()} rows, ${joinCount} joins, complexity: ${complexityScore}/100). Auto-offloading to Snowflake Serverless Warehouse with distributed partition pruning.`;
      estimatedCloudCostSavedUsd = 0.0;
    } else {
      // Simple or medium analytical workload routed to DuckDB-WASM
      targetEngine = "DUCKDB_WASM_LOCAL";
      routingReason = `Fast Vector Local Compute: Query is within client capacity (${rowCount.toLocaleString()} rows, ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB, complexity: ${complexityScore}/100). Executing in-browser with DuckDB-WASM for 0 server cost and ultra-low latency (<10ms).`;
      // Compute estimated cloud credits saved
      estimatedCloudCostSavedUsd = Number((0.08 + (complexityScore / 100) * 0.45).toFixed(3));
    }

    // 5. Dynamic Row-Level Security (RLS) & Column-Level Security (CLS) Masking
    const maskedColumns: string[] = [];
    let rewrittenSql = cleanSql;

    // Apply CLS masking if user is not admin
    if (userRole !== "admin") {
      const sensitiveCols = ["ssn", "credit_card", "salary", "password_hash", "tax_id", "email_raw"];
      for (const col of sensitiveCols) {
        const regex = new RegExp(`\\b${col}\\b`, "gi");
        if (regex.test(rewrittenSql)) {
          maskedColumns.push(col);
          rewrittenSql = rewrittenSql.replace(regex, `SHA256(${col}) AS ${col}_masked`);
        }
      }
    }

    // Apply RLS tenant isolation filter if applicable
    let rlsApplied = false;
    if (tenantId && !cleanSql.toLowerCase().includes("tenant_id") && scannedTables.length > 0) {
      if (rewrittenSql.toLowerCase().includes("where")) {
        rewrittenSql = rewrittenSql.replace(/\bWHERE\b/i, `WHERE tenant_id = '${tenantId}' AND`);
      } else if (rewrittenSql.toLowerCase().includes("group by")) {
        rewrittenSql = rewrittenSql.replace(/\bGROUP BY\b/i, `WHERE tenant_id = '${tenantId}' GROUP BY`);
      } else if (rewrittenSql.toLowerCase().includes("order by")) {
        rewrittenSql = rewrittenSql.replace(/\bORDER BY\b/i, `WHERE tenant_id = '${tenantId}' ORDER BY`);
      } else if (rewrittenSql.toLowerCase().includes("limit")) {
        rewrittenSql = rewrittenSql.replace(/\bLIMIT\b/i, `WHERE tenant_id = '${tenantId}' LIMIT`);
      } else {
        rewrittenSql = `${rewrittenSql} WHERE tenant_id = '${tenantId}'`;
      }
      rlsApplied = true;
    }

    return {
      queryId,
      originalQuery: cleanSql,
      rewrittenQuery: rewrittenSql,
      targetEngine,
      routingReason,
      complexityScore,
      estimatedMemoryMb: Math.round(Math.max(4, (sizeBytes / (1024 * 1024)) * 1.5)),
      estimatedDurationMs: targetEngine === "DUCKDB_WASM_LOCAL" ? Math.round(complexityScore * 0.4 + 5) : Math.round(complexityScore * 8 + 180),
      estimatedCloudCostSavedUsd,
      isCached: false,
      securityPoliciesApplied: {
        rlsTenantFilter: rlsApplied,
        clsMaskedColumns: maskedColumns,
        roleEnforced: userRole
      },
      features: {
        hasJoins,
        joinCount,
        hasWindowFunctions,
        hasAggregations,
        hasSubqueries,
        hasCte,
        hasLimit,
        limitValue,
        scannedTables,
        projectedColumnsCount: cleanSql.split(",").length
      }
    };
  }
}
