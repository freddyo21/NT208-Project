import * as userService from "../services/admin.service";
import { Request, Response, NextFunction } from "express";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getUsers();
        return res.status(200).json({ users });
    } catch (err) {
        next(err);
    }
};

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