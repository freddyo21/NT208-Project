import { Router } from "express";
import { authRouter } from "./auth.router";
import { attackRouter } from "./attack.router";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminRouter } from "./admin.router";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router: Router = Router();

router.get("/ping", (req, res) => {
    res.send({
        message: "Pong! Backend is alive!",
        timestamp: new Date().toISOString()
    });
});

router.use("/admin", adminMiddleware, adminRouter);
router.use("/auth", authRouter);

// This endpoint is just for testing purposes. In real scenario, 
// attack events would come from other sources (e.g., message queue, database triggers, etc.)
router.use("/attacks", authMiddleware, attackRouter);

export { router };
