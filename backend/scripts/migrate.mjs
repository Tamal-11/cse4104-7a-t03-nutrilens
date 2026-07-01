import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDirectory = resolve(backendDirectory, "..");

config({ path: resolve(repositoryDirectory, ".env") });
config({ path: resolve(backendDirectory, ".env"), override: true });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Copy .env.example to .env and add your Neon connection string.",
  );
}

const migrationsDirectory = resolve(backendDirectory, "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      file_name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const fileName of migrationFiles) {
    const applied = await client.query(
      "select 1 from public.schema_migrations where file_name = $1",
      [fileName],
    );

    if (applied.rowCount) {
      console.log(`Skipped ${fileName} (already applied)`);
      continue;
    }

    const sql = await readFile(resolve(migrationsDirectory, fileName), "utf8");

    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (file_name) values ($1)",
        [fileName],
      );
      await client.query("commit");
      console.log(`Applied ${fileName}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  client.release();
  await pool.end();
}
