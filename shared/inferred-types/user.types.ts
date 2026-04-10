import { z } from "zod";
import { ChangePasswordRequestSchema, CreateUserRequestSchema, UserResponseSchema, UserSchema } from "../schemas/user.schema";

export type User = z.infer<typeof UserSchema>;

// Type cho dữ liệu trả về client
export type UserResponse = z.infer<typeof UserResponseSchema>;

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export type UpdateUserRequest = Partial<Pick<User, "name" | "role" | "status">>;

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;