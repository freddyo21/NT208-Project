import { JwtInvalidException } from "../exceptions";
import * as JwtHandler from "../utils/jwt-handler";

export const jwtVerify = (token: string) => {
    if (!token) throw new JwtInvalidException("Missing authorization token");

    const user = JwtHandler.validateToken(token);

    if (!user) {
        throw new JwtInvalidException("Unauthorized: Invalid or expired token");
    }

    return user;
};