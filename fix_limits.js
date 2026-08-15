const fs = require('fs');
let code = fs.readFileSync('src/lib/limits.ts', 'utf8');
code = code.replace(/\\\$/g, '$');
code = code.replace(/\\`/g, '`');
fs.writeFileSync('src/lib/limits.ts', code);
