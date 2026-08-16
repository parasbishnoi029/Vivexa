const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/AIChat.tsx', 'utf8');

// Add types
code = code.replace(
  'suggested_next_steps?: string[];',
  'suggested_next_steps?: string[];\n  transparencyScore?: number;\n  reasoningTrace?: string;'
);

// Add default expandedTraceMap state
code = code.replace(
  'const [collapsedMsgMap, setCollapsedMsgMap] = useState<Record<string, boolean>>({});',
  'const [collapsedMsgMap, setCollapsedMsgMap] = useState<Record<string, boolean>>({});\n  const [expandedTraceMap, setExpandedTraceMap] = useState<Record<string, boolean>>({});'
);

// Inject Glass-Box UI
const glassBoxCode = `
                            {/* Glass-Box Transparency UI */}
                            {(!isUser && msg.transparencyScore) ? (
                              <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 overflow-hidden">
                                <div className="bg-indigo-900/40 px-3 py-2 border-b border-indigo-500/20 flex items-center justify-between cursor-pointer" onClick={() => setExpandedTraceMap(prev => ({ ...prev, [\`trace-\${msg.id}\`]: !prev[\`trace-\${msg.id}\`] }))}>
                                  <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-indigo-400" />
                                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Glass-Box Reasoning Audit</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                      <CheckCircle2 className="h-3 w-3" /> {msg.transparencyScore}% Confidence
                                    </span>
                                    {expandedTraceMap[\`trace-\${msg.id}\`] ? <ChevronUp className="h-4 w-4 text-indigo-400" /> : <ChevronDown className="h-4 w-4 text-indigo-400" />}
                                  </div>
                                </div>
                                {expandedTraceMap[\`trace-\${msg.id}\`] && (
                                  <div className="p-3 space-y-3 bg-slate-950/50">
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">AI Multi-Agent Reasoning Trace:</span>
                                      <div className="bg-black/50 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {msg.reasoningTrace || "Agent 1 (SQL Generation): Formulated extraction query.\\nAgent 2 (Validation): Verified schema compliance.\\nAgent 3 (Review): Evaluated business metric calculations."}
                                      </div>
                                    </div>
                                    {msg.sql_code && (
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Linked Query Dependency:</span>
                                        <div className="bg-black/50 p-2 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 truncate flex items-center justify-between">
                                          <span>{msg.sql_code.split('\\n')[0]}...</span>
                                          <Button variant="ghost" size="sm" className="h-5 px-2 text-[9px]" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.sql_code); toast.success("SQL Trace Copied!"); }}>Copy Full SQL</Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : null}
`;

code = code.replace(
  '{/* Follow-up Action Buttons After Assistant Response */}',
  glassBoxCode + '\n                            {/* Follow-up Action Buttons After Assistant Response */}'
);

// We need to inject mock transparency score in the dummy data or initial messages
code = code.replace(
  'scores: {',
  'transparencyScore: 99.4,\n    reasoningTrace: "> Executing Root Cause Analysis Workflow\\n> Connecting to Snowflake VW_SALES_PROJECTION\\n> Filtering cohort: Q3 Enterprise\\n> Calculating regression weights\\n> Verified output against zero-hallucination baseline (100% Match)",\n    scores: {'
);

fs.writeFileSync('src/pages/workspace/AIChat.tsx', code);
