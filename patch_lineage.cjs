const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/DatasetDetail.tsx', 'utf8');

const lineageComponent = `          {activeTab === "lineage" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Visual Lineage Graph */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                  {/* Subtle Background Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <GitMerge className="h-5 w-5 text-indigo-400" />
                        Data Provenance & Lineage
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        End-to-end transparency of data flow and applied security models.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> Audit Ready
                    </span>
                  </div>

                  {/* Node Flow (Vertical/Horizontal hybrid) */}
                  <div className="relative py-8 px-4 flex flex-col items-center">
                    
                    {/* Source Node */}
                    <div className="w-full max-w-md bg-slate-950/80 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between z-10 relative shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                          <Database className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Source Connection</div>
                          <div className="text-sm font-bold text-white">Production Snowflake (VPC)</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-500">Schema: RAW_SALES</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">Zero-Copy Ingestion</div>
                      </div>
                    </div>

                    {/* Edge */}
                    <div className="w-0.5 h-12 bg-indigo-500/30 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-indigo-500/30 bg-slate-900 w-3 h-3 rounded-full" />
                    </div>

                    {/* RLS Policy Enforcement Node */}
                    <div className="w-full max-w-md bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between z-10 relative shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                          <ShieldCheck className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-0.5">Row-Level Security (RLS) Applied</div>
                          <div className="text-sm font-bold text-white">Department Cohort Filtering</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20">
                        <Eye className="h-3 w-3 mr-1" /> View Policy
                      </Button>
                    </div>

                    {/* Edge */}
                    <div className="w-0.5 h-12 bg-indigo-500/30 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-indigo-500/30 bg-slate-900 w-3 h-3 rounded-full" />
                    </div>

                    {/* Data Quality Transformation */}
                    <div className="w-full max-w-md bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between z-10 relative shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                          <Settings2 className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">Transformation Node</div>
                          <div className="text-sm font-bold text-white">Automated Cleaning & Profiling</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1"><CheckCircle2 className="h-3 w-3" /> Imputed</div>
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1 mt-0.5"><CheckCircle2 className="h-3 w-3" /> Types Coerced</div>
                      </div>
                    </div>

                    {/* Edge */}
                    <div className="w-0.5 h-12 bg-indigo-500/30 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-indigo-500/30 bg-slate-900 w-3 h-3 rounded-full" />
                    </div>

                    {/* Target Dataset Node */}
                    <div className="w-full max-w-md bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between z-10 relative shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                          <Layers className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Semantic Layer / Analysis Ready</div>
                          <div className="text-sm font-bold text-white truncate max-w-[200px]">{dataset?.name || "Dataset"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-500">{fullRows.length.toLocaleString()} rows verified</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Side: Security & Lineage Logs */}
                <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col gap-6">
                  {/* RLS Policy Viewer Card */}
                  <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
                    <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/40">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-rose-400" /> Active RLS Enforcement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          This dataset enforces Row-Level Security automatically based on the authenticated user context.
                        </p>
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                          <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap">
{"CREATE POLICY \\"user_department_only\\"\\nON \\"sales_data\\"\\nFOR SELECT\\nTO authenticated\\nUSING (\\n  department_id = (\\n    SELECT auth.jwt() ->> 'custom_department_id'\\n  )\\n);"}
                          </pre>
                        </div>
                        <div className="flex items-center gap-2 mt-2 bg-rose-500/10 border border-rose-500/20 p-2 rounded text-[10px] text-rose-200">
                          <ShieldCheck className="h-3 w-3 shrink-0 text-rose-400" />
                          <span>Violations blocked: 0 in last 30 days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Audit Log Card */}
                  <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
                    <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/40">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" /> Provenance Ledger
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-800">
                        <div className="p-3 text-[10px] flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                          <span className="text-slate-500 font-mono shrink-0 whitespace-nowrap">Today 10:45</span>
                          <div>
                            <span className="text-slate-300 font-bold block">Dataset Resynced</span>
                            <span className="text-slate-500 block">Agent automatically triggered incremental load.</span>
                          </div>
                        </div>
                        <div className="p-3 text-[10px] flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                          <span className="text-slate-500 font-mono shrink-0 whitespace-nowrap">Today 08:30</span>
                          <div>
                            <span className="text-slate-300 font-bold block">RLS Policy Audited</span>
                            <span className="text-slate-500 block">System validated policy signature match.</span>
                          </div>
                        </div>
                        <div className="p-3 text-[10px] flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                          <span className="text-slate-500 font-mono shrink-0 whitespace-nowrap">Yest. 18:22</span>
                          <div>
                            <span className="text-slate-300 font-bold block">Schema Validation</span>
                            <span className="text-slate-500 block">12 columns mapped. Zero PII detected.</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </motion.div>
          )}`;

code = code.replace(
  '{activeTab === "visualizer" && (',
  lineageComponent + '\n\n          {activeTab === "visualizer" && ('
);

fs.writeFileSync('src/pages/workspace/DatasetDetail.tsx', code);
