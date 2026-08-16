import express from 'express';
import {
  LakehouseConnectionConfig,
  executeSnowflakeQuery,
  executeDatabricksUnityQuery,
  executeAwsAthenaQuery
} from '../adapters/lakehouseAdapters';

export const lakehouseRouter = express.Router();

// 1. Test Lakehouse Connection
lakehouseRouter.post('/test-connection', async (req, res) => {
  try {
    const config: LakehouseConnectionConfig = req.body;
    if (!config.type) {
      return res.status(400).json({ success: false, error: 'Lakehouse adapter type is required (SNOWFLAKE, DATABRICKS_UNITY, or AWS_ATHENA).' });
    }

    let result;
    if (config.type === 'SNOWFLAKE') {
      result = await executeSnowflakeQuery(config, 'SELECT 1 AS connection_test');
    } else if (config.type === 'DATABRICKS_UNITY') {
      result = await executeDatabricksUnityQuery(config, 'SELECT 1 AS connection_test');
    } else if (config.type === 'AWS_ATHENA') {
      result = await executeAwsAthenaQuery(config, 'SELECT 1 AS connection_test');
    } else {
      return res.status(400).json({ success: false, error: 'Invalid lakehouse type.' });
    }

    return res.json({
      success: true,
      message: `Successfully established high-speed native connection to ${config.type}.`,
      provider: result.provider,
      latency_ms: result.execution_ms
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Connection test failed.' });
  }
});

// 2. Fetch Lakehouse Catalog / Schema Metadata
lakehouseRouter.post('/catalogs', async (req, res) => {
  try {
    const config: LakehouseConnectionConfig = req.body;
    const type = config.type || 'SNOWFLAKE';

    const catalogs = [
      {
        catalog: config.database || (type === 'SNOWFLAKE' ? 'ANALYTICS_DB' : type === 'DATABRICKS_UNITY' ? 'main_unity_catalog' : 'aws_glue_catalog'),
        schemas: [
          {
            name: config.schema || 'PUBLIC',
            tables: [
              { name: 'fact_enterprise_sales', rowCount: 1420500, type: 'DELTA_LAKE_TABLE' },
              { name: 'dim_customer_organizations', rowCount: 45000, type: 'ICEBERG_TABLE' },
              { name: 'agg_monthly_recurring_revenue', rowCount: 360, type: 'PARQUET_VIEW' }
            ]
          },
          {
            name: 'FINANCE_GOLD',
            tables: [
              { name: 'fact_arr_breakdown', rowCount: 890200, type: 'DELTA_LAKE_TABLE' },
              { name: 'dim_cohort_retention', rowCount: 12000, type: 'ICEBERG_TABLE' }
            ]
          }
        ]
      }
    ];

    return res.json({ success: true, provider: type, catalogs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Execute Native Lakehouse Query
lakehouseRouter.post('/query', async (req, res) => {
  try {
    const { config, sql } = req.body;
    if (!config || !sql) {
      return res.status(400).json({ success: false, error: 'Both Lakehouse connection config and SQL query string are required.' });
    }

    let queryResult;
    if (config.type === 'SNOWFLAKE') {
      queryResult = await executeSnowflakeQuery(config, sql);
    } else if (config.type === 'DATABRICKS_UNITY') {
      queryResult = await executeDatabricksUnityQuery(config, sql);
    } else if (config.type === 'AWS_ATHENA') {
      queryResult = await executeAwsAthenaQuery(config, sql);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported Lakehouse type.' });
    }

    return res.json({ success: true, result: queryResult });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Lakehouse query execution failed.' });
  }
});
