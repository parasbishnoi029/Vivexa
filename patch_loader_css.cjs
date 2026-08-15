const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  /#initial-loader \{\s*display: flex;/g, 
  '#initial-loader {\n          position: fixed;\n          inset: 0;\n          z-index: 99999;\n          display: flex;'
);

// We also need to remove 'position: relative;' to avoid conflict, although 'fixed' above will override it if placed after, but it's better to just replace 'position: relative;'
html = html.replace(/position: relative;\s*overflow: hidden;/g, 'overflow: hidden;');

fs.writeFileSync('index.html', html);
