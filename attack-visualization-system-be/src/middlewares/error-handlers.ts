import { Request, Response, NextFunction } from "express";
import { Exception } from "../exceptions/Exception";
import { Logger } from "../utils/Logger";
import { IErrorResponse } from "../types/interfaces/IErrorResponse";
import { NotFoundException } from "../exceptions/NotFoundException";

const systemLogger = new Logger("system");
const authLogger = new Logger("auth");

/**
 * Global error handler - must be registered after all routes
 */
export function errorHandler(
    err: any,
    req: Request,
    res: Response<IErrorResponse, Record<string, any>>,
    next: NextFunction
) {
    // Default to 500 if no status code
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;
    const isProduction = process.env.NODE_ENV === "production";

    if (statusCode >= 500 || !isOperational) {
        // Lỗi hệ thống hoặc lỗi chưa được xử lý (Unknown Error)
        systemLogger.error(`[CRITICAL] ${req.method} ${req.originalUrl}`, {
            message: err.message,
            stack: err.stack,
            ip: req.ip
        });
    } else if (statusCode === 401 || statusCode === 403) {
        // Lỗi an ninh (Unauthorized/Forbidden) -> Log để theo dõi dấu hiệu tấn công
        authLogger.error(`[AUTH_ALERT] ${req.ip} tried to access ${req.originalUrl}`, {
            reason: err.message,
            user: req.body?.username || "anonymous"
        });
    } else {
        systemLogger.debug(`[CLIENT_ERR] ${statusCode} - ${err.message}`);
    }

    // Send structured error response
    res.status(statusCode).json({
        status: statusCode >= 500 ? "error" : "fail",
        error: {
            name: err instanceof Exception ? err.name : "InternalServerException",
            statusCode,
            message: (statusCode === 500 && isProduction) ? "Internal server error" : err.message,
            ...(err.details && { details: err.details }),
            path: req.path,
            timestamp: new Date().toISOString(),
            ...(!isProduction && { stack: err.stack })
        }
    });
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
    next(new NotFoundException(`Route not found: ${req.method} ${req.path}`));
}