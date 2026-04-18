import { NextFunction, Request, Response } from "express";
import { validateToken } from "../utils/jwt-handler";
import { JwtPayload } from "jsonwebtoken";
import { JwtInvalidException } from "../exceptions";

type JwtRequest = Request & {
    user?: string | JwtPayload;
};

const extractToken = (req: Request): string | null => {
    const token = req.cookies?.token;

    if (token && typeof token === "string") {
        return token;
    }

    return null;
};

export const authMiddleware = (req: JwtRequest, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
        return next(new JwtInvalidException("Missing authorization token"));
    }

    try {
        const payload = validateToken(token);
        req.user = payload;
    } catch (error) {
        return next(error);
    }

    return next();
};
