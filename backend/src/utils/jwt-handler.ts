import jwt from "jsonwebtoken";
import { Logger } from "../utils/Logger";
import { JwtInvalidException } from "../exceptions";
import { UserResponse, ITokenPayload } from "@attack-visualization-system/shared";
import { getKeys } from "./key-generator";
import ms from "ms";

const logger = new Logger("jwt");

type RefreshTokenRecord = {
    userId: string;
    expiresAt: number;
};

const refreshTokenStore = new Map<string, RefreshTokenRecord>();

// Cần bỏ sau khi đã có Redis để blacklist refresh token
const cleanupExpiredRefreshTokens = () => {
    const now = Date.now();
    for (const [token, record] of refreshTokenStore.entries()) {
        if (record.expiresAt <= now) {
            refreshTokenStore.delete(token);
        }
    }
};

// export const extractToken = (req: Request): string | null => {
//     const token = req.cookies?.token;

//     if (token && typeof token === "string") {
//         return token;
//     }

//     return null;
// };

const generateRefreshTokenString = (): string => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};

export const generateToken = (user: UserResponse, expiresIn: ms.StringValue = "1h") => {
    const { privateKey } = getKeys();

    const payload: ITokenPayload = {
        iss: process.env.JWT_ISSUER,    // Issuer of the token
        sub: user.id,                   // Subject of the token
        aud: process.env.JWT_ISSUER,    // Audience of the token
        email: user.email,
        role: user.role,
        status: user.status
    };

    return jwt.sign(
        payload,
        privateKey,
        {
            algorithm: "ES256",
            expiresIn,
        }
    );
};

export const generateRefreshToken = (userId: string, expiresIn: ms.StringValue = "7d") => {
    cleanupExpiredRefreshTokens();

    const refreshTokenString = generateRefreshTokenString();
    const expiresAtMs = Date.now() + ms(expiresIn);

    refreshTokenStore.set(refreshTokenString, {
        userId,
        expiresAt: expiresAtMs,
    });

    return refreshTokenString;
};

export const verifyRefreshToken = (refreshToken: string): { userId: string } | null => {
    cleanupExpiredRefreshTokens();

    const record = refreshTokenStore.get(refreshToken);

    if (!record) {
        return null;
    }

    if (record.expiresAt <= Date.now()) {
        refreshTokenStore.delete(refreshToken);
        return null;
    }

    return { userId: record.userId };
};

export const revokeRefreshToken = (refreshToken: string) => {
    refreshTokenStore.delete(refreshToken);
};

export const validateToken = (token: string) => {
    try {
        const { publicKey } = getKeys();

        const decoded = jwt.verify(token, publicKey, {
            algorithms: ["ES256"],
            clockTolerance: 30
        }) as ITokenPayload;

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
