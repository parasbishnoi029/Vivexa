import express from "express";
import { SCIMProvisioningService } from "./services/SCIMProvisioningService";

export const scimRouter = express.Router();

// Middleware: Bearer token validation for SCIM 2.0 requests
const requireSCIMAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  // If internal management test route, allow session auth
  if (req.path.startsWith("/admin/") || req.path.startsWith("/test-sync") || req.path.startsWith("/audit-logs") || req.path.startsWith("/config")) {
    return next();
  }

  if (!SCIMProvisioningService.validateToken(authHeader)) {
    return res.status(401).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: "Invalid or missing SCIM 2.0 Bearer Authorization token.",
      status: "401"
    });
  }
  next();
};

scimRouter.use(requireSCIMAuth);

// ==========================================
// SCIM 2.0 CORE PROTOCOL ENDPOINTS (RFC 7644)
// ==========================================

// GET /scim/v2/ServiceProviderConfig
scimRouter.get("/ServiceProviderConfig", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  res.json(SCIMProvisioningService.getServiceProviderConfig());
});

// GET /scim/v2/ResourceTypes
scimRouter.get("/ResourceTypes", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  res.json(SCIMProvisioningService.getResourceTypes());
});

// GET /scim/v2/Schemas
scimRouter.get("/Schemas", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  res.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: 2,
    Resources: [
      {
        id: "urn:ietf:params:scim:schemas:core:2.0:User",
        name: "User",
        description: "Core User Schema"
      },
      {
        id: "urn:ietf:params:scim:schemas:core:2.0:Group",
        name: "Group",
        description: "Core Group Schema"
      }
    ]
  });
});

// GET /scim/v2/Users - List & Query Users
scimRouter.get("/Users", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  const filter = req.query.filter as string;
  const startIndex = req.query.startIndex ? parseInt(req.query.startIndex as string, 10) : 1;
  const count = req.query.count ? parseInt(req.query.count as string, 10) : 20;

  const result = SCIMProvisioningService.getUsers({ filter, startIndex, count });
  res.json(result);
});

// GET /scim/v2/Users/:id - Get Single User
scimRouter.get("/Users/:id", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  const user = SCIMProvisioningService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: `User with id ${req.params.id} not found`,
      status: "404"
    });
  }
  res.json(user);
});

// POST /scim/v2/Users - Provision New User
scimRouter.post("/Users", async (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  try {
    const idpHeader = (req.headers["x-idp-provider"] as string) || "Okta";
    const user = await SCIMProvisioningService.createUser(req.body, idpHeader as any);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: err.message || "Failed to provision user",
      status: "500"
    });
  }
});

// PUT /scim/v2/Users/:id - Replace User
scimRouter.put("/Users/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  try {
    const idpHeader = (req.headers["x-idp-provider"] as string) || "Okta";
    const updated = await SCIMProvisioningService.replaceUser(req.params.id, req.body, idpHeader as any);
    if (!updated) {
      return res.status(404).json({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: `User ${req.params.id} not found`,
        status: "404"
      });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: err.message || "Failed to replace user",
      status: "500"
    });
  }
});

// PATCH /scim/v2/Users/:id - Update User Attributes / Deactivate
scimRouter.patch("/Users/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  try {
    const operations = req.body.Operations || [];
    const idpHeader = (req.headers["x-idp-provider"] as string) || "Okta";
    const patched = await SCIMProvisioningService.patchUser(req.params.id, operations, idpHeader as any);
    if (!patched) {
      return res.status(404).json({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: `User ${req.params.id} not found`,
        status: "404"
      });
    }
    res.json(patched);
  } catch (err: any) {
    res.status(500).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: err.message || "Failed to patch user",
      status: "500"
    });
  }
});

// DELETE /scim/v2/Users/:id - De-provision / Delete User
scimRouter.delete("/Users/:id", async (req, res) => {
  try {
    const idpHeader = (req.headers["x-idp-provider"] as string) || "Okta";
    const deleted = await SCIMProvisioningService.deleteUser(req.params.id, idpHeader as any);
    if (!deleted) {
      res.setHeader("Content-Type", "application/scim+json");
      return res.status(404).json({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: `User ${req.params.id} not found`,
        status: "404"
      });
    }
    res.status(204).send();
  } catch (err: any) {
    res.setHeader("Content-Type", "application/scim+json");
    res.status(500).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: err.message || "Failed to delete user",
      status: "500"
    });
  }
});

