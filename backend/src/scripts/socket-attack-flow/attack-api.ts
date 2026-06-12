import { SocketAttackFlowConfig } from "./config";
import { AttackEvent } from "./types";

// Goi /ping truoc de bao loi ro rang neu user quen bat backend.
export const assertBackendIsRunning = async (config: SocketAttackFlowConfig): Promise<void> => {
    try {
        const response = await fetch(`${config.apiBaseUrl}/ping`);

        if (!response.ok) {
            throw new Error(`Ping returned status ${response.status}`);
        }
    } catch (error) {
        throw new Error(
            `Backend is not reachable at ${config.apiBaseUrl}. Start it first with: npm run dev:backend`,
            { cause: error }
        );
    }
};

// POST attack vao endpoint test de backend broadcast lai qua socket.
export const postAttackEvent = async (
    config: SocketAttackFlowConfig,
    accessToken: string
): Promise<AttackEvent> => {
    const attackPayload: AttackEvent = {
        type: config.attackType,
        severity: config.attackSeverity,
        sourceIp: "192.168.1.10",
        assetId: "socket-flow-demo"
    };

    const response = await fetch(`${config.apiBaseUrl}/attacks`, {
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
