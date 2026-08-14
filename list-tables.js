import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function main() {
  console.log("Checking schema using rpc or known tables...");
  
  // Let's try some typical tables
  const tables = [
    'workspaces', 'workspace_members', 'projects', 'datasets', 'reports', 
    'ai_conversations', 'invitations', 'workspace_invitations', 'members', 'organizations'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR:`, error.message);
    } else {
      console.log(`Table '${table}': SUCCESS, rows found:`, data.length);
    }
  }
}

main();
