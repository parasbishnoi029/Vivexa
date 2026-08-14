import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", url);
console.log("Has key:", !!key);

const supabase = createClient(url, key);

async function main() {
  console.log("Inspecting 'workspace_invitations' table:");
  
  // Try to select
  const { data, error } = await supabase.from('workspace_invitations').select('*').limit(1);
  if (error) {
    console.error("Select error:", error);
  } else {
    console.log("Select success, columns:", data.length > 0 ? Object.keys(data[0]) : "Table is empty");
  }

  // Try to insert a dummy row to see the schema error
  console.log("Attempting test insert...");
  const testInvite = {
    workspace_id: 'd9b0a701-1372-4d43-85b4-ae89c898687a', // dummy or any random uuid
    email: 'test-error-detect@vivexa.com',
    role: 'Analyst',
    status: 'Pending'
  };

  const { data: insData, error: insError } = await supabase
    .from('workspace_invitations')
    .insert(testInvite)
    .select();

  if (insError) {
    console.error("Insert error detail:", insError);
  } else {
    console.log("Insert success:", insData);
  }
}

main();
