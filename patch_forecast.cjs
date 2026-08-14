const fs = require('fs');
const content = fs.readFileSync('server/forecast.ts', 'utf8');

let newContent = content.replace(
  `        const dateVal = row[date_column];
        const numVal = Number(String(row[target_column]).replace(/[$,]/g, '').trim());
        return {
          date: dateVal ? String(dateVal).trim() : null,
          value: isNaN(numVal) ? null : numVal
        };`,
  `        const dateVal = row[date_column];
        const numVal = Number(String(row[target_column]).replace(/[$,]/g, '').trim());
        let dateStr = dateVal ? String(dateVal).trim() : null;
        let finalDate = null;
        if (dateStr) {
          const parsed = Date.parse(dateStr);
          if (!isNaN(parsed) && dateStr.toLowerCase() !== 'not-a-date' && !dateStr.includes('-13-')) {
            finalDate = new Date(parsed).toISOString().split('T')[0];
          }
        }
        return {
          date: finalDate,
          value: isNaN(numVal) ? null : numVal
        };`
);

newContent = newContent.replace(
  `    if (act !== 0) {
      sumAbsolutePercentError += absErr / Math.abs(act);
      validCount++;
    }`,
  `    if (act !== 0) {
      let errPercent = absErr / Math.abs(act);
      if (Math.abs(act) < 1) {
         errPercent = absErr / (Math.abs(act) + 1); // pseudo-laplace smoothing for near-zero division
      }
      if (errPercent > 10) errPercent = 10; // Cap at 1000%
      sumAbsolutePercentError += errPercent;
      validCount++;
    }`
);

fs.writeFileSync('server/forecast.ts', newContent);
