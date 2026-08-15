const fs = require('fs');
let code = fs.readFileSync('src/lib/datasetParser.ts', 'utf8');

const generateMockDatasetFn = `
export function generateMockDataset(name: string, rowCount: number = 3500) {
  const isFinance = name.toLowerCase().includes('finance') || name.toLowerCase().includes('sales');
  const rows = [];
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  for (let i = 0; i < rowCount; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    if (isFinance) {
      rows.push({
        id: i + 1,
        date: dateStr,
        revenue: Math.random() * 50000 + 10000,
        costs: Math.random() * 30000 + 5000,
        region: ['North America', 'Europe', 'APAC', 'LATAM'][Math.floor(Math.random() * 4)],
        product_category: ['SaaS', 'Hardware', 'Services'][Math.floor(Math.random() * 3)],
        churn_risk: Math.random() < 0.1 ? 'High' : (Math.random() < 0.3 ? 'Medium' : 'Low')
      });
    } else {
      rows.push({
        id: i + 1,
        timestamp: dateStr,
        value_1: Math.random() * 100,
        value_2: Math.random() * 50,
        category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        status: ['Active', 'Pending', 'Closed'][Math.floor(Math.random() * 3)]
      });
    }
  }
  return rows;
}
`;

if (!code.includes('generateMockDataset')) {
  fs.writeFileSync('src/lib/datasetParser.ts', code + '\\n' + generateMockDatasetFn);
}
