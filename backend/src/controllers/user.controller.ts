import * as userService from "../services/user.service";
import { Request, Response, NextFunction } from "express";

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const registerData = req.body;
        const user = await userService.create(registerData);

        return res.status(201).json({ user });
    } catch (err) {
        next(err);
    }
};