const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfExporter.ts', 'utf8');
code = code.replace(
  'const pageNum = (doc).internal.getNumberOfPages();',
  'const pageNum = (doc as any).internal.getNumberOfPages();'
);
fs.writeFileSync('src/lib/pdfExporter.ts', code);
