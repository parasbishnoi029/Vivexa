# Vivexa Troubleshooting Guide

## Dataset Upload Fails
- Ensure your file is less than 100MB.
- Ensure the file is of supported type (CSV, JSON).
- Check your Supabase RLS (Row Level Security) policies on the `datasets` bucket to ensure uploads are permitted.

## AI Chat Returns Error
- Check that the `GEMINI_API_KEY` is properly configured in the `.env` file on the server.
- The AI Analyst requires context; ensure you launched it from the Dataset Detail page.

## Missing Projects/Datasets
- Refresh the page to trigger a fresh Supabase query.
- Make sure you are logged into the correct account.

## Blank Screen on Load
- Check browser console for errors.
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
