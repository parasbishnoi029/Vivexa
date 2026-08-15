const fs = require('fs');
let code = fs.readFileSync('src/components/workspace/ExecutiveReportViewer.tsx', 'utf8');

code = code.replace(
  'onClick={() => exportReportToPDF(report)}',
  'onClick={() => window.print()}'
);

fs.writeFileSync('src/components/workspace/ExecutiveReportViewer.tsx', code);
