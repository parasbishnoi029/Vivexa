const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Notebooks.tsx', 'utf8');

code = code.replace(
  '<CardDescription className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Dedicated Serverless Instance</CardDescription>',
  '<CardDescription className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mt-1">Dedicated Serverless Instance (Node.js Worker Threads)</CardDescription>'
);

fs.writeFileSync('src/pages/workspace/Notebooks.tsx', code);
