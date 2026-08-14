import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL or SUPABASE_DB_URL found");
    return;
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Get columns of workspace_invitations
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'workspace_invitations' AND table_schema = 'public';
    `);
    console.log("workspace_invitations columns:", cols.rows);

    // Get table constraints
    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(con.oid)
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = con.connamespace
      WHERE rel.relname = 'workspace_invitations';
    `);
    console.log("workspace_invitations constraints:", constraints.rows);

    // Get triggers
    const triggers = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'workspace_invitations';
    `);
    console.log("workspace_invitations triggers:", triggers.rows);

  } catch (err) {
    console.error("Error inspecting:", err);
  } finally {
    await client.end();
  }
}

main();
