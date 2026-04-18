import { JwtPayload } from "jsonwebtoken";

export interface ITokenPayload extends JwtPayload {
    email: string;
    role: string;
    status: string;
}