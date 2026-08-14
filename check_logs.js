import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_KEY);
async function run() {
  const { data, error } = await supabase.from('email_logs').select('*').limit(1);
  console.log('Error:', error);
}
run();
