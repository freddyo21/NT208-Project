import { NextFunction, Request, Response } from "express";
import { JwtInvalidException } from "../exceptions";
import { validateToken } from "../utils/jwt-handler";
import { JwtRequest } from "../types/JwtRequest";
import { getBearerToken } from "../auth/jwt-verify";

export const adminMiddleware = (req: JwtRequest, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);

    if (!token) {
        return next(new JwtInvalidException("Missing authorization token"));
    }

    try {
        const payload = validateToken(token);

        const userRole = payload.role;
        if (userRole !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        req.user = payload;
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
        return next(error);
    }

    return next();
};