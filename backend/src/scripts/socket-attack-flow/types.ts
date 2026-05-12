export type LoginResponse = {
    accessToken?: string;
};

export type SocketAckResponse = {
    ok: boolean;
    error?: string;
    filter?: Record<string, unknown>;
};

export type AttackEvent = {
    id?: string;
    type?: string;
    severity?: string;
    sourceIp?: string;
    assetId?: string;
    timestamp?: string;
    [key: string]: unknown;
};
