import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Database, Cloud, Zap, HardDrive, Clock, Activity, Settings, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

export default function AdminSystem() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    dbLatency: "12ms",
    cpuUsage: 34,
    memUsage: 62,
    activeConnections: 142,
    uptime: "99.99%",
    version: "v2.4.1-stable"
  });

  const [dbStatus, setDbStatus] = useState("Operational");

  const checkDb = async () => {
    try {
      const start = performance.now();
      await supabase.from("users").select("id").limit(1);
      const end = performance.now();
      setMetrics(prev => ({ ...prev, dbLatency: Math.round(end - start) + "ms" }));
      setDbStatus("Operational");
    } catch {
      setDbStatus("Degraded");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkDb();
    setTimeout(() => {
      // In a real environment, we would fetch hardware stats here.
      setMetrics(prev => ({
        ...prev,
        cpuUsage: 2,
        memUsage: 45,
        activeConnections: 5,
      }));
      setIsRefreshing(false);
    }, 800);
  };

  useEffect(() => {
    checkDb();
    const interval = setInterval(handleRefresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const renderStatusCard = (label: string, value: string | number, icon: any, status: 'good' | 'warn' | 'error' = 'good') => {
    const statusColor = status === 'good' ? 'text-emerald-500' : status === 'warn' ? 'text-amber-500' : 'text-rose-500';
    const StatusIcon = status === 'good' ? CheckCircle2 : status === 'warn' ? AlertTriangle : AlertCircle;

    return (
      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">{label}</CardTitle>
          <div className="p-2 bg-slate-800/50 rounded-lg">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{value}</div>
          <p className={`text-xs font-medium flex items-center gap-1 mt-1 ${statusColor}`}>
            <StatusIcon className="h-3 w-3" />
            {status === 'good' ? 'Healthy' : status === 'warn' ? 'Warning' : 'Critical'}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-400" />
            System Health & Status
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time monitoring of platform infrastructure and microservices.</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatusCard("API Gateway", "Operational", <Server className="h-5 w-5 text-indigo-400" />)}
        {renderStatusCard("Supabase Database", dbStatus, <Database className="h-5 w-5 text-cyan-400" />, dbStatus === "Operational" ? "good" : "error")}
        {renderStatusCard("Gemini AI Engine", "Operational", <Zap className="h-5 w-5 text-amber-400" />)}
        {renderStatusCard("Object Storage", "Operational", <HardDrive className="h-5 w-5 text-emerald-400" />)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Resource Utilization</CardTitle>
            <CardDescription>Current hardware allocation metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">CPU Usage</span>
                <span className="text-slate-400">{metrics.cpuUsage}%</span>
              </div>
              <Progress value={metrics.cpuUsage} className="h-2 bg-slate-800" indicatorClassName={metrics.cpuUsage > 80 ? "bg-rose-500" : "bg-indigo-500"} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Memory Usage</span>
                <span className="text-slate-400">{metrics.memUsage}% (19.8 GB / 32 GB)</span>
              </div>
              <Progress value={metrics.memUsage} className="h-2 bg-slate-800" indicatorClassName={metrics.memUsage > 85 ? "bg-rose-500" : "bg-emerald-500"} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Storage Capacity</span>
                <span className="text-slate-400">42% (420 GB / 1 TB)</span>
              </div>
              <Progress value={42} className="h-2 bg-slate-800" indicatorClassName="bg-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Network & Performance</CardTitle>
            <CardDescription>Real-time network statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Database Latency</p>
                <p className="text-2xl font-bold text-white">{metrics.dbLatency}</p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Active Connections</p>
                <p className="text-2xl font-bold text-white">{metrics.activeConnections}</p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">System Uptime</p>
                <p className="text-2xl font-bold text-white">{metrics.uptime}</p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">App Version</p>
                <p className="text-2xl font-bold text-white">{metrics.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
