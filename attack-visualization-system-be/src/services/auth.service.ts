import { Response } from "express";
import { AuthRepository } from "../repositories/auth.repository";
import { comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { InvalidCredentialException } from "../exceptions/InvalidCredentialException";

export const AuthService = {
  async login(emailInput: string, passwordInput: string, res: Response) {
    const user = await AuthRepository.findByEmail(emailInput);

    if (!user) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const isMatch = await comparePassword(passwordInput, user.password);
    if (!isMatch) {
      throw new InvalidCredentialException("Invalid email or password");
    }

    const accessToken = generateToken(user as any);

    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("token", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 3600000
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    };
  },
};