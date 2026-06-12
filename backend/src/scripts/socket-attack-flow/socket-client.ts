import { io, Socket } from "socket.io-client";
import { SocketAttackFlowConfig } from "./config";
import { AttackEvent, SocketAckResponse } from "./types";

// Ket noi Socket.IO bang JWT trong auth payload, giong cach frontend nen dung.
export const connectSocket = (
    config: SocketAttackFlowConfig,
    accessToken: string
): Promise<Socket> => {
    const socket = io(config.socketUrl, {
        auth: {
            token: accessToken
        },
        transports: ["websocket"]
    });

    // In cac event phu de nguoi demo thay rate limit/filter error neu co.
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
            reject(new Error(`Socket connect timed out after ${config.timeoutMs}ms`));
        }, config.timeoutMs);

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
export const subscribeAttackStream = (
    socket: Socket,
    config: SocketAttackFlowConfig
): Promise<void> => {
    return new Promise((resolve, reject) => {
        socket.emit(
            "attack:subscribe",
            {
                attackTypes: [config.attackType],
                severities: [config.attackSeverity]
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

// Doi event attack:new tu socket, fail nhanh neu backend khong broadcast ve.
export const waitForAttackEvent = (
    socket: Socket,
    config: SocketAttackFlowConfig
): Promise<AttackEvent> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off("attack:new", onAttackNew);
            reject(new Error(`Did not receive attack:new within ${config.timeoutMs}ms`));
        }, config.timeoutMs);

        const onAttackNew = (event: AttackEvent) => {
            clearTimeout(timeout);
            resolve(event);
        };

        socket.once("attack:new", onAttackNew);
    });
};
