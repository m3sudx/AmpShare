import bcrypt from "bcryptjs";
import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import { signAccessToken } from "../../utils/jwt";
import { normalizePhoneNumber } from "../../utils/phone";
import type { RegisterInput } from "./auth.validation";

export interface PublicUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  roles: string[];
  phoneVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

/**
 * Registers a new user with DRIVER role inside a single database transaction.
 * Rejects duplicate phone numbers with a 409 Conflict.
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const normalizedPhone = normalizePhoneNumber(input.phoneNumber);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if phone number already exists
    const existing = await client.query(
      "SELECT id FROM users WHERE phone_number = $1",
      [normalizedPhone]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      throw new AppError("Phone number is already registered", 409);
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Insert user into users table
    const insertUserQuery = `
      INSERT INTO users (full_name, phone_number, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, phone_number, phone_verified_at, created_at
    `;
    const userResult = await client.query(insertUserQuery, [
      input.fullName.trim(),
      normalizedPhone,
      passwordHash,
    ]);

    const newUser = userResult.rows[0];

    // Assign DRIVER role in user_roles table
    const insertRoleQuery = `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, 'DRIVER')
    `;
    await client.query(insertRoleQuery, [newUser.id]);

    await client.query("COMMIT");

    const roles = ["DRIVER"];
    const user: PublicUser = {
      id: newUser.id,
      fullName: newUser.full_name,
      phoneNumber: newUser.phone_number,
      roles,
      phoneVerified: Boolean(newUser.phone_verified_at),
      createdAt: new Date(newUser.created_at).toISOString(),
    };

    const accessToken = signAccessToken({ sub: user.id, roles });

    return { user, accessToken };
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") {
      throw new AppError("Phone number is already registered", 409);
    }
    throw error;
  } finally {
    client.release();
  }
};
