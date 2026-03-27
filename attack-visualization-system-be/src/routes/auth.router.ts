import { Router } from "express";

const authRouter = Router();

authRouter.post("/login", (req, res) => {
    res.send({
        message: "Login endpoint hit!",
        timestamp: new Date().toISOString()
    });
});

export { authRouter };