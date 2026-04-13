import { generateToken } from "../utils/jwt-handler";
import { InvalidCredentialException } from "../exceptions";
import * as userRepository from "../repositories/user.repository";
import { LoginRequestDTO, UserResponseSchema } from "@attack-visualization-system/shared";
import { comparePassword } from "../utils/hash";

export const login = async (data: LoginRequestDTO) => {
  try {
    const { email, password } = data;

    const normalizedEmail = email.trim().toLowerCase();

    const userRow = await userRepository.findByEmail(normalizedEmail);

    if (!userRow) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const isMatch = await comparePassword(password, userRow.password_hash);
    if (!isMatch) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const safeUser = UserResponseSchema.parse(userRow);
    const accessToken = generateToken(safeUser);

    return { user: safeUser, accessToken };
  } catch (error) {
    if (error instanceof InvalidCredentialException) {
      throw error;
    }

    throw new Error("Authentication service failed");
  }
};