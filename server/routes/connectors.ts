import { Router } from "express";
import { dataLakeConnectorEngine } from "../connectors/dataLakeConnectors";

export const connectorsRouter = Router();

// Get all registered data lake connectors
connectorsRouter.get("/", (req, res) => {
  try {
    const connectors = dataLakeConnectorEngine.getConnectors();
    res.json({ success: true, count: connectors.length, connectors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register or update a connector configuration
connectorsRouter.post("/", (req, res) => {
  try {
    const { id, type, name, credentials, isZeroCopyEnabled } = req.body;
    if (!type || !name || !credentials) {
      return res.status(400).json({ success: false, error: "Missing required connector configuration fields." });
    }

    const connId = id || `conn-${type.toLowerCase()}-${Date.now()}`;
    const newConfig = dataLakeConnectorEngine.registerConnector({
      id: connId,
      type,
      name,
      credentials,
      isZeroCopyEnabled: isZeroCopyEnabled ?? true,
      status: "CONNECTED",
      lastTestedAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, connector: newConfig });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test connection to a specific data lake
connectorsRouter.post("/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dataLakeConnectorEngine.testConnection(id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute zero-copy query on a data lake connector
connectorsRouter.post("/:id/query", async (req, res) => {
  try {
    const { id } = req.params;
    const { sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, error: "A valid SQL query string is required." });
    }

    const result = await dataLakeConnectorEngine.executeZeroCopyQuery(id, sql);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
