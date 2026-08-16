const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/AIChat.tsx', 'utf8');

const updatedBusinessImpact = `{msg.business_impact && (
                              <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                                <h4 className="text-xs font-bold text-indigo-300 flex items-center justify-between uppercase tracking-wider">
                                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-indigo-400" /> Executive Business Decision Brief</span>
                                  <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Audit Ready</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-indigo-500/20">
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Statistical Evidence</span>
                                    <p className="text-slate-200">{msg.business_impact.evidence}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Recommended Action & ROI</span>
                                    <p className="text-emerald-400 font-bold">{msg.business_impact.recommended_action} <span className="text-emerald-500/70 block font-normal">{msg.business_impact.expected_roi}</span></p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Agent Assumptions</span>
                                    <p className="text-slate-300 italic">{msg.business_impact.assumptions}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-400" /> Risk Assessment</span>
                                    <p className="text-amber-200/80">{msg.business_impact.risk_assessment}</p>
                                  </div>
                                </div>
                              </div>
                            )}`;

// Remove the old block
const oldRegex = /{msg\.business_impact && \([\s\S]*?<\/[a-z]+>[\s]*\)}/g;
code = code.replace(oldRegex, (match) => {
    // Basic verification it's the right block
    if(match.includes('Executive Business Decision Brief')) {
        return updatedBusinessImpact;
    }
    return match;
});

if (!code.includes('ShieldCheck')) {
  code = code.replace('AlertTriangle,', 'AlertTriangle, ShieldCheck, HelpCircle,');
}

fs.writeFileSync('src/pages/workspace/AIChat.tsx', code);
