const fs = require('fs');
let content = fs.readFileSync('src/lib/dataEngine.ts', 'utf8');

// 1. Fix type inference
content = content.replace(
  /if \(\!isNaN\(Number\(val\)\)\) \{\s*isNumericCount\+\+;\s*\}/,
  `const cleanNumStr = strVal.replace(/[$,]/g, '').trim();
        if (cleanNumStr !== '' && !isNaN(Number(cleanNumStr))) {
          isNumericCount++;
        }`
);

// 2. Fix the numArr population for numeric columns
content = content.replace(
  /const numArr = nonNullValues\.map\(v => Number\(v\)\)\.filter\(n => \!isNaN\(n\)\);/,
  `const numArr = nonNullValues.map(v => Number(String(v).replace(/[$,]/g, '').trim())).filter(n => !isNaN(n));`
);

fs.writeFileSync('src/lib/dataEngine.ts', content);
