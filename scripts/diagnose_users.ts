import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing in environment variables!");
  process.exit(1);
}

async function diagnose() {
  console.log("==========================================================");
  console.log("VIVEXA ENTERPRISE USER & DIRECTORY DIAGNOSTIC TOOL");
  console.log("==========================================================");

  let isValidUrl = false;
  try {
    if (connectionString) new URL(connectionString);
    isValidUrl = true;
  } catch (e) {
    console.warn("DATABASE_URL is not a valid URL for direct pg connection:", connectionString);
  }

  if (!isValidUrl) {
    console.log("Skipping direct pg query due to invalid DATABASE_URL.");
    return;
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log("[SUCCESS] Connected to PostgreSQL database.\n");

    // 1. auth.users audit
    try {
      const authRes = await client.query(`SELECT id, email, created_at, last_sign_in_at FROM auth.users`);
      console.log(`--- auth.users (Total: ${authRes.rowCount}) ---`);
      console.table(authRes.rows);
    } catch (err: any) {
      console.error("Error querying auth.users:", err.message);
    }

    // 2. profiles audit
    try {
      const profRes = await client.query(`SELECT id, email, full_name, role, plan, status, organization_id FROM profiles`);
      console.log(`\n--- profiles (Total: ${profRes.rowCount}) ---`);
      console.table(profRes.rows);
    } catch (err: any) {
      console.error("Error querying profiles:", err.message);
    }

    // 3. workspace_members audit
    try {
      const memRes = await client.query(`SELECT id, workspace_id, user_id, role FROM workspace_members`);
      console.log(`\n--- workspace_members (Total: ${memRes.rowCount}) ---`);
      console.table(memRes.rows);
    } catch (err: any) {
      console.error("Error querying workspace_members:", err.message);
    }

    // 4. organizations audit
    try {
      const orgRes = await client.query(`SELECT id, name, slug FROM organizations`);
      console.log(`\n--- organizations (Total: ${orgRes.rowCount}) ---`);
      console.table(orgRes.rows);
    } catch (err: any) {
      console.error("Error querying organizations:", err.message);
    }

    // 5. Comparison / Discrepancy analysis
    console.log("\n--- SYNCHRONIZATION SUMMARY ---");
    const countsRes = await client.query(`
      SELECT 
        (SELECT count(*) FROM auth.users) as auth_users_count,
        (SELECT count(*) FROM profiles) as profiles_count,
        (SELECT count(*) FROM workspace_members) as workspace_members_count
    `);
    console.table(countsRes.rows);

  } catch (err: any) {
    console.error("Diagnostic failed:", err.message);
  } finally {
    await client.end();
  }
}

diagnose();