// GET /scim/v2/Groups - List Groups
scimRouter.get("/Groups", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  const filter = req.query.filter as string;
  const startIndex = req.query.startIndex ? parseInt(req.query.startIndex as string, 10) : 1;
  const count = req.query.count ? parseInt(req.query.count as string, 10) : 20;

  res.json(SCIMProvisioningService.getGroups({ filter, startIndex, count }));
});

// GET /scim/v2/Groups/:id
scimRouter.get("/Groups/:id", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  const group = SCIMProvisioningService.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: `Group ${req.params.id} not found`,
      status: "404"
    });
  }
  res.json(group);
});

// POST /scim/v2/Groups
scimRouter.post("/Groups", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  const group = SCIMProvisioningService.createGroup(req.body);
  res.status(201).json(group);
});

// PATCH /scim/v2/Groups/:id
scimRouter.patch("/Groups/:id", (req, res) => {
  res.setHeader("Content-Type", "application/scim+json");
  const operations = req.body.Operations || [];
  const updated = SCIMProvisioningService.patchGroup(req.params.id, operations);
  if (!updated) {
    return res.status(404).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: `Group ${req.params.id} not found`,
      status: "404"
    });
  }
  res.json(updated);
});

// ==========================================
// SCIM ADMIN & TESTING CONTROL PLANE
// ==========================================

// POST /api/v1/scim/test-sync - Simulate an Okta / Azure AD synchronization push
scimRouter.post("/test-sync", async (req, res) => {
  const { provider, action, userPayload } = req.body;
  const idp = provider === "Azure_AD" ? "Azure_AD" : "Okta";

  try {
    if (action === "provision_user") {
      const user = await SCIMProvisioningService.createUser({
        userName: userPayload?.email || `user_${Date.now()}@enterprise-corp.com`,
        displayName: userPayload?.name || "Simulated Enterprise User",
        name: {
          givenName: userPayload?.givenName || "Enterprise",
          familyName: userPayload?.familyName || "Specialist"
        },
        emails: [{ value: userPayload?.email || `user_${Date.now()}@enterprise-corp.com`, type: "work", primary: true }],
        department: userPayload?.department || "Engineering",
        title: userPayload?.title || "Senior Data Architect",
        groups: userPayload?.groups || [{ display: "Data-Engineers" }]
      }, idp);
      return res.json({ success: true, message: `Successfully simulated SCIM user provisioning for ${user.userName}`, user });
    }

    if (action === "deactivate_user") {
      const usersList = SCIMProvisioningService.getUsers({ count: 1 });
      const targetUser = usersList.Resources[0];
      if (targetUser) {
        await SCIMProvisioningService.patchUser(targetUser.id, [{ op: "replace", path: "active", value: false }], idp);
        return res.json({ success: true, message: `Successfully deactivated user ${targetUser.userName} via SCIM 2.0` });
      }
    }

    if (action === "sync_groups") {
      SCIMProvisioningService.createGroup({
        displayName: userPayload?.groupName || `Dynamic-Security-Group-${Math.floor(Math.random()*100)}`,
        members: []
      });
      return res.json({ success: true, message: "Synchronized IdP security groups and updated RBAC permissions" });
    }

    return res.json({ success: true, message: "Simulated SCIM health check completed successfully." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/scim/audit-logs
scimRouter.get("/audit-logs", (req, res) => {
  res.json({
    success: true,
    data: SCIMProvisioningService.getAuditLogs()
  });
});

// POST /api/v1/scim/tokens/rotate
scimRouter.post("/tokens/rotate", (req, res) => {
  const token = SCIMProvisioningService.generateNewToken();
  res.json({
    success: true,
    data: {
      token,
      scimBaseUrl: `${req.protocol}://${req.get("host")}/scim/v2`,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
    }
  });
});

// GET /api/v1/scim/config
scimRouter.get("/config", (req, res) => {
  res.json({
    success: true,
    data: {
      scimBaseUrl: `${req.protocol}://${req.get("host")}/scim/v2`,
      roleMappings: SCIMProvisioningService.getRoleMappings(),
      activeUsersCount: SCIMProvisioningService.getUsers({ count: 100 }).totalResults,
      activeGroupsCount: SCIMProvisioningService.getGroups({ count: 100 }).totalResults
    }
  });
});

// POST /api/v1/scim/config
scimRouter.post("/config", (req, res) => {
  const { roleMappings } = req.body;
  if (Array.isArray(roleMappings)) {
    SCIMProvisioningService.updateRoleMappings(roleMappings);
  }
  res.json({
    success: true,
    data: {
      roleMappings: SCIMProvisioningService.getRoleMappings()
    }
  });
});
