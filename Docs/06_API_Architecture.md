# AI Data Analytics Platform

# API Architecture

Version 1.0

---

# 1. Purpose

Every communication between frontend and backend happens through APIs.

Frontend never talks directly to the database.

---

# 2. API Style

REST API

Future

GraphQL

---

# 3. Authentication APIs

POST

/signup

POST

/login

POST

/google-login

POST

/logout

POST

/forgot-password

POST

/reset-password

GET

/profile

PUT

/profile

---

# 4. Project APIs

GET

/projects

POST

/projects

PUT

/projects/{id}

DELETE

/projects/{id}

---

# 5. Dataset APIs

POST

/upload

GET

/datasets

DELETE

/datasets/{id}

GET

/dataset/{id}

POST

/connect-database

---

# 6. Analytics APIs

POST

/analyze

POST

/eda

POST

/statistics

POST

/ml

POST

/forecast

POST

/anomaly

POST

/recommendation

---

# 7. Visualization APIs

POST

/chart

POST

/dashboard

GET

/charts

DELETE

/chart

---

# 8. AI APIs

POST

/ask

POST

/summarize

POST

/explain

POST

/generate-report

POST

/business-insights

---

# 9. Report APIs

POST

/pdf

POST

/docx

POST

/ppt

GET

/reports

DELETE

/report

---

# 10. Admin APIs

GET

/users

PUT

/user-plan

PUT

/user-status

GET

/system-health

GET

/storage

GET

/logs

---

# 11. Notification APIs

GET

/notifications

POST

/read

DELETE

/notification

---

# 12. Error Handling

400

Bad Request

401

Unauthorized

403

Forbidden

404

Not Found

500

Internal Error

---

# 13. API Standards

JSON Only

HTTPS Only

JWT Authentication

Rate Limiting

Validation

Logging

Versioning

---

# 14. Future APIs

Team

Marketplace

Plugins

Voice

Streaming

Webhook

---

# 15. API Principles

Never expose internal database.

Never trust frontend.

Validate every request.

Return meaningful errors.

Document every endpoint.

---

# 16. Next Document

07_Analytics_Engine.md
