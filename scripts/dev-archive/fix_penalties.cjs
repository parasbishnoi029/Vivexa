const fs = require('fs');
let content = fs.readFileSync('src/lib/dataEngine.ts', 'utf8');

// Increase missingPenalty scale
content = content.replace(
  /const missingPenalty = \(overallNullRatio \* 65\) \+ \(emptyColsRatio \* 35\);/,
  `const missingPenalty = (overallNullRatio * 250) + (emptyColsRatio * 50);`
);

// Increase duplicatePenalty scale
content = content.replace(
  /const duplicatePenalty = duplicateRatio \* 50;/,
  `const duplicatePenalty = duplicateRatio * 150;`
);

// Increase outlierPenalty scale
content = content.replace(
  /const outlierPenalty = Math.min\(30, overallOutlierRatio \* 35\);/,
  `const outlierPenalty = Math.min(30, overallOutlierRatio * 150);`
);

// Increase inconsistencyPenalty scale
content = content.replace(
  /const inconsistencyPenalty = Math.min\(35, categoricalInconsistencyCount \* 12\);/,
  `const inconsistencyPenalty = Math.min(35, categoricalInconsistencyCount * 15);`
);

// Also need to update the formula strings for UI!
content = content.replace(
  /qualityFormula: \`Data Quality \(\$\{dataQualityScore\}\/100\) = 100 - \(\$\{\(overallNullRatio \* 65\)\.toFixed\(1\)\} missing penalty\) - \(\$\{\(emptyColsRatio \* 35\)\.toFixed\(1\)\} empty col penalty\)/,
  `qualityFormula: \`Data Quality (\${dataQualityScore}/100) = 100 - (\${(overallNullRatio * 250).toFixed(1)} missing penalty) - (\${(emptyColsRatio * 50).toFixed(1)} empty col penalty)\``
);

// Wait, the original string might be different, let's just do a string replace for the formulas:
content = content.replace(
  /qualityFormula:.*?,/,
  `qualityFormula: \`Data Quality (\${dataQualityScore}/100) = 100 - (\${(overallNullRatio * 250).toFixed(1)} missing penalty) - (\${(emptyColsRatio * 50).toFixed(1)} empty col penalty) - (\${duplicatePenalty.toFixed(1)} duplicate penalty) - (\${outlierPenalty.toFixed(1)} outlier penalty) - (\${inconsistencyPenalty.toFixed(1)} categorical inconsistency penalty)\`,`
);

content = content.replace(
  /healthFormula:.*?,/,
  `healthFormula: \`Dataset Health (\${healthScore}/100) = 100 - (\${(overallNullRatio * 150).toFixed(1)} missing penalty) - (\${(emptyColsRatio * 40).toFixed(1)} empty col penalty) - (\${(overallOutlierRatio * 100).toFixed(1)} outlier penalty) - (\${(duplicateRatio * 100).toFixed(1)} duplicate penalty)\`,`
);
content = content.replace(
  /const healthScore = Math.max\(0, Math.min\(100, Math.round\(100 - \(overallNullRatio \* 50\) - \(emptyColsRatio \* 30\) - \(overallOutlierRatio \* 25\) - \(duplicateRatio \* 30\)\)\)\);/,
  `const healthScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 150) - (emptyColsRatio * 40) - (overallOutlierRatio * 100) - (duplicateRatio * 100))));`
);

content = content.replace(
  /mlReadinessFormula:.*?,/,
  `mlReadinessFormula: \`ML Readiness (\${mlReadinessScore}/100) = 100 - (\${(overallNullRatio * 200).toFixed(1)} missing penalty) - (\${(emptyColsRatio * 50).toFixed(1)} empty col penalty) - (\${(duplicateRatio * 150).toFixed(1)} duplicate penalty) - (\${numericCols.length < 2 ? '35 low numeric features penalty' : '0 penalty'})\`,`
);
content = content.replace(
  /const mlReadinessScore = Math.max\(0, Math.min\(100, Math.round\(100 - \(overallNullRatio \* 55\) - \(emptyColsRatio \* 35\) - \(duplicateRatio \* 30\) - \(numericCols.length < 2 \? 35 : 0\)\)\)\);/,
  `const mlReadinessScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 200) - (emptyColsRatio * 50) - (duplicateRatio * 150) - (numericCols.length < 2 ? 35 : 0))));`
);

content = content.replace(
  /businessReadinessFormula:.*?,/,
  `businessReadinessFormula: \`Business Readiness (\${businessReadinessScore}/100) = 100 - (\${(overallNullRatio * 150).toFixed(1)} missing penalty) - (\${(emptyColsRatio * 40).toFixed(1)} empty col penalty) - (\${(duplicateRatio * 100).toFixed(1)} duplicate penalty) - (\${categoricalCols.length === 0 ? '15 zero categorical features penalty' : '0 penalty'}) - (\${inconsistencyPenalty.toFixed(1)} inconsistency penalty)\`,`
);
content = content.replace(
  /const businessReadinessScore = Math.max\(0, Math.min\(100, Math.round\(100 - \(overallNullRatio \* 45\) - \(emptyColsRatio \* 25\) - \(duplicateRatio \* 30\) - \(categoricalCols.length === 0 \? 15 : 0\) - inconsistencyPenalty\)\)\);/,
  `const businessReadinessScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 150) - (emptyColsRatio * 40) - (duplicateRatio * 100) - (categoricalCols.length === 0 ? 15 : 0) - inconsistencyPenalty)));`
);

fs.writeFileSync('src/lib/dataEngine.ts', content);
