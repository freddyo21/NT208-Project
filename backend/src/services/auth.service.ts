import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt-handler";
import { InvalidCredentialException } from "../exceptions";
import * as userRepository from "../repositories/user.repository";
import { LoginRequestDTO, UserResponseSchema } from "@attack-visualization-system/shared";

export const login = async (data: LoginRequestDTO) => {
  try {
    const { email, password } = data;

    const normalizedEmail = email.trim().toLowerCase();

    const userRow = await userRepository.findByEmail(normalizedEmail);

    if (!userRow) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, userRow.passwordHash);
    if (!isMatch) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const token = generateToken(userRow);
    const safeUser = UserResponseSchema.parse(userRow);

    return { user: safeUser, token };
  } catch (error) {
    if (error instanceof InvalidCredentialException) {
      throw error;
    }

    throw new Error("Authentication service failed");
  }
};