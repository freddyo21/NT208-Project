import * as userService from "../services/admin.service";
import { Request, Response, NextFunction } from "express";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const registerData = req.body;
        const user = await userService.createUser(registerData);

        return res.status(201).json({
            message: "User created successfully.",
            user
        });
    } catch (err) {
        next(err);
    }
};