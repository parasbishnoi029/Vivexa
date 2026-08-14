const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.email_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient TEXT NOT NULL,
          sender TEXT,
          subject TEXT,
          template_name TEXT,
          status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
          provider TEXT NOT NULL,
          provider_message_id TEXT,
          error_message TEXT,
          retry_count INT DEFAULT 0,
          response_metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          delivered_at TIMESTAMPTZ
      );

      NOTIFY pgrst, 'reload schema';
    `);
    console.log("Table created.");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
