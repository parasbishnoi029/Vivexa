# AI Data Analytics Platform

# Database Design

Version: 1.0

Status: Planning

---

# 1. Database Philosophy

The database must satisfy:

✓ Secure

✓ Fast

✓ Scalable

✓ Modular

✓ Easy Migration

Database Engine

PostgreSQL

---

# 2. Database Structure

Main Modules

Authentication

Users

Projects

Datasets

Reports

AI

History

Billing

Admin

Logs

Storage

Notifications

Settings

---

# 3. Tables

users

Stores

ID

Name

Email

Photo

Plan

Role

Status

Created At

Updated At

Last Login

---

profiles

Bio

Company

Country

Language

Timezone

Theme

Preferences

---

projects

Every analysis belongs to one project.

Fields

Project ID

User ID

Title

Description

Status

Created

Updated

Archived

---

datasets

Each uploaded file.

Fields

Dataset ID

Project ID

Filename

Original Name

File Type

Size

Rows

Columns

Hash

Upload Time

Storage Path

---

dataset_metadata

Stores

Column Names

Data Types

Missing Values

Duplicates

Statistics

Quality Score

Encoding

Delimiter

---

analysis

Every analysis performed.

Stores

Analysis Type

Duration

Status

Started

Completed

AI Used

Python Version

Model Version

---

charts

Generated charts.

Stores

Chart Type

Configuration

Image

JSON

Created

---

reports

Generated reports.

Stores

PDF

Word

Summary

Version

Status

---

forecasts

Prediction history.

Stores

Model

Accuracy

Confidence

Future Values

---

recommendations

AI recommendations.

Stores

Priority

Reason

Confidence

Category

Status

---

activity_logs

Every action.

Stores

Login

Logout

Upload

Delete

Report

Download

Admin

---

admin_logs

Admin-only actions.

Plan Changes

User Suspension

Announcements

Permission Changes

---

storage

Tracks

Used Space

Quota

Remaining

Uploads

Downloads

---

notifications

System notifications.

---

feedback

Bug reports

Suggestions

Ratings

---

settings

User settings.

---

api_keys

Future

---

audit_logs

Security history.

---

# 4. Relationships

One User

↓

Many Projects

↓

Many Datasets

↓

Many Analyses

↓

Many Reports

↓

Many Charts

---

# 5. Security

Passwords

Never Stored

Tokens

Encrypted

Files

Private

Role-based Access

Enabled

---

# 6. Database Rules

No duplicated data.

No nullable critical fields.

Every table has:

UUID

Created At

Updated At

Soft Delete

Indexes

Foreign Keys

---

# 7. Future Tables

Organizations

Teams

Invitations

Marketplace

Plugins

Payments

Invoices

Subscriptions

---

# 8. Next Document

06_API_Architecture.mdS
