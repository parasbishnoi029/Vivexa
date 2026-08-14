import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL || "";
console.log("DATABASE_URL length:", url.length);
if (url) {
  // Print redacted version
  try {
    const parsed = new URL(url);
    console.log({
      protocol: parsed.protocol,
      host: parsed.host,
      port: parsed.port,
      pathname: parsed.pathname,
      username: parsed.username,
      search: parsed.search
    });
  } catch (err: any) {
    console.log("URL parsing failed:", err.message);
    // Print first 20 and last 20 characters
    console.log("Start:", url.substring(0, 25));
    console.log("End:", url.substring(url.length - 25));
  }
} else {
  console.log("DATABASE_URL is empty");
}
