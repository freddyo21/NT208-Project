import("dotenv").then((dotenv) => {
    if (process.env.NODE_ENV !== "production") {
        dotenv.config()
    }
}).then(() => {
    initializeApp();
});;

import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import { errorHandler, notFoundHandler } from "./middlewares/error-handlers";
import { router } from "./routes";
import { globalLimiter } from "./middlewares/rate-limiter";
import helmet from "helmet";
import { socketInitialize } from "./websocket";
import { createServer } from "http";
import cookieParser from "cookie-parser";

async function initializeApp() {
    const app = express();

    setupMiddleware(app);
    setupRoutes(app);
    setupErrorHandling(app);

    const httpServer = createServer(app);
    await socketInitialize(httpServer);

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`Attack Visualization System is running on port ${PORT}`);
    });
}

function setupMiddleware(app: Application) {
    app.set("trust proxy", 1);
    app.use(helmet());

    /**
     * ---------------------------------------------------------
     * 1. CORS & PARSER
     * ---------------------------------------------------------
     */
    const allowedOrigins = (process.env.FRONTEND_CORS_ALLOWED_ORIGINS || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

    const corsOptions: cors.CorsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g., curl, mobile apps, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
        allowedHeaders: [
            "X-Requested-With",
            "Content-Type",
            "Accept",
            "Authorization",
        ],
        credentials: true, // Remove if not using cookies
        preflightContinue: false,
        optionsSuccessStatus: 200,
    };

    // Ensure CORS headers (especially credentials) are set for preflight requests
    app.options(/(.*)/, cors(corsOptions));
    app.use(cors(corsOptions));
    app.use(compression());
    app.use(cookieParser());
    app.use(express.json({ limit: "50kb" }));

    /**
     * ---------------------------------------------------------
     * 2. LOGGER (For debugging)
     * ---------------------------------------------------------
     */
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

function setupRoutes(app: Application) {
    /**
     * ---------------------------------------------------------
     * 3. PUBLIC ROUTES (No need for protection)
     * ---------------------------------------------------------
     */

    // Remove this logic for production
    app.get("/", (req: Request, res: Response) => res.send("Hello World!"));

    /**
     * ---------------------------------------------------------
     * 4. PROTECTED ROUTES (Require protection)
     * ---------------------------------------------------------
     */
    app.use("/api/v1", globalLimiter, router);

    /** This is the place where updated version codes run */
    // app.use(
    //     "/api/v2",
    //     globalLimiter,
    //     router
    // );

    // app.use(
    //     "/api/v3",
    //     globalLimiter,
    //     router
    // );
}


/**
 * ---------------------------------------------------------
 * 5. ERROR HANDLING (Centralized error handling)
 * ---------------------------------------------------------
 */
function setupErrorHandling(app: Application) {
    app.use(notFoundHandler);

    // Global error handler
    app.use(errorHandler);
}