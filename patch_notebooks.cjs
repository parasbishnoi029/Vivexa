const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Notebooks.tsx', 'utf8');

// Replace the simple active dataset panel with a databricks-style cluster metrics panel
const clusterMetricsPanel = `        {/* ENTERPRISE CLUSTER METRICS PANEL */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" /> Kernel & Cluster Compute
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Dedicated Serverless Instance</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Attached Storage Volume (Dataset)</label>
              <select
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                value={selectedDatasetId}
                onChange={(e) => handleDatasetChange(e.target.value)}
              >
                <option value="">-- No Attached Volume --</option>
                {localDatasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-mono">Memory Allocation (RAM)</span>
                  <span className="text-[10px] font-bold text-slate-300">14.2 GB / 64 GB</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '22%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-mono">CPU Usage (32 Cores)</span>
                  <span className="text-[10px] font-bold text-slate-300">{kernelStatus === 'Busy' ? '88%' : '2%'}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div className={\`\${kernelStatus === 'Busy' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} h-1.5 rounded-full transition-all duration-1000\`} style={{ width: kernelStatus === 'Busy' ? '88%' : '2%' }}></div>
                </div>
              </div>
            </div>

            {selectedDataset && (
              <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[10px] space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vol Type:</span>
                  <span className="text-indigo-400 font-bold uppercase">{selectedDataset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shape:</span>
                  <span>{selectedDataset.rows || 'N/A'} rows × {selectedDataset.cols || 'N/A'} cols</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Size:</span>
                  <span>~{(parseInt(selectedDataset.rows || '0') * 0.005).toFixed(2)} MB in RAM</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>`;

// Regex or replace to swap the ACTIVE DATASET panel with the new cluster panel
code = code.replace(
  /{\/\* ACTIVE DATASET ATTACHMENT PANEL \*\/}[\s\S]*?{\/\* VERSIONING SNAPSHOTS \*\/}/,
  clusterMetricsPanel + '\n\n        {/* VERSIONING SNAPSHOTS */}'
);

// We need to make sure Cpu is imported
if (!code.includes('Cpu,')) {
  code = code.replace('RefreshCw,', 'RefreshCw, Cpu,');
}

fs.writeFileSync('src/pages/workspace/Notebooks.tsx', code);
