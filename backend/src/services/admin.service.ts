import { CreateUserRequest, CreateUserRequestSchema, UserResponseSchema } from "@attack-visualization-system/shared";
import * as userRepository from "../repositories/user.repository";
import { hashPassword } from "../utils/hash";
import { ConflictException } from "../exceptions";

export const getUsers = async () => {
    return userRepository.findAll();
};

const SALT_ROUNDS = 13; // Vừa đủ để đảm bảo an toàn mà không quá chậm cho trải nghiệm người dùng. Có thể điều chỉnh nếu cần thiết.
export const createUser = async (data: CreateUserRequest) => {
    const { name, email, password } = await CreateUserRequestSchema.parseAsync(data);

    const existedUser = await userRepository.findByEmail(email);

    if (existedUser) {
        throw new ConflictException("User already exists");
    }

    const hashedPassword = await hashPassword(password, SALT_ROUNDS);

    const createdUser = await userRepository.create({
        name,
        email,
        passwordHash: hashedPassword
    });

    return UserResponseSchema.parse(createdUser);
}