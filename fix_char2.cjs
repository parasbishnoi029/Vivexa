const fs = require('fs');
let code = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');
code = code.replace(/\\n/g, '\n');
fs.writeFileSync('src/lib/datasetParser.ts', code);
