import { Socket } from "socket.io";

export type SocketRateLimitRule = {
    // Khoang thoi gian dem so lan emit event.
    // Vi du windowMs=60000 nghia la dem trong 60 giay.
    windowMs: number;

    // So lan toi da duoc emit trong windowMs.
    max: number;

    // Neu vuot qua max thi block bao lau.
    // Neu khong set thi mac dinh block bang windowMs.
    blockDurationMs?: number;
};

type RateLimitBucket = {
    // So lan event da xay ra trong window hien tai.
    count: number;

    // Moc bat dau cua window hien tai.
    windowStart: number;

    // Neu dang bi block thi day la thoi diem duoc mo lai.
    blockedUntil: number;

    // Dung de don rac bucket cu khong con ai dung.
    lastSeen: number;
};

type CreateSocketRateLimiterOptions = {
    rules: Record<string, SocketRateLimitRule>;
    keyGenerator?: (socket: Socket, packet: unknown[]) => string;
    onRateLimited?: (
        socket: Socket,
        eventName: string,
        details: {
            retryAfterMs: number;
            rule: SocketRateLimitRule;
        }
    ) => void;
    cleanupIntervalMs?: number;
    idleTtlMs?: number;
};

export const createSocketRateLimiter = ({
    rules,

    // Moi user/socket co mot key rieng de tinh rate limit.
    // Uu tien socket.data.userId vi websocket auth da gan sub vao day.
    keyGenerator = (socket) =>
        String(socket.data?.userId ?? socket.handshake.address ?? socket.id),
    onRateLimited,
    cleanupIntervalMs = 60_000,
    idleTtlMs = 10 * 60_000
}: CreateSocketRateLimiterOptions) => {
    // Map nay luu bo dem theo key: eventName + identity.
    // Vi du: "attack:subscribe:socket-demo-user".
    const buckets = new Map<string, RateLimitBucket>();

    const cleanupTimer = setInterval(() => {
        // Don cac bucket cu de tranh memory leak khi nhieu socket connect/disconnect.
        const now = Date.now();

        for (const [key, bucket] of buckets.entries()) {
            const isIdle = now - bucket.lastSeen > idleTtlMs;
            const isNotBlocked = bucket.blockedUntil <= now;

            if (isIdle && isNotBlocked) {
                buckets.delete(key);
            }
        }
    }, cleanupIntervalMs);

    cleanupTimer.unref?.();

    const middleware =
        (socket: Socket) =>
            (packet: unknown[], next: (err?: Error) => void): void => {
                // Packet Socket.IO co dang [eventName, payload, ack].
                // Ta chi can phan tu dau tien de biet event nao dang bi limit.
                const [rawEventName] = packet;
                const eventName = typeof rawEventName === "string" ? rawEventName : "*";

                // Tim rule dung event; neu khong co thi tim rule "*" neu co.
                const rule = rules[eventName] ?? rules["*"];

                if (!rule) {
                    // Event khong co rule thi cho qua.
                    next();
                    return;
                }

                const identity = keyGenerator(socket, packet);
                const ruleKey = rules[eventName] ? eventName : "*";
                const key = `${ruleKey}:${identity}`;
                const now = Date.now();

                const bucket = buckets.get(key);

                if (!bucket) {
                    // Lan dau gap key nay thi tao bucket moi va cho event di qua.
                    buckets.set(key, {
                        count: 1,
                        windowStart: now,
                        blockedUntil: 0,
                        lastSeen: now
                    });

                    next();
                    return;
                }

                bucket.lastSeen = now;

                if (bucket.blockedUntil > 0 && now >= bucket.blockedUntil) {
                    // Het thoi gian block thi reset bucket de user duoc gui lai.
                    bucket.count = 0;
                    bucket.windowStart = now;
                    bucket.blockedUntil = 0;
                }

                if (bucket.blockedUntil > now) {
                    // Van dang bi block, bao loi cho Socket.IO.
                    const retryAfterMs = bucket.blockedUntil - now;

                    onRateLimited?.(socket, eventName, { retryAfterMs, rule });

                    const error = new Error("Rate limit exceeded") as Error & {
                        data?: Record<string, unknown>;
                    };
                    error.data = {
                        code: "RATE_LIMIT_EXCEEDED",
                        eventName,
                        retryAfterMs
                    };

                    next(error);
                    return;
                }

                if (now - bucket.windowStart >= rule.windowMs) {
                    // Qua window moi thi reset counter.
                    bucket.count = 0;
                    bucket.windowStart = now;
                }

                bucket.count += 1;

                if (bucket.count > rule.max) {
                    // Vuot qua gioi han thi set blockedUntil va tra loi.
                    const retryAfterMs = rule.blockDurationMs ?? rule.windowMs;
                    bucket.blockedUntil = now + retryAfterMs;

                    onRateLimited?.(socket, eventName, { retryAfterMs, rule });

                    const error = new Error("Rate limit exceeded") as Error & {
                        data?: Record<string, unknown>;
                    };
                    error.data = {
                        code: "RATE_LIMIT_EXCEEDED",
                        eventName,
                        retryAfterMs
                    };

                    next(error);
                    return;
                }

                next();
            };

    const destroy = () => {
        // Neu sau nay can shutdown limiter thu cong thi clear timer o day.
        clearInterval(cleanupTimer);
    };

    return {
        middleware,
        destroy
    };
};
