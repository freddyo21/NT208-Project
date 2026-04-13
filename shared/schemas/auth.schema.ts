import { z } from "zod";
import { UserResponseSchema } from "./user.schema";
import { snakeToCamelTransform } from "../utils";

export const LoginRequestSchema = z.object({
    email: z
        .email({ message: "Invalid email format" })
        .trim()
        .toLowerCase()
        .min(1, { message: "Email cannot be empty" })
        .max(100, { message: "Email cannot exceed 100 characters" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[a-z]/, { message: "Requires at least 1 lowercase letter" })
        .regex(/[A-Z]/, { message: "Requires at least 1 uppercase letter" })
        .regex(/[0-9]/, { message: "Requires at least 1 number" })
        .regex(/[^a-zA-Z0-9]/, { message: "Requires at least 1 special character" })
        .refine((val) => !val.includes("123456"), {
            message: "Password is too weak, don't use consecutive sequences!",
        }),
    remember_me: z.boolean().default(false)
}).strict().transform(snakeToCamelTransform);

export const LoginResponseSchema = z.object({
    message: z.string(),
    user: UserResponseSchema
});
