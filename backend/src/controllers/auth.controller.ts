import { Request, Response, NextFunction } from "express";
import { validateLoginRequest } from "../utils/functions/auth.functions.js";
import * as authService from "../services/auth.service.js";
import { LoginResponseDTO } from "@attack-visualization-system/shared";

const EXPIRY_LONG = 2592000; // 30 Ngày (3600 * 24 * 30)
export const login = async (req: Request, res: Response<LoginResponseDTO>, next: NextFunction) => {
  try {
    const { ...loginData } = req.body;

    const cleanData = validateLoginRequest(loginData);

    const { user, token } = await authService.login(cleanData);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      ...(cleanData.rememberMe && { maxAge: EXPIRY_LONG * 1000 })
    });

    return res.status(200).json({
      user
    });
  } catch (err) {
    next(err);
  }
};