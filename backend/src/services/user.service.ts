import { CreateUserRequest, UserResponseSchema } from "@attack-visualization-system/shared";
import * as userRepository from "../repositories/user.repository";
import { hashPassword } from "../utils/hash";
import { ConflictException } from "../exceptions";

const SALT_ROUNDS = 13; // Vừa đủ để đảm bảo an toàn mà không quá chậm cho trải nghiệm người dùng. Có thể điều chỉnh nếu cần thiết.
export const create = async (data: CreateUserRequest) => {
    const { name, email, password } = data;

    const normalizedEmail = email.trim().toLowerCase();

    const existedUser = await userRepository.findByEmail(normalizedEmail);

    if (existedUser) {
        throw new ConflictException("User already exists");
    }

    const hashedPassword = await hashPassword(password, SALT_ROUNDS);

    const createdUser = await userRepository.create({
        name,
        email: normalizedEmail,
        passwordHash: hashedPassword
    });

    return UserResponseSchema.parse(createdUser);
}