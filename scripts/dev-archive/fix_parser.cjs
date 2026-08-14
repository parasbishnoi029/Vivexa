const fs = require('fs');
let content = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');

content = content.replace(
  /if \(typeof v === "number" \|\| \(\!isNaN\(Number\(v\)\) && String\(v\)\.trim\(\) !== ""\)\) \{/,
  `const cleanNumStr = String(v).replace(/[$,]/g, '').trim();
        if (typeof v === "number" || (!isNaN(Number(cleanNumStr)) && cleanNumStr !== "")) {`
);

fs.writeFileSync('src/lib/datasetParser.ts', content);
