import { User } from "@attack-visualization-system/shared";
import { pool } from "../configurations/database.config";

export const findByEmail = async (email: string) => {
    const query = `
        SELECT *
        FROM users
        WHERE email = $1
        LIMIT 1
    `;
    const result = await pool.query<User>(query, [email]);

    return result.rows[0] ?? null;
};

export const create = async (data: Required<Pick<User, "name" | "email" | "passwordHash">>) => {
    const { name, email, passwordHash: password_hash } = data;

    if (!name || !email || !password_hash) {
        throw new Error("Missing required fields: name, email, or passwordHash");
    }

    const result = await pool.query<User>(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, email, password_hash]
    );

    return result.rows[0];
};

export const update = async (id: number, data: Partial<User>) => {
    const fields: string[] = [];
    const values: any[] = [];
    let placeholderIndex = 1;

    const columnMap: Record<string, string> = {
        "name": "name",
        "email": "email",
        "passwordHash": "password_hash"
        // Tuyệt đối không đưa "id" vào đây để tránh bị ghi đè
    };

    // Duyệt qua các key trong data để build query động
    for (const [key, value] of Object.entries(data)) {
        const columnName = columnMap[key];

        // Chỉ xử lý nếu key nằm trong danh sách cho phép và value không undefined
        if (columnName && value !== undefined) {
            fields.push(`${columnName} = $${placeholderIndex++}`);
            values.push(value);
        }
    }

    if (fields.length === 0) return null; // Không có gì để update

    values.push(id); // Tham số cuối cùng cho WHERE id = $x
    const query = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = $${placeholderIndex}
        RETURNING *
    `;

    const result = await pool.query<User>(query, values);
    return result.rows[0] ?? null;
};
