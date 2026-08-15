const fs = require('fs');
let code = fs.readFileSync('src/layouts/WorkspaceLayout.tsx', 'utf8');
code = code.replace(
  'initial={{ opacity: 0, y: 20 }}',
  'initial={{ opacity: 0 }}'
);
code = code.replace(
  'animate={{ opacity: 1, y: 0 }}',
  'animate={{ opacity: 1 }}'
);
code = code.replace(
  'exit={{ opacity: 0, y: -20 }}',
  'exit={{ opacity: 0 }}'
);
fs.writeFileSync('src/layouts/WorkspaceLayout.tsx', code);
