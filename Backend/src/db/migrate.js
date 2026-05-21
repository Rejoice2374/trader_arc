import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = await readFile(resolve(__dirname, "schema.sql"), "utf8");

for (const statement of schema.split(";").map((item) => item.trim()).filter(Boolean)) {
  await pool.query(statement);
}

await pool.end();
console.log("Database schema is up to date.");
