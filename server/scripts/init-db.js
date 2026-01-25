/* eslint-env node */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env (override any globally-set DATABASE_URL)
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL in server/.env");
  process.exitCode = 1;
  process.exit();
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const initDir = path.resolve(__dirname, "..", "..", "db", "init");
  if (!fs.existsSync(initDir)) {
    throw new Error(`db/init folder not found: ${initDir}`);
  }

  const { rows } = await pool.query("select to_regclass('public.riders') as riders_table");
  if (rows?.[0]?.riders_table) {
    console.log("DB already initialized: public.riders exists.");
    return;
  }

  const files = (await fs.promises.readdir(initDir))
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No .sql files found in db/init.");
    return;
  }

  console.log("Applying migrations:", files.join(", "));
  for (const f of files) {
    const sql = await fs.promises.readFile(path.join(initDir, f), "utf8");
    if (!sql.trim()) continue;
    await pool.query(sql);
  }

  console.log("DB init complete.");
}

main()
  .catch((e) => {
    console.error("DB init failed:", String(e?.message || e));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
