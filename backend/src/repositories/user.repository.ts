import { IUser, UserResponseSchema, UserSchema } from "@attack-visualization-system/shared";
import { pool } from "../configurations/database.config";
import { Exception } from "../exceptions";

const USER_SELECT_COLUMNS = `
    u."id",
    u."name",
    u."email",
    u."password_hash" AS "passwordHash",
    u."status",
    u."created_at" AS "createdAt",
    u."updated_at" AS "updatedAt",
    u."last_login" AS "lastLogin"
`;

export const findById = async (id: string) => {
    const query = `
        SELECT ${USER_SELECT_COLUMNS}, r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
        LIMIT 1
    `;
    const result = await pool.query<IUser>(query, [id]);
    const user = result.rows[0] ?? null;
    if (!user) return null;

    return UserSchema.parse(user);
};

export const findByEmail = async (email: string) => {
    const query = `
        SELECT ${USER_SELECT_COLUMNS}, r.name AS role
        FROM "users" u
        JOIN "roles" r ON u.role_id = r.id
        WHERE u.email = $1
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
        throw new Exception("Missing required fields", 400);
    }

    const user = await pool.query<IUser>(
        `
            WITH "inserted_user" AS (
                INSERT INTO "users" ("name", "email", "password_hash")
                VALUES ($1, $2, $3)
                RETURNING *
            )
            SELECT 
                iu."id",
                iu."name",
                iu."email",
                iu."password_hash" AS "passwordHash",
                r."name" AS "role",
                iu."status",
                iu."created_at" AS "createdAt",
                iu."updated_at" AS "updatedAt",
                iu."last_login" AS "lastLogin"
            FROM "inserted_user" iu
            JOIN "roles" r ON iu."role_id" = r."id"
            LIMIT 1;
        `,
        [name, email, passwordHash]
    ).then(result => result.rows[0] ?? null);

    if (user) {
        const { passwordHash, ...userWithoutHash } = user;
        return UserResponseSchema.parse(userWithoutHash);
    }

    throw new Exception("Failed to create user", 500, "InternalServerError");
};

export const findAll = async () => {
    const query = `
        SELECT ${USER_SELECT_COLUMNS}, r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
    `;
    const result = await pool.query<IUser>(query);
    return result.rows.map(u => {
        const { passwordHash, ...userWithoutHash } = u as IUser;
        return UserResponseSchema.parse(userWithoutHash);
    });
};

// export const update = async (id: string, data: Partial<IUser>) => {
//     const fields: string[] = [];
//     const values: unknown[] = [];
//     let placeholderIndex = 1;

//     const columnMap: Record<string, string> = {
//         "name": "name",
//         "email": "email",
//         "passwordHash": "password_hash"
//         // Never include "id" here to avoid overwriting
//     };

//     // Iterate through keys in data to build dynamic query
//     for (const [key, value] of Object.entries(data)) {
//         const columnName = columnMap[key];

//         // Chỉ xử lý nếu key nằm trong danh sách cho phép và value không undefined
//         if (columnName && value !== undefined) {
//             fields.push(`${columnName} = $${placeholderIndex++}`);
//             values.push(value);
//         }
//     }

//     if (fields.length === 0) return null; // Không có gì để update

//     values.push(id); // Tham số cuối cùng cho WHERE id = $x
//     const query = `
//         UPDATE "users"
//         SET ${fields.join(", ")}
//         WHERE "id" = $${placeholderIndex}
//         RETURNING ${USER_SELECT_COLUMNS}, u."role_id" AS "roleId"
//     `;

//     const result = await pool.query<IUser>(query, values);
//     const user = result.rows[0] ?? null;
//     if (!user) return null;

//     return UserResponseSchema.parse(user);
// };
