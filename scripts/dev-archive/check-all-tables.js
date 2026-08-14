import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  console.log("Fetching PostgREST OpenAPI spec from:", `${url}/rest/v1/`);
  try {
    const res = await axios.get(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log("Title:", res.data.info.title);
    const paths = Object.keys(res.data.paths);
    console.log("Exposed API paths:");
    paths.forEach(p => console.log("- " + p));
  } catch (err) {
    console.error("Error fetching spec:", err.message);
    if (err.response) {
      console.error("Response:", err.response.data);
    }
  }
}

main();
