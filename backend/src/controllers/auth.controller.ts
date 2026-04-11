import { Request, Response, NextFunction } from "express";
import { validateLoginRequest, validateRegisterRequest } from "../utils/functions/auth.functions.js";
import * as authService from "../services/auth.service.js";
import { LoginResponseDTO, UserResponse } from "@attack-visualization-system/shared";

const EXPIRY_LONG = 2592000; // 30 days (3600 * 24 * 30)
export const login = async (req: Request, res: Response<LoginResponseDTO>, next: NextFunction) => {
  try {
    const { ...loginData } = req.body;

    const cleanData = validateLoginRequest(loginData);

    const { user, accessToken } = await authService.login(cleanData);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      ...(cleanData.rememberMe && { maxAge: EXPIRY_LONG * 1000 })
    });

    return res.status(200).json({
      user,
      accessToken
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req: Request, res: Response<{ user: UserResponse }>, next: NextFunction) => {
  try {
    const registerData = validateRegisterRequest(req.body);
    const user = await authService.register(registerData);

    return res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};
