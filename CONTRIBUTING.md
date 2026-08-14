# Contributing to Vivexa Enterprise AI Decision Intelligence Platform

Thank you for your interest in contributing to Vivexa! This document provides guidelines and instructions for submitting contributions to the codebase.

## Code of Conduct
Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started
1. **Fork & Clone**: Fork the repository on GitHub and clone your fork locally.
2. **Install Dependencies**: Run `npm install` to install node module dependencies.
3. **Environment Setup**: Copy `.env.example` to `.env` and configure local variables.
4. **Development Server**: Run `npm run dev` to boot the full-stack development server on port 3000.

## Development Workflow
- All code changes should be implemented in TypeScript.
- Follow Tailwind CSS styling guidelines.
- Ensure all backend API routes are protected with appropriate authentication and RBAC checks.
- Run `npm run lint` (`npx tsc --noEmit`) to verify type safety before submitting a pull request.
- Run `npm run build` to verify production compilation.

## Pull Request Guidelines
1. Ensure your PR branch is rebased on the latest `main` branch.
2. Provide a descriptive title and detailed summary of changes.
3. Attach test results or verification logs proving feature completeness.

## Security Disclosures
If you discover a security vulnerability, please report it according to our [Security Policy](SECURITY.md).
