import { pool } from "../config/db";

export async function findByEmail(email: string) {
  const query = `SELECT id, email, password, role FROM users WHERE email = $1 LIMIT 1`;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}