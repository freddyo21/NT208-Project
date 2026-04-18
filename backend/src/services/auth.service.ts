import { generateToken } from "../utils/jwt-handler";
import { InvalidCredentialException } from "../exceptions";
import * as userRepository from "../repositories/user.repository";
import { LoginRequestDTO, LoginRequestSchema, UserResponseSchema } from "@attack-visualization-system/shared";
import { comparePassword } from "../utils/hash";

const EXPIRY_SHORT = 3600;
const EXPIRY_LONG = 2592000; // 30 Days (3600 * 24 * 30)

export const login = async (data: LoginRequestDTO) => {
  try {
    const { email, password, rememberMe } = await LoginRequestSchema.parseAsync(data);

    const normalizedEmail = email.trim().toLowerCase();

    const userRow = await userRepository.findByEmail(normalizedEmail);

    if (!userRow) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const isMatch = await comparePassword(password, userRow.passwordHash);
    if (!isMatch) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const safeUser = UserResponseSchema.parse(userRow);
    const accessToken = generateToken(safeUser, rememberMe ? EXPIRY_LONG : EXPIRY_SHORT);

    return { user: safeUser, accessToken };
  } catch (error) {
    if (error instanceof InvalidCredentialException) {
      throw error;
    }

    throw new Error("Authentication service failed");
  }
};