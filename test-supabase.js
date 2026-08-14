import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'missing';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'missing';

if (supabaseUrl === 'missing') {
  console.log("Missing env vars in process");
}

const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('datasets').select('*').limit(1);
  console.log('datasets:', data, error);
}
test();
