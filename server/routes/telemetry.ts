import { Router } from "express";
import os from "os";

export const telemetryRouter = Router();

// In-memory telemetry log buffer for enterprise observability
const telemetryBuffer: Array<{
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  service: string;
  message: string;
  latencyMs?: number;
  cpuUsagePct?: number;
  memoryUsageMb?: number;
}> = [
  { id: "log-101", timestamp: new Date(Date.now() - 120000).toISOString(), level: "INFO", service: "lakehouse-query-router", message: "Zero-copy metadata projection initialized", latencyMs: 14, cpuUsagePct: 18.4, memoryUsageMb: 2450 },
  { id: "log-102", timestamp: new Date(Date.now() - 90000).toISOString(), level: "INFO", service: "crdt-sync-engine", message: "Active Yjs document synced across 12 peer nodes", latencyMs: 8, cpuUsagePct: 12.1, memoryUsageMb: 1820 },
  { id: "log-103", timestamp: new Date(Date.now() - 45000).toISOString(), level: "INFO", service: "microvm-pod-manager", message: "Firecracker MicroVM pod 'pod-ml-infer-04' health check passed", latencyMs: 5, cpuUsagePct: 22.0, memoryUsageMb: 3100 },
];

// Get live system metrics & telemetry stream
telemetryRouter.get("/metrics", (req, res) => {
  const uptimeSec = process.uptime();
  const mem = process.memoryUsage();
  const freeMemMb = Math.round(os.freemem() / 1024 / 1024);
  const totalMemMb = Math.round(os.totalmem() / 1024 / 1024);
  const usedMemMb = totalMemMb - freeMemMb;
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length || 1;
  const cpuLoadPct = Math.min(100, Math.max(1, parseFloat(((loadAvg[0] / cpuCount) * 100).toFixed(2))));

  res.json({
    success: true,
    metrics: {
      uptimeSeconds: Math.floor(uptimeSec),
      systemCpuLoadPct: cpuLoadPct,
      systemMemory: {
        totalMemMb,
        usedMemMb,
        freeMemMb
      },
      memoryUsage: {
        heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(2),
        rssMb: (mem.rss / 1024 / 1024).toFixed(2),
      },
      activeWebsocketPeers: 1,
      zeroCopyBytesSavedPct: 98.4,
      timestamp: new Date().toISOString()
    }
  });
});

// Get system telemetry logs
telemetryRouter.get("/logs", (req, res) => {
  res.json({
    success: true,
    count: telemetryBuffer.length,
    logs: telemetryBuffer
  });
});

// Log a new system event
telemetryRouter.post("/logs", (req, res) => {
  const { level, service, message, latencyMs } = req.body;
  if (!service || !message) {
    return res.status(400).json({ success: false, error: "Missing required telemetry log fields: service, message" });
  }

  const mem = process.memoryUsage();
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: level || "INFO",
    service,
    message,
    latencyMs: latencyMs || 12,
    cpuUsagePct: parseFloat((os.loadavg()[0] * 10).toFixed(1)),
    memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024)
  };

  telemetryBuffer.unshift(newLog);
  if (telemetryBuffer.length > 200) telemetryBuffer.pop();

  res.status(201).json({ success: true, log: newLog });
});

// Get MicroVM pod status list
telemetryRouter.get("/microvm/pods", (req, res) => {
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  res.json({
    success: true,
    pods: [
      { id: "pod-core-engine-01", status: "RUNNING", cpu: "12%", memory: `${heapUsedMb} MB / 4096 MB`, vcpus: 4, ip: "10.244.0.12", uptime: `${Math.floor(process.uptime() / 3600)}h` },
      { id: "pod-ml-infer-04", status: "RUNNING", cpu: "24%", memory: "512 MB / 8192 MB", vcpus: 8, ip: "10.244.0.18", uptime: "24h" },
      { id: "pod-crdt-relay-02", status: "RUNNING", cpu: "6%", memory: "128 MB / 2048 MB", vcpus: 2, ip: "10.244.0.22", uptime: "72h" }
    ]
  });
});

