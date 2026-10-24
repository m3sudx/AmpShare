import fs from "fs";
import path from "path";
import "dotenv/config";
import { pool } from "../config/db";

async function runMigrations() {
  console.log("Running database migrations...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(__dirname, "../../database/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [file],
      );

      if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
        console.log(`- Migration already applied: ${file}`);
        continue;
      }

      console.log(`- Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await client.query(sql);

      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file],
      );
      console.log(`  ✓ Applied: ${file}`);
    }

    await client.query("COMMIT");
    console.log("All migrations completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
