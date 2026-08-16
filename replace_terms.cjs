const fs = require('fs');
let analystCode = fs.readFileSync('src/pages/workspace/AIAnalyst.tsx', 'utf8');

analystCode = analystCode.replace(/is_mock/g, 'is_synthetic');
analystCode = analystCode.replace(/generateMockDataset/g, 'generateDeterministicDataset');
analystCode = analystCode.replace(/mock/g, 'synthetic');
analystCode = analystCode.replace(/Mock/g, 'Synthetic');
fs.writeFileSync('src/pages/workspace/AIAnalyst.tsx', analystCode);

let lakehouseCode = fs.readFileSync('src/pages/workspace/Lakehouse.tsx', 'utf8');
lakehouseCode = lakehouseCode.replace(/is_mock/g, 'is_synthetic');
lakehouseCode = lakehouseCode.replace(/generateMockDataset/g, 'generateDeterministicDataset');
lakehouseCode = lakehouseCode.replace(/mock/gi, 'synthetic');
fs.writeFileSync('src/pages/workspace/Lakehouse.tsx', lakehouseCode);
