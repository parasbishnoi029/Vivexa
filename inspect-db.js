import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found");
    return;
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database successfully via pg client!");

    // List all tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Existing tables in 'public' schema:");
    res.rows.forEach(r => console.log("- " + r.table_name));

  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.end();
  }
}

main();
