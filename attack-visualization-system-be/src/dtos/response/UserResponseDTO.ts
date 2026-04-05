import { z } from "zod";
import { User } from "../../entities/User";

export const UserResponseSchema = z.object({
    id: z.uuid("v7"),
    username: z.string(),
    role: z.enum(["admin", "operator"]),
    createdAt: z.date()
});

export type UserResponseDTO = z.infer<typeof UserResponseSchema>;

export const toUserResponse = (user: User): UserResponseDTO => {
    return UserResponseSchema.parse({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
    });
};