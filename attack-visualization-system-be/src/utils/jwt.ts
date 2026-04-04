import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_for_dev";
const TOKEN_EXPIRATION = "1h"; // Set short lifetime to 1 hour

export function generateToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

export function verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
}
