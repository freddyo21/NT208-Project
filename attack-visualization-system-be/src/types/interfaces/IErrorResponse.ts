export interface IErrorResponse {
    status: "error" | "fail"; // "fail" cho 4xx, "error" cho 5xx
    error: {
        name: string;        // Ví dụ: "JwtInvalidException"
        statusCode: number;  // 401, 409...
        message: string;     // Thông báo cho User
        details?: any;       // Dữ liệu bổ sung (reason, validation errors...)
        path?: string;       // Endpoint gây lỗi
        timestamp: string;   // ISO string
        stack?: string;      // Chỉ xuất hiện ở Dev mode
    };
}