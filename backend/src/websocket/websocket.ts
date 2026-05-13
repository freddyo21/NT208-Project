import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Logger } from "../utils/Logger";
import { jwtVerify } from "../auth/jwt-verify";
import { Exception, JwtInvalidException } from "../exceptions";
import { parseCookie } from "cookie";
import { createSocketRateLimiter } from "../middlewares/socket.limiter";

type AttackFilter = {
    // Client co the gui danh sach loai attack muon nhan.
    // Vi du: ["DDOS", "SQL_INJECTION"].
    attackTypes?: string[];

    // Client co the gui danh sach muc do nguy hiem muon nhan.
    // Vi du: ["HIGH", "CRITICAL"].
    severities?: string[];
};

export type SocketAttackEvent = {
    // Kieu event chung ma websocket se broadcast ve frontend.
    // Service attack se tao object theo shape nay roi goi emitAttackEvent().
    id: string;
    type: string;
    severity: string;
    sourceIp: string;
    timestamp: string;
    assetId?: string;
    [key: string]: unknown;
};

type SocketAckResponse = {
    // Ack la callback tra loi cho client sau khi client emit attack:subscribe.
    // ok=true nghia la backend da nhan filter va luu vao socket.data.
    ok: boolean;
    error?: string;
    filter?: AttackFilter;
};

// Giu reference toi Socket.IO server de cac module khac co the broadcast event.
// Vi du: attack.service.ts khong tao server moi, no chi goi emitAttackEvent().
let ioServer: Server | null = null;

const normalizeStringArray = (value: unknown): string[] | undefined => {
    // Socket payload la du lieu tu client nen phai coi la unknown.
    // Ham nay chi chap nhan array string, bo qua item sai kieu.
    if (!Array.isArray(value)) return undefined;

    const values = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);

    return values.length > 0 ? values : undefined;
};

const parseAttackFilter = (payload: unknown): AttackFilter => {
    // attack:subscribe co payload tuy chon.
    // Neu client khong gui filter thi filter rong, nghia la nhan tat ca attack.
    const raw = payload && typeof payload === "object"
        ? payload as Record<string, unknown>
        : {};
    const filter: AttackFilter = {};
    const attackTypes = normalizeStringArray(raw.attackTypes);
    const severities = normalizeStringArray(raw.severities);

    if (attackTypes) filter.attackTypes = attackTypes;
    if (severities) filter.severities = severities;

    return filter;
};

const matchesAttackFilter = (event: SocketAttackEvent, filter?: AttackFilter): boolean => {
    // Neu client co filter attackTypes thi chi gui event dung type.
    if (filter?.attackTypes?.length && !filter.attackTypes.includes(event.type)) {
        return false;
    }

    // Neu client co filter severities thi chi gui event dung severity.
    if (filter?.severities?.length && !filter.severities.includes(event.severity)) {
        return false;
    }

    return true;
};

export const emitAttackEvent = (event: SocketAttackEvent): boolean => {
    // Neu Socket.IO chua khoi tao thi khong the broadcast.
    // return false giup caller biet la khong co server socket dang song.
    if (!ioServer) {
        return false;
    }

    // Duyet tung socket dang ket noi.
    // Moi socket co the co filter rieng trong socket.data.attackFilter.
    ioServer.sockets.sockets.forEach((socket) => {
        const filter = socket.data.attackFilter as AttackFilter | undefined;

        if (matchesAttackFilter(event, filter)) {
            // attack:new la event realtime chinh ma Dashboard dang lang nghe.
            socket.emit("attack:new", event);
        }
    });

    return true;
};

export const socketInitialize = async (httpServer: HttpServer) => {
    // Gan Socket.IO vao chung HTTP server cua Express.
    // Nhu vay API REST va websocket cung chay tren port backend 3000.
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_CORS_ALLOWED_ORIGINS || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });
    ioServer = io;

    const logger = new Logger();

    // Rate limit rieng cho socket event.
    // O day chi gioi han attack:subscribe de tranh client spam subscribe lien tuc.
    const attackLimiter = createSocketRateLimiter({
        rules: {
            "attack:subscribe": {
                windowMs: 60_000,
                max: 20,
                blockDurationMs: 30_000
            }
        },
        onRateLimited: (socket, eventName, { retryAfterMs }) => {
            // Gui event rieng ve client de frontend/script biet minh bi rate limit.
            socket.emit("socket:rate_limited", {
                eventName,
                retryAfterMs
            });
        }
    });

    io.use((socket, next) => {
        // Socket.IO cho phep gui token qua handshake.auth.
        // Frontend dang connect bang: io(SOCKET_URL, { auth: { token } }).
        let token = socket.handshake.auth?.token;

        if (!token && socket.request.headers.cookie) {
            // Fallback neu sau nay dung cookie HttpOnly cho socket.
            const cookies = parseCookie(socket.request.headers.cookie);
            token = cookies.token;
        }

        if (!token) {
            // Khong co token thi chan ket noi ngay tu middleware.
            return next(new JwtInvalidException("No token provided"));
        }

        try {
            // jwtVerify dung cung logic validate token voi backend auth.
            const user = jwtVerify(token);

            // Payload JWT cua project dung sub lam user id.
            // Truoc do code doc user.id nen socket room bi sai.
            const userId = user.sub;

            if (!userId) {
                return next(new JwtInvalidException("INVALID_USER_ID"));
            }

            // socket.data la noi gan metadata rieng cho tung connection.
            // Cac handler phia sau co the doc user/userId tu day.
            socket.data.user = user;
            socket.data.userId = userId;
            next();
        } catch (err) {
            // Neu token sai/het han thi Socket.IO se bao connect_error ve client.
            next(err instanceof JwtInvalidException ? err : new Exception("Unknown Auth Error"));
        }
    });

    io.on("connection", (socket: Socket) => {
        // Sau khi qua middleware auth thanh cong, connection moi chay vao day.
        const user = socket.data.user;
        const userId = socket.data.userId;

        // Gan rate-limit middleware cho cac packet/event cua socket nay.
        socket.use(attackLimiter.middleware(socket));

        // Room user:<id> de sau nay co the gui rieng cho mot user.
        socket.join(`user:${userId}`);
        if (user?.role) {
            // Room role:<role> de sau nay gui rieng cho operator/admin.
            socket.join(`role:${user.role}`);
        }

        logger.log("A user connected", {
            socketId: socket.id,
            userId,
            role: user.role
        });

        socket.on(
            "attack:subscribe",
            (payload: unknown, ack?: (response: SocketAckResponse) => void) => {
                // Client goi attack:subscribe de dang ky filter attack muon nhan.
                // Demo Dashboard hien gui filter rong => nhan tat ca attack.
                const filter = parseAttackFilter(payload);

                // Luu filter vao connection hien tai, moi browser/tab co filter rieng.
                socket.data.attackFilter = filter;

                // Gui event phu de debug/trinh bay: filter da duoc update.
                socket.emit("attack:filter:updated", { filter });

                // Tra ack cho client/script de biet subscribe da thanh cong.
                ack?.({ ok: true, filter });
            }
        );

        if (process.env.NODE_ENV !== "production") {
            // Log moi event client gui len trong moi truong dev.
            // Cai nay huu ich khi demo/trace socket flow.
            socket.onAny((eventName, ...args) => {
                logger.debug(`Incoming Event: ${eventName}`, ...args);
            });
        }

        socket.on("disconnect", () => {
            // Khi tab/browser dong hoac mat ket noi thi Socket.IO tu cleanup room.
            socket.data.isOnline = false;
            logger.log("A user disconnected", { socketId: socket.id, userId });
        });
    });

    return io;
};
