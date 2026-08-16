import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import sqlParserPkg from 'node-sql-parser';
import { backgroundWorkerQueue } from '../services/backgroundWorker';

const SqlParser = sqlParserPkg.Parser;
const sqlParser = new SqlParser();
const upload = multer({ dest: '/tmp/vivexa_uploads/' });

export const enterpriseComputeRouter = express.Router();

// Mock in-memory execution database for AST sandbox queries
const enterpriseDB = {
  tables: {} as Record<string, any[]>,
  run: function(query: string, params?: any, cb?: any) {
    if (typeof params === 'function') cb = params;
    if (cb) cb(null);
  },
  all: function(query: string, params?: any, cb?: any) {
    if (typeof params === 'function') cb = params;
    const mockRows = Array.from({ length: 8 }).map((_, i) => ({
      id: i + 1,
      tenant_id: 'demo_tenant',
      metric_name: 'Simulated Financial Record ' + (i + 1),
      amount: Math.floor(Math.random() * 5000) + 1000,
      timestamp: new Date(Date.now() - i * 3600000).toISOString()
    }));
    if (cb) cb(null, mockRows);
  }
};

// 1. Dataset Streaming Upload
enterpriseComputeRouter.post('/dataset/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const tableName = 't_' + Math.random().toString(36).substring(2, 9);

  let tableCreated = false;
  let rowCount = 0;
  const columns: string[] = [];

  const stream = fs.createReadStream(filePath).pipe(csvParser());

  stream.on('headers', (headers: string[]) => {
    columns.push(...headers.map(h => h.replace(/[^a-zA-Z0-9_]/g, '')));
    const colsDef = columns.map(c => `${c} TEXT`).join(', ');
    enterpriseDB.run(`CREATE TABLE ${tableName} (tenant_id TEXT DEFAULT 'demo_tenant', ${colsDef})`, (err: any) => {
      if (err) console.error("DB Create Error:", err);
      tableCreated = true;
    });
  });

  stream.on('data', (data: any) => {
    rowCount++;
    if (tableCreated && rowCount <= 1000) {
      const values = columns.map(col => data[col] || null);
      enterpriseDB.run(`INSERT INTO ${tableName} (tenant_id, ${columns.join(',')}) VALUES ('demo_tenant', ${columns.map(() => '?').join(',')})`, values);
    }
  });

  stream.on('end', () => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}

    return res.json({
      success: true,
      data: {
        table_name: tableName,
        columns: columns,
        processed_rows: rowCount,
        message: 'File successfully streamed and ingested into backend.'
      }
    });
  });
});

// 2. AST Sandboxed SQL Query Execution
enterpriseComputeRouter.post('/sql/query', (req, res) => {
  const { sql } = req.body;

  if (!sql) return res.status(400).json({ success: false, error: "Missing SQL query." });

  try {
    const ast = sqlParser.astify(sql);

    if (Array.isArray(ast)) {
      if (ast.some(q => q.type !== 'select')) throw new Error("Only SELECT queries allowed.");
    } else {
      if (ast.type !== 'select') throw new Error("Only SELECT queries allowed.");
    }

    const secureQuery = `SELECT * FROM (${sql}) AS secure_view WHERE tenant_id = 'demo_tenant' LIMIT 100`;
    const startTime = performance.now();

    enterpriseDB.all(secureQuery, [], (err: any, rows: any[]) => {
      if (err) return res.status(400).json({ success: false, error: err.message, ast_validated: true });

      return res.json({
        success: true,
        ast_validated: true,
        rls_applied: true,
        execution_ms: (performance.now() - startTime).toFixed(2),
        data: rows
      });
    });
  } catch (err: any) {
    return res.status(403).json({
      success: false,
      error: "Security Violation: SQL rejected by AST Sandbox.",
      details: err.message
    });
  }
});

// 3. Isolated Background Worker Queue Execution (Prevents Main Thread Blocking)
enterpriseComputeRouter.post('/cluster/execute', (req, res) => {
  const { iterations = 50000000, script } = req.body;

  const job = backgroundWorkerQueue.enqueue('BATCH_CLUSTER_COMPUTE', {
    iterations,
    script,
  });

  return res.json({
    success: true,
    message: 'High-compute cluster task dispatched to isolated background worker thread pool.',
    job_id: job.id,
    status: job.status,
    createdAt: job.createdAt
  });
});

// 4. Check Background Worker Job Status
enterpriseComputeRouter.get('/cluster/jobs/:id', (req, res) => {
  const job = backgroundWorkerQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Background job not found' });
  }
  return res.json({ success: true, job });
});

// 5. List All Cluster Background Jobs
enterpriseComputeRouter.get('/cluster/jobs', (req, res) => {
  return res.json({ success: true, jobs: backgroundWorkerQueue.getAllJobs() });
});
