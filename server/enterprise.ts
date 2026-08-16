import express from "express";
import { MicroVMPodFleetService } from "./services/MicroVMPodFleetService";
import { CRDTWriteAheadLogService } from "./services/CRDTWriteAheadLogService";
import { DataQualityAnomalyEngine } from "./services/DataQualityAnomalyEngine";
import { EnterpriseSSOService } from "./services/EnterpriseSSOService";
import { ObservabilityMonitorService } from "./services/ObservabilityMonitorService";
import { HybridQueryRouterService } from "./services/HybridQueryRouterService";

export const enterpriseRouter = express.Router();

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// ==========================================
// 1. MICROVM & CONTAINER POD FLEET APIS
// ==========================================

// GET /api/v1/enterprise/microvm/pods - List active MicroVM execution pods
enterpriseRouter.get("/microvm/pods", (req, res) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || "default_workspace";
    const pods = MicroVMPodFleetService.listPods(workspaceId);
    res.json(successResponse({ pods, totalCount: pods.length }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/microvm/provision - Dynamically scale/allocate isolated MicroVM
enterpriseRouter.post("/microvm/provision", async (req, res) => {
  try {
    const user = (req as any).user || { id: "demo-user", email: "user@vivexa.ai" };
    const { runtimeType, spec } = req.body;
    const pod = await MicroVMPodFleetService.provisionPod({
      userId: user.id,
      tenantId: "default_tenant",
      workspaceId: "default_workspace",
      runtimeType,
      spec
    });
    res.json(successResponse({ pod, message: `MicroVM pod '${pod.podName}' provisioned in ${pod.bootTimeMs}ms.` }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/microvm/execute - Run heavy script in dedicated MicroVM
enterpriseRouter.post("/microvm/execute", async (req, res) => {
  try {
    const user = (req as any).user || { id: "demo-user", email: "user@vivexa.ai" };
    const { code, podId, runtimeType } = req.body;

    if (!code) {
      return res.status(400).json(successResponse(null, { error: "No code provided for execution." }));
    }

    const result = await MicroVMPodFleetService.executeInPod({
      code,
      podId,
      userId: user.id,
      tenantId: "default_tenant",
      workspaceId: "default_workspace",
      runtimeType
    });

    res.json(successResponse(result));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/microvm/terminate - Terminate MicroVM pod
enterpriseRouter.post("/microvm/terminate", (req, res) => {
  try {
    const { podId } = req.body;
    if (!podId) return res.status(400).json(successResponse(null, { error: "Missing podId" }));
    const terminated = MicroVMPodFleetService.terminatePod(podId);
    res.json(successResponse({ success: terminated, podId }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// ==========================================
// 2. CRDT WRITE-AHEAD LOG & TIME-TRAVEL APIS
// ==========================================

// POST /api/v1/enterprise/crdt/wal/append - Append CRDT delta stream to WAL
enterpriseRouter.post("/crdt/wal/append", (req, res) => {
  try {
    const { roomId, clientId, operations } = req.body;
    if (!roomId || !Array.isArray(operations)) {
      return res.status(400).json(successResponse(null, { error: "Invalid WAL append payload." }));
    }

    const result = CRDTWriteAheadLogService.append({
      roomId,
      tenantId: "default_tenant",
      clientId: clientId || "anonymous",
      operations
    });

    res.json(successResponse(result));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// GET /api/v1/enterprise/crdt/wal/history - Retrieve revision history for time scrubber
enterpriseRouter.get("/crdt/wal/history", (req, res) => {
  try {
    const roomId = (req.query.roomId as string) || "vivexa-main-canvas";
    const history = CRDTWriteAheadLogService.getRevisionHistory(roomId);
    res.json(successResponse({ history, totalRevisions: history.length }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// GET /api/v1/enterprise/crdt/wal/time-travel - Reconstruct exact state at timestamp t
enterpriseRouter.get("/crdt/wal/time-travel", (req, res) => {
  try {
    const roomId = (req.query.roomId as string) || "vivexa-main-canvas";
    const targetTimestamp = Number(req.query.timestamp) || Date.now();
    const historical = CRDTWriteAheadLogService.getStateAtTime(roomId, targetTimestamp);
    res.json(successResponse(historical));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/crdt/wal/rollback - Rollback room to target timestamp
enterpriseRouter.post("/crdt/wal/rollback", (req, res) => {
  try {
    const user = (req as any).user || { id: "admin", email: "admin@vivexa.ai" };
    const { roomId, targetTimestamp } = req.body;
    if (!roomId || !targetTimestamp) {
      return res.status(400).json(successResponse(null, { error: "Missing roomId or targetTimestamp" }));
    }

    const result = CRDTWriteAheadLogService.rollbackTo(roomId, Number(targetTimestamp), user.email);
    res.json(successResponse(result));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// ==========================================
// 3. DATA QUALITY & ANOMALY ALERT ENGINE APIS
// ==========================================

// GET /api/v1/enterprise/quality/rules - List active data quality test rules
enterpriseRouter.get("/quality/rules", (req, res) => {
  try {
    const rules = DataQualityAnomalyEngine.listRules();
    res.json(successResponse({ rules }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/quality/scan - Run full data quality & anomaly detection scan
enterpriseRouter.post("/quality/scan", async (req, res) => {
  try {
    const { datasetName, sampleRows } = req.body;
    const profile = await DataQualityAnomalyEngine.scanDataset(datasetName || "fact_sales", sampleRows || []);
    res.json(successResponse({ profile }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// GET /api/v1/enterprise/quality/incidents - List detected anomaly incidents
enterpriseRouter.get("/quality/incidents", (req, res) => {
  try {
    const incidents = DataQualityAnomalyEngine.listIncidents();
    res.json(successResponse({ incidents }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/quality/alert/test - Trigger test webhook to Slack / PagerDuty
enterpriseRouter.post("/quality/alert/test", async (req, res) => {
  try {
    const { channel, incident } = req.body;
    const dispatch = await DataQualityAnomalyEngine.dispatchWebhookAlert({
      channel: channel || "slack",
      incident: incident || {
        ruleName: "Test Metric Anomaly Gate",
        datasetName: "dw.fact_sales",
        severity: "P1-High",
        metricValue: "4.2σ variance",
        thresholdValue: "3.0σ",
        recommendedAction: "Verify ETL partition ingestion"
      }
    });
    res.json(successResponse(dispatch));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// ==========================================
// 4. ENTERPRISE SSO, SCIM & GOVERNANCE APIS
// ==========================================

// GET /api/v1/enterprise/sso/config - Get SSO & SCIM configuration
enterpriseRouter.get("/sso/config", (req, res) => {
  try {
    const config = EnterpriseSSOService.getSSOConfig("default_tenant");
    res.json(successResponse({ config }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/sso/config - Update SAML & SCIM settings
enterpriseRouter.post("/sso/config", (req, res) => {
  try {
    const updated = EnterpriseSSOService.updateSSOConfig(req.body);
    res.json(successResponse({ config: updated, message: "SSO configuration updated successfully." }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// GET /api/v1/enterprise/sso/policies - List Column and Row Level Security policies
enterpriseRouter.get("/sso/policies", (req, res) => {
  try {
    const columnPolicies = EnterpriseSSOService.listColumnPolicies();
    const rowPolicies = EnterpriseSSOService.listRowPolicies();
    res.json(successResponse({ columnPolicies, rowPolicies }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/sso/mask-preview - Test CLS masking on sample rows
enterpriseRouter.post("/sso/mask-preview", (req, res) => {
  try {
    const { rows, role } = req.body;
    const masked = EnterpriseSSOService.maskRowData(rows || [], role || "Analyst");
    res.json(successResponse({ maskedRows: masked, roleApplied: role }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// ==========================================
// 5. OBSERVABILITY SENTINEL & BACKGROUND MONITOR
// ==========================================

// GET /api/v1/enterprise/observability/status - Get monitoring scheduler and active incident status
enterpriseRouter.get("/observability/status", (req, res) => {
  try {
    const status = ObservabilityMonitorService.getStatus();
    res.json(successResponse(status));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/observability/trigger - Trigger immediate statistical audit scan
enterpriseRouter.post("/observability/trigger", async (req, res) => {
  try {
    const report = await ObservabilityMonitorService.runStatisticalCheckPass();
    res.json(successResponse({ report, message: "Statistical audit scan completed." }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/observability/incidents/:id/resolve - Resolve incident
enterpriseRouter.post("/observability/incidents/:id/resolve", (req, res) => {
  try {
    const success = ObservabilityMonitorService.resolveIncident(req.params.id);
    res.json(successResponse({ success, message: "Incident marked as resolved." }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// POST /api/v1/enterprise/observability/config - Update monitoring thresholds and webhooks
enterpriseRouter.post("/observability/config", (req, res) => {
  try {
    ObservabilityMonitorService.updateDatasetConfig(req.body);
    res.json(successResponse({ message: "Monitoring configuration updated successfully." }));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});

// ==========================================
// 6. HYBRID ADAPTIVE QUERY ROUTER
// ==========================================

// POST /api/v1/enterprise/query-router/analyze - Analyze incoming SQL query and recommend routing target
enterpriseRouter.post("/query-router/analyze", (req, res) => {
  try {
    const { sql, datasetProfile, userContext } = req.body;
    if (!sql) {
      return res.status(400).json(successResponse(null, { error: "No SQL query provided." }));
    }
    const analysis = HybridQueryRouterService.analyzeAndRoute(sql, datasetProfile, userContext);
    res.json(successResponse(analysis));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message }));
  }
});
