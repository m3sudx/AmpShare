import bcrypt from "bcryptjs";
import "dotenv/config";
import { pool } from "../config/db";
import { normalizePhoneNumber } from "../utils/phone";

async function seedAdmin() {
  const phone = normalizePhoneNumber(process.argv[2] || "+251900000000");
  const fullName = "AmpShare Platform Admin";
  const defaultPassword = process.argv[3] || "admin123456";

  console.log(`Setting up admin user for phone: ${phone}...`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let userId: string;
    const existing = await client.query("SELECT id FROM users WHERE phone_number = $1", [phone]);

    if (existing.rowCount && existing.rowCount > 0) {
      userId = existing.rows[0].id;
      console.log(`User found with ID: ${userId}. Granting ADMIN role...`);
    } else {
      const hash = await bcrypt.hash(defaultPassword, 10);
      const inserted = await client.query(
        `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
         VALUES ($1, $2, $3, now())
         RETURNING id`,
        [fullName, phone, hash],
      );
      userId = inserted.rows[0].id;
      console.log(`Created new admin user with ID: ${userId}`);
    }

    // Assign DRIVER, HOST, and ADMIN roles
    for (const role of ["DRIVER", "HOST", "ADMIN"]) {
      await client.query(
        `INSERT INTO user_roles (user_id, role)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role) DO NOTHING`,
        [userId, role],
      );
    }

    await client.query("COMMIT");
    console.log(`✓ Admin user successfully provisioned: ${phone} (password: ${defaultPassword})`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to seed admin:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin();
