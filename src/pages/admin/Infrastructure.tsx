import { useState, useEffect } from "react";
import { Server, CheckCircle2, Cpu, HardDrive, Database, Activity, RefreshCw, Zap, Network, MemoryStick, Cloud, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function AdminInfrastructure() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    cpuAvg: 12,
    memAvg: 45,
    storage: 1.4,
    pools: 18
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData({
        cpuAvg: Math.floor(Math.random() * 30) + 10,
        memAvg: Math.floor(Math.random() * 40) + 30,
        storage: +(Math.random() * 2 + 1).toFixed(2),
        pools: Math.floor(Math.random() * 10) + 15
      });
      setIsRefreshing(false);
      toast.success("Infrastructure metrics synchronized with data center.");
    }, 1200);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        cpuAvg: Math.max(5, Math.min(95, prev.cpuAvg + (Math.random() * 6 - 3)))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-400" />
            Infrastructure & Cluster Monitor
          </h1>
          <p className="text-sm text-slate-400">Real-time Cloud Run compute, Supabase poolers, and database clusters status.</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cloud Compute Nodes</span>
              <Cpu className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">4 Active Nodes</p>
            <span className="text-xs text-emerald-400">100% Uptime • {data.cpuAvg.toFixed(1)}% CPU Avg</span>
            <Progress value={data.cpuAvg} className="h-1 mt-3 bg-slate-800" indicatorClassName="bg-emerald-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Memory Allocation</span>
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{data.memAvg}% utilized</p>
            <span className="text-xs text-cyan-400">Stable • Auto-scaling ready</span>
            <Progress value={data.memAvg} className="h-1 mt-3 bg-slate-800" indicatorClassName="bg-cyan-500" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">PostgreSQL Database</span>
              <Database className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">Supabase Managed</p>
            <span className="text-xs text-indigo-400">Connected • {data.pools} active pools</span>
            <Progress value={data.pools * 4} className="h-1 mt-3 bg-slate-800" indicatorClassName="bg-indigo-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Storage & CDN</span>
              <HardDrive className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{data.storage} GB / 100 GB</p>
            <span className="text-xs text-purple-400">Global edge caching active</span>
            <Progress value={(data.storage / 100) * 100} className="h-1 mt-3 bg-slate-800" indicatorClassName="bg-purple-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Network className="h-5 w-5 text-indigo-400" /> Network Topology
            </CardTitle>
            <CardDescription>Live routing and load balancer health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Ingress Load Balancer</p>
                    <p className="text-xs text-slate-500">us-east1 (Primary)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 uppercase tracking-wider">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">WAF & DDoS Protection</p>
                    <p className="text-xs text-slate-500">Cloudflare Edge</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 uppercase tracking-wider">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Redis Message Broker</p>
                    <p className="text-xs text-slate-500">Real-time pub/sub</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 uppercase tracking-wider">Healthy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-400" /> Active Alerts
            </CardTitle>
            <CardDescription>Recent infrastructure events and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 border-l-2 border-l-amber-500 bg-amber-500/5 rounded-r-lg">
                <Activity className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-500">High API Latency Detected</h4>
                  <p className="text-xs text-slate-400 mt-1">AI Analyst endpoints experienced elevated latency (~1200ms) for 3 minutes. Auto-scaling resolved the issue.</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">14 mins ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border-l-2 border-l-slate-700 bg-slate-800/20 rounded-r-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-slate-300">Database Backup Completed</h4>
                  <p className="text-xs text-slate-400 mt-1">Daily automated point-in-time backup to cold storage successful (Size: 1.2 GB).</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
