import { z } from "zod";

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    role: z.string(),
  })
});

export type TokenResponseDTO = z.infer<typeof TokenResponseSchema>;

export const formatTokenResponse = (data: any): TokenResponseDTO => {
  return TokenResponseSchema.parse(data);
};