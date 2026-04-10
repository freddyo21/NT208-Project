import { z } from "zod";
import { snakeToCamelTransform } from "../utils";

export const UserSchema = z.object({
    id: z.uuidv7(),
    name: z.string()
        .min(2, { message: "Name cannot be empty" })
        .max(50, { message: "Name cannot exceed 50 characters" }),
    email: z.email({ message: "Invalid email format" })
        .trim()
        .toLowerCase()
        .min(1, { message: "Email cannot be empty" })
        .max(100, { message: "Email cannot exceed 100 characters" }),
    password_hash: z.string().min(8), // Trường nhạy cảm
    role: z.enum(["admin", "operator"]).default("operator"),
    status: z.enum(["active", "inactive", "banned"]).default("active"),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    last_login: z.iso.datetime().nullable()
}).strict();

// Tạo một Schema mới loại bỏ passwordHash để trả về client
export const UserResponseSchema = UserSchema.omit({ password_hash: true }).transform(snakeToCamelTransform);

export const CreateUserRequestSchema = UserSchema.omit({
    id: true,
    password_hash: true,
    created_at: true,
    updated_at: true,
    last_login: true
}).extend({
    password: z.string().min(8), // Client gửi pass thô, không phải hash
}).strict();

export const UpdateUserRequestSchema = UserSchema.pick({
    name: true,
    status: true
}).partial().strict();

export const ChangePasswordRequestSchema = z.object({
    old_password: z.string().min(1), // Không cần min(8) ở đây, cứ có là được để check
    new_password: z.string()
        .min(8, "New password must be at least 8 characters")
        .max(50, "Password too long"),
    confirm_password: z.string()
}).strict().refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"], // Báo lỗi đúng vào field confirm
}).refine((data) => data.old_password !== data.new_password, {
    message: "New password must be different from the old one",
    path: ["new_password"],
}).transform(snakeToCamelTransform);