async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/inspect-env');
    const data = await res.json();
    console.log("Server Env Inspection Results:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Query failed:", err.message);
  }
}

main();
