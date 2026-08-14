import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  console.log("Inspecting RPC functions in Swagger:");
  try {
    const res = await axios.get(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const paths = Object.keys(res.data.paths);
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log("Available RPC endpoints:", rpcs);
    
    // Also, let's see if we can find definitions
    if (res.data.definitions) {
      console.log("Schema Definitions:", Object.keys(res.data.definitions));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
