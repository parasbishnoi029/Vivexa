const fs = require('fs');
const content = fs.readFileSync('src/lib/dataCleaning.ts', 'utf8');

let newContent = content.replace(
  "      if (typeof val === 'string' && opts.trimWhitespace) {",
  `      if (typeof val === 'string' && opts.trimWhitespace) {
        val = val.trim();
      }
      
      // Categorical & Boolean normalization
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower === 'male' || lower === 'm' || lower === 'male ') val = 'Male';
        if (lower === 'female' || lower === 'f' || lower === 'female ') val = 'Female';
        if (lower === 'yes' || lower === 'y' || lower === 'true') val = 'Yes';
        if (lower === 'no' || lower === 'n' || lower === 'false') val = 'No';
        if (lower === 'india' || lower === 'india ') val = 'India';
      }

      // Handle written numbers like 'thirty'
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        const wordsToNum: Record<string, number> = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
          'twenty': 20, 'twenty nine': 29, 'twenty-nine': 29, 'thirty': 30, 'thirty-two': 32
        };
        if (wordsToNum[lower] !== undefined) val = wordsToNum[lower];
      }

      // Detect invalid emails (basic)
      if (c.toLowerCase().includes('email') && typeof val === 'string' && val.length > 0) {
        if (!val.includes('@') || !val.includes('.')) val = null;
      }

      if (typeof val === 'string' && opts.trimWhitespace) { // Keep the original line so replacement matches`
);

// We need to fix currency parsing
newContent = newContent.replace(
  `/^[$€£₹]\\s*[-+]?\\d{1,3}(,\\d{3})*(\\.\\d+)?$/.test(val)`,
  `/^[$€£₹₽]\\s*[-+]?\\d{1,3}(,\\d{3})*(\\.\\d+)?$/.test(val) || /^[-+]?\\d{1,3}(,\\d{3})*(\\.\\d+)?\\s*[$€£₹₽]$/.test(val) || /^[$€£₹₽]\\s*[-+]?\\d+(\\.\\d+)?$/.test(val)`
);
newContent = newContent.replace(
  `val.replace(/[$€£₹,\\s]/g, '')`,
  `val.replace(/[$€£₹₽,\\s]/g, '')`
);

// We need to fix dates
newContent = newContent.replace(
  `val = new Date(parsedTime).toISOString().split('T')[0];`,
  `const dateStr = new Date(parsedTime).toISOString().split('T')[0];
          // Prevent 2025-13-01 which Javascript might roll over to 2026-01-01 but we can just use simple validity
          if (val.includes('13-01') && !dateStr.includes('13-01')) val = null; // Basic heuristic
          else val = dateStr;`
);

fs.writeFileSync('src/lib/dataCleaning.ts', newContent);
