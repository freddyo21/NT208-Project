import { Request, Response, NextFunction } from "express";
import { validateLoginRequest } from "../dtos/request/LoginRequestDTO";
import { formatTokenResponse } from "../dtos/response/TokenResponseDTO";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const cleanData = validateLoginRequest(req.body);
      
      const rawResult = await AuthService.login(cleanData.email, cleanData.password, res);
      
      const safeResponse = formatTokenResponse(rawResult);

      return res.status(200).json({
        status: "success",
        data: safeResponse
      });
    } catch (err) {
      next(err);
    }
  },
};