import jwt from "jsonwebtoken";
import { Logger } from "../utils/Logger";
import { JwtInvalidException } from "../exceptions";
import { UserResponse } from "@attack-visualization-system/shared";

const logger = new Logger("jwt");

const getSecretKey = (): string => {
    const key = process.env.JWT_SECRET_KEY;
    const hasKey = key && key.trim().length > 0;

    if (!hasKey) {
        throw new JwtInvalidException("Secret key is missing or empty in environment configuration.");
    }

    return key;
};

export const generateToken = (user: UserResponse, expireTime: number = 3600) => {
    const issuedAt = Number(new Date());

    const payload = {
        iss: process.env.JWT_ISSUER,    // Issuer of the token
        sub: user.id,                   // Subject of the token
        aud: process.env.JWT_ISSUER,    // Audience of the token
        iat: issuedAt
    };

    return jwt.sign(
        payload,
        getSecretKey(),
        {
            algorithm: "HS512" as const,
            expiresIn: expireTime
        }
    );
};

export const validateToken = (token: string) => {
    try {
        const secret = getSecretKey();

        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256", "HS384", "HS512"],
            clockTolerance: 30
        });

        const isRequiredClaimsExist = decoded.sub;

        if (!isRequiredClaimsExist) {
            // If the token is valid but missing required claims, consider it invalid
            throw new JwtInvalidException("Token is missing required claims.");
        }

        return decoded;
    } catch (ex: any) {
        let message = "Token validation failed";
        let reason = "Unknown JWT error";

        if (ex instanceof jwt.TokenExpiredError) {
            message = "Token has expired";
            reason = "TokenExpiredError";
        } else if (ex instanceof jwt.JsonWebTokenError) {
            message = "Token is invalid or has been tampered with";
            reason = "JsonWebTokenError";
        } else if (ex instanceof jwt.NotBeforeError) {
            message = "Token is not yet valid (not active)";
            reason = "NotBeforeError";
        }

        logger.error(`[JWT_FAILED] ${reason}: ${ex.message || message}`, {
            // Log 10 ký tự đầu/cuối là đủ trace
            tokenSnippet: `${token.substring(0, 10)}...${token.slice(-10)}`,
            originalError: ex.name,
            // stack: reason === "Unknown JWT error" && ex.stack ? ex.stack : undefined
            stack: ex.stack
        });

        // Convert all JWT-related errors to JwtInvalidException
        // This error will be caught by the Global Error Handler and returned as 401
        throw new JwtInvalidException(`Token validation failed: ${message}`, 401, { reason });
    }
};