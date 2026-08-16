const fs = require('fs');

let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

const dynamicDataGenerator = `const generateTrendData = () => {
  const data = [];
  let currentPrecision = 95.0;
  let currentPassRate = 92.0;
  let currentQuality = 88.0;
  let currentMargin = 0.0500;
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    
    // Asymptotic improvement simulation
    currentPrecision += (100 - currentPrecision) * 0.3;
    currentPassRate += (100 - currentPassRate) * 0.35;
    currentQuality += (100 - currentQuality) * 0.4;
    currentMargin *= 0.6;
    
    data.push({
      date: dateStr,
      precision: Number(currentPrecision.toFixed(4)),
      passRate: Number(currentPassRate.toFixed(2)),
      qualityIndex: Number(currentQuality.toFixed(2)),
      marginOfError: Number(currentMargin.toFixed(4)),
      bootstrapSE: Number((currentMargin * 0.45).toFixed(4))
    });
  }
  return data;
};

const PRECISION_TREND_DATA = generateTrendData();`;

code = code.replace(
  /const PRECISION_TREND_DATA = \[\s*\{[\s\S]*?\}\s*\];/m,
  dynamicDataGenerator
);

fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
