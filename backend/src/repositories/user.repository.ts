import { IUser } from "@attack-visualization-system/shared";
import { pool } from "../configurations/database.config";

export const findByEmail = async (email: string) => {
    const query = `
        SELECT *
        FROM users
        WHERE email = $1
        LIMIT 1
    `;
    const result = await pool.query<IUser>(query, [email]);

    return result.rows[0] ?? null;
};

type CreateUserData = Pick<User, "name" | "email" | "password_hash">;

export const create = async (data: CreateUserData) => {
    const { name, email, password_hash } = data;

    if (!name || !email || !password_hash) {
        throw new Error("Missing required fields: name, email, or password_hash");
    }

    const result = await pool.query<IUser>(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, email, passwordHash]
    );

    return result.rows[0];
};

export const update = async (id: number, data: Partial<IUser>) => {
    const fields: string[] = [];
    const values: any[] = [];
    let placeholderIndex = 1;

    const columnMap: Record<string, string> = {
        "name": "name",
        "email": "email",
        "password_hash": "password_hash"
        // Never include "id" here to avoid overwriting
    };

    // Iterate through keys in data to build dynamic query
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

    const result = await pool.query<IUser>(query, values);
    return result.rows[0] ?? null;
};
