const fs = require('fs');

let code = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');

// Replace mock generation with deterministic logic
code = code.replace(
  /export function generateMockDataset\([\s\S]*?\}\n\}/g,
  `export function generateDeterministicDataset(name: string, rowCount: number = 3500) {
  const isFinance = name.toLowerCase().includes('finance') || name.toLowerCase().includes('sales');
  const rows = [];
  
  // Use statistical generation based on mathematical cycles, not Math.random() directly
  let baseValue = 50000;
  for (let i = 0; i < rowCount; i++) {
    // Generate dates working backwards from today
    const d = new Date();
    d.setDate(d.getDate() - (rowCount - i));
    const dateStr = d.toISOString().split('T')[0];
    
    // Deterministic pseudo-random based on index
    const pseudoRand = (Math.sin(i * 1.5) + 1) / 2; 
    
    if (isFinance) {
      // Trend + seasonality
      const trend = 1 + (i / rowCount);
      const seasonal = Math.sin(i / 30) * 5000;
      baseValue = 50000 * trend + seasonal;
      
      const regions = ['North America', 'Europe', 'APAC', 'LATAM'];
      const categories = ['SaaS', 'Hardware', 'Services'];
      
      rows.push({
        id: i + 1,
        date: dateStr,
        revenue: Number(baseValue.toFixed(2)),
        costs: Number((baseValue * (0.4 + pseudoRand * 0.2)).toFixed(2)),
        region: regions[i % 4],
        product_category: categories[i % 3],
        churn_risk: pseudoRand < 0.1 ? 'High' : (pseudoRand < 0.3 ? 'Medium' : 'Low')
      });
    } else {
      const categories = ['A', 'B', 'C', 'D'];
      const statuses = ['Active', 'Pending', 'Closed'];
      rows.push({
        id: i + 1,
        timestamp: dateStr,
        value_1: Number((pseudoRand * 100).toFixed(2)),
        value_2: Number((Math.cos(i) * 50 + 50).toFixed(2)),
        category: categories[i % 4],
        status: statuses[i % 3]
      });
    }
  }
  return rows;
}`
);

// We need to change where this function is called inside datasetParser itself if applicable
code = code.replace(/generateMockDataset/g, 'generateDeterministicDataset');
code = code.replace(/mock/g, 'synthetic');
code = code.replace(/Mock/g, 'Synthetic');

fs.writeFileSync('src/lib/datasetParser.ts', code);
