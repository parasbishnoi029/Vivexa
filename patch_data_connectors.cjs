const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/DataConnectors.tsx', 'utf8');

const replacementGrid = `
      {/* Zero-Copy Architecture Banner */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 inline-block">Enterprise Zero-Copy Architecture</span>
            <h2 className="text-xl font-bold text-white leading-snug">Direct Warehouse Intelligence</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Vivexa connects directly to your existing Snowflake, Databricks, or BigQuery instances. 
              <strong> Your raw PII data never leaves your VPC. </strong> 
              Our agents generate optimized SQL, push the compute down to your warehouse, and only ingest aggregated, non-sensitive results.
            </p>
          </div>
          <div className="hidden lg:flex items-center justify-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
             <div className="text-center">
               <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-2"><Database className="h-6 w-6 text-blue-400" /></div>
               <div className="text-[9px] font-bold text-slate-300 font-mono">Your Data<br/>Warehouse</div>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[8px] text-indigo-400 font-mono mb-1">Push-Down SQL</span>
               <div className="w-16 h-0.5 bg-indigo-500/30 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-indigo-500/50" />
               </div>
             </div>
             <div className="text-center">
               <div className="w-12 h-12 rounded-xl bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2"><Zap className="h-6 w-6 text-indigo-400" /></div>
               <div className="text-[9px] font-bold text-slate-300 font-mono">Vivexa<br/>Edge Node</div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
`;

code = code.replace(
  '<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">',
  replacementGrid
);

const staticUploads = `
      {/* Static File Uploads (Legacy/Ad-hoc) */}
      <motion.div variants={itemVariants} className="pt-8 mt-8 border-t border-slate-800/80">
        <div className="mb-6 space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><HardDrive className="h-5 w-5 text-slate-400" /> Local & Static File Uploads</h2>
          <p className="text-xs text-slate-400">Upload static CSV or Excel files for rapid prototyping, ad-hoc analysis, or offline datasets.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group" onClick={() => toast.success("Opening File Dialog...")}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">Excel Workbook (.xlsx)</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Upload multi-sheet Excel workbooks. Max size: 250MB per file.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group" onClick={() => toast.success("Opening File Dialog...")}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Table className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">Comma Separated Values (.csv)</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Upload flat CSV files for tabular data ingestion. Max size: 1GB per file.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
`;

code = code.replace(
  '{filteredConnectors.length === 0 && (',
  staticUploads + '\n      {filteredConnectors.length === 0 && ('
);

fs.writeFileSync('src/pages/workspace/DataConnectors.tsx', code);
