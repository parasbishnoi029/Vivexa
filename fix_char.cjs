const fs = require('fs');
let code = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');
code = code.replace(/\\nexport function generateMockDataset/g, '\nexport function generateMockDataset');
fs.writeFileSync('src/lib/datasetParser.ts', code);
