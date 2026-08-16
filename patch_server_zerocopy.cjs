const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const warehouseProxyRoute = `
// --- ENTERPRISE ZERO-COPY PROXY ROUTE ---
app.post('/api/v1/warehouse/query', (req, res) => {
  const { sql, connectorId, params } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid OAuth token.' });
  }
  
  // Simulate JWT / OAuth Validation
  // Simulate push-down execution to Snowflake/Databricks
  console.log(\`[Warehouse Proxy] Executing SQL via \${connectorId}: \${sql}\`);
  
  // Simulate a 500ms network delay for remote execution
  setTimeout(() => {
    // Generate a dummy paginated dataset in JSON
    const columns = [
      { name: 'id', type: 'VARCHAR' },
      { name: 'revenue', type: 'DECIMAL' },
      { name: 'segment', type: 'VARCHAR' }
    ];
    
    const rows = Array.from({ length: 50 }).map((_, i) => ({
      id: \`evt_\${Math.random().toString(36).substr(2, 9)}\`,
      revenue: (Math.random() * 10000).toFixed(2),
      segment: ['Enterprise', 'SMB', 'Mid-Market'][Math.floor(Math.random() * 3)]
    }));
    
    res.json({
      success: true,
      data: {
        columns,
        rows,
        metrics: {
          execution_time_ms: 482,
          bytes_scanned: 1048576,
          records_returned: rows.length,
          total_available_records: 154000
        }
      }
    });
  }, 500);
});
`;

code = code.replace(
  '// API routes go here FIRST',
  '// API routes go here FIRST\n' + warehouseProxyRoute
);

fs.writeFileSync('server.ts', code);
