import { Router } from "express";
import * as attackController from "../controllers/attack.controller";
import { authRouter } from "./auth.router";

const router: Router = Router();

router.get("/ping", (req, res) => {
    res.send({
        message: "Pong! Backend is alive!",
        timestamp: new Date().toISOString()
    });
});

router.use("/auth", authRouter);

// This endpoint is just for testing purposes. In real scenario, 
// attack events would come from other sources (e.g., message queue, database triggers, etc.)
router.post("/new-attack", attackController.attack);

router.post("/attack", (req, res) => {
    res.send({
        message: "Attack endpoint hit!",
        timestamp: new Date().toISOString()
    });
});

router.get("/attack-history", (req, res) => {
    res.send({
        message: "Attack history endpoint hit!",
        timestamp: new Date().toISOString()
    });
});

export { router };