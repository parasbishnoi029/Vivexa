# Vivexa Deployment Guide

Vivexa can be deployed to production using Docker, Cloud Run, or Vercel + Supabase.

## Prerequisites
- Node.js 18+ / Python 3.10+
- Supabase project with PostgreSQL
- Google Gemini API Key

## Environment Variables
Create `.env` based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

## Docker Deployment
Build and run with Docker Compose:
```bash
docker-compose up --build -d
```
