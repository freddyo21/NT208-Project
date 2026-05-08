import { z } from "zod";
import { Logger } from "../Logger.js";
import { BadRequestException } from "../../exceptions/index.js";
import { CreateUserRequest, CreateUserRequestSchema, LoginRequestDTO, LoginRequestSchema } from "@attack-visualization-system/shared";

const logger = new Logger("auth-functions");

export const validateLoginRequest = (data: Record<string, unknown>): LoginRequestDTO => {
  const result = LoginRequestSchema.safeParse(data);

  if (!result.success) {
    logger.error("Login request validation failed", {
      input: {
        ...data,
        password: typeof data.password === "string" ? "*".repeat(data.password.length) : undefined
      },
      error: process.env.NODE_ENV === "production" ? z.treeifyError(result.error) : result.error.issues
    });

    throw new BadRequestException("Validation Error", result.error.issues);
  }

  return result.data;
};

export const validateRegisterRequest = (data: Record<string, unknown>): CreateUserRequest => {
  const result = CreateUserRequestSchema.safeParse(data);

  if (!result.success) {
    logger.error("Register request validation failed", {
      input: {
        ...data,
        password: typeof data.password === "string" ? "*".repeat(data.password.length) : undefined
      },
      error: process.env.NODE_ENV === "production" ? z.treeifyError(result.error) : result.error.issues
    });

    throw new BadRequestException("Validation Error", result.error.issues);
  }

  return result.data;
};
