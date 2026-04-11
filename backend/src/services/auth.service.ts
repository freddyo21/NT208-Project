import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt-handler";
import { ConflictException, InvalidCredentialException } from "../exceptions";
import * as userRepository from "../repositories/user.repository";
import { CreateUserRequest, LoginRequestDTO, UserResponseSchema } from "@attack-visualization-system/shared";
import { hashPassword } from "../utils/hash";

export const login = async (data: LoginRequestDTO) => {
  try {
    const { email, password } = data;

    const normalizedEmail = email.trim().toLowerCase();

    const userRow = await userRepository.findByEmail(normalizedEmail);

    if (!userRow) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const safeUser = UserResponseSchema.parse(userRow);
    const token = generateToken(safeUser);

    return { user: safeUser, token };
  } catch (error) {
    if (error instanceof InvalidCredentialException) {
      throw error;
    }

    throw new Error("Authentication service failed");
  }
};

export const register = async (data: CreateUserRequest) => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existedUser = await userRepository.findByEmail(normalizedEmail);

  if (existedUser) {
    throw new ConflictException("Email already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  const createdUser = await userRepository.create({
    name: data.name,
    email: normalizedEmail,
    password_hash: hashedPassword
  });

  return UserResponseSchema.parse(createdUser);
};
