const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// We want to group all these paths:
const publicPaths = [
  '"/"',
  '"/founders"',
  '"/about"',
  '"/platform"',
  '"/solutions"',
  '"/enterprise"',
  '"/resources"',
  '"/docs"',
  '"/pricing"',
  '"/product-tour"',
  '"/book-demo"',
  '"/terms"',
  '"/privacy"'
];

// Let's just do it manually with sed or a script if it's simpler.
