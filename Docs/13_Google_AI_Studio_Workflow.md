# Docs/13_Google_AI_Studio_Workflow.md

# AI Data Analytics Platform

## Google AI Studio Development Workflow

Version: 1.0

Priority: Critical

Status: Final

---

# 1. Purpose

This document defines how Google AI Studio will be used during development.

Google AI Studio is responsible for generating implementation code.

Architecture and technical decisions remain under human control.

---

# 2. AI Development Philosophy

Wrong

Idea

↓

Open AI Studio

↓

"Build my app"

↓

Random Code

Correct

Planning

↓

Documentation

↓

Architecture

↓

Detailed Prompt

↓

Generated Code

↓

Review

↓

Testing

↓

Git

---

# 3. Feature Workflow

Every feature follows this sequence.

1

Feature Planning

↓

2

Architecture Review

↓

3

Database Review

↓

4

API Review

↓

5

Google AI Studio Prompt

↓

6

Generate Code

↓

7

Manual Review

↓

8

Run Project

↓

9

Fix Issues

↓

10

Commit

↓

11

Push

---

# 4. Prompt Structure

Every prompt must contain

Project Name

Module

Feature

Requirements

Folder Structure

Existing Files

Files to Create

Files to Modify

Dependencies

Coding Standards

Acceptance Criteria

Expected Output

---

# 5. Prompt Template

PROJECT

AI Data Analytics Platform

MODULE

Authentication

FEATURE

Google Login

OBJECTIVE

Add secure Google authentication.

FILES TO CREATE

...

FILES TO MODIFY

...

DATABASE

...

API

...

UI

...

SECURITY

...

TESTS

...

OUTPUT

Production-ready code.

---

# 6. Prompt Rules

Never ask for multiple unrelated features.

One feature

One prompt.

Large features

Split into phases.

---

# 7. Maximum Prompt Size

Recommended

One complete module.

Never

Entire application.

---

# 8. Code Review

Check

Folder structure

Imports

Naming

Performance

Security

Readability

Documentation

---

# 9. Generated Files

Immediately review

Imports

Unused code

Duplicated code

Magic numbers

Hardcoded values

Secrets

---

# 10. Testing

Run application.

Test feature.

Verify API.

Verify UI.

Verify logs.

Only then commit.

---

# 11. Commit Rules

Never commit directly after generation.

Always

Review

↓

Test

↓

Commit

---

# 12. Git Commit Format

feat:

fix:

refactor:

docs:

test:

style:

perf:

build:

Example

feat(auth): add Google login

---

# 13. Branch Strategy

main

develop

feature/auth

feature/dashboard

feature/upload

feature/admin

feature/reports

feature/analytics

---

# 14. Human Responsibilities

Architecture

Security

Database

Performance

Business Logic

Final Approval

---

# 15. AI Responsibilities

Generate code

Generate documentation

Generate tests

Generate boilerplate

Generate UI

Never approve itself.

---

# 16. When NOT to Use AI

Choosing architecture.

Security decisions.

Database redesign.

Business rules.

Pricing strategy.

---

# 17. Large Features

Break into

Backend

↓

Frontend

↓

Database

↓

Integration

↓

Testing

---

# 18. Documentation

Every completed feature updates

README

API docs

Architecture docs

Change log

---

# 19. Success Criteria

Google AI Studio should generate code that needs only minor corrections before merging.

---

# 20. Next Document

14_Git_Workflow.md
