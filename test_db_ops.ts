import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(url, key);

async function main() {
  console.log("Testing Supabase with Anon key...");

  // Try to insert a profile directly
  const testId = "00000000-0000-0000-0000-000000000001";
  console.log("1. Trying to insert profile...");
  const { data: insData, error: insErr } = await supabase.from("profiles").insert({
    user_id: testId,
    full_name: "Test Profile Insert",
    role: "Analyst",
    company: "Test Co"
  }).select();

  console.log("Insert result:", { data: insData, error: insErr });

  // Try to read profiles
  console.log("\n2. Trying to read profiles...");
  const { data: selData, error: selErr } = await supabase.from("profiles").select("*");
  console.log("Read profiles result:", { data: selData, error: selErr });

  // Try to read plans
  console.log("\n3. Trying to read plans...");
  const { data: plansData, error: plansErr } = await supabase.from("plans").select("*");
  console.log("Read plans result:", { data: plansData, error: plansErr });
}

main().catch(console.error);
