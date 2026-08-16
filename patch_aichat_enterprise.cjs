const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/AIChat.tsx', 'utf8');

code = code.replace(
  '<span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">DuckDB WASM Engine</span>',
  '<span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">DuckDB WASM Engine</span>\n                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">AST-Sandboxed SQL</span>\n                                  <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">Backend RLS Enforced</span>'
);

fs.writeFileSync('src/pages/workspace/AIChat.tsx', code);
