console.log("Keys available in process.env:");
for (const key of Object.keys(process.env)) {
  const val = process.env[key];
  console.log(`${key}: length=${val ? val.length : 0}, is_redacted=${val === '*****REDACTED*****'}`);
}
