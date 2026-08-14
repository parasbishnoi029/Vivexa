# Changelog - Vivexa Enterprise AI Decision Intelligence Platform

All notable changes to the Vivexa platform will be documented in this file.

## [v1.0.0] - 2026-08-10

### Enterprise Features & Multi-Tenant Architecture
- **Unified RBAC & Plan Authorization**: Established single source of truth for user roles and plans across `users`, `profiles`, `workspace_members`, `subscriptions`, and `auth.user_metadata`.
- **Atomic Database Updates**: Guaranteed synchronous database synchronization on role and plan modifications with `UPDATE users` row verification.
- **Google OAuth & Workspace Onboarding**: Multi-table automated user initialization pipeline for Google authenticated users.
- **Enterprise Search**: Command-K global search interface indexing Workspaces, Datasets, Projects, Reports, Notebooks, and Security Logs.
- **AI Decision Engine**: Gemini integration for dataset auditing, trend analysis, root cause analysis, and natural language query processing.
- **Dataset Forecasting**: Time-series analytics supporting linear regression, moving averages, Holt-Winters, and ARIMA algorithms.
- **Enterprise Notebooks**: Interactive multi-cell notebook runner supporting Python data analysis, SQL queries, Markdown, and visualization rendering.
- **Email Delivery Pipeline**: Transactional email queue and logger with tracking for security alerts, workspace invitations, and account events.
- **Usage & Quota Persistence**: Permanent database tracking for AI tokens, storage, API requests, and report runs.
