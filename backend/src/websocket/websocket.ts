import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Logger } from "../utils/Logger";
import { jwtVerify } from "../auth/jwt-verify";
import { Exception, JwtInvalidException } from "../exceptions";
import { parseCookie } from "cookie";

export const socketInitialize = async (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_CORS_ALLOWED_ORIGINS || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    const logger = new Logger();

    io.use((socket, next) => {
        let token = socket.handshake.auth?.token;

        if (!token && socket.request.headers.cookie) {
            const cookies = parseCookie(socket.request.headers.cookie);
            token = cookies.token; // "token" là key set ở HttpOnly Cookie
        }

        if (!token) {
            return next(new JwtInvalidException("No token provided"));
        }

        try {
            const user = jwtVerify(token);

            // Check token expiry
            if (user.exp && Date.now() / 1000 > user.exp) {
                return next(new JwtInvalidException("TOKEN_EXPIRED"));
            }

            // Validate user ID exists
            if (!user?.id) {
                return next(new JwtInvalidException("INVALID_USER_ID"));
            }

            socket.data.user = user;
            next();
        } catch (err) {
            next(err instanceof JwtInvalidException ? err : new Exception("Unknown Auth Error"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user;

        socket.join(`user:${user.id}`);
        if (user?.role) {
            socket.join(`role:${user.role}`);
        }

        logger.log("A user connected", {
            socketId: socket.id,
            userId: user.id,
            role: user.role
        });

        if (process.env.NODE_ENV !== "production") {
            socket.onAny((eventName, ...args) => {
                logger.debug(`Incoming Event: ${eventName}`, ...args);
            });
        }

        socket.on("disconnect", () => {
            const userId = user?.id;
            socket.data.isOnline = false;
            logger.log("A user disconnected", { socketId: socket.id, userId });
        });
    });

    return io;
};