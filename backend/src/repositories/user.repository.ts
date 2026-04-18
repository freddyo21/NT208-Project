import { BaseUserSchema, CreateUserRequestSchema, IBaseUser, IUser, UserSchema } from "@attack-visualization-system/shared";
import { pool } from "../configurations/database.config";

const USER_SELECT_COLUMNS = `
    id,
    name,
    email,
    username,
    password_hash AS "passwordHash",
    elo,
    role,
    status,
    is_verified AS "isVerified",
    created_at AS "createdAt",
    updated_at AS "updatedAt",
    last_login AS "lastLogin"
`;

export const findByEmail = async (email: string) => {
    const query = `
        SELECT ${USER_SELECT_COLUMNS}
        FROM users
        WHERE email = $1
        LIMIT 1
    `;
    const result = await pool.query<IUser>(query, [email]);
    const user = result.rows[0] ?? null;
    if (!user) return null;

    return UserSchema.parse(user);
};


type CreateUserData = Pick<IUser, "name" | "email" | "passwordHash">;
export const create = async (data: Required<CreateUserData>) => {
    const { name, email, passwordHash } = data;

    if (!name || !email || !passwordHash) {
        throw new Error("Missing required fields");
    }

    const result = await pool.query<IUser>(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING ${USER_SELECT_COLUMNS}
        `,
        [name, email, passwordHash]
    );

    return UserSchema.parse(result.rows[0]);
};

export const update = async (id: string, data: Partial<IUser>) => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let placeholderIndex = 1;

    const columnMap: Record<string, string> = {
        "name": "name",
        "email": "email",
        "passwordHash": "password_hash"
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
    RETURNING ${USER_SELECT_COLUMNS}
    `;

    const result = await pool.query<IUser>(query, values);
    const user = result.rows[0] ?? null;
    if (!user) return null;

    return UserSchema.parse(user);
};
