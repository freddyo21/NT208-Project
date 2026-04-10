import { Request, Response } from "express";
import * as attackService from "../services/attack.service";

// Controller function to handle incoming attack events (for testing purposes)
export const attack = async (req: Request, res: Response) => {
    try {
        await attackService.attack();
        res.status(200).json({ message: "Attack event processed." });
    } catch (error) {
        
    }
};