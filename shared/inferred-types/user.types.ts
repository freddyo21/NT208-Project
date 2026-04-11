import { z } from "zod";
import { ChangePasswordRequestSchema, CreateUserRequestSchema, UserResponseSchema, UserSchema } from "../schemas/user.schema";

export type IUser = z.infer<typeof UserSchema>;

// Type cho dữ liệu trả về client
export type IUserResponse = z.infer<typeof UserResponseSchema>;

export type ICreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export type IUpdateUserRequest = Partial<Pick<IUser, "name" | "role" | "status">>;

export type IChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;