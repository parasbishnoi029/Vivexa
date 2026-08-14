const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const provider = process.env.EMAIL_PROVIDER;

console.log("SMTP CONFIG:");
console.log("- Provider:", provider);
console.log("- Host:", host);
console.log("- Port:", port);
console.log("- User:", user);
console.log("- Pass Length:", pass ? pass.length : 0);
if (pass) {
  console.log("- Pass starts with:", pass.substring(0, 10));
}
