import { Router } from "express";
import { authRouter } from "./auth.router";
import { attackRouter } from "./attack.router";

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
router.use("/attacks", attackRouter);

export { router };