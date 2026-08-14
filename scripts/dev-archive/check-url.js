const url = process.env.DATABASE_URL;
console.log("DATABASE_URL type:", typeof url);
if (url) {
  console.log("DATABASE_URL length:", url.length);
  console.log("DATABASE_URL starts with:", url.substring(0, 15));
  console.log("DATABASE_URL ends with:", url.substring(url.length - 15));
  console.log("DATABASE_URL full value:", url);
} else {
  console.log("DATABASE_URL is undefined");
}
