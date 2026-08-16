const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/DatasetDetail.tsx', 'utf8');

code = code.replace(
  '<div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-0.5">Row-Level Security (RLS) Applied</div>',
  '<div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-0.5">Row-Level Security (RLS) Applied</div>\n                          <div className="text-[8px] bg-rose-500/20 text-rose-200 px-1.5 rounded inline-block mt-1 font-mono">AST-Parser Active</div>'
);

code = code.replace(
  '<ShieldCheck className="h-4 w-4 text-rose-400" /> Active RLS Enforcement',
  '<ShieldCheck className="h-4 w-4 text-rose-400" /> Active RLS Enforcement (True AST Validation)'
);

fs.writeFileSync('src/pages/workspace/DatasetDetail.tsx', code);
