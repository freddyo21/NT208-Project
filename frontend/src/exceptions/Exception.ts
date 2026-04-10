export class Exception extends Error {
    public statusCode: number;
    public details: any;
    public isOperational: boolean;

    constructor(message: string, statusCode = 500, details: any = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Distinguishes from programming errors
        Error.captureStackTrace(this, this.constructor);
    }
}