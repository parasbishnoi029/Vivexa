import dotenv from "dotenv";
dotenv.config();

const key = process.env.VITE_SUPABASE_ANON_KEY || "";
if (!key) {
  console.log("No key found");
  process.exit(0);
}

const parts = key.split(".");
if (parts.length === 3) {
  try {
    const payload = Buffer.from(parts[1], "base64").toString("utf8");
    console.log("JWT Payload:", JSON.parse(payload));
  } catch (err: any) {
    console.error("Failed to decode payload:", err.message);
  }
} else {
  console.log("Not a standard 3-part JWT");
}
