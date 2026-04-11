import { NextFunction, Request, Response } from "express";
import { validateToken } from "../utils/jwt-handler";
import { JwtPayload } from "jsonwebtoken";
import { JwtInvalidException } from "../exceptions";

type JwtRequest = Request & {
    user?: string | JwtPayload;
};

const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }

    if (req.cookies?.token && typeof req.cookies.token === "string") {
        return req.cookies.token;
    }

    return null;
};

export const authMiddleware = (req: JwtRequest, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
        return next(new JwtInvalidException("Missing authorization token"));
    }

    const payload = validateToken(token);
    req.user = payload;

    return next();
};
