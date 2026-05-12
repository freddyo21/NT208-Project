import "dotenv/config";

import { io, Socket } from "socket.io-client";

type LoginResponse = {
    accessToken?: string;
};

type SocketAckResponse = {
    ok: boolean;
    error?: string;
    filter?: Record<string, unknown>;
};

type AttackEvent = {
    id?: string;
    type?: string;
    severity?: string;
    sourceIp?: string;
    assetId?: string;
    timestamp?: string;
    [key: string]: unknown;
};

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000/api/v1";
const socketUrl = process.env.SOCKET_URL ?? "http://localhost:3000";
const loginEmail = process.env.LOGIN_EMAIL;
const loginPassword = process.env.LOGIN_PASSWORD;
const providedAccessToken = process.env.ACCESS_TOKEN;
const attackType = process.env.ATTACK_TYPE ?? "DDOS";
const attackSeverity = process.env.ATTACK_SEVERITY ?? "HIGH";
const timeoutMs = Number(process.env.SOCKET_TEST_TIMEOUT_MS ?? 10_000);

// Script nay chi la client demo de test flow: auth socket -> subscribe -> POST attack -> nhan attack:new.
const main = async () => {
    const accessToken = providedAccessToken ?? await loginAndGetAccessToken();
    const socket = await connectSocket(accessToken);

    try {
        await subscribeAttackStream(socket);
        const postedAttack = await postAttackEvent(accessToken);
        const receivedAttack = await waitForAttackEvent(socket);

        console.log("[socket-test] Posted attack:", postedAttack);
        console.log("[socket-test] Received attack:new:", receivedAttack);
        console.log("[socket-test] Attack socket flow OK");
    } finally {
        socket.disconnect();
    }
};

// Neu khong truyen ACCESS_TOKEN, script se login bang LOGIN_EMAIL va LOGIN_PASSWORD.
const loginAndGetAccessToken = async (): Promise<string> => {
    if (!loginEmail || !loginPassword) {
        throw new Error("Set ACCESS_TOKEN or set LOGIN_EMAIL and LOGIN_PASSWORD before running this script.");
    }

    const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
            rememberMe: false
        })
    });

    const body = await response.json().catch(() => ({})) as LoginResponse;

    if (!response.ok || !body.accessToken) {
        throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(body)}`);
    }

    return body.accessToken;
};

// Ket noi Socket.IO bang JWT trong auth payload, giong cach frontend nen dung.
const connectSocket = (accessToken: string): Promise<Socket> => {
    const socket = io(socketUrl, {
        auth: {
            token: accessToken
        },
        transports: ["websocket"]
    });

    socket.on("socket:rate_limited", (payload) => {
        console.log("[socket-test] socket:rate_limited", payload);
    });

    socket.on("attack:error", (payload) => {
        console.log("[socket-test] attack:error", payload);
    });

    socket.on("attack:filter:updated", (payload) => {
        console.log("[socket-test] attack:filter:updated", payload);
    });

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error(`Socket connect timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        socket.once("connect", () => {
            clearTimeout(timeout);
            console.log("[socket-test] Socket connected:", socket.id);
            resolve(socket);
        });

        socket.once("connect_error", (error) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(error);
        });
    });
};

// Subscribe voi filter trung voi attack event se POST o buoc sau.
const subscribeAttackStream = (socket: Socket): Promise<void> => {
    return new Promise((resolve, reject) => {
        socket.emit(
            "attack:subscribe",
            {
                attackTypes: [attackType],
                severities: [attackSeverity]
            },
            (ack: SocketAckResponse) => {
                if (!ack?.ok) {
                    reject(new Error(`Subscribe failed: ${ack?.error ?? "unknown error"}`));
                    return;
                }

                console.log("[socket-test] Subscribe ack:", ack);
                resolve();
            }
        );
    });
};

// POST attack vao endpoint test de backend broadcast lai qua socket.
const postAttackEvent = async (accessToken: string): Promise<AttackEvent> => {
    const attackPayload: AttackEvent = {
        type: attackType,
        severity: attackSeverity,
        sourceIp: "192.168.1.10",
        assetId: "socket-flow-demo"
    };

    const response = await fetch(`${apiBaseUrl}/attacks`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(attackPayload)
    });

    const body = await response.json().catch(() => ({})) as { event?: AttackEvent };

    if (!response.ok || !body.event) {
        throw new Error(`Post attack failed with status ${response.status}: ${JSON.stringify(body)}`);
    }

    return body.event;
};

// Doi event attack:new tu socket, fail nhanh neu backend khong broadcast ve.
const waitForAttackEvent = (socket: Socket): Promise<AttackEvent> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off("attack:new", onAttackNew);
            reject(new Error(`Did not receive attack:new within ${timeoutMs}ms`));
        }, timeoutMs);

        const onAttackNew = (event: AttackEvent) => {
            clearTimeout(timeout);
            resolve(event);
        };

        socket.once("attack:new", onAttackNew);
    });
};

main().catch((error) => {
    console.error("[socket-test] Attack socket flow FAILED");
    console.error(error);
    process.exitCode = 1;
});
