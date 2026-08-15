const fs = require('fs');
let code = fs.readFileSync('src/components/workspace/ExecutiveReportViewer.tsx', 'utf8');

code = code.replace(
  'className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden"',
  'className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper"'
);

code = code.replace(
  'className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"',
  'className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 print-modal-content"'
);

fs.writeFileSync('src/components/workspace/ExecutiveReportViewer.tsx', code);
