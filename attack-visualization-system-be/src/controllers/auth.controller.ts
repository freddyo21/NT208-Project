import { Request, Response, NextFunction } from "express";
import { validateLoginRequest } from "../dtos/request/LoginRequestDTO";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const cleanData = validateLoginRequest(req.body);

    const rawResult = await authService.login(cleanData.email, cleanData.password, res);

    return res.status(200).json({
      status: "success",
      data: {
        user: rawResult.user
      }
    });
  } catch (err) {
    next(err);
  }
}