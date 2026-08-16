const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/AIChat.tsx', 'utf8');

code = code.replace(
  '<span className="flex items-center gap-1.5"><Table className="h-3.5 w-3.5 text-indigo-400" /> Query Dataset Records</span>',
  '<span className="flex items-center gap-1.5"><Table className="h-3.5 w-3.5 text-indigo-400" /> Query Dataset Records</span>\n                                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">DuckDB WASM Engine</span>'
);

// We'll also update DatasetDetail or DataConnectors to say "Zero-Copy execution via Serverless Proxy"
fs.writeFileSync('src/pages/workspace/AIChat.tsx', code);
