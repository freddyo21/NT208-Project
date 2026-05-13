import { Request, Response, NextFunction } from "express";
import { validateLoginRequest } from "../utils/functions/auth.functions.js";
import * as authService from "../services/auth.service.js";
import { LoginResponseDTO, UserResponseSchema } from "@attack-visualization-system/shared";
import { InvalidCredentialException } from "../exceptions/InvalidCredentialException.js";
import jwt from "jsonwebtoken";
import { getKeys } from "../utils/key-generator.js";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export const login = async (req: Request, res: Response<LoginResponseDTO>, next: NextFunction) => {
  try {
    const { ...loginData } = req.body;

    const cleanData = validateLoginRequest(loginData);

    const { user, accessToken, refreshToken } = await authService.login(cleanData);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      ...(cleanData.rememberMe && { maxAge: REFRESH_TOKEN_EXPIRY * 1000 })
    });

    return res.status(200).json({
      message: "Logged in successfully.",
      user: UserResponseSchema.parse(user),
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    const isProduction = process.env.NODE_ENV === "production";

    if (!refreshToken || typeof refreshToken !== "string") {
      throw new InvalidCredentialException("Missing or invalid refresh token");
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/"
    });

    return res.status(200).json({
      message: "Tokens refreshed successfully.",
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: UserResponseSchema.parse(user)
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

export const demoToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Endpoint nay chi phuc vu demo socket.
    // Mac dinh nen tat; chi bat local bang ENABLE_DEMO_SOCKET_TOKEN=true.
    if (process.env.ENABLE_DEMO_SOCKET_TOKEN !== "true") {
      return res.status(404).json({ message: "Demo socket token is disabled." });
    }

    // Dung cung key ES256 voi backend auth that.
    // Nho vay socket middleware jwtVerify() se chap nhan token demo nay.
    const { privateKey } = getKeys();
    const issuer = process.env.JWT_ISSUER || "attack-visualization-system";

    // Payload can co sub vi websocket dung sub lam user id.
    // role=operator de socket join room role:operator nhu user that.
    const accessToken = jwt.sign(
      {
        iss: issuer,
        sub: "socket-demo-user",
        aud: issuer,
        email: "socket-demo@example.test",
        role: "operator",
        status: "active"
      },
      privateKey,
      {
        algorithm: "ES256",
        expiresIn: "15m"
      }
    );

    // Frontend Dashboard se goi endpoint nay de lay JWT khi bo qua login that.
    return res.status(200).json({
      message: "Demo socket token generated.",
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  } catch (err) {
    next(err);
  }
};
