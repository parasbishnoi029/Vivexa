import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TerminalSquare, Presentation, Network, Layers, 
  Cable, Activity, Terminal, Shield, CheckCircle 
} from "lucide-react";
import { checkQuotaStatus } from "@/lib/telemetry";

interface DashboardOperationsViewProps {
  stats: any;
  diagnosticsLogs: Array<{ time: string; msg: string; type: "info" | "success" | "warn" | "error" }>;
  isDiagnosing: boolean;
  onRunDiagnostics: () => void;
  onNavigate: (path: string) => void;
}

const DashboardOperationsViewComponent: React.FC<DashboardOperationsViewProps> = ({
  stats,
  diagnosticsLogs,
  isDiagnosing,
  onRunDiagnostics,
  onNavigate
}) => {
  const quota = checkQuotaStatus();

  return (
    <div className="space-y-6">
      {/* 1. Platform Ecosystem Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Platform Tooling Hub</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: "Logic Studio", desc: `${stats.notebooks || 0} Notebooks`, route: "/workspace/notebooks", icon: TerminalSquare, color: "text-purple-400" },
            { label: "AI Storytelling", desc: `${stats.reports || 0} Decks`, route: "/workspace/reports", icon: Presentation, color: "text-amber-400" },
            { label: "Agent Cockpit", desc: "Autonomous Swarms", route: "/workspace/agents", icon: Network, color: "text-indigo-400" },
            { label: "Semantic Layer", desc: "Unified Metrics", route: "/workspace/semantic", icon: Layers, color: "text-cyan-400" },
            { label: "Connectors", desc: "50+ Integrations", route: "/workspace/connectors", icon: Cable, color: "text-emerald-400" },
            { label: "AutoML Engine", desc: "Predictive Models", route: "/workspace/predictions", icon: Activity, color: "text-rose-400" },
          ].map((shortcut, i) => (
            <Card 
              key={i}
              onClick={() => onNavigate(shortcut.route)}
              className="bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer p-4 rounded-2xl group text-center space-y-2 backdrop-blur-xl"
            >
              <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 w-fit mx-auto group-hover:scale-110 transition-transform ${shortcut.color}`}>
                <shortcut.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{shortcut.label}</div>
                <div className="text-[10px] text-slate-500">{shortcut.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 2. Cluster Logs & Security Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 bg-slate-900/40 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cluster Audit Log & Realtime Telemetry</span>
            </div>
            <Button 
              onClick={onRunDiagnostics}
              disabled={isDiagnosing}
              size="sm"
              className="h-8 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
            >
              {isDiagnosing ? "Diagnosing..." : "Run System Diagnostic"}
            </Button>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[11px] space-y-2">
            {diagnosticsLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-600 font-bold">[{log.time}]</span>
                <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-slate-300'}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4 bg-slate-900/40 border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest">
              <Shield className="h-4 w-4" /> Security & Quotas
            </div>
            <h4 className="text-base font-black text-white">Monthly AI Operations</h4>
            <p className="text-xs text-slate-400">Tenant-isolated compute instances with automated failover.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className="text-slate-400">QUOTA UTILIZATION</span>
              <span className="text-indigo-400">{Math.round(quota.percentage)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                style={{ width: `${Math.min(100, Math.max(2, quota.percentage))}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
              />
            </div>
          </div>

          <Button 
            onClick={() => onNavigate('/workspace/billing')}
            className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider"
          >
            Manage Enterprise Plan
          </Button>
        </Card>
      </div>
    </div>
  );
};

export const DashboardOperationsView = React.memo(DashboardOperationsViewComponent);
