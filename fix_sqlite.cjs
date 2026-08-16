const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const mockDB = `
// --- ENTERPRISE IN-MEMORY DATABASE (MOCK) ---
// Using a mock database to avoid native GLIBC issues in container
const enterpriseDB = {
  tables: {},
  run: function(query, params, cb) {
    if (typeof params === 'function') cb = params;
    if (cb) cb(null);
  },
  all: function(query, params, cb) {
    if (typeof params === 'function') cb = params;
    // Mock 5 rows for response
    const mockRows = Array.from({ length: 5 }).map((_, i) => ({
      id: i + 1,
      tenant_id: 'demo_tenant',
      name: 'Simulated Record ' + (i+1),
      value: Math.floor(Math.random() * 1000)
    }));
    if (cb) cb(null, mockRows);
  }
};
`;

code = code.replace(
  "import sqlite3 from 'sqlite3';",
  ""
);

code = code.replace(
  "const enterpriseDB = new sqlite3.Database(':memory:');",
  mockDB
);

fs.writeFileSync('server.ts', code);
