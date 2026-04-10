
import { z } from "zod";
import { LoginRequestSchema, LoginResponseSchema } from "../schemas/auth.schema";

export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;

export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>;