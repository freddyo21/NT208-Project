import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { asyncHandler } from "../middlewares/error-handlers";

const authRouter = Router();

authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.post("/refresh", asyncHandler(authController.refresh));

// Route demo rieng cho Dashboard lay JWT de connect socket khi chua co user login.
// Controller van chan bang ENABLE_DEMO_SOCKET_TOKEN nen khong bat mac dinh.
authRouter.post("/demo-token", asyncHandler(authController.demoToken));

export { authRouter };
