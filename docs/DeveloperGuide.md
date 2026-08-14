# Vivexa Developer Guide

## Architecture
Vivexa is a full-stack application leveraging:
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend/API**: Node.js, Express (running via `server.ts`).
- **Database & Auth**: Supabase (PostgreSQL, Storage, Auth).
- **AI Engine**: Google Gemini API for intelligent analysis.

## Folder Structure
- `src/`
  - `components/`: Reusable UI components.
  - `pages/`: Route pages (Auth, Landing, Workspace, Admin).
  - `stores/`: Zustand state management.
  - `lib/`: Utility libraries (Supabase client).
- `server.ts`: The Express backend handling Gemini requests and API routes.
- `docs/`: Technical and User documentation.

## Database Schema
Supabase powers the core database:
- `users`: Managed by Supabase Auth.
- `projects`: Contains workspace projects (name, description, owner_id).
- `datasets`: Tracks uploaded files (storage_path, name, user_id).

## Authentication
Authentication is strictly handled by Supabase. Tokens are passed in headers (`Authorization: Bearer <token>`) for protected Express routes like `/api/v1/gemini/chat`.

## Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Public anon key for client.
- `GEMINI_API_KEY`: Server-side secret key for Google Gemini AI.

## Deployment
Build the client and backend via `npm run build`. The application serves static files through Express in production, or binds via Vite middleware in development.
