import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { asyncHandler } from "../middlewares/error-handlers";

const adminRouter = Router();

adminRouter.post("/user/create", asyncHandler(adminController.createUser));

export { adminRouter };