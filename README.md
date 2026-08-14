<div align="center">

# Vivexa Open-Source Decision Intelligence Platform
### Domain-Aware AI Analytics, Executive Briefings & Predictive Intelligence

[![CI/CD Pipeline](https://github.com/vivexa-ai/vivexa/actions/workflows/ci.yml/badge.svg)](https://github.com/vivexa-ai/vivexa/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)

[Overview](#overview) • [System Architecture](#system-architecture) • [Feature Implementation Matrix](#feature-implementation-matrix) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Documentation](#documentation) • [Testing](#testing)

</div>

---

## Overview

**Vivexa** is a self-hostable, modern Decision Intelligence Platform designed to bridge raw data ingestion and senior executive decision-making. By leveraging domain-aware artificial intelligence and multi-step reasoning agents, Vivexa transforms raw datasets into industry-tailored briefings, forecasting models, and step-by-step executive advisory books.

This project is built to demonstrate production-grade architectural patterns, clean responsive interfaces, complete role-based access control, local-first state simulations, and secure AI pipeline integrations.

---

## System Architecture

Vivexa relies on a secure, full-stack architecture that segregates static client delivery from server-side computational workloads, database queries, and LLM orchestration.

### Architectural Blueprint Overview
```
+-------------------------------------------------------+
|                    Client Layer                       |
|         React 19 + Vite + TypeScript + Tailwind       |
+-------------------------------------------------------+
                           |
                 (HTTPS / JSON Payload)
                           v
+-------------------------------------------------------+
|                 Nginx Reverse Proxy                   |
|            Ingress Routing & SSL Offloading           |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                  Backend API Server                   |
|             Node.js Express (TypeScript)              |
+-------------------------------------------------------+
          /                |                \
   (Secure REST)     (REST Clients)   (SQL via Drizzle)
        /                  |                  \
       v                   v                   v
+--------------+    +--------------+    +--------------+
|Google Gemini |    |Supabase Auth |    | PostgreSQL DB|
|  AI Engine   |    |Session Guard |    | Cloud Store  |
+--------------+    +--------------+    +--------------+
```

To view comprehensive system diagrams, please refer to the [System Architecture Guide](./docs/Architecture.md):
- **[System Architecture Diagram](./docs/Architecture.md#1-system-architecture-diagram)**: View network routing and gateway boundaries.
- **[Database ER Diagram](./docs/Architecture.md#2-database-er-diagram-entity-relationship)**: View table relations, constraints, and index layouts.
- **[API Request-Response Flow](./docs/Architecture.md#3-api-flow-diagram)**: View the path of authenticated payload routing.
- **[Authentication & JWT Flow](./docs/Architecture.md#4-authentication-flow-jwt--rbac)**: View token validation processes.
- **[Containerized Deployment Blueprint](./docs/Architecture.md#5-deployment-architecture)**: View cloud hosting topology.

---

## Feature Implementation Matrix

To keep documentation transparent and authentic for developers and recruiters, here is the exact implementation status of Vivexa's features:

| Module / Feature | Sub-Capability | Status | Tech / Implementation Notes |
| :--- | :--- | :--- | :--- |
| **Authentication** | Supabase Auth Email/Password | **LIVE** | Standard password grant flow with JWT verification middleware. |
| | SSO Integration (SAML/OIDC) | *Roadmap* | Under consideration for Active Directory / Okta integration. |
| **Role-Based Control** | Multi-Role Access Management | **LIVE** | Supports Admin vs Standard User view filters and conditional routes. |
| | Granular Policy RBAC | **LIVE** | Configured dynamic role override dropdown in the Admin layout. |
| **Data Ingestion** | Local File Indexer & Metadata | **LIVE** | Parses and profiles CSV schema targets, row-counts, and byte-scales. |
| | Automated DB Multi-Tenancy | *Roadmap* | Planned schema-level database isolation. |
| **Developer Tools** | API Key Provisioning Portal | **LIVE** | Creates secure bearer tokens with custom security scopes. |
| | Integrity Cryptographic Sandbox | **LIVE** | Client-side prefix check (`vvx_live_`/`vvx_test_`) and RBAC decoder. |
| **Financial & Usage** | Dynamic Quota Simulator | **LIVE** | Slides active models, API calling rates, and seating targets to project cost. |
| | Card Registration Validation | **LIVE** | Interactive credit card modal validating credentials client-side. |
| | Production Stripe Gateway | *Roadmap* | Configured but not activated on standard sandbox profiles. |
| **AI Intelligence** | Domain-Aware Analyzer | **LIVE** | Auto-detects target verticals (Retail, Healthcare, SaaS) to yield custom KPIs. |
| | C-Suite Advisory Books | **LIVE** | Generates tailored multi-role playbooks for CEOs, CFOs, COOs, and CMOs. |
| | Global Search NLP Agent | **LIVE** | Natural Language matching engine that summarizes queries & deep-links views. |
| | RAG / Dataset Memory | **LIVE** | Memory profiling with interactive file indexing simulators. |
| **Infrastructure** | System Health Dashboard | **LIVE** | Visual telemetry trackers tracking memory, disk capacity, and load times. |
| | Platform Audit Logging | **LIVE** | Immutable logging listing user logins, API key changes, and datasets. |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Framer Motion (via `motion/react`)
- **Backend**: Node.js Express, TypeScript, tsx, esbuild
- **Database**: PostgreSQL (managed via Supabase or Cloud SQL)
- **AI Engine**: Google Gemini API via official `@google/genai` TypeScript SDK
- **Task Management**: Docker, GitHub Actions, Nginx

---

## Installation & Quickstart

### Prerequisites
- Node.js (v20+)
- npm or bun

### 1. Clone the Workspace
```bash
git clone https://github.com/vivexa-ai/vivexa.git
cd vivexa
```

### 2. Configure Local Secrets
Copy `.env.example` to `.env` and populate your API variables:
```bash
cp .env.example .env
```
Key parameters to include:
- `GEMINI_API_KEY`: Secure server-side Google Gemini key.
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Session auth connections.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Workspace
```bash
npm run dev
```
The server starts on port `3000`. Open `http://localhost:3000` to view the live interface.

### 5. Compile & Bundle Production Output
```bash
npm run build
```
Compiles static assets and bundles the TypeScript Express server into `dist/server.cjs` via esbuild.

---

## Documentation

Comprehensive guides are available in the [`docs/`](./docs) directory:
- **[System Architecture](./docs/Architecture.md)**: Architectural patterns and flowcharts.
- **[User Guide](./docs/UserGuide.md)**: Product feature walkthrough.
- **[Deployment Guide](./docs/Deployment.md)**: Production deployment instructions.
- **[API Documentation](./docs/APIDocumentation.md)**: Endpoint specification schemas.
- **[Developer Guide](./docs/DeveloperGuide.md)**: Codebase organization guidelines.
- **[Troubleshooting](./docs/TroubleshootingGuide.md)**: Common failure modes.

---

## Testing

Vivexa incorporates robust pipeline checks to ensure execution safety.

### Run Linter
Verify syntactic type-safety and formatting:
```bash
npm run lint
```

### Run Build Tests
Ensure production bundler structures compile successfully:
```bash
npm run build
```

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.
