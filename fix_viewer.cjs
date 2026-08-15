const fs = require('fs');
let code = fs.readFileSync('src/components/workspace/ExecutiveReportViewer.tsx', 'utf8');

// First, fix the end of the file.
code = code.replace(
  '  ,\n    document.body\n  );\n}',
  '    </div>\n  );\n}'
);

// Then fix the start of the return.
code = code.replace(
  '  return createPortal(\n    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">',
  '  return (\n    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">'
);

fs.writeFileSync('src/components/workspace/ExecutiveReportViewer.tsx', code);
