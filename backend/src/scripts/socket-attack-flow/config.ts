export type SocketAttackFlowConfig = {
    apiBaseUrl: string;
    socketUrl: string;
    loginEmail: string | undefined;
    loginPassword: string | undefined;
    accessToken: string | undefined;
    attackType: string;
    attackSeverity: string;
    timeoutMs: number;
};

// Gom toan bo bien moi truong cua script vao mot noi de cac file khac khong doc process.env lap lai.
export const loadConfig = (): SocketAttackFlowConfig => ({
    apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000/api/v1",
    socketUrl: process.env.SOCKET_URL ?? "http://localhost:3000",
    loginEmail: process.env.LOGIN_EMAIL,
    loginPassword: process.env.LOGIN_PASSWORD,
    accessToken: process.env.ACCESS_TOKEN,
    attackType: process.env.ATTACK_TYPE ?? "DDOS",
    attackSeverity: process.env.ATTACK_SEVERITY ?? "HIGH",
    timeoutMs: Number(process.env.SOCKET_TEST_TIMEOUT_MS ?? 10_000)
});
