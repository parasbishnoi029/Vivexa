const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: 'SELECT 1' });
  console.log('exec_sql Error:', error);
}
run();
