import { Request, Response, Router } from "express";
import * as attackController from "../controllers/attack.controller";

const attackRouter = Router();

attackRouter.post("/", attackController.attack);

attackRouter.get("/history", (req, res) => {
    res.send({
        message: "Attack history endpoint hit!",
        timestamp: new Date().toISOString()
    });
});

attackRouter.get("/stats", (req: Request, res: Response) => {
    const { type, range } = req.query as { type?: string; range?: string };

    res.send({
        message: "Attack status endpoint hit!",
        timestamp: new Date().toISOString()
    });
});

export { attackRouter };