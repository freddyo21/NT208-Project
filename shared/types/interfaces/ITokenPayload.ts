import { JwtPayload } from "jsonwebtoken";

export interface ITokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    status: string;
}