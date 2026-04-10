import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Logger } from "../utils/Logger";
import { jwtVerify } from "../auth/jwt-verify";
import { Exception, JwtInvalidException } from "../exceptions";
import { parseCookie } from "cookie";

export const socketInitialize = (httpServer: HttpServer) => {
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

        try {
            const user = jwtVerify(token);

            socket.data.user = user;
            next();
        } catch (err) {
            next(err instanceof JwtInvalidException ? err : new Exception("Unknown Auth Error"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user;
        logger.log("An user connected", { socketId: socket.id, userId: user.id });

        if (user?.role) {
            socket.join(`role:${user.role}`);
        }

        if (process.env.NODE_ENV !== "production") {
            socket.onAny((eventName, ...args) => {
                logger.debug(`Incoming Event: ${eventName}`, ...args);
            });
        }

        socket.on("disconnect", () => {
            const userId = user?.id;
            socket.data.isOnline = false;
            logger.log("An user disconnected", { socketId: socket.id, userId });
        });
    });

    return io;
};