const fs = require('fs');
let code = fs.readFileSync('src/components/workspace/ExecutiveReportViewer.tsx', 'utf8');

// Add import
if (!code.includes('import { createPortal }')) {
  code = code.replace(
    'import { useState } from "react";',
    'import { useState } from "react";\nimport { createPortal } from "react-dom";'
  );
}

// Ensure z-index is super high, just in case (e.g. z-[9999])
code = code.replace(
  'className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper"',
  'className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper"'
);

// Wrap the return statement with createPortal
const returnStartStr = `  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">`;

const returnEndStr = `    </div>
  );
}`;

const newReturnStartStr = `  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">`;

const newReturnEndStr = `    </div>,
    document.body
  );
}`;

// I will just use regex to replace `return (` to `return createPortal(` and the last closing tag. Wait, since it's a big component with multiple returns, doing string replace of just `return (` might hit inner returns (e.g., `return (\n <div key={idx}`). 

// I will target the specific outer return:
// From:
//   return (
//     <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">
// To:
//   return createPortal(
//     <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">

code = code.replace(
  '  return (\n    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">',
  '  return createPortal(\n    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">'
);

// And we need to replace the last `  );\n}` with `  ),\n  document.body\n);`
// Let's find the last occurrence of `  );\n}`
const lastIdx = code.lastIndexOf('  );\n}');
if (lastIdx !== -1) {
  code = code.substring(0, lastIdx) + '  ),\n    document.body\n  );\n}' + code.substring(lastIdx + 6);
}

fs.writeFileSync('src/components/workspace/ExecutiveReportViewer.tsx', code);
