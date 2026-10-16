
import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "localhost",
  database: process.env.POSTGRES_DB ?? "AmpShare",
  user: process.env.POSTGRES_USER?? "postgres",
  password: process.env.POSTGRES_PASSWORD ,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});
