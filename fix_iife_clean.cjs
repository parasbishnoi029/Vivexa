const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Dashboard.tsx', 'utf8');

// Replace the end of the map and IIFE
code = code.replace(
  /\)\)\}\s*\n\s*\}\)\(\)\}/,
  `))
                })()}`
);

fs.writeFileSync('src/pages/workspace/Dashboard.tsx', code);
