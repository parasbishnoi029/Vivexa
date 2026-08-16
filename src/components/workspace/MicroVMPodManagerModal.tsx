import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu, Server, Zap, RefreshCw, X, Play, Terminal, ShieldCheck,
  CheckCircle2, AlertTriangle, HardDrive, Activity, Trash2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MicroVMPodManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MicroVMPodManagerModal({ isOpen, onClose }: MicroVMPodManagerModalProps) {
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [selectedRuntime, setSelectedRuntime] = useState<string>("gVisor-Sandbox");
  const [testCode, setTestCode] = useState<string>(
    `import numpy as np\nimport scipy.stats as stats\n\n# Compute synthetic probability density in isolated MicroVM\ndata = np.random.normal(loc=50, scale=10, size=10000)\nmean, std = np.mean(data), np.std(data)\nprint(f"MicroVM Computation Success: Mean={mean:.4f}, Std={std:.4f}")`
  );
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchPods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/enterprise/microvm/pods");
      const json = await res.json();
      if (json?.data?.pods) {
        setPods(json.data.pods);
      }
    } catch (e) {
      console.warn("Failed to fetch MicroVM pods:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPods();
      const interval = setInterval(fetchPods, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const provisionNewPod = async () => {
    setIsProvisioning(true);
    try {
      const res = await fetch("/api/v1/enterprise/microvm/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runtimeType: selectedRuntime,
          spec: {
            vCpu: selectedRuntime === "Firecracker-MicroVM" ? 8 : 4,
            memoryMb: selectedRuntime === "Firecracker-MicroVM" ? 16384 : 8192,
            gpuType: selectedRuntime === "Firecracker-MicroVM" ? "NVIDIA-T4" : "None"
          }
        })
      });
      const json = await res.json();
      if (json?.data?.pod) {
        toast.success(`MicroVM Pod provisioned (${json.data.pod.bootTimeMs}ms boot time)`, {
          description: `Allocated ${json.data.pod.spec.vCpu} vCPU, ${json.data.pod.spec.memoryMb / 1024}GB RAM`
        });
        fetchPods();
      }
    } catch (e) {
      toast.error("Failed to provision MicroVM pod");
    } finally {
      setIsProvisioning(false);
    }
  };

  const executeCodeInPod = async (podId?: string) => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const res = await fetch("/api/v1/enterprise/microvm/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: testCode,
          podId,
          runtimeType: selectedRuntime
        })
      });
      const json = await res.json();
      if (json?.data) {
        setExecutionResult(json.data);
        if (json.data.success) {
          toast.success(`Executed in ${json.data.executionDurationMs}ms (${json.data.securityVerdict})`);
        } else {
          toast.error("Execution failed / Sandbox violation");
        }
      }
    } catch (e) {
      toast.error("Failed to execute in MicroVM pod");
    } finally {
      setIsExecuting(false);
    }
  };

  const terminatePod = async (podId: string) => {
    try {
      const res = await fetch("/api/v1/enterprise/microvm/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ podId })
      });
      const json = await res.json();
      if (json?.data?.success) {
        toast.success(`Pod ${podId} terminated & memory reclaimed`);
        fetchPods();
      }
    } catch (e) {
      toast.error("Failed to terminate pod");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>MicroVM & Container Pod Fleet</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    gVisor • Firecracker • E2B
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Dedicated ephemeral sandbox pods for untrusted Python, PyTorch, and heavy ML jobs.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Provisioning Control */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Runtime Architecture:</span>
              <select
                value={selectedRuntime}
                onChange={(e) => setSelectedRuntime(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="gVisor-Sandbox">gVisor MicroVM (4 vCPU, 8GB RAM) - Fast Boot</option>
                <option value="Firecracker-MicroVM">AWS Firecracker MicroVM (8 vCPU, 16GB RAM + NVIDIA T4 GPU)</option>
                <option value="E2B-Container-Pod">E2B Ephemeral Container (2 vCPU, 4GB RAM)</option>
              </select>
            </div>

            <Button
              onClick={provisionNewPod}
              disabled={isProvisioning}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isProvisioning ? "Booting Pod..." : "Provision Pod"}
            </Button>
          </div>

          {/* Active Fleet Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Runtimes ({pods.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pods.map((pod) => (
                <div
                  key={pod.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200 truncate max-w-[160px]">
                      {pod.podName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pod.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="text-slate-300">{pod.runtimeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resources:</span>
                      <span className="text-slate-300">{pod.spec.vCpu} vCPU • {pod.spec.memoryMb / 1024}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GPU:</span>
                      <span className="text-slate-300">{pod.spec.gpuType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU Load:</span>
                      <span className="text-slate-300">{pod.metrics.cpuUsagePercent}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Boot: {pod.bootTimeMs}ms</span>
                    {pod.userId !== "system" && (
                      <button
                        onClick={() => terminatePod(pod.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 opacity-80 hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Terminate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Sandbox Execution */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Isolated MicroVM Execution Test</span>
              </h4>
              <Button
                size="sm"
                onClick={() => executeCodeInPod()}
                disabled={isExecuting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                {isExecuting ? "Executing in Pod..." : "Run in Sandbox Pod"}
              </Button>
            </div>

            <textarea
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />

            {executionResult && (
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                  <span>Runtime: {executionResult.runtimeType}</span>
                  <span className="text-emerald-400">Duration: {executionResult.executionDurationMs}ms</span>
                  <span>Verdict: {executionResult.securityVerdict}</span>
                </div>
                <pre className="text-slate-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {executionResult.stdout || executionResult.stderr || executionResult.output}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
