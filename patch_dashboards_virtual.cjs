const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/DashboardsBuilder.tsx', 'utf8');

const importVirtual = `import { useVirtualizer } from '@tanstack/react-virtual';\nimport { useRef } from 'react';`;
code = code.replace(
  'import { useState } from "react";',
  'import { useState } from "react";\n' + importVirtual
);

const largeDataSet = `
// Massive mock dataset for virtualization testing
const massiveMockData = Array.from({ length: 50000 }).map((_, i) => ({
  id: i,
  date: new Date(2025, 0, 1 + i).toISOString().split('T')[0],
  status: ['Active', 'Pending', 'Closed'][Math.floor(Math.random() * 3)],
  amount: (Math.random() * 5000).toFixed(2),
  region: ['NA', 'EMEA', 'APAC', 'LATAM'][Math.floor(Math.random() * 4)]
}));
`;
code = code.replace(
  'export default function DashboardsBuilder() {',
  largeDataSet + '\nexport default function DashboardsBuilder() {'
);

const hookVirtual = `
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: massiveMockData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });
`;
code = code.replace(
  'const [crossFilterEnabled, setCrossFilterEnabled] = useState(true);',
  'const [crossFilterEnabled, setCrossFilterEnabled] = useState(true);\n' + hookVirtual
);

const virtualizedTableCard = `
            {/* VIRTUALIZED DATA GRID (50,000 ROWS) */}
            <Card className="col-span-12 row-span-3 bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col group relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-slate-900 border border-slate-700 rounded-lg p-1">
                <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"><Settings2 className="h-3.5 w-3.5" /></button>
                <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"><Maximize2 className="h-3.5 w-3.5" /></button>
              </div>
              <CardHeader className="p-4 pb-2 border-b border-slate-800/50 bg-slate-900/40">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="h-4 w-4 text-emerald-400" /> 
                  Enterprise Transaction Ledger
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono ml-2">
                    50,000 Rows (Virtualized at 60 FPS)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative min-h-[350px]">
                {/* Table Header */}
                <div className="grid grid-cols-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950 p-3 border-b border-slate-800">
                  <div>Transaction ID</div>
                  <div>Date</div>
                  <div>Status</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Region</div>
                </div>
                
                {/* Virtualized Body */}
                <div 
                  ref={parentRef}
                  className="h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                >
                  <div
                    style={{
                      height: \`\${rowVirtualizer.getTotalSize()}px\`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const row = massiveMockData[virtualRow.index];
                      return (
                        <div
                          key={virtualRow.index}
                          className="absolute top-0 left-0 w-full grid grid-cols-5 text-[11px] text-slate-300 p-3 border-b border-slate-800/30 hover:bg-slate-800/40 transition-colors items-center font-mono"
                          style={{
                            height: \`\${virtualRow.size}px\`,
                            transform: \`translateY(\${virtualRow.start}px)\`,
                          }}
                        >
                          <div className="text-indigo-400">#TXN-{row.id.toString().padStart(6, '0')}</div>
                          <div>{row.date}</div>
                          <div>
                            <span className={\`px-2 py-0.5 rounded-full text-[9px] border \${
                              row.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              row.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }\`}>
                              {row.status}
                            </span>
                          </div>
                          <div className="text-right text-white font-bold">\${row.amount}</div>
                          <div className="text-right text-slate-400">{row.region}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
`;

code = code.replace(
  '{/* Drop Zone Placeholder */}',
  virtualizedTableCard + '\n\n            {/* Drop Zone Placeholder */}'
);

fs.writeFileSync('src/pages/workspace/DashboardsBuilder.tsx', code);
