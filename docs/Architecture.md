# Vivexa Enterprise System Architecture & Documentation

This document describes the architectural framework, database layout, API communication patterns, and deployment configurations for **Vivexa**, an open-source Decision Intelligence Platform.

---

## 1. System Architecture Diagram

The system uses a highly decoupled full-stack architecture. Client-side state transitions are served statically, while computing workloads, database sessions, and AI model interactions are mediated securely on the backend.

```
                             +-----------------------------------+
                             |           Client Layer            |
                             |  React 19 + Vite + Tailwind CSS   |
                             +-----------------------------------+
                                               |
                                     (HTTPS / JSON Payload)
                                               v
                             +-----------------------------------+
                             |     Reverse Proxy (Nginx)         |
                             |   Ingress Routing & SSL Offload   |
                             +-----------------------------------+
                                               |
                                               v
                             +-----------------------------------+
                             |        Backend API Server         |
                             |     Node.js Express (TypeScript)  |
                             +-----------------------------------+
                                  /            |             \
                 (Internal Router)       (REST Clients)     (SQL Queries via drizzle/pg)
                 /                             |             \
                v                              v              v
+-------------------------------+ +-------------------------+ +------------------------+
|       Google Gemini API       | |      Supabase Auth      | |  PostgreSQL Database   |
|   Domain-Aware AI Analysis,   | |   JWT Cryptographic Token| | Schemas: Users, Logs,  |
|   RAG, Multi-Step Advisory    | |   Verification Engine   | | Projects, Datasets     |
+-------------------------------+ +-------------------------+ +------------------------+
```

---

## 2. Database ER Diagram (Entity-Relationship)

The relational schema maps out entities controlling secure workspaces, role clearances, project datasets, and cryptographic developer keys.

```
 +------------------------+             +-------------------------+
 |         users          |             |        projects         |
 +------------------------+             +-------------------------+
 | id (PK)      : uuid    | <---------+ | id (PK)       : uuid    |
 | email        : varchar |             | user_id (FK)  : uuid    |
 | role         : varchar |             | name          : varchar |
 | created_at   : timestmp|             | description   : text    |
 +------------------------+             +-------------------------+
             |                                       |
             | (1:N)                                 | (1:N)
             v                                       v
 +------------------------+             +-------------------------+
 |      team_members      |             |        datasets         |
 +------------------------+             +-------------------------+
 | id (PK)      : uuid    |             | id (PK)       : uuid    |
 | user_id (FK) : uuid    |             | project_id(FK): uuid    |
 | name         : varchar |             | filename      : varchar |
 | seat_type    : varchar |             | file_size     : bigint  |
 | role         : varchar |             | record_count  : integer |
 +------------------------+             +-------------------------+
             |                                       |
             | (1:N)                                 | (1:N)
             v                                       v
 +------------------------+             +-------------------------+
 |       audit_logs       |             |        api_keys         |
 +------------------------+             +-------------------------+
 | id (PK)      : uuid    |             | id (PK)       : uuid    |
 | user_id (FK) : uuid    |             | user_id (FK)  : uuid    |
 | action       : varchar |             | key_prefix    : varchar |
 | resource     : varchar |             | scopes        : text[]  |
 | timestamp    : timestmp|             | expires_at    : timestmp|
 +------------------------+             +-------------------------+
```

---

## 3. API Flow Diagram

This diagram shows how client requests flow through verification and AI inference middleware before logging an immutable event and returning results.

```
[Client App]                  [Express Router]               [AI / Db Controller]             [Gemini / DB]
     |                               |                                |                              |
     |--- 1. POST /api/v1/analyze -->|                                |                              |
     |    (Payload + Auth Bearer)    |                                |                              |
     |                               |--- 2. Validate JWT Session --->|                              |
     |                               |       (Verify via Supabase)    |                              |
     |                               |<-- 3. Session Validated -------|                              |
     |                               |                                |                              |
     |                               |--- 4. Forward Payload -------->|                              |
     |                               |                                |--- 5. Invoke Gemini SDK ---->|
     |                               |                                |       (Context-Aware Prompt) |
     |                               |                                |<-- 6. Raw JSON Response -----|
     |                               |                                |                              |
     |                               |                                |--- 7. Log Audit Event ------>|
     |                               |                                |       (Record in PostgreSQL) |
     |                               |<-- 8. Final Rendered Brief ----|                              |
     |<-- 9. Display Interactive ----|                                |                              |
     |    Dashboard & Visualizations |                                |                              |
```

---

## 4. Authentication Flow (JWT / RBAC)

Vivexa relies on cryptographic session validation. Clearances are stored server-side to guarantee integrity.

```
+--------------+                 +----------------------+                 +-----------------------+
|  Client UI   |                 |    Supabase Auth     |                 |  Express API Server   |
+--------------+                 +----------------------+                 +-----------------------+
       |                                    |                                         |
       |--- 1. Submit Credentials --------->|                                         |
       |                                    |--- 2. Authenticate & Lookup Role ------>|
       |                                    |       (Postgres users table metadata)   |
       |<-- 3. Return Secure JWT Session ---|                                         |
       |       (Payload: uid, role, email)  |                                         |
       |                                    |                                         |
       |--- 4. Request Private Workspace -------------------------------------------->|
       |       (Header: Authorization: Bearer <JWT>)                                  |
       |                                                                              |--- 5. Validate Token Signature
       |                                                                              |       & RBAC Clearance Level
       |<-- 6. Authorize Access & Render Dashboards ----------------------------------|
```

---

## 5. Deployment Architecture

Deployments are containerized via Docker for universal orchestration across Google Cloud Run, AWS ECS, or bare metal instances.

```
                      [ Public Internet Clients ]
                                  |
                           (Secure SSL/TLS)
                                  v
                      +-----------------------+
                      |  Nginx Ingress / CDN  | (Serves compiled client static assets
                      |   Reverse Proxy (3000)|  and proxies /api routes to server)
                      +-----------------------+
                                  |
                         (Internal Routing)
                                  v
                      +-----------------------+
                      | Docker Container (VM) |
                      |  Running Node Express | (Executes server-side route logic)
                      +-----------------------+
                             /         \
                 (Secure REST)         (Direct SSL Connection)
                           /             \
                          v               v
            +-------------------+   +--------------------+
            | Google Gemini API |   | Cloud SQL Instance |
            |  AI Ingestion Gateway |   |  PostgreSQL Database |
            +-------------------+   +--------------------+
```
