import { generateRefreshToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../utils/jwt-handler";
import { Exception, InvalidCredentialException } from "../exceptions";
import * as userRepository from "../repositories/user.repository";
import { LoginRequestDTO, LoginRequestSchema, UserResponseSchema, UserSchema } from "@attack-visualization-system/shared";
import { comparePassword } from "../utils/hash";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

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

    const parsedUser = UserSchema.parse(userRow);
    const accessToken = generateToken(parsedUser, ACCESS_TOKEN_EXPIRY);
    const refreshToken = generateRefreshToken(parsedUser.id, rememberMe ? "30d" : REFRESH_TOKEN_EXPIRY);

    const { passwordHash, ...userWithoutHash } = parsedUser;
    const safeUser = UserResponseSchema.parse(userWithoutHash);

    return { user: safeUser, accessToken, refreshToken };
  } catch (error) {
    if (error instanceof InvalidCredentialException) {
      throw error;
    }

    throw new Exception("Authentication service failed", 500);
  }
};

export const refreshTokens = async (refreshToken: string) => {
  const refreshTokenData = verifyRefreshToken(refreshToken);

  if (!refreshTokenData) {
    throw new InvalidCredentialException("Invalid or expired refresh token");
  }

  const user = await userRepository.findById(refreshTokenData.userId);

  if (!user) {
    revokeRefreshToken(refreshToken);
    throw new InvalidCredentialException("User not found");
  }

  const parsedUser = UserSchema.parse(user);
  const newAccessToken = generateToken(parsedUser, ACCESS_TOKEN_EXPIRY);
  const newRefreshToken = generateRefreshToken(parsedUser.id, REFRESH_TOKEN_EXPIRY);

  // Optionally revoke the old refresh token (Refresh Token Rotation)
  revokeRefreshToken(refreshToken);

  const { passwordHash, ...userWithoutHash } = parsedUser;
  const safeUser = UserResponseSchema.parse(userWithoutHash);

  return { user: safeUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken: string) => {
  revokeRefreshToken(refreshToken);

  // Khi logout, cần đẩy refreshToken và accessToken vào Redis để blacklist cho tới khi hết hạn
};