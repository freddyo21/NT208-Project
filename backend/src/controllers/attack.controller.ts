import { NextFunction, Request, Response } from "express";
import * as attackService from "../services/attack.service";

// Controller function to handle incoming attack events (for testing purposes)
export const attack = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Endpoint test/demo:
        // 1. Nhan attack tu REST API.
        // 2. Service tao event demo.
        // 3. Service broadcast event do qua Socket.IO.
        const event = await attackService.attack(req.body);

        // Tra event ve response de script test co the so sanh voi attack:new nhan duoc.
        res.status(200).json({ message: "Attack event processed.", event });
    } catch (error) {
        // Day loi ve global error handler thay vi swallow error.
        next(error);
    }
};
