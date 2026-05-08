import { z } from "zod";
import { ERoles } from "../types";

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
    passwordHash: z.string().min(8), // Trường nhạy cảm
    role: z.enum(ERoles).default(ERoles.OPERATOR),
    status: z.enum(["active", "inactive", "pending", "banned"]).default("active"),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLogin: z.date().nullable()
}).strict();

// Tạo một Schema mới loại bỏ passwordHash để trả về client
export const UserResponseSchema = UserSchema.omit({ passwordHash: true });

export const CreateUserRequestSchema = UserSchema.omit({
    id: true,
    passwordHash: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    lastLogin: true
}).extend({
    password: z.string().min(8), // Client gửi pass thô, không phải hash
}).strict();

export const CreateUserResponseSchema = z.object({
    message: z.string(),
    user: UserResponseSchema
}).strict();

export const UpdateUserRequestSchema = UserSchema.pick({
    name: true
}).partial().strict();

export const UpdateUserResponseSchema = z.object({
    message: z.string(),
    user: UserResponseSchema
}).strict();

export const ChangePasswordRequestSchema = z.object({
    oldPassword: z.string().min(1, { message: "Old password cannot be empty" }), // Không cần min(8) ở đây, cứ có là được để check
    newPassword: z.string()
        .min(8, { message: "New password must be at least 8 characters" })
        .max(50, { message: "Password too long" }),
    confirmPassword : z.string()
}).strict()
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"], // Báo lỗi đúng vào field confirm
    }).refine((data) => data.oldPassword !== data.newPassword, {
        message: "New password must be different from the old one",
        path: ["newPassword"],
    });