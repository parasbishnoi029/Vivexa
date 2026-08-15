const fs = require('fs');
let code = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');

// Fix 1: /[\r\n\t]+/g
code = code.replace(/\/\\[\r\n]+\t\]\+\/g/, '/[\\\\r\\\\n\\\\t]+/g');
// Fix 2: split(/\r?\n/)
code = code.replace(/split\(\/\\[r\n]+\?\n\/\)/g, 'split(/\\\\r?\\\\n/)');
// Fix 3: join("\n")
code = code.replace(/join\("\\\n"\)/g, 'join("\\\\n")');

// Or better, let me just fix the exact strings.
code = code.replace(/clean\.replace\(\/\[\\r\n\\t\]\+\/g/g, 'clean.replace(/[\\\\r\\\\n\\\\t]+/g');
code = code.replace(/text\.split\(\/\\r\?\n\/\)/g, 'text.split(/\\\\r?\\\\n/)');
code = code.replace(/\.join\("\n"\)/g, '.join("\\\\n")');

fs.writeFileSync('src/lib/datasetParser.ts', code);
