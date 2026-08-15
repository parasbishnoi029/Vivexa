const fs = require('fs');
let code = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');

// I need to fix the broken regexes that were split across multiple lines
// For example:
// clean = clean.replace(/[\r
// \t]+/g, " ").trim();
code = code.replace(/\\r\n\\t\\+\]\/g/g, '\\r\\n\\t]+/g');

// Or better, just rewrite the entire file from the latest git if possible? No git is corrupted.
