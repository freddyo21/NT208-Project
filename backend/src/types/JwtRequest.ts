import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export type JwtRequest = Request & {
    user?: string | JwtPayload;
};