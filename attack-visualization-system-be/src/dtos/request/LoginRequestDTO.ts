import { z } from "zod";
import { Exception } from "../../exceptions/Exception";

export const LoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email cannot be empty" })
    .email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[a-z]/, { message: "Requires at least 1 lowercase letter" })
    .regex(/[A-Z]/, { message: "Requires at least 1 uppercase letter" })
    .regex(/[0-9]/, { message: "Requires at least 1 number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Requires at least 1 special character" }),
});

export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;

export const validateLoginRequest = (data: any): LoginRequestDTO => {
  const result = LoginRequestSchema.safeParse(data);
  if (!result.success) {
    throw new Exception("Validation Error", 400, result.error.issues);
  }
  return result.data;
};