import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

async function main() {
  console.log("Connecting directly to PostgreSQL using DATABASE_URL...");
  const client = new pg.Client({ connectionString });
  await client.connect();
  console.log("Connected successfully!");

  // List all tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log("\n--- PUBLIC TABLES ---");
  console.log(tablesRes.rows.map(r => r.table_name));

  // Query users from auth.users (to see if auth.users has anything)
  try {
    const authUsersRes = await client.query(`
      SELECT id, email, created_at, last_sign_in_at, raw_user_meta_data
      FROM auth.users
    `);
    console.log(`\n--- AUTH.USERS (${authUsersRes.rows.length}) ---`);
    console.log(authUsersRes.rows);
  } catch (err: any) {
    console.error("Error reading auth.users:", err.message);
  }

  // Query public.users
  try {
    const usersRes = await client.query(`SELECT * FROM public.users`);
    console.log(`\n--- PUBLIC.USERS (${usersRes.rows.length}) ---`);
    console.log(usersRes.rows);
  } catch (err: any) {
    console.error("Error reading public.users:", err.message);
  }

  // Query public.profiles
  try {
    const profilesRes = await client.query(`SELECT * FROM public.profiles`);
    console.log(`\n--- PUBLIC.PROFILES (${profilesRes.rows.length}) ---`);
    console.log(profilesRes.rows);
  } catch (err: any) {
    console.error("Error reading public.profiles:", err.message);
  }

  // Query workspaces
  try {
    const workspacesRes = await client.query(`SELECT * FROM public.workspaces`);
    console.log(`\n--- WORKSPACES (${workspacesRes.rows.length}) ---`);
    console.log(workspacesRes.rows);
  } catch (err: any) {
    console.error("Error reading workspaces:", err.message);
  }

  // Query workspace_members
  try {
    const membersRes = await client.query(`SELECT * FROM public.workspace_members`);
    console.log(`\n--- WORKSPACE_MEMBERS (${membersRes.rows.length}) ---`);
    console.log(membersRes.rows);
  } catch (err: any) {
    console.error("Error reading workspace_members:", err.message);
  }

  // Query organizations
  try {
    const orgRes = await client.query(`SELECT * FROM public.organizations`);
    console.log(`\n--- ORGANIZATIONS (${orgRes.rows.length}) ---`);
    console.log(orgRes.rows);
  } catch (err: any) {
    console.error("Error reading organizations:", err.message);
  }

  // Query invitations
  try {
    const invRes = await client.query(`SELECT * FROM public.invitations`);
    console.log(`\n--- INVITATIONS (${invRes.rows.length}) ---`);
    console.log(invRes.rows);
  } catch (err: any) {
    try {
      const invRes = await client.query(`SELECT * FROM public.workspace_invitations`);
      console.log(`\n--- WORKSPACE_INVITATIONS (${invRes.rows.length}) ---`);
      console.log(invRes.rows);
    } catch (err2: any) {
      console.error("Error reading invitations:", err2.message);
    }
  }

  // Query projects
  try {
    const projectsRes = await client.query(`SELECT * FROM public.projects`);
    console.log(`\n--- PROJECTS (${projectsRes.rows.length}) ---`);
    console.log(projectsRes.rows);
  } catch (err: any) {
    console.error("Error reading projects:", err.message);
  }

  // Query datasets
  try {
    const datasetsRes = await client.query(`SELECT * FROM public.datasets`);
    console.log(`\n--- DATASETS (${datasetsRes.rows.length}) ---`);
    console.log(datasetsRes.rows);
  } catch (err: any) {
    console.error("Error reading datasets:", err.message);
  }

  // Query audit logs
  try {
    const auditRes = await client.query(`SELECT * FROM public.audit_logs`);
    console.log(`\n--- AUDIT LOGS (${auditRes.rows.length}) ---`);
    console.log(auditRes.rows);
  } catch (err: any) {
    console.error("Error reading audit_logs:", err.message);
  }

  await client.end();
}

main().catch(console.error);
