# Vivexa Administrator Guide

## Overview
Vivexa administrators have global access to platform health and metric data. Admin functions are restricted and only available to specified accounts (e.g., info.vivexa@gmail.com).

## Dashboard
The Admin Dashboard gives a high-level view of:
- Total registered users on the platform.
- Total projects created globally.
- Total datasets uploaded.

## User Management
Currently, user management revolves around monitoring the total active numbers. Deletions or updates to specific users must be done directly through the Supabase console using SQL or the dashboard interface.

## Plan Management
Users must click "Contact Admin" to request Pro or Enterprise plans. You will receive an email. You can then update their plan status manually in the database once payment or terms are settled.

## Monitoring & Logs
- Platform metrics are queried from the primary database (Supabase).
- To monitor errors or issues, check the server console logs or browser developer tools.

## Security & Backups
- Data is securely stored using Supabase (PostgreSQL for metadata, Storage for files).
- Regular database backups should be scheduled via the Supabase dashboard.
