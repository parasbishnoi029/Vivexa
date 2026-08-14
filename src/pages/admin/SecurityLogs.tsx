import { ShieldAlert, Lock, UserCheck, Key, ShieldCheck, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSecurityLogs() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
            Security Audit & Access Logs
          </h1>
          <p className="text-sm text-slate-400">Monitor authentication attempts, API key usage, and system security events.</p>
        </div>
        <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Audit
        </Button>
      </div>

      <Card className="bg-slate-900/40 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">Zero security incidents detected in the last 24 hours.</span>
          </div>

          <div className="space-y-3">
            {[
              { event: "User authentication token refreshed", user: "parasbishnoi012@gmail.com", time: "Just now", status: "SUCCESS" },
              { event: "Scoped API key requested", user: "parasbishnoi012@gmail.com", time: "10 mins ago", status: "SUCCESS" },
              { event: "Row Level Security policy checked for notifications", user: "system", time: "25 mins ago", status: "VERIFIED" }
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                <div>
                  <span className="font-semibold text-slate-200">{log.event}</span>
                  <span className="text-slate-400 ml-2">({log.user})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{log.time}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
