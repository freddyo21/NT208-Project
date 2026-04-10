import { Request, Response, NextFunction } from "express";
import { Exception } from "../exceptions";

/**
 * Global error handler - must be registered after all routes
 */

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Default to 500 if no status code
    const statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    console.error("[ERROR] :", {
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        stack: err.stack,
    });

    if (process.env.NODE_ENV !== "production") {
        res.status(statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            ...(err.details && { details: err.details }),
            stack: err.stack
        });
    } else {
        if (err.isOperational) {
            res.status(statusCode).json({
                status: err.status,
                message: err.message,
                ...(err.details && { details: err.details }),
            });
        } else {
            res.status(500).json({
                status: "error",
                message: "Internal server error"
            });
        }
    }
}

/**
 * Async route wrapper - catches promise rejections automatically
 * Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 handler - catches all unmatched routes
 */
export function notFoundHandler(
    req: Request,
    res: Response,
    next: NextFunction
) {
    next(new Exception(`Route not found: ${req.method} ${req.path}`, 404));
}
