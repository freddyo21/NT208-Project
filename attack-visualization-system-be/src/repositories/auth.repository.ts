import { pool } from "../config/db";

export const AuthRepository = {
  async findByEmail(email: string) {
    const query = `SELECT id, email, password, role FROM users WHERE email = $1 LIMIT 1`;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },
};